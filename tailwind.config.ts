import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Avalon theme colors - medieval fantasy aesthetic
        avalon: {
          gold: "#D4AF37",
          crimson: "#8B0000",
          navy: "#1A1A2E",
          midnight: "#0F0F1A",
          silver: "#C0C0C0",
          parchment: "#F5F0E1",
        },
        good: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#1D4ED8",
        },
        evil: {
          DEFAULT: "#DC2626",
          light: "#F87171",
          dark: "#991B1B",
        },
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        body: ["Crimson Text", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
