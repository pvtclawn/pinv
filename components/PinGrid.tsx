"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Loader2 } from "lucide-react";
import { Pin } from "@/types";
import { AppCard } from "@/components/ui/AppCard";
import { DataEnclave } from "@/components/ui/DataEnclave";

interface PinGridProps {
    initialPins: Pin[];
}

export default function PinGrid({ initialPins }: PinGridProps) {
    const [pins, setPins] = useState<Pin[]>(initialPins);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);

        try {
            const nextPage = page + 1;
            const res = await fetch(`/api/pins?page=${nextPage}&limit=9`);
            const data = await res.json();

            if (data.pins?.length > 0) {
                setPins((prev) => [...prev, ...data.pins]);
                setPage(nextPage);
                setHasMore(data.hasMore);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load more pins:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, hasMore, isLoading]);

    useEffect(() => {
        if (isLoading) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [loadMore, hasMore, isLoading]);

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {pins.map((pin) => (
                    <Link href={`/p/${pin.fid}`} key={pin.fid} className="block group h-full">
                        <AppCard className="h-full flex flex-col p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                            {/* Header */}
                            <div className="flex justify-between items-start p-6 pb-4">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold font-orbitron text-foreground group-hover:text-primary transition-colors truncate pr-4">
                                        {pin.title}
                                    </h2>
                                </div>
                                <div className="px-2 py-1 bg-muted/20 border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground rounded-sm">
                                    V1.0
                                </div>
                            </div>

                            {/* Preview Window (Data Enclave) */}
                            <DataEnclave className="w-full aspect-[3/2] p-0 overflow-hidden group-hover:border-primary/30 transition-colors border-y border-transparent relative">
                                {/* Background Image */}
                                <img
                                    src={`/api/og/p/${pin.fid}`}
                                    alt={pin.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </DataEnclave>

                            {/* Footer */}
                            <div className="mt-auto mx-6 border-t border-dashed border-border py-4 flex justify-between items-center">
                                <span className="text-xs font-mono text-muted-foreground">
                                    @{pin.handle}
                                </span>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </AppCard>
                    </Link>
                ))}

                {pins.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-32 text-center space-y-4 border-2 border-dashed border-border rounded-xl bg-white/50">
                        <div className="w-16 h-16 bg-white border border-border shadow-sm flex items-center justify-center mb-4 rounded-full">
                            <Zap className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground pb-4 font-sans font-medium max-w-md">No pins found. Create the first one</p>
                    </div>
                )}
            </div>

            {/* Infinite Scroll Sentinel & Loader */}
            {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-mono tracking-widest uppercase">Fetching more...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
