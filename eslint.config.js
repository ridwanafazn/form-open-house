// Konfigurasi ESLint. Sesuai daftar izin di docs/TRD.md, hanya paket eslint+dependencies
// dipakai; tidak menambah typescript-eslint atau eslint-plugin-astro.
export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'coverage/',
      'playwright-report/',
      'test-results/',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },
];
