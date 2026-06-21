import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Sansita } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";


const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sansita = Sansita({//header
  subsets: ["latin"],
  weight: ['400', '700'],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Next Stop",
  description: "Personalized AI-powered travel planning and itinerary generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark h-full antialiased", geistSans.variable, geistMono.variable, inter.variable, sansita.variable)}
    >
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}