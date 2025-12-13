import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        const updates = await request.json();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update pin:', error);
        return NextResponse.json(
            { error: 'Failed to update pin' },
            { status: 500 }
        );
    }
}
