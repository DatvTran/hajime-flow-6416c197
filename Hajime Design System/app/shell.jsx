// app/shell.jsx — AppShell, Router, Sidebar, Topbar

// ─── Role definitions ────────────────────────────────────────
const ROLES_CFG = {
  hq:     { label:'Brand Operator (HQ)', sub:'Hajime HQ', color:T.gold,              initials:'SO', name:'Sora Okuda'      },
  manuf:  { label:'Manufacturer',        sub:'Yamato Distillery', color:'hsl(15 60% 45%)', initials:'YI', name:'Yui Imanishi'  },
  dist:   { label:'Distributor',         sub:'Empire Wines · Brooklyn', color:'hsl(215 50% 40%)', initials:'LB', name:'Léa Bardot' },
  rep:    { label:'Sales Rep',           sub:'NYC territory', color:'hsl(158 50% 30%)', initials:'MT', name:'Mike Tan'       },
  retail: { label:'Retail Store',        sub:'Mace · Brooklyn', color:'hsl(280 30% 40%)', initials:'KZ', name:'Kazu Saito'  },
};

const NAV = {
  hq: [
    { group:'Operations', items:[
      { path:'dashboard',       label:'Command center',   icon:IC.dash },
      { path:'orders',          label:'Orders',            icon:IC.cart,    badge:'pending' },
      { path:'inventory',       label:'Inventory',         icon:IC.box },
      { path:'accounts',        label:'Accounts',          icon:IC.users },
      { path:'purchase-orders', label:'Production requests',icon:IC.file },
      { path:'shipments',       label:'Shipments',         icon:IC.truck },
      { path:'markets',         label:'Global markets',    icon:IC.globe },
    ]},
    { group:'Insights', items:[
      { path:'reports',  label:'Reports',  icon:IC.chart },
      { path:'alerts',   label:'Alerts',   icon:IC.alert, badge:'alerts' },
      { path:'finance',  label:'Finance',  icon:IC.receipt },
      { path:'incentives', label:'Incentives', icon:IC.target },
      { path:'product-development', label:'Product dev', icon:IC.factory },
    ]},
    { group:'HQ', items:[
      { path:'settings', label:'Settings', icon:IC.settings },
    ]},
  ],
  manuf: [
    { group:'Production', items:[
      { path:'dashboard',  label:'Overview',          icon:IC.dash },
      { path:'production', label:'Production board',  icon:IC.factory },
      { path:'po-in',      label:'Orders in',         icon:IC.file, badge:'pending' },
      { path:'ship-out',   label:'Shipments out',     icon:IC.truck },
      { path:'specs',      label:'Product specs',     icon:IC.tag },
    ]},
    { group:'Account', items:[
      { path:'profile', label:'Profile', icon:IC.users },
    ]},
  ],
  dist: [
    { group:'Warehouse', items:[
      { path:'dashboard',  label:'Overview',        icon:IC.dash },
      { path:'floor',      label:'Pick queue',      icon:IC.whouse, badge:'pending' },
      { path:'inbound',    label:'Inbound',         icon:IC.truck },
      { path:'inventory',  label:'Warehouse stock', icon:IC.box },
      { path:'depletion',  label:'Depletion live',  icon:IC.chart, badge:'depletion' },
    ]},
    { group:'Reports', items:[
      { path:'sell-through', label:'Sell-through',  icon:IC.trendU },
      { path:'alerts',       label:'Alerts',        icon:IC.alert },
      { path:'incentives',   label:'My incentives', icon:IC.target, badge:'new' },
    ]},
  ],
  rep: [
    { group:'Field', items:[
      { path:'dashboard',  label:'Overview',        icon:IC.dash },
      { path:'accounts',   label:'My accounts',     icon:IC.users },
      { path:'inventory',  label:'Stock check',     icon:IC.box, badge:'new' },
      { path:'drafts',     label:'Draft orders',    icon:IC.cart, badge:'pending' },
      { path:'visits',     label:'Visit notes',     icon:IC.note },
      { path:'opportunities', label:'Opportunities',icon:IC.target },
    ]},
    { group:'Performance', items:[
      { path:'targets',    label:'Targets',       icon:IC.target },
      { path:'reports',    label:'Analytics',     icon:IC.chart },
      { path:'incentives', label:'My incentives', icon:IC.receipt, badge:'new' },
    ]},
  ],
  retail: [
    { group:'Store', items:[
      { path:'dashboard', label:'Home',        icon:IC.store },
      { path:'catalog',   label:'New order',   icon:IC.plus },
      { path:'orders',    label:'My orders',   icon:IC.cart },
      { path:'reorder',   label:'Reorder',     icon:IC.refresh },
      { path:'shipments', label:'Deliveries',  icon:IC.truck },
    ]},
    { group:'Account', items:[
      { path:'account',    label:'Account',     icon:IC.users },
      { path:'support',    label:'Support',     icon:IC.note },
      { path:'incentives', label:'My rewards',  icon:IC.target, badge:'new' },
    ]},
  ],
};

// ─── Router (hash-based) ─────────────────────────────────────
const RouterCtx = React.createContext(null);

function useRouter() { return React.useContext(RouterCtx); }

function RouterProvider({ children }) {
  const [hash, setHash] = React.useState(() => window.location.hash.slice(1) || '/login');
  React.useEffect(() => {
    const handler = () => setHash(window.location.hash.slice(1) || '/login');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const navigate = React.useCallback((path) => { window.location.hash = '#' + path; }, []);
  const parts = hash.replace(/^\//, '').split('/');
  return (
    <RouterCtx.Provider value={{ hash, navigate, parts, role: parts[0], page: parts[1] || 'dashboard', sub: parts[2] }}>
      {children}
    </RouterCtx.Provider>
  );
}

// ─── Role Context ─────────────────────────────────────────────
const RoleCtx = React.createContext(null);
function useRole() { return React.useContext(RoleCtx); }

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar() {
  const { role, page, navigate } = useRouter();
  const { orders, alerts } = useStore();
  const cfg = ROLES_CFG[role] || ROLES_CFG.hq;
  const groups = NAV[role] || NAV.hq;

  const badgeCount = {
    pending:   (role==='hq' ? orders.filter(o=>o.status==='pending').length : role==='manuf' ? orders.filter(o=>o.status==='pending').length : orders.filter(o=>['approved','pending'].includes(o.status)).length),
    alerts:    alerts.filter(a=>a.sev==='critical'||a.sev==='high').length,
    depletion: 1,
    new:       undefined,
  };

  return (
    <div style={{
      width:240, flexShrink:0, background:T.inkDeep, color:'hsl(35 12% 78%)',
      display:'flex', flexDirection:'column', gap:20, padding:'18px 12px',
      borderRight:'1px solid hsl(24 10% 15%)', height:'100%', overflow:'auto'
    }}>
      {/* Logo */}
      <div style={{display:'flex', alignItems:'center', gap:10, padding:'6px 8px'}}>
        <div style={{width:32, height:32, borderRadius:8, background:'hsl(24 10%13%/.6)',
                     display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
          <img src={window.__resources?.logo||'assets/hajime-logo.png'} alt="" style={{height:26, width:26, objectFit:'contain', filter:'brightness(0) invert(1)'}}/>
        </div>
        <div>
          <div style={{fontFamily:T.display, fontWeight:600, fontSize:16, color:'hsl(35 14% 90%)', lineHeight:1}}>Hajime</div>
          <div style={{fontSize:9, textTransform:'uppercase', letterSpacing:'.18em', color:'hsl(35 12% 55%)', marginTop:3}}>{cfg.sub}</div>
        </div>
      </div>

      {/* Nav groups */}
      {groups.map(g => (
        <div key={g.group} style={{display:'flex', flexDirection:'column', gap:2}}>
          <div style={{padding:'4px 10px', fontSize:10, fontWeight:500, textTransform:'uppercase',
                       letterSpacing:'.14em', color:'hsl(35 12%78%/.4)'}}>{g.group}</div>
          {g.items.map(item => {
            const active = page === item.path;
            const cnt = item.badge ? badgeCount[item.badge] : null;
            return (
              <div key={item.path} onClick={() => navigate(`/${role}/${item.path}`)} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                borderRadius:6, fontSize:13, cursor:'pointer', transition:'all .12s',
                background: active ? 'hsl(24 10% 13%)' : 'transparent',
                color: active ? T.gold : 'hsl(35 12%78%/.75)',
                fontWeight: active ? 500 : 400,
              }}>
                <Ico d={item.icon} size={15}/>
                <span style={{flex:1}}>{item.label}</span>
                {cnt != null && cnt > 0 && (
                  <span style={{fontSize:10, fontFamily:T.mono, color:T.gold,
                                background:'hsl(40 88%42%/.14)', padding:'1px 6px', borderRadius:999}}>{cnt}</span>
                )}
                {item.badge==='new' && (
                  <span style={{fontSize:9, fontFamily:T.mono, color:T.gold, background:'hsl(40 88%42%/.14)',
                                padding:'1px 6px', borderRadius:999, letterSpacing:'.04em'}}>NEW</span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* User footer */}
      <div style={{marginTop:'auto', display:'flex', alignItems:'center', gap:10,
                   padding:10, borderTop:'1px solid hsl(24 10%15%)'}}>
        <div style={{width:28, height:28, borderRadius:999, background:'hsl(24 10%13%)',
                     color:'hsl(35 14%90%)', display:'flex', alignItems:'center',
                     justifyContent:'center', fontSize:11, fontWeight:500}}>{cfg.initials}</div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:12, color:'hsl(35 14%90%)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{cfg.name}</div>
          <div style={{fontSize:10, color:'hsl(35 12%50%)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{cfg.label}</div>
        </div>
        <div onClick={() => navigate('/login')} style={{cursor:'pointer', color:'hsl(35 12%50%)', opacity:.7}}>
          <Ico d={IC.logout} size={14}/>
        </div>
      </div>
    </div>
  );
}

// ─── Top bar ─────────────────────────────────────────────────
function Topbar({ right, breadcrumb }) {
  const { navigate, role, page } = useRouter();
  const { alerts } = useStore();
  const alertCount = alerts.filter(a=>a.sev==='critical'||a.sev==='high').length;
  return (
    <div style={{
      height:56, display:'flex', alignItems:'center', padding:'0 28px', gap:14, flexShrink:0,
      background:'hsl(40 20%99%/.82)', backdropFilter:'blur(12px) saturate(1.4)',
      borderBottom:`1px solid ${T.borderQ}`
    }}>
      {breadcrumb && (
        <div style={{display:'flex', alignItems:'center', gap:8, fontSize:13, color:T.muted}}>
          {breadcrumb.map((b,i) => (
            <React.Fragment key={i}>
              {i > 0 && <Ico d={IC.chevR} size={12}/>}
              <span style={{color: i===breadcrumb.length-1 ? T.ink : T.muted, fontWeight: i===breadcrumb.length-1 ? 500 : 400}}>{b}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div style={{flex:1, display:'flex', alignItems:'center', gap:8, padding:'0 10px', height:32,
                   background:T.surface, borderRadius:8, maxWidth:360, marginLeft: breadcrumb?'auto':0}}>
        <Ico d={IC.search} size={13} style={{color:T.muted}}/>
        <input placeholder="Search…" style={{border:'none', background:'transparent', outline:'none',
                                              fontSize:13, fontFamily:T.body, color:T.ink, flex:1}}/>
      </div>
      {right && <div style={{display:'flex',gap:8,alignItems:'center'}}>{right}</div>}
      <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:6}}>
        <div onClick={()=>navigate(`/${role}/alerts`)} style={{
          width:34, height:34, borderRadius:8, display:'flex', alignItems:'center',
          justifyContent:'center', color:T.muted, cursor:'pointer', position:'relative'
        }}>
          <Ico d={IC.bell} size={15}/>
          {alertCount > 0 && (
            <div style={{position:'absolute', top:7, right:8, width:7, height:7, borderRadius:999,
                         background:T.gold, border:`1.5px solid ${T.paper}`}}/>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App shell layout ────────────────────────────────────────
function AppShell({ children, topRight, breadcrumb }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'240px 1fr', height:'100vh', overflow:'hidden'}}>
      <Sidebar/>
      <div style={{display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden'}}>
        <Topbar right={topRight} breadcrumb={breadcrumb}/>
        <div style={{flex:1, overflow:'auto', padding:'28px 36px 60px', background:T.paper}}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Login screen ────────────────────────────────────────────
function LoginPage() {
  const { navigate } = useRouter();
  const [step, setStep] = React.useState('role');
  const [selectedRole, setSelectedRole] = React.useState(null);

  const ROLE_OPTS = [
    { id:'hq',     icon:IC.dash,    label:'Brand Operator', sub:'Hajime HQ — command center',  mark:'◉' },
    { id:'manuf',  icon:IC.factory, label:'Manufacturer',    sub:'Production & export',          mark:'⚙' },
    { id:'dist',   icon:IC.whouse,  label:'Distributor',     sub:'Warehouse & fulfillment',      mark:'◫' },
    { id:'rep',    icon:IC.users,   label:'Sales Rep',       sub:'Field accounts & drafts',      mark:'◈' },
    { id:'retail', icon:IC.store,   label:'Retail Store',    sub:'Order & track deliveries',     mark:'◻' },
  ];

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:T.inkDeep, position:'relative', overflow:'hidden', padding:32
    }}>
      <div style={{position:'absolute', inset:0, background:'radial-gradient(ellipse 80%50% at 50% -10%, hsl(40 88%42%/.1), transparent)', pointerEvents:'none'}}/>
      <div style={{position:'absolute', inset:0, backgroundImage:`radial-gradient(circle, hsl(40 20%97%/.04) 1px, transparent 1px)`, backgroundSize:'24px 24px', pointerEvents:'none'}}/>

      <div style={{position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, maxWidth:1200, width:'100%', alignItems:'center'}}>
        {/* Brand side */}
        <div style={{color:'hsl(40 18%97%)'}}>
          <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:40}}>
            <img src={window.__resources?.logo||'assets/hajime-logo.png'} alt="" style={{height:72, filter:'brightness(0) invert(1)'}}/>
            <div style={{fontFamily:T.display, fontSize:32, fontWeight:600, letterSpacing:'-.02em'}}>Hajime</div>
          </div>
          <h1 style={{fontFamily:T.display, fontSize:72, fontWeight:600, letterSpacing:'-.025em', lineHeight:1.0, margin:'0 0 24px', color:'hsl(40 18%97%)'}}>
            Five portals.<br/>
            <span style={{color:T.gold, fontStyle:'italic', fontWeight:500}}>One dataset.</span>
          </h1>
          <p style={{fontSize:18, color:'hsl(35 14%72%)', lineHeight:1.55, maxWidth:'44ch', margin:0}}>
            Every change propagates in real time across all five roles. Sign in to explore any portal.
          </p>
          <div style={{display:'flex', gap:48, marginTop:48, paddingTop:32, borderTop:'1px solid hsl(35 12%55%/.2)'}}>
            {[{n:'5',l:'Portals'},{n:'12',l:'Markets'},{n:'1',l:'Shared truth'}].map(s => (
              <div key={s.l}><div style={{fontFamily:T.display, fontSize:40, fontWeight:600, color:T.gold, letterSpacing:'-.02em'}}>{s.n}</div><div style={{fontSize:12, color:'hsl(35 12%55%)', marginTop:2}}>{s.l}</div></div>
            ))}
          </div>
        </div>

        {/* Login side */}
        <div>
          {step === 'role' ? (
            <div>
              <div style={{fontSize:13, color:'hsl(35 12%55%)', textAlign:'center', marginBottom:20}}>Choose your role</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                {ROLE_OPTS.map((r,i) => (
                  <div key={r.id} onClick={() => { setSelectedRole(r); setStep('creds'); }}
                    style={{
                      display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                      borderRadius:12, border:'1px solid hsl(0 0%100%/.08)',
                      background:'hsl(0 0%100%/.03)', cursor:'pointer',
                      gridColumn: i===4 ? '1/-1' : undefined,
                      transition:'all .2s'
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='hsl(0 0%100%/.06)'}
                    onMouseLeave={e=>e.currentTarget.style.background='hsl(0 0%100%/.03)'}
                  >
                    <span style={{fontSize:22, color:'hsl(35 14%70%)'}}>{r.mark}</span>
                    <div>
                      <div style={{fontSize:13, fontWeight:500, color:'hsl(35 14%88%)'}}>{r.label}</div>
                      <div style={{fontSize:11, color:'hsl(35 12%50%)'}}>{r.sub}</div>
                    </div>
                    <Ico d={IC.chevR} size={14} style={{marginLeft:'auto', color:'hsl(35 12%40%)'}}/>
                  </div>
                ))}
              </div>
              <div style={{textAlign:'center', marginTop:20, fontSize:10, fontFamily:T.mono, color:'hsl(35 12%40%)', letterSpacing:'.08em'}}>
                DEMO ENVIRONMENT · NO REAL DATA
              </div>
            </div>
          ) : (
            <div style={{background:'hsl(0 0%100%/.03)', border:'1px solid hsl(0 0%100%/.08)', borderRadius:16, padding:28, backdropFilter:'blur(4px)'}}>
              <button onClick={()=>setStep('role')} style={{background:'none',border:'none',cursor:'pointer',color:'hsl(35 12%50%)',fontSize:12,display:'flex',alignItems:'center',gap:6,marginBottom:16,padding:0}}>
                <Ico d={IC.chevL} size={13}/> Change role
              </button>
              <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:24}}>
                <span style={{fontSize:24, color:T.gold}}>{selectedRole?.mark}</span>
                <div>
                  <div style={{fontSize:14, fontWeight:500, color:'hsl(35 14%88%)'}}>{selectedRole?.label}</div>
                  <div style={{fontSize:12, color:'hsl(35 12%50%)'}}>{selectedRole?.sub}</div>
                </div>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                <div>
                  <label style={{fontSize:11,color:'hsl(35 12%55%)',display:'block',marginBottom:4}}>Email</label>
                  <input defaultValue={`${selectedRole?.id}@hajime.jp`} style={{width:'100%',height:40,padding:'0 12px',borderRadius:8,background:'hsl(0 0%100%/.04)',border:'1px solid hsl(0 0%100%/.1)',color:'hsl(35 14%88%)',fontSize:13,fontFamily:T.body,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:'hsl(35 12%55%)',display:'block',marginBottom:4}}>Password</label>
                  <input type="password" defaultValue="demo" style={{width:'100%',height:40,padding:'0 12px',borderRadius:8,background:'hsl(0 0%100%/.04)',border:'1px solid hsl(0 0%100%/.1)',color:'hsl(35 14%88%)',fontSize:13,fontFamily:T.body,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <button onClick={()=>navigate(`/${selectedRole.id}/dashboard`)} style={{
                  height:44, background:T.gold, color:'#fff', border:'none', borderRadius:8,
                  fontWeight:600, fontSize:14, cursor:'pointer', marginTop:4, fontFamily:T.body
                }}>
                  Enter as {selectedRole?.label}
                </button>
              </div>
              <div style={{textAlign:'center', marginTop:14, fontSize:10, color:'hsl(35 12%40%)', fontFamily:T.mono}}>
                DEMO · password is anything
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { T, ROLES_CFG, NAV, RouterProvider, useRouter, AppShell, LoginPage, Topbar, Sidebar });
