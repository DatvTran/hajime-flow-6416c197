import { countryFromPhone } from './dial-countries.mjs';

const DEFAULT_EVENT = 'HK26';

export const BUSINESS_TYPES = [
  'importer_distributor',
  'retailer',
  'hospitality',
  'duty_free',
  'media',
  'other',
  'restaurant',
  'bar',
  'hotel',
  'retail',
  'wholesale',
  'importer',
];

export const EXPRESSIONS = ['first_press', 'yuzu_mint', 'both'];

/** Product ids picked on the mobile Connect flow; stored in `expression`. */
export const PRODUCT_IDS = ['first_press', 'second_bloom'];

export const ENQUIRY_PURPOSES = ['pricing', 'tasting', 'distribution'];

export const CONNECT_FORM_VERSION = 'hajime_supply_v1';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

export const INTERESTS = [
  'tasting',
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

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

/** "+852 9123-4567" -> "+85291234567"; null when not 6–15 digits. */
export function normalizePhone(raw) {
  const s = trimStr(raw, 80);
  const digits = s.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) return null;
  return s.startsWith('+') || s.startsWith('00') ? `+${digits.replace(/^00/, '')}` : digits;
}

function pickList(raw, allowed) {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' && raw ? [raw] : [];
  const out = [];
  for (const item of list) {
    const key = String(item).trim();
    if (allowed.includes(key) && !out.includes(key)) out.push(key);
  }
  return out;
}

export function expressionFromProducts(products) {
  const fp = products.includes('first_press');
  const sb = products.includes('second_bloom');
  if (fp && sb) return 'both';
  if (fp) return 'first_press';
  if (sb) return 'yuzu_mint';
  return '';
}

function parseUtm(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out = {};
  for (const key of UTM_KEYS) {
    const v = trimStr(raw[key], 100);
    if (v) out[key] = v;
  }
  return Object.keys(out).length ? out : null;
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
  const products = pickList(body?.products, PRODUCT_IDS);
  const expression = products.length ? expressionFromProducts(products) : trimStr(body?.expression, 64);
  const purposes = pickList(body?.purposes, ENQUIRY_PURPOSES);
  const interests = pickList([...purposes, ...pickList(body?.interests, INTERESTS)], INTERESTS);
  const mobile = normalizePhone(body?.mobile ?? body?.phone);

  if (!fullName) errors.push('Please enter your name.');
  if (!businessEmail || !isEmail(businessEmail)) errors.push('Please enter a valid email address.');
  if (!mobile) errors.push('Please enter a valid phone number with country code.');
  if (!BUSINESS_TYPES.includes(businessType)) errors.push('Please choose your business type.');
  if (!EXPRESSIONS.includes(expression)) errors.push('Please choose at least one expression.');
  if (!interests.length) errors.push('Please choose how we can help.');

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
      company_name: companyName || null,
      job_title: jobTitle || null,
      business_email: businessEmail,
      mobile,
      country_market: countryMarket || null,
      company_website: optionalStr(body?.companyWebsite ?? body?.company_website, 512),
      business_type: businessType,
      expression,
      interests,
      bottle_format: bottleFormat,
      volume,
      territory,
      timing,
      message: optionalStr(body?.message, 4000),
      marketing_opt_in: body?.marketingOptIn === true || body?.marketing_opt_in === true,
      submission_key: optionalStr(body?.submissionKey ?? body?.submission_key, 64),
      utm: parseUtm(body?.utm),
      form_version: optionalStr(body?.formVersion, 32) || CONNECT_FORM_VERSION,
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
    marketingOptIn: Boolean(row.marketing_opt_in),
    utm: row.utm && typeof row.utm === 'object' ? row.utm : null,
    formVersion: row.form_version ?? null,
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
    const hasConnectCols = await trx.schema.hasColumn('expo_leads', 'submission_key');
    if (hasConnectCols && buyer.submission_key) {
      const existing = await trx('expo_leads')
        .where({ tenant_id: tenantId, submission_key: buyer.submission_key })
        .first();
      if (existing) return existing;
    }
    const agg = await trx('expo_leads')
      .where({ tenant_id: tenantId, event_code: buyer.event_code })
      .max('seq as max')
      .first();
    const seq = Number(agg?.max ?? 0) + 1;
    const displayId = `${buyer.event_code}-${String(seq).padStart(3, '0')}`;
    const payload = {
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
    };
    if (await trx.schema.hasColumn('expo_leads', 'capture_ip')) {
      payload.capture_ip = buyer.capture_ip || null;
    }
    if (hasConnectCols) {
      payload.marketing_opt_in = Boolean(buyer.marketing_opt_in);
      payload.submission_key = buyer.submission_key || null;
      payload.utm = buyer.utm ? JSON.stringify(buyer.utm) : null;
      payload.form_version = buyer.form_version || null;
    }
    const [row] = await trx('expo_leads').insert(payload).returning('*');
    return row;
  });
}

export const LEAD_ACCOUNT_TYPES = ['retail', 'bar', 'restaurant', 'hotel', 'distributor', 'lifestyle'];

const DISTRIBUTOR_BUSINESS_TYPES = new Set(['wholesale', 'importer', 'importer_distributor']);

export function accountTypeForLead(businessType) {
  const t = String(businessType ?? '');
  if (['restaurant', 'bar', 'hotel', 'retail'].includes(t)) return t;
  if (t === 'retailer') return 'retail';
  if (DISTRIBUTOR_BUSINESS_TYPES.has(t)) return 'distributor';
  return 'retail';
}

const EXPRESSION_NOTES = {
  first_press: 'First Press Coffee Rhum',
  yuzu_mint: 'Second Bloom Yuzu Mint Rhum',
  both: 'First Press Coffee Rhum, Second Bloom Yuzu Mint Rhum',
};

function humanize(key) {
  const s = String(key).replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Default values for the "Create account" form, from an expo_leads row. */
export function accountDraftFromLead(row) {
  const interests = parseJsonb(row.interests).map(humanize);
  const notes = [
    `From expo lead ${row.display_id} (${row.event_code}).`,
    row.expression && EXPRESSION_NOTES[row.expression] ? `Interested in: ${EXPRESSION_NOTES[row.expression]}.` : '',
    interests.length ? `Asked about: ${interests.join(', ')}.` : '',
    row.message ? `Buyer notes: ${row.message}` : '',
  ].filter(Boolean);
  return {
    tradingName: row.company_name || '',
    legalName: row.company_name || '',
    type: accountTypeForLead(row.business_type),
    contactName: row.full_name || '',
    email: row.business_email || '',
    phone: row.mobile || '',
    country: row.country_market || countryFromPhone(row.mobile) || '',
    city: '',
    notes: notes.join('\n'),
  };
}

/** Validates the "Create account" body; missing contact fields fall back to the lead. */
export function validateLeadAccountBody(body, row) {
  const draft = accountDraftFromLead(row);
  const pick = (key, max) => {
    if (!Object.prototype.hasOwnProperty.call(body ?? {}, key)) return trimStr(draft[key], max);
    return trimStr(body[key], max);
  };
  const tradingName = trimStr(body?.tradingName, 255);
  if (!tradingName) return { ok: false, error: 'Please enter the business name.' };
  const type = trimStr(body?.type, 50) || draft.type;
  if (!LEAD_ACCOUNT_TYPES.includes(type)) return { ok: false, error: 'Please choose a valid account type.' };
  const email = pick('email', 255).toLowerCase();
  if (email && !isEmail(email)) return { ok: false, error: 'Please enter a valid email address.' };
  return {
    ok: true,
    data: {
      tradingName,
      legalName: trimStr(body?.legalName, 255) || tradingName,
      type,
      contactName: pick('contactName', 255),
      email,
      phone: pick('phone', 50),
      country: pick('country', 100),
      city: pick('city', 100),
      salesOwner: trimStr(body?.salesOwner, 255) || null,
      notes: pick('notes', 4000),
    },
  };
}

export function expoLeadListQuery(db, tenantId) {
  return db('expo_leads as e')
    .leftJoin('users as u', 'u.id', 'e.staff_user_id')
    .where('e.tenant_id', tenantId)
    .select('e.*', 'u.display_name as staff_display_name');
}
