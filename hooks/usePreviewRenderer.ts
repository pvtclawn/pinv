"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UsePreviewRendererReturn {
    render: (code: string, props: Record<string, unknown>) => Promise<string | null>;
    isLoading: boolean;
    imageUrl: string | null;
    error: string | null;
}

/**
 * Hook for rendering widget previews via the preview-widget API.
 * Manages blob URLs and cleans them up on unmount.
 * 
 * @example
 * ```tsx
 * const { render, isLoading, imageUrl } = usePreviewRenderer();
 * 
 * // Render preview
 * await render(reactCode, previewData);
 * 
 * // Use imageUrl in an img tag
 * <img src={imageUrl} />
 * ```
 */
export function usePreviewRenderer(): UsePreviewRendererReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const currentBlobUrl = useRef<string | null>(null);

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (currentBlobUrl.current) {
                URL.revokeObjectURL(currentBlobUrl.current);
            }
        };
    }, []);

    const render = useCallback(async (
        code: string,
        props: Record<string, unknown>
    ): Promise<string | null> => {
        if (!code.trim()) {
            setError("No code provided for preview");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/preview-widget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, props }),
            });

            if (!response.ok) {
                throw new Error(`Preview render failed (${response.status})`);
            }

            const blob = await response.blob();

            // Revoke previous blob URL if exists
            if (currentBlobUrl.current) {
                URL.revokeObjectURL(currentBlobUrl.current);
            }

            const url = URL.createObjectURL(blob);
            currentBlobUrl.current = url;
            setImageUrl(url);
            return url;

        } catch (err) {
            const message = err instanceof Error ? err.message : "Preview render failed";
            setError(message);
            console.error("Preview rendering failed:", err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        render,
        isLoading,
        imageUrl,
        error,
    };
}
