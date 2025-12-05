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

export const metadata: Metadata = {
  title: "PinV",
  description: "Dynamic pinned casts",
};

import MiniappProvider from "@/components/MiniappProvider";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
