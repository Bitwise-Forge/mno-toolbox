import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(_config => {
  // Load environment variables from .env.test file
  const env = loadEnv('test', process.cwd(), '');

  return {
    cacheDir: 'node_modules/.cache/.vitestcache',
    plugins: [tsconfigPaths()],
    test: {
      coverage: {
        enabled: false,
        provider: 'v8',
        reporter: ['text'],
        include: ['src/**/*'],
        exclude: ['src/interfaces/**/*'],
      },
      environment: 'node',
      exclude: ['node_modules', 'coverage'],
      globals: false,
      include: ['tests/**/*.test.ts'],
      isolate: true,
      env,
    },
  };
});
