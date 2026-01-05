import { NextResponse } from "next/server";
import { PinataSDK } from "pinata";

export const dynamic = "force-dynamic";

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
});

export async function GET() {
    try {
        const url = await pinata.upload.public.createSignedURL({
            expires: 120, // 2 minutes
            maxFileSize: 10 * 1024 * 1024, // 10MB
        });

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Pinata Token Error:", error);
        return NextResponse.json({ error: "Failed to generate upload token" }, { status: 500 });
    }
}
