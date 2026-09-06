import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEventCode,
  validateBuyerPayload,
  validateInternalPatch,
  serializeExpoLead,
  canManageExpoLeads,
} from '../lib/expo-leads.mjs';

test('normalizeEventCode defaults and sanitizes', () => {
  assert.equal(normalizeEventCode(''), 'HK26');
  assert.equal(normalizeEventCode('hk-26'), 'HK26');
  assert.equal(normalizeEventCode('vinexpo'), 'VINEXPO');
});

test('validateBuyerPayload requires core fields and ignores internal score', () => {
  const parsed = validateBuyerPayload({
    fullName: 'Alex Tan',
    companyName: 'Lion City Spirits',
    jobTitle: 'Buyer',
    businessEmail: 'alex@lion.sg',
    countryMarket: 'Singapore',
    businessType: 'importer_distributor',
    expression: 'both',
    bottleFormat: 'both',
    volume: '100_249',
    timing: '1_3_months',
    consent: true,
    score: 'A',
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.full_name, 'Alex Tan');
  assert.equal(parsed.data.score, undefined);
});

test('validateBuyerPayload rejects missing consent', () => {
  const parsed = validateBuyerPayload({
    fullName: 'A',
    companyName: 'B',
    jobTitle: 'C',
    businessEmail: 'a@b.com',
    countryMarket: 'SG',
    businessType: 'retailer',
    expression: 'first_press',
  });
  assert.equal(parsed.ok, false);
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

test('canManageExpoLeads is HQ and operations only', () => {
  assert.equal(canManageExpoLeads('brand_operator'), true);
  assert.equal(canManageExpoLeads('operations'), true);
  assert.equal(canManageExpoLeads('sales_rep'), false);
  assert.equal(canManageExpoLeads('finance'), false);
});
