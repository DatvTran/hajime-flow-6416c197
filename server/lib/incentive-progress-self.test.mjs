import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMyIncentiveProgress } from './incentive-progress-self.mjs';
import { normalizeIncentiveManagerState } from './incentive-manager-state.mjs';

const state = normalizeIncentiveManagerState({
  partners: [
    {
      id: '1',
      name: 'Convoy Supply Ontario',
      market: 'Ontario',
      tier: 'Growth',
      quarterlyCasesSold: 420,
      accountsOpened: 12,
      reorders: 85,
      quarterlyPerformanceTier: 'Silver',
    },
  ],
  spifs: [
    {
      id: 's1',
      partnerId: '1',
      partnerName: 'Convoy Supply Ontario',
      repName: 'Sarah Mitchell',
      retailAccountName: 'The Drake Hotel',
      type: 'new_on_premise',
      date: '2026-04-05',
      quantity: 2,
      payout: 300,
      notes: 'Menu placement',
    },
  ],
});

describe('buildMyIncentiveProgress', () => {
  it('matches distributor by linked wholesaler trading name', () => {
    const out = buildMyIncentiveProgress({
      role: 'distributor',
      user: { displayName: 'Jordan Wei', email: 'jordan@convoy.example.com' },
      teamMember: { name: 'Jordan Wei' },
      state,
      linkedAccountTradingName: 'Convoy Supply Ontario',
    });
    assert.equal(out.scope, 'distributor');
    assert.equal(out.matched, true);
    assert.equal(out.partner?.name, 'Convoy Supply Ontario');
    assert.equal(out.spifs.length, 1);
    assert.equal(out.network?.repCount, 1);
    assert.equal(out.network?.retailAccounts[0], 'The Drake Hotel');
  });

  it('matches sales rep SPIFs by rep name', () => {
    const out = buildMyIncentiveProgress({
      role: 'sales_rep',
      user: { displayName: 'Sarah Mitchell', email: 'sarah@hajime.com' },
      teamMember: { name: 'Sarah Mitchell' },
      state,
    });
    assert.equal(out.scope, 'sales_rep');
    assert.equal(out.matched, true);
    assert.equal(out.totals.payoutTotal, 300);
    assert.equal(out.spifs[0].retailAccountName, 'The Drake Hotel');
  });

  it('matches retail by trading name and exposes distributor + rep', () => {
    const out = buildMyIncentiveProgress({
      role: 'retail',
      user: { displayName: 'Mei Daniels', email: 'mei@drake.com' },
      teamMember: null,
      state,
      retailTradingName: 'The Drake Hotel',
    });
    assert.equal(out.scope, 'retail');
    assert.equal(out.matched, true);
    assert.equal(out.servicingDistributor, 'Convoy Supply Ontario');
    assert.equal(out.assignedRep, 'Sarah Mitchell');
    assert.equal(out.spifs[0].partnerName, 'Convoy Supply Ontario');
  });
});
