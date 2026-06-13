import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'serenify-peach': '#FDE8D8',
        'serenify-mint': '#A8D8C8',
        'serenify-lavender': '#C9B8E8',
        'serenify-white': '#FAFAFA',
        'serenify-charcoal': '#2D2D2D',
      },
      borderRadius: {
        serenify: '24px',
        'serenify-lg': '32px',
      },
      boxShadow: {
        soft: '0 18px 50px -30px rgba(45, 45, 45, 0.35)',
      },
    },
  },
  plugins: [],
}

export default config
