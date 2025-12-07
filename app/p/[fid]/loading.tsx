import Header from "@/components/Header";
import { AppCard } from "@/components/ui/AppCard";
import { DataEnclave } from "@/components/ui/DataEnclave";

export default function Loading() {
    return (
        <div className="min-h-screen bg-background pattern-grid">
            <div className="app-container">
                <Header />

                {/* Pin Viewer Skeleton */}
                <AppCard className="overflow-hidden">
                    {/* Header Skeleton */}
                    <div className="p-6 border-b border-border bg-muted/5 space-y-4">
                        <div className="h-8 w-1/2 bg-muted/20 animate-pulse rounded" />
                        <div className="h-4 w-1/3 bg-muted/20 animate-pulse rounded" />
                    </div>

                    {/* Body Skeleton */}
                    <div className="p-6 space-y-6">
                        <DataEnclave className="w-full aspect-[3/2] bg-muted/10 animate-pulse border border-transparent">
                            <div className="sr-only">Loading Pin Data...</div>
                        </DataEnclave>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="h-12 bg-muted/20 animate-pulse rounded" />
                            <div className="h-12 bg-muted/20 animate-pulse rounded" />
                        </div>
                    </div>
                </AppCard>
            </div>
        </div>
    );
}
