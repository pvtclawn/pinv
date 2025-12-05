import { NEXT_PUBLIC_APP_URL } from '@/lib/config';

export async function GET() {
    const appUrl = NEXT_PUBLIC_APP_URL;

    // Signatures are now provided by environment variables
    // Local: .env.local
    // Production: Vercel Environment Variables
    const accountAssociation = {
        header: process.env.FARCASTER_ASSOCIATION_HEADER || '',
        payload: process.env.FARCASTER_ASSOCIATION_PAYLOAD || '',
        signature: process.env.FARCASTER_ASSOCIATION_SIGNATURE || ''
    };

    const manifest = {
        accountAssociation: accountAssociation,
        frame: {
            version: "1",
            name: "PinV",
            homeUrl: appUrl,
            iconUrl: `${appUrl}/icon.svg`,
            splashImageUrl: `${appUrl}/logo.svg`,
            splashBackgroundColor: "#0052FF",
            webhookUrl: `${appUrl}/api/webhook`,
            subtitle: "Pinned casts dynamic view",
            description: "Pinned casts dynamic view – manage your pinned content with ease",
            primaryCategory: "social",
            tags: [
                "farcaster",
                "pins",
                "social"
            ],
            tagline: "Pinned casts dynamic view"
        }
    };

    return Response.json(manifest);
}
