/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kinora: {
          bg: '#0c0f0d',
          surface: '#121714',
          card: '#151c17',
          cardHover: '#1a231d',
          cardBorder: '#232f27',
          neon: '#84cc16',
          neonHover: '#a3e635',
          neonLight: '#d9f99d',
          glow: 'rgba(132, 204, 22, 0.4)',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
