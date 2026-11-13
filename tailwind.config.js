/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        'chart-1': 'var(--chart-1)',
        'chart-2': 'var(--chart-2)',
        'chart-3': 'var(--chart-3)',
        'chart-4': 'var(--chart-4)',
        'chart-5': 'var(--chart-5)',
        
        // Legacy Overrides mapping to the new theme
        zinc: {
          950: 'var(--background)',
          900: 'var(--card)',
          800: 'var(--muted)',
          700: 'var(--border)',
          500: 'var(--muted-foreground)',
          400: 'var(--muted-foreground)',
          300: 'var(--foreground)',
          200: 'var(--foreground)',
          100: 'var(--foreground)',
        },
        emerald: {
          600: 'var(--primary)',
          500: 'var(--primary)',
          400: 'var(--chart-1)',
          900: 'var(--accent)',
        },
        amber: {
          600: 'var(--chart-1)',
          500: 'var(--chart-1)',
        },
        red: {
          900: 'var(--destructive)',
          600: 'var(--destructive)',
          500: 'var(--destructive)',
          400: 'var(--destructive)',
        }
      }
    },
  },
  plugins: [],
}
