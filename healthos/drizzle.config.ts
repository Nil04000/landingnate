import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/core/db/schema/index.ts',
  out: './src/core/db/migrations',
});
