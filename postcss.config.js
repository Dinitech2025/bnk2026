module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Optimisation CSS basique en production
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: 'default',
      },
    }),
  },
} 