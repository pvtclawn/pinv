"use client";

import { useState, useEffect } from "react";
import { Pin } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PinParams from "@/components/shared/PinParams";
import PinDisplayCard from "./PinDisplayCard";
import { Share2, Edit } from "lucide-react";
import { buildOgUrl, buildShareUrl } from "@/lib/services/preview";
import { Card } from "@/components/ui/card";
import { sdk } from "@farcaster/miniapp-sdk";
import CopyButton from "@/components/shared/CopyButton";
import { APP_CONFIG } from "@/lib/config";

interface PinViewerProps {
    pin: Pin;
    pinId: number;
    initialParams: Record<string, string>;
}

/**
 * PinViewer - Displays a pin with live preview and customizable parameters.
 * 
 * Responsibilities:https://dev.tightvideo.com/issues/129221
 * - Render pin details and preview image
 * - Allow parameter customization
 * - Provide share functionality
 */
export default function PinViewer({ pin, pinId, initialParams }: PinViewerProps) {
    const [values, setValues] = useState<Record<string, string>>(initialParams);
    const [debouncedValues, setDebouncedValues] = useState<Record<string, string>>(initialParams);

    // URL states
    const [previewUrl, setPreviewUrl] = useState('');
    const [shareUrl, setShareUrl] = useState('');

    const shareText = APP_CONFIG.shareText || `Here’s my PinV 👇`;

    // Debounce parameter changes to avoid flickering
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValues(values);
        }, 500);
        return () => clearTimeout(timer);
    }, [values]);

    // Update URLs when values change
    useEffect(() => {
        setPreviewUrl(buildOgUrl(pinId, debouncedValues, true));
        setShareUrl(buildShareUrl(pinId, values));
    }, [debouncedValues, values, pinId]);

    const parameters = pin.widget?.parameters || [];
    const visibleParameters = parameters.filter((p: any) => !p.hidden);

    return (
        <div className="flex flex-col gap-0 max-w-3xl mx-auto relative">
            <PinDisplayCard
                title={pin.title}
                description={pin.tagline}
                imageSrc={previewUrl}
            >
                <div className="space-y-3 w-full">
                    {/* Parameter Customization */}
                    {visibleParameters.length > 0 && (
                        <div className="rounded-none">
                            <PinParams
                                parameters={visibleParameters}
                                values={values}
                                onChange={setValues}
                            />
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="w-full md:px-0 pb-4 md:pb-0">
                    <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
                        <div className="w-full [&>button]:w-full">
                            <CopyButton
                                url={shareUrl}
                                variant="ghost"
                                className="text-muted-foreground w-full h-10 px-2 font-bold tracking-wider"
                            >
                                COPY
                            </CopyButton>
                        </div>

                        <Button
                            variant="secondary"
                            onClick={async () => {
                                // 1. Try Miniapp SDK (only if framed)
                                const isFramed = typeof window !== 'undefined' && window.parent !== window;
                                if (isFramed) {
                                    try {
                                        await sdk.actions.composeCast({
                                            text: shareText,
                                            embeds: [shareUrl],
                                        });
                                        return;
                                    } catch (error) {
                                        console.warn('SDK share failed, falling back:', error);
                                    }
                                }

                                // 2. Try Native Share (Mobile Safari/Android/Desktop Safari)
                                if (navigator.share) {
                                    try {
                                        await navigator.share({
                                            title: pin.title,
                                            text: pin.tagline,
                                            url: shareUrl,
                                        });
                                        return;
                                    } catch (e) {
                                        console.warn('Navigator share failed', e);
                                    }
                                }

                                // 3. Desktop / Fallback Web Intent
                                const farcastUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`;
                                window.open(farcastUrl, '_blank', 'noopener,noreferrer');
                            }}
                            className="w-full h-10 px-2 font-bold tracking-wider"
                            icon={Share2}
                        >
                            SHARE
                        </Button>

                        <Button
                            className="w-full h-10 px-2 font-bold tracking-wider"
                            asChild
                        >
                            <Link href={`/p/${pinId}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                EDIT
                            </Link>
                        </Button>
                    </div>
                </div>
            </PinDisplayCard>
        </div>
    );
}
