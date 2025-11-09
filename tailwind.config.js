/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UMass Amherst Official Colors
        umass: {
          maroon: '#881c1c',      // Primary UMass Maroon
          maroonDark: '#6b1515',  // Darker maroon for hover states
          maroonLight: '#a02424', // Lighter maroon
          white: '#FFFFFF',
          gray: '#4a4a4a',        // Dark gray for text
          lightGray: '#f5f5f5',   // Light gray for backgrounds
          cream: '#fef5e7',       // Light cream for text on maroon backgrounds
          lightCream: '#fff8f0',  // Very light cream for text
        },
      },
    },
  },
  plugins: [],
}

