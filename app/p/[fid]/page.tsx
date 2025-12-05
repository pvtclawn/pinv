import { notFound } from 'next/navigation';
import ShareButton from '@/components/ShareButton';
import MiniappProvider from '@/components/MiniappProvider';
import { Metadata, ResolvingMetadata } from 'next';
import { headers } from 'next/headers';
import { blockchainService } from '@/lib/blockchain-service';
import Header from '@/components/Header';
import PinEditor from '@/components/PinEditor';
import { NEXT_PUBLIC_APP_URL } from '@/lib/config';

type Props = {
    params: { fid: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { fid: fidStr } = await params;
    const fid = parseInt(fidStr);
    const pin = await blockchainService.getPin(fid);

    if (!pin) {
        return {
            title: 'Pin Not Found',
        };
    }

    // Hardcoding URL to ensure it works with ngrok and Farcaster
    const appUrl = NEXT_PUBLIC_APP_URL;

    console.log(`[generateMetadata] Using hardcoded AppURL: ${appUrl}`);

    const timestamp = Date.now();
    const imageUrl = `${appUrl}/api/og/p/${fid}?t=${timestamp}`;
    const pinUrl = `${appUrl}/p/${fid}`;

    const fcMetadata = {
        version: '1',
        imageUrl: imageUrl,
        button: {
            title: 'View PinV',
            action: {
                type: 'launch_miniapp',
                name: 'PinV',
                url: pinUrl,
                splashImageUrl: `${appUrl}/icon.png`,
                splashBackgroundColor: pin.accentColor,
            },
        },
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
        },
    };
}

export default async function PinPage({ params }: Props) {
    const { fid: fidStr } = await params;
    const fid = parseInt(fidStr);
    const pin = await blockchainService.getPin(fid);

    if (!pin) {
        notFound();
    }

    // Hardcoding URL to ensure it works with ngrok and Farcaster
    const appUrl = NEXT_PUBLIC_APP_URL;
    const pinUrl = `${appUrl}/p/${fid}`;

    return (
        <main
            className="min-h-screen flex flex-col items-center justify-between p-8 text-white"
            style={{
                background: `linear-gradient(to bottom right, #1a1a1a, ${pin.accentColor}40)`,
            }}
        >
            <div className="w-full max-w-md flex flex-col items-center gap-8">
                <Header />

                {/* Pin Info */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tight">{pin.handle}</h1>
                    <p className="text-lg opacity-90">{pin.tagline}</p>
                </div>

                {/* Widgets & Editor */}
                <PinEditor pin={pin} />

                {/* Actions */}
                <div className="pt-8 w-full flex justify-center">
                    <ShareButton url={pinUrl} />
                </div>
            </div>

            {/* Footer */}
            <div className="text-xs opacity-40 mt-12">
                Last updated: {new Date(pin.lastUpdated).toLocaleDateString()}
            </div>
        </main>
    );
}
