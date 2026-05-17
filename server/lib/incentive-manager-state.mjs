/** @param {unknown} n */
function clampUsd(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return 0;
  return Math.min(x, 1_000_000);
}

const DEFAULT_SUPPLY = { landed: 30, wholesale: 48, retail: 60, shelf: 93 };
const DEFAULT_SPIF_RATES = { new_on_premise: 150, new_off_premise: 100, reorder: 5, tasting: 25 };
const DEFAULT_VOLUME = { gold: 2500, silver: 1200 };

const SPIF_TYPES = new Set(['new_on_premise', 'new_off_premise', 'reorder', 'tasting']);
const PARTNER_TIERS = new Set(['Foundation', 'Growth', 'Premier']);
const PERF_TIERS = new Set(['Bronze', 'Silver', 'Gold']);

const MAX_PARTNERS = 500;
const MAX_SPIFS = 10_000;
const MAX_STATE_JSON = 2_500_000;

/**
 * Normalize and clamp incentive manager payload from client or DB.
 * @param {unknown} body
 * @returns {{ partners: object[], spifs: object[], supplyChainPricing: object, spifRates: object, volumeBonusesUsd: object }}
 */
export function normalizeIncentiveManagerState(body) {
  const b = body && typeof body === 'object' ? /** @type {Record<string, unknown>} */ (body) : {};

  const partnersIn = Array.isArray(b.partners) ? b.partners : [];
  const partners = partnersIn.slice(0, MAX_PARTNERS).map((raw) => {
    const p = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {};
    const tier = PARTNER_TIERS.has(String(p.tier)) ? String(p.tier) : 'Foundation';
    let qpt = p.quarterlyPerformanceTier;
    if (qpt !== null && qpt !== undefined && qpt !== '' && !PERF_TIERS.has(String(qpt))) {
      qpt = null;
    }
    return {
      id: String(p.id ?? '').trim().slice(0, 64) || `p_${Math.random().toString(36).slice(2, 11)}`,
      name: String(p.name ?? '').trim().slice(0, 255) || 'Partner',
      market: String(p.market ?? '').trim().slice(0, 120) || '—',
      tier,
      quarterlyCasesSold: Math.max(0, Math.floor(Number(p.quarterlyCasesSold) || 0)),
      accountsOpened: Math.max(0, Math.floor(Number(p.accountsOpened) || 0)),
      reorders: Math.max(0, Math.floor(Number(p.reorders) || 0)),
      tastingsCompleted: Math.max(0, Math.floor(Number(p.tastingsCompleted) || 0)),
      adfSpend: clampUsd(p.adfSpend),
      quarterlyPerformanceTier: qpt === null || qpt === '' ? null : String(qpt),
    };
  });

  const spifsIn = Array.isArray(b.spifs) ? b.spifs : [];
  const spifs = spifsIn.slice(0, MAX_SPIFS).map((raw) => {
    const s = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {};
    const type = SPIF_TYPES.has(String(s.type)) ? String(s.type) : 'reorder';
    return {
      id: String(s.id ?? '').trim().slice(0, 64) || `s_${Math.random().toString(36).slice(2, 11)}`,
      partnerId: String(s.partnerId ?? '').trim().slice(0, 64),
      partnerName: String(s.partnerName ?? '').trim().slice(0, 255),
      repName: String(s.repName ?? '').trim().slice(0, 255),
      type,
      date: String(s.date ?? '').trim().slice(0, 32),
      quantity: Math.max(1, Math.floor(Number(s.quantity) || 1)),
      payout: clampUsd(s.payout),
      notes: s.notes != null ? String(s.notes).trim().slice(0, 2000) : undefined,
    };
  });

  const sc = b.supplyChainPricing && typeof b.supplyChainPricing === 'object'
    ? /** @type {Record<string, unknown>} */ (b.supplyChainPricing)
    : {};
  const supplyChainPricing = {
    landed: clampUsd(sc.landed ?? DEFAULT_SUPPLY.landed),
    wholesale: clampUsd(sc.wholesale ?? DEFAULT_SUPPLY.wholesale),
    retail: clampUsd(sc.retail ?? DEFAULT_SUPPLY.retail),
    shelf: clampUsd(sc.shelf ?? DEFAULT_SUPPLY.shelf),
  };

  const sr = b.spifRates && typeof b.spifRates === 'object' ? /** @type {Record<string, unknown>} */ (b.spifRates) : {};
  const spifRates = {
    new_on_premise: clampUsd(sr.new_on_premise ?? DEFAULT_SPIF_RATES.new_on_premise),
    new_off_premise: clampUsd(sr.new_off_premise ?? DEFAULT_SPIF_RATES.new_off_premise),
    reorder: clampUsd(sr.reorder ?? DEFAULT_SPIF_RATES.reorder),
    tasting: clampUsd(sr.tasting ?? DEFAULT_SPIF_RATES.tasting),
  };

  const vb = b.volumeBonusesUsd && typeof b.volumeBonusesUsd === 'object'
    ? /** @type {Record<string, unknown>} */ (b.volumeBonusesUsd)
    : {};
  const volumeBonusesUsd = {
    gold: clampUsd(vb.gold ?? DEFAULT_VOLUME.gold),
    silver: clampUsd(vb.silver ?? DEFAULT_VOLUME.silver),
  };

  return { partners, spifs, supplyChainPricing, spifRates, volumeBonusesUsd };
}

/**
 * @param {unknown} state
 */
export function incentiveStateJsonByteLength(state) {
  try {
    return Buffer.byteLength(JSON.stringify(state), 'utf8');
  } catch {
    return MAX_STATE_JSON + 1;
  }
}

export { MAX_STATE_JSON };
