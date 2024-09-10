/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "main-bg": "url('bg.png')",
      },
      backgroundColor: {
        "bg-pink": "#FF70F5",
        "light-purupe": "#CC90E4",
        "dark-purupe": "#923CB4",

        "light-pink": "#F9D4FF",
        "bg-white": "rgb(249, 248, 253,0.5)",
      },
      fontFamily: {
        "ge-black": ["GEFontBlack", "sans-serif"],
        "ge-bold": ["GEFontBold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
