// journeys/role-manuf.jsx — Manufacturer journey
const MF = ROLES.manuf;

function ManufContextSlide(){
  return (
    <Slide label="06 Manufacturer · Context">
      <SlideHeader
        roleColor={MF.color} role="Manufacturer" stage="Context · Yamato Distillery"
        title="Imanishi-san needs the production queue, not the dashboard"
        subtitle="The current portal mirrors HQ's chrome but most fields don't apply. Imanishi-san wants three things on screen: what's approved, what's running, what ships this week."
        slideNo="06" totalForRole="14"
      />
      <div style={{padding:'40px 56px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:40}}>
        <div>
          <Eyebrow>Persona</Eyebrow>
          <div style={{marginTop:14, padding:24, background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14}}>
            <div style={{display:'flex', gap:16, alignItems:'center'}}>
              <div style={{width:64, height:64, borderRadius:'50%', background:MF.color+'22',
                           color:MF.color, fontFamily:J.display, fontSize:24, fontWeight:600,
                           display:'flex', alignItems:'center', justifyContent:'center'}}>YI</div>
              <div>
                <div style={{fontFamily:J.display, fontSize:24, fontWeight:600, letterSpacing:'-.01em'}}>Yui Imanishi</div>
                <div style={{fontSize:13, color:J.muted}}>Production lead · Yamato Distillery, Yamanashi</div>
              </div>
            </div>
            <div style={{marginTop:18, paddingTop:18, borderTop:`1px solid ${J.borderQ}`,
                         fontFamily:J.display, fontSize:18, fontWeight:400, fontStyle:'italic', lineHeight:1.4}}>
              "Pricing isn't my world. Show me what's approved, what's in the still, what ships Friday."
            </div>
          </div>
          <div style={{marginTop:20}}>
            <Eyebrow>Pain points</Eyebrow>
            <ul style={{margin:'10px 0 0', paddingLeft:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8}}>
              <PainItem text="Sees commercial UI clutter — pricing, quotas, accounts — that doesn't apply"/>
              <PainItem text="Status changes go out as PDF emails, not signals back to HQ"/>
              <PainItem text="Packaging spec changes per batch are easy to miss"/>
              <PainItem text="No way to flag delay early — only when it's already late"/>
            </ul>
          </div>
        </div>
        <div>
          <Eyebrow>Anchor scenario</Eyebrow>
          <div style={{marginTop:14, padding:24, background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14}}>
            <div style={{fontFamily:J.display, fontSize:22, fontWeight:500, letterSpacing:'-.01em', lineHeight:1.3}}>
              PO #2026-0411 lands on Imanishi's queue Monday morning. 2,400 cases of JP-2024-001 due in 21 days. She must:
            </div>
            <div style={{marginTop:18, display:'flex', flexDirection:'column', gap:10}}>
              {[
                ['01','Acknowledge','Confirm capacity. Flag risks. Sign packaging spec.'],
                ['02','Schedule','Slot the batch into the still calendar. Reserve cooperage.'],
                ['03','Update status','Distill → bottle → label → pack → ready → ship.'],
                ['04','Hand off','Push BOL to distributor. HQ sees ETA tick green.'],
              ].map(([n,t,d]) => (
                <div key={n} style={{display:'grid', gridTemplateColumns:'32px 1fr', gap:12,
                                     padding:'10px 0', borderTop:n==='01'?'none':`1px solid ${J.borderQ}`}}>
                  <div style={{fontFamily:J.mono, fontSize:11, color:MF.color}}>{n}</div>
                  <div>
                    <div style={{fontSize:14, fontWeight:600}}>{t}</div>
                    <div style={{fontSize:12.5, color:J.muted, marginTop:2, lineHeight:1.5}}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginTop:20, padding:18, background:J.surface, borderRadius:12,
                       fontSize:14, lineHeight:1.55, color:J.ink}}>
            <strong style={{color:MF.color}}>Design move →</strong> A purpose-built Production board.
            No commercial chrome. Status as a horizontal pipe — every PO is a tile she drags through stages.
          </div>
        </div>
      </div>
      <SlideFooter roleColor={MF.color}/>
    </Slide>
  );
}

function PainItem({text}){
  return (
    <li style={{display:'grid', gridTemplateColumns:'18px 1fr', gap:10, fontSize:13.5, lineHeight:1.55, color:J.ink}}>
      <div style={{width:14, height:14, borderRadius:'50%', background:'hsl(0 68% 48% / 0.12)',
                   marginTop:3, color:J.red, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9}}>×</div>
      <span>{text}</span>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════════
// 07 — Manufacturer production board
// ═══════════════════════════════════════════════════════════════
function ManufBoardSlide(){
  const stages = [
    { k:'queued',     l:'Queued',      c:'hsl(30 10% 55%)' },
    { k:'distilling', l:'Distilling',  c:MF.color },
    { k:'bottling',   l:'Bottling',    c:MF.color },
    { k:'packing',    l:'Packing',     c:MF.color },
    { k:'ready',      l:'Ready',       c:J.green },
    { k:'shipped',    l:'Shipped',     c:J.blue },
  ];
  const cards = {
    queued:   [{po:'#0418', sku:'JP-2024-001', cs:1800, eta:'May 18', risk:false}],
    distilling:[{po:'#0411', sku:'JP-2024-001', cs:2400, eta:'May 04', risk:false, days:'12 / 21d'}],
    bottling: [{po:'#0408', sku:'JP-2023-007', cs:600,  eta:'Apr 30', risk:true, days:'18 / 21d'}],
    packing:  [{po:'#0407', sku:'EU-2024-002', cs:1200, eta:'Apr 28', risk:false}],
    ready:    [{po:'#0405', sku:'JP-2024-001', cs:480,  eta:'Apr 27', risk:false}],
    shipped:  [{po:'#0402', sku:'JP-2023-009', cs:960,  eta:'Apr 25', risk:false, dest:'Vinexpo Paris'}],
  };

  return (
    <Slide label="07 Manufacturer · Production board">
      <SlideHeader
        roleColor={MF.color} role="Manufacturer" stage="Screen 01 · Production board"
        title="A pipeline she drags batches through, not a CRM"
        subtitle="Every approved PO is a tile. Imanishi-san moves it across the still → bottle → label → pack → ship pipe. Status changes auto-publish to HQ and the receiving distributor."
        slideNo="07" totalForRole="14"
      />
      <div style={{padding:'24px 56px 0'}}>
        <div style={{
          background:J.paper, border:`1px solid ${J.border}`, borderRadius:18,
          height:820, overflow:'hidden',
          boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 8px 32px hsl(24 10% 10% / .08)'
        }}>
          <ManufTopbar/>

          <div style={{padding:'20px 24px', display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontFamily:J.display, fontSize:28, fontWeight:600, letterSpacing:'-.02em', margin:0}}>
                Production · this week
              </h1>
              <div style={{fontSize:13, color:J.muted, marginTop:4}}>
                6 active POs · 7,440 cases in flight · 1 at risk
              </div>
            </div>
            <div style={{display:'flex', gap:8}}>
              <Btn variant="outline" size="sm" icon={I.calendar}>Wk 17 · Apr 21–27</Btn>
              <Btn variant="outline" size="sm" icon={I.filter}>JP-2024-001</Btn>
              <Btn variant="primary" size="sm" icon={I.plus}>Log update</Btn>
            </div>
          </div>

          {/* kanban-pipe */}
          <div style={{padding:'8px 24px 24px', display:'grid',
                       gridTemplateColumns:'repeat(6, 1fr)', gap:12, height:560}}>
            {stages.map((s,i) => (
              <div key={s.k} style={{
                background:J.surface, border:`1px solid ${J.borderQ}`, borderRadius:12,
                display:'flex', flexDirection:'column', minHeight:0
              }}>
                <div style={{padding:'12px 14px', borderBottom:`1px solid ${J.borderQ}`,
                             display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <div style={{width:8, height:8, borderRadius:999, background:s.c}}/>
                    <span style={{fontSize:12.5, fontWeight:600, color:J.ink}}>{s.l}</span>
                  </div>
                  <span style={{fontFamily:J.mono, fontSize:11, color:J.muted}}>{(cards[s.k]||[]).length}</span>
                </div>
                <div style={{padding:10, display:'flex', flexDirection:'column', gap:8, overflow:'auto'}}>
                  {(cards[s.k]||[]).map(c => (
                    <ProdCard key={c.po} c={c} stageColor={s.c}/>
                  ))}
                  {/* dotted slot for next */}
                  <div style={{
                    border:`1px dashed ${J.border}`, borderRadius:8, padding:'10px 12px',
                    fontSize:11, color:J.muted, textAlign:'center'
                  }}>+ drop here</div>
                </div>
              </div>
            ))}
          </div>

          {/* footer rhythm strip */}
          <div style={{padding:'16px 24px', borderTop:`1px solid ${J.borderQ}`,
                       background:J.paper2, display:'flex', alignItems:'center', gap:24}}>
            <div>
              <Eyebrow>Capacity this week</Eyebrow>
              <div style={{fontFamily:J.display, fontSize:22, fontWeight:600, letterSpacing:'-.01em', marginTop:2}}>
                78% <span style={{fontSize:13, color:J.muted, fontFamily:J.body}}>used · 2 still slots open Fri</span>
              </div>
            </div>
            <div style={{flex:1, height:8, borderRadius:999, background:J.border, overflow:'hidden'}}>
              <div style={{width:'78%', height:'100%', background:MF.color}}/>
            </div>
            <div style={{display:'flex', gap:6}}>
              <Pill tone="amber" dot>1 at risk</Pill>
              <Pill tone="green" dot>2 ready</Pill>
            </div>
          </div>
        </div>

        <div style={{display:'flex', gap:24, marginTop:18, fontSize:12, color:J.muted}}>
          <Annotation n="A" text="Stage move = event published to HQ + distributor in real time. No PDF emails."/>
          <Annotation n="B" text="Risk pill on PO #0408 — 18 of 21 days elapsed. HQ sees the same flag in Markets."/>
          <Annotation n="C" text="Capacity strip is a rhythm tool — tells Imanishi when to refuse new work, not after the fact."/>
        </div>
      </div>
      <SlideFooter roleColor={MF.color}/>
    </Slide>
  );
}

function ManufTopbar(){
  return (
    <div style={{
      height:56, display:'flex', alignItems:'center', padding:'0 24px', gap:16,
      borderBottom:`1px solid ${J.borderQ}`, background:'hsl(40 20% 99%)'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <div style={{width:32, height:32, borderRadius:8, background:MF.color, color:J.paper,
                     display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Ic d={I.factory} size={16}/>
        </div>
        <div>
          <div style={{fontSize:13, fontWeight:600, lineHeight:1.1}}>Yamato Distillery</div>
          <div style={{fontSize:10, color:J.muted, letterSpacing:'.1em', textTransform:'uppercase'}}>Manufacturer portal</div>
        </div>
      </div>
      <div style={{flex:1}}/>
      <div style={{display:'flex', gap:14, fontSize:13}}>
        <span style={{color:MF.color, fontWeight:600, borderBottom:`2px solid ${MF.color}`, paddingBottom:18}}>Production</span>
        <span style={{color:J.muted, paddingBottom:18}}>POs in</span>
        <span style={{color:J.muted, paddingBottom:18}}>Shipments out</span>
        <span style={{color:J.muted, paddingBottom:18}}>Specs</span>
      </div>
      <div style={{flex:1}}/>
      <Avatar initials="YI" tone="paper"/>
    </div>
  );
}

function ProdCard({c, stageColor}){
  return (
    <div style={{
      background:J.card, border:`1px solid ${c.risk?'hsl(38 90% 50% / 0.5)':J.borderQ}`,
      borderRadius:9, padding:'10px 12px',
      borderLeft:`3px solid ${c.risk?J.amber:stageColor}`,
      cursor:'grab'
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4}}>
        <span style={{fontFamily:J.mono, fontSize:11, color:J.ink, fontWeight:600}}>{c.po}</span>
        {c.risk && <Pill tone="amber" dot>at risk</Pill>}
      </div>
      <div style={{fontFamily:J.mono, fontSize:11, color:J.muted, marginBottom:6}}>{c.sku}</div>
      <div style={{fontFamily:J.display, fontSize:18, fontWeight:600, letterSpacing:'-.01em', lineHeight:1}}>
        {c.cs.toLocaleString()} <span style={{fontSize:11, color:J.muted, fontWeight:400, fontFamily:J.body}}>cs</span>
      </div>
      <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:J.muted, marginTop:6,
                   fontFamily:J.mono, letterSpacing:'.02em'}}>
        <span>{c.dest || c.days || ''}</span>
        <span>ETA {c.eta}</span>
      </div>
    </div>
  );
}

Object.assign(window, { ManufContextSlide, ManufBoardSlide });
