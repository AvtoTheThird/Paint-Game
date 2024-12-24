/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      textShadow: {
        "1px-black":
          "1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black",
      },
      backgroundImage: {
        "main-bg": "url('background.png')",
      },
      backgroundColor: {
        "bg-pink": "rgba(255,53,245,0.85)",

        "bg-pink-opacity": "rgba(255, 112, 245, 0.8)",
        "transparant-blabk": "rgba(0, 0, 0, 0.65)",

        "modal-pink": "#AB41D4",
        "light-purupe": "#CC90E4",
        "dark-purupe": "#923CB4",
        "light-pink": "#FFA4E4",
        "bg-white": "rgb(249, 248, 253,0.3)",
        "button-background-1": "#7337FF",
        "button-background-2": "#61B1F1",
        "button-background-3": "#857DF5",
        "bg-black": "rgb(0, 0, 0,0.3)",
      },
      fontFamily: {
        "ge-black": ["GEFontBlack", "sans-serif"],
        "ge-bold": ["GEFontBold", "sans-serif"],
      },
      gridTemplateColumns: {
        13: "repeat(13, minmax(0, 1fr))",
      },
      colors: {
        "black-70": "rgba(0, 0, 0, 0.7)",
      },
      textColor: {
        pink: "#FF70F5",
        "light-pink": "#FFA4E4",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".text-shadow": {
          "text-shadow":
            "1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black",
        },
      });
    },
  ],
};
