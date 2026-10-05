/**
 * Standalone DataSource for the TypeORM CLI (migrations).
 * Usage: npm run migration:generate -- src/migrations/<Name>
 */
import { config } from 'dotenv';
import { join, resolve } from 'path';
import { DataSource } from 'typeorm';

config({ path: resolve(process.cwd(), '.env') });

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  timezone: '+05:30',
  charset: 'utf8mb4',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
