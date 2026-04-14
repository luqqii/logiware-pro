/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ShipStation-inspired design system
        primary: {
          DEFAULT: '#00D26E',      // Bright green (CTA)
          hover: '#00B85E',
          dark: '#00994D',
        },
        navy: {
          DEFAULT: '#120B3C',      // Deep navy (headings, footer)
          light: '#1A1250',
        },
        accent: {
          DEFAULT: '#645BFF',      // Electric purple (links, accents)
          hover: '#5549EE',
        },
        surface: {
          white: '#FFFFFF',
          'light-green': '#F0FAF2',
          'light-purple': '#F0EEFF',
          'light-gray': '#F8F9FA',
          'border': '#E5E7EB',
        },
        text: {
          primary: '#120B3C',
          muted: '#555555',
          light: '#888888',
        },
        severity: {
          critical: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
          success: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        pill: '999px',
        card: '12px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
        form: '0 4px 20px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
