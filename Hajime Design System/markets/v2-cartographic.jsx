// V2 — Cartographic. Map as primary lens.
function V2Cartographic() {
  // coarse equirectangular x/y for each market (0..100)
  const geo = {
    JP:{x:86, y:38}, US:{x:22, y:40}, SG:{x:78, y:60}, HK:{x:82, y:46},
    GB:{x:48, y:28}, DE:{x:52, y:30}, FR:{x:50, y:33}, CA:{x:20, y:28},
    AU:{x:88, y:72}, KR:{x:84, y:38}, AE:{x:62, y:48}, TW:{x:84, y:50},
  };
  const totalRev = MARKETS.reduce((a,m)=>a+m.rev, 0);
  const maxRev = Math.max(...MARKETS.map(m=>m.rev));

  return (
    <div style={{display:'grid', gridTemplateColumns:'220px 1fr', height:'100%',
                 fontFamily:'var(--font-body)', background:'hsl(40 18% 97%)',
                 fontSize:14, color:'hsl(24 10% 10%)'}}>
      <Sidebar active="Global markets" />

      <div style={{display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <TopBar>
          <Btn variant="outline"><I d={Icons.calendar} size={14}/> MTD · Apr 2026</Btn>
          <Btn variant="accent"><I d={Icons.plus} size={14}/> Allocate</Btn>
        </TopBar>

        <div style={{padding:'24px 36px 40px', overflow:'auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20}}>
            <div>
              <div style={{fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'.14em',
                           color:'hsl(40 88% 32%)', marginBottom:6}}>Global markets · atlas view</div>
              <h1 style={{fontFamily:'var(--font-display)', fontSize:32, fontWeight:600,
                          letterSpacing:'-.02em', margin:0}}>はじめ、everywhere.</h1>
              <p style={{color:'hsl(24 6% 50%)', fontSize:14, margin:'6px 0 0', maxWidth:'52ch'}}>
                Twelve markets · 1,288 stores · <span style={{fontFamily:'var(--font-mono)', color:'hsl(24 10% 10%)'}}>${(totalRev/1000).toFixed(2)}M</span> MTD. Ring size by revenue, fill by sell-through.
              </p>
            </div>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <div style={{display:'flex', gap:2, background:'hsl(37 14% 94%)', padding:3, borderRadius:8}}>
                {['Revenue','Sell-through','Cover','Flow'].map((t,i) => (
                  <span key={t} style={{
                    padding:'5px 12px', fontSize:12, borderRadius:6,
                    background: i===0 ? 'hsl(40 20% 99%)' : 'transparent',
                    color: i===0 ? 'hsl(24 10% 10%)' : 'hsl(24 6% 50%)',
                    boxShadow: i===0 ? '0 1px 2px hsl(24 10% 10% / .08)' : 'none',
                    fontWeight:500, cursor:'pointer'
                  }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Map card */}
          <div style={{
            background:'hsl(40 20% 99%)', border:'1px solid hsl(35 12% 89% / 0.6)',
            borderRadius:18, overflow:'hidden', marginBottom:18,
            boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 8px 24px hsl(24 10% 10% / .05)'
          }}>
            <WorldMap geo={geo} maxRev={maxRev}/>
          </div>

          {/* Bottom strip: focus panel + regions + alerts */}
          <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:14}}>
            <FocusCard m={MARKETS.find(x=>x.c==='JP')} />
            <RegionBars />
            <AtlasAlerts />
          </div>
        </div>
      </div>
    </div>
  );
}

function WorldMap({geo, maxRev}) {
  const W = 1100, H = 480;
  // dot-matrix continents — hand-drawn coarse shapes as dot grid
  const continents = {
    // rough polygon regions in %: [minX, maxX, minY, maxY, exclusions?]
    NAmerica: [[8, 30, 18, 50]],
    SAmerica: [[22, 34, 48, 75]],
    Europe:   [[44, 56, 22, 38]],
    Africa:   [[48, 60, 36, 65]],
    Asia:     [[56, 90, 20, 52]],
    Oceania:  [[82, 96, 62, 78]],
  };
  // generate dots
  const dots = [];
  const stride = 2.2;
  for (const region of Object.values(continents)) {
    for (const [x0,x1,y0,y1] of region) {
      for (let y=y0; y<=y1; y+=stride) {
        for (let x=x0; x<=x1; x+=stride) {
          // jittered organic feel
          const j = Math.sin(x*3.1 + y*2.7) * 0.5;
          // ragged edges: skip dots near boundary with some probability
          const edge = Math.min(x-x0, x1-x, y-y0, y1-y);
          if (edge < stride*0.8 && Math.random() > 0.55) continue;
          dots.push({ x: x + j*0.8, y: y + j*0.6 });
        }
      }
    }
  }

  return (
    <div style={{position:'relative', width:'100%', height:480}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', height:'100%', display:'block'}}>
        <defs>
          <radialGradient id="bloom" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="hsl(40 88% 42% / 0.04)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="hsl(40 18% 97%)"/>
        <rect width={W} height={H} fill="url(#bloom)"/>

        {/* longitude/latitude ghost grid */}
        {[0,25,50,75,100].map(p => (
          <line key={'v'+p} x1={p/100*W} x2={p/100*W} y1={0} y2={H}
                stroke="hsl(35 12% 89%)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.6"/>
        ))}
        {[25,50,75].map(p => (
          <line key={'h'+p} x1={0} x2={W} y1={p/100*H} y2={p/100*H}
                stroke="hsl(35 12% 89%)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.6"/>
        ))}

        {/* dot-matrix continents */}
        {dots.map((d,i) => (
          <circle key={i} cx={d.x/100*W} cy={d.y/100*H} r="1.4"
                  fill="hsl(24 10% 10% / 0.14)"/>
        ))}

        {/* shipment flow arcs (in-transit) */}
        <ShipmentArcs geo={geo} W={W} H={H}/>

        {/* market markers */}
        {MARKETS.map(m => {
          const g = geo[m.c];
          if (!g) return null;
          const cx = g.x/100*W, cy = g.y/100*H;
          const size = 10 + (m.rev / Math.max(...MARKETS.map(x=>x.rev))) * 28;
          const fill = m.status === 'healthy' ? 'hsl(40 88% 42%)'
                     : m.status === 'low-cover' ? 'hsl(0 68% 48%)'
                     : 'hsl(215 72% 50%)';
          return (
            <g key={m.c}>
              {/* outer ring */}
              <circle cx={cx} cy={cy} r={size} fill={`${fill.replace(')', ' / 0.12)')}`} stroke={fill} strokeWidth="1.2"/>
              {/* inner sell-through fill */}
              <circle cx={cx} cy={cy} r={size * 0.55} fill={fill} opacity="0.85"/>
              {/* label */}
              <text x={cx} y={cy+3} textAnchor="middle" fontFamily="var(--font-mono)"
                    fontSize="9.5" fontWeight="600" fill="hsl(40 20% 99%)" letterSpacing="0.02em">
                {m.c}
              </text>
              {/* revenue label below */}
              <text x={cx} y={cy+size+12} textAnchor="middle" fontFamily="var(--font-mono)"
                    fontSize="9" fill="hsl(24 10% 10%)" fontWeight="500">
                ${(m.rev/1000).toFixed(1)}M · {m.st}%
              </text>
            </g>
          );
        })}

        {/* legend */}
        <g transform={`translate(28, ${H-76})`}>
          <rect x={-6} y={-14} width={220} height={66} rx="8"
                fill="hsl(40 20% 99%)" stroke="hsl(35 12% 89%)" strokeWidth="1"/>
          <text x={6} y={0} fontSize="9" fontFamily="var(--font-mono)" fill="hsl(24 6% 50%)" letterSpacing="0.1em">LEGEND</text>
          <circle cx={14} cy={16} r="8" fill="hsl(40 88% 42% / 0.12)" stroke="hsl(40 88% 42%)"/>
          <circle cx={14} cy={16} r="4" fill="hsl(40 88% 42%)"/>
          <text x={28} y={19} fontSize="10" fontFamily="var(--font-body)" fill="hsl(24 10% 10%)">healthy</text>
          <circle cx={86} cy={16} r="8" fill="hsl(0 68% 48% / 0.12)" stroke="hsl(0 68% 48%)"/>
          <circle cx={86} cy={16} r="4" fill="hsl(0 68% 48%)"/>
          <text x={100} y={19} fontSize="10" fontFamily="var(--font-body)" fill="hsl(24 10% 10%)">low cover</text>
          <circle cx={158} cy={16} r="8" fill="hsl(215 72% 50% / 0.12)" stroke="hsl(215 72% 50%)"/>
          <circle cx={158} cy={16} r="4" fill="hsl(215 72% 50%)"/>
          <text x={172} y={19} fontSize="10" fontFamily="var(--font-body)" fill="hsl(24 10% 10%)">overstock</text>
          <text x={6} y={42} fontSize="9" fontFamily="var(--font-body)" fill="hsl(24 6% 50%)" letterSpacing="0">
            Ring size = MTD revenue · arcs = in-transit shipments
          </text>
        </g>
      </svg>
    </div>
  );
}

function ShipmentArcs({geo, W, H}) {
  // top manufacturer is Japan; arcs go from JP to markets with in-transit > 0
  const src = geo.JP;
  const sx = src.x/100*W, sy = src.y/100*H;
  return (
    <g>
      {MARKETS.filter(m => m.intran > 0 && m.c !== 'JP').map(m => {
        const g = geo[m.c]; if (!g) return null;
        const tx = g.x/100*W, ty = g.y/100*H;
        const mx = (sx+tx)/2, my = Math.min(sy, ty) - 60;
        return (
          <g key={m.c}>
            <path d={`M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`}
                  stroke="hsl(40 88% 42%)" strokeWidth="1" fill="none"
                  strokeDasharray="3 3" opacity="0.55"/>
            <circle cx={tx} cy={ty} r="2" fill="hsl(40 88% 42%)" opacity="0.8"/>
          </g>
        );
      })}
    </g>
  );
}

function FocusCard({m}) {
  const s = statusMap[m.status];
  return (
    <div style={{
      background:'hsl(40 20% 99%)', border:'1px solid hsl(35 12% 89% / 0.6)',
      borderRadius:14, padding:18,
      boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
        <div style={{width:32, height:24, borderRadius:4, background:'hsl(37 14% 94%)',
                     border:'1px solid hsl(35 12% 89%)', display:'flex', alignItems:'center',
                     justifyContent:'center', fontFamily:'var(--font-display)', fontSize:14,
                     fontWeight:500, color:'hsl(24 10% 10%)'}}>{m.flag}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:'var(--font-display)', fontSize:17, fontWeight:600}}>{m.name}</div>
          <div style={{fontSize:11, color:'hsl(24 6% 50%)'}}>{m.region} · {m.stores} stores</div>
        </div>
        <Pill tone={s.tone}><Dot tone={s.tone}/>{s.label}</Pill>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:12,
                   paddingTop:12, borderTop:'1px solid hsl(35 12% 89% / 0.6)'}}>
        <Stat label="REVENUE · MTD" val={`$${(m.rev/1000).toFixed(2)}M`} sub={`${m.tr>0?'+':''}${m.tr}% vs LM`} tone={m.tr>0?'up':'down'}/>
        <Stat label="SELL-THROUGH" val={`${m.st}%`} sub="rolling 30d" tone="up"/>
        <Stat label="COVER" val={`${m.cover}d`} sub={`${m.stock.toLocaleString()} cs on-hand`}/>
      </div>
      <div style={{marginTop:14, padding:10, background:'hsl(37 14% 94% / 0.5)', borderRadius:8,
                   fontSize:12, color:'hsl(24 6% 50%)', lineHeight:1.5}}>
        Honshū distribution is running lean — 2 in-transit, ETA 14 Apr (Kobe DC). Cover holding at 62 days.
      </div>
    </div>
  );
}

function Stat({label, val, sub, tone}) {
  return (
    <div>
      <div style={{fontSize:9, textTransform:'uppercase', letterSpacing:'.1em', color:'hsl(24 6% 50%)', fontWeight:500}}>{label}</div>
      <div style={{fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, letterSpacing:'-.02em', marginTop:4, fontFeatureSettings:'"tnum"'}}>{val}</div>
      <div style={{fontSize:11, color: tone==='up'?'hsl(158 56% 30%)':tone==='down'?'hsl(0 68% 38%)':'hsl(24 6% 50%)', fontFamily:'var(--font-mono)', marginTop:2}}>{sub}</div>
    </div>
  );
}

function RegionBars() {
  const rows = [
    { r:'APAC',     rev:4114, share:48 },
    { r:'Americas', rev:3264, share:38 },
    { r:'EMEA',     rev:1206, share:14 },
  ];
  return (
    <div style={{
      background:'hsl(40 20% 99%)', border:'1px solid hsl(35 12% 89% / 0.6)',
      borderRadius:14, padding:18,
      boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }}>
      <div style={{fontFamily:'var(--font-display)', fontSize:15, fontWeight:500, marginBottom:4}}>By region</div>
      <div style={{fontSize:11, color:'hsl(24 6% 50%)', marginBottom:14}}>MTD revenue</div>
      {rows.map(row => (
        <div key={row.r} style={{marginBottom:12}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4}}>
            <span>{row.r}</span>
            <span style={{fontFamily:'var(--font-mono)'}}>${(row.rev/1000).toFixed(2)}M <span style={{color:'hsl(24 6% 50%)', marginLeft:6}}>{row.share}%</span></span>
          </div>
          <div style={{height:6, borderRadius:999, background:'hsl(37 14% 94%)', overflow:'hidden'}}>
            <div style={{
              width:`${row.share}%`, height:'100%',
              background: row.r==='APAC' ? 'hsl(24 10% 10%)' : row.r==='Americas' ? 'hsl(35 18% 52%)' : 'hsl(40 88% 42%)'
            }}/>
          </div>
        </div>
      ))}
      <div style={{marginTop:14, paddingTop:14, borderTop:'1px solid hsl(35 12% 89% / 0.6)',
                   fontSize:11, color:'hsl(24 6% 50%)'}}>
        Strongest MoM mover: <b style={{color:'hsl(40 88% 32%)'}}>South Korea · +18.6%</b>
      </div>
    </div>
  );
}

function AtlasAlerts() {
  const flagged = MARKETS.filter(m => m.status !== 'healthy');
  return (
    <div style={{
      background:'hsl(40 20% 99%)', border:'1px solid hsl(35 12% 89% / 0.6)',
      borderRadius:14, padding:'18px 0',
      boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }}>
      <div style={{padding:'0 18px 12px', display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <div>
          <div style={{fontFamily:'var(--font-display)', fontSize:15, fontWeight:500}}>Needs attention</div>
          <div style={{fontSize:11, color:'hsl(24 6% 50%)', marginTop:2}}>{flagged.length} markets off-healthy</div>
        </div>
        <a style={{fontSize:11, color:'hsl(40 88% 32%)', fontWeight:500}}>Alerts hub →</a>
      </div>
      {flagged.map(m => {
        const s = statusMap[m.status];
        return (
          <div key={m.c} style={{
            padding:'10px 18px', display:'flex', alignItems:'center', gap:10,
            borderTop:'1px solid hsl(35 12% 89% / 0.4)'
          }}>
            <div style={{width:22, height:16, borderRadius:3, background:'hsl(37 14% 94%)',
                         border:'1px solid hsl(35 12% 89%)', display:'flex', alignItems:'center',
                         justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:9, fontWeight:500}}>{m.flag}</div>
            <div style={{flex:1, fontSize:13, fontWeight:500}}>{m.name}</div>
            <Pill tone={s.tone}>{s.label}</Pill>
          </div>
        );
      })}
    </div>
  );
}

window.V2Cartographic = V2Cartographic;
