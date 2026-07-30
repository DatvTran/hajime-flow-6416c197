/**
 * Fly.io Postgres connection helpers.
 *
 * node-postgres can drop connections with "Connection terminated unexpectedly"
 * when DATABASE_URL sslmode disagrees with Fly's private network (plaintext on
 * *.internal). Parse the URL into an explicit connection object instead of
 * passing the raw string through to knex/pg.
 */

function isFlyPrivateHost(hostname) {
  return (
    hostname.endsWith('.internal') ||
    hostname.endsWith('.flycast') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  );
}

function sslFromMode(sslmode, hostname, fallbackSsl) {
  // Fly private network uses plaintext; SSL handshakes fail with "Connection terminated unexpectedly".
  if (isFlyPrivateHost(hostname)) return false;

  const mode = (sslmode || '').toLowerCase();
  if (mode === 'disable' || mode === 'allow') return false;
  if (mode === 'require') return { rejectUnauthorized: false };
  if (mode === 'verify-ca' || mode === 'verify-full') {
    return { rejectUnauthorized: true };
  }
  if (mode === 'prefer') return { rejectUnauthorized: false };

  const fb = fallbackSsl?.ssl;
  if (fb === false) return false;
  if (fb && typeof fb === 'object') return fb;
  return { rejectUnauthorized: false };
}

export function normalizeFlyDatabaseUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.endsWith('.flycast')) {
      parsed.hostname = parsed.hostname.replace(/\.flycast$/, '.internal');
    }
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

/** Point a Fly DATABASE_URL at a local fly proxy (127.0.0.1:port). */
export function rewriteDatabaseUrlForProxy(
  url,
  { host = '127.0.0.1', port = 15432 } = {},
) {
  const normalized = normalizeFlyDatabaseUrl(url) || url;
  const parsed = new URL(normalized);
  parsed.hostname = host;
  parsed.port = String(port);
  parsed.searchParams.set('sslmode', 'disable');
  return parsed.toString();
}

/**
 * @param {{ ssl?: false | { rejectUnauthorized?: boolean } }} [fallbackSsl]
 * @returns {import('pg').ClientConfig}
 */
export function flyDatabaseConnection(fallbackSsl = { ssl: { rejectUnauthorized: false } }) {
  const normalized = normalizeFlyDatabaseUrl(process.env.DATABASE_URL);
  if (normalized) {
    const parsed = new URL(normalized);
    const sslmode = parsed.searchParams.get('sslmode') ?? parsed.searchParams.get('ssl') ?? undefined;

    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 5432,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, '') || undefined,
      ssl: sslFromMode(sslmode, parsed.hostname, fallbackSsl),
      connectionTimeoutMillis: 20_000,
    };
  }

  const host = process.env.DB_HOST;
  if (!host) {
    throw new Error(
      'DATABASE_URL is not set. Attach Postgres to the app: fly postgres attach hajime-db --app hajime-app',
    );
  }

  return {
    host,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: sslFromMode(process.env.DB_SSLMODE, host, fallbackSsl),
    connectionTimeoutMillis: 20_000,
  };
}
