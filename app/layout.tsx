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
import { defaultMetadata } from "@/lib/metadata";

export const metadata: Metadata = defaultMetadata;

import { Providers } from "@/components/shared/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
