/**
 * Role-scoped views of tenant incentive manager state (read-only, no full payload).
 * HQ Incentive Manager is the source of truth; SPIFs link distributor ↔ sales rep ↔ retail.
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

function distributorCandidates(user, teamMember, linkedAccountTradingName) {
  const out = new Set();
  const dn = norm(user?.displayName);
  if (dn) {
    out.add(dn);
    for (const t of tokens(user?.displayName ?? '')) out.add(t);
  }
  const tmName = norm(teamMember?.name);
  if (tmName) {
    out.add(tmName);
    for (const t of tokens(teamMember?.name ?? '')) out.add(t);
  }
  const linked = norm(linkedAccountTradingName);
  if (linked) {
    out.add(linked);
    for (const t of tokens(linkedAccountTradingName ?? '')) out.add(t);
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

/**
 * @param {object[]} partners
 * @param {{ displayName?: string, email?: string }} user
 * @param {{ name?: string } | null | undefined} teamMember
 * @param {string | null | undefined} linkedAccountTradingName
 */
function pickPartnerForDistributor(partners, user, teamMember, linkedAccountTradingName) {
  if (linkedAccountTradingName) {
    const ln = norm(linkedAccountTradingName);
    const exact = partners.find((p) => norm(p.name) === ln);
    if (exact) return exact;
  }

  const candidates = distributorCandidates(user, teamMember, linkedAccountTradingName);
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

function spifsForRetail(state, retailTradingName) {
  const hint = norm(retailTradingName);
  if (!hint) return [];
  return state.spifs.filter((s) => {
    const ra = norm(s.retailAccountName);
    if (ra && (ra === hint || ra.includes(hint) || hint.includes(ra))) return true;
    const blob = norm(`${s.notes ?? ''} ${s.partnerName ?? ''} ${s.repName ?? ''} ${s.retailAccountName ?? ''}`);
    return blob.includes(hint);
  });
}

function mapSpifRow(s, extra = {}) {
  return {
    id: s.id,
    type: s.type,
    date: s.date,
    quantity: s.quantity,
    payout: s.payout,
    repName: s.repName,
    partnerName: s.partnerName,
    retailAccountName: s.retailAccountName,
    notes: s.notes,
    ...extra,
  };
}

function buildNetworkSummary(spifs) {
  const reps = [...new Set(spifs.map((s) => String(s.repName || '').trim()).filter(Boolean))];
  const retailAccounts = [
    ...new Set(spifs.map((s) => String(s.retailAccountName || '').trim()).filter(Boolean)),
  ];
  const distributors = [...new Set(spifs.map((s) => String(s.partnerName || '').trim()).filter(Boolean))];
  return {
    distributorCount: distributors.length,
    repCount: reps.length,
    retailAccountCount: retailAccounts.length,
    distributors: distributors.slice(0, 8),
    reps: reps.slice(0, 8),
    retailAccounts: retailAccounts.slice(0, 8),
  };
}

/**
 * @param {object} params
 * @param {string} params.role
 * @param {{ displayName?: string, email?: string }} params.user
 * @param {{ name?: string } | null | undefined} params.teamMember
 * @param {ReturnType<import('./incentive-manager-state.mjs').normalizeIncentiveManagerState>} params.state
 * @param {string | null | undefined} [params.retailTradingName]
 * @param {string | null | undefined} [params.linkedAccountTradingName]
 */
export function buildMyIncentiveProgress({
  role,
  user,
  teamMember,
  state,
  retailTradingName,
  linkedAccountTradingName,
}) {
  const program = {
    spifRates: state.spifRates,
    volumeBonusesUsd: state.volumeBonusesUsd,
  };

  if (role === 'distributor') {
    const partner = pickPartnerForDistributor(state.partners, user, teamMember, linkedAccountTradingName);
    const spifs = spifsForPartner(state, partner);
    const payoutTotal = spifs.reduce((a, s) => a + (Number(s.payout) || 0), 0);
    const matchHint = partner
      ? null
      : linkedAccountTradingName
        ? `No partner row matched "${linkedAccountTradingName}" — add or rename the partner in HQ Incentive Manager.`
        : 'Link your distributor CRM email to a partner name in HQ Incentive Manager (Settings → CRM).';

    return {
      scope: 'distributor',
      matched: Boolean(partner),
      matchHint,
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
      spifs: spifs.slice(0, 50).map((s) => mapSpifRow(s)),
      totals: { payoutTotal, spifCount: spifs.length },
      program,
      network: buildNetworkSummary(spifs),
      hqSource: 'incentive_manager',
    };
  }

  if (role === 'sales_rep' || role === 'sales') {
    const spifs = state.spifs.filter((s) => repMatchesSpi(s.repName, user, teamMember));
    const payoutTotal = spifs.reduce((a, s) => a + (Number(s.payout) || 0), 0);
    const matchHint =
      spifs.length > 0
        ? null
        : 'HQ has not logged SPIFs under your rep name yet — payouts appear here after Incentive Manager entries.';

    return {
      scope: 'sales_rep',
      matched: spifs.length > 0,
      matchHint,
      partner: null,
      spifs: spifs.slice(0, 50).map((s) => mapSpifRow(s)),
      totals: { payoutTotal, spifCount: spifs.length },
      program,
      network: buildNetworkSummary(spifs),
      hqSource: 'incentive_manager',
    };
  }

  if (role === 'retail' || role === 'retail_account') {
    const hintRaw = String(retailTradingName || user?.displayName || '').trim();
    const spifs = spifsForRetail(state, hintRaw);
    const payoutTotal = spifs.reduce((a, s) => a + (Number(s.payout) || 0), 0);
    const servicingDistributor = spifs.find((s) => s.partnerName)?.partnerName ?? null;
    const assignedRep = spifs.find((s) => s.repName)?.repName ?? null;
    const matchHint =
      spifs.length > 0
        ? null
        : hintRaw
          ? `No HQ SPIF lines tagged "${hintRaw}" yet — ask your rep or distributor to log activity with your venue name.`
          : 'Set your retail trading name in account settings so HQ SPIFs can link to your store.';

    return {
      scope: 'retail',
      matched: spifs.length > 0,
      matchHint,
      retailTradingName: hintRaw || null,
      servicingDistributor,
      assignedRep,
      partner: null,
      spifs: spifs.slice(0, 25).map((s) => mapSpifRow(s)),
      totals: { payoutTotal, spifCount: spifs.length },
      program,
      network: buildNetworkSummary(spifs),
      hqSource: 'incentive_manager',
    };
  }

  return { scope: 'unsupported', matched: false, program };
}
