/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1e3a5f',
        terracotta: '#c97b5d',
        cream: '#faf5eb',
        charcoal: '#0c1b30',
        mustard: '#e8b04e',
        'navy-light': '#2a4d7a',
        'navy-dark': '#152b47',
        'terracotta-light': '#d99575',
        'cream-dark': '#f0e8d8',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        heading: ['Nunito', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '3rem',
        '5xl': '4rem',
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
      },
    },
  },
  plugins: [],
}
