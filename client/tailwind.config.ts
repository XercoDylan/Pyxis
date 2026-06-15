import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A1A1A',
          50: '#F5F5F5',
          100: '#E8E8E8',
          200: '#D1D1D1',
          300: '#A3A3A3',
          400: '#737373',
          500: '#4A4A4A',
          600: '#333333',
          700: '#2A2A2A',
          800: '#1A1A1A',
          900: '#0D0D0D',
          950: '#000000',
        },
        gold: {
          DEFAULT: '#C5A028',
          50: '#FDF8E8',
          100: '#FAEFC5',
          200: '#F5DF8A',
          300: '#EDCF50',
          400: '#D4B230',
          500: '#C5A028',
          600: '#A6861F',
          700: '#866B18',
          800: '#6B5514',
          900: '#4A3B0E',
          950: '#2E2509',
        },
        neutral: {
          DEFAULT: '#E5E5E5',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        success: '#22C55E',
        warning: '#EAB308',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};

export default config;
