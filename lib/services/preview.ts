import { NEXT_PUBLIC_APP_URL } from "@/lib/config";

/**
 * Preview service - centralized URL building and preview utilities.
 * Follows Single Responsibility: only handles preview-related URL construction.
 */

/**
 * Build an OG image URL for a pin with given parameters.
 */
export function buildOgUrl(pinId: number, params: Record<string, string> = {}, bustCache = true): string {
    const appUrl = NEXT_PUBLIC_APP_URL;
    const url = new URL(`${appUrl}/api/og/p/${pinId}`);

    if (bustCache) {
        url.searchParams.set('t', Date.now().toString());
    }

    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
    });

    return url.toString();
}

/**
 * Build a shareable URL for a pin with given parameters.
 */
export function buildShareUrl(pinId: number, params: Record<string, string> = {}): string {
    const appUrl = NEXT_PUBLIC_APP_URL;
    const url = new URL(`${appUrl}/p/${pinId}`);

    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
    });

    return url.toString();
}

/**
 * Build a pin page URL.
 */
export function buildPinUrl(pinId: number): string {
    return `${NEXT_PUBLIC_APP_URL}/p/${pinId}`;
}

/**
 * Build a pin edit URL.
 */
export function buildEditUrl(pinId: number): string {
    return `${NEXT_PUBLIC_APP_URL}/p/${pinId}/edit`;
}
