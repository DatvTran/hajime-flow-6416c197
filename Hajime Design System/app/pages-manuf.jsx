// app/pages-manuf.jsx — Manufacturer pages

function ManufDashboard() {
  const { pos, shipments } = useStore();
  const inProd = pos.filter(p => p.status === 'in-production');
  const pending = pos.filter(p => p.status === 'pending');
  const shipped = pos.filter(p => p.status === 'shipped');
  return (
    <AppShell breadcrumb={['Overview']}>
      <PageHead title="Overview" eyebrow="Yamato Distillery · Manufacturer portal"
        sub="Production pipeline, POs in, shipments out. Nothing commercial."
        actions={<Btn v="accent" icon={IC.factory}>Log update</Btn>}/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24}}>
        <StatCard label="Pending orders" value={pending.length} sub="need acknowledgement" icon={IC.file} tone={pending.length>0?'warm':'stone'}/>
        <StatCard label="In production" value={inProd.length} sub="active batches" icon={IC.factory} tone="gold"/>
        <StatCard label="Shipped" value={shipped.length} sub="this month" icon={IC.truck} tone="stone"/>
        <StatCard label="Capacity used" value="78%" sub="still · this week" icon={IC.chart} tone="stone"/>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:18}}>
        <ManufProductionBoard pos={pos}/>
        <ManufShipOut shipments={shipments.filter(s=>s.id.startsWith('SHP-PO'))}/>
      </div>
    </AppShell>
  );
}

function ManufProductionBoard({ pos }) {
  const stages = ['pending','approved','in-production','shipped','delivered'];
  const stageLabel = {pending:'Queued',approved:'Approved',  'in-production':'In production', shipped:'Shipped', delivered:'Delivered'};
  const stageC = {pending:'hsl(30 10%55%)', approved:T.gold, 'in-production':'hsl(15 60%45%)', shipped:T.blue, delivered:T.green};
  const { approvePO } = useStore();
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`}}>
        <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Production board</div>
        <div style={{fontSize:12, color:T.muted, marginTop:2}}>Drag cards across stages to update status</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:1, background:T.borderQ, minHeight:360}}>
        {stages.map(stage => (
          <div key={stage} style={{background:T.paper2, padding:10}}>
            <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:10}}>
              <div style={{width:7, height:7, borderRadius:999, background:stageC[stage]}}/>
              <div style={{fontSize:11, fontWeight:600, color:T.ink}}>{stageLabel[stage]}</div>
              <span style={{fontFamily:T.mono, fontSize:10, color:T.muted, marginLeft:'auto'}}>{pos.filter(p=>p.status===stage).length}</span>
            </div>
            {pos.filter(p => p.status === stage).map(p => (
              <div key={p.id} style={{
                background:T.card, border:`1px solid ${T.borderQ}`,
                borderLeft:`3px solid ${stageC[stage]}`, borderRadius:8,
                padding:'10px 12px', marginBottom:8, cursor:'grab'
              }}>
                <div style={{fontFamily:T.mono, fontSize:10, color:T.muted, marginBottom:3}}>{p.id}</div>
                <div style={{fontFamily:T.mono, fontSize:11, fontWeight:600, color:T.ink, marginBottom:4}}>{p.sku}</div>
                <div style={{fontFamily:T.display, fontSize:18, fontWeight:600}}>
                  {p.qty.toLocaleString()}<span style={{fontSize:10, color:T.muted, fontWeight:400, marginLeft:3}}>bottles</span>
                </div>
                <div style={{fontSize:10, color:T.muted, fontFamily:T.mono, marginTop:4}}>{p.region}</div>
                {p.shipDate && <div style={{fontSize:10, color:T.muted, fontFamily:T.mono}}>ETA {p.shipDate}</div>}
                {stage === 'pending' && (
                  <Btn v="accent" sz="xs" style={{marginTop:8, width:'100%'}} onClick={() => approvePO(p.id)}>Acknowledge</Btn>
                )}
              </div>
            ))}
            <div style={{border:`1px dashed ${T.border}`, borderRadius:8, padding:'10px 12px', fontSize:11, color:T.muted, textAlign:'center'}}>
              + drop here
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ManufShipOut({ shipments }) {
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`}}>
        <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Outbound shipments</div>
        <div style={{fontSize:12, color:T.muted, marginTop:2}}>From Yamato → distributors</div>
      </div>
      {shipments.length === 0
        ? <EmptyState icon={IC.truck} title="No outbound shipments" sub="Processed shipments appear here."/>
        : shipments.map(s => (
          <div key={s.id} style={{padding:'12px 18px', borderBottom:`1px solid ${T.borderQ}`}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
              <div>
                <div style={{fontFamily:T.mono, fontSize:11, fontWeight:600}}>{s.id}</div>
                <div style={{fontSize:13, fontWeight:500, marginTop:2}}>{s.dest}</div>
                <div style={{fontSize:12, color:T.muted}}>{s.bottles.toLocaleString()} bottles · ETA {s.eta}</div>
              </div>
              <Badge status={s.status}/>
            </div>
          </div>
        ))
      }
    </Card>
  );
}

// ─── Manufacturer POs in ─────────────────────────────────────
function ManufPOsIn() {
  const { pos, approvePO } = useStore();
  return (
    <AppShell breadcrumb={['Orders in']}>
      <PageHead title="Production orders" sub="Approved POs from Hajime HQ ready for your production queue."
        actions={<Btn v="outline" icon={IC.dl}>Export specs</Btn>}/>
      <Card padded={false}>
        <Table
          cols={[
            {key:'id', label:'PO ID', mono:true, bold:true},
            {key:'sku', label:'SKU', mono:true},
            {key:'qty', label:'Qty', right:true, mono:true, render:r=>r.qty.toLocaleString()},
            {key:'region', label:'Ship to'},
            {key:'requested', label:'Requested', mono:true},
            {key:'shipDate', label:'Target ship', mono:true, render:r=>r.shipDate||'—'},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
            {key:'_act', label:'', sortable:false, render:r=>(
              r.status==='pending'
                ? <Btn v="primary" sz="xs" onClick={e=>{e.stopPropagation();approvePO(r.id)}}>Acknowledge</Btn>
                : <Btn v="ghost" sz="xs">Update</Btn>
            )},
          ]}
          rows={pos}
          emptyMsg="No POs received."
        />
      </Card>
    </AppShell>
  );
}

// ─── Manufacturer specs ───────────────────────────────────────
function ManufSpecs() {
  return (
    <AppShell breadcrumb={['Product specs']}>
      <PageHead title="Product specs" sub="Packaging, labelling and certification requirements per SKU."/>
      <Card padded={false}>
        <Table
          cols={[
            {key:'id', label:'SKU', mono:true, bold:true},
            {key:'name', label:'Product'},
            {key:'type', label:'Category'},
            {key:'size', label:'Size'},
            {key:'cs', label:'Case size', right:true, mono:true},
            {key:'_notes', label:'Notes', sortable:false, render:r=><span style={{color:T.muted, fontSize:12}}>Standard JP packaging · EN/JA labels</span>},
          ]}
          rows={PRODUCTS_DATA}
          emptyMsg="No specs."
        />
      </Card>
    </AppShell>
  );
}

// ─── Manufacturer profile ─────────────────────────────────────
function ManufProfile() {
  return (
    <AppShell breadcrumb={['Profile']}>
      <PageHead title="Distillery profile" sub="Public-facing profile seen by brand operators and distributors."/>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}}>
        <Card>
          <div style={{fontFamily:T.display, fontSize:18, fontWeight:500, marginBottom:16}}>Yamato Distillery</div>
          {[['Location','Yamanashi Prefecture, Japan'],['Founded','1964'],['Capacity','12,000 bottles / month'],['Lead time','21 days'],['Primary contact','Yui Imanishi · yui@yamato.jp'],['Certifications','IFS Food · FSSC 22000']].map(([l,v])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
              <span style={{color:T.muted}}>{l}</span><span style={{fontWeight:500}}>{v}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontFamily:T.display, fontSize:18, fontWeight:500, marginBottom:16}}>This month</div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <StatCard label="Cases produced" value="640" tone="gold"/>
            <StatCard label="On-time delivery" value="97%" trend={1.2} tone="green"/>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

Object.assign(window, { ManufDashboard, ManufPOsIn, ManufSpecs, ManufProfile });
