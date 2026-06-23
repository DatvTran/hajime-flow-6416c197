// V1 — Classic KPI board. Sidebar + KPIs + chart + detailed markets table.
function V1Classic() {
  const totalRev = MARKETS.reduce((a,m)=>a+m.rev, 0);
  const totalStock = MARKETS.reduce((a,m)=>a+m.stock, 0);
  const avgST = Math.round(MARKETS.reduce((a,m)=>a+m.st, 0)/MARKETS.length);
  const alerts = MARKETS.filter(m => m.status !== 'healthy').length;

  // monthly sell-through sparkline data (12 months)
  const spark = [72, 74, 71, 78, 81, 79, 83, 86, 88, 85, 89, 82];

  return (
    <div style={{display:'grid', gridTemplateColumns:'220px 1fr', height:'100%',
                 fontFamily:'var(--font-body)', background:'hsl(40 18% 97%)',
                 fontSize:14, color:'hsl(24 10% 10%)'}}>
      <Sidebar active="Global markets" />

      <div style={{display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <TopBar>
          <Btn variant="outline"><I d={Icons.calendar} size={14}/> MTD · Apr 2026</Btn>
          <Btn variant="outline"><I d={Icons.download} size={14}/> Export</Btn>
        </TopBar>

        <div style={{padding:'28px 36px 40px', overflow:'auto'}}>
          {/* Page head */}
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                       marginBottom:24, gap:24}}>
            <div>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <h1 style={{fontFamily:'var(--font-display)', fontSize:30, fontWeight:600,
                            letterSpacing:'-.02em', margin:0}}>Global markets</h1>
                <span style={{fontFamily:'var(--font-mono)', fontSize:11,
                              background:'hsl(37 14% 94%)', padding:'3px 10px', borderRadius:999,
                              color:'hsl(24 6% 50%)'}}>12 active · 3 in setup</span>
              </div>
              <p style={{color:'hsl(24 6% 50%)', fontSize:14, margin:'6px 0 0', maxWidth:'54ch'}}>
                One calm view of sell-through, stock cover, and in-flight shipments across every Hajime market.
              </p>
            </div>
            <div style={{display:'flex', gap:8}}>
              <Btn variant="outline"><I d={Icons.filter} size={14}/> Region</Btn>
              <Btn variant="primary"><I d={Icons.plus} size={14}/> New market</Btn>
            </div>
          </div>

          {/* KPIs */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:22}}>
            <Kpi label="REVENUE · MTD"       val={`$${(totalRev/1000).toFixed(2)}M`} sub="vs $7.16M LY" trend="+9.4%" tone="up" icon={Icons.chart} />
            <Kpi label="AVG SELL-THROUGH"    val={`${avgST}%`} sub="30-day rolling · 12 markets" trend="+2.1pts" tone="up" icon={Icons.cart} accent />
            <Kpi label="GLOBAL STOCK"        val={totalStock.toLocaleString()} sub="cases · 46d avg cover" trend="-4.2%" tone="down" icon={Icons.warehouse} />
            <Kpi label="MARKETS FLAGGED"     val={alerts} sub="3 low cover · 2 overstock"   trend="hold"   tone="flat" icon={Icons.alert} warn />
          </div>

          {/* Chart + map region breakdown */}
          <div style={{display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:16, marginBottom:22}}>
            <Card title="Revenue by region" sub="Last 12 months, $K">
              <RegionChart />
            </Card>
            <Card title="Region mix" sub="Share of MTD revenue">
              <RegionMix />
            </Card>
          </div>

          {/* Markets table */}
          <Card title="Market detail" sub="Ranked by MTD revenue" action={
            <div style={{display:'flex', gap:2, background:'hsl(37 14% 94%)', padding:3, borderRadius:8}}>
              {['All','APAC','Americas','EMEA'].map((t,i) => (
                <span key={t} style={{
                  padding:'4px 10px', fontSize:12, borderRadius:6,
                  background: i===0 ? 'hsl(40 20% 99%)' : 'transparent',
                  color: i===0 ? 'hsl(24 10% 10%)' : 'hsl(24 6% 50%)',
                  boxShadow: i===0 ? '0 1px 2px hsl(24 10% 10% / .08)' : 'none',
                  fontWeight:500, cursor:'pointer'
                }}>{t}</span>
              ))}
            </div>
          }>
            <MarketsTable rows={MARKETS.slice().sort((a,b)=>b.rev-a.rev)} />
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── KPI card ──────────────────────────────────────────────────
function Kpi({label, val, sub, trend, tone, icon, accent, warn}) {
  const bg = accent
    ? 'linear-gradient(135deg,hsl(40 55% 94%),hsl(40 50% 90% / .5))'
    : warn
    ? 'linear-gradient(135deg,hsl(30 70% 94%),hsl(30 60% 90% / .5))'
    : 'hsl(40 20% 99%)';
  const iconBg = accent ? 'hsl(40 60% 86%)' : warn ? 'hsl(30 70% 86%)' : 'hsl(37 14% 94%)';
  const iconC  = accent ? 'hsl(40 88% 32%)' : warn ? 'hsl(30 80% 35%)' : 'hsl(24 6% 50%)';
  const border = accent ? 'hsl(40 60% 80% / .5)' : warn ? 'hsl(30 70% 80% / .5)' : 'hsl(35 12% 89% / .6)';
  return (
    <div style={{
      background:bg, border:`1px solid ${border}`, borderRadius:16, padding:18,
      boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
        <div style={{fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'.1em',
                     color:'hsl(24 6% 50%)'}}>{label}</div>
        <div style={{width:36, height:36, borderRadius:10, background:iconBg, color:iconC,
                     display:'flex', alignItems:'center', justifyContent:'center'}}>
          <I d={icon} size={17}/>
        </div>
      </div>
      <div style={{fontFamily:'var(--font-display)', fontSize:28, fontWeight:600,
                   letterSpacing:'-.02em', marginTop:8, fontFeatureSettings:'"tnum"'}}>{val}</div>
      <div style={{fontSize:12, color:'hsl(24 6% 50%)', marginTop:2}}>{sub}</div>
      <div style={{display:'inline-flex', gap:3, alignItems:'center', fontSize:11,
                   fontWeight:600, marginTop:8, fontFamily:'var(--font-mono)',
                   color: tone==='up' ? 'hsl(158 56% 30%)' : tone==='down' ? 'hsl(0 68% 38%)' : 'hsl(24 6% 50%)'}}>
        {tone==='up' && <I d={Icons.up} size={12}/>}
        {tone==='down' && <I d={Icons.down} size={12}/>}
        {trend}
      </div>
    </div>
  );
}

// ─── Card shell ────────────────────────────────────────────────
function Card({title, sub, action, children}) {
  return (
    <div style={{
      background:'hsl(40 20% 99%)', border:'1px solid hsl(35 12% 89% / 0.6)',
      borderRadius:14, overflow:'hidden',
      boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between',
                   padding:'16px 18px', borderBottom:'1px solid hsl(35 12% 89% / 0.6)'}}>
        <div>
          <div style={{fontFamily:'var(--font-display)', fontSize:17, fontWeight:500,
                       letterSpacing:'-.01em'}}>{title}</div>
          {sub && <div style={{fontSize:12, color:'hsl(24 6% 50%)', marginTop:2}}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Stacked area chart (svg) — revenue by region ────────────
function RegionChart() {
  // months
  const months = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
  // APAC, Americas, EMEA per-month $K
  const apac = [2100, 2240, 2380, 2180, 2420, 2580, 2720, 3100, 3240, 3380, 3500, 3656];
  const amer = [1720, 1680, 1820, 1940, 2120, 2280, 2480, 2820, 2920, 3080, 3200, 3264];
  const emea = [1100, 1020, 1140, 1260, 1380, 1420, 1380, 1580, 1540, 1480, 1380, 1206];
  const W = 720, H = 240, pad = 32;
  const maxY = 9000;
  const x = i => pad + (i * (W - pad - 8)) / (months.length - 1);
  const y = v => H - pad - (v * (H - pad - 16)) / maxY;

  // cumulative for stack
  const stack = (arr, below) => arr.map((v,i) => v + (below ? below[i] : 0));
  const s1 = emea;
  const s2 = stack(amer, s1);
  const s3 = stack(apac, s2);
  const path = (arr) => arr.map((v,i) => `${i===0?'M':'L'} ${x(i)} ${y(v)}`).join(' ');
  const area = (top, bot) => {
    const up = top.map((v,i) => `${i===0?'M':'L'} ${x(i)} ${y(v)}`).join(' ');
    const dn = bot.slice().reverse().map((v,i) => `L ${x(bot.length-1-i)} ${y(v)}`).join(' ');
    return `${up} ${dn} Z`;
  };

  return (
    <div style={{padding:'18px 20px 16px'}}>
      <svg width="100%" height="240" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* grid */}
        {[0,1,2,3].map(i => (
          <line key={i} x1={pad} x2={W-8} y1={y(i*3000)} y2={y(i*3000)}
                stroke="hsl(35 12% 89%)" strokeWidth="1" strokeDasharray="2 3"/>
        ))}
        {/* y labels */}
        {[0,3,6,9].map(v => (
          <text key={v} x={pad-6} y={y(v*1000)+3} fontSize="9" fontFamily="var(--font-mono)"
                fill="hsl(24 6% 50%)" textAnchor="end">{v?`$${v}K`:'0'}</text>
        ))}
        {/* stacked areas */}
        <path d={area(s1, s1.map(()=>0))} fill="hsl(40 88% 42% / 0.7)"/>
        <path d={area(s2, s1)}            fill="hsl(24 10% 10% / 0.75)"/>
        <path d={area(s3, s2)}            fill="hsl(35 18% 62% / 0.55)"/>
        {/* top line for definition */}
        <path d={path(s3)} fill="none" stroke="hsl(24 10% 10%)" strokeWidth="1.2"/>
        {/* x labels */}
        {months.map((m,i) => (
          <text key={m} x={x(i)} y={H-8} fontSize="9" fontFamily="var(--font-mono)"
                fill="hsl(24 6% 50%)" textAnchor="middle">{m}</text>
        ))}
      </svg>
      <div style={{display:'flex', gap:20, fontSize:11, color:'hsl(24 6% 50%)',
                   marginTop:10, fontFamily:'var(--font-body)'}}>
        <Legend sw="hsl(35 18% 62%)"   label="APAC"/>
        <Legend sw="hsl(24 10% 10%)"   label="Americas"/>
        <Legend sw="hsl(40 88% 42%)"   label="EMEA"/>
      </div>
    </div>
  );
}
const Legend = ({sw, label}) => (
  <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
    <span style={{width:8, height:8, borderRadius:2, background:sw}}/>{label}
  </span>
);

// ─── Region mix — donut + list ────────────────────────────────
function RegionMix() {
  const regions = [
    { label:'APAC',     val: 4114, c:'hsl(35 18% 52%)' },
    { label:'Americas', val: 3264, c:'hsl(24 10% 10%)' },
    { label:'EMEA',     val: 1206, c:'hsl(40 88% 42%)' },
  ];
  const total = regions.reduce((a,r)=>a+r.val, 0);
  let off = 0;
  const R = 56, CX = 80, CY = 90, STROKE = 18;
  const C = 2 * Math.PI * R;
  return (
    <div style={{padding:'18px 20px'}}>
      <div style={{display:'flex', alignItems:'center', gap:24}}>
        <svg width={160} height={180}>
          <circle cx={CX} cy={CY} r={R} stroke="hsl(37 14% 94%)" strokeWidth={STROKE} fill="none"/>
          {regions.map((r,i) => {
            const frac = r.val / total;
            const len = C * frac;
            const el = (
              <circle key={r.label} cx={CX} cy={CY} r={R}
                stroke={r.c} strokeWidth={STROKE} fill="none"
                strokeDasharray={`${len} ${C-len}`} strokeDashoffset={-off}
                transform={`rotate(-90 ${CX} ${CY})`}/>
            );
            off += len;
            return el;
          })}
          <text x={CX} y={CY-2} textAnchor="middle" fontFamily="var(--font-display)"
                fontSize="22" fontWeight="600" fill="hsl(24 10% 10%)">$8.6M</text>
          <text x={CX} y={CY+14} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)"
                fill="hsl(24 6% 50%)" letterSpacing="0.1em">MTD REVENUE</text>
        </svg>
        <div style={{flex:1, display:'flex', flexDirection:'column', gap:12}}>
          {regions.map(r => (
            <div key={r.label} style={{display:'flex', alignItems:'center', gap:10, fontSize:13}}>
              <span style={{width:10, height:10, borderRadius:2, background:r.c, flexShrink:0}}/>
              <span style={{flex:1, color:'hsl(24 10% 10%)'}}>{r.label}</span>
              <span style={{fontFamily:'var(--font-mono)', fontSize:12, fontWeight:500, color:'hsl(24 10% 10%)'}}>
                ${(r.val/1000).toFixed(2)}M
              </span>
              <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'hsl(24 6% 50%)',
                            width:38, textAlign:'right'}}>
                {Math.round(r.val/total*100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{marginTop:18, paddingTop:14, borderTop:'1px solid hsl(35 12% 89% / 0.6)',
                   fontSize:12, color:'hsl(24 6% 50%)', lineHeight:1.5}}>
        APAC remains the center of gravity — Japan and the US alone carry <b style={{color:'hsl(24 10% 10%)', fontWeight:600}}>56%</b> of MTD revenue.
      </div>
    </div>
  );
}

// ─── Markets table ────────────────────────────────────────────
function MarketsTable({rows}) {
  return (
    <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, fontFamily:'var(--font-body)'}}>
      <thead>
        <tr>
          {['Market','Region','Stores','Sell-through','Cover days','On-hand','In transit','MTD revenue','Status'].map((h,i) => (
            <th key={h} style={{
              textAlign: i>=2 ? 'right' : 'left',
              padding:'10px 18px', fontWeight:500, color:'hsl(24 6% 50%)',
              fontSize:10, textTransform:'uppercase', letterSpacing:'.08em',
              borderBottom:'1px solid hsl(35 12% 89% / 0.6)',
              background:'hsl(37 14% 94% / 0.3)'
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(m => {
          const s = statusMap[m.status];
          return (
            <tr key={m.c}>
              <td style={tdStyle}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{
                    width:26, height:18, borderRadius:3, background:'hsl(37 14% 94%)',
                    border:'1px solid hsl(35 12% 89%)', display:'flex', alignItems:'center',
                    justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:10,
                    fontWeight:500, color:'hsl(24 10% 10%)'
                  }}>{m.flag}</div>
                  <span style={{fontWeight:500}}>{m.name}</span>
                </div>
              </td>
              <td style={tdStyle}>
                <span style={{color:'hsl(24 6% 50%)', fontSize:12}}>{m.region}</span>
              </td>
              <td style={tdRight}>{m.stores}</td>
              <td style={tdRight}>
                <div style={{display:'inline-flex', alignItems:'center', gap:8}}>
                  <div style={{width:48, height:4, borderRadius:999, background:'hsl(37 14% 94%)', overflow:'hidden'}}>
                    <div style={{width:`${m.st}%`, height:'100%', background: m.st >= 85 ? 'hsl(158 56% 36%)' : m.st >= 75 ? 'hsl(40 88% 42%)' : 'hsl(38 90% 50%)'}}/>
                  </div>
                  <span style={{fontFamily:'var(--font-mono)', minWidth:30, fontSize:12}}>{m.st}%</span>
                </div>
              </td>
              <td style={tdRight}>
                <span style={{fontFamily:'var(--font-mono)', fontSize:12,
                              color: m.cover < 30 ? 'hsl(0 68% 38%)' : m.cover > 70 ? 'hsl(215 72% 38%)' : 'hsl(24 10% 10%)'}}>
                  {m.cover}d
                </span>
              </td>
              <td style={tdRight}>{m.stock.toLocaleString()}</td>
              <td style={tdRight}>
                {m.intran > 0
                  ? <span style={{display:'inline-flex', alignItems:'center', gap:6, fontFamily:'var(--font-mono)', fontSize:12}}>
                      <I d={Icons.truck} size={12} style={{color:'hsl(215 72% 50%)'}}/>
                      {m.intran}
                    </span>
                  : <span style={{color:'hsl(24 6% 50%)', fontFamily:'var(--font-mono)', fontSize:12}}>—</span>
                }
              </td>
              <td style={{...tdRight, fontFamily:'var(--font-mono)', fontWeight:500}}>${m.rev.toLocaleString()}</td>
              <td style={tdRight}>
                <Pill tone={s.tone}><Dot tone={s.tone}/>{s.label}</Pill>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
const tdStyle = {padding:'10px 18px', borderBottom:'1px solid hsl(35 12% 89% / 0.4)', verticalAlign:'middle'};
const tdRight = {...tdStyle, textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12};

window.V1Classic = V1Classic;
