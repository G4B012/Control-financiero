/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        wine: "#5A0F0F",
        wine2: "#7F2626",
        rose: "#FFECEC",
        nude: "#FFF6F6",
        nude2: "#FFF0EF",
        coral: "#FF6B6B",
        peach: "#FFB199",
        mint: "#2ECC71",
        sky: "#5DADE2",
        grape: "#9B59B6",
        sun: "#F1C40F"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(90, 15, 15, 0.10)",
      }
    },
  },
  plugins: [],
}
