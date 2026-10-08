/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8f4', 100: '#d5eee3', 200: '#acdcc8', 300: '#79c3a6', 400: '#45a383',
          500: '#238667', 600: '#156c53', 700: '#115744', 800: '#0f4538', 900: '#0c382e', 950: '#062019',
        },
        khqr: { red: '#E1232E' },
      },
      fontFamily: {
        sans: ['Inter', 'Kantumruy Pro', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        khmer: ['Kantumruy Pro', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '5px', md: '5px', lg: '5px', xl: '5px', '2xl': '5px', '3xl': '5px',
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(15, 69, 56, .18)',
      },
    },
  },
  plugins: [],
}
