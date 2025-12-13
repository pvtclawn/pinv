import { APP_CONFIG, NEXT_PUBLIC_APP_URL } from '@/lib/config';
import { Metadata } from 'next';

interface MetadataParams {
    title?: string;
    description?: string;
    imageUrl?: string;
    url?: string;
    splashBackgroundColor?: string;
    icons?: Metadata['icons'];
}

/**
 * Construct a standardized Metadata object for Next.js.
 * Handles OpenGraph, Farcaster (MiniApp/Frame), and basic SEO fields.
 */
export function constructMetadata({
    title = APP_CONFIG.defaultTitle,
    description = APP_CONFIG.description,
    imageUrl = APP_CONFIG.ogImageUrl,
    url = NEXT_PUBLIC_APP_URL,
    splashBackgroundColor = APP_CONFIG.splashBackgroundColor,
    icons = {
        icon: '/icon.svg',
        shortcut: '/icon.svg',
        apple: '/icon.svg',
    },
}: MetadataParams = {}): Metadata {
    const fcMetadata = {
        version: 'next',
        imageUrl: imageUrl,
        button: {
            title: `Launch ${APP_CONFIG.title}`,
            action: {
                type: 'launch_miniapp',
                name: APP_CONFIG.title,
                url: url,
                splashImageUrl: APP_CONFIG.splashImageUrl,
                splashBackgroundColor: splashBackgroundColor,
            },
        },
    };

    const fcFrameMetadata = {
        version: '1',
        imageUrl: imageUrl,
        button: {
            title: `Launch ${APP_CONFIG.title}`,
            action: {
                type: 'launch_frame',
                name: APP_CONFIG.title,
                url: url,
                splashImageUrl: APP_CONFIG.splashImageUrl,
                splashBackgroundColor: splashBackgroundColor,
            },
        },
    };

    return {
        title,
        description,
        icons,
        openGraph: {
            title,
            description,
            images: [imageUrl],
            url,
        },
        other: {
            'fc:miniapp': JSON.stringify(fcMetadata),
            'fc:frame': JSON.stringify(fcFrameMetadata),
        },
    };
}

export const defaultMetadata = constructMetadata();
