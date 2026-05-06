/**
 * Inbound logistics: port as shown on waybill + waybill reference (distinct from generic tracking).
 */

export async function up(knex) {
  const add = async (col, fn) => {
    const has = await knex.schema.hasColumn('shipments', col);
    if (has) return;
    await knex.schema.alterTable('shipments', (t) => fn(t));
    console.log(`[Migration 019] Added shipments.${col}`);
  };
  await add('origin_port', (t) => t.string('origin_port', 128).nullable());
  await add('waybill_number', (t) => t.string('waybill_number', 120).nullable());
}

export async function down(knex) {
  const drop = async (col) => {
    const has = await knex.schema.hasColumn('shipments', col);
    if (!has) return;
    await knex.schema.alterTable('shipments', (t) => t.dropColumn(col));
  };
  await drop('waybill_number');
  await drop('origin_port');
}
