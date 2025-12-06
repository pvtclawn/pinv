import { ImageResponse } from 'next/og';
import { transform } from 'sucrase';
import * as React from 'react';
import * as Lucide from 'lucide-react';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code, props } = await req.json();

    console.log("----------------------------------------------------------------");
    console.log("[Preview Debug] Incoming Code:");
    console.log(code);
    console.log("[Preview Debug] Props:", props);
    console.log("----------------------------------------------------------------");

    if (!code) return new Response("Missing code", { status: 400 });

    // 1. Transpile JSX -> JS (CommonJS friendly for new Function)
    const transpiled = transform(code, {
      transforms: ['jsx', 'imports'],
      production: true,
    }).code;

    console.log("[Preview Debug] Transpiled Code:\n", transpiled);

    // 2. Prepare Sandbox Scope
    const proxiedReact = { ...React };

    // Satori Patch: Automatically inject display: 'flex' for divs to prevent crashes
    // when text content is split into multiple children (e.g., "Hello {name}")
    // @ts-ignore
    proxiedReact.createElement = (type, props, ...children) => {
      if (type === 'div' && props && (!props.style || !props.style.display)) {
        props = {
          ...props,
          style: {
            ...(props.style || {}),
            display: 'flex'
          }
        };
      }
      return React.createElement(type, props, ...children);
    };

    const scope = {
      React: proxiedReact,
      ...Lucide,
      require: (mod: string) => {
        // Return proxied React if requested
        if (mod === 'react') return proxiedReact;
        if (mod === 'lucide-react') return Lucide;
        return null;
      },
      exports: { default: null } as any
    };

    const keys = Object.keys(scope);
    const values = Object.values(scope);

    // 3. Evaluate the code
    const runner = new Function(
      ...keys,
      `${transpiled}; return exports.default;`
    );

    const Widget = runner(...values);

    if (!Widget) {
      throw new Error("No default export found in generated code.");
    }

    // 4. Render to Image
    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
          {React.createElement(Widget, props || {})}
        </div>
      ),
      {
        width: 1200,
        height: 800,
        emoji: 'twemoji',
      }
    );

  } catch (e) {
    console.error("Preview Render Error:", e);
    // Return an error image
    return new ImageResponse(
      (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#fee2e2',
          color: '#b91c1c',
          fontFamily: 'sans-serif',
          padding: 40
        }}>
          <div style={{ fontSize: 40, fontWeight: 'bold', marginBottom: 20 }}>Render Error</div>
          <div style={{ fontSize: 24, textAlign: 'center' }}>
            {e instanceof Error ? e.message : String(e)}
          </div>
        </div>
      ),
      { width: 1200, height: 800 }
    );
  }
}
