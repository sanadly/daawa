/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Include shared UI components
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for Daawa brand
        'daawa-primary': '#2563eb',
        'daawa-secondary': '#64748b',
        'daawa-accent': '#f59e0b',
        'daawa-neutral': '#374151',
        'daawa-base-100': '#ffffff',
        'daawa-info': '#0ea5e9',
        'daawa-success': '#22c55e',
        'daawa-warning': '#f59e0b',
        'daawa-error': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        daawa: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#f59e0b',
          neutral: '#374151',
          'base-100': '#ffffff',
          'base-200': '#f8fafc',
          'base-300': '#e2e8f0',
          info: '#0ea5e9',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      'light',
      'dark',
    ],
    base: true,
    styled: true,
    utils: true,
    rtl: true, // Enable RTL support for Arabic
    prefix: '',
    logs: true,
  },
};
