const REQUIRED_KEYS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_KEYS.filter(key => {
    const value = config[key];
    return value === undefined || String(value).trim() === '';
  });

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill the values.',
    );
  }

  return config;
}
