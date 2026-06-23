// app/pages-polish.jsx — Polished detail views + multi-step forms

// ─── Account Detail (CRM card) ────────────────────────────────
function AccountDetail() {
  const { parts, navigate, role } = useRouter();
  const { accounts, orders, visits } = useStore();
  const accountId = parts[2];
  const acct = accounts.find(a => a.id === accountId) || accounts[0];
  const acctOrders = orders.filter(o => o.account === acct?.id);
  const acctVisits = visits.filter(v => v.account === acct?.id);
  const [tab, setTab] = React.useState('overview');

  if (!acct) return <AppShell><EmptyState title="Account not found" sub={accountId}/></AppShell>;

  const tierC = {flagship:'gold', key:'green', standard:'stone'};
  const rev = acctOrders.filter(o=>o.status!=='cancelled').reduce((a,o)=>a+o.total,0);

  return (
    <AppShell breadcrumb={['Accounts', acct.name]}>
      {/* Hero header */}
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24, marginBottom:24}}>
        <div style={{display:'flex', gap:16, alignItems:'flex-start'}}>
          <div style={{width:64, height:64, borderRadius:14, background:T.surface,
                       display:'flex', alignItems:'center', justifyContent:'center',
                       fontFamily:T.display, fontSize:28, fontWeight:600, color:T.muted,
                       border:`1px solid ${T.border}`}}>
            {acct.name.charAt(0)}
          </div>
          <div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:4}}>
              <h1 style={{fontFamily:T.display, fontSize:28, fontWeight:600, letterSpacing:'-.02em', margin:0}}>{acct.name}</h1>
              <Badge status={acct.status}/>
              <Badge status={acct.tier==='flagship'?'active':acct.tier==='key'?'approved':'confirmed'} label={acct.tier} custom={tierC[acct.tier]}/>
            </div>
            <div style={{fontSize:14, color:T.muted}}>{acct.type} · {acct.city}, {acct.country} · Rep: {acct.rep}</div>
          </div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <Btn v="outline" icon={IC.note}>Log visit</Btn>
          <Btn v="accent" icon={IC.cart} onClick={()=>navigate(`/${role}/orders`)}>New order</Btn>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="Total revenue" value={`$${rev.toLocaleString()}`} sub="all time" icon={IC.receipt} tone="gold"/>
        <StatCard label="30d revenue" value={`$${acct.rev30.toLocaleString()}`} sub="vs prev period" icon={IC.trendU} tone="stone" trend={8}/>
        <StatCard label="Active listings" value={acct.listings} sub="SKUs on menu" icon={IC.box} tone="stone"/>
        <StatCard label="Orders placed" value={acctOrders.length} sub="all time" icon={IC.cart} tone="stone"/>
      </div>

      <Tabs tabs={[{id:'overview',label:'Overview'},{id:'orders',label:`Orders · ${acctOrders.length}`},{id:'visits',label:`Visits · ${acctVisits.length}`},{id:'listings',label:'Listings'},{id:'notes',label:'Notes'}]}
        active={tab} onChange={setTab}/>

      <div style={{marginTop:16}}>
        {tab === 'overview' && (
          <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18}}>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <Card>
                <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:14}}>Account details</div>
                {[
                  ['Trading name', acct.name],
                  ['Type', acct.type],
                  ['City', acct.city],
                  ['Country', acct.country],
                  ['Status', acct.status],
                  ['Tier', acct.tier],
                  ['Assigned rep', acct.rep],
                  ['Last order', acct.lastOrder || '—'],
                ].map(([l,v]) => (
                  <div key={l} style={{display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:`1px solid ${T.borderQ}`, fontSize:13}}>
                    <span style={{color:T.muted}}>{l}</span>
                    <span style={{fontWeight:500, textTransform:'capitalize'}}>{v}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:14}}>Recent activity</div>
                {acctOrders.slice(0,3).map(o => (
                  <div key={o.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${T.borderQ}`}}>
                    <div>
                      <div style={{fontFamily:T.mono, fontSize:11, color:T.muted}}>{o.id}</div>
                      <div style={{fontSize:13, fontWeight:500}}>${o.total.toLocaleString()}</div>
                      <div style={{fontSize:12, color:T.muted}}>{o.orderDate}</div>
                    </div>
                    <Badge status={o.status}/>
                  </div>
                ))}
                {acctOrders.length === 0 && <div style={{fontSize:13, color:T.muted}}>No orders yet.</div>}
              </Card>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <Card>
                <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:14}}>Revenue trend</div>
                <SparkBar data={[280,310,420,380,510,490,620,580,710,750,820,acct.rev30]} color={T.gold} height={80}/>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:9, fontFamily:T.mono, color:T.muted, marginTop:6}}>
                  {['M','J','J','A','S','O','N','D','J','F','M','A'].map((m,i)=><span key={i}>{m}</span>)}
                </div>
              </Card>
              <Card>
                <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:12}}>Current listings</div>
                {PRODUCTS_DATA.slice(0, acct.listings || 2).map(p => (
                  <div key={p.id} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:`1px solid ${T.borderQ}`}}>
                    <div style={{width:28, height:28, borderRadius:6, background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', color:T.muted}}>
                      <Ico d={IC.box} size={14}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13, fontWeight:500}}>{p.name}</div>
                      <div style={{fontSize:11, color:T.muted, fontFamily:T.mono}}>{p.id}</div>
                    </div>
                    <Badge status="active" label="listed"/>
                  </div>
                ))}
              </Card>
              {acctVisits.length > 0 && (
                <Card>
                  <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:12}}>Latest visit</div>
                  <div style={{fontSize:13, color:T.ink, lineHeight:1.6}}>{acctVisits[0].summary}</div>
                  <div style={{fontSize:11, color:T.muted, fontFamily:T.mono, marginTop:8}}>{acctVisits[0].date}</div>
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <Card padded={false}>
            <Table
              cols={[
                {key:'id', label:'Order', mono:true, bold:true, render:r=><span style={{color:T.gold, fontFamily:T.mono, fontSize:12}}>{r.id}</span>},
                {key:'orderDate', label:'Date', mono:true},
                {key:'requestedDelivery', label:'Requested', mono:true},
                {key:'total', label:'Total', right:true, mono:true, render:r=>`$${r.total.toLocaleString()}`},
                {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
              ]}
              rows={acctOrders}
              emptyMsg="No orders for this account."
              onRow={r=>navigate(`/${role}/orders/${r.id}`)}
            />
          </Card>
        )}

        {tab === 'visits' && (
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {acctVisits.length === 0
              ? <Card><EmptyState icon={IC.note} title="No visits logged" sub="Log a visit note after your next call."/></Card>
              : acctVisits.map(v => (
                <Card key={v.id}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, marginBottom:8}}>
                    <div style={{fontSize:13, fontFamily:T.mono, color:T.muted}}>{v.date}</div>
                    <Badge status={v.sentiment==='positive'?'active':v.sentiment==='needs-follow-up'?'pending':'confirmed'} label={v.sentiment.replace(/-/g,' ')}/>
                  </div>
                  <div style={{fontSize:14, lineHeight:1.6, color:T.ink}}>{v.summary}</div>
                  {v.draftId && <div style={{marginTop:8}}><Badge status="pending" label={`Draft: ${v.draftId}`} size="xs"/></div>}
                </Card>
              ))
            }
          </div>
        )}

        {tab === 'listings' && (
          <Card padded={false}>
            <Table
              cols={[
                {key:'id', label:'SKU', mono:true, bold:true},
                {key:'name', label:'Product'},
                {key:'type', label:'Category'},
                {key:'size', label:'Size'},
                {key:'price', label:'Wholesale', right:true, mono:true, render:r=>`$${r.price}`},
                {key:'msrp', label:'MSRP', right:true, mono:true, render:r=>`$${r.msrp}`},
                {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
              ]}
              rows={PRODUCTS_DATA.slice(0, acct.listings || 2)}
              emptyMsg="No listings."
            />
          </Card>
        )}

        {tab === 'notes' && (
          <Card>
            <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:16}}>Internal notes</div>
            <Textarea rows={6} placeholder={`Internal notes for ${acct.name} — not visible to the account.`}/>
            <div style={{display:'flex', justifyContent:'flex-end', marginTop:12}}>
              <Btn v="accent">Save notes</Btn>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

// ─── Multi-step New Order Form ────────────────────────────────
function NewOrderFlow() {
  const { accounts, createOrder } = useStore();
  const { navigate, role } = useStore ? useRouter() : { navigate:()=>{}, role:'hq' };
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    account:'', accountName:'', market:'New York', rep:'MT',
    lines:[{sku:'HJM-FP-750', qty:12, price:48}],
    requestedDelivery:'', notes:'',
  });
  const [errors, setErrors] = React.useState({});

  const set = (k, v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:null})); };

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
    if (step===0 && !validate0()) return;
    if (step===1 && !validate1()) return;
    if (step===2 && !validate2()) return;
    if (step === 3) { submitOrder(); return; }
    setStep(s=>s+1);
  };

  const submitOrder = () => {
    const total = form.lines.reduce((a,l)=>a+l.qty*l.price,0);
    createOrder({...form, total});
    navigate(`/${role}/orders`);
  };

  const steps = ['Account', 'Products', 'Delivery', 'Review'];

  const StepDot = ({i}) => (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
      <div style={{width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                   background:step===i?T.gold:step>i?T.green:T.surface,
                   color:step>=i?'white':T.muted, fontWeight:600, fontSize:12}}>
        {step>i ? <Ico d={IC.check} size={13} stroke={2.5}/> : i+1}
      </div>
      <span style={{fontSize:11, color:step===i?T.ink:T.muted, fontWeight:step===i?600:400}}>{steps[i]}</span>
    </div>
  );

  return (
    <AppShell breadcrumb={['Orders', 'New order']}>
      <PageHead title="New wholesale order" sub="Place an order on behalf of an account against distributor stock."/>

      {/* Step indicator */}
      <div style={{display:'flex', alignItems:'center', gap:0, marginBottom:32, maxWidth:480}}>
        {steps.map((s,i) => (
          <React.Fragment key={s}>
            <StepDot i={i}/>
            {i < steps.length-1 && <div style={{flex:1, height:2, background:step>i?T.green:T.border, marginBottom:18, marginTop:1}}/>}
          </React.Fragment>
        ))}
      </div>

      <div style={{maxWidth:680}}>
        {/* Step 0 — Account */}
        {step === 0 && (
          <Card>
            <div style={{fontFamily:T.display, fontSize:20, fontWeight:500, marginBottom:20}}>Which account is this for?</div>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <Field label="Account" hint={errors.account} style={{borderBottom:errors.account?`1px solid ${T.red}`:undefined}}>
                <Select value={form.account} onChange={e=>{
                  const a = accounts.find(x=>x.id===e.target.value);
                  set('account',e.target.value); set('accountName',a?.name||''); set('market',a?.city?.includes('Toronto')?'Toronto':a?.city?.includes('Paris')?'Paris':'New York');
                }} options={[{value:'',label:'Select account…'},...accounts.map(a=>({value:a.id,label:`${a.name} · ${a.city}`}))]}/>
                {errors.account && <div style={{fontSize:11,color:T.red,marginTop:4}}>{errors.account}</div>}
              </Field>
              <Field label="Market" hint={errors.market}>
                <Select value={form.market} onChange={e=>set('market',e.target.value)}
                  options={['New York','Toronto','Paris','Milan','Tokyo','Singapore','Hong Kong']}/>
                {errors.market && <div style={{fontSize:11,color:T.red,marginTop:4}}>{errors.market}</div>}
              </Field>
              {form.account && (
                <div style={{padding:14, background:'hsl(40 88%42%/.06)', border:`1px solid hsl(40 88%42%/.2)`, borderRadius:10}}>
                  <div style={{fontSize:12, fontWeight:600, color:T.gold, marginBottom:6}}>Account snapshot</div>
                  {(() => { const a = accounts.find(x=>x.id===form.account); return a ? (
                    <div style={{fontSize:13, color:T.ink, lineHeight:1.7}}>
                      {a.type} · {a.city} · <Badge status={a.status}/> · {a.rev30?`$${a.rev30.toLocaleString()} 30d revenue`:'No recent orders'}
                    </div>
                  ) : null; })()}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Step 1 — Products */}
        {step === 1 && (
          <Card>
            <div style={{fontFamily:T.display, fontSize:20, fontWeight:500, marginBottom:20}}>What are you ordering?</div>
            {errors.lines && <div style={{fontSize:12,color:T.red,marginBottom:12,padding:'8px 12px',background:'hsl(0 68%48%/.06)',borderRadius:8}}>{errors.lines}</div>}
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {form.lines.map((l,i) => {
                const prod = PRODUCTS_DATA.find(p=>p.id===l.sku);
                const lineTotal = l.qty * l.price;
                return (
                  <div key={i} style={{padding:14, background:T.surface, borderRadius:10, border:`1px solid ${errors[`line_qty_${i}`]?T.red:T.borderQ}`}}>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 100px 100px 32px', gap:10, alignItems:'flex-end'}}>
                      <Field label="Product">
                        <Select value={l.sku} onChange={e=>{
                          const p=PRODUCTS_DATA.find(x=>x.id===e.target.value);
                          setForm(f=>({...f,lines:f.lines.map((x,j)=>j===i?{...x,sku:e.target.value,price:p?.price||x.price}:x)}));
                        }} options={PRODUCTS_DATA.map(p=>({value:p.id,label:p.name}))}/>
                      </Field>
                      <Field label="Qty (bottles)">
                        <Input value={l.qty} type="number" mono onChange={e=>setForm(f=>({...f,lines:f.lines.map((x,j)=>j===i?{...x,qty:+e.target.value}:x)}))}/>
                        {errors[`line_qty_${i}`] && <div style={{fontSize:10,color:T.red,marginTop:2}}>{errors[`line_qty_${i}`]}</div>}
                      </Field>
                      <Field label="Unit price">
                        <Input value={l.price} type="number" mono onChange={e=>setForm(f=>({...f,lines:f.lines.map((x,j)=>j===i?{...x,price:+e.target.value}:x)}))}/>
                      </Field>
                      <Btn v="ghost" sz="sm" onClick={()=>setForm(f=>({...f,lines:f.lines.filter((_,j)=>j!==i)}))} style={{marginBottom:2}}>
                        <Ico d={IC.x} size={14}/>
                      </Btn>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12, color:T.muted}}>
                      <span>{prod?.type} · {prod?.size} · case of {prod?.cs}</span>
                      <span style={{fontFamily:T.mono, fontWeight:600, color:T.ink}}>${lineTotal.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14}}>
              <Btn v="soft" sz="sm" icon={IC.plus} onClick={()=>setForm(f=>({...f,lines:[...f.lines,{sku:'HJM-FP-750',qty:12,price:48}]}))}>Add line</Btn>
              <div style={{fontFamily:T.mono, fontSize:15, fontWeight:700}}>
                Total: ${form.lines.reduce((a,l)=>a+l.qty*l.price,0).toLocaleString()}
              </div>
            </div>
          </Card>
        )}

        {/* Step 2 — Delivery */}
        {step === 2 && (
          <Card>
            <div style={{fontFamily:T.display, fontSize:20, fontWeight:500, marginBottom:20}}>When and how should this deliver?</div>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <Field label="Requested delivery date">
                <Input type="date" value={form.requestedDelivery} onChange={e=>set('requestedDelivery',e.target.value)} mono/>
                {errors.requestedDelivery && <div style={{fontSize:11,color:T.red,marginTop:4}}>{errors.requestedDelivery}</div>}
              </Field>
              <Field label="Fulfilment source">
                <Select value="Empire Wines, Brooklyn" onChange={()=>{}} options={['Empire Wines, Brooklyn','Vinexpo Paris','Tokyo HQ']}/>
              </Field>
              <Field label="Internal notes (optional)">
                <Textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Special instructions, partial allocation notes, etc." rows={3}/>
              </Field>
              <div style={{padding:14, background:T.surface, borderRadius:10, fontSize:13, color:T.muted, lineHeight:1.6}}>
                <strong style={{color:T.ink}}>Stock check</strong> · Empire Wines has 142 cases of FP-750 available. Your order will draw cleanly against current stock.
              </div>
            </div>
          </Card>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            <Card>
              <div style={{fontFamily:T.display, fontSize:20, fontWeight:500, marginBottom:16}}>Review before sending</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
                <div>
                  <Eyebrow style={{marginBottom:8}}>Account</Eyebrow>
                  <div style={{fontSize:15, fontWeight:500}}>{form.accountName}</div>
                  <div style={{fontSize:13, color:T.muted}}>{form.market}</div>
                </div>
                <div>
                  <Eyebrow style={{marginBottom:8}}>Delivery</Eyebrow>
                  <div style={{fontSize:15, fontWeight:500}}>{form.requestedDelivery || '—'}</div>
                  <div style={{fontSize:13, color:T.muted}}>Empire Wines, Brooklyn</div>
                </div>
              </div>
              <div style={{marginTop:20, paddingTop:16, borderTop:`1px solid ${T.borderQ}`}}>
                <Eyebrow style={{marginBottom:12}}>Order lines</Eyebrow>
                {form.lines.map((l,i)=>{
                  const p = PRODUCTS_DATA.find(x=>x.id===l.sku);
                  return (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:14, padding:'8px 0', borderBottom:`1px solid ${T.borderQ}`}}>
                      <span>{p?.name||l.sku} · {l.qty} bottles</span>
                      <span style={{fontFamily:T.mono, fontWeight:600}}>${(l.qty*l.price).toLocaleString()}</span>
                    </div>
                  );
                })}
                <div style={{display:'flex', justifyContent:'space-between', padding:'12px 0', fontSize:16, fontWeight:700}}>
                  <span>Total</span>
                  <span style={{fontFamily:T.mono}}>${form.lines.reduce((a,l)=>a+l.qty*l.price,0).toLocaleString()}</span>
                </div>
              </div>
            </Card>
            <div style={{padding:14, background:'hsl(40 88%42%/.06)', border:`1px solid hsl(40 88%42%/.2)`, borderRadius:10, fontSize:13, lineHeight:1.55}}>
              This will create a draft order and route it to the HQ approval queue. The account will not be notified until approval.
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div style={{display:'flex', justifyContent:'space-between', marginTop:20}}>
          <Btn v="outline" onClick={()=>step>0?setStep(s=>s-1):navigate(`/${role}/orders`)} icon={IC.chevL}>
            {step===0 ? 'Cancel' : 'Back'}
          </Btn>
          <Btn v={step===3?'accent':'primary'} onClick={next} iconR={step<3?IC.chevR:IC.check}>
            {step===3 ? 'Submit draft' : 'Continue'}
          </Btn>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Inventory Item Detail ────────────────────────────────────
function InventoryDetail() {
  const { parts, navigate } = useRouter();
  const { inventory } = useStore();
  const invId = parts[2];
  const item = inventory.find(i=>i.id===invId) || inventory[0];
  const prod = PRODUCTS_DATA.find(p=>p.id===item?.sku);
  if (!item) return <AppShell><EmptyState title="Inventory item not found"/></AppShell>;

  const movements = [
    {type:'out', desc:`Fulfillment · Dante`, qty:216, date:'2026-04-27'},
    {type:'out', desc:`Fulfillment · Katana Kitten`, qty:72, date:'2026-04-27'},
    {type:'adj', desc:`Sample · staff tasting`, qty:24, date:'2026-04-27'},
    {type:'in',  desc:`Received from PO-2026-0415`, qty:2880, date:'2026-04-27'},
    {type:'out', desc:`Fulfillment · Mace`, qty:48, date:'2026-04-26'},
  ];

  return (
    <AppShell breadcrumb={['Inventory', item.sku]}>
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24, marginBottom:24}}>
        <div>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
            <span style={{fontFamily:T.mono, fontSize:13, color:T.muted}}>{item.id}</span>
            <Badge status={item.status}/>
          </div>
          <h1 style={{fontFamily:T.display, fontSize:28, fontWeight:600, letterSpacing:'-.02em', margin:0}}>{prod?.name || item.sku}</h1>
          <div style={{fontSize:14, color:T.muted, marginTop:4}}>{item.location} · {item.locType} · Batch {item.batchId}</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <Btn v="outline" icon={IC.plus}>Receive stock</Btn>
          <Btn v="primary" icon={IC.tag}>Adjust inventory</Btn>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="Bottles on hand" value={item.bottles.toLocaleString()} icon={IC.box} tone="stone"/>
        <StatCard label="Reserved" value={item.reserved.toLocaleString()} icon={IC.tag} tone="warm"/>
        <StatCard label="Available" value={(item.bottles-item.reserved).toLocaleString()} icon={IC.check} tone="green"/>
        <StatCard label="Cases" value={Math.floor(item.bottles/(prod?.cs||12))} sub={`of ${prod?.cs||12} bottles`} icon={IC.box} tone="stone"/>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18}}>
        <Card padded={false} style={{overflow:'hidden'}}>
          <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderQ}`}}>
            <div style={{fontFamily:T.display, fontSize:17, fontWeight:500}}>Movement history</div>
            <div style={{fontSize:12, color:T.muted, marginTop:2}}>Last 30 days</div>
          </div>
          {movements.map((m,i) => {
            const c = m.type==='in'?T.green:m.type==='out'?T.ink:T.amber;
            return (
              <div key={i} style={{display:'grid', gridTemplateColumns:'60px auto 1fr auto', gap:12, padding:'12px 18px', borderBottom:`1px solid ${T.borderQ}`, alignItems:'center'}}>
                <span style={{fontFamily:T.mono, fontSize:11, color:T.muted}}>{m.date.slice(5)}</span>
                <span style={{fontSize:9, fontFamily:T.mono, fontWeight:600, padding:'2px 6px', borderRadius:4,
                  background:m.type==='in'?'hsl(158 56%36%/.1)':m.type==='out'?'hsl(24 10%10%/.08)':'hsl(38 90%50%/.12)',
                  color:c, letterSpacing:'.04em'}}>{m.type.toUpperCase()}</span>
                <span style={{fontSize:13, color:T.ink}}>{m.desc}</span>
                <span style={{fontFamily:T.display, fontSize:18, fontWeight:600, color:c}}>
                  {m.type==='in'?'+':'-'}{m.qty}
                </span>
              </div>
            );
          })}
        </Card>
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <Card>
            <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:14}}>Batch details</div>
            {[['Batch ID',item.batchId],['Lot number',item.lotNo],['SKU',item.sku],['Location',item.location],['Type',item.locType]].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
                <span style={{color:T.muted}}>{l}</span><span style={{fontFamily:T.mono,fontSize:12,fontWeight:500}}>{v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:12}}>Stock health</div>
            <div style={{marginBottom:10}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4}}>
                <span style={{color:T.muted}}>vs safety stock</span>
                <span style={{fontFamily:T.mono, fontWeight:600}}>{prod?.safetyStock||0} btl min</span>
              </div>
              <div style={{height:8, borderRadius:999, background:T.surface, overflow:'hidden'}}>
                <div style={{width:`${Math.min((item.bottles/(prod?.safetyStock||1))*100, 100)}%`, height:'100%',
                  background:item.bottles<(prod?.safetyStock||0)?T.red:item.bottles<(prod?.safetyStock||0)*1.5?T.amber:T.green}}/>
              </div>
            </div>
            <div style={{fontSize:12, color:T.muted}}>
              {item.bottles >= (prod?.safetyStock||0)*1.5 ? 'Well above safety stock · no action needed' :
               item.bottles >= (prod?.safetyStock||0) ? 'Above safety stock · watch velocity' :
               'Below safety stock · replenishment needed'}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

// ─── PO Detail ────────────────────────────────────────────────
function PODetail() {
  const { parts } = useRouter();
  const { pos, approvePO } = useStore();
  const poId = parts[2];
  const po = pos.find(p=>p.id===poId) || pos[0];
  const prod = PRODUCTS_DATA.find(p=>p.id===po?.sku);
  if (!po) return <AppShell><EmptyState title="PO not found"/></AppShell>;

  const timeline = [
    {s:'Requested', t:po.requested, done:true},
    {s:'Approved by HQ', t:po.status!=='pending'?po.requested:'—', done:po.status!=='pending'},
    {s:'Acknowledged by manufacturer', t:po.status==='in-production'||po.status==='shipped'||po.status==='delivered'?po.requested:'—', done:['in-production','shipped','delivered'].includes(po.status)},
    {s:'In production', t:po.status==='in-production'?'In progress':po.status==='shipped'||po.status==='delivered'?po.shipDate:'—', done:['shipped','delivered'].includes(po.status), current:po.status==='in-production'},
    {s:'Shipped', t:po.shipDate||'—', done:po.status==='delivered', current:po.status==='shipped'},
    {s:'Delivered', t:po.status==='delivered'?po.shipDate:'—', done:po.status==='delivered'},
  ];

  return (
    <AppShell breadcrumb={['Production requests', po.id]}>
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24, marginBottom:24}}>
        <div>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
            <span style={{fontFamily:T.mono, fontSize:13, color:T.muted}}>{po.id}</span>
            <Badge status={po.status}/>
          </div>
          <h1 style={{fontFamily:T.display, fontSize:28, fontWeight:600, letterSpacing:'-.02em', margin:0}}>
            {prod?.name || po.sku}
          </h1>
          <div style={{fontSize:14, color:T.muted, marginTop:4}}>{po.qty.toLocaleString()} bottles · {po.region} · {po.mfr}</div>
        </div>
        {po.status==='pending' && <Btn v="accent" icon={IC.check} onClick={()=>approvePO(po.id)}>Approve PO</Btn>}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20}}>
        <StatCard label="Quantity" value={po.qty.toLocaleString()} sub="bottles" icon={IC.box} tone="stone"/>
        <StatCard label="Cases" value={Math.floor(po.qty/(prod?.cs||12))} sub={`of ${prod?.cs||12} btl`} icon={IC.box} tone="stone"/>
        <StatCard label="Est. value" value={`$${(po.qty*(prod?.price||0)).toLocaleString()}`} sub="at wholesale" icon={IC.receipt} tone="gold"/>
        <StatCard label="Lead time" value={`${po.days}d`} sub="standard" icon={IC.clock||IC.more} tone="stone"/>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18}}>
        <Card>
          <div style={{fontFamily:T.display, fontSize:17, fontWeight:500, marginBottom:20}}>Production timeline</div>
          {timeline.map((t,i) => (
            <div key={t.s} style={{display:'grid', gridTemplateColumns:'28px 1fr auto', gap:14, marginBottom: i<timeline.length-1?24:0, alignItems:'flex-start', position:'relative'}}>
              {i < timeline.length-1 && (
                <div style={{position:'absolute', left:13, top:28, bottom:-24, width:2, background:t.done?T.green:T.border}}/>
              )}
              <div style={{width:28, height:28, borderRadius:'50%', background:t.done?T.green:t.current?T.gold:T.surface,
                           color:t.done||t.current?'white':T.muted, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1}}>
                {t.done ? <Ico d={IC.check} size={13} stroke={2.5}/> : t.current ? <div style={{width:8,height:8,borderRadius:999,background:'white'}}/> : i+1}
              </div>
              <div>
                <div style={{fontSize:13, fontWeight:t.done||t.current?600:400, color:t.done||t.current?T.ink:T.muted}}>{t.s}</div>
                <div style={{fontSize:11, color:T.muted, fontFamily:T.mono, marginTop:2}}>{t.t}</div>
              </div>
              {t.current && <Badge status="pending" label="in progress"/>}
              {t.done && <Ico d={IC.check} size={14} style={{color:T.green, marginTop:4}}/>}
            </div>
          ))}
        </Card>
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <Card>
            <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:14}}>Order details</div>
            {[['PO ID',po.id],['SKU',po.sku],['Manufacturer',po.mfr],['Destination',po.region],['Requested',po.requested],['Target ship',po.shipDate||'—'],['Status',po.status]].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
                <span style={{color:T.muted}}>{l}</span>
                <span style={{fontFamily:['PO ID','SKU'].includes(l)?T.mono:T.body,fontSize:12,fontWeight:500}}>{v}</span>
              </div>
            ))}
          </Card>
          {po.status==='in-production' && po.progress && (
            <Card>
              <div style={{fontFamily:T.display, fontSize:16, fontWeight:500, marginBottom:12}}>Production progress</div>
              <div style={{height:8, borderRadius:999, background:T.surface, overflow:'hidden', marginBottom:8}}>
                <div style={{width:`${po.progress}%`, height:'100%', background:T.gold, transition:'width .5s'}}/>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:T.muted}}>
                <span>{po.progress}% complete</span>
                <span style={{fontFamily:T.mono}}>{Math.round(po.qty*po.progress/100).toLocaleString()} / {po.qty.toLocaleString()} btl</span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ─── Settings: RBAC Editor ────────────────────────────────────
function SettingsRBAC() {
  const [activeTab, setActiveTab] = React.useState('team');
  const [showInvite, setShowInvite] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('sales_rep');
  const [inviteErr, setInviteErr] = React.useState('');

  const validateInvite = () => {
    if (!inviteEmail.includes('@')) { setInviteErr('Enter a valid email'); return false; }
    setInviteErr('');
    return true;
  };

  const TEAM = [
    {id:'u1', name:'Sora Okuda',    email:'sora@hajime.jp',  role:'brand_operator', markets:['All'], lastLogin:'2026-04-27', status:'active'},
    {id:'u2', name:'Yui Imanishi',  email:'yui@yamato.jp',   role:'manufacturer',   markets:['—'], lastLogin:'2026-04-26', status:'active'},
    {id:'u3', name:'Léa Bardot',    email:'lea@vinexpo.fr',  role:'distributor',    markets:['Paris'], lastLogin:'2026-04-27', status:'active'},
    {id:'u4', name:'Mike Tan',      email:'mike@hajime.jp',  role:'sales_rep',      markets:['New York'], lastLogin:'2026-04-27', status:'active'},
    {id:'u5', name:'Kazu Saito',    email:'kazu@mace.bar',   role:'retail',         markets:['New York'], lastLogin:'2026-04-25', status:'active'},
    {id:'u6', name:'Elena Murphy',  email:'elena@hajime.jp', role:'sales_rep',      markets:['Toronto'], lastLogin:'2026-04-20', status:'active'},
  ];

  const PERMS = {
    brand_operator: ['dashboard','inventory','orders','accounts','purchase-orders','shipments','markets','reports','alerts','finance','settings'],
    manufacturer:   ['production','po-in','ship-out','specs'],
    distributor:    ['floor','inbound','inventory','depletion','sell-through','alerts'],
    sales_rep:      ['dashboard','accounts','inventory-check','drafts','visits','targets'],
    retail:         ['home','catalog','orders','shipments','account'],
  };

  return (
    <AppShell breadcrumb={['Settings']}>
      <PageHead title="Settings" sub="Team management, roles, and module access."
        actions={<Btn v="accent" icon={IC.plus} onClick={()=>setShowInvite(true)}>Invite user</Btn>}/>

      <Tabs tabs={[{id:'team',label:'Team'},{id:'rbac',label:'Roles & permissions'},{id:'products',label:'Products'},{id:'warehouses',label:'Warehouses'},{id:'system',label:'System'}]}
        active={activeTab} onChange={setActiveTab}/>

      <div style={{marginTop:16}}>
        {activeTab === 'team' && (
          <Card padded={false}>
            <Table
              cols={[
                {key:'name', label:'Name', bold:true, render:r=>(
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:T.surface,color:T.muted,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:12}}>{r.name.split(' ').map(n=>n[0]).join('')}</div>
                    <div><div style={{fontWeight:500}}>{r.name}</div><div style={{fontSize:11,color:T.muted,fontFamily:T.mono}}>{r.email}</div></div>
                  </div>
                )},
                {key:'role', label:'Role', render:r=><Badge status="confirmed" label={r.role.replace(/_/g,' ')}/>},
                {key:'markets', label:'Markets', render:r=><span style={{fontSize:13}}>{r.markets.join(', ')}</span>},
                {key:'lastLogin', label:'Last login', mono:true},
                {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
                {key:'_act', label:'', sortable:false, render:r=>(
                  <div style={{display:'flex',gap:4}}>
                    <Btn v="ghost" sz="xs">Edit</Btn>
                    <Btn v="ghost" sz="xs">Revoke</Btn>
                  </div>
                )},
              ]}
              rows={TEAM}
              emptyMsg="No team members."
            />
          </Card>
        )}

        {activeTab === 'rbac' && (
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            {Object.entries(PERMS).map(([role, perms]) => (
              <Card key={role}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:14}}>
                  <div style={{fontFamily:T.display, fontSize:17, fontWeight:500, textTransform:'capitalize'}}>{role.replace(/_/g,' ')}</div>
                  <Badge status="confirmed" label={`${perms.length} modules`}/>
                </div>
                <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                  {perms.map(p => (
                    <div key={p} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',background:T.surface,borderRadius:6,fontSize:12,fontWeight:500}}>
                      <div style={{width:6,height:6,borderRadius:999,background:T.green}}/>
                      {p}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'products' && (
          <Card padded={false}>
            <Table
              cols={[
                {key:'id', label:'SKU', mono:true, bold:true},
                {key:'name', label:'Product'},
                {key:'type', label:'Category'},
                {key:'size', label:'Size'},
                {key:'cs', label:'Case', right:true, mono:true},
                {key:'price', label:'Wholesale', right:true, mono:true, render:r=>`$${r.price}`},
                {key:'msrp', label:'MSRP', right:true, mono:true, render:r=>`$${r.msrp}`},
                {key:'safetyStock', label:'Safety stock', right:true, mono:true, render:r=>r.safetyStock.toLocaleString()},
                {key:'status', label:'Status', render:r=><Badge status={r.status}/>},
                {key:'_act', label:'', sortable:false, render:()=><Btn v="ghost" sz="xs">Edit</Btn>},
              ]}
              rows={PRODUCTS_DATA}
            />
          </Card>
        )}

        {(activeTab==='warehouses'||activeTab==='system') && (
          <EmptyState icon={IC.settings} title={`${activeTab.charAt(0).toUpperCase()+activeTab.slice(1)}`} sub="Configuration coming in next release."/>
        )}
      </div>

      {/* Invite modal with validation */}
      <Modal open={showInvite} onClose={()=>{setShowInvite(false);setInviteErr('');}} title="Invite team member" width={480}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Field label="Email address">
            <Input value={inviteEmail} onChange={e=>{setInviteEmail(e.target.value);setInviteErr('');}} type="email" placeholder="name@company.com" style={{borderColor:inviteErr?T.red:undefined}}/>
            {inviteErr && <div style={{fontSize:11,color:T.red,marginTop:4}}>{inviteErr}</div>}
          </Field>
          <Field label="Role">
            <Select value={inviteRole} onChange={e=>setInviteRole(e.target.value)}
              options={['brand_operator','manufacturer','distributor','sales_rep','retail'].map(r=>({value:r,label:r.replace(/_/g,' ')}))}/>
          </Field>
          <div style={{padding:12,background:T.surface,borderRadius:8,fontSize:12,color:T.muted,lineHeight:1.5}}>
            They'll receive an email with a one-time login link. Password must be set on first login.
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <Btn v="outline" onClick={()=>setShowInvite(false)}>Cancel</Btn>
            <Btn v="accent" onClick={()=>{if(validateInvite()){setShowInvite(false);setInviteEmail('');}}}>Send invite</Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

function Eyebrow({children, style={}}) {
  return <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500, color:T.muted, fontFamily:T.body, ...style}}>{children}</div>;
}

Object.assign(window, { AccountDetail, NewOrderFlow, InventoryDetail, PODetail, SettingsRBAC, Eyebrow });
