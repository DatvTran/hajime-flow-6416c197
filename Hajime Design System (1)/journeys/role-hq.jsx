// journeys/role-hq.jsx — Brand Operator HQ journey
// Anchor scenario: Monday morning approval week. SR drafts pile up over the
// weekend; HQ needs to triage, allocate, and approve before distributors can pick.

const HQ = ROLES.hq;

// ─── Compact dark sidebar (re-usable across all HQ slides) ──────
function HqSidebar({active='Approvals queue'}){
  const nav = [
    { l:'Command center', i:I.dashboard },
    { l:'Approvals queue', i:I.check, badge:7 },
    { l:'Global markets', i:I.globe },
    { l:'Inventory',      i:I.package },
    { l:'Orders',         i:I.cart },
    { l:'Logistics',      i:I.truck },
    { l:'Manufacturing',  i:I.factory },
    { l:'Partners',       i:I.users },
    { l:'Reports',        i:I.chart },
  ];
  const nav2 = [
    { l:'Alerts hub', i:I.alert, badge:4 },
    { l:'Settings',   i:I.settings },
  ];
  return (
    <div style={{
      background:J.inkDeep, color:'hsl(35 12% 78%)', padding:'18px 14px',
      display:'flex', flexDirection:'column', gap:18,
      borderRight:'1px solid hsl(24 10% 15%)', height:'100%', width:240, flexShrink:0
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10, padding:'6px 8px'}}>
        <div style={{width:32, height:32, borderRadius:8, background:'hsl(24 10% 13% / 0.6)',
                     display:'flex', alignItems:'center', justifyContent:'center'}}>
          <img src="assets/hajime-logo.png" alt="" style={{height:26, width:26, objectFit:'contain', filter:'brightness(0) invert(1)'}}/>
        </div>
        <div>
          <div style={{fontFamily:J.display, fontWeight:600, fontSize:16, color:'hsl(35 14% 90%)', lineHeight:1}}>Hajime</div>
          <div style={{fontSize:9, textTransform:'uppercase', letterSpacing:'.18em', color:'hsl(35 12% 55%)', marginTop:3}}>Brand HQ</div>
        </div>
      </div>

      <SidebarGroup label="Operations" items={nav} active={active}/>
      <SidebarGroup label="Monitoring" items={nav2} active={active}/>

      <div style={{marginTop:'auto', display:'flex', alignItems:'center', gap:10,
                   padding:10, borderTop:'1px solid hsl(24 10% 15%)'}}>
        <Avatar initials="SO"/>
        <div style={{fontSize:12, color:'hsl(35 14% 90%)', lineHeight:1.3}}>
          Sora Okuda
          <div style={{color:'hsl(35 12% 50%)', fontSize:10}}>Ops director</div>
        </div>
      </div>
    </div>
  );
}

function SidebarGroup({label, items, active}){
  return (
    <div style={{display:'flex', flexDirection:'column', gap:2}}>
      <div style={{padding:'4px 10px', fontSize:10, fontWeight:500, textTransform:'uppercase',
                   letterSpacing:'.14em', color:'hsl(35 12% 78% / .4)'}}>{label}</div>
      {items.map(it => (
        <div key={it.l} style={{
          display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:6,
          fontSize:13, background: it.l===active ? 'hsl(24 10% 13%)' : 'transparent',
          color: it.l===active ? J.gold : 'hsl(35 12% 78% / .72)',
          fontWeight: it.l===active ? 500 : 400,
        }}>
          <Ic d={it.i} size={15}/>
          <span style={{flex:1}}>{it.l}</span>
          {it.badge != null && (
            <span style={{fontSize:10, fontFamily:J.mono, color:J.gold,
                          background:'hsl(40 88% 42% / 0.12)', padding:'1px 6px', borderRadius:999}}>
              {it.badge}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function HqTopbar({title, breadcrumb, right}){
  return (
    <div style={{
      height:56, display:'flex', alignItems:'center', padding:'0 28px', gap:16,
      background:'hsl(40 20% 99% / 0.85)', backdropFilter:'blur(12px) saturate(1.4)',
      borderBottom:`1px solid ${J.borderQ}`, position:'sticky', top:0, zIndex:10
    }}>
      <div style={{display:'flex', alignItems:'center', gap:8, fontSize:13}}>
        {breadcrumb && breadcrumb.map((b,i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{color:J.muted}}>/</span>}
            <span style={{color: i === breadcrumb.length-1 ? J.ink : J.muted, fontWeight: i === breadcrumb.length-1 ? 500 : 400}}>{b}</span>
          </React.Fragment>
        ))}
      </div>
      <div style={{flex:1}}/>
      <div style={{
        display:'flex', alignItems:'center', gap:8, padding:'0 12px', height:34,
        background:J.surface, borderRadius:8, color:J.muted, fontSize:13, width:280
      }}>
        <Ic d={I.search} size={14}/> Search…
      </div>
      {right}
      <div style={{width:34, height:34, borderRadius:8, display:'flex', alignItems:'center',
                   justifyContent:'center', color:J.muted, position:'relative'}}>
        <Ic d={I.bell} size={15}/>
        <div style={{position:'absolute', top:8, right:9, width:6, height:6, borderRadius:999,
                     background:J.gold, border:`1.5px solid ${J.paper}`}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 03 — HQ context: pain ladder + persona
// ═══════════════════════════════════════════════════════════════
function HqContextSlide(){
  const pains = [
    { ic:I.alert, title:'Approvals scattered across modules',
      detail:'Drafts from sales reps, distributor restock requests, and POs to manufacturer all live on different tabs. Triage requires three-tab juggling.' },
    { ic:I.clock, title:'Blocking states are invisible',
      detail:'When HQ holds an order, neither rep nor distributor learns the reason — escalations pile up by email.' },
    { ic:I.bell,  title:'Alert fatigue',
      detail:'Every dataset change is its own notification. Seven alerts can mean one operational issue or seven.' },
    { ic:I.refresh, title:'No single source for "what needs me today"',
      detail:'Sora\'s morning is reconstructed from memory and Slack threads.' },
  ];
  const opps = [
    'A unified Approvals queue — drafts, holds, requests, and POs in one stream',
    'Decision view: every queue item shows its consequence (who is waiting on this) up front',
    'Alert grouping by root cause, not by event',
    'A "Today" command center anchored to what only Sora can move',
  ];

  return (
    <Slide label="03 HQ · Context">
      <SlideHeader
        roleColor={HQ.color} role="Brand Operator · HQ" stage="Context · Monday 8:14am"
        title="Sora arrives to 47 things demanding her attention"
        subtitle="Anchor scenario: Monday morning approval week. Drafts piled up over the weekend — three from a tasting trip in Brooklyn, a distributor restock from Paris, two replenishment POs. Today's job is to unblock everyone before noon."
        slideNo="03" totalForRole="14"
      />

      <div style={{padding:'40px 56px', display:'grid', gridTemplateColumns:'1fr 1.05fr', gap:40}}>
        {/* persona */}
        <div>
          <Eyebrow>Persona</Eyebrow>
          <div style={{
            marginTop:16, padding:28, background:J.card, border:`1px solid ${J.borderQ}`,
            borderRadius:16
          }}>
            <div style={{display:'flex', alignItems:'center', gap:18}}>
              <div style={{width:72, height:72, borderRadius:'50%',
                           background:'linear-gradient(135deg, hsl(40 60% 86%), hsl(30 70% 80%))',
                           display:'flex', alignItems:'center', justifyContent:'center',
                           fontFamily:J.display, fontSize:28, fontWeight:600, color:'hsl(40 88% 25%)'}}>SO</div>
              <div>
                <div style={{fontFamily:J.display, fontSize:28, fontWeight:600, letterSpacing:'-.01em'}}>Sora Okuda</div>
                <div style={{fontSize:14, color:J.muted, marginTop:2}}>Operations director · Hajime HQ, Tokyo</div>
              </div>
            </div>

            <div style={{marginTop:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, fontSize:13}}>
              <Detail label="Years on team" value="6"/>
              <Detail label="Markets owned" value="12"/>
              <Detail label="Reports to" value="Founder"/>
              <Detail label="Daily tools" value="Hajime · Slack · Notion"/>
            </div>

            <div style={{marginTop:24, paddingTop:20, borderTop:`1px solid ${J.borderQ}`}}>
              <Eyebrow>Goals on a typical week</Eyebrow>
              <ul style={{margin:'10px 0 0', paddingLeft:18, fontSize:14, lineHeight:1.7, color:J.ink}}>
                <li>Clear the queue before noon — distributors can't pick until she does</li>
                <li>Spot the market that's drifting before it becomes a stockout</li>
                <li>Keep manufacturer cadence steady; never run safety stock to zero</li>
              </ul>
            </div>

            <div style={{marginTop:20, padding:14, background:'hsl(40 88% 42% / 0.06)',
                         border:'1px solid hsl(40 88% 42% / 0.18)', borderRadius:10}}>
              <div style={{fontSize:13, lineHeight:1.5, color:J.ink, fontStyle:'italic',
                           fontFamily:J.display, fontWeight:400, fontSize:15}}>
                "I don't need more dashboards. I need to know what only I can move."
              </div>
            </div>
          </div>
        </div>

        {/* pain → opportunity */}
        <div>
          <Eyebrow>Pain points today</Eyebrow>
          <div style={{marginTop:16, display:'flex', flexDirection:'column', gap:10}}>
            {pains.map((p,i) => (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'40px 1fr', gap:14,
                padding:'14px 16px', background:J.card, border:`1px solid ${J.borderQ}`,
                borderRadius:10
              }}>
                <div style={{
                  width:36, height:36, borderRadius:8, background:'hsl(0 68% 48% / 0.08)',
                  color:J.red, display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  <Ic d={p.ic} size={18}/>
                </div>
                <div>
                  <div style={{fontSize:14, fontWeight:600, color:J.ink}}>{p.title}</div>
                  <div style={{fontSize:13, color:J.muted, lineHeight:1.5, marginTop:2}}>{p.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:24}}>
            <Eyebrow>Opportunities we're attacking</Eyebrow>
            <ul style={{margin:'12px 0 0', paddingLeft:0, listStyle:'none',
                        display:'flex', flexDirection:'column', gap:10}}>
              {opps.map((o,i) => (
                <li key={i} style={{
                  display:'grid', gridTemplateColumns:'24px 1fr', gap:12, fontSize:14,
                  lineHeight:1.5, alignItems:'flex-start'
                }}>
                  <div style={{
                    width:22, height:22, borderRadius:'50%', background:HQ.color+'18',
                    color:HQ.color, display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:600, fontFamily:J.mono, marginTop:1
                  }}>{i+1}</div>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <SlideFooter roleColor={HQ.color}/>
    </Slide>
  );
}

function Detail({label, value}){
  return (
    <div>
      <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'.14em',
                   color:J.muted, fontWeight:500}}>{label}</div>
      <div style={{fontSize:15, fontWeight:500, color:J.ink, marginTop:2}}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 04 — HQ "Today" command center (NEW pattern)
// ═══════════════════════════════════════════════════════════════
function HqTodaySlide(){
  return (
    <Slide label="04 HQ · Today command center">
      <SlideHeader
        roleColor={HQ.color} role="Brand Operator · HQ" stage="Screen 01 · Today"
        title="A command center that opens with what only she can move"
        subtitle="Replaces the metrics-first dashboard. Three vertical bands: queue · markets needing attention · supply rhythm. Numbers stay important but step behind decisions."
        slideNo="04" totalForRole="14"
      />

      <div style={{padding:'24px 56px 0'}}>
        <div style={{
          display:'grid', gridTemplateColumns:'auto 1fr', gap:0,
          border:`1px solid ${J.border}`, borderRadius:18, overflow:'hidden',
          height:820, background:J.paper,
          boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 8px 32px hsl(24 10% 10% / .08)'
        }}>
          <HqSidebar active="Command center"/>
          <div style={{display:'flex', flexDirection:'column', minWidth:0, background:J.paper}}>
            <HqTopbar breadcrumb={['Command center', 'Today']}
              right={<>
                <Btn variant="outline" size="sm" icon={I.calendar||I.clock}>Mon · Apr 27</Btn>
                <Btn variant="primary" size="sm" icon={I.plus}>New PO</Btn>
              </>}
            />
            <div style={{padding:'24px 32px', overflow:'auto'}}>
              {/* greeting + summary */}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20}}>
                <div>
                  <h1 style={{fontFamily:J.display, fontSize:28, fontWeight:600, letterSpacing:'-.02em', margin:0}}>
                    Good morning, Sora
                  </h1>
                  <p style={{fontSize:14, color:J.muted, margin:'4px 0 0'}}>
                    Seven items are waiting on you. Three blockers — eleven people downstream.
                  </p>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <Pill tone="amber" dot>3 blockers</Pill>
                  <Pill tone="gold" dot>7 awaiting you</Pill>
                </div>
              </div>

              {/* 3 column band */}
              <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:14}}>
                {/* Approvals queue */}
                <div style={{background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14, overflow:'hidden'}}>
                  <SectionHead title="Awaiting you" sub="7 items · sorted by people downstream" tone="gold"/>
                  <ApprovalRow rank="01" tone="red" title="3 SR drafts · Brooklyn tasting trip"
                    meta="Mike Tan · awaiting reallocation" downstream="11 ppl downstream" act="Triage"/>
                  <ApprovalRow rank="02" tone="amber" title="Distributor restock · Vinexpo Paris"
                    meta="142 cases · ETA risk if not by 11am" downstream="2 distributors waiting" act="Approve"/>
                  <ApprovalRow rank="03" tone="amber" title="PO #2026-0418 · Yamato Distillery"
                    meta="Lead time 21d · safety stock breach in 6d" downstream="Manufacturer queued" act="Sign"/>
                  <ApprovalRow rank="04" tone="stone" title="Reorder · Liquid Gold, NYC"
                    meta="Repeat customer · auto-priced" downstream="1 store waiting" act="Approve"/>
                  <ApprovalRow rank="05" tone="stone" title="Allocation override · Tokyo airport"
                    meta="Sales rep flagged conflict" downstream="1 dispute" act="Decide" last/>
                </div>

                {/* Markets drifting */}
                <div style={{background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14, overflow:'hidden'}}>
                  <SectionHead title="Markets drifting" sub="3 of 12 · live signals" tone="amber"/>
                  <MarketRow code="SG" name="Singapore" delta="+18%" cover="22d" tone="amber"
                    msg="Sell-through climbing — cover dropping fast"/>
                  <MarketRow code="KR" name="South Korea" delta="+24%" cover="19d" tone="amber"
                    msg="Hits safety stock in 14d at this pace"/>
                  <MarketRow code="UK" name="United Kingdom" delta="-7%" cover="78d" tone="blue"
                    msg="Overstocked — pause next PO?"/>
                  <MarketRow code="DE" name="Germany" delta="-2%" cover="82d" tone="stone"
                    msg="Soft, not yet alert" last/>
                </div>

                {/* Supply rhythm */}
                <div style={{background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14, overflow:'hidden'}}>
                  <SectionHead title="Supply rhythm" sub="Next 14 days" tone="green"/>
                  <RhythmRow when="Tue Apr 28" what="Yamato → Vinexpo" detail="2,400 cases · in transit"/>
                  <RhythmRow when="Wed Apr 29" what="PO #0411 lands" detail="HK distributor · custom clear"/>
                  <RhythmRow when="Thu Apr 30" what="Depletion sync" detail="11 markets · auto"/>
                  <RhythmRow when="Mon May  4" what="PO #0418 ships" detail="Replenish JP, KR" last/>
                </div>
              </div>

              {/* secondary row */}
              <div style={{marginTop:18, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}}>
                <Kpi label="Open orders"     value="184" tone="stone" trend={4}    icon={I.cart}/>
                <Kpi label="Cases in transit" value="2,840" tone="gold" sub="14 routes" icon={I.truck}/>
                <Kpi label="Sell-through 30d" value="86%" tone="green" trend={3} icon={I.trendUp}/>
                <Kpi label="Stockout risk"   value="3"  tone="warm"  sub="markets" icon={I.alert}/>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:'flex', gap:24, marginTop:18, fontSize:12, color:J.muted}}>
          <Annotation n="A" text="Queue is sorted by downstream impact, not date — eleven-people-blocked floats above the single-store reorder."/>
          <Annotation n="B" text="Each market row is a one-line status, not a chart — click to drill into Global Markets."/>
          <Annotation n="C" text="Supply rhythm replaces the static chart with a fourteen-day time horizon she actually plans against."/>
        </div>
      </div>

      <SlideFooter roleColor={HQ.color}/>
    </Slide>
  );
}

function SectionHead({title, sub, tone}){
  const c = tone==='gold'?J.gold:tone==='amber'?J.amber:tone==='green'?J.green:J.muted;
  return (
    <div style={{padding:'14px 18px', borderBottom:`1px solid ${J.borderQ}`,
                 display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <div style={{width:6, height:6, borderRadius:999, background:c}}/>
        <span style={{fontFamily:J.display, fontSize:16, fontWeight:500, letterSpacing:'-.01em'}}>{title}</span>
      </div>
      <span style={{fontSize:11, color:J.muted, fontFamily:J.body}}>{sub}</span>
    </div>
  );
}

function ApprovalRow({rank, tone, title, meta, downstream, act, last}){
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'40px 1fr auto', gap:12,
      padding:'14px 18px', borderBottom: last?'none':`1px solid ${J.borderQ}`,
      alignItems:'center'
    }}>
      <div style={{fontFamily:J.mono, fontSize:11, color:J.muted}}>{rank}</div>
      <div style={{minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
          <div style={{width:6, height:6, borderRadius:999,
                       background: tone==='red'?J.red:tone==='amber'?J.amber:'hsl(30 10% 55%)'}}/>
          <span style={{fontSize:13, fontWeight:500, color:J.ink}}>{title}</span>
        </div>
        <div style={{fontSize:11.5, color:J.muted, marginBottom:2}}>{meta}</div>
        <div style={{fontSize:11, color:tone==='red'?J.red:J.muted, fontFamily:J.mono,
                     letterSpacing:'.02em'}}>{downstream}</div>
      </div>
      <Btn variant={tone==='red'?'primary':'outline'} size="sm">{act}</Btn>
    </div>
  );
}

function MarketRow({code, name, delta, cover, tone, msg, last}){
  const c = tone==='amber'?J.amber:tone==='blue'?J.blue:'hsl(30 10% 55%)';
  return (
    <div style={{padding:'14px 18px', borderBottom: last?'none':`1px solid ${J.borderQ}`}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{fontFamily:J.mono, fontSize:11, color:J.muted, padding:'1px 6px',
                        background:J.surface, borderRadius:4, letterSpacing:'.02em'}}>{code}</span>
          <span style={{fontSize:13, fontWeight:500}}>{name}</span>
        </div>
        <div style={{display:'flex', gap:8, fontSize:11, fontFamily:J.mono}}>
          <span style={{color: delta.startsWith('+')?J.green:J.red, fontWeight:600}}>{delta}</span>
          <span style={{color:c, fontWeight:600}}>{cover}</span>
        </div>
      </div>
      <div style={{fontSize:11.5, color:J.muted, lineHeight:1.4}}>{msg}</div>
    </div>
  );
}

function RhythmRow({when, what, detail, last}){
  return (
    <div style={{
      padding:'14px 18px', borderBottom: last?'none':`1px solid ${J.borderQ}`,
      display:'flex', gap:12, alignItems:'flex-start'
    }}>
      <div style={{
        fontFamily:J.mono, fontSize:11, color:J.muted, minWidth:84,
        letterSpacing:'.02em'
      }}>{when}</div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13, fontWeight:500, color:J.ink, marginBottom:2}}>{what}</div>
        <div style={{fontSize:11.5, color:J.muted}}>{detail}</div>
      </div>
    </div>
  );
}

function Annotation({n, text}){
  return (
    <div style={{display:'flex', gap:10, alignItems:'flex-start', maxWidth:380}}>
      <div style={{
        width:22, height:22, borderRadius:'50%', background:J.ink, color:J.paper,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:11,
        fontWeight:600, fontFamily:J.mono, flexShrink:0, marginTop:1
      }}>{n}</div>
      <div style={{lineHeight:1.5}}>{text}</div>
    </div>
  );
}

Object.assign(window, { HqContextSlide, HqTodaySlide, HqSidebar, HqTopbar });
