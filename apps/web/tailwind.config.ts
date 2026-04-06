import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#F2EFE9",
        muted: "#8A8580",
        accent: "#7C3AED",
        border: "#222222",
        card: "#111111",
        "card-border": "#1E1E1E",
      },
      fontFamily: {
        heading: ['"Cormorant Garamond"', "serif"],
        body: ['"DM Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        "hero-xl": ["140px", { lineHeight: "1" }],
        "hero-lg": ["120px", { lineHeight: "1" }],
        hero: ["96px", { lineHeight: "1" }],
        display: ["64px", { lineHeight: "1.1" }],
        title: ["48px", { lineHeight: "1.15" }],
        subtitle: ["32px", { lineHeight: "1.2" }],
        "body-lg": ["18px", { lineHeight: "1.6" }],
        body: ["16px", { lineHeight: "1.6" }],
        small: ["14px", { lineHeight: "1.5" }],
        xs: ["12px", { lineHeight: "1.5" }],
        nav: ["11px", { lineHeight: "1" }],
      },
      letterSpacing: {
        wide: "0.2em",
        normal: "0.02em",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.9s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
