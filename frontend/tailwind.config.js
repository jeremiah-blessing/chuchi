/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        shell: '#0f1117',
        panel: '#161922',
        surface: '#1c1f2b',
        subtle: '#2a2e3d',
      },
    },
  },
  plugins: [],
};
