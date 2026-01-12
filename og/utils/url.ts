export const IMAGE_REWRITE_RULES: Array<{
    name: string;
    match: (url: string) => boolean;
    replace: (url: string) => string;
}> = [];


export function resolveImageUrl(url: string, baseUrl: string): string {
    if (!url) return '';

    // 1. Apply Rewrite Rules (e.g. fix broken legacy providers)
    for (const rule of IMAGE_REWRITE_RULES) {
        if (rule.match(url)) {
            return rule.replace(url);
        }
    }

    // 2. Resolve Relative URLs
    if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
    }

    return url;
}

export function extractUrlFromCss(cssValue: string): string | null {
    const urlMatch = cssValue.match(/url\(['"]?([^'"]+)['"]?\)/);
    return urlMatch ? urlMatch[1] : null;
}
