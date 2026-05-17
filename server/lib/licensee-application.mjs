import { getDb } from '../config/request-db.mjs';
import { platformDb } from '../config/database.mjs';

export const LICENSEE_STEPS = [
  'Business info',
  'Shipping & contact',
  'Accounting & payment',
  'Delivery',
  'Terms & sign',
];

/** Remove card PAN/CVC before persistence — card on file is collected via Stripe after approval. */
export function sanitizeLicenseeFormData(raw) {
  const data = raw && typeof raw === 'object' ? { ...raw } : {};
  delete data.cardNum;
  delete data.cardCvc;
  if (data.cardNumLast4) {
    data.cardNumLast4 = String(data.cardNumLast4).replace(/\D/g, '').slice(-4);
  }
  return data;
}

export async function loadLicenseeApplicationContext(token) {
  const invite = await getDb('user_invites')
    .where({ token: String(token).trim(), used: false })
    .whereRaw('expires_at > NOW()')
    .first();

  if (!invite) {
    return { ok: false, status: 404, error: 'Invalid or expired invitation link.' };
  }

  const tenant = await getDb('tenants').where({ id: invite.tenant_id }).first();
  const member = await getDb('team_members')
    .where({ tenant_id: invite.tenant_id, email: invite.email })
    .first();

  let account = null;
  if (member?.linked_account_id) {
    account = await getDb('accounts')
      .where({ id: member.linked_account_id, tenant_id: invite.tenant_id })
      .first();
  }

  const existing = await getDb('retail_licensee_applications')
    .where({ tenant_id: invite.tenant_id })
    .where((qb) => {
      qb.where({ invite_token: invite.token });
      if (account?.id) qb.orWhere({ account_id: account.id });
    })
    .where({ status: 'submitted' })
    .orderBy('submitted_at', 'desc')
    .first();

  let salesRepName = account?.sales_owner || null;
  if (member?.crm_requested_by_user_id) {
    const repUser = await platformDb('users').where({ id: member.crm_requested_by_user_id }).first();
    if (repUser?.display_name) salesRepName = repUser.display_name;
  }

  return {
    ok: true,
    context: {
      token: invite.token,
      email: invite.email,
      storeName: account?.trading_name || account?.name || member?.retail_trading_name || '',
      tradingName: account?.trading_name || account?.name || '',
      wholesalerName: tenant?.name || 'Your wholesaler',
      salesRepName: salesRepName || 'Your Hajime representative',
      expiresAt: invite.expires_at,
      alreadySubmitted: Boolean(existing),
      submittedAt: existing?.submitted_at ?? null,
    },
  };
}

function buildShippingAddress(form) {
  const parts = [
    form.shippingAddr,
    form.city,
    form.province,
    form.postalCode,
  ].filter(Boolean);
  return parts.join(', ');
}

export async function submitLicenseeApplication(token, formDataRaw) {
  const ctxResult = await loadLicenseeApplicationContext(token);
  if (!ctxResult.ok) return ctxResult;

  const { context } = ctxResult;
  if (context.alreadySubmitted) {
    return { ok: false, status: 409, error: 'This application has already been submitted.' };
  }

  const formData = sanitizeLicenseeFormData(formDataRaw);

  const businessName = String(formData.businessName || context.tradingName || '').trim();
  const contactEmail = String(formData.contactEmail || context.email || '').trim().toLowerCase();

  if (!businessName) {
    return { ok: false, status: 400, error: 'Business name is required.' };
  }
  if (!contactEmail) {
    return { ok: false, status: 400, error: 'Contact email is required.' };
  }
  if (!formData.agreed) {
    return { ok: false, status: 400, error: 'You must accept the terms and conditions.' };
  }

  const invite = await getDb('user_invites')
    .where({ token: String(token).trim(), used: false })
    .whereRaw('expires_at > NOW()')
    .first();

  const member = await getDb('team_members')
    .where({ tenant_id: invite.tenant_id, email: invite.email })
    .first();

  let accountId = member?.linked_account_id ?? null;
  let account = null;
  if (accountId) {
    account = await getDb('accounts').where({ id: accountId, tenant_id: invite.tenant_id }).first();
  }

  const market = [formData.city, 'Canada'].filter(Boolean).join(', ') || '—';
  const shippingJson = JSON.stringify({
    street: formData.shippingAddr || '',
    city: formData.city || '',
    province: formData.province || 'ON',
    postal: formData.postalCode || '',
    phone: formData.phone || '',
  });

  const now = new Date();

  await db.transaction(async (trx) => {
    if (account) {
      await trx('accounts')
        .where({ id: account.id, tenant_id: invite.tenant_id })
        .update({
          name: businessName,
          trading_name: businessName,
          email: contactEmail,
          phone: formData.phone || formData.contactPhone || account.phone,
          market,
          shipping_address: shippingJson,
          notes: `Licensee application submitted ${now.toISOString().slice(0, 10)}`,
          updated_at: now,
        });
      accountId = account.id;
    }

    await trx('retail_licensee_applications').insert({
      tenant_id: invite.tenant_id,
      account_id: accountId,
      invite_token: invite.token,
      status: 'submitted',
      form_data: formData,
      submitted_at: now,
      created_at: now,
      updated_at: now,
    });

    if (member) {
      await trx('team_members')
        .where({ id: member.id, tenant_id: invite.tenant_id })
        .update({
          name: String(formData.contactName || member.name || businessName).trim(),
          email: contactEmail,
          phone: formData.contactPhone || formData.phone || member.phone,
          retail_trading_name: businessName,
          updated_at: now,
        });
    }
  });

  return {
    ok: true,
    data: {
      storeName: businessName,
      email: contactEmail,
      salesRepName: context.salesRepName,
      submittedAt: now.toISOString(),
    },
  };
}
