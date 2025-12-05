'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import { useCallback } from 'react';

interface ShareButtonProps {
    url: string;
}

export default function ShareButton({ url }: ShareButtonProps) {
    const handleShare = useCallback(async () => {
        try {
            await sdk.actions.composeCast({
                text: "Here’s my PinV 👇",
                embeds: [url],
            });
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback for non-miniapp context or error
            if (typeof window !== 'undefined') {
                window.open(`https://warpcast.com/~/compose?text=Here’s my PinV 👇&embeds[]=${encodeURIComponent(url)}`, '_blank');
            }
        }
    }, [url]);

    return (
        <button
            onClick={handleShare}
            className="px-6 py-3 bg-white text-black font-bold rounded-lg shadow-lg hover:scale-105 transition-transform active:scale-95"
        >
            Share my PinV
        </button>
    );
}
