/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#ffffff',
        surface: '#f8f9fa',
        card:    '#ffffff',
        border:  '#e2e8f0',
        accent:  '#2563eb',       // blue primary
        success: '#16a34a',       // green
        danger:  '#dc2626',       // red
        warn:    '#d97706',       // amber
        muted:   '#64748b',
        text:    '#0f172a',
        subtext: '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
      }
    },
  },
  plugins: [],
}
