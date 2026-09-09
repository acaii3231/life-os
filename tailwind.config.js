/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#06080F',
          900: '#0B0F19',
          850: '#111726',
          800: '#161F33',
          700: '#1F2B48',
          600: '#2E3E66',
        },
        primary: {
          50: '#f0fdf4',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        cyber: {
          blue: '#0ea5e9',
          purple: '#8b5cf6',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e'
        }
      },
      boxShadow: {
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
        'glow-cyan': '0 0 20px -5px rgba(14, 165, 233, 0.4)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.4)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.4)',
      }
    },
  },
  plugins: [],
}
