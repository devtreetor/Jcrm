function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function requireEnvInt(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (!raw) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer, got: "${raw}"`);
  }
  return parsed;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  IMPORT_CHUNK_SIZE: requireEnvInt('IMPORT_CHUNK_SIZE', 500),
  IMPORT_MAX_ROWS: requireEnvInt('IMPORT_MAX_ROWS', 777),
  INSIGHTS_POLL_INTERVAL_MS: requireEnvInt('INSIGHTS_POLL_INTERVAL_MS', 60000),
  JWT_EXPIRY: requireEnvInt('JWT_EXPIRY', 3600),
} as const;
