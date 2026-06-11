/**
 * Fly.io Postgres: pass DATABASE_URL through to node-postgres so sslmode and
 * other query params match the provider. Avoid inferring TLS when sslmode is
 * omitted (internal clusters often use plaintext on the private network).
 */
export function normalizeFlyDatabaseUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    let host = parsed.hostname;
    if (host.endsWith('.flycast')) {
      host = host.replace(/\.flycast$/, '.internal');
      parsed.hostname = host;
    }
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

export function flyDatabaseConnection(fallbackSsl) {
  const viaUrl = normalizeFlyDatabaseUrl(process.env.DATABASE_URL);
  if (viaUrl) return viaUrl;
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ...fallbackSsl,
  };
}
