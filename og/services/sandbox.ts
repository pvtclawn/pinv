// @ts-ignore
import { transform } from 'sucrase';
import React from 'react';
import * as Lucide from 'lucide-react';
import { normalizeProps } from '../utils/normalization';

export function createSandbox(baseUrl: string) {
    const proxiedReact = { ...React } as any;

    // Intercept createElement to enforce styles and Unsplash fixes
    proxiedReact.createElement = (type: any, props: any, ...children: any[]) => {
        const normalized = normalizeProps(type as string, props, baseUrl);
        return React.createElement(type, normalized, ...children);
    };

    const scope = {
        React: proxiedReact,
        ...Lucide,
        require: (mod: string) => {
            if (mod === 'react') return proxiedReact;
            if (mod === 'lucide-react') return Lucide;
            return null;
        },
        exports: { default: null as any } as any
    };

    return { proxiedReact, scope };
}

export function executeUserCode(uiCode: string, sandbox: any) {
    // Transpile User Code (Sucrase is fast)
    const transpiled = transform(uiCode, {
        transforms: ['jsx', 'imports'],
        production: true,
    }).code;

    // Execute Code (Sandbox)
    // We construct a Function that takes sandbox dependencies
    // Filter out 'default' from Lucide keys as it is a reserved keyword
    const lucideKeys = Object.keys(Lucide).filter(k => k !== 'default');
    const lucideValues = lucideKeys.map(k => (Lucide as any)[k]);

    const func = new Function('React', 'exports', 'require', ...lucideKeys, transpiled);
    func(sandbox.proxiedReact, sandbox.scope.exports, sandbox.scope.require, ...lucideValues);

    const WidgetComponent = sandbox.scope.exports.default;
    if (!WidgetComponent) {
        throw new Error('No default export found in widget code');
    }
    return WidgetComponent;
}
