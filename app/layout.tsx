import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/Toaster";
import SwBootstrap from "@/components/SwBootstrap";

export const metadata: Metadata = {
  title: "Ferngänse — Wohin als Nächstes?",
  description:
    "Reiseideen sammeln und Trips planen — für den Freundeskreis.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Ferngänse",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6efe2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          ["--font-sans" as never]: "Inter, ui-sans-serif, system-ui, sans-serif",
          ["--font-serif" as never]: "'Fraunces', Georgia, serif",
          ["--font-hand" as never]: "'Caveat', cursive",
        }}
      >
        <SwBootstrap />
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
