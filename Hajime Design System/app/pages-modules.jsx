// app/pages-modules.jsx — Finance AR/AP, Incentive Manager, Product Development

// ─── Finance AR/AP ────────────────────────────────────────────
function FinanceARPage() {
  const [tab, setTab] = React.useState('ar');
  const [showCreateInv, setShowCreateInv] = React.useState(false);
  const [payFilter, setPayFilter] = React.useState('all');

  const AR_DATA = [
    {id:'INV-2604-001', account:'The Drake Hotel',  amount:4800,  due:'2026-05-11', issued:'2026-04-11', status:'pending',  daysLeft:11, paymentMethod:'net30'},
    {id:'INV-2604-002', account:'Kioi Sakaba',      amount:7728,  due:'2026-05-13', issued:'2026-04-13', status:'pending',  daysLeft:13, paymentMethod:'net30'},
    {id:'INV-2604-003', account:'Bar Hemingway',    amount:2544,  due:'2026-04-07', issued:'2026-04-02', status:'paid',     daysLeft:0,  paymentMethod:'stripe', paidDate:'2026-04-09'},
    {id:'INV-2604-004', account:'Bar Suntory',      amount:3200,  due:'2026-03-15', issued:'2026-03-01', status:'overdue',  daysLeft:-45, paymentMethod:'net30'},
    {id:'INV-2604-005', account:'Dante',            amount:1056,  due:'2026-05-25', issued:'2026-04-25', status:'draft',    daysLeft:25, paymentMethod:'net30'},
    {id:'INV-2604-006', account:'Liquid Gold',      amount:624,   due:'2026-05-27', issued:'2026-04-27', status:'draft',    daysLeft:27, paymentMethod:'stripe'},
  ];

  const AP_DATA = [
    {id:'AP-2604-001', vendor:'Yamato Distillery',  amount:86400, due:'2026-05-04', issued:'2026-04-08', status:'pending',  type:'Production PO'},
    {id:'AP-2604-002', vendor:'First Press Co.',    amount:62400, due:'2026-04-22', issued:'2026-03-22', status:'paid',     type:'Production PO', paidDate:'2026-04-20'},
    {id:'AP-2604-003', vendor:'Air France Cargo',   amount:8200,  due:'2026-05-02', issued:'2026-04-24', status:'pending',  type:'Freight'},
    {id:'AP-2604-004', vendor:'Kentoku Logistics',  amount:2400,  due:'2026-04-30', issued:'2026-04-25', status:'pending',  type:'Last mile'},
  ];

  const filtered = tab==='ar'
    ? (payFilter==='all' ? AR_DATA : AR_DATA.filter(r=>r.status===payFilter))
    : AP_DATA;

  const arOutstanding = AR_DATA.filter(r=>r.status!=='paid'&&r.status!=='draft').reduce((a,r)=>a+r.amount,0);
  const arOverdue = AR_DATA.filter(r=>r.status==='overdue').reduce((a,r)=>a+r.amount,0);
  const arCollected = AR_DATA.filter(r=>r.status==='paid').reduce((a,r)=>a+r.amount,0);
  const apPending = AP_DATA.filter(r=>r.status==='pending').reduce((a,r)=>a+r.amount,0);

  return (
    <AppShell breadcrumb={['Finance']}>
      <PageHead title="Finance" sub="Accounts receivable, accounts payable, and payment tracking."
        actions={<><Btn v="outline" icon={IC.dl}>Export</Btn><Btn v="accent" icon={IC.plus} onClick={()=>setShowCreateInv(true)}>New invoice</Btn></>}/>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="AR outstanding" value={`$${(arOutstanding/1000).toFixed(1)}K`} sub="3 invoices" icon={IC.receipt} tone="warm"/>
        <StatCard label="Overdue" value={`$${(arOverdue/1000).toFixed(1)}K`} sub="45+ days past due" icon={IC.alert} tone="warm"/>
        <StatCard label="Collected MTD" value={`$${(arCollected/1000).toFixed(1)}K`} sub="1 invoice paid" icon={IC.check} tone="green" trend={8}/>
        <StatCard label="AP outstanding" value={`$${(apPending/1000).toFixed(0)}K`} sub="3 bills due" icon={IC.file} tone="stone"/>
      </div>

      <div style={{display:'flex', gap:14, marginBottom:16, alignItems:'center'}}>
        <Tabs tabs={[{id:'ar',label:'Receivable'},{id:'ap',label:'Payable'}]} active={tab} onChange={v=>{setTab(v);setPayFilter('all');}}/>
        {tab==='ar' && (
          <div style={{display:'flex', gap:6, marginLeft:'auto'}}>
            {['all','pending','overdue','paid','draft'].map(f=>(
              <Btn key={f} v={payFilter===f?'primary':'ghost'} sz="sm" onClick={()=>setPayFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </Btn>
            ))}
          </div>
        )}
      </div>

      <Card padded={false}>
        <Table
          cols={tab==='ar' ? [
            {key:'id', label:'Invoice', mono:true, bold:true, render:r=><span style={{color:T.gold,fontFamily:T.mono,fontSize:12}}>{r.id}</span>},
            {key:'account', label:'Account', bold:true},
            {key:'amount', label:'Amount', right:true, mono:true, render:r=>`$${r.amount.toLocaleString()}`},
            {key:'issued', label:'Issued', mono:true},
            {key:'due', label:'Due', mono:true},
            {key:'daysLeft', label:'Days', right:true, mono:true, render:r=>(
              <span style={{color:r.daysLeft<0?T.red:r.daysLeft<7?T.amber:T.muted, fontWeight:r.daysLeft<0?700:400}}>
                {r.daysLeft<0?`${Math.abs(r.daysLeft)}d overdue`:r.status==='paid'?'—':`${r.daysLeft}d`}
              </span>
            )},
            {key:'paymentMethod', label:'Method', render:r=><Badge status="confirmed" label={r.paymentMethod}/>},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
            {key:'_act', label:'', sortable:false, render:r=>(
              r.status==='pending'||r.status==='overdue'
                ? <Btn v="primary" sz="xs">Record payment</Btn>
                : r.status==='draft' ? <Btn v="outline" sz="xs">Send</Btn>
                : null
            )},
          ] : [
            {key:'id', label:'Bill', mono:true, bold:true, render:r=><span style={{color:T.gold,fontFamily:T.mono,fontSize:12}}>{r.id}</span>},
            {key:'vendor', label:'Vendor', bold:true},
            {key:'type', label:'Type'},
            {key:'amount', label:'Amount', right:true, mono:true, render:r=>`$${r.amount.toLocaleString()}`},
            {key:'issued', label:'Issued', mono:true},
            {key:'due', label:'Due', mono:true},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
            {key:'_act', label:'', sortable:false, render:r=>(
              r.status==='pending'
                ? <Btn v="primary" sz="xs">Pay</Btn>
                : <span style={{fontSize:11,color:T.green,fontFamily:T.mono}}>{r.paidDate}</span>
            )},
          ]}
          rows={filtered}
          emptyMsg="No records."
        />
      </Card>

      <Modal open={showCreateInv} onClose={()=>setShowCreateInv(false)} title="New invoice" width={520}>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Field label="Account"><Select options={[{value:'',label:'Select…'},...ACCOUNTS_DATA.map(a=>({value:a.id,label:a.name}))]} value="" onChange={()=>{}}/></Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Amount ($)"><Input type="number" placeholder="0.00" mono/></Field>
            <Field label="Due date"><Input type="date" mono/></Field>
          </div>
          <Field label="Payment terms"><Select options={['net30','net15','on-receipt','stripe']} value="net30" onChange={()=>{}}/></Field>
          <Field label="Notes"><Textarea rows={2} placeholder="Reference order ID, PO number…"/></Field>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <Btn v="outline" onClick={()=>setShowCreateInv(false)}>Cancel</Btn>
            <Btn v="soft" onClick={()=>setShowCreateInv(false)}>Save draft</Btn>
            <Btn v="accent" onClick={()=>setShowCreateInv(false)}>Send invoice</Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

// IncentiveManager moved to app/pages-incentives.jsx
function ProductDevelopment() {
  const [showCreate, setShowCreate] = React.useState(false);
  const [selectedProd, setSelectedProd] = React.useState(null);

  const PIPELINE = [
    {id:'PD-001', name:'Hajime Koshu',      type:'Koshu',      stage:'concept',    target:'2027 Q1', mkt:'JP/US',    notes:'Aged 3yr — HQ + Kioi interest.', progress:15},
    {id:'PD-002', name:'Yuzu Sparkling',    type:'Sparkling',  stage:'sampling',   target:'2026 Q3', mkt:'SG/HK',    notes:'Proto batch at Yamato. Positive reception at trade show.', progress:45},
    {id:'PD-003', name:'Florin Peaks 500ml',type:'Junmai D',   stage:'approved',   target:'2026 Q2', mkt:'All',      notes:'Smaller format for on-premise. Label design in progress.', progress:80},
    {id:'PD-004', name:'Junmai Noir',        type:'Junmai',     stage:'hold',       target:'TBD',     mkt:'EMEA',     notes:'Paused — cask sourcing issue. Review Jul.', progress:30},
    {id:'PD-005', name:'First Press Single Origin',type:'Coffee Rhum',stage:'concept',target:'2027 Q2',mkt:'US/CA',notes:'Farmer partnership pending.', progress:10},
  ];

  const stageC = {concept:'hsl(30 10%55%)', sampling:T.blue, approved:T.green, hold:T.amber, launched:T.gold};
  const stageLabel = {concept:'Concept',sampling:'Sampling',approved:'Approved',hold:'On hold',launched:'Launched'};

  return (
    <AppShell breadcrumb={['Product development']}>
      <PageHead title="Product development" sub="New SKU pipeline from concept through approval to launch."
        actions={<Btn v="accent" icon={IC.plus} onClick={()=>setShowCreate(true)}>New SKU request</Btn>}/>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="In pipeline" value={PIPELINE.length} sub="across all stages" icon={IC.factory} tone="gold"/>
        <StatCard label="Approved" value={PIPELINE.filter(p=>p.stage==='approved').length} sub="ready for production" icon={IC.check} tone="green"/>
        <StatCard label="Sampling" value={PIPELINE.filter(p=>p.stage==='sampling').length} sub="prototype batches" icon={IC.box} tone="stone"/>
        <StatCard label="On hold" value={PIPELINE.filter(p=>p.stage==='hold').length} sub="paused" icon={IC.more} tone="warm"/>
      </div>

      {/* Kanban by stage */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20}}>
        {['concept','sampling','approved','hold','launched'].map(stage => (
          <div key={stage} style={{background:T.surface, borderRadius:12, padding:12}}>
            <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:12}}>
              <div style={{width:7, height:7, borderRadius:999, background:stageC[stage]}}/>
              <span style={{fontSize:12, fontWeight:600}}>{stageLabel[stage]}</span>
              <span style={{fontFamily:T.mono, fontSize:10, color:T.muted, marginLeft:'auto'}}>{PIPELINE.filter(p=>p.stage===stage).length}</span>
            </div>
            {PIPELINE.filter(p=>p.stage===stage).map(p => (
              <div key={p.id} onClick={()=>setSelectedProd(p)} style={{
                background:T.card, border:`1px solid ${T.borderQ}`,
                borderLeft:`3px solid ${stageC[stage]}`, borderRadius:8,
                padding:'10px 12px', marginBottom:8, cursor:'pointer'
              }} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 8px hsl(24 10%10%/.08)'} onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
                <div style={{fontSize:12, fontFamily:T.mono, color:T.muted, marginBottom:3}}>{p.id}</div>
                <div style={{fontFamily:T.display, fontSize:15, fontWeight:600, marginBottom:4}}>{p.name}</div>
                <div style={{fontSize:11, color:T.muted, marginBottom:8}}>{p.type} · {p.mkt}</div>
                <div style={{height:4, borderRadius:999, background:T.surface, overflow:'hidden'}}>
                  <div style={{width:`${p.progress}%`, height:'100%', background:stageC[stage]}}/>
                </div>
                <div style={{fontSize:10, color:T.muted, fontFamily:T.mono, marginTop:4}}>{p.progress}% · Target {p.target}</div>
              </div>
            ))}
            <div style={{border:`1px dashed ${T.border}`, borderRadius:8, padding:'8px 12px', fontSize:11, color:T.muted, textAlign:'center'}}>+ drop here</div>
          </div>
        ))}
      </div>

      {/* Detail drawer */}
      <Drawer open={!!selectedProd} onClose={()=>setSelectedProd(null)} title={selectedProd?.name||''}>
        {selectedProd && (
          <div style={{display:'flex', flexDirection:'column', gap:18}}>
            <div style={{display:'flex', gap:8}}>
              <Badge status="confirmed" label={selectedProd.type}/>
              <Badge status={selectedProd.stage==='approved'?'active':selectedProd.stage==='hold'?'pending':'confirmed'} label={stageLabel[selectedProd.stage]}/>
            </div>

            <div>
              <div style={{height:8, borderRadius:999, background:T.surface, overflow:'hidden', marginBottom:6}}>
                <div style={{width:`${selectedProd.progress}%`, height:'100%', background:stageC[selectedProd.stage]}}/>
              </div>
              <div style={{fontSize:12, color:T.muted}}>{selectedProd.progress}% complete · Target {selectedProd.target}</div>
            </div>

            {[['SKU ID',selectedProd.id],['Type',selectedProd.type],['Target markets',selectedProd.mkt],['Launch target',selectedProd.target]].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
                <span style={{color:T.muted}}>{l}</span><span style={{fontWeight:500}}>{v}</span>
              </div>
            ))}

            <div>
              <div style={{fontWeight:500, fontSize:13, marginBottom:6}}>Notes</div>
              <div style={{fontSize:13, color:T.muted, lineHeight:1.6}}>{selectedProd.notes}</div>
            </div>

            <div>
              <div style={{fontWeight:500, fontSize:13, marginBottom:10}}>Move stage</div>
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                {['concept','sampling','approved','hold'].filter(s=>s!==selectedProd.stage).map(s=>(
                  <Btn key={s} v="outline" sz="sm" onClick={()=>setSelectedProd({...selectedProd,stage:s})}>{stageLabel[s]}</Btn>
                ))}
                <Btn v="accent" sz="sm" onClick={()=>setSelectedProd({...selectedProd,stage:'launched'})}>Launch</Btn>
              </div>
            </div>

            <div style={{paddingTop:16, borderTop:`1px solid ${T.borderQ}`}}>
              <div style={{fontWeight:500, fontSize:13, marginBottom:8}}>Add comment</div>
              <Textarea rows={3} placeholder="Status update, feedback from accounts, production notes…"/>
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                <Btn v="accent" sz="sm">Save</Btn>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="New SKU request" width={520}>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Field label="Product name"><Input placeholder="e.g. Hajime Koshu Reserve"/></Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Category"><Select options={['Junmai','Junmai Daiginjo','Nigori','Koshu','Sparkling','Coffee Rhum']} value="Junmai" onChange={()=>{}}/></Field>
            <Field label="Format"><Select options={['300ml','500ml','720ml','750ml','1800ml']} value="720ml" onChange={()=>{}}/></Field>
          </div>
          <Field label="Target markets"><Input placeholder="e.g. Japan, US, Canada"/></Field>
          <Field label="Launch target"><Select options={['2026 Q2','2026 Q3','2026 Q4','2027 Q1','2027 Q2']} value="2026 Q3" onChange={()=>{}}/></Field>
          <Field label="Brief"><Textarea rows={3} placeholder="What's the brief? Account feedback, market gap, production concept…"/></Field>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <Btn v="outline" onClick={()=>setShowCreate(false)}>Cancel</Btn>
            <Btn v="accent" onClick={()=>setShowCreate(false)}>Submit request</Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

Object.assign(window, { FinanceARPage, IncentiveManager, ProductDevelopment });
