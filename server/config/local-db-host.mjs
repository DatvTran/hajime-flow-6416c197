/** Avoid Node resolving `localhost` to ::1 when Postgres only listens on IPv4. */
export function localDbHost() {
  const host = process.env.DB_HOST || '127.0.0.1';
  return host === 'localhost' ? '127.0.0.1' : host;
}
