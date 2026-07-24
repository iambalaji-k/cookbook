import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

import { initializeDatabase } from '../src/core/db/init-db';
import { db } from '../src/core/db';
import { aiDrafts, rawImports } from '../src/core/db/schema';

async function main() {
  console.log('Target Remote Database URL:', process.env.TURSO_DATABASE_URL || process.env.LOCAL_DATABASE_URL);
  console.log('Initializing database connection...');
  await initializeDatabase();

  console.log('Purging ai_drafts and raw_imports from remote Turso database...');
  await db.delete(aiDrafts);
  await db.delete(rawImports);

  console.log('Remote Turso database staging queue cleared successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error clearing staging queue:', err);
  process.exit(1);
});
