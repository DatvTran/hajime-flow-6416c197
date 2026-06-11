// journeys/role-retail.jsx — Retail Store (reorder + track)
const RT = ROLES.retail;

function RetailContextSlide(){
  return (
    <Slide label="12 Retail · Context">
      <SlideHeader
        roleColor={RT.color} role="Retail Store" stage="Context · Brooklyn sake bar"
        title="Kazu has 90 seconds between guests to reorder"
        subtitle="The retail surface should do less, faster. One job: catalog → reorder → track. Everything else is noise. The current portal mirrors HQ chrome — overkill for a store owner with a phone behind the bar."
        slideNo="12" totalForRole="14"
      />
      <div style={{padding:'40px 56px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:40}}>
        <div>
          <Eyebrow>Persona</Eyebrow>
          <div style={{marginTop:14, padding:24, background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14}}>
            <div style={{display:'flex', gap:16, alignItems:'center'}}>
              <div style={{width:64, height:64, borderRadius:'50%', background:RT.color+'22',
                           color:RT.color, fontFamily:J.display, fontSize:24, fontWeight:600,
                           display:'flex', alignItems:'center', justifyContent:'center'}}>KS</div>
              <div>
                <div style={{fontFamily:J.display, fontSize:24, fontWeight:600, letterSpacing:'-.01em'}}>Kazu Saito</div>
                <div style={{fontSize:13, color:J.muted}}>Owner · Mace, Brooklyn · sake-bar / cocktail</div>
              </div>
            </div>
            <div style={{marginTop:18, paddingTop:18, borderTop:`1px solid ${J.borderQ}`,
                         fontFamily:J.display, fontSize:18, fontWeight:400, fontStyle:'italic', lineHeight:1.4}}>
              "I don't want a portal. I want last week's order again, tomorrow morning."
            </div>
          </div>
          <div style={{marginTop:20}}>
            <Eyebrow>Pain points</Eyebrow>
            <ul style={{margin:'10px 0 0', paddingLeft:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8}}>
              <PainItem text="Catalog is generic — doesn't know what Mace already pours"/>
              <PainItem text="Where's my delivery? — answered by texting the rep, not the platform"/>
              <PainItem text="No way to flag a guest favorite that's catching on"/>
              <PainItem text="Onboarding requires 9 fields he doesn't have at hand"/>
            </ul>
          </div>
        </div>

        <div>
          <Eyebrow>Anchor scenario · Tuesday lunch lull</Eyebrow>
          <div style={{marginTop:14, padding:24, background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14}}>
            <div style={{fontFamily:J.display, fontSize:20, fontWeight:500, letterSpacing:'-.01em', lineHeight:1.4}}>
              Kazu opens Hajime on his phone behind the bar. Three SKUs need a refill before Friday service.
              He wants to reorder last week's exact basket plus 6 more cases of the daiginjō.
            </div>
            <div style={{marginTop:24, display:'flex', flexDirection:'column', gap:10}}>
              {[
                ['1','Reorder', 'One tap on "last basket" — pre-filled, with smart suggestions from his draw rate'],
                ['2','Send', 'Routes via rep approval (he sees the chain, not just a black box)'],
                ['3','Track', 'A live shipment tile — three states, one ETA, one SMS update if it changes'],
                ['4','Close', 'Receive on phone with a tap — confirms depletion is right'],
              ].map(([n,t,d]) => (
                <div key={n} style={{display:'grid', gridTemplateColumns:'28px 1fr', gap:12,
                                     padding:'8px 0', borderTop:n==='1'?'none':`1px solid ${J.borderQ}`}}>
                  <div style={{fontFamily:J.mono, fontSize:11, color:RT.color, fontWeight:600}}>0{n}</div>
                  <div>
                    <span style={{fontSize:14, fontWeight:600}}>{t}</span>
                    <span style={{fontSize:12.5, color:J.muted, marginLeft:8}}>· {d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginTop:20, padding:18, background:'hsl(280 30% 40% / 0.06)',
                       border:`1px solid hsl(280 30% 40% / 0.2)`, borderRadius:10,
                       fontSize:14, lineHeight:1.55, color:J.ink}}>
            <strong style={{color:RT.color}}>Design move →</strong> The retail surface is a single screen with three states:
            quiet (browsing), drafting (one tap), tracking (one tile). No nav rail, no modules.
          </div>
        </div>
      </div>
      <SlideFooter roleColor={RT.color}/>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════════
// 13 — Retail single-screen
// ═══════════════════════════════════════════════════════════════
function RetailScreenSlide(){
  return (
    <Slide label="13 Retail · One screen">
      <SlideHeader
        roleColor={RT.color} role="Retail Store" stage="Screen 01 · One screen, three states"
        title="Catalog, reorder, track — never more than two taps apart"
        subtitle="Tablet-first (the device behind every bar) but works on phone. Top: a track tile that's only there when it matters. Middle: last basket. Bottom: the curated catalog."
        slideNo="13" totalForRole="14"
      />

      <div style={{padding:'24px 56px 0', display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:32, alignItems:'flex-start'}}>
        <div style={{
          width:'100%', height:820, background:J.paper2, border:`1px solid ${J.border}`,
          borderRadius:18, overflow:'hidden',
          boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 8px 32px hsl(24 10% 10% / .08)'
        }}>
          <RetailTopbar/>

          <div style={{padding:'28px 32px', overflow:'auto', height:'calc(100% - 56px)'}}>
            {/* greeting */}
            <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:20}}>
              <div>
                <div style={{fontSize:11, color:J.muted, fontFamily:J.mono, letterSpacing:'.06em'}}>TUE · APR 28 · 14:22</div>
                <h1 style={{fontFamily:J.display, fontSize:32, fontWeight:600, letterSpacing:'-.02em', margin:'4px 0 0'}}>
                  Hi Kazu
                </h1>
              </div>
              <Btn variant="ghost" size="sm" icon={I.bell}/>
            </div>

            {/* track tile */}
            <div style={{
              padding:20, background:J.card, borderRadius:14, border:`1px solid ${J.borderQ}`,
              marginBottom:20
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14}}>
                <div>
                  <Eyebrow>On the way</Eyebrow>
                  <div style={{fontFamily:J.display, fontSize:24, fontWeight:600, letterSpacing:'-.02em', marginTop:4}}>
                    Order #2604 · arriving Wed
                  </div>
                  <div style={{fontSize:13, color:J.muted, marginTop:4}}>
                    18 cases · Empire Wines Brooklyn · ETA 11:00–14:00
                  </div>
                </div>
                <Pill tone="blue" dot>In transit</Pill>
              </div>
              {/* progress bar */}
              <div style={{marginTop:18, display:'flex', alignItems:'center', gap:12}}>
                <TrackStep label="Approved" done/>
                <TrackLine done/>
                <TrackStep label="Picked" done/>
                <TrackLine done/>
                <TrackStep label="Out for delivery" current/>
                <TrackLine/>
                <TrackStep label="Received"/>
              </div>
            </div>

            {/* last basket */}
            <div style={{marginBottom:24}}>
              <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10}}>
                <div>
                  <Eyebrow>Last basket</Eyebrow>
                  <div style={{fontFamily:J.display, fontSize:20, fontWeight:600, letterSpacing:'-.01em', marginTop:2}}>
                    3 weeks ago · 28 cases
                  </div>
                </div>
                <Btn variant="accent" size="md" icon={I.refresh}>Reorder this</Btn>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
                <BasketCard name="Hajime Junmai" sku="JP-2024-001" cs={18} draw="Fast pour"/>
                <BasketCard name="Hajime Daiginjō" sku="JP-2024-002" cs={6} draw="+ 6 suggested"/>
                <BasketCard name="First Press Coffee" sku="EU-2024-002" cs={4}/>
              </div>
            </div>

            {/* catalog row */}
            <div>
              <Eyebrow>Curated for Mace</Eyebrow>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginTop:10}}>
                <CatalogCard name="Hajime Yuzu" sku="JP-2023-007" tag="New release"/>
                <CatalogCard name="Hajime Nigori" sku="JP-2024-003" tag="Trending in NYC"/>
                <CatalogCard name="First Press Reserve" sku="EU-2024-005" tag="Allocated"/>
                <CatalogCard name="Hajime Sparkling" sku="JP-2024-004" tag="Seasonal"/>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Eyebrow>What changes for the store</Eyebrow>
          <ul style={{margin:'14px 0 0', paddingLeft:0, listStyle:'none', display:'flex', flexDirection:'column', gap:14}}>
            <NewItemR n="01" t="One screen, three states"
              d="No left rail, no module switcher. Track tile only appears when something is moving."/>
            <NewItemR n="02" t="Last basket is the primary CTA"
              d="Repeat orders are 80% of retail traffic. The button is the size of the headline."/>
            <NewItemR n="03" t="Curation, not catalog"
              d="The catalog reads from his draw rate + similar bars in NYC, surfacing at most four SKUs at a time."/>
            <NewItemR n="04" t="Tracking is human"
              d="Three real states · ETA window · one SMS if anything changes. Not a polling page."/>
            <NewItemR n="05" t="Onboarding lite"
              d="Two fields to start (store name + email). The other 7 fill in over the first week, in the run of normal use."/>
          </ul>
        </div>
      </div>

      <SlideFooter roleColor={RT.color}/>
    </Slide>
  );
}

function RetailTopbar(){
  return (
    <div style={{
      height:56, display:'flex', alignItems:'center', padding:'0 28px', gap:14,
      borderBottom:`1px solid ${J.borderQ}`, background:'hsl(40 20% 99%)'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <img src="assets/hajime-logo.png" alt="" style={{height:24, width:24, objectFit:'contain'}}/>
        <span style={{fontFamily:J.display, fontSize:16, fontWeight:600, letterSpacing:'-.01em'}}>Hajime</span>
      </div>
      <div style={{flex:1}}/>
      <span style={{fontSize:12, color:J.muted}}>Mace · Brooklyn</span>
      <Avatar initials="KS" size={28} tone="paper"/>
    </div>
  );
}

function TrackStep({label, done, current}){
  const c = done?J.green:current?RT.color:J.border;
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0}}>
      <div style={{
        width:done||current?22:14, height:done||current?22:14, borderRadius:'50%',
        background:c, color:J.paper, display:'flex', alignItems:'center', justifyContent:'center'
      }}>
        {done && <Ic d={I.check} size={11} stroke={2.5}/>}
        {current && <div style={{width:8, height:8, borderRadius:999, background:J.paper}}/>}
      </div>
      <span style={{fontSize:10.5, fontWeight: done||current?600:400, color: done||current?J.ink:J.muted, fontFamily:J.body}}>{label}</span>
    </div>
  );
}

function TrackLine({done}){
  return <div style={{flex:1, height:2, background: done?J.green:J.border, marginBottom:18}}/>;
}

function BasketCard({name, sku, cs, draw}){
  return (
    <div style={{
      padding:14, background:J.paper, border:`1px solid ${J.borderQ}`, borderRadius:10,
    }}>
      <div style={{fontSize:13, fontWeight:500, color:J.ink}}>{name}</div>
      <div style={{fontSize:10.5, color:J.muted, fontFamily:J.mono, marginTop:2}}>{sku}</div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:10}}>
        <div style={{fontFamily:J.display, fontSize:22, fontWeight:600, letterSpacing:'-.02em'}}>
          {cs}<span style={{fontSize:10, color:J.muted, fontWeight:400, fontFamily:J.body, marginLeft:3}}>cs</span>
        </div>
        {draw && <span style={{fontSize:10, color:RT.color, fontFamily:J.mono}}>{draw}</span>}
      </div>
    </div>
  );
}

function CatalogCard({name, sku, tag}){
  return (
    <div style={{
      padding:14, background:J.paper, border:`1px solid ${J.borderQ}`, borderRadius:10,
      display:'flex', flexDirection:'column', gap:6
    }}>
      <div style={{
        height:60, borderRadius:6, background:`linear-gradient(135deg, hsl(40 30% 88%), hsl(30 20% 80%))`,
        display:'flex', alignItems:'center', justifyContent:'center', color:J.muted
      }}>
        <Ic d={I.package} size={22}/>
      </div>
      <div style={{fontSize:12.5, fontWeight:500}}>{name}</div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <span style={{fontSize:10, color:J.muted, fontFamily:J.mono}}>{sku}</span>
        <span style={{fontSize:10, color:RT.color, fontWeight:500}}>{tag}</span>
      </div>
    </div>
  );
}

function NewItemR({n,t,d}){
  return (
    <li style={{display:'grid', gridTemplateColumns:'34px 1fr', gap:12, alignItems:'flex-start'}}>
      <div style={{
        width:30, height:30, borderRadius:'50%', background:RT.color+'18', color:RT.color,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600,
        fontFamily:J.mono, marginTop:1
      }}>{n}</div>
      <div>
        <div style={{fontSize:14, fontWeight:600, color:J.ink}}>{t}</div>
        <div style={{fontSize:12.5, color:J.muted, lineHeight:1.5, marginTop:2}}>{d}</div>
      </div>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════════
// 14 — Closing: cross-role handoff
// ═══════════════════════════════════════════════════════════════
function ClosingSlide(){
  return (
    <Slide bg={J.inkDeep} label="14 Closing · Handoff map">
      {/* radial bloom */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse 80% 60% at 50% 110%, hsl(40 88% 42% / 0.18), transparent 60%)',
        pointerEvents:'none'
      }}/>

      <div style={{padding:'72px 80px', color:'hsl(40 18% 97%)', position:'relative', height:'100%'}}>
        <Eyebrow style={{color:'hsl(40 88% 42%)'}}>Closing · the handoff map</Eyebrow>
        <h1 style={{
          fontFamily:J.display, fontSize:80, fontWeight:600, letterSpacing:'-.025em',
          margin:'12px 0 0', color:'hsl(40 18% 97%)', maxWidth:'18ch', lineHeight:1.05
        }}>
          One order. Five surfaces. <span style={{color:'hsl(40 88% 42%)', fontStyle:'italic'}}>One thread.</span>
        </h1>
        <p style={{fontSize:18, color:'hsl(35 14% 78%)', maxWidth:'62ch', marginTop:18, lineHeight:1.5}}>
          The Brooklyn tasting draft, traced end-to-end. Every step is a single event that
          surfaces in the next role's queue — never an email, never a spreadsheet, never a guess.
        </p>

        {/* the chain */}
        <div style={{
          marginTop:64, padding:'40px 32px',
          background:'hsl(0 0% 100% / 0.04)', border:'1px solid hsl(40 18% 97% / 0.12)',
          borderRadius:18
        }}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:0, alignItems:'flex-start'}}>
            <ChainStep n="01" role="rep" ic={I.users} who="Mike Tan"
              what="Drafts 18 cs for Dante on his phone, between bars"
              writes="DRAFT-2604-A"/>
            <ChainStep n="02" role="hq" ic={I.dashboard} who="Sora Okuda"
              what="Sees it in the queue with downstream chain — approves with one click"
              writes="ORDER-2604 + ALLOC"/>
            <ChainStep n="03" role="dist" ic={I.warehouse} who="Léa Bardot"
              what="Sees the pick in tomorrow's queue. Confirms = depletion published"
              writes="DEPLETION-EVT"/>
            <ChainStep n="04" role="retail" ic={I.store} who="Kazu (Mace got reallocated cases)"
              what="Watches the track tile. ETA Wed 11:00. Receives with a tap"
              writes="RECEIVED-EVT"/>
            <ChainStep n="05" role="manuf" ic={I.factory} who="Imanishi-san"
              what="JP-2024-001 tile lights amber on her board — replenish PO is queued for HQ"
              writes="PO-2026-0419" last/>
          </div>
        </div>

        <div style={{
          marginTop:48, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24
        }}>
          <ClosingPrinciple n="01" t="Decisions, not dashboards"
            d="Each role lands on what only they can move. Numbers exist to support those decisions."/>
          <ClosingPrinciple n="02" t="The handoff is the product"
            d="Every event one role creates is the next role's notification. Depletion closes the loop."/>
          <ClosingPrinciple n="03" t="Quiet by default"
            d="One accent, three families, no alert fatigue. The system speaks only when something needs a person."/>
        </div>

        <div style={{
          position:'absolute', bottom:48, left:80, right:80, display:'flex', justifyContent:'space-between',
          fontSize:11, fontFamily:J.mono, color:'hsl(35 12% 55%)', letterSpacing:'.05em'
        }}>
          <span>はじめ · journey redesign · 2026.04</span>
          <span>14 / 14</span>
        </div>
      </div>
    </Slide>
  );
}

function ChainStep({n, role, ic, who, what, writes, last}){
  const c = ROLES[role].color;
  return (
    <div style={{position:'relative', padding:'0 18px'}}>
      {!last && (
        <div style={{
          position:'absolute', top:30, right:-6, width:40, height:1,
          background: 'linear-gradient(to right, hsl(40 88% 42% / 0.6), hsl(40 88% 42% / 0.2))',
          zIndex:0
        }}/>
      )}
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:14, position:'relative'}}>
        <div style={{
          width:60, height:60, borderRadius:'50%', background:c,
          display:'flex', alignItems:'center', justifyContent:'center', color:J.paper,
          boxShadow:`0 0 0 4px hsl(40 18% 97% / 0.06)`
        }}>
          <Ic d={ic} size={26} stroke={1.4}/>
        </div>
        <div style={{fontFamily:J.mono, fontSize:11, color:'hsl(35 12% 55%)', letterSpacing:'.06em'}}>{n}</div>
      </div>
      <div style={{fontSize:11, color:c, fontFamily:J.mono, letterSpacing:'.06em', textTransform:'uppercase'}}>{ROLES[role].label}</div>
      <div style={{fontFamily:J.display, fontSize:18, fontWeight:600, letterSpacing:'-.01em', color:'hsl(40 18% 97%)', marginTop:4}}>{who}</div>
      <div style={{fontSize:13, color:'hsl(35 14% 78%)', marginTop:6, lineHeight:1.45}}>{what}</div>
      <div style={{
        marginTop:12, padding:'4px 8px', background:'hsl(40 88% 42% / 0.1)',
        border:'1px solid hsl(40 88% 42% / 0.2)', borderRadius:6,
        fontFamily:J.mono, fontSize:10, color:'hsl(40 88% 60%)', display:'inline-block'
      }}>writes {writes}</div>
    </div>
  );
}

function ClosingPrinciple({n, t, d}){
  return (
    <div style={{
      padding:24, background:'hsl(0 0% 100% / 0.04)', border:'1px solid hsl(40 18% 97% / 0.12)',
      borderRadius:14
    }}>
      <div style={{fontFamily:J.mono, fontSize:11, color:'hsl(40 88% 42%)', letterSpacing:'.06em'}}>{n}</div>
      <div style={{fontFamily:J.display, fontSize:22, fontWeight:600, letterSpacing:'-.01em',
                   color:'hsl(40 18% 97%)', marginTop:6}}>{t}</div>
      <div style={{fontSize:13, color:'hsl(35 14% 78%)', marginTop:8, lineHeight:1.55}}>{d}</div>
    </div>
  );
}

Object.assign(window, { RetailContextSlide, RetailScreenSlide, ClosingSlide });
