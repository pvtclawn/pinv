
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const PINATA_API_KEY = process.env.PINATA_API_KEY;
    const PINATA_SECRET_API_KEY = process.env.PINATA_API_SECRET;

    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
        console.warn('Missing Pinata API keys');
        // For development without keys, we might want a mock fallback or just error
        return NextResponse.json(
            { error: 'Server configuration error: Missing IPFS keys' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();

        const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_API_KEY,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to upload to Pinata');
        }

        const data = await res.json();
        return NextResponse.json({ ipfsHash: data.IpfsHash });
    } catch (error) {
        console.error('IPFS Upload Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
