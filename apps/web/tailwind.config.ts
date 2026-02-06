import type { Config } from "tailwindcss";
import rtl from "tailwindcss-rtl";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Heebo", "Assistant", "Rubik", "Arial", "Helvetica", "sans-serif"],
      },
      colors: {
        bayit: {
          50: "#fff8f0", 100: "#fff0db", 200: "#ffddb6", 300: "#ffc587",
          400: "#ffa656", 500: "#ff8c35", 600: "#f06c1a", 700: "#c75414",
          800: "#9f4317", 900: "#813915",
        },
      },
    },
  },
  plugins: [rtl],
};

export default config;
