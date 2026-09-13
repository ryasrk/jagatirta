import { createVitestConfig } from '@repo/testing/vitest-config';

export default createVitestConfig({
  dir: import.meta.dirname,
  environment: 'jsdom',
  include: ['src/**/*.{ts,tsx}'],
});
