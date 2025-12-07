import Header from "@/components/Header";
import { blockchainService } from "@/lib/blockchain-service";
import PinGrid from "@/components/PinGrid";
import Hero from "@/components/Hero";

export default async function Home() {
  const allPins = await blockchainService.getAllPins();
  // Sort: Newest first
  allPins.sort((a, b) => b.fid - a.fid);

  // Initial batch for SSR
  const initialPins = allPins.slice(0, 9);

  return (
    <div className="min-h-screen font-sans selection:bg-primary/20 bg-background pattern-grid">
      <div className="app-container">
        <Header />

        <main className="mt-8 md:mt-12 space-y-16">
          {/* Hero / CTA */}
          <Hero />

          {/* Grid of Pins (Client Component) */}
          <PinGrid initialPins={initialPins} />
        </main >
      </div >
    </div >
  );
}
