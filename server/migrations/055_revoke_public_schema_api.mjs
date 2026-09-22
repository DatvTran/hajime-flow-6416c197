/**
 * Close remaining Data API surface: PUBLIC schema usage + re-lock any new tables.
 * postgres / Knex still bypasses RLS. Do not FORCE ROW LEVEL SECURITY.
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
            'REVOKE ALL ON TABLE %I.%I FROM PUBLIC, anon, authenticated',
            r.schema_name,
            r.table_name
          );
        EXCEPTION
          WHEN undefined_object THEN
            NULL;
        END;
      END LOOP;

      BEGIN
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
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
            'REVOKE ALL ON ALL SEQUENCES IN SCHEMA %I FROM PUBLIC, anon, authenticated',
            s
          );
        EXCEPTION
          WHEN undefined_object THEN
            NULL;
        END;
        BEGIN
          EXECUTE format(
            'REVOKE ALL ON SCHEMA %I FROM PUBLIC, anon, authenticated',
            s
          );
        EXCEPTION
          WHEN undefined_object THEN
            NULL;
        END;
      END LOOP;

      BEGIN
        REVOKE ALL ON SCHEMA public FROM PUBLIC, anon, authenticated;
      EXCEPTION
        WHEN undefined_object THEN
          NULL;
      END;

      BEGIN
        GRANT USAGE ON SCHEMA public TO postgres, service_role;
      EXCEPTION
        WHEN undefined_object THEN
          NULL;
      END;

      BEGIN
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
          REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
          REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
      EXCEPTION
        WHEN undefined_object THEN
          NULL;
      END;

      BEGIN
        ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
          REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
        ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
          REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
      EXCEPTION
        WHEN undefined_object THEN
          NULL;
        WHEN insufficient_privilege THEN
          NULL;
      END;
    END
    $lock$;
  `);

  console.log("[Migration 055] Revoked PUBLIC/anon/authenticated from Hajime schemas and tables");
}

export async function down() {
  // Intentionally empty — do not re-expose tables on the Data API.
}
