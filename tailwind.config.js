/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        mist: "#f4f7fb",
        brand: "#625bf6",
      },
      boxShadow: {
        panel: "0 20px 45px -30px rgba(23, 32, 51, 0.35)",
      },
    },
  },
  plugins: [],
};
