import { createSandbox, executeUserCode } from './services/sandbox';
import { loadGraphemeImages, loadDynamicFonts, getCoreFonts } from './services/assets';
// @ts-ignore
import satori from 'satori';
// @ts-ignore
import { Resvg } from '@resvg/resvg-js';
import React from 'react';

declare var self: any;

// Log Interception
function interceptLogs(callback: (logs: any[]) => Promise<any>) {
    const logs: any[] = [];
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args) => {
        logs.push({ level: 'info', message: args.map(String).join(' '), timestamp: new Date().toISOString() });
        originalConsoleLog(...args);
    };
    console.error = (...args) => {
        logs.push({ level: 'error', message: args.map(String).join(' '), timestamp: new Date().toISOString() });
        originalConsoleError(...args);
    };
    console.warn = (...args) => {
        logs.push({ level: 'warn', message: args.map(String).join(' '), timestamp: new Date().toISOString() });
        originalConsoleWarn(...args);
    };

    return callback(logs).finally(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
    });
}

self.onmessage = async (event: any) => {
    const { id, data } = event.data;
    try {
        await interceptLogs(async (logs) => {
            const image = await render(data);
            self.postMessage({ id, result: { image, logs } });
        });
    } catch (e: any) {
        self.postMessage({ id, error: e.message || String(e) });
    }
};

async function render(input: any) {
    const { uiCode, props, width = 1200, height = 800, baseUrl = 'http://localhost:3000' } = input;
    if (!uiCode) throw new Error('Missing uiCode');

    // 1. Sandbox Execution
    const sandbox = createSandbox(baseUrl);
    const WidgetComponent = executeUserCode(uiCode, sandbox);

    // 2. Pre-flight (Emoji) — scan props + uiCode directly instead of double-rendering
    const element = React.createElement(WidgetComponent, props);
    let graphemeImages = {};
    try {
        // Build a searchable string from all text sources without a full React render
        const propsText = JSON.stringify(props);
        const searchText = `${uiCode}\n${propsText}`;
        graphemeImages = await loadGraphemeImages(searchText);
    } catch (e) {
        console.error("Emoji check failed", e);
    }

    // 3. Fonts
    // Ensure we await any async config if needed, though executeUserCode is sync currently.
    // User config is on scope.exports.config
    const dynamicFonts = await loadDynamicFonts(sandbox.scope.exports.config || {});
    const coreFonts = getCoreFonts();
    const allFonts = [...coreFonts, ...dynamicFonts];

    // --- VISUAL WATERMARK WRAPPER (Task 15.1) ---
    // Wraps the user component in a container with a verification footer.
    const wrappedElement = React.createElement('div', {
        style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            position: 'relative'
        }
    }, [
        // The actual widget
        element,
        // The verification footer
        props._pinvProof && React.createElement('div', {
            style: {
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'rgba(0,0,0,0.5)',
                color: 'rgba(255,255,255,0.8)',
                padding: '2px 8px',
                fontSize: '12px',
                borderTopLeftRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'Inter'
            }
        }, [
            React.createElement('span', { style: { fontWeight: 'bold', color: '#00d4aa' } }, 'Provenance: Phala TEE'),
            React.createElement('span', { style: { opacity: 0.6 } }, `Proof: ${props._pinvProof}`)
        ])
    ]);

    // 4. Satori
    let svg;
    try {
        svg = await satori(wrappedElement, {
            width,
            height,
            fonts: (allFonts.length > 0 ? allFonts : []) as any,
            graphemeImages
        });
    } catch (e: any) {
        const msg = e.message || String(e);
        console.error("Satori Failed, Using Fallback:", msg.length > 500 ? msg.substring(0, 500) + '... (truncated)' : msg);
        // Fallback Error Render
        const fallbackFonts = coreFonts.filter((f: any) => f.name === 'Inter');

        svg = await satori(
            React.createElement('div', {
                style: { display: 'flex', width: '100%', height: '100%', background: '#ff0000', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexDirection: 'column' }
            }, [
                React.createElement('div', {}, 'Render Failed'),
                React.createElement('div', { style: { fontSize: 20, marginTop: 20 } }, e.message)
            ]),
            { width, height, fonts: (fallbackFonts.length > 0 ? fallbackFonts : []) as any }
        );
    }

    // 5. Resvg
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
    return resvg.render().asPng();
}
