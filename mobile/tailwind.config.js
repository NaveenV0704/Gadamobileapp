/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#1877F2", // your blue
        textPrimary: "#111827", // near black
        textMuted: "#6B7280", // grey
        borderDefault: "#D1D5DB", // border grey
        cardBg: "#FFFFFF",
      },
    },
  },
  plugins: [],
};
