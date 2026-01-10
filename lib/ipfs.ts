
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

    let lastError;

    for (const gateway of uniqueGateways) {
        try {
            // Short timeout for public gateways to fail fast
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(`${gateway}${cid}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                return await res.json();
            }

            // If 429, warned and continue to next gateway immediately
            if (res.status === 429) {
                console.warn(`[IPFS] 429 on ${gateway}. Failover...`);
                continue;
            }

            throw new Error(`${res.status} ${res.statusText}`);
        } catch (e: any) {
            console.warn(`[IPFS] Failed ${gateway}: ${e.message}`);
            lastError = e;
            // Continue to next gateway
        }
    }

    // If we get here, all failed
    console.error(`[IPFS] All gateways failed for ${cid}`);
    throw lastError || new Error('All IPFS gateways failed');
}
