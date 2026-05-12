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
      // ============================================================================
      // Font Families
      // ============================================================================
      fontFamily: {
        jakarta: ['var(--font-jakarta)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
        tech: ['var(--font-tech)', 'monospace'],
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        display: ['var(--font-display)', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['var(--font-body)', 'DM Sans', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },

      // ============================================================================
      // Mission Control Colors
      // ============================================================================
      colors: {
        accent: {
          DEFAULT: '#FF5C3A',
          dim: 'rgba(255,92,58,0.4)',
          subtle: 'rgba(255,92,58,0.1)',
          bright: '#FF7A5C',
        },
        dark: {
          DEFAULT: '#0a0a0a',
          card: '#111111',
          cardHover: '#161616',
          surface: '#141414',
          overlay: '#0d0d0d',
          input: '#1a1a1a',
        },
        warm: '#f5f2ee',
        
        // Status colors
        status: {
          online: '#00E5A0',
          busy: '#FFB547',
          offline: '#444444',
          critical: '#FF3A5C',
        },
        
        // Chart colors
        chart: {
          1: '#FF5C3A',
          2: '#00E5A0',
          3: '#FFB547',
          4: '#5C8AFF',
          5: '#BF5CFF',
        },
        
        // Border colors
        border: {
          subtle: '#1e1e1e',
          active: '#2a2a2a',
          accent: 'rgba(255,92,58,0.2)',
          glow: 'rgba(255,92,58,0.4)',
        },
        
        // Text colors
        text: {
          primary: '#F0F0F0',
          secondary: '#888888',
          muted: '#666666',
          accent: '#FF5C3A',
          positive: '#00E5A0',
          negative: '#FF3A5C',
        },
      },

      // ============================================================================
      // Box Shadows (Glow effects)
      // ============================================================================
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
        '4xl': '0 50px 100px -20px rgba(0, 0, 0, 0.4)',
        'glow-accent': '0 0 20px rgba(255,92,58,0.4), 0 0 60px rgba(255,92,58,0.15)',
        'glow-online': '0 0 12px rgba(0,229,160,0.6)',
        'glow-busy': '0 0 12px rgba(255,181,71,0.6)',
        'glow-critical': '0 0 12px rgba(255,58,92,0.6)',
      },

      // ============================================================================
      // Animations
      // ============================================================================
      animation: {
        'pulse-status': 'pulseStatus 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        pulseStatus: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },

      // ============================================================================
      // Background Images (Grid)
      // ============================================================================
      backgroundImage: {
        'grid-accent': 'linear-gradient(rgba(255,92,58,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,92,58,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-accent': '40px 40px',
      },
    },
  },
  plugins: [],
};

export default config;