import { resolveImageUrl, extractUrlFromCss } from './url';

export function normalizeProps(type: string, props: any, baseUrl: string) {
    props = props || {};

    // Enforce Flexbox on divs
    if (type === 'div') {
        const newStyle = { ...(props.style || {}) };
        if (!newStyle.display) {
            newStyle.display = 'flex';
        }
        props = { ...props, style: newStyle };
    }

    // CSS Transformations
    if (props.style) {
        // Background Image
        if (props.style.backgroundImage) {
            const bg = props.style.backgroundImage;
            if (typeof bg === 'string') {
                const rawUrl = extractUrlFromCss(bg);
                if (rawUrl) {
                    const resolved = resolveImageUrl(rawUrl, baseUrl);
                    if (resolved !== rawUrl) {
                        const newStyle = {
                            ...props.style,
                            backgroundImage: `url('${resolved}')`
                        };
                        props = { ...props, style: newStyle };
                    }
                } else if (bg.includes('source.unsplash.com')) {
                    // Fallback for raw string usage if ANY
                    const resolved = resolveImageUrl(bg, baseUrl);
                    const newStyle = {
                        ...props.style,
                        backgroundImage: `url('${resolved}')`
                    };
                    props = { ...props, style: newStyle };
                }
            }
        }
        // Background Shorthand
        if (props.style.background && typeof props.style.background === 'string') {
            // Basic heuristic for shorthand
            const bg = props.style.background;
            const rawUrl = extractUrlFromCss(bg);
            if (rawUrl) {
                const resolved = resolveImageUrl(rawUrl, baseUrl);
                if (resolved !== rawUrl) {
                    const newStyle = {
                        ...props.style,
                        background: props.style.background.replace(rawUrl, resolved)
                    };
                    props = { ...props, style: newStyle };
                }
            } else if (bg.includes('source.unsplash.com')) {
                const resolved = resolveImageUrl(bg, baseUrl);
                const newStyle = {
                    ...props.style,
                    background: resolved.startsWith('http') ? `url('${resolved}')` : resolved
                };
                props = { ...props, style: newStyle };
            }
        }
    }

    // Img Src Resolution
    if (type === 'img' && props) {
        if (!props.src || typeof props.src !== 'string') {
            props = { ...props, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' };
        } else {
            const resolved = resolveImageUrl(props.src, baseUrl);
            if (resolved !== props.src) {
                props = { ...props, src: resolved };
            }
        }
    }

    return props;
}
