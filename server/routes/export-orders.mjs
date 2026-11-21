import { Router } from "express";
import { platformDb } from "../config/database.mjs";
import { Permission, hasPermission } from "../rbac/permissions.mjs";
import {
  sendExportDocIssuedEmail,
  sendPortalExportOrderPlacedEmail,
  clientBaseUrl,
} from "../services/export-notify.mjs";
import { applyTransition, approveException } from "../services/export-order-transitions.mjs";
import { emailPoaLink, poaSignUrl, rotatePoaLink } from "../services/po-acceptance.mjs";
import {
  buyerPoSignUrl,
  emailBuyerPoLink,
  latestBuyerPoDoc,
  rotateBuyerPoLink,
  serializeBuyerPoDoc,
} from "../services/buyer-po.mjs";
import { INCOTERM_RULES, latestPoaDoc, orderTotals, serializePoaDoc } from "../lib/po-acceptance.mjs";
import {
  assertMonthHasRoom,
  capacityByMonth,
  firstPressMl,
  followMonth,
  ensureCapacityColumns,
  isBookableDeliveryMonth,
  monthLabel,
  newOrderMonthFields,
  productionMonth,
} from "../lib/first-press-capacity.mjs";
import { httpError } from "../lib/http-error.mjs";
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
  findExportOrderAnyTenant,
  resolveExportBrandTenantId,
  reconcilePortalExportOrdersToBrandTenant,
  repricePortalQuotationsToListFob,
  applyNegotiatedCaseUsdToLines,
  negotiatedSellInCaseByExportSku,
  resolvePortalWholesaleAccountId,
  requiredChecklistReady,
  asJsonObject,
  isExportLeadType,
  findLiveOrderForLead,
  leadStarterLines,
  TRIAL_ORDER_CASES,
} from "../lib/export-orders.mjs";
import { normalizeExportLineSku } from "../lib/export-catalog-map.mjs";
import { ensurePortalDistributorOrg } from "../lib/distributor-organization.mjs";

const router = Router();

function getTenantId(req, res) {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(403).json({ error: "Tenant identity missing from token" });
    return null;
  }
  return tenantId;
}

/** Brand HQ tenant for export_orders rows (never the distributor org CRM tenant). */
async function getExportTenantId(req, res) {
  const brand = await resolveExportBrandTenantId(platformDb, req.user);
  if (brand) return brand;
  return getTenantId(req, res);
}

async function hqNotifyEmails() {
  const fromEnv = String(process.env.EXPORT_HQ_NOTIFY_EMAIL || process.env.HQ_NOTIFY_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.length) return fromEnv;
  try {
    const rows = await platformDb("users")
      .whereIn("role", ["brand_operator", "founder_admin", "operations"])
      .where({ is_active: true })
      .whereNull("deleted_at")
      .select("email")
      .limit(8);
    return rows.map((r) => String(r.email || "").trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

async function loadExportOrderForRequest(db, req, idOrDisplay) {
  const role = req.user?.role;
  const brandTenantId = await resolveExportBrandTenantId(db, req.user);

  if (role === "distributor") {
    let orgId = req.user?.distributorOrgId || req.distributorOrg?.id;
    if (!orgId) {
      try {
        const org = await ensurePortalDistributorOrg(req.user);
        orgId = org?.id;
        if (org) {
          req.user.distributorOrgId = org.id;
          req.distributorOrg = org;
        }
      } catch {
        /* ignore */
      }
    }
    if (!orgId) return null;
    const id = String(idOrDisplay || "").trim();
    return db("export_orders")
      .where({ distributor_org_id: orgId })
      .andWhere((qb) => {
        qb.where("display_id", id);
        if (/^\d+$/.test(id)) qb.orWhere("id", Number(id));
      })
      .first();
  }

  if (brandTenantId) {
    try {
      await reconcilePortalExportOrdersToBrandTenant(db, brandTenantId);
      await repricePortalQuotationsToListFob(db, brandTenantId);
    } catch {
      /* ignore */
    }
    const onBrand = await findExportOrder(db, brandTenantId, idOrDisplay);
    if (onBrand) return onBrand;
  }

  // HQ recovery: portal rows created under an org tenant before the brand-tenant fix.
  if (canManageExportOrders(role) || role === "finance") {
    return findExportOrderAnyTenant(db, idOrDisplay);
  }

  if (req.user?.tenantId) {
    return findExportOrder(db, req.user.tenantId, idOrDisplay);
  }
  return findExportOrderAnyTenant(db, idOrDisplay);
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

export function parseExportLines(raw, { portalOfferOnly = false } = {}) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l) => {
      const normalized = normalizeExportLineSku(
        l?.sku,
        {
          name: l?.product || l?.name,
          size: l?.size,
        },
        { portalOfferOnly },
      );
      if (!normalized) return null;
      const caseUsd =
        l?.caseUsd != null && Number.isFinite(Number(l.caseUsd)) && Number(l.caseUsd) > 0
          ? Math.round(Number(l.caseUsd) * 100) / 100
          : null;
      const unitFobUsd =
        l?.unitFobUsd != null && Number.isFinite(Number(l.unitFobUsd)) && Number(l.unitFobUsd) >= 0
          ? Math.round(Number(l.unitFobUsd) * 100) / 100
          : null;
      return {
        sku: normalized,
        cases: Math.max(0, Math.floor(Number(l?.cases) || 0)),
        ...(caseUsd != null ? { caseUsd } : {}),
        ...(unitFobUsd != null ? { unitFobUsd } : {}),
      };
    })
    .filter((l) => l && isExportSku(l.sku) && l.cases > 0);
}

async function withPoaSummary(db, req, row) {
  const data = exportSerializeForRole(req, row);
  if (!data || isManufacturer(req.user?.role)) return data;
  const hq = canManageExportOrders(req.user?.role) || req.user?.role === "finance";
  const doc = await latestPoaDoc(db, row.tenant_id, row.id);
  const bpo = await latestBuyerPoDoc(db, row.tenant_id, row.id);
  return {
    ...data,
    poAcceptance: serializePoaDoc(doc, { includeAudit: hq }),
    buyerPo: serializeBuyerPoDoc(bpo, { includeAudit: hq }),
  };
}

async function emailIssuedBuyerPo(updated) {
  const s = updated?.secret;
  if (!s?.signToken) return { sent: false, skipped: true };
  const doc = await latestBuyerPoDoc(platformDb, updated.tenant_id, updated.id);
  return emailBuyerPoLink(updated, {
    token: s.signToken,
    docNumber: s.docNumber,
    expiresAt: doc?.sign_token_expires_at,
  });
}

async function emailIssuedPoa(updated) {
  const s = updated?.secret;
  if (!s?.signToken) return { sent: false, skipped: true };
  const doc = await latestPoaDoc(platformDb, updated.tenant_id, updated.id);
  return emailPoaLink(updated, {
    token: s.signToken,
    docNumber: s.docNumber,
    sellerName: doc?.seller_signed_name,
    expiresAt: doc?.sign_token_expires_at,
  });
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

router.get("/capacity", async (req, res) => {
  try {
    if (!canManageExportOrders(req.user?.role)) return res.status(403).json({ error: "Forbidden" });
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const db = platformDb;
    await ensureExportOrdersTable(db);
    const exclude = req.query.excludeOrder ? await findExportOrder(db, tenantId, String(req.query.excludeOrder)) : null;
    res.json({ data: await capacityByMonth(db, tenantId, { excludeOrderId: exclude?.id }) });
  } catch (err) {
    sendErr(res, err);
  }
});

router.get("/", async (req, res) => {
  try {
    const db = platformDb;
    if (!(await ensureExportOrdersTable(db))) return res.json({ data: [] });
    const role = req.user?.role;
    if (!canRead(role)) return res.status(403).json({ error: "Forbidden" });
    const brandTenantId = await getExportTenantId(req, res);
    if (!brandTenantId) return;
    try {
      await reconcilePortalExportOrdersToBrandTenant(db, brandTenantId);
      await repricePortalQuotationsToListFob(db, brandTenantId);
    } catch (e) {
      console.warn("[export-orders] portal reconcile/reprice failed:", e?.message || e);
    }

    let q = db("export_orders").orderBy("created_at", "desc");
    if (role === "distributor") {
      let orgId = req.user?.distributorOrgId || req.distributorOrg?.id;
      if (!orgId) {
        try {
          const org = await ensurePortalDistributorOrg(req.user);
          orgId = org?.id;
          if (org) {
            req.user.distributorOrgId = org.id;
            req.distributorOrg = org;
          }
        } catch (e) {
          console.warn("[export-orders] ensure org on list failed:", e?.message || e);
        }
      }
      if (!orgId) return res.json({ data: [] });
      // Portal files are stored on the brand tenant; scope by org link, not CRM tenant.
      q = q.where({ distributor_org_id: orgId });
    } else if (isManufacturer(role)) {
      q = q
        .where({ tenant_id: brandTenantId })
        .whereIn("deposit_status", ["cleared", "exception"])
        .whereNotIn("stage", ["01_lead", "02_quotation", "03_buyer_po", "04_po_acceptance", "05_proforma", "06_deposit"]);
    } else {
      q = q.where({ tenant_id: brandTenantId });
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
    // Always write under Brand HQ tenant so portal orders appear in HQ International orders.
    const tenantId = await getExportTenantId(req, res);
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
    const monthPick = isHq ? newOrderMonthFields(body.requestedMonth) : { fields: {} };
    if (monthPick.error) return res.status(400).json({ error: monthPick.error });

    if (isDist) {
      let org = req.distributorOrg;
      let orgId = req.user?.distributorOrgId || org?.id || null;
      if (!orgId || !org) {
        try {
          org = await ensurePortalDistributorOrg(req.user);
          orgId = org?.id || null;
          if (org) {
            req.user.distributorOrgId = org.id;
            req.distributorOrg = org;
          }
        } catch (e) {
          console.error("[export-orders] ensure distributor org failed:", e);
          return res.status(500).json({
            error: "Could not link this login to a distributor organization. Ask HQ to provision your wholesaler portal.",
          });
        }
      }
      if (!orgId) {
        return res.status(400).json({
          error: "This login is not linked to a distributor organization. Ask HQ to provision your wholesaler portal.",
        });
      }
      distributorOrgId = orgId;
      origin = "portal";
      expoLeadId = null;
      const orgName = String(org?.name || req.distributorOrg?.name || "").trim();
      buyerName = String(req.user?.displayName || buyerName || orgName || "Buyer").trim();
      buyerCompany = orgName || buyerCompany || buyerName;
      buyerEmail = String(req.user?.email || buyerEmail || "").trim().toLowerCase() || null;
      territory = territory || destinationCountry || orgName || "TBD";
      destinationCountry = destinationCountry || territory || null;
    }

    let expoLead = null;
    if (expoLeadId) {
      const lead = await db("expo_leads")
        .where({ tenant_id: tenantId })
        .andWhere((qb) => {
          qb.where("display_id", String(expoLeadId));
          if (/^\d+$/.test(String(expoLeadId))) qb.orWhere("id", Number(expoLeadId));
        })
        .first();
      if (!lead) return res.status(404).json({ error: "Expo lead not found" });
      if (!isExportLeadType(lead.business_type)) {
        return res.status(422).json({
          error: "Only importer, distributor, wholesale and duty-free leads can open an export file.",
          code: "LEAD_NOT_CONVERTIBLE",
        });
      }
      const existing = await findLiveOrderForLead(db, tenantId, lead.id);
      if (existing) {
        return res.status(200).json({ data: exportSerializeForRole(req, existing), existing: true });
      }
      expoLead = lead;
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
      // Catalog SKU + cases only — negotiated sell-in / list FOB applied server-side.
      rawLines = rawLines.map((l) => ({
        sku: l?.sku,
        cases: l?.cases,
        ...(l?.name || l?.product ? { name: l?.name || l?.product } : {}),
        ...(l?.size ? { size: l.size } : {}),
      }));
    } else if (!rawLines.length) {
      rawLines = expoLead ? leadStarterLines(expoLead) : [{ sku: "first_press_750", cases: TRIAL_ORDER_CASES }];
    }
    let lines = parseExportLines(rawLines, { portalOfferOnly: isDist });
    if (!lines.length) {
      return res.status(400).json({
        error: isDist
          ? "Add at least one First Press SKU with cases (Yuzu / Second Bloom is not offered yet)."
          : "Add at least one SKU with cases",
      });
    }
    // Portal: this distributor's negotiated sell-in USD / case × cases (list FOB if unset).
    if (isDist) {
      try {
        const accountId = await resolvePortalWholesaleAccountId(db, tenantId, {
          user: req.user,
          distributorOrgId,
        });
        let caseMap = new Map();
        if (accountId) {
          caseMap = await negotiatedSellInCaseByExportSku(db, tenantId, accountId);
          if (caseMap.size === 0 && req.user?.tenantId && String(req.user.tenantId) !== String(tenantId)) {
            caseMap = await negotiatedSellInCaseByExportSku(db, req.user.tenantId, accountId);
          }
        }
        lines = applyNegotiatedCaseUsdToLines(lines, caseMap);
      } catch (e) {
        console.warn("[export-orders] partner sell-in lookup failed, using list FOB:", e?.message || e);
        lines = applyNegotiatedCaseUsdToLines(lines, new Map());
      }
    }
    const priced = priceExportLines(lines);
    if (monthPick.fields.requested_month) await ensureCapacityColumns(db);
    const now = new Date();
    const row = await db.transaction(async (trx) => {
      const seq = await nextSeq(trx, tenantId);
      const displayId = padDoc("HX", seq);
      const [inserted] = await trx("export_orders")
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
          manufacturer_name: body.manufacturerName ? String(body.manufacturerName).trim() : null,
          manufacturer_id: body.manufacturerId ? String(body.manufacturerId).trim() : null,
          stage: "02_quotation",
          lines: JSON.stringify(
            priced.lines.map((l) => ({
              sku: l.sku,
              cases: l.cases,
              unitFobUsd: l.unitFobUsd,
              caseUsd: l.caseUsd,
            })),
          ),
          subtotal_usd: priced.subtotalUsd,
          deposit_due_usd: priced.depositDueUsd,
          balance_due_usd: priced.balanceDueUsd,
          checklist: JSON.stringify(defaultChecklistState()),
          issued_docs: JSON.stringify({}),
          exclusivity: false,
          ...monthPick.fields,
          created_at: now,
          updated_at: now,
        })
        .returning("*");
      if (expoLead && expoLead.status !== "converted") {
        await trx("expo_leads").where({ tenant_id: tenantId, id: expoLead.id }).update({ status: "converted" });
      }
      return inserted;
    });

    if (isDist) {
      try {
        const emails = await hqNotifyEmails();
        const pricedSer = exportSerializeForRole(req, row);
        await sendPortalExportOrderPlacedEmail({
          to: emails,
          displayId: String(row.display_id || pricedSer.displayId || ""),
          buyerCompany: String(row.buyer_company || ""),
          buyerEmail: String(row.buyer_email || ""),
          territory: String(row.territory || ""),
          subtotalUsd: Number(pricedSer.subtotalUsd ?? priced.subtotalUsd ?? row.subtotal_usd ?? 0),
          hqUrl: `${clientBaseUrl()}/export-orders/${row.display_id}`,
          lines: pricedSer.lines || priced.lines,
        });
      } catch (e) {
        console.warn("[export-orders] HQ notify failed:", e?.message || e);
      }
    }

    res.status(201).json({ data: exportSerializeForRole(req, row) });
  } catch (err) {
    sendErr(res, err);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = platformDb;
    if (!(await ensureExportOrdersTable(db))) return res.status(404).json({ error: "Not found" });
    const row = await loadExportOrderForRequest(db, req, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const role = req.user?.role;
    if (role === "distributor") {
      if (!distributorCanViewStage(row.stage)) {
        return res.status(404).json({ error: "Not found" });
      }
    } else if (isManufacturer(role)) {
      if (!["cleared", "exception"].includes(row.deposit_status)) {
        return res.status(404).json({ error: "Not found" });
      }
    } else if (!canManageExportOrders(role) && role !== "finance" && !hasPermission(role, Permission.EXPORT_READ)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json({ data: await withPoaSummary(db, req, row) });
  } catch (err) {
    sendErr(res, err);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const db = platformDb;
    if (!(await ensureExportOrdersTable(db))) {
      return res.status(500).json({ error: "Export orders table unavailable" });
    }
    const row = await loadExportOrderForRequest(db, req, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const role = req.user?.role;
    const tenantId = row.tenant_id;
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
        manufacturerId: "manufacturer_id",
        requestedCompletion: "requested_completion",
        factoryContact: "factory_contact",
        forwarderName: "forwarder_name",
        forwarderInstructions: "forwarder_instructions",
        fobNamedPoint: "fob_named_point",
        plannedDeparture: "planned_departure",
        checklistOpenItems: "checklist_open_items",
        notes: "notes",
        quoteValidUntil: "quote_valid_until",
        buyerLegalName: "buyer_legal_name",
        buyerRegistrationNo: "buyer_registration_no",
        buyerRegisteredAddress: "buyer_registered_address",
        buyerNoticeEmail: "buyer_notice_email",
        consignee: "consignee",
        deliveryWindow: "delivery_window",
        specLabelRef: "spec_label_ref",
        specialConditions: "special_conditions",
        otherChargesNote: "other_charges_note",
      };
      for (const [k, col] of Object.entries(map)) {
        if (body[k] !== undefined) updates[col] = body[k] === "" ? null : body[k];
      }
      if (body.incotermRule !== undefined) {
        const rule = String(body.incotermRule || "").toUpperCase();
        if (rule && !INCOTERM_RULES.includes(rule)) {
          return res.status(400).json({ error: "Incoterms rule must be FOB or FCA." });
        }
        updates.incoterm_rule = rule || null;
      }
      if (body.otherChargesUsd !== undefined) {
        const n = body.otherChargesUsd === "" || body.otherChargesUsd == null ? 0 : Number(body.otherChargesUsd);
        if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: "Other agreed charges must be 0 or more." });
        if (row.deposit_amount_frozen && n !== Number(row.other_charges_usd || 0)) {
          return res.status(409).json({ error: "Charges are locked once the pro forma is issued." });
        }
        updates.other_charges_usd = n;
      }
      if (!row.deposit_amount_frozen) {
        let subtotal = Number(row.subtotal_usd || 0);
        if (body.lines) {
          const priced = priceExportLines(parseExportLines(body.lines));
          updates.lines = JSON.stringify(
            priced.lines.map((l) => ({
              sku: l.sku,
              cases: l.cases,
              unitFobUsd: l.unitFobUsd,
              caseUsd: l.caseUsd,
            })),
          );
          subtotal = priced.subtotalUsd;
        }
        if (body.lines || updates.other_charges_usd !== undefined) {
          const t = orderTotals(subtotal, updates.other_charges_usd ?? row.other_charges_usd);
          updates.subtotal_usd = t.subtotalUsd;
          updates.deposit_due_usd = t.depositDueUsd;
          updates.balance_due_usd = t.balanceDueUsd;
        }
      }
      if (body.requestedMonth !== undefined) {
        const month = String(body.requestedMonth || "").trim();
        if (row.capacity_reserved_at && month !== String(row.requested_month || "")) {
          return res.status(409).json({
            error: `Reserved for production in ${monthLabel(productionMonth(row.requested_month))}. Cancel and re-book the order to change the month.`,
          });
        }
        if (month && month !== String(row.requested_month || "") && !isBookableDeliveryMonth(month)) {
          return res.status(400).json({ error: "Pick a delivery month from next month onwards." });
        }
        updates.requested_month = month || null;
        const window = updates.delivery_window !== undefined ? updates.delivery_window : row.delivery_window;
        const follow = followMonth(window, row.requested_month, month);
        if (follow) updates.delivery_window = follow;
      }
      if (body.checklist) updates.checklist = JSON.stringify(body.checklist);
      if (body.checklistCleared === true) {
        const cl = body.checklist || asJsonObject(row.checklist);
        if (!requiredChecklistReady(cl, row)) {
          return res.status(400).json({
            error: "Finish Hajime documents (PO, quote, PI, deposit, production auth, invoice, packing list) before marking docs ready.",
          });
        }
        updates.checklist_cleared = true;
      } else if (body.checklistCleared === false) {
        updates.checklist_cleared = false;
      }
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }

    const recheck = row.capacity_reserved_at && updates.lines && firstPressMl(updates.lines) > firstPressMl(row.lines);
    const updated = await db.transaction(async (trx) => {
      if (recheck) {
        const room = await assertMonthHasRoom(trx, tenantId, row, { lines: updates.lines });
        if (!room.ok) throw httpError(409, room.code, { code: "CAPACITY_FULL" });
      }
      const [u] = await trx("export_orders").where({ id: row.id, tenant_id: tenantId }).update(updates).returning("*");
      return u;
    });
    res.json({ data: await withPoaSummary(db, req, updated) });
  } catch (err) {
    sendErr(res, err);
  }
});

async function runAction(req, res, action, payload) {
  try {
    const db = platformDb;
    await ensureExportOrdersTable(db);
    const row = await loadExportOrderForRequest(db, req, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const tenantId = row.tenant_id;
    const updated = await applyTransition({
      tenantId,
      orderId: row.id,
      action,
      actor: actorFrom(req),
      payload: payload || req.body || {},
      db,
    });
    res.json({ data: await withPoaSummary(db, req, updated) });
  } catch (err) {
    sendErr(res, err);
  }
}

router.post("/:id/quotation", (req, res) => runAction(req, res, req.body?.requote ? "requote" : "issue_quotation"));
router.post("/:id/buyer-po", (req, res) => runAction(req, res, "record_buyer_po"));
router.post("/:id/acceptance", async (req, res) => {
  try {
    const db = platformDb;
    await ensureExportOrdersTable(db);
    const row = await loadExportOrderForRequest(db, req, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const tenantId = row.tenant_id;
    const updated = await applyTransition({
      tenantId,
      orderId: row.id,
      action: "accept_po",
      actor: actorFrom(req),
      payload: req.body || {},
      db,
    });
    const email = await emailIssuedPoa(updated);
    const token = updated?.secret?.signToken;
    res.json({ data: await withPoaSummary(db, req, updated), email, url: token ? poaSignUrl(token) : null });
  } catch (err) {
    sendErr(res, err);
  }
});

router.post("/:id/po-acceptance/link", async (req, res) => {
  try {
    if (!canManageExportOrders(req.user?.role)) return res.status(403).json({ error: "Forbidden" });
    const db = platformDb;
    await ensureExportOrdersTable(db);
    const row = await loadExportOrderForRequest(db, req, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const tenantId = row.tenant_id;
    const { token, expiresAt, doc } = await rotatePoaLink(db, { tenantId, order: row });
    const email =
      req.body?.email === true
        ? await emailPoaLink(row, {
            token,
            docNumber: doc.doc_number,
            sellerName: doc.seller_signed_name,
            expiresAt,
          })
        : { sent: false, skipped: true };
    const fresh = await findExportOrder(db, tenantId, row.id);
    res.json({ data: await withPoaSummary(db, req, fresh), url: poaSignUrl(token), expiresAt, email });
  } catch (err) {
    sendErr(res, err);
  }
});
router.post("/:id/buyer-po/send", async (req, res) => {
  try {
    const db = platformDb;
    await ensureExportOrdersTable(db);
    const row = await loadExportOrderForRequest(db, req, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const tenantId = row.tenant_id;
    const updated = await applyTransition({
      tenantId,
      orderId: row.id,
      action: "issue_buyer_po",
      actor: actorFrom(req),
      payload: req.body || {},
      db,
    });
    const email = await emailIssuedBuyerPo(updated);
    const token = updated?.secret?.signToken;
    res.json({ data: await withPoaSummary(db, req, updated), email, url: token ? buyerPoSignUrl(token) : null });
  } catch (err) {
    sendErr(res, err);
  }
});
router.post("/:id/buyer-po/link", async (req, res) => {
  try {
    if (!canManageExportOrders(req.user?.role)) return res.status(403).json({ error: "Forbidden" });
    const db = platformDb;
    await ensureExportOrdersTable(db);
    const row = await loadExportOrderForRequest(db, req, req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const tenantId = row.tenant_id;
    const { token, expiresAt, doc } = await rotateBuyerPoLink(db, { tenantId, order: row });
    const email =
      req.body?.email === true
        ? await emailBuyerPoLink(row, { token, docNumber: doc.doc_number, expiresAt })
        : { sent: false, skipped: true };
    const fresh = await findExportOrder(db, tenantId, row.id);
    res.json({ data: await withPoaSummary(db, req, fresh), url: buyerPoSignUrl(token), expiresAt, email });
  } catch (err) {
    sendErr(res, err);
  }
});
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
    buyer_po: "issue_buyer_po",
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
    if (doc === "po_acceptance") {
      email = await emailIssuedPoa(updated);
    } else if (doc === "buyer_po") {
      email = await emailIssuedBuyerPo(updated);
    } else if (isBuyerExportDoc(doc) && updated.buyer_email) {
      const titles = {
        quotation: "International distributor quotation",
        po_acceptance: "Purchase order acceptance",
        proforma: "Pro forma invoice",
        deposit: "Deposit confirmation",
        shipment_release: "Final payment and shipment release",
      };
      const snap = serializeExportOrder(updated, { buyerFacing: true });
      const docUrl = updated.distributor_org_id
        ? `${clientBaseUrl()}/distributor/international-orders/${updated.display_id}/docs/${doc}`
        : null;
      email = await sendExportDocIssuedEmail({
        to: updated.buyer_email,
        buyerName: updated.buyer_name,
        docTitle: titles[doc] || doc,
        displayId: updated.display_id,
        docUrl,
        commercial:
          doc === "quotation"
            ? {
                lines: snap?.lines || [],
                subtotalUsd: snap?.subtotalUsd,
                depositDueUsd: snap?.depositDueUsd,
                balanceDueUsd: snap?.balanceDueUsd,
              }
            : null,
      });
    }
    res.json({ data: await withPoaSummary(db, req, updated), email });
  } catch (err) {
    sendErr(res, err);
  }
});

export default router;
