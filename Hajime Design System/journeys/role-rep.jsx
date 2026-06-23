// journeys/role-rep.jsx — Sales Rep (mobile-first field day)
const SR = ROLES.rep;

function RepContextSlide(){
  return (
    <Slide label="10 Sales Rep · Context">
      <SlideHeader
        roleColor={SR.color} role="Sales Rep" stage="Context · Field"
        title="Mike works on a phone, between bars, in the dark"
        subtitle="Current rep surface assumes laptop time at HQ. Mike's reality: 14 visits a week, scribbling on cocktail napkins, drafting orders in subway dead-zones. Mobile-first or it doesn't get used."
        slideNo="10" totalForRole="14"
      />
      <div style={{padding:'40px 56px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:40}}>
        <div>
          <Eyebrow>Persona</Eyebrow>
          <div style={{marginTop:14, padding:24, background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14}}>
            <div style={{display:'flex', gap:16, alignItems:'center'}}>
              <div style={{width:64, height:64, borderRadius:'50%', background:SR.color+'22',
                           color:SR.color, fontFamily:J.display, fontSize:24, fontWeight:600,
                           display:'flex', alignItems:'center', justifyContent:'center'}}>MT</div>
              <div>
                <div style={{fontFamily:J.display, fontSize:24, fontWeight:600, letterSpacing:'-.01em'}}>Mike Tan</div>
                <div style={{fontSize:13, color:J.muted}}>Sales rep · NYC territory · 38 accounts</div>
              </div>
            </div>
            <div style={{marginTop:18, paddingTop:18, borderTop:`1px solid ${J.borderQ}`,
                         fontFamily:J.display, fontSize:18, fontWeight:400, fontStyle:'italic', lineHeight:1.4}}>
              "I'm at the bar before the bartender's there. I need three taps: open account, draft order, send."
            </div>
            <div style={{marginTop:20}}>
              <Eyebrow>Pain points</Eyebrow>
              <ul style={{margin:'10px 0 0', paddingLeft:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8}}>
                <PainItem text="No way to see distributor on-hand from the field — promises that turn into 'sorry'"/>
                <PainItem text="Visit notes live in Notes.app · never reach HQ"/>
                <PainItem text="Drafts get lost or duplicated in subway dead-zones"/>
                <PainItem text="No signal on which accounts are slipping — quarterly review surprise"/>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <Eyebrow>Anchor scenario · Friday on the road</Eyebrow>
          <div style={{marginTop:14, padding:24, background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:14}}>
            <div style={{fontFamily:J.display, fontSize:20, fontWeight:500, letterSpacing:'-.01em', lineHeight:1.4}}>
              5pm · Mike steps into Dante before service. Bartender mentions JP-2024 is moving.
              He needs to: check stock, draft 18 cases, leave a tasting note, do it in 90 seconds.
            </div>
            <div style={{marginTop:24, display:'flex', flexDirection:'column', gap:10}}>
              {[
                ['1','Walk-in','Account loads with last visit, last order, current listing'],
                ['2','Stock check','Distributor on-hand visible inline (new permission, finally surfaced)'],
                ['3','Draft','Pre-fill from previous order; tweak; offline-safe'],
                ['4','Capture','Voice note → transcript → tagged to account'],
                ['5','Submit','Goes to HQ approval queue with full context'],
              ].map(([n,t,d]) => (
                <div key={n} style={{display:'grid', gridTemplateColumns:'28px 1fr', gap:12,
                                     padding:'8px 0', borderTop:n==='1'?'none':`1px solid ${J.borderQ}`}}>
                  <div style={{fontFamily:J.mono, fontSize:11, color:SR.color, fontWeight:600}}>0{n}</div>
                  <div>
                    <span style={{fontSize:14, fontWeight:600}}>{t}</span>
                    <span style={{fontSize:12.5, color:J.muted, marginLeft:8}}>· {d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginTop:20, padding:18, background:'hsl(158 50% 30% / 0.06)',
                       border:`1px solid hsl(158 50% 30% / 0.2)`, borderRadius:10,
                       fontSize:14, lineHeight:1.55, color:J.ink}}>
            <strong style={{color:SR.color}}>Design move →</strong> Phone-native, offline-first, voice-friendly.
            Surface distributor stock — the existing RBAC permission has zero UI today.
          </div>
        </div>
      </div>
      <SlideFooter roleColor={SR.color}/>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════════
// 11 — Sales Rep mobile (3 phones, three moments)
// ═══════════════════════════════════════════════════════════════
function RepMobileSlide(){
  return (
    <Slide label="11 Sales Rep · Mobile field day">
      <SlideHeader
        roleColor={SR.color} role="Sales Rep" stage="Screen 01 · Mobile · 3 moments"
        title="A field day in three taps"
        subtitle="Walk-in → stock check → draft. Each screen pre-fills from the last. Drafts persist offline. Distributor on-hand is finally visible to reps."
        slideNo="11" totalForRole="14"
      />

      <div style={{padding:'24px 56px 0', display:'grid', gridTemplateColumns:'repeat(3, 1fr) 1.1fr', gap:32, alignItems:'flex-start'}}>
        <PhoneFrame label="Walk-in · Dante">
          <RepWalkinScreen/>
        </PhoneFrame>
        <PhoneFrame label="Stock check (new!)" highlight>
          <RepStockScreen/>
        </PhoneFrame>
        <PhoneFrame label="Draft order">
          <RepDraftScreen/>
        </PhoneFrame>

        <div style={{paddingTop:20}}>
          <Eyebrow>What's new for the rep</Eyebrow>
          <ul style={{margin:'14px 0 0', paddingLeft:0, listStyle:'none', display:'flex', flexDirection:'column', gap:14}}>
            <NewItem n="01" t="Distributor on-hand, inline"
              d="The RBAC permission existed; we surface it for the first time, on the screen where it matters."/>
            <NewItem n="02" t="Offline-first drafts"
              d="Drafts queue locally; sync when signal returns. A subway dead-zone never costs an order."/>
            <NewItem n="03" t="Voice-tagged visits"
              d="Tap-and-hold to leave a 30-sec note → transcribed → attached to the account. No Notes.app."/>
            <NewItem n="04" t="Two-step confirmation"
              d="Send draft → HQ approval queue → distributor pick. The handoff is visible to the rep, not silent."/>
            <NewItem n="05" t="Account weather"
              d="Each account header shows a single signal: 'on cadence', 'slipping', 'opportunity'. No spreadsheet review needed."/>
          </ul>
        </div>
      </div>

      <SlideFooter roleColor={SR.color}/>
    </Slide>
  );
}

function PhoneFrame({label, highlight, children}){
  return (
    <div>
      <div style={{
        width:300, height:620, margin:'0 auto', position:'relative',
        background:'#0a0908', borderRadius:38, padding:8,
        boxShadow: highlight
          ? `0 12px 50px ${SR.color}55, 0 0 0 2px ${SR.color}`
          : '0 12px 36px hsl(24 10% 10% / 0.18)'
      }}>
        <div style={{
          width:'100%', height:'100%', borderRadius:30, overflow:'hidden',
          background:J.paper, position:'relative'
        }}>
          {/* status bar */}
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'8px 18px 4px', fontSize:11, fontWeight:600, color:J.ink, fontFamily:J.body
          }}>
            <span>9:41</span>
            <span style={{display:'flex', gap:4, alignItems:'center', color:J.ink}}>
              <Ic d={I.signal} size={11}/>
              <Ic d={I.wifi} size={11}/>
              <Ic d={I.battery} size={13}/>
            </span>
          </div>
          {children}
          {/* home indicator */}
          <div style={{position:'absolute', bottom:6, left:'50%', transform:'translateX(-50%)',
                       width:120, height:4, background:J.ink, borderRadius:999, opacity:.4}}/>
        </div>
        {/* notch */}
        <div style={{position:'absolute', top:8, left:'50%', transform:'translateX(-50%)',
                     width:90, height:24, background:'#0a0908', borderRadius:'0 0 14px 14px'}}/>
      </div>
      <div style={{textAlign:'center', marginTop:14}}>
        <div style={{fontSize:13, fontWeight:500, color:J.ink}}>{label}</div>
        {highlight && <div style={{fontSize:11, color:SR.color, marginTop:2, fontFamily:J.mono, letterSpacing:'.05em'}}>NEW SURFACE</div>}
      </div>
    </div>
  );
}

function RepWalkinScreen(){
  return (
    <div style={{padding:'8px 16px 0', height:'calc(100% - 32px)', overflow:'hidden'}}>
      {/* nav */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
        <Ic d={I.menu} size={18}/>
        <div style={{display:'flex', alignItems:'center', gap:6, fontSize:11, color:SR.color, fontFamily:J.mono}}>
          <span style={{width:6, height:6, borderRadius:999, background:SR.color}}/>
          NEAR YOU
        </div>
        <Ic d={I.search} size={18}/>
      </div>

      <div style={{fontSize:11, color:J.muted, fontFamily:J.mono, letterSpacing:'.06em'}}>FRIDAY · APR 24</div>
      <h1 style={{fontFamily:J.display, fontSize:24, fontWeight:600, letterSpacing:'-.02em', margin:'4px 0 14px'}}>
        Hi Mike — 4 visits left
      </h1>

      {/* nearby card highlight */}
      <div style={{
        background: SR.color, color:J.paper, borderRadius:14, padding:14, marginBottom:10
      }}>
        <div style={{fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', opacity:.7}}>YOU'RE 30M FROM</div>
        <div style={{fontFamily:J.display, fontSize:20, fontWeight:600, letterSpacing:'-.01em', marginTop:2}}>Dante</div>
        <div style={{fontSize:11, opacity:.85, marginTop:4}}>Greenwich Village · last order 3 wk ago</div>
        <div style={{display:'flex', gap:6, marginTop:10}}>
          <span style={{fontSize:10, padding:'2px 7px', background:'hsl(0 0% 100% / 0.18)', borderRadius:999}}>● slipping</span>
          <span style={{fontSize:10, padding:'2px 7px', background:'hsl(0 0% 100% / 0.18)', borderRadius:999}}>JP-2024 listed</span>
        </div>
      </div>

      <AccountListItem name="Katana Kitten" sub="LES · cadence good" tone="green"/>
      <AccountListItem name="Mace" sub="Hudson · first visit" tone="gold"/>
      <AccountListItem name="Bar Suntory" sub="5th · slipping" tone="red" last/>
    </div>
  );
}

function AccountListItem({name, sub, tone, last}){
  const c = tone==='green'?J.green:tone==='red'?J.red:tone==='gold'?J.gold:J.muted;
  return (
    <div style={{display:'flex', alignItems:'center', gap:10, padding:'10px 0',
                 borderBottom: last?'none':`1px solid ${J.borderQ}`}}>
      <div style={{width:6, height:6, borderRadius:999, background:c, flexShrink:0}}/>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13, fontWeight:500}}>{name}</div>
        <div style={{fontSize:10.5, color:J.muted}}>{sub}</div>
      </div>
      <Ic d={I.arrow} size={13} style={{color:J.muted}}/>
    </div>
  );
}

function RepStockScreen(){
  return (
    <div style={{padding:'8px 16px 0', height:'calc(100% - 32px)', overflow:'hidden', background:J.paper2}}>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
        <Ic d={I.arrowL} size={18}/>
        <span style={{fontSize:13, fontWeight:500}}>Distributor stock</span>
      </div>

      <div style={{padding:'10px 12px', background:'hsl(158 50% 30% / 0.08)',
                   border:`1px solid hsl(158 50% 30% / 0.2)`, borderRadius:10, marginBottom:14}}>
        <div style={{fontSize:11, color:SR.color, fontFamily:J.mono, letterSpacing:'.06em'}}>EMPIRE · BROOKLYN</div>
        <div style={{fontSize:12, color:J.ink, marginTop:3}}>Live as of 11:38 — 2 min ago</div>
      </div>

      {[
        {sku:'JP-2024-001', name:'Hajime Junmai', cs:142, tone:'green'},
        {sku:'JP-2024-002', name:'Hajime Daiginjō', cs:46, tone:'amber'},
        {sku:'JP-2023-007', name:'Hajime Yuzu', cs:8,  tone:'red'},
        {sku:'EU-2024-002', name:'First Press Coffee', cs:218, tone:'green'},
      ].map(s => (
        <div key={s.sku} style={{
          padding:'12px 0', borderBottom:`1px solid ${J.borderQ}`,
          display:'flex', justifyContent:'space-between', alignItems:'center'
        }}>
          <div>
            <div style={{fontSize:13, fontWeight:500}}>{s.name}</div>
            <div style={{fontSize:10.5, color:J.muted, fontFamily:J.mono, marginTop:2}}>{s.sku}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:J.display, fontSize:20, fontWeight:600, letterSpacing:'-.01em',
                         color: s.tone==='red'?J.red:s.tone==='amber'?J.amber:J.ink}}>{s.cs}</div>
            <div style={{fontSize:10, color:J.muted, fontFamily:J.mono}}>cs on hand</div>
          </div>
        </div>
      ))}

      <div style={{marginTop:16, padding:'10px 12px', background:J.surface, borderRadius:10,
                   fontSize:11, color:J.muted, lineHeight:1.4}}>
        Confirms before you promise. Updates with Léa's picks every minute.
      </div>
    </div>
  );
}

function RepDraftScreen(){
  return (
    <div style={{padding:'8px 16px 0', height:'calc(100% - 32px)', overflow:'hidden'}}>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
        <Ic d={I.arrowL} size={18}/>
        <span style={{fontSize:13, fontWeight:500}}>Draft for Dante</span>
      </div>

      <div style={{fontSize:11, color:J.muted}}>Pre-filled from last order · 3 wk ago</div>

      <div style={{
        marginTop:12, background:J.card, border:`1px solid ${J.borderQ}`, borderRadius:12,
        padding:14
      }}>
        <DraftLine name="Hajime Junmai" sku="JP-2024-001" cs={18} primary/>
        <DraftLine name="Hajime Daiginjō" sku="JP-2024-002" cs={6}/>
        <DraftLine name="+ add SKU" add/>
      </div>

      <div style={{marginTop:14, padding:12, background:'hsl(38 90% 50% / 0.1)',
                   border:`1px solid hsl(38 90% 50% / 0.25)`, borderRadius:10,
                   fontSize:11.5, color:'hsl(30 80% 30%)', lineHeight:1.45}}>
        Empire has 142 cs of JP-2024-001 — your 18 will draw down cleanly.
      </div>

      <div style={{marginTop:12, padding:12, background:J.surface, borderRadius:10,
                   display:'flex', alignItems:'center', gap:10}}>
        <div style={{width:30, height:30, borderRadius:'50%', background:J.ink, color:J.paper,
                     display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Ic d={I.phone} size={14}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:11.5, fontWeight:500}}>Hold to leave a tasting note</div>
          <div style={{fontSize:10.5, color:J.muted}}>auto-tagged to Dante</div>
        </div>
      </div>

      <div style={{marginTop:14}}>
        <Btn variant="accent" size="lg" style={{width:'100%'}} icon={I.check}>
          Send to HQ approval
        </Btn>
      </div>
      <div style={{textAlign:'center', fontSize:10.5, color:J.muted, marginTop:8, fontFamily:J.mono}}>
        OFFLINE-SAFE · WILL SYNC WHEN ONLINE
      </div>
    </div>
  );
}

function DraftLine({name, sku, cs, primary, add}){
  if (add) return (
    <div style={{padding:'10px 0', borderTop:`1px dashed ${J.border}`,
                 fontSize:12, color:J.muted, textAlign:'center'}}>{name}</div>
  );
  return (
    <div style={{padding:'8px 0', borderBottom:`1px solid ${J.borderQ}`,
                 display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <div>
        <div style={{fontSize:12.5, fontWeight:500}}>{name}</div>
        <div style={{fontSize:10, color:J.muted, fontFamily:J.mono, marginTop:1}}>{sku}</div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8,
                   background: primary?SR.color:J.surface, color: primary?J.paper:J.ink,
                   padding:'6px 10px', borderRadius:8}}>
        <span style={{fontSize:11, opacity:.7}}>−</span>
        <span style={{fontSize:13, fontWeight:600, fontFamily:J.mono, minWidth:18, textAlign:'center'}}>{cs}</span>
        <span style={{fontSize:11, opacity:.7}}>+</span>
      </div>
    </div>
  );
}

function NewItem({n,t,d}){
  return (
    <li style={{display:'grid', gridTemplateColumns:'34px 1fr', gap:12, alignItems:'flex-start'}}>
      <div style={{
        width:30, height:30, borderRadius:'50%', background:SR.color+'18', color:SR.color,
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

Object.assign(window, { RepContextSlide, RepMobileSlide });
