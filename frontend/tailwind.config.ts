import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    { pattern: /^(flex-1|min-h-screen|min-h-\[90vh\]|overflow-hidden)$/ },
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
        third: '#3D923A', // Great Price badge
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        card: '0px 6px 24px rgba(0, 0, 0, 0.05)',
        'card-hover': '0px 10px 40px rgba(0, 0, 0, 0.08)',
        bookmark: '0px 10px 40px rgba(0, 0, 0, 0.05)',
      },
    },
  },
};

export default config;
