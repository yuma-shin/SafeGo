import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#fafafa", 100: "#f3f3f3", 200: "#e5e5e5", 300: "#d4d4d4",
          400: "#737373", 500: "#666666", 600: "#525252", 700: "#404040",
          800: "#303030", 900: "#202020", 950: "#171717",
        },
      },
    },
  },
  plugins: [],
};

export default config;
