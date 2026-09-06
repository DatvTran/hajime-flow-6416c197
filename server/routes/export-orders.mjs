import { Router } from "express";
import { platformDb } from "../config/database.mjs";
import { Permission, hasPermission } from "../rbac/permissions.mjs";
import { sendExportDocIssuedEmail, clientBaseUrl } from "../services/export-notify.mjs";
import { applyTransition, approveException } from "../services/export-order-transitions.mjs";
import {
  canManageExportOrders,
  isManufacturer,
  ensureExportOrdersTable,
  serializeExportOrder,
  toBuyerFacingOrder,
  priceExportLines,
  defaultChecklistState,
  nextSeq,
  padDoc,
  isExportSku,
  isBuyerExportDoc,
  distributorCanViewStage,
  findExportOrder,
  requiredChecklistReady,
  asJsonObject,
} from "../lib/export-orders.mjs";

const router = Router();

function getTenantId(req, res) {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(403).json({ error: "Tenant identity missing from token" });
    return null;
  }
  return tenantId;
}

export function exportSerializeForRole(req, row) {
  const role = req.user?.role;
  if (canManageExportOrders(role) || role === "finance") {
    return serializeExportOrder(row, { includeInternalEconomics: true, buyerFacing: false });
  }
  if (isManufacturer(role)) {
    return serializeExportOrder(row, {
      includeInternalEconomics: false,
      buyerFacing: false,
      manufacturerFacing: true,
    });
  }
  return toBuyerFacingOrder(serializeExportOrder(row, { includeInternalEconomics: false, buyerFacing: true }));
}

export function parseExportLines(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l) => isExportSku(l?.sku))
    .map((l) => ({
      sku: String(l.sku),
      cases: Math.max(0, Math.floor(Number(l.cases) || 0)),
      ...(l.unitFobUsd != null ? { unitFobUsd: Number(l.unitFobUsd) } : {}),
    }))
    .filter((l) => l.cases > 0);
}

function actorFrom(req) {
  return {
    role: req.user?.role,
    userId: req.user?.userId,
    email: req.user?.email,
  };
}

function sendErr(res, err) {
  const status = err.status || 500;
  if (status >= 500) console.error("[export-orders]", err);
  return res.status(status).json({ error: err.message, ...(err.payload || {}) });
}

function canRead(role) {
  return (
    canManageExportOrders(role) ||
    role === "finance" ||
    role === "distributor" ||
    role === "manufacturer" ||
    hasPermission(role, Permission.EXPORT_READ)
  );
}

router.get("/tracker", async (req, res) => {
  try {
    if (!canManageExportOrders(req.user?.role) && req.user?.role !== "finance") {
      if (!hasPermission(req.user?.role, Permission.REPORTS_READ)) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const db = platformDb;
    if (!(await ensureExportOrdersTable(db))) return res.json({ data: [] });
    const rows = await db("export_orders").where({ tenant_id: tenantId }).orderBy("created_at", "desc").limit(500);
    const data = rows.map((r) => {
      const s = serializeExportOrder(r, { includeInternalEconomics: true });
      return {
        orderId: s.displayId,
        buyer: s.buyerCompany,
        territory: s.territory,
        buyerPo: s.buyerPoNo,
        quotation: s.quoteNo,
        pi: s.piNo,
        orderValueUsd: s.subtotalUsd,
        depositDue: s.depositDueUsd,
        depositStatus: s.depositStatus,
        stage: s.stage,
        forwarder: s.forwarderName,
        fob: s.fobNamedPoint,
        nextAction: s.nextAction,
      };
    });
    if (String(req.query.format) === "csv") {
      const headers = Object.keys(data[0] || { orderId: "" });
      const lines = [headers.join(",")].concat(
        data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")),
      );
      res.setHeader("Content-Type", "text/csv");
      return res.send(lines.join("\n"));
    }
    res.json({ data });
  } catch (err) {
    sendErr(res, err);
  }
});

router.get("/", async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const db = platformDb;
    if (!(await ensureExportOrdersTable(db))) return res.json({ data: [] });
    const role = req.user?.role;
    if (!canRead(role)) return res.status(403).json({ error: "Forbidden" });
    let q = db("export_orders").where({ tenant_id: tenantId }).orderBy("created_at", "desc");
    if (role === "distributor") {
      const orgId = req.user?.distributorOrgId || req.distributorOrg?.id;
      if (!orgId) return res.json({ data: [] });
      q = q.where({ distributor_org_id: orgId });
    } else if (isManufacturer(role)) {
      q = q
        .whereIn("deposit_status", ["cleared", "exception"])
        .whereNotIn("stage", ["01_lead", "02_quotation", "03_buyer_po", "04_po_acceptance", "05_proforma", "06_deposit"]);
    }
    const rows = await q.limit(200);
    const data = rows
      .filter((r) => (role === "distributor" ? distributorCanViewStage(r.stage) : true))
      .map((r) => exportSerializeForRole(req, r));
    res.json({ data });
  } catch (err) {
    sendErr(res, err);
  }
});

router.post("/", async (req, res) => {
  try {
    const role = req.user?.role;
    const isHq = canManageExportOrders(role);
    const isDist = role === "distributor";
    if (!isHq && !isDist) return res.status(403).json({ error: "Forbidden" });
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const db = platformDb;
    if (!(await ensureExportOrdersTable(db))) {
      return res.status(500).json({ error: "Export orders table unavailable" });
    }
    const body = req.body || {};
    let buyerName = String(body.buyerName || "").trim();
    let buyerCompany = String(body.buyerCompany || buyerName).trim();
    let buyerEmail = body.buyerEmail != null ? String(body.buyerEmail).trim().toLowerCase() : null;
    let buyerAddress = body.buyerAddress != null ? String(body.buyerAddress).trim() : null;
    let territory = String(body.territory || "").trim();
    let destinationCountry = body.destinationCountry != null ? String(body.destinationCountry).trim() : null;
    let expoLeadId = isHq && body.expoLeadId != null ? body.expoLeadId : null;
    let distributorOrgId = isHq ? body.distributorOrgId || null : null;
    let origin = "hq";
    let buyerPoNo = body.buyerPoNo != null ? String(body.buyerPoNo).trim() : null;
    let forwarderName = body.forwarderName != null ? String(body.forwarderName).trim() : null;
    let forwarderInstructions = body.forwarderInstructions != null ? String(body.forwarderInstructions) : null;

    if (isDist) {
      const orgId = req.user?.distributorOrgId || req.distributorOrg?.id;
      if (!orgId) {
        return res.status(400).json({ error: "This login is not linked to a distributor organization." });
      }
      distributorOrgId = orgId;
      origin = "portal";
      expoLeadId = null;
      const orgName = String(req.distributorOrg?.name || "").trim();
      buyerName = String(req.user?.displayName || buyerName || orgName || "Buyer").trim();
      buyerCompany = orgName || buyerCompany || buyerName;
      buyerEmail = String(req.user?.email || buyerEmail || "").trim().toLowerCase() || null;
      territory = territory || destinationCountry || orgName || "TBD";
      destinationCountry = destinationCountry || territory || null;
    }

    if (expoLeadId) {
      const lead = await db("expo_leads")
        .where({ tenant_id: tenantId })
        .andWhere((qb) => {
          qb.where("display_id", String(expoLeadId));
          if (/^\d+$/.test(String(expoLeadId))) qb.orWhere("id", Number(expoLeadId));
        })
        .first();
      if (!lead) return res.status(404).json({ error: "Expo lead not found" });
      if (String(lead.business_type) !== "importer_distributor") {
        return res.status(422).json({
          error: "Only importer / distributor leads can open an export file.",
          code: "LEAD_NOT_CONVERTIBLE",
        });
      }
      expoLeadId = lead.id;
      buyerName = buyerName || String(lead.full_name || "").trim();
      buyerCompany = buyerCompany || String(lead.company_name || buyerName).trim();
      buyerEmail = buyerEmail || String(lead.business_email || "").trim().toLowerCase();
      territory = territory || String(lead.country_market || lead.territory || "TBD").trim();
      destinationCountry = destinationCountry || String(lead.country_market || "").trim() || null;
    }

    if (!buyerName || !buyerCompany || !territory) {
      return res.status(400).json({ error: "buyerName, buyerCompany, and territory are required" });
    }

    let rawLines = Array.isArray(body.lines) ? body.lines : [];
    if (isDist) {
      rawLines = rawLines.map((l) => ({ sku: l?.sku, cases: l?.cases }));
    } else if (!rawLines.length) {
      rawLines = [{ sku: "first_press_750", cases: 25 }];
    }
    const lines = parseExportLines(rawLines);
    if (!lines.length) return res.status(400).json({ error: "Add at least one SKU with cases" });
    const priced = priceExportLines(lines);
    const seq = await nextSeq(db, tenantId);
    const displayId = padDoc("HX", seq);
    const now = new Date();
    const [row] = await db("export_orders")
      .insert({
        tenant_id: tenantId,
        seq,
        display_id: displayId,
        quote_no: padDoc("Q", seq),
        pi_no: padDoc("PI", seq),
        deposit_no: padDoc("DP", seq),
        pa_no: padDoc("PA", seq),
        release_no: padDoc("SR", seq),
        expo_lead_id: expoLeadId,
        distributor_org_id: distributorOrgId,
        origin,
        buyer_name: buyerName,
        buyer_company: buyerCompany,
        buyer_address: buyerAddress,
        buyer_email: buyerEmail,
        territory,
        destination_country: destinationCountry,
        buyer_po_no: buyerPoNo,
        forwarder_name: forwarderName,
        forwarder_instructions: forwarderInstructions,
        manufacturer_name: body.manufacturerName || "Kosapan Distillery",
        stage: "02_quotation",
        lines: JSON.stringify(priced.lines.map((l) => ({ sku: l.sku, cases: l.cases, unitFobUsd: l.unitFobUsd }))),
        subtotal_usd: priced.subtotalUsd,
        deposit_due_usd: priced.depositDueUsd,
        balance_due_usd: priced.balanceDueUsd,
        checklist: JSON.stringify(defaultChecklistState()),
        issued_docs: JSON.stringify({}),
        exclusivity: false,
        created_at: now,
        updated_at: now,
      })
      .returning("*");
    res.status(201).json({ data: exportSerializeForRole(req, row) });
  } catch (err) {
    sendErr(res, err);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const db = platformDb;
    if (!(await ensureExportOrdersTable(db))) return res.status(404).json({ error: "Not found" });
    const row = await findExportOrder(db, tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const role = req.user?.role;
    if (role === "distributor") {
      const orgId = req.user?.distributorOrgId || req.distributorOrg?.id;
      if (!orgId || String(row.distributor_org_id) !== String(orgId) || !distributorCanViewStage(row.stage)) {
        return res.status(404).json({ error: "Not found" });
      }
    } else if (isManufacturer(role)) {
      if (!["cleared", "exception"].includes(row.deposit_status)) {
        return res.status(404).json({ error: "Not found" });
      }
    } else if (!canManageExportOrders(role) && role !== "finance" && !hasPermission(role, Permission.EXPORT_READ)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json({ data: exportSerializeForRole(req, row) });
  } catch (err) {
    sendErr(res, err);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const db = platformDb;
    const row = await findExportOrder(db, tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const role = req.user?.role;
    const body = req.body || {};
    if (body.stage != null || body.depositStatus != null || body.balanceStatus != null) {
      return res.status(400).json({
        error: "Use action endpoints to change stage or payment status.",
        code: "STAGE_VIA_TRANSITION",
      });
    }
    const updates = { updated_at: new Date() };

    if (role === "distributor") {
      const orgId = req.user?.distributorOrgId || req.distributorOrg?.id;
      if (!orgId || String(row.distributor_org_id) !== String(orgId)) {
        return res.status(404).json({ error: "Not found" });
      }
      if (body.buyerPoNo != null) updates.buyer_po_no = String(body.buyerPoNo).trim();
      if (body.forwarderName != null) updates.forwarder_name = String(body.forwarderName).trim();
      if (body.forwarderInstructions != null) updates.forwarder_instructions = String(body.forwarderInstructions);
    } else if (isManufacturer(role)) {
      return res.status(400).json({ error: "Use production or ready-to-ship actions." });
    } else if (canManageExportOrders(role) || role === "finance") {
      const map = {
        buyerName: "buyer_name",
        buyerCompany: "buyer_company",
        buyerAddress: "buyer_address",
        buyerEmail: "buyer_email",
        territory: "territory",
        destinationCountry: "destination_country",
        buyerPoNo: "buyer_po_no",
        distributorOrgId: "distributor_org_id",
        depositReceivedUsd: "deposit_received_usd",
        wireFeesUsd: "wire_fees_usd",
        depositRef: "deposit_ref",
        depositValueDate: "deposit_value_date",
        depositNotes: "deposit_notes",
        balanceReceivedUsd: "balance_received_usd",
        balanceRef: "balance_ref",
        manufacturerName: "manufacturer_name",
        requestedCompletion: "requested_completion",
        factoryContact: "factory_contact",
        forwarderName: "forwarder_name",
        forwarderInstructions: "forwarder_instructions",
        fobNamedPoint: "fob_named_point",
        plannedDeparture: "planned_departure",
        checklistOpenItems: "checklist_open_items",
        notes: "notes",
        quoteValidUntil: "quote_valid_until",
      };
      for (const [k, col] of Object.entries(map)) {
        if (body[k] !== undefined) updates[col] = body[k] === "" ? null : body[k];
      }
      if (body.lines && !row.deposit_amount_frozen) {
        const lines = parseExportLines(body.lines);
        const priced = priceExportLines(lines);
        updates.lines = JSON.stringify(priced.lines.map((l) => ({ sku: l.sku, cases: l.cases, unitFobUsd: l.unitFobUsd })));
        updates.subtotal_usd = priced.subtotalUsd;
        updates.deposit_due_usd = priced.depositDueUsd;
        updates.balance_due_usd = priced.balanceDueUsd;
      }
      if (body.checklist) updates.checklist = JSON.stringify(body.checklist);
      if (body.checklistCleared === true) {
        const cl = body.checklist || asJsonObject(row.checklist);
        if (!requiredChecklistReady(cl)) {
          return res.status(400).json({
            error: "Mark remaining required checklist items issued, complete, or N/A before clearing for release.",
          });
        }
        updates.checklist_cleared = true;
      } else if (body.checklistCleared === false) {
        updates.checklist_cleared = false;
      }
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [updated] = await db("export_orders")
      .where({ id: row.id, tenant_id: tenantId })
      .update(updates)
      .returning("*");
    res.json({ data: exportSerializeForRole(req, updated) });
  } catch (err) {
    sendErr(res, err);
  }
});

async function runAction(req, res, action, payload) {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const db = platformDb;
    await ensureExportOrdersTable(db);
    const row = await findExportOrder(db, tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const updated = await applyTransition({
      tenantId,
      orderId: row.id,
      action,
      actor: actorFrom(req),
      payload: payload || req.body || {},
      db,
    });
    res.json({ data: exportSerializeForRole(req, updated) });
  } catch (err) {
    sendErr(res, err);
  }
}

router.post("/:id/quotation", (req, res) => runAction(req, res, req.body?.requote ? "requote" : "issue_quotation"));
router.post("/:id/buyer-po", (req, res) => runAction(req, res, "record_buyer_po"));
router.post("/:id/acceptance", (req, res) => runAction(req, res, "accept_po"));
router.post("/:id/proforma", (req, res) => runAction(req, res, "issue_pi"));
router.post("/:id/payments", (req, res) => runAction(req, res, "record_payment"));
router.post("/:id/production-authorization", (req, res) => runAction(req, res, "authorize_production"));
router.patch("/:id/production", (req, res) => runAction(req, res, "confirm_slot"));
router.post("/:id/ready-to-ship", (req, res) => runAction(req, res, "confirm_ready"));
router.post("/:id/balance-request", (req, res) => runAction(req, res, "request_balance"));
router.post("/:id/release", (req, res) => runAction(req, res, "release"));
router.post("/:id/handover", (req, res) => runAction(req, res, "confirm_handover"));
router.post("/:id/close", (req, res) => runAction(req, res, "close"));
router.post("/:id/hold", (req, res) => runAction(req, res, "hold"));
router.post("/:id/resume", (req, res) => runAction(req, res, "resume"));
router.post("/:id/cancel", (req, res) => runAction(req, res, "cancel"));

router.post("/:id/exceptions", async (req, res) => {
  try {
    const role = req.user?.role;
    if (!["founder_admin", "brand_operator"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const db = platformDb;
    const row = await findExportOrder(db, tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    await approveException({
      tenantId,
      orderId: row.id,
      actor: actorFrom(req),
      kind: req.body?.kind,
      reason: req.body?.reason,
      shortfall: req.body?.shortfall,
      db,
    });
    const fresh = await findExportOrder(db, tenantId, row.id);
    res.json({ data: exportSerializeForRole(req, fresh) });
  } catch (err) {
    sendErr(res, err);
  }
});

router.post("/:id/docs/:doc/issue", async (req, res) => {
  const doc = String(req.params.doc || "");
  const map = {
    quotation: "issue_quotation",
    po_acceptance: "accept_po",
    proforma: "issue_pi",
    deposit: "record_payment",
    production_auth: "authorize_production",
    shipment_release: "release",
  };
  if (doc === "export_checklist") {
    return res.json({ data: null, error: "Update checklist items on the order instead." });
  }
  const action = map[doc];
  if (!action) return res.status(400).json({ error: "Unknown document" });
  const payload = doc === "deposit" ? { paymentType: "deposit", amountReceived: Number(req.body?.amountReceived || 0) } : req.body;
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const db = platformDb;
    const row = await findExportOrder(db, tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const updated = await applyTransition({
      tenantId,
      orderId: row.id,
      action,
      actor: actorFrom(req),
      payload,
      db,
    });
    let email = { sent: false, skipped: true };
    if (isBuyerExportDoc(doc) && updated.buyer_email) {
      const titles = {
        quotation: "International distributor quotation",
        po_acceptance: "Purchase order acceptance",
        proforma: "Pro forma invoice",
        deposit: "Deposit confirmation",
        shipment_release: "Final payment and shipment release",
      };
      const docUrl = `${clientBaseUrl()}/distributor/international-orders/${updated.display_id}/docs/${doc}`;
      email = await sendExportDocIssuedEmail({
        to: updated.buyer_email,
        buyerName: updated.buyer_name,
        docTitle: titles[doc] || doc,
        displayId: updated.display_id,
        docUrl,
      });
    }
    res.json({ data: exportSerializeForRole(req, updated), email });
  } catch (err) {
    sendErr(res, err);
  }
});

export default router;
