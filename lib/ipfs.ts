
const PINATA_PROXY_URL = '/api/ipfs/upload';

// Helper for IPFS
export async function uploadToIpfs(data: any): Promise<string> {
    try {
        const res = await fetch(PINATA_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to upload to IPFS');
        }

        const json = await res.json();
        return json.ipfsHash;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
}

const PIN_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

export async function fetchFromIpfs(cid: string): Promise<any> {
    if (!cid) return {};

    try {
        const res = await fetch(`${PIN_GATEWAY}${cid}`);
        if (!res.ok) {
            throw new Error(`IPFS Fetch Failed: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    } catch (e) {
        console.error(`Failed to fetch IPFS CID ${cid} from ${PIN_GATEWAY}:`, e);
        return {};
    }
}
