/* @ds-bundle: {"format":3,"namespace":"HajimeDesignSystem_6d37a4","components":[],"sourceHashes":{"app/data.jsx":"4458803afb2f","app/pages-dist.jsx":"16975642078d","app/pages-hq.jsx":"789f26cd0b70","app/pages-incentives.jsx":"56b34a3b4efa","app/pages-manuf.jsx":"77c90cb8b83c","app/pages-modules.jsx":"e81fddd1b7ec","app/pages-polish.jsx":"63bd101aec20","app/pages-rep.jsx":"ae91bce31f4d","app/pages-retail.jsx":"b31ffa151aab","app/shell.jsx":"44bdec6cdf10","app/ui.jsx":"fc736c6e6545","deck-stage.js":"ad1c016a6256","design-canvas.jsx":"3fc2600126c0","journeys/intro.jsx":"73496cb24ece","journeys/role-dist.jsx":"faf2ffaee3bf","journeys/role-hq.jsx":"d7a471f6b529","journeys/role-hq2.jsx":"974d3a30dc3e","journeys/role-manuf.jsx":"0c599926ed81","journeys/role-rep.jsx":"50ebdecb43a3","journeys/role-retail.jsx":"5bc9a30b7ed9","journeys/shared.jsx":"2cd6f3053d73","markets/shared.jsx":"1bb5460133ea","markets/v1-classic.jsx":"55329cbd2dd3","markets/v2-cartographic.jsx":"6301e1a50887","markets/v3-timeline.jsx":"9dc26ee44c46","tweaks-panel.jsx":"22c052960f83"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HajimeDesignSystem_6d37a4 = window.HajimeDesignSystem_6d37a4 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// app/data.jsx
try { (() => {
// app/data.jsx — Mock data + AppStore context

// ─── Products ────────────────────────────────────────────────
const PRODUCTS_DATA = [{
  id: 'HJM-FP-750',
  name: 'Florin Peaks',
  type: 'Junmai Daiginjo',
  size: '750ml',
  cs: 12,
  price: 48,
  msrp: 85,
  status: 'active',
  safetyStock: 240
}, {
  id: 'HJM-JN-720',
  name: 'Junmai Shiro',
  type: 'Junmai',
  size: '720ml',
  cs: 12,
  price: 32,
  msrp: 58,
  status: 'active',
  safetyStock: 180
}, {
  id: 'HJM-RY-500',
  name: 'Ryusui Reserve',
  type: 'Genshu',
  size: '500ml',
  cs: 6,
  price: 82,
  msrp: 145,
  status: 'active',
  safetyStock: 60
}, {
  id: 'HJM-YZ-720',
  name: 'Yuzu Nigori',
  type: 'Nigori',
  size: '720ml',
  cs: 12,
  price: 28,
  msrp: 52,
  status: 'active',
  safetyStock: 120
}, {
  id: 'EU-FP-750',
  name: 'First Press Coffee',
  type: 'Coffee Rhum',
  size: '750ml',
  cs: 12,
  price: 52,
  msrp: 92,
  status: 'active',
  safetyStock: 200
}, {
  id: 'HJM-SP-750',
  name: 'Hajime Sparkling',
  type: 'Sparkling',
  size: '750ml',
  cs: 12,
  price: 44,
  msrp: 78,
  status: 'limited',
  safetyStock: 80
}];

// ─── Accounts / CRM ─────────────────────────────────────────
const ACCOUNTS_DATA = [{
  id: 'ACC-001',
  name: 'Dante',
  type: 'restaurant',
  city: 'New York',
  country: 'US',
  status: 'active',
  rep: 'MT',
  rev30: 3840,
  listings: 3,
  lastOrder: '2025-04-05',
  tier: 'key'
}, {
  id: 'ACC-002',
  name: 'Katana Kitten',
  type: 'bar',
  city: 'New York',
  country: 'US',
  status: 'active',
  rep: 'MT',
  rev30: 2100,
  listings: 2,
  lastOrder: '2025-04-10',
  tier: 'standard'
}, {
  id: 'ACC-003',
  name: 'Mace',
  type: 'bar',
  city: 'New York',
  country: 'US',
  status: 'active',
  rep: 'MT',
  rev30: 1680,
  listings: 3,
  lastOrder: '2025-03-28',
  tier: 'standard'
}, {
  id: 'ACC-004',
  name: 'The Drake Hotel',
  type: 'hotel',
  city: 'Toronto',
  country: 'CA',
  status: 'active',
  rep: 'EM',
  rev30: 4200,
  listings: 4,
  lastOrder: '2025-04-11',
  tier: 'key'
}, {
  id: 'ACC-005',
  name: 'Bar Hemingway',
  type: 'bar',
  city: 'Paris',
  country: 'FR',
  status: 'active',
  rep: 'PD',
  rev30: 5100,
  listings: 5,
  lastOrder: '2025-04-08',
  tier: 'flagship'
}, {
  id: 'ACC-006',
  name: 'Quattro Mani',
  type: 'restaurant',
  city: 'Milan',
  country: 'IT',
  status: 'active',
  rep: 'PD',
  rev30: 2880,
  listings: 2,
  lastOrder: '2025-04-01',
  tier: 'standard'
}, {
  id: 'ACC-007',
  name: 'Kioi Sakaba',
  type: 'bar',
  city: 'Tokyo',
  country: 'JP',
  status: 'active',
  rep: 'YK',
  rev30: 6200,
  listings: 6,
  lastOrder: '2025-04-12',
  tier: 'flagship'
}, {
  id: 'ACC-008',
  name: 'Liquid Gold',
  type: 'retail',
  city: 'Brooklyn',
  country: 'US',
  status: 'active',
  rep: 'MT',
  rev30: 1920,
  listings: 2,
  lastOrder: '2025-04-07',
  tier: 'standard'
}, {
  id: 'ACC-009',
  name: 'The Aviary',
  type: 'bar',
  city: 'Chicago',
  country: 'US',
  status: 'prospect',
  rep: 'MT',
  rev30: 0,
  listings: 0,
  lastOrder: null,
  tier: 'standard'
}, {
  id: 'ACC-010',
  name: 'Bar Suntory',
  type: 'bar',
  city: 'New York',
  country: 'US',
  status: 'active',
  rep: 'MT',
  rev30: 1440,
  listings: 2,
  lastOrder: '2025-03-15',
  tier: 'standard'
}, {
  id: 'ACC-011',
  name: 'Verjus',
  type: 'restaurant',
  city: 'Paris',
  country: 'FR',
  status: 'active',
  rep: 'PD',
  rev30: 2640,
  listings: 3,
  lastOrder: '2025-04-03',
  tier: 'standard'
}, {
  id: 'ACC-012',
  name: 'Noma',
  type: 'restaurant',
  city: 'Copenhagen',
  country: 'DK',
  status: 'prospect',
  rep: 'PD',
  rev30: 0,
  listings: 0,
  lastOrder: null,
  tier: 'key'
}];

// ─── Sales Orders ────────────────────────────────────────────
const ORDERS_DATA = [{
  id: 'SO-2604-001',
  account: 'ACC-001',
  accountName: 'Dante',
  rep: 'MT',
  market: 'New York',
  status: 'approved',
  lines: [{
    sku: 'HJM-FP-750',
    qty: 18,
    price: 48
  }, {
    sku: 'HJM-JN-720',
    qty: 6,
    price: 32
  }],
  total: 1056,
  orderDate: '2026-04-25',
  requestedDelivery: '2026-04-28',
  shipmentId: 'SHP-041'
}, {
  id: 'SO-2604-002',
  account: 'ACC-002',
  accountName: 'Katana Kitten',
  rep: 'MT',
  market: 'New York',
  status: 'pending',
  lines: [{
    sku: 'HJM-FP-750',
    qty: 6,
    price: 48
  }],
  total: 288,
  orderDate: '2026-04-25',
  requestedDelivery: '2026-04-29',
  shipmentId: null
}, {
  id: 'SO-2604-003',
  account: 'ACC-003',
  accountName: 'Mace',
  rep: 'MT',
  market: 'New York',
  status: 'pending',
  lines: [{
    sku: 'HJM-RY-500',
    qty: 8,
    price: 82
  }],
  total: 656,
  orderDate: '2026-04-24',
  requestedDelivery: '2026-04-29',
  shipmentId: null
}, {
  id: 'SO-2604-004',
  account: 'ACC-004',
  accountName: 'The Drake Hotel',
  rep: 'EM',
  market: 'Toronto',
  status: 'shipped',
  lines: [{
    sku: 'HJM-FP-750',
    qty: 100,
    price: 48
  }],
  total: 4800,
  orderDate: '2026-04-11',
  requestedDelivery: '2026-04-14',
  shipmentId: 'SHP-038'
}, {
  id: 'SO-2604-005',
  account: 'ACC-005',
  accountName: 'Bar Hemingway',
  rep: 'PD',
  market: 'Paris',
  status: 'delivered',
  lines: [{
    sku: 'HJM-FP-750',
    qty: 40,
    price: 48
  }, {
    sku: 'EU-FP-750',
    qty: 12,
    price: 52
  }],
  total: 2544,
  orderDate: '2026-04-02',
  requestedDelivery: '2026-04-07',
  actualDelivery: '2026-04-07',
  shipmentId: 'SHP-035'
}, {
  id: 'SO-2604-006',
  account: 'ACC-007',
  accountName: 'Kioi Sakaba',
  rep: 'YK',
  market: 'Tokyo',
  status: 'confirmed',
  lines: [{
    sku: 'HJM-FP-750',
    qty: 120,
    price: 48
  }, {
    sku: 'HJM-RY-500',
    qty: 24,
    price: 82
  }],
  total: 7728,
  orderDate: '2026-04-13',
  requestedDelivery: '2026-04-20',
  shipmentId: null
}, {
  id: 'SO-2604-007',
  account: 'ACC-008',
  accountName: 'Liquid Gold',
  rep: 'MT',
  market: 'New York',
  status: 'pending',
  lines: [{
    sku: 'EU-FP-750',
    qty: 12,
    price: 52
  }],
  total: 624,
  orderDate: '2026-04-26',
  requestedDelivery: '2026-04-30',
  shipmentId: null
}, {
  id: 'SO-2604-008',
  account: 'ACC-010',
  accountName: 'Bar Suntory',
  rep: 'MT',
  market: 'New York',
  status: 'draft',
  lines: [{
    sku: 'HJM-FP-750',
    qty: 4,
    price: 48
  }],
  total: 192,
  orderDate: '2026-04-26',
  requestedDelivery: '2026-04-30',
  shipmentId: null
}];

// ─── Inventory ───────────────────────────────────────────────
const INVENTORY_DATA = [
// Tokyo HQ warehouse
{
  id: 'INV-001',
  sku: 'HJM-FP-750',
  location: 'Tokyo HQ',
  locType: 'hq',
  bottles: 4820,
  reserved: 480,
  status: 'available',
  batchId: 'BATCH-2024-011',
  lotNo: 'L2411-A',
  expiry: null
}, {
  id: 'INV-002',
  sku: 'HJM-JN-720',
  location: 'Tokyo HQ',
  locType: 'hq',
  bottles: 2160,
  reserved: 144,
  status: 'available',
  batchId: 'BATCH-2024-009',
  lotNo: 'L2409-A',
  expiry: null
}, {
  id: 'INV-003',
  sku: 'HJM-RY-500',
  location: 'Tokyo HQ',
  locType: 'hq',
  bottles: 480,
  reserved: 48,
  status: 'available',
  batchId: 'BATCH-2024-007',
  lotNo: 'L2407-A',
  expiry: null
},
// Empire Wines Brooklyn (distributor)
{
  id: 'INV-004',
  sku: 'HJM-FP-750',
  location: 'Empire Wines',
  locType: 'distributor',
  bottles: 1704,
  reserved: 216,
  status: 'available',
  batchId: 'BATCH-2024-011',
  lotNo: 'L2411-A',
  expiry: null
}, {
  id: 'INV-005',
  sku: 'HJM-JN-720',
  location: 'Empire Wines',
  locType: 'distributor',
  bottles: 552,
  reserved: 72,
  status: 'available',
  batchId: 'BATCH-2024-009',
  lotNo: 'L2409-A',
  expiry: null
}, {
  id: 'INV-006',
  sku: 'EU-FP-750',
  location: 'Empire Wines',
  locType: 'distributor',
  bottles: 2616,
  reserved: 144,
  status: 'available',
  batchId: 'BATCH-2024-012',
  lotNo: 'L2412-A',
  expiry: null
},
// Vinexpo Paris (distributor)
{
  id: 'INV-007',
  sku: 'HJM-FP-750',
  location: 'Vinexpo Paris',
  locType: 'distributor',
  bottles: 2880,
  reserved: 480,
  status: 'available',
  batchId: 'BATCH-2024-011',
  lotNo: 'L2411-B',
  expiry: null
}, {
  id: 'INV-008',
  sku: 'EU-FP-750',
  location: 'Vinexpo Paris',
  locType: 'distributor',
  bottles: 1440,
  reserved: 144,
  status: 'available',
  batchId: 'BATCH-2024-012',
  lotNo: 'L2412-B',
  expiry: null
},
// In transit
{
  id: 'INV-009',
  sku: 'HJM-FP-750',
  location: 'Tokyo → NYC',
  locType: 'in-transit',
  bottles: 1440,
  reserved: 1440,
  status: 'in-transit',
  batchId: 'BATCH-2024-013',
  lotNo: 'L2413-A',
  expiry: null
}];

// ─── Purchase Orders ─────────────────────────────────────────
const POS_DATA = [{
  id: 'PO-2026-0418',
  sku: 'HJM-FP-750',
  qty: 1800,
  region: 'Tokyo HQ',
  status: 'approved',
  requested: '2026-04-11',
  shipDate: '2026-05-18',
  mfr: 'Yamato Distillery',
  price: 48,
  days: 21
}, {
  id: 'PO-2026-0417',
  sku: 'HJM-JN-720',
  qty: 600,
  region: 'Vinexpo Paris',
  status: 'in-production',
  requested: '2026-04-08',
  shipDate: '2026-05-04',
  mfr: 'Yamato Distillery',
  price: 32,
  days: 21,
  progress: 57
}, {
  id: 'PO-2026-0416',
  sku: 'HJM-FP-750',
  qty: 480,
  region: 'Vinexpo Paris',
  status: 'shipped',
  requested: '2026-03-12',
  shipDate: '2026-04-02',
  mfr: 'Yamato Distillery',
  price: 48,
  days: 21
}, {
  id: 'PO-2026-0415',
  sku: 'EU-FP-750',
  qty: 1200,
  region: 'Empire Wines',
  status: 'delivered',
  requested: '2026-03-01',
  shipDate: '2026-03-22',
  mfr: 'First Press Co.',
  price: 52,
  days: 21
}, {
  id: 'PO-2026-0414',
  sku: 'HJM-RY-500',
  qty: 240,
  region: 'Tokyo HQ',
  status: 'pending',
  requested: '2026-04-26',
  shipDate: null,
  mfr: 'Yamato Distillery',
  price: 82,
  days: 21
}];

// ─── Shipments ───────────────────────────────────────────────
const SHIPMENTS_DATA = [{
  id: 'SHP-041',
  orderId: 'SO-2604-001',
  origin: 'Empire Wines, Brooklyn',
  dest: 'Dante, NYC',
  carrier: 'FedEx',
  trackNo: '794644823',
  status: 'in-transit',
  etd: '2026-04-26',
  eta: '2026-04-28',
  bottles: 288
}, {
  id: 'SHP-040',
  orderId: 'SO-2604-006',
  origin: 'Tokyo HQ',
  dest: 'Kioi Sakaba, Tokyo',
  carrier: 'Yamato',
  trackNo: '1234567890',
  status: 'confirmed',
  etd: '2026-04-28',
  eta: '2026-04-30',
  bottles: 2736
}, {
  id: 'SHP-039',
  orderId: 'SO-2604-004',
  origin: 'Toronto DC',
  dest: 'The Drake Hotel',
  carrier: 'Purolator',
  trackNo: 'PRL33881122',
  status: 'in-transit',
  etd: '2026-04-25',
  eta: '2026-04-27',
  bottles: 1200
}, {
  id: 'SHP-038',
  orderId: 'SO-2604-004',
  origin: 'Tokyo HQ',
  dest: 'Toronto DC',
  carrier: 'Air Canada',
  trackNo: 'AC778923',
  status: 'delivered',
  etd: '2026-04-08',
  eta: '2026-04-11',
  actualDelivery: '2026-04-11',
  bottles: 1200
}, {
  id: 'SHP-035',
  orderId: 'SO-2604-005',
  origin: 'Vinexpo Paris',
  dest: 'Bar Hemingway, Paris',
  carrier: 'Chronopost',
  trackNo: 'CP9934556',
  status: 'delivered',
  etd: '2026-04-05',
  eta: '2026-04-07',
  actualDelivery: '2026-04-07',
  bottles: 624
}, {
  id: 'SHP-PO-016',
  orderId: 'PO-2026-0416',
  origin: 'Yamato Distillery',
  dest: 'Vinexpo Paris',
  carrier: 'Air France',
  trackNo: 'AF119823',
  status: 'in-transit',
  etd: '2026-04-24',
  eta: '2026-04-28',
  bottles: 5760
}];

// ─── Depletion Reports ───────────────────────────────────────
const DEPLETIONS_DATA = [{
  id: 'DEP-001',
  dist: 'Empire Wines',
  sku: 'HJM-FP-750',
  bottles: 216,
  type: 'fulfillment',
  account: 'Dante',
  date: '2026-04-27',
  time: '11:42'
}, {
  id: 'DEP-002',
  dist: 'Empire Wines',
  sku: 'HJM-FP-750',
  bottles: 72,
  type: 'fulfillment',
  account: 'Katana Kitten',
  date: '2026-04-27',
  time: '11:38'
}, {
  id: 'DEP-003',
  dist: 'Empire Wines',
  sku: 'EU-FP-750',
  bottles: 144,
  type: 'fulfillment',
  account: 'Liquid Gold',
  date: '2026-04-27',
  time: '11:14'
}, {
  id: 'DEP-004',
  dist: 'Empire Wines',
  sku: 'HJM-FP-750',
  bottles: 24,
  type: 'sample',
  account: 'Staff tasting',
  date: '2026-04-27',
  time: '10:02',
  note: 'Weekly staff tasting'
}, {
  id: 'DEP-005',
  dist: 'Empire Wines',
  sku: 'EU-FP-750',
  bottles: 2880,
  type: 'inbound',
  account: 'PO-2026-0415',
  date: '2026-04-27',
  time: '09:30'
}, {
  id: 'DEP-006',
  dist: 'Empire Wines',
  sku: 'HJM-JN-720',
  bottles: 48,
  type: 'fulfillment',
  account: 'Mace',
  date: '2026-04-26',
  time: '14:18'
}, {
  id: 'DEP-007',
  dist: 'Empire Wines',
  sku: 'HJM-FP-750',
  bottles: 12,
  type: 'breakage',
  account: 'Damage report',
  date: '2026-04-26',
  time: '09:55',
  note: '2 bottles dropped at receiving',
  pending: true
}];

// ─── Alerts ─────────────────────────────────────────────────
const ALERTS_DATA = [{
  id: 'ALT-001',
  sev: 'critical',
  type: 'low-stock',
  market: 'Singapore',
  msg: 'FP-750 drops below safety stock in 22 days at current velocity',
  link: '#/hq/inventory',
  ts: '2026-04-27T11:00'
}, {
  id: 'ALT-002',
  sev: 'critical',
  type: 'low-stock',
  market: 'South Korea',
  msg: 'FP-750 and JN-720 combined cover < 19 days; urgent replenishment',
  link: '#/hq/inventory',
  ts: '2026-04-27T10:30'
}, {
  id: 'ALT-003',
  sev: 'high',
  type: 'pending-po',
  market: 'Tokyo HQ',
  msg: 'PO-2026-0414 awaiting sign-off — safety stock breach in 6 days',
  link: '#/hq/purchase-orders',
  ts: '2026-04-27T09:15'
}, {
  id: 'ALT-004',
  sev: 'medium',
  type: 'overstock',
  market: 'United Kingdom',
  msg: 'UK cover at 78 days — pause next PO or run a promotion?',
  link: '#/hq/inventory',
  ts: '2026-04-26T18:00'
}, {
  id: 'ALT-005',
  sev: 'medium',
  type: 'overstock',
  market: 'Germany',
  msg: 'DE cover at 82 days',
  link: '#/hq/inventory',
  ts: '2026-04-26T18:00'
}, {
  id: 'ALT-006',
  sev: 'high',
  type: 'shipment-delay',
  market: 'Tokyo',
  msg: 'SHP-040 — ETA slipped 48h due to customs. Now Apr 30.',
  link: '#/hq/shipments',
  ts: '2026-04-27T08:00'
}, {
  id: 'ALT-007',
  sev: 'low',
  type: 'reorder',
  market: 'New York',
  msg: 'Dante — last order 22 days ago, cadence 21d. Follow up due.',
  link: '#/hq/accounts',
  ts: '2026-04-26T09:00'
}];

// ─── Visit Notes (Sales Rep) ─────────────────────────────────
const VISITS_DATA = [{
  id: 'VIS-001',
  account: 'ACC-001',
  accountName: 'Dante',
  rep: 'MT',
  date: '2026-04-25',
  summary: 'JP-2024 moving fast on the tasting menu. Chef interested in a dinner event.',
  draftId: 'SO-2604-001',
  sentiment: 'positive'
}, {
  id: 'VIS-002',
  account: 'ACC-002',
  accountName: 'Katana Kitten',
  rep: 'MT',
  date: '2026-04-25',
  summary: 'Stock looks low — FP-750 almost out. Submitted urgent draft.',
  draftId: 'SO-2604-002',
  sentiment: 'neutral'
}, {
  id: 'VIS-003',
  account: 'ACC-010',
  accountName: 'Bar Suntory',
  rep: 'MT',
  date: '2026-04-24',
  summary: 'Manager changed. New buyer unfamiliar with the brand. Left sample.',
  draftId: null,
  sentiment: 'needs-follow-up'
}];

// ─── Sales Rep Targets ───────────────────────────────────────
const TARGETS_DATA = [{
  rep: 'MT',
  period: 'Apr 2026',
  target: 28000,
  actual: 14820,
  currency: 'USD',
  markets: ['New York'],
  accounts: 38
}];

// ─── App Store Context + Mutations ──────────────────────────
const AppStoreCtx = React.createContext(null);
function AppStoreProvider({
  children
}) {
  const [orders, setOrders] = React.useState(ORDERS_DATA);
  const [inventory, setInventory] = React.useState(INVENTORY_DATA);
  const [pos, setPOs] = React.useState(POS_DATA);
  const [shipments, setShipments] = React.useState(SHIPMENTS_DATA);
  const [depletions, setDepletions] = React.useState(DEPLETIONS_DATA);
  const [alerts, setAlerts] = React.useState(ALERTS_DATA);
  const [accounts, setAccounts] = React.useState(ACCOUNTS_DATA);
  const [products] = React.useState(PRODUCTS_DATA);
  const [visits, setVisits] = React.useState(VISITS_DATA);
  const [toasts, setToasts] = React.useState([]);
  const toast = React.useCallback((msg, tone = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, {
      id,
      msg,
      tone
    }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3400);
  }, []);
  const approveOrder = React.useCallback(id => {
    setOrders(os => os.map(o => o.id === id ? {
      ...o,
      status: 'approved'
    } : o));
    toast(`Order ${id} approved`);
  }, [toast]);
  const rejectOrder = React.useCallback(id => {
    setOrders(os => os.map(o => o.id === id ? {
      ...o,
      status: 'cancelled'
    } : o));
    toast(`Order ${id} rejected`, 'info');
  }, [toast]);
  const updateOrderStatus = React.useCallback((id, status) => {
    setOrders(os => os.map(o => o.id === id ? {
      ...o,
      status
    } : o));
    toast(`Order ${id} → ${status}`);
  }, [toast]);
  const approvePO = React.useCallback(id => {
    setPOs(ps => ps.map(p => p.id === id ? {
      ...p,
      status: 'approved'
    } : p));
    toast(`${id} approved`);
  }, [toast]);
  const dismissAlert = React.useCallback(id => {
    setAlerts(as => as.filter(a => a.id !== id));
  }, []);
  const addDepletion = React.useCallback(dep => {
    const id = 'DEP-' + String(depletions.length + 1).padStart(3, '0');
    setDepletions(ds => [{
      ...dep,
      id,
      time: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }, ...ds]);
    toast('Depletion recorded');
  }, [depletions.length, toast]);
  const createOrder = React.useCallback(order => {
    const id = 'SO-' + Date.now();
    setOrders(os => [{
      ...order,
      id,
      status: 'draft',
      orderDate: new Date().toISOString().slice(0, 10)
    }, ...os]);
    toast(`Draft ${id} created`);
    return id;
  }, [toast]);
  const addVisit = React.useCallback(visit => {
    const id = 'VIS-' + String(visits.length + 1).padStart(3, '0');
    setVisits(vs => [{
      ...visit,
      id,
      date: new Date().toISOString().slice(0, 10)
    }, ...vs]);
    toast('Visit note saved');
  }, [visits.length, toast]);
  return /*#__PURE__*/React.createElement(AppStoreCtx.Provider, {
    value: {
      orders,
      inventory,
      pos,
      shipments,
      depletions,
      alerts,
      accounts,
      products,
      visits,
      toasts,
      toast,
      approveOrder,
      rejectOrder,
      updateOrderStatus,
      approvePO,
      dismissAlert,
      addDepletion,
      createOrder,
      addVisit
    }
  }, children);
}
function useStore() {
  return React.useContext(AppStoreCtx);
}
Object.assign(window, {
  AppStoreProvider,
  useStore,
  PRODUCTS_DATA,
  ACCOUNTS_DATA,
  ORDERS_DATA,
  INVENTORY_DATA,
  POS_DATA,
  SHIPMENTS_DATA,
  DEPLETIONS_DATA,
  ALERTS_DATA
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/data.jsx", error: String((e && e.message) || e) }); }

// app/pages-dist.jsx
try { (() => {
// app/pages-dist.jsx — Distributor pages (P1: Depletion live)

// ─── Distributor Dashboard ────────────────────────────────────
function DistDashboard() {
  const {
    orders,
    inventory,
    depletions
  } = useStore();
  const pickQueue = orders.filter(o => o.status === 'approved');
  const totalStock = inventory.filter(i => i.locType === 'distributor').reduce((a, i) => a + i.bottles, 0);
  const todayDep = depletions.filter(d => d.date === '2026-04-27' && d.type !== 'inbound').reduce((a, d) => a + d.bottles, 0);
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Overview']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Overview",
    eyebrow: "Empire Wines \xB7 Brooklyn \xB7 Distributor",
    sub: "Today's pick queue, inbound receipts, and live depletion.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.check
    }, "Confirm picks")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "To pick today",
    value: pickQueue.length,
    sub: "orders \xB7 cut-off 14:00",
    icon: IC.whouse,
    tone: pickQueue.length > 5 ? 'warm' : 'stone'
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Warehouse stock",
    value: totalStock.toLocaleString(),
    sub: "bottles on-hand",
    icon: IC.box,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Cases out today",
    value: Math.round(todayDep / 12),
    sub: "from today's picks",
    icon: IC.trendD,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "HQ sync",
    value: "Live",
    sub: "depletion in real time",
    icon: IC.check,
    tone: "green"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(DistPickQueue, {
    orders: pickQueue
  }), /*#__PURE__*/React.createElement(DistDepletionMini, null)));
}
function DistPickQueue({
  orders
}) {
  const {
    updateOrderStatus
  } = useStore();
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Pick queue"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, orders.length, " orders to fulfill \xB7 cut-off 14:00")), /*#__PURE__*/React.createElement(Btn, {
    v: "primary",
    sz: "sm",
    icon: IC.scan || IC.check
  }, "Scan picks")), orders.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.check,
    title: "Queue clear",
    sub: "All orders fulfilled for today."
  }) : orders.map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    style: {
      padding: '12px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      fontWeight: 600
    }
  }, o.id), /*#__PURE__*/React.createElement(Badge, {
    status: o.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, o.accountName), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, o.lines.map(l => `${l.qty}× ${l.sku}`).join(', ')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontFamily: T.mono
    }
  }, "Due ", o.requestedDelivery)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "primary",
    sz: "xs",
    onClick: () => updateOrderStatus(o.id, 'shipped')
  }, "Confirm pick"), /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "xs"
  }, "Short?")))));
}
function DistDepletionMini() {
  const {
    depletions
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  const today = depletions.filter(d => d.date === '2026-04-27');
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Depletion live"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: T.green
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: T.green,
      fontWeight: 500
    }
  }, "HQ in sync \xB7 real time"))), /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => navigate(`/${role}/depletion`)
  }, "Full ledger")), today.slice(0, 5).map(d => {
    const toneMap = {
      fulfillment: 'out',
      inbound: 'in',
      sample: 'adj',
      breakage: 'adj'
    };
    const tone = toneMap[d.type] || 'adj';
    const c = tone === 'in' ? T.green : tone === 'out' ? T.ink : T.amber;
    return /*#__PURE__*/React.createElement("div", {
      key: d.id,
      style: {
        padding: '10px 18px',
        borderBottom: `1px solid ${T.borderQ}`,
        display: 'grid',
        gridTemplateColumns: '48px auto 1fr auto',
        gap: 10,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.mono,
        fontSize: 11,
        color: T.muted
      }
    }, d.time), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontFamily: T.mono,
        fontWeight: 600,
        padding: '2px 5px',
        borderRadius: 4,
        background: tone === 'in' ? 'hsl(158 56%36%/.1)' : tone === 'out' ? 'hsl(24 10%10%/.08)' : 'hsl(38 90%50%/.12)',
        color: c,
        letterSpacing: '.04em'
      }
    }, tone.toUpperCase()), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, d.account), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.mono,
        fontSize: 10.5,
        color: T.muted
      }
    }, d.sku)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.display,
        fontSize: 17,
        fontWeight: 600,
        color: c
      }
    }, tone === 'in' ? '+' : '-', d.bottles));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => navigate(`/${role}/depletion`)
  }, "View full depletion ledger \u2192")));
}

// ─── P1: Depletion live (full page) ──────────────────────────
function DistDepletion() {
  const {
    depletions,
    addDepletion
  } = useStore();
  const [showAdj, setShowAdj] = React.useState(false);
  const [adjType, setAdjType] = React.useState('sample');
  const [adjSku, setAdjSku] = React.useState('HJM-FP-750');
  const [adjQty, setAdjQty] = React.useState(0);
  const [adjNote, setAdjNote] = React.useState('');
  const outToday = depletions.filter(d => d.date === '2026-04-27' && d.type === 'fulfillment').reduce((a, d) => a + d.bottles, 0);
  const inToday = depletions.filter(d => d.date === '2026-04-27' && d.type === 'inbound').reduce((a, d) => a + d.bottles, 0);
  const adjToday = depletions.filter(d => d.date === '2026-04-27' && !['fulfillment', 'inbound'].includes(d.type)).length;

  // per-SKU totals today
  const skuTotals = PRODUCTS_DATA.map(p => {
    const out = depletions.filter(d => d.sku === p.id && d.type === 'fulfillment' && d.date === '2026-04-27').reduce((a, d) => a + d.bottles, 0);
    const bars = [42, 38, 56, 71, 84, out || 28, 0]; // synthetic + today
    return {
      ...p,
      out,
      bars
    };
  }).filter(p => p.out > 0);
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Depletion live']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: /*#__PURE__*/React.createElement(React.Fragment, null, "Depletion live ", /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 10,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 999,
        background: 'hsl(158 56%36%/.1)',
        border: '1px solid hsl(158 56%36%/.2)',
        fontSize: 12,
        fontWeight: 500,
        color: T.green,
        fontFamily: T.body,
        verticalAlign: 'middle'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: T.green
      }
    }), "HQ in sync \xB7 ", new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    }))),
    eyebrow: "Empire Wines \xB7 Brooklyn",
    sub: "Every fulfillment and receipt is a depletion event. You never 'submit a report' \u2014 the system reports for you. Annotate only what's surprising.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "outline",
      icon: IC.plus,
      onClick: () => setShowAdj(true)
    }, "Annotate adjustment")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Cases out today",
    value: Math.round(outToday / 12),
    sub: `${outToday} bottles · ${depletions.filter(d => d.date === '2026-04-27' && d.type === 'fulfillment').length} fulfillments`,
    tone: "stone",
    icon: IC.trendD
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Cases in today",
    value: Math.round(inToday / 12),
    sub: `${inToday} bottles received`,
    tone: "green",
    icon: IC.trendU
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Net movement",
    value: Math.round((inToday - outToday) / 12),
    sub: "cases \xB7 net",
    tone: inToday > outToday ? 'green' : 'warm',
    icon: IC.refresh
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Pending annotations",
    value: adjToday,
    sub: "need a note",
    tone: adjToday > 0 ? 'warm' : 'stone',
    icon: IC.note
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Live event ledger"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, "Updated with every fulfillment confirmation")), depletions.map(d => {
    const toneMap = {
      fulfillment: 'out',
      inbound: 'in',
      sample: 'adj',
      breakage: 'adj'
    };
    const tone = toneMap[d.type] || 'adj';
    const c = tone === 'in' ? T.green : tone === 'out' ? T.ink : T.amber;
    return /*#__PURE__*/React.createElement("div", {
      key: d.id,
      style: {
        padding: '11px 18px',
        borderBottom: `1px solid ${T.borderQ}`,
        display: 'grid',
        gridTemplateColumns: '52px auto 1fr auto',
        gap: 12,
        alignItems: 'center',
        background: d.pending ? 'hsl(38 90%50%/.04)' : undefined
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.mono,
        fontSize: 11,
        color: T.muted
      }
    }, d.time), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontFamily: T.mono,
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 4,
        letterSpacing: '.04em',
        background: tone === 'in' ? 'hsl(158 56%36%/.1)' : tone === 'out' ? 'hsl(24 10%10%/.08)' : 'hsl(38 90%50%/.12)',
        color: c
      }
    }, tone.toUpperCase()), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, d.account), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.mono,
        fontSize: 11,
        color: T.muted
      }
    }, d.sku, " ", d.note ? `· ${d.note}` : '')), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.display,
        fontSize: 20,
        fontWeight: 600,
        color: c
      }
    }, tone === 'in' ? '+' : '-', d.bottles), d.pending && /*#__PURE__*/React.createElement(Badge, {
      status: "pending",
      label: "annotate",
      size: "xs"
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Today by SKU"), skuTotals.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: T.muted,
      fontSize: 13
    }
  }, "No depletions logged yet today.") : skuTotals.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      color: T.muted,
      marginLeft: 8
    }
  }, p.id)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontWeight: 600
    }
  }, p.out, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted,
      fontWeight: 400
    }
  }, "bottles"))), /*#__PURE__*/React.createElement(SparkBar, {
    data: p.bars,
    color: T.gold,
    height: 32
  })))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 8
    }
  }, "How this works"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 6,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: "approved",
    label: "IN",
    size: "xs",
    dot: false
  }), /*#__PURE__*/React.createElement("span", null, "Receiving a PO writes an ", /*#__PURE__*/React.createElement("strong", null, "inbound"), " event")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 6,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: "confirmed",
    label: "OUT",
    size: "xs",
    dot: false
  }), /*#__PURE__*/React.createElement("span", null, "Confirming a pick writes a ", /*#__PURE__*/React.createElement("strong", null, "fulfillment"), " event")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 6,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: "pending",
    label: "ADJ",
    size: "xs",
    dot: false
  }), /*#__PURE__*/React.createElement("span", null, "Annotate breakage, samples or unusual draws here")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: T.green,
      marginTop: 5,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", null, "HQ sees every event on the same dataset, same second")))))), /*#__PURE__*/React.createElement(Modal, {
    open: showAdj,
    onClose: () => setShowAdj(false),
    title: "Log adjustment"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Type"
  }, /*#__PURE__*/React.createElement(Select, {
    value: adjType,
    onChange: e => setAdjType(e.target.value),
    options: ['sample', 'breakage', 'theft', 'audit-correction', 'other']
  })), /*#__PURE__*/React.createElement(Field, {
    label: "SKU"
  }, /*#__PURE__*/React.createElement(Select, {
    value: adjSku,
    onChange: e => setAdjSku(e.target.value),
    options: PRODUCTS_DATA.map(p => ({
      value: p.id,
      label: p.name
    }))
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Bottles"
  }, /*#__PURE__*/React.createElement(Input, {
    value: adjQty,
    onChange: e => setAdjQty(+e.target.value),
    type: "number",
    placeholder: "0",
    mono: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Note"
  }, /*#__PURE__*/React.createElement(Textarea, {
    value: adjNote,
    onChange: e => setAdjNote(e.target.value),
    placeholder: "Describe the reason\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowAdj(false)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => {
      addDepletion({
        dist: 'Empire Wines',
        sku: adjSku,
        bottles: adjQty,
        type: adjType,
        account: adjType,
        date: '2026-04-27',
        note: adjNote
      });
      setShowAdj(false);
    }
  }, "Record")))));
}

// ─── Distributor: Inbound ─────────────────────────────────────
function DistInbound() {
  const {
    shipments,
    pos
  } = useStore();
  const inbound = shipments.filter(s => s.id.startsWith('SHP-PO') || s.dest.includes('Empire'));
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Inbound']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Inbound",
    sub: "All POs and transfers arriving at Empire Wines warehouse.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.check
    }, "Receive against PO")
  }), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'Shipment',
      mono: true,
      bold: true
    }, {
      key: 'origin',
      label: 'From'
    }, {
      key: 'carrier',
      label: 'Carrier'
    }, {
      key: 'trackNo',
      label: 'Track #',
      mono: true
    }, {
      key: 'bottles',
      label: 'Bottles',
      right: true,
      mono: true,
      render: r => r.bottles.toLocaleString()
    }, {
      key: 'eta',
      label: 'ETA',
      mono: true
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: '_act',
      label: '',
      sortable: false,
      render: r => r.status === 'delivered' ? /*#__PURE__*/React.createElement(Btn, {
        v: "primary",
        sz: "xs"
      }, "Receive") : /*#__PURE__*/React.createElement("span", {
        style: {
          color: T.muted,
          fontSize: 12
        }
      }, "Awaiting")
    }],
    rows: inbound.length > 0 ? inbound : shipments.slice(0, 2),
    emptyMsg: "No inbound shipments."
  })));
}

// ─── Distributor: Warehouse stock ─────────────────────────────
function DistInventory() {
  const {
    inventory
  } = useStore();
  const distInv = inventory.filter(i => i.locType === 'distributor' && i.location.includes('Empire'));
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Warehouse stock']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Warehouse stock",
    sub: "Current on-hand at Empire Wines \xB7 Brooklyn."
  }), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'sku',
      label: 'SKU',
      mono: true,
      bold: true
    }, {
      key: 'batchId',
      label: 'Batch',
      mono: true
    }, {
      key: 'lotNo',
      label: 'Lot',
      mono: true
    }, {
      key: 'bottles',
      label: 'Bottles',
      right: true,
      mono: true,
      render: r => r.bottles.toLocaleString()
    }, {
      key: 'reserved',
      label: 'Reserved',
      right: true,
      mono: true,
      render: r => r.reserved.toLocaleString()
    }, {
      key: '_avail',
      label: 'Available',
      right: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: T.mono,
          fontWeight: 600,
          fontSize: 13
        }
      }, (r.bottles - r.reserved).toLocaleString())
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }],
    rows: distInv.length > 0 ? distInv : inventory.filter(i => i.locType === 'distributor'),
    emptyMsg: "No warehouse stock."
  })));
}

// ─── Distributor: Sell-through ────────────────────────────────
function DistSellThrough() {
  const sparkW = [420, 380, 440, 480, 510, 580, 540, 620, 680, 710, 690, 750];
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Sell-through']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Sell-through velocity",
    sub: "Cases depleted per week by SKU and account."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 4
    }
  }, "Weekly depletion"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginBottom: 16
    }
  }, "Last 12 weeks \xB7 bottles"), /*#__PURE__*/React.createElement(SparkBar, {
    data: sparkW,
    color: T.gold,
    height: 120
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 9,
      fontFamily: T.mono,
      color: T.muted,
      marginTop: 6
    }
  }, ['W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 'W16'].map(w => /*#__PURE__*/React.createElement("span", {
    key: w
  }, w)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "Top accounts"), [{
    n: 'Dante',
    bt: 216,
    pct: 31
  }, {
    n: 'Katana Kitten',
    bt: 72,
    pct: 10
  }, {
    n: 'Mace',
    bt: 48,
    pct: 7
  }, {
    n: 'Bar Suntory',
    bt: 36,
    pct: 5
  }].map(a => /*#__PURE__*/React.createElement("div", {
    key: a.n,
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, a.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontWeight: 600
    }
  }, a.bt, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted,
      fontWeight: 400
    }
  }, "btl"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      borderRadius: 999,
      background: T.surface,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${a.pct * 3}%`,
      height: '100%',
      background: T.gold
    }
  })))))));
}

// ─── Distributor: Alerts ──────────────────────────────────────
function DistAlerts() {
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Alerts']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Alerts",
    sub: "Stock and logistics alerts relevant to Empire Wines."
  }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.check,
    title: "No active alerts",
    sub: "All stock levels and shipments on track."
  })));
}
Object.assign(window, {
  DistDashboard,
  DistDepletion,
  DistInbound,
  DistInventory,
  DistSellThrough,
  DistAlerts
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/pages-dist.jsx", error: String((e && e.message) || e) }); }

// app/pages-hq.jsx
try { (() => {
// app/pages-hq.jsx — Brand Operator HQ all pages

// ─── HQ Dashboard ────────────────────────────────────────────
function HQDashboard() {
  const {
    orders,
    inventory,
    alerts,
    pos,
    shipments
  } = useStore();
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const totalBottles = inventory.reduce((a, i) => a + i.bottles, 0);
  const criticalAlerts = alerts.filter(a => a.sev === 'critical' || a.sev === 'high');
  const inTransit = shipments.filter(s => s.status === 'in-transit').length;
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Command center']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Command center",
    sub: "One view of sell-through, stock health, approvals, and logistics across every market.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
      v: "outline",
      icon: IC.filter
    }, "All markets"), /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus
    }, "New wholesale order"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Global inventory",
    value: totalBottles.toLocaleString(),
    sub: "bottles on hand",
    icon: IC.box,
    trend: 8,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Pending approvals",
    value: pendingOrders.length,
    sub: "need a decision",
    icon: IC.cart,
    tone: pendingOrders.length > 3 ? 'warm' : 'stone'
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "In transit",
    value: inTransit,
    sub: "active shipments",
    icon: IC.truck,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Active alerts",
    value: criticalAlerts.length,
    sub: "critical + high",
    icon: IC.alert,
    tone: criticalAlerts.length > 2 ? 'warm' : 'stone'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 18,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(HQApprovalQueue, {
    orders: pendingOrders
  }), /*#__PURE__*/React.createElement(HQAlertsFeed, {
    alerts: criticalAlerts.slice(0, 5)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(HQRecentOrders, {
    orders: orders.slice(0, 6)
  }), /*#__PURE__*/React.createElement(HQMarketHealth, null), /*#__PURE__*/React.createElement(HQShipmentTracker, {
    shipments: shipments.slice(0, 4)
  })));
}
function HQApprovalQueue({
  orders
}) {
  const {
    approveOrder,
    rejectOrder
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Approval queue"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, orders.length, " items awaiting your decision")), /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => navigate(`/${role}/orders`)
  }, "View all")), orders.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.check,
    title: "Queue is clear",
    sub: "No orders pending approval."
  }) : orders.slice(0, 5).map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    style: {
      padding: '12px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      fontWeight: 600,
      color: T.ink
    }
  }, o.id), /*#__PURE__*/React.createElement(Badge, {
    status: o.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, o.accountName), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, o.market, " \xB7 $", o.total.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => rejectOrder(o.id)
  }, "Reject"), /*#__PURE__*/React.createElement(Btn, {
    v: "primary",
    sz: "sm",
    onClick: () => approveOrder(o.id)
  }, "Approve")))));
}
function HQAlertsFeed({
  alerts
}) {
  const {
    dismissAlert
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  const sevColor = {
    critical: T.red,
    high: T.amber,
    medium: T.blue,
    low: T.muted
  };
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Alerts"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, alerts.length, " items need attention")), /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => navigate(`/${role}/alerts`)
  }, "Hub")), alerts.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      padding: '12px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'grid',
      gridTemplateColumns: '8px 1fr auto',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: sevColor[a.sev] || T.muted,
      marginTop: 5
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: T.ink,
      textTransform: 'capitalize',
      marginBottom: 2
    }
  }, a.sev, " \xB7 ", a.type.replace(/-/g, ' ')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: T.muted,
      lineHeight: 1.5
    }
  }, a.msg)), /*#__PURE__*/React.createElement("button", {
    onClick: () => dismissAlert(a.id),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: T.muted,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.x,
    size: 13
  })))));
}
function HQRecentOrders({
  orders
}) {
  const {
    navigate,
    role
  } = useRouter();
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Recent orders"), /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => navigate(`/${role}/orders`)
  }, "All orders")), orders.map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    onClick: () => navigate(`/${role}/orders/${o.id}`),
    style: {
      padding: '11px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 8,
      cursor: 'pointer',
      transition: 'background .12s'
    },
    onMouseEnter: e => e.currentTarget.style.background = T.surface,
    onMouseLeave: e => e.currentTarget.style.background = ''
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      fontWeight: 500
    }
  }, o.id), /*#__PURE__*/React.createElement(Badge, {
    status: o.status,
    size: "xs"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 500
    }
  }, o.accountName), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: T.muted
    }
  }, o.market)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 13,
      fontWeight: 600
    }
  }, "$", o.total.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted
    }
  }, o.orderDate)))));
}
function HQMarketHealth() {
  const markets = [{
    c: 'JP',
    name: 'Japan',
    st: 94,
    cover: 62,
    tone: 'green'
  }, {
    c: 'US',
    name: 'US',
    st: 88,
    cover: 41,
    tone: 'green'
  }, {
    c: 'SG',
    name: 'Singapore',
    st: 91,
    cover: 22,
    tone: 'amber'
  }, {
    c: 'KR',
    name: 'S. Korea',
    st: 89,
    cover: 19,
    tone: 'amber'
  }, {
    c: 'GB',
    name: 'UK',
    st: 72,
    cover: 78,
    tone: 'blue'
  }, {
    c: 'FR',
    name: 'France',
    st: 79,
    cover: 54,
    tone: 'green'
  }];
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Market health"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, "Sell-through \xB7 cover days")), markets.map(m => {
    const dotC = m.tone === 'green' ? T.green : m.tone === 'amber' ? T.amber : T.blue;
    return /*#__PURE__*/React.createElement("div", {
      key: m.c,
      style: {
        padding: '10px 18px',
        borderBottom: `1px solid ${T.borderQ}`,
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto',
        gap: 12,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.mono,
        fontSize: 11,
        fontWeight: 600,
        color: T.muted,
        padding: '2px 6px',
        background: T.surface,
        borderRadius: 4,
        textAlign: 'center'
      }
    }, m.c), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 500
      }
    }, m.name), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 4,
        borderRadius: 999,
        background: T.surface,
        overflow: 'hidden',
        marginTop: 4,
        width: 80
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${m.st}%`,
        height: '100%',
        background: dotC
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        fontFamily: T.mono,
        color: m.cover < 30 ? T.red : m.cover > 70 ? T.blue : T.ink
      }
    }, m.cover, "d"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: T.muted
      }
    }, "cover")));
  }));
}
function HQShipmentTracker({
  shipments
}) {
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Shipment tracker"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, "Active movements")), shipments.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: {
      padding: '12px 18px',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      fontWeight: 600
    }
  }, s.id), /*#__PURE__*/React.createElement(Badge, {
    status: s.status,
    size: "xs"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 4
    }
  }, s.origin), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, "\u2192 ", s.dest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontFamily: T.mono,
      color: T.muted,
      marginTop: 4
    }
  }, "ETA ", s.eta))));
}

// ─── Orders List ─────────────────────────────────────────────
function HQOrders() {
  const {
    orders,
    approveOrder,
    rejectOrder
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  const [tab, setTab] = React.useState('all');
  const [showCreate, setShowCreate] = React.useState(false);
  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);
  const tabs = [{
    id: 'all',
    label: `All · ${orders.length}`
  }, {
    id: 'pending',
    label: `Pending · ${orders.filter(o => o.status === 'pending').length}`
  }, {
    id: 'approved',
    label: `Approved · ${orders.filter(o => o.status === 'approved').length}`
  }, {
    id: 'shipped',
    label: `Shipped · ${orders.filter(o => o.status === 'shipped').length}`
  }, {
    id: 'delivered',
    label: `Delivered · ${orders.filter(o => o.status === 'delivered').length}`
  }];
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Orders']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Orders",
    sub: "All sales orders across every channel and market.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
      v: "outline",
      icon: IC.dl
    }, "Export CSV"), /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus,
      onClick: () => setShowCreate(true)
    }, "New order"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: tabs,
    active: tab,
    onChange: setTab
  })), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'Order ID',
      mono: true,
      bold: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: T.gold,
          fontFamily: T.mono,
          fontSize: 12
        }
      }, r.id)
    }, {
      key: 'accountName',
      label: 'Account'
    }, {
      key: 'market',
      label: 'Market'
    }, {
      key: 'orderDate',
      label: 'Date',
      mono: true
    }, {
      key: 'total',
      label: 'Total',
      right: true,
      mono: true,
      render: r => `$${r.total.toLocaleString()}`
    }, {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: '_act',
      label: '',
      sortable: false,
      render: r => r.status === 'pending' ? /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 4
        }
      }, /*#__PURE__*/React.createElement(Btn, {
        v: "ghost",
        sz: "xs",
        onClick: e => {
          e.stopPropagation();
          rejectOrder(r.id);
        }
      }, "Reject"), /*#__PURE__*/React.createElement(Btn, {
        v: "primary",
        sz: "xs",
        onClick: e => {
          e.stopPropagation();
          approveOrder(r.id);
        }
      }, "Approve")) : /*#__PURE__*/React.createElement(Btn, {
        v: "ghost",
        sz: "xs",
        onClick: e => {
          e.stopPropagation();
          navigate(`/${role}/orders/${r.id}`);
        }
      }, /*#__PURE__*/React.createElement(Ico, {
        d: IC.eye,
        size: 13
      }))
    }],
    rows: filtered,
    onRow: r => navigate(`/${role}/orders/${r.id}`),
    emptyMsg: "No orders in this status."
  })), /*#__PURE__*/React.createElement(CreateOrderModal, {
    open: showCreate,
    onClose: () => setShowCreate(false)
  }));
}
function CreateOrderModal({
  open,
  onClose
}) {
  const {
    accounts
  } = useStore();
  const {
    createOrder
  } = useStore();
  const [acct, setAcct] = React.useState('');
  const [market, setMarket] = React.useState('New York');
  const [lines, setLines] = React.useState([{
    sku: 'HJM-FP-750',
    qty: 12,
    price: 48
  }]);
  const total = lines.reduce((a, l) => a + l.qty * l.price, 0);
  return /*#__PURE__*/React.createElement(Modal, {
    open: open,
    onClose: onClose,
    title: "New sales order",
    width: 680
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Account"
  }, /*#__PURE__*/React.createElement(Select, {
    value: acct,
    onChange: e => setAcct(e.target.value),
    options: [{
      value: '',
      label: 'Select account…'
    }, ...accounts.map(a => ({
      value: a.id,
      label: a.name
    }))]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Market"
  }, /*#__PURE__*/React.createElement(Select, {
    value: market,
    onChange: e => setMarket(e.target.value),
    options: ['New York', 'Toronto', 'Paris', 'Milan', 'Tokyo', 'Singapore', 'Hong Kong']
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 10
    }
  }, "Order lines"), lines.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 80px 80px 32px',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Select, {
    value: l.sku,
    onChange: e => setLines(ls => ls.map((x, j) => j === i ? {
      ...x,
      sku: e.target.value
    } : x)),
    options: PRODUCTS_DATA.map(p => ({
      value: p.id,
      label: p.name
    }))
  }), /*#__PURE__*/React.createElement(Input, {
    value: l.qty,
    onChange: e => setLines(ls => ls.map((x, j) => j === i ? {
      ...x,
      qty: +e.target.value
    } : x)),
    type: "number",
    placeholder: "Qty",
    mono: true
  }), /*#__PURE__*/React.createElement(Input, {
    value: l.price,
    onChange: e => setLines(ls => ls.map((x, j) => j === i ? {
      ...x,
      price: +e.target.value
    } : x)),
    type: "number",
    placeholder: "Price",
    mono: true
  }), /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => setLines(ls => ls.filter((_, j) => j !== i))
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.x,
    size: 14
  })))), /*#__PURE__*/React.createElement(Btn, {
    v: "soft",
    sz: "sm",
    icon: IC.plus,
    onClick: () => setLines(l => [...l, {
      sku: 'HJM-FP-750',
      qty: 12,
      price: 48
    }])
  }, "Add line"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      paddingTop: 16,
      borderTop: `1px solid ${T.borderQ}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 15,
      fontWeight: 600
    }
  }, "Total: $", total.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => {
      createOrder({
        account: acct,
        accountName: accounts.find(a => a.id === acct)?.name || 'Unknown',
        market,
        lines,
        total
      });
      onClose();
    }
  }, "Create draft"))));
}

// ─── Order Detail ─────────────────────────────────────────────
function HQOrderDetail() {
  const {
    parts,
    navigate,
    role
  } = useRouter();
  const {
    orders,
    approveOrder,
    rejectOrder,
    updateOrderStatus
  } = useStore();
  const orderId = parts[2];
  const order = orders.find(o => o.id === orderId);
  if (!order) return /*#__PURE__*/React.createElement(AppShell, null, /*#__PURE__*/React.createElement(EmptyState, {
    title: "Order not found",
    sub: `No order with ID ${orderId}`
  }));
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Orders', order.id]
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 24,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 13,
      color: T.muted
    }
  }, order.id), /*#__PURE__*/React.createElement(Badge, {
    status: order.status
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: T.display,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, order.accountName), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.muted,
      marginTop: 4
    }
  }, order.market, " \xB7 Ordered ", order.orderDate)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, order.status === 'pending' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => {
      rejectOrder(order.id);
      navigate(`/${role}/orders`);
    }
  }, "Reject"), /*#__PURE__*/React.createElement(Btn, {
    v: "primary",
    onClick: () => approveOrder(order.id)
  }, "Approve")), order.status === 'approved' && /*#__PURE__*/React.createElement(Btn, {
    v: "primary",
    onClick: () => updateOrderStatus(order.id, 'shipped')
  }, "Mark shipped"), order.status === 'shipped' && /*#__PURE__*/React.createElement(Btn, {
    v: "primary",
    onClick: () => updateOrderStatus(order.id, 'delivered')
  }, "Mark delivered"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "Order lines"), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 13,
      fontFamily: T.body
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['SKU', 'Product', 'Qty', 'Unit price', 'Line total'].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      textAlign: 'left',
      padding: '8px 0',
      fontWeight: 500,
      color: T.muted,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.07em',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, order.lines.map((l, i) => {
    const prod = PRODUCTS_DATA.find(p => p.id === l.sku);
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      style: {
        borderBottom: `1px solid ${T.borderQ}`
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '10px 0',
        fontFamily: T.mono,
        fontSize: 12
      }
    }, l.sku), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '10px 0'
      }
    }, prod?.name || l.sku), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '10px 0',
        fontFamily: T.mono
      }
    }, l.qty), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '10px 0',
        fontFamily: T.mono
      }
    }, "$", l.price), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '10px 0',
        fontFamily: T.mono,
        fontWeight: 600
      }
    }, "$", (l.qty * l.price).toLocaleString()));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 4,
    style: {
      padding: '10px 0',
      fontWeight: 600
    }
  }, "Total"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 0',
      fontFamily: T.mono,
      fontWeight: 700,
      fontSize: 15
    }
  }, "$", order.total.toLocaleString()))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 12
    }
  }, "Status history"), [{
    s: 'Draft created',
    t: order.orderDate
  }, {
    s: 'Submitted for approval',
    t: order.orderDate
  }, {
    s: order.status === 'delivered' ? 'Delivered' : order.status === 'shipped' ? 'Shipped' : order.status === 'approved' ? 'Approved' : 'Awaiting decision',
    t: '—'
  }].map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: i === 2 ? T.gold : T.green,
      marginTop: 4,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, h.s), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      fontFamily: T.mono
    }
  }, h.t)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Details"), [['Account', order.accountName], ['Market', order.market], ['Rep', order.rep], ['Order date', order.orderDate], ['Requested delivery', order.requestedDelivery], ['Shipment', order.shipmentId || '—']].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      fontFamily: l === 'Shipment' ? T.mono : T.body
    }
  }, v)))), order.shipmentId && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 12
    }
  }, "Linked shipment"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 13,
      fontWeight: 600,
      color: T.gold,
      marginBottom: 4
    }
  }, order.shipmentId), /*#__PURE__*/React.createElement(Badge, {
    status: "in-transit"
  })))));
}

// ─── Inventory ────────────────────────────────────────────────
function HQInventory() {
  const {
    inventory
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Inventory']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Inventory",
    sub: "All stock across HQ warehouses, distributors and in-transit locations.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
      v: "outline",
      icon: IC.dl
    }, "Export"), /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus
    }, "Receive stock"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Total on hand",
    value: inventory.filter(i => i.locType !== 'in-transit').reduce((a, i) => a + i.bottles, 0).toLocaleString(),
    sub: "bottles \xB7 all locations",
    icon: IC.box,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "In transit",
    value: inventory.filter(i => i.locType === 'in-transit').reduce((a, i) => a + i.bottles, 0).toLocaleString(),
    sub: "bottles moving",
    icon: IC.truck,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Reserved",
    value: inventory.reduce((a, i) => a + i.reserved, 0).toLocaleString(),
    sub: "bottles committed",
    icon: IC.tag,
    tone: "stone"
  })), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'sku',
      label: 'SKU',
      mono: true,
      bold: true
    }, {
      key: 'location',
      label: 'Location'
    }, {
      key: 'locType',
      label: 'Type',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.locType === 'hq' ? 'active' : r.locType === 'in-transit' ? 'in-transit' : 'confirmed',
        label: r.locType
      })
    }, {
      key: 'bottles',
      label: 'Bottles',
      right: true,
      mono: true,
      render: r => r.bottles.toLocaleString()
    }, {
      key: 'reserved',
      label: 'Reserved',
      right: true,
      mono: true,
      render: r => r.reserved.toLocaleString()
    }, {
      key: '_avail',
      label: 'Available',
      right: true,
      mono: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 600
        }
      }, (r.bottles - r.reserved).toLocaleString())
    }, {
      key: 'batchId',
      label: 'Batch',
      mono: true
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }],
    rows: inventory,
    emptyMsg: "No inventory records."
  })));
}

// ─── Accounts ─────────────────────────────────────────────────
function HQAccounts() {
  const {
    accounts
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  const [showCreate, setShowCreate] = React.useState(false);
  const active = accounts.filter(a => a.status === 'active').length;
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Accounts']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Accounts",
    sub: "Every active retail, restaurant, bar and hotel account.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
      v: "outline",
      icon: IC.filter
    }, "Filter"), /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus,
      onClick: () => setShowCreate(true)
    }, "New account"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Active accounts",
    value: active,
    sub: "in CRM",
    icon: IC.users,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Prospects",
    value: accounts.filter(a => a.status === 'prospect').length,
    sub: "in pipeline",
    icon: IC.target,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Flagships",
    value: accounts.filter(a => a.tier === 'flagship').length,
    sub: "key accounts",
    icon: IC.tag,
    tone: "green"
  })), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'name',
      label: 'Account',
      bold: true,
      render: r => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 28,
          height: 28,
          borderRadius: 6,
          background: T.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 600,
          color: T.muted
        }
      }, r.name.charAt(0)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 500
        }
      }, r.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: T.muted
        }
      }, r.type)))
    }, {
      key: 'city',
      label: 'City'
    }, {
      key: 'country',
      label: 'Country'
    }, {
      key: 'rep',
      label: 'Rep'
    }, {
      key: 'rev30',
      label: '30d Rev',
      right: true,
      mono: true,
      render: r => r.rev30 ? `$${r.rev30.toLocaleString()}` : '—'
    }, {
      key: 'listings',
      label: 'Listings',
      right: true,
      mono: true
    }, {
      key: 'tier',
      label: 'Tier',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.tier === 'flagship' ? 'active' : r.tier === 'key' ? 'approved' : 'confirmed',
        label: r.tier
      })
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }],
    rows: accounts,
    onRow: r => navigate(`/${role}/accounts/${r.id}`),
    emptyMsg: "No accounts found."
  })), /*#__PURE__*/React.createElement(Modal, {
    open: showCreate,
    onClose: () => setShowCreate(false),
    title: "New account"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Trading name"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "e.g. Dante"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Type"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['restaurant', 'bar', 'hotel', 'retail'],
    value: "bar",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "City"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "New York"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Country"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "US"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Primary contact"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Full name"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Email"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "email",
    placeholder: "buyer@venue.com"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowCreate(false)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent"
  }, "Create account"))));
}

// ─── Purchase Orders ──────────────────────────────────────────
function HQPurchaseOrders() {
  const {
    pos,
    approvePO
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  const [showCreate, setShowCreate] = React.useState(false);
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Production requests']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Production requests",
    sub: "All purchase orders to Yamato Distillery and First Press.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus,
      onClick: () => setShowCreate(true)
    }, "New PO"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Pending approval",
    value: pos.filter(p => p.status === 'pending').length,
    icon: IC.file,
    tone: "warm"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "In production",
    value: pos.filter(p => p.status === 'in-production').length,
    icon: IC.factory,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Shipped",
    value: pos.filter(p => p.status === 'shipped').length,
    icon: IC.truck,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Delivered",
    value: pos.filter(p => p.status === 'delivered').length,
    icon: IC.check,
    tone: "green"
  })), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'PO ID',
      mono: true,
      bold: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: T.gold,
          fontFamily: T.mono,
          fontSize: 12
        }
      }, r.id)
    }, {
      key: 'sku',
      label: 'SKU',
      mono: true
    }, {
      key: 'qty',
      label: 'Qty',
      right: true,
      mono: true,
      render: r => r.qty.toLocaleString()
    }, {
      key: 'region',
      label: 'Region'
    }, {
      key: 'mfr',
      label: 'Manufacturer'
    }, {
      key: 'requested',
      label: 'Requested',
      mono: true
    }, {
      key: 'shipDate',
      label: 'Ship date',
      mono: true,
      render: r => r.shipDate || '—'
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: '_act',
      label: '',
      sortable: false,
      render: r => r.status === 'pending' ? /*#__PURE__*/React.createElement(Btn, {
        v: "primary",
        sz: "xs",
        onClick: e => {
          e.stopPropagation();
          approvePO(r.id);
        }
      }, "Approve") : null
    }],
    rows: pos,
    emptyMsg: "No purchase orders."
  })), /*#__PURE__*/React.createElement(Modal, {
    open: showCreate,
    onClose: () => setShowCreate(false),
    title: "New production request"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "SKU"
  }, /*#__PURE__*/React.createElement(Select, {
    options: PRODUCTS_DATA.map(p => ({
      value: p.id,
      label: p.name
    })),
    value: "HJM-FP-750",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Quantity (bottles)"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    placeholder: "1200",
    mono: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Destination region"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['Tokyo HQ', 'Empire Wines', 'Vinexpo Paris'],
    value: "Tokyo HQ",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Requested ship date"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "date",
    mono: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowCreate(false)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent"
  }, "Create PO"))));
}

// ─── Shipments ────────────────────────────────────────────────
function HQShipments() {
  const {
    shipments
  } = useStore();
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Shipments']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Shipments",
    sub: "All inbound and outbound movements.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus
    }, "New shipment")
  }), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'ID',
      mono: true,
      bold: true
    }, {
      key: 'origin',
      label: 'Origin'
    }, {
      key: 'dest',
      label: 'Destination'
    }, {
      key: 'carrier',
      label: 'Carrier'
    }, {
      key: 'trackNo',
      label: 'Tracking',
      mono: true
    }, {
      key: 'eta',
      label: 'ETA',
      mono: true
    }, {
      key: 'bottles',
      label: 'Bottles',
      right: true,
      mono: true,
      render: r => r.bottles.toLocaleString()
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }],
    rows: shipments,
    emptyMsg: "No shipments."
  })));
}

// ─── Alerts Hub ───────────────────────────────────────────────
function HQAlerts() {
  const {
    alerts,
    dismissAlert
  } = useStore();
  const sevC = {
    critical: T.red,
    high: T.amber,
    medium: T.blue,
    low: T.muted
  };
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Alerts']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Alerts hub",
    sub: "Derived from inventory, POs, shipments, and AR. One queue."
  }), alerts.length === 0 ? /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.bell,
    title: "All clear",
    sub: "No active alerts. Good sign."
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, alerts.map(a => /*#__PURE__*/React.createElement(Card, {
    key: a.id,
    style: {
      display: 'grid',
      gridTemplateColumns: '8px 1fr auto',
      gap: 16,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: sevC[a.sev] || T.muted,
      marginTop: 5
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: a.sev,
    custom: a.sev === 'critical' ? 'red' : a.sev === 'high' ? 'amber' : a.sev === 'medium' ? 'blue' : 'stone',
    label: a.sev
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, a.type.replace(/-/g, ' '), " \xB7 ", a.market)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.ink,
      lineHeight: 1.5
    }
  }, a.msg), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontFamily: T.mono,
      marginTop: 4
    }
  }, new Date(a.ts).toLocaleString())), /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => dismissAlert(a.id)
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.x,
    size: 14
  }))))));
}

// ─── Reports ──────────────────────────────────────────────────
function HQReports() {
  const sparkData = [280, 310, 295, 340, 380, 360, 420, 450, 480, 510, 490, 540];
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Reports']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Reports",
    sub: "Live analytics across markets, accounts and supply chain.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "outline",
      icon: IC.dl
    }, "Export")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Revenue MTD",
    value: "$8.6M",
    sub: "vs $7.9M LY",
    icon: IC.receipt,
    trend: 9.4,
    tone: "green"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Sell-through",
    value: "86%",
    sub: "30d rolling",
    icon: IC.trendU,
    trend: 2.1,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Cases shipped",
    value: "2,840",
    sub: "this month",
    icon: IC.box,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Avg order value",
    value: "$1,840",
    sub: "per order",
    icon: IC.cart,
    trend: 4.2,
    tone: "stone"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 18,
      fontWeight: 500,
      marginBottom: 4
    }
  }, "Monthly revenue trend"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      marginBottom: 16
    }
  }, "Last 12 months \xB7 $K"), /*#__PURE__*/React.createElement(SparkBar, {
    data: sparkData,
    color: T.gold,
    height: 120
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12,1fr)',
      marginTop: 6,
      fontSize: 9,
      color: T.muted,
      fontFamily: T.mono,
      textAlign: 'center'
    }
  }, ['M', 'J', 'J', 'A', 'S', 'O', 'N', 'D', 'J', 'F', 'M', 'A'].map((m, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, m)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 18,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "Region breakdown"), [{
    r: 'APAC',
    pct: 48,
    v: '$4.1M',
    c: T.ink
  }, {
    r: 'Americas',
    pct: 38,
    v: '$3.3M',
    c: T.gold
  }, {
    r: 'EMEA',
    pct: 14,
    v: '$1.2M',
    c: 'hsl(35 18%55%)'
  }].map(({
    r,
    pct,
    v,
    c
  }) => /*#__PURE__*/React.createElement("div", {
    key: r,
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13,
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, r), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontWeight: 600
    }
  }, v, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted,
      fontWeight: 400
    }
  }, "(", pct, "%)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 999,
      background: T.surface,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      background: c
    }
  })))))));
}

// ─── Finance ──────────────────────────────────────────────────
function HQFinance() {
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Finance']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Finance & payments",
    sub: "Accounts receivable, accounts payable, Stripe transactions."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "AR outstanding",
    value: "$24,800",
    sub: "across 6 accounts",
    icon: IC.receipt,
    tone: "warm"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Overdue",
    value: "$8,400",
    sub: "3 accounts past 30d",
    icon: IC.alert,
    tone: "warm"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Collected MTD",
    value: "$41,200",
    sub: "vs $38.1K LM",
    icon: IC.check,
    tone: "green",
    trend: 8.1
  })), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'Invoice',
      mono: true
    }, {
      key: 'account',
      label: 'Account'
    }, {
      key: 'amount',
      label: 'Amount',
      right: true,
      mono: true
    }, {
      key: 'due',
      label: 'Due date',
      mono: true
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }],
    rows: [{
      id: 'INV-2604-001',
      account: 'The Drake Hotel',
      amount: '$4,800',
      due: '2026-05-11',
      status: 'pending'
    }, {
      id: 'INV-2604-002',
      account: 'Kioi Sakaba',
      amount: '$7,728',
      due: '2026-05-13',
      status: 'pending'
    }, {
      id: 'INV-2604-003',
      account: 'Bar Hemingway',
      amount: '$2,544',
      due: '2026-04-07',
      status: 'paid'
    }, {
      id: 'INV-2604-004',
      account: 'Bar Suntory',
      amount: '$3,200',
      due: '2026-03-15',
      status: 'overdue'
    }],
    emptyMsg: "No invoices."
  })));
}

// ─── Settings ────────────────────────────────────────────────
function HQSettings() {
  const [activeTab, setActiveTab] = React.useState('team');
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Settings']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Settings",
    sub: "System configuration, team, RBAC, products, and warehouses."
  }), /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      id: 'team',
      label: 'Team'
    }, {
      id: 'products',
      label: 'Products'
    }, {
      id: 'warehouses',
      label: 'Warehouses'
    }, {
      id: 'rbac',
      label: 'Roles & access'
    }, {
      id: 'system',
      label: 'System'
    }],
    active: activeTab,
    onChange: setActiveTab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, activeTab === 'team' && /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'name',
      label: 'Name'
    }, {
      key: 'email',
      label: 'Email',
      mono: true
    }, {
      key: 'role',
      label: 'Role',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: "confirmed",
        label: r.role
      })
    }, {
      key: 'lastLogin',
      label: 'Last login',
      mono: true
    }],
    rows: [{
      id: 'u1',
      name: 'Sora Okuda',
      email: 'sora@hajime.jp',
      role: 'brand_operator',
      lastLogin: '2026-04-27'
    }, {
      id: 'u2',
      name: 'Yui Imanishi',
      email: 'yui@yamato.jp',
      role: 'manufacturer',
      lastLogin: '2026-04-26'
    }, {
      id: 'u3',
      name: 'Léa Bardot',
      email: 'lea@vinexpo.fr',
      role: 'distributor',
      lastLogin: '2026-04-27'
    }, {
      id: 'u4',
      name: 'Mike Tan',
      email: 'mike@hajime.jp',
      role: 'sales_rep',
      lastLogin: '2026-04-27'
    }, {
      id: 'u5',
      name: 'Kazu Saito',
      email: 'kazu@mace.bar',
      role: 'retail',
      lastLogin: '2026-04-25'
    }],
    emptyMsg: "No team members."
  })), activeTab === 'products' && /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'SKU',
      mono: true,
      bold: true
    }, {
      key: 'name',
      label: 'Product'
    }, {
      key: 'type',
      label: 'Category'
    }, {
      key: 'size',
      label: 'Size'
    }, {
      key: 'cs',
      label: 'Case size',
      right: true,
      mono: true
    }, {
      key: 'price',
      label: 'Wholesale',
      right: true,
      mono: true,
      render: r => `$${r.price}`
    }, {
      key: 'msrp',
      label: 'MSRP',
      right: true,
      mono: true,
      render: r => `$${r.msrp}`
    }, {
      key: 'safetyStock',
      label: 'Safety stock',
      right: true,
      mono: true,
      render: r => r.safetyStock.toLocaleString()
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }],
    rows: PRODUCTS_DATA,
    emptyMsg: "No products."
  })), (activeTab === 'warehouses' || activeTab === 'rbac' || activeTab === 'system') && /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.settings,
    title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings`,
    sub: "Configuration UI coming in next iteration."
  })));
}

// ─── Markets ─────────────────────────────────────────────────
function HQMarkets() {
  const markets = [{
    c: 'JP',
    name: 'Japan',
    st: 94,
    cover: 62,
    rev: 1842,
    status: 'healthy'
  }, {
    c: 'US',
    name: 'US',
    st: 88,
    cover: 41,
    rev: 2980,
    status: 'healthy'
  }, {
    c: 'SG',
    name: 'Singapore',
    st: 91,
    cover: 22,
    rev: 612,
    status: 'low-cover'
  }, {
    c: 'KR',
    name: 'S. Korea',
    st: 89,
    cover: 19,
    rev: 338,
    status: 'low-cover'
  }, {
    c: 'GB',
    name: 'UK',
    st: 72,
    cover: 78,
    rev: 488,
    status: 'overstock'
  }, {
    c: 'FR',
    name: 'France',
    st: 79,
    cover: 54,
    rev: 402,
    status: 'healthy'
  }, {
    c: 'CA',
    name: 'Canada',
    st: 81,
    cover: 48,
    rev: 284,
    status: 'healthy'
  }, {
    c: 'AU',
    name: 'Australia',
    st: 76,
    cover: 44,
    rev: 196,
    status: 'healthy'
  }];
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Global markets']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Global markets",
    sub: "Sell-through velocity, cover days, and revenue across 12 markets."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, [{
    l: 'MTD Revenue',
    v: '$8.6M',
    tone: 'gold'
  }, {
    l: 'Markets healthy',
    v: `${markets.filter(m => m.status === 'healthy').length}/${markets.length}`,
    tone: 'green'
  }, {
    l: 'Low cover',
    v: `${markets.filter(m => m.status === 'low-cover').length}`,
    tone: 'warm'
  }, {
    l: 'Overstock',
    v: `${markets.filter(m => m.status === 'overstock').length}`,
    tone: 'stone'
  }].map(({
    l,
    v,
    tone
  }) => /*#__PURE__*/React.createElement(StatCard, {
    key: l,
    label: l,
    value: v,
    tone: tone
  }))), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'c',
      label: 'Code',
      mono: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: T.mono,
          padding: '2px 6px',
          background: T.surface,
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600
        }
      }, r.c)
    }, {
      key: 'name',
      label: 'Market',
      bold: true
    }, {
      key: 'st',
      label: 'Sell-through',
      right: true,
      render: r => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'flex-end'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 56,
          height: 4,
          borderRadius: 999,
          background: T.surface,
          overflow: 'hidden'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: `${r.st}%`,
          height: '100%',
          background: r.st >= 85 ? T.green : r.st >= 75 ? T.gold : T.amber
        }
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: T.mono,
          fontSize: 12,
          minWidth: 32
        }
      }, r.st, "%"))
    }, {
      key: 'cover',
      label: 'Cover',
      right: true,
      mono: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: r.cover < 30 ? T.red : r.cover > 70 ? T.blue : T.ink,
          fontWeight: r.cover < 30 ? 600 : 400
        }
      }, r.cover, "d")
    }, {
      key: 'rev',
      label: 'MTD Revenue',
      right: true,
      mono: true,
      render: r => `$${r.rev.toLocaleString()}K`
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status === 'healthy' ? 'active' : r.status === 'low-cover' ? 'pending' : 'confirmed',
        label: r.status
      })
    }],
    rows: markets,
    emptyMsg: "No markets."
  })));
}
Object.assign(window, {
  HQDashboard,
  HQOrders,
  HQOrderDetail,
  HQInventory,
  HQAccounts,
  HQPurchaseOrders,
  HQShipments,
  HQAlerts,
  HQReports,
  HQFinance,
  HQSettings,
  HQMarkets
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/pages-hq.jsx", error: String((e && e.message) || e) }); }

// app/pages-incentives.jsx
try { (() => {
// app/pages-incentives.jsx
// Comprehensive incentive system linking HQ ↔ Distributor ↔ Sales Rep ↔ Retail
// Each role sees its own portal view; HQ sees everything and manages all programs.

// ─── Shared incentive data ────────────────────────────────────
const INC_PROGRAMS = [
// ── Distributor programs ──
{
  id: 'INC-D01',
  name: 'Volume purchase bonus',
  role: 'dist',
  type: 'Volume',
  rateType: '$',
  rate: 500,
  trigger: 'Per every 200 cases purchased in a calendar month',
  period: 'monthly',
  active: true,
  budget: 12000,
  spent: 3500,
  claims: 7,
  tiers: [{
    t: 100,
    r: 200
  }, {
    t: 200,
    r: 500
  }, {
    t: 400,
    r: 1200
  }, {
    t: 600,
    r: 2000
  }],
  conditions: 'Applies to all Hajime SKUs. Stacks across SKUs.'
}, {
  id: 'INC-D02',
  name: 'Depletion accuracy bonus',
  role: 'dist',
  type: 'Reporting',
  rateType: '$',
  rate: 250,
  trigger: 'Monthly depletion data filed on time with <5% variance',
  period: 'monthly',
  active: true,
  budget: 6000,
  spent: 1500,
  claims: 6,
  tiers: [],
  conditions: 'Submitted by last business day of month. Auto-verified against shipment data.'
}, {
  id: 'INC-D03',
  name: 'Fast-pay discount',
  role: 'dist',
  type: 'Finance',
  rateType: '%',
  rate: 2,
  trigger: 'Invoice paid within 10 days of receipt (vs Net 30)',
  period: 'per-invoice',
  active: true,
  budget: 0,
  spent: 0,
  claims: 4,
  tiers: [],
  conditions: 'Applied as credit on next invoice. Non-stackable.'
}, {
  id: 'INC-D04',
  name: 'New retail door bonus',
  role: 'dist',
  type: 'Expansion',
  rateType: '$',
  rate: 300,
  trigger: 'Each new retail account opened and first order fulfilled',
  period: 'per-event',
  active: true,
  budget: 9000,
  spent: 900,
  claims: 3,
  tiers: [],
  conditions: 'Account must place second order within 60 days to confirm bonus.'
},
// ── Sales Rep programs ──
{
  id: 'INC-R01',
  name: 'SPIF — On-premise',
  role: 'rep',
  type: 'SPIF',
  rateType: '$',
  rate: 150,
  trigger: 'New menu/backbar placement at restaurant, bar or hotel',
  period: 'per-event',
  active: true,
  budget: 15000,
  spent: 2100,
  claims: 14,
  tiers: [],
  conditions: 'One claim per SKU per account per quarter. Photo evidence required.'
}, {
  id: 'INC-R02',
  name: 'SPIF — Off-premise',
  role: 'rep',
  type: 'SPIF',
  rateType: '$',
  rate: 100,
  trigger: 'New shelf/featured placement at retail or specialty',
  period: 'per-event',
  active: true,
  budget: 8000,
  spent: 800,
  claims: 8,
  tiers: [],
  conditions: 'One claim per account per quarter.'
}, {
  id: 'INC-R03',
  name: 'Monthly target attainment',
  role: 'rep',
  type: 'Attainment',
  rateType: '%',
  rate: 5,
  trigger: '5% of revenue above monthly target when target is hit',
  period: 'monthly',
  active: true,
  budget: 20000,
  spent: 740,
  claims: 2,
  tiers: [{
    t: 100,
    r: '5% of excess'
  }, {
    t: 110,
    r: '8% of excess'
  }, {
    t: 125,
    r: '12% of excess'
  }],
  conditions: 'Calculated on net shipped revenue. Paid 30 days after month close.'
}, {
  id: 'INC-R04',
  name: 'New account bonus',
  role: 'rep',
  type: 'Expansion',
  rateType: '$',
  rate: 400,
  trigger: 'New account opened, first order placed and fulfilled',
  period: 'per-event',
  active: true,
  budget: 12000,
  spent: 1200,
  claims: 3,
  tiers: [],
  conditions: 'Account must not have ordered Hajime in the prior 12 months.'
}, {
  id: 'INC-R05',
  name: 'Reorder incentive',
  role: 'rep',
  type: 'Reorder',
  rateType: '$',
  rate: 5,
  trigger: 'Per reorder placed within 30 days of prior delivery',
  period: 'per-event',
  active: true,
  budget: 3000,
  spent: 210,
  claims: 42,
  tiers: [],
  conditions: 'Minimum 6 cases per reorder. Rep must be listed on the account.'
}, {
  id: 'INC-R06',
  name: 'Tasting event bonus',
  role: 'rep',
  type: 'Event',
  rateType: '$',
  rate: 25,
  trigger: 'Facilitated tasting event at an account (4+ guests)',
  period: 'per-event',
  active: true,
  budget: 5000,
  spent: 150,
  claims: 6,
  tiers: [],
  conditions: 'Submit event summary within 7 days. Photo required.'
},
// ── Retail programs ──
{
  id: 'INC-T01',
  name: 'Loyalty tier rewards',
  role: 'retail',
  type: 'Loyalty',
  rateType: '%',
  rate: 0,
  trigger: 'Spend-based tier with compounding discount',
  period: 'rolling-12mo',
  active: true,
  budget: 0,
  spent: 0,
  claims: 0,
  tiers: [{
    t: 0,
    r: 'Bronze · 0%'
  }, {
    t: 10000,
    r: 'Silver · 3%'
  }, {
    t: 25000,
    r: 'Gold · 5%'
  }, {
    t: 50000,
    r: 'Platinum · 8%'
  }],
  conditions: 'Tier calculated on net 12-month spend. Applied to all future orders.'
}, {
  id: 'INC-T02',
  name: 'Volume case discount',
  role: 'retail',
  type: 'Volume',
  rateType: '%',
  rate: 3,
  trigger: '3% discount on orders of 10+ cases in a single order',
  period: 'per-order',
  active: true,
  budget: 0,
  spent: 0,
  claims: 28,
  tiers: [{
    t: 10,
    r: '3%'
  }, {
    t: 25,
    r: '5%'
  }, {
    t: 50,
    r: '8%'
  }],
  conditions: 'Applied at order time. Not stackable with loyalty tier on same SKU.'
}, {
  id: 'INC-T03',
  name: 'Featured cocktail promotion',
  role: 'retail',
  type: 'Menu',
  rateType: '$',
  rate: 200,
  trigger: 'Feature a Hajime cocktail on menu for full quarter',
  period: 'quarterly',
  active: true,
  budget: 8000,
  spent: 600,
  claims: 3,
  tiers: [],
  conditions: 'Submit photo of printed menu. Verified by sales rep on next visit.'
}, {
  id: 'INC-T04',
  name: 'Early adopter — new SKU',
  role: 'retail',
  type: 'Launch',
  rateType: '%',
  rate: 10,
  trigger: 'First order of any newly launched SKU within 60 days of release',
  period: 'per-sku',
  active: true,
  budget: 5000,
  spent: 200,
  claims: 4,
  tiers: [],
  conditions: 'Limited to 2 participating SKUs per account.'
}];
const INC_CLAIMS = [{
  id: 'CLM-001',
  pid: 'INC-R01',
  role: 'rep',
  by: 'Mike Tan',
  account: 'Dante',
  date: '2026-04-25',
  amount: 150,
  status: 'approved',
  evidence: 'photo',
  notes: 'FP-750 on tasting menu'
}, {
  id: 'CLM-002',
  pid: 'INC-R01',
  role: 'rep',
  by: 'Mike Tan',
  account: 'Katana Kitten',
  date: '2026-04-25',
  amount: 150,
  status: 'pending',
  evidence: 'photo',
  notes: 'FP-750 + Ryusui on backbar'
}, {
  id: 'CLM-003',
  pid: 'INC-R06',
  role: 'rep',
  by: 'Mike Tan',
  account: 'Mace',
  date: '2026-04-23',
  amount: 25,
  status: 'approved',
  evidence: 'note',
  notes: 'Staff tasting, 6 attendees'
}, {
  id: 'CLM-004',
  pid: 'INC-R01',
  role: 'rep',
  by: 'Elena Murphy',
  account: 'The Drake Hotel',
  date: '2026-04-20',
  amount: 150,
  status: 'approved',
  evidence: 'photo',
  notes: 'Full backbar listing'
}, {
  id: 'CLM-005',
  pid: 'INC-R05',
  role: 'rep',
  by: 'Mike Tan',
  account: 'Bar Suntory',
  date: '2026-04-24',
  amount: 5,
  status: 'pending',
  evidence: 'auto',
  notes: 'Auto-detected reorder'
}, {
  id: 'CLM-006',
  pid: 'INC-R02',
  role: 'rep',
  by: 'Elena Murphy',
  account: 'Liquid Gold',
  date: '2026-04-18',
  amount: 100,
  status: 'approved',
  evidence: 'photo',
  notes: 'Shelf placement'
}, {
  id: 'CLM-007',
  pid: 'INC-D01',
  role: 'dist',
  by: 'Léa Bardot',
  account: 'Empire Wines',
  date: '2026-04-30',
  amount: 500,
  status: 'pending',
  evidence: 'auto',
  notes: '220 cases purchased'
}, {
  id: 'CLM-008',
  pid: 'INC-D02',
  role: 'dist',
  by: 'Léa Bardot',
  account: 'Empire Wines',
  date: '2026-04-30',
  amount: 250,
  status: 'pending',
  evidence: 'auto',
  notes: 'April depletion filed'
}, {
  id: 'CLM-009',
  pid: 'INC-D04',
  role: 'dist',
  by: 'Léa Bardot',
  account: 'Sazerac SG',
  date: '2026-04-22',
  amount: 300,
  status: 'approved',
  evidence: 'doc',
  notes: 'New retail door opened'
}, {
  id: 'CLM-010',
  pid: 'INC-T02',
  role: 'retail',
  by: 'Kazu Saito',
  account: 'Mace',
  date: '2026-04-26',
  amount: 0,
  status: 'approved',
  evidence: 'auto',
  notes: '12-case order discount applied'
}, {
  id: 'CLM-011',
  pid: 'INC-T03',
  role: 'retail',
  by: 'Kazu Saito',
  account: 'Mace',
  date: '2026-04-01',
  amount: 200,
  status: 'approved',
  evidence: 'photo',
  notes: 'Q2 cocktail menu feature'
}, {
  id: 'CLM-012',
  pid: 'INC-R04',
  role: 'rep',
  by: 'Mike Tan',
  account: 'The Aviary',
  date: '2026-04-15',
  amount: 400,
  status: 'pending',
  evidence: 'doc',
  notes: 'First Aviary order submitted'
}];
const ROLE_COLOR = {
  hq: T.gold,
  dist: 'hsl(215 50%40%)',
  rep: 'hsl(158 50%30%)',
  retail: 'hsl(280 30%40%)'
};
const ROLE_LABEL = {
  hq: 'HQ',
  dist: 'Distributor',
  rep: 'Sales Rep',
  retail: 'Retail'
};
const ROLE_IC = {
  hq: IC.dash,
  dist: IC.whouse,
  rep: IC.users,
  retail: IC.store
};

// ─── Shared helpers ───────────────────────────────────────────
function RolePill({
  role,
  size = 'sm'
}) {
  const c = ROLE_COLOR[role] || T.muted;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      borderRadius: 999,
      padding: size === 'xs' ? '1px 7px' : '2px 9px',
      fontSize: size === 'xs' ? 10 : 11,
      fontWeight: 600,
      background: `${c}18`,
      color: c,
      border: `1px solid ${c}30`,
      whiteSpace: 'nowrap'
    }
  }, ROLE_LABEL[role]);
}
function TierTable({
  tiers
}) {
  if (!tiers || tiers.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      color: T.muted,
      textTransform: 'uppercase',
      letterSpacing: '.07em',
      marginBottom: 8
    }
  }, "Tiers"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, tiers.map((tier, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '7px 12px',
      background: T.surface,
      borderRadius: 8,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, typeof tier.t === 'number' ? `${tier.t}+ units / $${tier.t.toLocaleString()}` : tier.t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      color: T.ink
    }
  }, tier.r)))));
}
function ProgramCard({
  prog,
  onSelect,
  compact
}) {
  const rc = ROLE_COLOR[prog.role] || T.muted;
  const pct = prog.budget > 0 ? Math.min(prog.spent / prog.budget * 100, 100) : 0;
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => onSelect && onSelect(prog),
    style: {
      background: T.card,
      border: `1px solid ${T.borderQ}`,
      borderLeft: `4px solid ${rc}`,
      borderRadius: 14,
      padding: compact ? 14 : 18,
      boxShadow: '0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)',
      cursor: onSelect ? 'pointer' : 'default',
      transition: 'box-shadow .2s'
    },
    onMouseEnter: e => {
      if (onSelect) e.currentTarget.style.boxShadow = '0 2px 4px hsl(24 10%10%/.06),0 8px 24px hsl(24 10%10%/.06)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = '0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)';
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: compact ? 8 : 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(RolePill, {
    role: prog.role
  }), /*#__PURE__*/React.createElement(Badge, {
    status: "confirmed",
    label: prog.type
  }), !prog.active && /*#__PURE__*/React.createElement(Badge, {
    status: "inactive"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: compact ? 16 : 18,
      fontWeight: 600,
      letterSpacing: '-.01em',
      lineHeight: 1.2
    }
  }, prog.name), !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 4,
      lineHeight: 1.5
    }
  }, prog.trigger)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: compact ? 20 : 24,
      fontWeight: 700,
      color: rc,
      letterSpacing: '-.02em'
    }
  }, prog.rateType === '$' ? `$${prog.rate}` : prog.rateType === '%' ? `${prog.rate}%` : 'Tiered'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.muted,
      fontFamily: T.mono
    }
  }, prog.period))), prog.budget > 0 && !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      color: T.muted,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "Budget used"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono
    }
  }, "$", prog.spent.toLocaleString(), " / $", prog.budget.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      borderRadius: 999,
      background: T.surface,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      background: pct > 80 ? T.amber : rc
    }
  }))), !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 10,
      borderTop: `1px solid ${T.borderQ}`,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, prog.claims, " claims this period"), onSelect && /*#__PURE__*/React.createElement("span", {
    style: {
      color: rc,
      fontWeight: 500
    }
  }, "View details \u2192")));
}

// ═══════════════════════════════════════════════════════════════
// HQ — Incentive Manager (full admin)
// ═══════════════════════════════════════════════════════════════
function IncentiveManager() {
  const [tab, setTab] = React.useState('overview');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [selected, setSelected] = React.useState(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newProg, setNewProg] = React.useState({
    name: '',
    role: 'rep',
    type: 'SPIF',
    rate: '',
    rateType: '$',
    trigger: '',
    period: 'per-event',
    budget: ''
  });
  const filteredProgs = roleFilter === 'all' ? INC_PROGRAMS : INC_PROGRAMS.filter(p => p.role === roleFilter);
  const filteredClaims = roleFilter === 'all' ? INC_CLAIMS : INC_CLAIMS.filter(c => c.role === roleFilter);
  const pendingClaims = INC_CLAIMS.filter(c => c.status === 'pending');
  const totalPaid = INC_CLAIMS.filter(c => c.status === 'approved').reduce((a, c) => a + c.amount, 0);
  const totalPending = INC_CLAIMS.filter(c => c.status === 'pending').reduce((a, c) => a + c.amount, 0);
  const totalBudget = INC_PROGRAMS.filter(p => p.budget > 0).reduce((a, p) => a + p.budget, 0);
  const totalSpent = INC_PROGRAMS.reduce((a, p) => a + p.spent, 0);
  const byRole = ['dist', 'rep', 'retail'].map(r => ({
    role: r,
    progs: INC_PROGRAMS.filter(p => p.role === r).length,
    claims: INC_CLAIMS.filter(c => c.role === r).length,
    paid: INC_CLAIMS.filter(c => c.role === r && c.status === 'approved').reduce((a, c) => a + c.amount, 0),
    pending: INC_CLAIMS.filter(c => c.role === r && c.status === 'pending').length
  }));
  const RoleTab = ({
    r
  }) => /*#__PURE__*/React.createElement("div", {
    onClick: () => setRoleFilter(r),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      borderRadius: 10,
      cursor: 'pointer',
      background: roleFilter === r ? ROLE_COLOR[r] + '18' : 'transparent',
      border: `1px solid ${roleFilter === r ? ROLE_COLOR[r] + '50' : T.borderQ}`,
      color: roleFilter === r ? ROLE_COLOR[r] : T.muted,
      fontWeight: roleFilter === r ? 600 : 400,
      fontSize: 13,
      transition: 'all .15s'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: ROLE_IC[r] || IC.users,
    size: 14
  }), ROLE_LABEL[r]);
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Incentive manager']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Incentive manager",
    sub: "Design and manage programs across all three channel partners \u2014 Distributor, Sales Rep, and Retail.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
      v: "outline",
      icon: IC.dl
    }, "Export payouts"), /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus,
      onClick: () => setShowCreate(true)
    }, "New program"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14,
      marginBottom: 22
    }
  }, byRole.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.role,
    onClick: () => setRoleFilter(r.role),
    style: {
      background: T.card,
      border: `1px solid ${T.borderQ}`,
      borderRadius: 14,
      padding: 18,
      cursor: 'pointer',
      borderLeft: `4px solid ${ROLE_COLOR[r.role]}`,
      boxShadow: '0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)',
      transition: 'all .15s'
    },
    onMouseEnter: e => e.currentTarget.style.boxShadow = '0 2px 4px hsl(24 10%10%/.06),0 8px 24px hsl(24 10%10%/.06)',
    onMouseLeave: e => e.currentTarget.style.boxShadow = '0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: `${ROLE_COLOR[r.role]}18`,
      color: ROLE_COLOR[r.role],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: ROLE_IC[r.role] || IC.users,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, ROLE_LABEL[r.role])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, [['Programs', r.progs], ['Claims', r.claims], ['Paid out', `$${r.paid}`], ['Pending', r.pending]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.muted,
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      marginBottom: 2
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 14,
      fontWeight: 600,
      color: T.ink
    }
  }, v))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      flexWrap: 'wrap',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      id: 'overview',
      label: 'Overview'
    }, {
      id: 'programs',
      label: `Programs · ${INC_PROGRAMS.length}`
    }, {
      id: 'claims',
      label: `Claims · ${INC_CLAIMS.length}`
    }, {
      id: 'payouts',
      label: 'Payouts'
    }],
    active: tab,
    onChange: setTab
  }), tab !== 'overview' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setRoleFilter('all'),
    style: {
      padding: '6px 12px',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: roleFilter === 'all' ? 600 : 400,
      background: roleFilter === 'all' ? T.ink : 'transparent',
      color: roleFilter === 'all' ? 'white' : T.muted,
      border: `1px solid ${roleFilter === 'all' ? 'transparent' : T.border}`
    }
  }, "All roles"), /*#__PURE__*/React.createElement(RoleTab, {
    r: "dist"
  }), /*#__PURE__*/React.createElement(RoleTab, {
    r: "rep"
  }), /*#__PURE__*/React.createElement(RoleTab, {
    r: "retail"
  }))), tab === 'overview' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Active programs",
    value: INC_PROGRAMS.filter(p => p.active).length,
    icon: IC.target,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Claims this period",
    value: INC_CLAIMS.length,
    sub: `${pendingClaims.length} pending`,
    icon: IC.receipt,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Total paid out",
    value: `$${totalPaid.toLocaleString()}`,
    icon: IC.check,
    tone: "green"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Budget remaining",
    value: `$${(totalBudget - totalSpent).toLocaleString()}`,
    sub: `of $${totalBudget.toLocaleString()}`,
    icon: IC.more,
    tone: "stone"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "Programs by channel"), ['dist', 'rep', 'retail'].map(r => {
    const progs = INC_PROGRAMS.filter(p => p.role === r);
    const spent = progs.reduce((a, p) => a + p.spent, 0);
    const budget = progs.filter(p => p.budget > 0).reduce((a, p) => a + p.budget, 0);
    const rc = ROLE_COLOR[r];
    return /*#__PURE__*/React.createElement("div", {
      key: r,
      style: {
        display: 'grid',
        gridTemplateColumns: '120px 1fr auto',
        gap: 14,
        padding: '12px 0',
        borderBottom: `1px solid ${T.borderQ}`,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: rc
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500
      }
    }, ROLE_LABEL[r])), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 6,
        borderRadius: 999,
        background: T.surface,
        overflow: 'hidden'
      }
    }, budget > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${Math.min(spent / budget * 100, 100)}%`,
        height: '100%',
        background: rc
      }
    }), budget === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: '100%',
        background: `${rc}30`
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontFamily: T.mono,
        fontWeight: 600,
        minWidth: 80,
        textAlign: 'right'
      }
    }, budget > 0 ? `$${spent.toLocaleString()} / $${budget.toLocaleString()}` : `$${spent} paid`));
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Pending approvals ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.body,
      fontSize: 13,
      color: T.muted,
      fontWeight: 400,
      marginLeft: 8
    }
  }, pendingClaims.length, " items")), pendingClaims.slice(0, 4).map(c => {
    const prog = INC_PROGRAMS.find(p => p.id === c.pid);
    return /*#__PURE__*/React.createElement("div", {
      key: c.id,
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 12,
        padding: '11px 0',
        borderBottom: `1px solid ${T.borderQ}`,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement(RolePill, {
      role: c.role,
      size: "xs"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.mono,
        fontSize: 11,
        color: T.muted
      }
    }, c.id)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500
      }
    }, c.by, " \xB7 ", c.account), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: T.muted
      }
    }, prog?.name, " \xB7 ", c.date)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.display,
        fontSize: 18,
        fontWeight: 700
      }
    }, c.amount ? `$${c.amount}` : '-'), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(Btn, {
      v: "ghost",
      sz: "xs"
    }, "Reject"), /*#__PURE__*/React.createElement(Btn, {
      v: "primary",
      sz: "xs"
    }, "Approve"))));
  }), pendingClaims.length > 4 && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 10,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => setTab('claims')
  }, "View all ", pendingClaims.length, " pending \u2192")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "MTD payouts"), /*#__PURE__*/React.createElement(SparkBar, {
    data: [120, 280, 210, 340, 180, 320, 420, 510, 380, 440, 580, totalPaid],
    color: T.gold,
    height: 80
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 9,
      fontFamily: T.mono,
      color: T.muted,
      marginTop: 6
    }
  }, ['M', 'J', 'J', 'A', 'S', 'O', 'N', 'D', 'J', 'F', 'M', 'A'].map((m, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, m))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 12,
      borderTop: `1px solid ${T.borderQ}`,
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, "Pending payout"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontWeight: 600,
      color: T.amber
    }
  }, "$", totalPending.toLocaleString()))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Top earners"), [{
    n: 'Mike Tan',
    r: 'rep',
    e: 330
  }, {
    n: 'Léa Bardot',
    r: 'dist',
    e: 1050
  }, {
    n: 'Elena Murphy',
    r: 'rep',
    e: 250
  }, {
    n: 'Kazu Saito',
    r: 'retail',
    e: 200
  }].sort((a, b) => b.e - a.e).map((x, i) => /*#__PURE__*/React.createElement("div", {
    key: x.n,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 0',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 16,
      fontWeight: 700,
      color: i === 0 ? T.gold : T.muted,
      width: 20
    }
  }, i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, x.n), /*#__PURE__*/React.createElement(RolePill, {
    role: x.r,
    size: "xs"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 20,
      fontWeight: 700
    }
  }, "$", x.e))))))), tab === 'programs' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: 14
    }
  }, filteredProgs.map(p => /*#__PURE__*/React.createElement(ProgramCard, {
    key: p.id,
    prog: p,
    onSelect: setSelected
  }))), tab === 'claims' && /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'Claim',
      mono: true,
      bold: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: T.gold,
          fontFamily: T.mono,
          fontSize: 12
        }
      }, r.id)
    }, {
      key: 'role',
      label: 'Role',
      render: r => /*#__PURE__*/React.createElement(RolePill, {
        role: r.role
      })
    }, {
      key: 'by',
      label: 'Claimant',
      bold: true
    }, {
      key: 'account',
      label: 'Account'
    }, {
      key: 'pid',
      label: 'Program',
      render: r => {
        const p = INC_PROGRAMS.find(x => x.id === r.pid);
        return /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 12
          }
        }, p?.name || r.pid);
      }
    }, {
      key: 'date',
      label: 'Date',
      mono: true
    }, {
      key: 'amount',
      label: 'Amount',
      right: true,
      mono: true,
      render: r => r.amount ? `$${r.amount}` : '—'
    }, {
      key: 'evidence',
      label: 'Evidence',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.evidence === 'photo' ? 'active' : r.evidence === 'auto' ? 'confirmed' : 'pending',
        label: r.evidence
      })
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: '_act',
      label: '',
      sortable: false,
      render: r => r.status === 'pending' ? /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 4
        }
      }, /*#__PURE__*/React.createElement(Btn, {
        v: "ghost",
        sz: "xs"
      }, "Reject"), /*#__PURE__*/React.createElement(Btn, {
        v: "primary",
        sz: "xs"
      }, "Approve")) : null
    }],
    rows: filteredClaims,
    emptyMsg: "No claims."
  })), tab === 'payouts' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Payout ledger"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, "Approved claims ready for payment")), /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'Claim',
      mono: true
    }, {
      key: 'role',
      label: 'Role',
      render: r => /*#__PURE__*/React.createElement(RolePill, {
        role: r.role,
        size: "xs"
      })
    }, {
      key: 'by',
      label: 'Payee'
    }, {
      key: 'date',
      label: 'Date',
      mono: true
    }, {
      key: 'amount',
      label: 'Amount',
      right: true,
      mono: true,
      render: r => r.amount ? `$${r.amount}` : '—'
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: '_pay',
      label: '',
      sortable: false,
      render: r => r.status === 'approved' ? /*#__PURE__*/React.createElement(Btn, {
        v: "primary",
        sz: "xs"
      }, "Pay") : null
    }],
    rows: filteredClaims,
    emptyMsg: "No payouts."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "By channel"), ['dist', 'rep', 'retail'].map(r => {
    const paid = INC_CLAIMS.filter(c => c.role === r && c.status === 'approved').reduce((a, c) => a + c.amount, 0);
    const pend = INC_CLAIMS.filter(c => c.role === r && c.status === 'pending').reduce((a, c) => a + c.amount, 0);
    const rc = ROLE_COLOR[r];
    return /*#__PURE__*/React.createElement("div", {
      key: r,
      style: {
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: rc
      }
    }), ROLE_LABEL[r]), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.mono,
        fontWeight: 600
      }
    }, "$", paid, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: T.amber,
        fontWeight: 400
      }
    }, "+$", pend, " pending"))), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 6,
        borderRadius: 999,
        background: T.surface,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${paid ? Math.min(paid / totalPaid * 100, 100) : 5}%`,
        height: '100%',
        background: rc
      }
    })));
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Payout schedule"), [{
    d: 'Apr 30',
    desc: 'Sales Rep SPIF Q1 close',
    amt: 580
  }, {
    d: 'May 5',
    desc: 'Distributor volume bonus',
    amt: 750
  }, {
    d: 'May 15',
    desc: 'Retail featured menu Q2',
    amt: 200
  }, {
    d: 'May 30',
    desc: 'Rep target attainment Apr',
    amt: 740
  }].map(p => /*#__PURE__*/React.createElement("div", {
    key: p.d,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '9px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      color: T.muted,
      marginBottom: 2
    }
  }, p.d), /*#__PURE__*/React.createElement("div", null, p.desc)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 18,
      fontWeight: 700
    }
  }, "$", p.amt)))))), /*#__PURE__*/React.createElement(Drawer, {
    open: !!selected,
    onClose: () => setSelected(null),
    title: selected?.name || '',
    width: 520
  }, selected && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(RolePill, {
    role: selected.role
  }), /*#__PURE__*/React.createElement(Badge, {
    status: "confirmed",
    label: selected.type
  }), /*#__PURE__*/React.createElement(Badge, {
    status: selected.active ? 'active' : 'inactive'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      background: `${ROLE_COLOR[selected.role]}08`,
      border: `1px solid ${ROLE_COLOR[selected.role]}25`,
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: ROLE_COLOR[selected.role],
      fontFamily: T.mono,
      letterSpacing: '.06em',
      marginBottom: 6
    }
  }, "TRIGGER"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.ink,
      lineHeight: 1.55
    }
  }, selected.trigger)), [['Rate', selected.rateType === '$' ? `$${selected.rate} per event` : selected.rateType === '%' ? `${selected.rate}% discount` : 'Tiered — see below'], ['Period', selected.period], ['Conditions', selected.conditions], ['Budget', selected.budget ? `$${selected.budget.toLocaleString()}` : 'Unlimited'], ['Spent this period', `$${selected.spent.toLocaleString()}`], ['Claims', selected.claims]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '9px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      maxWidth: '55%',
      textAlign: 'right'
    }
  }, v))), /*#__PURE__*/React.createElement(TierTable, {
    tiers: selected.tiers
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: '.07em'
    }
  }, "Claims for this program"), INC_CLAIMS.filter(c => c.pid === selected.id).map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '9px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500
    }
  }, c.by, " \xB7 ", c.account), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontFamily: T.mono
    }
  }, c.date, " \xB7 ", c.notes)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, c.amount ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontWeight: 600
    }
  }, "$", c.amount) : null, /*#__PURE__*/React.createElement(Badge, {
    status: c.status
  })))), !INC_CLAIMS.find(c => c.pid === selected.id) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted
    }
  }, "No claims yet.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    style: {
      flex: 1
    },
    onClick: () => setSelected(null)
  }, "Close"), /*#__PURE__*/React.createElement(Btn, {
    v: selected.active ? 'soft' : 'accent',
    style: {
      flex: 1
    }
  }, selected.active ? 'Pause program' : 'Activate')))), /*#__PURE__*/React.createElement(Modal, {
    open: showCreate,
    onClose: () => setShowCreate(false),
    title: "New incentive program",
    width: 580
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Program name",
    style: {
      gridColumn: '1/-1'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    value: newProg.name,
    onChange: e => setNewProg(p => ({
      ...p,
      name: e.target.value
    })),
    placeholder: "e.g. Q3 SPIF \u2014 On-premise"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Target role"
  }, /*#__PURE__*/React.createElement(Select, {
    value: newProg.role,
    onChange: e => setNewProg(p => ({
      ...p,
      role: e.target.value
    })),
    options: [{
      value: 'dist',
      label: 'Distributor'
    }, {
      value: 'rep',
      label: 'Sales Rep'
    }, {
      value: 'retail',
      label: 'Retail'
    }]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Program type"
  }, /*#__PURE__*/React.createElement(Select, {
    value: newProg.type,
    onChange: e => setNewProg(p => ({
      ...p,
      type: e.target.value
    })),
    options: ['SPIF', 'Volume', 'Attainment', 'Reorder', 'Event', 'Loyalty', 'Finance', 'Expansion', 'Launch', 'Menu']
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Rate type"
  }, /*#__PURE__*/React.createElement(Select, {
    value: newProg.rateType,
    onChange: e => setNewProg(p => ({
      ...p,
      rateType: e.target.value
    })),
    options: [{
      value: '$',
      label: 'Fixed ($)'
    }, {
      value: '%',
      label: 'Percentage (%)'
    }, {
      value: 'tiered',
      label: 'Tiered'
    }]
  })), /*#__PURE__*/React.createElement(Field, {
    label: `Rate (${newProg.rateType})`
  }, /*#__PURE__*/React.createElement(Input, {
    value: newProg.rate,
    onChange: e => setNewProg(p => ({
      ...p,
      rate: e.target.value
    })),
    placeholder: "150",
    mono: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Period"
  }, /*#__PURE__*/React.createElement(Select, {
    value: newProg.period,
    onChange: e => setNewProg(p => ({
      ...p,
      period: e.target.value
    })),
    options: ['per-event', 'monthly', 'quarterly', 'per-order', 'per-invoice', 'per-sku', 'rolling-12mo']
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Budget cap ($)"
  }, /*#__PURE__*/React.createElement(Input, {
    value: newProg.budget,
    onChange: e => setNewProg(p => ({
      ...p,
      budget: e.target.value
    })),
    placeholder: "10000",
    mono: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Trigger (what earns this)",
    style: {
      gridColumn: '1/-1'
    }
  }, /*#__PURE__*/React.createElement(Textarea, {
    value: newProg.trigger,
    onChange: e => setNewProg(p => ({
      ...p,
      trigger: e.target.value
    })),
    placeholder: "Describe the qualifying action\u2026",
    rows: 2
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Conditions & exclusions",
    style: {
      gridColumn: '1/-1'
    }
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 2,
    placeholder: "Stackability, verification requirements, exclusions\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowCreate(false)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "soft",
    onClick: () => setShowCreate(false)
  }, "Save as draft"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => setShowCreate(false)
  }, "Launch program"))));
}

// ═══════════════════════════════════════════════════════════════
// Distributor — My incentives
// ═══════════════════════════════════════════════════════════════
function DistIncentives() {
  const [selected, setSelected] = React.useState(null);
  const [showClaim, setShowClaim] = React.useState(null);
  const myProgs = INC_PROGRAMS.filter(p => p.role === 'dist');
  const myClaims = INC_CLAIMS.filter(c => c.role === 'dist');
  const earned = myClaims.filter(c => c.status === 'approved').reduce((a, c) => a + c.amount, 0);
  const pending = myClaims.filter(c => c.status === 'pending').reduce((a, c) => a + c.amount, 0);
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Incentives']
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "Empire Wines \xB7 Distributor",
    title: "My incentives",
    sub: "Programs you're enrolled in. Every qualifying action is auto-detected where possible \u2014 you annotate only what's surprising."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Active programs",
    value: myProgs.filter(p => p.active).length,
    icon: IC.target,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Earned this period",
    value: `$${earned.toLocaleString()}`,
    sub: "approved",
    icon: IC.check,
    tone: "green"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Pending approval",
    value: `$${pending.toLocaleString()}`,
    sub: `${myClaims.filter(c => c.status === 'pending').length} claims`,
    icon: IC.more,
    tone: "warm"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 2
    }
  }, "Available programs"), myProgs.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      background: T.card,
      border: `1px solid ${T.borderQ}`,
      borderRadius: 14,
      padding: 18,
      borderLeft: `4px solid ${ROLE_COLOR.dist}`,
      boxShadow: '0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: "confirmed",
    label: p.type
  }), !p.active && /*#__PURE__*/React.createElement(Badge, {
    status: "inactive"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      marginTop: 4,
      lineHeight: 1.5
    }
  }, p.trigger)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 24,
      fontWeight: 700,
      color: ROLE_COLOR.dist
    }
  }, p.rateType === '$' ? `$${p.rate}` : p.rateType === '%' ? `${p.rate}%` : 'Tiered'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.muted,
      fontFamily: T.mono
    }
  }, p.period))), /*#__PURE__*/React.createElement(TierTable, {
    tiers: p.tiers
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 10,
      borderTop: `1px solid ${T.borderQ}`,
      fontSize: 12,
      color: T.muted
    }
  }, p.conditions), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    sz: "sm",
    onClick: () => setSelected(p)
  }, "Details"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    sz: "sm",
    icon: IC.plus,
    onClick: () => setShowClaim(p)
  }, "Submit claim"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "My claims"), myClaims.map(c => {
    const prog = INC_PROGRAMS.find(p => p.id === c.pid);
    return /*#__PURE__*/React.createElement("div", {
      key: c.id,
      style: {
        padding: '10px 0',
        borderBottom: `1px solid ${T.borderQ}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500
      }
    }, prog?.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: T.muted,
        fontFamily: T.mono,
        marginTop: 2
      }
    }, c.id, " \xB7 ", c.date), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: T.muted,
        marginTop: 2
      }
    }, c.notes)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, c.amount > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.display,
        fontSize: 18,
        fontWeight: 700
      }
    }, "$", c.amount), /*#__PURE__*/React.createElement(Badge, {
      status: c.status
    }))));
  }), myClaims.length === 0 && /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.receipt,
    title: "No claims yet",
    sub: "Qualifying actions are auto-detected."
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 12
    }
  }, "How auto-detection works"), [['Volume bonus', 'Triggered when your monthly purchase crosses a tier threshold. Auto-submitted end of month.'], ['Depletion bonus', 'Triggered when your monthly depletion report is filed and verified. No manual claim needed.'], ['Fast-pay', 'Applied automatically when your ERP records payment within 10 days.'], ['New door bonus', 'Triggered when a new account places its first confirmed order through your warehouse.']].map(([t, d]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: T.ink,
      marginBottom: 2
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      lineHeight: 1.5
    }
  }, d)))))), /*#__PURE__*/React.createElement(Modal, {
    open: !!showClaim,
    onClose: () => setShowClaim(null),
    title: `Submit claim — ${showClaim?.name || ''}`,
    width: 480
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      background: `${ROLE_COLOR.dist}08`,
      border: `1px solid ${ROLE_COLOR.dist}25`,
      borderRadius: 10,
      fontSize: 13,
      color: T.ink,
      lineHeight: 1.5
    }
  }, showClaim?.trigger), /*#__PURE__*/React.createElement(Field, {
    label: "Supporting note"
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 3,
    placeholder: "Describe the qualifying action, reference any POs or accounts\u2026"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Evidence type"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['Auto-detected (no upload needed)', 'Invoice copy', 'Photo', 'Signed document'],
    value: "Auto-detected (no upload needed)",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowClaim(null)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => setShowClaim(null)
  }, "Submit claim")))), /*#__PURE__*/React.createElement(Drawer, {
    open: !!selected,
    onClose: () => setSelected(null),
    title: selected?.name || '',
    width: 480
  }, selected && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TierTable, {
    tiers: selected.tiers
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 13,
      color: T.muted,
      lineHeight: 1.6
    }
  }, selected.conditions), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    style: {
      width: '100%'
    },
    onClick: () => {
      setSelected(null);
      setShowClaim(selected);
    }
  }, "Submit a claim \u2192")))));
}

// ═══════════════════════════════════════════════════════════════
// Sales Rep — My incentives
// ═══════════════════════════════════════════════════════════════
function RepIncentives() {
  const [showClaim, setShowClaim] = React.useState(null);
  const [tab, setTab] = React.useState('programs');
  const myProgs = INC_PROGRAMS.filter(p => p.role === 'rep');
  const myClaims = INC_CLAIMS.filter(c => c.role === 'rep' && c.by === 'Mike Tan');
  const earned = myClaims.filter(c => c.status === 'approved').reduce((a, c) => a + c.amount, 0);
  const pending = myClaims.filter(c => c.status === 'pending').reduce((a, c) => a + c.amount, 0);
  const ytd = earned + 830; // synthetic prior months

  // Attainment tier
  const target = 28000,
    actual = 14820;
  const attainPct = Math.round(actual / target * 100);
  const attainTier = attainPct >= 125 ? '12% of excess' : attainPct >= 110 ? '8% of excess' : attainPct >= 100 ? '5% of excess' : 'Not yet hit';
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Incentives']
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "Mike Tan \xB7 Sales Rep \xB7 NYC",
    title: "My incentives",
    sub: "Your active SPIF programs, placement log, and earnings. Submit claims after each qualifying visit."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Earned this month",
    value: `$${earned.toLocaleString()}`,
    sub: "approved",
    icon: IC.check,
    tone: "green"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Pending",
    value: `$${pending.toLocaleString()}`,
    sub: "awaiting HQ",
    icon: IC.more,
    tone: "warm"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "YTD earnings",
    value: `$${ytd.toLocaleString()}`,
    sub: "Jan\u2013Apr 2026",
    icon: IC.chart,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Claims submitted",
    value: myClaims.length,
    sub: "this month",
    icon: IC.receipt,
    tone: "stone"
  })), /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      id: 'programs',
      label: 'Programs'
    }, {
      id: 'log',
      label: `Claim log · ${myClaims.length}`
    }, {
      id: 'attainment',
      label: 'Target attainment'
    }],
    active: tab,
    onChange: setTab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, tab === 'programs' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: 14
    }
  }, myProgs.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      background: T.card,
      border: `1px solid ${T.borderQ}`,
      borderLeft: `4px solid ${ROLE_COLOR.rep}`,
      borderRadius: 14,
      padding: 18,
      boxShadow: '0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: "confirmed",
    label: p.type,
    style: {
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: '-.01em',
      margin: '6px 0'
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      lineHeight: 1.5
    }
  }, p.trigger)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 26,
      fontWeight: 700,
      color: ROLE_COLOR.rep
    }
  }, p.rateType === '$' ? `$${p.rate}` : p.rateType === '%' ? `${p.rate}%` : 'Tiered'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.muted,
      fontFamily: T.mono
    }
  }, p.period))), /*#__PURE__*/React.createElement(TierTable, {
    tiers: p.tiers
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 10,
      borderTop: `1px solid ${T.borderQ}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, INC_CLAIMS.filter(c => c.pid === p.id && c.by === 'Mike Tan').length, " of your claims this period"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    sz: "sm",
    icon: IC.plus,
    onClick: () => setShowClaim(p)
  }, "Claim"))))), tab === 'log' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'ID',
      mono: true
    }, {
      key: 'pid',
      label: 'Program',
      render: r => {
        const p = INC_PROGRAMS.find(x => x.id === r.pid);
        return /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 12
          }
        }, p?.type);
      }
    }, {
      key: 'account',
      label: 'Account'
    }, {
      key: 'date',
      label: 'Date',
      mono: true
    }, {
      key: 'amount',
      label: '$',
      right: true,
      mono: true,
      render: r => r.amount ? `$${r.amount}` : '—'
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }],
    rows: myClaims,
    emptyMsg: "No claims yet this period."
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "By program"), myProgs.map(p => {
    const cls = myClaims.filter(c => c.pid === p.id);
    const amt = cls.reduce((a, c) => a + c.amount, 0);
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500
      }
    }, p.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.mono,
        fontWeight: 600
      }
    }, "$", amt, " \xB7 ", cls.length, " claims")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 5,
        borderRadius: 999,
        background: T.surface,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${Math.min(amt / 800 * 100, 100)}%`,
        height: '100%',
        background: ROLE_COLOR.rep
      }
    })));
  }))), tab === 'attainment' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "April attainment"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 48,
      fontWeight: 700,
      letterSpacing: '-.025em',
      color: attainPct >= 100 ? ROLE_COLOR.rep : T.amber
    }
  }, attainPct, "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.muted,
      marginBottom: 16
    }
  }, "$", actual.toLocaleString(), " of $", target.toLocaleString(), " target \xB7 1 day left"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      borderRadius: 999,
      background: T.surface,
      overflow: 'hidden',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${Math.min(attainPct, 125)}%`,
      height: '100%',
      background: attainPct >= 100 ? ROLE_COLOR.rep : T.amber,
      transition: 'width .5s'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, "Bonus tier: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: attainPct >= 100 ? ROLE_COLOR.rep : T.muted
    }
  }, attainTier)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, INC_PROGRAMS.filter(p => p.id === 'INC-R03')[0] && /*#__PURE__*/React.createElement(TierTable, {
    tiers: INC_PROGRAMS.find(p => p.id === 'INC-R03').tiers
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Monthly trend"), /*#__PURE__*/React.createElement(SparkBar, {
    data: [82, 91, 78, 95, 88, 103, 97, 112, 88, 95, 102, attainPct],
    color: attainPct >= 100 ? ROLE_COLOR.rep : T.amber,
    height: 90
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 9,
      fontFamily: T.mono,
      color: T.muted,
      marginTop: 6
    }
  }, ['M', 'J', 'J', 'A', 'S', 'O', 'N', 'D', 'J', 'F', 'M', 'A'].map((m, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, m))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 12,
      borderTop: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      marginBottom: 8
    }
  }, "What to hit 110%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      lineHeight: 1.6
    }
  }, "You need ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.ink
    }
  }, "$", (target * 1.1 - actual).toLocaleString()), " more in shipped revenue by month end to unlock the 8% attainment bonus."))))), /*#__PURE__*/React.createElement(Modal, {
    open: !!showClaim,
    onClose: () => setShowClaim(null),
    title: `Claim — ${showClaim?.name || ''}`,
    width: 480
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      background: `${ROLE_COLOR.rep}08`,
      border: `1px solid ${ROLE_COLOR.rep}25`,
      borderRadius: 10,
      fontSize: 13,
      color: T.ink
    }
  }, showClaim?.trigger), /*#__PURE__*/React.createElement(Field, {
    label: "Account"
  }, /*#__PURE__*/React.createElement(Select, {
    options: [{
      value: '',
      label: 'Select account…'
    }, ...ACCOUNTS_DATA.filter(a => a.rep === 'MT').map(a => ({
      value: a.id,
      label: a.name
    }))],
    value: "",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Evidence type"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['Photo (required for SPIF)', 'Visit note auto-attached', 'Signed document'],
    value: "Photo (required for SPIF)",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      background: T.surface,
      borderRadius: 8,
      fontSize: 12,
      color: T.muted
    }
  }, "Attach a photo of the placement, shelf, or menu. Claims without evidence are held for manual review."), /*#__PURE__*/React.createElement(Field, {
    label: "Notes"
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 2,
    placeholder: "What did you observe? Bartender name, menu position, nearby SKUs\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowClaim(null)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => setShowClaim(null)
  }, "Submit claim")))));
}

// ═══════════════════════════════════════════════════════════════
// Retail — My rewards
// ═══════════════════════════════════════════════════════════════
function RetailIncentives() {
  const [showClaim, setShowClaim] = React.useState(null);
  const myProgs = INC_PROGRAMS.filter(p => p.role === 'retail');
  const myClaims = INC_CLAIMS.filter(c => c.role === 'retail');

  // Loyalty tier calculation
  const spend12mo = 18240; // Mace's rolling 12-month spend
  const tiers = [{
    t: 0,
    l: 'Bronze',
    r: '0%',
    c: 'hsl(30 30%55%)'
  }, {
    t: 10000,
    l: 'Silver',
    r: '3%',
    c: 'hsl(30 10%70%)'
  }, {
    t: 25000,
    l: 'Gold',
    r: '5%',
    c: T.gold
  }, {
    t: 50000,
    l: 'Platinum',
    r: '8%',
    c: 'hsl(215 60%60%)'
  }];
  const currentTier = tiers.filter(t => spend12mo >= t.t).pop();
  const nextTier = tiers.find(t => t.t > spend12mo);
  const toNext = nextTier ? nextTier.t - spend12mo : 0;
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Rewards']
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "Mace \xB7 Brooklyn \xB7 Retail",
    title: "My rewards",
    sub: "Loyalty tier status, available promotions, and active discount programs."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '28px 32px',
      borderRadius: 18,
      marginBottom: 22,
      background: `linear-gradient(135deg, ${currentTier.c}22, ${currentTier.c}08)`,
      border: `1px solid ${currentTier.c}40`,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 24,
      alignItems: 'center',
      boxShadow: '0 1px 2px hsl(24 10%10%/.04),0 8px 32px hsl(24 10%10%/.06)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: currentTier.c,
      fontFamily: T.mono,
      letterSpacing: '.1em',
      marginBottom: 8
    }
  }, "YOUR LOYALTY TIER"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 42,
      fontWeight: 700,
      letterSpacing: '-.025em',
      color: currentTier.c,
      lineHeight: 1
    }
  }, currentTier.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: T.ink,
      marginTop: 8,
      fontWeight: 500
    }
  }, currentTier.r !== '0%' ? `${currentTier.r} discount on all orders` : 'Start earning — place your first order'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      marginTop: 4
    }
  }, "Based on $", spend12mo.toLocaleString(), " spend in the last 12 months"), nextTier && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, currentTier.l, " \u2192 ", nextTier.l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontWeight: 600
    }
  }, "$", toNext.toLocaleString(), " to go")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 999,
      background: `${currentTier.c}18`,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${Math.min(spend12mo / nextTier.t * 100, 100)}%`,
      height: '100%',
      background: currentTier.c
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, tiers.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.l,
    style: {
      padding: '10px 14px',
      borderRadius: 10,
      background: t.l === currentTier.l ? `${t.c}20` : T.surface,
      border: `1px solid ${t.l === currentTier.l ? t.c + '50' : T.border}`,
      opacity: spend12mo >= t.t ? 1 : .5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontFamily: T.mono,
      color: t.c,
      letterSpacing: '.06em',
      marginBottom: 2
    }
  }, t.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: T.ink
    }
  }, t.r), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.muted,
      marginTop: 1
    }
  }, "$", (t.t / 1000).toFixed(0), "K+ / yr"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 2
    }
  }, "Active promotions"), myProgs.map(p => {
    const myClaim = myClaims.find(c => c.pid === p.id);
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        background: T.card,
        border: `1px solid ${T.borderQ}`,
        borderLeft: `4px solid ${ROLE_COLOR.retail}`,
        borderRadius: 14,
        padding: 18,
        boxShadow: '0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      status: "confirmed",
      label: p.type
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.display,
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: '-.01em',
        margin: '6px 0'
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: T.muted,
        lineHeight: 1.5
      }
    }, p.trigger)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.display,
        fontSize: 26,
        fontWeight: 700,
        color: ROLE_COLOR.retail
      }
    }, p.tiers.length > 0 ? 'Tiered' : p.rateType === '$' ? `$${p.rate}` : p.rateType === '%' ? `${p.rate}%` : '—'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: T.muted,
        fontFamily: T.mono
      }
    }, p.period))), /*#__PURE__*/React.createElement(TierTable, {
      tiers: p.tiers.map(t => ({
        t: typeof t.t === 'number' ? `$${t.t.toLocaleString()}+` : t.t,
        r: t.r
      }))
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12,
        paddingTop: 10,
        borderTop: `1px solid ${T.borderQ}`,
        fontSize: 12,
        color: T.muted,
        marginBottom: 12
      }
    }, p.conditions), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }
    }, myClaim ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      status: myClaim.status
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        color: T.muted
      }
    }, "Claim ", myClaim.id)) : /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      sz: "sm",
      icon: IC.plus,
      onClick: () => setShowClaim(p)
    }, "Claim this reward")));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "My reward history"), myClaims.map(c => {
    const prog = INC_PROGRAMS.find(p => p.id === c.pid);
    return /*#__PURE__*/React.createElement("div", {
      key: c.id,
      style: {
        padding: '10px 0',
        borderBottom: `1px solid ${T.borderQ}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500
      }
    }, prog?.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: T.muted,
        fontFamily: T.mono,
        marginTop: 2
      }
    }, c.id, " \xB7 ", c.date), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: T.muted,
        marginTop: 2
      }
    }, c.notes)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, c.amount > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.display,
        fontSize: 18,
        fontWeight: 700
      }
    }, "$", c.amount), /*#__PURE__*/React.createElement(Badge, {
      status: c.status
    }))));
  }), myClaims.length === 0 && /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.receipt,
    title: "No rewards yet",
    sub: "Volume discounts apply automatically at checkout."
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 12
    }
  }, "How discounts apply"), [['Loyalty tier', 'Applied automatically to every order. No code needed.'], ['Volume case discount', 'Applied at checkout when your order hits the case threshold.'], ['Featured cocktail', 'Submit a photo of your printed menu. Verified by your rep.'], ['Early adopter', 'Applied to first order of a new SKU. Auto-detected.']].map(([t, d]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: ROLE_COLOR.retail,
      marginTop: 5,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      lineHeight: 1.5,
      marginTop: 2
    }
  }, d))))))), /*#__PURE__*/React.createElement(Modal, {
    open: !!showClaim,
    onClose: () => setShowClaim(null),
    title: `Claim — ${showClaim?.name || ''}`,
    width: 460
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      background: `${ROLE_COLOR.retail}08`,
      border: `1px solid ${ROLE_COLOR.retail}25`,
      borderRadius: 10,
      fontSize: 13,
      lineHeight: 1.5
    }
  }, showClaim?.trigger), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, "Your Hajime rep ", ACCOUNTS_DATA.find(a => a.id === 'ACC-003')?.rep || 'Mike', " will verify and confirm. Usually within 48 hours."), /*#__PURE__*/React.createElement(Field, {
    label: "Evidence"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['Photo of printed menu', 'Shelf photo', 'Other documentation'],
    value: "Photo of printed menu",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Note"
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 2,
    placeholder: "Anything helpful for verification\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowClaim(null)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => setShowClaim(null)
  }, "Submit reward claim")))));
}
Object.assign(window, {
  IncentiveManager,
  DistIncentives,
  RepIncentives,
  RetailIncentives
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/pages-incentives.jsx", error: String((e && e.message) || e) }); }

// app/pages-manuf.jsx
try { (() => {
// app/pages-manuf.jsx — Manufacturer pages

function ManufDashboard() {
  const {
    pos,
    shipments
  } = useStore();
  const inProd = pos.filter(p => p.status === 'in-production');
  const pending = pos.filter(p => p.status === 'pending');
  const shipped = pos.filter(p => p.status === 'shipped');
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Overview']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Overview",
    eyebrow: "Yamato Distillery \xB7 Manufacturer portal",
    sub: "Production pipeline, POs in, shipments out. Nothing commercial.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.factory
    }, "Log update")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Pending orders",
    value: pending.length,
    sub: "need acknowledgement",
    icon: IC.file,
    tone: pending.length > 0 ? 'warm' : 'stone'
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "In production",
    value: inProd.length,
    sub: "active batches",
    icon: IC.factory,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Shipped",
    value: shipped.length,
    sub: "this month",
    icon: IC.truck,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Capacity used",
    value: "78%",
    sub: "still \xB7 this week",
    icon: IC.chart,
    tone: "stone"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(ManufProductionBoard, {
    pos: pos
  }), /*#__PURE__*/React.createElement(ManufShipOut, {
    shipments: shipments.filter(s => s.id.startsWith('SHP-PO'))
  })));
}
function ManufProductionBoard({
  pos
}) {
  const stages = ['pending', 'approved', 'in-production', 'shipped', 'delivered'];
  const stageLabel = {
    pending: 'Queued',
    approved: 'Approved',
    'in-production': 'In production',
    shipped: 'Shipped',
    delivered: 'Delivered'
  };
  const stageC = {
    pending: 'hsl(30 10%55%)',
    approved: T.gold,
    'in-production': 'hsl(15 60%45%)',
    shipped: T.blue,
    delivered: T.green
  };
  const {
    approvePO
  } = useStore();
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Production board"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, "Drag cards across stages to update status")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5,1fr)',
      gap: 1,
      background: T.borderQ,
      minHeight: 360
    }
  }, stages.map(stage => /*#__PURE__*/React.createElement("div", {
    key: stage,
    style: {
      background: T.paper2,
      padding: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      background: stageC[stage]
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: T.ink
    }
  }, stageLabel[stage]), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 10,
      color: T.muted,
      marginLeft: 'auto'
    }
  }, pos.filter(p => p.status === stage).length)), pos.filter(p => p.status === stage).map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      background: T.card,
      border: `1px solid ${T.borderQ}`,
      borderLeft: `3px solid ${stageC[stage]}`,
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 8,
      cursor: 'grab'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 10,
      color: T.muted,
      marginBottom: 3
    }
  }, p.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      fontWeight: 600,
      color: T.ink,
      marginBottom: 4
    }
  }, p.sku), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 18,
      fontWeight: 600
    }
  }, p.qty.toLocaleString(), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: T.muted,
      fontWeight: 400,
      marginLeft: 3
    }
  }, "bottles")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.muted,
      fontFamily: T.mono,
      marginTop: 4
    }
  }, p.region), p.shipDate && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.muted,
      fontFamily: T.mono
    }
  }, "ETA ", p.shipDate), stage === 'pending' && /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    sz: "xs",
    style: {
      marginTop: 8,
      width: '100%'
    },
    onClick: () => approvePO(p.id)
  }, "Acknowledge"))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: `1px dashed ${T.border}`,
      borderRadius: 8,
      padding: '10px 12px',
      fontSize: 11,
      color: T.muted,
      textAlign: 'center'
    }
  }, "+ drop here")))));
}
function ManufShipOut({
  shipments
}) {
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Outbound shipments"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, "From Yamato \u2192 distributors")), shipments.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.truck,
    title: "No outbound shipments",
    sub: "Processed shipments appear here."
  }) : shipments.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: {
      padding: '12px 18px',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      fontWeight: 600
    }
  }, s.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      marginTop: 2
    }
  }, s.dest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, s.bottles.toLocaleString(), " bottles \xB7 ETA ", s.eta)), /*#__PURE__*/React.createElement(Badge, {
    status: s.status
  })))));
}

// ─── Manufacturer POs in ─────────────────────────────────────
function ManufPOsIn() {
  const {
    pos,
    approvePO
  } = useStore();
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Orders in']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Production orders",
    sub: "Approved POs from Hajime HQ ready for your production queue.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "outline",
      icon: IC.dl
    }, "Export specs")
  }), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'PO ID',
      mono: true,
      bold: true
    }, {
      key: 'sku',
      label: 'SKU',
      mono: true
    }, {
      key: 'qty',
      label: 'Qty',
      right: true,
      mono: true,
      render: r => r.qty.toLocaleString()
    }, {
      key: 'region',
      label: 'Ship to'
    }, {
      key: 'requested',
      label: 'Requested',
      mono: true
    }, {
      key: 'shipDate',
      label: 'Target ship',
      mono: true,
      render: r => r.shipDate || '—'
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: '_act',
      label: '',
      sortable: false,
      render: r => r.status === 'pending' ? /*#__PURE__*/React.createElement(Btn, {
        v: "primary",
        sz: "xs",
        onClick: e => {
          e.stopPropagation();
          approvePO(r.id);
        }
      }, "Acknowledge") : /*#__PURE__*/React.createElement(Btn, {
        v: "ghost",
        sz: "xs"
      }, "Update")
    }],
    rows: pos,
    emptyMsg: "No POs received."
  })));
}

// ─── Manufacturer specs ───────────────────────────────────────
function ManufSpecs() {
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Product specs']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Product specs",
    sub: "Packaging, labelling and certification requirements per SKU."
  }), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'SKU',
      mono: true,
      bold: true
    }, {
      key: 'name',
      label: 'Product'
    }, {
      key: 'type',
      label: 'Category'
    }, {
      key: 'size',
      label: 'Size'
    }, {
      key: 'cs',
      label: 'Case size',
      right: true,
      mono: true
    }, {
      key: '_notes',
      label: 'Notes',
      sortable: false,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: T.muted,
          fontSize: 12
        }
      }, "Standard JP packaging \xB7 EN/JA labels")
    }],
    rows: PRODUCTS_DATA,
    emptyMsg: "No specs."
  })));
}

// ─── Manufacturer profile ─────────────────────────────────────
function ManufProfile() {
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Profile']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Distillery profile",
    sub: "Public-facing profile seen by brand operators and distributors."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 18,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "Yamato Distillery"), [['Location', 'Yamanashi Prefecture, Japan'], ['Founded', '1964'], ['Capacity', '12,000 bottles / month'], ['Lead time', '21 days'], ['Primary contact', 'Yui Imanishi · yui@yamato.jp'], ['Certifications', 'IFS Food · FSSC 22000']].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, v)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 18,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "This month"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Cases produced",
    value: "640",
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "On-time delivery",
    value: "97%",
    trend: 1.2,
    tone: "green"
  })))));
}
Object.assign(window, {
  ManufDashboard,
  ManufPOsIn,
  ManufSpecs,
  ManufProfile
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/pages-manuf.jsx", error: String((e && e.message) || e) }); }

// app/pages-modules.jsx
try { (() => {
// app/pages-modules.jsx — Finance AR/AP, Incentive Manager, Product Development

// ─── Finance AR/AP ────────────────────────────────────────────
function FinanceARPage() {
  const [tab, setTab] = React.useState('ar');
  const [showCreateInv, setShowCreateInv] = React.useState(false);
  const [payFilter, setPayFilter] = React.useState('all');
  const AR_DATA = [{
    id: 'INV-2604-001',
    account: 'The Drake Hotel',
    amount: 4800,
    due: '2026-05-11',
    issued: '2026-04-11',
    status: 'pending',
    daysLeft: 11,
    paymentMethod: 'net30'
  }, {
    id: 'INV-2604-002',
    account: 'Kioi Sakaba',
    amount: 7728,
    due: '2026-05-13',
    issued: '2026-04-13',
    status: 'pending',
    daysLeft: 13,
    paymentMethod: 'net30'
  }, {
    id: 'INV-2604-003',
    account: 'Bar Hemingway',
    amount: 2544,
    due: '2026-04-07',
    issued: '2026-04-02',
    status: 'paid',
    daysLeft: 0,
    paymentMethod: 'stripe',
    paidDate: '2026-04-09'
  }, {
    id: 'INV-2604-004',
    account: 'Bar Suntory',
    amount: 3200,
    due: '2026-03-15',
    issued: '2026-03-01',
    status: 'overdue',
    daysLeft: -45,
    paymentMethod: 'net30'
  }, {
    id: 'INV-2604-005',
    account: 'Dante',
    amount: 1056,
    due: '2026-05-25',
    issued: '2026-04-25',
    status: 'draft',
    daysLeft: 25,
    paymentMethod: 'net30'
  }, {
    id: 'INV-2604-006',
    account: 'Liquid Gold',
    amount: 624,
    due: '2026-05-27',
    issued: '2026-04-27',
    status: 'draft',
    daysLeft: 27,
    paymentMethod: 'stripe'
  }];
  const AP_DATA = [{
    id: 'AP-2604-001',
    vendor: 'Yamato Distillery',
    amount: 86400,
    due: '2026-05-04',
    issued: '2026-04-08',
    status: 'pending',
    type: 'Production PO'
  }, {
    id: 'AP-2604-002',
    vendor: 'First Press Co.',
    amount: 62400,
    due: '2026-04-22',
    issued: '2026-03-22',
    status: 'paid',
    type: 'Production PO',
    paidDate: '2026-04-20'
  }, {
    id: 'AP-2604-003',
    vendor: 'Air France Cargo',
    amount: 8200,
    due: '2026-05-02',
    issued: '2026-04-24',
    status: 'pending',
    type: 'Freight'
  }, {
    id: 'AP-2604-004',
    vendor: 'Kentoku Logistics',
    amount: 2400,
    due: '2026-04-30',
    issued: '2026-04-25',
    status: 'pending',
    type: 'Last mile'
  }];
  const filtered = tab === 'ar' ? payFilter === 'all' ? AR_DATA : AR_DATA.filter(r => r.status === payFilter) : AP_DATA;
  const arOutstanding = AR_DATA.filter(r => r.status !== 'paid' && r.status !== 'draft').reduce((a, r) => a + r.amount, 0);
  const arOverdue = AR_DATA.filter(r => r.status === 'overdue').reduce((a, r) => a + r.amount, 0);
  const arCollected = AR_DATA.filter(r => r.status === 'paid').reduce((a, r) => a + r.amount, 0);
  const apPending = AP_DATA.filter(r => r.status === 'pending').reduce((a, r) => a + r.amount, 0);
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Finance']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Finance",
    sub: "Accounts receivable, accounts payable, and payment tracking.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
      v: "outline",
      icon: IC.dl
    }, "Export"), /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus,
      onClick: () => setShowCreateInv(true)
    }, "New invoice"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "AR outstanding",
    value: `$${(arOutstanding / 1000).toFixed(1)}K`,
    sub: "3 invoices",
    icon: IC.receipt,
    tone: "warm"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Overdue",
    value: `$${(arOverdue / 1000).toFixed(1)}K`,
    sub: "45+ days past due",
    icon: IC.alert,
    tone: "warm"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Collected MTD",
    value: `$${(arCollected / 1000).toFixed(1)}K`,
    sub: "1 invoice paid",
    icon: IC.check,
    tone: "green",
    trend: 8
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "AP outstanding",
    value: `$${(apPending / 1000).toFixed(0)}K`,
    sub: "3 bills due",
    icon: IC.file,
    tone: "stone"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginBottom: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      id: 'ar',
      label: 'Receivable'
    }, {
      id: 'ap',
      label: 'Payable'
    }],
    active: tab,
    onChange: v => {
      setTab(v);
      setPayFilter('all');
    }
  }), tab === 'ar' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginLeft: 'auto'
    }
  }, ['all', 'pending', 'overdue', 'paid', 'draft'].map(f => /*#__PURE__*/React.createElement(Btn, {
    key: f,
    v: payFilter === f ? 'primary' : 'ghost',
    sz: "sm",
    onClick: () => setPayFilter(f)
  }, f.charAt(0).toUpperCase() + f.slice(1))))), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: tab === 'ar' ? [{
      key: 'id',
      label: 'Invoice',
      mono: true,
      bold: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: T.gold,
          fontFamily: T.mono,
          fontSize: 12
        }
      }, r.id)
    }, {
      key: 'account',
      label: 'Account',
      bold: true
    }, {
      key: 'amount',
      label: 'Amount',
      right: true,
      mono: true,
      render: r => `$${r.amount.toLocaleString()}`
    }, {
      key: 'issued',
      label: 'Issued',
      mono: true
    }, {
      key: 'due',
      label: 'Due',
      mono: true
    }, {
      key: 'daysLeft',
      label: 'Days',
      right: true,
      mono: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: r.daysLeft < 0 ? T.red : r.daysLeft < 7 ? T.amber : T.muted,
          fontWeight: r.daysLeft < 0 ? 700 : 400
        }
      }, r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d overdue` : r.status === 'paid' ? '—' : `${r.daysLeft}d`)
    }, {
      key: 'paymentMethod',
      label: 'Method',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: "confirmed",
        label: r.paymentMethod
      })
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: '_act',
      label: '',
      sortable: false,
      render: r => r.status === 'pending' || r.status === 'overdue' ? /*#__PURE__*/React.createElement(Btn, {
        v: "primary",
        sz: "xs"
      }, "Record payment") : r.status === 'draft' ? /*#__PURE__*/React.createElement(Btn, {
        v: "outline",
        sz: "xs"
      }, "Send") : null
    }] : [{
      key: 'id',
      label: 'Bill',
      mono: true,
      bold: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: T.gold,
          fontFamily: T.mono,
          fontSize: 12
        }
      }, r.id)
    }, {
      key: 'vendor',
      label: 'Vendor',
      bold: true
    }, {
      key: 'type',
      label: 'Type'
    }, {
      key: 'amount',
      label: 'Amount',
      right: true,
      mono: true,
      render: r => `$${r.amount.toLocaleString()}`
    }, {
      key: 'issued',
      label: 'Issued',
      mono: true
    }, {
      key: 'due',
      label: 'Due',
      mono: true
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: '_act',
      label: '',
      sortable: false,
      render: r => r.status === 'pending' ? /*#__PURE__*/React.createElement(Btn, {
        v: "primary",
        sz: "xs"
      }, "Pay") : /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: T.green,
          fontFamily: T.mono
        }
      }, r.paidDate)
    }],
    rows: filtered,
    emptyMsg: "No records."
  })), /*#__PURE__*/React.createElement(Modal, {
    open: showCreateInv,
    onClose: () => setShowCreateInv(false),
    title: "New invoice",
    width: 520
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Account"
  }, /*#__PURE__*/React.createElement(Select, {
    options: [{
      value: '',
      label: 'Select…'
    }, ...ACCOUNTS_DATA.map(a => ({
      value: a.id,
      label: a.name
    }))],
    value: "",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Amount ($)"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    placeholder: "0.00",
    mono: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Due date"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "date",
    mono: true
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Payment terms"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['net30', 'net15', 'on-receipt', 'stripe'],
    value: "net30",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Notes"
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 2,
    placeholder: "Reference order ID, PO number\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowCreateInv(false)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "soft",
    onClick: () => setShowCreateInv(false)
  }, "Save draft"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => setShowCreateInv(false)
  }, "Send invoice")))));
}

// IncentiveManager moved to app/pages-incentives.jsx
function ProductDevelopment() {
  const [showCreate, setShowCreate] = React.useState(false);
  const [selectedProd, setSelectedProd] = React.useState(null);
  const PIPELINE = [{
    id: 'PD-001',
    name: 'Hajime Koshu',
    type: 'Koshu',
    stage: 'concept',
    target: '2027 Q1',
    mkt: 'JP/US',
    notes: 'Aged 3yr — HQ + Kioi interest.',
    progress: 15
  }, {
    id: 'PD-002',
    name: 'Yuzu Sparkling',
    type: 'Sparkling',
    stage: 'sampling',
    target: '2026 Q3',
    mkt: 'SG/HK',
    notes: 'Proto batch at Yamato. Positive reception at trade show.',
    progress: 45
  }, {
    id: 'PD-003',
    name: 'Florin Peaks 500ml',
    type: 'Junmai D',
    stage: 'approved',
    target: '2026 Q2',
    mkt: 'All',
    notes: 'Smaller format for on-premise. Label design in progress.',
    progress: 80
  }, {
    id: 'PD-004',
    name: 'Junmai Noir',
    type: 'Junmai',
    stage: 'hold',
    target: 'TBD',
    mkt: 'EMEA',
    notes: 'Paused — cask sourcing issue. Review Jul.',
    progress: 30
  }, {
    id: 'PD-005',
    name: 'First Press Single Origin',
    type: 'Coffee Rhum',
    stage: 'concept',
    target: '2027 Q2',
    mkt: 'US/CA',
    notes: 'Farmer partnership pending.',
    progress: 10
  }];
  const stageC = {
    concept: 'hsl(30 10%55%)',
    sampling: T.blue,
    approved: T.green,
    hold: T.amber,
    launched: T.gold
  };
  const stageLabel = {
    concept: 'Concept',
    sampling: 'Sampling',
    approved: 'Approved',
    hold: 'On hold',
    launched: 'Launched'
  };
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Product development']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Product development",
    sub: "New SKU pipeline from concept through approval to launch.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus,
      onClick: () => setShowCreate(true)
    }, "New SKU request")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "In pipeline",
    value: PIPELINE.length,
    sub: "across all stages",
    icon: IC.factory,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Approved",
    value: PIPELINE.filter(p => p.stage === 'approved').length,
    sub: "ready for production",
    icon: IC.check,
    tone: "green"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Sampling",
    value: PIPELINE.filter(p => p.stage === 'sampling').length,
    sub: "prototype batches",
    icon: IC.box,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "On hold",
    value: PIPELINE.filter(p => p.stage === 'hold').length,
    sub: "paused",
    icon: IC.more,
    tone: "warm"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5,1fr)',
      gap: 12,
      marginBottom: 20
    }
  }, ['concept', 'sampling', 'approved', 'hold', 'launched'].map(stage => /*#__PURE__*/React.createElement("div", {
    key: stage,
    style: {
      background: T.surface,
      borderRadius: 12,
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      background: stageC[stage]
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, stageLabel[stage]), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 10,
      color: T.muted,
      marginLeft: 'auto'
    }
  }, PIPELINE.filter(p => p.stage === stage).length)), PIPELINE.filter(p => p.stage === stage).map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    onClick: () => setSelectedProd(p),
    style: {
      background: T.card,
      border: `1px solid ${T.borderQ}`,
      borderLeft: `3px solid ${stageC[stage]}`,
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 8,
      cursor: 'pointer'
    },
    onMouseEnter: e => e.currentTarget.style.boxShadow = '0 2px 8px hsl(24 10%10%/.08)',
    onMouseLeave: e => e.currentTarget.style.boxShadow = ''
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontFamily: T.mono,
      color: T.muted,
      marginBottom: 3
    }
  }, p.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 15,
      fontWeight: 600,
      marginBottom: 4
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      marginBottom: 8
    }
  }, p.type, " \xB7 ", p.mkt), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      borderRadius: 999,
      background: T.surface,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${p.progress}%`,
      height: '100%',
      background: stageC[stage]
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.muted,
      fontFamily: T.mono,
      marginTop: 4
    }
  }, p.progress, "% \xB7 Target ", p.target))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: `1px dashed ${T.border}`,
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 11,
      color: T.muted,
      textAlign: 'center'
    }
  }, "+ drop here")))), /*#__PURE__*/React.createElement(Drawer, {
    open: !!selectedProd,
    onClose: () => setSelectedProd(null),
    title: selectedProd?.name || ''
  }, selectedProd && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: "confirmed",
    label: selectedProd.type
  }), /*#__PURE__*/React.createElement(Badge, {
    status: selectedProd.stage === 'approved' ? 'active' : selectedProd.stage === 'hold' ? 'pending' : 'confirmed',
    label: stageLabel[selectedProd.stage]
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 999,
      background: T.surface,
      overflow: 'hidden',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${selectedProd.progress}%`,
      height: '100%',
      background: stageC[selectedProd.stage]
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, selectedProd.progress, "% complete \xB7 Target ", selectedProd.target)), [['SKU ID', selectedProd.id], ['Type', selectedProd.type], ['Target markets', selectedProd.mkt], ['Launch target', selectedProd.target]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, v))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 6
    }
  }, "Notes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      lineHeight: 1.6
    }
  }, selectedProd.notes)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 10
    }
  }, "Move stage"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, ['concept', 'sampling', 'approved', 'hold'].filter(s => s !== selectedProd.stage).map(s => /*#__PURE__*/React.createElement(Btn, {
    key: s,
    v: "outline",
    sz: "sm",
    onClick: () => setSelectedProd({
      ...selectedProd,
      stage: s
    })
  }, stageLabel[s])), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    sz: "sm",
    onClick: () => setSelectedProd({
      ...selectedProd,
      stage: 'launched'
    })
  }, "Launch"))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 16,
      borderTop: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 8
    }
  }, "Add comment"), /*#__PURE__*/React.createElement(Textarea, {
    rows: 3,
    placeholder: "Status update, feedback from accounts, production notes\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    sz: "sm"
  }, "Save"))))), /*#__PURE__*/React.createElement(Modal, {
    open: showCreate,
    onClose: () => setShowCreate(false),
    title: "New SKU request",
    width: 520
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Product name"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "e.g. Hajime Koshu Reserve"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Category"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['Junmai', 'Junmai Daiginjo', 'Nigori', 'Koshu', 'Sparkling', 'Coffee Rhum'],
    value: "Junmai",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Format"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['300ml', '500ml', '720ml', '750ml', '1800ml'],
    value: "720ml",
    onChange: () => {}
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Target markets"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "e.g. Japan, US, Canada"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Launch target"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['2026 Q2', '2026 Q3', '2026 Q4', '2027 Q1', '2027 Q2'],
    value: "2026 Q3",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Brief"
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 3,
    placeholder: "What's the brief? Account feedback, market gap, production concept\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowCreate(false)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => setShowCreate(false)
  }, "Submit request")))));
}
Object.assign(window, {
  FinanceARPage,
  IncentiveManager,
  ProductDevelopment
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/pages-modules.jsx", error: String((e && e.message) || e) }); }

// app/pages-polish.jsx
try { (() => {
// app/pages-polish.jsx — Polished detail views + multi-step forms

// ─── Account Detail (CRM card) ────────────────────────────────
function AccountDetail() {
  const {
    parts,
    navigate,
    role
  } = useRouter();
  const {
    accounts,
    orders,
    visits
  } = useStore();
  const accountId = parts[2];
  const acct = accounts.find(a => a.id === accountId) || accounts[0];
  const acctOrders = orders.filter(o => o.account === acct?.id);
  const acctVisits = visits.filter(v => v.account === acct?.id);
  const [tab, setTab] = React.useState('overview');
  if (!acct) return /*#__PURE__*/React.createElement(AppShell, null, /*#__PURE__*/React.createElement(EmptyState, {
    title: "Account not found",
    sub: accountId
  }));
  const tierC = {
    flagship: 'gold',
    key: 'green',
    standard: 'stone'
  };
  const rev = acctOrders.filter(o => o.status !== 'cancelled').reduce((a, o) => a + o.total, 0);
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Accounts', acct.name]
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 24,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 14,
      background: T.surface,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: T.display,
      fontSize: 28,
      fontWeight: 600,
      color: T.muted,
      border: `1px solid ${T.border}`
    }
  }, acct.name.charAt(0)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: T.display,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, acct.name), /*#__PURE__*/React.createElement(Badge, {
    status: acct.status
  }), /*#__PURE__*/React.createElement(Badge, {
    status: acct.tier === 'flagship' ? 'active' : acct.tier === 'key' ? 'approved' : 'confirmed',
    label: acct.tier,
    custom: tierC[acct.tier]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.muted
    }
  }, acct.type, " \xB7 ", acct.city, ", ", acct.country, " \xB7 Rep: ", acct.rep))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    icon: IC.note
  }, "Log visit"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    icon: IC.cart,
    onClick: () => navigate(`/${role}/orders`)
  }, "New order"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Total revenue",
    value: `$${rev.toLocaleString()}`,
    sub: "all time",
    icon: IC.receipt,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "30d revenue",
    value: `$${acct.rev30.toLocaleString()}`,
    sub: "vs prev period",
    icon: IC.trendU,
    tone: "stone",
    trend: 8
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Active listings",
    value: acct.listings,
    sub: "SKUs on menu",
    icon: IC.box,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Orders placed",
    value: acctOrders.length,
    sub: "all time",
    icon: IC.cart,
    tone: "stone"
  })), /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      id: 'overview',
      label: 'Overview'
    }, {
      id: 'orders',
      label: `Orders · ${acctOrders.length}`
    }, {
      id: 'visits',
      label: `Visits · ${acctVisits.length}`
    }, {
      id: 'listings',
      label: 'Listings'
    }, {
      id: 'notes',
      label: 'Notes'
    }],
    active: tab,
    onChange: setTab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, tab === 'overview' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Account details"), [['Trading name', acct.name], ['Type', acct.type], ['City', acct.city], ['Country', acct.country], ['Status', acct.status], ['Tier', acct.tier], ['Assigned rep', acct.rep], ['Last order', acct.lastOrder || '—']].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '9px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      textTransform: 'capitalize'
    }
  }, v)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Recent activity"), acctOrders.slice(0, 3).map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      color: T.muted
    }
  }, o.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, "$", o.total.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, o.orderDate)), /*#__PURE__*/React.createElement(Badge, {
    status: o.status
  }))), acctOrders.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted
    }
  }, "No orders yet."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Revenue trend"), /*#__PURE__*/React.createElement(SparkBar, {
    data: [280, 310, 420, 380, 510, 490, 620, 580, 710, 750, 820, acct.rev30],
    color: T.gold,
    height: 80
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 9,
      fontFamily: T.mono,
      color: T.muted,
      marginTop: 6
    }
  }, ['M', 'J', 'J', 'A', 'S', 'O', 'N', 'D', 'J', 'F', 'M', 'A'].map((m, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, m)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 12
    }
  }, "Current listings"), PRODUCTS_DATA.slice(0, acct.listings || 2).map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 0',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 6,
      background: T.surface,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: T.muted
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.box,
    size: 14
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontFamily: T.mono
    }
  }, p.id)), /*#__PURE__*/React.createElement(Badge, {
    status: "active",
    label: "listed"
  })))), acctVisits.length > 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 12
    }
  }, "Latest visit"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.ink,
      lineHeight: 1.6
    }
  }, acctVisits[0].summary), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontFamily: T.mono,
      marginTop: 8
    }
  }, acctVisits[0].date)))), tab === 'orders' && /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'Order',
      mono: true,
      bold: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: T.gold,
          fontFamily: T.mono,
          fontSize: 12
        }
      }, r.id)
    }, {
      key: 'orderDate',
      label: 'Date',
      mono: true
    }, {
      key: 'requestedDelivery',
      label: 'Requested',
      mono: true
    }, {
      key: 'total',
      label: 'Total',
      right: true,
      mono: true,
      render: r => `$${r.total.toLocaleString()}`
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }],
    rows: acctOrders,
    emptyMsg: "No orders for this account.",
    onRow: r => navigate(`/${role}/orders/${r.id}`)
  })), tab === 'visits' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, acctVisits.length === 0 ? /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.note,
    title: "No visits logged",
    sub: "Log a visit note after your next call."
  })) : acctVisits.map(v => /*#__PURE__*/React.createElement(Card, {
    key: v.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontFamily: T.mono,
      color: T.muted
    }
  }, v.date), /*#__PURE__*/React.createElement(Badge, {
    status: v.sentiment === 'positive' ? 'active' : v.sentiment === 'needs-follow-up' ? 'pending' : 'confirmed',
    label: v.sentiment.replace(/-/g, ' ')
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      lineHeight: 1.6,
      color: T.ink
    }
  }, v.summary), v.draftId && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: "pending",
    label: `Draft: ${v.draftId}`,
    size: "xs"
  }))))), tab === 'listings' && /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'SKU',
      mono: true,
      bold: true
    }, {
      key: 'name',
      label: 'Product'
    }, {
      key: 'type',
      label: 'Category'
    }, {
      key: 'size',
      label: 'Size'
    }, {
      key: 'price',
      label: 'Wholesale',
      right: true,
      mono: true,
      render: r => `$${r.price}`
    }, {
      key: 'msrp',
      label: 'MSRP',
      right: true,
      mono: true,
      render: r => `$${r.msrp}`
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }],
    rows: PRODUCTS_DATA.slice(0, acct.listings || 2),
    emptyMsg: "No listings."
  })), tab === 'notes' && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "Internal notes"), /*#__PURE__*/React.createElement(Textarea, {
    rows: 6,
    placeholder: `Internal notes for ${acct.name} — not visible to the account.`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "accent"
  }, "Save notes")))));
}

// ─── Multi-step New Order Form ────────────────────────────────
function NewOrderFlow() {
  const {
    accounts,
    createOrder
  } = useStore();
  const {
    navigate,
    role
  } = useStore ? useRouter() : {
    navigate: () => {},
    role: 'hq'
  };
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    account: '',
    accountName: '',
    market: 'New York',
    rep: 'MT',
    lines: [{
      sku: 'HJM-FP-750',
      qty: 12,
      price: 48
    }],
    requestedDelivery: '',
    notes: ''
  });
  const [errors, setErrors] = React.useState({});
  const set = (k, v) => {
    setForm(f => ({
      ...f,
      [k]: v
    }));
    setErrors(e => ({
      ...e,
      [k]: null
    }));
  };
  const validate0 = () => {
    const e = {};
    if (!form.account) e.account = 'Select an account';
    if (!form.market) e.market = 'Select a market';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validate1 = () => {
    const e = {};
    if (form.lines.length === 0) e.lines = 'Add at least one line';
    form.lines.forEach((l, i) => {
      if (!l.qty || l.qty <= 0) e[`line_qty_${i}`] = 'Enter a quantity';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validate2 = () => {
    const e = {};
    if (!form.requestedDelivery) e.requestedDelivery = 'Select a requested delivery date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const next = () => {
    if (step === 0 && !validate0()) return;
    if (step === 1 && !validate1()) return;
    if (step === 2 && !validate2()) return;
    if (step === 3) {
      submitOrder();
      return;
    }
    setStep(s => s + 1);
  };
  const submitOrder = () => {
    const total = form.lines.reduce((a, l) => a + l.qty * l.price, 0);
    createOrder({
      ...form,
      total
    });
    navigate(`/${role}/orders`);
  };
  const steps = ['Account', 'Products', 'Delivery', 'Review'];
  const StepDot = ({
    i
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: step === i ? T.gold : step > i ? T.green : T.surface,
      color: step >= i ? 'white' : T.muted,
      fontWeight: 600,
      fontSize: 12
    }
  }, step > i ? /*#__PURE__*/React.createElement(Ico, {
    d: IC.check,
    size: 13,
    stroke: 2.5
  }) : i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: step === i ? T.ink : T.muted,
      fontWeight: step === i ? 600 : 400
    }
  }, steps[i]));
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Orders', 'New order']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "New wholesale order",
    sub: "Place an order on behalf of an account against distributor stock."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      marginBottom: 32,
      maxWidth: 480
    }
  }, steps.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: s
  }, /*#__PURE__*/React.createElement(StepDot, {
    i: i
  }), i < steps.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 2,
      background: step > i ? T.green : T.border,
      marginBottom: 18,
      marginTop: 1
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 680
    }
  }, step === 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 20,
      fontWeight: 500,
      marginBottom: 20
    }
  }, "Which account is this for?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Account",
    hint: errors.account,
    style: {
      borderBottom: errors.account ? `1px solid ${T.red}` : undefined
    }
  }, /*#__PURE__*/React.createElement(Select, {
    value: form.account,
    onChange: e => {
      const a = accounts.find(x => x.id === e.target.value);
      set('account', e.target.value);
      set('accountName', a?.name || '');
      set('market', a?.city?.includes('Toronto') ? 'Toronto' : a?.city?.includes('Paris') ? 'Paris' : 'New York');
    },
    options: [{
      value: '',
      label: 'Select account…'
    }, ...accounts.map(a => ({
      value: a.id,
      label: `${a.name} · ${a.city}`
    }))]
  }), errors.account && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.red,
      marginTop: 4
    }
  }, errors.account)), /*#__PURE__*/React.createElement(Field, {
    label: "Market",
    hint: errors.market
  }, /*#__PURE__*/React.createElement(Select, {
    value: form.market,
    onChange: e => set('market', e.target.value),
    options: ['New York', 'Toronto', 'Paris', 'Milan', 'Tokyo', 'Singapore', 'Hong Kong']
  }), errors.market && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.red,
      marginTop: 4
    }
  }, errors.market)), form.account && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      background: 'hsl(40 88%42%/.06)',
      border: `1px solid hsl(40 88%42%/.2)`,
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: T.gold,
      marginBottom: 6
    }
  }, "Account snapshot"), (() => {
    const a = accounts.find(x => x.id === form.account);
    return a ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: T.ink,
        lineHeight: 1.7
      }
    }, a.type, " \xB7 ", a.city, " \xB7 ", /*#__PURE__*/React.createElement(Badge, {
      status: a.status
    }), " \xB7 ", a.rev30 ? `$${a.rev30.toLocaleString()} 30d revenue` : 'No recent orders') : null;
  })()))), step === 1 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 20,
      fontWeight: 500,
      marginBottom: 20
    }
  }, "What are you ordering?"), errors.lines && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.red,
      marginBottom: 12,
      padding: '8px 12px',
      background: 'hsl(0 68%48%/.06)',
      borderRadius: 8
    }
  }, errors.lines), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, form.lines.map((l, i) => {
    const prod = PRODUCTS_DATA.find(p => p.id === l.sku);
    const lineTotal = l.qty * l.price;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        padding: 14,
        background: T.surface,
        borderRadius: 10,
        border: `1px solid ${errors[`line_qty_${i}`] ? T.red : T.borderQ}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 100px 100px 32px',
        gap: 10,
        alignItems: 'flex-end'
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Product"
    }, /*#__PURE__*/React.createElement(Select, {
      value: l.sku,
      onChange: e => {
        const p = PRODUCTS_DATA.find(x => x.id === e.target.value);
        setForm(f => ({
          ...f,
          lines: f.lines.map((x, j) => j === i ? {
            ...x,
            sku: e.target.value,
            price: p?.price || x.price
          } : x)
        }));
      },
      options: PRODUCTS_DATA.map(p => ({
        value: p.id,
        label: p.name
      }))
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Qty (bottles)"
    }, /*#__PURE__*/React.createElement(Input, {
      value: l.qty,
      type: "number",
      mono: true,
      onChange: e => setForm(f => ({
        ...f,
        lines: f.lines.map((x, j) => j === i ? {
          ...x,
          qty: +e.target.value
        } : x)
      }))
    }), errors[`line_qty_${i}`] && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: T.red,
        marginTop: 2
      }
    }, errors[`line_qty_${i}`])), /*#__PURE__*/React.createElement(Field, {
      label: "Unit price"
    }, /*#__PURE__*/React.createElement(Input, {
      value: l.price,
      type: "number",
      mono: true,
      onChange: e => setForm(f => ({
        ...f,
        lines: f.lines.map((x, j) => j === i ? {
          ...x,
          price: +e.target.value
        } : x)
      }))
    })), /*#__PURE__*/React.createElement(Btn, {
      v: "ghost",
      sz: "sm",
      onClick: () => setForm(f => ({
        ...f,
        lines: f.lines.filter((_, j) => j !== i)
      })),
      style: {
        marginBottom: 2
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: IC.x,
      size: 14
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 8,
        fontSize: 12,
        color: T.muted
      }
    }, /*#__PURE__*/React.createElement("span", null, prod?.type, " \xB7 ", prod?.size, " \xB7 case of ", prod?.cs), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.mono,
        fontWeight: 600,
        color: T.ink
      }
    }, "$", lineTotal.toLocaleString())));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "soft",
    sz: "sm",
    icon: IC.plus,
    onClick: () => setForm(f => ({
      ...f,
      lines: [...f.lines, {
        sku: 'HJM-FP-750',
        qty: 12,
        price: 48
      }]
    }))
  }, "Add line"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 15,
      fontWeight: 700
    }
  }, "Total: $", form.lines.reduce((a, l) => a + l.qty * l.price, 0).toLocaleString()))), step === 2 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 20,
      fontWeight: 500,
      marginBottom: 20
    }
  }, "When and how should this deliver?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Requested delivery date"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "date",
    value: form.requestedDelivery,
    onChange: e => set('requestedDelivery', e.target.value),
    mono: true
  }), errors.requestedDelivery && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.red,
      marginTop: 4
    }
  }, errors.requestedDelivery)), /*#__PURE__*/React.createElement(Field, {
    label: "Fulfilment source"
  }, /*#__PURE__*/React.createElement(Select, {
    value: "Empire Wines, Brooklyn",
    onChange: () => {},
    options: ['Empire Wines, Brooklyn', 'Vinexpo Paris', 'Tokyo HQ']
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Internal notes (optional)"
  }, /*#__PURE__*/React.createElement(Textarea, {
    value: form.notes,
    onChange: e => set('notes', e.target.value),
    placeholder: "Special instructions, partial allocation notes, etc.",
    rows: 3
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      background: T.surface,
      borderRadius: 10,
      fontSize: 13,
      color: T.muted,
      lineHeight: 1.6
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.ink
    }
  }, "Stock check"), " \xB7 Empire Wines has 142 cases of FP-750 available. Your order will draw cleanly against current stock."))), step === 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 20,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "Review before sending"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 8
    }
  }, "Account"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, form.accountName), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted
    }
  }, form.market)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 8
    }
  }, "Delivery"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, form.requestedDelivery || '—'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted
    }
  }, "Empire Wines, Brooklyn"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      paddingTop: 16,
      borderTop: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 12
    }
  }, "Order lines"), form.lines.map((l, i) => {
    const p = PRODUCTS_DATA.find(x => x.id === l.sku);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 14,
        padding: '8px 0',
        borderBottom: `1px solid ${T.borderQ}`
      }
    }, /*#__PURE__*/React.createElement("span", null, p?.name || l.sku, " \xB7 ", l.qty, " bottles"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.mono,
        fontWeight: 600
      }
    }, "$", (l.qty * l.price).toLocaleString()));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      fontSize: 16,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", null, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono
    }
  }, "$", form.lines.reduce((a, l) => a + l.qty * l.price, 0).toLocaleString())))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      background: 'hsl(40 88%42%/.06)',
      border: `1px solid hsl(40 88%42%/.2)`,
      borderRadius: 10,
      fontSize: 13,
      lineHeight: 1.55
    }
  }, "This will create a draft order and route it to the HQ approval queue. The account will not be notified until approval.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => step > 0 ? setStep(s => s - 1) : navigate(`/${role}/orders`),
    icon: IC.chevL
  }, step === 0 ? 'Cancel' : 'Back'), /*#__PURE__*/React.createElement(Btn, {
    v: step === 3 ? 'accent' : 'primary',
    onClick: next,
    iconR: step < 3 ? IC.chevR : IC.check
  }, step === 3 ? 'Submit draft' : 'Continue'))));
}

// ─── Inventory Item Detail ────────────────────────────────────
function InventoryDetail() {
  const {
    parts,
    navigate
  } = useRouter();
  const {
    inventory
  } = useStore();
  const invId = parts[2];
  const item = inventory.find(i => i.id === invId) || inventory[0];
  const prod = PRODUCTS_DATA.find(p => p.id === item?.sku);
  if (!item) return /*#__PURE__*/React.createElement(AppShell, null, /*#__PURE__*/React.createElement(EmptyState, {
    title: "Inventory item not found"
  }));
  const movements = [{
    type: 'out',
    desc: `Fulfillment · Dante`,
    qty: 216,
    date: '2026-04-27'
  }, {
    type: 'out',
    desc: `Fulfillment · Katana Kitten`,
    qty: 72,
    date: '2026-04-27'
  }, {
    type: 'adj',
    desc: `Sample · staff tasting`,
    qty: 24,
    date: '2026-04-27'
  }, {
    type: 'in',
    desc: `Received from PO-2026-0415`,
    qty: 2880,
    date: '2026-04-27'
  }, {
    type: 'out',
    desc: `Fulfillment · Mace`,
    qty: 48,
    date: '2026-04-26'
  }];
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Inventory', item.sku]
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 24,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 13,
      color: T.muted
    }
  }, item.id), /*#__PURE__*/React.createElement(Badge, {
    status: item.status
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: T.display,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, prod?.name || item.sku), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.muted,
      marginTop: 4
    }
  }, item.location, " \xB7 ", item.locType, " \xB7 Batch ", item.batchId)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    icon: IC.plus
  }, "Receive stock"), /*#__PURE__*/React.createElement(Btn, {
    v: "primary",
    icon: IC.tag
  }, "Adjust inventory"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Bottles on hand",
    value: item.bottles.toLocaleString(),
    icon: IC.box,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Reserved",
    value: item.reserved.toLocaleString(),
    icon: IC.tag,
    tone: "warm"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Available",
    value: (item.bottles - item.reserved).toLocaleString(),
    icon: IC.check,
    tone: "green"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Cases",
    value: Math.floor(item.bottles / (prod?.cs || 12)),
    sub: `of ${prod?.cs || 12} bottles`,
    icon: IC.box,
    tone: "stone"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Movement history"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, "Last 30 days")), movements.map((m, i) => {
    const c = m.type === 'in' ? T.green : m.type === 'out' ? T.ink : T.amber;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'grid',
        gridTemplateColumns: '60px auto 1fr auto',
        gap: 12,
        padding: '12px 18px',
        borderBottom: `1px solid ${T.borderQ}`,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.mono,
        fontSize: 11,
        color: T.muted
      }
    }, m.date.slice(5)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontFamily: T.mono,
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 4,
        background: m.type === 'in' ? 'hsl(158 56%36%/.1)' : m.type === 'out' ? 'hsl(24 10%10%/.08)' : 'hsl(38 90%50%/.12)',
        color: c,
        letterSpacing: '.04em'
      }
    }, m.type.toUpperCase()), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: T.ink
      }
    }, m.desc), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.display,
        fontSize: 18,
        fontWeight: 600,
        color: c
      }
    }, m.type === 'in' ? '+' : '-', m.qty));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Batch details"), [['Batch ID', item.batchId], ['Lot number', item.lotNo], ['SKU', item.sku], ['Location', item.location], ['Type', item.locType]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 12,
      fontWeight: 500
    }
  }, v)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 12
    }
  }, "Stock health"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, "vs safety stock"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontWeight: 600
    }
  }, prod?.safetyStock || 0, " btl min")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 999,
      background: T.surface,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${Math.min(item.bottles / (prod?.safetyStock || 1) * 100, 100)}%`,
      height: '100%',
      background: item.bottles < (prod?.safetyStock || 0) ? T.red : item.bottles < (prod?.safetyStock || 0) * 1.5 ? T.amber : T.green
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, item.bottles >= (prod?.safetyStock || 0) * 1.5 ? 'Well above safety stock · no action needed' : item.bottles >= (prod?.safetyStock || 0) ? 'Above safety stock · watch velocity' : 'Below safety stock · replenishment needed')))));
}

// ─── PO Detail ────────────────────────────────────────────────
function PODetail() {
  const {
    parts
  } = useRouter();
  const {
    pos,
    approvePO
  } = useStore();
  const poId = parts[2];
  const po = pos.find(p => p.id === poId) || pos[0];
  const prod = PRODUCTS_DATA.find(p => p.id === po?.sku);
  if (!po) return /*#__PURE__*/React.createElement(AppShell, null, /*#__PURE__*/React.createElement(EmptyState, {
    title: "PO not found"
  }));
  const timeline = [{
    s: 'Requested',
    t: po.requested,
    done: true
  }, {
    s: 'Approved by HQ',
    t: po.status !== 'pending' ? po.requested : '—',
    done: po.status !== 'pending'
  }, {
    s: 'Acknowledged by manufacturer',
    t: po.status === 'in-production' || po.status === 'shipped' || po.status === 'delivered' ? po.requested : '—',
    done: ['in-production', 'shipped', 'delivered'].includes(po.status)
  }, {
    s: 'In production',
    t: po.status === 'in-production' ? 'In progress' : po.status === 'shipped' || po.status === 'delivered' ? po.shipDate : '—',
    done: ['shipped', 'delivered'].includes(po.status),
    current: po.status === 'in-production'
  }, {
    s: 'Shipped',
    t: po.shipDate || '—',
    done: po.status === 'delivered',
    current: po.status === 'shipped'
  }, {
    s: 'Delivered',
    t: po.status === 'delivered' ? po.shipDate : '—',
    done: po.status === 'delivered'
  }];
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Production requests', po.id]
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 24,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 13,
      color: T.muted
    }
  }, po.id), /*#__PURE__*/React.createElement(Badge, {
    status: po.status
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: T.display,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, prod?.name || po.sku), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.muted,
      marginTop: 4
    }
  }, po.qty.toLocaleString(), " bottles \xB7 ", po.region, " \xB7 ", po.mfr)), po.status === 'pending' && /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    icon: IC.check,
    onClick: () => approvePO(po.id)
  }, "Approve PO")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Quantity",
    value: po.qty.toLocaleString(),
    sub: "bottles",
    icon: IC.box,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Cases",
    value: Math.floor(po.qty / (prod?.cs || 12)),
    sub: `of ${prod?.cs || 12} btl`,
    icon: IC.box,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Est. value",
    value: `$${(po.qty * (prod?.price || 0)).toLocaleString()}`,
    sub: "at wholesale",
    icon: IC.receipt,
    tone: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Lead time",
    value: `${po.days}d`,
    sub: "standard",
    icon: IC.clock || IC.more,
    tone: "stone"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 20
    }
  }, "Production timeline"), timeline.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t.s,
    style: {
      display: 'grid',
      gridTemplateColumns: '28px 1fr auto',
      gap: 14,
      marginBottom: i < timeline.length - 1 ? 24 : 0,
      alignItems: 'flex-start',
      position: 'relative'
    }
  }, i < timeline.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 13,
      top: 28,
      bottom: -24,
      width: 2,
      background: t.done ? T.green : T.border
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: t.done ? T.green : t.current ? T.gold : T.surface,
      color: t.done || t.current ? 'white' : T.muted,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1
    }
  }, t.done ? /*#__PURE__*/React.createElement(Ico, {
    d: IC.check,
    size: 13,
    stroke: 2.5
  }) : t.current ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: 'white'
    }
  }) : i + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: t.done || t.current ? 600 : 400,
      color: t.done || t.current ? T.ink : T.muted
    }
  }, t.s), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontFamily: T.mono,
      marginTop: 2
    }
  }, t.t)), t.current && /*#__PURE__*/React.createElement(Badge, {
    status: "pending",
    label: "in progress"
  }), t.done && /*#__PURE__*/React.createElement(Ico, {
    d: IC.check,
    size: 14,
    style: {
      color: T.green,
      marginTop: 4
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Order details"), [['PO ID', po.id], ['SKU', po.sku], ['Manufacturer', po.mfr], ['Destination', po.region], ['Requested', po.requested], ['Target ship', po.shipDate || '—'], ['Status', po.status]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: ['PO ID', 'SKU'].includes(l) ? T.mono : T.body,
      fontSize: 12,
      fontWeight: 500
    }
  }, v)))), po.status === 'in-production' && po.progress && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 12
    }
  }, "Production progress"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 999,
      background: T.surface,
      overflow: 'hidden',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${po.progress}%`,
      height: '100%',
      background: T.gold,
      transition: 'width .5s'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      color: T.muted
    }
  }, /*#__PURE__*/React.createElement("span", null, po.progress, "% complete"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono
    }
  }, Math.round(po.qty * po.progress / 100).toLocaleString(), " / ", po.qty.toLocaleString(), " btl"))))));
}

// ─── Settings: RBAC Editor ────────────────────────────────────
function SettingsRBAC() {
  const [activeTab, setActiveTab] = React.useState('team');
  const [showInvite, setShowInvite] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('sales_rep');
  const [inviteErr, setInviteErr] = React.useState('');
  const validateInvite = () => {
    if (!inviteEmail.includes('@')) {
      setInviteErr('Enter a valid email');
      return false;
    }
    setInviteErr('');
    return true;
  };
  const TEAM = [{
    id: 'u1',
    name: 'Sora Okuda',
    email: 'sora@hajime.jp',
    role: 'brand_operator',
    markets: ['All'],
    lastLogin: '2026-04-27',
    status: 'active'
  }, {
    id: 'u2',
    name: 'Yui Imanishi',
    email: 'yui@yamato.jp',
    role: 'manufacturer',
    markets: ['—'],
    lastLogin: '2026-04-26',
    status: 'active'
  }, {
    id: 'u3',
    name: 'Léa Bardot',
    email: 'lea@vinexpo.fr',
    role: 'distributor',
    markets: ['Paris'],
    lastLogin: '2026-04-27',
    status: 'active'
  }, {
    id: 'u4',
    name: 'Mike Tan',
    email: 'mike@hajime.jp',
    role: 'sales_rep',
    markets: ['New York'],
    lastLogin: '2026-04-27',
    status: 'active'
  }, {
    id: 'u5',
    name: 'Kazu Saito',
    email: 'kazu@mace.bar',
    role: 'retail',
    markets: ['New York'],
    lastLogin: '2026-04-25',
    status: 'active'
  }, {
    id: 'u6',
    name: 'Elena Murphy',
    email: 'elena@hajime.jp',
    role: 'sales_rep',
    markets: ['Toronto'],
    lastLogin: '2026-04-20',
    status: 'active'
  }];
  const PERMS = {
    brand_operator: ['dashboard', 'inventory', 'orders', 'accounts', 'purchase-orders', 'shipments', 'markets', 'reports', 'alerts', 'finance', 'settings'],
    manufacturer: ['production', 'po-in', 'ship-out', 'specs'],
    distributor: ['floor', 'inbound', 'inventory', 'depletion', 'sell-through', 'alerts'],
    sales_rep: ['dashboard', 'accounts', 'inventory-check', 'drafts', 'visits', 'targets'],
    retail: ['home', 'catalog', 'orders', 'shipments', 'account']
  };
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Settings']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Settings",
    sub: "Team management, roles, and module access.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus,
      onClick: () => setShowInvite(true)
    }, "Invite user")
  }), /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      id: 'team',
      label: 'Team'
    }, {
      id: 'rbac',
      label: 'Roles & permissions'
    }, {
      id: 'products',
      label: 'Products'
    }, {
      id: 'warehouses',
      label: 'Warehouses'
    }, {
      id: 'system',
      label: 'System'
    }],
    active: activeTab,
    onChange: setActiveTab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, activeTab === 'team' && /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'name',
      label: 'Name',
      bold: true,
      render: r => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: T.surface,
          color: T.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 12
        }
      }, r.name.split(' ').map(n => n[0]).join('')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 500
        }
      }, r.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: T.muted,
          fontFamily: T.mono
        }
      }, r.email)))
    }, {
      key: 'role',
      label: 'Role',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: "confirmed",
        label: r.role.replace(/_/g, ' ')
      })
    }, {
      key: 'markets',
      label: 'Markets',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13
        }
      }, r.markets.join(', '))
    }, {
      key: 'lastLogin',
      label: 'Last login',
      mono: true
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: '_act',
      label: '',
      sortable: false,
      render: r => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 4
        }
      }, /*#__PURE__*/React.createElement(Btn, {
        v: "ghost",
        sz: "xs"
      }, "Edit"), /*#__PURE__*/React.createElement(Btn, {
        v: "ghost",
        sz: "xs"
      }, "Revoke"))
    }],
    rows: TEAM,
    emptyMsg: "No team members."
  })), activeTab === 'rbac' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, Object.entries(PERMS).map(([role, perms]) => /*#__PURE__*/React.createElement(Card, {
    key: role
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      textTransform: 'capitalize'
    }
  }, role.replace(/_/g, ' ')), /*#__PURE__*/React.createElement(Badge, {
    status: "confirmed",
    label: `${perms.length} modules`
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, perms.map(p => /*#__PURE__*/React.createElement("div", {
    key: p,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      background: T.surface,
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: T.green
    }
  }), p)))))), activeTab === 'products' && /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'SKU',
      mono: true,
      bold: true
    }, {
      key: 'name',
      label: 'Product'
    }, {
      key: 'type',
      label: 'Category'
    }, {
      key: 'size',
      label: 'Size'
    }, {
      key: 'cs',
      label: 'Case',
      right: true,
      mono: true
    }, {
      key: 'price',
      label: 'Wholesale',
      right: true,
      mono: true,
      render: r => `$${r.price}`
    }, {
      key: 'msrp',
      label: 'MSRP',
      right: true,
      mono: true,
      render: r => `$${r.msrp}`
    }, {
      key: 'safetyStock',
      label: 'Safety stock',
      right: true,
      mono: true,
      render: r => r.safetyStock.toLocaleString()
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: '_act',
      label: '',
      sortable: false,
      render: () => /*#__PURE__*/React.createElement(Btn, {
        v: "ghost",
        sz: "xs"
      }, "Edit")
    }],
    rows: PRODUCTS_DATA
  })), (activeTab === 'warehouses' || activeTab === 'system') && /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.settings,
    title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`,
    sub: "Configuration coming in next release."
  })), /*#__PURE__*/React.createElement(Modal, {
    open: showInvite,
    onClose: () => {
      setShowInvite(false);
      setInviteErr('');
    },
    title: "Invite team member",
    width: 480
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Email address"
  }, /*#__PURE__*/React.createElement(Input, {
    value: inviteEmail,
    onChange: e => {
      setInviteEmail(e.target.value);
      setInviteErr('');
    },
    type: "email",
    placeholder: "name@company.com",
    style: {
      borderColor: inviteErr ? T.red : undefined
    }
  }), inviteErr && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.red,
      marginTop: 4
    }
  }, inviteErr)), /*#__PURE__*/React.createElement(Field, {
    label: "Role"
  }, /*#__PURE__*/React.createElement(Select, {
    value: inviteRole,
    onChange: e => setInviteRole(e.target.value),
    options: ['brand_operator', 'manufacturer', 'distributor', 'sales_rep', 'retail'].map(r => ({
      value: r,
      label: r.replace(/_/g, ' ')
    }))
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      background: T.surface,
      borderRadius: 8,
      fontSize: 12,
      color: T.muted,
      lineHeight: 1.5
    }
  }, "They'll receive an email with a one-time login link. Password must be set on first login."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowInvite(false)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => {
      if (validateInvite()) {
        setShowInvite(false);
        setInviteEmail('');
      }
    }
  }, "Send invite")))));
}
function Eyebrow({
  children,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      fontWeight: 500,
      color: T.muted,
      fontFamily: T.body,
      ...style
    }
  }, children);
}
Object.assign(window, {
  AccountDetail,
  NewOrderFlow,
  InventoryDetail,
  PODetail,
  SettingsRBAC,
  Eyebrow
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/pages-polish.jsx", error: String((e && e.message) || e) }); }

// app/pages-rep.jsx
try { (() => {
// app/pages-rep.jsx — Sales Rep pages (P1: distributor inventory visibility)

// ─── Rep Dashboard ────────────────────────────────────────────
function RepDashboard() {
  const {
    orders,
    accounts,
    visits
  } = useStore();
  const myOrders = orders.filter(o => o.rep === 'MT');
  const myAccounts = accounts.filter(a => a.rep === 'MT');
  const drafts = myOrders.filter(o => o.status === 'draft' || o.status === 'pending');
  const target = 28000;
  const actual = 14820;
  const {
    navigate,
    role
  } = useRouter();
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Overview']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Good afternoon, Mike",
    eyebrow: "Sales Rep \xB7 NYC territory",
    sub: `${myAccounts.length} accounts · ${drafts.length} drafts pending approval · ${myAccounts.filter(a => a.status === 'active').length} active.`,
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
      v: "outline",
      icon: IC.note,
      onClick: () => navigate(`/${role}/visits`)
    }, "Log visit"), /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.cart,
      onClick: () => navigate(`/${role}/drafts`)
    }, "New draft"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Month target",
    value: `$${(target / 1000).toFixed(0)}K`,
    sub: `$${(actual / 1000).toFixed(1)}K actual · ${Math.round(actual / target * 100)}%`,
    tone: "gold",
    icon: IC.target
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Drafts awaiting",
    value: drafts.length,
    sub: "HQ approval queue",
    icon: IC.cart,
    tone: drafts.length > 3 ? 'warm' : 'stone'
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Active accounts",
    value: myAccounts.filter(a => a.status === 'active').length,
    sub: `${myAccounts.length} total`,
    icon: IC.users,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Visits this week",
    value: visits.filter(v => v.rep === 'MT').length,
    sub: "notes captured",
    icon: IC.note,
    tone: "stone"
  })), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500
    }
  }, "April target"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 14,
      fontWeight: 600
    }
  }, "$", actual.toLocaleString(), " / $", target.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 999,
      background: T.surface,
      overflow: 'hidden',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${Math.min(actual / target * 100, 100)}%`,
      height: '100%',
      background: T.gold,
      transition: 'width .5s'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, Math.round(actual / target * 100), "% \xB7 $", (target - actual).toLocaleString(), " to go \xB7 3 working days left")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(RepAccountList, {
    accounts: myAccounts
  }), /*#__PURE__*/React.createElement(RepDraftList, {
    orders: drafts
  })));
}
function RepAccountList({
  accounts
}) {
  const {
    navigate,
    role
  } = useRouter();
  const signalC = {
    active: T.green,
    prospect: T.gold,
    inactive: T.muted
  };
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "My accounts"), /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => navigate(`/${role}/accounts`)
  }, "All")), accounts.slice(0, 6).map(a => {
    const signal = a.rev30 > 3000 ? 'on cadence' : a.rev30 > 0 ? 'slipping' : 'prospect';
    const sigC = signal === 'on cadence' ? T.green : signal === 'slipping' ? T.amber : T.muted;
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      onClick: () => navigate(`/${role}/accounts/${a.id}`),
      style: {
        padding: '11px 18px',
        borderBottom: `1px solid ${T.borderQ}`,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 8,
        cursor: 'pointer'
      },
      onMouseEnter: e => e.currentTarget.style.background = T.surface,
      onMouseLeave: e => e.currentTarget.style.background = ''
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        marginBottom: 2
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: sigC
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500
      }
    }, a.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: T.muted
      }
    }, a.city, " \xB7 ", a.type, " \xB7 ", signal)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.mono,
        fontSize: 12,
        fontWeight: 500
      }
    }, a.rev30 ? `$${a.rev30.toLocaleString()}` : '—'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: T.muted
      }
    }, "30d")));
  }));
}
function RepDraftList({
  orders
}) {
  const {
    navigate,
    role
  } = useRouter();
  return /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Draft orders"), /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => navigate(`/${role}/drafts`)
  }, "All")), orders.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.cart,
    title: "No drafts",
    sub: "Create a draft from an account visit."
  }) : orders.map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    style: {
      padding: '11px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      marginBottom: 2
    }
  }, o.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, o.accountName), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, o.market, " \xB7 $", o.total.toLocaleString())), /*#__PURE__*/React.createElement(Badge, {
    status: o.status
  }))));
}

// ─── Rep Accounts ────────────────────────────────────────────
function RepAccounts() {
  const {
    accounts
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  const mine = accounts.filter(a => a.rep === 'MT');
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['My accounts']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "My accounts",
    sub: "Your 38 assigned accounts across New York.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus
    }, "Add account")
  }), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'name',
      label: 'Account',
      bold: true
    }, {
      key: 'type',
      label: 'Type'
    }, {
      key: 'city',
      label: 'City'
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: 'rev30',
      label: '30d Rev',
      right: true,
      mono: true,
      render: r => r.rev30 ? `$${r.rev30.toLocaleString()}` : '—'
    }, {
      key: 'listings',
      label: 'Listings',
      right: true,
      mono: true
    }, {
      key: 'lastOrder',
      label: 'Last order',
      mono: true,
      render: r => r.lastOrder || '—'
    }],
    rows: mine,
    onRow: r => navigate(`/${role}/accounts/${r.id}`),
    emptyMsg: "No accounts assigned."
  })));
}

// ─── P1: Rep Inventory (distributor stock check) ─────────────
function RepInventory() {
  const {
    inventory
  } = useStore();
  // Filter to distributor stock (the missing P1 feature — rep can now see this)
  const distStock = inventory.filter(i => i.locType === 'distributor');
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Stock check']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: /*#__PURE__*/React.createElement(React.Fragment, null, "Stock check ", /*#__PURE__*/React.createElement(Badge, {
      status: "active",
      label: "NEW \xB7 P1",
      size: "xs",
      dot: false,
      custom: "gold"
    })),
    eyebrow: "Distributor on-hand visibility",
    sub: "Check what's actually at Empire Wines before you promise. This view reads distributor stock in real time \u2014 updated with every fulfillment confirmation.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "ghost",
      sz: "sm",
      icon: IC.refresh
    }, "Refresh")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      marginBottom: 20,
      background: 'hsl(40 88%42%/.06)',
      border: `1px solid hsl(40 88%42%/.2)`,
      borderRadius: 12,
      fontSize: 13,
      lineHeight: 1.55,
      color: T.ink
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.gold
    }
  }, "How to use this"), " \u2014 Before committing product at an account visit, check here. If Empire has the stock, your draft will go through clean. If they're short, note the split in your draft comments \u2014 HQ will route from an alternate distributor."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18,
      marginBottom: 20
    }
  }, PRODUCTS_DATA.filter(p => p.status === 'active').map(prod => {
    const rows = distStock.filter(i => i.sku === prod.id);
    const total = rows.reduce((a, i) => a + (i.bottles - i.reserved), 0);
    const cases = Math.floor(total / prod.cs);
    const low = total < prod.safetyStock * 0.3;
    return /*#__PURE__*/React.createElement(Card, {
      key: prod.id,
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 14,
        alignItems: 'flex-start',
        borderLeft: `3px solid ${low ? T.amber : T.green}`
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.mono,
        fontSize: 11,
        color: T.muted,
        marginBottom: 3
      }
    }, prod.id), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.display,
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: '-.01em'
      }
    }, prod.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: T.muted,
        marginTop: 2
      }
    }, prod.type, " \xB7 ", prod.size, " \xB7 case of ", prod.cs), rows.map(r => /*#__PURE__*/React.createElement("div", {
      key: r.id,
      style: {
        marginTop: 8,
        fontSize: 12,
        color: T.muted
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500,
        color: T.ink
      }
    }, r.location), " \xB7 ", (r.bottles - r.reserved).toLocaleString(), " available")), low && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      status: "pending",
      label: "Running low",
      size: "xs"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.display,
        fontSize: 36,
        fontWeight: 600,
        letterSpacing: '-.02em',
        color: low ? T.amber : T.ink,
        lineHeight: 1
      }
    }, cases), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: T.muted,
        fontFamily: T.mono
      }
    }, "cases"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: T.muted,
        marginTop: 4
      }
    }, total.toLocaleString(), " btl")));
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Why this matters"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
      fontSize: 13,
      color: T.muted,
      lineHeight: 1.6
    }
  }, /*#__PURE__*/React.createElement("div", null, "Before this feature, a rep would promise 18 cases to Dante, HQ would approve, then the distributor would say \"we only have 6.\" The order gets split, the rep looks bad, and the customer is confused."), /*#__PURE__*/React.createElement("div", null, "Now you check here first. If Empire has 142 cases of FP-750 available, your 18-case draft will pull cleanly. If they have 6, you know to request a partial + forward fill in the draft."))));
}

// ─── Rep Drafts ───────────────────────────────────────────────
function RepDrafts() {
  const {
    orders,
    createOrder,
    approveOrder
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  const mine = orders.filter(o => o.rep === 'MT');
  const [showCreate, setShowCreate] = React.useState(false);
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Draft orders']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Draft orders",
    sub: "Your orders in every stage of the approval flow.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus,
      onClick: () => setShowCreate(true)
    }, "New draft")
  }), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'id',
      label: 'Order ID',
      mono: true,
      bold: true
    }, {
      key: 'accountName',
      label: 'Account'
    }, {
      key: 'market',
      label: 'Market'
    }, {
      key: 'orderDate',
      label: 'Date',
      mono: true
    }, {
      key: 'total',
      label: 'Total',
      right: true,
      mono: true,
      render: r => `$${r.total.toLocaleString()}`
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }
      }, /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      }), r.status === 'pending' && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: T.muted
        }
      }, "awaiting HQ"))
    }],
    rows: mine,
    onRow: r => navigate(`/${role}/orders/${r.id}`),
    emptyMsg: "No orders yet."
  })), /*#__PURE__*/React.createElement(Modal, {
    open: showCreate,
    onClose: () => setShowCreate(false),
    title: "New draft order",
    width: 560
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Account"
  }, /*#__PURE__*/React.createElement(Select, {
    options: [{
      value: '',
      label: 'Select account…'
    }, ...ACCOUNTS_DATA.filter(a => a.rep === 'MT').map(a => ({
      value: a.id,
      label: a.name
    }))],
    value: "",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "SKU"
  }, /*#__PURE__*/React.createElement(Select, {
    options: PRODUCTS_DATA.map(p => ({
      value: p.id,
      label: p.name
    })),
    value: "HJM-FP-750",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Cases"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    placeholder: "12",
    mono: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Visit note"
  }, /*#__PURE__*/React.createElement(Textarea, {
    placeholder: "What did you observe? Bartender feedback, backbar position, competitive SKUs\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowCreate(false)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => setShowCreate(false)
  }, "Save draft")))));
}

// ─── Rep Visit Notes ──────────────────────────────────────────
function RepVisits() {
  const {
    visits,
    addVisit
  } = useStore();
  const mine = visits.filter(v => v.rep === 'MT');
  const [showAdd, setShowAdd] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [acct, setAcct] = React.useState('ACC-001');
  const sentC = {
    positive: T.green,
    neutral: T.muted,
    'needs-follow-up': T.amber
  };
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Visit notes']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Visit notes",
    sub: "Every account visit captured, tagged, and searchable.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.mic || IC.note,
      onClick: () => setShowAdd(true)
    }, "Log visit")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, mine.map(v => /*#__PURE__*/React.createElement(Card, {
    key: v.id,
    style: {
      display: 'grid',
      gridTemplateColumns: '8px 1fr',
      gap: 16,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: sentC[v.sentiment] || T.muted,
      marginTop: 4
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'baseline',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, v.accountName), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: T.muted,
      fontFamily: T.mono
    }
  }, v.date), v.draftId && /*#__PURE__*/React.createElement(Badge, {
    status: "pending",
    label: `Draft: ${v.draftId}`,
    size: "xs"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.ink,
      lineHeight: 1.55
    }
  }, v.summary)))), mine.length === 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.note,
    title: "No visits logged",
    sub: "Log your first visit note after today's accounts."
  }))), /*#__PURE__*/React.createElement(Modal, {
    open: showAdd,
    onClose: () => setShowAdd(false),
    title: "Log visit note"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Account"
  }, /*#__PURE__*/React.createElement(Select, {
    value: acct,
    onChange: e => setAcct(e.target.value),
    options: ACCOUNTS_DATA.filter(a => a.rep === 'MT').map(a => ({
      value: a.id,
      label: a.name
    }))
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Note",
    hint: "What did you observe? Backbar levels, feedback, events, opportunities."
  }, /*#__PURE__*/React.createElement(Textarea, {
    value: note,
    onChange: e => setNote(e.target.value),
    rows: 4,
    placeholder: "Write or transcribe your visit note\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    onClick: () => setShowAdd(false)
  }, "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    onClick: () => {
      addVisit({
        account: acct,
        accountName: ACCOUNTS_DATA.find(a => a.id === acct)?.name || '',
        rep: 'MT',
        summary: note,
        draftId: null,
        sentiment: 'neutral'
      });
      setShowAdd(false);
      setNote('');
    }
  }, "Save note")))));
}

// ─── Rep Targets ─────────────────────────────────────────────
function RepTargets() {
  const actual = 14820,
    target = 28000;
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Targets']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Targets",
    sub: "April 2026 \xB7 NYC territory"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Month target",
    value: `$${(target / 1000).toFixed(0)}K`,
    tone: "gold",
    icon: IC.target
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Actual to date",
    value: `$${(actual / 1000).toFixed(1)}K`,
    trend: Math.round((actual / target - 0.5) * 100),
    tone: actual / target > 0.5 ? 'green' : 'warm',
    icon: IC.trendU
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Attainment",
    value: `${Math.round(actual / target * 100)}%`,
    sub: "3 days remaining",
    tone: "stone",
    icon: IC.chart
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "Revenue by account"), ACCOUNTS_DATA.filter(a => a.rep === 'MT' && a.rev30 > 0).sort((a, b) => b.rev30 - a.rev30).map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, a.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontWeight: 600
    }
  }, "$", a.rev30.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      borderRadius: 999,
      background: T.surface,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${a.rev30 / target * 100}%`,
      height: '100%',
      background: T.gold
    }
  }))))));
}

// ─── Rep Opportunities ────────────────────────────────────────
function RepOpportunities() {
  const opps = [{
    id: 'OPP-001',
    account: 'The Aviary',
    city: 'Chicago',
    potential: 12000,
    stage: 'prospect',
    next: 'Intro tasting · May 5'
  }, {
    id: 'OPP-002',
    account: 'Noma',
    city: 'Copenhagen',
    potential: 48000,
    stage: 'prospect',
    next: 'Email intro via PD'
  }, {
    id: 'OPP-003',
    account: 'Llama Inn',
    city: 'Brooklyn',
    potential: 4800,
    stage: 'active',
    next: 'Follow-up after tasting'
  }];
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Opportunities']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Opportunities",
    sub: "Prospects and expansion accounts.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus
    }, "Add opportunity")
  }), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    cols: [{
      key: 'account',
      label: 'Account',
      bold: true
    }, {
      key: 'city',
      label: 'City'
    }, {
      key: 'potential',
      label: 'Potential',
      right: true,
      mono: true,
      render: r => `$${r.potential.toLocaleString()}`
    }, {
      key: 'stage',
      label: 'Stage',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.stage === 'active' ? 'active' : 'prospect',
        label: r.stage
      })
    }, {
      key: 'next',
      label: 'Next step'
    }],
    rows: opps,
    emptyMsg: "No opportunities."
  })));
}

// ─── Rep Reports ─────────────────────────────────────────────
function RepReports() {
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Analytics']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Analytics",
    sub: "Your performance metrics for April 2026."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Accounts visited",
    value: "14",
    sub: "this month",
    icon: IC.pin,
    tone: "stone"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Avg order value",
    value: "$580",
    trend: 12,
    tone: "gold",
    icon: IC.cart
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Win rate",
    value: "71%",
    sub: "of submitted drafts approved",
    icon: IC.check,
    tone: "green"
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.chart,
    title: "Full analytics coming soon",
    sub: "Detailed funnel, SKU mix, and visit frequency charts."
  })));
}
Object.assign(window, {
  RepDashboard,
  RepAccounts,
  RepInventory,
  RepDrafts,
  RepVisits,
  RepTargets,
  RepOpportunities,
  RepReports
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/pages-rep.jsx", error: String((e && e.message) || e) }); }

// app/pages-retail.jsx
try { (() => {
// app/pages-retail.jsx — Retail Store pages

// ─── Retail Home ─────────────────────────────────────────────
function RetailHome() {
  const {
    orders,
    shipments
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  const myOrders = orders.filter(o => o.accountName === 'Mace');
  const activeShipments = shipments.filter(s => s.status === 'in-transit' && s.dest.toLowerCase().includes('drake') === false).slice(0, 1);
  const lastOrder = myOrders.filter(o => o.status === 'delivered')[0];
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Home']
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 24,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontFamily: T.mono,
      letterSpacing: '.06em',
      marginBottom: 4
    }
  }, "MON \xB7 APR 27"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: T.display,
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, "Hi Kazu"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: T.muted,
      margin: '4px 0 0'
    }
  }, "Mace \xB7 Brooklyn \xB7 sake-bar")), /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    sz: "lg",
    icon: IC.plus,
    onClick: () => navigate(`/${role}/catalog`)
  }, "New order")), activeShipments.length > 0 && activeShipments.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: {
      padding: 20,
      background: T.card,
      border: `1px solid ${T.borderQ}`,
      borderRadius: 16,
      marginBottom: 18,
      boxShadow: '0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontFamily: T.mono,
      letterSpacing: '.06em',
      marginBottom: 4
    }
  }, "ON THE WAY"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '-.02em'
    }
  }, "Order #", s.orderId, " \xB7 arriving Wed"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      marginTop: 4
    }
  }, "Empire Wines \xB7 ETA ", s.eta, " \xB7 ", s.carrier, " ", s.trackNo)), /*#__PURE__*/React.createElement(Badge, {
    status: "in-transit"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 0
    }
  }, [{
    l: 'Approved',
    done: true
  }, {
    l: 'Picked',
    done: true
  }, {
    l: 'In transit',
    cur: true
  }, {
    l: 'Received',
    done: false
  }].map((st, i, arr) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: st.l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: st.done || st.cur ? 22 : 16,
      height: st.done || st.cur ? 22 : 16,
      borderRadius: '50%',
      background: st.done ? T.green : st.cur ? T.gold : T.border,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, st.done && /*#__PURE__*/React.createElement(Ico, {
    d: IC.check,
    size: 11,
    stroke: 2.5
  }), st.cur && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: 'white'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: st.done || st.cur ? 600 : 400,
      color: st.done || st.cur ? T.ink : T.muted
    }
  }, st.l)), i < arr.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 2,
      background: st.done ? T.green : T.border,
      marginBottom: 18,
      marginTop: 1
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Open orders",
    value: myOrders.filter(o => ['draft', 'confirmed', 'approved', 'shipped'].includes(o.status)).length,
    sub: "in progress",
    icon: IC.cart,
    onClick: () => navigate(`/${role}/orders`)
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Last delivery",
    value: lastOrder?.actualDelivery || '—',
    sub: "most recent",
    icon: IC.truck
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "SKUs listed",
    value: "3",
    sub: "active Hajime SKUs",
    icon: IC.box,
    onClick: () => navigate(`/${role}/catalog`)
  })), lastOrder && /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontFamily: T.mono,
      letterSpacing: '.06em',
      marginBottom: 4
    }
  }, "QUICK REORDER"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '-.02em'
    }
  }, "Last basket \u2014 ", lastOrder.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      marginTop: 4
    }
  }, lastOrder.orderDate, " \xB7 $", lastOrder.total.toLocaleString())), /*#__PURE__*/React.createElement(Btn, {
    v: "secondary",
    sz: "lg",
    icon: IC.refresh,
    onClick: () => navigate(`/${role}/reorder`)
  }, "Reorder this"))), /*#__PURE__*/React.createElement(Card, {
    padded: false,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Recent orders"), /*#__PURE__*/React.createElement(Btn, {
    v: "ghost",
    sz: "sm",
    onClick: () => navigate(`/${role}/orders`)
  }, "All orders")), myOrders.slice(0, 5).map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    onClick: () => navigate(`/${role}/orders/${o.id}`),
    style: {
      padding: '11px 18px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      cursor: 'pointer'
    },
    onMouseEnter: e => e.currentTarget.style.background = T.surface,
    onMouseLeave: e => e.currentTarget.style.background = ''
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 11,
      fontWeight: 500,
      flex: 1
    }
  }, o.id), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: T.muted,
      fontFamily: T.mono
    }
  }, o.orderDate), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 12,
      fontWeight: 600
    }
  }, "$", o.total.toLocaleString()), /*#__PURE__*/React.createElement(Badge, {
    status: o.status
  }))), myOrders.length === 0 && /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.cart,
    title: "No orders yet",
    sub: "Place your first order from the catalog."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: 20,
      background: T.surface,
      borderRadius: 14,
      border: `1px dashed ${T.border}`,
      display: 'flex',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: T.card,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: T.muted
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.note,
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      marginBottom: 2
    }
  }, "Questions on delivery or invoicing?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted
    }
  }, "Your Hajime rep will confirm every request."), /*#__PURE__*/React.createElement(Btn, {
    v: "outline",
    sz: "sm",
    style: {
      marginTop: 10
    }
  }, "Contact support"))));
}

// ─── Retail Catalog / New Order ────────────────────────────────
function RetailCatalog() {
  const {
    createOrder
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  const [cart, setCart] = React.useState({});
  const total = Object.entries(cart).reduce((a, [sku, qty]) => {
    const p = PRODUCTS_DATA.find(x => x.id === sku);
    return a + (p?.price || 0) * qty;
  }, 0);
  const add = (sku, delta) => setCart(c => {
    const n = Math.max(0, (c[sku] || 0) + delta);
    return n === 0 ? Object.fromEntries(Object.entries({
      ...c,
      [sku]: n
    }).filter(([, v]) => v > 0)) : {
      ...c,
      [sku]: n
    };
  });
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['New order', 'Catalog']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Catalog",
    sub: "Curated for Mace \xB7 Brooklyn. All SKUs available to order now.",
    actions: total > 0 ? /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      sz: "lg",
      icon: IC.cart,
      onClick: () => {
        createOrder({
          accountName: 'Mace',
          account: 'ACC-003',
          market: 'New York',
          rep: 'MT',
          lines: Object.entries(cart).map(([sku, qty]) => ({
            sku,
            qty,
            price: PRODUCTS_DATA.find(p => p.id === sku)?.price || 0
          })),
          total,
          requestedDelivery: '2026-05-02'
        });
        navigate(`/${role}/orders`);
      }
    }, "Send order \xB7 $", total.toLocaleString()) : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: T.muted
      }
    }, "Add items to order")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16
    }
  }, PRODUCTS_DATA.filter(p => p.status === 'active').map(prod => /*#__PURE__*/React.createElement(Card, {
    key: prod.id,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 120,
      borderRadius: 10,
      background: `linear-gradient(135deg, hsl(40 30%88%), hsl(30 20%80%))`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: T.muted
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.box,
    size: 36
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 10,
      color: T.muted,
      marginBottom: 3
    }
  }, prod.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, prod.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 2
    }
  }, prod.type, " \xB7 ", prod.size, " \xB7 case of ", prod.cs)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 22,
      fontWeight: 600
    }
  }, "$", prod.price, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontWeight: 400
    }
  }, " / btl")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted
    }
  }, "Case: $", prod.price * prod.cs)), cart[prod.id] ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: T.gold,
      color: 'white',
      padding: '6px 12px',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => add(prod.id, -prod.cs),
    style: {
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      fontSize: 18,
      lineHeight: 1
    }
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontWeight: 600,
      fontSize: 13,
      minWidth: 24,
      textAlign: 'center'
    }
  }, cart[prod.id]), /*#__PURE__*/React.createElement("button", {
    onClick: () => add(prod.id, prod.cs),
    style: {
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      fontSize: 18,
      lineHeight: 1
    }
  }, "+")) : /*#__PURE__*/React.createElement(Btn, {
    v: "accent",
    icon: IC.plus,
    onClick: () => add(prod.id, prod.cs)
  }, "Add"))))));
}

// ─── Retail Orders ─────────────────────────────────────────────
function RetailOrders() {
  const {
    orders
  } = useStore();
  const {
    navigate,
    role
  } = useRouter();
  const mine = orders.filter(o => o.accountName === 'Mace');
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['My orders']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "My orders",
    sub: "All orders placed by Mace \xB7 Brooklyn."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, mine.length === 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
    icon: IC.cart,
    title: "No orders yet",
    sub: "Place your first order from the catalog.",
    action: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.plus,
      onClick: () => navigate(`/${role}/catalog`)
    }, "Browse catalog")
  })), mine.map(o => /*#__PURE__*/React.createElement(Card, {
    key: o.id,
    onClick: () => navigate(`/${role}/orders/${o.id}`),
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 16,
      cursor: 'pointer'
    },
    onMouseEnter: e => e.currentTarget.style.boxShadow = '0 2px 4px hsl(24 10%10%/.06),0 8px 24px hsl(24 10%10%/.06)',
    onMouseLeave: e => e.currentTarget.style.boxShadow = '0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontSize: 12,
      fontWeight: 600,
      color: T.gold
    }
  }, o.id), /*#__PURE__*/React.createElement(Badge, {
    status: o.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500
    }
  }, o.lines.map(l => `${l.qty}× ${PRODUCTS_DATA.find(p => p.id === l.sku)?.name || l.sku}`).join(', ')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.muted,
      marginTop: 3
    }
  }, "Placed ", o.orderDate, " \xB7 Requested ", o.requestedDelivery)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '-.02em'
    }
  }, "$", o.total.toLocaleString()), o.shipmentId && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted,
      fontFamily: T.mono,
      marginTop: 4
    }
  }, o.shipmentId))))));
}

// ─── Retail Reorder ───────────────────────────────────────────
function RetailReorder() {
  const {
    navigate,
    role
  } = useRouter();
  const suggestions = [{
    sku: 'HJM-FP-750',
    name: 'Florin Peaks',
    lastQty: 18,
    days: 22,
    signal: 'Fast pour',
    tone: 'amber'
  }, {
    sku: 'HJM-JN-720',
    name: 'Junmai Shiro',
    lastQty: 12,
    days: 30,
    signal: 'On cadence'
  }, {
    sku: 'HJM-RY-500',
    name: 'Ryusui Reserve',
    lastQty: 6,
    days: 40,
    signal: 'Slow',
    tone: 'blue'
  }];
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Reorder']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Reorder",
    sub: "Based on your depletion rate, here's what to top up this week.",
    actions: /*#__PURE__*/React.createElement(Btn, {
      v: "accent",
      icon: IC.cart,
      onClick: () => navigate(`/${role}/catalog`)
    }, "Build new order")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, suggestions.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.sku,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 10,
      color: T.muted,
      marginBottom: 3
    }
  }, s.sku), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      marginTop: 3
    }
  }, "Last ordered: ", s.lastQty, " bottles \xB7 ", s.days, " days ago"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: s.tone === 'amber' ? 'pending' : s.tone === 'blue' ? 'confirmed' : 'active',
    label: s.signal
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.02em'
    }
  }, s.lastQty, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: T.muted,
      fontWeight: 400,
      marginLeft: 3
    }
  }, "btl")), /*#__PURE__*/React.createElement(Btn, {
    v: s.tone === 'amber' ? 'accent' : 'outline',
    icon: IC.refresh
  }, "Reorder ", s.lastQty)))));
}

// ─── Retail Shipments (deliveries) ───────────────────────────
function RetailShipments() {
  const {
    shipments
  } = useStore();
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Deliveries']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Deliveries",
    sub: "Track your incoming deliveries from Empire Wines."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, shipments.filter(s => s.id === 'SHP-041').map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 14,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.mono,
      fontSize: 12,
      fontWeight: 600,
      color: T.gold,
      marginBottom: 4
    }
  }, s.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 22,
      fontWeight: 600
    }
  }, "From ", s.origin), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.muted,
      marginTop: 3
    }
  }, s.bottles, " bottles \xB7 ETA ", s.eta, " \xB7 ", s.carrier, " ", s.trackNo)), /*#__PURE__*/React.createElement(Badge, {
    status: s.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 0
    }
  }, [{
    l: 'Ordered',
    done: true
  }, {
    l: 'Approved',
    done: true
  }, {
    l: 'Packed',
    done: true
  }, {
    l: 'In transit',
    cur: true
  }, {
    l: 'Delivered',
    done: false
  }].map((st, i, arr) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: st.l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: st.done || st.cur ? 22 : 14,
      height: st.done || st.cur ? 22 : 14,
      borderRadius: '50%',
      background: st.done ? T.green : st.cur ? T.gold : T.border,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, st.done && /*#__PURE__*/React.createElement(Ico, {
    d: IC.check,
    size: 10,
    stroke: 2.5
  }), st.cur && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      background: 'white'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: st.done || st.cur ? 600 : 400,
      color: st.done || st.cur ? T.ink : T.muted,
      whiteSpace: 'nowrap'
    }
  }, st.l)), i < arr.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 2,
      background: st.done ? T.green : T.border,
      marginBottom: 18
    }
  }))))))));
}

// ─── Retail Account ───────────────────────────────────────────
function RetailAccount() {
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Account']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Account",
    sub: "Mace \xB7 Brooklyn"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, null, [['Trading name', 'Mace'], ['Type', 'Bar'], ['City', 'Brooklyn, NY'], ['Rep', 'Mike Tan · mike@hajime.jp'], ['Payment terms', 'Net 30'], ['Account since', 'Mar 2024']].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, v)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 17,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "This month"), /*#__PURE__*/React.createElement(StatCard, {
    label: "Orders placed",
    value: "2",
    tone: "stone"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Total spend",
    value: "$1,724",
    trend: 8,
    tone: "gold"
  }))));
}

// ─── Retail Support ───────────────────────────────────────────
function RetailSupport() {
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['Support']
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Support",
    sub: "Questions on orders, delivery, invoicing or listings."
  }), /*#__PURE__*/React.createElement(Card, {
    style: {
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 20,
      fontWeight: 500,
      marginBottom: 14
    }
  }, "Contact your rep"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.muted,
      lineHeight: 1.6,
      marginBottom: 20
    }
  }, "Your Hajime rep is Mike Tan. He'll confirm every request, usually within 2 hours on business days."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Subject"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['Delivery query', 'Invoice issue', 'Stock question', 'Listing change', 'Other'],
    value: "Delivery query",
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Message"
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 4,
    placeholder: "Describe your question\u2026"
  })), /*#__PURE__*/React.createElement(Btn, {
    v: "accent"
  }, "Send message"))));
}

// ─── Retail Order Detail ───────────────────────────────────────
function RetailOrderDetail() {
  const {
    parts,
    navigate,
    role
  } = useRouter();
  const {
    orders
  } = useStore();
  const orderId = parts[2];
  const order = orders.find(o => o.id === orderId);
  if (!order) return /*#__PURE__*/React.createElement(AppShell, null, /*#__PURE__*/React.createElement(EmptyState, {
    title: "Order not found",
    sub: orderId
  }));
  return /*#__PURE__*/React.createElement(AppShell, {
    breadcrumb: ['My orders', order.id]
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: order.id,
    sub: `Placed ${order.orderDate} · ${order.accountName}`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 16,
      fontWeight: 500,
      marginBottom: 16
    }
  }, "Items"), order.lines.map((l, i) => {
    const p = PRODUCTS_DATA.find(x => x.id === l.sku);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: `1px solid ${T.borderQ}`,
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 500
      }
    }, p?.name || l.sku), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: T.mono,
        fontSize: 11,
        color: T.muted
      }
    }, l.sku, " \xB7 ", l.qty, " bottles")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.mono,
        fontWeight: 600
      }
    }, "$", (l.qty * l.price).toLocaleString()));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      fontSize: 14,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", null, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono
    }
  }, "$", order.total.toLocaleString()))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(Badge, {
    status: order.status
  }), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), [['Order date', order.orderDate], ['Requested', order.requestedDelivery], ['Shipment', order.shipmentId || '—']].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${T.borderQ}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.muted
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.mono,
      fontWeight: 500
    }
  }, v))))));
}
Object.assign(window, {
  RetailHome,
  RetailCatalog,
  RetailOrders,
  RetailReorder,
  RetailShipments,
  RetailAccount,
  RetailSupport,
  RetailOrderDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/pages-retail.jsx", error: String((e && e.message) || e) }); }

// app/shell.jsx
try { (() => {
// app/shell.jsx — AppShell, Router, Sidebar, Topbar

// ─── Role definitions ────────────────────────────────────────
const ROLES_CFG = {
  hq: {
    label: 'Brand Operator (HQ)',
    sub: 'Hajime HQ',
    color: T.gold,
    initials: 'SO',
    name: 'Sora Okuda'
  },
  manuf: {
    label: 'Manufacturer',
    sub: 'Yamato Distillery',
    color: 'hsl(15 60% 45%)',
    initials: 'YI',
    name: 'Yui Imanishi'
  },
  dist: {
    label: 'Distributor',
    sub: 'Empire Wines · Brooklyn',
    color: 'hsl(215 50% 40%)',
    initials: 'LB',
    name: 'Léa Bardot'
  },
  rep: {
    label: 'Sales Rep',
    sub: 'NYC territory',
    color: 'hsl(158 50% 30%)',
    initials: 'MT',
    name: 'Mike Tan'
  },
  retail: {
    label: 'Retail Store',
    sub: 'Mace · Brooklyn',
    color: 'hsl(280 30% 40%)',
    initials: 'KZ',
    name: 'Kazu Saito'
  }
};
const NAV = {
  hq: [{
    group: 'Operations',
    items: [{
      path: 'dashboard',
      label: 'Command center',
      icon: IC.dash
    }, {
      path: 'orders',
      label: 'Orders',
      icon: IC.cart,
      badge: 'pending'
    }, {
      path: 'inventory',
      label: 'Inventory',
      icon: IC.box
    }, {
      path: 'accounts',
      label: 'Accounts',
      icon: IC.users
    }, {
      path: 'purchase-orders',
      label: 'Production requests',
      icon: IC.file
    }, {
      path: 'shipments',
      label: 'Shipments',
      icon: IC.truck
    }, {
      path: 'markets',
      label: 'Global markets',
      icon: IC.globe
    }]
  }, {
    group: 'Insights',
    items: [{
      path: 'reports',
      label: 'Reports',
      icon: IC.chart
    }, {
      path: 'alerts',
      label: 'Alerts',
      icon: IC.alert,
      badge: 'alerts'
    }, {
      path: 'finance',
      label: 'Finance',
      icon: IC.receipt
    }, {
      path: 'incentives',
      label: 'Incentives',
      icon: IC.target
    }, {
      path: 'product-development',
      label: 'Product dev',
      icon: IC.factory
    }]
  }, {
    group: 'HQ',
    items: [{
      path: 'settings',
      label: 'Settings',
      icon: IC.settings
    }]
  }],
  manuf: [{
    group: 'Production',
    items: [{
      path: 'dashboard',
      label: 'Overview',
      icon: IC.dash
    }, {
      path: 'production',
      label: 'Production board',
      icon: IC.factory
    }, {
      path: 'po-in',
      label: 'Orders in',
      icon: IC.file,
      badge: 'pending'
    }, {
      path: 'ship-out',
      label: 'Shipments out',
      icon: IC.truck
    }, {
      path: 'specs',
      label: 'Product specs',
      icon: IC.tag
    }]
  }, {
    group: 'Account',
    items: [{
      path: 'profile',
      label: 'Profile',
      icon: IC.users
    }]
  }],
  dist: [{
    group: 'Warehouse',
    items: [{
      path: 'dashboard',
      label: 'Overview',
      icon: IC.dash
    }, {
      path: 'floor',
      label: 'Pick queue',
      icon: IC.whouse,
      badge: 'pending'
    }, {
      path: 'inbound',
      label: 'Inbound',
      icon: IC.truck
    }, {
      path: 'inventory',
      label: 'Warehouse stock',
      icon: IC.box
    }, {
      path: 'depletion',
      label: 'Depletion live',
      icon: IC.chart,
      badge: 'depletion'
    }]
  }, {
    group: 'Reports',
    items: [{
      path: 'sell-through',
      label: 'Sell-through',
      icon: IC.trendU
    }, {
      path: 'alerts',
      label: 'Alerts',
      icon: IC.alert
    }, {
      path: 'incentives',
      label: 'My incentives',
      icon: IC.target,
      badge: 'new'
    }]
  }],
  rep: [{
    group: 'Field',
    items: [{
      path: 'dashboard',
      label: 'Overview',
      icon: IC.dash
    }, {
      path: 'accounts',
      label: 'My accounts',
      icon: IC.users
    }, {
      path: 'inventory',
      label: 'Stock check',
      icon: IC.box,
      badge: 'new'
    }, {
      path: 'drafts',
      label: 'Draft orders',
      icon: IC.cart,
      badge: 'pending'
    }, {
      path: 'visits',
      label: 'Visit notes',
      icon: IC.note
    }, {
      path: 'opportunities',
      label: 'Opportunities',
      icon: IC.target
    }]
  }, {
    group: 'Performance',
    items: [{
      path: 'targets',
      label: 'Targets',
      icon: IC.target
    }, {
      path: 'reports',
      label: 'Analytics',
      icon: IC.chart
    }, {
      path: 'incentives',
      label: 'My incentives',
      icon: IC.receipt,
      badge: 'new'
    }]
  }],
  retail: [{
    group: 'Store',
    items: [{
      path: 'dashboard',
      label: 'Home',
      icon: IC.store
    }, {
      path: 'catalog',
      label: 'New order',
      icon: IC.plus
    }, {
      path: 'orders',
      label: 'My orders',
      icon: IC.cart
    }, {
      path: 'reorder',
      label: 'Reorder',
      icon: IC.refresh
    }, {
      path: 'shipments',
      label: 'Deliveries',
      icon: IC.truck
    }]
  }, {
    group: 'Account',
    items: [{
      path: 'account',
      label: 'Account',
      icon: IC.users
    }, {
      path: 'support',
      label: 'Support',
      icon: IC.note
    }, {
      path: 'incentives',
      label: 'My rewards',
      icon: IC.target,
      badge: 'new'
    }]
  }]
};

// ─── Router (hash-based) ─────────────────────────────────────
const RouterCtx = React.createContext(null);
function useRouter() {
  return React.useContext(RouterCtx);
}
function RouterProvider({
  children
}) {
  const [hash, setHash] = React.useState(() => window.location.hash.slice(1) || '/login');
  React.useEffect(() => {
    const handler = () => setHash(window.location.hash.slice(1) || '/login');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const navigate = React.useCallback(path => {
    window.location.hash = '#' + path;
  }, []);
  const parts = hash.replace(/^\//, '').split('/');
  return /*#__PURE__*/React.createElement(RouterCtx.Provider, {
    value: {
      hash,
      navigate,
      parts,
      role: parts[0],
      page: parts[1] || 'dashboard',
      sub: parts[2]
    }
  }, children);
}

// ─── Role Context ─────────────────────────────────────────────
const RoleCtx = React.createContext(null);
function useRole() {
  return React.useContext(RoleCtx);
}

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar() {
  const {
    role,
    page,
    navigate
  } = useRouter();
  const {
    orders,
    alerts
  } = useStore();
  const cfg = ROLES_CFG[role] || ROLES_CFG.hq;
  const groups = NAV[role] || NAV.hq;
  const badgeCount = {
    pending: role === 'hq' ? orders.filter(o => o.status === 'pending').length : role === 'manuf' ? orders.filter(o => o.status === 'pending').length : orders.filter(o => ['approved', 'pending'].includes(o.status)).length,
    alerts: alerts.filter(a => a.sev === 'critical' || a.sev === 'high').length,
    depletion: 1,
    new: undefined
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240,
      flexShrink: 0,
      background: T.inkDeep,
      color: 'hsl(35 12% 78%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      padding: '18px 12px',
      borderRight: '1px solid hsl(24 10% 15%)',
      height: '100%',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: 'hsl(24 10%13%/.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: window.__resources?.logo || 'assets/hajime-logo.png',
    alt: "",
    style: {
      height: 26,
      width: 26,
      objectFit: 'contain',
      filter: 'brightness(0) invert(1)'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontWeight: 600,
      fontSize: 16,
      color: 'hsl(35 14% 90%)',
      lineHeight: 1
    }
  }, "Hajime"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: '.18em',
      color: 'hsl(35 12% 55%)',
      marginTop: 3
    }
  }, cfg.sub))), groups.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.group,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 10px',
      fontSize: 10,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      color: 'hsl(35 12%78%/.4)'
    }
  }, g.group), g.items.map(item => {
    const active = page === item.path;
    const cnt = item.badge ? badgeCount[item.badge] : null;
    return /*#__PURE__*/React.createElement("div", {
      key: item.path,
      onClick: () => navigate(`/${role}/${item.path}`),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 6,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all .12s',
        background: active ? 'hsl(24 10% 13%)' : 'transparent',
        color: active ? T.gold : 'hsl(35 12%78%/.75)',
        fontWeight: active ? 500 : 400
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: item.icon,
      size: 15
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, item.label), cnt != null && cnt > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontFamily: T.mono,
        color: T.gold,
        background: 'hsl(40 88%42%/.14)',
        padding: '1px 6px',
        borderRadius: 999
      }
    }, cnt), item.badge === 'new' && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontFamily: T.mono,
        color: T.gold,
        background: 'hsl(40 88%42%/.14)',
        padding: '1px 6px',
        borderRadius: 999,
        letterSpacing: '.04em'
      }
    }, "NEW"));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderTop: '1px solid hsl(24 10%15%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 999,
      background: 'hsl(24 10%13%)',
      color: 'hsl(35 14%90%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 500
    }
  }, cfg.initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'hsl(35 14%90%)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, cfg.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'hsl(35 12%50%)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, cfg.label)), /*#__PURE__*/React.createElement("div", {
    onClick: () => navigate('/login'),
    style: {
      cursor: 'pointer',
      color: 'hsl(35 12%50%)',
      opacity: .7
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.logout,
    size: 14
  }))));
}

// ─── Top bar ─────────────────────────────────────────────────
function Topbar({
  right,
  breadcrumb
}) {
  const {
    navigate,
    role,
    page
  } = useRouter();
  const {
    alerts
  } = useStore();
  const alertCount = alerts.filter(a => a.sev === 'critical' || a.sev === 'high').length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 14,
      flexShrink: 0,
      background: 'hsl(40 20%99%/.82)',
      backdropFilter: 'blur(12px) saturate(1.4)',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, breadcrumb && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 13,
      color: T.muted
    }
  }, breadcrumb.map((b, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement(Ico, {
    d: IC.chevR,
    size: 12
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: i === breadcrumb.length - 1 ? T.ink : T.muted,
      fontWeight: i === breadcrumb.length - 1 ? 500 : 400
    }
  }, b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 10px',
      height: 32,
      background: T.surface,
      borderRadius: 8,
      maxWidth: 360,
      marginLeft: breadcrumb ? 'auto' : 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.search,
    size: 13,
    style: {
      color: T.muted
    }
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search\u2026",
    style: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: 13,
      fontFamily: T.body,
      color: T.ink,
      flex: 1
    }
  })), right && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, right), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => navigate(`/${role}/alerts`),
    style: {
      width: 34,
      height: 34,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: T.muted,
      cursor: 'pointer',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.bell,
    size: 15
  }), alertCount > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 7,
      right: 8,
      width: 7,
      height: 7,
      borderRadius: 999,
      background: T.gold,
      border: `1.5px solid ${T.paper}`
    }
  }))));
}

// ─── App shell layout ────────────────────────────────────────
function AppShell({
  children,
  topRight,
  breadcrumb
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      height: '100vh',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Topbar, {
    right: topRight,
    breadcrumb: breadcrumb
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '28px 36px 60px',
      background: T.paper
    }
  }, children)));
}

// ─── Login screen ────────────────────────────────────────────
function LoginPage() {
  const {
    navigate
  } = useRouter();
  const [step, setStep] = React.useState('role');
  const [selectedRole, setSelectedRole] = React.useState(null);
  const ROLE_OPTS = [{
    id: 'hq',
    icon: IC.dash,
    label: 'Brand Operator',
    sub: 'Hajime HQ — command center',
    mark: '◉'
  }, {
    id: 'manuf',
    icon: IC.factory,
    label: 'Manufacturer',
    sub: 'Production & export',
    mark: '⚙'
  }, {
    id: 'dist',
    icon: IC.whouse,
    label: 'Distributor',
    sub: 'Warehouse & fulfillment',
    mark: '◫'
  }, {
    id: 'rep',
    icon: IC.users,
    label: 'Sales Rep',
    sub: 'Field accounts & drafts',
    mark: '◈'
  }, {
    id: 'retail',
    icon: IC.store,
    label: 'Retail Store',
    sub: 'Order & track deliveries',
    mark: '◻'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: T.inkDeep,
      position: 'relative',
      overflow: 'hidden',
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(ellipse 80%50% at 50% -10%, hsl(40 88%42%/.1), transparent)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: `radial-gradient(circle, hsl(40 20%97%/.04) 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 64,
      maxWidth: 1200,
      width: '100%',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'hsl(40 18%97%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: window.__resources?.logo || 'assets/hajime-logo.png',
    alt: "",
    style: {
      height: 72,
      filter: 'brightness(0) invert(1)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: '-.02em'
    }
  }, "Hajime")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: T.display,
      fontSize: 72,
      fontWeight: 600,
      letterSpacing: '-.025em',
      lineHeight: 1.0,
      margin: '0 0 24px',
      color: 'hsl(40 18%97%)'
    }
  }, "Five portals.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.gold,
      fontStyle: 'italic',
      fontWeight: 500
    }
  }, "One dataset.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      color: 'hsl(35 14%72%)',
      lineHeight: 1.55,
      maxWidth: '44ch',
      margin: 0
    }
  }, "Every change propagates in real time across all five roles. Sign in to explore any portal."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 48,
      marginTop: 48,
      paddingTop: 32,
      borderTop: '1px solid hsl(35 12%55%/.2)'
    }
  }, [{
    n: '5',
    l: 'Portals'
  }, {
    n: '12',
    l: 'Markets'
  }, {
    n: '1',
    l: 'Shared truth'
  }].map(s => /*#__PURE__*/React.createElement("div", {
    key: s.l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 40,
      fontWeight: 600,
      color: T.gold,
      letterSpacing: '-.02em'
    }
  }, s.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'hsl(35 12%55%)',
      marginTop: 2
    }
  }, s.l))))), /*#__PURE__*/React.createElement("div", null, step === 'role' ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'hsl(35 12%55%)',
      textAlign: 'center',
      marginBottom: 20
    }
  }, "Choose your role"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, ROLE_OPTS.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    onClick: () => {
      setSelectedRole(r);
      setStep('creds');
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      borderRadius: 12,
      border: '1px solid hsl(0 0%100%/.08)',
      background: 'hsl(0 0%100%/.03)',
      cursor: 'pointer',
      gridColumn: i === 4 ? '1/-1' : undefined,
      transition: 'all .2s'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'hsl(0 0%100%/.06)',
    onMouseLeave: e => e.currentTarget.style.background = 'hsl(0 0%100%/.03)'
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      color: 'hsl(35 14%70%)'
    }
  }, r.mark), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'hsl(35 14%88%)'
    }
  }, r.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'hsl(35 12%50%)'
    }
  }, r.sub)), /*#__PURE__*/React.createElement(Ico, {
    d: IC.chevR,
    size: 14,
    style: {
      marginLeft: 'auto',
      color: 'hsl(35 12%40%)'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 10,
      fontFamily: T.mono,
      color: 'hsl(35 12%40%)',
      letterSpacing: '.08em'
    }
  }, "DEMO ENVIRONMENT \xB7 NO REAL DATA")) : /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'hsl(0 0%100%/.03)',
      border: '1px solid hsl(0 0%100%/.08)',
      borderRadius: 16,
      padding: 28,
      backdropFilter: 'blur(4px)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep('role'),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'hsl(35 12%50%)',
      fontSize: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.chevL,
    size: 13
  }), " Change role"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24,
      color: T.gold
    }
  }, selectedRole?.mark), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: 'hsl(35 14%88%)'
    }
  }, selectedRole?.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'hsl(35 12%50%)'
    }
  }, selectedRole?.sub))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 11,
      color: 'hsl(35 12%55%)',
      display: 'block',
      marginBottom: 4
    }
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    defaultValue: `${selectedRole?.id}@hajime.jp`,
    style: {
      width: '100%',
      height: 40,
      padding: '0 12px',
      borderRadius: 8,
      background: 'hsl(0 0%100%/.04)',
      border: '1px solid hsl(0 0%100%/.1)',
      color: 'hsl(35 14%88%)',
      fontSize: 13,
      fontFamily: T.body,
      outline: 'none',
      boxSizing: 'border-box'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 11,
      color: 'hsl(35 12%55%)',
      display: 'block',
      marginBottom: 4
    }
  }, "Password"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    defaultValue: "demo",
    style: {
      width: '100%',
      height: 40,
      padding: '0 12px',
      borderRadius: 8,
      background: 'hsl(0 0%100%/.04)',
      border: '1px solid hsl(0 0%100%/.1)',
      color: 'hsl(35 14%88%)',
      fontSize: 13,
      fontFamily: T.body,
      outline: 'none',
      boxSizing: 'border-box'
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate(`/${selectedRole.id}/dashboard`),
    style: {
      height: 44,
      background: T.gold,
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
      marginTop: 4,
      fontFamily: T.body
    }
  }, "Enter as ", selectedRole?.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 14,
      fontSize: 10,
      color: 'hsl(35 12%40%)',
      fontFamily: T.mono
    }
  }, "DEMO \xB7 password is anything")))));
}
Object.assign(window, {
  T,
  ROLES_CFG,
  NAV,
  RouterProvider,
  useRouter,
  AppShell,
  LoginPage,
  Topbar,
  Sidebar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/shell.jsx", error: String((e && e.message) || e) }); }

// app/ui.jsx
try { (() => {
// app/ui.jsx — Shared UI primitives

// ─── Design tokens (mirror colors_and_type.css vars) ────────
const T = {
  paper: 'hsl(40 18% 97%)',
  paper2: 'hsl(40 20% 99%)',
  ink: 'hsl(24 10% 10%)',
  inkDeep: 'hsl(24 12% 8%)',
  muted: 'hsl(24 6% 50%)',
  border: 'hsl(35 12% 89%)',
  borderQ: 'hsl(35 12% 89% / 0.6)',
  card: 'hsl(40 20% 99%)',
  surface: 'hsl(37 14% 94%)',
  gold: 'hsl(40 88% 42%)',
  green: 'hsl(158 56% 36%)',
  amber: 'hsl(38 90% 50%)',
  red: 'hsl(0 68% 48%)',
  blue: 'hsl(215 72% 50%)',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', Menlo, monospace"
};

// ─── Icon helper ─────────────────────────────────────────────
const Ico = ({
  d,
  size = 16,
  stroke = 1.65,
  c,
  style = {}
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: c || 'currentColor',
  strokeWidth: stroke,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: {
    flexShrink: 0,
    ...style
  }
}, d);

// ─── Icon set ────────────────────────────────────────────────
const IC = {
  dash: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "12",
    width: "7",
    height: "9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "16",
    width: "7",
    height: "5"
  })),
  globe: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"
  })),
  box: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3.3 7 8.7 5 8.7-5M12 22V12"
  })),
  cart: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "21",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "21",
    r: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
  })),
  users: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
  })),
  file: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "14 2 14 8 20 8"
  })),
  factory: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
  })),
  truck: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "18",
    r: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "18",
    r: "2"
  })),
  chart: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 3v18h18M18 17V9M13 17V5M8 17v-3"
  })),
  bell: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"
  })),
  alert: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01"
  })),
  settings: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
  })),
  search: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })),
  plus: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M12 5v14"
  })),
  check: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m5 12 5 5L20 7"
  })),
  x: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })),
  chevR: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  })),
  chevL: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m15 18-6-6 6-6"
  })),
  chevD: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  })),
  chevU: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m18 15-6-6-6 6"
  })),
  trendU: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
    points: "22 7 13.5 15.5 8.5 10.5 2 17"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "16 7 22 7 22 13"
  })),
  trendD: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
    points: "22 17 13.5 8.5 8.5 13.5 2 7"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "16 17 22 17 22 11"
  })),
  arrow: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M13 5l7 7-7 7"
  })),
  arrowL: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M11 19l-7-7 7-7"
  })),
  logout: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
  })),
  store: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"
  })),
  whouse: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 18h12M6 14h12M6 10h12"
  })),
  pin: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 22s-8-4.5-8-12a8 8 0 0 1 16 0c0 7.5-8 12-8 12z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })),
  receipt: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M16 2v4M8 2v4M3 10h18"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  })),
  more: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "5",
    cy: "12",
    r: "1"
  })),
  refresh: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 21v-5h5"
  })),
  mic: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"
  })),
  note: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 2v6h6M16 13H8M16 17H8M10 9H8"
  })),
  target: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "2"
  })),
  filter: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
  })),
  sort: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m3 16 4 4 4-4M7 20V4M17 8l4-4-4-4M21 4H11M21 12H11M21 20h-6"
  })),
  dl: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
  })),
  eye: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })),
  tag: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "7",
    y1: "7",
    x2: "7.01",
    y2: "7"
  }))
};

// ─── Badge / Pill ─────────────────────────────────────────────
const STATUS_TONES = {
  available: 'green',
  active: 'green',
  delivered: 'green',
  approved: 'green',
  paid: 'green',
  completed: 'green',
  healthy: 'green',
  pending: 'amber',
  reserved: 'amber',
  preparing: 'amber',
  'pending-review': 'amber',
  draft: 'stone',
  inactive: 'stone',
  'in-production': 'stone',
  'in-transit': 'blue',
  confirmed: 'blue',
  shipped: 'blue',
  development: 'blue',
  cancelled: 'red',
  overdue: 'red',
  damaged: 'red',
  delayed: 'red',
  high: 'red',
  limited: 'gold',
  prospect: 'gold',
  medium: 'gold'
};
const TONE_STYLES = {
  green: {
    bg: 'hsl(158 56% 36% / .08)',
    c: 'hsl(158 56% 24%)',
    br: 'hsl(158 56% 36% / .22)'
  },
  amber: {
    bg: 'hsl(38 90% 50% / .10)',
    c: 'hsl(30 80% 28%)',
    br: 'hsl(38 90% 50% / .28)'
  },
  stone: {
    bg: 'hsl(30 10% 55% / .10)',
    c: 'hsl(30 10% 32%)',
    br: 'hsl(30 10% 55% / .22)'
  },
  blue: {
    bg: 'hsl(215 72% 50% / .08)',
    c: 'hsl(215 72% 36%)',
    br: 'hsl(215 72% 50% / .22)'
  },
  red: {
    bg: 'hsl(0 68% 48% / .08)',
    c: 'hsl(0 68% 34%)',
    br: 'hsl(0 68% 48% / .22)'
  },
  gold: {
    bg: 'hsl(40 88% 42% / .10)',
    c: 'hsl(40 88% 28%)',
    br: 'hsl(40 88% 42% / .28)'
  },
  ink: {
    bg: 'hsl(24 10% 10% / .9)',
    c: 'hsl(40 20% 97%)',
    br: 'transparent'
  }
};
function Badge({
  status,
  label,
  dot = true,
  size = 'sm',
  custom
}) {
  const tone = custom || STATUS_TONES[status] || 'stone';
  const s = TONE_STYLES[tone] || TONE_STYLES.stone;
  const txt = label || (status || '').replace(/-/g, ' ');
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      borderRadius: 999,
      padding: size === 'xs' ? '1px 7px' : '2px 9px',
      fontSize: size === 'xs' ? 10 : 11,
      fontWeight: 500,
      fontFamily: T.body,
      background: s.bg,
      color: s.c,
      border: `1px solid ${s.br}`,
      whiteSpace: 'nowrap'
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: 999,
      background: s.c,
      flexShrink: 0
    }
  }), txt);
}

// ─── Button ───────────────────────────────────────────────────
function Btn({
  v = 'outline',
  sz = 'md',
  icon,
  iconR,
  onClick,
  disabled,
  children,
  style = {}
}) {
  const vs = {
    primary: {
      bg: T.ink,
      c: T.paper,
      br: 'transparent'
    },
    accent: {
      bg: T.gold,
      c: T.paper,
      br: 'transparent'
    },
    outline: {
      bg: T.paper,
      c: T.ink,
      br: T.border
    },
    ghost: {
      bg: 'transparent',
      c: T.ink,
      br: 'transparent'
    },
    soft: {
      bg: T.surface,
      c: T.ink,
      br: 'transparent'
    },
    danger: {
      bg: 'hsl(0 68% 48%)',
      c: '#fff',
      br: 'transparent'
    }
  };
  const sizes = {
    xs: {
      h: 26,
      px: 8,
      fs: 11
    },
    sm: {
      h: 30,
      px: 10,
      fs: 12
    },
    md: {
      h: 34,
      px: 14,
      fs: 13
    },
    lg: {
      h: 40,
      px: 18,
      fs: 14
    }
  };
  const V = vs[v] || vs.outline;
  const S = sizes[sz] || sizes.md;
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: S.h,
      padding: `0 ${S.px}px`,
      fontSize: S.fs,
      fontWeight: 500,
      borderRadius: 8,
      border: `1px solid ${V.br}`,
      background: V.bg,
      color: V.c,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .55 : 1,
      fontFamily: T.body,
      whiteSpace: 'nowrap',
      transition: 'opacity .15s',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(Ico, {
    d: icon,
    size: S.fs + 2
  }), children, iconR && /*#__PURE__*/React.createElement(Ico, {
    d: iconR,
    size: S.fs + 2
  }));
}

// ─── Input / Select ───────────────────────────────────────────
function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  mono,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("input", {
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    style: {
      height: 34,
      padding: '0 10px',
      borderRadius: 8,
      border: `1px solid ${T.border}`,
      background: T.paper,
      color: T.ink,
      fontSize: 13,
      fontFamily: mono ? T.mono : T.body,
      outline: 'none',
      width: '100%',
      ...style
    }
  });
}
function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("textarea", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    rows: rows,
    style: {
      padding: '8px 10px',
      borderRadius: 8,
      border: `1px solid ${T.border}`,
      background: T.paper,
      color: T.ink,
      fontSize: 13,
      fontFamily: T.body,
      outline: 'none',
      width: '100%',
      resize: 'vertical',
      ...style
    }
  });
}
function Select({
  value,
  onChange,
  options = [],
  style = {}
}) {
  return /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: onChange,
    style: {
      height: 34,
      padding: '0 28px 0 10px',
      borderRadius: 8,
      border: `1px solid ${T.border}`,
      background: T.paper,
      color: T.ink,
      fontSize: 13,
      fontFamily: T.body,
      outline: 'none',
      appearance: 'none',
      cursor: 'pointer',
      ...style
    }
  }, options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value || o,
    value: o.value || o
  }, o.label || o)));
}
function Field({
  label,
  hint,
  children,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: T.muted
    }
  }, label), children, hint && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.muted
    }
  }, hint));
}

// ─── Card ─────────────────────────────────────────────────────
function Card({
  children,
  padded = true,
  elev = 1,
  style = {}
}) {
  const shadows = ['none', '0 1px 2px hsl(24 10% 10%/.04),0 4px 12px hsl(24 10% 10%/.03)', '0 2px 4px hsl(24 10% 10%/.06),0 8px 24px hsl(24 10% 10%/.06)'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: T.card,
      border: `1px solid ${T.borderQ}`,
      borderRadius: 14,
      boxShadow: shadows[elev] || shadows[1],
      padding: padded ? 20 : 0,
      ...style
    }
  }, children);
}

// ─── Stat card ────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'stone',
  trend,
  link,
  onClick
}) {
  const tones = {
    stone: {
      bg: T.card,
      ico: T.surface,
      icoC: T.muted,
      br: T.borderQ
    },
    gold: {
      bg: 'linear-gradient(135deg,hsl(40 55% 94%),hsl(40 50% 90%/.5))',
      ico: 'hsl(40 60% 86%)',
      icoC: 'hsl(40 88% 30%)',
      br: 'hsl(40 60% 80%/.5)'
    },
    warm: {
      bg: 'linear-gradient(135deg,hsl(30 70% 94%),hsl(30 60% 90%/.5))',
      ico: 'hsl(30 70% 86%)',
      icoC: 'hsl(30 80% 35%)',
      br: 'hsl(30 70% 80%/.5)'
    },
    green: {
      bg: 'linear-gradient(135deg,hsl(158 40% 94%),hsl(158 40% 90%/.5))',
      ico: 'hsl(158 40% 86%)',
      icoC: 'hsl(158 56% 24%)',
      br: 'hsl(158 40% 80%/.5)'
    }
  };
  const s = tones[tone] || tones.stone;
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: T.muted
    }
  }, label), icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: s.ico,
      color: s.icoC,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: icon,
    size: 17
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.02em',
      marginTop: 8,
      fontFeatureSettings: "'tnum'"
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 6
    }
  }, trend != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      fontSize: 11,
      fontWeight: 600,
      color: trend >= 0 ? T.green : T.red,
      fontFamily: T.mono
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: trend >= 0 ? IC.trendU : IC.trendD,
    size: 11,
    stroke: 2
  }), trend >= 0 ? '+' : '', trend, "%"), sub && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: T.muted
    }
  }, sub)));
  const base = {
    background: s.bg,
    border: `1px solid ${s.br}`,
    borderRadius: 14,
    padding: 18,
    boxShadow: '0 1px 2px hsl(24 10% 10%/.04),0 4px 12px hsl(24 10% 10%/.03)'
  };
  if (onClick || link) return /*#__PURE__*/React.createElement("div", {
    onClick: onClick || link,
    style: {
      ...base,
      cursor: 'pointer'
    }
  }, inner);
  return /*#__PURE__*/React.createElement("div", {
    style: base
  }, inner);
}

// ─── Data table ───────────────────────────────────────────────
function Table({
  cols,
  rows,
  onRow,
  emptyMsg = 'No records found',
  style = {}
}) {
  const [sortCol, setSortCol] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const [search, setSearch] = React.useState('');
  const sorted = React.useMemo(() => {
    let r = rows;
    if (search) r = r.filter(row => JSON.stringify(Object.values(row)).toLowerCase().includes(search.toLowerCase()));
    if (sortCol) r = [...r].sort((a, b) => {
      const av = a[sortCol],
        bv = b[sortCol];
      const cmp = typeof av === 'number' ? av - bv : String(av || '').localeCompare(String(bv || ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [rows, sortCol, sortDir, search]);
  const toggle = key => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');else {
      setSortCol(key);
      setSortDir('asc');
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 16px',
      borderBottom: `1px solid ${T.borderQ}`,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 10px',
      height: 32,
      background: T.surface,
      borderRadius: 8,
      minWidth: 240,
      flex: 1,
      maxWidth: 400
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.search,
    size: 13,
    style: {
      color: T.muted
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search\u2026",
    style: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: 13,
      fontFamily: T.body,
      color: T.ink,
      flex: 1
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontFamily: T.mono,
      color: T.muted,
      marginLeft: 'auto'
    }
  }, sorted.length, " rows")), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 13,
      fontFamily: T.body
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, cols.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key || c.label,
    onClick: c.sortable !== false ? () => toggle(c.key || c.label) : undefined,
    style: {
      textAlign: c.right ? 'right' : 'left',
      padding: '10px 16px',
      fontWeight: 500,
      color: T.muted,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.07em',
      borderBottom: `1px solid ${T.borderQ}`,
      background: `${T.surface}88`,
      cursor: c.sortable !== false ? 'pointer' : 'default',
      whiteSpace: 'nowrap',
      userSelect: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, c.label, sortCol === (c.key || c.label) && /*#__PURE__*/React.createElement(Ico, {
    d: sortDir === 'asc' ? IC.chevU : IC.chevD,
    size: 11
  })))))), /*#__PURE__*/React.createElement("tbody", null, sorted.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: cols.length,
    style: {
      textAlign: 'center',
      padding: 40,
      color: T.muted,
      fontSize: 14
    }
  }, emptyMsg)) : sorted.map((row, i) => /*#__PURE__*/React.createElement("tr", {
    key: row.id || i,
    onClick: onRow ? () => onRow(row) : undefined,
    style: {
      borderBottom: `1px solid ${T.borderQ}`,
      cursor: onRow ? 'pointer' : 'default',
      transition: 'background .12s'
    },
    onMouseEnter: e => {
      if (onRow) e.currentTarget.style.background = T.surface;
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = '';
    }
  }, cols.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key || c.label,
    style: {
      padding: '12px 16px',
      verticalAlign: 'middle',
      textAlign: c.right ? 'right' : 'left',
      fontFamily: c.mono ? T.mono : T.body,
      fontSize: c.mono ? 12 : 13,
      fontWeight: c.bold ? 500 : 400
    }
  }, c.render ? c.render(row) : row[c.key] ?? '—'))))))));
}

// ─── Modal / Drawer ───────────────────────────────────────────
function Modal({
  open,
  onClose,
  title,
  children,
  width = 560
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'hsl(24 10% 10%/.45)',
      backdropFilter: 'blur(3px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      background: T.card,
      borderRadius: 18,
      width,
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 4px 8px hsl(24 10%10%/.06),0 16px 40px hsl(24 10%10%/.12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      borderBottom: `1px solid ${T.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: T.muted,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      borderRadius: 6
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.x,
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, children)));
}
function Drawer({
  open,
  onClose,
  title,
  children,
  width = 480
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'flex-end',
      pointerEvents: open ? 'all' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: `hsl(24 10% 10% / ${open ? .4 : 0})`,
      backdropFilter: open ? 'blur(2px)' : 'none',
      transition: 'all .25s',
      pointerEvents: open ? 'all' : 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      background: T.card,
      width,
      maxWidth: '95vw',
      height: '100%',
      transform: `translateX(${open ? 0 : 100}%)`,
      transition: 'transform .3s cubic-bezier(0.16,1,0.3,1)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 0 40px hsl(24 10% 10%/.12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      borderBottom: `1px solid ${T.borderQ}`,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: T.muted
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: IC.x,
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      overflow: 'auto',
      flex: 1
    }
  }, children)));
}

// ─── Page layout primitives ───────────────────────────────────
function PageHead({
  title,
  sub,
  actions,
  eyebrow
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 24,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      color: T.muted,
      fontWeight: 500,
      marginBottom: 6
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: T.display,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: T.muted,
      margin: '4px 0 0',
      maxWidth: '56ch',
      lineHeight: 1.5
    }
  }, sub)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexShrink: 0
    }
  }, actions));
}
function EmptyState({
  icon,
  title,
  sub,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 40px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 16,
      background: T.surface,
      color: T.muted,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: icon || IC.box,
    size: 28
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.display,
      fontSize: 22,
      fontWeight: 500,
      marginBottom: 8,
      letterSpacing: '-.01em'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.muted,
      maxWidth: '42ch',
      lineHeight: 1.5,
      marginBottom: action ? 20 : 0
    }
  }, sub), action);
}

// ─── Toasts ───────────────────────────────────────────────────
function Toasts({
  items = []
}) {
  const toneC = {
    success: T.green,
    error: T.red,
    info: T.blue,
    warn: T.amber
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none'
    }
  }, items.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 16px',
      borderRadius: 12,
      background: T.card,
      border: `1px solid ${T.borderQ}`,
      boxShadow: '0 4px 8px hsl(24 10%10%/.08),0 12px 32px hsl(24 10%10%/.1)',
      fontSize: 13,
      fontFamily: T.body,
      color: T.ink,
      maxWidth: 320
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: toneC[t.tone] || T.green,
      flexShrink: 0
    }
  }), t.msg)));
}

// ─── Tabs ────────────────────────────────────────────────────
function Tabs({
  tabs,
  active,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2,
      background: T.surface,
      padding: 3,
      borderRadius: 10,
      width: 'fit-content'
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id || t,
    onClick: () => onChange(t.id || t),
    style: {
      padding: '6px 14px',
      fontSize: 13,
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      fontFamily: T.body,
      fontWeight: 500,
      background: active === (t.id || t) ? T.card : 'transparent',
      color: active === (t.id || t) ? T.ink : T.muted,
      boxShadow: active === (t.id || t) ? '0 1px 2px hsl(24 10%10%/.08)' : 'none',
      transition: 'all .15s'
    }
  }, t.label || t)));
}

// ─── Mini chart (sparkline bar) ──────────────────────────────
function SparkBar({
  data = [],
  color = T.gold,
  height = 40
}) {
  const max = Math.max(...data, 1);
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${data.length * 12} ${height}`,
    style: {
      width: '100%',
      height
    }
  }, data.map((v, i) => {
    const h = v / max * height * .85;
    return /*#__PURE__*/React.createElement("rect", {
      key: i,
      x: i * 12 + 1,
      y: height - h,
      width: 10,
      height: h,
      rx: 2,
      fill: i === data.length - 1 ? color : color + '60'
    });
  }));
}
Object.assign(window, {
  T,
  Ico,
  IC,
  Badge,
  Btn,
  Input,
  Textarea,
  Select,
  Field,
  Card,
  StatCard,
  Table,
  Modal,
  Drawer,
  PageHead,
  EmptyState,
  Toasts,
  Tabs,
  SparkBar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/ui.jsx", error: String((e && e.message) || e) }); }

// deck-stage.js
try { (() => {
/**
 * <deck-stage> — reusable web component for HTML decks.
 *
 * Handles:
 *  (a) speaker notes — reads <script type="application/json" id="speaker-notes">
 *      and posts {slideIndexChanged: N} to the parent window on nav.
 *  (b) keyboard navigation — ←/→, PgUp/PgDn, Space, Home/End, number keys.
 *  (c) press R to reset to slide 0 (with a tasteful keyboard hint).
 *  (d) bottom-center overlay showing slide count + hints, fades out on idle.
 *  (e) auto-scaling — inner canvas is a fixed design size (default 1920×1080)
 *      scaled with `transform: scale()` to fit the viewport, letterboxed.
 *      Set the `noscale` attribute to render at authored size (1:1) — the
 *      PPTX exporter sets this so its DOM capture sees unscaled geometry.
 *  (f) print — `@media print` lays every slide out as its own page at the
 *      design size, so the browser's Print → Save as PDF produces a clean
 *      one-page-per-slide PDF with no extra setup.
 *
 * Slides are HIDDEN, not unmounted. Non-active slides stay in the DOM with
 * `visibility: hidden` + `opacity: 0`, so their state (videos, iframes,
 * form inputs, React trees) is preserved across navigation.
 *
 * Lifecycle event — the component dispatches a `slidechange` CustomEvent on
 * itself whenever the active slide changes (including the initial mount).
 * The event bubbles and composes out of shadow DOM, so you can listen on
 * the <deck-stage> element or on document:
 *
 *   document.querySelector('deck-stage').addEventListener('slidechange', (e) => {
 *     e.detail.index         // new 0-based index
 *     e.detail.previousIndex // previous index, or -1 on init
 *     e.detail.total         // total slide count
 *     e.detail.slide         // the new active slide element
 *     e.detail.previousSlide // the prior slide element, or null on init
 *     e.detail.reason        // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
 *   });
 *
 * Persistence: none at the deck level. The host app keeps the current slide
 * in its own URL (?slide=) and re-delivers it via location.hash on load, so a
 * bare load with no hash always starts at slide 1.
 *
 * Usage:
 *   <deck-stage width="1920" height="1080">
 *     <section data-label="Title">...</section>
 *     <section data-label="Agenda">...</section>
 *   </deck-stage>
 *
 * Slides are the direct element children of <deck-stage>. Each slide is
 * automatically tagged with:
 *   - data-screen-label="NN Label"   (1-indexed, for comment flow)
 *   - data-om-validate="no_overflowing_text,no_overlapping_text,slide_sized_text"
 */

(() => {
  const DESIGN_W_DEFAULT = 1920;
  const DESIGN_H_DEFAULT = 1080;
  const OVERLAY_HIDE_MS = 1800;
  const VALIDATE_ATTR = 'no_overflowing_text,no_overlapping_text,slide_sized_text';
  const pad2 = n => String(n).padStart(2, '0');
  const stylesheet = `
    :host {
      position: fixed;
      inset: 0;
      display: block;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .canvas {
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      background: #fff;
      will-change: transform;
    }

    /* Slides live in light DOM (via <slot>) so authored CSS still applies.
       We absolutely position each slotted child to stack them. */
    ::slotted(*) {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
    ::slotted([data-deck-active]) {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    /* Tap zones for mobile — back/forward thirds like Stories.
       Transparent, no visible UI, don't block the overlay. */
    .tapzones {
      position: fixed;
      inset: 0;
      display: flex;
      z-index: 2147482000;
      pointer-events: none;
    }
    .tapzone {
      flex: 1;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
    }
    /* Only activate tap zones on coarse pointers (touch devices). */
    @media (hover: hover) and (pointer: fine) {
      .tapzones { display: none; }
    }

    .overlay {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translate(-50%, 6px) scale(0.92);
      filter: blur(6px);
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: #000;
      color: #fff;
      border-radius: 999px;
      font-size: 12px;
      font-feature-settings: "tnum" 1;
      letter-spacing: 0.01em;
      opacity: 0;
      pointer-events: none;
      transition: opacity 260ms ease, transform 260ms cubic-bezier(.2,.8,.2,1), filter 260ms ease;
      transform-origin: center bottom;
      z-index: 2147483000;
      user-select: none;
    }
    .overlay[data-visible] {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, 0) scale(1);
      filter: blur(0);
    }

    .btn {
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: 0;
      margin: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      cursor: default;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      min-width: 28px;
      border-radius: 999px;
      color: rgba(255,255,255,0.72);
      transition: background 140ms ease, color 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .btn:active { background: rgba(255,255,255,0.18); }
    .btn:focus { outline: none; }
    .btn:focus-visible { outline: none; }
    .btn::-moz-focus-inner { border: 0; }
    .btn svg { width: 14px; height: 14px; display: block; }
    .btn.reset {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      padding: 0 10px 0 12px;
      gap: 6px;
      color: rgba(255,255,255,0.72);
    }
    .btn.reset .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 10px;
      line-height: 1;
      color: rgba(255,255,255,0.88);
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
    }

    .count {
      font-variant-numeric: tabular-nums;
      color: #fff;
      font-weight: 500;
      padding: 0 8px;
      min-width: 42px;
      text-align: center;
      font-size: 12px;
    }
    .count .sep { color: rgba(255,255,255,0.45); margin: 0 3px; font-weight: 400; }
    .count .total { color: rgba(255,255,255,0.55); }

    .divider {
      width: 1px;
      height: 14px;
      background: rgba(255,255,255,0.18);
      margin: 0 2px;
    }

    /* ── Print: one page per slide, no chrome ────────────────────────────
       The screen layout stacks every slide at inset:0 inside a scaled
       canvas; for print we want them in document flow at the authored
       design size so the browser paginates one slide per sheet. The
       @page size is set from the width/height attributes via the inline
       <style id="deck-stage-print-page"> that connectedCallback injects
       into <head> (the @page at-rule has no effect inside shadow DOM). */
    @media print {
      :host {
        position: static;
        inset: auto;
        background: none;
        overflow: visible;
        color: inherit;
      }
      .stage { position: static; display: block; }
      .canvas {
        transform: none !important;
        width: auto !important;
        height: auto !important;
        background: none;
        will-change: auto;
      }
      ::slotted(*) {
        position: relative !important;
        inset: auto !important;
        width: var(--deck-design-w) !important;
        height: var(--deck-design-h) !important;
        box-sizing: border-box !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto;
        break-after: page;
        page-break-after: always;
        break-inside: avoid;
        overflow: hidden;
      }
      ::slotted(*:last-child) {
        break-after: auto;
        page-break-after: auto;
      }
      .overlay, .tapzones { display: none !important; }
    }
  `;
  class DeckStage extends HTMLElement {
    static get observedAttributes() {
      return ['width', 'height', 'noscale'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._index = 0;
      this._slides = [];
      this._notes = [];
      this._hideTimer = null;
      this._mouseIdleTimer = null;
      this._onKey = this._onKey.bind(this);
      this._onResize = this._onResize.bind(this);
      this._onSlotChange = this._onSlotChange.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onTapBack = this._onTapBack.bind(this);
      this._onTapForward = this._onTapForward.bind(this);
    }
    get designWidth() {
      return parseInt(this.getAttribute('width'), 10) || DESIGN_W_DEFAULT;
    }
    get designHeight() {
      return parseInt(this.getAttribute('height'), 10) || DESIGN_H_DEFAULT;
    }
    connectedCallback() {
      this._render();
      this._loadNotes();
      this._syncPrintPageRule();
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('resize', this._onResize);
      window.addEventListener('mousemove', this._onMouseMove, {
        passive: true
      });
      // Initial collection + layout happens via slotchange, which fires on mount.
    }
    disconnectedCallback() {
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('mousemove', this._onMouseMove);
      if (this._hideTimer) clearTimeout(this._hideTimer);
      if (this._mouseIdleTimer) clearTimeout(this._mouseIdleTimer);
    }
    attributeChangedCallback() {
      if (this._canvas) {
        this._canvas.style.width = this.designWidth + 'px';
        this._canvas.style.height = this.designHeight + 'px';
        this._canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
        this._canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
        this._fit();
        this._syncPrintPageRule();
      }
    }
    _render() {
      const style = document.createElement('style');
      style.textContent = stylesheet;
      const stage = document.createElement('div');
      stage.className = 'stage';
      const canvas = document.createElement('div');
      canvas.className = 'canvas';
      canvas.style.width = this.designWidth + 'px';
      canvas.style.height = this.designHeight + 'px';
      canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
      canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
      const slot = document.createElement('slot');
      slot.addEventListener('slotchange', this._onSlotChange);
      canvas.appendChild(slot);
      stage.appendChild(canvas);

      // Tap zones (mobile): left third = back, right third = forward.
      const tapzones = document.createElement('div');
      tapzones.className = 'tapzones export-hidden';
      tapzones.setAttribute('aria-hidden', 'true');
      tapzones.setAttribute('data-noncommentable', '');
      const tzBack = document.createElement('div');
      tzBack.className = 'tapzone tapzone--back';
      const tzMid = document.createElement('div');
      tzMid.className = 'tapzone tapzone--mid';
      tzMid.style.pointerEvents = 'none';
      const tzFwd = document.createElement('div');
      tzFwd.className = 'tapzone tapzone--fwd';
      tzBack.addEventListener('click', this._onTapBack);
      tzFwd.addEventListener('click', this._onTapForward);
      tapzones.append(tzBack, tzMid, tzFwd);

      // Overlay: compact, solid black, with clickable controls.
      const overlay = document.createElement('div');
      overlay.className = 'overlay export-hidden';
      overlay.setAttribute('role', 'toolbar');
      overlay.setAttribute('aria-label', 'Deck controls');
      overlay.setAttribute('data-noncommentable', '');
      overlay.innerHTML = `
        <button class="btn prev" type="button" aria-label="Previous slide" title="Previous (←)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>
        </button>
        <span class="count" aria-live="polite"><span class="current">1</span><span class="sep">/</span><span class="total">1</span></span>
        <button class="btn next" type="button" aria-label="Next slide" title="Next (→)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>
        </button>
        <span class="divider"></span>
        <button class="btn reset" type="button" aria-label="Reset to first slide" title="Reset (R)">Reset<span class="kbd">R</span></button>
      `;
      overlay.querySelector('.prev').addEventListener('click', () => this._go(this._index - 1, 'click'));
      overlay.querySelector('.next').addEventListener('click', () => this._go(this._index + 1, 'click'));
      overlay.querySelector('.reset').addEventListener('click', () => this._go(0, 'click'));
      this._root.append(style, stage, tapzones, overlay);
      this._canvas = canvas;
      this._slot = slot;
      this._overlay = overlay;
      this._countEl = overlay.querySelector('.current');
      this._totalEl = overlay.querySelector('.total');
    }

    /** @page must live in the document stylesheet — it's a no-op inside
     *  shadow DOM. Inject/update a single <head> style tag so the print
     *  sheet matches the design size and Save-as-PDF yields one slide per
     *  page with no margins. */
    _syncPrintPageRule() {
      const id = 'deck-stage-print-page';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
        document.head.appendChild(tag);
      }
      tag.textContent = '@page { size: ' + this.designWidth + 'px ' + this.designHeight + 'px; margin: 0; } ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; overflow: visible !important; height: auto !important; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }';
    }
    _onSlotChange() {
      this._collectSlides();
      this._restoreIndex();
      this._applyIndex({
        showOverlay: false,
        broadcast: true,
        reason: 'init'
      });
      this._fit();
    }
    _collectSlides() {
      const assigned = this._slot.assignedElements({
        flatten: true
      });
      this._slides = assigned.filter(el => {
        // Skip template/style/script nodes even if someone slots them.
        const tag = el.tagName;
        return tag !== 'TEMPLATE' && tag !== 'SCRIPT' && tag !== 'STYLE';
      });
      this._slides.forEach((slide, i) => {
        const n = i + 1;
        // Determine a label for comment flow: prefer explicit data-label,
        // then an existing data-screen-label, then first heading, else "Slide".
        let label = slide.getAttribute('data-label');
        if (!label) {
          const existing = slide.getAttribute('data-screen-label');
          if (existing) {
            // Strip any leading number the author may have included.
            label = existing.replace(/^\s*\d+\s*/, '').trim() || existing;
          }
        }
        if (!label) {
          const h = slide.querySelector('h1, h2, h3, [data-title]');
          if (h) label = (h.textContent || '').trim().slice(0, 40);
        }
        if (!label) label = 'Slide';
        slide.setAttribute('data-screen-label', `${pad2(n)} ${label}`);

        // Validation attribute for comment flow / auto-checks.
        if (!slide.hasAttribute('data-om-validate')) {
          slide.setAttribute('data-om-validate', VALIDATE_ATTR);
        }
        slide.setAttribute('data-deck-slide', String(i));
      });
      if (this._totalEl) this._totalEl.textContent = String(this._slides.length || 1);
      if (this._index >= this._slides.length) this._index = Math.max(0, this._slides.length - 1);
    }
    _loadNotes() {
      const tag = document.getElementById('speaker-notes');
      if (!tag) {
        this._notes = [];
        return;
      }
      try {
        const parsed = JSON.parse(tag.textContent || '[]');
        if (Array.isArray(parsed)) this._notes = parsed;
      } catch (e) {
        console.warn('[deck-stage] Failed to parse #speaker-notes JSON:', e);
        this._notes = [];
      }
    }
    _restoreIndex() {
      // The host's ?slide= param is delivered as a #<int> hash (1-indexed) on
      // the iframe src. No hash → slide 1; the deck itself keeps no position
      // state across loads.
      const h = (location.hash || '').match(/^#(\d+)$/);
      if (h) {
        const n = parseInt(h[1], 10) - 1;
        if (n >= 0 && n < this._slides.length) this._index = n;
      }
    }
    _applyIndex({
      showOverlay = true,
      broadcast = true,
      reason = 'init'
    } = {}) {
      if (!this._slides.length) return;
      const prev = this._prevIndex == null ? -1 : this._prevIndex;
      const curr = this._index;
      // Keep the iframe's own hash in sync so an in-iframe location.reload()
      // (reload banner path in viewer-handle.ts) lands on the current slide,
      // not the stale deep-link hash from initial load.
      try {
        history.replaceState(null, '', '#' + (curr + 1));
      } catch (e) {}
      this._slides.forEach((s, i) => {
        if (i === curr) s.setAttribute('data-deck-active', '');else s.removeAttribute('data-deck-active');
      });
      if (this._countEl) this._countEl.textContent = String(curr + 1);
      if (broadcast) {
        // (1) Legacy: host-window postMessage for speaker-notes renderers.
        try {
          window.postMessage({
            slideIndexChanged: curr
          }, '*');
        } catch (e) {}

        // (2) In-page CustomEvent on the <deck-stage> element itself.
        //     Bubbles and composes out of shadow DOM so slide code can listen:
        //       document.querySelector('deck-stage').addEventListener('slidechange', e => {
        //         e.detail.index, e.detail.previousIndex, e.detail.total, e.detail.slide, e.detail.reason
        //       });
        const detail = {
          index: curr,
          previousIndex: prev,
          total: this._slides.length,
          slide: this._slides[curr] || null,
          previousSlide: prev >= 0 ? this._slides[prev] || null : null,
          reason: reason // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
        };
        this.dispatchEvent(new CustomEvent('slidechange', {
          detail,
          bubbles: true,
          composed: true
        }));
      }
      this._prevIndex = curr;
      if (showOverlay) this._flashOverlay();
    }
    _flashOverlay() {
      if (!this._overlay) return;
      this._overlay.setAttribute('data-visible', '');
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        this._overlay.removeAttribute('data-visible');
      }, OVERLAY_HIDE_MS);
    }
    _fit() {
      if (!this._canvas) return;
      // PPTX export sets noscale so the DOM capture sees authored-size
      // geometry — the scaled canvas is in shadow DOM, so the exporter's
      // resetTransformSelector can't reach .canvas.style.transform directly.
      if (this.hasAttribute('noscale')) {
        this._canvas.style.transform = 'none';
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(vw / this.designWidth, vh / this.designHeight);
      this._canvas.style.transform = `scale(${s})`;
    }
    _onResize() {
      this._fit();
    }
    _onMouseMove() {
      // Keep overlay visible while mouse moves; hide after idle.
      this._flashOverlay();
    }
    _onTapBack(e) {
      e.preventDefault();
      this._go(this._index - 1, 'tap');
    }
    _onTapForward(e) {
      e.preventDefault();
      this._go(this._index + 1, 'tap');
    }
    _onKey(e) {
      // Ignore when the user is typing.
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      let handled = true;
      if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || key === 'Spacebar') {
        this._go(this._index + 1, 'keyboard');
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        this._go(this._index - 1, 'keyboard');
      } else if (key === 'Home') {
        this._go(0, 'keyboard');
      } else if (key === 'End') {
        this._go(this._slides.length - 1, 'keyboard');
      } else if (key === 'r' || key === 'R') {
        this._go(0, 'keyboard');
      } else if (/^[0-9]$/.test(key)) {
        // 1..9 jump to that slide; 0 jumps to 10.
        const n = key === '0' ? 9 : parseInt(key, 10) - 1;
        if (n < this._slides.length) this._go(n, 'keyboard');
      } else {
        handled = false;
      }
      if (handled) {
        e.preventDefault();
        this._flashOverlay();
      }
    }
    _go(i, reason = 'api') {
      if (!this._slides.length) return;
      const clamped = Math.max(0, Math.min(this._slides.length - 1, i));
      if (clamped === this._index) {
        this._flashOverlay();
        return;
      }
      this._index = clamped;
      this._applyIndex({
        showOverlay: true,
        broadcast: true,
        reason
      });
    }

    // Public API ------------------------------------------------------------

    /** Current slide index (0-based). */
    get index() {
      return this._index;
    }
    /** Total slide count. */
    get length() {
      return this._slides.length;
    }
    /** Programmatically navigate. */
    goTo(i) {
      this._go(i, 'api');
    }
    next() {
      this._go(this._index + 1, 'api');
    }
    prev() {
      this._go(this._index - 1, 'api');
    }
    reset() {
      this._go(0, 'api');
    }
  }
  if (!customElements.get('deck-stage')) {
    customElements.define('deck-stage', DeckStage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "deck-stage.js", error: String((e && e.message) || e) }); }

// design-canvas.jsx
try { (() => {
// DesignCanvas.jsx — Figma-ish design canvas wrapper
// Warm gray grid bg + Sections + Artboards + PostIt notes.
// No assets, no deps.

const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
};

// ─────────────────────────────────────────────────────────────
// Main canvas — transform-based pan/zoom viewport
//
// Input mapping (Figma-style):
//   • trackpad pinch  → zoom   (ctrlKey wheel; Safari gesture* events)
//   • trackpad scroll → pan    (two-finger)
//   • mouse wheel     → zoom   (notched; distinguished from trackpad scroll)
//   • middle-drag / primary-drag-on-bg → pan
//
// Transform state lives in a ref and is written straight to the DOM
// (translate3d + will-change) so wheel ticks don't go through React —
// keeps pans at 60fps on dense canvases.
// ─────────────────────────────────────────────────────────────
function DesignCanvas({
  children,
  minScale = 0.1,
  maxScale = 8,
  style = {}
}) {
  const vpRef = React.useRef(null);
  const worldRef = React.useRef(null);
  const tf = React.useRef({
    x: 0,
    y: 0,
    scale: 1
  });
  const apply = React.useCallback(() => {
    const {
      x,
      y,
      scale
    } = tf.current;
    const el = worldRef.current;
    if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);
  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const zoomAt = (cx, cy, factor) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left,
        py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      // keep the world point under the cursor fixed
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
    };

    // Mouse-wheel vs trackpad-scroll heuristic. A physical wheel sends
    // line-mode deltas (Firefox) or large integer pixel deltas with no X
    // component (Chrome/Safari, typically multiples of 100/120). Trackpad
    // two-finger scroll sends small/fractional pixel deltas, often with
    // non-zero deltaX. ctrlKey is set by the browser for trackpad pinch.
    const isMouseWheel = e => e.deltaMode !== 0 || e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40;
    const onWheel = e => {
      e.preventDefault();
      if (isGesturing) return; // Safari: gesture* owns the pinch — discard concurrent wheels
      if (e.ctrlKey) {
        // trackpad pinch (or explicit ctrl+wheel)
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        // notched mouse wheel — fixed-ratio step per click
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        // trackpad two-finger scroll — pan
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    // Safari sends native gesture* events for trackpad pinch with a smooth
    // e.scale; preferring these over the ctrl+wheel fallback gives a much
    // better feel there. No-ops on other browsers. Safari also fires
    // ctrlKey wheel events during the same pinch — isGesturing makes
    // onWheel drop those entirely so they neither zoom nor pan.
    let gsBase = 1;
    let isGesturing = false;
    const onGestureStart = e => {
      e.preventDefault();
      isGesturing = true;
      gsBase = tf.current.scale;
    };
    const onGestureChange = e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, gsBase * e.scale / tf.current.scale);
    };
    const onGestureEnd = e => {
      e.preventDefault();
      isGesturing = false;
    };

    // Drag-pan: middle button anywhere, or primary button starting on the
    // canvas background (not inside an artboard).
    let drag = null;
    const onPointerDown = e => {
      const onBg = e.target === vp || e.target === worldRef.current;
      if (!(e.button === 1 || e.button === 0 && onBg)) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = {
        id: e.pointerId,
        lx: e.clientX,
        ly: e.clientY
      };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = e => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };
    vp.addEventListener('wheel', onWheel, {
      passive: false
    });
    vp.addEventListener('gesturestart', onGestureStart, {
      passive: false
    });
    vp.addEventListener('gesturechange', onGestureChange, {
      passive: false
    });
    vp.addEventListener('gestureend', onGestureEnd, {
      passive: false
    });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
      vp.removeEventListener('gestureend', onGestureEnd);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply, minScale, maxScale]);
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;
  return /*#__PURE__*/React.createElement("div", {
    ref: vpRef,
    className: "design-canvas",
    style: {
      height: '100vh',
      width: '100vw',
      background: DC.bg,
      overflow: 'hidden',
      overscrollBehavior: 'none',
      touchAction: 'none',
      position: 'relative',
      fontFamily: DC.font,
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: worldRef,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      willChange: 'transform',
      width: 'max-content',
      minWidth: '100%',
      minHeight: '100%',
      padding: '60px 0 80px',
      backgroundImage: gridSvg,
      backgroundSize: '120px 120px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Section — title + subtitle + h-stack of artboards (no wrap)
// ─────────────────────────────────────────────────────────────
function DCSection({
  title,
  subtitle,
  children,
  gap = 48
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 80,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 60px 36px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 600,
      color: DC.title,
      letterSpacing: -0.3,
      marginBottom: 4
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 400,
      color: DC.subtitle
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      padding: '0 60px',
      alignItems: 'flex-start',
      width: 'max-content'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Artboard — labeled card
// ─────────────────────────────────────────────────────────────
function DCArtboard({
  label,
  children,
  width,
  height,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, label && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: '100%',
      left: 0,
      paddingBottom: 8,
      fontSize: 12,
      fontWeight: 500,
      color: DC.label,
      whiteSpace: 'nowrap'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      width,
      height,
      background: '#fff',
      ...style
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Post-it — absolute-positioned sticky note
// ─────────────────────────────────────────────────────────────
function DCPostIt({
  children,
  top,
  left,
  right,
  bottom,
  rotate = -2,
  width = 180
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width,
      background: DC.postitBg,
      padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14,
      lineHeight: 1.4,
      color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: `rotate(${rotate}deg)`,
      zIndex: 5
    }
  }, children);
}
Object.assign(window, {
  DesignCanvas,
  DCSection,
  DCArtboard,
  DCPostIt
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "design-canvas.jsx", error: String((e && e.message) || e) }); }

// journeys/intro.jsx
try { (() => {
// journeys/intro.jsx — Cover + System Overview

function CoverSlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    bg: J.inkDeep,
    label: "01 Cover"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(40 88% 42% / 0.18), transparent 60%)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'radial-gradient(circle, hsl(40 20% 97% / 0.04) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 48,
      left: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      color: 'hsl(40 18% 97%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 10,
      background: 'hsl(40 20% 97% / 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/hajime-logo.png",
    alt: "",
    style: {
      height: 38,
      width: 38,
      objectFit: 'contain',
      filter: 'brightness(0) invert(1)'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontWeight: 600,
      fontSize: 22,
      letterSpacing: '-.01em'
    }
  }, "Hajime"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '.18em',
      color: 'hsl(35 12% 55%)',
      marginTop: 2
    }
  }, "Supply Chain OS"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 56,
      right: 56,
      color: 'hsl(35 12% 55%)',
      fontSize: 11,
      fontFamily: J.mono,
      letterSpacing: '.1em'
    }
  }, "APR 2026 \xB7 DESIGN REVIEW"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 120,
      top: '50%',
      transform: 'translateY(-50%)',
      maxWidth: 1400,
      color: 'hsl(40 18% 97%)'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      color: 'hsl(40 88% 42%)',
      marginBottom: 24
    }
  }, "End-to-end role journeys"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: J.display,
      fontSize: 140,
      fontWeight: 600,
      letterSpacing: '-.028em',
      lineHeight: 0.98,
      margin: 0,
      color: 'hsl(40 18% 97%)'
    }
  }, "Five portals.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'hsl(40 88% 42%)',
      fontStyle: 'italic',
      fontWeight: 500
    }
  }, "One calm flow.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 22,
      lineHeight: 1.45,
      color: 'hsl(35 14% 78%)',
      maxWidth: '58ch',
      marginTop: 36,
      fontFamily: J.body
    }
  }, "A redesign of the Hajime Supply Chain OS journeys \u2014 Brand Operator, Manufacturer, Distributor, Sales Rep, Retail Store \u2014 with the cross-role handoffs treated as first-class moments rather than coincidences of the dataset."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 72,
      marginTop: 80,
      paddingTop: 32,
      borderTop: '1px solid hsl(35 12% 55% / 0.2)',
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 48,
      fontWeight: 600,
      color: 'hsl(40 88% 42%)',
      letterSpacing: '-.02em'
    }
  }, "5"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'hsl(35 12% 55%)',
      marginTop: 2
    }
  }, "Roles, redesigned")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 48,
      fontWeight: 600,
      color: 'hsl(40 88% 42%)',
      letterSpacing: '-.02em'
    }
  }, "14"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'hsl(35 12% 55%)',
      marginTop: 2
    }
  }, "Hi-fi screens")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 48,
      fontWeight: 600,
      color: 'hsl(40 88% 42%)',
      letterSpacing: '-.02em'
    }
  }, "1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'hsl(35 12% 55%)',
      marginTop: 2
    }
  }, "Shared dataset propagating in real time")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 48,
      left: 56,
      right: 56,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 11,
      fontFamily: J.mono,
      color: 'hsl(35 12% 55%)',
      letterSpacing: '.05em'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u306F\u3058\u3081 \xB7 the beginning"), /*#__PURE__*/React.createElement("span", null, "journey-redesign / 2026.04")));
}

// ─── 02 — System overview / the five portals ───────────────────
function OverviewSlide() {
  const roles = [{
    key: 'hq',
    ic: I.dashboard,
    label: 'Brand Operator (HQ)',
    who: 'Sora Okuda · Ops director',
    jobs: 'Approves, allocates, configures',
    sees: 'Everything'
  }, {
    key: 'manuf',
    ic: I.factory,
    label: 'Manufacturer',
    who: 'Imanishi-san · Yamato Distillery',
    jobs: 'Receives POs, ships finished cases',
    sees: 'Approved POs · packaging specs'
  }, {
    key: 'dist',
    ic: I.warehouse,
    label: 'Distributor',
    who: 'Léa Bardot · Vinexpo Paris',
    jobs: 'Receives stock, fulfills retail orders, reports depletions',
    sees: 'Inbound · on-hand · retail orders'
  }, {
    key: 'rep',
    ic: I.users,
    label: 'Sales Rep',
    who: 'Mike Tan · field rep, NYC',
    jobs: 'Drafts orders, runs visits, hits target',
    sees: 'Accounts · drafts · distributor stock'
  }, {
    key: 'retail',
    ic: I.store,
    label: 'Retail Store',
    who: 'Kazu · sake bar, Brooklyn',
    jobs: 'Reorders, tracks delivery',
    sees: 'Catalog · drafts · shipments'
  }];
  const journey = [{
    from: 'retail',
    to: 'rep',
    label: 'request'
  }, {
    from: 'rep',
    to: 'hq',
    label: 'submit'
  }, {
    from: 'hq',
    to: 'dist',
    label: 'allocate'
  }, {
    from: 'dist',
    to: 'retail',
    label: 'fulfill'
  }, {
    from: 'dist',
    to: 'hq',
    label: 'report depletion'
  }, {
    from: 'hq',
    to: 'manuf',
    label: 'replenish PO'
  }, {
    from: 'manuf',
    to: 'dist',
    label: 'ship cases'
  }];
  return /*#__PURE__*/React.createElement(Slide, {
    label: "02 System overview"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: J.ink,
    role: "System overview",
    stage: "The shared dataset",
    title: "Five portals, one calm flow",
    subtitle: "Each role sees a different slice of the same data. Every event one role creates is the next role's notification \u2014 no spreadsheets, no hand-offs by email, no week-late depletion data.",
    slideNo: "02",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '40px 56px',
      display: 'grid',
      gridTemplateColumns: '1.05fr 1.4fr',
      gap: 48,
      height: 880,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "The five portals"), roles.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.key,
    style: {
      display: 'grid',
      gridTemplateColumns: '48px 1fr',
      gap: 16,
      padding: '14px 16px',
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 10,
      background: ROLES[r.key].color + '18',
      color: ROLES[r.key].color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: r.ic,
    size: 22
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: J.display,
      fontSize: 18,
      fontWeight: 500,
      letterSpacing: '-.01em'
    }
  }, r.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: J.muted
    }
  }, "\xB7 ", r.who)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: J.muted,
      lineHeight: 1.45
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: J.ink
    }
  }, "Job:"), " ", r.jobs, /*#__PURE__*/React.createElement("span", {
    style: {
      margin: '0 8px',
      color: J.border
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: J.ink
    }
  }, "Sees:"), " ", r.sees))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 780
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 16
    }
  }, "How the dataset propagates"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 720
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 700 720",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("marker", {
    id: "ah",
    viewBox: "0 0 10 10",
    refX: "9",
    refY: "5",
    markerWidth: "7",
    markerHeight: "7",
    orient: "auto-start-reverse"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0,0 L10,5 L0,10 z",
    fill: J.gold
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M180,640 C 180,560 180,520 180,460",
    stroke: J.gold,
    strokeWidth: "1.5",
    fill: "none",
    markerEnd: "url(#ah)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "195",
    y: "555",
    fontSize: "12",
    fill: J.muted,
    fontFamily: J.mono
  }, "request"), /*#__PURE__*/React.createElement("path", {
    d: "M250,400 C 320,360 380,340 470,310",
    stroke: J.gold,
    strokeWidth: "1.5",
    fill: "none",
    markerEnd: "url(#ah)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "320",
    y: "335",
    fontSize: "12",
    fill: J.muted,
    fontFamily: J.mono
  }, "submit"), /*#__PURE__*/React.createElement("path", {
    d: "M520,360 C 520,440 510,500 500,540",
    stroke: J.gold,
    strokeWidth: "1.5",
    fill: "none",
    markerEnd: "url(#ah)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "535",
    y: "465",
    fontSize: "12",
    fill: J.muted,
    fontFamily: J.mono
  }, "allocate"), /*#__PURE__*/React.createElement("path", {
    d: "M450,620 C 360,650 290,660 240,660",
    stroke: J.gold,
    strokeWidth: "1.5",
    fill: "none",
    markerEnd: "url(#ah)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "320",
    y: "650",
    fontSize: "12",
    fill: J.muted,
    fontFamily: J.mono
  }, "fulfill"), /*#__PURE__*/React.createElement("path", {
    d: "M460,560 C 480,460 490,400 510,340",
    stroke: J.green,
    strokeWidth: "1.4",
    fill: "none",
    strokeDasharray: "4 4",
    markerEnd: "url(#ah)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "385",
    y: "455",
    fontSize: "12",
    fill: J.green,
    fontFamily: J.mono
  }, "depletion"), /*#__PURE__*/React.createElement("path", {
    d: "M510,260 C 470,190 410,140 340,110",
    stroke: J.gold,
    strokeWidth: "1.5",
    fill: "none",
    markerEnd: "url(#ah)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "380",
    y: "170",
    fontSize: "12",
    fill: J.muted,
    fontFamily: J.mono
  }, "replenish PO"), /*#__PURE__*/React.createElement("path", {
    d: "M310,160 C 380,260 430,400 470,520",
    stroke: J.gold,
    strokeWidth: "1.5",
    fill: "none",
    markerEnd: "url(#ah)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "265",
    y: "395",
    fontSize: "12",
    fill: J.muted,
    fontFamily: J.mono,
    transform: "rotate(75 265 395)"
  }, "ship cases")), /*#__PURE__*/React.createElement(RoleNode, {
    style: {
      top: 50,
      left: 240
    },
    role: "manuf",
    ic: I.factory,
    label: "Manufacturer"
  }), /*#__PURE__*/React.createElement(RoleNode, {
    style: {
      top: 240,
      left: 480
    },
    role: "hq",
    ic: I.dashboard,
    label: "HQ",
    emphasis: true
  }), /*#__PURE__*/React.createElement(RoleNode, {
    style: {
      top: 540,
      left: 440
    },
    role: "dist",
    ic: I.warehouse,
    label: "Distributor"
  }), /*#__PURE__*/React.createElement(RoleNode, {
    style: {
      top: 610,
      left: 130
    },
    role: "retail",
    ic: I.store,
    label: "Retail"
  }), /*#__PURE__*/React.createElement(RoleNode, {
    style: {
      top: 380,
      left: 120
    },
    role: "rep",
    ic: I.users,
    label: "Sales Rep"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 16,
      background: J.surface,
      borderRadius: 10,
      fontSize: 13,
      lineHeight: 1.5,
      color: J.ink,
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: J.green,
      fontWeight: 600
    }
  }, "Depletion"), " closes the loop. It's the move spirits brands lose without a shared dataset. We treat it as a first-class event, not a monthly export."))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: J.ink
  }));
}
function RoleNode({
  role,
  ic,
  label,
  emphasis,
  style
}) {
  const c = ROLES[role].color;
  const size = emphasis ? 84 : 68;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      width: size,
      height: size,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: emphasis ? c : c + '18',
      color: emphasis ? J.paper : c,
      border: emphasis ? 'none' : `2px solid ${c}40`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: emphasis ? `0 4px 24px ${c}40` : 'none'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: ic,
    size: emphasis ? 34 : 28,
    stroke: 1.4
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: size + 8,
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 12,
      fontWeight: 500,
      color: J.ink,
      whiteSpace: 'nowrap',
      fontFamily: J.body
    }
  }, label));
}
Object.assign(window, {
  CoverSlide,
  OverviewSlide
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "journeys/intro.jsx", error: String((e && e.message) || e) }); }

// journeys/role-dist.jsx
try { (() => {
// journeys/role-dist.jsx — Distributor (depletion loop)
const DT = ROLES.dist;
function DistContextSlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    label: "08 Distributor \xB7 Context"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: DT.color,
    role: "Distributor",
    stage: "Context \xB7 Vinexpo Paris",
    title: "The depletion report doesn't exist yet \u2014 and it's the whole product",
    subtitle: "L\xE9a Bardot fulfills retail orders all day; the platform is currently invisible to her once she's checked inbound. The differentiator \u2014 depletion data flowing back to HQ \u2014 has no UI for the role that owns it.",
    slideNo: "08",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '40px 56px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Persona"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 24,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      background: DT.color + '22',
      color: DT.color,
      fontFamily: J.display,
      fontSize: 24,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, "LB"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, "L\xE9a Bardot"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: J.muted
    }
  }, "Warehouse manager \xB7 Vinexpo Paris"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      paddingTop: 18,
      borderTop: `1px solid ${J.borderQ}`,
      fontFamily: J.display,
      fontSize: 18,
      fontWeight: 400,
      fontStyle: 'italic',
      lineHeight: 1.4
    }
  }, "\"Reporting depletion is the favor I do for the brand. Make it a side-effect of my real work.\""), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Pain points"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '10px 0 0',
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(PainItem, {
    text: "Depletion is a manual export \u2014 happens monthly at best, never granular"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "Receiving against a PO is a different page than fulfilling a retail order \u2014 context-switch all day"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "Out-of-stock at fulfillment time \u2192 an angry email to the rep, no platform path"
  }))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "The depletion loop \u2014 why it matters"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 24,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '-.01em',
      lineHeight: 1.4
    }
  }, "Most spirits brands lose visibility once product leaves their hands. Sell-in is logged; sell-through is rumor. Hajime closes that loop \u2014 but only if the distributor surface earns the report rather than asking for it."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      padding: 18,
      background: 'hsl(158 56% 36% / 0.06)',
      border: `1px solid hsl(158 56% 36% / 0.2)`,
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      color: J.green
    }
  }, "Design move"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 1.55,
      color: J.ink
    }
  }, "Every fulfillment is a depletion event. Every receipt is an inflow event. The Depletion Report is", /*#__PURE__*/React.createElement("strong", null, " read-only and live"), " \u2014 L\xE9a never \"reports\", the system reports for her, and she annotates only what's surprising.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, [['IN', 'Receive cases against PO', 'automatic stock movement'], ['OUT', 'Fulfill retail order', 'automatic depletion event'], ['ADJ', 'Annotate surprises', 'breakage, samples, unusual draws'], ['↑', 'HQ sees real sell-through', 'same hour, same dataset']].map(([n, t, d]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'grid',
      gridTemplateColumns: '40px 1fr',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: DT.color,
      fontWeight: 600,
      padding: '4px 8px',
      background: DT.color + '18',
      borderRadius: 6,
      textAlign: 'center'
    }
  }, n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 500
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: J.muted,
      marginLeft: 8
    }
  }, "\xB7 ", d)))))))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: DT.color
  }));
}

// ═══════════════════════════════════════════════════════════════
// 09 — Distributor: depletion live + fulfill flow
// ═══════════════════════════════════════════════════════════════
function DistDepletionSlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    label: "09 Distributor \xB7 Depletion live"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: DT.color,
    role: "Distributor",
    stage: "Screen 01 \xB7 Floor + depletion",
    title: "One screen for floor work and the depletion loop",
    subtitle: "Left: today's pick queue \u2014 fulfillments that are also depletion events. Right: a live depletion ledger L\xE9a never has to compile, but can annotate when something surprises her.",
    slideNo: "09",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 56px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: J.paper,
      border: `1px solid ${J.border}`,
      borderRadius: 18,
      height: 820,
      overflow: 'hidden',
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 8px 32px hsl(24 10% 10% / .08)'
    }
  }, /*#__PURE__*/React.createElement(DistTopbar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      height: 760
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: `1px solid ${J.borderQ}`,
      padding: '20px 22px',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Today's pick queue"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '-.01em',
      marginTop: 4
    }
  }, "8 retail orders \xB7 312 cases \xB7 cut-off 14:00")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "outline",
    size: "sm",
    icon: I.scan
  }, "Scan"), /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "sm",
    icon: I.check
  }, "Confirm picks"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(PickRow, {
    store: "Dante \xB7 Greenwich Village",
    sku: "JP-2024-001",
    cs: 18,
    bin: "A-12",
    eta: "11:00",
    status: "pickable"
  }), /*#__PURE__*/React.createElement(PickRow, {
    store: "Katana Kitten \xB7 LES",
    sku: "JP-2024-001",
    cs: 6,
    bin: "A-12",
    eta: "11:00",
    status: "pickable",
    note: "Split \u2014 6 from on-hand"
  }), /*#__PURE__*/React.createElement(PickRow, {
    store: "Mace \xB7 Hudson",
    sku: "JP-2024-002",
    cs: 8,
    bin: "A-14",
    eta: "12:30",
    status: "pickable"
  }), /*#__PURE__*/React.createElement(PickRow, {
    store: "Bar Suntory \xB7 5th",
    sku: "JP-2023-007",
    cs: 4,
    bin: "A-09",
    eta: "12:30",
    status: "short",
    note: "Only 2 on hand \xB7 escalate?"
  }), /*#__PURE__*/React.createElement(PickRow, {
    store: "Liquid Gold \xB7 Brooklyn",
    sku: "EU-2024-002",
    cs: 12,
    bin: "B-04",
    eta: "13:00",
    status: "pickable"
  }), /*#__PURE__*/React.createElement(PickRow, {
    store: "Sazerac SG \xB7 Park",
    sku: "JP-2024-001",
    cs: 24,
    bin: "A-12",
    eta: "13:00",
    status: "pickable",
    muted: true
  }), /*#__PURE__*/React.createElement(PickRow, {
    store: "Empire Wines \xB7 Madison",
    sku: "EU-2024-002",
    cs: 36,
    bin: "B-04",
    eta: "14:00",
    status: "pickable",
    muted: true
  }), /*#__PURE__*/React.createElement(PickRow, {
    store: "Park Ave Liquors",
    sku: "JP-2024-001",
    cs: 6,
    bin: "A-12",
    eta: "14:00",
    status: "pickable",
    muted: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 22px',
      overflow: 'auto',
      background: J.paper2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Depletion \xB7 live"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '-.01em',
      marginTop: 4
    }
  }, "7 events today \xB7 84 cases out")), /*#__PURE__*/React.createElement(Pill, {
    tone: "green",
    dot: true
  }, "HQ in sync \xB7 12s ago")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "This week \xB7 cases out per day"), /*#__PURE__*/React.createElement(DepletionChart, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      fontFamily: J.mono,
      color: J.muted,
      marginTop: 6
    }
  }, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => /*#__PURE__*/React.createElement("span", {
    key: d
  }, d)))), /*#__PURE__*/React.createElement(Eyebrow, null, "Live ledger"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 12,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(LedgerRow, {
    t: "11:42",
    sku: "JP-2024-001",
    cs: 18,
    dest: "Dante",
    type: "out"
  }), /*#__PURE__*/React.createElement(LedgerRow, {
    t: "11:38",
    sku: "JP-2024-001",
    cs: 6,
    dest: "Katana Kitten",
    type: "out"
  }), /*#__PURE__*/React.createElement(LedgerRow, {
    t: "11:14",
    sku: "EU-2024-002",
    cs: 12,
    dest: "Liquid Gold",
    type: "out"
  }), /*#__PURE__*/React.createElement(LedgerRow, {
    t: "10:02",
    sku: "JP-2024-001",
    cs: 2,
    dest: "Sample \xB7 staff tasting",
    type: "adj",
    note: true
  }), /*#__PURE__*/React.createElement(LedgerRow, {
    t: "09:30",
    sku: "EU-2024-002",
    cs: 240,
    dest: "PO #0407 \xB7 received",
    type: "in"
  }), /*#__PURE__*/React.createElement(LedgerRow, {
    t: "09:18",
    sku: "JP-2023-007",
    cs: 4,
    dest: "Mace",
    type: "out"
  }), /*#__PURE__*/React.createElement(LedgerRow, {
    t: "08:54",
    sku: "JP-2024-001",
    cs: 1,
    dest: "Breakage \xB7 annotate?",
    type: "adj",
    pending: true,
    last: true
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      marginTop: 18,
      fontSize: 12,
      color: J.muted
    }
  }, /*#__PURE__*/React.createElement(Annotation, {
    n: "A",
    text: "Picks and depletions are the same event \u2014 confirming a pick writes to HQ instantly."
  }), /*#__PURE__*/React.createElement(Annotation, {
    n: "B",
    text: "The ledger is the report. No 'submit depletion' button \u2014 L\xE9a annotates surprises only."
  }), /*#__PURE__*/React.createElement(Annotation, {
    n: "C",
    text: "Short-stock row escalates inline to the rep + HQ; no out-of-band emails."
  }))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: DT.color
  }));
}
function DistTopbar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      borderBottom: `1px solid ${J.borderQ}`,
      background: 'hsl(40 20% 99%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: DT.color,
      color: J.paper,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.warehouse,
    size: 16
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.1
    }
  }, "Vinexpo Paris"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: J.muted,
      letterSpacing: '.1em',
      textTransform: 'uppercase'
    }
  }, "Distributor"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: DT.color,
      fontWeight: 600,
      borderBottom: `2px solid ${DT.color}`,
      paddingBottom: 18
    }
  }, "Floor"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: J.muted,
      paddingBottom: 18
    }
  }, "Inbound"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: J.muted,
      paddingBottom: 18
    }
  }, "Reports")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Avatar, {
    initials: "LB",
    tone: "paper"
  }));
}
function PickRow({
  store,
  sku,
  cs,
  bin,
  eta,
  status,
  note,
  muted
}) {
  const sCol = status === 'short' ? J.amber : J.green;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto auto auto',
      gap: 14,
      padding: '12px 14px',
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 10,
      alignItems: 'center',
      opacity: muted ? .7 : 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 6,
      background: sCol + '18',
      color: sCol,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: status === 'short' ? I.alert : I.check,
    size: 14
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, store), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontFamily: J.mono,
      marginTop: 2
    }
  }, sku, " \xB7 bin ", bin, note ? ` · ${note}` : '')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, cs, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontWeight: 400,
      fontFamily: J.body,
      marginLeft: 3
    }
  }, "cs")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontFamily: J.mono
    }
  }, eta), /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    size: "sm",
    icon: I.more
  }));
}
function LedgerRow({
  t,
  sku,
  cs,
  dest,
  type,
  note,
  pending,
  last
}) {
  const tones = {
    out: {
      c: J.red,
      label: 'OUT',
      bg: 'hsl(0 68% 48% / 0.08)'
    },
    in: {
      c: J.green,
      label: 'IN',
      bg: 'hsl(158 56% 36% / 0.08)'
    },
    adj: {
      c: J.amber,
      label: 'ADJ',
      bg: 'hsl(38 90% 50% / 0.12)'
    }
  };
  const tt = tones[type];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '52px auto 1fr auto',
      gap: 12,
      padding: '11px 14px',
      borderBottom: last ? 'none' : `1px solid ${J.borderQ}`,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: J.muted
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      fontFamily: J.mono,
      padding: '2px 6px',
      background: tt.bg,
      color: tt.c,
      borderRadius: 4,
      letterSpacing: '.04em'
    }
  }, tt.label), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: J.ink,
      fontWeight: 500,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, dest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: J.muted
    }
  }, sku)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: J.display,
      fontSize: 16,
      fontWeight: 600,
      color: type === 'in' ? J.green : type === 'out' ? J.ink : J.amber
    }
  }, type === 'in' ? '+' : '-', cs), pending && /*#__PURE__*/React.createElement(Pill, {
    tone: "amber",
    dot: true
  }, "Annotate")));
}
function DepletionChart() {
  const data = [42, 38, 56, 71, 84, 28, 0];
  const max = 100;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 280 80",
    style: {
      width: '100%',
      height: 80,
      marginTop: 8
    }
  }, data.map((v, i) => {
    const h = v / max * 70;
    const x = i * 40 + 6;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("rect", {
      x: x,
      y: 75 - h,
      width: 28,
      height: h,
      rx: 3,
      fill: i === 4 ? DT.color : DT.color + '66'
    }), i === 4 && /*#__PURE__*/React.createElement("text", {
      x: x + 14,
      y: 75 - h - 4,
      fontSize: "9",
      fill: DT.color,
      textAnchor: "middle",
      fontFamily: J.mono,
      fontWeight: "600"
    }, v));
  }), /*#__PURE__*/React.createElement("line", {
    x1: "0",
    y1: "75",
    x2: "280",
    y2: "75",
    stroke: J.border
  }));
}
Object.assign(window, {
  DistContextSlide,
  DistDepletionSlide
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "journeys/role-dist.jsx", error: String((e && e.message) || e) }); }

// journeys/role-hq.jsx
try { (() => {
// journeys/role-hq.jsx — Brand Operator HQ journey
// Anchor scenario: Monday morning approval week. SR drafts pile up over the
// weekend; HQ needs to triage, allocate, and approve before distributors can pick.

const HQ = ROLES.hq;

// ─── Compact dark sidebar (re-usable across all HQ slides) ──────
function HqSidebar({
  active = 'Approvals queue'
}) {
  const nav = [{
    l: 'Command center',
    i: I.dashboard
  }, {
    l: 'Approvals queue',
    i: I.check,
    badge: 7
  }, {
    l: 'Global markets',
    i: I.globe
  }, {
    l: 'Inventory',
    i: I.package
  }, {
    l: 'Orders',
    i: I.cart
  }, {
    l: 'Logistics',
    i: I.truck
  }, {
    l: 'Manufacturing',
    i: I.factory
  }, {
    l: 'Partners',
    i: I.users
  }, {
    l: 'Reports',
    i: I.chart
  }];
  const nav2 = [{
    l: 'Alerts hub',
    i: I.alert,
    badge: 4
  }, {
    l: 'Settings',
    i: I.settings
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: J.inkDeep,
      color: 'hsl(35 12% 78%)',
      padding: '18px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      borderRight: '1px solid hsl(24 10% 15%)',
      height: '100%',
      width: 240,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: 'hsl(24 10% 13% / 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/hajime-logo.png",
    alt: "",
    style: {
      height: 26,
      width: 26,
      objectFit: 'contain',
      filter: 'brightness(0) invert(1)'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontWeight: 600,
      fontSize: 16,
      color: 'hsl(35 14% 90%)',
      lineHeight: 1
    }
  }, "Hajime"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: '.18em',
      color: 'hsl(35 12% 55%)',
      marginTop: 3
    }
  }, "Brand HQ"))), /*#__PURE__*/React.createElement(SidebarGroup, {
    label: "Operations",
    items: nav,
    active: active
  }), /*#__PURE__*/React.createElement(SidebarGroup, {
    label: "Monitoring",
    items: nav2,
    active: active
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderTop: '1px solid hsl(24 10% 15%)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    initials: "SO"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'hsl(35 14% 90%)',
      lineHeight: 1.3
    }
  }, "Sora Okuda", /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'hsl(35 12% 50%)',
      fontSize: 10
    }
  }, "Ops director"))));
}
function SidebarGroup({
  label,
  items,
  active
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 10px',
      fontSize: 10,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      color: 'hsl(35 12% 78% / .4)'
    }
  }, label), items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.l,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 6,
      fontSize: 13,
      background: it.l === active ? 'hsl(24 10% 13%)' : 'transparent',
      color: it.l === active ? J.gold : 'hsl(35 12% 78% / .72)',
      fontWeight: it.l === active ? 500 : 400
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: it.i,
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, it.l), it.badge != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontFamily: J.mono,
      color: J.gold,
      background: 'hsl(40 88% 42% / 0.12)',
      padding: '1px 6px',
      borderRadius: 999
    }
  }, it.badge))));
}
function HqTopbar({
  title,
  breadcrumb,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 16,
      background: 'hsl(40 20% 99% / 0.85)',
      backdropFilter: 'blur(12px) saturate(1.4)',
      borderBottom: `1px solid ${J.borderQ}`,
      position: 'sticky',
      top: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 13
    }
  }, breadcrumb && breadcrumb.map((b, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: J.muted
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: i === breadcrumb.length - 1 ? J.ink : J.muted,
      fontWeight: i === breadcrumb.length - 1 ? 500 : 400
    }
  }, b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 12px',
      height: 34,
      background: J.surface,
      borderRadius: 8,
      color: J.muted,
      fontSize: 13,
      width: 280
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.search,
    size: 14
  }), " Search\u2026"), right, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: J.muted,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.bell,
    size: 15
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      right: 9,
      width: 6,
      height: 6,
      borderRadius: 999,
      background: J.gold,
      border: `1.5px solid ${J.paper}`
    }
  })));
}

// ═══════════════════════════════════════════════════════════════
// 03 — HQ context: pain ladder + persona
// ═══════════════════════════════════════════════════════════════
function HqContextSlide() {
  const pains = [{
    ic: I.alert,
    title: 'Approvals scattered across modules',
    detail: 'Drafts from sales reps, distributor restock requests, and POs to manufacturer all live on different tabs. Triage requires three-tab juggling.'
  }, {
    ic: I.clock,
    title: 'Blocking states are invisible',
    detail: 'When HQ holds an order, neither rep nor distributor learns the reason — escalations pile up by email.'
  }, {
    ic: I.bell,
    title: 'Alert fatigue',
    detail: 'Every dataset change is its own notification. Seven alerts can mean one operational issue or seven.'
  }, {
    ic: I.refresh,
    title: 'No single source for "what needs me today"',
    detail: 'Sora\'s morning is reconstructed from memory and Slack threads.'
  }];
  const opps = ['A unified Approvals queue — drafts, holds, requests, and POs in one stream', 'Decision view: every queue item shows its consequence (who is waiting on this) up front', 'Alert grouping by root cause, not by event', 'A "Today" command center anchored to what only Sora can move'];
  return /*#__PURE__*/React.createElement(Slide, {
    label: "03 HQ \xB7 Context"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: HQ.color,
    role: "Brand Operator \xB7 HQ",
    stage: "Context \xB7 Monday 8:14am",
    title: "Sora arrives to 47 things demanding her attention",
    subtitle: "Anchor scenario: Monday morning approval week. Drafts piled up over the weekend \u2014 three from a tasting trip in Brooklyn, a distributor restock from Paris, two replenishment POs. Today's job is to unblock everyone before noon.",
    slideNo: "03",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '40px 56px',
      display: 'grid',
      gridTemplateColumns: '1fr 1.05fr',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Persona"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: 28,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 72,
      height: 72,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, hsl(40 60% 86%), hsl(30 70% 80%))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: J.display,
      fontSize: 28,
      fontWeight: 600,
      color: 'hsl(40 88% 25%)'
    }
  }, "SO"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, "Sora Okuda"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: J.muted,
      marginTop: 2
    }
  }, "Operations director \xB7 Hajime HQ, Tokyo"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement(Detail, {
    label: "Years on team",
    value: "6"
  }), /*#__PURE__*/React.createElement(Detail, {
    label: "Markets owned",
    value: "12"
  }), /*#__PURE__*/React.createElement(Detail, {
    label: "Reports to",
    value: "Founder"
  }), /*#__PURE__*/React.createElement(Detail, {
    label: "Daily tools",
    value: "Hajime \xB7 Slack \xB7 Notion"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      paddingTop: 20,
      borderTop: `1px solid ${J.borderQ}`
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Goals on a typical week"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '10px 0 0',
      paddingLeft: 18,
      fontSize: 14,
      lineHeight: 1.7,
      color: J.ink
    }
  }, /*#__PURE__*/React.createElement("li", null, "Clear the queue before noon \u2014 distributors can't pick until she does"), /*#__PURE__*/React.createElement("li", null, "Spot the market that's drifting before it becomes a stockout"), /*#__PURE__*/React.createElement("li", null, "Keep manufacturer cadence steady; never run safety stock to zero"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      padding: 14,
      background: 'hsl(40 88% 42% / 0.06)',
      border: '1px solid hsl(40 88% 42% / 0.18)',
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.5,
      color: J.ink,
      fontStyle: 'italic',
      fontFamily: J.display,
      fontWeight: 400,
      fontSize: 15
    }
  }, "\"I don't need more dashboards. I need to know what only I can move.\"")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Pain points today"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, pains.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '40px 1fr',
      gap: 14,
      padding: '14px 16px',
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: 'hsl(0 68% 48% / 0.08)',
      color: J.red,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: p.ic,
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: J.ink
    }
  }, p.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: J.muted,
      lineHeight: 1.5,
      marginTop: 2
    }
  }, p.detail))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Opportunities we're attacking"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '12px 0 0',
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, opps.map((o, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '24px 1fr',
      gap: 12,
      fontSize: 14,
      lineHeight: 1.5,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: HQ.color + '18',
      color: HQ.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 600,
      fontFamily: J.mono,
      marginTop: 1
    }
  }, i + 1), /*#__PURE__*/React.createElement("span", null, o))))))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: HQ.color
  }));
}
function Detail({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      color: J.muted,
      fontWeight: 500
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: J.ink,
      marginTop: 2
    }
  }, value));
}

// ═══════════════════════════════════════════════════════════════
// 04 — HQ "Today" command center (NEW pattern)
// ═══════════════════════════════════════════════════════════════
function HqTodaySlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    label: "04 HQ \xB7 Today command center"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: HQ.color,
    role: "Brand Operator \xB7 HQ",
    stage: "Screen 01 \xB7 Today",
    title: "A command center that opens with what only she can move",
    subtitle: "Replaces the metrics-first dashboard. Three vertical bands: queue \xB7 markets needing attention \xB7 supply rhythm. Numbers stay important but step behind decisions.",
    slideNo: "04",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 56px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gap: 0,
      border: `1px solid ${J.border}`,
      borderRadius: 18,
      overflow: 'hidden',
      height: 820,
      background: J.paper,
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 8px 32px hsl(24 10% 10% / .08)'
    }
  }, /*#__PURE__*/React.createElement(HqSidebar, {
    active: "Command center"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      background: J.paper
    }
  }, /*#__PURE__*/React.createElement(HqTopbar, {
    breadcrumb: ['Command center', 'Today'],
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
      variant: "outline",
      size: "sm",
      icon: I.calendar || I.clock
    }, "Mon \xB7 Apr 27"), /*#__PURE__*/React.createElement(Btn, {
      variant: "primary",
      size: "sm",
      icon: I.plus
    }, "New PO"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 32px',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: J.display,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, "Good morning, Sora"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: J.muted,
      margin: '4px 0 0'
    }
  }, "Seven items are waiting on you. Three blockers \u2014 eleven people downstream.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Pill, {
    tone: "amber",
    dot: true
  }, "3 blockers"), /*#__PURE__*/React.createElement(Pill, {
    tone: "gold",
    dot: true
  }, "7 awaiting you"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Awaiting you",
    sub: "7 items \xB7 sorted by people downstream",
    tone: "gold"
  }), /*#__PURE__*/React.createElement(ApprovalRow, {
    rank: "01",
    tone: "red",
    title: "3 SR drafts \xB7 Brooklyn tasting trip",
    meta: "Mike Tan \xB7 awaiting reallocation",
    downstream: "11 ppl downstream",
    act: "Triage"
  }), /*#__PURE__*/React.createElement(ApprovalRow, {
    rank: "02",
    tone: "amber",
    title: "Distributor restock \xB7 Vinexpo Paris",
    meta: "142 cases \xB7 ETA risk if not by 11am",
    downstream: "2 distributors waiting",
    act: "Approve"
  }), /*#__PURE__*/React.createElement(ApprovalRow, {
    rank: "03",
    tone: "amber",
    title: "PO #2026-0418 \xB7 Yamato Distillery",
    meta: "Lead time 21d \xB7 safety stock breach in 6d",
    downstream: "Manufacturer queued",
    act: "Sign"
  }), /*#__PURE__*/React.createElement(ApprovalRow, {
    rank: "04",
    tone: "stone",
    title: "Reorder \xB7 Liquid Gold, NYC",
    meta: "Repeat customer \xB7 auto-priced",
    downstream: "1 store waiting",
    act: "Approve"
  }), /*#__PURE__*/React.createElement(ApprovalRow, {
    rank: "05",
    tone: "stone",
    title: "Allocation override \xB7 Tokyo airport",
    meta: "Sales rep flagged conflict",
    downstream: "1 dispute",
    act: "Decide",
    last: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Markets drifting",
    sub: "3 of 12 \xB7 live signals",
    tone: "amber"
  }), /*#__PURE__*/React.createElement(MarketRow, {
    code: "SG",
    name: "Singapore",
    delta: "+18%",
    cover: "22d",
    tone: "amber",
    msg: "Sell-through climbing \u2014 cover dropping fast"
  }), /*#__PURE__*/React.createElement(MarketRow, {
    code: "KR",
    name: "South Korea",
    delta: "+24%",
    cover: "19d",
    tone: "amber",
    msg: "Hits safety stock in 14d at this pace"
  }), /*#__PURE__*/React.createElement(MarketRow, {
    code: "UK",
    name: "United Kingdom",
    delta: "-7%",
    cover: "78d",
    tone: "blue",
    msg: "Overstocked \u2014 pause next PO?"
  }), /*#__PURE__*/React.createElement(MarketRow, {
    code: "DE",
    name: "Germany",
    delta: "-2%",
    cover: "82d",
    tone: "stone",
    msg: "Soft, not yet alert",
    last: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Supply rhythm",
    sub: "Next 14 days",
    tone: "green"
  }), /*#__PURE__*/React.createElement(RhythmRow, {
    when: "Tue Apr 28",
    what: "Yamato \u2192 Vinexpo",
    detail: "2,400 cases \xB7 in transit"
  }), /*#__PURE__*/React.createElement(RhythmRow, {
    when: "Wed Apr 29",
    what: "PO #0411 lands",
    detail: "HK distributor \xB7 custom clear"
  }), /*#__PURE__*/React.createElement(RhythmRow, {
    when: "Thu Apr 30",
    what: "Depletion sync",
    detail: "11 markets \xB7 auto"
  }), /*#__PURE__*/React.createElement(RhythmRow, {
    when: "Mon May  4",
    what: "PO #0418 ships",
    detail: "Replenish JP, KR",
    last: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Open orders",
    value: "184",
    tone: "stone",
    trend: 4,
    icon: I.cart
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Cases in transit",
    value: "2,840",
    tone: "gold",
    sub: "14 routes",
    icon: I.truck
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Sell-through 30d",
    value: "86%",
    tone: "green",
    trend: 3,
    icon: I.trendUp
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Stockout risk",
    value: "3",
    tone: "warm",
    sub: "markets",
    icon: I.alert
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      marginTop: 18,
      fontSize: 12,
      color: J.muted
    }
  }, /*#__PURE__*/React.createElement(Annotation, {
    n: "A",
    text: "Queue is sorted by downstream impact, not date \u2014 eleven-people-blocked floats above the single-store reorder."
  }), /*#__PURE__*/React.createElement(Annotation, {
    n: "B",
    text: "Each market row is a one-line status, not a chart \u2014 click to drill into Global Markets."
  }), /*#__PURE__*/React.createElement(Annotation, {
    n: "C",
    text: "Supply rhythm replaces the static chart with a fourteen-day time horizon she actually plans against."
  }))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: HQ.color
  }));
}
function SectionHead({
  title,
  sub,
  tone
}) {
  const c = tone === 'gold' ? J.gold : tone === 'amber' ? J.amber : tone === 'green' ? J.green : J.muted;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${J.borderQ}`,
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: c
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: J.display,
      fontSize: 16,
      fontWeight: 500,
      letterSpacing: '-.01em'
    }
  }, title)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontFamily: J.body
    }
  }, sub));
}
function ApprovalRow({
  rank,
  tone,
  title,
  meta,
  downstream,
  act,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '40px 1fr auto',
      gap: 12,
      padding: '14px 18px',
      borderBottom: last ? 'none' : `1px solid ${J.borderQ}`,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: J.muted
    }
  }, rank), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: tone === 'red' ? J.red : tone === 'amber' ? J.amber : 'hsl(30 10% 55%)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: J.ink
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: J.muted,
      marginBottom: 2
    }
  }, meta), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: tone === 'red' ? J.red : J.muted,
      fontFamily: J.mono,
      letterSpacing: '.02em'
    }
  }, downstream)), /*#__PURE__*/React.createElement(Btn, {
    variant: tone === 'red' ? 'primary' : 'outline',
    size: "sm"
  }, act));
}
function MarketRow({
  code,
  name,
  delta,
  cover,
  tone,
  msg,
  last
}) {
  const c = tone === 'amber' ? J.amber : tone === 'blue' ? J.blue : 'hsl(30 10% 55%)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: last ? 'none' : `1px solid ${J.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: J.muted,
      padding: '1px 6px',
      background: J.surface,
      borderRadius: 4,
      letterSpacing: '.02em'
    }
  }, code), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, name)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      fontSize: 11,
      fontFamily: J.mono
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: delta.startsWith('+') ? J.green : J.red,
      fontWeight: 600
    }
  }, delta), /*#__PURE__*/React.createElement("span", {
    style: {
      color: c,
      fontWeight: 600
    }
  }, cover))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: J.muted,
      lineHeight: 1.4
    }
  }, msg));
}
function RhythmRow({
  when,
  what,
  detail,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: last ? 'none' : `1px solid ${J.borderQ}`,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: J.muted,
      minWidth: 84,
      letterSpacing: '.02em'
    }
  }, when), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: J.ink,
      marginBottom: 2
    }
  }, what), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: J.muted
    }
  }, detail)));
}
function Annotation({
  n,
  text
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      maxWidth: 380
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: J.ink,
      color: J.paper,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 600,
      fontFamily: J.mono,
      flexShrink: 0,
      marginTop: 1
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.5
    }
  }, text));
}
Object.assign(window, {
  HqContextSlide,
  HqTodaySlide,
  HqSidebar,
  HqTopbar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "journeys/role-hq.jsx", error: String((e && e.message) || e) }); }

// journeys/role-hq2.jsx
try { (() => {
// journeys/role-hq2.jsx — HQ approvals queue (deep), alerts hub
const HQ2 = ROLES.hq;

// ═══════════════════════════════════════════════════════════════
// 05 — HQ Approvals queue (the unified inbox)
// ═══════════════════════════════════════════════════════════════
function HqApprovalsSlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    label: "05 HQ \xB7 Approvals queue"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: HQ2.color,
    role: "Brand Operator \xB7 HQ",
    stage: "Screen 02 \xB7 Approvals queue",
    title: "One queue. Every blocker, every type, ranked by who's waiting.",
    subtitle: "New surface. SR drafts, distributor restocks, manufacturer POs and allocation conflicts merge into a single triage stream. Each row carries its consequence \u2014 who unblocks when she clicks.",
    slideNo: "05",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 56px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gap: 0,
      border: `1px solid ${J.border}`,
      borderRadius: 18,
      overflow: 'hidden',
      height: 820,
      background: J.paper,
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 8px 32px hsl(24 10% 10% / .08)'
    }
  }, /*#__PURE__*/React.createElement(HqSidebar, {
    active: "Approvals queue"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      background: J.paper
    }
  }, /*#__PURE__*/React.createElement(HqTopbar, {
    breadcrumb: ['Approvals queue', 'Open · 7'],
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
      variant: "outline",
      size: "sm",
      icon: I.filter
    }, "Filter"), /*#__PURE__*/React.createElement(Btn, {
      variant: "primary",
      size: "sm"
    }, "Bulk approve \xB7 4"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '14px 32px',
      borderBottom: `1px solid ${J.borderQ}`,
      background: J.paper2
    }
  }, /*#__PURE__*/React.createElement(FilterChip, {
    active: true
  }, "All \xB7 7"), /*#__PURE__*/React.createElement(FilterChip, null, "SR drafts \xB7 3"), /*#__PURE__*/React.createElement(FilterChip, null, "Distributor \xB7 2"), /*#__PURE__*/React.createElement(FilterChip, null, "Manufacturer \xB7 1"), /*#__PURE__*/React.createElement(FilterChip, null, "Conflicts \xB7 1"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontFamily: J.mono
    }
  }, "SORT"), /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    size: "sm",
    iconR: I.down
  }, "People downstream")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '440px 1fr',
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: `1px solid ${J.borderQ}`,
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement(QueueGroup, {
    label: "Critical \xB7 1"
  }, /*#__PURE__*/React.createElement(QueueItem, {
    selected: true,
    ic: I.users,
    title: "3 SR drafts \xB7 Brooklyn tasting",
    by: "Mike Tan",
    age: "2h",
    tone: "red",
    downstream: "11 ppl",
    sub: "Conflicts on JP-2024 inventory"
  })), /*#__PURE__*/React.createElement(QueueGroup, {
    label: "High \xB7 2"
  }, /*#__PURE__*/React.createElement(QueueItem, {
    ic: I.warehouse,
    title: "Distributor restock \xB7 Vinexpo Paris",
    by: "L. Bardot",
    age: "4h",
    tone: "amber",
    downstream: "2 dist",
    sub: "142 cases \xB7 ETA risk"
  }), /*#__PURE__*/React.createElement(QueueItem, {
    ic: I.factory,
    title: "PO #2026-0418 \xB7 Yamato",
    by: "System",
    age: "1d",
    tone: "amber",
    downstream: "1 mfr",
    sub: "Safety stock breach in 6d"
  })), /*#__PURE__*/React.createElement(QueueGroup, {
    label: "Standard \xB7 4"
  }, /*#__PURE__*/React.createElement(QueueItem, {
    ic: I.cart,
    title: "Reorder \xB7 Liquid Gold",
    by: "K. Kazu",
    age: "6h",
    tone: "stone",
    downstream: "1 store",
    sub: "Repeat customer \xB7 auto-priced"
  }), /*#__PURE__*/React.createElement(QueueItem, {
    ic: I.alert,
    title: "Allocation override \xB7 HND",
    by: "A. Suzuki",
    age: "9h",
    tone: "stone",
    downstream: "1 dispute",
    sub: "Rep flagged conflict"
  }), /*#__PURE__*/React.createElement(QueueItem, {
    ic: I.cart,
    title: "Reorder \xB7 Sazerac SG",
    by: "W. Tan",
    age: "11h",
    tone: "stone",
    downstream: "1 store",
    sub: "Outside listing window"
  }), /*#__PURE__*/React.createElement(QueueItem, {
    ic: I.cart,
    title: "Reorder \xB7 Bar Suntory",
    by: "System",
    age: "14h",
    tone: "stone",
    downstream: "1 store",
    sub: "Standard restock"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 32px',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Pill, {
    tone: "red",
    dot: true,
    mono: true
  }, "BLOCKER \xB7 11 ppl downstream"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontFamily: J.mono,
      color: J.muted
    }
  }, "#DRAFT-2604-A")), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: J.display,
      fontSize: 26,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, "3 sales rep drafts \xB7 Brooklyn tasting trip"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: J.muted,
      margin: '6px 0 0'
    }
  }, "Submitted by ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: J.ink,
      fontWeight: 500
    }
  }, "Mike Tan"), " \xB7 Sat Apr 25, 6:14 PM \xB7 Awaiting allocation decision")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "outline",
    size: "md"
  }, "Hold \xB7 ask Mike"), /*#__PURE__*/React.createElement(Btn, {
    variant: "accent",
    size: "md",
    icon: I.check
  }, "Approve all 3"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      padding: 18,
      background: 'hsl(0 68% 48% / 0.04)',
      border: `1px solid hsl(0 68% 48% / 0.18)`,
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      color: J.red
    }
  }, "Who's waiting on this"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(ChainNode, {
    icon: I.users,
    label: "1 rep",
    detail: "Mike T."
  }), /*#__PURE__*/React.createElement(ChainArrow, null), /*#__PURE__*/React.createElement(ChainNode, {
    icon: I.warehouse,
    label: "2 distributors",
    detail: "Empire \xB7 Park"
  }), /*#__PURE__*/React.createElement(ChainArrow, null), /*#__PURE__*/React.createElement(ChainNode, {
    icon: I.store,
    label: "3 stores",
    detail: "Dante \xB7 Katana Kitten \xB7 Mace"
  }), /*#__PURE__*/React.createElement(ChainArrow, null), /*#__PURE__*/React.createElement(ChainNode, {
    icon: I.users,
    label: "5 staff",
    detail: "Tasting events Wed\u2013Fri"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Drafts to decide"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(DraftRow, {
    store: "Dante \xB7 Greenwich Village",
    sku: "JP-2024-001 \xB7 18 cases",
    stock: "On-hand 24",
    verdict: "ok"
  }), /*#__PURE__*/React.createElement(DraftRow, {
    store: "Katana Kitten \xB7 LES",
    sku: "JP-2024-001 \xB7 12 cases",
    stock: "On-hand 6 after Dante",
    verdict: "conflict"
  }), /*#__PURE__*/React.createElement(DraftRow, {
    store: "Mace \xB7 Hudson",
    sku: "JP-2024-002 \xB7 8 cases",
    stock: "On-hand 14",
    verdict: "ok"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: 16,
      background: 'hsl(40 88% 42% / 0.06)',
      border: `1px solid hsl(40 88% 42% / 0.2)`,
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: J.gold,
      color: J.paper,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.refresh,
    size: 16
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: J.ink,
      marginBottom: 4
    }
  }, "Hajime suggests"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: J.ink,
      lineHeight: 1.55
    }
  }, "Approve ", /*#__PURE__*/React.createElement("strong", null, "Dante"), " in full \xB7 split ", /*#__PURE__*/React.createElement("strong", null, "Katana Kitten"), " to 6 cases from on-hand and 6 from PO #0411 (lands Wed) \xB7 approve ", /*#__PURE__*/React.createElement("strong", null, "Mace"), " in full. Mike already pre-cleared the split with Katana on Saturday."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "sm"
  }, "Apply suggestion"), /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    size: "sm"
  }, "Edit allocation"))))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      marginTop: 18,
      fontSize: 12,
      color: J.muted
    }
  }, /*#__PURE__*/React.createElement(Annotation, {
    n: "A",
    text: "Triage chips group by source \u2014 but the default sort is consequence, not type."
  }), /*#__PURE__*/React.createElement(Annotation, {
    n: "B",
    text: "The downstream chain is the headline \u2014 Sora can see the eleven people unblocked by one click."
  }), /*#__PURE__*/React.createElement(Annotation, {
    n: "C",
    text: "System-suggested allocation respects rep notes from the field, then asks for sign-off."
  }))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: HQ2.color
  }));
}
function FilterChip({
  active,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 12px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 500,
      background: active ? J.ink : J.paper,
      color: active ? J.paper : J.ink,
      border: `1px solid ${active ? 'transparent' : J.border}`,
      cursor: 'pointer'
    }
  }, children);
}
function QueueGroup({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 18px 6px',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      color: J.muted,
      fontWeight: 500,
      background: J.surface,
      borderBottom: `1px solid ${J.borderQ}`
    }
  }, label), children);
}
function QueueItem({
  selected,
  ic,
  title,
  by,
  age,
  tone,
  downstream,
  sub
}) {
  const c = tone === 'red' ? J.red : tone === 'amber' ? J.amber : 'hsl(30 10% 55%)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: `1px solid ${J.borderQ}`,
      background: selected ? 'hsl(40 88% 42% / 0.05)' : 'transparent',
      borderLeft: selected ? `3px solid ${J.gold}` : '3px solid transparent',
      display: 'grid',
      gridTemplateColumns: '32px 1fr',
      gap: 12,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: c + '15',
      color: c,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: ic,
    size: 15
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: J.ink
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontFamily: J.mono,
      flexShrink: 0
    }
  }, age)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: J.muted,
      marginBottom: 4
    }
  }, sub), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: J.muted
    }
  }, by), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: c,
      fontWeight: 600,
      fontFamily: J.mono
    }
  }, downstream))));
}
function ChainNode({
  icon,
  label,
  detail
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      background: J.paper,
      border: `1px solid ${J.border}`,
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 6,
      background: J.surface,
      color: J.ink,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: icon,
    size: 14
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: J.ink
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: J.muted,
      fontFamily: J.mono
    }
  }, detail)));
}
function ChainArrow() {
  return /*#__PURE__*/React.createElement(Ic, {
    d: I.arrow,
    size: 16,
    style: {
      color: J.muted
    }
  });
}
function DraftRow({
  store,
  sku,
  stock,
  verdict
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto auto auto',
      gap: 14,
      padding: '12px 14px',
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: J.ink
    }
  }, store), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontFamily: J.mono,
      marginTop: 2
    }
  }, sku)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontFamily: J.mono,
      textAlign: 'right'
    }
  }, stock), verdict === 'conflict' ? /*#__PURE__*/React.createElement(Pill, {
    tone: "red",
    dot: true
  }, "Insufficient") : /*#__PURE__*/React.createElement(Pill, {
    tone: "green",
    dot: true
  }, "OK"), /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    size: "sm",
    icon: I.more
  }));
}
Object.assign(window, {
  HqApprovalsSlide
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "journeys/role-hq2.jsx", error: String((e && e.message) || e) }); }

// journeys/role-manuf.jsx
try { (() => {
// journeys/role-manuf.jsx — Manufacturer journey
const MF = ROLES.manuf;
function ManufContextSlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    label: "06 Manufacturer \xB7 Context"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: MF.color,
    role: "Manufacturer",
    stage: "Context \xB7 Yamato Distillery",
    title: "Imanishi-san needs the production queue, not the dashboard",
    subtitle: "The current portal mirrors HQ's chrome but most fields don't apply. Imanishi-san wants three things on screen: what's approved, what's running, what ships this week.",
    slideNo: "06",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '40px 56px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Persona"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 24,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      background: MF.color + '22',
      color: MF.color,
      fontFamily: J.display,
      fontSize: 24,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, "YI"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, "Yui Imanishi"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: J.muted
    }
  }, "Production lead \xB7 Yamato Distillery, Yamanashi"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      paddingTop: 18,
      borderTop: `1px solid ${J.borderQ}`,
      fontFamily: J.display,
      fontSize: 18,
      fontWeight: 400,
      fontStyle: 'italic',
      lineHeight: 1.4
    }
  }, "\"Pricing isn't my world. Show me what's approved, what's in the still, what ships Friday.\"")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Pain points"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '10px 0 0',
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(PainItem, {
    text: "Sees commercial UI clutter \u2014 pricing, quotas, accounts \u2014 that doesn't apply"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "Status changes go out as PDF emails, not signals back to HQ"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "Packaging spec changes per batch are easy to miss"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "No way to flag delay early \u2014 only when it's already late"
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Anchor scenario"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 24,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 22,
      fontWeight: 500,
      letterSpacing: '-.01em',
      lineHeight: 1.3
    }
  }, "PO #2026-0411 lands on Imanishi's queue Monday morning. 2,400 cases of JP-2024-001 due in 21 days. She must:"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, [['01', 'Acknowledge', 'Confirm capacity. Flag risks. Sign packaging spec.'], ['02', 'Schedule', 'Slot the batch into the still calendar. Reserve cooperage.'], ['03', 'Update status', 'Distill → bottle → label → pack → ready → ship.'], ['04', 'Hand off', 'Push BOL to distributor. HQ sees ETA tick green.']].map(([n, t, d]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'grid',
      gridTemplateColumns: '32px 1fr',
      gap: 12,
      padding: '10px 0',
      borderTop: n === '01' ? 'none' : `1px solid ${J.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: MF.color
    }
  }, n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: J.muted,
      marginTop: 2,
      lineHeight: 1.5
    }
  }, d)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      padding: 18,
      background: J.surface,
      borderRadius: 12,
      fontSize: 14,
      lineHeight: 1.55,
      color: J.ink
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: MF.color
    }
  }, "Design move \u2192"), " A purpose-built Production board. No commercial chrome. Status as a horizontal pipe \u2014 every PO is a tile she drags through stages."))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: MF.color
  }));
}
function PainItem({
  text
}) {
  return /*#__PURE__*/React.createElement("li", {
    style: {
      display: 'grid',
      gridTemplateColumns: '18px 1fr',
      gap: 10,
      fontSize: 13.5,
      lineHeight: 1.55,
      color: J.ink
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: 'hsl(0 68% 48% / 0.12)',
      marginTop: 3,
      color: J.red,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 9
    }
  }, "\xD7"), /*#__PURE__*/React.createElement("span", null, text));
}

// ═══════════════════════════════════════════════════════════════
// 07 — Manufacturer production board
// ═══════════════════════════════════════════════════════════════
function ManufBoardSlide() {
  const stages = [{
    k: 'queued',
    l: 'Queued',
    c: 'hsl(30 10% 55%)'
  }, {
    k: 'distilling',
    l: 'Distilling',
    c: MF.color
  }, {
    k: 'bottling',
    l: 'Bottling',
    c: MF.color
  }, {
    k: 'packing',
    l: 'Packing',
    c: MF.color
  }, {
    k: 'ready',
    l: 'Ready',
    c: J.green
  }, {
    k: 'shipped',
    l: 'Shipped',
    c: J.blue
  }];
  const cards = {
    queued: [{
      po: '#0418',
      sku: 'JP-2024-001',
      cs: 1800,
      eta: 'May 18',
      risk: false
    }],
    distilling: [{
      po: '#0411',
      sku: 'JP-2024-001',
      cs: 2400,
      eta: 'May 04',
      risk: false,
      days: '12 / 21d'
    }],
    bottling: [{
      po: '#0408',
      sku: 'JP-2023-007',
      cs: 600,
      eta: 'Apr 30',
      risk: true,
      days: '18 / 21d'
    }],
    packing: [{
      po: '#0407',
      sku: 'EU-2024-002',
      cs: 1200,
      eta: 'Apr 28',
      risk: false
    }],
    ready: [{
      po: '#0405',
      sku: 'JP-2024-001',
      cs: 480,
      eta: 'Apr 27',
      risk: false
    }],
    shipped: [{
      po: '#0402',
      sku: 'JP-2023-009',
      cs: 960,
      eta: 'Apr 25',
      risk: false,
      dest: 'Vinexpo Paris'
    }]
  };
  return /*#__PURE__*/React.createElement(Slide, {
    label: "07 Manufacturer \xB7 Production board"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: MF.color,
    role: "Manufacturer",
    stage: "Screen 01 \xB7 Production board",
    title: "A pipeline she drags batches through, not a CRM",
    subtitle: "Every approved PO is a tile. Imanishi-san moves it across the still \u2192 bottle \u2192 label \u2192 pack \u2192 ship pipe. Status changes auto-publish to HQ and the receiving distributor.",
    slideNo: "07",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 56px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: J.paper,
      border: `1px solid ${J.border}`,
      borderRadius: 18,
      height: 820,
      overflow: 'hidden',
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 8px 32px hsl(24 10% 10% / .08)'
    }
  }, /*#__PURE__*/React.createElement(ManufTopbar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: J.display,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, "Production \xB7 this week"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: J.muted,
      marginTop: 4
    }
  }, "6 active POs \xB7 7,440 cases in flight \xB7 1 at risk")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "outline",
    size: "sm",
    icon: I.calendar
  }, "Wk 17 \xB7 Apr 21\u201327"), /*#__PURE__*/React.createElement(Btn, {
    variant: "outline",
    size: "sm",
    icon: I.filter
  }, "JP-2024-001"), /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "sm",
    icon: I.plus
  }, "Log update"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 24px 24px',
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 12,
      height: 560
    }
  }, stages.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.k,
    style: {
      background: J.surface,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 14px',
      borderBottom: `1px solid ${J.borderQ}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: s.c
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: J.ink
    }
  }, s.l)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: J.muted
    }
  }, (cards[s.k] || []).length)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      overflow: 'auto'
    }
  }, (cards[s.k] || []).map(c => /*#__PURE__*/React.createElement(ProdCard, {
    key: c.po,
    c: c,
    stageColor: s.c
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      border: `1px dashed ${J.border}`,
      borderRadius: 8,
      padding: '10px 12px',
      fontSize: 11,
      color: J.muted,
      textAlign: 'center'
    }
  }, "+ drop here"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 24px',
      borderTop: `1px solid ${J.borderQ}`,
      background: J.paper2,
      display: 'flex',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Capacity this week"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '-.01em',
      marginTop: 2
    }
  }, "78% ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: J.muted,
      fontFamily: J.body
    }
  }, "used \xB7 2 still slots open Fri"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 8,
      borderRadius: 999,
      background: J.border,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '78%',
      height: '100%',
      background: MF.color
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Pill, {
    tone: "amber",
    dot: true
  }, "1 at risk"), /*#__PURE__*/React.createElement(Pill, {
    tone: "green",
    dot: true
  }, "2 ready")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      marginTop: 18,
      fontSize: 12,
      color: J.muted
    }
  }, /*#__PURE__*/React.createElement(Annotation, {
    n: "A",
    text: "Stage move = event published to HQ + distributor in real time. No PDF emails."
  }), /*#__PURE__*/React.createElement(Annotation, {
    n: "B",
    text: "Risk pill on PO #0408 \u2014 18 of 21 days elapsed. HQ sees the same flag in Markets."
  }), /*#__PURE__*/React.createElement(Annotation, {
    n: "C",
    text: "Capacity strip is a rhythm tool \u2014 tells Imanishi when to refuse new work, not after the fact."
  }))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: MF.color
  }));
}
function ManufTopbar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      borderBottom: `1px solid ${J.borderQ}`,
      background: 'hsl(40 20% 99%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: MF.color,
      color: J.paper,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.factory,
    size: 16
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.1
    }
  }, "Yamato Distillery"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: J.muted,
      letterSpacing: '.1em',
      textTransform: 'uppercase'
    }
  }, "Manufacturer portal"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: MF.color,
      fontWeight: 600,
      borderBottom: `2px solid ${MF.color}`,
      paddingBottom: 18
    }
  }, "Production"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: J.muted,
      paddingBottom: 18
    }
  }, "POs in"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: J.muted,
      paddingBottom: 18
    }
  }, "Shipments out"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: J.muted,
      paddingBottom: 18
    }
  }, "Specs")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Avatar, {
    initials: "YI",
    tone: "paper"
  }));
}
function ProdCard({
  c,
  stageColor
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: J.card,
      border: `1px solid ${c.risk ? 'hsl(38 90% 50% / 0.5)' : J.borderQ}`,
      borderRadius: 9,
      padding: '10px 12px',
      borderLeft: `3px solid ${c.risk ? J.amber : stageColor}`,
      cursor: 'grab'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: J.ink,
      fontWeight: 600
    }
  }, c.po), c.risk && /*#__PURE__*/React.createElement(Pill, {
    tone: "amber",
    dot: true
  }, "at risk")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: J.muted,
      marginBottom: 6
    }
  }, c.sku), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: '-.01em',
      lineHeight: 1
    }
  }, c.cs.toLocaleString(), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontWeight: 400,
      fontFamily: J.body
    }
  }, "cs")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      color: J.muted,
      marginTop: 6,
      fontFamily: J.mono,
      letterSpacing: '.02em'
    }
  }, /*#__PURE__*/React.createElement("span", null, c.dest || c.days || ''), /*#__PURE__*/React.createElement("span", null, "ETA ", c.eta)));
}
Object.assign(window, {
  ManufContextSlide,
  ManufBoardSlide
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "journeys/role-manuf.jsx", error: String((e && e.message) || e) }); }

// journeys/role-rep.jsx
try { (() => {
// journeys/role-rep.jsx — Sales Rep (mobile-first field day)
const SR = ROLES.rep;
function RepContextSlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    label: "10 Sales Rep \xB7 Context"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: SR.color,
    role: "Sales Rep",
    stage: "Context \xB7 Field",
    title: "Mike works on a phone, between bars, in the dark",
    subtitle: "Current rep surface assumes laptop time at HQ. Mike's reality: 14 visits a week, scribbling on cocktail napkins, drafting orders in subway dead-zones. Mobile-first or it doesn't get used.",
    slideNo: "10",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '40px 56px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Persona"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 24,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      background: SR.color + '22',
      color: SR.color,
      fontFamily: J.display,
      fontSize: 24,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, "MT"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, "Mike Tan"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: J.muted
    }
  }, "Sales rep \xB7 NYC territory \xB7 38 accounts"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      paddingTop: 18,
      borderTop: `1px solid ${J.borderQ}`,
      fontFamily: J.display,
      fontSize: 18,
      fontWeight: 400,
      fontStyle: 'italic',
      lineHeight: 1.4
    }
  }, "\"I'm at the bar before the bartender's there. I need three taps: open account, draft order, send.\""), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Pain points"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '10px 0 0',
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(PainItem, {
    text: "No way to see distributor on-hand from the field \u2014 promises that turn into 'sorry'"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "Visit notes live in Notes.app \xB7 never reach HQ"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "Drafts get lost or duplicated in subway dead-zones"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "No signal on which accounts are slipping \u2014 quarterly review surprise"
  }))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Anchor scenario \xB7 Friday on the road"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 24,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '-.01em',
      lineHeight: 1.4
    }
  }, "5pm \xB7 Mike steps into Dante before service. Bartender mentions JP-2024 is moving. He needs to: check stock, draft 18 cases, leave a tasting note, do it in 90 seconds."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, [['1', 'Walk-in', 'Account loads with last visit, last order, current listing'], ['2', 'Stock check', 'Distributor on-hand visible inline (new permission, finally surfaced)'], ['3', 'Draft', 'Pre-fill from previous order; tweak; offline-safe'], ['4', 'Capture', 'Voice note → transcript → tagged to account'], ['5', 'Submit', 'Goes to HQ approval queue with full context']].map(([n, t, d]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'grid',
      gridTemplateColumns: '28px 1fr',
      gap: 12,
      padding: '8px 0',
      borderTop: n === '1' ? 'none' : `1px solid ${J.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: SR.color,
      fontWeight: 600
    }
  }, "0", n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: J.muted,
      marginLeft: 8
    }
  }, "\xB7 ", d)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      padding: 18,
      background: 'hsl(158 50% 30% / 0.06)',
      border: `1px solid hsl(158 50% 30% / 0.2)`,
      borderRadius: 10,
      fontSize: 14,
      lineHeight: 1.55,
      color: J.ink
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: SR.color
    }
  }, "Design move \u2192"), " Phone-native, offline-first, voice-friendly. Surface distributor stock \u2014 the existing RBAC permission has zero UI today."))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: SR.color
  }));
}

// ═══════════════════════════════════════════════════════════════
// 11 — Sales Rep mobile (3 phones, three moments)
// ═══════════════════════════════════════════════════════════════
function RepMobileSlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    label: "11 Sales Rep \xB7 Mobile field day"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: SR.color,
    role: "Sales Rep",
    stage: "Screen 01 \xB7 Mobile \xB7 3 moments",
    title: "A field day in three taps",
    subtitle: "Walk-in \u2192 stock check \u2192 draft. Each screen pre-fills from the last. Drafts persist offline. Distributor on-hand is finally visible to reps.",
    slideNo: "11",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 56px 0',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr) 1.1fr',
      gap: 32,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(PhoneFrame, {
    label: "Walk-in \xB7 Dante"
  }, /*#__PURE__*/React.createElement(RepWalkinScreen, null)), /*#__PURE__*/React.createElement(PhoneFrame, {
    label: "Stock check (new!)",
    highlight: true
  }, /*#__PURE__*/React.createElement(RepStockScreen, null)), /*#__PURE__*/React.createElement(PhoneFrame, {
    label: "Draft order"
  }, /*#__PURE__*/React.createElement(RepDraftScreen, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 20
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "What's new for the rep"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '14px 0 0',
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(NewItem, {
    n: "01",
    t: "Distributor on-hand, inline",
    d: "The RBAC permission existed; we surface it for the first time, on the screen where it matters."
  }), /*#__PURE__*/React.createElement(NewItem, {
    n: "02",
    t: "Offline-first drafts",
    d: "Drafts queue locally; sync when signal returns. A subway dead-zone never costs an order."
  }), /*#__PURE__*/React.createElement(NewItem, {
    n: "03",
    t: "Voice-tagged visits",
    d: "Tap-and-hold to leave a 30-sec note \u2192 transcribed \u2192 attached to the account. No Notes.app."
  }), /*#__PURE__*/React.createElement(NewItem, {
    n: "04",
    t: "Two-step confirmation",
    d: "Send draft \u2192 HQ approval queue \u2192 distributor pick. The handoff is visible to the rep, not silent."
  }), /*#__PURE__*/React.createElement(NewItem, {
    n: "05",
    t: "Account weather",
    d: "Each account header shows a single signal: 'on cadence', 'slipping', 'opportunity'. No spreadsheet review needed."
  })))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: SR.color
  }));
}
function PhoneFrame({
  label,
  highlight,
  children
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 300,
      height: 620,
      margin: '0 auto',
      position: 'relative',
      background: '#0a0908',
      borderRadius: 38,
      padding: 8,
      boxShadow: highlight ? `0 12px 50px ${SR.color}55, 0 0 0 2px ${SR.color}` : '0 12px 36px hsl(24 10% 10% / 0.18)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: 30,
      overflow: 'hidden',
      background: J.paper,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 18px 4px',
      fontSize: 11,
      fontWeight: 600,
      color: J.ink,
      fontFamily: J.body
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center',
      color: J.ink
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.signal,
    size: 11
  }), /*#__PURE__*/React.createElement(Ic, {
    d: I.wifi,
    size: 11
  }), /*#__PURE__*/React.createElement(Ic, {
    d: I.battery,
    size: 13
  }))), children, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 6,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 120,
      height: 4,
      background: J.ink,
      borderRadius: 999,
      opacity: .4
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 90,
      height: 24,
      background: '#0a0908',
      borderRadius: '0 0 14px 14px'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: J.ink
    }
  }, label), highlight && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: SR.color,
      marginTop: 2,
      fontFamily: J.mono,
      letterSpacing: '.05em'
    }
  }, "NEW SURFACE")));
}
function RepWalkinScreen() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 16px 0',
      height: 'calc(100% - 32px)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.menu,
    size: 18
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11,
      color: SR.color,
      fontFamily: J.mono
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: SR.color
    }
  }), "NEAR YOU"), /*#__PURE__*/React.createElement(Ic, {
    d: I.search,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontFamily: J.mono,
      letterSpacing: '.06em'
    }
  }, "FRIDAY \xB7 APR 24"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: J.display,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: '4px 0 14px'
    }
  }, "Hi Mike \u2014 4 visits left"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: SR.color,
      color: J.paper,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      opacity: .7
    }
  }, "YOU'RE 30M FROM"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-.01em',
      marginTop: 2
    }
  }, "Dante"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      opacity: .85,
      marginTop: 4
    }
  }, "Greenwich Village \xB7 last order 3 wk ago"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: '2px 7px',
      background: 'hsl(0 0% 100% / 0.18)',
      borderRadius: 999
    }
  }, "\u25CF slipping"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: '2px 7px',
      background: 'hsl(0 0% 100% / 0.18)',
      borderRadius: 999
    }
  }, "JP-2024 listed"))), /*#__PURE__*/React.createElement(AccountListItem, {
    name: "Katana Kitten",
    sub: "LES \xB7 cadence good",
    tone: "green"
  }), /*#__PURE__*/React.createElement(AccountListItem, {
    name: "Mace",
    sub: "Hudson \xB7 first visit",
    tone: "gold"
  }), /*#__PURE__*/React.createElement(AccountListItem, {
    name: "Bar Suntory",
    sub: "5th \xB7 slipping",
    tone: "red",
    last: true
  }));
}
function AccountListItem({
  name,
  sub,
  tone,
  last
}) {
  const c = tone === 'green' ? J.green : tone === 'red' ? J.red : tone === 'gold' ? J.gold : J.muted;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 0',
      borderBottom: last ? 'none' : `1px solid ${J.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: c,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: J.muted
    }
  }, sub)), /*#__PURE__*/React.createElement(Ic, {
    d: I.arrow,
    size: 13,
    style: {
      color: J.muted
    }
  }));
}
function RepStockScreen() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 16px 0',
      height: 'calc(100% - 32px)',
      overflow: 'hidden',
      background: J.paper2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.arrowL,
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, "Distributor stock")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 12px',
      background: 'hsl(158 50% 30% / 0.08)',
      border: `1px solid hsl(158 50% 30% / 0.2)`,
      borderRadius: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: SR.color,
      fontFamily: J.mono,
      letterSpacing: '.06em'
    }
  }, "EMPIRE \xB7 BROOKLYN"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: J.ink,
      marginTop: 3
    }
  }, "Live as of 11:38 \u2014 2 min ago")), [{
    sku: 'JP-2024-001',
    name: 'Hajime Junmai',
    cs: 142,
    tone: 'green'
  }, {
    sku: 'JP-2024-002',
    name: 'Hajime Daiginjō',
    cs: 46,
    tone: 'amber'
  }, {
    sku: 'JP-2023-007',
    name: 'Hajime Yuzu',
    cs: 8,
    tone: 'red'
  }, {
    sku: 'EU-2024-002',
    name: 'First Press Coffee',
    cs: 218,
    tone: 'green'
  }].map(s => /*#__PURE__*/React.createElement("div", {
    key: s.sku,
    style: {
      padding: '12px 0',
      borderBottom: `1px solid ${J.borderQ}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: J.muted,
      fontFamily: J.mono,
      marginTop: 2
    }
  }, s.sku)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-.01em',
      color: s.tone === 'red' ? J.red : s.tone === 'amber' ? J.amber : J.ink
    }
  }, s.cs), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: J.muted,
      fontFamily: J.mono
    }
  }, "cs on hand")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: '10px 12px',
      background: J.surface,
      borderRadius: 10,
      fontSize: 11,
      color: J.muted,
      lineHeight: 1.4
    }
  }, "Confirms before you promise. Updates with L\xE9a's picks every minute."));
}
function RepDraftScreen() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 16px 0',
      height: 'calc(100% - 32px)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.arrowL,
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, "Draft for Dante")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: J.muted
    }
  }, "Pre-filled from last order \xB7 3 wk ago"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 12,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement(DraftLine, {
    name: "Hajime Junmai",
    sku: "JP-2024-001",
    cs: 18,
    primary: true
  }), /*#__PURE__*/React.createElement(DraftLine, {
    name: "Hajime Daiginj\u014D",
    sku: "JP-2024-002",
    cs: 6
  }), /*#__PURE__*/React.createElement(DraftLine, {
    name: "+ add SKU",
    add: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 12,
      background: 'hsl(38 90% 50% / 0.1)',
      border: `1px solid hsl(38 90% 50% / 0.25)`,
      borderRadius: 10,
      fontSize: 11.5,
      color: 'hsl(30 80% 30%)',
      lineHeight: 1.45
    }
  }, "Empire has 142 cs of JP-2024-001 \u2014 your 18 will draw down cleanly."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: 12,
      background: J.surface,
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: J.ink,
      color: J.paper,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.phone,
    size: 14
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 500
    }
  }, "Hold to leave a tasting note"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: J.muted
    }
  }, "auto-tagged to Dante"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "accent",
    size: "lg",
    style: {
      width: '100%'
    },
    icon: I.check
  }, "Send to HQ approval")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 10.5,
      color: J.muted,
      marginTop: 8,
      fontFamily: J.mono
    }
  }, "OFFLINE-SAFE \xB7 WILL SYNC WHEN ONLINE"));
}
function DraftLine({
  name,
  sku,
  cs,
  primary,
  add
}) {
  if (add) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 0',
      borderTop: `1px dashed ${J.border}`,
      fontSize: 12,
      color: J.muted,
      textAlign: 'center'
    }
  }, name);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 0',
      borderBottom: `1px solid ${J.borderQ}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 500
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: J.muted,
      fontFamily: J.mono,
      marginTop: 1
    }
  }, sku)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: primary ? SR.color : J.surface,
      color: primary ? J.paper : J.ink,
      padding: '6px 10px',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      opacity: .7
    }
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      fontFamily: J.mono,
      minWidth: 18,
      textAlign: 'center'
    }
  }, cs), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      opacity: .7
    }
  }, "+")));
}
function NewItem({
  n,
  t,
  d
}) {
  return /*#__PURE__*/React.createElement("li", {
    style: {
      display: 'grid',
      gridTemplateColumns: '34px 1fr',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: SR.color + '18',
      color: SR.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 600,
      fontFamily: J.mono,
      marginTop: 1
    }
  }, n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: J.ink
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: J.muted,
      lineHeight: 1.5,
      marginTop: 2
    }
  }, d)));
}
Object.assign(window, {
  RepContextSlide,
  RepMobileSlide
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "journeys/role-rep.jsx", error: String((e && e.message) || e) }); }

// journeys/role-retail.jsx
try { (() => {
// journeys/role-retail.jsx — Retail Store (reorder + track)
const RT = ROLES.retail;
function RetailContextSlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    label: "12 Retail \xB7 Context"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: RT.color,
    role: "Retail Store",
    stage: "Context \xB7 Brooklyn sake bar",
    title: "Kazu has 90 seconds between guests to reorder",
    subtitle: "The retail surface should do less, faster. One job: catalog \u2192 reorder \u2192 track. Everything else is noise. The current portal mirrors HQ chrome \u2014 overkill for a store owner with a phone behind the bar.",
    slideNo: "12",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '40px 56px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Persona"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 24,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      background: RT.color + '22',
      color: RT.color,
      fontFamily: J.display,
      fontSize: 24,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, "KS"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, "Kazu Saito"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: J.muted
    }
  }, "Owner \xB7 Mace, Brooklyn \xB7 sake-bar / cocktail"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      paddingTop: 18,
      borderTop: `1px solid ${J.borderQ}`,
      fontFamily: J.display,
      fontSize: 18,
      fontWeight: 400,
      fontStyle: 'italic',
      lineHeight: 1.4
    }
  }, "\"I don't want a portal. I want last week's order again, tomorrow morning.\"")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Pain points"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '10px 0 0',
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(PainItem, {
    text: "Catalog is generic \u2014 doesn't know what Mace already pours"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "Where's my delivery? \u2014 answered by texting the rep, not the platform"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "No way to flag a guest favorite that's catching on"
  }), /*#__PURE__*/React.createElement(PainItem, {
    text: "Onboarding requires 9 fields he doesn't have at hand"
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Anchor scenario \xB7 Tuesday lunch lull"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 24,
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '-.01em',
      lineHeight: 1.4
    }
  }, "Kazu opens Hajime on his phone behind the bar. Three SKUs need a refill before Friday service. He wants to reorder last week's exact basket plus 6 more cases of the daiginj\u014D."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, [['1', 'Reorder', 'One tap on "last basket" — pre-filled, with smart suggestions from his draw rate'], ['2', 'Send', 'Routes via rep approval (he sees the chain, not just a black box)'], ['3', 'Track', 'A live shipment tile — three states, one ETA, one SMS update if it changes'], ['4', 'Close', 'Receive on phone with a tap — confirms depletion is right']].map(([n, t, d]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'grid',
      gridTemplateColumns: '28px 1fr',
      gap: 12,
      padding: '8px 0',
      borderTop: n === '1' ? 'none' : `1px solid ${J.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: RT.color,
      fontWeight: 600
    }
  }, "0", n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: J.muted,
      marginLeft: 8
    }
  }, "\xB7 ", d)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      padding: 18,
      background: 'hsl(280 30% 40% / 0.06)',
      border: `1px solid hsl(280 30% 40% / 0.2)`,
      borderRadius: 10,
      fontSize: 14,
      lineHeight: 1.55,
      color: J.ink
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: RT.color
    }
  }, "Design move \u2192"), " The retail surface is a single screen with three states: quiet (browsing), drafting (one tap), tracking (one tile). No nav rail, no modules."))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: RT.color
  }));
}

// ═══════════════════════════════════════════════════════════════
// 13 — Retail single-screen
// ═══════════════════════════════════════════════════════════════
function RetailScreenSlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    label: "13 Retail \xB7 One screen"
  }, /*#__PURE__*/React.createElement(SlideHeader, {
    roleColor: RT.color,
    role: "Retail Store",
    stage: "Screen 01 \xB7 One screen, three states",
    title: "Catalog, reorder, track \u2014 never more than two taps apart",
    subtitle: "Tablet-first (the device behind every bar) but works on phone. Top: a track tile that's only there when it matters. Middle: last basket. Bottom: the curated catalog.",
    slideNo: "13",
    totalForRole: "14"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 56px 0',
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 32,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: 820,
      background: J.paper2,
      border: `1px solid ${J.border}`,
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 8px 32px hsl(24 10% 10% / .08)'
    }
  }, /*#__PURE__*/React.createElement(RetailTopbar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '28px 32px',
      overflow: 'auto',
      height: 'calc(100% - 56px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: J.muted,
      fontFamily: J.mono,
      letterSpacing: '.06em'
    }
  }, "TUE \xB7 APR 28 \xB7 14:22"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: J.display,
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: '4px 0 0'
    }
  }, "Hi Kazu")), /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    size: "sm",
    icon: I.bell
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      background: J.card,
      borderRadius: 14,
      border: `1px solid ${J.borderQ}`,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "On the way"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '-.02em',
      marginTop: 4
    }
  }, "Order #2604 \xB7 arriving Wed"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: J.muted,
      marginTop: 4
    }
  }, "18 cases \xB7 Empire Wines Brooklyn \xB7 ETA 11:00\u201314:00")), /*#__PURE__*/React.createElement(Pill, {
    tone: "blue",
    dot: true
  }, "In transit")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(TrackStep, {
    label: "Approved",
    done: true
  }), /*#__PURE__*/React.createElement(TrackLine, {
    done: true
  }), /*#__PURE__*/React.createElement(TrackStep, {
    label: "Picked",
    done: true
  }), /*#__PURE__*/React.createElement(TrackLine, {
    done: true
  }), /*#__PURE__*/React.createElement(TrackStep, {
    label: "Out for delivery",
    current: true
  }), /*#__PURE__*/React.createElement(TrackLine, null), /*#__PURE__*/React.createElement(TrackStep, {
    label: "Received"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Last basket"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-.01em',
      marginTop: 2
    }
  }, "3 weeks ago \xB7 28 cases")), /*#__PURE__*/React.createElement(Btn, {
    variant: "accent",
    size: "md",
    icon: I.refresh
  }, "Reorder this")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(BasketCard, {
    name: "Hajime Junmai",
    sku: "JP-2024-001",
    cs: 18,
    draw: "Fast pour"
  }), /*#__PURE__*/React.createElement(BasketCard, {
    name: "Hajime Daiginj\u014D",
    sku: "JP-2024-002",
    cs: 6,
    draw: "+ 6 suggested"
  }), /*#__PURE__*/React.createElement(BasketCard, {
    name: "First Press Coffee",
    sku: "EU-2024-002",
    cs: 4
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Curated for Mace"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 10,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(CatalogCard, {
    name: "Hajime Yuzu",
    sku: "JP-2023-007",
    tag: "New release"
  }), /*#__PURE__*/React.createElement(CatalogCard, {
    name: "Hajime Nigori",
    sku: "JP-2024-003",
    tag: "Trending in NYC"
  }), /*#__PURE__*/React.createElement(CatalogCard, {
    name: "First Press Reserve",
    sku: "EU-2024-005",
    tag: "Allocated"
  }), /*#__PURE__*/React.createElement(CatalogCard, {
    name: "Hajime Sparkling",
    sku: "JP-2024-004",
    tag: "Seasonal"
  }))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "What changes for the store"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '14px 0 0',
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(NewItemR, {
    n: "01",
    t: "One screen, three states",
    d: "No left rail, no module switcher. Track tile only appears when something is moving."
  }), /*#__PURE__*/React.createElement(NewItemR, {
    n: "02",
    t: "Last basket is the primary CTA",
    d: "Repeat orders are 80% of retail traffic. The button is the size of the headline."
  }), /*#__PURE__*/React.createElement(NewItemR, {
    n: "03",
    t: "Curation, not catalog",
    d: "The catalog reads from his draw rate + similar bars in NYC, surfacing at most four SKUs at a time."
  }), /*#__PURE__*/React.createElement(NewItemR, {
    n: "04",
    t: "Tracking is human",
    d: "Three real states \xB7 ETA window \xB7 one SMS if anything changes. Not a polling page."
  }), /*#__PURE__*/React.createElement(NewItemR, {
    n: "05",
    t: "Onboarding lite",
    d: "Two fields to start (store name + email). The other 7 fill in over the first week, in the run of normal use."
  })))), /*#__PURE__*/React.createElement(SlideFooter, {
    roleColor: RT.color
  }));
}
function RetailTopbar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 14,
      borderBottom: `1px solid ${J.borderQ}`,
      background: 'hsl(40 20% 99%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/hajime-logo.png",
    alt: "",
    style: {
      height: 24,
      width: 24,
      objectFit: 'contain'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: J.display,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, "Hajime")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: J.muted
    }
  }, "Mace \xB7 Brooklyn"), /*#__PURE__*/React.createElement(Avatar, {
    initials: "KS",
    size: 28,
    tone: "paper"
  }));
}
function TrackStep({
  label,
  done,
  current
}) {
  const c = done ? J.green : current ? RT.color : J.border;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: done || current ? 22 : 14,
      height: done || current ? 22 : 14,
      borderRadius: '50%',
      background: c,
      color: J.paper,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, done && /*#__PURE__*/React.createElement(Ic, {
    d: I.check,
    size: 11,
    stroke: 2.5
  }), current && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: J.paper
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: done || current ? 600 : 400,
      color: done || current ? J.ink : J.muted,
      fontFamily: J.body
    }
  }, label));
}
function TrackLine({
  done
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 2,
      background: done ? J.green : J.border,
      marginBottom: 18
    }
  });
}
function BasketCard({
  name,
  sku,
  cs,
  draw
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      background: J.paper,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: J.ink
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: J.muted,
      fontFamily: J.mono,
      marginTop: 2
    }
  }, sku), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '-.02em'
    }
  }, cs, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: J.muted,
      fontWeight: 400,
      fontFamily: J.body,
      marginLeft: 3
    }
  }, "cs")), draw && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: RT.color,
      fontFamily: J.mono
    }
  }, draw)));
}
function CatalogCard({
  name,
  sku,
  tag
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      background: J.paper,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 60,
      borderRadius: 6,
      background: `linear-gradient(135deg, hsl(40 30% 88%), hsl(30 20% 80%))`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: J.muted
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: I.package,
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 500
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: J.muted,
      fontFamily: J.mono
    }
  }, sku), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: RT.color,
      fontWeight: 500
    }
  }, tag)));
}
function NewItemR({
  n,
  t,
  d
}) {
  return /*#__PURE__*/React.createElement("li", {
    style: {
      display: 'grid',
      gridTemplateColumns: '34px 1fr',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: RT.color + '18',
      color: RT.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 600,
      fontFamily: J.mono,
      marginTop: 1
    }
  }, n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: J.ink
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: J.muted,
      lineHeight: 1.5,
      marginTop: 2
    }
  }, d)));
}

// ═══════════════════════════════════════════════════════════════
// 14 — Closing: cross-role handoff
// ═══════════════════════════════════════════════════════════════
function ClosingSlide() {
  return /*#__PURE__*/React.createElement(Slide, {
    bg: J.inkDeep,
    label: "14 Closing \xB7 Handoff map"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(ellipse 80% 60% at 50% 110%, hsl(40 88% 42% / 0.18), transparent 60%)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '72px 80px',
      color: 'hsl(40 18% 97%)',
      position: 'relative',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      color: 'hsl(40 88% 42%)'
    }
  }, "Closing \xB7 the handoff map"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: J.display,
      fontSize: 80,
      fontWeight: 600,
      letterSpacing: '-.025em',
      margin: '12px 0 0',
      color: 'hsl(40 18% 97%)',
      maxWidth: '18ch',
      lineHeight: 1.05
    }
  }, "One order. Five surfaces. ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'hsl(40 88% 42%)',
      fontStyle: 'italic'
    }
  }, "One thread.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      color: 'hsl(35 14% 78%)',
      maxWidth: '62ch',
      marginTop: 18,
      lineHeight: 1.5
    }
  }, "The Brooklyn tasting draft, traced end-to-end. Every step is a single event that surfaces in the next role's queue \u2014 never an email, never a spreadsheet, never a guess."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 64,
      padding: '40px 32px',
      background: 'hsl(0 0% 100% / 0.04)',
      border: '1px solid hsl(40 18% 97% / 0.12)',
      borderRadius: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 0,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(ChainStep, {
    n: "01",
    role: "rep",
    ic: I.users,
    who: "Mike Tan",
    what: "Drafts 18 cs for Dante on his phone, between bars",
    writes: "DRAFT-2604-A"
  }), /*#__PURE__*/React.createElement(ChainStep, {
    n: "02",
    role: "hq",
    ic: I.dashboard,
    who: "Sora Okuda",
    what: "Sees it in the queue with downstream chain \u2014 approves with one click",
    writes: "ORDER-2604 + ALLOC"
  }), /*#__PURE__*/React.createElement(ChainStep, {
    n: "03",
    role: "dist",
    ic: I.warehouse,
    who: "L\xE9a Bardot",
    what: "Sees the pick in tomorrow's queue. Confirms = depletion published",
    writes: "DEPLETION-EVT"
  }), /*#__PURE__*/React.createElement(ChainStep, {
    n: "04",
    role: "retail",
    ic: I.store,
    who: "Kazu (Mace got reallocated cases)",
    what: "Watches the track tile. ETA Wed 11:00. Receives with a tap",
    writes: "RECEIVED-EVT"
  }), /*#__PURE__*/React.createElement(ChainStep, {
    n: "05",
    role: "manuf",
    ic: I.factory,
    who: "Imanishi-san",
    what: "JP-2024-001 tile lights amber on her board \u2014 replenish PO is queued for HQ",
    writes: "PO-2026-0419",
    last: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(ClosingPrinciple, {
    n: "01",
    t: "Decisions, not dashboards",
    d: "Each role lands on what only they can move. Numbers exist to support those decisions."
  }), /*#__PURE__*/React.createElement(ClosingPrinciple, {
    n: "02",
    t: "The handoff is the product",
    d: "Every event one role creates is the next role's notification. Depletion closes the loop."
  }), /*#__PURE__*/React.createElement(ClosingPrinciple, {
    n: "03",
    t: "Quiet by default",
    d: "One accent, three families, no alert fatigue. The system speaks only when something needs a person."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 48,
      left: 80,
      right: 80,
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      fontFamily: J.mono,
      color: 'hsl(35 12% 55%)',
      letterSpacing: '.05em'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u306F\u3058\u3081 \xB7 journey redesign \xB7 2026.04"), /*#__PURE__*/React.createElement("span", null, "14 / 14"))));
}
function ChainStep({
  n,
  role,
  ic,
  who,
  what,
  writes,
  last
}) {
  const c = ROLES[role].color;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '0 18px'
    }
  }, !last && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 30,
      right: -6,
      width: 40,
      height: 1,
      background: 'linear-gradient(to right, hsl(40 88% 42% / 0.6), hsl(40 88% 42% / 0.2))',
      zIndex: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 60,
      height: 60,
      borderRadius: '50%',
      background: c,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: J.paper,
      boxShadow: `0 0 0 4px hsl(40 18% 97% / 0.06)`
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: ic,
    size: 26,
    stroke: 1.4
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: 'hsl(35 12% 55%)',
      letterSpacing: '.06em'
    }
  }, n)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: c,
      fontFamily: J.mono,
      letterSpacing: '.06em',
      textTransform: 'uppercase'
    }
  }, ROLES[role].label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: '-.01em',
      color: 'hsl(40 18% 97%)',
      marginTop: 4
    }
  }, who), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'hsl(35 14% 78%)',
      marginTop: 6,
      lineHeight: 1.45
    }
  }, what), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: '4px 8px',
      background: 'hsl(40 88% 42% / 0.1)',
      border: '1px solid hsl(40 88% 42% / 0.2)',
      borderRadius: 6,
      fontFamily: J.mono,
      fontSize: 10,
      color: 'hsl(40 88% 60%)',
      display: 'inline-block'
    }
  }, "writes ", writes));
}
function ClosingPrinciple({
  n,
  t,
  d
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      background: 'hsl(0 0% 100% / 0.04)',
      border: '1px solid hsl(40 18% 97% / 0.12)',
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: 'hsl(40 88% 42%)',
      letterSpacing: '.06em'
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '-.01em',
      color: 'hsl(40 18% 97%)',
      marginTop: 6
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'hsl(35 14% 78%)',
      marginTop: 8,
      lineHeight: 1.55
    }
  }, d));
}
Object.assign(window, {
  RetailContextSlide,
  RetailScreenSlide,
  ClosingSlide
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "journeys/role-retail.jsx", error: String((e && e.message) || e) }); }

// journeys/shared.jsx
try { (() => {
// journeys/shared.jsx — shared building blocks for all role journeys
// Loaded after design-canvas only-needed icon/data, but kept self-contained.

const J = {
  paper: 'hsl(40 18% 97%)',
  paper2: 'hsl(40 20% 99%)',
  ink: 'hsl(24 10% 10%)',
  inkDeep: 'hsl(24 12% 8%)',
  muted: 'hsl(24 6% 50%)',
  border: 'hsl(35 12% 89%)',
  borderQ: 'hsl(35 12% 89% / 0.6)',
  card: 'hsl(40 20% 99%)',
  surface: 'hsl(37 14% 94%)',
  gold: 'hsl(40 88% 42%)',
  goldSoft: 'hsl(40 88% 42% / 0.10)',
  goldRing: 'hsl(40 88% 42% / 0.30)',
  green: 'hsl(158 56% 36%)',
  amber: 'hsl(38 90% 50%)',
  red: 'hsl(0 68% 48%)',
  blue: 'hsl(215 72% 50%)',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', Menlo, monospace"
};

// ─── Icon set (Lucide-style) ────────────────────────────────────
const Ic = ({
  d,
  size = 16,
  stroke = 1.6,
  style = {}
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: stroke,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: {
    flexShrink: 0,
    ...style
  }
}, d);
const I = {
  dashboard: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "12",
    width: "7",
    height: "9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "16",
    width: "7",
    height: "5"
  })),
  globe: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 12h20"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"
  })),
  package: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m7.5 4.27 9 5.15"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3.3 7 8.7 5 8.7-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 22V12"
  })),
  cart: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "21",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "21",
    r: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
  })),
  truck: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 18H9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "18",
    r: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "18",
    r: "2"
  })),
  factory: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 18h1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 18h1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 18h1"
  })),
  users: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 21v-2a4 4 0 0 0-3-3.87"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 3.13a4 4 0 0 1 0 7.75"
  })),
  chart: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 3v18h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 17V9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 17V5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 17v-3"
  })),
  settings: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
  })),
  alert: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 17h.01"
  })),
  bell: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.3 21a1.94 1.94 0 0 0 3.4 0"
  })),
  search: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })),
  check: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m5 12 5 5L20 7"
  })),
  x: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })),
  plus: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M12 5v14"
  })),
  arrow: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M13 5l7 7-7 7"
  })),
  arrowL: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M11 19l-7-7 7-7"
  })),
  up: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6-6 6 6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 3v18"
  })),
  down: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 21V3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m6 15 6 6 6-6"
  })),
  trendUp: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
    points: "22 7 13.5 15.5 8.5 10.5 2 17"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "16 7 22 7 22 13"
  })),
  trendDn: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
    points: "22 17 13.5 8.5 8.5 13.5 2 7"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "16 17 22 17 22 11"
  })),
  clock: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 6 12 12 16 14"
  })),
  filter: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
  })),
  more: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "5",
    cy: "12",
    r: "1"
  })),
  menu: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "6",
    x2: "21",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "12",
    x2: "21",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "18",
    x2: "21",
    y2: "18"
  })),
  signal: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M2 20h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 20v-4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 20v-8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 20V8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 4v16"
  })),
  battery: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "7",
    width: "18",
    height: "10",
    rx: "2",
    ry: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "22",
    y1: "11",
    x2: "22",
    y2: "13"
  })),
  wifi: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12.55a11 11 0 0 1 14.08 0"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M1.42 9a16 16 0 0 1 21.16 0"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.53 16.11a6 6 0 0 1 6.95 0"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "20",
    x2: "12.01",
    y2: "20"
  })),
  scan: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 7V5a2 2 0 0 1 2-2h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 3h2a2 2 0 0 1 2 2v2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 17v2a2 2 0 0 1-2 2h-2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 21H5a2 2 0 0 1-2-2v-2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "7",
    y1: "12",
    x2: "17",
    y2: "12"
  })),
  pin: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 22s-8-4.5-8-12a8 8 0 0 1 16 0c0 7.5-8 12-8 12z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })),
  phone: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
  })),
  store: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 7h20"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"
  })),
  warehouse: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 18h12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 14h12"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "10",
    width: "12",
    height: "12"
  })),
  building: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "2",
    width: "16",
    height: "20",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 22v-4h6v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 6h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 6h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 6h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 10h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 14h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 10h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 14h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 10h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 14h.01"
  })),
  receipt: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M16 2v4M8 2v4M3 10h18"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  })),
  refresh: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 3v5h-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 21v-5h5"
  }))
};

// ─── Pill ────────────────────────────────────────────────────────
function Pill({
  tone = 'stone',
  children,
  dot = false,
  mono = false
}) {
  const tones = {
    green: {
      bg: 'hsl(158 56% 36% / .08)',
      c: 'hsl(158 56% 26%)',
      br: 'hsl(158 56% 36% / .25)',
      dot: J.green
    },
    blue: {
      bg: 'hsl(215 72% 50% / .08)',
      c: 'hsl(215 72% 38%)',
      br: 'hsl(215 72% 50% / .25)',
      dot: J.blue
    },
    amber: {
      bg: 'hsl(38 90% 50% / .12)',
      c: 'hsl(30 80% 30%)',
      br: 'hsl(38 90% 50% / .3)',
      dot: J.amber
    },
    red: {
      bg: 'hsl(0 68% 48% / .08)',
      c: 'hsl(0 68% 36%)',
      br: 'hsl(0 68% 48% / .25)',
      dot: J.red
    },
    stone: {
      bg: 'hsl(30 10% 55% / .12)',
      c: 'hsl(30 10% 35%)',
      br: 'hsl(30 10% 55% / .25)',
      dot: 'hsl(30 10% 55%)'
    },
    gold: {
      bg: J.goldSoft,
      c: 'hsl(40 88% 32%)',
      br: J.goldRing,
      dot: J.gold
    },
    ink: {
      bg: 'hsl(24 10% 10% / .9)',
      c: 'hsl(40 20% 97%)',
      br: 'transparent',
      dot: 'hsl(40 20% 97%)'
    }
  };
  const t = tones[tone] || tones.stone;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      borderRadius: 999,
      padding: '2px 9px',
      fontSize: 11,
      fontWeight: 500,
      background: t.bg,
      color: t.c,
      border: `1px solid ${t.br}`,
      fontFamily: mono ? J.mono : J.body,
      whiteSpace: 'nowrap',
      letterSpacing: mono ? '.02em' : 0
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: t.dot,
      flexShrink: 0
    }
  }), children);
}

// ─── Buttons ────────────────────────────────────────────────────
function Btn({
  variant = 'outline',
  size = 'md',
  children,
  icon,
  iconR,
  style = {}
}) {
  const vs = {
    primary: {
      bg: J.ink,
      c: J.paper,
      br: 'transparent'
    },
    accent: {
      bg: J.gold,
      c: J.paper,
      br: 'transparent'
    },
    outline: {
      bg: J.paper,
      c: J.ink,
      br: J.border
    },
    ghost: {
      bg: 'transparent',
      c: J.ink,
      br: 'transparent'
    },
    soft: {
      bg: J.surface,
      c: J.ink,
      br: 'transparent'
    }
  };
  const v = vs[variant] || vs.outline;
  const sz = size === 'sm' ? {
    h: 28,
    px: 10,
    fs: 12
  } : size === 'lg' ? {
    h: 42,
    px: 18,
    fs: 14
  } : {
    h: 34,
    px: 14,
    fs: 13
  };
  return /*#__PURE__*/React.createElement("button", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      fontSize: sz.fs,
      fontWeight: 500,
      borderRadius: 8,
      padding: `0 ${sz.px}px`,
      height: sz.h,
      border: `1px solid ${v.br}`,
      background: v.bg,
      color: v.c,
      cursor: 'pointer',
      fontFamily: J.body,
      whiteSpace: 'nowrap',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(Ic, {
    d: icon,
    size: sz.fs + 2
  }), children, iconR && /*#__PURE__*/React.createElement(Ic, {
    d: iconR,
    size: sz.fs + 2
  }));
}

// ─── Eyebrow ────────────────────────────────────────────────────
function Eyebrow({
  children,
  color = J.muted,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '.16em',
      fontWeight: 500,
      color,
      fontFamily: J.body,
      ...style
    }
  }, children);
}

// ─── Slide chrome (the section-header strip on every slide) ──────
function SlideHeader({
  roleColor,
  role,
  stage,
  title,
  subtitle,
  slideNo,
  totalForRole
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 32,
      padding: '48px 56px 24px',
      borderBottom: `1px solid ${J.borderQ}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      background: roleColor + '14',
      border: `1px solid ${roleColor}33`,
      color: roleColor,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '.02em'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: roleColor
    }
  }), role), /*#__PURE__*/React.createElement(Eyebrow, null, stage)), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: J.display,
      fontSize: 44,
      fontWeight: 600,
      letterSpacing: '-.022em',
      margin: 0,
      color: J.ink,
      lineHeight: 1.05
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      color: J.muted,
      marginTop: 12,
      maxWidth: '62ch',
      lineHeight: 1.5,
      fontFamily: J.body
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.mono,
      fontSize: 11,
      color: J.muted,
      letterSpacing: '.05em',
      whiteSpace: 'nowrap',
      paddingBottom: 6
    }
  }, slideNo, " / ", totalForRole));
}

// ─── Slide footer (brand + role color stripe) ───────────────────
function SlideFooter({
  roleColor
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 6,
      background: `linear-gradient(to right, ${roleColor} 0%, ${roleColor} 18%, ${J.borderQ} 18%, ${J.borderQ} 100%)`
    }
  });
}

// ─── Common slide wrapper (1920×1080) ───────────────────────────
function Slide({
  children,
  bg = J.paper,
  label
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      width: 1920,
      height: 1080,
      background: bg,
      fontFamily: J.body,
      color: J.ink,
      position: 'relative',
      overflow: 'hidden'
    },
    "data-screen-label": label
  }, children);
}

// ─── Card primitive ────────────────────────────────────────────
function Card({
  children,
  style = {},
  padded = true,
  elev = 0
}) {
  const shadow = elev === 2 ? '0 4px 8px hsl(24 10% 10% / .06), 0 16px 40px hsl(24 10% 10% / .1)' : elev === 1 ? '0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)' : 'none';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: J.card,
      border: `1px solid ${J.borderQ}`,
      borderRadius: 14,
      boxShadow: shadow,
      padding: padded ? 20 : 0,
      ...style
    }
  }, children);
}

// ─── A small KPI tile ──────────────────────────────────────────
function Kpi({
  label,
  value,
  sub,
  icon,
  tone = 'stone',
  trend
}) {
  const tones = {
    stone: {
      bg: J.card,
      ico: J.surface,
      icoC: J.muted,
      br: J.borderQ
    },
    gold: {
      bg: 'linear-gradient(135deg, hsl(40 55% 94%), hsl(40 50% 90% / .5))',
      ico: 'hsl(40 60% 86%)',
      icoC: 'hsl(40 88% 32%)',
      br: 'hsl(40 60% 80% / .5)'
    },
    warm: {
      bg: 'linear-gradient(135deg, hsl(30 70% 94%), hsl(30 60% 90% / .5))',
      ico: 'hsl(30 70% 86%)',
      icoC: 'hsl(30 80% 35%)',
      br: 'hsl(30 70% 80% / .5)'
    },
    green: {
      bg: 'linear-gradient(135deg, hsl(158 40% 94%), hsl(158 40% 90% / .5))',
      ico: 'hsl(158 40% 86%)',
      icoC: 'hsl(158 56% 26%)',
      br: 'hsl(158 40% 80% / .5)'
    }
  };
  const t = tones[tone] || tones.stone;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: t.bg,
      border: `1px solid ${t.br}`,
      borderRadius: 14,
      padding: 20,
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, label), icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: t.ico,
      color: t.icoC,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: icon,
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: J.display,
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: '-.02em',
      marginTop: 10,
      fontFeatureSettings: "'tnum'",
      color: J.ink
    }
  }, value), (sub || trend) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 6
    }
  }, trend != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      fontSize: 11,
      fontWeight: 600,
      color: trend >= 0 ? J.green : J.red,
      fontFamily: J.mono
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    d: trend >= 0 ? I.trendUp : I.trendDn,
    size: 11,
    stroke: 2
  }), trend >= 0 ? '+' : '', trend, "%"), sub && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: J.muted
    }
  }, sub)));
}

// ─── Avatar ─────────────────────────────────────────────────────
function Avatar({
  initials,
  size = 28,
  tone = 'ink',
  style = {}
}) {
  const tones = {
    ink: {
      bg: 'hsl(24 10% 13%)',
      c: 'hsl(35 14% 90%)'
    },
    gold: {
      bg: 'hsl(40 60% 86%)',
      c: 'hsl(40 88% 32%)'
    },
    paper: {
      bg: J.surface,
      c: J.ink
    }
  };
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: 999,
      background: t.bg,
      color: t.c,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size <= 24 ? 10 : 11,
      fontWeight: 500,
      fontFamily: J.body,
      flexShrink: 0,
      ...style
    }
  }, initials);
}

// Role colors — used for slide accents only, not as second brand colors
const ROLES = {
  hq: {
    color: J.gold,
    label: 'Brand Operator · HQ'
  },
  manuf: {
    color: 'hsl(15 60% 45%)',
    label: 'Manufacturer'
  },
  dist: {
    color: 'hsl(215 50% 40%)',
    label: 'Distributor'
  },
  rep: {
    color: 'hsl(158 50% 30%)',
    label: 'Sales Rep'
  },
  retail: {
    color: 'hsl(280 30% 40%)',
    label: 'Retail Store'
  }
};
Object.assign(window, {
  J,
  Ic,
  I,
  Pill,
  Btn,
  Eyebrow,
  SlideHeader,
  SlideFooter,
  Slide,
  Card,
  Kpi,
  Avatar,
  ROLES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "journeys/shared.jsx", error: String((e && e.message) || e) }); }

// markets/shared.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// markets/shared.jsx — sidebar, icons, data, pills used across all 3 variations

// ─── Lucide-style inline icon helper ─────────────────────────
const I = ({
  d,
  size = 15,
  stroke = 1.6,
  style = {}
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: stroke,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: {
    flexShrink: 0,
    ...style
  }
}, d);
const Icons = {
  dashboard: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "12",
    width: "7",
    height: "9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "16",
    width: "7",
    height: "5"
  })),
  globe: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 12h20"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"
  })),
  package: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m7.5 4.27 9 5.15"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3.3 7 8.7 5 8.7-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 22V12"
  })),
  cart: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "21",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "21",
    r: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
  })),
  truck: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 18H9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "18",
    r: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "18",
    r: "2"
  })),
  factory: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 18h1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 18h1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 18h1"
  })),
  users: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 21v-2a4 4 0 0 0-3-3.87"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 3.13a4 4 0 0 1 0 7.75"
  })),
  chart: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 3v18h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 17V9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 17V5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 17v-3"
  })),
  settings: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })),
  alert: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 17h.01"
  })),
  search: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })),
  bell: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.3 21a1.94 1.94 0 0 0 3.4 0"
  })),
  up: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m18 15-6-6-6 6"
  })),
  down: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  })),
  right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  })),
  plus: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M12 5v14"
  })),
  filter: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
  })),
  download: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "7 10 12 15 17 10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "15",
    x2: "12",
    y2: "3"
  })),
  calendar: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2",
    ry: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "2",
    x2: "16",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "2",
    x2: "8",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "10",
    x2: "21",
    y2: "10"
  })),
  warehouse: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 18h12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 14h12"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "10",
    width: "12",
    height: "12"
  }))
};

// ─── Market data — 12 markets ──────────────────────────────────
const MARKETS = [
// code  name              region     sellthru  cover  onhand(cs) inflight  revMTD(K)   trend   status
{
  c: 'JP',
  name: 'Japan',
  region: 'APAC',
  st: 94,
  cover: 62,
  stock: 4820,
  intran: 2,
  rev: 1842,
  tr: +8.4,
  status: 'healthy',
  stores: 412,
  flag: '日'
}, {
  c: 'US',
  name: 'United States',
  region: 'Americas',
  st: 88,
  cover: 41,
  stock: 3120,
  intran: 5,
  rev: 2980,
  tr: +12.1,
  status: 'healthy',
  stores: 228,
  flag: 'US'
}, {
  c: 'SG',
  name: 'Singapore',
  region: 'APAC',
  st: 91,
  cover: 28,
  stock: 620,
  intran: 3,
  rev: 612,
  tr: +6.2,
  status: 'low-cover',
  stores: 74,
  flag: 'SG'
}, {
  c: 'HK',
  name: 'Hong Kong',
  region: 'APAC',
  st: 86,
  cover: 35,
  stock: 890,
  intran: 1,
  rev: 541,
  tr: -2.1,
  status: 'healthy',
  stores: 58,
  flag: 'HK'
}, {
  c: 'GB',
  name: 'United Kingdom',
  region: 'EMEA',
  st: 72,
  cover: 78,
  stock: 2140,
  intran: 0,
  rev: 488,
  tr: -4.7,
  status: 'overstock',
  stores: 112,
  flag: 'UK'
}, {
  c: 'DE',
  name: 'Germany',
  region: 'EMEA',
  st: 68,
  cover: 82,
  stock: 1680,
  intran: 1,
  rev: 316,
  tr: -1.3,
  status: 'overstock',
  stores: 84,
  flag: 'DE'
}, {
  c: 'FR',
  name: 'France',
  region: 'EMEA',
  st: 79,
  cover: 54,
  stock: 1420,
  intran: 2,
  rev: 402,
  tr: +3.8,
  status: 'healthy',
  stores: 96,
  flag: 'FR'
}, {
  c: 'CA',
  name: 'Canada',
  region: 'Americas',
  st: 81,
  cover: 48,
  stock: 980,
  intran: 1,
  rev: 284,
  tr: +5.1,
  status: 'healthy',
  stores: 64,
  flag: 'CA'
}, {
  c: 'AU',
  name: 'Australia',
  region: 'APAC',
  st: 76,
  cover: 44,
  stock: 720,
  intran: 2,
  rev: 196,
  tr: +2.4,
  status: 'healthy',
  stores: 48,
  flag: 'AU'
}, {
  c: 'KR',
  name: 'South Korea',
  region: 'APAC',
  st: 89,
  cover: 22,
  stock: 480,
  intran: 4,
  rev: 338,
  tr: +18.6,
  status: 'low-cover',
  stores: 52,
  flag: 'KR'
}, {
  c: 'AE',
  name: 'United Arab Em.',
  region: 'EMEA',
  st: 64,
  cover: 19,
  stock: 210,
  intran: 2,
  rev: 148,
  tr: +9.2,
  status: 'low-cover',
  stores: 22,
  flag: 'AE'
}, {
  c: 'TW',
  name: 'Taiwan',
  region: 'APAC',
  st: 84,
  cover: 38,
  stock: 560,
  intran: 1,
  rev: 224,
  tr: +4.6,
  status: 'healthy',
  stores: 38,
  flag: 'TW'
}];

// ─── Shared dark sidebar (matches operator HQ) ─────────────────
function Sidebar({
  active = 'Global markets'
}) {
  const nav = [{
    label: 'Command center',
    icon: Icons.dashboard
  }, {
    label: 'Global markets',
    icon: Icons.globe
  }, {
    label: 'Inventory',
    icon: Icons.package
  }, {
    label: 'Orders',
    icon: Icons.cart
  }, {
    label: 'Logistics',
    icon: Icons.truck
  }, {
    label: 'Manufacturing',
    icon: Icons.factory
  }, {
    label: 'Partners',
    icon: Icons.users
  }, {
    label: 'Reports',
    icon: Icons.chart
  }];
  const nav2 = [{
    label: 'Alerts hub',
    icon: Icons.alert,
    badge: 4
  }, {
    label: 'Settings',
    icon: Icons.settings
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'hsl(24 12% 8%)',
      color: 'hsl(35 12% 78%)',
      padding: '18px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      borderRight: '1px solid hsl(24 10% 15%)',
      height: '100%',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: 'hsl(24 10% 13% / 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/hajime-logo.png",
    alt: "",
    style: {
      height: 26,
      width: 26,
      objectFit: 'contain',
      filter: 'brightness(0) invert(1)'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 16,
      color: 'hsl(35 14% 90%)',
      lineHeight: 1
    }
  }, "Hajime"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: '.18em',
      color: 'hsl(35 12% 55%)',
      marginTop: 3
    }
  }, "Brand HQ"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: navGroupLabel
  }, "Operations"), nav.map(n => /*#__PURE__*/React.createElement(NavItem, _extends({
    key: n.label
  }, n, {
    active: n.label === active
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: navGroupLabel
  }, "Monitoring"), nav2.map(n => /*#__PURE__*/React.createElement(NavItem, _extends({
    key: n.label
  }, n, {
    active: n.label === active
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderTop: '1px solid hsl(24 10% 15%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 999,
      background: 'hsl(24 10% 13%)',
      color: 'hsl(35 14% 90%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 500
    }
  }, "SO"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'hsl(35 14% 90%)',
      lineHeight: 1.3
    }
  }, "Sora Okuda", /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'hsl(35 12% 50%)',
      fontSize: 10
    }
  }, "Ops director"))));
}
const navGroupLabel = {
  padding: '4px 10px',
  fontSize: 10,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '.14em',
  color: 'hsl(35 12% 78% / .4)'
};
function NavItem({
  label,
  icon,
  active,
  badge
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 6,
      fontSize: 13,
      cursor: 'pointer',
      background: active ? 'hsl(24 10% 13%)' : 'transparent',
      color: active ? 'hsl(40 88% 42%)' : 'hsl(35 12% 78% / .72)',
      fontWeight: active ? 500 : 400
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icon,
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, label), badge != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      color: 'hsl(40 88% 42%)',
      background: 'hsl(40 88% 42% / 0.12)',
      padding: '1px 6px',
      borderRadius: 999
    }
  }, badge));
}

// ─── Top bar (glass) ─────────────────────────────────────────
function TopBar({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 16,
      background: 'hsl(40 20% 99% / 0.8)',
      backdropFilter: 'blur(12px) saturate(1.4)',
      borderBottom: '1px solid hsl(35 12% 89% / 0.6)',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 360,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 12px',
      height: 34,
      background: 'hsl(37 14% 94%)',
      borderRadius: 8,
      color: 'hsl(24 6% 50%)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: Icons.search,
    size: 14
  }), " Search markets, SKUs, orders\u2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, children, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'hsl(24 6% 50%)',
      position: 'relative',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: Icons.bell,
    size: 15
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      right: 9,
      width: 6,
      height: 6,
      borderRadius: 999,
      background: 'hsl(40 88% 42%)',
      border: '1.5px solid hsl(40 18% 97%)'
    }
  }))));
}

// ─── Pill ──────────────────────────────────────────────────────
function Pill({
  tone = 'stone',
  children
}) {
  const tones = {
    green: {
      bg: 'hsl(158 56% 36% / .08)',
      c: 'hsl(158 56% 26%)',
      br: 'hsl(158 56% 36% / .2)'
    },
    blue: {
      bg: 'hsl(215 72% 50% / .08)',
      c: 'hsl(215 72% 38%)',
      br: 'hsl(215 72% 50% / .2)'
    },
    amber: {
      bg: 'hsl(38 90% 50% / .12)',
      c: 'hsl(30 80% 30%)',
      br: 'hsl(38 90% 50% / .3)'
    },
    red: {
      bg: 'hsl(0 68% 48% / .08)',
      c: 'hsl(0 68% 36%)',
      br: 'hsl(0 68% 48% / .2)'
    },
    stone: {
      bg: 'hsl(30 10% 55% / .12)',
      c: 'hsl(30 10% 35%)',
      br: 'hsl(30 10% 55% / .25)'
    },
    gold: {
      bg: 'hsl(40 88% 42% / .1)',
      c: 'hsl(40 88% 32%)',
      br: 'hsl(40 88% 42% / .3)'
    }
  };
  const t = tones[tone] || tones.stone;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      borderRadius: 999,
      padding: '2px 9px',
      fontSize: 11,
      fontWeight: 500,
      background: t.bg,
      color: t.c,
      border: `1px solid ${t.br}`,
      fontFamily: 'var(--font-body)'
    }
  }, children);
}
function Dot({
  tone = 'stone'
}) {
  const colors = {
    green: 'hsl(158 56% 36%)',
    blue: 'hsl(215 72% 50%)',
    amber: 'hsl(38 90% 50%)',
    red: 'hsl(0 68% 48%)',
    stone: 'hsl(30 10% 55%)',
    gold: 'hsl(40 88% 42%)'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: colors[tone]
    }
  });
}
function Btn({
  variant = 'outline',
  children,
  ...p
}) {
  const vs = {
    primary: {
      bg: 'hsl(24 10% 10%)',
      c: 'hsl(40 20% 97%)',
      br: 'transparent'
    },
    accent: {
      bg: 'hsl(40 88% 42%)',
      c: 'hsl(40 20% 97%)',
      br: 'transparent'
    },
    outline: {
      bg: 'hsl(40 18% 97%)',
      c: 'hsl(24 10% 10%)',
      br: 'hsl(35 12% 89%)'
    },
    ghost: {
      bg: 'transparent',
      c: 'hsl(24 10% 10%)',
      br: 'transparent'
    }
  };
  const v = vs[variant];
  return /*#__PURE__*/React.createElement("button", _extends({}, p, {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      fontSize: 13,
      fontWeight: 500,
      borderRadius: 8,
      padding: '0 14px',
      height: 36,
      border: `1px solid ${v.br}`,
      background: v.bg,
      color: v.c,
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      whiteSpace: 'nowrap',
      ...p.style
    }
  }), children);
}

// Map status → pill tone + label
const statusMap = {
  healthy: {
    tone: 'green',
    label: 'healthy'
  },
  'low-cover': {
    tone: 'amber',
    label: 'low cover'
  },
  overstock: {
    tone: 'blue',
    label: 'overstock'
  }
};
Object.assign(window, {
  I,
  Icons,
  MARKETS,
  Sidebar,
  TopBar,
  Pill,
  Dot,
  Btn,
  statusMap
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "markets/shared.jsx", error: String((e && e.message) || e) }); }

// markets/v1-classic.jsx
try { (() => {
// V1 — Classic KPI board. Sidebar + KPIs + chart + detailed markets table.
function V1Classic() {
  const totalRev = MARKETS.reduce((a, m) => a + m.rev, 0);
  const totalStock = MARKETS.reduce((a, m) => a + m.stock, 0);
  const avgST = Math.round(MARKETS.reduce((a, m) => a + m.st, 0) / MARKETS.length);
  const alerts = MARKETS.filter(m => m.status !== 'healthy').length;

  // monthly sell-through sparkline data (12 months)
  const spark = [72, 74, 71, 78, 81, 79, 83, 86, 88, 85, 89, 82];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      height: '100%',
      fontFamily: 'var(--font-body)',
      background: 'hsl(40 18% 97%)',
      fontSize: 14,
      color: 'hsl(24 10% 10%)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: "Global markets"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement(Btn, {
    variant: "outline"
  }, /*#__PURE__*/React.createElement(I, {
    d: Icons.calendar,
    size: 14
  }), " MTD \xB7 Apr 2026"), /*#__PURE__*/React.createElement(Btn, {
    variant: "outline"
  }, /*#__PURE__*/React.createElement(I, {
    d: Icons.download,
    size: 14
  }), " Export")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '28px 36px 40px',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 30,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, "Global markets"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      background: 'hsl(37 14% 94%)',
      padding: '3px 10px',
      borderRadius: 999,
      color: 'hsl(24 6% 50%)'
    }
  }, "12 active \xB7 3 in setup")), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'hsl(24 6% 50%)',
      fontSize: 14,
      margin: '6px 0 0',
      maxWidth: '54ch'
    }
  }, "One calm view of sell-through, stock cover, and in-flight shipments across every Hajime market.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "outline"
  }, /*#__PURE__*/React.createElement(I, {
    d: Icons.filter,
    size: 14
  }), " Region"), /*#__PURE__*/React.createElement(Btn, {
    variant: "primary"
  }, /*#__PURE__*/React.createElement(I, {
    d: Icons.plus,
    size: 14
  }), " New market"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 14,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "REVENUE \xB7 MTD",
    val: `$${(totalRev / 1000).toFixed(2)}M`,
    sub: "vs $7.16M LY",
    trend: "+9.4%",
    tone: "up",
    icon: Icons.chart
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "AVG SELL-THROUGH",
    val: `${avgST}%`,
    sub: "30-day rolling \xB7 12 markets",
    trend: "+2.1pts",
    tone: "up",
    icon: Icons.cart,
    accent: true
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "GLOBAL STOCK",
    val: totalStock.toLocaleString(),
    sub: "cases \xB7 46d avg cover",
    trend: "-4.2%",
    tone: "down",
    icon: Icons.warehouse
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "MARKETS FLAGGED",
    val: alerts,
    sub: "3 low cover \xB7 2 overstock",
    trend: "hold",
    tone: "flat",
    icon: Icons.alert,
    warn: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr',
      gap: 16,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Revenue by region",
    sub: "Last 12 months, $K"
  }, /*#__PURE__*/React.createElement(RegionChart, null)), /*#__PURE__*/React.createElement(Card, {
    title: "Region mix",
    sub: "Share of MTD revenue"
  }, /*#__PURE__*/React.createElement(RegionMix, null))), /*#__PURE__*/React.createElement(Card, {
    title: "Market detail",
    sub: "Ranked by MTD revenue",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 2,
        background: 'hsl(37 14% 94%)',
        padding: 3,
        borderRadius: 8
      }
    }, ['All', 'APAC', 'Americas', 'EMEA'].map((t, i) => /*#__PURE__*/React.createElement("span", {
      key: t,
      style: {
        padding: '4px 10px',
        fontSize: 12,
        borderRadius: 6,
        background: i === 0 ? 'hsl(40 20% 99%)' : 'transparent',
        color: i === 0 ? 'hsl(24 10% 10%)' : 'hsl(24 6% 50%)',
        boxShadow: i === 0 ? '0 1px 2px hsl(24 10% 10% / .08)' : 'none',
        fontWeight: 500,
        cursor: 'pointer'
      }
    }, t)))
  }, /*#__PURE__*/React.createElement(MarketsTable, {
    rows: MARKETS.slice().sort((a, b) => b.rev - a.rev)
  })))));
}

// ─── KPI card ──────────────────────────────────────────────────
function Kpi({
  label,
  val,
  sub,
  trend,
  tone,
  icon,
  accent,
  warn
}) {
  const bg = accent ? 'linear-gradient(135deg,hsl(40 55% 94%),hsl(40 50% 90% / .5))' : warn ? 'linear-gradient(135deg,hsl(30 70% 94%),hsl(30 60% 90% / .5))' : 'hsl(40 20% 99%)';
  const iconBg = accent ? 'hsl(40 60% 86%)' : warn ? 'hsl(30 70% 86%)' : 'hsl(37 14% 94%)';
  const iconC = accent ? 'hsl(40 88% 32%)' : warn ? 'hsl(30 80% 35%)' : 'hsl(24 6% 50%)';
  const border = accent ? 'hsl(40 60% 80% / .5)' : warn ? 'hsl(30 70% 80% / .5)' : 'hsl(35 12% 89% / .6)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 16,
      padding: 18,
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'hsl(24 6% 50%)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: iconBg,
      color: iconC,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icon,
    size: 17
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.02em',
      marginTop: 8,
      fontFeatureSettings: '"tnum"'
    }
  }, val), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'hsl(24 6% 50%)',
      marginTop: 2
    }
  }, sub), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 3,
      alignItems: 'center',
      fontSize: 11,
      fontWeight: 600,
      marginTop: 8,
      fontFamily: 'var(--font-mono)',
      color: tone === 'up' ? 'hsl(158 56% 30%)' : tone === 'down' ? 'hsl(0 68% 38%)' : 'hsl(24 6% 50%)'
    }
  }, tone === 'up' && /*#__PURE__*/React.createElement(I, {
    d: Icons.up,
    size: 12
  }), tone === 'down' && /*#__PURE__*/React.createElement(I, {
    d: Icons.down,
    size: 12
  }), trend));
}

// ─── Card shell ────────────────────────────────────────────────
function Card({
  title,
  sub,
  action,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'hsl(40 20% 99%)',
      border: '1px solid hsl(35 12% 89% / 0.6)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 18px',
      borderBottom: '1px solid hsl(35 12% 89% / 0.6)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 17,
      fontWeight: 500,
      letterSpacing: '-.01em'
    }
  }, title), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'hsl(24 6% 50%)',
      marginTop: 2
    }
  }, sub)), action), children);
}

// ─── Stacked area chart (svg) — revenue by region ────────────
function RegionChart() {
  // months
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  // APAC, Americas, EMEA per-month $K
  const apac = [2100, 2240, 2380, 2180, 2420, 2580, 2720, 3100, 3240, 3380, 3500, 3656];
  const amer = [1720, 1680, 1820, 1940, 2120, 2280, 2480, 2820, 2920, 3080, 3200, 3264];
  const emea = [1100, 1020, 1140, 1260, 1380, 1420, 1380, 1580, 1540, 1480, 1380, 1206];
  const W = 720,
    H = 240,
    pad = 32;
  const maxY = 9000;
  const x = i => pad + i * (W - pad - 8) / (months.length - 1);
  const y = v => H - pad - v * (H - pad - 16) / maxY;

  // cumulative for stack
  const stack = (arr, below) => arr.map((v, i) => v + (below ? below[i] : 0));
  const s1 = emea;
  const s2 = stack(amer, s1);
  const s3 = stack(apac, s2);
  const path = arr => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const area = (top, bot) => {
    const up = top.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
    const dn = bot.slice().reverse().map((v, i) => `L ${x(bot.length - 1 - i)} ${y(v)}`).join(' ');
    return `${up} ${dn} Z`;
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 16px'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "240",
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "none"
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("line", {
    key: i,
    x1: pad,
    x2: W - 8,
    y1: y(i * 3000),
    y2: y(i * 3000),
    stroke: "hsl(35 12% 89%)",
    strokeWidth: "1",
    strokeDasharray: "2 3"
  })), [0, 3, 6, 9].map(v => /*#__PURE__*/React.createElement("text", {
    key: v,
    x: pad - 6,
    y: y(v * 1000) + 3,
    fontSize: "9",
    fontFamily: "var(--font-mono)",
    fill: "hsl(24 6% 50%)",
    textAnchor: "end"
  }, v ? `$${v}K` : '0')), /*#__PURE__*/React.createElement("path", {
    d: area(s1, s1.map(() => 0)),
    fill: "hsl(40 88% 42% / 0.7)"
  }), /*#__PURE__*/React.createElement("path", {
    d: area(s2, s1),
    fill: "hsl(24 10% 10% / 0.75)"
  }), /*#__PURE__*/React.createElement("path", {
    d: area(s3, s2),
    fill: "hsl(35 18% 62% / 0.55)"
  }), /*#__PURE__*/React.createElement("path", {
    d: path(s3),
    fill: "none",
    stroke: "hsl(24 10% 10%)",
    strokeWidth: "1.2"
  }), months.map((m, i) => /*#__PURE__*/React.createElement("text", {
    key: m,
    x: x(i),
    y: H - 8,
    fontSize: "9",
    fontFamily: "var(--font-mono)",
    fill: "hsl(24 6% 50%)",
    textAnchor: "middle"
  }, m))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      fontSize: 11,
      color: 'hsl(24 6% 50%)',
      marginTop: 10,
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement(Legend, {
    sw: "hsl(35 18% 62%)",
    label: "APAC"
  }), /*#__PURE__*/React.createElement(Legend, {
    sw: "hsl(24 10% 10%)",
    label: "Americas"
  }), /*#__PURE__*/React.createElement(Legend, {
    sw: "hsl(40 88% 42%)",
    label: "EMEA"
  })));
}
const Legend = ({
  sw,
  label
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    width: 8,
    height: 8,
    borderRadius: 2,
    background: sw
  }
}), label);

// ─── Region mix — donut + list ────────────────────────────────
function RegionMix() {
  const regions = [{
    label: 'APAC',
    val: 4114,
    c: 'hsl(35 18% 52%)'
  }, {
    label: 'Americas',
    val: 3264,
    c: 'hsl(24 10% 10%)'
  }, {
    label: 'EMEA',
    val: 1206,
    c: 'hsl(40 88% 42%)'
  }];
  const total = regions.reduce((a, r) => a + r.val, 0);
  let off = 0;
  const R = 56,
    CX = 80,
    CY = 90,
    STROKE = 18;
  const C = 2 * Math.PI * R;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 160,
    height: 180
  }, /*#__PURE__*/React.createElement("circle", {
    cx: CX,
    cy: CY,
    r: R,
    stroke: "hsl(37 14% 94%)",
    strokeWidth: STROKE,
    fill: "none"
  }), regions.map((r, i) => {
    const frac = r.val / total;
    const len = C * frac;
    const el = /*#__PURE__*/React.createElement("circle", {
      key: r.label,
      cx: CX,
      cy: CY,
      r: R,
      stroke: r.c,
      strokeWidth: STROKE,
      fill: "none",
      strokeDasharray: `${len} ${C - len}`,
      strokeDashoffset: -off,
      transform: `rotate(-90 ${CX} ${CY})`
    });
    off += len;
    return el;
  }), /*#__PURE__*/React.createElement("text", {
    x: CX,
    y: CY - 2,
    textAnchor: "middle",
    fontFamily: "var(--font-display)",
    fontSize: "22",
    fontWeight: "600",
    fill: "hsl(24 10% 10%)"
  }, "$8.6M"), /*#__PURE__*/React.createElement("text", {
    x: CX,
    y: CY + 14,
    textAnchor: "middle",
    fontSize: "9",
    fontFamily: "var(--font-mono)",
    fill: "hsl(24 6% 50%)",
    letterSpacing: "0.1em"
  }, "MTD REVENUE")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, regions.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.label,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 2,
      background: r.c,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: 'hsl(24 10% 10%)'
    }
  }, r.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      fontWeight: 500,
      color: 'hsl(24 10% 10%)'
    }
  }, "$", (r.val / 1000).toFixed(2), "M"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'hsl(24 6% 50%)',
      width: 38,
      textAlign: 'right'
    }
  }, Math.round(r.val / total * 100), "%"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      paddingTop: 14,
      borderTop: '1px solid hsl(35 12% 89% / 0.6)',
      fontSize: 12,
      color: 'hsl(24 6% 50%)',
      lineHeight: 1.5
    }
  }, "APAC remains the center of gravity \u2014 Japan and the US alone carry ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'hsl(24 10% 10%)',
      fontWeight: 600
    }
  }, "56%"), " of MTD revenue."));
}

// ─── Markets table ────────────────────────────────────────────
function MarketsTable({
  rows
}) {
  return /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 13,
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['Market', 'Region', 'Stores', 'Sell-through', 'Cover days', 'On-hand', 'In transit', 'MTD revenue', 'Status'].map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      textAlign: i >= 2 ? 'right' : 'left',
      padding: '10px 18px',
      fontWeight: 500,
      color: 'hsl(24 6% 50%)',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      borderBottom: '1px solid hsl(35 12% 89% / 0.6)',
      background: 'hsl(37 14% 94% / 0.3)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, rows.map(m => {
    const s = statusMap[m.status];
    return /*#__PURE__*/React.createElement("tr", {
      key: m.c
    }, /*#__PURE__*/React.createElement("td", {
      style: tdStyle
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 26,
        height: 18,
        borderRadius: 3,
        background: 'hsl(37 14% 94%)',
        border: '1px solid hsl(35 12% 89%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 500,
        color: 'hsl(24 10% 10%)'
      }
    }, m.flag), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500
      }
    }, m.name))), /*#__PURE__*/React.createElement("td", {
      style: tdStyle
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'hsl(24 6% 50%)',
        fontSize: 12
      }
    }, m.region)), /*#__PURE__*/React.createElement("td", {
      style: tdRight
    }, m.stores), /*#__PURE__*/React.createElement("td", {
      style: tdRight
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 48,
        height: 4,
        borderRadius: 999,
        background: 'hsl(37 14% 94%)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${m.st}%`,
        height: '100%',
        background: m.st >= 85 ? 'hsl(158 56% 36%)' : m.st >= 75 ? 'hsl(40 88% 42%)' : 'hsl(38 90% 50%)'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        minWidth: 30,
        fontSize: 12
      }
    }, m.st, "%"))), /*#__PURE__*/React.createElement("td", {
      style: tdRight
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: m.cover < 30 ? 'hsl(0 68% 38%)' : m.cover > 70 ? 'hsl(215 72% 38%)' : 'hsl(24 10% 10%)'
      }
    }, m.cover, "d")), /*#__PURE__*/React.createElement("td", {
      style: tdRight
    }, m.stock.toLocaleString()), /*#__PURE__*/React.createElement("td", {
      style: tdRight
    }, m.intran > 0 ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement(I, {
      d: Icons.truck,
      size: 12,
      style: {
        color: 'hsl(215 72% 50%)'
      }
    }), m.intran) : /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'hsl(24 6% 50%)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12
      }
    }, "\u2014")), /*#__PURE__*/React.createElement("td", {
      style: {
        ...tdRight,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500
      }
    }, "$", m.rev.toLocaleString()), /*#__PURE__*/React.createElement("td", {
      style: tdRight
    }, /*#__PURE__*/React.createElement(Pill, {
      tone: s.tone
    }, /*#__PURE__*/React.createElement(Dot, {
      tone: s.tone
    }), s.label)));
  })));
}
const tdStyle = {
  padding: '10px 18px',
  borderBottom: '1px solid hsl(35 12% 89% / 0.4)',
  verticalAlign: 'middle'
};
const tdRight = {
  ...tdStyle,
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
  fontSize: 12
};
window.V1Classic = V1Classic;
})(); } catch (e) { __ds_ns.__errors.push({ path: "markets/v1-classic.jsx", error: String((e && e.message) || e) }); }

// markets/v2-cartographic.jsx
try { (() => {
// V2 — Cartographic. Map as primary lens.
function V2Cartographic() {
  // coarse equirectangular x/y for each market (0..100)
  const geo = {
    JP: {
      x: 86,
      y: 38
    },
    US: {
      x: 22,
      y: 40
    },
    SG: {
      x: 78,
      y: 60
    },
    HK: {
      x: 82,
      y: 46
    },
    GB: {
      x: 48,
      y: 28
    },
    DE: {
      x: 52,
      y: 30
    },
    FR: {
      x: 50,
      y: 33
    },
    CA: {
      x: 20,
      y: 28
    },
    AU: {
      x: 88,
      y: 72
    },
    KR: {
      x: 84,
      y: 38
    },
    AE: {
      x: 62,
      y: 48
    },
    TW: {
      x: 84,
      y: 50
    }
  };
  const totalRev = MARKETS.reduce((a, m) => a + m.rev, 0);
  const maxRev = Math.max(...MARKETS.map(m => m.rev));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      height: '100%',
      fontFamily: 'var(--font-body)',
      background: 'hsl(40 18% 97%)',
      fontSize: 14,
      color: 'hsl(24 10% 10%)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: "Global markets"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement(Btn, {
    variant: "outline"
  }, /*#__PURE__*/React.createElement(I, {
    d: Icons.calendar,
    size: 14
  }), " MTD \xB7 Apr 2026"), /*#__PURE__*/React.createElement(Btn, {
    variant: "accent"
  }, /*#__PURE__*/React.createElement(I, {
    d: Icons.plus,
    size: 14
  }), " Allocate")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 36px 40px',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      color: 'hsl(40 88% 32%)',
      marginBottom: 6
    }
  }, "Global markets \xB7 atlas view"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, "\u306F\u3058\u3081\u3001everywhere."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'hsl(24 6% 50%)',
      fontSize: 14,
      margin: '6px 0 0',
      maxWidth: '52ch'
    }
  }, "Twelve markets \xB7 1,288 stores \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      color: 'hsl(24 10% 10%)'
    }
  }, "$", (totalRev / 1000).toFixed(2), "M"), " MTD. Ring size by revenue, fill by sell-through.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2,
      background: 'hsl(37 14% 94%)',
      padding: 3,
      borderRadius: 8
    }
  }, ['Revenue', 'Sell-through', 'Cover', 'Flow'].map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      padding: '5px 12px',
      fontSize: 12,
      borderRadius: 6,
      background: i === 0 ? 'hsl(40 20% 99%)' : 'transparent',
      color: i === 0 ? 'hsl(24 10% 10%)' : 'hsl(24 6% 50%)',
      boxShadow: i === 0 ? '0 1px 2px hsl(24 10% 10% / .08)' : 'none',
      fontWeight: 500,
      cursor: 'pointer'
    }
  }, t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'hsl(40 20% 99%)',
      border: '1px solid hsl(35 12% 89% / 0.6)',
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 18,
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 8px 24px hsl(24 10% 10% / .05)'
    }
  }, /*#__PURE__*/React.createElement(WorldMap, {
    geo: geo,
    maxRev: maxRev
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(FocusCard, {
    m: MARKETS.find(x => x.c === 'JP')
  }), /*#__PURE__*/React.createElement(RegionBars, null), /*#__PURE__*/React.createElement(AtlasAlerts, null)))));
}
function WorldMap({
  geo,
  maxRev
}) {
  const W = 1100,
    H = 480;
  // dot-matrix continents — hand-drawn coarse shapes as dot grid
  const continents = {
    // rough polygon regions in %: [minX, maxX, minY, maxY, exclusions?]
    NAmerica: [[8, 30, 18, 50]],
    SAmerica: [[22, 34, 48, 75]],
    Europe: [[44, 56, 22, 38]],
    Africa: [[48, 60, 36, 65]],
    Asia: [[56, 90, 20, 52]],
    Oceania: [[82, 96, 62, 78]]
  };
  // generate dots
  const dots = [];
  const stride = 2.2;
  for (const region of Object.values(continents)) {
    for (const [x0, x1, y0, y1] of region) {
      for (let y = y0; y <= y1; y += stride) {
        for (let x = x0; x <= x1; x += stride) {
          // jittered organic feel
          const j = Math.sin(x * 3.1 + y * 2.7) * 0.5;
          // ragged edges: skip dots near boundary with some probability
          const edge = Math.min(x - x0, x1 - x, y - y0, y1 - y);
          if (edge < stride * 0.8 && Math.random() > 0.55) continue;
          dots.push({
            x: x + j * 0.8,
            y: y + j * 0.6
          });
        }
      }
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: 480
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    style: {
      width: '100%',
      height: '100%',
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: "bloom",
    cx: "50%",
    cy: "30%",
    r: "60%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "hsl(40 88% 42% / 0.04)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "transparent"
  }))), /*#__PURE__*/React.createElement("rect", {
    width: W,
    height: H,
    fill: "hsl(40 18% 97%)"
  }), /*#__PURE__*/React.createElement("rect", {
    width: W,
    height: H,
    fill: "url(#bloom)"
  }), [0, 25, 50, 75, 100].map(p => /*#__PURE__*/React.createElement("line", {
    key: 'v' + p,
    x1: p / 100 * W,
    x2: p / 100 * W,
    y1: 0,
    y2: H,
    stroke: "hsl(35 12% 89%)",
    strokeWidth: "0.5",
    strokeDasharray: "2 4",
    opacity: "0.6"
  })), [25, 50, 75].map(p => /*#__PURE__*/React.createElement("line", {
    key: 'h' + p,
    x1: 0,
    x2: W,
    y1: p / 100 * H,
    y2: p / 100 * H,
    stroke: "hsl(35 12% 89%)",
    strokeWidth: "0.5",
    strokeDasharray: "2 4",
    opacity: "0.6"
  })), dots.map((d, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: d.x / 100 * W,
    cy: d.y / 100 * H,
    r: "1.4",
    fill: "hsl(24 10% 10% / 0.14)"
  })), /*#__PURE__*/React.createElement(ShipmentArcs, {
    geo: geo,
    W: W,
    H: H
  }), MARKETS.map(m => {
    const g = geo[m.c];
    if (!g) return null;
    const cx = g.x / 100 * W,
      cy = g.y / 100 * H;
    const size = 10 + m.rev / Math.max(...MARKETS.map(x => x.rev)) * 28;
    const fill = m.status === 'healthy' ? 'hsl(40 88% 42%)' : m.status === 'low-cover' ? 'hsl(0 68% 48%)' : 'hsl(215 72% 50%)';
    return /*#__PURE__*/React.createElement("g", {
      key: m.c
    }, /*#__PURE__*/React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: size,
      fill: `${fill.replace(')', ' / 0.12)')}`,
      stroke: fill,
      strokeWidth: "1.2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: size * 0.55,
      fill: fill,
      opacity: "0.85"
    }), /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy + 3,
      textAnchor: "middle",
      fontFamily: "var(--font-mono)",
      fontSize: "9.5",
      fontWeight: "600",
      fill: "hsl(40 20% 99%)",
      letterSpacing: "0.02em"
    }, m.c), /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy + size + 12,
      textAnchor: "middle",
      fontFamily: "var(--font-mono)",
      fontSize: "9",
      fill: "hsl(24 10% 10%)",
      fontWeight: "500"
    }, "$", (m.rev / 1000).toFixed(1), "M \xB7 ", m.st, "%"));
  }), /*#__PURE__*/React.createElement("g", {
    transform: `translate(28, ${H - 76})`
  }, /*#__PURE__*/React.createElement("rect", {
    x: -6,
    y: -14,
    width: 220,
    height: 66,
    rx: "8",
    fill: "hsl(40 20% 99%)",
    stroke: "hsl(35 12% 89%)",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("text", {
    x: 6,
    y: 0,
    fontSize: "9",
    fontFamily: "var(--font-mono)",
    fill: "hsl(24 6% 50%)",
    letterSpacing: "0.1em"
  }, "LEGEND"), /*#__PURE__*/React.createElement("circle", {
    cx: 14,
    cy: 16,
    r: "8",
    fill: "hsl(40 88% 42% / 0.12)",
    stroke: "hsl(40 88% 42%)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: 14,
    cy: 16,
    r: "4",
    fill: "hsl(40 88% 42%)"
  }), /*#__PURE__*/React.createElement("text", {
    x: 28,
    y: 19,
    fontSize: "10",
    fontFamily: "var(--font-body)",
    fill: "hsl(24 10% 10%)"
  }, "healthy"), /*#__PURE__*/React.createElement("circle", {
    cx: 86,
    cy: 16,
    r: "8",
    fill: "hsl(0 68% 48% / 0.12)",
    stroke: "hsl(0 68% 48%)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: 86,
    cy: 16,
    r: "4",
    fill: "hsl(0 68% 48%)"
  }), /*#__PURE__*/React.createElement("text", {
    x: 100,
    y: 19,
    fontSize: "10",
    fontFamily: "var(--font-body)",
    fill: "hsl(24 10% 10%)"
  }, "low cover"), /*#__PURE__*/React.createElement("circle", {
    cx: 158,
    cy: 16,
    r: "8",
    fill: "hsl(215 72% 50% / 0.12)",
    stroke: "hsl(215 72% 50%)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: 158,
    cy: 16,
    r: "4",
    fill: "hsl(215 72% 50%)"
  }), /*#__PURE__*/React.createElement("text", {
    x: 172,
    y: 19,
    fontSize: "10",
    fontFamily: "var(--font-body)",
    fill: "hsl(24 10% 10%)"
  }, "overstock"), /*#__PURE__*/React.createElement("text", {
    x: 6,
    y: 42,
    fontSize: "9",
    fontFamily: "var(--font-body)",
    fill: "hsl(24 6% 50%)",
    letterSpacing: "0"
  }, "Ring size = MTD revenue \xB7 arcs = in-transit shipments"))));
}
function ShipmentArcs({
  geo,
  W,
  H
}) {
  // top manufacturer is Japan; arcs go from JP to markets with in-transit > 0
  const src = geo.JP;
  const sx = src.x / 100 * W,
    sy = src.y / 100 * H;
  return /*#__PURE__*/React.createElement("g", null, MARKETS.filter(m => m.intran > 0 && m.c !== 'JP').map(m => {
    const g = geo[m.c];
    if (!g) return null;
    const tx = g.x / 100 * W,
      ty = g.y / 100 * H;
    const mx = (sx + tx) / 2,
      my = Math.min(sy, ty) - 60;
    return /*#__PURE__*/React.createElement("g", {
      key: m.c
    }, /*#__PURE__*/React.createElement("path", {
      d: `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`,
      stroke: "hsl(40 88% 42%)",
      strokeWidth: "1",
      fill: "none",
      strokeDasharray: "3 3",
      opacity: "0.55"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: tx,
      cy: ty,
      r: "2",
      fill: "hsl(40 88% 42%)",
      opacity: "0.8"
    }));
  }));
}
function FocusCard({
  m
}) {
  const s = statusMap[m.status];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'hsl(40 20% 99%)',
      border: '1px solid hsl(35 12% 89% / 0.6)',
      borderRadius: 14,
      padding: 18,
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 24,
      borderRadius: 4,
      background: 'hsl(37 14% 94%)',
      border: '1px solid hsl(35 12% 89%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: 14,
      fontWeight: 500,
      color: 'hsl(24 10% 10%)'
    }
  }, m.flag), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 17,
      fontWeight: 600
    }
  }, m.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'hsl(24 6% 50%)'
    }
  }, m.region, " \xB7 ", m.stores, " stores")), /*#__PURE__*/React.createElement(Pill, {
    tone: s.tone
  }, /*#__PURE__*/React.createElement(Dot, {
    tone: s.tone
  }), s.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10,
      marginTop: 12,
      paddingTop: 12,
      borderTop: '1px solid hsl(35 12% 89% / 0.6)'
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "REVENUE \xB7 MTD",
    val: `$${(m.rev / 1000).toFixed(2)}M`,
    sub: `${m.tr > 0 ? '+' : ''}${m.tr}% vs LM`,
    tone: m.tr > 0 ? 'up' : 'down'
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "SELL-THROUGH",
    val: `${m.st}%`,
    sub: "rolling 30d",
    tone: "up"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "COVER",
    val: `${m.cover}d`,
    sub: `${m.stock.toLocaleString()} cs on-hand`
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 10,
      background: 'hsl(37 14% 94% / 0.5)',
      borderRadius: 8,
      fontSize: 12,
      color: 'hsl(24 6% 50%)',
      lineHeight: 1.5
    }
  }, "Honsh\u016B distribution is running lean \u2014 2 in-transit, ETA 14 Apr (Kobe DC). Cover holding at 62 days."));
}
function Stat({
  label,
  val,
  sub,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'hsl(24 6% 50%)',
      fontWeight: 500
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '-.02em',
      marginTop: 4,
      fontFeatureSettings: '"tnum"'
    }
  }, val), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: tone === 'up' ? 'hsl(158 56% 30%)' : tone === 'down' ? 'hsl(0 68% 38%)' : 'hsl(24 6% 50%)',
      fontFamily: 'var(--font-mono)',
      marginTop: 2
    }
  }, sub));
}
function RegionBars() {
  const rows = [{
    r: 'APAC',
    rev: 4114,
    share: 48
  }, {
    r: 'Americas',
    rev: 3264,
    share: 38
  }, {
    r: 'EMEA',
    rev: 1206,
    share: 14
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'hsl(40 20% 99%)',
      border: '1px solid hsl(35 12% 89% / 0.6)',
      borderRadius: 14,
      padding: 18,
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 15,
      fontWeight: 500,
      marginBottom: 4
    }
  }, "By region"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'hsl(24 6% 50%)',
      marginBottom: 14
    }
  }, "MTD revenue"), rows.map(row => /*#__PURE__*/React.createElement("div", {
    key: row.r,
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, row.r), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "$", (row.rev / 1000).toFixed(2), "M ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'hsl(24 6% 50%)',
      marginLeft: 6
    }
  }, row.share, "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 999,
      background: 'hsl(37 14% 94%)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${row.share}%`,
      height: '100%',
      background: row.r === 'APAC' ? 'hsl(24 10% 10%)' : row.r === 'Americas' ? 'hsl(35 18% 52%)' : 'hsl(40 88% 42%)'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 14,
      borderTop: '1px solid hsl(35 12% 89% / 0.6)',
      fontSize: 11,
      color: 'hsl(24 6% 50%)'
    }
  }, "Strongest MoM mover: ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'hsl(40 88% 32%)'
    }
  }, "South Korea \xB7 +18.6%")));
}
function AtlasAlerts() {
  const flagged = MARKETS.filter(m => m.status !== 'healthy');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'hsl(40 20% 99%)',
      border: '1px solid hsl(35 12% 89% / 0.6)',
      borderRadius: 14,
      padding: '18px 0',
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 18px 12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 15,
      fontWeight: 500
    }
  }, "Needs attention"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'hsl(24 6% 50%)',
      marginTop: 2
    }
  }, flagged.length, " markets off-healthy")), /*#__PURE__*/React.createElement("a", {
    style: {
      fontSize: 11,
      color: 'hsl(40 88% 32%)',
      fontWeight: 500
    }
  }, "Alerts hub \u2192")), flagged.map(m => {
    const s = statusMap[m.status];
    return /*#__PURE__*/React.createElement("div", {
      key: m.c,
      style: {
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderTop: '1px solid hsl(35 12% 89% / 0.4)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 22,
        height: 16,
        borderRadius: 3,
        background: 'hsl(37 14% 94%)',
        border: '1px solid hsl(35 12% 89%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fontWeight: 500
      }
    }, m.flag), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        fontSize: 13,
        fontWeight: 500
      }
    }, m.name), /*#__PURE__*/React.createElement(Pill, {
      tone: s.tone
    }, s.label));
  }));
}
window.V2Cartographic = V2Cartographic;
})(); } catch (e) { __ds_ns.__errors.push({ path: "markets/v2-cartographic.jsx", error: String((e && e.message) || e) }); }

// markets/v3-timeline.jsx
try { (() => {
// V3 — Ops timeline. Horizontal time spine foregrounding shipment motion.
function V3Timeline() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      height: '100%',
      fontFamily: 'var(--font-body)',
      background: 'hsl(40 18% 97%)',
      fontSize: 14,
      color: 'hsl(24 10% 10%)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: "Global markets"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement(Btn, {
    variant: "outline"
  }, /*#__PURE__*/React.createElement(I, {
    d: Icons.calendar,
    size: 14
  }), " Apr 1 \u2014 Apr 30"), /*#__PURE__*/React.createElement(Btn, {
    variant: "primary"
  }, /*#__PURE__*/React.createElement(I, {
    d: Icons.plus,
    size: 14
  }), " Schedule shipment")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 36px 40px',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      color: 'hsl(24 6% 50%)',
      marginBottom: 6
    }
  }, "Global markets \xB7 ops timeline"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 30,
      fontWeight: 600,
      letterSpacing: '-.02em',
      margin: 0
    }
  }, "The month, in motion."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'hsl(24 6% 50%)',
      fontSize: 14,
      margin: '6px 0 0',
      maxWidth: '56ch'
    }
  }, "Every market on one spine. Revenue rhythm on top; shipments, launches, and depletion events flow below.")), /*#__PURE__*/React.createElement(RhythmStrip, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'hsl(40 20% 99%)',
      border: '1px solid hsl(35 12% 89% / 0.6)',
      borderRadius: 14,
      padding: '18px 24px',
      marginBottom: 14,
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }
  }, /*#__PURE__*/React.createElement(DailyRevenue, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'hsl(40 20% 99%)',
      border: '1px solid hsl(35 12% 89% / 0.6)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }
  }, /*#__PURE__*/React.createElement(MarketTracks, null)))));
}
function RhythmStrip() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(MicroStat, {
    label: "Shipments in transit",
    val: "24",
    sub: "8 delivering this week"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 40,
      background: 'hsl(35 12% 89%)'
    }
  }), /*#__PURE__*/React.createElement(MicroStat, {
    label: "Avg MoM growth",
    val: "+6.8%",
    sub: "12 markets",
    tone: "up"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 40,
      background: 'hsl(35 12% 89%)'
    }
  }), /*#__PURE__*/React.createElement(MicroStat, {
    label: "Events \xB7 this week",
    val: "7",
    sub: "3 launches \xB7 4 audits"
  }));
}
function MicroStat({
  label,
  val,
  sub,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'hsl(24 6% 50%)',
      fontWeight: 500
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '-.02em',
      marginTop: 2,
      color: tone === 'up' ? 'hsl(158 56% 30%)' : 'hsl(24 10% 10%)',
      fontFeatureSettings: '"tnum"'
    }
  }, val), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'hsl(24 6% 50%)'
    }
  }, sub));
}

// Daily revenue mini-bars Apr 1-30 stacked by region
function DailyRevenue() {
  const days = 30;
  // synth: baseline with a mild sine + uplift
  const data = Array.from({
    length: days
  }, (_, i) => {
    const base = 240 + Math.sin(i * 0.6) * 40 + (i < 5 ? -30 : 0) + (i > 22 ? 30 : 0);
    return {
      apac: Math.round(base * 0.48 + Math.random() * 10),
      amer: Math.round(base * 0.38 + Math.random() * 10),
      emea: Math.round(base * 0.14 + Math.random() * 6),
      d: i + 1
    };
  });
  const W = 1100,
    H = 120,
    pad = 24;
  const bw = (W - pad * 2) / days * 0.72;
  const gap = (W - pad * 2) / days - bw;
  const maxV = Math.max(...data.map(d => d.apac + d.amer + d.emea)) + 20;
  const y = v => H - 20 - v / maxV * (H - 44);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 15,
      fontWeight: 500
    }
  }, "Daily revenue \xB7 April"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'hsl(24 6% 50%)',
      marginTop: 2
    }
  }, "Stacked by region \xB7 $K")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      fontSize: 11,
      color: 'hsl(24 6% 50%)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: 'hsl(24 10% 10%)'
    }
  }), "APAC"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: 'hsl(35 18% 52%)'
    }
  }), "Americas"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: 'hsl(40 88% 42%)'
    }
  }), "EMEA"))), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    style: {
      width: '100%',
      height: 120,
      display: 'block'
    }
  }, data.map((_, i) => {
    const dow = (i + 2) % 7; // Apr 1 2026 is a Wed; weekend = Sat(4), Sun(5)
    if (dow !== 4 && dow !== 5) return null;
    return /*#__PURE__*/React.createElement("rect", {
      key: 'w' + i,
      x: pad + i * (bw + gap) - gap / 2,
      y: 8,
      width: bw + gap,
      height: H - 28,
      fill: "hsl(37 14% 94% / 0.4)"
    });
  }), data.map((d, i) => {
    const x = pad + i * (bw + gap);
    const total = d.apac + d.amer + d.emea;
    const yEmea = y(total);
    const yAmer = y(d.apac + d.amer);
    const yApac = y(d.apac);
    const yBase = H - 20;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("rect", {
      x: x,
      y: yEmea,
      width: bw,
      height: yAmer - yEmea,
      fill: "hsl(40 88% 42%)",
      opacity: "0.9"
    }), /*#__PURE__*/React.createElement("rect", {
      x: x,
      y: yAmer,
      width: bw,
      height: yApac - yAmer,
      fill: "hsl(35 18% 52%)"
    }), /*#__PURE__*/React.createElement("rect", {
      x: x,
      y: yApac,
      width: bw,
      height: yBase - yApac,
      fill: "hsl(24 10% 10%)"
    }));
  }), [1, 8, 15, 22, 30].map(d => /*#__PURE__*/React.createElement("g", {
    key: d
  }, /*#__PURE__*/React.createElement("line", {
    x1: pad + (d - 1) * (bw + gap) + bw / 2,
    x2: pad + (d - 1) * (bw + gap) + bw / 2,
    y1: H - 18,
    y2: H - 14,
    stroke: "hsl(24 6% 50%)",
    strokeWidth: "0.8"
  }), /*#__PURE__*/React.createElement("text", {
    x: pad + (d - 1) * (bw + gap) + bw / 2,
    y: H - 4,
    textAnchor: "middle",
    fontSize: "9",
    fontFamily: "var(--font-mono)",
    fill: "hsl(24 6% 50%)"
  }, d))), /*#__PURE__*/React.createElement("line", {
    x1: pad + 17 * (bw + gap) + bw / 2,
    x2: pad + 17 * (bw + gap) + bw / 2,
    y1: 8,
    y2: H - 18,
    stroke: "hsl(40 88% 42%)",
    strokeWidth: "1",
    strokeDasharray: "3 3"
  }), /*#__PURE__*/React.createElement("text", {
    x: pad + 17 * (bw + gap) + bw / 2,
    y: 14,
    textAnchor: "middle",
    fontSize: "9",
    fontFamily: "var(--font-mono)",
    fill: "hsl(40 88% 32%)",
    fontWeight: "600"
  }, "TODAY \xB7 18 APR")));
}

// Market tracks — each row a horizontal timeline with shipment bars + events
function MarketTracks() {
  // synth events for each market over Apr 1-30
  const events = {
    JP: [{
      type: 'ship',
      s: 2,
      e: 10,
      label: 'Kobe → Tokyo DC · 3,200 cs'
    }, {
      type: 'event',
      d: 22,
      label: 'Depletion audit'
    }],
    US: [{
      type: 'ship',
      s: 1,
      e: 14,
      label: 'Osaka → LA · 4,100 cs'
    }, {
      type: 'ship',
      s: 18,
      e: 29,
      label: 'Osaka → NJ · 2,800 cs',
      tone: 'gold'
    }, {
      type: 'event',
      d: 15,
      label: 'NY launch · Masa'
    }],
    SG: [{
      type: 'ship',
      s: 4,
      e: 12,
      label: 'Osaka → SG · 620 cs'
    }, {
      type: 'ship',
      s: 20,
      e: 28,
      label: 'Top-up · 340 cs',
      tone: 'gold'
    }],
    HK: [{
      type: 'ship',
      s: 6,
      e: 13,
      label: 'Osaka → HK · 480 cs'
    }, {
      type: 'event',
      d: 24,
      label: 'Peninsula tasting'
    }],
    GB: [{
      type: 'event',
      d: 9,
      label: 'Inventory freeze'
    }, {
      type: 'alert',
      d: 17,
      label: 'Cover > 80d · review'
    }],
    DE: [{
      type: 'event',
      d: 12,
      label: 'Berlin trade show'
    }, {
      type: 'alert',
      d: 19,
      label: 'Overstock · Frankfurt'
    }],
    FR: [{
      type: 'ship',
      s: 10,
      e: 19,
      label: 'Osaka → CDG · 560 cs'
    }, {
      type: 'event',
      d: 26,
      label: 'Le Clarence menu drop'
    }],
    CA: [{
      type: 'ship',
      s: 3,
      e: 15,
      label: 'Osaka → YVR · 380 cs'
    }],
    AU: [{
      type: 'ship',
      s: 7,
      e: 22,
      label: 'Osaka → MEL · 290 cs'
    }, {
      type: 'ship',
      s: 24,
      e: 30,
      label: 'Top-up · 180 cs',
      tone: 'gold'
    }],
    KR: [{
      type: 'ship',
      s: 2,
      e: 8,
      label: 'Osaka → ICN · 220 cs'
    }, {
      type: 'ship',
      s: 11,
      e: 17,
      label: 'Urgent · 180 cs',
      tone: 'red'
    }, {
      type: 'ship',
      s: 21,
      e: 28,
      label: 'Osaka → ICN · 260 cs',
      tone: 'gold'
    }, {
      type: 'event',
      d: 20,
      label: 'K-spirits week'
    }],
    AE: [{
      type: 'ship',
      s: 5,
      e: 16,
      label: 'Osaka → DXB · 140 cs'
    }, {
      type: 'ship',
      s: 22,
      e: 30,
      label: 'Urgent · 90 cs',
      tone: 'red'
    }],
    TW: [{
      type: 'ship',
      s: 8,
      e: 16,
      label: 'Osaka → TPE · 320 cs'
    }]
  };
  const days = 30;
  const W = 1100,
    LABEL_W = 180,
    ROW_H = 40;
  const trackW = W - LABEL_W - 20;
  const dx = d => LABEL_W + (d - 1) / (days - 1) * trackW;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: '1px solid hsl(35 12% 89% / 0.6)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 16,
      fontWeight: 500
    }
  }, "Market tracks"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'hsl(24 6% 50%)',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 500,
      color: 'hsl(24 10% 10%)'
    }
  }, "\u2501\u2501"), " shipment \xA0\xB7\xA0", /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 6,
      height: 6,
      borderRadius: 999,
      background: 'hsl(24 10% 10%)',
      verticalAlign: 'middle'
    }
  }), " event \xA0\xB7\xA0", /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 6,
      height: 6,
      borderRadius: 999,
      background: 'hsl(0 68% 48%)',
      verticalAlign: 'middle'
    }
  }), " alert")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      fontSize: 11,
      color: 'hsl(24 6% 50%)',
      fontFamily: 'var(--font-mono)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Apr 2026"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "30 days"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} 22`,
    style: {
      width: '100%',
      height: 22,
      display: 'block',
      borderBottom: '1px solid hsl(35 12% 89% / 0.6)'
    }
  }, [1, 5, 10, 15, 20, 25, 30].map(d => /*#__PURE__*/React.createElement("g", {
    key: d
  }, /*#__PURE__*/React.createElement("text", {
    x: dx(d),
    y: 14,
    textAnchor: "middle",
    fontSize: "9",
    fontFamily: "var(--font-mono)",
    fill: "hsl(24 6% 50%)"
  }, d))), /*#__PURE__*/React.createElement("line", {
    x1: dx(18),
    x2: dx(18),
    y1: 0,
    y2: 22,
    stroke: "hsl(40 88% 42%)",
    strokeWidth: "1",
    strokeDasharray: "2 2"
  })), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${MARKETS.length * ROW_H + 20}`,
    style: {
      width: '100%',
      height: MARKETS.length * ROW_H + 20,
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("line", {
    x1: dx(18),
    x2: dx(18),
    y1: 0,
    y2: MARKETS.length * ROW_H,
    stroke: "hsl(40 88% 42%)",
    strokeWidth: "1",
    strokeDasharray: "2 2",
    opacity: "0.5"
  }), Array.from({
    length: 30
  }).map((_, i) => {
    const dow = (i + 2) % 7;
    if (dow !== 4 && dow !== 5) return null;
    const x0 = dx(i + 1) - trackW / days / 2;
    return /*#__PURE__*/React.createElement("rect", {
      key: 'w' + i,
      x: x0,
      y: 0,
      width: trackW / days,
      height: MARKETS.length * ROW_H,
      fill: "hsl(37 14% 94% / 0.35)"
    });
  }), MARKETS.map((m, idx) => {
    const y0 = idx * ROW_H;
    const evs = events[m.c] || [];
    const s = statusMap[m.status];
    const toneFill = s.tone === 'green' ? 'hsl(158 56% 36%)' : s.tone === 'amber' ? 'hsl(38 90% 50%)' : 'hsl(215 72% 50%)';
    return /*#__PURE__*/React.createElement("g", {
      key: m.c
    }, idx > 0 && /*#__PURE__*/React.createElement("line", {
      x1: 0,
      x2: W,
      y1: y0,
      y2: y0,
      stroke: "hsl(35 12% 89% / 0.5)",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      x: 0,
      y: y0,
      width: LABEL_W,
      height: ROW_H,
      fill: "hsl(40 20% 99%)"
    }), /*#__PURE__*/React.createElement("line", {
      x1: LABEL_W,
      x2: LABEL_W,
      y1: y0,
      y2: y0 + ROW_H,
      stroke: "hsl(35 12% 89%)",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      x: 14,
      y: y0 + ROW_H / 2 - 9,
      width: 24,
      height: 18,
      rx: "3",
      fill: "hsl(37 14% 94%)",
      stroke: "hsl(35 12% 89%)"
    }), /*#__PURE__*/React.createElement("text", {
      x: 26,
      y: y0 + ROW_H / 2 + 4,
      textAnchor: "middle",
      fontFamily: "var(--font-mono)",
      fontSize: "9",
      fontWeight: "600",
      fill: "hsl(24 10% 10%)"
    }, m.flag), /*#__PURE__*/React.createElement("text", {
      x: 46,
      y: y0 + ROW_H / 2 + 1,
      fontFamily: "var(--font-body)",
      fontSize: "12",
      fontWeight: "500",
      fill: "hsl(24 10% 10%)"
    }, m.name), /*#__PURE__*/React.createElement("text", {
      x: 46,
      y: y0 + ROW_H / 2 + 14,
      fontFamily: "var(--font-mono)",
      fontSize: "9",
      fill: "hsl(24 6% 50%)"
    }, m.cover, "d cover \xB7 $", (m.rev / 1000).toFixed(1), "M"), /*#__PURE__*/React.createElement("circle", {
      cx: LABEL_W - 12,
      cy: y0 + ROW_H / 2,
      r: "3.5",
      fill: toneFill
    }), /*#__PURE__*/React.createElement("line", {
      x1: LABEL_W + 8,
      x2: W - 8,
      y1: y0 + ROW_H / 2,
      y2: y0 + ROW_H / 2,
      stroke: "hsl(35 12% 89%)",
      strokeWidth: "1",
      strokeDasharray: "2 3"
    }), evs.map((e, i) => {
      if (e.type === 'ship') {
        const x1 = dx(e.s),
          x2 = dx(e.e);
        const barFill = e.tone === 'red' ? 'hsl(0 68% 48%)' : e.tone === 'gold' ? 'hsl(40 88% 42%)' : 'hsl(24 10% 10%)';
        return /*#__PURE__*/React.createElement("g", {
          key: i
        }, /*#__PURE__*/React.createElement("rect", {
          x: x1,
          y: y0 + ROW_H / 2 - 6,
          width: x2 - x1,
          height: 12,
          rx: "2",
          fill: barFill,
          opacity: "0.88"
        }), x2 - x1 > 70 && /*#__PURE__*/React.createElement("text", {
          x: x1 + 6,
          y: y0 + ROW_H / 2 + 3,
          fontFamily: "var(--font-body)",
          fontSize: "9.5",
          fill: "hsl(40 20% 97%)",
          fontWeight: "500"
        }, e.label));
      } else if (e.type === 'event') {
        const x = dx(e.d);
        return /*#__PURE__*/React.createElement("g", {
          key: i
        }, /*#__PURE__*/React.createElement("circle", {
          cx: x,
          cy: y0 + ROW_H / 2,
          r: "5",
          fill: "hsl(40 20% 99%)",
          stroke: "hsl(24 10% 10%)",
          strokeWidth: "1.3"
        }), /*#__PURE__*/React.createElement("circle", {
          cx: x,
          cy: y0 + ROW_H / 2,
          r: "2",
          fill: "hsl(24 10% 10%)"
        }));
      } else {
        const x = dx(e.d);
        return /*#__PURE__*/React.createElement("g", {
          key: i
        }, /*#__PURE__*/React.createElement("circle", {
          cx: x,
          cy: y0 + ROW_H / 2,
          r: "5",
          fill: "hsl(0 68% 48% / 0.12)",
          stroke: "hsl(0 68% 48%)",
          strokeWidth: "1.3"
        }), /*#__PURE__*/React.createElement("circle", {
          cx: x,
          cy: y0 + ROW_H / 2,
          r: "2",
          fill: "hsl(0 68% 48%)"
        }));
      }
    }));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 18px',
      borderTop: '1px solid hsl(35 12% 89% / 0.6)',
      background: 'hsl(37 14% 94% / 0.4)',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      color: 'hsl(24 6% 50%)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "24 shipments tracked \xB7 7 events scheduled \xB7 3 alerts open"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "Updated 14:32 JST")));
}
window.V3Timeline = V3Timeline;
})(); } catch (e) { __ds_ns.__errors.push({ path: "markets/v3-timeline.jsx", error: String((e && e.message) || e) }); }

// tweaks-panel.jsx
try { (() => {
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  noDeckControls = false,
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  // Auto-inject a rail toggle when a <deck-stage> is on the page. The
  // toggle drives the deck's per-viewer _railVisible via window message;
  // state is mirrored from the same localStorage key the deck reads so
  // the control reflects reality across reloads. The mechanism is the
  // message — authors who want custom placement can post it directly
  // and pass noDeckControls to suppress this one.
  const hasDeckStage = React.useMemo(() => typeof document !== 'undefined' && !!document.querySelector('deck-stage'), []);
  // deck-stage enables its rail in connectedCallback, but this panel can
  // mount before that element has upgraded. The initial read catches the
  // common case; the listener covers mounting first. (Older deck-stage.js
  // copies still wait for the host's __omelette_rail_enabled postMessage —
  // same listener handles those.)
  const [railEnabled, setRailEnabled] = React.useState(() => hasDeckStage && !!document.querySelector('deck-stage')?._railEnabled);
  React.useEffect(() => {
    if (!hasDeckStage || railEnabled) return undefined;
    const onMsg = e => {
      if (e.data && e.data.type === '__omelette_rail_enabled') setRailEnabled(true);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [hasDeckStage, railEnabled]);
  const [railVisible, setRailVisible] = React.useState(() => {
    try {
      return localStorage.getItem('deck-stage.railVisible') !== '0';
    } catch (e) {
      return true;
    }
  });
  const toggleRail = on => {
    setRailVisible(on);
    window.postMessage({
      type: '__deck_rail_visible',
      on
    }, '*');
  };
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-noncommentable": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children, hasDeckStage && railEnabled && !noDeckControls && /*#__PURE__*/React.createElement(TweakSection, {
    label: "Deck"
  }, /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Thumbnail rail",
    value: railVisible,
    onChange: toggleRail
  })))));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "tweaks-panel.jsx", error: String((e && e.message) || e) }); }

})();
