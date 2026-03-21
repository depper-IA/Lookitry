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
    },
  },
  plugins: [],
};

export default config;
