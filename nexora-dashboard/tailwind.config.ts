import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "Geist", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: { obsidian: "#030712", ink: "#090d16" },
    },
  },
  plugins: [],
} satisfies Config;
