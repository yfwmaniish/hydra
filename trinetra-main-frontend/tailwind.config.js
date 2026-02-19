/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                background: 'var(--bg-main)',
                text: 'var(--text-main)',
                muted: 'var(--text-muted)',
                crimson: '#d32f2f',
                amber: {
                    50: '#fff8e1',
                    100: '#ffecb3',
                    600: '#ffa000',
                },
            },
            boxShadow: {
                'neumorphic': 'var(--shadow-light), var(--shadow-dark)',
                'neumorphic-pressed': 'var(--shadow-inset-light), var(--shadow-inset-dark)',
                'neumorphic-inset': 'var(--shadow-inset-light), var(--shadow-inset-dark)',
            },
        },
    },
    plugins: [],
}
