const toBool = (value: string | undefined, fallback = false): boolean =>
  value === undefined || value === '' ? fallback : value === 'true';

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

export default () => ({
  app: {
    name: process.env.APP_NAME || 'EventNest',
    env: process.env.NODE_ENV || 'local',
    port: toInt(process.env.APP_PORT, 4000),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5180',
    corsOrigins: toList(process.env.CORS_ORIGIN),
    enableSwagger: toBool(process.env.ENABLE_SWAGGER, true),
  },
  database: {
    host: process.env.DB_HOST,
    port: toInt(process.env.DB_PORT, 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: toBool(process.env.DB_SYNCHRONIZE),
    logging: toBool(process.env.DB_LOGGING),
    migrationsRun: toBool(process.env.DB_MIGRATIONS_RUN, true),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  admin: {
    name: process.env.ADMIN_NAME || 'EventNest Admin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    phone: process.env.ADMIN_PHONE,
  },
  booking: {
    gstPercent: toInt(process.env.GST_PERCENT, 18),
    currency: process.env.CURRENCY || 'INR',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSizeMb: toInt(process.env.MAX_UPLOAD_SIZE_MB, 5),
  },
  rateLimit: {
    ttlMs: toInt(process.env.RATE_LIMIT_TTL_MS, 60000),
    max: toInt(process.env.RATE_LIMIT_MAX, 300),
  },
  mail: {
    host: process.env.SMTP_HOST,
    port: toInt(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE),
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM || 'EventNest <no-reply@eventnest.com>',
  },
});
