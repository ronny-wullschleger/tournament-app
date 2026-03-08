/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e17",
        surface: "#111827",
        surfaceAlt: "#1a2235",
        border: "#1e293b",
        accent: "#22d3ee",
        gold: "#f59e0b",
        green: "#10b981",
        red: "#ef4444",
        textPrimary: "#f1f5f9",
        textSecondary: "#94a3b8",
        textDim: "#475569",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Playfair Display'", "serif"],
      },
    },
  },
  plugins: [],
}
