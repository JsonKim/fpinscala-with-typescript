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
    'no-use-before-define': 'off',
    'arrow-parens': 'off',
    'implicit-arrow-linebreak': 'off',
    'import/prefer-default-export': 'off',
    'max-classes-per-file': 'off',
    'no-underscore-dangle': ["error", { "allow": ["_tag"] }],
    'no-unused-vars': 'off',
    'operator-linebreak': 'off',
  }
};
