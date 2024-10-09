/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"MajorMonoDisplay"', "monospace"], // MajorMonoDisplay
        starjedi: ['"star jedi"', "sans-serif"], // Star Jedi
        starjediOutline: ['"star jedi outline"', "sans-serif"], // Star Jedi Outline
        pokemonSolid: ['"pokemon solid"', "sans-serif"], // Pokemon Solid
        pokemonHollow: ['"pokemon hollow"', "sans-serif"], // Pokemon Hollow
        pokemonInterface: ['"pokemon interface"', "sans-serif"], // Pokemon Interface
        halloween: ['"CF Halloween"', "sans-serif"], // CF Halloween
        dyslexic: ['"OpenDyslexic"', "sans-serif"],
      },
      animation: {
        "custom-pulse": "pulse-custom 1s infinite",
      },
      keyframes: {
        "pulse-custom": {
          "0%, 100%": { transform: "scale(1)", opacity: 1 },
          "50%": { transform: "scale(1.2)", opacity: 0.7 },
        },
      },
    },
  },
  plugins: [],
};
