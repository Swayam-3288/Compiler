/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          dark: '#1e1e1e',
          darker: '#181818',
          sidebar: '#252526',
          border: '#333333',
          accent: '#007acc',
          hover: '#2a2d2e'
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'Consolas', 'Monaco', '"Courier New"', 'monospace']
      }
    },
  },
  plugins: [],
}
