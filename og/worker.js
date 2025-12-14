const fs = require('fs');
const path = require('path');
const { transform } = require('sucrase');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const React = require('react');
const Lucide = require('lucide-react');

// Disable console.log in worker to avoid polluting stdout (which is used for PNG output)
const originalConsoleLog = console.log;
console.log = console.error; // Redirect log to stderr

async function run() {
    try {
        // 1. Read Input from Stdin
        const chunks = [];
        for await (const chunk of process.stdin) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const inputStr = buffer.toString('utf8');

        if (!inputStr) {
            throw new Error('No input provided to worker');
        }

        const input = JSON.parse(inputStr);
        const { uiCode, props, width = 1200, height = 800 } = input;

        if (!uiCode) {
            throw new Error('Missing uiCode');
        }

        // 2. Load Fonts
        // We assume fonts are in ./public/fonts relative to CWD or current file
        const fontPath = path.join(__dirname, 'public/fonts');
        const interMedium = fs.readFileSync(path.join(fontPath, 'Inter_18pt-Medium.ttf'));
        const interSemiBold = fs.readFileSync(path.join(fontPath, 'Inter_18pt-SemiBold.ttf'));

        // 3. Transpile User Code
        const transpiled = transform(uiCode, {
            transforms: ['jsx', 'imports'],
            production: true,
        }).code;

        // 4. Sandbox Setup
        const proxiedReact = { ...React };
        // Intercept createElement to enforce styles if needed (similar to existing logic)
        proxiedReact.createElement = (type, props, ...children) => {
            if (type === 'div' && props) {
                const newStyle = { ...(props.style || {}) };
                if (!newStyle.display) {
                    newStyle.display = 'flex';
                }
                props = { ...props, style: newStyle };
            }
            return React.createElement(type, props, ...children);
        };

        const scope = {
            React: proxiedReact,
            ...Lucide,
            require: (mod) => {
                if (mod === 'react') return proxiedReact;
                if (mod === 'lucide-react') return Lucide;
                return null;
            },
            exports: { default: null }
        };

        // 5. Execute Code
        const func = new Function('React', 'exports', 'require', ...Object.keys(Lucide), transpiled);
        func(proxiedReact, scope.exports, scope.require, ...Object.values(Lucide));

        const WidgetComponent = scope.exports.default;
        if (!WidgetComponent) {
            throw new Error('No default export found in widget code');
        }

        // 6. Satori Render (React -> SVG)
        const svg = await satori(
            React.createElement(WidgetComponent, props),
            {
                width,
                height,
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
            }
        );

        // 7. Resvg Render (SVG -> PNG)
        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: width }
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        // 8. Output
        process.stdout.write(pngBuffer);

    } catch (err) {
        console.error('Worker Error:', err);
        process.exit(1);
    }
}

run();
