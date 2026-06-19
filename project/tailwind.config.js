/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#ffffff',
        ink: '#0a0a0a',
        dim: '#525252',
        muted: '#a3a3a3',
        border: '#e5e5e5',
        surface: '#fafafa',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        tags: '32px',
        cards: '16px',
        buttons: '12px',
        feature: '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
        elevated: '0 8px 32px rgba(0,0,0,0.08)',
      },
      maxWidth: {
        page: '1200px',
      },
    },
  },
  plugins: [],
};
