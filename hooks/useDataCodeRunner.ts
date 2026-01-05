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
            // Call OG Engine Directly
            const ogEngineUrl = process.env.NEXT_PUBLIC_OG_ENGINE_URL || 'http://localhost:8080';

            const response = await fetch(`${ogEngineUrl}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, params })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.details || `Execution failed with status ${response.status}`);
            }

            const data = await response.json();

            // Set logs from server
            if (Array.isArray(data.logs)) {
                setLogs(data.logs);
            }

            if (data.result) {
                setResult(data.result);
                return data.result;
            }

            return null;

        } catch (err: any) {
            const errorMessage = err.message || "Unknown error occurred";
            setError(errorMessage);
            setLogs(prev => [...prev, `[ERROR] ${errorMessage}`]);
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
