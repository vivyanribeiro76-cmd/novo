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
          DEFAULT: '#1e90ff',
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80c1ff',
          300: '#4da8ff',
          400: '#1e90ff',
          500: '#0077e6',
          600: '#005bb3',
          700: '#004080',
          800: '#00264d',
          900: '#000d1a',
        },
        dark: {
          DEFAULT: '#0a0a0a',
          50: '#1a1a1a',
          100: '#141414',
          200: '#0f0f0f',
          300: '#0a0a0a',
        },
      },
      backgroundColor: {
        'dark-primary': '#0a0a0a',
        'dark-secondary': '#141414',
        'dark-card': '#1a1a1a',
      },
    },
  },
  plugins: [],
}
