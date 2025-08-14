/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        creator: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'camera-flash': 'cameraFlash 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        cameraFlash: {
          '0%': { backgroundColor: 'white', opacity: '0' },
          '50%': { backgroundColor: 'white', opacity: '0.8' },
          '100%': { backgroundColor: 'white', opacity: '0' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      screens: {
        'xs': '475px',
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
      },
      backdropBlur: {
        'xs': '2px',
      },
      aspectRatio: {
        'story': '9 / 16',
        'post': '1 / 1',
        'landscape': '16 / 9',
      }
    },
  },
  plugins: [
    function({ addUtilities, addComponents }) {
      addUtilities({
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.safe-area-inset': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.camera-viewfinder': {
          'border': '2px solid white',
          'border-radius': '12px',
          'box-shadow': '0 0 0 2px rgba(0,0,0,0.3)',
        },
      })
      
      addComponents({
        '.creator-btn': {
          '@apply px-6 py-3 rounded-xl font-semibold transition-all duration-200 touch-manipulation': {},
          '@apply focus:outline-none focus:ring-2 focus:ring-offset-2': {},
          '@apply active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed': {},
          'min-height': '48px',
        },
        '.creator-btn-primary': {
          '@apply creator-btn bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500': {},
          '@apply shadow-lg hover:shadow-xl': {},
        },
        '.creator-btn-secondary': {
          '@apply creator-btn bg-white text-primary-600 border-2 border-primary-500 hover:bg-primary-50 focus:ring-primary-500': {},
        },
        '.creator-card': {
          '@apply bg-white rounded-2xl shadow-sm border border-gray-100': {},
          '@apply transition-all duration-200': {},
        },
        '.media-preview': {
          '@apply rounded-xl overflow-hidden shadow-lg': {},
          '@apply border-2 border-gray-200': {},
        },
      })
    }
  ],
}