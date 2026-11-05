import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db, pool } from './client.js';

await migrate(db, { migrationsFolder: './drizzle' });
await pool.end();
console.info('Migrations appliquées.');
