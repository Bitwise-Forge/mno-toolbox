/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/// <reference types="./types.d.ts" />

import eslint from '@eslint/js';
import stylisticPlugin from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import sortDestructuredKeys from 'eslint-plugin-sort-destructure-keys';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['**/*.js', '**/*.mjs', '**/*.ts'],
    plugins: { '@stylistic': stylisticPlugin, import: importPlugin, 'sort-destructure-keys': sortDestructuredKeys },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { disallowTypeAnnotations: true, fixStyle: 'separate-type-imports', prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-condition': ['error', { allowConstantLoopConditions: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'arrow-body-style': ['error', 'as-needed'],
      'consistent-return': 'off',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'sort-destructure-keys/sort-destructure-keys': 'error',
    },
  },
  {
    languageOptions: { parserOptions: { project: './tsconfig.json' } },
    linterOptions: { reportUnusedDisableDirectives: true },
  },
);
