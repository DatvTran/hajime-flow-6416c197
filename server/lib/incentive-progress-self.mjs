/**
 * Role-scoped views of tenant incentive manager state (read-only, no full payload).
 */

function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, '')
    .trim();
}

function tokens(s) {
  return norm(s)
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
}

function distributorCandidates(user, teamMember) {
  const out = new Set();
  const dn = norm(user?.displayName);
  if (dn) {
    out.add(dn);
    for (const t of tokens(user?.displayName ?? "")) out.add(t);
  }
  const tmName = norm(teamMember?.name);
  if (tmName) {
    out.add(tmName);
    for (const t of tokens(teamMember?.name ?? "")) out.add(t);
  }
  const email = String(user?.email ?? '').toLowerCase().trim();
  const local = email.split('@')[0]?.replace(/[._+]/g, ' ') ?? '';
  if (local) {
    out.add(norm(local));
    for (const t of tokens(local)) out.add(t);
  }
  const domain = email.split('@')[1]?.split('.')[0] ?? '';
  if (domain && domain.length > 2) {
    out.add(norm(domain));
    const noTld = domain.replace(/[^a-z0-9]/gi, '');
    if (noTld.length > 4) out.add(noTld);
  }
  return [...out].filter(Boolean);
}

function scorePartnerMatch(partnerName, candidates) {
  const pn = norm(partnerName);
  if (!pn) return 0;
  let score = 0;
  for (const c of candidates) {
    if (!c) continue;
    if (pn === c) score += 10;
    else if (pn.includes(c) || c.includes(pn)) score += 6;
    for (const tok of pn.split(' ')) {
      if (tok.length > 2 && (tok.includes(c) || c.includes(tok))) score += 2;
    }
  }
  return score;
}

function pickPartnerForDistributor(partners, user, teamMember) {
  const candidates = distributorCandidates(user, teamMember);
  let best = null;
  let bestScore = 0;
  for (const p of partners) {
    const s = scorePartnerMatch(p.name, candidates);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore >= 2 ? best : null;
}

function repMatchesSpi(repName, user, teamMember) {
  const r = norm(repName);
  if (!r) return false;
  const labels = new Set();
  const dn = norm(user?.displayName);
  if (dn) labels.add(dn);
  const tm = norm(teamMember?.name);
  if (tm) labels.add(tm);
  const email = String(user?.email ?? '').toLowerCase().trim();
  const local = norm(email.split('@')[0]?.replace(/[._+]/g, ' ') ?? '');
  if (local) labels.add(local);
  for (const l of labels) {
    if (!l) continue;
    if (r === l) return true;
    if (r.includes(l) || l.includes(r)) return true;
  }
  const rToks = tokens(repName);
  const uToks = new Set([...tokens(user?.displayName), ...tokens(teamMember?.name), ...tokens(email.split('@')[0])]);
  for (const rt of rToks) {
    for (const ut of uToks) {
      if (rt === ut || (rt.length > 3 && (rt.includes(ut) || ut.includes(rt)))) return true;
    }
  }
  return false;
}

function spifsForPartner(state, partner) {
  if (!partner) return [];
  const id = String(partner.id);
  const pn = norm(partner.name);
  return state.spifs.filter(
    (s) => String(s.partnerId) === id || norm(s.partnerName) === pn || norm(s.partnerName).includes(pn),
  );
}

/**
 * @param {object} params
 * @param {string} params.role
 * @param {{ displayName?: string, email?: string }} params.user
 * @param {{ name?: string } | null | undefined} params.teamMember
 * @param {ReturnType<import('./incentive-manager-state.mjs').normalizeIncentiveManagerState>} params.state
 * @param {string} [params.retailTradingName]
 */
export function buildMyIncentiveProgress({ role, user, teamMember, state, retailTradingName }) {
  const program = {
    spifRates: state.spifRates,
    volumeBonusesUsd: state.volumeBonusesUsd,
  };

  if (role === 'distributor') {
    const partner = pickPartnerForDistributor(state.partners, user, teamMember);
    const spifs = spifsForPartner(state, partner);
    const payoutTotal = spifs.reduce((a, s) => a + (Number(s.payout) || 0), 0);
    return {
      scope: 'distributor',
      matched: Boolean(partner),
      partner: partner
        ? {
            id: partner.id,
            name: partner.name,
            market: partner.market,
            tier: partner.tier,
            quarterlyPerformanceTier: partner.quarterlyPerformanceTier,
            quarterlyCasesSold: partner.quarterlyCasesSold,
            accountsOpened: partner.accountsOpened,
            reorders: partner.reorders,
            tastingsCompleted: partner.tastingsCompleted,
            adfSpend: partner.adfSpend,
          }
        : null,
      spifs: spifs.slice(0, 50).map((s) => ({
        id: s.id,
        type: s.type,
        date: s.date,
        quantity: s.quantity,
        payout: s.payout,
        repName: s.repName,
        notes: s.notes,
      })),
      totals: { payoutTotal, spifCount: spifs.length },
      program,
    };
  }

  if (role === 'sales_rep' || role === 'sales') {
    const spifs = state.spifs.filter((s) => repMatchesSpi(s.repName, user, teamMember));
    const payoutTotal = spifs.reduce((a, s) => a + (Number(s.payout) || 0), 0);
    return {
      scope: 'sales_rep',
      matched: spifs.length > 0,
      partner: null,
      spifs: spifs.slice(0, 50).map((s) => ({
        id: s.id,
        type: s.type,
        date: s.date,
        quantity: s.quantity,
        payout: s.payout,
        partnerName: s.partnerName,
        notes: s.notes,
      })),
      totals: { payoutTotal, spifCount: spifs.length },
      program,
    };
  }

  if (role === 'retail' || role === 'retail_account') {
    const hintRaw = String(retailTradingName || user?.displayName || '').trim();
    const hint = norm(hintRaw);
    const spifs = hint
      ? state.spifs.filter((s) => {
          const blob = norm(`${s.notes ?? ''} ${s.partnerName ?? ''} ${s.repName ?? ''}`);
          return blob.includes(hint);
        })
      : [];
    const payoutTotal = spifs.reduce((a, s) => a + (Number(s.payout) || 0), 0);
    return {
      scope: 'retail',
      matched: spifs.length > 0,
      retailTradingName: retailTradingName || null,
      partner: null,
      spifs: spifs.slice(0, 25).map((s) => ({
        id: s.id,
        type: s.type,
        date: s.date,
        quantity: s.quantity,
        payout: s.payout,
        partnerName: s.partnerName,
        notes: s.notes,
      })),
      totals: { payoutTotal, spifCount: spifs.length },
      program,
    };
  }

  return { scope: 'unsupported', matched: false, program };
}
