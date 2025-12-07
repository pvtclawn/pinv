import { NEXT_PUBLIC_APP_URL, APP_CONFIG } from '@/lib/config';

export async function GET() {
    const appUrl = NEXT_PUBLIC_APP_URL;

    const accountAssociation = {
        header: process.env.FARCASTER_ASSOCIATION_HEADER || '',
        payload: process.env.FARCASTER_ASSOCIATION_PAYLOAD || '',
        signature: process.env.FARCASTER_ASSOCIATION_SIGNATURE || ''
    };

    const manifest = {
        accountAssociation: accountAssociation,
        frame: {
            version: "1",
            name: APP_CONFIG.title,
            homeUrl: appUrl,
            iconUrl: APP_CONFIG.iconUrl,
            splashImageUrl: APP_CONFIG.iconUrl,
            splashBackgroundColor: "#0052FF",
            webhookUrl: `${appUrl}/api/webhook`,
            subtitle: APP_CONFIG.subtitle,
            description: APP_CONFIG.description,
            primaryCategory: "social",
            tags: [
                "farcaster",
                "pins",
                "social"
            ],
            tagline: APP_CONFIG.tagline
        },
        baseBuilder: {
            ownerAddress: "0x906754F840Fc07676Ac9b20556a05d7200B6dE49"
        }
    };

    return Response.json(manifest);
}
