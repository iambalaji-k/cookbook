import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: process.env.TURSO_DATABASE_URL ? 'turso' : 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || process.env.LOCAL_DATABASE_URL || 'file:local.db',
    ...(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
      ? { authToken: process.env.TURSO_AUTH_TOKEN }
      : {}),
  },
});
