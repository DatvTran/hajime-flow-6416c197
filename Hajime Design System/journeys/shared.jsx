// journeys/shared.jsx — shared building blocks for all role journeys
// Loaded after design-canvas only-needed icon/data, but kept self-contained.

const J = {
  paper:     'hsl(40 18% 97%)',
  paper2:    'hsl(40 20% 99%)',
  ink:       'hsl(24 10% 10%)',
  inkDeep:   'hsl(24 12% 8%)',
  muted:     'hsl(24 6% 50%)',
  border:    'hsl(35 12% 89%)',
  borderQ:   'hsl(35 12% 89% / 0.6)',
  card:      'hsl(40 20% 99%)',
  surface:   'hsl(37 14% 94%)',
  gold:      'hsl(40 88% 42%)',
  goldSoft:  'hsl(40 88% 42% / 0.10)',
  goldRing:  'hsl(40 88% 42% / 0.30)',
  green:     'hsl(158 56% 36%)',
  amber:     'hsl(38 90% 50%)',
  red:       'hsl(0 68% 48%)',
  blue:      'hsl(215 72% 50%)',
  display:   "'Cormorant Garamond', Georgia, serif",
  body:      "'DM Sans', system-ui, -apple-system, sans-serif",
  mono:      "'JetBrains Mono', Menlo, monospace",
};

// ─── Icon set (Lucide-style) ────────────────────────────────────
const Ic = ({d, size=16, stroke=1.6, style={}}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
       strokeLinejoin="round" style={{flexShrink:0, ...style}}>{d}</svg>
);

const I = {
  dashboard: <><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>,
  globe:    <><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></>,
  package:  <><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>,
  cart:     <><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></>,
  truck:    <><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></>,
  factory:  <><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></>,
  users:    <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  chart:    <><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  alert:    <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
  bell:     <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  search:   <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  check:    <><path d="m5 12 5 5L20 7"/></>,
  x:        <><path d="M18 6 6 18M6 6l12 12"/></>,
  plus:     <><path d="M5 12h14M12 5v14"/></>,
  arrow:    <><path d="M5 12h14M13 5l7 7-7 7"/></>,
  arrowL:   <><path d="M19 12H5M11 19l-7-7 7-7"/></>,
  up:       <><path d="m6 9 6-6 6 6"/><path d="M12 3v18"/></>,
  down:     <><path d="M12 21V3"/><path d="m6 15 6 6 6-6"/></>,
  trendUp:  <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  trendDn:  <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>,
  clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  filter:   <><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></>,
  more:     <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  menu:     <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  signal:   <><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></>,
  battery:  <><rect x="2" y="7" width="18" height="10" rx="2" ry="2"/><line x1="22" y1="11" x2="22" y2="13"/></>,
  wifi:     <><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
  scan:     <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></>,
  pin:      <><path d="M12 22s-8-4.5-8-12a8 8 0 0 1 16 0c0 7.5-8 12-8 12z"/><circle cx="12" cy="10" r="3"/></>,
  phone:    <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>,
  store:    <><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></>,
  warehouse:<><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect x="6" y="10" width="12" height="12"/></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></>,
  receipt:  <><path d="M16 2v4M8 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/></>,
  refresh:  <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></>,
};

// ─── Pill ────────────────────────────────────────────────────────
function Pill({tone='stone', children, dot=false, mono=false}) {
  const tones = {
    green:{bg:'hsl(158 56% 36% / .08)', c:'hsl(158 56% 26%)', br:'hsl(158 56% 36% / .25)', dot:J.green},
    blue: {bg:'hsl(215 72% 50% / .08)', c:'hsl(215 72% 38%)', br:'hsl(215 72% 50% / .25)', dot:J.blue},
    amber:{bg:'hsl(38 90% 50% / .12)',  c:'hsl(30 80% 30%)',  br:'hsl(38 90% 50% / .3)',   dot:J.amber},
    red:  {bg:'hsl(0 68% 48% / .08)',   c:'hsl(0 68% 36%)',   br:'hsl(0 68% 48% / .25)',   dot:J.red},
    stone:{bg:'hsl(30 10% 55% / .12)',  c:'hsl(30 10% 35%)',  br:'hsl(30 10% 55% / .25)',  dot:'hsl(30 10% 55%)'},
    gold: {bg:J.goldSoft,                c:'hsl(40 88% 32%)',  br:J.goldRing,               dot:J.gold},
    ink:  {bg:'hsl(24 10% 10% / .9)',    c:'hsl(40 20% 97%)',  br:'transparent',            dot:'hsl(40 20% 97%)'},
  };
  const t = tones[tone] || tones.stone;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, borderRadius:999,
      padding:'2px 9px', fontSize:11, fontWeight:500,
      background:t.bg, color:t.c, border:`1px solid ${t.br}`, fontFamily: mono?J.mono:J.body,
      whiteSpace:'nowrap', letterSpacing: mono ? '.02em' : 0
    }}>
      {dot && <span style={{width:6,height:6,borderRadius:999,background:t.dot,flexShrink:0}}/>}
      {children}
    </span>
  );
}

// ─── Buttons ────────────────────────────────────────────────────
function Btn({variant='outline', size='md', children, icon, iconR, style={}}){
  const vs = {
    primary:{bg:J.ink,    c:J.paper,  br:'transparent'},
    accent: {bg:J.gold,   c:J.paper,  br:'transparent'},
    outline:{bg:J.paper,  c:J.ink,    br:J.border},
    ghost:  {bg:'transparent', c:J.ink, br:'transparent'},
    soft:   {bg:J.surface, c:J.ink,   br:'transparent'},
  };
  const v = vs[variant] || vs.outline;
  const sz = size==='sm'?{h:28,px:10,fs:12}:size==='lg'?{h:42,px:18,fs:14}:{h:34,px:14,fs:13};
  return (
    <button style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
      fontSize:sz.fs, fontWeight:500, borderRadius:8, padding:`0 ${sz.px}px`, height:sz.h,
      border:`1px solid ${v.br}`, background:v.bg, color:v.c, cursor:'pointer',
      fontFamily:J.body, whiteSpace:'nowrap', ...style
    }}>
      {icon && <Ic d={icon} size={sz.fs+2}/>}
      {children}
      {iconR && <Ic d={iconR} size={sz.fs+2}/>}
    </button>
  );
}

// ─── Eyebrow ────────────────────────────────────────────────────
function Eyebrow({children, color=J.muted, style={}}) {
  return (
    <div style={{
      fontSize:10, textTransform:'uppercase', letterSpacing:'.16em',
      fontWeight:500, color, fontFamily:J.body, ...style
    }}>{children}</div>
  );
}

// ─── Slide chrome (the section-header strip on every slide) ──────
function SlideHeader({roleColor, role, stage, title, subtitle, slideNo, totalForRole}) {
  return (
    <div style={{
      display:'flex', alignItems:'flex-end', justifyContent:'space-between',
      gap:32, padding:'48px 56px 24px', borderBottom:`1px solid ${J.borderQ}`
    }}>
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px',
            borderRadius:999, background: roleColor+'14', border:`1px solid ${roleColor}33`,
            color: roleColor, fontSize:11, fontWeight:600, letterSpacing:'.02em'
          }}>
            <span style={{width:6, height:6, borderRadius:999, background: roleColor}}/>
            {role}
          </span>
          <Eyebrow>{stage}</Eyebrow>
        </div>
        <h2 style={{
          fontFamily:J.display, fontSize:44, fontWeight:600, letterSpacing:'-.022em',
          margin:0, color:J.ink, lineHeight:1.05
        }}>{title}</h2>
        {subtitle && (
          <p style={{
            fontSize:16, color:J.muted, marginTop:12, maxWidth:'62ch',
            lineHeight:1.5, fontFamily:J.body
          }}>{subtitle}</p>
        )}
      </div>
      <div style={{
        fontFamily:J.mono, fontSize:11, color:J.muted, letterSpacing:'.05em',
        whiteSpace:'nowrap', paddingBottom:6
      }}>
        {slideNo} / {totalForRole}
      </div>
    </div>
  );
}

// ─── Slide footer (brand + role color stripe) ───────────────────
function SlideFooter({roleColor}) {
  return (
    <div style={{
      position:'absolute', left:0, right:0, bottom:0, height:6,
      background:`linear-gradient(to right, ${roleColor} 0%, ${roleColor} 18%, ${J.borderQ} 18%, ${J.borderQ} 100%)`
    }}/>
  );
}

// ─── Common slide wrapper (1920×1080) ───────────────────────────
function Slide({children, bg=J.paper, label}) {
  return (
    <section style={{
      width:1920, height:1080, background:bg, fontFamily:J.body,
      color:J.ink, position:'relative', overflow:'hidden'
    }} data-screen-label={label}>
      {children}
    </section>
  );
}

// ─── Card primitive ────────────────────────────────────────────
function Card({children, style={}, padded=true, elev=0}){
  const shadow = elev===2
    ? '0 4px 8px hsl(24 10% 10% / .06), 0 16px 40px hsl(24 10% 10% / .1)'
    : elev===1
    ? '0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    : 'none';
  return (
    <div style={{
      background:J.card, border:`1px solid ${J.borderQ}`,
      borderRadius:14, boxShadow:shadow, padding: padded?20:0,
      ...style
    }}>{children}</div>
  );
}

// ─── A small KPI tile ──────────────────────────────────────────
function Kpi({label, value, sub, icon, tone='stone', trend}){
  const tones = {
    stone:{bg:J.card, ico:J.surface, icoC:J.muted, br:J.borderQ},
    gold: {bg:'linear-gradient(135deg, hsl(40 55% 94%), hsl(40 50% 90% / .5))',
           ico:'hsl(40 60% 86%)', icoC:'hsl(40 88% 32%)', br:'hsl(40 60% 80% / .5)'},
    warm: {bg:'linear-gradient(135deg, hsl(30 70% 94%), hsl(30 60% 90% / .5))',
           ico:'hsl(30 70% 86%)', icoC:'hsl(30 80% 35%)', br:'hsl(30 70% 80% / .5)'},
    green:{bg:'linear-gradient(135deg, hsl(158 40% 94%), hsl(158 40% 90% / .5))',
           ico:'hsl(158 40% 86%)', icoC:'hsl(158 56% 26%)', br:'hsl(158 40% 80% / .5)'},
  };
  const t = tones[tone] || tones.stone;
  return (
    <div style={{
      background:t.bg, border:`1px solid ${t.br}`, borderRadius:14, padding:20,
      boxShadow:'0 1px 2px hsl(24 10% 10% / .04), 0 4px 12px hsl(24 10% 10% / .03)'
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
        <Eyebrow>{label}</Eyebrow>
        {icon && <div style={{
          width:36, height:36, borderRadius:10, background:t.ico, color:t.icoC,
          display:'flex', alignItems:'center', justifyContent:'center'
        }}><Ic d={icon} size={18}/></div>}
      </div>
      <div style={{
        fontFamily:J.display, fontSize:32, fontWeight:600, letterSpacing:'-.02em',
        marginTop:10, fontFeatureSettings:"'tnum'", color:J.ink
      }}>{value}</div>
      {(sub || trend) && (
        <div style={{display:'flex', alignItems:'center', gap:8, marginTop:6}}>
          {trend != null && (
            <span style={{
              display:'inline-flex', alignItems:'center', gap:3, fontSize:11,
              fontWeight:600, color: trend >= 0 ? J.green : J.red, fontFamily:J.mono
            }}>
              <Ic d={trend>=0?I.trendUp:I.trendDn} size={11} stroke={2}/>
              {trend>=0?'+':''}{trend}%
            </span>
          )}
          {sub && <span style={{fontSize:12, color:J.muted}}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────
function Avatar({initials, size=28, tone='ink', style={}}) {
  const tones = {
    ink:  {bg:'hsl(24 10% 13%)', c:'hsl(35 14% 90%)'},
    gold: {bg:'hsl(40 60% 86%)', c:'hsl(40 88% 32%)'},
    paper:{bg:J.surface,         c:J.ink},
  };
  const t = tones[tone];
  return (
    <div style={{
      width:size, height:size, borderRadius:999, background:t.bg, color:t.c,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size<=24?10:11, fontWeight:500, fontFamily:J.body, flexShrink:0, ...style
    }}>{initials}</div>
  );
}

// Role colors — used for slide accents only, not as second brand colors
const ROLES = {
  hq:    { color: J.gold,         label: 'Brand Operator · HQ' },
  manuf: { color: 'hsl(15 60% 45%)', label: 'Manufacturer' },
  dist:  { color: 'hsl(215 50% 40%)', label: 'Distributor' },
  rep:   { color: 'hsl(158 50% 30%)', label: 'Sales Rep' },
  retail:{ color: 'hsl(280 30% 40%)', label: 'Retail Store' },
};

Object.assign(window, {
  J, Ic, I, Pill, Btn, Eyebrow, SlideHeader, SlideFooter, Slide,
  Card, Kpi, Avatar, ROLES
});
