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
        // Avalon theme - Dark theme, colorblind-friendly
        // Uses blue/orange primary contrast (works for deuteranopia/protanopia)
        avalon: {
          // Primary accent - warm gold/amber
          gold: "#F59E0B",        // Amber-500 - high visibility
          "gold-light": "#FBBF24", // Amber-400
          "gold-dark": "#D97706",  // Amber-600
          
          // Background colors - consistent dark theme
          midnight: "#0f172a",     // Slate-900 - darkest background
          navy: "#1e293b",         // Slate-800 - card backgrounds
          "dark-lighter": "#334155", // Slate-700 - elevated surfaces
          "dark-border": "#475569", // Slate-600 - borders
          
          // Text colors - high contrast
          text: "#f8fafc",         // Slate-50 - primary text
          "text-secondary": "#e2e8f0", // Slate-200 - secondary text
          "text-muted": "#94a3b8",  // Slate-400 - muted text
          
          // Accent colors (colorblind-friendly)
          accent: "#3b82f6",       // Blue-500 - primary action
          "accent-hover": "#2563eb", // Blue-600 - hover state
          
          // Legacy support - map old names
          crimson: "#ef4444",      // Red-500
          silver: "#94a3b8",       // Slate-400
          parchment: "#f8fafc",    // Slate-50 (now light text on dark)
        },
        // Colorblind-friendly team colors
        // Blue for Good (visible to all types of colorblindness)
        // Orange for Evil (distinct from blue for all types)
        good: {
          DEFAULT: "#0ea5e9",      // Sky-500 - cyan-blue
          light: "#38bdf8",        // Sky-400
          dark: "#0284c7",         // Sky-600
        },
        evil: {
          DEFAULT: "#f97316",      // Orange-500 - distinct from blue
          light: "#fb923c",        // Orange-400
          dark: "#ea580c",         // Orange-600
        },
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
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
