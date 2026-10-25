import test from "node:test";
import assert from "node:assert/strict";
import {
  PO_ACCEPTANCE_SELLER,
  PO_ACCEPTANCE_TERMS_VERSION,
  SIGN_LINK_TTL_DAYS,
  hashSignToken,
  newSignToken,
  orderTotals,
  poaContentHash,
  poaIssueGaps,
  poaStatus,
  serializePoaDoc,
  signLinkExpiry,
  validateCountersign,
} from "../lib/po-acceptance.mjs";
import { TRANSITIONS } from "../services/export-order-transitions.mjs";

test("sign tokens are random, url-safe, and only the hash is comparable", () => {
  const a = newSignToken();
  const b = newSignToken();
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(hashSignToken(a), hashSignToken(a));
  assert.notEqual(hashSignToken(a), a);
  assert.equal(hashSignToken(a).length, 64);
});

test("sign links expire after the TTL", () => {
  const now = new Date("2026-10-24T00:00:00Z");
  const exp = signLinkExpiry(now);
  assert.equal(exp.getTime() - now.getTime(), SIGN_LINK_TTL_DAYS * 86400000);
});

test("poaStatus covers draft, open, signed, replaced, expired", () => {
  const now = new Date("2026-10-24T00:00:00Z");
  const future = new Date("2026-11-01T00:00:00Z");
  const past = new Date("2026-10-01T00:00:00Z");
  assert.equal(poaStatus(null, now), "draft");
  assert.equal(poaStatus({ sign_token_hash: null }, now), "draft");
  assert.equal(poaStatus({ sign_token_hash: "h", sign_token_expires_at: future }, now), "open");
  assert.equal(poaStatus({ sign_token_hash: "h", sign_token_expires_at: past }, now), "expired");
  assert.equal(poaStatus({ sign_token_hash: "h", sign_token_expires_at: future, superseded_by: "x" }, now), "replaced");
  assert.equal(
    poaStatus({ sign_token_hash: "h", sign_token_expires_at: past, superseded_by: "x", buyer_signed_at: past }, now),
    "signed",
  );
});

test("orderTotals adds other charges and splits 50/50", () => {
  assert.deepEqual(orderTotals(10000, 250.5), {
    subtotalUsd: 10000,
    otherChargesUsd: 250.5,
    totalOrderUsd: 10250.5,
    depositDueUsd: 5125.25,
    balanceDueUsd: 5125.25,
  });
  const odd = orderTotals(100.01, 0);
  assert.equal(Math.round((odd.depositDueUsd + odd.balanceDueUsd) * 100), 10001);
  assert.equal(orderTotals(500, -20).otherChargesUsd, 0);
});

test("poaIssueGaps lists what blocks issuing", () => {
  assert.deepEqual(poaIssueGaps({}, 0).length, 5);
  assert.deepEqual(
    poaIssueGaps(
      { incoterm_rule: "FOB", fob_named_point: "Laem Chabang", delivery_window: "8 weeks", buyer_email: "a@b.co" },
      1,
    ),
    [],
  );
  assert.ok(poaIssueGaps({ incoterm_rule: "CIF" }, 1).some((g) => g.startsWith("Incoterms")));
});

test("validateCountersign requires every field and explicit authority", () => {
  const good = {
    legalName: "Buyer Co Ltd",
    registrationNo: "N/A",
    registeredAddress: "1 Main St",
    noticeEmail: "Legal@Buyer.co",
    signatoryName: "Ana Lee",
    signatoryTitle: "Director",
    authority: true,
  };
  const ok = validateCountersign(good);
  assert.equal(ok.ok, true);
  assert.equal(ok.value.noticeEmail, "legal@buyer.co");
  assert.equal(validateCountersign({ ...good, authority: "true" }).ok, false);
  const bad = validateCountersign({ ...good, noticeEmail: "nope", signatoryTitle: " " });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.noticeEmail);
  assert.ok(bad.errors.signatoryTitle);
});

test("content hash ignores key order but catches changes", () => {
  const seller = { ...PO_ACCEPTANCE_SELLER, signedName: "Dat", signedTitle: "Director" };
  const a = poaContentHash({ payload: { a: 1, b: { c: 2, d: [1, 2] } }, termsVersion: PO_ACCEPTANCE_TERMS_VERSION, seller });
  const b = poaContentHash({ payload: { b: { d: [1, 2], c: 2 }, a: 1 }, termsVersion: PO_ACCEPTANCE_TERMS_VERSION, seller });
  const c = poaContentHash({ payload: { a: 1, b: { c: 3, d: [1, 2] } }, termsVersion: PO_ACCEPTANCE_TERMS_VERSION, seller });
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("serializePoaDoc hides signer IP unless audit is requested", () => {
  const doc = {
    doc_number: "HJ-POA-2026-0001",
    revision: 1,
    sign_token_hash: "h",
    buyer_signed_at: new Date(),
    buyer_signed_name: "Ana",
    buyer_signed_title: "Director",
    buyer_signed_ip: "1.2.3.4",
    buyer_details: '{"legalName":"Buyer Co"}',
    payload: "{}",
  };
  assert.equal(serializePoaDoc(doc).buyerSignature.ip, undefined);
  assert.equal(serializePoaDoc(doc, { includeAudit: true }).buyerSignature.ip, "1.2.3.4");
  assert.equal(serializePoaDoc(doc).buyerSignature.details.legalName, "Buyer Co");
  assert.equal(serializePoaDoc(doc).seller.registrationNo, "80698695");
});

test("accept_po can re-issue and requires the seller's title", async () => {
  assert.deepEqual(TRANSITIONS.accept_po.from, ["03_buyer_po", "04_po_acceptance"]);
  const noTitle = await TRANSITIONS.accept_po.guard({
    order: {
      lines: JSON.stringify([{ sku: "first_press_750", cases: 10 }]),
      incoterm_rule: "FOB",
      fob_named_point: "Laem Chabang",
      delivery_window: "8 weeks",
      buyer_email: "a@b.co",
    },
    payload: {},
  });
  assert.equal(noTitle.ok, false);
});
