import Header from "@/components/Header";
import { AppCard } from "@/components/ui/AppCard";
import { DataEnclave } from "@/components/ui/DataEnclave";
import Hero from "@/components/Hero";

export default function Loading() {
    const skeletons = Array.from({ length: 6 });

    return (
        <div className="min-h-screen font-sans selection:bg-primary/20 bg-background pattern-grid">
            <div className="app-container">
                <Header />

                <main className="mt-8 md:mt-12 space-y-16">
                    {/* Hero / CTA - Static content is replicated to prevent layout shift */}
                    <Hero isLoading />

                    {/* Grid of Skeletons */}

                    {/* Grid of Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {skeletons.map((_, i) => (
                            <div key={i} className="block h-full">
                                <AppCard className="h-full flex flex-col pointer-events-none">
                                    {/* Header Skeleton */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-2 w-full">
                                            <div className="h-7 w-3/4 bg-muted/20 animate-pulse rounded" />
                                        </div>
                                    </div>

                                    {/* Preview Window Skeleton */}
                                    <DataEnclave className="w-full aspect-[3/2] bg-muted/10 mb-4 border border-transparent animate-pulse">
                                        <div className="sr-only">Loading...</div>
                                    </DataEnclave>

                                    {/* Footer Skeleton */}
                                    <div className="mt-auto border-t border-dashed border-border pt-4 flex justify-between items-center">
                                        <div className="h-4 w-1/4 bg-muted/20 animate-pulse rounded" />
                                    </div>
                                </AppCard>
                            </div>
                        ))}
                    </div>
                </main >
            </div >
        </div >
    );
}
