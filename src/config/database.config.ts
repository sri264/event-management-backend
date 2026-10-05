import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.database'),
  autoLoadEntities: true,
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: configService.get<boolean>('database.migrationsRun'),
  // Never enable outside local schema experiments — use migrations.
  synchronize: configService.get<boolean>('database.synchronize'),
  logging: configService.get<boolean>('database.logging'),
  timezone: '+05:30',
  charset: 'utf8mb4',
  extra: {
    connectionLimit: 10,
  },
});
