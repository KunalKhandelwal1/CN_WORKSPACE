import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        foreground: '#ffffff',
        surface: '#111118',
        accent: '#3b82f6',
        success: '#22c55e',
        cubic: '#f59e0b',
        newreno: '#a855f7',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
