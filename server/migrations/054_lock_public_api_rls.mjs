/**
 * Deny PostgREST (anon / authenticated) on all app tables.
 * Enables RLS with no policies. postgres / Knex still bypasses RLS.
 * Do not FORCE ROW LEVEL SECURITY (that can bind the table owner).
 */
export async function up(knex) {
  await knex.raw(`
    DO $lock$
    DECLARE
      r record;
      s text;
    BEGIN
      FOR r IN
        SELECT n.nspname AS schema_name, c.relname AS table_name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'r'
          AND (
            n.nspname = 'public'
            OR n.nspname LIKE 'hajime_dist_%'
          )
      LOOP
        EXECUTE format(
          'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
          r.schema_name,
          r.table_name
        );
        BEGIN
          EXECUTE format(
            'REVOKE ALL ON TABLE %I.%I FROM anon, authenticated',
            r.schema_name,
            r.table_name
          );
        EXCEPTION
          WHEN undefined_object THEN
            NULL;
        END;
      END LOOP;

      BEGIN
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
      EXCEPTION
        WHEN undefined_object THEN
          NULL;
        WHEN invalid_schema_name THEN
          NULL;
      END;

      FOR s IN
        SELECT nspname FROM pg_namespace WHERE nspname LIKE 'hajime_dist_%'
      LOOP
        BEGIN
          EXECUTE format(
            'REVOKE ALL ON ALL SEQUENCES IN SCHEMA %I FROM anon, authenticated',
            s
          );
        EXCEPTION
          WHEN undefined_object THEN
            NULL;
        END;
        BEGIN
          EXECUTE format(
            'REVOKE ALL ON SCHEMA %I FROM anon, authenticated',
            s
          );
        EXCEPTION
          WHEN undefined_object THEN
            NULL;
        END;
      END LOOP;

      BEGIN
        REVOKE ALL ON SCHEMA public FROM anon, authenticated;
      EXCEPTION
        WHEN undefined_object THEN
          NULL;
      END;

      BEGIN
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
          REVOKE ALL ON TABLES FROM anon, authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
          REVOKE ALL ON SEQUENCES FROM anon, authenticated;
      EXCEPTION
        WHEN undefined_object THEN
          NULL;
      END;
    END
    $lock$;
  `);

  console.log("[Migration 054] RLS enabled; anon/authenticated revoked on public and hajime_dist_* tables");
}

export async function down() {
  // Intentionally empty — do not re-expose tables on the Data API.
}
