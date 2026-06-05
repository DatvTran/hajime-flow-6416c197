// app/pages-hq.jsx — Brand Operator HQ all pages

// ─── HQ Dashboard ────────────────────────────────────────────
function HQDashboard() {
  const { orders, inventory, alerts, pos, shipments } = useStore();
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const totalBottles = inventory.reduce((a, i) => a + i.bottles, 0);
  const criticalAlerts = alerts.filter(a => a.sev === 'critical' || a.sev === 'high');
  const inTransit = shipments.filter(s => s.status === 'in-transit').length;

  return (
    <AppShell breadcrumb={['Command center']}>
      <PageHead
        title="Command center"
        sub="One view of sell-through, stock health, approvals, and logistics across every market."
        actions={<><Btn v="outline" icon={IC.filter}>All markets</Btn><Btn v="accent" icon={IC.plus}>New wholesale order</Btn></>}
      />

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24}}>
        <StatCard label="Global inventory" value={totalBottles.toLocaleString()} sub="bottles on hand" icon={IC.box} trend={8} tone="stone"/>
        <StatCard label="Pending approvals" value={pendingOrders.length} sub="need a decision" icon={IC.cart} tone={pendingOrders.length>3?'warm':'stone'}/>
        <StatCard label="In transit" value={inTransit} sub="active shipments" icon={IC.truck} tone="gold"/>
        <StatCard label="Active alerts" value={criticalAlerts.length} sub="critical + high" icon={IC.alert} tone={criticalAlerts.length>2?'warm':'stone'}/>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18, marginBottom:18}}>
        <HQApprovalQueue orders={pendingOrders}/>
        <HQAlertsFeed alerts={criticalAlerts.slice(0,5)}/>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18}}>
        <HQRecentOrders orders={orders.slice(0,6)}/>
        <HQMarketHealth/>
        <HQShipmentTracker shipments={shipments.slice(0,4)}/>
      </div>
    </AppShell>
  );
}

function HQApprovalQueue({ orders }) {
  const { approveOrder, rejectOrder } = useStore();
  const { navigate, role } = useRouter();
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Approval queue</div>
          <div style={{fontSize:12, color:T.muted, marginTop:2}}>{orders.length} items awaiting your decision</div>
        </div>
        <Btn v="ghost" sz="sm" onClick={() => navigate(`/${role}/orders`)}>View all</Btn>
      </div>
      {orders.length === 0
        ? <EmptyState icon={IC.check} title="Queue is clear" sub="No orders pending approval."/>
        : orders.slice(0,5).map(o => (
          <div key={o.id} style={{padding:'12px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'center'}}>
            <div>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:3}}>
                <span style={{fontFamily:T.mono, fontSize:11, fontWeight:600, color:T.ink}}>{o.id}</span>
                <Badge status={o.status}/>
              </div>
              <div style={{fontSize:13, fontWeight:500}}>{o.accountName}</div>
              <div style={{fontSize:12, color:T.muted}}>{o.market} · ${o.total.toLocaleString()}</div>
            </div>
            <div style={{display:'flex', gap:6}}>
              <Btn v="ghost" sz="sm" onClick={() => rejectOrder(o.id)}>Reject</Btn>
              <Btn v="primary" sz="sm" onClick={() => approveOrder(o.id)}>Approve</Btn>
            </div>
          </div>
        ))
      }
    </Card>
  );
}

function HQAlertsFeed({ alerts }) {
  const { dismissAlert } = useStore();
  const { navigate, role } = useRouter();
  const sevColor = { critical: T.red, high: T.amber, medium: T.blue, low: T.muted };
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Alerts</div>
          <div style={{fontSize:12, color:T.muted, marginTop:2}}>{alerts.length} items need attention</div>
        </div>
        <Btn v="ghost" sz="sm" onClick={() => navigate(`/${role}/alerts`)}>Hub</Btn>
      </div>
      {alerts.map(a => (
        <div key={a.id} style={{padding:'12px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'grid', gridTemplateColumns:'8px 1fr auto', gap:12, alignItems:'flex-start'}}>
          <div style={{width:6, height:6, borderRadius:999, background:sevColor[a.sev]||T.muted, marginTop:5}}/>
          <div>
            <div style={{fontSize:12, fontWeight:600, color:T.ink, textTransform:'capitalize', marginBottom:2}}>{a.sev} · {a.type.replace(/-/g,' ')}</div>
            <div style={{fontSize:12.5, color:T.muted, lineHeight:1.5}}>{a.msg}</div>
          </div>
          <button onClick={() => dismissAlert(a.id)} style={{background:'none', border:'none', cursor:'pointer', color:T.muted, marginTop:2}}>
            <Ico d={IC.x} size={13}/>
          </button>
        </div>
      ))}
    </Card>
  );
}

function HQRecentOrders({ orders }) {
  const { navigate, role } = useRouter();
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
        <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Recent orders</div>
        <Btn v="ghost" sz="sm" onClick={() => navigate(`/${role}/orders`)}>All orders</Btn>
      </div>
      {orders.map(o => (
        <div key={o.id} onClick={() => navigate(`/${role}/orders/${o.id}`)} style={{
          padding:'11px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'grid',
          gridTemplateColumns:'1fr auto', gap:8, cursor:'pointer', transition:'background .12s'
        }} onMouseEnter={e=>e.currentTarget.style.background=T.surface} onMouseLeave={e=>e.currentTarget.style.background=''}>
          <div>
            <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:2}}>
              <span style={{fontFamily:T.mono, fontSize:11, fontWeight:500}}>{o.id}</span>
              <Badge status={o.status} size="xs"/>
            </div>
            <div style={{fontSize:12.5, fontWeight:500}}>{o.accountName}</div>
            <div style={{fontSize:11.5, color:T.muted}}>{o.market}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:T.mono, fontSize:13, fontWeight:600}}>${o.total.toLocaleString()}</div>
            <div style={{fontSize:11, color:T.muted}}>{o.orderDate}</div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function HQMarketHealth() {
  const markets = [
    {c:'JP', name:'Japan',     st:94, cover:62, tone:'green'},
    {c:'US', name:'US',        st:88, cover:41, tone:'green'},
    {c:'SG', name:'Singapore', st:91, cover:22, tone:'amber'},
    {c:'KR', name:'S. Korea',  st:89, cover:19, tone:'amber'},
    {c:'GB', name:'UK',        st:72, cover:78, tone:'blue'},
    {c:'FR', name:'France',    st:79, cover:54, tone:'green'},
  ];
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`}}>
        <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Market health</div>
        <div style={{fontSize:12, color:T.muted, marginTop:2}}>Sell-through · cover days</div>
      </div>
      {markets.map(m => {
        const dotC = m.tone==='green'?T.green:m.tone==='amber'?T.amber:T.blue;
        return (
          <div key={m.c} style={{padding:'10px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'grid', gridTemplateColumns:'32px 1fr auto', gap:12, alignItems:'center'}}>
            <div style={{fontFamily:T.mono, fontSize:11, fontWeight:600, color:T.muted, padding:'2px 6px', background:T.surface, borderRadius:4, textAlign:'center'}}>{m.c}</div>
            <div>
              <div style={{fontSize:12.5, fontWeight:500}}>{m.name}</div>
              <div style={{height:4, borderRadius:999, background:T.surface, overflow:'hidden', marginTop:4, width:80}}>
                <div style={{width:`${m.st}%`, height:'100%', background:dotC}}/>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:12, fontWeight:600, fontFamily:T.mono, color: m.cover<30?T.red:m.cover>70?T.blue:T.ink}}>{m.cover}d</div>
              <div style={{fontSize:10, color:T.muted}}>cover</div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function HQShipmentTracker({ shipments }) {
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`}}>
        <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Shipment tracker</div>
        <div style={{fontSize:12, color:T.muted, marginTop:2}}>Active movements</div>
      </div>
      {shipments.map(s => (
        <div key={s.id} style={{padding:'12px 18px', borderBottom:`1px solid ${T.borderQ}`}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
            <span style={{fontFamily:T.mono, fontSize:11, fontWeight:600}}>{s.id}</span>
            <Badge status={s.status} size="xs"/>
          </div>
          <div style={{fontSize:12, color:T.muted, marginTop:4}}>{s.origin}</div>
          <div style={{fontSize:12, color:T.muted}}>→ {s.dest}</div>
          <div style={{fontSize:11, fontFamily:T.mono, color:T.muted, marginTop:4}}>ETA {s.eta}</div>
        </div>
      ))}
    </Card>
  );
}

// ─── Orders List ─────────────────────────────────────────────
function HQOrders() {
  const { orders, approveOrder, rejectOrder } = useStore();
  const { navigate, role } = useRouter();
  const [tab, setTab] = React.useState('all');
  const [showCreate, setShowCreate] = React.useState(false);

  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);
  const tabs = [
    {id:'all', label:`All · ${orders.length}`},
    {id:'pending', label:`Pending · ${orders.filter(o=>o.status==='pending').length}`},
    {id:'approved', label:`Approved · ${orders.filter(o=>o.status==='approved').length}`},
    {id:'shipped', label:`Shipped · ${orders.filter(o=>o.status==='shipped').length}`},
    {id:'delivered', label:`Delivered · ${orders.filter(o=>o.status==='delivered').length}`},
  ];

  return (
    <AppShell breadcrumb={['Orders']}>
      <PageHead title="Orders" sub="All sales orders across every channel and market."
        actions={<><Btn v="outline" icon={IC.dl}>Export CSV</Btn><Btn v="accent" icon={IC.plus} onClick={()=>setShowCreate(true)}>New order</Btn></>}/>
      <div style={{marginBottom:16}}><Tabs tabs={tabs} active={tab} onChange={setTab}/></div>
      <Card padded={false}>
        <Table
          cols={[
            {key:'id', label:'Order ID', mono:true, bold:true, render:r=><span style={{color:T.gold, fontFamily:T.mono, fontSize:12}}>{r.id}</span>},
            {key:'accountName', label:'Account'},
            {key:'market', label:'Market'},
            {key:'orderDate', label:'Date', mono:true},
            {key:'total', label:'Total', right:true, mono:true, render:r=>`$${r.total.toLocaleString()}`},
            {key:'status', label:'Status', sortable:false, render:r=><Badge status={r.status}/>},
            {key:'_act', label:'', sortable:false, render:r=>(
              r.status==='pending'
                ? <div style={{display:'flex',gap:4}}><Btn v="ghost" sz="xs" onClick={e=>{e.stopPropagation();rejectOrder(r.id)}}>Reject</Btn><Btn v="primary" sz="xs" onClick={e=>{e.stopPropagation();approveOrder(r.id)}}>Approve</Btn></div>
                : <Btn v="ghost" sz="xs" onClick={e=>{e.stopPropagation();navigate(`/${role}/orders/${r.id}`)}}><Ico d={IC.eye} size={13}/></Btn>
            )},
          ]}
          rows={filtered}
          onRow={r => navigate(`/${role}/orders/${r.id}`)}
          emptyMsg="No orders in this status."
        />
      </Card>
      <CreateOrderModal open={showCreate} onClose={()=>setShowCreate(false)}/>
    </AppShell>
  );
}

function CreateOrderModal({ open, onClose }) {
  const { accounts } = useStore();
  const { createOrder } = useStore();
  const [acct, setAcct] = React.useState('');
  const [market, setMarket] = React.useState('New York');
  const [lines, setLines] = React.useState([{sku:'HJM-FP-750', qty:12, price:48}]);

  const total = lines.reduce((a,l) => a + l.qty * l.price, 0);

  return (
    <Modal open={open} onClose={onClose} title="New sales order" width={680}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20}}>
        <Field label="Account">
          <Select value={acct} onChange={e=>setAcct(e.target.value)}
            options={[{value:'',label:'Select account…'}, ...accounts.map(a=>({value:a.id, label:a.name}))]}/>
        </Field>
        <Field label="Market">
          <Select value={market} onChange={e=>setMarket(e.target.value)}
            options={['New York','Toronto','Paris','Milan','Tokyo','Singapore','Hong Kong']}/>
        </Field>
      </div>
      <div style={{fontWeight:500, fontSize:13, marginBottom:10}}>Order lines</div>
      {lines.map((l,i) => (
        <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 80px 80px 32px', gap:8, marginBottom:8}}>
          <Select value={l.sku} onChange={e=>setLines(ls=>ls.map((x,j)=>j===i?{...x,sku:e.target.value}:x))}
            options={PRODUCTS_DATA.map(p=>({value:p.id,label:p.name}))}/>
          <Input value={l.qty} onChange={e=>setLines(ls=>ls.map((x,j)=>j===i?{...x,qty:+e.target.value}:x))} type="number" placeholder="Qty" mono/>
          <Input value={l.price} onChange={e=>setLines(ls=>ls.map((x,j)=>j===i?{...x,price:+e.target.value}:x))} type="number" placeholder="Price" mono/>
          <Btn v="ghost" sz="sm" onClick={()=>setLines(ls=>ls.filter((_,j)=>j!==i))}><Ico d={IC.x} size={14}/></Btn>
        </div>
      ))}
      <Btn v="soft" sz="sm" icon={IC.plus} onClick={()=>setLines(l=>[...l,{sku:'HJM-FP-750',qty:12,price:48}])}>Add line</Btn>
      <div style={{marginTop:20, paddingTop:16, borderTop:`1px solid ${T.borderQ}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontFamily:T.mono, fontSize:15, fontWeight:600}}>Total: ${total.toLocaleString()}</div>
        <div style={{display:'flex', gap:8}}>
          <Btn v="outline" onClick={onClose}>Cancel</Btn>
          <Btn v="accent" onClick={()=>{createOrder({account:acct,accountName:accounts.find(a=>a.id===acct)?.name||'Unknown',market,lines,total});onClose();}}>Create draft</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Order Detail ─────────────────────────────────────────────
function HQOrderDetail() {
  const { parts, navigate, role } = useRouter();
  const { orders, approveOrder, rejectOrder, updateOrderStatus } = useStore();
  const orderId = parts[2];
  const order = orders.find(o => o.id === orderId);

  if (!order) return <AppShell><EmptyState title="Order not found" sub={`No order with ID ${orderId}`}/></AppShell>;

  return (
    <AppShell breadcrumb={['Orders', order.id]}>
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24, marginBottom:24}}>
        <div>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
            <span style={{fontFamily:T.mono, fontSize:13, color:T.muted}}>{order.id}</span>
            <Badge status={order.status}/>
          </div>
          <h1 style={{fontFamily:T.display, fontSize:28, fontWeight:600, letterSpacing:'-.02em', margin:0}}>{order.accountName}</h1>
          <div style={{fontSize:14, color:T.muted, marginTop:4}}>{order.market} · Ordered {order.orderDate}</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          {order.status === 'pending' && <>
            <Btn v="outline" onClick={()=>{rejectOrder(order.id); navigate(`/${role}/orders`);}}>Reject</Btn>
            <Btn v="primary" onClick={()=>approveOrder(order.id)}>Approve</Btn>
          </>}
          {order.status === 'approved' && <Btn v="primary" onClick={()=>updateOrderStatus(order.id,'shipped')}>Mark shipped</Btn>}
          {order.status === 'shipped' && <Btn v="primary" onClick={()=>updateOrderStatus(order.id,'delivered')}>Mark delivered</Btn>}
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:18}}>
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <Card>
            <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:16}}>Order lines</div>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, fontFamily:T.body}}>
              <thead><tr>{['SKU','Product','Qty','Unit price','Line total'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 0',fontWeight:500,color:T.muted,fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',borderBottom:`1px solid ${T.borderQ}`}}>{h}</th>)}</tr></thead>
              <tbody>
                {order.lines.map((l,i) => {
                  const prod = PRODUCTS_DATA.find(p => p.id === l.sku);
                  return (
                    <tr key={i} style={{borderBottom:`1px solid ${T.borderQ}`}}>
                      <td style={{padding:'10px 0',fontFamily:T.mono,fontSize:12}}>{l.sku}</td>
                      <td style={{padding:'10px 0'}}>{prod?.name||l.sku}</td>
                      <td style={{padding:'10px 0',fontFamily:T.mono}}>{l.qty}</td>
                      <td style={{padding:'10px 0',fontFamily:T.mono}}>${l.price}</td>
                      <td style={{padding:'10px 0',fontFamily:T.mono,fontWeight:600}}>${(l.qty*l.price).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr><td colSpan={4} style={{padding:'10px 0',fontWeight:600}}>Total</td><td style={{padding:'10px 0',fontFamily:T.mono,fontWeight:700,fontSize:15}}>${order.total.toLocaleString()}</td></tr></tfoot>
            </table>
          </Card>
          <Card>
            <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:12}}>Status history</div>
            {[{s:'Draft created',t:order.orderDate},{s:'Submitted for approval',t:order.orderDate},{s:order.status==='delivered'?'Delivered':order.status==='shipped'?'Shipped':order.status==='approved'?'Approved':'Awaiting decision',t:'—'}].map((h,i)=>(
              <div key={i} style={{display:'flex', gap:12, alignItems:'flex-start', marginBottom:12}}>
                <div style={{width:8,height:8,borderRadius:999,background:i===2?T.gold:T.green,marginTop:4,flexShrink:0}}/>
                <div><div style={{fontSize:13,fontWeight:500}}>{h.s}</div><div style={{fontSize:12,color:T.muted,fontFamily:T.mono}}>{h.t}</div></div>
              </div>
            ))}
          </Card>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <Card>
            <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:14}}>Details</div>
            {[['Account',order.accountName],['Market',order.market],['Rep',order.rep],['Order date',order.orderDate],['Requested delivery',order.requestedDelivery],['Shipment',order.shipmentId||'—']].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
                <span style={{color:T.muted}}>{l}</span><span style={{fontWeight:500,fontFamily:l==='Shipment'?T.mono:T.body}}>{v}</span>
              </div>
            ))}
          </Card>
          {order.shipmentId && (
            <Card>
              <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:12}}>Linked shipment</div>
              <div style={{fontFamily:T.mono, fontSize:13, fontWeight:600, color:T.gold, marginBottom:4}}>{order.shipmentId}</div>
              <Badge status="in-transit"/>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ─── Inventory ────────────────────────────────────────────────
function HQInventory() {
  const { inventory } = useStore();
  const { navigate, role } = useRouter();
  return (
    <AppShell breadcrumb={['Inventory']}>
      <PageHead title="Inventory" sub="All stock across HQ warehouses, distributors and in-transit locations."
        actions={<><Btn v="outline" icon={IC.dl}>Export</Btn><Btn v="accent" icon={IC.plus}>Receive stock</Btn></>}/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="Total on hand" value={inventory.filter(i=>i.locType!=='in-transit').reduce((a,i)=>a+i.bottles,0).toLocaleString()} sub="bottles · all locations" icon={IC.box} tone="stone"/>
        <StatCard label="In transit" value={inventory.filter(i=>i.locType==='in-transit').reduce((a,i)=>a+i.bottles,0).toLocaleString()} sub="bottles moving" icon={IC.truck} tone="gold"/>
        <StatCard label="Reserved" value={inventory.reduce((a,i)=>a+i.reserved,0).toLocaleString()} sub="bottles committed" icon={IC.tag} tone="stone"/>
      </div>
      <Card padded={false}>
        <Table
          cols={[
            {key:'sku', label:'SKU', mono:true, bold:true},
            {key:'location', label:'Location'},
            {key:'locType', label:'Type', render:r=><Badge status={r.locType==='hq'?'active':r.locType==='in-transit'?'in-transit':'confirmed'} label={r.locType}/>},
            {key:'bottles', label:'Bottles', right:true, mono:true, render:r=>r.bottles.toLocaleString()},
            {key:'reserved', label:'Reserved', right:true, mono:true, render:r=>r.reserved.toLocaleString()},
            {key:'_avail', label:'Available', right:true, mono:true, render:r=><span style={{fontWeight:600}}>{(r.bottles-r.reserved).toLocaleString()}</span>},
            {key:'batchId', label:'Batch', mono:true},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
          ]}
          rows={inventory}
          emptyMsg="No inventory records."
        />
      </Card>
    </AppShell>
  );
}

// ─── Accounts ─────────────────────────────────────────────────
function HQAccounts() {
  const { accounts } = useStore();
  const { navigate, role } = useRouter();
  const [showCreate, setShowCreate] = React.useState(false);
  const active = accounts.filter(a => a.status === 'active').length;
  return (
    <AppShell breadcrumb={['Accounts']}>
      <PageHead title="Accounts" sub="Every active retail, restaurant, bar and hotel account."
        actions={<><Btn v="outline" icon={IC.filter}>Filter</Btn><Btn v="accent" icon={IC.plus} onClick={()=>setShowCreate(true)}>New account</Btn></>}/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="Active accounts" value={active} sub="in CRM" icon={IC.users} tone="stone"/>
        <StatCard label="Prospects" value={accounts.filter(a=>a.status==='prospect').length} sub="in pipeline" icon={IC.target} tone="gold"/>
        <StatCard label="Flagships" value={accounts.filter(a=>a.tier==='flagship').length} sub="key accounts" icon={IC.tag} tone="green"/>
      </div>
      <Card padded={false}>
        <Table
          cols={[
            {key:'name', label:'Account', bold:true, render:r=>(
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{width:28, height:28, borderRadius:6, background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:T.muted}}>{r.name.charAt(0)}</div>
                <div>
                  <div style={{fontWeight:500}}>{r.name}</div>
                  <div style={{fontSize:11, color:T.muted}}>{r.type}</div>
                </div>
              </div>
            )},
            {key:'city', label:'City'},
            {key:'country', label:'Country'},
            {key:'rep', label:'Rep'},
            {key:'rev30', label:'30d Rev', right:true, mono:true, render:r=>r.rev30?`$${r.rev30.toLocaleString()}`:'—'},
            {key:'listings', label:'Listings', right:true, mono:true},
            {key:'tier', label:'Tier', render:r=><Badge status={r.tier==='flagship'?'active':r.tier==='key'?'approved':'confirmed'} label={r.tier}/>},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
          ]}
          rows={accounts}
          onRow={r => navigate(`/${role}/accounts/${r.id}`)}
          emptyMsg="No accounts found."
        />
      </Card>
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="New account">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Field label="Trading name"><Input placeholder="e.g. Dante"/></Field>
          <Field label="Type"><Select options={['restaurant','bar','hotel','retail']} value="bar" onChange={()=>{}}/></Field>
          <Field label="City"><Input placeholder="New York"/></Field>
          <Field label="Country"><Input placeholder="US"/></Field>
          <Field label="Primary contact"><Input placeholder="Full name"/></Field>
          <Field label="Email"><Input type="email" placeholder="buyer@venue.com"/></Field>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:20}}>
          <Btn v="outline" onClick={()=>setShowCreate(false)}>Cancel</Btn>
          <Btn v="accent">Create account</Btn>
        </div>
      </Modal>
    </AppShell>
  );
}

// ─── Purchase Orders ──────────────────────────────────────────
function HQPurchaseOrders() {
  const { pos, approvePO } = useStore();
  const { navigate, role } = useRouter();
  const [showCreate, setShowCreate] = React.useState(false);
  return (
    <AppShell breadcrumb={['Production requests']}>
      <PageHead title="Production requests" sub="All purchase orders to Yamato Distillery and First Press."
        actions={<><Btn v="accent" icon={IC.plus} onClick={()=>setShowCreate(true)}>New PO</Btn></>}/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="Pending approval" value={pos.filter(p=>p.status==='pending').length} icon={IC.file} tone="warm"/>
        <StatCard label="In production" value={pos.filter(p=>p.status==='in-production').length} icon={IC.factory} tone="stone"/>
        <StatCard label="Shipped" value={pos.filter(p=>p.status==='shipped').length} icon={IC.truck} tone="gold"/>
        <StatCard label="Delivered" value={pos.filter(p=>p.status==='delivered').length} icon={IC.check} tone="green"/>
      </div>
      <Card padded={false}>
        <Table
          cols={[
            {key:'id', label:'PO ID', mono:true, bold:true, render:r=><span style={{color:T.gold, fontFamily:T.mono, fontSize:12}}>{r.id}</span>},
            {key:'sku', label:'SKU', mono:true},
            {key:'qty', label:'Qty', right:true, mono:true, render:r=>r.qty.toLocaleString()},
            {key:'region', label:'Region'},
            {key:'mfr', label:'Manufacturer'},
            {key:'requested', label:'Requested', mono:true},
            {key:'shipDate', label:'Ship date', mono:true, render:r=>r.shipDate||'—'},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
            {key:'_act', label:'', sortable:false, render:r=>(
              r.status==='pending'
                ? <Btn v="primary" sz="xs" onClick={e=>{e.stopPropagation();approvePO(r.id)}}>Approve</Btn>
                : null
            )},
          ]}
          rows={pos}
          emptyMsg="No purchase orders."
        />
      </Card>
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="New production request">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Field label="SKU"><Select options={PRODUCTS_DATA.map(p=>({value:p.id,label:p.name}))} value="HJM-FP-750" onChange={()=>{}}/></Field>
          <Field label="Quantity (bottles)"><Input type="number" placeholder="1200" mono/></Field>
          <Field label="Destination region"><Select options={['Tokyo HQ','Empire Wines','Vinexpo Paris']} value="Tokyo HQ" onChange={()=>{}}/></Field>
          <Field label="Requested ship date"><Input type="date" mono/></Field>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:20}}>
          <Btn v="outline" onClick={()=>setShowCreate(false)}>Cancel</Btn>
          <Btn v="accent">Create PO</Btn>
        </div>
      </Modal>
    </AppShell>
  );
}

// ─── Shipments ────────────────────────────────────────────────
function HQShipments() {
  const { shipments } = useStore();
  return (
    <AppShell breadcrumb={['Shipments']}>
      <PageHead title="Shipments" sub="All inbound and outbound movements."
        actions={<Btn v="accent" icon={IC.plus}>New shipment</Btn>}/>
      <Card padded={false}>
        <Table
          cols={[
            {key:'id', label:'ID', mono:true, bold:true},
            {key:'origin', label:'Origin'},
            {key:'dest', label:'Destination'},
            {key:'carrier', label:'Carrier'},
            {key:'trackNo', label:'Tracking', mono:true},
            {key:'eta', label:'ETA', mono:true},
            {key:'bottles', label:'Bottles', right:true, mono:true, render:r=>r.bottles.toLocaleString()},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
          ]}
          rows={shipments}
          emptyMsg="No shipments."
        />
      </Card>
    </AppShell>
  );
}

// ─── Alerts Hub ───────────────────────────────────────────────
function HQAlerts() {
  const { alerts, dismissAlert } = useStore();
  const sevC = {critical:T.red, high:T.amber, medium:T.blue, low:T.muted};
  return (
    <AppShell breadcrumb={['Alerts']}>
      <PageHead title="Alerts hub" sub="Derived from inventory, POs, shipments, and AR. One queue."/>
      {alerts.length === 0
        ? <Card><EmptyState icon={IC.bell} title="All clear" sub="No active alerts. Good sign."/></Card>
        : (
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {alerts.map(a => (
              <Card key={a.id} style={{display:'grid', gridTemplateColumns:'8px 1fr auto', gap:16, alignItems:'flex-start'}}>
                <div style={{width:6, height:6, borderRadius:999, background:sevC[a.sev]||T.muted, marginTop:5}}/>
                <div>
                  <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:4}}>
                    <Badge status={a.sev} custom={a.sev==='critical'?'red':a.sev==='high'?'amber':a.sev==='medium'?'blue':'stone'} label={a.sev}/>
                    <span style={{fontSize:12, color:T.muted}}>{a.type.replace(/-/g,' ')} · {a.market}</span>
                  </div>
                  <div style={{fontSize:14, color:T.ink, lineHeight:1.5}}>{a.msg}</div>
                  <div style={{fontSize:11, color:T.muted, fontFamily:T.mono, marginTop:4}}>{new Date(a.ts).toLocaleString()}</div>
                </div>
                <Btn v="ghost" sz="sm" onClick={()=>dismissAlert(a.id)}><Ico d={IC.x} size={14}/></Btn>
              </Card>
            ))}
          </div>
        )
      }
    </AppShell>
  );
}

// ─── Reports ──────────────────────────────────────────────────
function HQReports() {
  const sparkData = [280,310,295,340,380,360,420,450,480,510,490,540];
  return (
    <AppShell breadcrumb={['Reports']}>
      <PageHead title="Reports" sub="Live analytics across markets, accounts and supply chain."
        actions={<Btn v="outline" icon={IC.dl}>Export</Btn>}/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24}}>
        <StatCard label="Revenue MTD" value="$8.6M" sub="vs $7.9M LY" icon={IC.receipt} trend={9.4} tone="green"/>
        <StatCard label="Sell-through" value="86%" sub="30d rolling" icon={IC.trendU} trend={2.1} tone="gold"/>
        <StatCard label="Cases shipped" value="2,840" sub="this month" icon={IC.box} tone="stone"/>
        <StatCard label="Avg order value" value="$1,840" sub="per order" icon={IC.cart} trend={4.2} tone="stone"/>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:18}}>
        <Card>
          <div style={{fontFamily:T.display, fontSize:18, fontWeight:500, marginBottom:4}}>Monthly revenue trend</div>
          <div style={{fontSize:13, color:T.muted, marginBottom:16}}>Last 12 months · $K</div>
          <SparkBar data={sparkData} color={T.gold} height={120}/>
          <div style={{display:'grid', gridTemplateColumns:'repeat(12,1fr)', marginTop:6, fontSize:9, color:T.muted, fontFamily:T.mono, textAlign:'center'}}>
            {['M','J','J','A','S','O','N','D','J','F','M','A'].map((m,i)=><span key={i}>{m}</span>)}
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:T.display, fontSize:18, fontWeight:500, marginBottom:16}}>Region breakdown</div>
          {[{r:'APAC',pct:48,v:'$4.1M',c:T.ink},{r:'Americas',pct:38,v:'$3.3M',c:T.gold},{r:'EMEA',pct:14,v:'$1.2M',c:'hsl(35 18%55%)'}].map(({r,pct,v,c})=>(
            <div key={r} style={{marginBottom:14}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5}}>
                <span style={{fontWeight:500}}>{r}</span>
                <span style={{fontFamily:T.mono, fontWeight:600}}>{v} <span style={{color:T.muted, fontWeight:400}}>({pct}%)</span></span>
              </div>
              <div style={{height:6, borderRadius:999, background:T.surface, overflow:'hidden'}}>
                <div style={{width:`${pct}%`, height:'100%', background:c}}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}

// ─── Finance ──────────────────────────────────────────────────
function HQFinance() {
  return (
    <AppShell breadcrumb={['Finance']}>
      <PageHead title="Finance & payments" sub="Accounts receivable, accounts payable, Stripe transactions."/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="AR outstanding" value="$24,800" sub="across 6 accounts" icon={IC.receipt} tone="warm"/>
        <StatCard label="Overdue" value="$8,400" sub="3 accounts past 30d" icon={IC.alert} tone="warm"/>
        <StatCard label="Collected MTD" value="$41,200" sub="vs $38.1K LM" icon={IC.check} tone="green" trend={8.1}/>
      </div>
      <Card padded={false}>
        <Table
          cols={[
            {key:'id', label:'Invoice', mono:true},
            {key:'account', label:'Account'},
            {key:'amount', label:'Amount', right:true, mono:true},
            {key:'due', label:'Due date', mono:true},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
          ]}
          rows={[
            {id:'INV-2604-001', account:'The Drake Hotel', amount:'$4,800', due:'2026-05-11', status:'pending'},
            {id:'INV-2604-002', account:'Kioi Sakaba',     amount:'$7,728', due:'2026-05-13', status:'pending'},
            {id:'INV-2604-003', account:'Bar Hemingway',   amount:'$2,544', due:'2026-04-07', status:'paid'},
            {id:'INV-2604-004', account:'Bar Suntory',     amount:'$3,200', due:'2026-03-15', status:'overdue'},
          ]}
          emptyMsg="No invoices."
        />
      </Card>
    </AppShell>
  );
}

// ─── Settings ────────────────────────────────────────────────
function HQSettings() {
  const [activeTab, setActiveTab] = React.useState('team');
  return (
    <AppShell breadcrumb={['Settings']}>
      <PageHead title="Settings" sub="System configuration, team, RBAC, products, and warehouses."/>
      <Tabs tabs={[{id:'team',label:'Team'},{id:'products',label:'Products'},{id:'warehouses',label:'Warehouses'},{id:'rbac',label:'Roles & access'},{id:'system',label:'System'}]} active={activeTab} onChange={setActiveTab}/>
      <div style={{marginTop:20}}>
        {activeTab === 'team' && (
          <Card padded={false}>
            <Table
              cols={[
                {key:'name', label:'Name'},
                {key:'email', label:'Email', mono:true},
                {key:'role', label:'Role', render:r=><Badge status="confirmed" label={r.role}/>},
                {key:'lastLogin', label:'Last login', mono:true},
              ]}
              rows={[
                {id:'u1', name:'Sora Okuda',    email:'sora@hajime.jp',  role:'brand_operator', lastLogin:'2026-04-27'},
                {id:'u2', name:'Yui Imanishi',  email:'yui@yamato.jp',   role:'manufacturer',   lastLogin:'2026-04-26'},
                {id:'u3', name:'Léa Bardot',    email:'lea@vinexpo.fr',  role:'distributor',    lastLogin:'2026-04-27'},
                {id:'u4', name:'Mike Tan',      email:'mike@hajime.jp',  role:'sales_rep',      lastLogin:'2026-04-27'},
                {id:'u5', name:'Kazu Saito',    email:'kazu@mace.bar',   role:'retail',         lastLogin:'2026-04-25'},
              ]}
              emptyMsg="No team members."
            />
          </Card>
        )}
        {activeTab === 'products' && (
          <Card padded={false}>
            <Table
              cols={[
                {key:'id', label:'SKU', mono:true, bold:true},
                {key:'name', label:'Product'},
                {key:'type', label:'Category'},
                {key:'size', label:'Size'},
                {key:'cs', label:'Case size', right:true, mono:true},
                {key:'price', label:'Wholesale', right:true, mono:true, render:r=>`$${r.price}`},
                {key:'msrp', label:'MSRP', right:true, mono:true, render:r=>`$${r.msrp}`},
                {key:'safetyStock', label:'Safety stock', right:true, mono:true, render:r=>r.safetyStock.toLocaleString()},
                {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
              ]}
              rows={PRODUCTS_DATA}
              emptyMsg="No products."
            />
          </Card>
        )}
        {(activeTab === 'warehouses' || activeTab === 'rbac' || activeTab === 'system') && (
          <EmptyState icon={IC.settings} title={`${activeTab.charAt(0).toUpperCase()+activeTab.slice(1)} settings`} sub="Configuration UI coming in next iteration."/>
        )}
      </div>
    </AppShell>
  );
}

// ─── Markets ─────────────────────────────────────────────────
function HQMarkets() {
  const markets = [{c:'JP',name:'Japan',st:94,cover:62,rev:1842,status:'healthy'},{c:'US',name:'US',st:88,cover:41,rev:2980,status:'healthy'},{c:'SG',name:'Singapore',st:91,cover:22,rev:612,status:'low-cover'},{c:'KR',name:'S. Korea',st:89,cover:19,rev:338,status:'low-cover'},{c:'GB',name:'UK',st:72,cover:78,rev:488,status:'overstock'},{c:'FR',name:'France',st:79,cover:54,rev:402,status:'healthy'},{c:'CA',name:'Canada',st:81,cover:48,rev:284,status:'healthy'},{c:'AU',name:'Australia',st:76,cover:44,rev:196,status:'healthy'}];
  return (
    <AppShell breadcrumb={['Global markets']}>
      <PageHead title="Global markets" sub="Sell-through velocity, cover days, and revenue across 12 markets."/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20}}>
        {[{l:'MTD Revenue',v:'$8.6M',tone:'gold'},{l:'Markets healthy',v:`${markets.filter(m=>m.status==='healthy').length}/${markets.length}`,tone:'green'},{l:'Low cover',v:`${markets.filter(m=>m.status==='low-cover').length}`,tone:'warm'},{l:'Overstock',v:`${markets.filter(m=>m.status==='overstock').length}`,tone:'stone'}].map(({l,v,tone})=>(
          <StatCard key={l} label={l} value={v} tone={tone}/>
        ))}
      </div>
      <Card padded={false}>
        <Table
          cols={[
            {key:'c', label:'Code', mono:true, render:r=><span style={{fontFamily:T.mono,padding:'2px 6px',background:T.surface,borderRadius:4,fontSize:11,fontWeight:600}}>{r.c}</span>},
            {key:'name', label:'Market', bold:true},
            {key:'st', label:'Sell-through', right:true, render:r=>(
              <div style={{display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end'}}>
                <div style={{width:56, height:4, borderRadius:999, background:T.surface, overflow:'hidden'}}>
                  <div style={{width:`${r.st}%`, height:'100%', background:r.st>=85?T.green:r.st>=75?T.gold:T.amber}}/>
                </div>
                <span style={{fontFamily:T.mono, fontSize:12, minWidth:32}}>{r.st}%</span>
              </div>
            )},
            {key:'cover', label:'Cover', right:true, mono:true, render:r=><span style={{color:r.cover<30?T.red:r.cover>70?T.blue:T.ink, fontWeight:r.cover<30?600:400}}>{r.cover}d</span>},
            {key:'rev', label:'MTD Revenue', right:true, mono:true, render:r=>`$${r.rev.toLocaleString()}K`},
            {key:'status', label:'Status', render:r=><Badge status={r.status==='healthy'?'active':r.status==='low-cover'?'pending':'confirmed'} label={r.status}/>},
          ]}
          rows={markets}
          emptyMsg="No markets."
        />
      </Card>
    </AppShell>
  );
}

Object.assign(window, {
  HQDashboard, HQOrders, HQOrderDetail, HQInventory, HQAccounts,
  HQPurchaseOrders, HQShipments, HQAlerts, HQReports, HQFinance,
  HQSettings, HQMarkets
});
