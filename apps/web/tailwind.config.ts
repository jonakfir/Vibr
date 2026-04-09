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
        background: "#000000",
        foreground: "#F2EFE9",
        card: {
          DEFAULT: "#111111",
          border: "#1E1E1E",
        },
        border: "#222222",
        muted: "#8A8580",
        accent: "#7C3AED",
      },
      fontFamily: {
        heading: ['"Cormorant Garamond"', "serif"],
        body: ['"DM Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        hero: ["96px", { lineHeight: "1" }],
        "hero-lg": ["120px", { lineHeight: "1" }],
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
        normal: "0.02em",
        wide: "0.2em",
        wider: "0.05em",
        widest: "0.1em",
      },
    },
  },
  plugins: [],
};
export default config;
