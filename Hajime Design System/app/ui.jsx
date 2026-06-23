// app/ui.jsx — Shared UI primitives

// ─── Design tokens (mirror colors_and_type.css vars) ────────
const T = {
  paper:    'hsl(40 18% 97%)',
  paper2:   'hsl(40 20% 99%)',
  ink:      'hsl(24 10% 10%)',
  inkDeep:  'hsl(24 12% 8%)',
  muted:    'hsl(24 6% 50%)',
  border:   'hsl(35 12% 89%)',
  borderQ:  'hsl(35 12% 89% / 0.6)',
  card:     'hsl(40 20% 99%)',
  surface:  'hsl(37 14% 94%)',
  gold:     'hsl(40 88% 42%)',
  green:    'hsl(158 56% 36%)',
  amber:    'hsl(38 90% 50%)',
  red:      'hsl(0 68% 48%)',
  blue:     'hsl(215 72% 50%)',
  display:  "'Cormorant Garamond', Georgia, serif",
  body:     "'DM Sans', system-ui, sans-serif",
  mono:     "'JetBrains Mono', Menlo, monospace",
};

// ─── Icon helper ─────────────────────────────────────────────
const Ico = ({d, size=16, stroke=1.65, c, style={}}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={c||'currentColor'} strokeWidth={stroke} strokeLinecap="round"
    strokeLinejoin="round" style={{flexShrink:0,...style}}>{d}</svg>
);

// ─── Icon set ────────────────────────────────────────────────
const IC = {
  dash:   <><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>,
  globe:  <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></>,
  box:    <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></>,
  cart:   <><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></>,
  users:  <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  file:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  factory:<><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></>,
  truck:  <><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></>,
  chart:  <><path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/></>,
  bell:   <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  alert:  <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  plus:   <><path d="M5 12h14M12 5v14"/></>,
  check:  <><path d="m5 12 5 5L20 7"/></>,
  x:      <><path d="M18 6 6 18M6 6l12 12"/></>,
  chevR:  <><path d="m9 18 6-6-6-6"/></>,
  chevL:  <><path d="m15 18-6-6 6-6"/></>,
  chevD:  <><path d="m6 9 6 6 6-6"/></>,
  chevU:  <><path d="m18 15-6-6-6 6"/></>,
  trendU: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  trendD: <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>,
  arrow:  <><path d="M5 12h14M13 5l7 7-7 7"/></>,
  arrowL: <><path d="M19 12H5M11 19l-7-7 7-7"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  store:  <><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></>,
  whouse: <><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z"/><path d="M6 18h12M6 14h12M6 10h12"/></>,
  pin:    <><path d="M12 22s-8-4.5-8-12a8 8 0 0 1 16 0c0 7.5-8 12-8 12z"/><circle cx="12" cy="10" r="3"/></>,
  receipt:<><path d="M16 2v4M8 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/></>,
  more:   <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  refresh:<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></>,
  mic:    <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/></>,
  note:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  filter: <><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></>,
  sort:   <><path d="m3 16 4 4 4-4M7 20V4M17 8l4-4-4-4M21 4H11M21 12H11M21 20h-6"/></>,
  dl:     <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
  eye:    <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  tag:    <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
};

// ─── Badge / Pill ─────────────────────────────────────────────
const STATUS_TONES = {
  available:   'green', active: 'green', delivered: 'green', approved: 'green', paid: 'green', completed: 'green', healthy: 'green',
  pending:     'amber', reserved: 'amber', preparing: 'amber', 'pending-review': 'amber',
  draft:       'stone',  inactive: 'stone', 'in-production': 'stone',
  'in-transit':'blue',  confirmed: 'blue',  shipped: 'blue', development: 'blue',
  cancelled:   'red',   overdue: 'red', damaged: 'red', delayed: 'red', high: 'red',
  limited:     'gold',  prospect: 'gold', medium: 'gold',
};
const TONE_STYLES = {
  green: {bg:'hsl(158 56% 36% / .08)', c:'hsl(158 56% 24%)', br:'hsl(158 56% 36% / .22)'},
  amber: {bg:'hsl(38 90% 50% / .10)',  c:'hsl(30 80% 28%)',  br:'hsl(38 90% 50% / .28)'},
  stone: {bg:'hsl(30 10% 55% / .10)',  c:'hsl(30 10% 32%)',  br:'hsl(30 10% 55% / .22)'},
  blue:  {bg:'hsl(215 72% 50% / .08)', c:'hsl(215 72% 36%)', br:'hsl(215 72% 50% / .22)'},
  red:   {bg:'hsl(0 68% 48% / .08)',   c:'hsl(0 68% 34%)',   br:'hsl(0 68% 48% / .22)'},
  gold:  {bg:'hsl(40 88% 42% / .10)',  c:'hsl(40 88% 28%)',  br:'hsl(40 88% 42% / .28)'},
  ink:   {bg:'hsl(24 10% 10% / .9)',   c:'hsl(40 20% 97%)',  br:'transparent'},
};

function Badge({status, label, dot=true, size='sm', custom}) {
  const tone = custom || STATUS_TONES[status] || 'stone';
  const s = TONE_STYLES[tone] || TONE_STYLES.stone;
  const txt = label || (status||'').replace(/-/g,' ');
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, borderRadius:999,
      padding: size==='xs'?'1px 7px':'2px 9px',
      fontSize: size==='xs'?10:11, fontWeight:500, fontFamily:T.body,
      background:s.bg, color:s.c, border:`1px solid ${s.br}`, whiteSpace:'nowrap'
    }}>
      {dot && <span style={{width:5,height:5,borderRadius:999,background:s.c,flexShrink:0}}/>}
      {txt}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────
function Btn({v='outline', sz='md', icon, iconR, onClick, disabled, children, style={}}) {
  const vs = {
    primary:{bg:T.ink,    c:T.paper, br:'transparent'},
    accent: {bg:T.gold,   c:T.paper, br:'transparent'},
    outline:{bg:T.paper,  c:T.ink,   br:T.border},
    ghost:  {bg:'transparent', c:T.ink, br:'transparent'},
    soft:   {bg:T.surface, c:T.ink,  br:'transparent'},
    danger: {bg:'hsl(0 68% 48%)', c:'#fff', br:'transparent'},
  };
  const sizes = {xs:{h:26,px:8,fs:11}, sm:{h:30,px:10,fs:12}, md:{h:34,px:14,fs:13}, lg:{h:40,px:18,fs:14}};
  const V = vs[v]||vs.outline; const S = sizes[sz]||sizes.md;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
      height:S.h, padding:`0 ${S.px}px`, fontSize:S.fs, fontWeight:500,
      borderRadius:8, border:`1px solid ${V.br}`, background:V.bg, color:V.c,
      cursor: disabled?'not-allowed':'pointer', opacity: disabled?.55:1,
      fontFamily:T.body, whiteSpace:'nowrap', transition:'opacity .15s', ...style
    }}>
      {icon && <Ico d={icon} size={S.fs+2}/>}
      {children}
      {iconR && <Ico d={iconR} size={S.fs+2}/>}
    </button>
  );
}

// ─── Input / Select ───────────────────────────────────────────
function Input({value, onChange, placeholder, type='text', mono, style={}}) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
      height:34, padding:'0 10px', borderRadius:8, border:`1px solid ${T.border}`,
      background:T.paper, color:T.ink, fontSize:13, fontFamily: mono?T.mono:T.body,
      outline:'none', width:'100%', ...style
    }}/>
  );
}

function Textarea({value, onChange, placeholder, rows=3, style={}}) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{
      padding:'8px 10px', borderRadius:8, border:`1px solid ${T.border}`,
      background:T.paper, color:T.ink, fontSize:13, fontFamily:T.body,
      outline:'none', width:'100%', resize:'vertical', ...style
    }}/>
  );
}

function Select({value, onChange, options=[], style={}}) {
  return (
    <select value={value} onChange={onChange} style={{
      height:34, padding:'0 28px 0 10px', borderRadius:8, border:`1px solid ${T.border}`,
      background:T.paper, color:T.ink, fontSize:13, fontFamily:T.body,
      outline:'none', appearance:'none', cursor:'pointer', ...style
    }}>
      {options.map(o => (
        <option key={o.value||o} value={o.value||o}>{o.label||o}</option>
      ))}
    </select>
  );
}

function Field({label, hint, children, style={}}) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6, ...style}}>
      {label && <label style={{fontSize:12, fontWeight:500, color:T.muted}}>{label}</label>}
      {children}
      {hint && <div style={{fontSize:11, color:T.muted}}>{hint}</div>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────
function Card({children, padded=true, elev=1, style={}}) {
  const shadows = ['none','0 1px 2px hsl(24 10% 10%/.04),0 4px 12px hsl(24 10% 10%/.03)','0 2px 4px hsl(24 10% 10%/.06),0 8px 24px hsl(24 10% 10%/.06)'];
  return (
    <div style={{background:T.card, border:`1px solid ${T.borderQ}`, borderRadius:14,
      boxShadow:shadows[elev]||shadows[1], padding:padded?20:0, ...style}}>{children}</div>
  );
}

// ─── Stat card ────────────────────────────────────────────────
function StatCard({label, value, sub, icon, tone='stone', trend, link, onClick}) {
  const tones = {
    stone:{bg:T.card,       ico:T.surface, icoC:T.muted, br:T.borderQ},
    gold: {bg:'linear-gradient(135deg,hsl(40 55% 94%),hsl(40 50% 90%/.5))', ico:'hsl(40 60% 86%)', icoC:'hsl(40 88% 30%)', br:'hsl(40 60% 80%/.5)'},
    warm: {bg:'linear-gradient(135deg,hsl(30 70% 94%),hsl(30 60% 90%/.5))', ico:'hsl(30 70% 86%)', icoC:'hsl(30 80% 35%)', br:'hsl(30 70% 80%/.5)'},
    green:{bg:'linear-gradient(135deg,hsl(158 40% 94%),hsl(158 40% 90%/.5))',ico:'hsl(158 40% 86%)', icoC:'hsl(158 56% 24%)', br:'hsl(158 40% 80%/.5)'},
  };
  const s = tones[tone]||tones.stone;
  const inner = (
    <>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
        <div style={{fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'.1em', color:T.muted}}>{label}</div>
        {icon && <div style={{width:34,height:34,borderRadius:10,background:s.ico,color:s.icoC,display:'flex',alignItems:'center',justifyContent:'center'}}><Ico d={icon} size={17}/></div>}
      </div>
      <div style={{fontFamily:T.display, fontSize:28, fontWeight:600, letterSpacing:'-.02em', marginTop:8, fontFeatureSettings:"'tnum'"}}>{value}</div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
        {trend!=null && <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:11,fontWeight:600,color:trend>=0?T.green:T.red,fontFamily:T.mono}}>
          <Ico d={trend>=0?IC.trendU:IC.trendD} size={11} stroke={2}/>{trend>=0?'+':''}{trend}%
        </span>}
        {sub && <span style={{fontSize:12,color:T.muted}}>{sub}</span>}
      </div>
    </>
  );
  const base = {background:s.bg, border:`1px solid ${s.br}`, borderRadius:14, padding:18, boxShadow:'0 1px 2px hsl(24 10% 10%/.04),0 4px 12px hsl(24 10% 10%/.03)'};
  if (onClick||link) return <div onClick={onClick||link} style={{...base,cursor:'pointer'}}>{inner}</div>;
  return <div style={base}>{inner}</div>;
}

// ─── Data table ───────────────────────────────────────────────
function Table({cols, rows, onRow, emptyMsg='No records found', style={}}) {
  const [sortCol, setSortCol] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const [search,  setSearch]  = React.useState('');

  const sorted = React.useMemo(() => {
    let r = rows;
    if (search) r = r.filter(row => JSON.stringify(Object.values(row)).toLowerCase().includes(search.toLowerCase()));
    if (sortCol) r = [...r].sort((a,b) => {
      const av = a[sortCol], bv = b[sortCol];
      const cmp = typeof av==='number' ? av-bv : String(av||'').localeCompare(String(bv||''));
      return sortDir==='asc'?cmp:-cmp;
    });
    return r;
  }, [rows, sortCol, sortDir, search]);

  const toggle = (key) => { if (sortCol===key) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortCol(key); setSortDir('asc'); } };

  return (
    <div style={style}>
      <div style={{padding:'10px 16px', borderBottom:`1px solid ${T.borderQ}`, display:'flex', alignItems:'center', gap:8}}>
        <div style={{display:'flex', alignItems:'center', gap:8, padding:'0 10px', height:32, background:T.surface, borderRadius:8, minWidth:240, flex:1, maxWidth:400}}>
          <Ico d={IC.search} size={13} style={{color:T.muted}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{border:'none',background:'transparent',outline:'none',fontSize:13,fontFamily:T.body,color:T.ink,flex:1}}/>
        </div>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.muted,marginLeft:'auto'}}>{sorted.length} rows</div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,fontFamily:T.body}}>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key||c.label} onClick={c.sortable!==false?()=>toggle(c.key||c.label):undefined} style={{
                  textAlign:c.right?'right':'left', padding:'10px 16px',
                  fontWeight:500, color:T.muted, fontSize:11, textTransform:'uppercase', letterSpacing:'.07em',
                  borderBottom:`1px solid ${T.borderQ}`, background:`${T.surface}88`,
                  cursor:c.sortable!==false?'pointer':'default', whiteSpace:'nowrap',
                  userSelect:'none'
                }}>
                  <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
                    {c.label}
                    {sortCol===(c.key||c.label) && <Ico d={sortDir==='asc'?IC.chevU:IC.chevD} size={11}/>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length===0 ? (
              <tr><td colSpan={cols.length} style={{textAlign:'center',padding:40,color:T.muted,fontSize:14}}>{emptyMsg}</td></tr>
            ) : sorted.map((row,i) => (
              <tr key={row.id||i} onClick={onRow?()=>onRow(row):undefined} style={{borderBottom:`1px solid ${T.borderQ}`, cursor:onRow?'pointer':'default', transition:'background .12s'}}
                onMouseEnter={e=>{if(onRow)e.currentTarget.style.background=T.surface}}
                onMouseLeave={e=>{e.currentTarget.style.background=''}}>
                {cols.map(c => (
                  <td key={c.key||c.label} style={{
                    padding:'12px 16px', verticalAlign:'middle',
                    textAlign:c.right?'right':'left',
                    fontFamily:c.mono?T.mono:T.body, fontSize:c.mono?12:13,
                    fontWeight:c.bold?500:400,
                  }}>
                    {c.render ? c.render(row) : (row[c.key]??'—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Modal / Drawer ───────────────────────────────────────────
function Modal({open, onClose, title, children, width=560}) {
  if (!open) return null;
  return (
    <div style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div onClick={onClose} style={{position:'absolute',inset:0,background:'hsl(24 10% 10%/.45)',backdropFilter:'blur(3px)'}}/>
      <div style={{position:'relative',zIndex:1,background:T.card,borderRadius:18,width,maxWidth:'90vw',maxHeight:'90vh',overflow:'auto',boxShadow:'0 4px 8px hsl(24 10%10%/.06),0 16px 40px hsl(24 10%10%/.12)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:`1px solid ${T.borderQ}`}}>
          <div style={{fontFamily:T.display,fontSize:20,fontWeight:600,letterSpacing:'-.01em'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:6}}>
            <Ico d={IC.x} size={16}/>
          </button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );
}

function Drawer({open, onClose, title, children, width=480}) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:100,display:'flex',justifyContent:'flex-end',
                 pointerEvents:open?'all':'none'}}>
      <div onClick={onClose} style={{position:'absolute',inset:0,background:`hsl(24 10% 10% / ${open?.4:0})`,backdropFilter:open?'blur(2px)':'none',transition:'all .25s',pointerEvents:open?'all':'none'}}/>
      <div style={{position:'relative',zIndex:1,background:T.card,width,maxWidth:'95vw',height:'100%',
                   transform:`translateX(${open?0:100}%)`,transition:'transform .3s cubic-bezier(0.16,1,0.3,1)',
                   display:'flex',flexDirection:'column',boxShadow:'-4px 0 40px hsl(24 10% 10%/.12)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:`1px solid ${T.borderQ}`,flexShrink:0}}>
          <div style={{fontFamily:T.display,fontSize:20,fontWeight:600,letterSpacing:'-.01em'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:T.muted}}><Ico d={IC.x} size={16}/></button>
        </div>
        <div style={{padding:24,overflow:'auto',flex:1}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Page layout primitives ───────────────────────────────────
function PageHead({title, sub, actions, eyebrow}) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:24,marginBottom:24}}>
      <div>
        {eyebrow && <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.14em',color:T.muted,fontWeight:500,marginBottom:6}}>{eyebrow}</div>}
        <h1 style={{fontFamily:T.display,fontSize:28,fontWeight:600,letterSpacing:'-.02em',margin:0}}>{title}</h1>
        {sub && <p style={{fontSize:14,color:T.muted,margin:'4px 0 0',maxWidth:'56ch',lineHeight:1.5}}>{sub}</p>}
      </div>
      {actions && <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>{actions}</div>}
    </div>
  );
}

function EmptyState({icon, title, sub, action}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 40px',textAlign:'center'}}>
      <div style={{width:64,height:64,borderRadius:16,background:T.surface,color:T.muted,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
        <Ico d={icon||IC.box} size={28}/>
      </div>
      <div style={{fontFamily:T.display,fontSize:22,fontWeight:500,marginBottom:8,letterSpacing:'-.01em'}}>{title}</div>
      <div style={{fontSize:14,color:T.muted,maxWidth:'42ch',lineHeight:1.5,marginBottom:action?20:0}}>{sub}</div>
      {action}
    </div>
  );
}

// ─── Toasts ───────────────────────────────────────────────────
function Toasts({items=[]}) {
  const toneC = {success:T.green, error:T.red, info:T.blue, warn:T.amber};
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:999,display:'flex',flexDirection:'column',gap:8,pointerEvents:'none'}}>
      {items.map(t => (
        <div key={t.id} style={{
          display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderRadius:12,
          background:T.card,border:`1px solid ${T.borderQ}`,
          boxShadow:'0 4px 8px hsl(24 10%10%/.08),0 12px 32px hsl(24 10%10%/.1)',
          fontSize:13,fontFamily:T.body,color:T.ink,maxWidth:320
        }}>
          <div style={{width:6,height:6,borderRadius:999,background:toneC[t.tone]||T.green,flexShrink:0}}/>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────
function Tabs({tabs, active, onChange}) {
  return (
    <div style={{display:'flex',gap:2,background:T.surface,padding:3,borderRadius:10,width:'fit-content'}}>
      {tabs.map(t => (
        <button key={t.id||t} onClick={()=>onChange(t.id||t)} style={{
          padding:'6px 14px',fontSize:13,borderRadius:8,border:'none',cursor:'pointer',fontFamily:T.body,fontWeight:500,
          background:active===(t.id||t)?T.card:'transparent',
          color:active===(t.id||t)?T.ink:T.muted,
          boxShadow:active===(t.id||t)?'0 1px 2px hsl(24 10%10%/.08)':'none',
          transition:'all .15s'
        }}>{t.label||t}</button>
      ))}
    </div>
  );
}

// ─── Mini chart (sparkline bar) ──────────────────────────────
function SparkBar({data=[], color=T.gold, height=40}) {
  const max = Math.max(...data,1);
  return (
    <svg viewBox={`0 0 ${data.length*12} ${height}`} style={{width:'100%',height}}>
      {data.map((v,i) => {
        const h = (v/max)*height*.85;
        return <rect key={i} x={i*12+1} y={height-h} width={10} height={h} rx={2} fill={i===data.length-1?color:color+'60'}/>;
      })}
    </svg>
  );
}

Object.assign(window, {T, Ico, IC, Badge, Btn, Input, Textarea, Select, Field, Card, StatCard, Table, Modal, Drawer, PageHead, EmptyState, Toasts, Tabs, SparkBar});
