/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        military: {
          50: '#f0f7f0',
          100: '#d9ead9',
          200: '#b3d5b3',
          300: '#8cc08c',
          400: '#66ab66',
          500: '#2f6e2f',
          600: '#1a4d1a',
          700: '#0b3d0b',
          800: '#082d08',
          900: '#051d05',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
