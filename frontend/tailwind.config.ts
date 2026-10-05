import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'yukti': {
          'amber': '#F59E0B',
          'amber-light': '#FBBF24',
          'amber-dark': '#D97706',
          'gold': '#EAB308',
          'bg': '#0A0E1A',
          'bg-elevated': '#111827',
          'bg-card': '#1F2937',
          'bg-hover': '#374151',
          'border': '#374151',
          'border-light': '#4B5563',
          'text': '#F9FAFB',
          'text-secondary': '#9CA3AF',
          'text-muted': '#6B7280',
          'cyan': '#06B6D4',
          'teal': '#14B8A6',
          'indigo': '#6366F1',
          'rose': '#F43F5E',
        }
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, rgba(245,158,11,0.03) 0%, transparent 50%, rgba(6,182,212,0.03) 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, transparent 70%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-amber': '0 0 20px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.1)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.3), 0 0 40px rgba(6,182,212,0.1)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      }
    },
  },
  plugins: [],
}
export default config
