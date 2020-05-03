module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    semi: ["error", "never", { "beforeStatementContinuationChars": "never"}],
    'comma-dangle': ["error", "always-multiline"],
    'no-else-return': 'off',
    'no-console': 'off',
    'no-shadow': 'off',
    'import/prefer-default-export': 'off',
  }
};
