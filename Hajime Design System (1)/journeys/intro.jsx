// journeys/intro.jsx — Cover + System Overview

function CoverSlide(){
  return (
    <Slide bg={J.inkDeep} label="01 Cover">
      {/* radial bloom */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(40 88% 42% / 0.18), transparent 60%)',
        pointerEvents:'none'
      }}/>
      {/* dot grid */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle, hsl(40 20% 97% / 0.04) 1px, transparent 1px)',
        backgroundSize:'24px 24px', pointerEvents:'none'
      }}/>

      {/* corner brand */}
      <div style={{position:'absolute', top:48, left:56, display:'flex', alignItems:'center', gap:14, color:'hsl(40 18% 97%)'}}>
        <div style={{width:48, height:48, borderRadius:10, background:'hsl(40 20% 97% / 0.08)',
                     display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
          <img src="assets/hajime-logo.png" alt="" style={{height:38, width:38, objectFit:'contain', filter:'brightness(0) invert(1)'}}/>
        </div>
        <div>
          <div style={{fontFamily:J.display, fontWeight:600, fontSize:22, letterSpacing:'-.01em'}}>Hajime</div>
          <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'.18em', color:'hsl(35 12% 55%)', marginTop:2}}>
            Supply Chain OS
          </div>
        </div>
      </div>

      {/* eyebrow */}
      <div style={{position:'absolute', top:56, right:56, color:'hsl(35 12% 55%)',
                   fontSize:11, fontFamily:J.mono, letterSpacing:'.1em'}}>
        APR 2026 · DESIGN REVIEW
      </div>

      {/* center content */}
      <div style={{
        position:'absolute', left:120, top:'50%', transform:'translateY(-50%)',
        maxWidth:1400, color:'hsl(40 18% 97%)'
      }}>
        <Eyebrow style={{color:'hsl(40 88% 42%)', marginBottom:24}}>
          End-to-end role journeys
        </Eyebrow>
        <h1 style={{
          fontFamily:J.display, fontSize:140, fontWeight:600, letterSpacing:'-.028em',
          lineHeight:0.98, margin:0, color:'hsl(40 18% 97%)'
        }}>
          Five portals.<br/>
          <span style={{color:'hsl(40 88% 42%)', fontStyle:'italic', fontWeight:500}}>One calm flow.</span>
        </h1>
        <p style={{
          fontSize:22, lineHeight:1.45, color:'hsl(35 14% 78%)',
          maxWidth:'58ch', marginTop:36, fontFamily:J.body
        }}>
          A redesign of the Hajime Supply Chain OS journeys — Brand Operator, Manufacturer,
          Distributor, Sales Rep, Retail Store — with the cross-role handoffs treated as
          first-class moments rather than coincidences of the dataset.
        </p>

        <div style={{display:'flex', gap:72, marginTop:80, paddingTop:32,
                     borderTop:'1px solid hsl(35 12% 55% / 0.2)', maxWidth:1100}}>
          <div>
            <div style={{fontFamily:J.display, fontSize:48, fontWeight:600,
                         color:'hsl(40 88% 42%)', letterSpacing:'-.02em'}}>5</div>
            <div style={{fontSize:13, color:'hsl(35 12% 55%)', marginTop:2}}>Roles, redesigned</div>
          </div>
          <div>
            <div style={{fontFamily:J.display, fontSize:48, fontWeight:600,
                         color:'hsl(40 88% 42%)', letterSpacing:'-.02em'}}>14</div>
            <div style={{fontSize:13, color:'hsl(35 12% 55%)', marginTop:2}}>Hi-fi screens</div>
          </div>
          <div>
            <div style={{fontFamily:J.display, fontSize:48, fontWeight:600,
                         color:'hsl(40 88% 42%)', letterSpacing:'-.02em'}}>1</div>
            <div style={{fontSize:13, color:'hsl(35 12% 55%)', marginTop:2}}>Shared dataset propagating in real time</div>
          </div>
        </div>
      </div>

      {/* bottom strip */}
      <div style={{
        position:'absolute', bottom:48, left:56, right:56,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        fontSize:11, fontFamily:J.mono, color:'hsl(35 12% 55%)', letterSpacing:'.05em'
      }}>
        <span>はじめ · the beginning</span>
        <span>journey-redesign / 2026.04</span>
      </div>
    </Slide>
  );
}

// ─── 02 — System overview / the five portals ───────────────────
function OverviewSlide(){
  const roles = [
    { key:'hq',     ic:I.dashboard, label:'Brand Operator (HQ)', who:'Sora Okuda · Ops director',
      jobs:'Approves, allocates, configures', sees:'Everything' },
    { key:'manuf',  ic:I.factory,   label:'Manufacturer',         who:'Imanishi-san · Yamato Distillery',
      jobs:'Receives POs, ships finished cases', sees:'Approved POs · packaging specs' },
    { key:'dist',   ic:I.warehouse, label:'Distributor',          who:'Léa Bardot · Vinexpo Paris',
      jobs:'Receives stock, fulfills retail orders, reports depletions', sees:'Inbound · on-hand · retail orders' },
    { key:'rep',    ic:I.users,     label:'Sales Rep',            who:'Mike Tan · field rep, NYC',
      jobs:'Drafts orders, runs visits, hits target', sees:'Accounts · drafts · distributor stock' },
    { key:'retail', ic:I.store,     label:'Retail Store',         who:'Kazu · sake bar, Brooklyn',
      jobs:'Reorders, tracks delivery', sees:'Catalog · drafts · shipments' },
  ];
  const journey = [
    { from:'retail', to:'rep',  label:'request' },
    { from:'rep',    to:'hq',   label:'submit' },
    { from:'hq',     to:'dist', label:'allocate' },
    { from:'dist',   to:'retail',label:'fulfill' },
    { from:'dist',   to:'hq',   label:'report depletion' },
    { from:'hq',     to:'manuf',label:'replenish PO' },
    { from:'manuf',  to:'dist', label:'ship cases' },
  ];

  return (
    <Slide label="02 System overview">
      <SlideHeader
        roleColor={J.ink} role="System overview" stage="The shared dataset"
        title="Five portals, one calm flow"
        subtitle="Each role sees a different slice of the same data. Every event one role creates is the next role's notification — no spreadsheets, no hand-offs by email, no week-late depletion data."
        slideNo="02" totalForRole="14"
      />

      <div style={{padding:'40px 56px', display:'grid', gridTemplateColumns:'1.05fr 1.4fr', gap:48, height:880, alignItems:'start'}}>
        {/* left — role cards */}
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <Eyebrow>The five portals</Eyebrow>
          {roles.map(r => (
            <div key={r.key} style={{
              display:'grid', gridTemplateColumns:'48px 1fr', gap:16,
              padding:'14px 16px', background:J.card, border:`1px solid ${J.borderQ}`,
              borderRadius:12, alignItems:'center'
            }}>
              <div style={{
                width:48, height:48, borderRadius:10, background:ROLES[r.key].color+'18',
                color:ROLES[r.key].color, display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                <Ic d={r.ic} size={22}/>
              </div>
              <div>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:2}}>
                  <span style={{fontFamily:J.display, fontSize:18, fontWeight:500, letterSpacing:'-.01em'}}>{r.label}</span>
                  <span style={{fontSize:11, color:J.muted}}>· {r.who}</span>
                </div>
                <div style={{fontSize:12.5, color:J.muted, lineHeight:1.45}}>
                  <span style={{color:J.ink}}>Job:</span> {r.jobs}
                  <span style={{margin:'0 8px', color:J.border}}>·</span>
                  <span style={{color:J.ink}}>Sees:</span> {r.sees}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* right — circular flow diagram */}
        <div style={{position:'relative', height:780}}>
          <Eyebrow style={{marginBottom:16}}>How the dataset propagates</Eyebrow>
          <div style={{position:'relative', height:720}}>
            <svg viewBox="0 0 700 720" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
              <defs>
                <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill={J.gold}/>
                </marker>
              </defs>
              {/* arrows hand-placed */}
              {/* retail → rep */}
              <path d="M180,640 C 180,560 180,520 180,460" stroke={J.gold} strokeWidth="1.5" fill="none" markerEnd="url(#ah)" />
              <text x="195" y="555" fontSize="12" fill={J.muted} fontFamily={J.mono}>request</text>
              {/* rep → hq */}
              <path d="M250,400 C 320,360 380,340 470,310" stroke={J.gold} strokeWidth="1.5" fill="none" markerEnd="url(#ah)" />
              <text x="320" y="335" fontSize="12" fill={J.muted} fontFamily={J.mono}>submit</text>
              {/* hq → dist */}
              <path d="M520,360 C 520,440 510,500 500,540" stroke={J.gold} strokeWidth="1.5" fill="none" markerEnd="url(#ah)" />
              <text x="535" y="465" fontSize="12" fill={J.muted} fontFamily={J.mono}>allocate</text>
              {/* dist → retail */}
              <path d="M450,620 C 360,650 290,660 240,660" stroke={J.gold} strokeWidth="1.5" fill="none" markerEnd="url(#ah)" />
              <text x="320" y="650" fontSize="12" fill={J.muted} fontFamily={J.mono}>fulfill</text>
              {/* dist → hq (depletion, dotted) */}
              <path d="M460,560 C 480,460 490,400 510,340" stroke={J.green} strokeWidth="1.4" fill="none" strokeDasharray="4 4" markerEnd="url(#ah)" />
              <text x="385" y="455" fontSize="12" fill={J.green} fontFamily={J.mono}>depletion</text>
              {/* hq → manuf */}
              <path d="M510,260 C 470,190 410,140 340,110" stroke={J.gold} strokeWidth="1.5" fill="none" markerEnd="url(#ah)" />
              <text x="380" y="170" fontSize="12" fill={J.muted} fontFamily={J.mono}>replenish PO</text>
              {/* manuf → dist */}
              <path d="M310,160 C 380,260 430,400 470,520" stroke={J.gold} strokeWidth="1.5" fill="none" markerEnd="url(#ah)" />
              <text x="265" y="395" fontSize="12" fill={J.muted} fontFamily={J.mono} transform="rotate(75 265 395)">ship cases</text>
            </svg>

            {/* role nodes positioned over svg */}
            <RoleNode style={{top:50, left:240}}    role="manuf"  ic={I.factory} label="Manufacturer"/>
            <RoleNode style={{top:240, left:480}}   role="hq"     ic={I.dashboard} label="HQ" emphasis/>
            <RoleNode style={{top:540, left:440}}   role="dist"   ic={I.warehouse} label="Distributor"/>
            <RoleNode style={{top:610, left:130}}   role="retail" ic={I.store} label="Retail"/>
            <RoleNode style={{top:380, left:120}}   role="rep"    ic={I.users} label="Sales Rep"/>
          </div>

          <div style={{
            marginTop:14, padding:16, background:J.surface, borderRadius:10,
            fontSize:13, lineHeight:1.5, color:J.ink, maxWidth:560
          }}>
            <span style={{color:J.green, fontWeight:600}}>Depletion</span> closes the loop. It's the
            move spirits brands lose without a shared dataset. We treat it as a first-class event,
            not a monthly export.
          </div>
        </div>
      </div>

      <SlideFooter roleColor={J.ink}/>
    </Slide>
  );
}

function RoleNode({role, ic, label, emphasis, style}){
  const c = ROLES[role].color;
  const size = emphasis ? 84 : 68;
  return (
    <div style={{
      position:'absolute', width:size, height:size, ...style
    }}>
      <div style={{
        width:size, height:size, borderRadius:'50%',
        background: emphasis ? c : c+'18',
        color: emphasis ? J.paper : c,
        border: emphasis ? 'none' : `2px solid ${c}40`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: emphasis ? `0 4px 24px ${c}40` : 'none'
      }}>
        <Ic d={ic} size={emphasis?34:28} stroke={1.4}/>
      </div>
      <div style={{
        position:'absolute', top:size+8, left:'50%', transform:'translateX(-50%)',
        fontSize:12, fontWeight:500, color:J.ink, whiteSpace:'nowrap',
        fontFamily:J.body
      }}>{label}</div>
    </div>
  );
}

Object.assign(window, { CoverSlide, OverviewSlide });
