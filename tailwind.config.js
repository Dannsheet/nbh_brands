/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx}",
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0e0e0e",    // negro oscuro (fondo)
        secondary: "#FFC700", // amarillo (resaltado)
        accent: "#FFFFFF",    // blanco (texto)
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        bebas: ["Bebas Neue", "cursive"],
      },
    },
  },
  plugins: [],
};
