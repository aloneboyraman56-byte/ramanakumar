/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: { ink: '#0a0b14', panel: '#111322', lavender: '#a397ff', aqua: '#61e5df' },
      boxShadow: { glow: '0 0 50px rgba(163,151,255,.16)' },
    },
  },
  plugins: [],
}
