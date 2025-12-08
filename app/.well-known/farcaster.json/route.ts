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
        baseBuilder: {
            ownerAddress: APP_CONFIG.ownerAddress
        },
        miniapp: {
            version: "1",
            name: APP_CONFIG.title,
            homeUrl: appUrl,
            iconUrl: APP_CONFIG.iconUrl,
            splashImageUrl: APP_CONFIG.iconUrl,
            splashBackgroundColor: APP_CONFIG.splashBackgroundColor,
            webhookUrl: APP_CONFIG.webhookUrl,
            subtitle: APP_CONFIG.subtitle,
            description: APP_CONFIG.description,
            screenshotUrls: APP_CONFIG.screenshotUrls,
            primaryCategory: APP_CONFIG.primaryCategory,
            tags: APP_CONFIG.tags,
            heroImageUrl: APP_CONFIG.heroImageUrl,
            tagline: APP_CONFIG.tagline,
            ogTitle: APP_CONFIG.title,
            ogDescription: APP_CONFIG.description,
            ogImageUrl: APP_CONFIG.ogImageUrl,
            noindex: true
        }
    };

    return Response.json(manifest);
}
