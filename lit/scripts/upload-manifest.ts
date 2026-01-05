import fs from 'fs';

export async function uploadManifest(manifest: any): Promise<string> {
    const content = JSON.stringify(manifest);
    console.log(`[Mock] Uploading manifest to IPFS...`);

    const { ethers } = await import('ethers');
    const hash = ethers.id(content);
    const mockCid = `QmManifest${hash.slice(2, 40)}`;

    console.log(`[Mock] Uploaded. CID: ${mockCid}`);
    return mockCid;
}
