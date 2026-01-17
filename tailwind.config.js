/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        grayePurple: '#6B4EFF',
        grayeOrange: '#FF8C00',
        grayeSurface: '#F5F5F7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
