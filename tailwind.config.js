import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.{js,ts,jsx,tsx,blade.php}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui({
    addCommonColors: true,
    layout: {
      radius: {
        small: "4px",
        medium: "6px", 
        large: "8px",
      },
    },
    themes: {
      light: {
        colors: {
          background: "#FFFFFF",
          foreground: "#11181C",
          primary: {
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
            DEFAULT: "#3b82f6",
            foreground: "#ffffff",
          },
        },
      },
      dark: {
        colors: {
          background: "#000000",
          foreground: "#ECEDEE",
          primary: {
            50: "#0c1220",
            100: "#111827",
            200: "#1f2937", 
            300: "#374151",
            400: "#4b5563",
            500: "#6b7280",
            600: "#9ca3af",
            700: "#d1d5db",
            800: "#e5e7eb",
            900: "#f3f4f6",
            DEFAULT: "#3b82f6",
            foreground: "#ffffff",
          },
        },
      },
    },
  })],
};
