function normEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normLabel(value) {
  return String(value ?? '').trim().toLowerCase();
}

function emailDomain(email) {
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1) : '';
}

function addLabel(set, value) {
  const trimmed = String(value ?? '').trim();
  if (trimmed) set.add(trimmed);
}

/** Built-in HQ partners — mirrors client `HQ_MANUFACTURER_PARTNER_IDS` for portal scoping. */
const HQ_PARTNERS = [
  {
    id: 'kosapan',
    accountId: 'demo-kosapan',
    names: ['Kosapan Distillery', 'Kosapan Distillery Co., Ltd.'],
  },
  {
    id: 'kuramoto',
    accountId: 'demo-kuramoto',
    names: ['Kuramoto Brewing', 'Kuramoto Brewing Co.'],
  },
  {
    id: 'echigo',
    accountId: 'demo-echigo',
    names: ['Echigo Kura', 'Echigo Kura Ltd.'],
  },
];

/**
 * Resolve which manufacturer labels / emails belong to the signed-in manufacturer user.
 * @returns {Promise<{ email: string, emails: Set<string>, labels: Set<string>, crmMemberIds: Set<string> }>}
 */
export async function resolveManufacturerAssignmentIdentity(db, tenantId, user) {
  const email = normEmail(user?.email);
  const emails = new Set();
  const labels = new Set();
  const crmMemberIds = new Set();

  if (email) emails.add(email);

  const mfgTeam = await db('team_members')
    .where({ tenant_id: tenantId, role: 'manufacturer' });

  for (const tm of mfgTeam) {
    const tmEmail = normEmail(tm.email);
    if (tmEmail && tmEmail === email) {
      addLabel(labels, tm.name || tm.display_name);
      if (tm.id != null) crmMemberIds.add(String(tm.id));
    }
  }

  const profiles = await db('manufacturer_profiles').where({ tenant_id: tenantId });
  for (const profile of profiles) {
    const profileEmail = normEmail(profile.email);
    if (profileEmail && profileEmail === email) {
      addLabel(labels, profile.company_name);
      addLabel(labels, profile.contact_name);
      if (profile.manufacturer_id) crmMemberIds.add(String(profile.manufacturer_id));
    }
  }

  // HQ partner catalog — match portal logins like lunnalin@kosapandistillery.com → kosapan
  for (const partner of HQ_PARTNERS) {
    const emailMatchesPartner =
      (email && (email.includes(partner.id) || emailDomain(email).includes(partner.id))) ||
      profiles.some((p) => {
        const pe = normEmail(p.email);
        if (pe !== email) return false;
        const mid = String(p.manufacturer_id ?? '').toLowerCase();
        const company = normLabel(p.company_name);
        return mid === partner.id || company.includes(partner.id);
      });

    if (!emailMatchesPartner) continue;

    for (const name of partner.names) addLabel(labels, name);
    for (const profile of profiles) {
      const mid = String(profile.manufacturer_id ?? '').toLowerCase();
      const company = normLabel(profile.company_name);
      if (mid === partner.id || company.includes(partner.id)) {
        addLabel(labels, profile.company_name);
        if (profile.manufacturer_id) crmMemberIds.add(String(profile.manufacturer_id));
        const pe = normEmail(profile.email);
        if (pe) emails.add(pe);
      }
    }
    crmMemberIds.add(partner.id);
    crmMemberIds.add(partner.accountId);
  }

  // Also hydrate partner labels from operational_settings overrides when present
  try {
    const settings = await db('operational_settings').where({ tenant_id: tenantId }).first();
    const raw = settings?.hq_manufacturer_partner_configs;
    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === 'object') {
        for (const partner of HQ_PARTNERS) {
          const cfg = parsed[partner.id];
          if (!cfg || typeof cfg !== 'object') continue;
          const portalEmail = normEmail(cfg.portalLoginEmail || cfg.email);
          const matches =
            (portalEmail && portalEmail === email) ||
            (email && (email.includes(partner.id) || emailDomain(email).includes(partner.id)));
          if (!matches) continue;
          addLabel(labels, cfg.name);
          addLabel(labels, cfg.legalName);
          if (portalEmail) emails.add(portalEmail);
          crmMemberIds.add(partner.id);
          if (cfg.accountId) crmMemberIds.add(String(cfg.accountId));
        }
      }
    }
  } catch {
    // ignore corrupt settings JSON
  }

  const accounts = await db('accounts')
    .where({ tenant_id: tenantId, type: 'manufacturer' })
    .whereNull('deleted_at');

  const userDomain = emailDomain(email);
  const userIsMfgContact = mfgTeam.some((tm) => normEmail(tm.email) === email);

  for (const acc of accounts) {
    const accEmail = normEmail(acc.email);
    const portalEmail = normEmail(acc.portal_login_email);
    const accDomain = emailDomain(accEmail || portalEmail);
    const trading = acc.trading_name || acc.tradingName;
    const legal = acc.legal_name || acc.legalName;

    const directAccountEmail = accEmail && accEmail === email;
    const directPortalEmail = portalEmail && portalEmail === email;
    const sharedOrgDomain =
      userIsMfgContact && userDomain && accDomain && userDomain === accDomain;
    const accountLinkedViaTeam = mfgTeam.some((tm) => {
      const tmEmail = normEmail(tm.email);
      return tmEmail === accEmail || (userIsMfgContact && tmEmail && emailDomain(tmEmail) === userDomain);
    });

    if (directAccountEmail || directPortalEmail || sharedOrgDomain || accountLinkedViaTeam) {
      addLabel(labels, trading);
      addLabel(labels, legal);
      if (accEmail) emails.add(accEmail);
      if (portalEmail) emails.add(portalEmail);
      if (acc.id != null) crmMemberIds.add(String(acc.id));
      for (const tm of mfgTeam) {
        const tmEmail = normEmail(tm.email);
        if (tmEmail && (tmEmail === accEmail || (userDomain && emailDomain(tmEmail) === userDomain))) {
          emails.add(tmEmail);
          addLabel(labels, tm.name || tm.display_name);
          if (tm.id != null) crmMemberIds.add(String(tm.id));
        }
      }
    }
  }

  return { email, emails, labels, crmMemberIds };
}

/** Whether an NPR row is assigned to the given manufacturer identity. */
export function nprMatchesManufacturerIdentity(row, identity) {
  if (!row || !identity) return false;

  const assignedEmail = normEmail(row.assigned_manufacturer_email);
  if (assignedEmail && identity.emails.has(assignedEmail)) return true;

  const crmId = row.assigned_crm_member_id != null ? String(row.assigned_crm_member_id) : '';
  if (crmId && identity.crmMemberIds.has(crmId)) return true;

  const assignedLabel = normLabel(row.assigned_manufacturer);
  if (assignedLabel) {
    for (const label of identity.labels) {
      const nl = normLabel(label);
      if (!nl) continue;
      if (nl === assignedLabel || assignedLabel.includes(nl) || nl.includes(assignedLabel)) {
        return true;
      }
    }
  }

  return false;
}

export function filterNprsForManufacturerUser(rows, identity) {
  return rows.filter(
    (row) => row.status !== 'draft' && nprMatchesManufacturerIdentity(row, identity),
  );
}

export function applyManufacturerNprScopeToQuery(query, identity) {
  query.whereNot('status', 'draft');

  const emails = [...identity.emails].filter(Boolean);
  const crmIds = [...identity.crmMemberIds].filter(Boolean);
  const labels = [...identity.labels].map(normLabel).filter(Boolean);

  if (!emails.length && !crmIds.length && !labels.length) {
    query.whereRaw('1 = 0');
    return query;
  }

  query.where(function applyScope() {
    if (emails.length) {
      this.orWhereIn('assigned_manufacturer_email', emails);
    }
    if (crmIds.length) {
      this.orWhereIn('assigned_crm_member_id', crmIds);
      for (const id of crmIds) {
        this.orWhereRaw('lower(trim(coalesce(assigned_crm_member_id, \'\'))) = ?', [
          String(id).toLowerCase(),
        ]);
      }
    }
    for (const label of labels) {
      this.orWhereRaw('lower(trim(assigned_manufacturer)) = ?', [label]);
      this.orWhereRaw('lower(trim(assigned_manufacturer)) like ?', [`%${label}%`]);
    }
  });

  return query;
}

/** Whether a production PO row is assigned to the signed-in manufacturer. */
export function poMatchesManufacturerIdentity(row, identity) {
  if (!row || !identity) return false;

  const mfgId = row.manufacturer_id != null ? String(row.manufacturer_id).trim() : '';
  if (mfgId) {
    if (identity.crmMemberIds.has(mfgId)) return true;
    const lower = mfgId.toLowerCase();
    if ([...identity.crmMemberIds].some((id) => String(id).toLowerCase() === lower)) return true;
  }

  const supplier = normLabel(row.supplier_name);
  if (!supplier) return false;
  for (const label of identity.labels) {
    const nl = normLabel(label);
    if (!nl) continue;
    if (nl === supplier || supplier.includes(nl) || nl.includes(supplier)) return true;
  }
  return false;
}

export function filterPosForManufacturerUser(rows, identity) {
  return rows.filter(
    (row) => String(row.status ?? '') !== 'draft' && poMatchesManufacturerIdentity(row, identity),
  );
}

/** Restrict PO list to rows issued to this manufacturer (excludes HQ drafts). */
export function applyManufacturerPoScopeToQuery(query, identity) {
  query.whereNot('status', 'draft');

  const crmIds = [...identity.crmMemberIds].filter(Boolean);
  const labels = [...identity.labels].map(normLabel).filter(Boolean);

  if (!crmIds.length && !labels.length) {
    query.whereRaw('1 = 0');
    return query;
  }

  query.where(function applyPoScope() {
    if (crmIds.length) {
      this.orWhereIn('manufacturer_id', crmIds);
      // Case-insensitive partner ids (kosapan vs Kosapan)
      for (const id of crmIds) {
        this.orWhereRaw('lower(trim(coalesce(manufacturer_id, \'\'))) = ?', [String(id).toLowerCase()]);
      }
    }
    for (const label of labels) {
      this.orWhereRaw('lower(trim(supplier_name)) = ?', [label]);
      this.orWhereRaw('lower(trim(supplier_name)) like ?', [`%${label}%`]);
      this.orWhereRaw('? like concat(\'%\', lower(trim(supplier_name)), \'%\')', [label]);
    }
  });

  return query;
}

/**
 * Resolve the portal contact email for a production PO / NPR assignment.
 * Prefers manufacturer_profiles, then team_members, for the assigned partner id or label.
 */
export async function resolveManufacturerNotifyEmail(db, tenantId, { manufacturerId, supplierName, emailHint } = {}) {
  const hint = normEmail(emailHint);
  if (hint) return hint;

  const mid = manufacturerId != null ? String(manufacturerId).trim() : '';
  const label = normLabel(supplierName);

  if (mid) {
    const byId = await db('manufacturer_profiles')
      .where({ tenant_id: tenantId })
      .andWhere(function matchId() {
        this.where('manufacturer_id', mid).orWhereRaw('lower(trim(coalesce(manufacturer_id, \'\'))) = ?', [
          mid.toLowerCase(),
        ]);
      })
      .first();
    const pe = normEmail(byId?.email);
    if (pe) return pe;

    const tm = await db('team_members')
      .where({ tenant_id: tenantId, role: 'manufacturer' })
      .andWhere(function matchTm() {
        this.where('id', mid).orWhereRaw('lower(trim(coalesce(id::text, \'\'))) = ?', [mid.toLowerCase()]);
      })
      .first();
    const te = normEmail(tm?.email);
    if (te) return te;
  }

  if (label) {
    const byName = await db('manufacturer_profiles')
      .where({ tenant_id: tenantId })
      .andWhere(function matchName() {
        this.whereRaw('lower(trim(coalesce(company_name, \'\'))) = ?', [label]).orWhereRaw(
          'lower(trim(coalesce(company_name, \'\'))) like ?',
          [`%${label}%`],
        );
      })
      .first();
    const pe = normEmail(byName?.email);
    if (pe) return pe;
  }

  return '';
}

const MANUFACTURER_WRITABLE = new Set([
  'status',
  'manufacturer_proposal',
  'review_started_at',
  'proposal_received_at',
]);

const MANUFACTURER_STATUSES = new Set(['under_review', 'proposed', 'declined']);

/** Strip fields a manufacturer user may not mutate on an NPR row. */
export function sanitizeManufacturerNprUpdate(updates) {
  const out = {};
  for (const key of MANUFACTURER_WRITABLE) {
    if (updates[key] !== undefined) out[key] = updates[key];
  }
  return out;
}

/** @returns {string|null} denial reason */
export function assertManufacturerNprUpdateAllowed(existing, updates) {
  if (!existing || existing.status === 'draft') {
    return 'Draft briefs are not visible to manufacturers';
  }
  if (updates.status && !MANUFACTURER_STATUSES.has(String(updates.status))) {
    return `Manufacturer cannot set status to ${updates.status}`;
  }
  return null;
}

/** Apply workflow timestamps when status advances (HQ ↔ manufacturer handshake). */
export function applyNprStatusTimestamps(existing, updates) {
  const next = { ...updates };
  if (next.status === 'submitted' && existing.status !== 'submitted' && !next.submitted_at) {
    next.submitted_at = new Date();
  }
  if (
    (next.status === 'under_review' || next.manufacturer_proposal) &&
    !existing.review_started_at &&
    !next.review_started_at
  ) {
    next.review_started_at = new Date();
  }
  if (next.status === 'proposed' && !next.proposal_received_at) {
    next.proposal_received_at = new Date();
  }
  if (
    (next.status === 'approved' || next.status === 'rejected' || next.status === 'declined') &&
    !next.decided_at &&
    existing.status !== next.status
  ) {
    next.decided_at = new Date();
  }
  return next;
}
