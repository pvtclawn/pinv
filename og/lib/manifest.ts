import { fetchFromIpfs } from '../../lib/ipfs';

// Simple in-memory cache for manifests
// CIDs are immutable, so we can cache them aggressively/forever in memory (with LRU ideally)
const manifestCache = new Map<string, any>();
const MAX_CACHE_SIZE = 100;

export async function getManifest(ver: string) {
    if (!ver) return null;

    // Check Cache
    if (manifestCache.has(ver)) return manifestCache.get(ver);

    try {
        // Fetch from IPFS (reuse existing util, assumes it handles gateway)
        // Note: fetchFromIpfs parses JSON?
        const data = await fetchFromIpfs(ver);

        if (data) {
            // Basic validation
            if (!data.reactCode && !data.uiCode) {
                // Invalid manifest?
            }
            // Normalize
            const manifest = {
                reactCode: data.reactCode || data.uiCode || '',
                previewData: data.previewData || {},
                parameters: data.parameters || [],
                userConfig: data.userConfig || {}
            };

            // Store Cache
            if (manifestCache.size > MAX_CACHE_SIZE) {
                const first = manifestCache.keys().next().value;
                if (first) manifestCache.delete(first);
            }
            manifestCache.set(ver, manifest);

            return manifest;
        }
    } catch (e) {
        console.error(`Manifest fetch failed for ${ver}:`, e);
    }
    return null;
}
