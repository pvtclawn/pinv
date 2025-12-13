
import { useState, useCallback, useRef } from 'react';
import { usePublicClient } from 'wagmi';
import { Pin } from '@/types';
import { pinVConfig, pinVStoreAbi } from './contracts';
import { fetchFromIpfs } from '@/lib/ipfs';
import { zeroAddress } from 'viem';

export function usePins() {
    const publicClient = usePublicClient();
    const [pins, setPins] = useState<Pin[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Keep track of the last processed ID for pagination
    const [lastId, setLastId] = useState<number | null>(null);

    // Use ref to track loading state synchronously to prevent race conditions
    const isFetchingRef = useRef(false);

    const loadMore = useCallback(async (limit = 9) => {
        if (!publicClient || isFetchingRef.current || !hasMore) return;

        isFetchingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const address = pinVConfig.address[publicClient.chain.id as keyof typeof pinVConfig.address];

            let startId: number;

            if (lastId === null) {
                // First load: get latest ID
                const nextTokenId = await publicClient.readContract({
                    address,
                    abi: pinVConfig.abi,
                    functionName: 'nextTokenId',
                });
                startId = Number(nextTokenId) - 1;
            } else {
                startId = lastId - 1;
            }

            if (startId < 1) {
                setHasMore(false);
                setIsLoading(false);
                isFetchingRef.current = false;
                return;
            }

            const endId = Math.max(1, startId - limit + 1);
            const newPins: Pin[] = [];

            // Iterate backwards
            for (let id = startId; id >= endId; id--) {
                try {
                    // 1. Get Store Address
                    const storeAddress = await publicClient.readContract({
                        address,
                        abi: pinVConfig.abi,
                        functionName: 'pinStores',
                        args: [BigInt(id)]
                    });

                    if (storeAddress === zeroAddress) continue;

                    // 2. Read Store Metadata
                    // Multicall would be better here
                    const [title, tagline, latestVer] = await Promise.all([
                        publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'title' }),
                        publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'tagline' }),
                        publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'latestVersion' }),
                    ]);

                    // 3. Get IPFS Data
                    let widgetData = {};
                    if (latestVer > BigInt(0)) {
                        // @ts-ignore
                        const ipfsId = await publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'versions', args: [latestVer] });
                        if (ipfsId) {
                            widgetData = await fetchFromIpfs(ipfsId);
                        }
                    }

                    newPins.push({
                        id: String(id),
                        title,
                        tagline,
                        lastUpdated: new Date().toISOString(),
                        widget: widgetData as any
                    });

                } catch (e) {
                    console.error(`Failed to fetch pin ${id}`, e);
                }
            }

            setPins(prev => {
                // Deduplicate pins just in case
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewPins = newPins.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNewPins];
            });
            setLastId(endId);

            if (endId <= 1) {
                setHasMore(false);
            }

        } catch (err) {
            console.error('Error fetching pins:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setHasMore(false); // Stop on error for safety
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    }, [publicClient, hasMore, lastId]);

    return { pins, isLoading, hasMore, error, loadMore };
}
