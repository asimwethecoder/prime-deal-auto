import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        brand: ['var(--font-bebas-neue)', 'sans-serif'],
      },
      colors: {
        primary: '#050B20',
        secondary: '#405FF2',
        'bg-1': '#F9FBFC',
        border: '#E1E1E1',
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        card: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0px 6px 24px rgba(0, 0, 0, 0.05)',
        'bookmark': '0px 10px 40px rgba(0, 0, 0, 0.05)',
      },
    },
  },
};

export default config;
