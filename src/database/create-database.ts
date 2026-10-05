/**
 * Creates the MySQL database from .env if it does not exist.
 * Usage: npm run db:create
 */
import { config } from 'dotenv';
import { createConnection } from 'mysql2/promise';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

async function main() {
  const database = process.env.DB_DATABASE;
  if (!database || !/^[a-zA-Z0-9_]+$/.test(database)) {
    throw new Error('DB_DATABASE must contain only letters, numbers and _');
  }

  const connection = await createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();
  console.log(`Database "${database}" is ready.`);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
