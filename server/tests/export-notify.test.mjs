import test from "node:test";
import assert from "node:assert/strict";
import { exportDocIssuedText } from "../services/export-notify.mjs";

test("a booth quotation email carries the prices when the buyer has no portal", () => {
  const text = exportDocIssuedText({
    buyerName: "Ada",
    docTitle: "International distributor quotation",
    displayId: "HX-0009",
    docUrl: null,
    commercial: {
      lines: [
        {
          sku: "first_press_750",
          cases: 40,
          product: "Hajime First Press Coffee Rhum Liqueur",
          size: "750 ml",
          unitFobUsd: 34.1,
          bottlesPerCase: 12,
          caseUsd: 409.2,
          lineTotalUsd: 16368,
        },
      ],
      subtotalUsd: 16368,
      depositDueUsd: 8184,
      balanceDueUsd: 8184,
    },
  });
  assert.match(text, /Hi Ada/);
  assert.match(text, /HX-0009/);
  assert.match(text, /40 cases/);
  assert.match(text, /US\$409\.20 \/ case/);
  assert.match(text, /Deposit due \(50%\) US\$8,184\.00/);
  assert.match(text, /This email is the issued copy/);
  assert.doesNotMatch(text, /distributor portal/);
});

test("a portal buyer still gets the printable link", () => {
  const text = exportDocIssuedText({
    buyerName: "Ada",
    docTitle: "International distributor quotation",
    displayId: "HX-0009",
    docUrl: "https://supply.drinkhajime.jp/distributor/international-orders/HX-0009/docs/quotation",
    commercial: null,
  });
  assert.match(text, /distributor portal/);
  assert.match(text, /HX-0009\/docs\/quotation/);
});
