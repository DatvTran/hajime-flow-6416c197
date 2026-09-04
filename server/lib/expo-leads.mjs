const DEFAULT_EVENT = 'HK26';

export const BUSINESS_TYPES = [
  'importer_distributor',
  'retailer',
  'hospitality',
  'duty_free',
  'media',
  'other',
];

export const EXPRESSIONS = ['first_press', 'yuzu_mint', 'both'];

export const INTERESTS = [
  'distribution',
  'importing',
  'retail_placement',
  'hospitality_placement',
  'duty_free',
  'samples',
  'pricing',
  'media_pr',
  'other',
];

export const BOTTLE_FORMATS = ['750ml', '200ml', 'both'];
export const VOLUMES = ['exploring', 'under_25', '25_99', '100_249', '250_plus', 'na'];
export const TERRITORIES = ['yes', 'possibly', 'no'];
export const TIMINGS = ['immediately', '1_3_months', '3_6_months', '6_plus', 'exploring'];
export const SCORES = ['A', 'B', 'C', 'D'];
export const STATUSES = ['new', 'met', 'follow_up', 'converted', 'closed'];

export const EXPO_LEAD_HQ_ROLES = new Set(['founder_admin', 'brand_operator', 'operations']);

export function canManageExpoLeads(role) {
  return EXPO_LEAD_HQ_ROLES.has(role);
}

export function normalizeEventCode(raw) {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  return s.length >= 2 ? s : DEFAULT_EVENT;
}

function trimStr(v, max) {
  if (v == null) return '';
  return String(v).trim().slice(0, max);
}

function optionalStr(v, max) {
  const s = trimStr(v, max);
  return s || null;
}

function parseInterests(raw) {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
  const out = [];
  for (const item of list) {
    const key = String(item).trim();
    if (INTERESTS.includes(key) && !out.includes(key)) out.push(key);
  }
  return out;
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function resolveExpoTenant(db) {
  return (
    (await db('tenants').where({ subdomain: 'hajime' }).first()) ??
    (await db('tenants').orderBy('created_at', 'asc').first())
  );
}

/** Create expo_leads if a deploy ran API code before knex migrate:latest applied 046. */
export async function ensureExpoLeadsTable(db) {
  if (await db.schema.hasTable('expo_leads')) return true;
  try {
    const { up } = await import('../migrations/046_expo_leads.mjs');
    await up(db);
  } catch (err) {
    if (!(await db.schema.hasTable('expo_leads'))) throw err;
  }
  return db.schema.hasTable('expo_leads');
}

export function validateBuyerPayload(body) {
  const errors = [];
  const fullName = trimStr(body?.fullName ?? body?.full_name, 255);
  const companyName = trimStr(body?.companyName ?? body?.company_name, 255);
  const jobTitle = trimStr(body?.jobTitle ?? body?.job_title, 255);
  const businessEmail = trimStr(body?.businessEmail ?? body?.business_email, 255).toLowerCase();
  const countryMarket = trimStr(body?.countryMarket ?? body?.country_market, 120);
  const businessType = trimStr(body?.businessType ?? body?.business_type, 64);
  const expression = trimStr(body?.expression, 64);
  const consent = body?.consent === true || body?.consent === 'true';

  if (!fullName) errors.push('Full name is required');
  if (!companyName) errors.push('Company name is required');
  if (!jobTitle) errors.push('Job title is required');
  if (!businessEmail || !isEmail(businessEmail)) errors.push('A valid business email is required');
  if (!countryMarket) errors.push('Country / market is required');
  if (!BUSINESS_TYPES.includes(businessType)) errors.push('Select what best describes your business');
  if (!EXPRESSIONS.includes(expression)) errors.push('Select which Hajime expression interests you');
  if (!consent) errors.push('Consent is required to submit');

  const bottleFormat = optionalStr(body?.bottleFormat ?? body?.bottle_format, 32);
  if (bottleFormat && !BOTTLE_FORMATS.includes(bottleFormat)) errors.push('Invalid bottle format');
  const volume = optionalStr(body?.volume, 32);
  if (volume && !VOLUMES.includes(volume)) errors.push('Invalid volume');
  const territory = optionalStr(body?.territory, 16);
  if (territory && !TERRITORIES.includes(territory)) errors.push('Invalid territory answer');
  const timing = optionalStr(body?.timing, 32);
  if (timing && !TIMINGS.includes(timing)) errors.push('Invalid timing');

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      event_code: normalizeEventCode(body?.eventCode ?? body?.event_code),
      full_name: fullName,
      company_name: companyName,
      job_title: jobTitle,
      business_email: businessEmail,
      mobile: optionalStr(body?.mobile, 80),
      country_market: countryMarket,
      company_website: optionalStr(body?.companyWebsite ?? body?.company_website, 512),
      business_type: businessType,
      expression,
      interests: parseInterests(body?.interests),
      bottle_format: bottleFormat,
      volume,
      territory,
      timing,
      message: optionalStr(body?.message, 4000),
    },
  };
}

export function parseJsonb(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function serializeExpoLead(row, { publicView = false } = {}) {
  if (!row) return null;
  const base = {
    displayId: row.display_id,
    submittedAt: row.submitted_at,
  };
  if (publicView) return base;

  return {
    id: String(row.id),
    eventCode: row.event_code,
    seq: row.seq,
    displayId: row.display_id,
    fullName: row.full_name,
    companyName: row.company_name,
    jobTitle: row.job_title,
    businessEmail: row.business_email,
    mobile: row.mobile,
    countryMarket: row.country_market,
    companyWebsite: row.company_website,
    businessType: row.business_type,
    expression: row.expression,
    interests: parseJsonb(row.interests),
    bottleFormat: row.bottle_format,
    volume: row.volume,
    territory: row.territory,
    timing: row.timing,
    message: row.message,
    consentAt: row.consent_at,
    submittedAt: row.submitted_at,
    metAt: row.met_at,
    score: row.score,
    staffUserId: row.staff_user_id != null ? String(row.staff_user_id) : null,
    staffName: row.staff_name || row.staff_display_name || null,
    tastingCompleted: Boolean(row.tasting_completed),
    sampleRequested: Boolean(row.sample_requested),
    pricingRequested: Boolean(row.pricing_requested),
    distributorDeckSent: Boolean(row.distributor_deck_sent),
    nextAction: row.next_action,
    followUpOn: row.follow_up_on
      ? row.follow_up_on instanceof Date
        ? row.follow_up_on.toISOString().slice(0, 10)
        : String(row.follow_up_on).slice(0, 10)
      : null,
    status: row.status,
    accountId: row.account_id != null ? String(row.account_id) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function boolFrom(v) {
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  return undefined;
}

export function validateInternalPatch(body) {
  const patch = {};
  if (Object.prototype.hasOwnProperty.call(body, 'score')) {
    const s = body.score == null || body.score === '' ? null : String(body.score).toUpperCase();
    if (s != null && !SCORES.includes(s)) return { ok: false, error: 'Invalid score' };
    patch.score = s;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    const st = String(body.status);
    if (!STATUSES.includes(st)) return { ok: false, error: 'Invalid status' };
    patch.status = st;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'staffName') || Object.prototype.hasOwnProperty.call(body, 'staff_name')) {
    patch.staff_name = optionalStr(body.staffName ?? body.staff_name, 255);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'staffUserId') || Object.prototype.hasOwnProperty.call(body, 'staff_user_id')) {
    const v = body.staffUserId ?? body.staff_user_id;
    patch.staff_user_id = v == null || v === '' ? null : Number(v);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'metAt') || Object.prototype.hasOwnProperty.call(body, 'met_at')) {
    const v = body.metAt ?? body.met_at;
    patch.met_at = v ? new Date(v) : null;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'nextAction') || Object.prototype.hasOwnProperty.call(body, 'next_action')) {
    patch.next_action = optionalStr(body.nextAction ?? body.next_action, 2000);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'followUpOn') || Object.prototype.hasOwnProperty.call(body, 'follow_up_on')) {
    const v = body.followUpOn ?? body.follow_up_on;
    patch.follow_up_on = v ? String(v).slice(0, 10) : null;
  }
  for (const [js, col] of [
    ['tastingCompleted', 'tasting_completed'],
    ['sampleRequested', 'sample_requested'],
    ['pricingRequested', 'pricing_requested'],
    ['distributorDeckSent', 'distributor_deck_sent'],
  ]) {
    const snake = col;
    if (Object.prototype.hasOwnProperty.call(body, js) || Object.prototype.hasOwnProperty.call(body, snake)) {
      const b = boolFrom(body[js] ?? body[snake]);
      if (b === undefined) return { ok: false, error: `Invalid ${js}` };
      patch[col] = b;
    }
  }
  return { ok: true, patch };
}

export async function insertExpoLead(db, tenantId, buyer) {
  const now = new Date();
  return db.transaction(async (trx) => {
    await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', [`expo_leads:${tenantId}:${buyer.event_code}`]);
    const agg = await trx('expo_leads')
      .where({ tenant_id: tenantId, event_code: buyer.event_code })
      .max('seq as max')
      .first();
    const seq = Number(agg?.max ?? 0) + 1;
    const displayId = `${buyer.event_code}-${String(seq).padStart(3, '0')}`;
    const [row] = await trx('expo_leads')
      .insert({
        tenant_id: tenantId,
        event_code: buyer.event_code,
        seq,
        display_id: displayId,
        full_name: buyer.full_name,
        company_name: buyer.company_name,
        job_title: buyer.job_title,
        business_email: buyer.business_email,
        mobile: buyer.mobile,
        country_market: buyer.country_market,
        company_website: buyer.company_website,
        business_type: buyer.business_type,
        expression: buyer.expression,
        interests: JSON.stringify(buyer.interests ?? []),
        bottle_format: buyer.bottle_format,
        volume: buyer.volume,
        territory: buyer.territory,
        timing: buyer.timing,
        message: buyer.message,
        consent_at: now,
        submitted_at: now,
        met_at: now,
        status: 'new',
      })
      .returning('*');
    return row;
  });
}

export function expoLeadListQuery(db, tenantId) {
  return db('expo_leads as e')
    .leftJoin('users as u', 'u.id', 'e.staff_user_id')
    .where('e.tenant_id', tenantId)
    .select('e.*', 'u.display_name as staff_display_name');
}
