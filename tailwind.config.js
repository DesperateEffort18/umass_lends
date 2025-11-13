/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Crimson Pro', 'serif'],
        'body': ['DM Sans', 'sans-serif'],
        'accent': ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        // UMass Amherst Official Colors with CSS variables
        umass: {
          maroon: 'var(--color-maroon)',
          maroonDark: 'var(--color-maroon-dark)',
          maroonLight: 'var(--color-maroon-light)',
          white: '#FFFFFF',
          gray: '#4a4a4a',
          lightGray: '#f5f5f5',
          cream: 'var(--color-cream)',
          lightCream: 'var(--color-cream-light)',
          charcoal: 'var(--color-charcoal)',
          stone: 'var(--color-stone)',
          paper: 'var(--color-paper)',
          paperDark: 'var(--color-paper-dark)',
        },
      },
      backgroundImage: {
        'gradient-maroon': 'var(--gradient-maroon)',
        'gradient-paper': 'var(--gradient-paper)',
        'gradient-warm': 'var(--gradient-warm)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in': 'slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        fadeInUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-in': {
          'from': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          'to': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [],
}

