import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { blockchainService } from '@/lib/blockchain-service';
import Header from '@/components/Header';
import { NEXT_PUBLIC_APP_URL } from '@/lib/config';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PinViewer from "@/components/PinViewer";

type Props = {
    params: Promise<{ fid: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { fid: fidStr } = await params;
    const resolvedSearchParams = await searchParams;
    const fid = parseInt(fidStr);
    const pin = await blockchainService.getPin(fid);

    if (!pin) {
        return {
            title: 'Pin Not Found',
        };
    }

    const appUrl = NEXT_PUBLIC_APP_URL;

    // Construct Dynamic Image URL with params
    const imageObjUrl = new URL(`${appUrl}/api/og/p/${fid}`);
    const timestamp = Date.now();
    imageObjUrl.searchParams.set('t', timestamp.toString());

    if (resolvedSearchParams) {
        Object.entries(resolvedSearchParams).forEach(([key, value]) => {
            if (typeof value === 'string') {
                imageObjUrl.searchParams.set(key, value);
            }
        });
    }

    const imageUrl = imageObjUrl.toString();
    const pinUrl = `${appUrl}/p/${fid}`; // Note: The actual share URL usually preserves query params naturally, but explicit is good.

    const fcMetadata = {
        version: '1',
        imageUrl: imageUrl,
        button: {
            title: 'View PinV',
            action: {
                type: 'launch_miniapp',
                name: 'PinV',
                url: pinUrl, // This URL should ideally also have params if we want the opened app to see them, though usually FC handles the context
                splashImageUrl: `${appUrl}/icon.png`,
                splashBackgroundColor: pin.accentColor,
            },
        },
    };

    const fcFrameMetadata = {
        ...fcMetadata,
        button: {
            ...fcMetadata.button,
            action: {
                ...fcMetadata.button.action,
                type: 'launch_frame',
            }
        }
    };

    return {
        title: pin.title,
        description: pin.tagline,
        openGraph: {
            title: pin.title,
            description: pin.tagline,
            images: [imageUrl],
        },
        other: {
            'fc:miniapp': JSON.stringify(fcMetadata),
            'fc:frame': JSON.stringify(fcFrameMetadata),
        },
    };
}

export default async function PinPage({ params, searchParams }: Props) {
    const { fid: fidStr } = await params;
    const resolvedSearchParams = await searchParams; // Next.js 15+ needs await, sticking to safe pattern
    const fid = parseInt(fidStr);
    const pin = await blockchainService.getPin(fid);

    if (!pin) {
        notFound();
    }

    // Convert searchParams to simple Record<string, string> for PinParams
    const initialParams: Record<string, string> = {};
    if (resolvedSearchParams) {
        Object.entries(resolvedSearchParams).forEach(([key, value]) => {
            if (typeof value === 'string') {
                initialParams[key] = value;
            }
        });
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <Header />
                <PinViewer pin={pin} fid={fid} initialParams={initialParams} />
            </div>
        </div>
    );
}
