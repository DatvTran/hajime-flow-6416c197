import PDFDocument from "pdfkit";
import { SKUS } from "../lib/export-orders.mjs";
import { monthLabel } from "../lib/first-press-capacity.mjs";
import { BUYER_PO_TERMS, BUYER_PO_TERMS_VERSION, PO_ACCEPTANCE_SELLER, asPayload } from "../lib/po-acceptance.mjs";

const NA = "N/A";
const INK = "#1c1813";
const MUTED = "#66594d";
const RULE = "#d8d0c4";
const TINT = "#f5f1ea";
const ORDER = ["first_press_750", "yuzu_mint_750", "first_press_200", "yuzu_mint_200"];

function text(v) {
  const s = v == null ? "" : String(v).trim();
  return s || NA;
}

function money(v) {
  const n = Number(v);
  if (v == null || v === "" || !Number.isFinite(n)) return NA;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function shortDate(v) {
  if (!v) return NA;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return NA;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Hong_Kong" });
}

function dateTime(v) {
  if (!v) return NA;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return NA;
  const s = d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Hong_Kong",
  });
  return `${s} HKT`;
}

function joined(parts, sep) {
  return parts.filter((x) => String(x ?? "").trim()).join(sep);
}

/** Field values the PDF prints, taken from the issued snapshot and the buyer's signature. */
export function buyerPoPdfModel(doc) {
  const o = asPayload(doc.payload);
  const d = asPayload(doc.buyer_details);
  const lines = Array.isArray(o.lines) ? o.lines : [];
  const bySku = new Map(lines.map((l) => [String(l.sku), l]));
  const rows = ORDER.filter((sku) => bySku.has(sku) && Number(bySku.get(sku).cases) > 0).map((sku) => {
    const l = bySku.get(sku);
    const m = SKUS[sku] || {};
    const caseUsd =
      l.caseUsd != null
        ? Number(l.caseUsd)
        : Number(l.unitFobUsd) * (m.bottlesPerCase || 0);
    return {
      product: m.product || sku,
      size: m.size || "",
      cases: Number(l.cases),
      bottlesPerCase: m.bottlesPerCase || 0,
      caseFob: money(caseUsd),
      total: money(l.lineTotalUsd),
    };
  });
  const revision = Number(doc.revision) || 1;
  return {
    docNo: `${doc.doc_number}${revision > 1 ? ` (rev. ${revision})` : ""}`,
    docNumber: doc.doc_number,
    revision,
    buyerPoRef: text(d.buyerPoRef || o.buyerPoNo),
    date: shortDate(doc.issued_at),
    buyerLegal: text(d.legalName || o.buyerLegalName || o.buyerCompany),
    buyerRegNo: d.registrationNo || o.buyerRegistrationNo || "",
    buyerAddress: text(d.registeredAddress || o.buyerRegisteredAddress || o.buyerAddress),
    buyerContact: joined([o.buyerName, d.noticeEmail || o.buyerNoticeEmail || o.buyerEmail], " · ") || NA,
    seller: `${PO_ACCEPTANCE_SELLER.legalName} · ${PO_ACCEPTANCE_SELLER.registrationNo}`,
    sellerAddress: PO_ACCEPTANCE_SELLER.registeredAddress,
    quoteNo: text(o.quoteNo),
    destination: joined([o.destinationCountry, o.consignee], " — ") || NA,
    incoterm: joined([o.incotermRule, o.fobNamedPoint], " ") || "To be confirmed on the PO acceptance",
    requestedDelivery:
      monthLabel(d.requestedMonth || o.requestedMonth) || (o.deliveryWindow ? String(o.deliveryWindow) : "Chosen by Buyer when signing"),
    rows,
    totals: [
      ["Order total", money(o.totalOrderUsd ?? o.subtotalUsd)],
      ["Deposit (50%)", money(o.depositDueUsd)],
      ["Balance before release (50%)", money(o.balanceDueUsd)],
    ],
    signer: doc.buyer_signed_at ? `${doc.buyer_signed_name}, ${doc.buyer_signed_title}` : NA,
    signerName: doc.buyer_signed_name || "",
    priceInitials: doc.buyer_signed_at ? d.priceInitials || "" : "",
    signedDate: shortDate(doc.buyer_signed_at),
    signedAt: dateTime(doc.buyer_signed_at),
    termsVersion: doc.terms_version || BUYER_PO_TERMS_VERSION,
    contentHash: doc.content_hash || "",
  };
}

/** Signed buyer purchase order as an A4 PDF. */
export function renderBuyerPoPdf(doc) {
  const m = buyerPoPdfModel(doc);
  const pdf = new PDFDocument({
    size: "A4",
    margins: { top: 36, bottom: 30, left: 44, right: 44 },
    info: { Title: `Purchase order ${m.docNo}`, Author: m.buyerLegal, Subject: `Against quotation ${m.quoteNo}` },
  });
  const chunks = [];
  pdf.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });

  const L = pdf.page.margins.left;
  const W = pdf.page.width - L - pdf.page.margins.right;
  let y = pdf.page.margins.top;

  const label = (s, x, yy, w) =>
    pdf.font("Helvetica-Bold").fontSize(7).fillColor(MUTED).text(s.toUpperCase(), x, yy, { width: w, characterSpacing: 0.8 });
  const value = (s, x, yy, w) => pdf.font("Helvetica").fontSize(9.5).fillColor(INK).text(s, x, yy, { width: w, lineGap: 1 });

  const cellHeight = (v, w) => 20 + pdf.font("Helvetica").fontSize(9.5).heightOfString(v, { width: w - 16, lineGap: 1 });

  function grid(cells, cols) {
    const cw = W / cols;
    for (let i = 0; i < cells.length; ) {
      const row = [];
      let span = 0;
      while (i < cells.length && span + (cells[i].span || 1) <= cols) {
        row.push(cells[i]);
        span += cells[i].span || 1;
        i += 1;
      }
      const h = Math.max(...row.map((c) => cellHeight(c.value, cw * (c.span || 1))));
      let x = L;
      for (const c of row) {
        const w = cw * (c.span || 1);
        pdf.rect(x, y, w, h).lineWidth(0.5).strokeColor(RULE).stroke();
        label(c.label, x + 8, y + 5, w - 16);
        value(c.value, x + 8, y + 14.5, w - 16);
        x += w;
      }
      y += h;
    }
  }

  pdf.font("Helvetica-Bold").fontSize(7.5).fillColor(INK).text(m.buyerLegal.toUpperCase(), L, y, { width: W / 2, characterSpacing: 2 });
  pdf.font("Helvetica").fontSize(7.5).fillColor(MUTED).text("PURCHASE ORDER", L + W / 2, y, { width: W / 2, align: "right", characterSpacing: 1.6 });
  y += 14;
  pdf.moveTo(L, y).lineTo(L + W, y).lineWidth(0.8).strokeColor(INK).stroke();
  y += 16;
  pdf.font("Times-Roman").fontSize(24).fillColor(INK).text("Purchase order", L, y);
  y += 26;
  pdf.font("Helvetica").fontSize(7.5).fillColor(MUTED).text("TO HAJIME LTD. | HONG KONG", L, y, { characterSpacing: 1.4 });
  y += 14;

  grid(
    [
      { label: "PO no.", value: m.docNo },
      { label: "Buyer PO reference", value: m.buyerPoRef },
      { label: "Date", value: m.date },
      { label: "Buyer (issuer)", value: m.buyerRegNo ? `${m.buyerLegal} · ${m.buyerRegNo}` : m.buyerLegal },
      { label: "Buyer address", value: m.buyerAddress },
      { label: "Buyer contact", value: m.buyerContact },
      { label: "Seller", value: m.seller },
      { label: "Seller address", value: m.sellerAddress },
      { label: "Against quotation", value: m.quoteNo },
      { label: "Destination / consignee", value: m.destination, span: 3 },
    ],
    3,
  );

  y += 14;
  pdf.font("Times-Bold").fontSize(14).fillColor(INK).text("Goods ordered", L, y);
  y += 20;
  const cols = [
    { h: "Product", w: 0.38, align: "left" },
    { h: "Size", w: 0.1, align: "left" },
    { h: "Cases", w: 0.1, align: "right" },
    { h: "Btls/case", w: 0.12, align: "right" },
    { h: "FOB / case", w: 0.14, align: "right" },
    { h: "Line total", w: 0.16, align: "right" },
  ];
  const tableRow = (cells, font, size, color) => {
    let x = L;
    cells.forEach((s, i) => {
      const w = W * cols[i].w;
      pdf.font(font).fontSize(size).fillColor(color).text(String(s), x + (i ? 4 : 0), y, { width: w - 4, align: cols[i].align });
      x += w;
    });
  };
  pdf.moveTo(L, y - 4).lineTo(L + W, y - 4).lineWidth(0.8).strokeColor(INK).stroke();
  tableRow(cols.map((c) => c.h.toUpperCase()), "Helvetica-Bold", 7, MUTED);
  y += 12;
  pdf.moveTo(L, y).lineTo(L + W, y).lineWidth(0.8).strokeColor(INK).stroke();
  y += 6;
  for (const r of m.rows) {
    tableRow([r.product, r.size, r.cases, r.bottlesPerCase, r.caseFob, r.total], "Helvetica", 9, INK);
    y += 15;
    pdf.moveTo(L, y - 4).lineTo(L + W, y - 4).lineWidth(0.5).strokeColor(RULE).stroke();
  }

  y += 12;
  const half = (W - 16) / 2;
  const leftTop = y;
  const saveL = L;
  const cellsLeft = [
    { label: "Delivery rule / named place", value: `${m.incoterm}\nIncoterms® 2020` },
    { label: "Requested delivery", value: m.requestedDelivery },
  ];
  for (const c of cellsLeft) {
    const h = cellHeight(c.value, half);
    pdf.rect(saveL, y, half, h).lineWidth(0.5).strokeColor(RULE).stroke();
    label(c.label, saveL + 8, y + 6, half - 16);
    value(c.value, saveL + 8, y + 16, half - 16);
    y += h;
  }
  const leftBottom = y;
  y = leftTop;
  const tx = L + half + 16;
  m.totals.forEach(([k, v], i) => {
    const h = 20;
    if (i === 0) pdf.rect(tx, y, half, h).fillColor(TINT).fill();
    pdf.font(i === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(8).fillColor(INK).text(k.toUpperCase(), tx + 8, y + 6, { width: half * 0.62, lineBreak: false });
    pdf.font(i === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(9.5).text(`US$ ${v}`, tx + half * 0.62, y + 5.5, { width: half * 0.38 - 8, align: "right", lineBreak: false });
    if (i < 2) pdf.moveTo(tx, y + h).lineTo(tx + half, y + h).lineWidth(0.5).strokeColor(RULE).stroke();
    y += h;
  });
  pdf.rect(tx, leftTop, half, y - leftTop).lineWidth(0.8).strokeColor(INK).stroke();

  y += 8;
  const agreeTop = y;
  const initW = 78;
  label("Prices agreed by Buyer", tx + 8, y + 6, half - initW - 16);
  pdf
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text(
      m.priceInitials
        ? `Unit prices and order total above agreed on ${m.signedDate}.`
        : "Buyer initials to agree the unit prices and order total above.",
      tx + 8,
      y + 16,
      { width: half - initW - 16, lineGap: 1 },
    );
  label("Initials", tx + half - initW + 8, y + 6, initW - 16);
  if (m.priceInitials) {
    pdf.font("Times-Italic").fontSize(17).fillColor(INK).text(m.priceInitials, tx + half - initW + 8, y + 15, { width: initW - 16, lineBreak: false });
  }
  y += 42;
  pdf.moveTo(tx + half - initW, agreeTop).lineTo(tx + half - initW, y).lineWidth(0.5).strokeColor(RULE).stroke();
  pdf.rect(tx, agreeTop, half, y - agreeTop).lineWidth(0.8).strokeColor(INK).stroke();
  y = Math.max(y, leftBottom) + 14;

  pdf.font("Times-Bold").fontSize(13).fillColor(INK).text("Terms", L, y);
  y += 16;
  BUYER_PO_TERMS.forEach((t, i) => {
    pdf.font("Helvetica").fontSize(8.2).fillColor(INK).text(`${i + 1}.`, L, y, { width: 14 });
    pdf.text(t, L + 14, y, { width: W - 14, lineGap: 1 });
    y = pdf.y + 3;
  });

  y += 8;
  const blockHeight = 106 + (m.signerName ? 52 : 0) + 26;
  if (y + blockHeight > pdf.page.height - pdf.page.margins.bottom) {
    pdf.addPage();
    y = pdf.page.margins.top;
  }
  const boxTop = y;
  pdf.rect(L, y, W, 18).fillColor(TINT).fill();
  pdf.font("Helvetica-Bold").fontSize(7).fillColor(INK).text("FOR BUYER", L + 8, y + 6, { characterSpacing: 1 });
  y += 18;
  pdf.moveTo(L, y).lineTo(L + W, y).lineWidth(0.5).strokeColor(RULE).stroke();
  label("Authorized name / title", L + 8, y + 6, W - 16);
  value(m.signer, L + 8, y + 16, W - 16);
  y += 34;
  pdf.moveTo(L, y).lineTo(L + W, y).lineWidth(0.5).strokeColor(RULE).stroke();
  const sigW = W * 0.62;
  label("Signature", L + 8, y + 6, sigW - 16);
  if (m.signerName) {
    pdf.font("Times-Italic").fontSize(20).fillColor(INK).text(m.signerName, L + 8, y + 16, { width: sigW - 16 });
    pdf.font("Helvetica").fontSize(8).fillColor(MUTED).text("Signed electronically", L + 8, y + 40);
  } else {
    value("Awaiting signature", L + 8, y + 16, sigW - 16);
  }
  label("Date", L + sigW + 8, y + 6, W - sigW - 16);
  value(m.signedDate, L + sigW + 8, y + 16, W - sigW - 16);
  pdf.moveTo(L + sigW, y).lineTo(L + sigW, y + 54).lineWidth(0.5).strokeColor(RULE).stroke();
  y += 54;
  pdf.rect(L, boxTop, W, y - boxTop).lineWidth(0.5).strokeColor(RULE).stroke();

  if (m.signerName) {
    y += 12;
    const recTop = y;
    pdf.font("Helvetica-Bold").fontSize(7).fillColor(MUTED).text("ELECTRONIC SIGNATURE RECORD", L + 8, y + 7, { characterSpacing: 1 });
    pdf.font("Helvetica").fontSize(7.5).fillColor(MUTED);
    pdf.text(`${m.docNumber} rev. ${m.revision} · Buyer signed ${m.signedAt} · Terms ${m.termsVersion}`, L + 8, y + 18, { width: W - 16 });
    if (m.contentHash) pdf.text(`Document fingerprint (SHA-256): ${m.contentHash}`, L + 8, pdf.y + 2, { width: W - 16 });
    y = pdf.y + 7;
    pdf.rect(L, recTop, W, y - recTop).dash(2, { space: 2 }).lineWidth(0.5).strokeColor(RULE).stroke().undash();
  }

  y += 16;
  pdf.moveTo(L, y).lineTo(L + W, y).lineWidth(0.5).strokeColor(RULE).stroke();
  pdf.font("Helvetica").fontSize(7).fillColor(MUTED);
  pdf.text(`PREPARED BY HAJIME LTD. FROM QUOTATION ${m.quoteNo}`.toUpperCase(), L, y + 6, { width: W / 2, characterSpacing: 0.8, lineBreak: false });
  pdf.text(m.termsVersion.toUpperCase(), L + W / 2, y + 6, { width: W / 2, align: "right", characterSpacing: 0.8, lineBreak: false });

  pdf.end();
  return done;
}

export function buyerPoPdfFilename(doc) {
  const rev = Number(doc.revision) > 1 ? `-rev${doc.revision}` : "";
  return `${doc.doc_number}${rev}-signed.pdf`;
}
