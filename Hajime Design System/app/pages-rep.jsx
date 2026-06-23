// app/pages-rep.jsx — Sales Rep pages (P1: distributor inventory visibility)

// ─── Rep Dashboard ────────────────────────────────────────────
function RepDashboard() {
  const { orders, accounts, visits } = useStore();
  const myOrders = orders.filter(o => o.rep === 'MT');
  const myAccounts = accounts.filter(a => a.rep === 'MT');
  const drafts = myOrders.filter(o => o.status === 'draft' || o.status === 'pending');
  const target = 28000;
  const actual = 14820;
  const { navigate, role } = useRouter();

  return (
    <AppShell breadcrumb={['Overview']}>
      <PageHead title="Good afternoon, Mike" eyebrow="Sales Rep · NYC territory"
        sub={`${myAccounts.length} accounts · ${drafts.length} drafts pending approval · ${myAccounts.filter(a=>a.status==='active').length} active.`}
        actions={<><Btn v="outline" icon={IC.note} onClick={()=>navigate(`/${role}/visits`)}>Log visit</Btn><Btn v="accent" icon={IC.cart} onClick={()=>navigate(`/${role}/drafts`)}>New draft</Btn></>}/>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24}}>
        <StatCard label="Month target" value={`$${(target/1000).toFixed(0)}K`} sub={`$${(actual/1000).toFixed(1)}K actual · ${Math.round(actual/target*100)}%`} tone="gold" icon={IC.target}/>
        <StatCard label="Drafts awaiting" value={drafts.length} sub="HQ approval queue" icon={IC.cart} tone={drafts.length>3?'warm':'stone'}/>
        <StatCard label="Active accounts" value={myAccounts.filter(a=>a.status==='active').length} sub={`${myAccounts.length} total`} icon={IC.users} tone="stone"/>
        <StatCard label="Visits this week" value={visits.filter(v=>v.rep==='MT').length} sub="notes captured" icon={IC.note} tone="stone"/>
      </div>

      {/* Target progress */}
      <Card style={{marginBottom:18}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
          <div style={{fontFamily:T.display, fontSize:16, fontWeight:500}}>April target</div>
          <div style={{fontFamily:T.mono, fontSize:14, fontWeight:600}}>${actual.toLocaleString()} / ${target.toLocaleString()}</div>
        </div>
        <div style={{height:8, borderRadius:999, background:T.surface, overflow:'hidden', marginBottom:6}}>
          <div style={{width:`${Math.min(actual/target*100,100)}%`, height:'100%', background:T.gold, transition:'width .5s'}}/>
        </div>
        <div style={{fontSize:12, color:T.muted}}>{Math.round(actual/target*100)}% · ${(target-actual).toLocaleString()} to go · 3 working days left</div>
      </Card>

      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18}}>
        <RepAccountList accounts={myAccounts}/>
        <RepDraftList orders={drafts}/>
      </div>
    </AppShell>
  );
}

function RepAccountList({ accounts }) {
  const { navigate, role } = useRouter();
  const signalC = {active:T.green, prospect:T.gold, inactive:T.muted};
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
        <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>My accounts</div>
        <Btn v="ghost" sz="sm" onClick={()=>navigate(`/${role}/accounts`)}>All</Btn>
      </div>
      {accounts.slice(0,6).map(a => {
        const signal = a.rev30 > 3000 ? 'on cadence' : a.rev30 > 0 ? 'slipping' : 'prospect';
        const sigC = signal==='on cadence'?T.green:signal==='slipping'?T.amber:T.muted;
        return (
          <div key={a.id} onClick={()=>navigate(`/${role}/accounts/${a.id}`)} style={{
            padding:'11px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'grid',
            gridTemplateColumns:'1fr auto', gap:8, cursor:'pointer'
          }} onMouseEnter={e=>e.currentTarget.style.background=T.surface} onMouseLeave={e=>e.currentTarget.style.background=''}>
            <div>
              <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:2}}>
                <div style={{width:6,height:6,borderRadius:999,background:sigC}}/>
                <span style={{fontSize:13, fontWeight:500}}>{a.name}</span>
              </div>
              <div style={{fontSize:12, color:T.muted}}>{a.city} · {a.type} · {signal}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:T.mono, fontSize:12, fontWeight:500}}>{a.rev30 ? `$${a.rev30.toLocaleString()}` : '—'}</div>
              <div style={{fontSize:11, color:T.muted}}>30d</div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function RepDraftList({ orders }) {
  const { navigate, role } = useRouter();
  return (
    <Card padded={false} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
        <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Draft orders</div>
        <Btn v="ghost" sz="sm" onClick={()=>navigate(`/${role}/drafts`)}>All</Btn>
      </div>
      {orders.length === 0
        ? <EmptyState icon={IC.cart} title="No drafts" sub="Create a draft from an account visit."/>
        : orders.map(o => (
          <div key={o.id} style={{padding:'11px 18px', borderBottom:`1px solid ${T.borderQ}`, display:'grid', gridTemplateColumns:'1fr auto', gap:8}}>
            <div>
              <div style={{fontFamily:T.mono, fontSize:11, marginBottom:2}}>{o.id}</div>
              <div style={{fontSize:13, fontWeight:500}}>{o.accountName}</div>
              <div style={{fontSize:12, color:T.muted}}>{o.market} · ${o.total.toLocaleString()}</div>
            </div>
            <Badge status={o.status}/>
          </div>
        ))
      }
    </Card>
  );
}

// ─── Rep Accounts ────────────────────────────────────────────
function RepAccounts() {
  const { accounts } = useStore();
  const { navigate, role } = useRouter();
  const mine = accounts.filter(a => a.rep === 'MT');
  return (
    <AppShell breadcrumb={['My accounts']}>
      <PageHead title="My accounts" sub="Your 38 assigned accounts across New York."
        actions={<Btn v="accent" icon={IC.plus}>Add account</Btn>}/>
      <Card padded={false}>
        <Table
          cols={[
            {key:'name', label:'Account', bold:true},
            {key:'type', label:'Type'},
            {key:'city', label:'City'},
            {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
            {key:'rev30', label:'30d Rev', right:true, mono:true, render:r=>r.rev30?`$${r.rev30.toLocaleString()}`:'—'},
            {key:'listings', label:'Listings', right:true, mono:true},
            {key:'lastOrder', label:'Last order', mono:true, render:r=>r.lastOrder||'—'},
          ]}
          rows={mine}
          onRow={r=>navigate(`/${role}/accounts/${r.id}`)}
          emptyMsg="No accounts assigned."
        />
      </Card>
    </AppShell>
  );
}

// ─── P1: Rep Inventory (distributor stock check) ─────────────
function RepInventory() {
  const { inventory } = useStore();
  // Filter to distributor stock (the missing P1 feature — rep can now see this)
  const distStock = inventory.filter(i => i.locType === 'distributor');

  return (
    <AppShell breadcrumb={['Stock check']}>
      <PageHead
        title={<>Stock check <Badge status="active" label="NEW · P1" size="xs" dot={false} custom="gold"/></>}
        eyebrow="Distributor on-hand visibility"
        sub="Check what's actually at Empire Wines before you promise. This view reads distributor stock in real time — updated with every fulfillment confirmation."
        actions={<Btn v="ghost" sz="sm" icon={IC.refresh}>Refresh</Btn>}
      />

      <div style={{padding:14, marginBottom:20, background:'hsl(40 88%42%/.06)', border:`1px solid hsl(40 88%42%/.2)`, borderRadius:12, fontSize:13, lineHeight:1.55, color:T.ink}}>
        <strong style={{color:T.gold}}>How to use this</strong> — Before committing product at an account visit, check here. If Empire has the stock, your draft will go through clean. If they're short, note the split in your draft comments — HQ will route from an alternate distributor.
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20}}>
        {PRODUCTS_DATA.filter(p=>p.status==='active').map(prod => {
          const rows = distStock.filter(i=>i.sku===prod.id);
          const total = rows.reduce((a,i)=>a+(i.bottles-i.reserved),0);
          const cases = Math.floor(total/prod.cs);
          const low = total < (prod.safetyStock * 0.3);
          return (
            <Card key={prod.id} style={{display:'grid', gridTemplateColumns:'1fr auto', gap:14, alignItems:'flex-start', borderLeft:`3px solid ${low?T.amber:T.green}`}}>
              <div>
                <div style={{fontFamily:T.mono, fontSize:11, color:T.muted, marginBottom:3}}>{prod.id}</div>
                <div style={{fontFamily:T.display, fontSize:20, fontWeight:600, letterSpacing:'-.01em'}}>{prod.name}</div>
                <div style={{fontSize:12, color:T.muted, marginTop:2}}>{prod.type} · {prod.size} · case of {prod.cs}</div>
                {rows.map(r=>(
                  <div key={r.id} style={{marginTop:8, fontSize:12, color:T.muted}}>
                    <span style={{fontWeight:500, color:T.ink}}>{r.location}</span> · {(r.bottles-r.reserved).toLocaleString()} available
                  </div>
                ))}
                {low && <div style={{marginTop:8}}><Badge status="pending" label="Running low" size="xs"/></div>}
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:T.display, fontSize:36, fontWeight:600, letterSpacing:'-.02em', color:low?T.amber:T.ink, lineHeight:1}}>{cases}</div>
                <div style={{fontSize:11, color:T.muted, fontFamily:T.mono}}>cases</div>
                <div style={{fontSize:11, color:T.muted, marginTop:4}}>{total.toLocaleString()} btl</div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:14}}>Why this matters</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, fontSize:13, color:T.muted, lineHeight:1.6}}>
          <div>Before this feature, a rep would promise 18 cases to Dante, HQ would approve, then the distributor would say "we only have 6." The order gets split, the rep looks bad, and the customer is confused.</div>
          <div>Now you check here first. If Empire has 142 cases of FP-750 available, your 18-case draft will pull cleanly. If they have 6, you know to request a partial + forward fill in the draft.</div>
        </div>
      </Card>
    </AppShell>
  );
}

// ─── Rep Drafts ───────────────────────────────────────────────
function RepDrafts() {
  const { orders, createOrder, approveOrder } = useStore();
  const { navigate, role } = useRouter();
  const mine = orders.filter(o => o.rep === 'MT');
  const [showCreate, setShowCreate] = React.useState(false);

  return (
    <AppShell breadcrumb={['Draft orders']}>
      <PageHead title="Draft orders" sub="Your orders in every stage of the approval flow."
        actions={<Btn v="accent" icon={IC.plus} onClick={()=>setShowCreate(true)}>New draft</Btn>}/>
      <Card padded={false}>
        <Table
          cols={[
            {key:'id', label:'Order ID', mono:true, bold:true},
            {key:'accountName', label:'Account'},
            {key:'market', label:'Market'},
            {key:'orderDate', label:'Date', mono:true},
            {key:'total', label:'Total', right:true, mono:true, render:r=>`$${r.total.toLocaleString()}`},
            {key:'status', label:'Status', render:r=>(
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <Badge status={r.status}/>
                {r.status==='pending'&&<span style={{fontSize:11,color:T.muted}}>awaiting HQ</span>}
              </div>
            )},
          ]}
          rows={mine}
          onRow={r=>navigate(`/${role}/orders/${r.id}`)}
          emptyMsg="No orders yet."
        />
      </Card>
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="New draft order" width={560}>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Field label="Account">
            <Select options={[{value:'',label:'Select account…'}, ...ACCOUNTS_DATA.filter(a=>a.rep==='MT').map(a=>({value:a.id,label:a.name}))]} value="" onChange={()=>{}}/>
          </Field>
          <Field label="SKU">
            <Select options={PRODUCTS_DATA.map(p=>({value:p.id,label:p.name}))} value="HJM-FP-750" onChange={()=>{}}/>
          </Field>
          <Field label="Cases">
            <Input type="number" placeholder="12" mono/>
          </Field>
          <Field label="Visit note"><Textarea placeholder="What did you observe? Bartender feedback, backbar position, competitive SKUs…"/></Field>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
            <Btn v="outline" onClick={()=>setShowCreate(false)}>Cancel</Btn>
            <Btn v="accent" onClick={()=>setShowCreate(false)}>Save draft</Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

// ─── Rep Visit Notes ──────────────────────────────────────────
function RepVisits() {
  const { visits, addVisit } = useStore();
  const mine = visits.filter(v => v.rep === 'MT');
  const [showAdd, setShowAdd] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [acct, setAcct] = React.useState('ACC-001');
  const sentC = {positive:T.green, neutral:T.muted, 'needs-follow-up':T.amber};

  return (
    <AppShell breadcrumb={['Visit notes']}>
      <PageHead title="Visit notes" sub="Every account visit captured, tagged, and searchable."
        actions={<Btn v="accent" icon={IC.mic||IC.note} onClick={()=>setShowAdd(true)}>Log visit</Btn>}/>
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {mine.map(v => (
          <Card key={v.id} style={{display:'grid', gridTemplateColumns:'8px 1fr', gap:16, alignItems:'flex-start'}}>
            <div style={{width:6, height:6, borderRadius:999, background:sentC[v.sentiment]||T.muted, marginTop:4}}/>
            <div>
              <div style={{display:'flex', gap:10, alignItems:'baseline', marginBottom:6}}>
                <span style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>{v.accountName}</span>
                <span style={{fontSize:12, color:T.muted, fontFamily:T.mono}}>{v.date}</span>
                {v.draftId && <Badge status="pending" label={`Draft: ${v.draftId}`} size="xs"/>}
              </div>
              <div style={{fontSize:14, color:T.ink, lineHeight:1.55}}>{v.summary}</div>
            </div>
          </Card>
        ))}
        {mine.length === 0 && <Card><EmptyState icon={IC.note} title="No visits logged" sub="Log your first visit note after today's accounts."/></Card>}
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Log visit note">
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Field label="Account">
            <Select value={acct} onChange={e=>setAcct(e.target.value)} options={ACCOUNTS_DATA.filter(a=>a.rep==='MT').map(a=>({value:a.id,label:a.name}))}/>
          </Field>
          <Field label="Note" hint="What did you observe? Backbar levels, feedback, events, opportunities.">
            <Textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} placeholder="Write or transcribe your visit note…"/>
          </Field>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <Btn v="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn v="accent" onClick={()=>{addVisit({account:acct,accountName:ACCOUNTS_DATA.find(a=>a.id===acct)?.name||'',rep:'MT',summary:note,draftId:null,sentiment:'neutral'});setShowAdd(false);setNote('');}}>Save note</Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

// ─── Rep Targets ─────────────────────────────────────────────
function RepTargets() {
  const actual = 14820, target = 28000;
  return (
    <AppShell breadcrumb={['Targets']}>
      <PageHead title="Targets" sub="April 2026 · NYC territory"/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="Month target" value={`$${(target/1000).toFixed(0)}K`} tone="gold" icon={IC.target}/>
        <StatCard label="Actual to date" value={`$${(actual/1000).toFixed(1)}K`} trend={Math.round((actual/target-0.5)*100)} tone={actual/target>0.5?'green':'warm'} icon={IC.trendU}/>
        <StatCard label="Attainment" value={`${Math.round(actual/target*100)}%`} sub="3 days remaining" tone="stone" icon={IC.chart}/>
      </div>
      <Card>
        <div style={{fontFamily:T.display, fontSize:17, fontWeight:500, marginBottom:16}}>Revenue by account</div>
        {ACCOUNTS_DATA.filter(a=>a.rep==='MT'&&a.rev30>0).sort((a,b)=>b.rev30-a.rev30).map(a=>(
          <div key={a.id} style={{marginBottom:12}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4}}>
              <span style={{fontWeight:500}}>{a.name}</span>
              <span style={{fontFamily:T.mono, fontWeight:600}}>${a.rev30.toLocaleString()}</span>
            </div>
            <div style={{height:5, borderRadius:999, background:T.surface, overflow:'hidden'}}>
              <div style={{width:`${(a.rev30/target*100)}%`, height:'100%', background:T.gold}}/>
            </div>
          </div>
        ))}
      </Card>
    </AppShell>
  );
}

// ─── Rep Opportunities ────────────────────────────────────────
function RepOpportunities() {
  const opps = [
    {id:'OPP-001',account:'The Aviary',city:'Chicago',potential:12000,stage:'prospect',next:'Intro tasting · May 5'},
    {id:'OPP-002',account:'Noma',city:'Copenhagen',potential:48000,stage:'prospect',next:'Email intro via PD'},
    {id:'OPP-003',account:'Llama Inn',city:'Brooklyn',potential:4800,stage:'active',next:'Follow-up after tasting'},
  ];
  return (
    <AppShell breadcrumb={['Opportunities']}>
      <PageHead title="Opportunities" sub="Prospects and expansion accounts."
        actions={<Btn v="accent" icon={IC.plus}>Add opportunity</Btn>}/>
      <Card padded={false}>
        <Table
          cols={[
            {key:'account', label:'Account', bold:true},
            {key:'city', label:'City'},
            {key:'potential', label:'Potential', right:true, mono:true, render:r=>`$${r.potential.toLocaleString()}`},
            {key:'stage', label:'Stage', render:r=><Badge status={r.stage==='active'?'active':'prospect'} label={r.stage}/>},
            {key:'next', label:'Next step'},
          ]}
          rows={opps}
          emptyMsg="No opportunities."
        />
      </Card>
    </AppShell>
  );
}

// ─── Rep Reports ─────────────────────────────────────────────
function RepReports() {
  return (
    <AppShell breadcrumb={['Analytics']}>
      <PageHead title="Analytics" sub="Your performance metrics for April 2026."/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="Accounts visited" value="14" sub="this month" icon={IC.pin} tone="stone"/>
        <StatCard label="Avg order value" value="$580" trend={12} tone="gold" icon={IC.cart}/>
        <StatCard label="Win rate" value="71%" sub="of submitted drafts approved" icon={IC.check} tone="green"/>
      </div>
      <Card><EmptyState icon={IC.chart} title="Full analytics coming soon" sub="Detailed funnel, SKU mix, and visit frequency charts."/></Card>
    </AppShell>
  );
}

Object.assign(window, { RepDashboard, RepAccounts, RepInventory, RepDrafts, RepVisits, RepTargets, RepOpportunities, RepReports });
