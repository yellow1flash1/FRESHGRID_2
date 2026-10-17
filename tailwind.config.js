/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Merriweather"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        parchment: { 50: '#FBF9F3', 100: '#F7F4EB', 200: '#EFECE1', 300: '#E4E0D2' },
        forest: {
          50: '#E8F0EA', 100: '#D1E0D4', 200: '#A7C3AC', 300: '#6E9A77',
          400: '#3D7A4E', 500: '#2D6A4F', 600: '#1B4332', 700: '#163A2B',
          800: '#112E22', 900: '#0C2218',
        },
        gold: {
          50: '#FBF3E4', 100: '#F5E6C8', 200: '#EAD0A0', 300: '#D4A373',
          400: '#B08938', 500: '#9A7730', 600: '#7E6128', 700: '#5E491D',
        },
        profit: '#15803D',
        warn: '#B45309',
        alert: '#B91C1C',
        ink: '#1A1A1A',
        mute: '#6B6557',
      },
      boxShadow: {
        card: '0 1px 3px rgba(27,67,50,0.06), 0 4px 14px rgba(27,67,50,0.07)',
        pop: '0 10px 36px rgba(27,67,50,0.14)',
        seal: '0 2px 8px rgba(176,137,56,0.25)',
      },
      borderRadius: { xl2: '1.25rem', xl3: '1.5rem' },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'slide-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        'laser': { '0%': { top: '8%' }, '50%': { top: '88%' }, '100%': { top: '8%' } },
        'marquee': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'pulse-ring': { '0%': { transform: 'scale(0.8)', opacity: '1' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
        'spin-slow': { '100%': { transform: 'rotate(360deg)' } },
        'count': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'stamp': { '0%': { opacity: '0', transform: 'rotate(-18deg) scale(2.5)' }, '70%': { opacity: '1', transform: 'rotate(-12deg) scale(1.1)' }, '100%': { opacity: '1', transform: 'rotate(-12deg) scale(1)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'laser': 'laser 2.2s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
        'spin-slow': 'spin-slow 1s linear infinite',
        'count': 'count 0.5s ease-out both',
        'stamp': 'stamp 0.6s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
