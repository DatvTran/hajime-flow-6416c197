// V3 — Ops timeline. Horizontal time spine foregrounding shipment motion.
function V3Timeline() {
  return (
    <div style={{display:'grid', gridTemplateColumns:'220px 1fr', height:'100%',
                 fontFamily:'var(--font-body)', background:'hsl(40 18% 97%)',
                 fontSize:14, color:'hsl(24 10% 10%)'}}>
      <Sidebar active="Global markets" />

      <div style={{display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <TopBar>
          <Btn variant="outline"><I d={Icons.calendar} size={14}/> Apr 1 — Apr 30</Btn>
          <Btn variant="primary"><I d={Icons.plus} size={14}/> Schedule shipment</Btn>
        </TopBar>

        <div style={{padding:'24px 36px 40px', overflow:'auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20}}>
            <div>
              <div style={{fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'.14em',
                           color:'hsl(24 6% 50%)', marginBottom:6}}>Global markets · ops timeline</div>
              <h1 style={{fontFamily:'var(--font-display)', fontSize:30, fontWeight:600,
                          letterSpacing:'-.02em', margin:0}}>The month, in motion.</h1>
              <p style={{color:'hsl(24 6% 50%)', fontSize:14, margin:'6px 0 0', maxWidth:'56ch'}}>
                Every market on one spine. Revenue rhythm on top; shipments, launches, and depletion events flow below.
              </p>
            </div>
            <RhythmStrip/>
          </div>

          {/* Revenue rhythm strip */}
          <div style={{
            background:'hsl(40 20% 99%)', border:'1px solid hsl(35 12% 89% / 0.6)',
            borderRadius:14, padding:'18px 24px', marginBottom:14,
            boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
          }}>
            <DailyRevenue/>
          </div>

          {/* Gantt-style market tracks */}
          <div style={{
            background:'hsl(40 20% 99%)', border:'1px solid hsl(35 12% 89% / 0.6)',
            borderRadius:14, overflow:'hidden',
            boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
          }}>
            <MarketTracks/>
          </div>
        </div>
      </div>
    </div>
  );
}

function RhythmStrip() {
  return (
    <div style={{display:'flex', gap:14, alignItems:'flex-end'}}>
      <MicroStat label="Shipments in transit" val="24" sub="8 delivering this week"/>
      <div style={{width:1, height:40, background:'hsl(35 12% 89%)'}}/>
      <MicroStat label="Avg MoM growth" val="+6.8%" sub="12 markets" tone="up"/>
      <div style={{width:1, height:40, background:'hsl(35 12% 89%)'}}/>
      <MicroStat label="Events · this week" val="7" sub="3 launches · 4 audits"/>
    </div>
  );
}
function MicroStat({label, val, sub, tone}) {
  return (
    <div>
      <div style={{fontSize:9, textTransform:'uppercase', letterSpacing:'.1em', color:'hsl(24 6% 50%)', fontWeight:500}}>{label}</div>
      <div style={{fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, letterSpacing:'-.02em', marginTop:2, color: tone==='up' ? 'hsl(158 56% 30%)' : 'hsl(24 10% 10%)', fontFeatureSettings:'"tnum"'}}>{val}</div>
      <div style={{fontSize:11, color:'hsl(24 6% 50%)'}}>{sub}</div>
    </div>
  );
}

// Daily revenue mini-bars Apr 1-30 stacked by region
function DailyRevenue() {
  const days = 30;
  // synth: baseline with a mild sine + uplift
  const data = Array.from({length:days}, (_, i) => {
    const base = 240 + Math.sin(i*0.6) * 40 + (i < 5 ? -30 : 0) + (i > 22 ? 30 : 0);
    return {
      apac: Math.round(base * 0.48 + Math.random()*10),
      amer: Math.round(base * 0.38 + Math.random()*10),
      emea: Math.round(base * 0.14 + Math.random()*6),
      d: i+1,
    };
  });
  const W = 1100, H = 120, pad = 24;
  const bw = (W - pad*2) / days * 0.72;
  const gap = (W - pad*2) / days - bw;
  const maxV = Math.max(...data.map(d => d.apac+d.amer+d.emea)) + 20;
  const y = v => H - 20 - (v / maxV) * (H - 44);

  return (
    <div>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12}}>
        <div>
          <div style={{fontFamily:'var(--font-display)', fontSize:15, fontWeight:500}}>Daily revenue · April</div>
          <div style={{fontSize:11, color:'hsl(24 6% 50%)', marginTop:2}}>Stacked by region · $K</div>
        </div>
        <div style={{display:'flex', gap:16, fontSize:11, color:'hsl(24 6% 50%)'}}>
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            <span style={{width:8, height:8, borderRadius:2, background:'hsl(24 10% 10%)'}}/>APAC</span>
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            <span style={{width:8, height:8, borderRadius:2, background:'hsl(35 18% 52%)'}}/>Americas</span>
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            <span style={{width:8, height:8, borderRadius:2, background:'hsl(40 88% 42%)'}}/>EMEA</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', height:120, display:'block'}}>
        {/* weekend shading */}
        {data.map((_, i) => {
          const dow = (i + 2) % 7; // Apr 1 2026 is a Wed; weekend = Sat(4), Sun(5)
          if (dow !== 4 && dow !== 5) return null;
          return <rect key={'w'+i} x={pad + i*(bw+gap) - gap/2} y={8} width={bw+gap} height={H-28} fill="hsl(37 14% 94% / 0.4)"/>;
        })}
        {/* bars */}
        {data.map((d, i) => {
          const x = pad + i * (bw + gap);
          const total = d.apac + d.amer + d.emea;
          const yEmea = y(total);
          const yAmer = y(d.apac + d.amer);
          const yApac = y(d.apac);
          const yBase = H - 20;
          return (
            <g key={i}>
              <rect x={x} y={yEmea} width={bw} height={yAmer-yEmea} fill="hsl(40 88% 42%)" opacity="0.9"/>
              <rect x={x} y={yAmer} width={bw} height={yApac-yAmer} fill="hsl(35 18% 52%)"/>
              <rect x={x} y={yApac} width={bw} height={yBase-yApac} fill="hsl(24 10% 10%)"/>
            </g>
          );
        })}
        {/* axis markers */}
        {[1, 8, 15, 22, 30].map(d => (
          <g key={d}>
            <line x1={pad + (d-1)*(bw+gap) + bw/2} x2={pad + (d-1)*(bw+gap) + bw/2} y1={H-18} y2={H-14} stroke="hsl(24 6% 50%)" strokeWidth="0.8"/>
            <text x={pad + (d-1)*(bw+gap) + bw/2} y={H-4} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="hsl(24 6% 50%)">{d}</text>
          </g>
        ))}
        {/* today indicator */}
        <line x1={pad + 17*(bw+gap) + bw/2} x2={pad + 17*(bw+gap) + bw/2} y1={8} y2={H-18}
              stroke="hsl(40 88% 42%)" strokeWidth="1" strokeDasharray="3 3"/>
        <text x={pad + 17*(bw+gap) + bw/2} y={14} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="hsl(40 88% 32%)" fontWeight="600">TODAY · 18 APR</text>
      </svg>
    </div>
  );
}

// Market tracks — each row a horizontal timeline with shipment bars + events
function MarketTracks() {
  // synth events for each market over Apr 1-30
  const events = {
    JP: [{type:'ship', s:2, e:10, label:'Kobe → Tokyo DC · 3,200 cs'}, {type:'event', d:22, label:'Depletion audit'}],
    US: [{type:'ship', s:1, e:14, label:'Osaka → LA · 4,100 cs'}, {type:'ship', s:18, e:29, label:'Osaka → NJ · 2,800 cs', tone:'gold'}, {type:'event', d:15, label:'NY launch · Masa'}],
    SG: [{type:'ship', s:4, e:12, label:'Osaka → SG · 620 cs'}, {type:'ship', s:20, e:28, label:'Top-up · 340 cs', tone:'gold'}],
    HK: [{type:'ship', s:6, e:13, label:'Osaka → HK · 480 cs'}, {type:'event', d:24, label:'Peninsula tasting'}],
    GB: [{type:'event', d:9, label:'Inventory freeze'}, {type:'alert', d:17, label:'Cover > 80d · review'}],
    DE: [{type:'event', d:12, label:'Berlin trade show'}, {type:'alert', d:19, label:'Overstock · Frankfurt'}],
    FR: [{type:'ship', s:10, e:19, label:'Osaka → CDG · 560 cs'}, {type:'event', d:26, label:'Le Clarence menu drop'}],
    CA: [{type:'ship', s:3, e:15, label:'Osaka → YVR · 380 cs'}],
    AU: [{type:'ship', s:7, e:22, label:'Osaka → MEL · 290 cs'}, {type:'ship', s:24, e:30, label:'Top-up · 180 cs', tone:'gold'}],
    KR: [{type:'ship', s:2, e:8, label:'Osaka → ICN · 220 cs'}, {type:'ship', s:11, e:17, label:'Urgent · 180 cs', tone:'red'}, {type:'ship', s:21, e:28, label:'Osaka → ICN · 260 cs', tone:'gold'}, {type:'event', d:20, label:'K-spirits week'}],
    AE: [{type:'ship', s:5, e:16, label:'Osaka → DXB · 140 cs'}, {type:'ship', s:22, e:30, label:'Urgent · 90 cs', tone:'red'}],
    TW: [{type:'ship', s:8, e:16, label:'Osaka → TPE · 320 cs'}],
  };

  const days = 30;
  const W = 1100, LABEL_W = 180, ROW_H = 40;
  const trackW = W - LABEL_W - 20;
  const dx = d => LABEL_W + ((d-1) / (days-1)) * trackW;

  return (
    <div>
      <div style={{padding:'14px 18px', borderBottom:'1px solid hsl(35 12% 89% / 0.6)',
                   display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <div style={{fontFamily:'var(--font-display)', fontSize:16, fontWeight:500}}>Market tracks</div>
          <div style={{fontSize:11, color:'hsl(24 6% 50%)', marginTop:2}}>
            <span style={{fontFamily:'var(--font-mono)', fontWeight:500, color:'hsl(24 10% 10%)'}}>━━</span> shipment &nbsp;·&nbsp;
            <span style={{display:'inline-block', width:6, height:6, borderRadius:999, background:'hsl(24 10% 10%)', verticalAlign:'middle'}}></span> event &nbsp;·&nbsp;
            <span style={{display:'inline-block', width:6, height:6, borderRadius:999, background:'hsl(0 68% 48%)', verticalAlign:'middle'}}></span> alert
          </div>
        </div>
        <div style={{display:'flex', gap:14, fontSize:11, color:'hsl(24 6% 50%)', fontFamily:'var(--font-mono)'}}>
          <span>Apr 2026</span>
          <span>·</span>
          <span>30 days</span>
        </div>
      </div>

      <div style={{position:'relative'}}>
        {/* date ruler */}
        <svg viewBox={`0 0 ${W} 22`} style={{width:'100%', height:22, display:'block', borderBottom:'1px solid hsl(35 12% 89% / 0.6)'}}>
          {[1,5,10,15,20,25,30].map(d => (
            <g key={d}>
              <text x={dx(d)} y={14} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="hsl(24 6% 50%)">{d}</text>
            </g>
          ))}
          <line x1={dx(18)} x2={dx(18)} y1={0} y2={22} stroke="hsl(40 88% 42%)" strokeWidth="1" strokeDasharray="2 2"/>
        </svg>

        {/* rows */}
        <svg viewBox={`0 0 ${W} ${MARKETS.length * ROW_H + 20}`}
             style={{width:'100%', height:MARKETS.length * ROW_H + 20, display:'block'}}>
          {/* today line */}
          <line x1={dx(18)} x2={dx(18)} y1={0} y2={MARKETS.length * ROW_H}
                stroke="hsl(40 88% 42%)" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
          {/* weekend shading */}
          {Array.from({length:30}).map((_,i) => {
            const dow = (i + 2) % 7;
            if (dow !== 4 && dow !== 5) return null;
            const x0 = dx(i+1) - (trackW/days)/2;
            return <rect key={'w'+i} x={x0} y={0} width={trackW/days} height={MARKETS.length * ROW_H} fill="hsl(37 14% 94% / 0.35)"/>;
          })}

          {MARKETS.map((m, idx) => {
            const y0 = idx * ROW_H;
            const evs = events[m.c] || [];
            const s = statusMap[m.status];
            const toneFill = s.tone === 'green' ? 'hsl(158 56% 36%)'
                           : s.tone === 'amber' ? 'hsl(38 90% 50%)'
                           : 'hsl(215 72% 50%)';
            return (
              <g key={m.c}>
                {/* row separator */}
                {idx > 0 && <line x1={0} x2={W} y1={y0} y2={y0} stroke="hsl(35 12% 89% / 0.5)" strokeWidth="1"/>}
                {/* label column */}
                <rect x={0} y={y0} width={LABEL_W} height={ROW_H} fill="hsl(40 20% 99%)"/>
                <line x1={LABEL_W} x2={LABEL_W} y1={y0} y2={y0+ROW_H} stroke="hsl(35 12% 89%)" strokeWidth="1"/>
                {/* flag */}
                <rect x={14} y={y0 + ROW_H/2 - 9} width={24} height={18} rx="3" fill="hsl(37 14% 94%)" stroke="hsl(35 12% 89%)"/>
                <text x={26} y={y0 + ROW_H/2 + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fontWeight="600" fill="hsl(24 10% 10%)">{m.flag}</text>
                <text x={46} y={y0 + ROW_H/2 + 1} fontFamily="var(--font-body)" fontSize="12" fontWeight="500" fill="hsl(24 10% 10%)">{m.name}</text>
                <text x={46} y={y0 + ROW_H/2 + 14} fontFamily="var(--font-mono)" fontSize="9" fill="hsl(24 6% 50%)">
                  {m.cover}d cover · ${(m.rev/1000).toFixed(1)}M
                </text>
                {/* status dot */}
                <circle cx={LABEL_W - 12} cy={y0 + ROW_H/2} r="3.5" fill={toneFill}/>

                {/* track baseline */}
                <line x1={LABEL_W + 8} x2={W - 8} y1={y0 + ROW_H/2} y2={y0 + ROW_H/2}
                      stroke="hsl(35 12% 89%)" strokeWidth="1" strokeDasharray="2 3"/>

                {/* events */}
                {evs.map((e, i) => {
                  if (e.type === 'ship') {
                    const x1 = dx(e.s), x2 = dx(e.e);
                    const barFill = e.tone === 'red' ? 'hsl(0 68% 48%)'
                                  : e.tone === 'gold' ? 'hsl(40 88% 42%)'
                                  : 'hsl(24 10% 10%)';
                    return (
                      <g key={i}>
                        <rect x={x1} y={y0 + ROW_H/2 - 6} width={x2-x1} height={12} rx="2"
                              fill={barFill} opacity="0.88"/>
                        {(x2-x1) > 70 && (
                          <text x={x1+6} y={y0 + ROW_H/2 + 3} fontFamily="var(--font-body)" fontSize="9.5"
                                fill="hsl(40 20% 97%)" fontWeight="500">{e.label}</text>
                        )}
                      </g>
                    );
                  } else if (e.type === 'event') {
                    const x = dx(e.d);
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y0 + ROW_H/2} r="5" fill="hsl(40 20% 99%)" stroke="hsl(24 10% 10%)" strokeWidth="1.3"/>
                        <circle cx={x} cy={y0 + ROW_H/2} r="2" fill="hsl(24 10% 10%)"/>
                      </g>
                    );
                  } else {
                    const x = dx(e.d);
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y0 + ROW_H/2} r="5" fill="hsl(0 68% 48% / 0.12)" stroke="hsl(0 68% 48%)" strokeWidth="1.3"/>
                        <circle cx={x} cy={y0 + ROW_H/2} r="2" fill="hsl(0 68% 48%)"/>
                      </g>
                    );
                  }
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* footer caption strip */}
      <div style={{padding:'12px 18px', borderTop:'1px solid hsl(35 12% 89% / 0.6)',
                   background:'hsl(37 14% 94% / 0.4)', display:'flex', justifyContent:'space-between',
                   fontSize:11, color:'hsl(24 6% 50%)'}}>
        <span>24 shipments tracked · 7 events scheduled · 3 alerts open</span>
        <span style={{fontFamily:'var(--font-mono)'}}>Updated 14:32 JST</span>
      </div>
    </div>
  );
}

window.V3Timeline = V3Timeline;
