"use client";

import { useState, useEffect } from "react";
import { Pin } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PinParams from "@/components/PinParams";
import PinDisplayCard from "@/components/PinDisplayCard";
import { Share2, Edit } from "lucide-react";
import { buildOgUrl, buildShareUrl } from "@/lib/services/preview";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { sdk } from "@farcaster/miniapp-sdk";
import CopyButton from "@/components/CopyButton";
import { APP_CONFIG } from "@/lib/config";

interface PinViewerProps {
    pin: Pin;
    fid: number;
    initialParams: Record<string, string>;
}

/**
 * PinViewer - Displays a pin with live preview and customizable parameters.
 * 
 * Responsibilities:
 * - Render pin details and preview image
 * - Allow parameter customization
 * - Provide share functionality
 */
export default function PinViewer({ pin, fid, initialParams }: PinViewerProps) {
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
        setPreviewUrl(buildOgUrl(fid, debouncedValues, true));
        setShareUrl(buildShareUrl(fid, values));
    }, [debouncedValues, values, fid]);

    const parameters = pin.widget?.parameters || [];

    return (
        <AppCard className="p-0 md:p-6 rounded-none !border-0 md:border w-full">
            <PinDisplayCard
                title={pin.title}
                description={
                    <span className="flex items-center gap-2 justify-center md:justify-start">
                        <span>@{pin.handle}</span>
                        <span
                            className="w-2 h-2 rounded-full border border-black/10"
                            style={{ backgroundColor: pin.accentColor }}
                        />
                    </span>
                }
                imageSrc={previewUrl}
                className="border-none shadow-none bg-transparent p-0"
                footerClassName="p-0 md:p-6 gap-0 md:gap-4"
            >
                <div className="w-full px-4 md:px-0 pt-4 md:pt-0 pb-3 md:pb-0">
                    <p className="text-center text-muted-foreground font-sans mb-2">{pin.tagline}</p>
                </div>

                <div className="space-y-3 w-full">
                    {/* Parameter Customization */}
                    {parameters.length > 0 && (
                        <div className="p-4 md:p-4 border-y md:border border-border bg-muted/10 rounded-none">
                            <PinParams
                                mode="edit"
                                parameters={parameters}
                                values={values}
                                onChange={setValues}
                            />
                        </div>
                    )}

                </div>

                {/* Actions Footer */}
                <div className="w-full px-4 md:px-0 pb-4 md:pb-0">
                    <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 pt-4 border-t border-border w-full">
                        <div className="w-full [&>button]:w-full">
                            <CopyButton
                                url={shareUrl}
                                variant="ghost"
                                className="text-muted-foreground hover:text-primary w-full"
                            >
                                Copy
                            </CopyButton>
                        </div>

                        <AppButton
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
                            className="w-full"
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </AppButton>

                        <AppButton
                            className="w-full"
                            asChild
                        >
                            <Link href={`/p/${fid}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </AppButton>
                    </div>
                </div>
            </PinDisplayCard>
        </AppCard>
    );
}
