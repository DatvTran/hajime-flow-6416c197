// journeys/role-hq2.jsx — HQ approvals queue (deep), alerts hub
const HQ2 = ROLES.hq;

// ═══════════════════════════════════════════════════════════════
// 05 — HQ Approvals queue (the unified inbox)
// ═══════════════════════════════════════════════════════════════
function HqApprovalsSlide(){
  return (
    <Slide label="05 HQ · Approvals queue">
      <SlideHeader
        roleColor={HQ2.color} role="Brand Operator · HQ" stage="Screen 02 · Approvals queue"
        title="One queue. Every blocker, every type, ranked by who's waiting."
        subtitle="New surface. SR drafts, distributor restocks, manufacturer POs and allocation conflicts merge into a single triage stream. Each row carries its consequence — who unblocks when she clicks."
        slideNo="05" totalForRole="14"
      />

      <div style={{padding:'24px 56px 0'}}>
        <div style={{
          display:'grid', gridTemplateColumns:'auto 1fr', gap:0,
          border:`1px solid ${J.border}`, borderRadius:18, overflow:'hidden',
          height:820, background:J.paper,
          boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 8px 32px hsl(24 10% 10% / .08)'
        }}>
          <HqSidebar active="Approvals queue"/>
          <div style={{display:'flex', flexDirection:'column', minWidth:0, background:J.paper}}>
            <HqTopbar breadcrumb={['Approvals queue', 'Open · 7']}
              right={<>
                <Btn variant="outline" size="sm" icon={I.filter}>Filter</Btn>
                <Btn variant="primary" size="sm">Bulk approve · 4</Btn>
              </>}
            />

            {/* triage filter strip */}
            <div style={{
              display:'flex', alignItems:'center', gap:10, padding:'14px 32px',
              borderBottom:`1px solid ${J.borderQ}`, background:J.paper2
            }}>
              <FilterChip active>All · 7</FilterChip>
              <FilterChip>SR drafts · 3</FilterChip>
              <FilterChip>Distributor · 2</FilterChip>
              <FilterChip>Manufacturer · 1</FilterChip>
              <FilterChip>Conflicts · 1</FilterChip>
              <div style={{flex:1}}/>
              <span style={{fontSize:11, color:J.muted, fontFamily:J.mono}}>SORT</span>
              <Btn variant="ghost" size="sm" iconR={I.down}>People downstream</Btn>
            </div>

            {/* split: list + focus */}
            <div style={{display:'grid', gridTemplateColumns:'440px 1fr', flex:1, minHeight:0}}>
              {/* left list */}
              <div style={{borderRight:`1px solid ${J.borderQ}`, overflow:'auto'}}>
                <QueueGroup label="Critical · 1">
                  <QueueItem selected ic={I.users} title="3 SR drafts · Brooklyn tasting"
                    by="Mike Tan" age="2h" tone="red" downstream="11 ppl" sub="Conflicts on JP-2024 inventory"/>
                </QueueGroup>
                <QueueGroup label="High · 2">
                  <QueueItem ic={I.warehouse} title="Distributor restock · Vinexpo Paris"
                    by="L. Bardot" age="4h" tone="amber" downstream="2 dist" sub="142 cases · ETA risk"/>
                  <QueueItem ic={I.factory} title="PO #2026-0418 · Yamato"
                    by="System" age="1d" tone="amber" downstream="1 mfr" sub="Safety stock breach in 6d"/>
                </QueueGroup>
                <QueueGroup label="Standard · 4">
                  <QueueItem ic={I.cart} title="Reorder · Liquid Gold"
                    by="K. Kazu" age="6h" tone="stone" downstream="1 store" sub="Repeat customer · auto-priced"/>
                  <QueueItem ic={I.alert} title="Allocation override · HND"
                    by="A. Suzuki" age="9h" tone="stone" downstream="1 dispute" sub="Rep flagged conflict"/>
                  <QueueItem ic={I.cart} title="Reorder · Sazerac SG"
                    by="W. Tan" age="11h" tone="stone" downstream="1 store" sub="Outside listing window"/>
                  <QueueItem ic={I.cart} title="Reorder · Bar Suntory"
                    by="System" age="14h" tone="stone" downstream="1 store" sub="Standard restock"/>
                </QueueGroup>
              </div>

              {/* right focus pane */}
              <div style={{padding:'24px 32px', overflow:'auto'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:24}}>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
                      <Pill tone="red" dot mono>BLOCKER · 11 ppl downstream</Pill>
                      <span style={{fontSize:11, fontFamily:J.mono, color:J.muted}}>#DRAFT-2604-A</span>
                    </div>
                    <h2 style={{fontFamily:J.display, fontSize:26, fontWeight:600, letterSpacing:'-.02em', margin:0}}>
                      3 sales rep drafts · Brooklyn tasting trip
                    </h2>
                    <p style={{fontSize:13, color:J.muted, margin:'6px 0 0'}}>
                      Submitted by <span style={{color:J.ink, fontWeight:500}}>Mike Tan</span> · Sat Apr 25, 6:14 PM ·
                      Awaiting allocation decision
                    </p>
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <Btn variant="outline" size="md">Hold · ask Mike</Btn>
                    <Btn variant="accent" size="md" icon={I.check}>Approve all 3</Btn>
                  </div>
                </div>

                {/* downstream chain */}
                <div style={{marginTop:24, padding:18, background:'hsl(0 68% 48% / 0.04)',
                             border:`1px solid hsl(0 68% 48% / 0.18)`, borderRadius:12}}>
                  <Eyebrow style={{color:J.red}}>Who's waiting on this</Eyebrow>
                  <div style={{display:'flex', alignItems:'center', gap:10, marginTop:10, flexWrap:'wrap'}}>
                    <ChainNode icon={I.users} label="1 rep"  detail="Mike T."/>
                    <ChainArrow/>
                    <ChainNode icon={I.warehouse} label="2 distributors" detail="Empire · Park"/>
                    <ChainArrow/>
                    <ChainNode icon={I.store} label="3 stores" detail="Dante · Katana Kitten · Mace"/>
                    <ChainArrow/>
                    <ChainNode icon={I.users} label="5 staff" detail="Tasting events Wed–Fri"/>
                  </div>
                </div>

                {/* the 3 drafts */}
                <div style={{marginTop:18}}>
                  <Eyebrow>Drafts to decide</Eyebrow>
                  <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:8}}>
                    <DraftRow store="Dante · Greenwich Village" sku="JP-2024-001 · 18 cases"
                      stock="On-hand 24" verdict="ok"/>
                    <DraftRow store="Katana Kitten · LES" sku="JP-2024-001 · 12 cases"
                      stock="On-hand 6 after Dante" verdict="conflict"/>
                    <DraftRow store="Mace · Hudson" sku="JP-2024-002 · 8 cases"
                      stock="On-hand 14" verdict="ok"/>
                  </div>
                </div>

                {/* recommendation */}
                <div style={{marginTop:18, padding:16, background:'hsl(40 88% 42% / 0.06)',
                             border:`1px solid hsl(40 88% 42% / 0.2)`, borderRadius:10}}>
                  <div style={{display:'flex', gap:12, alignItems:'flex-start'}}>
                    <div style={{
                      width:32, height:32, borderRadius:8, background:J.gold, color:J.paper,
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                    }}><Ic d={I.refresh} size={16}/></div>
                    <div>
                      <div style={{fontSize:13, fontWeight:600, color:J.ink, marginBottom:4}}>Hajime suggests</div>
                      <div style={{fontSize:13, color:J.ink, lineHeight:1.55}}>
                        Approve <strong>Dante</strong> in full · split <strong>Katana Kitten</strong> to 6 cases
                        from on-hand and 6 from PO #0411 (lands Wed) · approve <strong>Mace</strong> in full.
                        Mike already pre-cleared the split with Katana on Saturday.
                      </div>
                      <div style={{display:'flex', gap:8, marginTop:12}}>
                        <Btn variant="primary" size="sm">Apply suggestion</Btn>
                        <Btn variant="ghost" size="sm">Edit allocation</Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:'flex', gap:24, marginTop:18, fontSize:12, color:J.muted}}>
          <Annotation n="A" text="Triage chips group by source — but the default sort is consequence, not type."/>
          <Annotation n="B" text="The downstream chain is the headline — Sora can see the eleven people unblocked by one click."/>
          <Annotation n="C" text="System-suggested allocation respects rep notes from the field, then asks for sign-off."/>
        </div>
      </div>
      <SlideFooter roleColor={HQ2.color}/>
    </Slide>
  );
}

function FilterChip({active, children}){
  return (
    <div style={{
      padding:'6px 12px', borderRadius:999, fontSize:12, fontWeight:500,
      background: active?J.ink:J.paper, color: active?J.paper:J.ink,
      border:`1px solid ${active?'transparent':J.border}`, cursor:'pointer'
    }}>{children}</div>
  );
}

function QueueGroup({label, children}){
  return (
    <div>
      <div style={{padding:'10px 18px 6px', fontSize:10, textTransform:'uppercase',
                   letterSpacing:'.14em', color:J.muted, fontWeight:500,
                   background:J.surface, borderBottom:`1px solid ${J.borderQ}`}}>{label}</div>
      {children}
    </div>
  );
}

function QueueItem({selected, ic, title, by, age, tone, downstream, sub}){
  const c = tone==='red'?J.red:tone==='amber'?J.amber:'hsl(30 10% 55%)';
  return (
    <div style={{
      padding:'14px 18px', borderBottom:`1px solid ${J.borderQ}`,
      background: selected ? 'hsl(40 88% 42% / 0.05)' : 'transparent',
      borderLeft: selected ? `3px solid ${J.gold}` : '3px solid transparent',
      display:'grid', gridTemplateColumns:'32px 1fr', gap:12, cursor:'pointer'
    }}>
      <div style={{
        width:30, height:30, borderRadius:8, background:c+'15', color:c,
        display:'flex', alignItems:'center', justifyContent:'center'
      }}><Ic d={ic} size={15}/></div>
      <div style={{minWidth:0}}>
        <div style={{display:'flex', justifyContent:'space-between', gap:8, marginBottom:2}}>
          <span style={{fontSize:13, fontWeight:500, color:J.ink}}>{title}</span>
          <span style={{fontSize:11, color:J.muted, fontFamily:J.mono, flexShrink:0}}>{age}</span>
        </div>
        <div style={{fontSize:11.5, color:J.muted, marginBottom:4}}>{sub}</div>
        <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
          <span style={{fontSize:11, color:J.muted}}>{by}</span>
          <span style={{fontSize:11, color:c, fontWeight:600, fontFamily:J.mono}}>{downstream}</span>
        </div>
      </div>
    </div>
  );
}

function ChainNode({icon, label, detail}){
  return (
    <div style={{display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                 background:J.paper, border:`1px solid ${J.border}`, borderRadius:10}}>
      <div style={{width:28, height:28, borderRadius:6, background:J.surface,
                   color:J.ink, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <Ic d={icon} size={14}/>
      </div>
      <div>
        <div style={{fontSize:12, fontWeight:600, color:J.ink}}>{label}</div>
        <div style={{fontSize:10.5, color:J.muted, fontFamily:J.mono}}>{detail}</div>
      </div>
    </div>
  );
}

function ChainArrow(){
  return <Ic d={I.arrow} size={16} style={{color:J.muted}}/>;
}

function DraftRow({store, sku, stock, verdict}){
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:14,
      padding:'12px 14px', background:J.card, border:`1px solid ${J.borderQ}`,
      borderRadius:10, alignItems:'center'
    }}>
      <div>
        <div style={{fontSize:13, fontWeight:500, color:J.ink}}>{store}</div>
        <div style={{fontSize:11, color:J.muted, fontFamily:J.mono, marginTop:2}}>{sku}</div>
      </div>
      <div style={{fontSize:11, color:J.muted, fontFamily:J.mono, textAlign:'right'}}>{stock}</div>
      {verdict==='conflict' ?
        <Pill tone="red" dot>Insufficient</Pill> :
        <Pill tone="green" dot>OK</Pill>
      }
      <Btn variant="ghost" size="sm" icon={I.more}/>
    </div>
  );
}

Object.assign(window, { HqApprovalsSlide });
