import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        mise: {
          'deep':   '#1B4332',
          'mid':    '#2D6A4F',
          'fresh':  '#52B788',
          'gold':   '#D4A017',
          'cream':  '#F8F4E3',
          'ink':    '#1C2B24',
        },
      },
      fontFamily: {
        sans:    ['var(--font-hanken)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
