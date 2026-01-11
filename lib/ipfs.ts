
const DEFAULT_PIN_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export async function fetchFromIpfs(cid: string): Promise<any> {
    if (!cid) return {};

    const GATEWAYS = [
        process.env.NEXT_PUBLIC_IPFS_GATEWAY,
        'https://gateway.pinata.cloud/ipfs/',
        'https://ipfs.io/ipfs/',
        'https://dweb.link/ipfs/'
    ].filter(Boolean) as string[];

    // Deduplicate
    const uniqueGateways = Array.from(new Set(GATEWAYS));

    // Race all gateways in parallel to find the content fastest
    // This avoids accumulating timeouts (e.g. 10s * 4 gateways = 40s latency)
    try {
        const fetchWithTimeout = async (url: string) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per request

            // Hard timeout race to handle hanging fetches (e.g. CSP blocking in some envs)
            const hardTimeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 11000)
            );

            try {
                const res = await Promise.race([
                    fetch(url, { signal: controller.signal }),
                    hardTimeout
                ]) as Response;

                clearTimeout(timeoutId);
                if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
                return await res.json();
            } catch (e) {
                clearTimeout(timeoutId);
                // console.warn(`[IPFS] Fetch failed for ${url}:`, e);
                throw e;
            }
        };

        const promises = uniqueGateways.map(gateway =>
            fetchWithTimeout(`${gateway}${cid}`)
        );

        // Promise.any resolves as soon as ONE promise fulfills
        return await Promise.any(promises);
    } catch (e) {
        // If AggregateError (all failed), log it
        if (e instanceof AggregateError) {
            console.warn(`[IPFS] All gateways failed for ${cid}:`, e.errors.map(err => (err as Error).message));
        } else {
            console.warn(`[IPFS] Failed to fetch ${cid}:`, e);
        }
        // Return empty object on failure to allow UI to render partial data
        return {};
    }
}
