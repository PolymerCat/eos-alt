import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import "./globals.css";
//import 'maplibre-gl/dist/maplibre-gl.css';


const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Emergency OS - Flood Lookout",
  description: "Personalized location-based flood alerts and shelter navigation.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <header className="border-b border-border bg-panel/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-sm">
                  <span className="text-accent-foreground font-bold text-lg block leading-none select-none">E</span>
                </div>
                <Link href="/" className="font-bold text-lg text-foreground hover:opacity-80 transition-opacity">
                  Emergency <span className="text-accent opacity-90">OS</span>
                </Link>
              </div>
              <nav className="hidden md:flex space-x-2 font-medium text-sm mr-8">
                <Link href="/" className="px-4 py-2 text-foreground/80 hover:text-accent hover:bg-foreground/5 rounded-md transition-colors">
                  Overview
                </Link>
                <Link href="/map" className="px-4 py-2 text-foreground/80 hover:text-accent hover:bg-foreground/5 rounded-md transition-colors">
                  Map
                </Link>
              </nav>
              <AuthButton />
            </div>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              borderRadius: '8px',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </body>
    </html>
  );
}
