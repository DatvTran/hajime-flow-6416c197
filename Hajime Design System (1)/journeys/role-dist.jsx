// journeys/role-dist.jsx — Distributor (depletion loop)
const DT = ROLES.dist;

function DistContextSlide(){
  return (
    <Slide label="08 Distributor · Context">
      <SlideHeader
        roleColor={DT.color} role="Distributor" stage="Context · Vinexpo Paris"
        title="The depletion report doesn't exist yet — and it's the whole product"
        subtitle="Léa Bardot fulfills retail orders all day; the platform is currently invisible to her once she's checked inbound. The differentiator — depletion data flowing back to HQ — has no UI for the role that owns it."
        slideNo="08" totalForRole="14"
      />
      <div style={{padding:'40px 56px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:40}}>
        <div>
          <Eyebrow>Persona</Eyebrow>
          <div style={{marginTop:14, padding:24, background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14}}>
            <div style={{display:'flex', gap:16, alignItems:'center'}}>
              <div style={{width:64, height:64, borderRadius:'50%', background:DT.color+'22',
                           color:DT.color, fontFamily:J.display, fontSize:24, fontWeight:600,
                           display:'flex', alignItems:'center', justifyContent:'center'}}>LB</div>
              <div>
                <div style={{fontFamily:J.display, fontSize:24, fontWeight:600, letterSpacing:'-.01em'}}>Léa Bardot</div>
                <div style={{fontSize:13, color:J.muted}}>Warehouse manager · Vinexpo Paris</div>
              </div>
            </div>
            <div style={{marginTop:18, paddingTop:18, borderTop:`1px solid ${J.borderQ}`,
                         fontFamily:J.display, fontSize:18, fontWeight:400, fontStyle:'italic', lineHeight:1.4}}>
              "Reporting depletion is the favor I do for the brand. Make it a side-effect of my real work."
            </div>
            <div style={{marginTop:20}}>
              <Eyebrow>Pain points</Eyebrow>
              <ul style={{margin:'10px 0 0', paddingLeft:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8}}>
                <PainItem text="Depletion is a manual export — happens monthly at best, never granular"/>
                <PainItem text="Receiving against a PO is a different page than fulfilling a retail order — context-switch all day"/>
                <PainItem text="Out-of-stock at fulfillment time → an angry email to the rep, no platform path"/>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <Eyebrow>The depletion loop — why it matters</Eyebrow>
          <div style={{marginTop:14, padding:24, background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14}}>
            <div style={{fontFamily:J.display, fontSize:20, fontWeight:500, letterSpacing:'-.01em', lineHeight:1.4}}>
              Most spirits brands lose visibility once product leaves their hands. Sell-in is logged; sell-through is rumor.
              Hajime closes that loop — but only if the distributor surface earns the report rather than asking for it.
            </div>
            <div style={{marginTop:24, padding:18, background:'hsl(158 56% 36% / 0.06)',
                         border:`1px solid hsl(158 56% 36% / 0.2)`, borderRadius:10}}>
              <Eyebrow style={{color:J.green}}>Design move</Eyebrow>
              <div style={{marginTop:8, fontSize:14, lineHeight:1.55, color:J.ink}}>
                Every fulfillment is a depletion event. Every receipt is an inflow event. The Depletion Report is
                <strong> read-only and live</strong> — Léa never "reports", the system reports for her, and she
                annotates only what's surprising.
              </div>
            </div>

            <div style={{marginTop:18, display:'flex', flexDirection:'column', gap:8}}>
              {[
                ['IN','Receive cases against PO','automatic stock movement'],
                ['OUT','Fulfill retail order','automatic depletion event'],
                ['ADJ','Annotate surprises','breakage, samples, unusual draws'],
                ['↑','HQ sees real sell-through','same hour, same dataset'],
              ].map(([n,t,d]) => (
                <div key={n} style={{display:'grid', gridTemplateColumns:'40px 1fr', gap:12, alignItems:'center'}}>
                  <div style={{fontFamily:J.mono, fontSize:11, color:DT.color, fontWeight:600,
                               padding:'4px 8px', background:DT.color+'18', borderRadius:6, textAlign:'center'}}>{n}</div>
                  <div>
                    <span style={{fontSize:13.5, fontWeight:500}}>{t}</span>
                    <span style={{fontSize:12, color:J.muted, marginLeft:8}}>· {d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SlideFooter roleColor={DT.color}/>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════════
// 09 — Distributor: depletion live + fulfill flow
// ═══════════════════════════════════════════════════════════════
function DistDepletionSlide(){
  return (
    <Slide label="09 Distributor · Depletion live">
      <SlideHeader
        roleColor={DT.color} role="Distributor" stage="Screen 01 · Floor + depletion"
        title="One screen for floor work and the depletion loop"
        subtitle="Left: today's pick queue — fulfillments that are also depletion events. Right: a live depletion ledger Léa never has to compile, but can annotate when something surprises her."
        slideNo="09" totalForRole="14"
      />

      <div style={{padding:'24px 56px 0'}}>
        <div style={{
          background:J.paper, border:`1px solid ${J.border}`, borderRadius:18,
          height:820, overflow:'hidden',
          boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 8px 32px hsl(24 10% 10% / .08)'
        }}>
          <DistTopbar/>

          <div style={{display:'grid', gridTemplateColumns:'1.1fr 1fr', height:760}}>
            {/* LEFT — pick queue */}
            <div style={{borderRight:`1px solid ${J.borderQ}`, padding:'20px 22px', overflow:'auto'}}>
              <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12}}>
                <div>
                  <Eyebrow>Today's pick queue</Eyebrow>
                  <div style={{fontFamily:J.display, fontSize:22, fontWeight:600, letterSpacing:'-.01em', marginTop:4}}>
                    8 retail orders · 312 cases · cut-off 14:00
                  </div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <Btn variant="outline" size="sm" icon={I.scan}>Scan</Btn>
                  <Btn variant="primary" size="sm" icon={I.check}>Confirm picks</Btn>
                </div>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                <PickRow store="Dante · Greenwich Village" sku="JP-2024-001" cs={18}
                  bin="A-12" eta="11:00" status="pickable"/>
                <PickRow store="Katana Kitten · LES" sku="JP-2024-001" cs={6}
                  bin="A-12" eta="11:00" status="pickable" note="Split — 6 from on-hand"/>
                <PickRow store="Mace · Hudson" sku="JP-2024-002" cs={8}
                  bin="A-14" eta="12:30" status="pickable"/>
                <PickRow store="Bar Suntory · 5th" sku="JP-2023-007" cs={4}
                  bin="A-09" eta="12:30" status="short" note="Only 2 on hand · escalate?"/>
                <PickRow store="Liquid Gold · Brooklyn" sku="EU-2024-002" cs={12}
                  bin="B-04" eta="13:00" status="pickable"/>
                <PickRow store="Sazerac SG · Park" sku="JP-2024-001" cs={24}
                  bin="A-12" eta="13:00" status="pickable" muted/>
                <PickRow store="Empire Wines · Madison" sku="EU-2024-002" cs={36}
                  bin="B-04" eta="14:00" status="pickable" muted/>
                <PickRow store="Park Ave Liquors" sku="JP-2024-001" cs={6}
                  bin="A-12" eta="14:00" status="pickable" muted/>
              </div>
            </div>

            {/* RIGHT — depletion */}
            <div style={{padding:'20px 22px', overflow:'auto', background:J.paper2}}>
              <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12}}>
                <div>
                  <Eyebrow>Depletion · live</Eyebrow>
                  <div style={{fontFamily:J.display, fontSize:22, fontWeight:600, letterSpacing:'-.01em', marginTop:4}}>
                    7 events today · 84 cases out
                  </div>
                </div>
                <Pill tone="green" dot>HQ in sync · 12s ago</Pill>
              </div>

              {/* mini chart */}
              <div style={{
                background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:12,
                padding:16, marginBottom:14
              }}>
                <Eyebrow>This week · cases out per day</Eyebrow>
                <DepletionChart/>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:11,
                             fontFamily:J.mono, color:J.muted, marginTop:6}}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
                </div>
              </div>

              <Eyebrow>Live ledger</Eyebrow>
              <div style={{
                marginTop:8, background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:12,
                overflow:'hidden'
              }}>
                <LedgerRow t="11:42" sku="JP-2024-001" cs={18} dest="Dante" type="out"/>
                <LedgerRow t="11:38" sku="JP-2024-001" cs={6}  dest="Katana Kitten" type="out"/>
                <LedgerRow t="11:14" sku="EU-2024-002" cs={12} dest="Liquid Gold" type="out"/>
                <LedgerRow t="10:02" sku="JP-2024-001" cs={2}  dest="Sample · staff tasting" type="adj" note/>
                <LedgerRow t="09:30" sku="EU-2024-002" cs={240} dest="PO #0407 · received" type="in"/>
                <LedgerRow t="09:18" sku="JP-2023-007" cs={4}  dest="Mace" type="out"/>
                <LedgerRow t="08:54" sku="JP-2024-001" cs={1}  dest="Breakage · annotate?" type="adj" pending last/>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:'flex', gap:24, marginTop:18, fontSize:12, color:J.muted}}>
          <Annotation n="A" text="Picks and depletions are the same event — confirming a pick writes to HQ instantly."/>
          <Annotation n="B" text="The ledger is the report. No 'submit depletion' button — Léa annotates surprises only."/>
          <Annotation n="C" text="Short-stock row escalates inline to the rep + HQ; no out-of-band emails."/>
        </div>
      </div>
      <SlideFooter roleColor={DT.color}/>
    </Slide>
  );
}

function DistTopbar(){
  return (
    <div style={{
      height:56, display:'flex', alignItems:'center', padding:'0 24px', gap:16,
      borderBottom:`1px solid ${J.borderQ}`, background:'hsl(40 20% 99%)'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <div style={{width:32, height:32, borderRadius:8, background:DT.color, color:J.paper,
                     display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Ic d={I.warehouse} size={16}/>
        </div>
        <div>
          <div style={{fontSize:13, fontWeight:600, lineHeight:1.1}}>Vinexpo Paris</div>
          <div style={{fontSize:10, color:J.muted, letterSpacing:'.1em', textTransform:'uppercase'}}>Distributor</div>
        </div>
      </div>
      <div style={{flex:1}}/>
      <div style={{display:'flex', gap:14, fontSize:13}}>
        <span style={{color:DT.color, fontWeight:600, borderBottom:`2px solid ${DT.color}`, paddingBottom:18}}>Floor</span>
        <span style={{color:J.muted, paddingBottom:18}}>Inbound</span>
        <span style={{color:J.muted, paddingBottom:18}}>Reports</span>
      </div>
      <div style={{flex:1}}/>
      <Avatar initials="LB" tone="paper"/>
    </div>
  );
}

function PickRow({store, sku, cs, bin, eta, status, note, muted}){
  const sCol = status==='short'?J.amber:J.green;
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'auto 1fr auto auto auto', gap:14,
      padding:'12px 14px', background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:10,
      alignItems:'center', opacity: muted?.7:1
    }}>
      <div style={{width:28, height:28, borderRadius:6, background:sCol+'18', color:sCol,
                   display:'flex', alignItems:'center', justifyContent:'center'}}>
        <Ic d={status==='short'?I.alert:I.check} size={14}/>
      </div>
      <div>
        <div style={{fontSize:13, fontWeight:500}}>{store}</div>
        <div style={{fontSize:11, color:J.muted, fontFamily:J.mono, marginTop:2}}>
          {sku} · bin {bin}{note?` · ${note}`:''}
        </div>
      </div>
      <div style={{fontFamily:J.display, fontSize:18, fontWeight:600, letterSpacing:'-.01em'}}>
        {cs}<span style={{fontSize:11, color:J.muted, fontWeight:400, fontFamily:J.body, marginLeft:3}}>cs</span>
      </div>
      <div style={{fontSize:11, color:J.muted, fontFamily:J.mono}}>{eta}</div>
      <Btn variant="ghost" size="sm" icon={I.more}/>
    </div>
  );
}

function LedgerRow({t, sku, cs, dest, type, note, pending, last}){
  const tones = {
    out: { c:J.red,    label:'OUT', bg:'hsl(0 68% 48% / 0.08)' },
    in:  { c:J.green,  label:'IN',  bg:'hsl(158 56% 36% / 0.08)' },
    adj: { c:J.amber,  label:'ADJ', bg:'hsl(38 90% 50% / 0.12)' },
  };
  const tt = tones[type];
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'52px auto 1fr auto', gap:12,
      padding:'11px 14px', borderBottom: last?'none':`1px solid ${J.borderQ}`,
      alignItems:'center'
    }}>
      <span style={{fontFamily:J.mono, fontSize:11, color:J.muted}}>{t}</span>
      <span style={{
        fontSize:10, fontWeight:600, fontFamily:J.mono, padding:'2px 6px',
        background:tt.bg, color:tt.c, borderRadius:4, letterSpacing:'.04em'
      }}>{tt.label}</span>
      <div style={{minWidth:0}}>
        <div style={{fontSize:12.5, color:J.ink, fontWeight:500,
                     overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{dest}</div>
        <div style={{fontFamily:J.mono, fontSize:11, color:J.muted}}>{sku}</div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <span style={{fontFamily:J.display, fontSize:16, fontWeight:600,
                      color: type==='in'?J.green:type==='out'?J.ink:J.amber}}>
          {type==='in'?'+':'-'}{cs}
        </span>
        {pending && <Pill tone="amber" dot>Annotate</Pill>}
      </div>
    </div>
  );
}

function DepletionChart(){
  const data = [42, 38, 56, 71, 84, 28, 0];
  const max = 100;
  return (
    <svg viewBox="0 0 280 80" style={{width:'100%', height:80, marginTop:8}}>
      {data.map((v,i) => {
        const h = (v/max)*70;
        const x = i*40 + 6;
        return (
          <g key={i}>
            <rect x={x} y={75-h} width={28} height={h} rx={3}
                  fill={i===4?DT.color:DT.color+'66'}/>
            {i===4 && <text x={x+14} y={75-h-4} fontSize="9" fill={DT.color}
                            textAnchor="middle" fontFamily={J.mono} fontWeight="600">{v}</text>}
          </g>
        );
      })}
      <line x1="0" y1="75" x2="280" y2="75" stroke={J.border}/>
    </svg>
  );
}

Object.assign(window, { DistContextSlide, DistDepletionSlide });
