import type { ExtendedWrapper } from "../types.js";
import { config } from "../../config.js";
import { validateUrl } from "../../utils.js";
import ivm from "../ivm.js";

export function createHostFetch(wrapper: ExtendedWrapper) {
    return new ivm.Reference(async (argsJson: any) => {
        if (!wrapper.job) return JSON.stringify({ error: "No active job state" });

        let args;
        try {
            args = JSON.parse(argsJson);
        } catch (e) {
            return JSON.stringify({ error: "Invalid hostFetch args" });
        }
        const { url: urlArg, options: optionsArg } = args;

        try {
            if (wrapper.job.fetchCount >= config.maxFetchesPerExec) {
                return JSON.stringify({ error: "Fetch limit exceeded" });
            }

            const url = String(urlArg);
            const validationError = await validateUrl(url);
            if (validationError) {
                return JSON.stringify({ error: `Network denied: ${validationError}` });
            }

            let attempts = 0;
            const MAX_RETRIES = 2;
            let lastRes: Response | null = null;

            while (attempts <= MAX_RETRIES) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.fetchTimeoutMs);

                try {
                    if (attempts === 0) wrapper.job.fetchCount++;
                    const res = await fetch(url, { ...optionsArg, signal: controller.signal });
                    lastRes = res;

                    const retryable = [429, 502, 503, 504].includes(res.status);
                    if (retryable && attempts < MAX_RETRIES) {
                        attempts++;
                        const delay = Math.pow(2, attempts) * 500 + Math.random() * 500;
                        // console.log(`[HostFetch] Received ${res.status} from ${url}. Retrying in ${Math.round(delay)}ms (Attempt ${attempts}/${MAX_RETRIES})...`);
                        await new Promise(r => setTimeout(r, delay));
                        continue;
                    }

                    const lenHeader = res.headers.get("content-length");
                    if (lenHeader && parseInt(lenHeader) > config.maxFetchBytesPerResponse) {
                        return JSON.stringify({ error: "Response content-length exceeds limit" });
                    }

                    if (!res.body) {
                        return JSON.stringify({
                            ok: res.ok,
                            status: res.status,
                            statusText: res.statusText,
                            text: ""
                        });
                    }

                    const reader = res.body.getReader();
                    const chunks: Uint8Array[] = [];
                    let receivedLength = 0;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        if (value) {
                            // Check Limit
                            receivedLength += value.length;
                            if (receivedLength > config.maxFetchBytesPerResponse) {
                                controller.abort(); // Kill connection
                                return JSON.stringify({ error: "Response size exceeds limit" });
                            }

                            // Check Job State (Race Condition Safety)
                            if (!wrapper.job) {
                                controller.abort();
                                return;
                            }

                            // Check Job State (Safe access)
                            if (!wrapper.job) {
                                controller.abort();
                                return JSON.stringify({ error: "Job Cancelled" });
                            }

                            // Check Total Budget
                            if ((wrapper.job.fetchBytes + value.length) > config.maxFetchBytesTotal) {
                                controller.abort();
                                return JSON.stringify({ error: "Total fetch bytes exceeded" });
                            }

                            chunks.push(value);
                        }
                    }

                    // Update Total Budget (Safe now)
                    wrapper.job.fetchBytes += receivedLength;

                    // Concatenate
                    const bodyBuffer = new Uint8Array(receivedLength);
                    let offset = 0;
                    for (const chunk of chunks) {
                        bodyBuffer.set(chunk, offset);
                        offset += chunk.length;
                    }
                    const bodyText = new TextDecoder().decode(bodyBuffer);

                    return JSON.stringify({
                        ok: res.ok,
                        status: res.status,
                        statusText: res.statusText,
                        text: bodyText
                    });

                } catch (e: any) {
                    if (attempts < MAX_RETRIES && (e.name === 'AbortError' || e.message?.includes('fetch failed'))) {
                        attempts++;
                        const delay = Math.pow(2, attempts) * 500 + Math.random() * 500;
                        await new Promise(r => setTimeout(r, delay));
                        continue;
                    }
                    throw e;
                } finally {
                    clearTimeout(timeoutId);
                }
            }

            // Should never reach here if loop breaks or returns, but for TS:
            return JSON.stringify({ error: "Fetch failed after max retries" });

        } catch (e: any) {
            console.error("[HostFetch DEBUG] Failed:", urlArg, e);
            return JSON.stringify({ error: e.message || "Fetch failed" });
        }
    });
}
