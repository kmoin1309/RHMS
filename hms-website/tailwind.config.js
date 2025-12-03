/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

const config = withMT({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6ACAFC",
        secondary: "#6CE6DD",
      },
    },
  },
  daisyui: {
    themes: ["light"],
  },
  plugins: [
    require('daisyui')
  ],
});
export default config
