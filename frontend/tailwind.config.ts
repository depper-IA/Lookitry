import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['var(--font-jakarta)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
        tech: ['var(--font-tech)', 'monospace'],
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
      },
      colors: {
        accent: '#FF5C3A',
        dark: '#0a0a0a',
        warm: '#f5f2ee',
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
        '4xl': '0 50px 100px -20px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
