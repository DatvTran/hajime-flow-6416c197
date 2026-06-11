// markets/shared.jsx — sidebar, icons, data, pills used across all 3 variations

// ─── Lucide-style inline icon helper ─────────────────────────
const I = ({d, size=15, stroke=1.6, style={}}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       style={{flexShrink:0, ...style}}>
    {d}
  </svg>
);

const Icons = {
  dashboard: <><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>,
  globe: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></>,
  package: <><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>,
  cart: <><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></>,
  truck: <><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></>,
  factory: <><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  chart: <><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  up: <><path d="m18 15-6-6-6 6"/></>,
  down: <><path d="m6 9 6 6 6-6"/></>,
  right: <><path d="m9 18 6-6-6-6"/></>,
  plus: <><path d="M5 12h14M12 5v14"/></>,
  filter: <><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  warehouse: <><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect x="6" y="10" width="12" height="12"/></>,
};

// ─── Market data — 12 markets ──────────────────────────────────
const MARKETS = [
  // code  name              region     sellthru  cover  onhand(cs) inflight  revMTD(K)   trend   status
  { c: 'JP', name: 'Japan',          region:'APAC',    st: 94,  cover: 62, stock: 4820, intran: 2, rev: 1842, tr: +8.4,  status:'healthy',    stores: 412, flag:'日'},
  { c: 'US', name: 'United States',  region:'Americas',st: 88,  cover: 41, stock: 3120, intran: 5, rev: 2980, tr: +12.1, status:'healthy',    stores: 228, flag:'US'},
  { c: 'SG', name: 'Singapore',      region:'APAC',    st: 91,  cover: 28, stock: 620,  intran: 3, rev:  612, tr: +6.2,  status:'low-cover',  stores: 74,  flag:'SG'},
  { c: 'HK', name: 'Hong Kong',      region:'APAC',    st: 86,  cover: 35, stock: 890,  intran: 1, rev:  541, tr: -2.1,  status:'healthy',    stores: 58,  flag:'HK'},
  { c: 'GB', name: 'United Kingdom', region:'EMEA',    st: 72,  cover: 78, stock: 2140, intran: 0, rev:  488, tr: -4.7,  status:'overstock',  stores: 112, flag:'UK'},
  { c: 'DE', name: 'Germany',        region:'EMEA',    st: 68,  cover: 82, stock: 1680, intran: 1, rev:  316, tr: -1.3,  status:'overstock',  stores: 84,  flag:'DE'},
  { c: 'FR', name: 'France',         region:'EMEA',    st: 79,  cover: 54, stock: 1420, intran: 2, rev:  402, tr: +3.8,  status:'healthy',    stores: 96,  flag:'FR'},
  { c: 'CA', name: 'Canada',         region:'Americas',st: 81,  cover: 48, stock:  980, intran: 1, rev:  284, tr: +5.1,  status:'healthy',    stores: 64,  flag:'CA'},
  { c: 'AU', name: 'Australia',      region:'APAC',    st: 76,  cover: 44, stock:  720, intran: 2, rev:  196, tr: +2.4,  status:'healthy',    stores: 48,  flag:'AU'},
  { c: 'KR', name: 'South Korea',    region:'APAC',    st: 89,  cover: 22, stock:  480, intran: 4, rev:  338, tr: +18.6, status:'low-cover',  stores: 52,  flag:'KR'},
  { c: 'AE', name: 'United Arab Em.',region:'EMEA',    st: 64,  cover: 19, stock:  210, intran: 2, rev:  148, tr: +9.2,  status:'low-cover',  stores: 22,  flag:'AE'},
  { c: 'TW', name: 'Taiwan',         region:'APAC',    st: 84,  cover: 38, stock:  560, intran: 1, rev:  224, tr: +4.6,  status:'healthy',    stores: 38,  flag:'TW'},
];

// ─── Shared dark sidebar (matches operator HQ) ─────────────────
function Sidebar({ active = 'Global markets' }) {
  const nav = [
    { label: 'Command center', icon: Icons.dashboard },
    { label: 'Global markets', icon: Icons.globe },
    { label: 'Inventory',      icon: Icons.package },
    { label: 'Orders',         icon: Icons.cart },
    { label: 'Logistics',      icon: Icons.truck },
    { label: 'Manufacturing',  icon: Icons.factory },
    { label: 'Partners',       icon: Icons.users },
    { label: 'Reports',        icon: Icons.chart },
  ];
  const nav2 = [
    { label: 'Alerts hub',  icon: Icons.alert, badge: 4 },
    { label: 'Settings',    icon: Icons.settings },
  ];
  return (
    <div style={{
      background:'hsl(24 12% 8%)', color:'hsl(35 12% 78%)',
      padding:'18px 14px', display:'flex', flexDirection:'column', gap:18,
      borderRight:'1px solid hsl(24 10% 15%)', height:'100%', fontFamily:'var(--font-body)'
    }}>
      {/* logo */}
      <div style={{display:'flex', alignItems:'center', gap:10, padding:'6px 8px'}}>
        <div style={{width:32, height:32, borderRadius:8, background:'hsl(24 10% 13% / 0.6)',
                     display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
          <img src="assets/hajime-logo.png" alt="" style={{height:26, width:26, objectFit:'contain', filter:'brightness(0) invert(1)'}} />
        </div>
        <div>
          <div style={{fontFamily:'var(--font-display)', fontWeight:600, fontSize:16, color:'hsl(35 14% 90%)', lineHeight:1}}>Hajime</div>
          <div style={{fontSize:9, textTransform:'uppercase', letterSpacing:'.18em', color:'hsl(35 12% 55%)', marginTop:3}}>Brand HQ</div>
        </div>
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:2}}>
        <div style={navGroupLabel}>Operations</div>
        {nav.map(n => <NavItem key={n.label} {...n} active={n.label === active} />)}
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:2}}>
        <div style={navGroupLabel}>Monitoring</div>
        {nav2.map(n => <NavItem key={n.label} {...n} active={n.label === active} />)}
      </div>

      <div style={{marginTop:'auto', display:'flex', alignItems:'center', gap:10,
                   padding:10, borderTop:'1px solid hsl(24 10% 15%)'}}>
        <div style={{width:28, height:28, borderRadius:999, background:'hsl(24 10% 13%)',
                     color:'hsl(35 14% 90%)', display:'flex', alignItems:'center',
                     justifyContent:'center', fontSize:11, fontWeight:500}}>SO</div>
        <div style={{fontSize:12, color:'hsl(35 14% 90%)', lineHeight:1.3}}>
          Sora Okuda
          <div style={{color:'hsl(35 12% 50%)', fontSize:10}}>Ops director</div>
        </div>
      </div>
    </div>
  );
}

const navGroupLabel = {
  padding:'4px 10px', fontSize:10, fontWeight:500, textTransform:'uppercase',
  letterSpacing:'.14em', color:'hsl(35 12% 78% / .4)'
};

function NavItem({label, icon, active, badge}) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
      borderRadius:6, fontSize:13, cursor:'pointer',
      background: active ? 'hsl(24 10% 13%)' : 'transparent',
      color: active ? 'hsl(40 88% 42%)' : 'hsl(35 12% 78% / .72)',
      fontWeight: active ? 500 : 400,
    }}>
      <I d={icon} size={15}/>
      <span style={{flex:1}}>{label}</span>
      {badge != null && (
        <span style={{fontSize:10, fontFamily:'var(--font-mono)', color:'hsl(40 88% 42%)',
                      background:'hsl(40 88% 42% / 0.12)', padding:'1px 6px', borderRadius:999}}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Top bar (glass) ─────────────────────────────────────────
function TopBar({ children }) {
  return (
    <div style={{
      height:56, display:'flex', alignItems:'center', padding:'0 28px', gap:16,
      background:'hsl(40 20% 99% / 0.8)', backdropFilter:'blur(12px) saturate(1.4)',
      borderBottom:'1px solid hsl(35 12% 89% / 0.6)', fontFamily:'var(--font-body)'
    }}>
      <div style={{
        flex:1, maxWidth:360, display:'flex', alignItems:'center', gap:8,
        padding:'0 12px', height:34, background:'hsl(37 14% 94%)',
        borderRadius:8, color:'hsl(24 6% 50%)', fontSize:13
      }}>
        <I d={Icons.search} size={14}/> Search markets, SKUs, orders…
      </div>
      <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:8}}>
        {children}
        <div style={{width:34, height:34, borderRadius:8, display:'flex',
                     alignItems:'center', justifyContent:'center', color:'hsl(24 6% 50%)',
                     position:'relative', cursor:'pointer'}}>
          <I d={Icons.bell} size={15}/>
          <div style={{position:'absolute', top:8, right:9, width:6, height:6, borderRadius:999,
                       background:'hsl(40 88% 42%)', border:'1.5px solid hsl(40 18% 97%)'}}></div>
        </div>
      </div>
    </div>
  );
}

// ─── Pill ──────────────────────────────────────────────────────
function Pill({ tone='stone', children }) {
  const tones = {
    green: {bg:'hsl(158 56% 36% / .08)', c:'hsl(158 56% 26%)', br:'hsl(158 56% 36% / .2)'},
    blue:  {bg:'hsl(215 72% 50% / .08)', c:'hsl(215 72% 38%)', br:'hsl(215 72% 50% / .2)'},
    amber: {bg:'hsl(38 90% 50% / .12)',  c:'hsl(30 80% 30%)',  br:'hsl(38 90% 50% / .3)'},
    red:   {bg:'hsl(0 68% 48% / .08)',   c:'hsl(0 68% 36%)',   br:'hsl(0 68% 48% / .2)'},
    stone: {bg:'hsl(30 10% 55% / .12)',  c:'hsl(30 10% 35%)',  br:'hsl(30 10% 55% / .25)'},
    gold:  {bg:'hsl(40 88% 42% / .1)',   c:'hsl(40 88% 32%)',  br:'hsl(40 88% 42% / .3)'},
  };
  const t = tones[tone] || tones.stone;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, borderRadius:999,
      padding:'2px 9px', fontSize:11, fontWeight:500,
      background:t.bg, color:t.c, border:`1px solid ${t.br}`, fontFamily:'var(--font-body)'
    }}>{children}</span>
  );
}

function Dot({tone='stone'}) {
  const colors = {
    green:'hsl(158 56% 36%)', blue:'hsl(215 72% 50%)', amber:'hsl(38 90% 50%)',
    red:'hsl(0 68% 48%)', stone:'hsl(30 10% 55%)', gold:'hsl(40 88% 42%)'
  };
  return <span style={{width:6,height:6,borderRadius:999,background:colors[tone]}}></span>;
}

function Btn({ variant='outline', children, ...p }) {
  const vs = {
    primary:{bg:'hsl(24 10% 10%)', c:'hsl(40 20% 97%)', br:'transparent'},
    accent: {bg:'hsl(40 88% 42%)', c:'hsl(40 20% 97%)', br:'transparent'},
    outline:{bg:'hsl(40 18% 97%)', c:'hsl(24 10% 10%)', br:'hsl(35 12% 89%)'},
    ghost:  {bg:'transparent',     c:'hsl(24 10% 10%)', br:'transparent'},
  };
  const v = vs[variant];
  return (
    <button {...p} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
      fontSize:13, fontWeight:500, borderRadius:8, padding:'0 14px', height:36,
      border:`1px solid ${v.br}`, background:v.bg, color:v.c, cursor:'pointer',
      fontFamily:'var(--font-body)', whiteSpace:'nowrap', ...p.style
    }}>{children}</button>
  );
}

// Map status → pill tone + label
const statusMap = {
  healthy:    { tone:'green', label:'healthy' },
  'low-cover':{ tone:'amber', label:'low cover' },
  overstock:  { tone:'blue',  label:'overstock' },
};

Object.assign(window, { I, Icons, MARKETS, Sidebar, TopBar, Pill, Dot, Btn, statusMap });
