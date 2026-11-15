import type { Config } from 'tailwindcss';

// Tailwind v4 loads this through `@config` in src/app/globals.css.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Bengali"', '"Hind Siliguri"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
};

export default config;
