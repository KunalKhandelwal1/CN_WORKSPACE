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
        background: '#09090b',
        foreground: '#fafafa',
        surface: '#18181b',
        accent: '#ffffff',
        success: '#e4e4e7',
        cubic: '#a1a1aa',
        newreno: '#52525b',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
