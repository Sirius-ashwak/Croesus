import type { Config } from "tailwindcss";

/**
 * Croesus design system — PRD §2.
 * Rules: no gradients, no radius >4px on data components, no gratuitous animation.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#000000",
          surface: "#0A0A0A",
          elevated: "#111111",
          overlay: "#1A1A1A",
        },
        border: {
          subtle: "#222222",
          DEFAULT: "#333333",
        },
        gold: {
          DEFAULT: "#D4AF37",
          primary: "#D4AF37",
          muted: "#A08828",
          subtle: "#1A1500",
        },
        text: {
          primary: "#F0F0F0",
          secondary: "#888888",
          tertiary: "#444444",
        },
        safe: "#22C55E",
        warning: "#EAB308",
        danger: "#EF4444",
      },
      boxShadow: {
        "gold-glow": "0 0 0 3px #D4AF3720",
        "danger-glow": "0 0 0 3px #EF444420",
      },
      backgroundColor: {
        "danger-glow": "#EF444420",
        "gold-glow": "#D4AF3720",
      },
      borderRadius: {
        // Data components cap at 4px (§2.1 rule 2).
        DEFAULT: "4px",
        card: "4px",
      },
      fontFamily: {
        // Wired to next/font CSS variables in app/layout.tsx.
        hero: ["var(--font-cormorant)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      fontSize: {
        metric: ["48px", { lineHeight: "1", fontWeight: "700" }],
        hero: ["80px", { lineHeight: "1", letterSpacing: "-1px", fontWeight: "300" }],
      },
    },
  },
  plugins: [],
};

export default config;
