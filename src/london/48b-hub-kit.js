/* ==========================================================================================================
   THE HUB KIT: Bethnal Green at 1.5 km. The street plan, blocks and landmarks are placed by hand in 48c-hub-map.js;
   this file is the kit that builds them: painted facades with a separate lit-window layer (so the day/night cycle can
   fade it), terrace houses, shop rows with signs from one atlas, estate slabs, towers, railway viaducts with arches,
   street furniture, trees and lamps. Geometry goes straight into the chunk buckets (41-perf.js); collision goes into
   the game's SOL list; the ground is a set of rects (roads, pavements, grass) with a hash for floor height.
   ========================================================================================================== */
var HUBX=null; /* set when the hub is built; the game's walk and floor queries look at it */
const HUB={x0:-800,z0:-520,x1:800,z1:500, FLOOR:3.0, BAY:2.5};
/* the hand-built street around the start: the hub never builds or walks here, the old WALK rects do */
const CORE=[[-16,-27,29,15],[29,-2.9,36,15]];
const inCore=(x,z,m=0)=>CORE.some(r=>x>r[0]-m&&x<r[2]+m&&z>r[1]-m&&z<r[3]+m);
const hr=(seed)=>{ let s=seed>>>0||1; return ()=>{ s^=s<<13; s>>>=0; s^=s>>17; s^=s<<5; s>>>=0; return s/4294967296; }; };

/* ---------------- emit primitives (world space, straight into chunk buckets) ---------------- */
/* a quad grid: o + U*s + V*t, s in [0,w], t in [0,h]; normal = U x V; uv = (s/tu+ou, t/tv+ov) */
function eGrid(m,o,U,V,w,h,tu,tv,ou=0,ov=0,cu=0,cv=0){
  /* anything longer than a chunk is cut into chunk-sized pieces, so each piece is drawn with the chunk it sits in */
  const LIM=CHUNK; if(w>LIM*1.05){ const n=Math.ceil(w/LIM), pw=w/n; for(let i=0;i<n;i++) eGrid(m,[o[0]+U[0]*pw*i,o[1]+U[1]*pw*i,o[2]+U[2]*pw*i],U,V,pw,h,tu,tv,ou+pw*i/tu,ov,cu,cv); return; }
  if(h>LIM*1.05){ const n=Math.ceil(h/LIM), ph=h/n; for(let i=0;i<n;i++) eGrid(m,[o[0]+V[0]*ph*i,o[1]+V[1]*ph*i,o[2]+V[2]*ph*i],U,V,w,ph,tu,tv,ou,ov+ph*i/tv,cu,cv); return; }
  const nu=Math.max(1,cu?Math.round(w/cu):1), nv=Math.max(1,cv?Math.round(h/cv):1);
  const n=[U[1]*V[2]-U[2]*V[1],U[2]*V[0]-U[0]*V[2],U[0]*V[1]-U[1]*V[0]];
  const cx=o[0]+U[0]*w/2+V[0]*h/2, cz=o[2]+U[2]*w/2+V[2]*h/2, B=emitBucket(m,cx,cz,(nu+1)*(nv+1)), b0=B.n;
  for(let j=0;j<=nv;j++) for(let i=0;i<=nu;i++){ const s=w*i/nu,t=h*j/nv; B.P.push(o[0]+U[0]*s+V[0]*t,o[1]+U[1]*s+V[1]*t,o[2]+U[2]*s+V[2]*t); B.Nm.push(n[0],n[1],n[2]); B.T.push(s/tu+ou,t/tv+ov); B.n++; }
  for(let j=0;j<nv;j++) for(let i=0;i<nu;i++){ const a=b0+j*(nu+1)+i,b=a+1,c=a+nu+2,d=a+nu+1; B.I.push(a,b,c,a,c,d); } }
const X_=[1,0,0],NX=[-1,0,0],Y_=[0,1,0],Z_=[0,0,1],NZ=[0,0,-1];
/* a box with per-face materials (n,s,e,w,t; null skips a face). o.tu/o.tv tile size; o.vb is the height where v=0 (so floors line up
   across a row); o.ou/o.ov offsets; o.cell lighting cell size (per-vertex light needs vertices) */
function eBoxF(x0,z0,x1,z1,y0,y1,F,o={}){ const tu=o.tu||1,tv=o.tv||1,vb=o.vb??y0,ov=(o.ov||0)+(y0-vb)/tv,ou=o.ou||0,c=o.cell||0,cv=o.cellV||c,w=x1-x0,d=z1-z0,h=y1-y0;
  if(F.s) eGrid(F.s,[x0,y0,z1],X_,Y_,w,h,tu,tv,ou,ov,c,cv);
  if(F.n) eGrid(F.n,[x1,y0,z0],NX,Y_,w,h,tu,tv,ou,ov,c,cv);
  if(F.e) eGrid(F.e,[x1,y0,z1],NZ,Y_,d,h,tu,tv,ou,ov,c,cv);
  if(F.w) eGrid(F.w,[x0,y0,z0],Z_,Y_,d,h,tu,tv,ou,ov,c,cv);
  if(F.t) eGrid(F.t,[x0,y1,z1],X_,NZ,w,d,o.ttu||tu,o.ttv||tu,0,0,o.tcell||c,o.tcell||c); }
const eBox=(x0,z0,x1,z1,y0,y1,m,o={})=>eBoxF(x0,z0,x1,z1,y0,y1,{n:m,s:m,e:m,w:m,t:m},o);
/* a flat piece of ground, top face only */
function eFlat(x0,z0,x1,z1,y,m,tile=1,cell=3){ eGrid(m,[x0,y,z1],X_,NZ,x1-x0,z1-z0,tile,tile,(x0/tile)%1,(-z1/tile)%1,cell,cell); }
/* an engine geometry (cyl, box, plane...) at a position and yaw */
const _em=m4.make();
function eGeo(g,mats,x,y,z,ry=0,rx=0,rz=0,s=1){ m4.compose(_em,[x,y,z],[rx,ry,rz],[s,s,s]); const mesh={geo:g,mats:Array.isArray(mats)?mats:[mats],runs:null}; emitNodeMesh(g,_em,runsOf(mesh)); }
/* collision */
const hsol=(x0,z0,x1,z1,y1,y0=0)=>GAME.sol(Math.min(x0,x1),Math.min(z0,z1),Math.max(x0,x1),Math.max(z0,z1),y1,y0);

/* ---------------- the clock's materials: things that glow at night register here, the cycle scales them ---------------- */
const NIGHT_MATS=[]; /* [material, baseColour, how much it dims by day (0..1)] */
function nightM(t,o,dim=1){ const m=M(t,o); NIGHT_MATS.push([m,m.color.slice(),dim]); return m; }

/* ---------------- painted facades: a base (lit by the world) and a lit-window layer (unlit, cut) on the same layout ---------------- */
const PXM=24; /* pixels per metre on facades */
const BRICKS={
  stock:{base:'#8a7650',dark:'#6a5a3c',light:'#a48e64',mortar:'#5a4e3a',soot:.35},
  red:{base:'#7e3a2a',dark:'#5e2a1e',light:'#96503a',mortar:'#4a3028',soot:.25},
  soot:{base:'#4a3e34',dark:'#342a22',light:'#5c4e42',mortar:'#2a221c',soot:.5},
  stucco:{base:'#c8c0ac',dark:'#a8a08c',light:'#dad2be',mortar:null,soot:.2},
  grey:{base:'#8a8c88',dark:'#6e706c',light:'#9c9e9a',mortar:null,soot:.3},
  estate:{base:'#9a968a',dark:'#7e7a70',light:'#b0aca0',mortar:null,soot:.25,panel:true},
  estbrick:{base:'#6a4a34',dark:'#4e3626',light:'#7c5a40',mortar:'#3a2a20',soot:.2},
  cream:{base:'#d8ccb0',dark:'#b8ac90',light:'#e8dcc0',mortar:null,soot:.15},
};
function paintWall(g,B,w,h,r){ R(g,B.base,0,0,w,h);
  if(B.mortar){ for(let y=0;y<h;y+=3){ const off=(y/3%2)*4; for(let x=-8+off;x<w;x+=8){ const v=r(); g.fillStyle=v<.15?B.dark:v>.88?B.light:B.base; g.fillRect(x,y,7,2); } g.fillStyle=B.mortar; g.fillRect(0,y+2,w,1); } }
  else if(B.panel){ for(let y=0;y<h;y+=PXM*1.5) R(g,B.dark,0,y,w,1); for(let x=0;x<w;x+=PXM*2.5) R(g,B.dark,x,0,1,h); for(let i=0;i<w*h/40;i++) R(g,r()<.5?B.dark:B.light,r()*w|0,r()*h|0,1,1); }
  else { for(let i=0;i<w*h/30;i++) R(g,r()<.5?B.dark:B.light,r()*w|0,r()*h|0,1,1); }
  for(let i=0;i<w/6;i++){ const x=r()*w|0; vfill(g,x,0,1+(r()*3|0),h*(.2+r()*.7),[[0,`rgba(10,8,6,${B.soot})`],[1,'rgba(10,8,6,0)']]); } }
/* window kinds: sash (Victorian), estate (wide), shopflat (over shops), mansion (Boundary-estate red brick) */
const WIN={sash:{w:1.0,h:1.65,sill:.9,lintel:true}, estate:{w:1.7,h:1.3,sill:1.0}, mansion:{w:1.1,h:1.8,sill:.85,lintel:true,arch:true}, tower:{w:1.9,h:1.4,sill:.9}};
const LITC=[['#ffcf8a','#ffb060'],['#ffe2b0','#ffc080'],['#ffd8a0','#ff9a50'],['#9ab8ff','#6a88d0'],['#fff2d8','#e8d0a8'],['#ffb878','#e08040']];
/* returns {base, lit}: bays x floors tile, BAY wide, FLOOR tall */
function facadeTex(brick,win,seed,bays=4,floors=3,litP=.32){ const W_=WIN[win],B=BRICKS[brick],bw=HUB.BAY*PXM,fh=HUB.FLOOR*PXM,w=bays*bw,h=floors*fh;
  const r=hr(seed), plan=[]; for(let f=0;f<floors;f++) for(let b=0;b<bays;b++){ const lit=r()<litP; plan.push({f,b,lit,c:LITC[r()*LITC.length|0],cur:r(),fig:lit&&r()<.12,tv:r()<.15,blind:r()<.3}); }
  const ww=W_.w*PXM,wh=W_.h*PXM;
  const base=P2(w,h,(g)=>{ paintWall(g,B,w,h,r);
    for(const p of plan){ const x=p.b*bw+(bw-ww)/2, y=h-(p.f*fh+W_.sill*PXM+wh);
      if(W_.lintel) R(g,brick==='stucco'||brick==='cream'?'#e8e2d2':'#c8c0a8',x-2,y-4,ww+4,4); R(g,'#b8b2a0',x-2,y+wh,ww+4,3);
      R(g,'#e6e2d8',x-1,y-1,ww+2,wh+2); vfill(g,x+1,y+1,ww-2,wh-2,[[0,'#1c2430'],[1,'#0c1016']]);
      if(!p.lit&&p.blind) R(g,'#3a3630',x+1,y+1,ww-2,(wh-2)*(.3+p.cur*.5));
      R(g,'#e6e2d8',x,y+wh*.5,ww,2); if(win!=='estate'&&win!=='tower') R(g,'#e6e2d8',x+ww/2-1,y,2,wh);
      g.fillStyle='rgba(160,180,200,.18)'; g.fillRect(x+2,y+2,ww*.3,wh*.4); }
    if(B.panel) for(let f=1;f<floors;f++) R(g,'#6a6860',0,h-f*fh-2,w,3); },0,seed);
  const lit=P2(w,h,(g)=>{ g.clearRect(0,0,w,h);
    for(const p of plan){ if(!p.lit) continue; const x=p.b*bw+(bw-ww)/2, y=h-(p.f*fh+W_.sill*PXM+wh);
      vfill(g,x+1,y+1,ww-2,wh-2,[[0,p.tv?'#7a9ad8':p.c[0]],[1,p.tv?'#4a6ab0':p.c[1]]]);
      if(p.cur<.6){ const cc=['rgba(120,40,30,.75)','rgba(40,60,90,.7)','rgba(150,120,60,.7)','rgba(60,90,50,.7)'][(p.cur*6|0)%4]; R(g,cc,x+1,y+1,ww*.22,wh-2); R(g,cc,x+ww-1-ww*.22,y+1,ww*.22,wh-2); }
      if(p.blind) R(g,'rgba(200,170,120,.8)',x+1,y+1,ww-2,(wh-2)*(.25+p.cur*.4));
      if(p.fig){ g.fillStyle='rgba(30,20,16,.85)'; const fx=x+ww*(.3+p.cur*.4); ell(g,fx,y+wh*.42,3,3.4,'rgba(30,20,16,.85)'); g.fillRect(fx-5,y+wh*.52,10,wh*.5); }
      R(g,'rgba(30,24,20,.9)',x,y+wh*.5,ww,2); if(win!=='estate'&&win!=='tower') R(g,'rgba(30,24,20,.9)',x+ww/2-1,y,2,wh); } },0,seed+1);
  lit.nomip=false; return {base,lit,bays,floors}; }
/* cache facades by key, a few lit patterns each */
const FAC=new Map();
function facade(brick,win,v=0){ const k=brick+'|'+win+'|'+v; if(!FAC.has(k)){ const seed=7000+FAC.size*37, f=facadeTex(brick,win,seed,4,3,win==='tower'?.26:.32);
    const lm=nightM(f.lit,{unlit:true,cut:true}); f.mBase=MM(f.base); f.mLit=lm; FAC.set(k,f); } return FAC.get(k); }

/* upper floors: base on the walls, lit layer 2 cm proud of the street faces. faces: which sides get windows ('nsew') */
function eFacade(x0,z0,x1,z1,y0,y1,F,faces,o={}){ const tu=F.bays*HUB.BAY, tv=F.floors*HUB.FLOOR, ou=o.ou||0, ov=o.ov||0, plain=o.plain||F.mBase;
  const skip=o.skip||'', fm=k=>skip.includes(k)?null:faces.includes(k)?F.mBase:plain;
  /* street faces get vertices every 3 m for the lamps to light; plain backs are single quads */
  const G={n:fm('n'),s:fm('s'),e:fm('e'),w:fm('w')};
  for(const k of 'nsew'){ if(!G[k]) continue; const one={n:null,s:null,e:null,w:null,t:null}; one[k]=G[k]; eBoxF(x0,z0,x1,z1,y0,y1,one,faces.includes(k)?{tu,tv,vb:y0,ou,ov,cell:3,cellV:HUB.FLOOR}:{tu,tv,vb:y0,ou,ov}); }
  const e=.02, lm=F.mLit;
  if(faces.includes('s')) eGrid(lm,[x0,y0,z1+e],X_,Y_,x1-x0,y1-y0,tu,tv,ou,ov);
  if(faces.includes('n')) eGrid(lm,[x1,y0,z0-e],NX,Y_,x1-x0,y1-y0,tu,tv,ou,ov);
  if(faces.includes('e')) eGrid(lm,[x1+e,y0,z1],NZ,Y_,z1-z0,y1-y0,tu,tv,ou,ov);
  if(faces.includes('w')) eGrid(lm,[x0-e,y0,z0],Z_,Y_,z1-z0,y1-y0,tu,tv,ou,ov); }

/* ---------------- roofs, copings, ground ---------------- */
const tRoofFelt=P2(64,64,(g,w,h)=>{ R(g,'#2c2d30',0,0,w,h); specks(g,'#3c3d41',260,8101,w,h); specks(g,'#1c1d20',200,8102,w,h); for(let i=0;i<6;i++) R(g,'rgba(0,0,0,.25)',0,(i*11)%h,w,1); },0,1);
const tSlate=P2(64,64,(g,w,h)=>{ R(g,'#2a2e34',0,0,w,h); for(let y=0;y<h;y+=8){ const off=(y/8%2)*8; for(let x=-16+off;x<w;x+=16){ R(g,mix('#3a3f46','#262a30',Math.random()),x+1,y+1,14,6); } } },0,1);
const tGrass=P2(64,64,(g,w,h)=>{ R(g,'#2a3a22',0,0,w,h); specks(g,'#3a4c2c',500,8103,w,h); specks(g,'#1e2a18',400,8104,w,h); specks(g,'#4a5a34',80,8105,w,h); },0,1);
const tPath=P2(64,64,(g,w,h)=>{ R(g,'#3a3a3c',0,0,w,h); specks(g,'#4a4a4e',400,8106,w,h); specks(g,'#2a2a2c',300,8107,w,h); },0,1);
const tYard=P2(64,64,(g,w,h)=>{ R(g,'#3e3c38',0,0,w,h); for(let y=0;y<h;y+=32) for(let x=0;x<w;x+=32) R(g,mix('#4a4844','#36342f',((x+y)/64)%1),x+1,y+1,30,30); specks(g,'#2a2824',200,8108,w,h); },0,1);
const mFelt=MM(tRoofFelt), mSlate=MM(tSlate), mGrass=MM(tGrass), mPath=MM(tPath), mYard=MM(tYard);
const mCope=col(0x8a8680), mDark=col(0x1a1b1d), mFrame=col(0x16171a), mConc=MM(tConc), mPave=MM(tPaveW), mTarmac=MM(tTarmac), mKerb=MM(tKerb);
const mRail=col(0x111214), mRailG=col(0x1e3a2a), mBrickW=MM(tStock), mSootW=MM(tSoot);

/* ---------------- the sign atlas: every shop sign in the hub on one mipmapped 2048 page ---------------- */
const SA={W:2048,H:2048,cw:512,ch:80,cols:4,n:0,c:null,t:null,cache:new Map()};
SA.t=tex(SA.W,SA.H,null,g=>{ R(g,'#000',0,0,SA.W,SA.H); }); SA.t.smooth=true; SA.c=SA.t.c.getContext('2d'); SA.m=nightM(SA.t,{unlit:true},.35);
/* returns [u0,v0,u1,v1] of a painted sign (same args as signTex) */
function atlasSign(bg,fg,main,sub,o={}){ const key=[bg,fg,main,sub,o.face,o.subC].join('|'); if(SA.cache.has(key)) return SA.cache.get(key);
  const i=SA.n++, cx=(i%SA.cols)*SA.cw, cy=Math.floor(i/SA.cols)*SA.ch; if(cy+SA.ch>SA.H) return SA.cache.values().next().value;
  const g=SA.c; g.save(); g.translate(cx,cy); g.beginPath(); g.rect(0,0,SA.cw,SA.ch); g.clip(); drawSign(g,SA.cw,SA.ch,bg,fg,main,sub,Object.assign({w0:SA.cw/3},o)); g.restore();
  const uv=[cx/SA.W,1-(cy+SA.ch)/SA.H,(cx+SA.cw)/SA.W,1-cy/SA.H]; SA.cache.set(key,uv); return uv; }
/* a sign quad on a face: centre c, along U, width w, height h, outward normal from U x Y */
function eSign(uv,c,U,w,h){ const o=[c[0]-U[0]*w/2,c[1]-h/2,c[2]-U[2]*w/2], B=emitBucket(SA.m,c[0],c[2],4), b0=B.n, n=[U[1]*0-U[2]*1,U[2]*0-U[0]*0,U[0]*1-U[1]*0];
  const P=[[0,0],[1,0],[1,1],[0,1]]; for(const [s,t] of P){ B.P.push(o[0]+U[0]*w*s,o[1]+h*t,o[2]+U[2]*w*s); B.Nm.push(n[0],n[1],n[2]); B.T.push(uv[0]+(uv[2]-uv[0])*s,uv[1]+(uv[3]-uv[1])*t); B.n++; }
  B.I.push(b0,b0+1,b0+2,b0,b0+2,b0+3); }

/* ---------------- shop interiors, seen through the glass: painted, unlit, one per trade ---------------- */
const TRADES={
  chicken:{bg:'#c4161c',fg:'#ffd23a',face:'fat',names:['CHICKEN KING','DIXY BIRD','HALAL FRIED CHICKEN','PERI PERI HUT','TFC','CHICKEN SPOT','SAM\'S CHICKEN','CHICKEN COTTAGE'],sub:'FRIED CHICKEN · BURGERS · WRAPS',room:'#f4efe6'},
  offy:{bg:'#0e3a2a',fg:'#f3ecd2',face:'cond',names:['NEWS & WINE','LONDON FOOD & WINE','EAST END OFF LICENCE','24 HOUR SHOP','BETHNAL MINI MARKET','CORNER STORES'],sub:'OFF LICENCE · GROCERIES · OPEN LATE',room:'#efeadc'},
  phone:{bg:'#1a1a1a',fg:'#4ad0ff',face:'grot',names:['PHONE FIX','MOBILE WORLD','UNLOCK & REPAIR','CELL CITY','TECH DOCTOR'],sub:'REPAIRS · UNLOCKING · ACCESSORIES',room:'#e8ecf0'},
  barber:{bg:'#101010',fg:'#ffffff',face:'cond',names:['KUTZ','FRESH FADES','TURKISH BARBER','SHARP LINES','THE CUT'],sub:'BARBERS · NO APPOINTMENT NEEDED',room:'#e8e4dc'},
  laundry:{bg:'#2a5aa8',fg:'#ffffff',face:'grot',names:['LAUNDERETTE','WASH & GO','BUBBLES LAUNDRY'],sub:'SERVICE WASH · DRY CLEANING',room:'#eef2f4'},
  cafe:{bg:'#f2ead6',fg:'#2a2a2a',face:'grot',names:['E. PELLICCI\'S','CAFE','THE GREASY SPOON','ROSIE\'S CAFE','BREAKFAST CLUB'],sub:'BREAKFAST ALL DAY · TEAS',room:'#f6ecd8'},
  curry:{bg:'#3a0e18',fg:'#f2c24a',face:'cond',names:['TASTE OF BENGAL','SHAHI TANDOORI','THE STAR OF INDIA','MONSOON','SPICE CORNER'],sub:'BANGLADESHI & INDIAN CUISINE',room:'#f0d8b0'},
  nails:{bg:'#f6dce6',fg:'#c2185b',face:'grot',names:['NAIL STUDIO','GLAM NAILS','LUXE NAILS'],sub:'NAILS · BROWS · LASHES',room:'#fff0f4'},
  chemist:{bg:'#0c6a3a',fg:'#ffffff',face:'grot',names:['BETHNAL PHARMACY','CHEMIST','GREEN CROSS PHARMACY'],sub:'NHS PRESCRIPTIONS',room:'#f0f4f0'},
  agent:{bg:'#24324a',fg:'#ffffff',face:'grot',names:['KINGS ESTATES','EAST LETTINGS','MARSH & CO'],sub:'SALES · LETTINGS',room:'#d8dce0'},
  gold:{bg:'#141414',fg:'#f2c24a',face:'anton',names:['CASH 4 GOLD','PAWNBROKERS','GOLD BUYERS'],sub:'WE BUY GOLD · LOANS',room:'#e8dcc0'},
  vape:{bg:'#1a0a2a',fg:'#d080ff',face:'grot',names:['VAPE CITY','CLOUD NINE','VAPE LAB'],sub:'E-LIQUIDS · DEVICES',room:'#e6dcf0'},
  kebab:{bg:'#d84a10',fg:'#ffffff',face:'fat',names:['ISTANBUL KEBAB','BEST KEBAB','DIXY KEBAB','ANTEPLI'],sub:'KEBABS · PIZZA · BURGERS',room:'#f6ead8'},
  beigel:{bg:'#f6f0e2',fg:'#1a1a1a',face:'grot',names:['BEIGEL SHOP','BEIGEL BAKE','24HR BEIGELS'],sub:'OPEN 24 HOURS · SALT BEEF',room:'#f8f2e2'},
  bookie:{bg:'#183466',fg:'#f6d53a',face:'cond',names:['LUCKY STARS','BETFRED','PADDY\'S','WILLIAM\'S BETS'],sub:'BOOKMAKERS · LIVE RACING',room:'#d8e0ec'},
  hardware:{bg:'#c8a020',fg:'#1a1a1a',face:'cond',names:['EAST END HARDWARE','DIY & KEYS','LOCKSMITH & KEYS'],sub:'KEYS CUT · PAINT · TOOLS',room:'#e8e0d0'},
  charity:{bg:'#5a2a6a',fg:'#ffffff',face:'grot',names:['CANCER RESEARCH','BRITISH HEART','OXFAM'],sub:'CHARITY SHOP',room:'#ece4f0'},
  flowers:{bg:'#2a4a2a',fg:'#f6e6c0',face:'cond',names:['COLUMBIA FLOWERS','THE FLOWER STALL','PETALS'],sub:'FLOWERS · PLANTS',room:'#e8f0e0'},
  vintage:{bg:'#2a2a2a',fg:'#e8d8b8',face:'cond',names:['ROKIT','BEYOND RETRO','THE VINTAGE STORE','CHESHIRE VINTAGE'],sub:'VINTAGE · RECORDS',room:'#e0d4c0'},
};
/* real chains and real cafés are out: these are generic names, but drop any that read as a real business */
for(const k in TRADES) TRADES[k].names=TRADES[k].names.filter(n=>!/BETFRED|PADDY|ROKIT|BEYOND RETRO|OXFAM|CANCER RESEARCH|BRITISH HEART|PELLICCI|CHICKEN COTTAGE|TFC|DIXY/.test(n));
function tradeRoom(k){ const T=TRADES[k]; if(T.tex) return T.tex; const r=hr(9000+Object.keys(TRADES).indexOf(k)*13);
  T.tex=P2(256,128,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,mix(T.room,'#ffffff',.2)],[1,mix(T.room,'#000000',.15)]]); R(g,mix(T.room,'#000000',.4),0,h-18,w,18);
    if(k==='chicken'||k==='kebab'){ R(g,'#1a1a1a',8,8,240,40); for(let i=0;i<5;i++){ R(g,T.bg,12+i*48,12,42,32); ell(g,24+i*48,28,7,6,'#ffa02a'); } R(g,'#c8ccd0',10,70,236,14); R(g,T.bg,10,84,236,26); }
    else if(k==='offy'||k==='beigel'||k==='hardware'||k==='charity'||k==='vintage'){ for(let s=0;s<4;s++){ R(g,'#6a6058',0,20+s*22,w,2); for(let x=2;x<w;x+=5){ const ht=6+(r()*10|0); g.fillStyle=mix(['#c83a2a','#2a7a3a','#e8c040','#3a5ab8','#7a2a5a','#d8d4c8'][r()*6|0],'#000',r()*.3); g.fillRect(x,20+s*22-ht,4,ht); } } }
    else if(k==='phone'||k==='vape'){ for(let y=8;y<90;y+=12) for(let x=6;x<w;x+=10) R(g,mix(['#2a2a2a','#4ad0ff','#e8e8e8','#d080ff'][r()*4|0],T.room,.3),x,y,7,9); R(g,'#2a2a2a',60,96,140,14); }
    else if(k==='barber'||k==='nails'){ for(let i=0;i<3;i++){ R(g,'#c8d8e0',20+i*80,14,56,48); R(g,'#1a1a1a',34+i*80,70,28,34); R(g,'#8a1a1a',30+i*80,64,36,10); } }
    else if(k==='laundry'){ for(let i=0;i<7;i++){ R(g,'#e8e8e8',6+i*35,40,32,52); ell(g,22+i*35,64,11,11,'#2a3a4a'); ell(g,22+i*35,64,7,7,'#6a8aa8'); } }
    else if(k==='cafe'||k==='curry'){ for(let i=0;i<4;i++){ R(g,k==='curry'?'#e8d0a0':'#d8c8a8',14+i*62,74,44,6); R(g,'#3a2a20',30+i*62,80,8,26); } R(g,k==='curry'?'#c8a040':'#2a2a2a',0,8,w,6); }
    else if(k==='chemist'){ R(g,'#0c6a3a',110,12,36,36); R(g,'#fff',124,16,8,28); R(g,'#fff',114,26,28,8); for(let s=0;s<3;s++) R(g,'#d8dcd8',0,56+s*18,w,10); }
    else if(k==='agent'){ for(let i=0;i<8;i++) R(g,'#f4f4f0',8+(i%4)*62,10+(i>3?52:0),52,44); }
    else if(k==='gold'){ for(let i=0;i<6;i++) R(g,'#c8a040',10+i*40,40,30,20); R(g,'#1a1a1a',0,0,w,18); }
    else if(k==='bookie'){ for(let i=0;i<4;i++){ R(g,'#0a0a0a',10+i*60,10,54,36); R(g,'#2a6a3a',14+i*60,14,46,28); } R(g,'#e8e0c8',0,70,w,6); }
    else if(k==='flowers'){ for(let i=0;i<60;i++) ell(g,r()*w,60+r()*50,4,4,['#e84a6a','#f6d040','#ffffff','#c86ad8','#f08030'][r()*5|0]); }
    specks(g,'rgba(0,0,0,.08)',300,9100,w,h); },0,1);
  T.mRoom=nightM(T.tex,{unlit:true},.0); return T.tex; }
const SHUT=[0,1,2,3,4,5].map(i=>MM(shutterTex(8200+i*7)));

/* ---------------- street furniture (emitted) ---------------- */
const tGlowS=tGlowSodium, mLampHead=nightM(null,{color:0xffd090,unlit:true},.8), mPole=col(0x2a2d33);
const mGlow=(()=>{ const m=nightM(tGlowS,{unlit:true,double:true}); m.cut=2; return m; })();
const LAMPS=[];
function lamp(x,z,dx,dz,o={}){ const h=o.h||7.0, y0=PAVE_Y; eBoxF(x-.08,z-.08,x+.08,z+.08,y0,y0+h,{n:mPole,s:mPole,e:mPole,w:mPole}); const arm=1.25, hx=x+dx*arm, hz=z+dz*arm;
  eGeo(box(Math.abs(dx)>.5?arm:.08,.08,Math.abs(dz)>.5?arm:.08),mPole,x+dx*arm/2,y0+h-.05,z+dz*arm/2);
  eGeo(box(Math.abs(dx)>.5?.42:.26,.06,Math.abs(dz)>.5?.42:.26),mLampHead,hx,y0+h-.12,hz);
  for(let k=0;k<3;k++){ const a=k*Math.PI/3, U=[Math.cos(a),0,Math.sin(a)]; eGrid(mGlow,[hx-U[0]*.7,y0+h-1.0,hz-U[2]*.7],U,Y_,1.4,1.4,1.4,1.4); } /* three crossed cards, centred under the head so it never clips them */
  const L_=[[hx,y0+h-.3,hz],[2.6,1.45,.56],15]; STREET_LIGHT.pl.push(L_); LAMPS.push(L_); hsol(x-.12,z-.12,x+.12,z+.12,y0+h); }
const mBin=col(0x1c1e1c), mPost=col(0xb01818), mBench=col(0x3a2a1e), mBollard=col(0x18191b);
function bin(x,z){ eGeo(cyl(.28,.24,.95,8),mBin,x,PAVE_Y+.47,z); hsol(x-.28,z-.28,x+.28,z+.28,PAVE_Y+.95); }
function bollard(x,z){ eGeo(cyl(.08,.1,.9,6),mBollard,x,PAVE_Y+.45,z); }
function postbox(x,z){ eGeo(cyl(.27,.27,1.4,10),mPost,x,PAVE_Y+.7,z); eGeo(cyl(.31,.29,.14,10),mPost,x,PAVE_Y+1.45,z); eGeo(box(.3,.04,.06),mDark,x,PAVE_Y+1.15,z+.26); hsol(x-.3,z-.3,x+.3,z+.3,PAVE_Y+1.5); }
function bench(x,z,ry){ eGeo(box(1.6,.06,.45),mBench,x,PAVE_Y+.45,z,ry); eGeo(box(1.6,.4,.05),mBench,x+Math.sin(ry)*-.2,PAVE_Y+.7,z+Math.cos(ry)*-.2,ry); }
/* a London plane: trunk plus two crossed cut-out canopy cards */
const tTree=P2(96,96,(g,w,h)=>{ g.clearRect(0,0,w,h); const r=hr(8301); for(let i=0;i<260;i++){ const a=r()*Math.PI*2,d=Math.pow(r(),.6)*40; ell(g,48+Math.cos(a)*d,46+Math.sin(a)*d*.85,3+r()*4,3+r()*3,['#1e3018','#2a4020','#344c26','#16240f','#3e5a2c'][r()*5|0]); } },0,1);
const mTree=(()=>{ const m=M(tTree,{double:true,cut:true}); return m; })(), mTrunk=col(0x3a3228);
function tree(x,z,s=1,y0=PAVE_Y){ const h=3.2*s, tw=.14*s; eBoxF(x-tw,z-tw,x+tw,z+tw,y0,y0+h,{n:mTrunk,s:mTrunk,e:mTrunk,w:mTrunk}); const cw=6*s,ch=6*s, cy=y0+h-1.2*s;
  eGrid(mTree,[x-cw/2,cy,z],X_,Y_,cw,ch,cw,ch); eGrid(mTree,[x,cy,z-cw/2],Z_,Y_,cw,ch,cw,ch); hsol(x-.18,z-.18,x+.18,z+.18,y0+h); }
/* railings: a top rail, posts, bars (one cut texture) */
const tRailing=P2(32,32,(g,w,h)=>{ g.clearRect(0,0,w,h); R(g,'#121314',0,0,w,3); R(g,'#121314',0,h-4,w,4); for(let x=1;x<w;x+=6) R(g,'#121314',x,0,2,h); for(let x=1;x<w;x+=6){ R(g,'#121314',x-1,0,4,2); } },0,1);
const mRailing=(()=>{ const m=M(tRailing,{double:true,cut:true}); return m; })();
function railing(x0,z0,x1,z1,h=1.1,y0=PAVE_Y,solid=true){ const L_=Math.hypot(x1-x0,z1-z0),U=[(x1-x0)/L_,0,(z1-z0)/L_]; eGrid(mRailing,[x0,y0,z0],U,Y_,L_,h,.3,h);
  if(solid) hsol(x0-.05,z0-.05,x1+.05,z1+.05,y0+h); }
