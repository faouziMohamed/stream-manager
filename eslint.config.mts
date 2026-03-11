import css from '@eslint/css';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-plugin-prettier';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import { tailwind4 } from 'tailwind-csstree';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'eslint.config.*',
    'postcss.config.*',
    'tailwind.config.*',
    '**/*.css',
  ]),
  ...compat.config({
    extends: ['prettier'],
  }),
  {
    extends: ['js/recommended', eslintPluginUnicorn.configs['recommended']],
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      prettier,
      js,
      'unused-imports': unusedImports,
      import: importPlugin,
    },
    languageOptions: {
      globals: { ...globals.builtin, ...globals.browser, ...globals.node },
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-var': 'warn',
      'no-empty': 'error',
      'no-implicit-coercion': ['error', { boolean: false, number: true, string: true }],
      'no-underscore-dangle': 'off',
      'no-continue': 'off',
      'no-void': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-empty-function': 'warn',
      'no-mixed-operators': [
        'error',
        {
          allowSamePrecedence: true,
          groups: [
            ['%', '**'],
            ['%', '+'],
            ['%', '-'],
            ['%', '*'],
            ['%', '/'],
            ['/', '*'],
            ['&', '|', '^', '~', '<<', '>>', '>>>'],
            ['==', '!=', '===', '!=='],
            ['&&', '||'],
          ],
        },
      ],
      'no-plusplus': ['warn', { allowForLoopAfterthoughts: true }],
      'no-param-reassign': ['error', { props: false }],
      'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'unicorn/better-regex': 'warn',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/consistent-destructuring': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/no-abusive-eslint-disable': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'react/button-has-type': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-danger': 'error',
      'react/no-danger-with-children': 'error',
      'react/jsx-fragments': 'error',
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-max-depth': ['error', { max: 7 }],
      'react/jsx-curly-brace-presence': 'warn',
      'react/display-name': 'warn',
      'react/no-typos': 'warn',
      'react/function-component-definition': ['warn', { namedComponents: 'function-declaration' }],
      'react/jsx-key': [
        'error',
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
          warnOnDuplicates: true,
        },
      ],
    },
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },

  {
    files: ['**/*.css'],
    plugins: { css },
    language: 'css/css',
    // extends: ['css/recommended'],
    languageOptions: {
      customSyntax: tailwind4,
      tolerant: true,
    },
    rules: {
      'css/no-empty-blocks': 'error',
    },
  },

  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      '.lintstagedrc.js',
    ],
  },
]);
