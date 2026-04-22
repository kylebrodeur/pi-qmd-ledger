import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginPrettier from 'eslint-plugin-prettier'

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: globals.node,
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      'prettier/prettier': 'error',
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.DS_Store', '*.log'],
  },
]
