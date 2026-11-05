import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/client.js';

const server = app.listen(env.PORT, () => console.info(`KaziRide Auth API listening on port ${env.PORT}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
