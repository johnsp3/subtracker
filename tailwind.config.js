/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C5DD3',
        background: '#F7F6FB',
        textDark: '#1B1C31',
        success: '#7FBA7A',
        error: '#FF4B55',
      },
    },
  },
  plugins: [],
} 