import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SettingsProvider } from "@/components/ThemeContext";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gameverse.gg"),
  title: {
    default: "GameVerse — 20 free browser games, leaderboards and achievements",
    template: "%s · GameVerse",
  },
  description:
    "GameVerse is a playable arcade platform: 20 original HTML5 games across 14 categories, with global leaderboards, XP and levelling, achievements, daily challenges, reviews and a full-screen CRT cabinet mode.",
  keywords: [
    "browser games",
    "free games",
    "arcade",
    "HTML5 games",
    "puzzle games",
    "shooter games",
    "racing games",
    "leaderboard",
    "GameVerse",
  ],
  openGraph: {
    title: "GameVerse — the cabinet is always on",
    description: "20 playable browser games, global leaderboards, XP, achievements and daily challenges.",
    type: "website",
    images: ["/images/hero-marquee.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "GameVerse — the cabinet is always on",
    description: "20 playable browser games, global leaderboards, XP, achievements and daily challenges.",
    images: ["/images/hero-marquee.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0B0B12",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" data-theme={user?.theme ?? "dark"} data-motion="on" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SettingsProvider
          initial={{ theme: (user?.theme as "dark" | "light") ?? "dark", sound: user?.sound ?? true, motion: user?.motion ?? true }}
        >
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
