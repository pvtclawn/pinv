"use client";

import { useState, useCallback } from "react";

interface UseDataCodeRunnerReturn {
    run: (code: string, params: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
    isRunning: boolean;
    result: Record<string, unknown> | null;
    error: string | null;
    logs: string[];
}

/**
 * Creates a proxied fetch function that routes requests through our CORS proxy.
 */
async function proxiedFetch(url: string, options?: RequestInit) {
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
}

/**
 * Hook for executing data code in a sandboxed environment.
 * Uses a proxied fetch to bypass CORS restrictions.
 * 
 * @example
 * ```tsx
 * const { run, isRunning, result, error, logs } = useDataCodeRunner();
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
    const [logs, setLogs] = useState<string[]>([]);

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
        setLogs([]); // Clear previous logs

        try {
            // proxiedFetch is now a stable reference
            const fetchFn = proxiedFetch;

            const capturedLogs: string[] = [];
            const capturedConsole = {
                log: (...args: any[]) => {
                    capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                    console.log(...args);
                },
                error: (...args: any[]) => {
                    capturedLogs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                    console.error(...args);
                },
                warn: (...args: any[]) => {
                    capturedLogs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                    console.warn(...args);
                },
                info: (...args: any[]) => {
                    capturedLogs.push('[INFO] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                    console.info(...args);
                }
            };

            // Wrap code in an async IIFE and execute
            // Inject proxiedFetch as 'fetch' for automatic CORS proxy routing
            // Inject 'console' to capture logs
            const executor = new Function('userParams', 'fetch', 'console', `
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

            const executionResult = await executor(params, fetchFn, capturedConsole);
            console.log("Data code result:", executionResult);

            setResult(executionResult);
            setLogs(capturedLogs); // Update state with captured logs
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
        logs,
    };
}
