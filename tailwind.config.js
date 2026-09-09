/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./server/views/**/*.{html,ejs,js}"
  ],
  theme: {
    extend: {
      colors: {
        silk: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F5EFEB',
          300: '#EDE4DC',
          400: '#DED1C4',
        },
        rose: {
          gold: {
            50: '#FAF3ED',
            100: '#F4E3D7',
            200: '#E8C5A5',
            300: '#DCA782',
            400: '#D4A373',
            500: '#C59B7E',
            600: '#B08264',
            700: '#8C6248',
          },
          blush: {
            50: '#FDF7F5',
            100: '#FAF0ED',
            200: '#F4E0DA',
            300: '#EBCDC4',
            400: '#E0B5A8',
            500: '#D39C8D',
          }
        },
        sage: {
          50: '#F3F7F4',
          100: '#E4EDE5',
          200: '#C8DACB',
          300: '#A7C3AC',
          400: '#8BAF91',
          500: '#7E9F85',
          600: '#64826B',
        },
        mauve: {
          50: '#FAF5F8',
          100: '#F3E9F0',
          200: '#E5D1DF',
          300: '#D0ADC6',
          400: '#B98BAF',
          500: '#A8829F',
          600: '#8A6782',
        },
        graphite: {
          50: '#F6F6F6',
          100: '#E7E7E7',
          200: '#D1D1D1',
          300: '#B0B0B0',
          400: '#888888',
          500: '#6E675F',
          600: '#524D47',
          700: '#3D3833',
          800: '#2D2926',
          900: '#1A1816',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(197, 155, 126, 0.08), 0 4px 6px -2px rgba(197, 155, 126, 0.04)',
        'soft-md': '0 4px 20px -2px rgba(197, 155, 126, 0.12), 0 2px 8px -1px rgba(197, 155, 126, 0.06)',
        'soft-lg': '0 10px 25px -3px rgba(197, 155, 126, 0.16), 0 4px 12px -2px rgba(197, 155, 126, 0.08)',
        'glow': '0 0 20px rgba(197, 155, 126, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        'modal': '99999',
      }
    },
  },
  plugins: [],
}
