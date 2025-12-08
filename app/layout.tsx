import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = localFont({
  src: "../public/fonts/Orbitron Regular.woff2",
  variable: "--font-orbitron",
});

import { NEXT_PUBLIC_APP_URL, APP_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: APP_CONFIG.defaultTitle,
  description: APP_CONFIG.description,
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: APP_CONFIG.title,
    description: APP_CONFIG.description,
    images: [`${NEXT_PUBLIC_APP_URL}/icon.png`],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: APP_CONFIG.iconUrl,
      button: {
        title: `Launch ${APP_CONFIG.title}`,
        action: {
          type: 'launch_miniapp',
          name: APP_CONFIG.title,
          url: NEXT_PUBLIC_APP_URL,
          splashImageUrl: APP_CONFIG.iconUrl,
          splashBackgroundColor: APP_CONFIG.splashBackgroundColor,
        },
      },
    }),
    'fc:frame': JSON.stringify({
      version: '1',
      imageUrl: APP_CONFIG.iconUrl,
      button: {
        title: `Launch ${APP_CONFIG.title}`,
        action: {
          type: 'launch_frame',
          name: APP_CONFIG.title,
          url: NEXT_PUBLIC_APP_URL,
          splashImageUrl: APP_CONFIG.iconUrl,
          splashBackgroundColor: APP_CONFIG.splashBackgroundColor,
        },
      },
    }),
  },
};

import MiniappProvider from "@/components/MiniappProvider";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}
      >
        <MiniappProvider>
          <Providers>
            {children}
          </Providers>
        </MiniappProvider>
      </body>
    </html>
  );
}
