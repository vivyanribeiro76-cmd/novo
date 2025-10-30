/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#5b8cff',
          50: '#eef3ff',
          100: '#dae5ff',
          200: '#b4caff',
          300: '#8eafff',
          400: '#6994ff',
          500: '#5b8cff',
          600: '#2f6cff',
          700: '#1b55e6',
          800: '#163fb4',
          900: '#112b82',
        },
      },
    },
  },
  plugins: [],
}
