module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { project: 'tsconfig.json' },
  plugins: ['@typescript-eslint'],

  extends: [
    'plugin:@typescript-eslint/recommended',
    // "plugin:@typescript-eslint/recommended-requiring-type-checking",
    // "plugin:@typescript-eslint/strict",
  ],

  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
    // "@typescript-eslint/eslint-plugin": "error",
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    quotes: ['error', 'single'],
    // "comma-dangle": "always-multiline",
  },
}
