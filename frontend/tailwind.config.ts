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
        // Brand Colors
        brand: {
          green: {
            DEFAULT: "#1B3A2D",
            light: "#2D5A45",
            dark: "#0F2419",
          },
          brown: {
            DEFAULT: "#6B4226",
            light: "#8B6240",
            dark: "#4A2E1A",
          },
          gold: {
            DEFAULT: "#C4A265",
            light: "#D4B87A",
            dark: "#A88A50",
          },
          cream: {
            DEFAULT: "#FAF8F5",
            dark: "#F0EDE8",
          },
        },
        // Semantic Colors
        charcoal: "#1A1A1A",
        warmgrey: {
          DEFAULT: "#E8E4DF",
          light: "#F5F3F0",
          dark: "#D1CCC6",
        },
        sage: "#8BA888",
        brass: "#B8860B",
        terracotta: "#C17F59",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        heading: ["Playfair Display", "Georgia", "serif"],
        body: ["DM Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        accent: ["Caveat", "cursive"],
      },
      fontSize: {
        "display-xl": ["clamp(3rem, 8vw, 6rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "heading-lg": ["clamp(1.5rem, 3vw, 2.25rem)", { lineHeight: "1.2" }],
        "heading-md": ["clamp(1.25rem, 2.5vw, 1.75rem)", { lineHeight: "1.3" }],
        "heading-sm": ["clamp(1.1rem, 2vw, 1.35rem)", { lineHeight: "1.4" }],
      },
      spacing: {
        "section": "clamp(4rem, 10vw, 8rem)",
        "section-sm": "clamp(2rem, 5vw, 4rem)",
      },
      borderRadius: {
        "organic": "1rem",
        "organic-lg": "1.5rem",
        "organic-xl": "2rem",
      },
      boxShadow: {
        "soft": "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        "medium": "0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.05)",
        "elevated": "0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 50px -15px rgba(0, 0, 0, 0.1)",
        "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
        "smooth-in": "cubic-bezier(0.55, 0, 1, 0.45)",
        "smooth-out": "cubic-bezier(0, 0.55, 0.45, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.5s ease forwards",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      backgroundImage: {
        "grain": "url('/textures/grain.svg')",
        "gradient-warm": "linear-gradient(135deg, #FAF8F5 0%, #F0EDE8 100%)",
        "gradient-brand": "linear-gradient(135deg, #1B3A2D 0%, #2D5A45 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
