import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        dp: {
          // All colors reference CSS variables so they respond to theme switching
          bg:           'var(--bg)',
          surface:      'var(--surface)',
          'surface-2':  'var(--surface-2)',
          border:       'var(--border)',

          // Accents — fixed colors, same in both themes
          accent:       '#E8547A',
          'accent-dim': '#C43D62',
          purple:       '#9B6DFF',
          'purple-dim': '#7C52E0',
          blue:         '#5B8DEF',
          success:      '#4ADE80',
          warning:      '#FBBF24',
          danger:       '#F87171',

          // Text — responds to theme
          text:         'var(--text)',
          muted:        'var(--text-muted)',
        }
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #E8547A 0%, #9B6DFF 100%)',
        'purple-gradient': 'linear-gradient(135deg, #9B6DFF 0%, #5B8DEF 100%)',
      },
      boxShadow: {
        'glow-pink':   '0 0 20px #E8547A30',
        'glow-purple': '0 0 20px #9B6DFF30',
        'card':        '0 4px 24px rgba(0,0,0,0.15)',
      }
    }
  },
  plugins: [],
}
export default config
