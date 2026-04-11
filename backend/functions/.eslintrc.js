module.exports = {
  root: true,
  env: {
    es2020: true,
    node:   true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json'],
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'quotes':                              ['error', 'single', { allowTemplateLiterals: true }],
    '@typescript-eslint/no-explicit-any':  'warn',
    '@typescript-eslint/no-unused-vars':   ['error', { argsIgnorePattern: '^_' }],
    'no-restricted-globals':               ['error', 'name', 'length'],
    'prefer-arrow-callback':               'error',
  },
  overrides: [
    {
      files: ['**/*.spec.*'],
      env: { mocha: true },
      rules: {},
    },
  ],
  ignorePatterns: ['lib/', '*.js'],
};
