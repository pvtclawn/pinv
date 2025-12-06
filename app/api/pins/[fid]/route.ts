import { NextRequest, NextResponse } from 'next/server';
import { blockchainService } from '@/lib/blockchain-service';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ fid: string }> }
) {
    try {
        const { fid: fidStr } = await params;
        const fid = parseInt(fidStr);

        const updates = await request.json();

        // Security check: In a real app, verify signature/session here

        const txHash = await blockchainService.updatePin(fid, updates);

        return NextResponse.json({ success: true, txHash });
    } catch (error) {
        console.error('Failed to update pin:', error);
        return NextResponse.json(
            { error: 'Failed to update pin' },
            { status: 500 }
        );
    }
}
