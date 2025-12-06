import Image from "next/image";

import { Metadata } from 'next';
import { NEXT_PUBLIC_APP_URL } from '@/lib/config';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Edit, Github, Zap } from "lucide-react";
import Header from "@/components/Header";
import { blockchainService } from "@/lib/blockchain-service";

export const metadata: Metadata = {
  title: 'PinV - Pinned Casts Dynamic View',
  description: 'Share your pinned casts with style.',
  openGraph: {
    title: 'PinV',
    description: 'Share your pinned casts with style.',
    images: [`${NEXT_PUBLIC_APP_URL}/icon.png`],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
      button: {
        title: 'Launch PinV',
        action: {
          type: 'launch_miniapp',
          name: 'PinV',
          url: NEXT_PUBLIC_APP_URL,
          splashImageUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
          splashBackgroundColor: '#ffffff',
        },
      },
    }),
    'fc:frame': JSON.stringify({
      version: '1',
      imageUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
      button: {
        title: 'Launch PinV',
        action: {
          type: 'launch_frame',
          name: 'PinV',
          url: NEXT_PUBLIC_APP_URL,
          splashImageUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
          splashBackgroundColor: '#ffffff',
        },
      },
    }),
  },
};

export default async function Home() {
  const pins = await blockchainService.getAllPins();
  // Sort: Newest first
  pins.sort((a, b) => b.fid - a.fid);

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <Header />

        <main className="mt-12 space-y-12">
          {/* Hero / CTA */}
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Programmable Social TV
            </h1>
            <p className="text-xl text-muted-foreground max-w-[600px]">
              Create dynamic, interactive widgets for Farcaster Frames and more. Powered by AI and Lit Protocol.
            </p>
            <div className="flex gap-4">
              <form action="/api/pins" method="POST">
                <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all h-12 px-8 text-lg">
                  <Zap className="mr-2 h-5 w-5 fill-current" /> Mint New Pin
                </Button>
              </form>
              <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-lg" asChild>
                <Link href="https://github.com/guy-do-or-die/pinv.app" target="_blank">
                  <Github className="mr-2 h-5 w-5" /> Source
                </Link>
              </Button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pins.map((pin) => (
              <Card key={pin.fid} className="group overflow-hidden border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold">{pin.title}</CardTitle>
                      <CardDescription className="font-mono text-xs mt-1">FID: {pin.fid}</CardDescription>
                    </div>
                    {/* Color Dot */}
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pin.accentColor }} />
                  </div>
                </CardHeader>
                <CardContent className="p-0 aspect-video relative bg-black/5">
                  {/* If we have a widget, try to show valid preview, else fallback */}
                  <img
                    src={`/api/og/p/${pin.fid}`}
                    alt={pin.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                </CardContent>
                <CardFooter className="p-4 bg-muted/10 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">@{pin.handle}</span>
                  </div>
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/p/${pin.fid}`}>
                      View <Edit className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {pins.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                No pins found. Mint one above!
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
