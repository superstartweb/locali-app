import type { Metadata, Viewport } from "next";
import "./globals.css";

// Next.js troverà automaticamente manifest.ts e favicon.ico/icon.png
export const metadata: Metadata = {
  title: "Figli delle Stelle ✨",
  description: "I miei locali preferiti",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stelle",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="antialiased">{children}</body>
    </html>
  );
}