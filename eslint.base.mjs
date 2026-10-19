import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-plugin-prettier';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export function createNextConfig(options = {}) {
  const ignores = options.ignores ?? [];
  const compat = new FlatCompat();

  return defineConfig([
    ...nextVitals,
    ...nextTs,
    {
      ignores: [
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts',
        'eslint.config.*',
        'postcss.config.*',
        'tailwind.config.*',
        '**/*.css',
        'node_modules/**',
        '.lintstagedrc.js',
        '.agents/**',
        'drizzle/**',
        ...ignores,
      ],
    },
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
      },
      languageOptions: {
        globals: {
          ...globals.builtin,
          ...globals.browser,
          ...globals.node,
        },
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
        // Frontend logger (client-logger.ts) uses console.warn/error/info in dev — allow them.
        'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
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
        '@typescript-eslint/no-explicit-any': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
        'unicorn/better-regex': 'warn',
        'unicorn/consistent-destructuring': 'off',
        'unicorn/filename-case': 'off',
        'unicorn/no-abusive-eslint-disable': 'off',
        'unicorn/no-array-reduce': 'off',
        'unicorn/no-null': 'off',
        'unicorn/prefer-global-this': 'off',
        'unicorn/prefer-spread': 'off',
        'unicorn/prefer-top-level-await': 'off',
        'unicorn/prevent-abbreviations': 'off',
        // React-specific rules
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
        'react/function-component-definition': [
          'warn',
          { namedComponents: 'function-declaration' },
        ],
        'react/jsx-key': [
          'error',
          {
            checkFragmentShorthand: true,
            checkKeyMustBeforeSpread: true,
            warnOnDuplicates: true,
          },
        ],
      },
    },
  ]);
}
