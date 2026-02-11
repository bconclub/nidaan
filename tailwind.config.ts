import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nidaan: {
          bg: "#0A0F1C",
          card: "#1E293B",
          teal: "#0FCEAB",
          "teal-dark": "#0BA88A",
          white: "#F8FAFC",
          muted: "#94A3B8",
          emergency: "#EF4444",
          warning: "#F59E0B",
          routine: "#10B981",
        },
        clinical: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        medical: {
          light: "#f0f9ff",
          DEFAULT: "#0284c7",
          dark: "#075985",
        },
        severity: {
          low: "#22c55e",
          moderate: "#f59e0b",
          high: "#ef4444",
          critical: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        satoshi: ["Satoshi", "sans-serif"],
      },
      animation: {
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "pulse-ring-delay": "pulse-ring 2s ease-out 0.5s infinite",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "count-up": "fade-in 0.8s ease-out forwards",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
