import { normalizeIncentiveManagerState } from '../lib/incentive-manager-state.mjs';
import { isPlatformKnex } from '../lib/migration-context.mjs';

/**
 * Demo distributor (Metro Logistics) needs a partner row in HQ incentive state.
 * Safe to re-run — skips if partner id 4 already exists.
 */
export async function up(knex) {
  if (!isPlatformKnex(knex)) {
    console.log('[030] Skipping Metro partner patch on non-platform database');
    return;
  }

  const hasTable = await knex.schema.hasTable('supply_chain_incentive_state');
  if (!hasTable) {
    console.log('[030] supply_chain_incentive_state missing, skipping');
    return;
  }

  const tenants = await knex('tenants').select('id');
  for (const { id: tenant_id } of tenants) {
    const row = await knex('supply_chain_incentive_state').where({ tenant_id }).first();
    let state = row?.state;
    if (typeof state === 'string') {
      try {
        state = JSON.parse(state);
      } catch {
        state = {};
      }
    }
    if (!state || typeof state !== 'object') state = {};

    const partners = Array.isArray(state.partners) ? state.partners : [];
    if (partners.some((p) => String(p?.id) === '4' || String(p?.name).toLowerCase().includes('metro logistics'))) {
      continue;
    }

    partners.push({
      id: '4',
      name: 'Metro Logistics',
      market: 'Ontario',
      tier: 'Growth',
      quarterlyCasesSold: 310,
      accountsOpened: 9,
      reorders: 62,
      tastingsCompleted: 14,
      adfSpend: 1800,
      quarterlyPerformanceTier: 'Silver',
    });

    const spifs = Array.isArray(state.spifs) ? state.spifs : [];
    spifs.push({
      id: 's_metro_1',
      partnerId: '4',
      partnerName: 'Metro Logistics',
      repName: 'Marcus Chen',
      retailAccountName: 'The Drake Hotel',
      type: 'reorder',
      date: '2026-05-12',
      quantity: 3,
      payout: 15,
      notes: 'Q2 reorder — Hajime Original 750ml',
    });

    const normalized = normalizeIncentiveManagerState({ ...state, partners, spifs });
    const payload = {
      state: JSON.stringify(normalized),
      updated_at: new Date(),
    };

    if (row) {
      await knex('supply_chain_incentive_state').where({ tenant_id }).update(payload);
    } else {
      await knex('supply_chain_incentive_state').insert({ tenant_id, ...payload });
    }
  }

  console.log('[030] Patched incentive state with Metro Logistics partner');
}

export async function down() {
  // Non-destructive demo patch — no down migration.
}
