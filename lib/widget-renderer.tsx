import { ImageResponse } from 'next/og';
import React from 'react';
import * as Lucide from 'lucide-react';
import { transform } from 'sucrase';
import { readFileSync } from 'fs';
import path from 'path';

// Load fonts once
const interMedium = readFileSync(path.join(process.cwd(), 'public/fonts/Inter_18pt-Medium.ttf'));
const interSemiBold = readFileSync(path.join(process.cwd(), 'public/fonts/Inter_18pt-SemiBold.ttf'));

export async function renderWidget(code: string, props: any, options?: any): Promise<ImageResponse> {
    try {
        // 1. Transpile JSX -> JS
        const transpiled = transform(code, {
            transforms: ['jsx', 'imports'],
            production: true,
        }).code;

        // 2. Prepare Sandbox Scope
        const proxiedReact = { ...React };

        // Satori Patch: Automatically inject display: 'flex' for divs to prevent crashes
        // @ts-ignore
        proxiedReact.createElement = (type, props, ...children) => {
            if (type === 'div' && props) {
                const newStyle = { ...(props.style || {}) };
                if (!newStyle.display) {
                    newStyle.display = 'flex';
                }
                if (newStyle.zIndex && typeof newStyle.zIndex === 'string' && newStyle.zIndex.endsWith('px')) {
                    newStyle.zIndex = parseInt(newStyle.zIndex, 10);
                }
                props = { ...props, style: newStyle };
            }
            return React.createElement(type, props, ...children);
        };

        const scope = {
            React: proxiedReact,
            ...Lucide,
            require: (mod: string) => {
                if (mod === 'react') return proxiedReact;
                if (mod === 'lucide-react') return Lucide;
                return null;
            },
            exports: { default: null } as any
        };

        // 3. Execute Component
        const func = new Function('React', 'exports', 'require', ...Object.keys(Lucide), transpiled);
        func(proxiedReact, scope.exports, scope.require, ...Object.values(Lucide));

        const WidgetComponent = scope.exports.default;

        if (!WidgetComponent) {
            throw new Error("No default export found in widget code");
        }

        // 4. Render
        return new ImageResponse(
            <WidgetComponent {...props} />,
            {
                width: 1200,
                height: 800,
                fonts: [
                    {
                        name: 'Inter',
                        data: interMedium,
                        style: 'normal',
                        weight: 500,
                    },
                    {
                        name: 'Inter',
                        data: interSemiBold,
                        style: 'normal',
                        weight: 600,
                    }
                ],
                // Optimization: Default to 60s cache for dynamic content (balance between fresh data and performance)
                // Long-term caching (1 year) should only be used if the URL params fully determine the content (e.g. results)
                headers: {
                    'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
                    ...(options?.headers || {})
                },
                ...options
            }
        );

    } catch (e: unknown) {
        console.error("Widget Rendering Error:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);

        return new ImageResponse(
            (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: 40
                }}>
                    <div style={{ fontSize: 40, fontWeight: 'bold', marginBottom: 20 }}> Render Error </div>
                    <div style={{ fontSize: 24, textAlign: 'center' }}>{errorMessage}</div>
                </div>
            ),
            { width: 1200, height: 800 }
        );
    }
}
