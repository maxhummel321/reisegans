import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      colors: {
        // Travel paper system — warmer, "fernweh" palette, distinct from
        // Gänsemünchen's Bavarian cream world.
        ink: "#22201b", // warm near-black
        cream: "#f6efe2", // page background
        paper: "#fdf8ee", // card surface
        sand: "#e8dcc4", // muted fill
        // Accents
        terracotta: "#c8623f", // primary accent (stamps, CTAs)
        terracottaInk: "#7d3a22",
        ocean: "#2f7e84", // teal — water, sea
        oceanInk: "#1d4f53",
        palm: "#5d8a4c", // nature/hike green
        sunshine: "#e8b13e", // highlight / sunny accent
        rose: "#c75c5c",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(34,32,27,0.04), 0 12px 30px rgba(34,32,27,0.07)",
        sticker: "0 2px 0 rgba(34,32,27,0.08), 0 8px 24px rgba(34,32,27,0.09)",
        stamp: "0 0 0 2px rgba(200,98,63,0.25), 0 2px 8px rgba(34,32,27,0.08)",
      },
      backgroundImage: {
        // Subtle postcard / sun-washed grain
        "paper-grain":
          "radial-gradient(ellipse 70% 30% at 10% 0%, rgba(200,98,63,0.07), transparent 60%), radial-gradient(ellipse 60% 30% at 90% 10%, rgba(47,126,132,0.06), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
