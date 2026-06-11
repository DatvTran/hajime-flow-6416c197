// app/pages-retail.jsx — Retail Store pages

// ─── Retail Home ─────────────────────────────────────────────
function RetailHome() {
  const { orders, shipments } = useStore();
  const { navigate, role } = useRouter();
  const myOrders = orders.filter(o => o.accountName === 'Mace');
  const activeShipments = shipments.filter(s => s.status === 'in-transit' && s.dest.toLowerCase().includes('drake') === false).slice(0,1);
  const lastOrder = myOrders.filter(o=>o.status==='delivered')[0];

  return (
    <AppShell breadcrumb={['Home']}>
      <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:24, marginBottom:24}}>
        <div>
          <div style={{fontSize:11, color:T.muted, fontFamily:T.mono, letterSpacing:'.06em', marginBottom:4}}>MON · APR 27</div>
          <h1 style={{fontFamily:T.display, fontSize:32, fontWeight:600, letterSpacing:'-.02em', margin:0}}>Hi Kazu</h1>
          <p style={{fontSize:14, color:T.muted, margin:'4px 0 0'}}>Mace · Brooklyn · sake-bar</p>
        </div>
        <Btn v="accent" sz="lg" icon={IC.plus} onClick={()=>navigate(`/${role}/catalog`)}>New order</Btn>
      </div>

      {/* In-transit tile — only shown when active */}
      {activeShipments.length > 0 && activeShipments.map(s => (
        <div key={s.id} style={{padding:20, background:T.card, border:`1px solid ${T.borderQ}`, borderRadius:16, marginBottom:18, boxShadow:'0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14, marginBottom:18}}>
            <div>
              <div style={{fontSize:11, color:T.muted, fontFamily:T.mono, letterSpacing:'.06em', marginBottom:4}}>ON THE WAY</div>
              <div style={{fontFamily:T.display, fontSize:22, fontWeight:600, letterSpacing:'-.02em'}}>Order #{s.orderId} · arriving Wed</div>
              <div style={{fontSize:13, color:T.muted, marginTop:4}}>Empire Wines · ETA {s.eta} · {s.carrier} {s.trackNo}</div>
            </div>
            <Badge status="in-transit"/>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:0}}>
            {[{l:'Approved',done:true},{l:'Picked',done:true},{l:'In transit',cur:true},{l:'Received',done:false}].map((st,i,arr)=>(
              <React.Fragment key={st.l}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                  <div style={{width:st.done||st.cur?22:16, height:st.done||st.cur?22:16, borderRadius:'50%', background:st.done?T.green:st.cur?T.gold:T.border, color:'white', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    {st.done && <Ico d={IC.check} size={11} stroke={2.5}/>}
                    {st.cur && <div style={{width:8,height:8,borderRadius:999,background:'white'}}/>}
                  </div>
                  <span style={{fontSize:11, fontWeight:st.done||st.cur?600:400, color:st.done||st.cur?T.ink:T.muted}}>{st.l}</span>
                </div>
                {i<arr.length-1 && <div style={{flex:1, height:2, background:st.done?T.green:T.border, marginBottom:18, marginTop:1}}/>}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="Open orders" value={myOrders.filter(o=>['draft','confirmed','approved','shipped'].includes(o.status)).length} sub="in progress" icon={IC.cart} onClick={()=>navigate(`/${role}/orders`)}/>
        <StatCard label="Last delivery" value={lastOrder?.actualDelivery||'—'} sub="most recent" icon={IC.truck}/>
        <StatCard label="SKUs listed" value="3" sub="active Hajime SKUs" icon={IC.box} onClick={()=>navigate(`/${role}/catalog`)}/>
      </div>

      {/* Last basket / quick reorder */}
      {lastOrder && (
        <Card style={{marginBottom:18}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14}}>
            <div>
              <div style={{fontSize:11, color:T.muted, fontFamily:T.mono, letterSpacing:'.06em', marginBottom:4}}>QUICK REORDER</div>
              <div style={{fontFamily:T.display, fontSize:22, fontWeight:600, letterSpacing:'-.02em'}}>Last basket — {lastOrder.id}</div>
              <div style={{fontSize:13, color:T.muted, marginTop:4}}>{lastOrder.orderDate} · ${lastOrder.total.toLocaleString()}</div>
            </div>
            <Btn v="secondary" sz="lg" icon={IC.refresh} onClick={()=>navigate(`/${role}/reorder`)}>Reorder this</Btn>
          </div>
        </Card>
      )}

      {/* Recent orders */}
      <Card padded={false} style={{overflow:'hidden'}}>
        <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
          <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Recent orders</div>
          <Btn v="ghost" sz="sm" onClick={()=>navigate(`/${role}/orders`)}>All orders</Btn>
        </div>
        {myOrders.slice(0,5).map(o => (
          <div key={o.id} onClick={()=>navigate(`/${role}/orders/${o.id}`)} style={{
            padding:'11px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'flex',
            alignItems:'center', gap:14, cursor:'pointer'
          }} onMouseEnter={e=>e.currentTarget.style.background=T.surface} onMouseLeave={e=>e.currentTarget.style.background=''}>
            <span style={{fontFamily:T.mono, fontSize:11, fontWeight:500, flex:1}}>{o.id}</span>
            <span style={{fontSize:12, color:T.muted, fontFamily:T.mono}}>{o.orderDate}</span>
            <span style={{fontFamily:T.mono, fontSize:12, fontWeight:600}}>${o.total.toLocaleString()}</span>
            <Badge status={o.status}/>
          </div>
        ))}
        {myOrders.length === 0 && <EmptyState icon={IC.cart} title="No orders yet" sub="Place your first order from the catalog."/>}
      </Card>

      {/* Support */}
      <div style={{marginTop:18, padding:20, background:T.surface, borderRadius:14, border:`1px dashed ${T.border}`, display:'flex', gap:14}}>
        <div style={{width:40, height:40, borderRadius:999, background:T.card, display:'flex', alignItems:'center', justifyContent:'center', color:T.muted}}>
          <Ico d={IC.note} size={18}/>
        </div>
        <div>
          <div style={{fontSize:14, fontWeight:500, marginBottom:2}}>Questions on delivery or invoicing?</div>
          <div style={{fontSize:13, color:T.muted}}>Your Hajime rep will confirm every request.</div>
          <Btn v="outline" sz="sm" style={{marginTop:10}}>Contact support</Btn>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Retail Catalog / New Order ────────────────────────────────
function RetailCatalog() {
  const { createOrder } = useStore();
  const { navigate, role } = useRouter();
  const [cart, setCart] = React.useState({});
  const total = Object.entries(cart).reduce((a,[sku,qty])=>{
    const p = PRODUCTS_DATA.find(x=>x.id===sku);
    return a + (p?.price||0)*qty;
  }, 0);

  const add = (sku, delta) => setCart(c => {const n=Math.max(0,(c[sku]||0)+delta); return n===0?Object.fromEntries(Object.entries({...c,[sku]:n}).filter(([,v])=>v>0)):{...c,[sku]:n}});

  return (
    <AppShell breadcrumb={['New order', 'Catalog']}>
      <PageHead title="Catalog" sub="Curated for Mace · Brooklyn. All SKUs available to order now."
        actions={
          total > 0
            ? <Btn v="accent" sz="lg" icon={IC.cart} onClick={()=>{createOrder({accountName:'Mace',account:'ACC-003',market:'New York',rep:'MT',lines:Object.entries(cart).map(([sku,qty])=>({sku,qty,price:PRODUCTS_DATA.find(p=>p.id===sku)?.price||0})),total,requestedDelivery:'2026-05-02'});navigate(`/${role}/orders`);}}>
                Send order · ${total.toLocaleString()}
              </Btn>
            : <span style={{fontSize:13, color:T.muted}}>Add items to order</span>
        }
      />
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16}}>
        {PRODUCTS_DATA.filter(p=>p.status==='active').map(prod => (
          <Card key={prod.id} style={{display:'flex', flexDirection:'column', gap:12}}>
            <div style={{height:120, borderRadius:10, background:`linear-gradient(135deg, hsl(40 30%88%), hsl(30 20%80%))`, display:'flex', alignItems:'center', justifyContent:'center', color:T.muted}}>
              <Ico d={IC.box} size={36}/>
            </div>
            <div>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.muted, marginBottom:3}}>{prod.id}</div>
              <div style={{fontFamily:T.display, fontSize:20, fontWeight:600, letterSpacing:'-.01em'}}>{prod.name}</div>
              <div style={{fontSize:12, color:T.muted, marginTop:2}}>{prod.type} · {prod.size} · case of {prod.cs}</div>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontFamily:T.display, fontSize:22, fontWeight:600}}>${prod.price}<span style={{fontSize:11, color:T.muted, fontWeight:400}}> / btl</span></div>
                <div style={{fontSize:11, color:T.muted}}>Case: ${prod.price*prod.cs}</div>
              </div>
              {cart[prod.id]
                ? <div style={{display:'flex', alignItems:'center', gap:8, background:T.gold, color:'white', padding:'6px 12px', borderRadius:8}}>
                    <button onClick={()=>add(prod.id,-prod.cs)} style={{background:'none',border:'none',color:'white',cursor:'pointer',fontSize:18,lineHeight:1}}>−</button>
                    <span style={{fontFamily:T.mono, fontWeight:600, fontSize:13, minWidth:24, textAlign:'center'}}>{cart[prod.id]}</span>
                    <button onClick={()=>add(prod.id,prod.cs)} style={{background:'none',border:'none',color:'white',cursor:'pointer',fontSize:18,lineHeight:1}}>+</button>
                  </div>
                : <Btn v="accent" icon={IC.plus} onClick={()=>add(prod.id,prod.cs)}>Add</Btn>
              }
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

// ─── Retail Orders ─────────────────────────────────────────────
function RetailOrders() {
  const { orders } = useStore();
  const { navigate, role } = useRouter();
  const mine = orders.filter(o => o.accountName === 'Mace');
  return (
    <AppShell breadcrumb={['My orders']}>
      <PageHead title="My orders" sub="All orders placed by Mace · Brooklyn."/>
      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        {mine.length === 0 && <Card><EmptyState icon={IC.cart} title="No orders yet" sub="Place your first order from the catalog." action={<Btn v="accent" icon={IC.plus} onClick={()=>navigate(`/${role}/catalog`)}>Browse catalog</Btn>}/></Card>}
        {mine.map(o => (
          <Card key={o.id} onClick={()=>navigate(`/${role}/orders/${o.id}`)} style={{display:'grid', gridTemplateColumns:'1fr auto', gap:16, cursor:'pointer'}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 4px hsl(24 10%10%/.06),0 8px 24px hsl(24 10%10%/.06)'}
            onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'}>
            <div>
              <div style={{display:'flex', gap:10, alignItems:'center', marginBottom:4}}>
                <span style={{fontFamily:T.mono, fontSize:12, fontWeight:600, color:T.gold}}>{o.id}</span>
                <Badge status={o.status}/>
              </div>
              <div style={{fontSize:14, fontWeight:500}}>
                {o.lines.map(l=>`${l.qty}× ${PRODUCTS_DATA.find(p=>p.id===l.sku)?.name||l.sku}`).join(', ')}
              </div>
              <div style={{fontSize:12, color:T.muted, marginTop:3}}>Placed {o.orderDate} · Requested {o.requestedDelivery}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:T.display, fontSize:24, fontWeight:600, letterSpacing:'-.02em'}}>${o.total.toLocaleString()}</div>
              {o.shipmentId && <div style={{fontSize:11, color:T.muted, fontFamily:T.mono, marginTop:4}}>{o.shipmentId}</div>}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

// ─── Retail Reorder ───────────────────────────────────────────
function RetailReorder() {
  const { navigate, role } = useRouter();
  const suggestions = [
    {sku:'HJM-FP-750', name:'Florin Peaks', lastQty:18, days:22, signal:'Fast pour', tone:'amber'},
    {sku:'HJM-JN-720', name:'Junmai Shiro', lastQty:12, days:30, signal:'On cadence'},
    {sku:'HJM-RY-500', name:'Ryusui Reserve', lastQty:6, days:40, signal:'Slow', tone:'blue'},
  ];
  return (
    <AppShell breadcrumb={['Reorder']}>
      <PageHead title="Reorder" sub="Based on your depletion rate, here's what to top up this week."
        actions={<Btn v="accent" icon={IC.cart} onClick={()=>navigate(`/${role}/catalog`)}>Build new order</Btn>}/>
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {suggestions.map(s => (
          <Card key={s.sku} style={{display:'grid', gridTemplateColumns:'1fr auto auto', gap:16, alignItems:'center'}}>
            <div>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.muted, marginBottom:3}}>{s.sku}</div>
              <div style={{fontFamily:T.display, fontSize:20, fontWeight:600, letterSpacing:'-.01em'}}>{s.name}</div>
              <div style={{fontSize:13, color:T.muted, marginTop:3}}>Last ordered: {s.lastQty} bottles · {s.days} days ago</div>
              <div style={{marginTop:6}}><Badge status={s.tone==='amber'?'pending':s.tone==='blue'?'confirmed':'active'} label={s.signal}/></div>
            </div>
            <div style={{fontFamily:T.display, fontSize:28, fontWeight:600, letterSpacing:'-.02em'}}>{s.lastQty}<span style={{fontSize:12, color:T.muted, fontWeight:400, marginLeft:3}}>btl</span></div>
            <Btn v={s.tone==='amber'?'accent':'outline'} icon={IC.refresh}>Reorder {s.lastQty}</Btn>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

// ─── Retail Shipments (deliveries) ───────────────────────────
function RetailShipments() {
  const { shipments } = useStore();
  return (
    <AppShell breadcrumb={['Deliveries']}>
      <PageHead title="Deliveries" sub="Track your incoming deliveries from Empire Wines."/>
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {shipments.filter(s=>s.id==='SHP-041').map(s=>(
          <Card key={s.id}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14, marginBottom:16}}>
              <div>
                <div style={{fontFamily:T.mono, fontSize:12, fontWeight:600, color:T.gold, marginBottom:4}}>{s.id}</div>
                <div style={{fontFamily:T.display, fontSize:22, fontWeight:600}}>From {s.origin}</div>
                <div style={{fontSize:13, color:T.muted, marginTop:3}}>{s.bottles} bottles · ETA {s.eta} · {s.carrier} {s.trackNo}</div>
              </div>
              <Badge status={s.status}/>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:0}}>
              {[{l:'Ordered',done:true},{l:'Approved',done:true},{l:'Packed',done:true},{l:'In transit',cur:true},{l:'Delivered',done:false}].map((st,i,arr)=>(
                <React.Fragment key={st.l}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flexShrink:0}}>
                    <div style={{width:st.done||st.cur?22:14,height:st.done||st.cur?22:14,borderRadius:'50%',background:st.done?T.green:st.cur?T.gold:T.border,color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {st.done&&<Ico d={IC.check} size={10} stroke={2.5}/>}
                      {st.cur&&<div style={{width:7,height:7,borderRadius:999,background:'white'}}/>}
                    </div>
                    <span style={{fontSize:11,fontWeight:st.done||st.cur?600:400,color:st.done||st.cur?T.ink:T.muted,whiteSpace:'nowrap'}}>{st.l}</span>
                  </div>
                  {i<arr.length-1&&<div style={{flex:1,height:2,background:st.done?T.green:T.border,marginBottom:18}}/>}
                </React.Fragment>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

// ─── Retail Account ───────────────────────────────────────────
function RetailAccount() {
  return (
    <AppShell breadcrumb={['Account']}>
      <PageHead title="Account" sub="Mace · Brooklyn"/>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}}>
        <Card>
          {[['Trading name','Mace'],['Type','Bar'],['City','Brooklyn, NY'],['Rep','Mike Tan · mike@hajime.jp'],['Payment terms','Net 30'],['Account since','Mar 2024']].map(([l,v])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
              <span style={{color:T.muted}}>{l}</span><span style={{fontWeight:500}}>{v}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontFamily:T.display, fontSize:17, fontWeight:500, marginBottom:14}}>This month</div>
          <StatCard label="Orders placed" value="2" tone="stone"/>
          <div style={{marginTop:10}}/><StatCard label="Total spend" value="$1,724" trend={8} tone="gold"/>
        </Card>
      </div>
    </AppShell>
  );
}

// ─── Retail Support ───────────────────────────────────────────
function RetailSupport() {
  return (
    <AppShell breadcrumb={['Support']}>
      <PageHead title="Support" sub="Questions on orders, delivery, invoicing or listings."/>
      <Card style={{maxWidth:560}}>
        <div style={{fontFamily:T.display, fontSize:20, fontWeight:500, marginBottom:14}}>Contact your rep</div>
        <div style={{fontSize:14, color:T.muted, lineHeight:1.6, marginBottom:20}}>Your Hajime rep is Mike Tan. He'll confirm every request, usually within 2 hours on business days.</div>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <Field label="Subject"><Select options={['Delivery query','Invoice issue','Stock question','Listing change','Other']} value="Delivery query" onChange={()=>{}}/></Field>
          <Field label="Message"><Textarea rows={4} placeholder="Describe your question…"/></Field>
          <Btn v="accent">Send message</Btn>
        </div>
      </Card>
    </AppShell>
  );
}

// ─── Retail Order Detail ───────────────────────────────────────
function RetailOrderDetail() {
  const { parts, navigate, role } = useRouter();
  const { orders } = useStore();
  const orderId = parts[2];
  const order = orders.find(o => o.id === orderId);
  if (!order) return <AppShell><EmptyState title="Order not found" sub={orderId}/></AppShell>;
  return (
    <AppShell breadcrumb={['My orders', order.id]}>
      <PageHead title={order.id} sub={`Placed ${order.orderDate} · ${order.accountName}`}/>
      <div style={{display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:18}}>
        <Card>
          <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:16}}>Items</div>
          {order.lines.map((l,i)=>{
            const p = PRODUCTS_DATA.find(x=>x.id===l.sku);
            return (
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
                <div>
                  <div style={{fontWeight:500}}>{p?.name||l.sku}</div>
                  <div style={{fontFamily:T.mono,fontSize:11,color:T.muted}}>{l.sku} · {l.qty} bottles</div>
                </div>
                <span style={{fontFamily:T.mono,fontWeight:600}}>${(l.qty*l.price).toLocaleString()}</span>
              </div>
            );
          })}
          <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',fontSize:14,fontWeight:700}}>
            <span>Total</span><span style={{fontFamily:T.mono}}>${order.total.toLocaleString()}</span>
          </div>
        </Card>
        <Card>
          <Badge status={order.status}/><br/><br/>
          {[['Order date',order.orderDate],['Requested',order.requestedDelivery],['Shipment',order.shipmentId||'—']].map(([l,v])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
              <span style={{color:T.muted}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:500}}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}

Object.assign(window, {
  RetailHome, RetailCatalog, RetailOrders, RetailReorder, RetailShipments, RetailAccount, RetailSupport, RetailOrderDetail
});
