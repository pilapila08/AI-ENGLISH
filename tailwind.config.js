/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#e7ecff",
        mist: "#050711",
        brand: "#8b5cf6",
      },
      boxShadow: {
        panel: "0 20px 55px -32px rgba(0, 0, 0, 0.85)",
      },
    },
  },
  plugins: [],
};
