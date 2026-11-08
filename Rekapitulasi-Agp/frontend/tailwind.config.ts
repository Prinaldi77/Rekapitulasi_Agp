import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark Forest Command Center Palette (#0C342C, #076653, #E3EF26)
        'forest-canvas': '#0C342C',
        'forest-card': '#082620',
        'forest-well': '#061C18',
        'emerald-surface': '#076653',
        'lime-pulse': '#E3EF26',
        'void-black': '#0C342C',
        ink: '#082620',
        obsidian: '#061C18',
        graphite: '#076653',
        smoke: '#7AA89C',
        ash: '#B8D8D0',
        mist: '#E3EF26',
        iron: '#076653',
        slate: {
          DEFAULT: '#076653',
          border: '#0d7a64',
        },
        'pure-white': '#ffffff',
        'coral-pulse': '#E3EF26',
        'ember-hush': '#076653',
        'electric-sky': '#38bdf8',
        'cobalt-edge': '#076653',
        'deep-space': '#061C18',
        'info-blue': '#38bdf8',
        'success-green': '#E3EF26',

        // Semantic Surface & Landing Page Tokens
        bg: '#0C342C',
        surface: '#082620',
        surface2: '#076653',
        textMain: '#ffffff',
        muted: '#B8D8D0',
        accent: '#E3EF26',
        focus: '#E3EF26',

        brand: {
          primary: {
            50: '#061C18',
            100: '#082620',
            500: '#076653',
            600: '#E3EF26',
            700: '#E3EF26',
            900: '#0C342C',
          },
        },
        neutral: {
          50: '#0C342C',
          100: '#082620',
          200: '#061C18',
          300: '#076653',
          400: '#0d7a64',
          500: '#4a8c7d',
          600: '#7AA89C',
          700: '#B8D8D0',
          800: '#E3EF26',
          900: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        bebas: ['var(--font-bebas)', 'sans-serif'],
        display: ['var(--font-bebas)', 'var(--font-sans)', 'sans-serif'],
      },
      borderRadius: {
        btn: '8px',
        card: '16px',
        'large-card': '20px',
        input: '8px',
        badge: '6px',
        pill: '9999px',
      },
      boxShadow: {
        'key-card':
          'rgba(227, 239, 38, 0.06) 0px 1px 0px 0px inset, rgba(7, 102, 83, 0.55) 0px 0px 0px 1px, rgba(0, 0, 0, 0.45) 0px -1px 0px 0px inset',
        'key-card-hover':
          'rgba(227, 239, 38, 0.14) 0px 1px 0px 0px inset, rgba(227, 239, 38, 0.4) 0px 0px 0px 1px, rgba(0, 0, 0, 0.55) 0px -1px 0px 0px inset',
        'key-btn':
          'rgba(0, 0, 0, 0.08) 0px 7px 3px 0px, rgba(0, 0, 0, 0.3) 0px 4px 4px 0px',
        'key-inset':
          'rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.5) 0px 2px 4px 0px inset',
      },
    },
  },
  plugins: [],
};

export default config;
