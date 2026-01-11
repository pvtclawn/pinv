const fs = require('fs');
const path = require('path');
const { transform } = require('sucrase');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const Lucide = require('lucide-react');
const emojiRegex = require('emoji-regex');

// Disable console.log in worker to avoid polluting stdout (which is used for PNG output)
const originalConsoleLog = console.log;
console.log = console.error; // Redirect log to stderr

async function run() {
    try {
        const tStart = performance.now();

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

        const tInput = performance.now();
        // console.error(`[Worker Perf] Input Read: ${(tInput - tStart).toFixed(2)}ms`); 

        // 2. Load Fonts
        const fontPath = path.join(__dirname, 'public/fonts');
        const interRegular = fs.readFileSync(path.join(fontPath, 'Inter_18pt-Medium.ttf'));
        const interBold = fs.readFileSync(path.join(fontPath, 'Inter_18pt-SemiBold.ttf'));

        // Static NotoEmoji-Regular (v2.034) for fallback text rendering
        let emojiFont = null;
        try {
            emojiFont = fs.readFileSync(path.join(fontPath, 'NotoEmoji-Regular.ttf'));
        } catch (e) { console.error("Emoji font missing"); }

        // 3. Transpile User Code
        const transpiled = transform(uiCode, {
            transforms: ['jsx', 'imports'],
            production: true,
        }).code;

        // 4. Sandbox Setup
        const proxiedReact = { ...React };
        const baseUrl = input.baseUrl || 'http://localhost:3000';

        // Intercept createElement to enforce styles if needed
        proxiedReact.createElement = (type, props, ...children) => {
            props = props || {};

            if (type === 'div') {
                const newStyle = { ...(props.style || {}) };
                if (!newStyle.display) {
                    newStyle.display = 'flex';
                }
                props = { ...props, style: newStyle };
            }

            // AUTO-FIX: Resolve relative image URLs in backgroundImage
            if (props.style && props.style.backgroundImage) {
                const bg = props.style.backgroundImage;
                if (typeof bg === 'string') {
                    // Fix deprecated source.unsplash.com
                    if (bg.includes('source.unsplash.com')) {
                        const newStyle = {
                            ...props.style,
                            backgroundImage: `url('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')`
                        };
                        props = { ...props, style: newStyle };
                    } else {
                        const urlMatch = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
                        if (urlMatch) {
                            const rawUrl = urlMatch[1];
                            try {
                                if (rawUrl === 'undefined' || rawUrl === 'null' || !rawUrl) {
                                    const newStyle = { ...props.style };
                                    delete newStyle.backgroundImage;
                                    props = { ...props, style: newStyle };
                                } else if (rawUrl.startsWith('/')) {
                                    const newUrl = `${baseUrl}${rawUrl}`;
                                    props = {
                                        ...props,
                                        style: {
                                            ...props.style,
                                            backgroundImage: `url('${newUrl}')`
                                        }
                                    };
                                }
                            } catch (e) { }
                        }
                    }
                }
            }


            // AUTO-FIX: Resolve relative image URLs in background (shorthand)
            if (props.style && props.style.background) {
                const bg = props.style.background;
                if (typeof bg === 'string') {
                    if (bg.includes('source.unsplash.com')) {
                        const newStyle = {
                            ...props.style,
                            background: `url('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')`
                        };
                        props = { ...props, style: newStyle };
                    }
                }
            }

            // AUTO-FIX: Resolve relative src in img tags
            if (type === 'img' && props) {
                if (!props.src || typeof props.src !== 'string') {
                    props = { ...props, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' };
                } else if (props.src.includes('source.unsplash.com')) {
                    props = { ...props, src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' };
                } else if (props.src.startsWith('/')) {
                    props = { ...props, src: `${baseUrl}${props.src}` };
                }
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

        // AUTO-FEATURE: Universal Color Emoji Support (Twemoji)
        // We render to static markup first to find all emojis used in the final tree.
        const element = React.createElement(WidgetComponent, props);
        let graphemeImages = {};

        try {
            const htmlString = ReactDOMServer.renderToStaticMarkup(element);
            const regex = emojiRegex();
            const foundEmojis = new Set();
            let match;
            while ((match = regex.exec(htmlString))) {
                foundEmojis.add(match[0]);
            }

            if (foundEmojis.size > 0) {
                // Helper to fetch and convert to Data URL
                const loadTwemoji = async (emojiChar) => {
                    try {
                        const codePoints = [...emojiChar].map(c => c.codePointAt(0));
                        const hex = codePoints.map(c => c.toString(16)).join('-');

                        // Strategy 1: Exact match
                        let url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${hex}.svg`;
                        let res = await fetch(url);

                        // Strategy 2: If 404 and ends with -fe0f, try removing it (Twemoji often strips VarSelector)
                        if (!res.ok && hex.endsWith('-fe0f')) {
                            const trimmedHex = hex.replace(/-fe0f$/, '');
                            url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${trimmedHex}.svg`;
                            res = await fetch(url);
                        }

                        if (res.ok) {
                            const svgText = await res.text();
                            const base64 = Buffer.from(svgText).toString('base64');
                            return `data:image/svg+xml;base64,${base64}`;
                        } else {
                            // console.error(`[Worker] Twemoji 404: ${url}`);
                        }
                    } catch (e) {
                        // console.error(`[Worker] Twemoji Load Failed: ${e.message}`);
                    }
                    return null;
                };

                // Fetch in parallel
                const emojiConfig = await Promise.all(
                    Array.from(foundEmojis).map(async (char) => {
                        const dataUrl = await loadTwemoji(char);
                        return { char, dataUrl };
                    })
                );

                emojiConfig.forEach(({ char, dataUrl }) => {
                    if (dataUrl) {
                        graphemeImages[char] = dataUrl;
                    }
                });
            }
        } catch (emojiErr) {
            console.error(`[Worker] Emoji Detection Failed: ${emojiErr.message}`);
        }

        // AUTO-FEATURE: Dynamic Fonts
        const userConfig = scope.exports.config || {};
        const dynamicFonts = [];

        if (userConfig.fonts && Array.isArray(userConfig.fonts)) {
            const fontRequests = userConfig.fonts.map(async (fontDef) => {
                try {
                    const res = await fetch(fontDef.url);
                    if (!res.ok) throw new Error(`Failed to fetch font ${fontDef.url}`);
                    const arrayBuffer = await res.arrayBuffer();
                    return {
                        name: fontDef.name,
                        data: Buffer.from(arrayBuffer),
                        weight: fontDef.weight || 400,
                        style: fontDef.style || 'normal'
                    };
                } catch (e) {
                    console.error(`[Worker] Font Fetch Failed: ${e.message}`);
                    return null;
                }
            });

            const results = await Promise.all(fontRequests);
            results.forEach(f => {
                if (f) dynamicFonts.push(f);
            });
        }

        const tSetup = performance.now();

        // 6. Satori Render (React -> SVG)
        let svg;
        try {
            svg = await satori(
                element,
                {
                    width,
                    height,
                    fonts: [
                        {
                            name: 'Inter',
                            data: interRegular,
                            weight: 400,
                            style: 'normal',
                        },
                        {
                            name: 'Inter',
                            data: interBold,
                            weight: 700,
                            style: 'normal',
                        },
                        // Fallback font (Monochrome Noto)
                        ...(emojiFont ? [{
                            name: 'Noto Emoji',
                            data: emojiFont,
                            weight: 400,
                            style: 'normal'
                        }] : []),
                        ...dynamicFonts
                    ],
                    graphemeImages // Inject the Twemoji map (Data URLs)
                }
            );
        } catch (satoriErr) {
            console.error(`[Worker] Satori Failed: ${satoriErr.message}`);
            svg = await satori(
                React.createElement('div', {
                    style: { display: 'flex', width: '100%', height: '100%', background: '#ff0000', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexDirection: 'column' }
                }, [
                    React.createElement('div', {}, 'Render Failed'),
                    React.createElement('div', { style: { fontSize: 20, marginTop: 20 } }, satoriErr.message)
                ]),
                { width, height, fonts: [{ name: 'Inter', data: interRegular, weight: 400, style: 'normal' }] }
            );
        }

        const tSatori = performance.now();
        console.error(`[Worker Perf] Satori Render: ${(tSatori - tSetup).toFixed(2)}ms`);

        // 7. Resvg Render (SVG -> PNG)
        // Debug: Dump SVG to investigate panics
        fs.writeFileSync(path.join(__dirname, 'debug_last_svg.svg'), svg);

        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: width }
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        const tResvg = performance.now();
        console.error(`[Worker Perf] Resvg Render: ${(tResvg - tSatori).toFixed(2)}ms`);
        console.error(`[Worker Perf] Total Worker: ${(tResvg - tStart).toFixed(2)}ms`);

        // 8. Output
        process.stdout.write(pngBuffer);

    } catch (err) {
        console.error('Worker Error:', err);
        process.exit(1);
    }
}

run();
