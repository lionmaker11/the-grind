// ESLint config for /v2/.
// Goal: catch React-import mistakes early (this is a Preact app) and flag
// unused vars. Keep the ruleset small — DESIGN.md prefers terse code.
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['react'],
  extends: ['eslint:recommended'],
  settings: { react: { version: '999.999.999' } },
  rules: {
    // Without this, ESLint flags JSX-referenced identifiers as unused.
    'react/jsx-uses-vars': 'error',

    // V2 is Preact — block accidental React imports.
    'no-restricted-imports': ['error', {
      paths: [
        { name: 'react', message: 'Use preact — V2 is a Preact app (see DESIGN.md §12).' },
        { name: 'react-dom', message: 'Use preact — V2 is a Preact app.' },
        { name: 'react-dom/client', message: 'Use preact — V2 is a Preact app.' }
      ]
    }],

    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }]
  }
};
