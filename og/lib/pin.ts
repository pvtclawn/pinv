import { createPublicClient, http, zeroAddress } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { pinVConfig, pinVStoreAbi } from './contracts';
import { fetchFromIpfs } from '../../lib/ipfs';
import { Pin } from '../../types';

function getClient() {
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '84532';
    const chain = chainId === '8453' ? base : baseSepolia;
    return createPublicClient({
        chain,
        transport: http(process.env.RPC_URL)
    });
}

export async function getPin(id: number): Promise<Pin | null> {
    const publicClient = getClient();
    // @ts-ignore
    const chainId = publicClient.chain.id;
    // @ts-ignore
    const address = pinVConfig.address[chainId] as `0x${string}`;

    if (address === zeroAddress) return null;

    try {
        // 1. Get Store Address
        const storeAddress = await publicClient.readContract({
            address,
            abi: pinVConfig.abi,
            functionName: 'pinStores',
            args: [BigInt(id)]
        });

        if (storeAddress === zeroAddress) return null;

        // 2. Read Store Metadata
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
                // @ts-ignore
                widgetData = await fetchFromIpfs(ipfsId);
            }
        }

        return {
            id: String(id),
            title: title as string,
            tagline: tagline as string,
            lastUpdated: new Date().toISOString(),
            widget: widgetData as any
        };
    } catch (e) {
        console.error(`Failed to get pin ${id}`, e);
        return null;
    }
}
