/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-card': 'var(--bg-card)',
        'bg-raised': 'var(--bg-raised)',
        'bg-sidebar': 'var(--bg-sidebar)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        gold: 'var(--gold)',
        coral: 'var(--coral)',
        green: 'var(--green)',
        sky: 'var(--sky)',
        purple: 'var(--purple)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        math: 'var(--math)',
        science: 'var(--science)',
        english: 'var(--english)',
        history: 'var(--history)',
        geo: 'var(--geo)',
        hindi: 'var(--hindi)',
        bengali: 'var(--bengali)',
        cs: 'var(--cs)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
        'chip': '50px',
        'modal': '20px',
      }
    },
  },
  plugins: [],
}
