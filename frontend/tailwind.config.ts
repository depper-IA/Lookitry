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
      // Mission Control Colors (Mapped to CSS variables for dynamic themes)
      // ============================================================================
      colors: {
        accent: {
          DEFAULT: 'var(--color-accent)',
          dim: 'var(--color-accent-dim)',
          subtle: 'var(--color-accent-subtle)',
          bright: 'var(--color-accent-bright)',
        },
        dark: {
          DEFAULT: 'var(--bg-base)',
          card: 'var(--bg-card)',
          cardHover: 'var(--bg-hover)',
          surface: 'var(--bg-dark-surface)',
          overlay: 'var(--bg-dark-overlay)',
          input: 'var(--bg-input)',
        },
        warm: 'var(--color-warm)',
        
        // Status colors
        status: {
          online: '#00E5A0',
          busy: '#FFB547',
          offline: '#444444',
          critical: '#FF3A5C',
        },
        
        // Chart colors
        chart: {
          1: 'var(--color-accent)',
          2: '#00E5A0',
          3: '#FFB547',
          4: '#5C8AFF',
          5: '#BF5CFF',
        },
        
        // Border colors
        border: {
          subtle: 'var(--border-subtle)',
          active: 'var(--border-active)',
          accent: 'rgba(255,92,58,0.2)',
          glow: 'rgba(255,92,58,0.4)',
        },
        
        // Text colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--color-accent)',
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