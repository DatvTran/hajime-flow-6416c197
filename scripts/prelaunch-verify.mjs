#!/usr/bin/env node
/**
 * Pre-launch smoke test — login each portal role and verify critical API + DB routing.
 *
 * Usage:
 *   BASE_URL=https://supply.drinkhajime.jp node scripts/prelaunch-verify.mjs
 *   BASE_URL=http://localhost:8080 node scripts/prelaunch-verify.mjs
 */
const BASE_URL = (process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

/** Demo / staging accounts — override via PRELAUNCH_ACCOUNTS JSON env if needed. */
const ACCOUNTS = JSON.parse(
  process.env.PRELAUNCH_ACCOUNTS ||
    JSON.stringify([
      { label: 'Brand HQ', email: 'admin@hajime.jp', password: 'admin123!', role: 'brand_operator' },
      { label: 'Manufacturer (via HQ)', email: 'admin@hajime.jp', password: 'admin123!', role: 'manufacturer' },
      { label: 'Distributor (Metro)', email: 'fulfillment@metrologistics.example', password: 'admin123!', role: 'distributor' },
      { label: 'Sales rep', email: 'marcus.chen@hajime.jp', password: 'admin123!', role: 'sales_rep' },
      { label: 'Retail', email: 'retail@hajime.jp', password: 'retail123!', role: 'retail' },
    ]),
);

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`login ${email}: ${res.status} ${body.error || res.statusText}`);
  }
  return { token: body.accessToken, user: body.user };
}

async function apiGet(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function countArray(data, key) {
  const v = data?.[key];
  return Array.isArray(v) ? v.length : 0;
}

/** Role-specific checks after bootstrap succeeds. */
const ROLE_CHECKS = {
  brand_operator: async (token, bootstrap) => {
    const orgs = await apiGet('/api/v1/distributor-organizations', token);
    return {
      distributorOrgs: orgs.ok ? (orgs.body.data?.length ?? 0) : `ERR ${orgs.status}`,
      products: countArray(bootstrap, 'products'),
      accounts: countArray(bootstrap, 'accounts'),
    };
  },
  manufacturer: async (token, bootstrap) => {
    const pos = await apiGet('/api/v1/purchase-orders?limit=5', token);
    return {
      purchaseOrdersApi: pos.ok ? (pos.body.data?.length ?? 0) : `ERR ${pos.status}`,
      newProductRequests: countArray(bootstrap, 'newProductRequests'),
    };
  },
  distributor: async (token, bootstrap) => {
    const team = await apiGet('/api/v1/team-members', token);
    return {
      scopedAccounts: countArray(bootstrap, 'accounts'),
      teamMembers: team.ok ? (team.body.data?.length ?? 0) : `ERR ${team.status}`,
      orders: countArray(bootstrap, 'orders'),
    };
  },
  sales_rep: async (token, bootstrap) => {
    const targets = await apiGet('/api/v1/sales-targets', token);
    const notes = await apiGet('/api/v1/visit-notes?limit=10', token);
    return {
      scopedAccounts: countArray(bootstrap, 'accounts'),
      visitNotesBootstrap: countArray(bootstrap, 'visitNotes'),
      visitNotesApi: notes.ok ? (notes.body.data?.length ?? 0) : `ERR ${notes.status}`,
      salesTargets: targets.ok ? (targets.body.data?.length ?? 0) : `ERR ${targets.status}`,
    };
  },
  retail: async (token) => {
    const settings = await apiGet('/api/v1/me/retail-account-settings', token);
    return {
      retailSettings: settings.ok ? 'ok' : `ERR ${settings.status}`,
    };
  },
};

async function verifyAccount({ label, email, password, role, optional }) {
  const result = { label, email, role, optional: Boolean(optional), ok: false, error: null, details: {} };
  try {
    const { token, user } = await login(email, password);
    result.loggedInAs = user?.role;

    const boot = await apiGet('/api/v1/app-bootstrap', token);
    if (!boot.ok) {
      throw new Error(`app-bootstrap: ${boot.status} ${boot.body?.error || ''}`);
    }
    const bootstrap = boot.body.data ?? {};
    result.details.bootstrapMs = bootstrap.meta?.ms;
    result.details.scope = bootstrap.meta?.scope;

    const checker = ROLE_CHECKS[role] || ROLE_CHECKS[user?.role];
    if (checker) {
      result.details = { ...result.details, ...(await checker(token, bootstrap)) };
    }

    result.ok = true;
  } catch (err) {
    result.error = err.message || String(err);
    if (optional && result.error.includes('401')) {
      result.ok = true;
      result.skipped = true;
      result.details.note = 'Optional account not provisioned on this environment';
    }
  }
  return result;
}

async function main() {
  console.log(`\nHajime pre-launch verify — ${BASE_URL}\n`);
  const results = [];
  for (const account of ACCOUNTS) {
    process.stdout.write(`  ${account.label} (${account.email})… `);
    const r = await verifyAccount(account);
    results.push(r);
    console.log(r.ok ? (r.skipped ? 'SKIP (optional)' : 'PASS') : `FAIL — ${r.error}`);
    if (r.ok && Object.keys(r.details).length > 0) {
      console.log(`    ${JSON.stringify(r.details)}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n--- Summary ---');
  console.log(`  ${results.length - failed.length}/${results.length} roles passed`);
  if (failed.length > 0) {
    console.log('\n  Failures:');
    for (const f of failed) {
      console.log(`    • ${f.label}: ${f.error}`);
    }
    process.exit(1);
  }
  console.log('\n  All role checks passed. Ready for pre-launch testing.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
