/** In-memory tables with just the knex query surface the export signing, capacity and booth code uses. */
export function memoryDb(tables) {
  let nextId = 1000;
  const db = (name) => {
    let rows = tables[name] || [];
    let maxCol = null;
    const q = {
      where(match) {
        if (typeof match === "function") {
          // knex where(function(){ this.where... }) — ignore for simple tests
          return q;
        }
        rows = rows.filter((r) => Object.entries(match).every(([k, v]) => r[k] === v));
        return q;
      },
      whereNot(col, val) {
        rows = rows.filter((r) => r[col] !== val);
        return q;
      },
      whereNull(col) {
        rows = rows.filter((r) => r[col] == null);
        return q;
      },
      whereNotNull(col) {
        rows = rows.filter((r) => r[col] != null);
        return q;
      },
      whereRaw() {
        return q;
      },
      max(spec) {
        const [col, alias] = String(spec).split(/\s+as\s+/);
        maxCol = { col, alias };
        return q;
      },
      forUpdate: () => q,
      orderBy: async () => rows,
      first: async () => {
        if (maxCol) {
          const vals = rows.map((r) => Number(r[maxCol.col])).filter(Number.isFinite);
          return { [maxCol.alias]: vals.length ? Math.max(...vals) : null };
        }
        return rows[0];
      },
      select: async () => rows,
      columnInfo: async () => Object.fromEntries(Object.keys(tables[name]?.[0] || {}).map((k) => [k, {}])),
      update(patch) {
        for (const r of rows) Object.assign(r, patch);
        const updated = [...rows];
        const done = Promise.resolve(updated.length);
        return Object.assign(done, {
          returning: async () => updated,
        });
      },
      insert(row) {
        const stored = { id: row.id ?? nextId++, ...row };
        if (!tables[name]) tables[name] = [];
        tables[name].push(stored);
        const done = Promise.resolve([stored]);
        return Object.assign(done, { returning: async () => [stored] });
      },
    };
    return q;
  };
  db.fn = { now: () => new Date().toISOString() };
  db.schema = {
    hasTable: async (name) => name in tables,
    hasColumn: async () => true,
    alterTable: async () => {},
    createTable: async () => {},
  };
  db.raw = async () => ({ rows: [] });
  db.transaction = async (fn) => fn(db);
  return db;
}
