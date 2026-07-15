import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // Módulos nativos de Expo stubbeados para correr en Node
      'expo-crypto': path.resolve(__dirname, 'src/__tests__/stubs/expo-crypto.ts'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
