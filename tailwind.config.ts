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
        harvest: {
          green: "#2d5a27",
          lime: "#7cb342",
          cream: "#f5f0e8",
          earth: "#8d6e63",
        },
      },
    },
  },
  plugins: [],
};
export default config;
