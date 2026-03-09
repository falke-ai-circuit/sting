/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0a0a',
          dark: '#111111',
          darker: '#1a1a1a',
          gray: '#2a2a2a',
          'gray-light': '#3a3a3a',
          red: '#ff0040',
          'red-dark': '#cc0033',
          purple: '#8b5cf6',
          'purple-dark': '#7c3aed',
          'purple-light': '#a78bfa',
          green: '#00ff88',
          'green-dark': '#00cc6a',
          blue: '#00d4ff',
          'blue-dark': '#00a8cc',
        },
      },
      fontFamily: {
        terminal: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        md: '4px',
      },
      boxShadow: {
        cyber: '0 0 10px rgba(255, 0, 64, 0.3)',
        'cyber-purple': '0 0 10px rgba(139, 92, 246, 0.3)',
      },
      animation: {
        'pulse-cyber': 'pulse-cyber 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-cyber': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 5px rgba(255, 0, 64, 0.5)' },
          '50%': { opacity: '.8', boxShadow: '0 0 20px rgba(255, 0, 64, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
