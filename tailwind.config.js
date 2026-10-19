/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saaa: {
          primary: '#1D4E89',     // Main Navy
          primaryHover: '#163B66',
          secondary: '#64748B',   // Slate gray
          lightBg: '#F8FAFC',
          cardBg: '#FFFFFF',
          border: '#E2E8F0',
          success: '#0F766E',     // Deep Teal
          warning: '#D97706',     // Amber
          danger: '#B91C1C',      // Red
          tableHeader: '#C6EFCE', // Morandi Excel Light Green
          zebra: '#F8FAFC',
          basic: '#F59E0B',       // Basic Level Amber
          mastery: '#64748B',     // Mastery Level Slate
          needsImprovement: '#2563EB' // Needs Improvement Blue
        }
      }
    },
  },
  plugins: [],
}
