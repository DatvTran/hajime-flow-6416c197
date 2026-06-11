// app/data.jsx — Mock data + AppStore context

// ─── Products ────────────────────────────────────────────────
const PRODUCTS_DATA = [
  { id:'HJM-FP-750', name:'Florin Peaks',       type:'Junmai Daiginjo', size:'750ml', cs:12, price:48, msrp:85,  status:'active',  safetyStock:240 },
  { id:'HJM-JN-720', name:'Junmai Shiro',        type:'Junmai',         size:'720ml', cs:12, price:32, msrp:58,  status:'active',  safetyStock:180 },
  { id:'HJM-RY-500', name:'Ryusui Reserve',      type:'Genshu',         size:'500ml', cs:6,  price:82, msrp:145, status:'active',  safetyStock:60  },
  { id:'HJM-YZ-720', name:'Yuzu Nigori',         type:'Nigori',         size:'720ml', cs:12, price:28, msrp:52,  status:'active',  safetyStock:120 },
  { id:'EU-FP-750',  name:'First Press Coffee',  type:'Coffee Rhum',    size:'750ml', cs:12, price:52, msrp:92,  status:'active',  safetyStock:200 },
  { id:'HJM-SP-750', name:'Hajime Sparkling',    type:'Sparkling',      size:'750ml', cs:12, price:44, msrp:78,  status:'limited', safetyStock:80  },
];

// ─── Accounts / CRM ─────────────────────────────────────────
const ACCOUNTS_DATA = [
  { id:'ACC-001', name:'Dante',           type:'restaurant', city:'New York',  country:'US', status:'active',   rep:'MT', rev30:3840, listings:3, lastOrder:'2025-04-05', tier:'key' },
  { id:'ACC-002', name:'Katana Kitten',   type:'bar',        city:'New York',  country:'US', status:'active',   rep:'MT', rev30:2100, listings:2, lastOrder:'2025-04-10', tier:'standard' },
  { id:'ACC-003', name:'Mace',            type:'bar',        city:'New York',  country:'US', status:'active',   rep:'MT', rev30:1680, listings:3, lastOrder:'2025-03-28', tier:'standard' },
  { id:'ACC-004', name:'The Drake Hotel', type:'hotel',      city:'Toronto',   country:'CA', status:'active',   rep:'EM', rev30:4200, listings:4, lastOrder:'2025-04-11', tier:'key' },
  { id:'ACC-005', name:'Bar Hemingway',   type:'bar',        city:'Paris',     country:'FR', status:'active',   rep:'PD', rev30:5100, listings:5, lastOrder:'2025-04-08', tier:'flagship' },
  { id:'ACC-006', name:'Quattro Mani',    type:'restaurant', city:'Milan',     country:'IT', status:'active',   rep:'PD', rev30:2880, listings:2, lastOrder:'2025-04-01', tier:'standard' },
  { id:'ACC-007', name:'Kioi Sakaba',     type:'bar',        city:'Tokyo',     country:'JP', status:'active',   rep:'YK', rev30:6200, listings:6, lastOrder:'2025-04-12', tier:'flagship' },
  { id:'ACC-008', name:'Liquid Gold',     type:'retail',     city:'Brooklyn',  country:'US', status:'active',   rep:'MT', rev30:1920, listings:2, lastOrder:'2025-04-07', tier:'standard' },
  { id:'ACC-009', name:'The Aviary',      type:'bar',        city:'Chicago',   country:'US', status:'prospect', rep:'MT', rev30:0,    listings:0, lastOrder:null,          tier:'standard' },
  { id:'ACC-010', name:'Bar Suntory',     type:'bar',        city:'New York',  country:'US', status:'active',   rep:'MT', rev30:1440, listings:2, lastOrder:'2025-03-15', tier:'standard' },
  { id:'ACC-011', name:'Verjus',          type:'restaurant', city:'Paris',     country:'FR', status:'active',   rep:'PD', rev30:2640, listings:3, lastOrder:'2025-04-03', tier:'standard' },
  { id:'ACC-012', name:'Noma',            type:'restaurant', city:'Copenhagen',country:'DK', status:'prospect', rep:'PD', rev30:0,    listings:0, lastOrder:null,          tier:'key' },
];

// ─── Sales Orders ────────────────────────────────────────────
const ORDERS_DATA = [
  { id:'SO-2604-001', account:'ACC-001', accountName:'Dante',         rep:'MT', market:'New York',   status:'approved',  lines:[{sku:'HJM-FP-750',qty:18,price:48},{sku:'HJM-JN-720',qty:6,price:32}], total:1056, orderDate:'2026-04-25', requestedDelivery:'2026-04-28', shipmentId:'SHP-041' },
  { id:'SO-2604-002', account:'ACC-002', accountName:'Katana Kitten',  rep:'MT', market:'New York',   status:'pending',   lines:[{sku:'HJM-FP-750',qty:6,price:48}],                                     total:288,  orderDate:'2026-04-25', requestedDelivery:'2026-04-29', shipmentId:null },
  { id:'SO-2604-003', account:'ACC-003', accountName:'Mace',           rep:'MT', market:'New York',   status:'pending',   lines:[{sku:'HJM-RY-500',qty:8,price:82}],                                     total:656,  orderDate:'2026-04-24', requestedDelivery:'2026-04-29', shipmentId:null },
  { id:'SO-2604-004', account:'ACC-004', accountName:'The Drake Hotel', rep:'EM', market:'Toronto',   status:'shipped',   lines:[{sku:'HJM-FP-750',qty:100,price:48}],                                   total:4800, orderDate:'2026-04-11', requestedDelivery:'2026-04-14', shipmentId:'SHP-038' },
  { id:'SO-2604-005', account:'ACC-005', accountName:'Bar Hemingway',  rep:'PD', market:'Paris',      status:'delivered', lines:[{sku:'HJM-FP-750',qty:40,price:48},{sku:'EU-FP-750',qty:12,price:52}],  total:2544, orderDate:'2026-04-02', requestedDelivery:'2026-04-07', actualDelivery:'2026-04-07', shipmentId:'SHP-035' },
  { id:'SO-2604-006', account:'ACC-007', accountName:'Kioi Sakaba',    rep:'YK', market:'Tokyo',      status:'confirmed', lines:[{sku:'HJM-FP-750',qty:120,price:48},{sku:'HJM-RY-500',qty:24,price:82}], total:7728, orderDate:'2026-04-13', requestedDelivery:'2026-04-20', shipmentId:null },
  { id:'SO-2604-007', account:'ACC-008', accountName:'Liquid Gold',    rep:'MT', market:'New York',   status:'pending',   lines:[{sku:'EU-FP-750',qty:12,price:52}],                                     total:624,  orderDate:'2026-04-26', requestedDelivery:'2026-04-30', shipmentId:null },
  { id:'SO-2604-008', account:'ACC-010', accountName:'Bar Suntory',    rep:'MT', market:'New York',   status:'draft',     lines:[{sku:'HJM-FP-750',qty:4,price:48}],                                     total:192,  orderDate:'2026-04-26', requestedDelivery:'2026-04-30', shipmentId:null },
];

// ─── Inventory ───────────────────────────────────────────────
const INVENTORY_DATA = [
  // Tokyo HQ warehouse
  { id:'INV-001', sku:'HJM-FP-750', location:'Tokyo HQ',    locType:'hq',          bottles:4820, reserved:480,  status:'available', batchId:'BATCH-2024-011', lotNo:'L2411-A', expiry:null   },
  { id:'INV-002', sku:'HJM-JN-720', location:'Tokyo HQ',    locType:'hq',          bottles:2160, reserved:144,  status:'available', batchId:'BATCH-2024-009', lotNo:'L2409-A', expiry:null   },
  { id:'INV-003', sku:'HJM-RY-500', location:'Tokyo HQ',    locType:'hq',          bottles:480,  reserved:48,   status:'available', batchId:'BATCH-2024-007', lotNo:'L2407-A', expiry:null   },
  // Empire Wines Brooklyn (distributor)
  { id:'INV-004', sku:'HJM-FP-750', location:'Empire Wines', locType:'distributor', bottles:1704, reserved:216, status:'available', batchId:'BATCH-2024-011', lotNo:'L2411-A', expiry:null   },
  { id:'INV-005', sku:'HJM-JN-720', location:'Empire Wines', locType:'distributor', bottles:552,  reserved:72,  status:'available', batchId:'BATCH-2024-009', lotNo:'L2409-A', expiry:null   },
  { id:'INV-006', sku:'EU-FP-750',  location:'Empire Wines', locType:'distributor', bottles:2616, reserved:144, status:'available', batchId:'BATCH-2024-012', lotNo:'L2412-A', expiry:null   },
  // Vinexpo Paris (distributor)
  { id:'INV-007', sku:'HJM-FP-750', location:'Vinexpo Paris', locType:'distributor', bottles:2880, reserved:480, status:'available', batchId:'BATCH-2024-011', lotNo:'L2411-B', expiry:null  },
  { id:'INV-008', sku:'EU-FP-750',  location:'Vinexpo Paris', locType:'distributor', bottles:1440, reserved:144, status:'available', batchId:'BATCH-2024-012', lotNo:'L2412-B', expiry:null  },
  // In transit
  { id:'INV-009', sku:'HJM-FP-750', location:'Tokyo → NYC',  locType:'in-transit',  bottles:1440, reserved:1440, status:'in-transit', batchId:'BATCH-2024-013', lotNo:'L2413-A', expiry:null },
];

// ─── Purchase Orders ─────────────────────────────────────────
const POS_DATA = [
  { id:'PO-2026-0418', sku:'HJM-FP-750', qty:1800, region:'Tokyo HQ',    status:'approved',     requested:'2026-04-11', shipDate:'2026-05-18', mfr:'Yamato Distillery', price:48, days:21 },
  { id:'PO-2026-0417', sku:'HJM-JN-720', qty:600,  region:'Vinexpo Paris',status:'in-production',requested:'2026-04-08', shipDate:'2026-05-04', mfr:'Yamato Distillery', price:32, days:21, progress:57 },
  { id:'PO-2026-0416', sku:'HJM-FP-750', qty:480,  region:'Vinexpo Paris',status:'shipped',      requested:'2026-03-12', shipDate:'2026-04-02', mfr:'Yamato Distillery', price:48, days:21 },
  { id:'PO-2026-0415', sku:'EU-FP-750',  qty:1200, region:'Empire Wines', status:'delivered',    requested:'2026-03-01', shipDate:'2026-03-22', mfr:'First Press Co.',   price:52, days:21 },
  { id:'PO-2026-0414', sku:'HJM-RY-500', qty:240,  region:'Tokyo HQ',    status:'pending',      requested:'2026-04-26', shipDate:null,          mfr:'Yamato Distillery', price:82, days:21 },
];

// ─── Shipments ───────────────────────────────────────────────
const SHIPMENTS_DATA = [
  { id:'SHP-041', orderId:'SO-2604-001', origin:'Empire Wines, Brooklyn', dest:'Dante, NYC',         carrier:'FedEx',         trackNo:'794644823', status:'in-transit', etd:'2026-04-26', eta:'2026-04-28', bottles:288 },
  { id:'SHP-040', orderId:'SO-2604-006', origin:'Tokyo HQ',              dest:'Kioi Sakaba, Tokyo',  carrier:'Yamato',        trackNo:'1234567890', status:'confirmed', etd:'2026-04-28', eta:'2026-04-30', bottles:2736 },
  { id:'SHP-039', orderId:'SO-2604-004', origin:'Toronto DC',            dest:'The Drake Hotel',     carrier:'Purolator',     trackNo:'PRL33881122', status:'in-transit', etd:'2026-04-25', eta:'2026-04-27', bottles:1200 },
  { id:'SHP-038', orderId:'SO-2604-004', origin:'Tokyo HQ',              dest:'Toronto DC',          carrier:'Air Canada',    trackNo:'AC778923',   status:'delivered', etd:'2026-04-08', eta:'2026-04-11', actualDelivery:'2026-04-11', bottles:1200 },
  { id:'SHP-035', orderId:'SO-2604-005', origin:'Vinexpo Paris',         dest:'Bar Hemingway, Paris',carrier:'Chronopost',    trackNo:'CP9934556',  status:'delivered', etd:'2026-04-05', eta:'2026-04-07', actualDelivery:'2026-04-07', bottles:624 },
  { id:'SHP-PO-016', orderId:'PO-2026-0416', origin:'Yamato Distillery', dest:'Vinexpo Paris',      carrier:'Air France',    trackNo:'AF119823',   status:'in-transit', etd:'2026-04-24', eta:'2026-04-28', bottles:5760 },
];

// ─── Depletion Reports ───────────────────────────────────────
const DEPLETIONS_DATA = [
  { id:'DEP-001', dist:'Empire Wines', sku:'HJM-FP-750', bottles:216, type:'fulfillment', account:'Dante',        date:'2026-04-27', time:'11:42' },
  { id:'DEP-002', dist:'Empire Wines', sku:'HJM-FP-750', bottles:72,  type:'fulfillment', account:'Katana Kitten',date:'2026-04-27', time:'11:38' },
  { id:'DEP-003', dist:'Empire Wines', sku:'EU-FP-750',  bottles:144, type:'fulfillment', account:'Liquid Gold',  date:'2026-04-27', time:'11:14' },
  { id:'DEP-004', dist:'Empire Wines', sku:'HJM-FP-750', bottles:24,  type:'sample',      account:'Staff tasting',date:'2026-04-27', time:'10:02', note:'Weekly staff tasting' },
  { id:'DEP-005', dist:'Empire Wines', sku:'EU-FP-750',  bottles:2880,type:'inbound',     account:'PO-2026-0415', date:'2026-04-27', time:'09:30' },
  { id:'DEP-006', dist:'Empire Wines', sku:'HJM-JN-720', bottles:48,  type:'fulfillment', account:'Mace',         date:'2026-04-26', time:'14:18' },
  { id:'DEP-007', dist:'Empire Wines', sku:'HJM-FP-750', bottles:12,  type:'breakage',    account:'Damage report',date:'2026-04-26', time:'09:55', note:'2 bottles dropped at receiving', pending:true },
];

// ─── Alerts ─────────────────────────────────────────────────
const ALERTS_DATA = [
  { id:'ALT-001', sev:'critical', type:'low-stock',    market:'Singapore',     msg:'FP-750 drops below safety stock in 22 days at current velocity',   link:'#/hq/inventory', ts:'2026-04-27T11:00' },
  { id:'ALT-002', sev:'critical', type:'low-stock',    market:'South Korea',   msg:'FP-750 and JN-720 combined cover < 19 days; urgent replenishment', link:'#/hq/inventory', ts:'2026-04-27T10:30' },
  { id:'ALT-003', sev:'high',     type:'pending-po',   market:'Tokyo HQ',     msg:'PO-2026-0414 awaiting sign-off — safety stock breach in 6 days',    link:'#/hq/purchase-orders', ts:'2026-04-27T09:15' },
  { id:'ALT-004', sev:'medium',   type:'overstock',    market:'United Kingdom',msg:'UK cover at 78 days — pause next PO or run a promotion?',           link:'#/hq/inventory', ts:'2026-04-26T18:00' },
  { id:'ALT-005', sev:'medium',   type:'overstock',    market:'Germany',       msg:'DE cover at 82 days',                                               link:'#/hq/inventory', ts:'2026-04-26T18:00' },
  { id:'ALT-006', sev:'high',     type:'shipment-delay',market:'Tokyo',        msg:'SHP-040 — ETA slipped 48h due to customs. Now Apr 30.',            link:'#/hq/shipments',ts:'2026-04-27T08:00' },
  { id:'ALT-007', sev:'low',      type:'reorder',      market:'New York',      msg:'Dante — last order 22 days ago, cadence 21d. Follow up due.',       link:'#/hq/accounts', ts:'2026-04-26T09:00' },
];

// ─── Visit Notes (Sales Rep) ─────────────────────────────────
const VISITS_DATA = [
  { id:'VIS-001', account:'ACC-001', accountName:'Dante',       rep:'MT', date:'2026-04-25', summary:'JP-2024 moving fast on the tasting menu. Chef interested in a dinner event.', draftId:'SO-2604-001', sentiment:'positive' },
  { id:'VIS-002', account:'ACC-002', accountName:'Katana Kitten',rep:'MT', date:'2026-04-25', summary:'Stock looks low — FP-750 almost out. Submitted urgent draft.', draftId:'SO-2604-002', sentiment:'neutral' },
  { id:'VIS-003', account:'ACC-010', accountName:'Bar Suntory',  rep:'MT', date:'2026-04-24', summary:'Manager changed. New buyer unfamiliar with the brand. Left sample.', draftId:null, sentiment:'needs-follow-up' },
];

// ─── Sales Rep Targets ───────────────────────────────────────
const TARGETS_DATA = [
  { rep:'MT', period:'Apr 2026', target:28000, actual:14820, currency:'USD', markets:['New York'], accounts:38 },
];

// ─── App Store Context + Mutations ──────────────────────────
const AppStoreCtx = React.createContext(null);

function AppStoreProvider({ children }) {
  const [orders,     setOrders]     = React.useState(ORDERS_DATA);
  const [inventory,  setInventory]  = React.useState(INVENTORY_DATA);
  const [pos,        setPOs]        = React.useState(POS_DATA);
  const [shipments,  setShipments]  = React.useState(SHIPMENTS_DATA);
  const [depletions, setDepletions] = React.useState(DEPLETIONS_DATA);
  const [alerts,     setAlerts]     = React.useState(ALERTS_DATA);
  const [accounts,   setAccounts]   = React.useState(ACCOUNTS_DATA);
  const [products]                  = React.useState(PRODUCTS_DATA);
  const [visits,     setVisits]     = React.useState(VISITS_DATA);
  const [toasts,     setToasts]     = React.useState([]);

  const toast = React.useCallback((msg, tone='success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3400);
  }, []);

  const approveOrder = React.useCallback((id) => {
    setOrders(os => os.map(o => o.id === id ? {...o, status:'approved'} : o));
    toast(`Order ${id} approved`);
  }, [toast]);

  const rejectOrder = React.useCallback((id) => {
    setOrders(os => os.map(o => o.id === id ? {...o, status:'cancelled'} : o));
    toast(`Order ${id} rejected`, 'info');
  }, [toast]);

  const updateOrderStatus = React.useCallback((id, status) => {
    setOrders(os => os.map(o => o.id === id ? {...o, status} : o));
    toast(`Order ${id} → ${status}`);
  }, [toast]);

  const approvePO = React.useCallback((id) => {
    setPOs(ps => ps.map(p => p.id === id ? {...p, status:'approved'} : p));
    toast(`${id} approved`);
  }, [toast]);

  const dismissAlert = React.useCallback((id) => {
    setAlerts(as => as.filter(a => a.id !== id));
  }, []);

  const addDepletion = React.useCallback((dep) => {
    const id = 'DEP-' + String(depletions.length + 1).padStart(3,'0');
    setDepletions(ds => [{...dep, id, time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}, ...ds]);
    toast('Depletion recorded');
  }, [depletions.length, toast]);

  const createOrder = React.useCallback((order) => {
    const id = 'SO-' + Date.now();
    setOrders(os => [{...order, id, status:'draft', orderDate:new Date().toISOString().slice(0,10)}, ...os]);
    toast(`Draft ${id} created`);
    return id;
  }, [toast]);

  const addVisit = React.useCallback((visit) => {
    const id = 'VIS-' + String(visits.length + 1).padStart(3,'0');
    setVisits(vs => [{...visit, id, date:new Date().toISOString().slice(0,10)}, ...vs]);
    toast('Visit note saved');
  }, [visits.length, toast]);

  return (
    <AppStoreCtx.Provider value={{
      orders, inventory, pos, shipments, depletions, alerts, accounts, products, visits,
      toasts, toast,
      approveOrder, rejectOrder, updateOrderStatus, approvePO, dismissAlert, addDepletion, createOrder, addVisit
    }}>
      {children}
    </AppStoreCtx.Provider>
  );
}

function useStore() { return React.useContext(AppStoreCtx); }

Object.assign(window, {
  AppStoreProvider, useStore,
  PRODUCTS_DATA, ACCOUNTS_DATA, ORDERS_DATA, INVENTORY_DATA, POS_DATA, SHIPMENTS_DATA, DEPLETIONS_DATA, ALERTS_DATA,
});
