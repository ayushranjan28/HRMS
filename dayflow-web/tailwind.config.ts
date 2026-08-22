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
        background: "#F1EFE9", 
        surface: "#FFFFFF",
        sidebar: {
          DEFAULT: "#2B2E33", 
          active: "#727D56",  
          hover: "#393D45",
        },
        text: {
          primary: "#1A1A1A",
          secondary: "#6B7280",
        },
        brand: {
          green: "#4CAF50",
          orange: "#F97316",
          purple: "#A855F7",
          pink: "#F43F5E",
          blue: "#3B82F6",
        },
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;
