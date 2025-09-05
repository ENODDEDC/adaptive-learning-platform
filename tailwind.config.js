/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", // Updated path for App Router
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'base-light': '#F6F3FA',
        'divider-light': '#E4E2E7',
        'text-primary': '#4B4B4B',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-lora)', 'serif'],
      },
      typography: (theme) => ({
        premium: {
          css: {
            '--tw-prose-body': theme('colors.slate[700]'),
            '--tw-prose-headings': theme('colors.slate[900]'),
            '--tw-prose-links': theme('colors.sky[600]'),
            '--tw-prose-bold': theme('colors.slate[900]'),
            '--tw-prose-counters': theme('colors.slate[500]'),
            '--tw-prose-bullets': theme('colors.sky[400]'),
            '--tw-prose-hr': theme('colors.slate[200]'),
            '--tw-prose-quotes': theme('colors.slate[900]'),
            '--tw-prose-quote-borders': theme('colors.sky[300]'),
            '--tw-prose-captions': theme('colors.slate[500]'),
            '--tw-prose-code': theme('colors.indigo[600]'),
            '--tw-prose-pre-code': theme('colors.indigo[200]'),
            '--tw-prose-pre-bg': theme('colors.slate[800]'),
            '--tw-prose-th-borders': theme('colors.slate[300]'),
            '--tw-prose-td-borders': theme('colors.slate[200]'),
            
            // Base styles
            color: 'var(--tw-prose-body)',
            fontFamily: theme('fontFamily.sans'),
            lineHeight: '1.8',

            // Headings
            h1: {
              fontFamily: theme('fontFamily.serif'),
              fontWeight: '700',
              color: 'var(--tw-prose-headings)',
            },
            h2: {
              fontFamily: theme('fontFamily.serif'),
              fontWeight: '700',
              color: 'var(--tw-prose-headings)',
            },
            h3: {
              fontFamily: theme('fontFamily.serif'),
              fontWeight: '600',
              color: 'var(--tw-prose-headings)',
            },
            
            // Links
            a: {
              color: 'var(--tw-prose-links)',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'color 0.2s ease-in-out',
              '&:hover': {
                color: theme('colors.sky[700]'),
              },
            },

            // Blockquotes
            blockquote: {
              fontStyle: 'italic',
              borderLeftWidth: '0.25rem',
              borderLeftColor: 'var(--tw-prose-quote-borders)',
              paddingLeft: '1rem',
            },

            // Tables
            table: {
              width: '100%',
              borderCollapse: 'collapse',
            },
            thead: {
              borderBottomWidth: '2px',
              borderBottomColor: 'var(--tw-prose-th-borders)',
            },
            th: {
              padding: '0.75rem 1rem',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--tw-prose-headings)',
            },
            'tbody tr:nth-child(even)': {
              backgroundColor: theme('colors.slate[50]'),
            },
            td: {
              padding: '0.75rem 1rem',
            },

            // Images
            img: {
              marginTop: '1.5em',
              marginBottom: '1.5em',
              borderRadius: theme('borderRadius.lg'),
              boxShadow: theme('boxShadow.md'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;