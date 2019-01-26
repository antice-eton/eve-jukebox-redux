module.exports = {
  root: true,

  env: {
    node: true,
  },

  extends: [
    'plugin:vue/essential'
  ],

  rules: {
    'no-console': 'off',
    'no-debugger': 'off',
    'indent': ['error', 4]
  },

  parserOptions: {
    parser: 'babel-eslint',
  },

  'extends': [
    'plugin:vue/strongly-recommended'
  ]
};
