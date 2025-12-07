"use client";

import { useState, useCallback } from "react";

interface UseDataCodeRunnerReturn {
    run: (code: string, params: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
    isRunning: boolean;
    result: Record<string, unknown> | null;
    error: string | null;
}

/**
 * Creates a proxied fetch function that routes requests through our CORS proxy.
 */
function createProxiedFetch() {
    return async (url: string, options?: RequestInit) => {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
        try {
            const res = await fetch(proxyUrl, options);
            if (!res.ok) {
                const text = await res.text();
                console.error(`[Proxy] Request failed:`, text);
            }
            return res;
        } catch (e) {
            console.error(`[Proxy] Network error:`, e);
            throw e;
        }
    };
}

/**
 * Hook for executing data code in a sandboxed environment.
 * Uses a proxied fetch to bypass CORS restrictions.
 * 
 * @example
 * ```tsx
 * const { run, isRunning, result, error } = useDataCodeRunner();
 * 
 * const handleRun = async () => {
 *   const data = await run(dataCode, { username: "alice" });
 *   if (data) {
 *     // Use the returned data
 *   }
 * };
 * ```
 */
export function useDataCodeRunner(): UseDataCodeRunnerReturn {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<Record<string, unknown> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(async (
        code: string,
        params: Record<string, unknown>
    ): Promise<Record<string, unknown> | null> => {
        if (!code.trim()) {
            setError("No code provided");
            return null;
        }

        setIsRunning(true);
        setError(null);

        try {
            const proxiedFetch = createProxiedFetch();

            // Wrap code in an async IIFE and execute
            // Inject proxiedFetch as 'fetch' for automatic CORS proxy routing
            const executor = new Function('userParams', 'fetch', `
                return (async () => {
                    const jsParams = userParams; // Alias for Lit Action compatibility
                    
                    try {
                        ${code}
                        
                        // Check if 'main' was defined and call it
                        if (typeof main !== 'undefined' && typeof main === 'function') {
                            return await main(jsParams);
                        }
                    } catch (e) {
                        throw e;
                    }
                })()
            `);

            const executionResult = await executor(params, proxiedFetch);
            console.log("Data code result:", executionResult);

            setResult(executionResult);
            return executionResult;

        } catch (err) {
            const message = err instanceof Error ? err.message : "Execution failed";
            setError(message);
            console.error("Data code execution failed:", err);
            return null;
        } finally {
            setIsRunning(false);
        }
    }, []);

    return {
        run,
        isRunning,
        result,
        error,
    };
}
