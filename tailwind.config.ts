import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}', './content/**/*.mdx'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          raised: 'rgb(var(--ink-raised) / <alpha-value>)',
          deep: 'rgb(var(--ink-deep) / <alpha-value>)',
        },
        bone: 'rgb(var(--bone) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        steel: 'rgb(var(--steel) / <alpha-value>)',
        signal: 'rgb(var(--signal) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // display scale, tuned for tight optical tracking
        d1: ['clamp(2.9rem, 7.4vw, 7.25rem)', { lineHeight: '0.94', letterSpacing: '-0.035em' }],
        d2: ['clamp(2.35rem, 5.2vw, 4.5rem)', { lineHeight: '0.98', letterSpacing: '-0.032em' }],
        d3: ['clamp(1.85rem, 3.4vw, 3rem)', { lineHeight: '1.04', letterSpacing: '-0.028em' }],
        d4: ['clamp(1.4rem, 2.1vw, 1.95rem)', { lineHeight: '1.14', letterSpacing: '-0.022em' }],
        lead: ['clamp(1.075rem, 1.35vw, 1.3rem)', { lineHeight: '1.55', letterSpacing: '-0.013em' }],
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.19em' }],
      },
      borderRadius: {
        DEFAULT: 'var(--r)',
        card: 'var(--r-lg)',
      },
      maxWidth: {
        shell: '82.5rem',
        prose: '43rem',
        measure: '36rem',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
        swift: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translate3d(0, 14px, 0)' },
          to: { opacity: '1', transform: 'none' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        draw: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        rise: 'rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        marquee: 'marquee 42s linear infinite',
        draw: 'draw 1.1s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [typography],
};

export default config;
