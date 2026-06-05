// app/pages-dist.jsx — Distributor pages (P1: Depletion live)

// ─── Distributor Dashboard ────────────────────────────────────
function DistDashboard() {
  const { orders, inventory, depletions } = useStore();
  const pickQueue = orders.filter(o => o.status === 'approved');
  const totalStock = inventory.filter(i => i.locType === 'distributor').reduce((a,i) => a+i.bottles, 0);
  const todayDep = depletions.filter(d => d.date === '2026-04-27' && d.type !== 'inbound').reduce((a,d) => a+d.bottles, 0);
  return (
    <AppShell breadcrumb={['Overview']}>
      <PageHead title="Overview" eyebrow="Empire Wines · Brooklyn · Distributor"
        sub="Today's pick queue, inbound receipts, and live depletion."
        actions={<Btn v="accent" icon={IC.check}>Confirm picks</Btn>}/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24}}>
        <StatCard label="To pick today" value={pickQueue.length} sub="orders · cut-off 14:00" icon={IC.whouse} tone={pickQueue.length>5?'warm':'stone'}/>
        <StatCard label="Warehouse stock" value={totalStock.toLocaleString()} sub="bottles on-hand" icon={IC.box} tone="stone"/>
        <StatCard label="Cases out today" value={Math.round(todayDep/12)} sub="from today's picks" icon={IC.trendD} tone="gold"/>
        <StatCard label="HQ sync" value="Live" sub="depletion in real time" icon={IC.check} tone="green"/>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:18}}>
        <DistPickQueue orders={pickQueue}/>
        <DistDepletionMini/>
      </div>
    </AppShell>
  );
}

function DistPickQueue({ orders }) {
  const { updateOrderStatus } = useStore();
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Pick queue</div>
          <div style={{fontSize:12, color:T.muted, marginTop:2}}>{orders.length} orders to fulfill · cut-off 14:00</div>
        </div>
        <Btn v="primary" sz="sm" icon={IC.scan||IC.check}>Scan picks</Btn>
      </div>
      {orders.length === 0
        ? <EmptyState icon={IC.check} title="Queue clear" sub="All orders fulfilled for today."/>
        : orders.map(o => (
          <div key={o.id} style={{padding:'12px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'center'}}>
            <div>
              <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:3}}>
                <span style={{fontFamily:T.mono, fontSize:11, fontWeight:600}}>{o.id}</span>
                <Badge status={o.status}/>
              </div>
              <div style={{fontSize:13, fontWeight:500}}>{o.accountName}</div>
              <div style={{fontSize:12, color:T.muted}}>
                {o.lines.map(l=>`${l.qty}× ${l.sku}`).join(', ')}
              </div>
              <div style={{fontSize:11, color:T.muted, fontFamily:T.mono}}>Due {o.requestedDelivery}</div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:4}}>
              <Btn v="primary" sz="xs" onClick={()=>updateOrderStatus(o.id,'shipped')}>Confirm pick</Btn>
              <Btn v="ghost" sz="xs">Short?</Btn>
            </div>
          </div>
        ))
      }
    </Card>
  );
}

function DistDepletionMini() {
  const { depletions } = useStore();
  const { navigate, role } = useRouter();
  const today = depletions.filter(d => d.date === '2026-04-27');
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Depletion live</div>
          <div style={{display:'flex', gap:6, alignItems:'center', marginTop:3}}>
            <div style={{width:6, height:6, borderRadius:999, background:T.green}}/>
            <span style={{fontSize:12, color:T.green, fontWeight:500}}>HQ in sync · real time</span>
          </div>
        </div>
        <Btn v="ghost" sz="sm" onClick={()=>navigate(`/${role}/depletion`)}>Full ledger</Btn>
      </div>
      {today.slice(0,5).map(d => {
        const toneMap = {fulfillment:'out', inbound:'in', sample:'adj', breakage:'adj'};
        const tone = toneMap[d.type]||'adj';
        const c = tone==='in'?T.green:tone==='out'?T.ink:T.amber;
        return (
          <div key={d.id} style={{padding:'10px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'grid', gridTemplateColumns:'48px auto 1fr auto', gap:10, alignItems:'center'}}>
            <span style={{fontFamily:T.mono, fontSize:11, color:T.muted}}>{d.time}</span>
            <span style={{fontSize:9, fontFamily:T.mono, fontWeight:600, padding:'2px 5px', borderRadius:4,
              background:tone==='in'?'hsl(158 56%36%/.1)':tone==='out'?'hsl(24 10%10%/.08)':'hsl(38 90%50%/.12)',
              color:c, letterSpacing:'.04em'}}>{tone.toUpperCase()}</span>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12.5, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.account}</div>
              <div style={{fontFamily:T.mono, fontSize:10.5, color:T.muted}}>{d.sku}</div>
            </div>
            <span style={{fontFamily:T.display, fontSize:17, fontWeight:600, color:c}}>
              {tone==='in'?'+':'-'}{d.bottles}
            </span>
          </div>
        );
      })}
      <div style={{padding:14, textAlign:'center'}}>
        <Btn v="ghost" sz="sm" onClick={()=>navigate(`/${role}/depletion`)}>View full depletion ledger →</Btn>
      </div>
    </Card>
  );
}

// ─── P1: Depletion live (full page) ──────────────────────────
function DistDepletion() {
  const { depletions, addDepletion } = useStore();
  const [showAdj, setShowAdj] = React.useState(false);
  const [adjType, setAdjType] = React.useState('sample');
  const [adjSku, setAdjSku] = React.useState('HJM-FP-750');
  const [adjQty, setAdjQty] = React.useState(0);
  const [adjNote, setAdjNote] = React.useState('');

  const outToday = depletions.filter(d=>d.date==='2026-04-27'&&d.type==='fulfillment').reduce((a,d)=>a+d.bottles,0);
  const inToday = depletions.filter(d=>d.date==='2026-04-27'&&d.type==='inbound').reduce((a,d)=>a+d.bottles,0);
  const adjToday = depletions.filter(d=>d.date==='2026-04-27'&&!['fulfillment','inbound'].includes(d.type)).length;

  // per-SKU totals today
  const skuTotals = PRODUCTS_DATA.map(p => {
    const out = depletions.filter(d=>d.sku===p.id&&d.type==='fulfillment'&&d.date==='2026-04-27').reduce((a,d)=>a+d.bottles,0);
    const bars = [42,38,56,71,84,out||28,0]; // synthetic + today
    return {...p, out, bars};
  }).filter(p=>p.out>0);

  return (
    <AppShell breadcrumb={['Depletion live']}>
      <PageHead
        title={<>Depletion live <span style={{marginLeft:10,display:'inline-flex',alignItems:'center',gap:6,padding:'3px 10px',borderRadius:999,background:'hsl(158 56%36%/.1)',border:'1px solid hsl(158 56%36%/.2)',fontSize:12,fontWeight:500,color:T.green,fontFamily:T.body,verticalAlign:'middle'}}>
          <span style={{width:6,height:6,borderRadius:999,background:T.green}}/>HQ in sync · {new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
        </span></>}
        eyebrow="Empire Wines · Brooklyn"
        sub="Every fulfillment and receipt is a depletion event. You never 'submit a report' — the system reports for you. Annotate only what's surprising."
        actions={<Btn v="outline" icon={IC.plus} onClick={()=>setShowAdj(true)}>Annotate adjustment</Btn>}
      />

      {/* Stats strip */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="Cases out today" value={Math.round(outToday/12)} sub={`${outToday} bottles · ${depletions.filter(d=>d.date==='2026-04-27'&&d.type==='fulfillment').length} fulfillments`} tone="stone" icon={IC.trendD}/>
        <StatCard label="Cases in today" value={Math.round(inToday/12)} sub={`${inToday} bottles received`} tone="green" icon={IC.trendU}/>
        <StatCard label="Net movement" value={Math.round((inToday-outToday)/12)} sub="cases · net" tone={inToday>outToday?'green':'warm'} icon={IC.refresh}/>
        <StatCard label="Pending annotations" value={adjToday} sub="need a note" tone={adjToday>0?'warm':'stone'} icon={IC.note}/>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:18}}>
        {/* Live ledger */}
        <Card padded={false} style={{overflow:'hidden'}}>
          <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`}}>
            <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Live event ledger</div>
            <div style={{fontSize:12, color:T.muted, marginTop:2}}>Updated with every fulfillment confirmation</div>
          </div>
          {depletions.map(d => {
            const toneMap = {fulfillment:'out', inbound:'in', sample:'adj', breakage:'adj'};
            const tone = toneMap[d.type]||'adj';
            const c = tone==='in'?T.green:tone==='out'?T.ink:T.amber;
            return (
              <div key={d.id} style={{
                padding:'11px 18px', borderBottom:`1px solid ${T.borderQ}`,
                display:'grid', gridTemplateColumns:'52px auto 1fr auto', gap:12, alignItems:'center',
                background: d.pending ? 'hsl(38 90%50%/.04)' : undefined
              }}>
                <span style={{fontFamily:T.mono, fontSize:11, color:T.muted}}>{d.time}</span>
                <span style={{fontSize:9, fontFamily:T.mono, fontWeight:600, padding:'2px 6px', borderRadius:4, letterSpacing:'.04em',
                  background:tone==='in'?'hsl(158 56%36%/.1)':tone==='out'?'hsl(24 10%10%/.08)':'hsl(38 90%50%/.12)',
                  color:c}}>{tone.toUpperCase()}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.account}</div>
                  <div style={{fontFamily:T.mono, fontSize:11, color:T.muted}}>{d.sku} {d.note?`· ${d.note}`:''}</div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span style={{fontFamily:T.display, fontSize:20, fontWeight:600, color:c}}>
                    {tone==='in'?'+':'-'}{d.bottles}
                  </span>
                  {d.pending && <Badge status="pending" label="annotate" size="xs"/>}
                </div>
              </div>
            );
          })}
        </Card>

        {/* SKU breakdown + weekly rhythm */}
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <Card>
            <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:14}}>Today by SKU</div>
            {skuTotals.length === 0
              ? <div style={{color:T.muted, fontSize:13}}>No depletions logged yet today.</div>
              : skuTotals.map(p => (
                <div key={p.id} style={{marginBottom:14}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4}}>
                    <div><span style={{fontWeight:500}}>{p.name}</span><span style={{fontFamily:T.mono, fontSize:11, color:T.muted, marginLeft:8}}>{p.id}</span></div>
                    <span style={{fontFamily:T.mono, fontWeight:600}}>{p.out} <span style={{color:T.muted, fontWeight:400}}>bottles</span></span>
                  </div>
                  <SparkBar data={p.bars} color={T.gold} height={32}/>
                </div>
              ))
            }
          </Card>

          <Card>
            <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:8}}>How this works</div>
            <div style={{fontSize:13, color:T.muted, lineHeight:1.7}}>
              <div style={{display:'flex', gap:10, marginBottom:6, alignItems:'flex-start'}}>
                <Badge status="approved" label="IN" size="xs" dot={false}/>
                <span>Receiving a PO writes an <strong>inbound</strong> event</span>
              </div>
              <div style={{display:'flex', gap:10, marginBottom:6, alignItems:'flex-start'}}>
                <Badge status="confirmed" label="OUT" size="xs" dot={false}/>
                <span>Confirming a pick writes a <strong>fulfillment</strong> event</span>
              </div>
              <div style={{display:'flex', gap:10, marginBottom:6, alignItems:'flex-start'}}>
                <Badge status="pending" label="ADJ" size="xs" dot={false}/>
                <span>Annotate breakage, samples or unusual draws here</span>
              </div>
              <div style={{display:'flex', gap:10, alignItems:'flex-start'}}>
                <div style={{width:6,height:6,borderRadius:999,background:T.green,marginTop:5,flexShrink:0}}/>
                <span>HQ sees every event on the same dataset, same second</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Annotation modal */}
      <Modal open={showAdj} onClose={()=>setShowAdj(false)} title="Log adjustment">
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <Field label="Type">
            <Select value={adjType} onChange={e=>setAdjType(e.target.value)} options={['sample','breakage','theft','audit-correction','other']}/>
          </Field>
          <Field label="SKU">
            <Select value={adjSku} onChange={e=>setAdjSku(e.target.value)} options={PRODUCTS_DATA.map(p=>({value:p.id,label:p.name}))}/>
          </Field>
          <Field label="Bottles">
            <Input value={adjQty} onChange={e=>setAdjQty(+e.target.value)} type="number" placeholder="0" mono/>
          </Field>
          <Field label="Note">
            <Textarea value={adjNote} onChange={e=>setAdjNote(e.target.value)} placeholder="Describe the reason…"/>
          </Field>
          <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
            <Btn v="outline" onClick={()=>setShowAdj(false)}>Cancel</Btn>
            <Btn v="accent" onClick={()=>{addDepletion({dist:'Empire Wines',sku:adjSku,bottles:adjQty,type:adjType,account:adjType,date:'2026-04-27',note:adjNote});setShowAdj(false);}}>Record</Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

// ─── Distributor: Inbound ─────────────────────────────────────
function DistInbound() {
  const { shipments, pos } = useStore();
  const inbound = shipments.filter(s => s.id.startsWith('SHP-PO') || s.dest.includes('Empire'));
  return (
    <AppShell breadcrumb={['Inbound']}>
      <PageHead title="Inbound" sub="All POs and transfers arriving at Empire Wines warehouse."
        actions={<Btn v="accent" icon={IC.check}>Receive against PO</Btn>}/>
      <Card padded={false}>
        <Table
          cols={[
            {key:'id', label:'Shipment', mono:true, bold:true},
            {key:'origin', label:'From'},
            {key:'carrier', label:'Carrier'},
            {key:'trackNo', label:'Track #', mono:true},
            {key:'bottles', label:'Bottles', right:true, mono:true, render:r=>r.bottles.toLocaleString()},
            {key:'eta', label:'ETA', mono:true},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
            {key:'_act', label:'', sortable:false, render:r=>(
              r.status==='delivered'?<Btn v="primary" sz="xs">Receive</Btn>:<span style={{color:T.muted, fontSize:12}}>Awaiting</span>
            )},
          ]}
          rows={inbound.length > 0 ? inbound : shipments.slice(0,2)}
          emptyMsg="No inbound shipments."
        />
      </Card>
    </AppShell>
  );
}

// ─── Distributor: Warehouse stock ─────────────────────────────
function DistInventory() {
  const { inventory } = useStore();
  const distInv = inventory.filter(i => i.locType === 'distributor' && i.location.includes('Empire'));
  return (
    <AppShell breadcrumb={['Warehouse stock']}>
      <PageHead title="Warehouse stock" sub="Current on-hand at Empire Wines · Brooklyn."/>
      <Card padded={false}>
        <Table
          cols={[
            {key:'sku', label:'SKU', mono:true, bold:true},
            {key:'batchId', label:'Batch', mono:true},
            {key:'lotNo', label:'Lot', mono:true},
            {key:'bottles', label:'Bottles', right:true, mono:true, render:r=>r.bottles.toLocaleString()},
            {key:'reserved', label:'Reserved', right:true, mono:true, render:r=>r.reserved.toLocaleString()},
            {key:'_avail', label:'Available', right:true, render:r=><span style={{fontFamily:T.mono, fontWeight:600, fontSize:13}}>{(r.bottles-r.reserved).toLocaleString()}</span>},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
          ]}
          rows={distInv.length>0?distInv:inventory.filter(i=>i.locType==='distributor')}
          emptyMsg="No warehouse stock."
        />
      </Card>
    </AppShell>
  );
}

// ─── Distributor: Sell-through ────────────────────────────────
function DistSellThrough() {
  const sparkW = [420,380,440,480,510,580,540,620,680,710,690,750];
  return (
    <AppShell breadcrumb={['Sell-through']}>
      <PageHead title="Sell-through velocity" sub="Cases depleted per week by SKU and account."/>
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:18}}>
        <Card>
          <div style={{fontFamily:T.display, fontSize:17, fontWeight:500, marginBottom:4}}>Weekly depletion</div>
          <div style={{fontSize:12, color:T.muted, marginBottom:16}}>Last 12 weeks · bottles</div>
          <SparkBar data={sparkW} color={T.gold} height={120}/>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:9, fontFamily:T.mono, color:T.muted, marginTop:6}}>
            {['W5','W6','W7','W8','W9','W10','W11','W12','W13','W14','W15','W16'].map(w=><span key={w}>{w}</span>)}
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:T.display, fontSize:17, fontWeight:500, marginBottom:16}}>Top accounts</div>
          {[{n:'Dante',bt:216,pct:31},{n:'Katana Kitten',bt:72,pct:10},{n:'Mace',bt:48,pct:7},{n:'Bar Suntory',bt:36,pct:5}].map(a=>(
            <div key={a.n} style={{marginBottom:12}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4}}>
                <span style={{fontWeight:500}}>{a.n}</span>
                <span style={{fontFamily:T.mono, fontWeight:600}}>{a.bt} <span style={{color:T.muted, fontWeight:400}}>btl</span></span>
              </div>
              <div style={{height:5, borderRadius:999, background:T.surface, overflow:'hidden'}}>
                <div style={{width:`${a.pct*3}%`, height:'100%', background:T.gold}}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}

// ─── Distributor: Alerts ──────────────────────────────────────
function DistAlerts() {
  return (
    <AppShell breadcrumb={['Alerts']}>
      <PageHead title="Alerts" sub="Stock and logistics alerts relevant to Empire Wines."/>
      <Card><EmptyState icon={IC.check} title="No active alerts" sub="All stock levels and shipments on track."/></Card>
    </AppShell>
  );
}

Object.assign(window, { DistDashboard, DistDepletion, DistInbound, DistInventory, DistSellThrough, DistAlerts });
