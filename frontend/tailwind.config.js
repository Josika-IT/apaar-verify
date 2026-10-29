/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aicte: {
          navy: '#002244',
          blue: '#003366',
          lightBlue: '#e6f0fa',
          saffron: '#FF9933',
          saffronDark: '#D97706',
          green: '#138808',
          greenDark: '#0E6606',
          gold: '#C59B27'
        }
      }
    },
  },
  plugins: [],
}
