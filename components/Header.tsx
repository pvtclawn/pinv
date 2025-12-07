'use client';

import { useAccount, useConnect } from 'wagmi';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Header() {
    const { isConnected, address } = useAccount();
    const { connect, connectors } = useConnect();

    return (
        <header className="sticky top-0 z-50 w-full mb-4 md:mb-8 bg-white/80 backdrop-blur-md border-b border-border">
            <div className="mx-auto px-4 md:px-6 h-16 flex justify-between items-center max-w-[1600px]">
                {/* Left: Brand - Geometric & Sharp */}
                <Link href="/" className="flex items-center gap-3 cursor-pointer group">
                    <img src="/icon.svg" alt="PinV Logo" className="w-8 h-8" />
                    <span className="text-xl md:text-2xl font-bold font-orbitron tracking-widest group-hover:text-primary transition-colors">
                        PinV
                    </span>
                </Link>

                {/* Right: Controls */}
                <div className="flex justify-end items-center gap-6">
                    {/* Navigation Tabs - Raised "Origami" Buttons */}
                    <nav className="hidden md:flex gap-2">
                        {['Dashboard', 'Assets', 'Quests'].map((item) => (
                            <a key={item} href="#" className="px-4 py-1.5 text-xs font-bold font-sans uppercase tracking-wide text-muted-foreground hover:text-primary bg-transparent hover:bg-muted transition-all rounded-sm clip-path-polygon-[10px_0,100%_0,100%_100%,0_100%]">
                                {item}
                            </a>
                        ))}
                    </nav>

                    <div className="h-6 w-[1px] bg-border hidden md:block" />

                    {isConnected ? (
                        <div className="flex items-center gap-3 text-xs font-mono font-bold px-4 py-2 bg-white border border-border shadow-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-foreground tracking-wider">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                        </div>
                    ) : (
                        <Button
                            onClick={() => connect({ connector: connectors[0] })}
                            className="bg-primary hover:bg-primary/90 text-white font-bold font-sans uppercase tracking-wider rounded-none px-6 h-9 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            Connect Wallet
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
