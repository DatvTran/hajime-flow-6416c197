import { normalizeIncentiveManagerState } from '../lib/incentive-manager-state.mjs';

const DEMO_STATE = {
  partners: [
    {
      id: '1',
      name: 'Convoy Supply Ontario',
      market: 'Ontario',
      tier: 'Growth',
      quarterlyCasesSold: 420,
      accountsOpened: 12,
      reorders: 85,
      tastingsCompleted: 18,
      adfSpend: 2500,
      quarterlyPerformanceTier: 'Silver',
    },
    {
      id: '2',
      name: 'Liberty Wine Merchants',
      market: 'British Columbia',
      tier: 'Premier',
      quarterlyCasesSold: 680,
      accountsOpened: 22,
      reorders: 145,
      tastingsCompleted: 28,
      adfSpend: 4200,
      quarterlyPerformanceTier: 'Gold',
    },
    {
      id: '3',
      name: 'Saq Distributions',
      market: 'Quebec',
      tier: 'Foundation',
      quarterlyCasesSold: 180,
      accountsOpened: 6,
      reorders: 32,
      tastingsCompleted: 8,
      adfSpend: 1200,
      quarterlyPerformanceTier: 'Bronze',
    },
  ],
  spifs: [
    {
      id: 's1',
      partnerId: '1',
      partnerName: 'Convoy Supply Ontario',
      repName: 'Sarah Mitchell',
      type: 'new_on_premise',
      date: '2026-04-05',
      quantity: 2,
      payout: 300,
      notes: 'The Drake Hotel - new cocktail menu',
    },
  ],
};

/** Ensure each tenant has a supply-chain incentive row so GET /supply-chain-incentives does not fail on empty DBs. */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('supply_chain_incentive_state');
  if (!hasTable) {
    console.log('[Migration 022] supply_chain_incentive_state missing, skipping backfill');
    return;
  }

  const normalized = normalizeIncentiveManagerState(DEMO_STATE);
  const payload = JSON.stringify(normalized);
  const tenants = await knex('tenants').select('id');

  for (const { id: tenant_id } of tenants) {
    const existing = await knex('supply_chain_incentive_state').where({ tenant_id }).first();
    if (existing) continue;
    await knex('supply_chain_incentive_state').insert({
      tenant_id,
      state: payload,
      updated_at: new Date(),
    });
  }

  console.log('[Migration 022] Backfilled supply_chain_incentive_state where missing');
}

export async function down() {
  // Non-destructive backfill — no down migration.
}
