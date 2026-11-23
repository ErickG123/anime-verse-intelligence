import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import animeversePlugin from './tooling/eslint-plugin-animeverse.mjs';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.angular/**',
      '**/coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: {
      animeverse: animeversePlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'animeverse/no-inline-component-assets': 'error',
      'animeverse/no-domain-exports-in-components-or-services': 'error',
      'animeverse/enforce-feature-boundaries': 'error',
    },
  },
);
