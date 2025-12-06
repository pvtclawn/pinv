"use client";

import { useState, useEffect } from "react";
import { Pin } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PinParams from "@/components/PinParams";
import PinDisplayCard from "@/components/PinDisplayCard";
import ShareButton from "@/components/ShareButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { NEXT_PUBLIC_APP_URL } from "@/lib/config";

interface PinViewerProps {
    pin: Pin;
    fid: number;
    initialParams: Record<string, string>;
}

export default function PinViewer({ pin, fid, initialParams }: PinViewerProps) {
    const [values, setValues] = useState<Record<string, string>>(initialParams);
    const [debouncedValues, setDebouncedValues] = useState<Record<string, string>>(initialParams);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [shareUrl, setShareUrl] = useState<string>('');

    // Debounce image generations to avoid flickering/loading spam
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValues(values);
        }, 500);
        return () => clearTimeout(timer);
    }, [values]);

    // Update URLs when values change
    useEffect(() => {
        const appUrl = NEXT_PUBLIC_APP_URL;

        // 1. OG Image URL (for visual preview)
        const og = new URL(`${appUrl}/api/og/p/${fid}`);
        og.searchParams.set('t', Date.now().toString()); // Cache bust
        Object.entries(debouncedValues).forEach(([k, v]) => {
            if (v) og.searchParams.set(k, v);
        });
        setPreviewUrl(og.toString());

        // 2. Share URL (for the button)
        const share = new URL(`${appUrl}/p/${fid}`);
        Object.entries(values).forEach(([k, v]) => {
            if (v) share.searchParams.set(k, v);
        });
        setShareUrl(share.toString());

    }, [debouncedValues, values, fid]);

    return (
        <PinDisplayCard
            title={pin.title}
            description={
                <span className="flex items-center gap-2 justify-center md:justify-start">
                    <span>@{pin.handle}</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pin.accentColor }} />
                </span>
            }
            imageSrc={previewUrl}
            className="border-2"
            style={{ borderColor: `${pin.accentColor}40` }}
        >
            <p className="text-center text-muted-foreground">{pin.tagline}</p>

            <div className="space-y-6 w-full">
                <div className="p-4 border rounded-lg bg-muted/20">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">
                        Customize View
                    </h3>

                    {/* Reusing PinParams in Controlled 'edit' mode to drive the preview */}
                    <PinParams
                        mode="edit"
                        parameters={pin.widget?.parameters || []}
                        values={values}
                        onChange={setValues}
                    />
                </div>

                <div className="flex gap-4">
                    <ShareButton url={shareUrl} />
                </div>
            </div>

            <div className="flex gap-4 w-full justify-center border-t pt-6 bg-transparent">
                <Button variant="ghost" className="text-muted-foreground" asChild>
                    <Link href={`/p/${fid}/edit`}>Edit Pin Source</Link>
                </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
                Last updated: {new Date(pin.lastUpdated).toLocaleDateString()}
            </p>
        </PinDisplayCard>
    );
}
