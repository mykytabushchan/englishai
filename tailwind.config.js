/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg: '#0C0F1A',
        surface: '#141829',
        surface2: '#1E2438',
        accent: '#7C6AF7',
        accent2: '#4ECDC4',
      },
    },
  },
  plugins: [],
}
