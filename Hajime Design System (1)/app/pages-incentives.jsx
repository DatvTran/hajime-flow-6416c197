// app/pages-incentives.jsx
// Comprehensive incentive system linking HQ ↔ Distributor ↔ Sales Rep ↔ Retail
// Each role sees its own portal view; HQ sees everything and manages all programs.

// ─── Shared incentive data ────────────────────────────────────
const INC_PROGRAMS = [
  // ── Distributor programs ──
  { id:'INC-D01', name:'Volume purchase bonus',    role:'dist', type:'Volume',    rateType:'$',
    rate:500, trigger:'Per every 200 cases purchased in a calendar month',
    period:'monthly', active:true, budget:12000, spent:3500, claims:7,
    tiers:[{t:100,r:200},{t:200,r:500},{t:400,r:1200},{t:600,r:2000}],
    conditions:'Applies to all Hajime SKUs. Stacks across SKUs.' },
  { id:'INC-D02', name:'Depletion accuracy bonus', role:'dist', type:'Reporting',  rateType:'$',
    rate:250, trigger:'Monthly depletion data filed on time with <5% variance',
    period:'monthly', active:true, budget:6000, spent:1500, claims:6,
    tiers:[], conditions:'Submitted by last business day of month. Auto-verified against shipment data.' },
  { id:'INC-D03', name:'Fast-pay discount',         role:'dist', type:'Finance',    rateType:'%',
    rate:2, trigger:'Invoice paid within 10 days of receipt (vs Net 30)',
    period:'per-invoice', active:true, budget:0, spent:0, claims:4,
    tiers:[], conditions:'Applied as credit on next invoice. Non-stackable.' },
  { id:'INC-D04', name:'New retail door bonus',     role:'dist', type:'Expansion',  rateType:'$',
    rate:300, trigger:'Each new retail account opened and first order fulfilled',
    period:'per-event', active:true, budget:9000, spent:900, claims:3,
    tiers:[], conditions:'Account must place second order within 60 days to confirm bonus.' },

  // ── Sales Rep programs ──
  { id:'INC-R01', name:'SPIF — On-premise',         role:'rep',  type:'SPIF',       rateType:'$',
    rate:150, trigger:'New menu/backbar placement at restaurant, bar or hotel',
    period:'per-event', active:true, budget:15000, spent:2100, claims:14,
    tiers:[], conditions:'One claim per SKU per account per quarter. Photo evidence required.' },
  { id:'INC-R02', name:'SPIF — Off-premise',         role:'rep',  type:'SPIF',       rateType:'$',
    rate:100, trigger:'New shelf/featured placement at retail or specialty',
    period:'per-event', active:true, budget:8000, spent:800, claims:8,
    tiers:[], conditions:'One claim per account per quarter.' },
  { id:'INC-R03', name:'Monthly target attainment',  role:'rep',  type:'Attainment', rateType:'%',
    rate:5, trigger:'5% of revenue above monthly target when target is hit',
    period:'monthly', active:true, budget:20000, spent:740, claims:2,
    tiers:[{t:100,r:'5% of excess'},{t:110,r:'8% of excess'},{t:125,r:'12% of excess'}],
    conditions:'Calculated on net shipped revenue. Paid 30 days after month close.' },
  { id:'INC-R04', name:'New account bonus',           role:'rep',  type:'Expansion',  rateType:'$',
    rate:400, trigger:'New account opened, first order placed and fulfilled',
    period:'per-event', active:true, budget:12000, spent:1200, claims:3,
    tiers:[], conditions:'Account must not have ordered Hajime in the prior 12 months.' },
  { id:'INC-R05', name:'Reorder incentive',           role:'rep',  type:'Reorder',    rateType:'$',
    rate:5, trigger:'Per reorder placed within 30 days of prior delivery',
    period:'per-event', active:true, budget:3000, spent:210, claims:42,
    tiers:[], conditions:'Minimum 6 cases per reorder. Rep must be listed on the account.' },
  { id:'INC-R06', name:'Tasting event bonus',         role:'rep',  type:'Event',      rateType:'$',
    rate:25, trigger:'Facilitated tasting event at an account (4+ guests)',
    period:'per-event', active:true, budget:5000, spent:150, claims:6,
    tiers:[], conditions:'Submit event summary within 7 days. Photo required.' },

  // ── Retail programs ──
  { id:'INC-T01', name:'Loyalty tier rewards',        role:'retail', type:'Loyalty',  rateType:'%',
    rate:0, trigger:'Spend-based tier with compounding discount',
    period:'rolling-12mo', active:true, budget:0, spent:0, claims:0,
    tiers:[{t:0,r:'Bronze · 0%'},{t:10000,r:'Silver · 3%'},{t:25000,r:'Gold · 5%'},{t:50000,r:'Platinum · 8%'}],
    conditions:'Tier calculated on net 12-month spend. Applied to all future orders.' },
  { id:'INC-T02', name:'Volume case discount',         role:'retail', type:'Volume',   rateType:'%',
    rate:3, trigger:'3% discount on orders of 10+ cases in a single order',
    period:'per-order', active:true, budget:0, spent:0, claims:28,
    tiers:[{t:10,r:'3%'},{t:25,r:'5%'},{t:50,r:'8%'}],
    conditions:'Applied at order time. Not stackable with loyalty tier on same SKU.' },
  { id:'INC-T03', name:'Featured cocktail promotion', role:'retail', type:'Menu',     rateType:'$',
    rate:200, trigger:'Feature a Hajime cocktail on menu for full quarter',
    period:'quarterly', active:true, budget:8000, spent:600, claims:3,
    tiers:[], conditions:'Submit photo of printed menu. Verified by sales rep on next visit.' },
  { id:'INC-T04', name:'Early adopter — new SKU',     role:'retail', type:'Launch',   rateType:'%',
    rate:10, trigger:'First order of any newly launched SKU within 60 days of release',
    period:'per-sku', active:true, budget:5000, spent:200, claims:4,
    tiers:[], conditions:'Limited to 2 participating SKUs per account.' },
];

const INC_CLAIMS = [
  {id:'CLM-001',pid:'INC-R01',role:'rep', by:'Mike Tan',      account:'Dante',          date:'2026-04-25',amount:150,status:'approved', evidence:'photo',notes:'FP-750 on tasting menu'},
  {id:'CLM-002',pid:'INC-R01',role:'rep', by:'Mike Tan',      account:'Katana Kitten',  date:'2026-04-25',amount:150,status:'pending',  evidence:'photo',notes:'FP-750 + Ryusui on backbar'},
  {id:'CLM-003',pid:'INC-R06',role:'rep', by:'Mike Tan',      account:'Mace',           date:'2026-04-23',amount:25, status:'approved', evidence:'note', notes:'Staff tasting, 6 attendees'},
  {id:'CLM-004',pid:'INC-R01',role:'rep', by:'Elena Murphy',  account:'The Drake Hotel',date:'2026-04-20',amount:150,status:'approved', evidence:'photo',notes:'Full backbar listing'},
  {id:'CLM-005',pid:'INC-R05',role:'rep', by:'Mike Tan',      account:'Bar Suntory',    date:'2026-04-24',amount:5,  status:'pending',  evidence:'auto', notes:'Auto-detected reorder'},
  {id:'CLM-006',pid:'INC-R02',role:'rep', by:'Elena Murphy',  account:'Liquid Gold',    date:'2026-04-18',amount:100,status:'approved', evidence:'photo',notes:'Shelf placement'},
  {id:'CLM-007',pid:'INC-D01',role:'dist',by:'Léa Bardot',   account:'Empire Wines',   date:'2026-04-30',amount:500,status:'pending',  evidence:'auto', notes:'220 cases purchased'},
  {id:'CLM-008',pid:'INC-D02',role:'dist',by:'Léa Bardot',   account:'Empire Wines',   date:'2026-04-30',amount:250,status:'pending',  evidence:'auto', notes:'April depletion filed'},
  {id:'CLM-009',pid:'INC-D04',role:'dist',by:'Léa Bardot',   account:'Sazerac SG',     date:'2026-04-22',amount:300,status:'approved', evidence:'doc',  notes:'New retail door opened'},
  {id:'CLM-010',pid:'INC-T02',role:'retail',by:'Kazu Saito', account:'Mace',           date:'2026-04-26',amount:0,  status:'approved', evidence:'auto', notes:'12-case order discount applied'},
  {id:'CLM-011',pid:'INC-T03',role:'retail',by:'Kazu Saito', account:'Mace',           date:'2026-04-01',amount:200,status:'approved', evidence:'photo',notes:'Q2 cocktail menu feature'},
  {id:'CLM-012',pid:'INC-R04',role:'rep', by:'Mike Tan',      account:'The Aviary',     date:'2026-04-15',amount:400,status:'pending',  evidence:'doc',  notes:'First Aviary order submitted'},
];

const ROLE_COLOR = { hq:T.gold, dist:'hsl(215 50%40%)', rep:'hsl(158 50%30%)', retail:'hsl(280 30%40%)' };
const ROLE_LABEL = { hq:'HQ', dist:'Distributor', rep:'Sales Rep', retail:'Retail' };
const ROLE_IC    = { hq:IC.dash, dist:IC.whouse, rep:IC.users, retail:IC.store };

// ─── Shared helpers ───────────────────────────────────────────
function RolePill({role, size='sm'}) {
  const c = ROLE_COLOR[role]||T.muted;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, borderRadius:999,
      padding: size==='xs'?'1px 7px':'2px 9px',
      fontSize: size==='xs'?10:11, fontWeight:600,
      background:`${c}18`, color:c, border:`1px solid ${c}30`, whiteSpace:'nowrap'
    }}>
      {ROLE_LABEL[role]}
    </span>
  );
}

function TierTable({tiers}) {
  if (!tiers||tiers.length===0) return null;
  return (
    <div style={{marginTop:12}}>
      <div style={{fontSize:11,fontWeight:500,color:T.muted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Tiers</div>
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        {tiers.map((tier,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 12px',background:T.surface,borderRadius:8,fontSize:13}}>
            <span style={{color:T.muted}}>{typeof tier.t==='number'?`${tier.t}+ units / $${tier.t.toLocaleString()}`:tier.t}</span>
            <span style={{fontWeight:600,color:T.ink}}>{tier.r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgramCard({prog, onSelect, compact}) {
  const rc = ROLE_COLOR[prog.role]||T.muted;
  const pct = prog.budget>0?Math.min(prog.spent/prog.budget*100,100):0;
  return (
    <div onClick={()=>onSelect&&onSelect(prog)} style={{
      background:T.card, border:`1px solid ${T.borderQ}`,
      borderLeft:`4px solid ${rc}`, borderRadius:14, padding:compact?14:18,
      boxShadow:'0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)',
      cursor:onSelect?'pointer':'default',
      transition:'box-shadow .2s'
    }}
    onMouseEnter={e=>{if(onSelect)e.currentTarget.style.boxShadow='0 2px 4px hsl(24 10%10%/.06),0 8px 24px hsl(24 10%10%/.06)'}}
    onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:compact?8:10}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
            <RolePill role={prog.role}/>
            <Badge status="confirmed" label={prog.type}/>
            {!prog.active && <Badge status="inactive"/>}
          </div>
          <div style={{fontFamily:T.display,fontSize:compact?16:18,fontWeight:600,letterSpacing:'-.01em',lineHeight:1.2}}>{prog.name}</div>
          {!compact && <div style={{fontSize:12,color:T.muted,marginTop:4,lineHeight:1.5}}>{prog.trigger}</div>}
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontFamily:T.display,fontSize:compact?20:24,fontWeight:700,color:rc,letterSpacing:'-.02em'}}>
            {prog.rateType==='$'?`$${prog.rate}`:prog.rateType==='%'?`${prog.rate}%`:'Tiered'}
          </div>
          <div style={{fontSize:10,color:T.muted,fontFamily:T.mono}}>{prog.period}</div>
        </div>
      </div>
      {prog.budget>0 && !compact && (
        <div style={{marginTop:12}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:4}}>
            <span>Budget used</span>
            <span style={{fontFamily:T.mono}}>${prog.spent.toLocaleString()} / ${prog.budget.toLocaleString()}</span>
          </div>
          <div style={{height:5,borderRadius:999,background:T.surface,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:pct>80?T.amber:rc}}/>
          </div>
        </div>
      )}
      {!compact && (
        <div style={{display:'flex',justifyContent:'space-between',marginTop:12,paddingTop:10,borderTop:`1px solid ${T.borderQ}`,fontSize:12}}>
          <span style={{color:T.muted}}>{prog.claims} claims this period</span>
          {onSelect && <span style={{color:rc,fontWeight:500}}>View details →</span>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HQ — Incentive Manager (full admin)
// ═══════════════════════════════════════════════════════════════
function IncentiveManager() {
  const [tab,        setTab]        = React.useState('overview');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [selected,   setSelected]   = React.useState(null);
  const [showCreate, setShowCreate]  = React.useState(false);
  const [newProg,    setNewProg]    = React.useState({name:'',role:'rep',type:'SPIF',rate:'',rateType:'$',trigger:'',period:'per-event',budget:''});

  const filteredProgs = roleFilter==='all' ? INC_PROGRAMS : INC_PROGRAMS.filter(p=>p.role===roleFilter);
  const filteredClaims = roleFilter==='all' ? INC_CLAIMS : INC_CLAIMS.filter(c=>c.role===roleFilter);
  const pendingClaims = INC_CLAIMS.filter(c=>c.status==='pending');

  const totalPaid    = INC_CLAIMS.filter(c=>c.status==='approved').reduce((a,c)=>a+c.amount,0);
  const totalPending = INC_CLAIMS.filter(c=>c.status==='pending').reduce((a,c)=>a+c.amount,0);
  const totalBudget  = INC_PROGRAMS.filter(p=>p.budget>0).reduce((a,p)=>a+p.budget,0);
  const totalSpent   = INC_PROGRAMS.reduce((a,p)=>a+p.spent,0);

  const byRole = ['dist','rep','retail'].map(r=>({
    role:r,
    progs:  INC_PROGRAMS.filter(p=>p.role===r).length,
    claims: INC_CLAIMS.filter(c=>c.role===r).length,
    paid:   INC_CLAIMS.filter(c=>c.role===r&&c.status==='approved').reduce((a,c)=>a+c.amount,0),
    pending:INC_CLAIMS.filter(c=>c.role===r&&c.status==='pending').length,
  }));

  const RoleTab = ({r}) => (
    <div onClick={()=>setRoleFilter(r)} style={{
      display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:10,cursor:'pointer',
      background:roleFilter===r?ROLE_COLOR[r]+'18':'transparent',
      border:`1px solid ${roleFilter===r?ROLE_COLOR[r]+'50':T.borderQ}`,
      color:roleFilter===r?ROLE_COLOR[r]:T.muted,fontWeight:roleFilter===r?600:400,fontSize:13,
      transition:'all .15s'
    }}>
      <Ico d={ROLE_IC[r]||IC.users} size={14}/>
      {ROLE_LABEL[r]}
    </div>
  );

  return (
    <AppShell breadcrumb={['Incentive manager']}>
      <PageHead
        title="Incentive manager"
        sub="Design and manage programs across all three channel partners — Distributor, Sales Rep, and Retail."
        actions={<>
          <Btn v="outline" icon={IC.dl}>Export payouts</Btn>
          <Btn v="accent" icon={IC.plus} onClick={()=>setShowCreate(true)}>New program</Btn>
        </>}
      />

      {/* Role summary strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22}}>
        {byRole.map(r=>(
          <div key={r.role} onClick={()=>setRoleFilter(r.role)} style={{
            background:T.card,border:`1px solid ${T.borderQ}`,borderRadius:14,padding:18,cursor:'pointer',
            borderLeft:`4px solid ${ROLE_COLOR[r.role]}`,
            boxShadow:'0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)',
            transition:'all .15s'
          }}
          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 4px hsl(24 10%10%/.06),0 8px 24px hsl(24 10%10%/.06)'}
          onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${ROLE_COLOR[r.role]}18`,color:ROLE_COLOR[r.role],display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Ico d={ROLE_IC[r.role]||IC.users} size={18}/>
              </div>
              <div style={{fontFamily:T.display,fontSize:18,fontWeight:600,letterSpacing:'-.01em'}}>{ROLE_LABEL[r.role]}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['Programs',r.progs],['Claims',r.claims],['Paid out',`$${r.paid}`],['Pending',r.pending]].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:2}}>{l}</div>
                  <div style={{fontFamily:T.mono,fontSize:14,fontWeight:600,color:T.ink}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Top tabs */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:12}}>
        <Tabs
          tabs={[{id:'overview',label:'Overview'},{id:'programs',label:`Programs · ${INC_PROGRAMS.length}`},{id:'claims',label:`Claims · ${INC_CLAIMS.length}`},{id:'payouts',label:'Payouts'}]}
          active={tab} onChange={setTab}
        />
        {tab!=='overview' && (
          <div style={{display:'flex',gap:8}}>
            <div onClick={()=>setRoleFilter('all')} style={{padding:'6px 12px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:roleFilter==='all'?600:400,background:roleFilter==='all'?T.ink:'transparent',color:roleFilter==='all'?'white':T.muted,border:`1px solid ${roleFilter==='all'?'transparent':T.border}`}}>All roles</div>
            <RoleTab r="dist"/>
            <RoleTab r="rep"/>
            <RoleTab r="retail"/>
          </div>
        )}
      </div>

      {/* ─ OVERVIEW ─ */}
      {tab==='overview' && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
            <StatCard label="Active programs" value={INC_PROGRAMS.filter(p=>p.active).length} icon={IC.target} tone="gold"/>
            <StatCard label="Claims this period" value={INC_CLAIMS.length} sub={`${pendingClaims.length} pending`} icon={IC.receipt} tone="stone"/>
            <StatCard label="Total paid out" value={`$${totalPaid.toLocaleString()}`} icon={IC.check} tone="green"/>
            <StatCard label="Budget remaining" value={`$${(totalBudget-totalSpent).toLocaleString()}`} sub={`of $${totalBudget.toLocaleString()}`} icon={IC.more} tone="stone"/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:18}}>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <Card>
                <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:16}}>Programs by channel</div>
                {['dist','rep','retail'].map(r=>{
                  const progs=INC_PROGRAMS.filter(p=>p.role===r);
                  const spent=progs.reduce((a,p)=>a+p.spent,0);
                  const budget=progs.filter(p=>p.budget>0).reduce((a,p)=>a+p.budget,0);
                  const rc=ROLE_COLOR[r];
                  return (
                    <div key={r} style={{display:'grid',gridTemplateColumns:'120px 1fr auto',gap:14,padding:'12px 0',borderBottom:`1px solid ${T.borderQ}`,alignItems:'center'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:6,height:6,borderRadius:999,background:rc}}/>
                        <span style={{fontSize:13,fontWeight:500}}>{ROLE_LABEL[r]}</span>
                      </div>
                      <div style={{height:6,borderRadius:999,background:T.surface,overflow:'hidden'}}>
                        {budget>0&&<div style={{width:`${Math.min(spent/budget*100,100)}%`,height:'100%',background:rc}}/>}
                        {budget===0&&<div style={{width:'100%',height:'100%',background:`${rc}30`}}/>}
                      </div>
                      <div style={{fontSize:12,fontFamily:T.mono,fontWeight:600,minWidth:80,textAlign:'right'}}>
                        {budget>0?`$${spent.toLocaleString()} / $${budget.toLocaleString()}`:`$${spent} paid`}
                      </div>
                    </div>
                  );
                })}
              </Card>

              <Card>
                <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:14}}>Pending approvals <span style={{fontFamily:T.body,fontSize:13,color:T.muted,fontWeight:400,marginLeft:8}}>{pendingClaims.length} items</span></div>
                {pendingClaims.slice(0,4).map(c=>{
                  const prog=INC_PROGRAMS.find(p=>p.id===c.pid);
                  return (
                    <div key={c.id} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,padding:'11px 0',borderBottom:`1px solid ${T.borderQ}`,alignItems:'center'}}>
                      <div>
                        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3}}>
                          <RolePill role={c.role} size="xs"/>
                          <span style={{fontFamily:T.mono,fontSize:11,color:T.muted}}>{c.id}</span>
                        </div>
                        <div style={{fontSize:13,fontWeight:500}}>{c.by} · {c.account}</div>
                        <div style={{fontSize:12,color:T.muted}}>{prog?.name} · {c.date}</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                        <div style={{fontFamily:T.display,fontSize:18,fontWeight:700}}>{c.amount?`$${c.amount}`:'-'}</div>
                        <div style={{display:'flex',gap:4}}>
                          <Btn v="ghost" sz="xs">Reject</Btn>
                          <Btn v="primary" sz="xs">Approve</Btn>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {pendingClaims.length>4&&<div style={{paddingTop:10,textAlign:'center'}}><Btn v="ghost" sz="sm" onClick={()=>setTab('claims')}>View all {pendingClaims.length} pending →</Btn></div>}
              </Card>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <Card>
                <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:14}}>MTD payouts</div>
                <SparkBar data={[120,280,210,340,180,320,420,510,380,440,580,totalPaid]} color={T.gold} height={80}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:9,fontFamily:T.mono,color:T.muted,marginTop:6}}>
                  {['M','J','J','A','S','O','N','D','J','F','M','A'].map((m,i)=><span key={i}>{m}</span>)}
                </div>
                <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${T.borderQ}`,display:'flex',justifyContent:'space-between',fontSize:13}}>
                  <span style={{color:T.muted}}>Pending payout</span>
                  <span style={{fontFamily:T.mono,fontWeight:600,color:T.amber}}>${totalPending.toLocaleString()}</span>
                </div>
              </Card>
              <Card>
                <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:14}}>Top earners</div>
                {[{n:'Mike Tan',r:'rep',e:330},{n:'Léa Bardot',r:'dist',e:1050},{n:'Elena Murphy',r:'rep',e:250},{n:'Kazu Saito',r:'retail',e:200}]
                  .sort((a,b)=>b.e-a.e).map((x,i)=>(
                  <div key={x.n} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${T.borderQ}`}}>
                    <div style={{fontFamily:T.mono,fontSize:16,fontWeight:700,color:i===0?T.gold:T.muted,width:20}}>{i+1}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500}}>{x.n}</div>
                      <RolePill role={x.r} size="xs"/>
                    </div>
                    <div style={{fontFamily:T.display,fontSize:20,fontWeight:700}}>${x.e}</div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ─ PROGRAMS ─ */}
      {tab==='programs' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
          {filteredProgs.map(p=><ProgramCard key={p.id} prog={p} onSelect={setSelected}/>)}
        </div>
      )}

      {/* ─ CLAIMS ─ */}
      {tab==='claims' && (
        <Card padded={false}>
          <Table
            cols={[
              {key:'id',label:'Claim',mono:true,bold:true,render:r=><span style={{color:T.gold,fontFamily:T.mono,fontSize:12}}>{r.id}</span>},
              {key:'role',label:'Role',render:r=><RolePill role={r.role}/>},
              {key:'by',label:'Claimant',bold:true},
              {key:'account',label:'Account'},
              {key:'pid',label:'Program',render:r=>{const p=INC_PROGRAMS.find(x=>x.id===r.pid);return <span style={{fontSize:12}}>{p?.name||r.pid}</span>;}},
              {key:'date',label:'Date',mono:true},
              {key:'amount',label:'Amount',right:true,mono:true,render:r=>r.amount?`$${r.amount}`:'—'},
              {key:'evidence',label:'Evidence',render:r=><Badge status={r.evidence==='photo'?'active':r.evidence==='auto'?'confirmed':'pending'} label={r.evidence}/>},
              {key:'status',label:'Status',render:r=><Badge status={r.status}/>},
              {key:'_act',label:'',sortable:false,render:r=>(
                r.status==='pending'
                  ?<div style={{display:'flex',gap:4}}><Btn v="ghost" sz="xs">Reject</Btn><Btn v="primary" sz="xs">Approve</Btn></div>
                  :null
              )},
            ]}
            rows={filteredClaims}
            emptyMsg="No claims."
          />
        </Card>
      )}

      {/* ─ PAYOUTS ─ */}
      {tab==='payouts' && (
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:18}}>
          <Card padded={false}>
            <div style={{padding:'14px 18px',borderBottom:`1px solid ${T.borderQ}`}}>
              <div style={{fontFamily:T.display,fontSize:17,fontWeight:500}}>Payout ledger</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>Approved claims ready for payment</div>
            </div>
            <Table
              cols={[
                {key:'id',label:'Claim',mono:true},
                {key:'role',label:'Role',render:r=><RolePill role={r.role} size="xs"/>},
                {key:'by',label:'Payee'},
                {key:'date',label:'Date',mono:true},
                {key:'amount',label:'Amount',right:true,mono:true,render:r=>r.amount?`$${r.amount}`:'—'},
                {key:'status',label:'Status',render:r=><Badge status={r.status}/>},
                {key:'_pay',label:'',sortable:false,render:r=>(
                  r.status==='approved'?<Btn v="primary" sz="xs">Pay</Btn>:null
                )},
              ]}
              rows={filteredClaims}
              emptyMsg="No payouts."
            />
          </Card>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <Card>
              <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:14}}>By channel</div>
              {['dist','rep','retail'].map(r=>{
                const paid=INC_CLAIMS.filter(c=>c.role===r&&c.status==='approved').reduce((a,c)=>a+c.amount,0);
                const pend=INC_CLAIMS.filter(c=>c.role===r&&c.status==='pending').reduce((a,c)=>a+c.amount,0);
                const rc=ROLE_COLOR[r];
                return (
                  <div key={r} style={{marginBottom:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}>
                      <span style={{fontWeight:500,display:'flex',alignItems:'center',gap:6}}><div style={{width:6,height:6,borderRadius:999,background:rc}}/>{ROLE_LABEL[r]}</span>
                      <span style={{fontFamily:T.mono,fontWeight:600}}>${paid} <span style={{color:T.amber,fontWeight:400}}>+${pend} pending</span></span>
                    </div>
                    <div style={{height:6,borderRadius:999,background:T.surface,overflow:'hidden'}}>
                      <div style={{width:`${paid?Math.min(paid/totalPaid*100,100):5}%`,height:'100%',background:rc}}/>
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card>
              <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:14}}>Payout schedule</div>
              {[{d:'Apr 30',desc:'Sales Rep SPIF Q1 close',amt:580},{d:'May 5',desc:'Distributor volume bonus',amt:750},{d:'May 15',desc:'Retail featured menu Q2',amt:200},{d:'May 30',desc:'Rep target attainment Apr',amt:740}].map(p=>(
                <div key={p.d} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
                  <div><div style={{fontFamily:T.mono,fontSize:11,color:T.muted,marginBottom:2}}>{p.d}</div><div>{p.desc}</div></div>
                  <div style={{fontFamily:T.display,fontSize:18,fontWeight:700}}>${p.amt}</div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* Program detail drawer */}
      <Drawer open={!!selected} onClose={()=>setSelected(null)} title={selected?.name||''} width={520}>
        {selected && (
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <RolePill role={selected.role}/><Badge status="confirmed" label={selected.type}/><Badge status={selected.active?'active':'inactive'}/>
            </div>
            <div style={{padding:16,background:`${ROLE_COLOR[selected.role]}08`,border:`1px solid ${ROLE_COLOR[selected.role]}25`,borderRadius:12}}>
              <div style={{fontSize:11,color:ROLE_COLOR[selected.role],fontFamily:T.mono,letterSpacing:'.06em',marginBottom:6}}>TRIGGER</div>
              <div style={{fontSize:14,color:T.ink,lineHeight:1.55}}>{selected.trigger}</div>
            </div>
            {[['Rate',selected.rateType==='$'?`$${selected.rate} per event`:selected.rateType==='%'?`${selected.rate}% discount`:'Tiered — see below'],['Period',selected.period],['Conditions',selected.conditions],['Budget',selected.budget?`$${selected.budget.toLocaleString()}`:'Unlimited'],['Spent this period',`$${selected.spent.toLocaleString()}`],['Claims',selected.claims]].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
                <span style={{color:T.muted}}>{l}</span><span style={{fontWeight:500,maxWidth:'55%',textAlign:'right'}}>{v}</span>
              </div>
            ))}
            <TierTable tiers={selected.tiers}/>
            <div style={{marginTop:4}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'.07em'}}>Claims for this program</div>
              {INC_CLAIMS.filter(c=>c.pid===selected.id).map(c=>(
                <div key={c.id} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:`1px solid ${T.borderQ}`,fontSize:13}}>
                  <div><div style={{fontWeight:500}}>{c.by} · {c.account}</div><div style={{fontSize:11,color:T.muted,fontFamily:T.mono}}>{c.date} · {c.notes}</div></div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>{c.amount?<span style={{fontFamily:T.mono,fontWeight:600}}>${c.amount}</span>:null}<Badge status={c.status}/></div>
                </div>
              ))}
              {!INC_CLAIMS.find(c=>c.pid===selected.id)&&<div style={{fontSize:13,color:T.muted}}>No claims yet.</div>}
            </div>
            <div style={{display:'flex',gap:8,paddingTop:8}}>
              <Btn v="outline" style={{flex:1}} onClick={()=>setSelected(null)}>Close</Btn>
              <Btn v={selected.active?'soft':'accent'} style={{flex:1}}>{selected.active?'Pause program':'Activate'}</Btn>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create program modal */}
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="New incentive program" width={580}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <Field label="Program name" style={{gridColumn:'1/-1'}}><Input value={newProg.name} onChange={e=>setNewProg(p=>({...p,name:e.target.value}))} placeholder="e.g. Q3 SPIF — On-premise"/></Field>
          <Field label="Target role"><Select value={newProg.role} onChange={e=>setNewProg(p=>({...p,role:e.target.value}))} options={[{value:'dist',label:'Distributor'},{value:'rep',label:'Sales Rep'},{value:'retail',label:'Retail'}]}/></Field>
          <Field label="Program type"><Select value={newProg.type} onChange={e=>setNewProg(p=>({...p,type:e.target.value}))} options={['SPIF','Volume','Attainment','Reorder','Event','Loyalty','Finance','Expansion','Launch','Menu']}/></Field>
          <Field label="Rate type"><Select value={newProg.rateType} onChange={e=>setNewProg(p=>({...p,rateType:e.target.value}))} options={[{value:'$',label:'Fixed ($)'},{value:'%',label:'Percentage (%)'},{value:'tiered',label:'Tiered'}]}/></Field>
          <Field label={`Rate (${newProg.rateType})`}><Input value={newProg.rate} onChange={e=>setNewProg(p=>({...p,rate:e.target.value}))} placeholder="150" mono/></Field>
          <Field label="Period"><Select value={newProg.period} onChange={e=>setNewProg(p=>({...p,period:e.target.value}))} options={['per-event','monthly','quarterly','per-order','per-invoice','per-sku','rolling-12mo']}/></Field>
          <Field label="Budget cap ($)"><Input value={newProg.budget} onChange={e=>setNewProg(p=>({...p,budget:e.target.value}))} placeholder="10000" mono/></Field>
          <Field label="Trigger (what earns this)" style={{gridColumn:'1/-1'}}><Textarea value={newProg.trigger} onChange={e=>setNewProg(p=>({...p,trigger:e.target.value}))} placeholder="Describe the qualifying action…" rows={2}/></Field>
          <Field label="Conditions &amp; exclusions" style={{gridColumn:'1/-1'}}><Textarea rows={2} placeholder="Stackability, verification requirements, exclusions…"/></Field>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:20}}>
          <Btn v="outline" onClick={()=>setShowCreate(false)}>Cancel</Btn>
          <Btn v="soft" onClick={()=>setShowCreate(false)}>Save as draft</Btn>
          <Btn v="accent" onClick={()=>setShowCreate(false)}>Launch program</Btn>
        </div>
      </Modal>
    </AppShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// Distributor — My incentives
// ═══════════════════════════════════════════════════════════════
function DistIncentives() {
  const [selected, setSelected] = React.useState(null);
  const [showClaim, setShowClaim] = React.useState(null);
  const myProgs = INC_PROGRAMS.filter(p=>p.role==='dist');
  const myClaims = INC_CLAIMS.filter(c=>c.role==='dist');
  const earned = myClaims.filter(c=>c.status==='approved').reduce((a,c)=>a+c.amount,0);
  const pending = myClaims.filter(c=>c.status==='pending').reduce((a,c)=>a+c.amount,0);

  return (
    <AppShell breadcrumb={['Incentives']}>
      <PageHead
        eyebrow="Empire Wines · Distributor"
        title="My incentives"
        sub="Programs you're enrolled in. Every qualifying action is auto-detected where possible — you annotate only what's surprising."
      />

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22}}>
        <StatCard label="Active programs" value={myProgs.filter(p=>p.active).length} icon={IC.target} tone="gold"/>
        <StatCard label="Earned this period" value={`$${earned.toLocaleString()}`} sub="approved" icon={IC.check} tone="green"/>
        <StatCard label="Pending approval" value={`$${pending.toLocaleString()}`} sub={`${myClaims.filter(c=>c.status==='pending').length} claims`} icon={IC.more} tone="warm"/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:18}}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:2}}>Available programs</div>
          {myProgs.map(p=>(
            <div key={p.id} style={{
              background:T.card,border:`1px solid ${T.borderQ}`,borderRadius:14,padding:18,
              borderLeft:`4px solid ${ROLE_COLOR.dist}`,
              boxShadow:'0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:10}}>
                <div>
                  <div style={{display:'flex',gap:8,marginBottom:6}}><Badge status="confirmed" label={p.type}/>{!p.active&&<Badge status="inactive"/>}</div>
                  <div style={{fontFamily:T.display,fontSize:18,fontWeight:600,letterSpacing:'-.01em'}}>{p.name}</div>
                  <div style={{fontSize:13,color:T.muted,marginTop:4,lineHeight:1.5}}>{p.trigger}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontFamily:T.display,fontSize:24,fontWeight:700,color:ROLE_COLOR.dist}}>
                    {p.rateType==='$'?`$${p.rate}`:p.rateType==='%'?`${p.rate}%`:'Tiered'}
                  </div>
                  <div style={{fontSize:10,color:T.muted,fontFamily:T.mono}}>{p.period}</div>
                </div>
              </div>
              <TierTable tiers={p.tiers}/>
              <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${T.borderQ}`,fontSize:12,color:T.muted}}>
                {p.conditions}
              </div>
              <div style={{marginTop:12,display:'flex',gap:8}}>
                <Btn v="outline" sz="sm" onClick={()=>setSelected(p)}>Details</Btn>
                <Btn v="accent" sz="sm" icon={IC.plus} onClick={()=>setShowClaim(p)}>Submit claim</Btn>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Card>
            <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:14}}>My claims</div>
            {myClaims.map(c=>{
              const prog=INC_PROGRAMS.find(p=>p.id===c.pid);
              return (
                <div key={c.id} style={{padding:'10px 0',borderBottom:`1px solid ${T.borderQ}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{prog?.name}</div>
                      <div style={{fontSize:11,color:T.muted,fontFamily:T.mono,marginTop:2}}>{c.id} · {c.date}</div>
                      <div style={{fontSize:12,color:T.muted,marginTop:2}}>{c.notes}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      {c.amount>0&&<div style={{fontFamily:T.display,fontSize:18,fontWeight:700}}>${c.amount}</div>}
                      <Badge status={c.status}/>
                    </div>
                  </div>
                </div>
              );
            })}
            {myClaims.length===0&&<EmptyState icon={IC.receipt} title="No claims yet" sub="Qualifying actions are auto-detected."/>}
          </Card>

          <Card>
            <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:12}}>How auto-detection works</div>
            {[['Volume bonus','Triggered when your monthly purchase crosses a tier threshold. Auto-submitted end of month.'],['Depletion bonus','Triggered when your monthly depletion report is filed and verified. No manual claim needed.'],['Fast-pay','Applied automatically when your ERP records payment within 10 days.'],['New door bonus','Triggered when a new account places its first confirmed order through your warehouse.']].map(([t,d])=>(
              <div key={t} style={{marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:2}}>{t}</div>
                <div style={{fontSize:12,color:T.muted,lineHeight:1.5}}>{d}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Claim modal */}
      <Modal open={!!showClaim} onClose={()=>setShowClaim(null)} title={`Submit claim — ${showClaim?.name||''}`} width={480}>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{padding:12,background:`${ROLE_COLOR.dist}08`,border:`1px solid ${ROLE_COLOR.dist}25`,borderRadius:10,fontSize:13,color:T.ink,lineHeight:1.5}}>{showClaim?.trigger}</div>
          <Field label="Supporting note"><Textarea rows={3} placeholder="Describe the qualifying action, reference any POs or accounts…"/></Field>
          <Field label="Evidence type"><Select options={['Auto-detected (no upload needed)','Invoice copy','Photo','Signed document']} value="Auto-detected (no upload needed)" onChange={()=>{}}/></Field>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
            <Btn v="outline" onClick={()=>setShowClaim(null)}>Cancel</Btn>
            <Btn v="accent" onClick={()=>setShowClaim(null)}>Submit claim</Btn>
          </div>
        </div>
      </Modal>

      {/* Detail drawer */}
      <Drawer open={!!selected} onClose={()=>setSelected(null)} title={selected?.name||''} width={480}>
        {selected&&<div>
          <TierTable tiers={selected.tiers}/>
          <div style={{marginTop:14,fontSize:13,color:T.muted,lineHeight:1.6}}>{selected.conditions}</div>
          <div style={{marginTop:20}}><Btn v="accent" style={{width:'100%'}} onClick={()=>{setSelected(null);setShowClaim(selected);}}>Submit a claim →</Btn></div>
        </div>}
      </Drawer>
    </AppShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sales Rep — My incentives
// ═══════════════════════════════════════════════════════════════
function RepIncentives() {
  const [showClaim, setShowClaim] = React.useState(null);
  const [tab, setTab] = React.useState('programs');
  const myProgs = INC_PROGRAMS.filter(p=>p.role==='rep');
  const myClaims = INC_CLAIMS.filter(c=>c.role==='rep'&&c.by==='Mike Tan');
  const earned = myClaims.filter(c=>c.status==='approved').reduce((a,c)=>a+c.amount,0);
  const pending = myClaims.filter(c=>c.status==='pending').reduce((a,c)=>a+c.amount,0);
  const ytd = earned + 830; // synthetic prior months

  // Attainment tier
  const target = 28000, actual = 14820;
  const attainPct = Math.round(actual/target*100);
  const attainTier = attainPct>=125?'12% of excess':attainPct>=110?'8% of excess':attainPct>=100?'5% of excess':'Not yet hit';

  return (
    <AppShell breadcrumb={['Incentives']}>
      <PageHead
        eyebrow="Mike Tan · Sales Rep · NYC"
        title="My incentives"
        sub="Your active SPIF programs, placement log, and earnings. Submit claims after each qualifying visit."
      />

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        <StatCard label="Earned this month" value={`$${earned.toLocaleString()}`} sub="approved" icon={IC.check} tone="green"/>
        <StatCard label="Pending" value={`$${pending.toLocaleString()}`} sub="awaiting HQ" icon={IC.more} tone="warm"/>
        <StatCard label="YTD earnings" value={`$${ytd.toLocaleString()}`} sub="Jan–Apr 2026" icon={IC.chart} tone="gold"/>
        <StatCard label="Claims submitted" value={myClaims.length} sub="this month" icon={IC.receipt} tone="stone"/>
      </div>

      <Tabs tabs={[{id:'programs',label:'Programs'},{id:'log',label:`Claim log · ${myClaims.length}`},{id:'attainment',label:'Target attainment'}]} active={tab} onChange={setTab}/>
      <div style={{marginTop:16}}>
        {tab==='programs' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
            {myProgs.map(p=>(
              <div key={p.id} style={{
                background:T.card,border:`1px solid ${T.borderQ}`,borderLeft:`4px solid ${ROLE_COLOR.rep}`,
                borderRadius:14,padding:18,
                boxShadow:'0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:10}}>
                  <div style={{flex:1}}>
                    <Badge status="confirmed" label={p.type} style={{marginBottom:8}}/>
                    <div style={{fontFamily:T.display,fontSize:18,fontWeight:600,letterSpacing:'-.01em',margin:'6px 0'}}>{p.name}</div>
                    <div style={{fontSize:13,color:T.muted,lineHeight:1.5}}>{p.trigger}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:T.display,fontSize:26,fontWeight:700,color:ROLE_COLOR.rep}}>
                      {p.rateType==='$'?`$${p.rate}`:p.rateType==='%'?`${p.rate}%`:'Tiered'}
                    </div>
                    <div style={{fontSize:10,color:T.muted,fontFamily:T.mono}}>{p.period}</div>
                  </div>
                </div>
                <TierTable tiers={p.tiers}/>
                <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${T.borderQ}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:12,color:T.muted}}>{INC_CLAIMS.filter(c=>c.pid===p.id&&c.by==='Mike Tan').length} of your claims this period</span>
                  <Btn v="accent" sz="sm" icon={IC.plus} onClick={()=>setShowClaim(p)}>Claim</Btn>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='log' && (
          <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:18}}>
            <Card padded={false} style={{overflow:'hidden'}}>
              <Table
                cols={[
                  {key:'id',label:'ID',mono:true},
                  {key:'pid',label:'Program',render:r=>{const p=INC_PROGRAMS.find(x=>x.id===r.pid);return <span style={{fontSize:12}}>{p?.type}</span>;}},
                  {key:'account',label:'Account'},
                  {key:'date',label:'Date',mono:true},
                  {key:'amount',label:'$',right:true,mono:true,render:r=>r.amount?`$${r.amount}`:'—'},
                  {key:'status',label:'Status',render:r=><Badge status={r.status}/>},
                ]}
                rows={myClaims}
                emptyMsg="No claims yet this period."
              />
            </Card>
            <Card>
              <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:14}}>By program</div>
              {myProgs.map(p=>{
                const cls=myClaims.filter(c=>c.pid===p.id);
                const amt=cls.reduce((a,c)=>a+c.amount,0);
                return (
                  <div key={p.id} style={{marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}>
                      <span style={{fontWeight:500}}>{p.name}</span>
                      <span style={{fontFamily:T.mono,fontWeight:600}}>${amt} · {cls.length} claims</span>
                    </div>
                    <div style={{height:5,borderRadius:999,background:T.surface,overflow:'hidden'}}>
                      <div style={{width:`${Math.min(amt/800*100,100)}%`,height:'100%',background:ROLE_COLOR.rep}}/>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {tab==='attainment' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            <Card>
              <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:16}}>April attainment</div>
              <div style={{fontFamily:T.display,fontSize:48,fontWeight:700,letterSpacing:'-.025em',color:attainPct>=100?ROLE_COLOR.rep:T.amber}}>{attainPct}%</div>
              <div style={{fontSize:14,color:T.muted,marginBottom:16}}>${actual.toLocaleString()} of ${target.toLocaleString()} target · 1 day left</div>
              <div style={{height:10,borderRadius:999,background:T.surface,overflow:'hidden',marginBottom:8}}>
                <div style={{width:`${Math.min(attainPct,125)}%`,height:'100%',background:attainPct>=100?ROLE_COLOR.rep:T.amber,transition:'width .5s'}}/>
              </div>
              <div style={{fontSize:12,color:T.muted}}>Bonus tier: <strong style={{color:attainPct>=100?ROLE_COLOR.rep:T.muted}}>{attainTier}</strong></div>
              <div style={{marginTop:20}}>
                {INC_PROGRAMS.filter(p=>p.id==='INC-R03')[0]&&(
                  <TierTable tiers={INC_PROGRAMS.find(p=>p.id==='INC-R03').tiers}/>
                )}
              </div>
            </Card>
            <Card>
              <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:14}}>Monthly trend</div>
              <SparkBar data={[82,91,78,95,88,103,97,112,88,95,102,attainPct]} color={attainPct>=100?ROLE_COLOR.rep:T.amber} height={90}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:9,fontFamily:T.mono,color:T.muted,marginTop:6}}>
                {['M','J','J','A','S','O','N','D','J','F','M','A'].map((m,i)=><span key={i}>{m}</span>)}
              </div>
              <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${T.borderQ}`}}>
                <div style={{fontSize:13,fontWeight:500,marginBottom:8}}>What to hit 110%</div>
                <div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>You need <strong style={{color:T.ink}}>${(target*1.1-actual).toLocaleString()}</strong> more in shipped revenue by month end to unlock the 8% attainment bonus.</div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Claim modal */}
      <Modal open={!!showClaim} onClose={()=>setShowClaim(null)} title={`Claim — ${showClaim?.name||''}`} width={480}>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{padding:12,background:`${ROLE_COLOR.rep}08`,border:`1px solid ${ROLE_COLOR.rep}25`,borderRadius:10,fontSize:13,color:T.ink}}>{showClaim?.trigger}</div>
          <Field label="Account"><Select options={[{value:'',label:'Select account…'},...ACCOUNTS_DATA.filter(a=>a.rep==='MT').map(a=>({value:a.id,label:a.name}))]} value="" onChange={()=>{}}/></Field>
          <Field label="Evidence type"><Select options={['Photo (required for SPIF)','Visit note auto-attached','Signed document']} value="Photo (required for SPIF)" onChange={()=>{}}/></Field>
          <div style={{padding:12,background:T.surface,borderRadius:8,fontSize:12,color:T.muted}}>Attach a photo of the placement, shelf, or menu. Claims without evidence are held for manual review.</div>
          <Field label="Notes"><Textarea rows={2} placeholder="What did you observe? Bartender name, menu position, nearby SKUs…"/></Field>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
            <Btn v="outline" onClick={()=>setShowClaim(null)}>Cancel</Btn>
            <Btn v="accent" onClick={()=>setShowClaim(null)}>Submit claim</Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// Retail — My rewards
// ═══════════════════════════════════════════════════════════════
function RetailIncentives() {
  const [showClaim, setShowClaim] = React.useState(null);
  const myProgs = INC_PROGRAMS.filter(p=>p.role==='retail');
  const myClaims = INC_CLAIMS.filter(c=>c.role==='retail');

  // Loyalty tier calculation
  const spend12mo = 18240; // Mace's rolling 12-month spend
  const tiers = [{t:0,l:'Bronze',r:'0%',c:'hsl(30 30%55%)'},{t:10000,l:'Silver',r:'3%',c:'hsl(30 10%70%)'},{t:25000,l:'Gold',r:'5%',c:T.gold},{t:50000,l:'Platinum',r:'8%',c:'hsl(215 60%60%)'}];
  const currentTier = tiers.filter(t=>spend12mo>=t.t).pop();
  const nextTier = tiers.find(t=>t.t>spend12mo);
  const toNext = nextTier ? nextTier.t - spend12mo : 0;

  return (
    <AppShell breadcrumb={['Rewards']}>
      <PageHead
        eyebrow="Mace · Brooklyn · Retail"
        title="My rewards"
        sub="Loyalty tier status, available promotions, and active discount programs."
      />

      {/* Loyalty tier hero */}
      <div style={{
        padding:'28px 32px', borderRadius:18, marginBottom:22,
        background:`linear-gradient(135deg, ${currentTier.c}22, ${currentTier.c}08)`,
        border:`1px solid ${currentTier.c}40`,
        display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center',
        boxShadow:'0 1px 2px hsl(24 10%10%/.04),0 8px 32px hsl(24 10%10%/.06)'
      }}>
        <div>
          <div style={{fontSize:11,color:currentTier.c,fontFamily:T.mono,letterSpacing:'.1em',marginBottom:8}}>YOUR LOYALTY TIER</div>
          <div style={{fontFamily:T.display,fontSize:42,fontWeight:700,letterSpacing:'-.025em',color:currentTier.c,lineHeight:1}}>{currentTier.l}</div>
          <div style={{fontSize:15,color:T.ink,marginTop:8,fontWeight:500}}>
            {currentTier.r !== '0%' ? `${currentTier.r} discount on all orders` : 'Start earning — place your first order'}
          </div>
          <div style={{fontSize:13,color:T.muted,marginTop:4}}>Based on ${spend12mo.toLocaleString()} spend in the last 12 months</div>
          {nextTier && (
            <div style={{marginTop:16}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}>
                <span style={{color:T.muted}}>{currentTier.l} → {nextTier.l}</span>
                <span style={{fontFamily:T.mono,fontWeight:600}}>${toNext.toLocaleString()} to go</span>
              </div>
              <div style={{height:8,borderRadius:999,background:`${currentTier.c}18`,overflow:'hidden'}}>
                <div style={{width:`${Math.min(spend12mo/nextTier.t*100,100)}%`,height:'100%',background:currentTier.c}}/>
              </div>
            </div>
          )}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {tiers.map(t=>(
            <div key={t.l} style={{
              padding:'10px 14px',borderRadius:10,
              background:t.l===currentTier.l?`${t.c}20`:T.surface,
              border:`1px solid ${t.l===currentTier.l?t.c+'50':T.border}`,
              opacity:spend12mo>=t.t?1:.5
            }}>
              <div style={{fontSize:10,fontFamily:T.mono,color:t.c,letterSpacing:'.06em',marginBottom:2}}>{t.l}</div>
              <div style={{fontSize:15,fontWeight:700,color:T.ink}}>{t.r}</div>
              <div style={{fontSize:10,color:T.muted,marginTop:1}}>${(t.t/1000).toFixed(0)}K+ / yr</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:18}}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:2}}>Active promotions</div>
          {myProgs.map(p=>{
            const myClaim = myClaims.find(c=>c.pid===p.id);
            return (
              <div key={p.id} style={{
                background:T.card,border:`1px solid ${T.borderQ}`,
                borderLeft:`4px solid ${ROLE_COLOR.retail}`,borderRadius:14,padding:18,
                boxShadow:'0 1px 2px hsl(24 10%10%/.04),0 4px 12px hsl(24 10%10%/.03)'
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:10}}>
                  <div style={{flex:1}}>
                    <Badge status="confirmed" label={p.type}/>
                    <div style={{fontFamily:T.display,fontSize:18,fontWeight:600,letterSpacing:'-.01em',margin:'6px 0'}}>{p.name}</div>
                    <div style={{fontSize:13,color:T.muted,lineHeight:1.5}}>{p.trigger}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:T.display,fontSize:26,fontWeight:700,color:ROLE_COLOR.retail}}>
                      {p.tiers.length>0?'Tiered':p.rateType==='$'?`$${p.rate}`:p.rateType==='%'?`${p.rate}%`:'—'}
                    </div>
                    <div style={{fontSize:10,color:T.muted,fontFamily:T.mono}}>{p.period}</div>
                  </div>
                </div>
                <TierTable tiers={p.tiers.map(t=>({t:typeof t.t==='number'?`$${t.t.toLocaleString()}+`:t.t,r:t.r}))}/>
                <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${T.borderQ}`,fontSize:12,color:T.muted,marginBottom:12}}>{p.conditions}</div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  {myClaim
                    ? <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
                        <Badge status={myClaim.status}/><span style={{color:T.muted}}>Claim {myClaim.id}</span>
                      </div>
                    : <Btn v="accent" sz="sm" icon={IC.plus} onClick={()=>setShowClaim(p)}>Claim this reward</Btn>
                  }
                </div>
              </div>
            );
          })}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Card>
            <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:14}}>My reward history</div>
            {myClaims.map(c=>{
              const prog=INC_PROGRAMS.find(p=>p.id===c.pid);
              return (
                <div key={c.id} style={{padding:'10px 0',borderBottom:`1px solid ${T.borderQ}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{prog?.name}</div>
                      <div style={{fontSize:11,color:T.muted,fontFamily:T.mono,marginTop:2}}>{c.id} · {c.date}</div>
                      <div style={{fontSize:12,color:T.muted,marginTop:2}}>{c.notes}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      {c.amount>0&&<div style={{fontFamily:T.display,fontSize:18,fontWeight:700}}>${c.amount}</div>}
                      <Badge status={c.status}/>
                    </div>
                  </div>
                </div>
              );
            })}
            {myClaims.length===0&&<EmptyState icon={IC.receipt} title="No rewards yet" sub="Volume discounts apply automatically at checkout."/>}
          </Card>

          <Card>
            <div style={{fontFamily:T.display,fontSize:17,fontWeight:500,marginBottom:12}}>How discounts apply</div>
            {[['Loyalty tier','Applied automatically to every order. No code needed.'],['Volume case discount','Applied at checkout when your order hits the case threshold.'],['Featured cocktail','Submit a photo of your printed menu. Verified by your rep.'],['Early adopter','Applied to first order of a new SKU. Auto-detected.']].map(([t,d])=>(
              <div key={t} style={{display:'flex',gap:10,marginBottom:12,alignItems:'flex-start'}}>
                <div style={{width:6,height:6,borderRadius:999,background:ROLE_COLOR.retail,marginTop:5,flexShrink:0}}/>
                <div><div style={{fontSize:13,fontWeight:600}}>{t}</div><div style={{fontSize:12,color:T.muted,lineHeight:1.5,marginTop:2}}>{d}</div></div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Claim modal */}
      <Modal open={!!showClaim} onClose={()=>setShowClaim(null)} title={`Claim — ${showClaim?.name||''}`} width={460}>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{padding:12,background:`${ROLE_COLOR.retail}08`,border:`1px solid ${ROLE_COLOR.retail}25`,borderRadius:10,fontSize:13,lineHeight:1.5}}>{showClaim?.trigger}</div>
          <div style={{fontSize:12,color:T.muted}}>Your Hajime rep {ACCOUNTS_DATA.find(a=>a.id==='ACC-003')?.rep||'Mike'} will verify and confirm. Usually within 48 hours.</div>
          <Field label="Evidence"><Select options={['Photo of printed menu','Shelf photo','Other documentation']} value="Photo of printed menu" onChange={()=>{}}/></Field>
          <Field label="Note"><Textarea rows={2} placeholder="Anything helpful for verification…"/></Field>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
            <Btn v="outline" onClick={()=>setShowClaim(null)}>Cancel</Btn>
            <Btn v="accent" onClick={()=>setShowClaim(null)}>Submit reward claim</Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

Object.assign(window, { IncentiveManager, DistIncentives, RepIncentives, RetailIncentives });
