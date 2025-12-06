import { NextRequest, NextResponse } from 'next/server';
import { blockchainService } from '@/lib/blockchain-service';

export async function GET() {
    try {
        const pins = await blockchainService.getAllPins();
        // Sort by FID desc (newest first)
        pins.sort((a, b) => b.fid - a.fid);
        return NextResponse.json({ pins });
    } catch (error) {
        console.error('Failed to fetch pins:', error);
        return NextResponse.json({ error: 'Failed to fetch pins' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const newPinId = await blockchainService.createPin({
            title: 'New Pin',
            tagline: 'Freshly minted',
            handle: 'unknown',
            accentColor: '#3b82f6', // blue-500
            stats: { githubRepos: 0, githubStars: 0, followerCount: 0 },
            widgets: [],
            lastUpdated: new Date().toISOString()
        });

        // Redirect to the edit page of the new pin
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${appUrl}/p/${newPinId}/edit`, 303);
    } catch (error) {
        console.error('Failed to create pin:', error);
        return NextResponse.json({ error: 'Failed to create pin' }, { status: 500 });
    }
}
