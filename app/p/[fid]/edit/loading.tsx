
import Header from "@/components/Header";
import { AppCard } from "@/components/ui/AppCard";
import { DataEnclave } from "@/components/ui/DataEnclave";

export default function Loading() {
    return (
        <div className="min-h-screen bg-background pattern-grid">
            <div className="app-container">
                <Header />

                {/* Editor Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {/* Left Column Skeleton (Prompt Input) */}
                    <div className="flex flex-col gap-6 min-w-0">
                        <AppCard className="p-4 md:p-6 rounded-none border-x-0 md:border-x">
                            <div className="space-y-4">
                                <div className="h-[120px] bg-muted/20 animate-pulse rounded border border-border" />
                                <div className="h-10 w-full bg-muted/20 animate-pulse rounded" />
                            </div>
                        </AppCard>
                    </div>

                    {/* Right Column Skeleton (Preview) */}
                    <div className="flex flex-col gap-6 sticky top-24 min-w-0">
                        <AppCard className="border-none shadow-none bg-transparent p-0">
                            {/* Title Skeleton */}
                            <div className="p-0 mb-4 bg-transparent">
                                <div className="h-8 w-1/4 bg-muted/20 animate-pulse rounded" />
                            </div>

                            <DataEnclave className="w-full aspect-[3/2] bg-muted/10 animate-pulse border border-transparent">
                                <div className="sr-only">Loading Preview...</div>
                            </DataEnclave>

                            {/* Buttons Skeleton */}
                            <div className="flex items-center pt-4 border-t border-dashed border-border mt-2 w-full gap-2 md:gap-4">
                                <div className="h-9 w-full bg-muted/20 animate-pulse rounded" />
                                <div className="h-9 w-full bg-muted/20 animate-pulse rounded" />
                            </div>
                        </AppCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
