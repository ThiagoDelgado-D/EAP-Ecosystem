import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const typeOnlyMessage =
  'The web client may import only types from the backend packages (ADR-0030). Use `import type`.';

export default defineConfig(
  { ignores: ['coverage/', 'dist/', '.angular/'] },
  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.base],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'domain-lib', message: typeOnlyMessage, allowTypeImports: true }],
          patterns: [
            { group: ['@*/application'], message: typeOnlyMessage, allowTypeImports: true },
            {
              group: ['@*/domain', '@*/infrastructure', 'infrastructure-lib', 'domain-lib/*'],
              message:
                'The web client reaches the backend over HTTP only; error types come from domain-lib and the application packages (ADR-0030).',
            },
          ],
        },
      ],
    },
  },
);
