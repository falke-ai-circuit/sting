/** @type {import'tailwindcss'.Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sting: {
          dark: '#0a0a0a',
          panel: '#111111',
          border: 'rgba(255,0,64,0.3)',
          accent: '#ff0040',
          danger: '#ff0040',
          warning: '#ff8800',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        2xl: '0',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
