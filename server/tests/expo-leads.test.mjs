import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEventCode,
  validateBuyerPayload,
  validateInternalPatch,
  serializeExpoLead,
  canManageExpoLeads,
  accountTypeForLead,
  accountDraftFromLead,
  validateLeadAccountBody,
} from '../lib/expo-leads.mjs';
import { countryFromPhone } from '../lib/dial-countries.mjs';

test('normalizeEventCode defaults and sanitizes', () => {
  assert.equal(normalizeEventCode(''), 'HK26');
  assert.equal(normalizeEventCode('hk-26'), 'HK26');
  assert.equal(normalizeEventCode('vinexpo'), 'VINEXPO');
});

const mobileEnquiry = {
  fullName: 'Mei',
  businessEmail: 'mei@gmail.com',
  mobile: '+852 9123 4567',
  businessType: 'restaurant',
  products: ['first_press', 'second_bloom'],
  purposes: ['pricing', 'tasting'],
  submissionKey: 'abc123',
  utm: { utm_source: 'hk_expo_2026', utm_medium: 'qr', evil: 'x' },
};

test('validateBuyerPayload accepts the mobile enquiry with only name, email, phone typed', () => {
  const parsed = validateBuyerPayload({ ...mobileEnquiry, score: 'A' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.full_name, 'Mei');
  assert.equal(parsed.data.mobile, '+85291234567');
  assert.equal(parsed.data.expression, 'both');
  assert.deepEqual(parsed.data.interests, ['pricing', 'tasting']);
  assert.equal(parsed.data.company_name, null);
  assert.equal(parsed.data.marketing_opt_in, false);
  assert.equal(parsed.data.submission_key, 'abc123');
  assert.deepEqual(parsed.data.utm, { utm_source: 'hk_expo_2026', utm_medium: 'qr' });
  assert.equal(parsed.data.score, undefined);
});

test('validateBuyerPayload maps Second Bloom alone to yuzu_mint', () => {
  const parsed = validateBuyerPayload({ ...mobileEnquiry, products: ['second_bloom'] });
  assert.equal(parsed.data.expression, 'yuzu_mint');
});

test('validateBuyerPayload rejects missing phone, products or purposes', () => {
  for (const patch of [{ mobile: '12' }, { products: [] }, { purposes: [] }, { businessType: 'nope' }]) {
    const parsed = validateBuyerPayload({ ...mobileEnquiry, ...patch });
    assert.equal(parsed.ok, false, JSON.stringify(patch));
  }
});

test('validateBuyerPayload still accepts the legacy expression field', () => {
  const parsed = validateBuyerPayload({
    ...mobileEnquiry,
    products: undefined,
    expression: 'first_press',
    businessType: 'importer_distributor',
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.expression, 'first_press');
});

test('validateInternalPatch accepts A–D score', () => {
  const parsed = validateInternalPatch({ score: 'A', tastingCompleted: true });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.patch.score, 'A');
  assert.equal(parsed.patch.tasting_completed, true);
});

test('serializeExpoLead public view hides scoring', () => {
  const pub = serializeExpoLead(
    { display_id: 'HK26-001', submitted_at: '2026-01-01', score: 'A', full_name: 'X' },
    { publicView: true },
  );
  assert.equal(pub.displayId, 'HK26-001');
  assert.equal(pub.score, undefined);
  assert.equal(pub.fullName, undefined);
});

test('accountTypeForLead maps venues to themselves and trade buyers to distributor', () => {
  for (const t of ['restaurant', 'bar', 'hotel', 'retail']) assert.equal(accountTypeForLead(t), t);
  for (const t of ['wholesale', 'importer', 'importer_distributor']) assert.equal(accountTypeForLead(t), 'distributor');
  assert.equal(accountTypeForLead('retailer'), 'retail');
  assert.equal(accountTypeForLead('other'), 'retail');
  assert.equal(accountTypeForLead(null), 'retail');
});

test('countryFromPhone resolves dial codes and leaves +1 blank', () => {
  assert.equal(countryFromPhone('+85291234567'), 'Hong Kong');
  assert.equal(countryFromPhone('+447700900123'), 'United Kingdom');
  assert.equal(countryFromPhone('+12645551234'), 'Anguilla');
  assert.equal(countryFromPhone('+14165551234'), null);
  assert.equal(countryFromPhone('91234567'), null);
  assert.equal(countryFromPhone(null), null);
});

const mobileLeadRow = {
  display_id: 'HK26-006',
  event_code: 'HK26',
  full_name: 'Mei',
  company_name: null,
  business_email: 'mei@gmail.com',
  mobile: '+85291234567',
  country_market: null,
  business_type: 'importer',
  expression: 'both',
  interests: '["pricing","tasting"]',
  message: null,
};

test('accountDraftFromLead fills contact details and leaves the business name to staff', () => {
  const draft = accountDraftFromLead(mobileLeadRow);
  assert.equal(draft.tradingName, '');
  assert.equal(draft.type, 'distributor');
  assert.equal(draft.contactName, 'Mei');
  assert.equal(draft.email, 'mei@gmail.com');
  assert.equal(draft.phone, '+85291234567');
  assert.equal(draft.country, 'Hong Kong');
  assert.match(draft.notes, /HK26-006/);
  assert.match(draft.notes, /Pricing, Tasting/);
  assert.equal(accountDraftFromLead({ ...mobileLeadRow, country_market: 'Japan' }).country, 'Japan');
});

test('validateLeadAccountBody requires a business name and falls back to lead contact details', () => {
  assert.equal(validateLeadAccountBody({}, mobileLeadRow).ok, false);
  assert.equal(validateLeadAccountBody({ tradingName: 'X', type: 'manufacturer' }, mobileLeadRow).ok, false);
  assert.equal(validateLeadAccountBody({ tradingName: 'X', email: 'bad' }, mobileLeadRow).ok, false);
  const parsed = validateLeadAccountBody({ tradingName: ' Mei Trading ' }, mobileLeadRow);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.tradingName, 'Mei Trading');
  assert.equal(parsed.data.legalName, 'Mei Trading');
  assert.equal(parsed.data.type, 'distributor');
  assert.equal(parsed.data.email, 'mei@gmail.com');
  assert.equal(validateLeadAccountBody({ tradingName: 'X', email: '' }, mobileLeadRow).data.email, '');
});

test('canManageExpoLeads is HQ and operations only', () => {
  assert.equal(canManageExpoLeads('brand_operator'), true);
  assert.equal(canManageExpoLeads('operations'), true);
  assert.equal(canManageExpoLeads('sales_rep'), false);
  assert.equal(canManageExpoLeads('finance'), false);
});
