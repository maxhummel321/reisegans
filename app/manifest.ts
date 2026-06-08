import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ferngänse — Reiseplanung",
    short_name: "Ferngänse",
    description: "Reiseideen sammeln und Trips planen.",
    start_url: "/trips",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6efe2",
    theme_color: "#f6efe2",
    lang: "de",
    categories: ["travel", "lifestyle", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
