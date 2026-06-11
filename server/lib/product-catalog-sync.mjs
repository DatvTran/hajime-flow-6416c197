/** Keep manufacturer / distributor views aligned with Brand Operator catalog (products table). */

function parseJsonObject(raw) {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const o = JSON.parse(raw);
      return typeof o === 'object' && o !== null ? o : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return { ...raw };
  return {};
}

export function generateSkuFromNewProductRequest(row) {
  const specs = parseJsonObject(row.specs);
  const bottleSize = String(specs.packaging?.bottleSize || '750ml');
  const sizeSuffix = bottleSize.replace(/ml$/i, '') || '750';
  const words = String(row.title || 'SKU')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const initials =
    words.length >= 2
      ? words
          .slice(0, 3)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
      : (words[0] || 'SKU').slice(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  return `HJM-${initials}-${sizeSuffix}-${String(year).slice(-2)}`;
}

export function buildProductRowFromNewProductRequest(tenantId, row, sku) {
  const specs = parseJsonObject(row.specs);
  const proposal = parseJsonObject(row.manufacturer_proposal);
  const bottleSize = String(specs.packaging?.bottleSize || '750ml');
  const caseSize = Math.max(1, Number(specs.packaging?.caseConfiguration) || 12);
  const abv = Number(proposal.proposedAbv ?? specs.targetAbv) || 25;
  const minBottles = Math.max(caseSize, Number(specs.minimumOrderQuantity) || 1200);

  const metadata = {
    size: bottleSize,
    caseSize,
    bottleSizeMl: Number.parseInt(bottleSize, 10) || 750,
    abv,
    status: 'active',
    launchDate: specs.targetLaunchDate || undefined,
    wholesaleCasePrice: 0,
    wholesalePriceCase: 0,
    retailPriceCase: 0,
    minOrderCases: Math.max(1, Math.ceil(minBottles / caseSize)),
    newProductRequestId: row.request_id || row.id,
    baseSpirit: specs.baseSpirit,
    flavorProfile: specs.flavorProfile,
    targetPricePoint: specs.targetPricePoint,
  };

  return {
    tenant_id: tenantId,
    sku,
    name: String(row.title || sku),
    description: Array.isArray(specs.flavorProfile) ? specs.flavorProfile.join(', ') : '',
    category: 'Spirits',
    unit_size: bottleSize,
    metadata: JSON.stringify(metadata),
    deleted_at: null,
    updated_at: new Date(),
  };
}

/**
 * When a new product request is approved, upsert the SKU in products so all roles share one catalog.
 * Returns the request row, with resulting_sku set when created.
 */
export async function syncCatalogFromApprovedRequest(dbConn, tenantId, requestRow) {
  if (!requestRow || requestRow.status !== 'approved') return requestRow;

  let sku = String(requestRow.resulting_sku || '').trim();
  if (!sku) {
    sku = generateSkuFromNewProductRequest(requestRow);
    const existing = await dbConn('products')
      .where({ tenant_id: tenantId, sku })
      .whereNull('deleted_at')
      .first('id');
    if (existing) {
      sku = `${sku}-${String(Math.floor(Math.random() * 900) + 100)}`;
    }
  }

  const payload = buildProductRowFromNewProductRequest(tenantId, requestRow, sku);
  const existingProduct = await dbConn('products')
    .where({ tenant_id: tenantId, sku })
    .first();

  if (existingProduct) {
    const mergedMeta = parseJsonObject(existingProduct.metadata);
    const incomingMeta = parseJsonObject(payload.metadata);
    await dbConn('products')
      .where({ id: existingProduct.id, tenant_id: tenantId })
      .update({
        name: payload.name,
        description: payload.description,
        category: payload.category,
        unit_size: payload.unit_size,
        metadata: JSON.stringify({ ...mergedMeta, ...incomingMeta }),
        deleted_at: null,
        updated_at: new Date(),
      });
  } else {
    await dbConn('products').insert(payload);
  }

  if (String(requestRow.resulting_sku || '') !== sku) {
    const [patched] = await dbConn('new_product_requests')
      .where({ id: requestRow.id, tenant_id: tenantId })
      .update({ resulting_sku: sku, updated_at: new Date() })
      .returning('*');
    return patched || { ...requestRow, resulting_sku: sku };
  }

  return requestRow;
}
