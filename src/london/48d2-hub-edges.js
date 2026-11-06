/* ==========================================================================================================
   THE EDGES: every street that leaves the hub ends at something a Londoner believes, never an invisible wall.
   Past each exit the street carries on (road, pavements, buildings both sides, a cross street) into the haze, and at
   the boundary there's a barrier: Heras fencing and ROAD CLOSED, gas works, a developer's hoarding, a stopped bus,
   the canal bridges shut for strengthening (north), and the railway bridge at the bottom of Brick Lane (west), whose
   underpass becomes the walk-through to Shoreditch. The viaducts run on out of the hub, and the gasholders stand
   over the canal. Built after buildHub() (end of 48d), before the nav grid (end of 48j), so fences are in the nav.
   ========================================================================================================== */
const EDGE_D=38;
/* frames: s runs outward from the boundary, t along it */
const EDGEF={
  w:{R:(s0,s1,t0,t1)=>[HUB.x0-s1,t0,HUB.x0-s0,t1], P:(s,t)=>[HUB.x0-s,t], pt:'s', nt:'n', hub:'e', U:NZ, Ut:Z_},
  e:{R:(s0,s1,t0,t1)=>[HUB.x1+s0,t0,HUB.x1+s1,t1], P:(s,t)=>[HUB.x1+s,t], pt:'s', nt:'n', hub:'w', U:Z_, Ut:Z_},
  n:{R:(s0,s1,t0,t1)=>[t0,HUB.z0-s1,t1,HUB.z0-s0], P:(s,t)=>[t,HUB.z0-s], pt:'e', nt:'w', hub:'s', U:X_, Ut:X_},
  s:{R:(s0,s1,t0,t1)=>[t0,HUB.z1+s0,t1,HUB.z1+s1], P:(s,t)=>[t,HUB.z1+s], pt:'e', nt:'w', hub:'n', U:NX, Ut:X_}};

/* ---------------- textures ---------------- */
const tHeras=P2(128,64,(g,w,h)=>{ g.clearRect(0,0,w,h); g.fillStyle='rgba(120,126,130,.9)'; for(let x=3;x<w;x+=5) g.fillRect(x,3,1,h-6); for(let y=4;y<h;y+=11) g.fillRect(3,y,w-6,1);
  R(g,'#8e9498',0,0,w,3); R(g,'#8e9498',0,h-3,w,3); R(g,'#8e9498',0,0,3,h); R(g,'#8e9498',w-3,0,3,h); },0,1); tHeras.nomip=true;
const mHeras=(()=>{ const m=M(tHeras,{double:true,cut:true}); return m; })();
function boardTex(bg,fg,l1,l2,o={}){ return P2(o.w||256,o.h||128,(g,w,h)=>{ R(g,bg,0,0,w,h); if(o.border){ g.strokeStyle=o.border; g.lineWidth=o.bw||8; g.strokeRect(o.bw/2||4,o.bw/2||4,w-(o.bw||8),h-(o.bw||8)); }
  if(o.paint) o.paint(g,w,h); g.fillStyle=fg; g.textAlign='center'; g.textBaseline='middle';
  const fam=o.fam||'"LDN Archivo",Arial,Helvetica,sans-serif', wt=o.wt||'700';
  let px=o.px||Math.round(h*(l2?.3:.42)); g.font=`${wt} ${px}px ${fam}`; while(g.measureText(l1).width>w*.88&&px>8){ px--; g.font=`${wt} ${px}px ${fam}`; } g.fillText(l1,w/2,l2?h*.38:h/2);
  if(l2){ let p2=Math.round(h*.13); g.font=`500 ${p2}px "LDN Archivo",Arial,sans-serif`; while(g.measureText(l2).width>w*.9&&p2>6){ p2--; g.font=`500 ${p2}px "LDN Archivo",Arial,sans-serif`; } g.fillStyle=o.fg2||fg; g.fillText(l2,w/2,h*.72); } },0,1); }
const arrowR=(g,w,h)=>{ g.fillStyle='#111'; g.beginPath(); g.moveTo(w*.8,h*.78); g.lineTo(w*.94,h*.85); g.lineTo(w*.8,h*.92); g.fill(); g.fillRect(w*.62,h*.83,w*.2,h*.04); };
const mRoadClosed=MM(boardTex('#f4f2ec','#141414','ROAD CLOSED','',{border:'#c8102e',bw:12,w:256,h:128}));
const mDiversion=MM(boardTex('#f2c200','#141414','DIVERSION','',{w:256,h:128,paint:(g,w,h)=>{ g.fillStyle='#141414'; g.beginPath(); g.moveTo(w*.86,h*.5); g.lineTo(w*.72,h*.3); g.lineTo(w*.72,h*.7); g.fill(); }}));
const mFootway=MM(boardTex('#f4f2ec','#141414','FOOTWAY CLOSED','Pedestrians use other routes',{border:'#c8102e',bw:10}));
const mBridgeShut=MM(boardTex('#f4f2ec','#141414','BRIDGE CLOSED','Strengthening works · No pedestrian access',{border:'#c8102e',bw:10}));
const mTowpath=MM(boardTex('#1e3a5c','#f2f2ee','TOWPATH CLOSED','Regent\'s Canal · Works until further notice',{border:'#f2f2ee',bw:6}));
const tChapter8=P2(64,8,(g,w,h)=>{ for(let x=-8;x<w;x+=16){ g.fillStyle='#d01020'; g.beginPath(); g.moveTo(x,h); g.lineTo(x+8,0); g.lineTo(x+16,0); g.lineTo(x+8,h); g.fill(); g.fillStyle='#f2f0ea'; g.beginPath(); g.moveTo(x+8,h); g.lineTo(x+16,0); g.lineTo(x+24,0); g.lineTo(x+16,h); g.fill(); } },0,1);
const mChapter8=MM(tChapter8);
const mCone=col(0xe8601a), mConeW=col(0xe8e8e2), mFoot=col(0x26282a), mPly=MM(P2(64,64,(g,w,h)=>{ R(g,'#7a6a4e',0,0,w,h); specks(g,'#8a7a5c',300,9101,w,h); specks(g,'#5e5038',200,9102,w,h); for(let x=0;x<w;x+=32) R(g,'#4a3e2c',x,0,1,h); },0,1));
/* the developer's hoardings: printed vinyl over plywood, fly-posted where they can reach */
const HOARD=[
  boardTex('#1d3b2e','#e8e2c8','GOODSYARD QUARTER','1,200 new homes · shops · a park in the sky · coming 2028',{w:512,h:128,fam:'"LDN Anton",Impact,sans-serif',wt:'400',fg2:'#c8b878',
    paint:(g,w,h)=>{ g.fillStyle='rgba(232,226,200,.12)'; for(let i=0;i<9;i++){ const bw=18+(i*7)%22, bh=30+(i*37)%70; g.fillRect(20+i*52,h-bh,bw,bh); } }}),
  boardTex('#e8e4da','#1a1a1a','BRICK LANE UNDERPASS CLOSED','Pedestrian route via Sclater Street · Sorry for any inconvenience',{w:512,h:128,border:'#1a1a1a',bw:6}),
  boardTex('#f2f0ea','#0e2a5a','EAST LONDON GAS','Gas mains replacement · We\'re working as fast as we can',{w:512,h:128,fam:'"LDN Oswald",Impact,sans-serif',wt:'600',fg2:'#3a3a3a',
    paint:(g,w,h)=>{ R(g,'#f2b000',0,h-14,w,14); }}),
  boardTex('#3a1c4a','#f0e0ff','THE MILLWRIGHT','Studios · workspace · roof garden · Now letting',{w:512,h:128,fam:'"LDN Anton",Impact,sans-serif',wt:'400',fg2:'#d8c0e8'})].map(t=>MM(t));
const mPoster=[0,1,2,3,4,5].map(i=>MM(P2(32,44,(g,w,h)=>{ const r=hr(9200+i), c=[['#e8d020','#1a1a1a'],['#d0302a','#f2f0e8'],['#1a1a1a','#e8e2d0'],['#2a6ab0','#f2f2f2'],['#f2f0e8','#c0202a'],['#20a060','#101010']][i];
  R(g,c[0],0,0,w,h); g.fillStyle=c[1]; for(let k=0;k<4;k++) g.fillRect(3,5+k*(h/5),w-6-(r()*10|0),k?3:7); R(g,'rgba(0,0,0,.2)',0,h-3,w,3); },0,1)));
const mWorkLamp=nightM(null,{color:0xf8f4e8,unlit:true},.9), mAmber=nightM(null,{color:0xffa020,unlit:true},.6), mRedL=nightM(null,{color:0xff2a1a,unlit:true},.5);

/* ---------------- small pieces, in an edge frame ---------------- */
const EP=(F,s,t,y=0)=>{ const p=F.P(s,t); return [p[0],y,p[1]]; };
/* a quad facing the hub, centred on (s,t) */
function eFace(F,m,s,t,w,h,y0){ const c=EP(F,s,t), U=F.U; eGrid(m,[c[0]-U[0]*w/2,y0,c[2]-U[2]*w/2],U,Y_,w,h,w,h); }
/* a run of something along t at depth s (a fence line), facing the hub */
function eRun(F,m,s,t0,t1,h,y0,tile){ const U=F.U, a=EP(F,s,U===NZ||U===NX?t1:t0), L_=t1-t0; eGrid(m,[a[0],y0,a[2]],U,Y_,L_,h,tile||L_,h); }
function heras(F,s,t0,t1,o={}){ const y0=o.y0??PAVE_Y, n=Math.max(1,Math.round((t1-t0)/3.45)), pw=(t1-t0)/n;
  eRun(F,mHeras,s,t0,t1,2.0,y0+.12,pw);
  for(let i=0;i<=n;i++){ const p=EP(F,s,t0+i*pw); eBox(p[0]-.32,p[2]-.32,p[0]+.32,p[2]+.32,y0,y0+.14,mFoot); }
  const a=F.R(s-.08,s+.08,t0,t1); hsol(a[0],a[1],a[2],a[3],y0+2.2); }
function cone(F,s,t,y=0){ const p=EP(F,s,t); eGeo(cyl(.03,.17,.72,8),mCone,p[0],y+.36,p[2]); eGeo(cyl(.075,.11,.12,8),mConeW,p[0],y+.47,p[2]); eBox(p[0]-.2,p[2]-.2,p[0]+.2,p[2]+.2,y,y+.03,mFoot); }
function signPost(F,s,t,m,w=1.1,h=.55,y0=PAVE_Y){ const p=EP(F,s,t); eBox(p[0]-.03,p[2]-.03,p[0]+.03,p[2]+.03,y0,y0+1.7,mPole); eFace(F,m,s-.04,t,w,h,y0+1.55); }
function chapter8(F,s,t0,t1,y0=0){ eRun(F,mChapter8,s,t0,t1,.15,y0+.85,1.6); eRun(F,mChapter8,s,t0,t1,.15,y0+.4,1.6);
  for(let t=t0;t<=t1+.01;t+=Math.max(.8,(t1-t0)/Math.max(1,Math.round((t1-t0)/2)))){ const p=EP(F,s,t); eBox(p[0]-.04,p[2]-.04,p[0]+.04,p[2]+.04,y0,y0+1,mFoot); } }
function workLight(F,s,t){ const p=EP(F,s,t); eBox(p[0]-.6,p[2]-.6,p[0]+.6,p[2]+.6,0,.6,col(0xd8c020)); eBox(p[0]-.05,p[2]-.05,p[0]+.05,p[2]+.05,.6,6.2,mPole);
  eBox(p[0]-.7,p[2]-.12,p[0]+.7,p[2]+.12,6.0,6.5,mWorkLamp); STREET_LIGHT.pl.push([[p[0],5.6,p[2]],[1.5,1.5,1.45],16]); }
function tempLights(F,s,t){ const p=EP(F,s,t); eBox(p[0]-.04,p[2]-.04,p[0]+.04,p[2]+.04,0,2.6,mPole); eBox(p[0]-.18,p[2]-.18,p[0]+.18,p[2]+.18,2.0,2.9,col(0xe8e4dc));
  const c=EP(F,s-.2,t); eBox(c[0]-.07,c[2]-.07,c[0]+.07,c[2]+.07,2.66,2.8,mRedL); STREET_LIGHT.pl.push([[c[0],2.7,c[2]],[.9,.15,.1],5]); }
function posters(F,s,t0,t1,y0,seed){ const r=hr(seed); for(let t=t0+.6;t<t1-.6;t+=.78+r()*.5){ if(r()<.25) continue; eFace(F,mPoster[r()*6|0],s-.03,t,.62,.86,y0+.5+r()*.5); } }
function hoarding(F,s,t0,t1,print,seed){ const y0=PAVE_Y; eRun(F,mPly,s,t0,t1,2.5,0,1.2);
  const mid=(t0+t1)/2, pw=Math.min(9,t1-t0-1); eFace(F,HOARD[print],s-.03,mid,pw,pw/4,y0+.5);
  posters(F,s,t0,mid-pw/2,0,seed); posters(F,s,mid+pw/2,t1,0,seed+1);
  const a=F.R(s-.1,s+.1,t0,t1); hsol(a[0],a[1],a[2],a[3],2.6); }
function van(F,s,t,c=0xe8e8e4){ const r=F.R(s-2.5,s+2.5,t-1,t+1); eBox(r[0],r[1],r[2],r[3],.35,2.4,col(c)); eBox(r[0]+.1,r[1]+.1,r[2]-.1,r[3]-.1,.05,.4,mFoot); hsol(r[0],r[1],r[2],r[3],2.4);
  const st=F.R(s-2.5,s+2.5,t-1.01,t+1.01); eBoxF(st[0],st[1],st[2],st[3],1.1,1.35,{n:mCone,s:mCone,e:mCone,w:mCone}); }
const tBus=P2(128,64,(g,w,h)=>{ R(g,'#c41a1a',0,0,w,h); for(let k=0;k<2;k++){ const y=k?40:10; for(let x=4;x<w-4;x+=20){ R(g,'#1a1c20',x,y,17,15); R(g,'rgba(255,220,160,.25)',x+1,y+1,15,5); } } R(g,'#8a1010',0,30,w,3); R(g,'#2a2a2a',0,h-4,w,4); },0,1);
const mBusSide=MM(tBus), mBusEnd=MM(P2(32,64,(g,w,h)=>{ R(g,'#c41a1a',0,0,w,h); R(g,'#1a1c20',3,8,w-6,18); R(g,'#101010',3,4,w-6,4); g.fillStyle='#f0a020'; g.font='700 4px Arial'; g.fillText('NOT IN SERVICE',4,7); R(g,'#1a1c20',3,36,w-6,16); },0,1));
function bus(F,s,t){ const a=F.R(s-5.6,s+5.6,t-1.27,t+1.27), ns=F===EDGEF.w||F===EDGEF.e; const side=mBusSide,end=mBusEnd;
  eBoxF(a[0],a[1],a[2],a[3],.3,4.4,ns?{n:side,s:side,t:col(0x9a1414)}:{e:side,w:side,t:col(0x9a1414)},{tu:ns?a[2]-a[0]:a[3]-a[1],tv:4.1});
  eBoxF(a[0],a[1],a[2],a[3],.3,4.4,ns?{e:end,w:end}:{n:end,s:end},{tu:2.54,tv:4.1}); eBox(a[0]+.2,a[1]+.2,a[2]-.2,a[3]-.2,0,.3,mFoot);
  hsol(a[0],a[1],a[2],a[3],4.4); }

/* ---------------- the continuation: the street carries on past the barrier ---------------- */
const EDGE_FAC=[['stock','sash'],['red','sash'],['soot','sash'],['stock','mansion'],['brown','sash'],['red','estate']].filter(f=>BRICKS[f[0]]);
function edgeBuilding(F,s0,s1,t0,t1,face,h,k){ const a=F.R(s0,s1,t0,t1), f=EDGE_FAC[k%EDGE_FAC.length]; eFacade(a[0],a[1],a[2],a[3],0,h,facade(f[0],f[1],0),face); eFlat(a[0],a[1],a[2],a[3],h,mFelt,4,8);
  /* a ground-floor band so it isn't brick to the pavement: shopfront or rendered plinth */
  const b=F.R(s0,s1,t0,t1); eBoxF(b[0]-.03,b[1]-.03,b[2]+.03,b[3]+.03,0,PAVE_Y+.9,{n:mDark,s:mDark,e:mDark,w:mDark}); }
function continuation(X){ const F=EDGEF[X.side], D=EDGE_D, r=hr(9300+X.key.length*31+Math.round(X.c));
  /* road and pavements */
  const segs=X.gap?[[-.2,X.gap[0]],[X.gap[1],D]]:[[-.2,D]];
  for(const [s0,s1] of segs){ const a=F.R(s0,s1===D?D+7:s1,X.a,X.b); eFlat(a[0],a[1],a[2],a[3],0,mTarmac,6,4);
    for(const [p0,p1] of [[X.pa,X.a],[X.b,X.pb]]){ const q=F.R(s0,s1,p0,p1); eFlat(q[0],q[1],q[2],q[3],PAVE_Y,mPave,1.2,3); } }
  /* buildings either side, broken into two or three, stepping heights; depth kept clear of neighbours and viaducts */
  for(const [side,t0,t1,face] of [[0,X.pa-X.dl,X.pa,F.pt],[1,X.pb,X.pb+X.dr,F.nt]]){ if(t1-t0<2) continue; let k=r()*6|0;
    for(const [g0,g1] of segs){ let s=Math.max(0,g0); while(s<g1-1){ const len=Math.min(g1-s,8+r()*14); edgeBuilding(F,s,s+len,t0,t1,face,9+(r()*3|0)*3,k++); s+=len; } } }
  /* a cross street at the end, and the terrace beyond it closing the view */
  { const lo=X.pa-X.dl, hi=X.pb+X.dr, a=F.R(D,D+7,lo,hi); eFlat(a[0],a[1],a[2],a[3],0,mTarmac,6,4); const p=F.R(D+7,D+9.5,lo-6,hi+6); eFlat(p[0],p[1],p[2],p[3],PAVE_Y,mPave,1.2,3);
    let t=lo-6, k=r()*6|0; while(t<hi+6){ const w=Math.min(hi+6-t,10+r()*12); edgeBuilding(F,D+9.5,D+21,t,t+w,F.hub,9+(r()*3|0)*3,k++); t+=w; } }
  /* street lamps carry on (their light helps sell it at night) */
  for(const s of [10,30]){ if(X.gap&&s>X.gap[0]-2&&s<X.gap[1]+2) continue; const p=EP(F,s,X.a-.45), q=EP(F,s+8,X.b+.45), U=F.Ut; lamp(p[0],p[2],U[0],U[2]); lamp(q[0],q[2],-U[0],-U[2]); } }

/* ---------------- the barriers ---------------- */
const EDGE_KIND={'w:bgr':'brick-lane','e:bgr':'bus','n:camheath':'canal','n:vallance':'towpath','s:camheath':'gas','w:oldbg':'hoard','e:oldbg':'heras','w:cheshire':'heras','e:cheshire':'hoard',
  'w:colts':'gas','e:colts':'heras','w:buckhurst':'heras','e:buckhurst':'gas','s:vallance':'heras','s:barnet':'hoard'};
function barrier(X){ const F=EDGEF[X.side], kind=EDGE_KIND[X.key]||'heras', mid=(X.a+X.b)/2, s=-1.4;
  if(kind==='heras'||kind==='gas'||kind==='bus'){ heras(F,s,X.pa,X.pb,{y0:0});
    eFace(F,mRoadClosed,s-.06,mid,2.2,1.1,.8); signPost(F,s-.4,X.pa+1,mFootway,1.0,.5); signPost(F,s-.4,X.pb-1,mDiversion,1.0,.5);
    for(let t=X.a+.8;t<X.b-.6;t+=1.6) cone(F,s-2.2,t); tempLights(F,s-.6,X.a+.5); workLight(F,4,X.pb-1.6); }
  if(kind==='gas'){ const pit=F.R(3,7.5,mid-2,mid+1.6); eBox(pit[0],pit[1],pit[2],pit[3],-.01,.02,mDark); const sp=F.R(8.5,10,mid-1.5,mid+.5); eBox(sp[0],sp[1],sp[2],sp[3],0,.9,MM(tYard));
    chapter8(F,2.6,mid-2.4,mid+2); chapter8(F,7.9,mid-2.4,mid+2); van(F,12,X.b-1.6,0xf2f0ea); eFace(F,HOARD[2],s-.05,X.b-2.2,3.4,.85,1.2); }
  if(kind==='bus'){ bus(F,9,mid+1.9); van(F,22,mid-1.9,0xe8e8e4); }
  if(kind==='hoard'){ hoarding(F,s,X.pa,X.pb,X.key==='w:oldbg'?0:3,9400+Math.round(X.c)); signPost(F,s-.5,X.a+1,mRoadClosed,1.1,.55,0); }
  if(kind==='brick-lane'){ /* the railway bridge at the bottom of Brick Lane; the underpass under it is boarded (the way to Shoreditch, later) */
    hoarding(F,s,X.pa,X.pb,1,9500); workLight(F,4,X.pa+1.2); }
  if(kind==='canal'||kind==='towpath'){ heras(F,s,X.pa,X.pb,{y0:0}); eFace(F,kind==='canal'?mBridgeShut:mTowpath,s-.06,mid,2.6,1.3,.7); for(let t=X.a+.8;t<X.b-.6;t+=1.6) cone(F,s-2.2,t); workLight(F,3,X.pb-1.6); } }

/* ---------------- the railway bridge over the end of Bethnal Green Road (west) ---------------- */
function railBridge(X){ const F=EDGEF[X.side], s0=5, s1=11, top=7.2, lo=X.pa-X.dl-20, hi=X.pb+X.dr+20;
  for(const [t0,t1] of [[lo,X.pa-.2],[X.pb+.2,hi]]){ const a=F.R(s0,s1,t0,t1); eBoxF(a[0],a[1],a[2],a[3],0,top,{n:mSootW,s:mSootW,e:mSootW,w:mSootW,t:mSootW},{tu:1.6,tv:1.5}); }
  const g=F.R(s0,s1,X.pa-.2,X.pb+.2), L_=X.pb-X.pa+.4; eBox(g[0],g[1],g[2],g[3],top-1.7,top+.3,col(0x1c2822));
  eFace(F,MM(P2(256,32,(c,w,h)=>{ R(c,'#2a3a30',0,0,w,h); R(c,'#3a4c40',0,0,w,3); R(c,'#16201a',0,h-4,w,4); for(let x=6;x<w;x+=12){ R(c,'#1a241e',x,4,2,h-9); R(c,'#5a6a5e',x-3,6,1,1); R(c,'#5a6a5e',x-3,h-8,1,1); }
    c.fillStyle='#e6e2d6'; c.font='700 15px "LDN Archivo",Arial,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('BRICK LANE',w/2,h/2); },0,1)),s0-.03,(X.a+X.b)/2,L_,1.9,top-1.65);
  const p=F.R(s0,s1,lo,hi); eBox(p[0],p[1],p[2],p[3],top,top+1.1,mSootW,{tu:1.6,tv:1.5}); }

/* ---------------- the canal (north): water below a bridge, towpath, the gasholders over it ---------------- */
const mCanal=nightM(P2(64,64,(g,w,h)=>{ R(g,'#1e2a22',0,0,w,h); for(let i=0;i<40;i++) R(g,'rgba(120,150,130,.12)',(i*37)%w,(i*13)%h,8+(i%5)*3,1); },0,1),{},.0);
const tGas=P2(64,64,(g,w,h)=>{ g.clearRect(0,0,w,h); R(g,'#3a4248',0,0,6,h); R(g,'#3a4248',0,0,w,4); R(g,'#3a4248',0,h-4,w,4); g.strokeStyle='#3a4248'; g.lineWidth=2; g.beginPath(); g.moveTo(6,4); g.lineTo(w,h-4); g.moveTo(6,h-4); g.lineTo(w,4); g.stroke(); },0,1); tGas.nomip=true;
const mGas=(()=>{ const m=M(tGas,{double:true,cut:true,nofog:true}); return m; })();
function gasholder(x,z,rad,h){ const n=20, tiers=3; for(let i=0;i<n;i++){ const a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2, p0=[x+Math.cos(a0)*rad,z+Math.sin(a0)*rad], p1=[x+Math.cos(a1)*rad,z+Math.sin(a1)*rad];
    const L_=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]), U=[(p1[0]-p0[0])/L_,0,(p1[1]-p0[1])/L_]; eGrid(mGas,[p0[0],0,p0[1]],U,Y_,L_,h,L_,h/tiers); } }
function canal(X){ const F=EDGEF[X.side], c0=14, c1=26, lo=X.pa-X.dl, hi=X.pb+X.dr;
  /* the channel runs across, under the road: water, brick walls, the towpath on the far side */
  { const w=F.R(c0,c1,lo-30,hi+30); eFlat(w[0],w[1],w[2],w[3],-2.2,mCanal,4,8);
    for(const s of [c0,c1]){ const a=F.R(s-.3,s+.3,lo-30,hi+30); eBox(a[0],a[1],a[2],a[3],-2.6,0,mSootW,{tu:1.6,tv:1.5}); }
    const tp=F.R(c1-3.4,c1,lo-30,hi+30); eFlat(tp[0],tp[1],tp[2],tp[3],-1.35,mPath,2,6); }
  /* the bridge deck and its parapets */
  { const d=F.R(c0-.3,c1+.3,X.pa,X.pb); eBoxF(d[0],d[1],d[2],d[3],-.9,0,{n:mSootW,s:mSootW,e:mSootW,w:mSootW},{tu:1.6,tv:1.5}); eFlat(d[0],d[1],d[2],d[3],0,mTarmac,6,4);
    for(const t of [X.pa,X.pb-.4]){ const p=F.R(c0-.3,c1+.3,t,t+.4); eBox(p[0],p[1],p[2],p[3],0,1.15,mSootW,{tu:1.6,tv:1.5}); } }
  return [c0-.3,c1+.3]; }

/* ---------------- the viaducts run on out of the hub ---------------- */
function viaductOut(){ for(const V of VIADUCTS){ const [x0,z0,x1,z1,ax,top]=V, along=ax==='x';
    const runs=along?[[x0-60,x0],[x1,x1+60]].filter(([a,b])=>a<HUB.x0||b>HUB.x1):[[z0-60,z0],[z1,z1+60]].filter(([a,b])=>a<HUB.z0||b>HUB.z1);
    for(const [a,b] of runs){ const n=Math.round((b-a)/5), st=(b-a)/n;
      for(let i=0;i<n;i++){ const s0=a+i*st,s1=s0+st, v=ARCHT[(Math.abs(Math.round(s0*13.7))%7)%4], vv=ARCHT[(Math.abs(Math.round(s0*7.3))%5)%4];
        if(along){ eBoxF(s0,z0,s1,z1,0,top,{n:v.m,s:vv.m},{tu:st,tv:top,vb:0}); eGrid(v.lit,[s1,0,z0-.03],NX,Y_,st,top,st,top); eGrid(vv.lit,[s0,0,z1+.03],X_,Y_,st,top,st,top); }
        else { eBoxF(x0,s0,x1,s1,0,top,{e:v.m,w:vv.m},{tu:st,tv:top,vb:0}); eGrid(v.lit,[x1+.03,0,s1],NZ,Y_,st,top,st,top); eGrid(vv.lit,[x0-.03,0,s0],Z_,Y_,st,top,st,top); } }
      if(along){ eFlat(a,z0,b,z1,top,mSootW,2,8); eBox(a,z0,b,z0+.35,top,top+1.1,mSootW,{tu:1.6,tv:1.5}); eBox(a,z1-.35,b,z1,top,top+1.1,mSootW,{tu:1.6,tv:1.5}); }
      else { eFlat(x0,a,x1,b,top,mSootW,2,8); eBox(x0,a,x0+.35,b,top,top+1.1,mSootW,{tu:1.6,tv:1.5}); eBox(x1-.35,a,x1,b,top,top+1.1,mSootW,{tu:1.6,tv:1.5}); } } } }

/* ---------------- find the exits and build them ---------------- */
const EDGE_EXITS=[];
function buildEdges(){ const t0=performance.now(), v0=EMIT.verts;
  for(const r of ROADR){ const [x0,z0,x1,z1,id]=r, pv=PAVER.filter(p=>p[4]===id);
    const add=(side,a,b,pa,pb)=>EDGE_EXITS.push({side,key:side+':'+id,id,a,b,pa,pb,c:(a+b)/2});
    if(x0<=HUB.x0+.5) add('w',z0,z1,Math.min(z0,...pv.map(p=>p[1])),Math.max(z1,...pv.map(p=>p[3])));
    if(x1>=HUB.x1-.5) add('e',z0,z1,Math.min(z0,...pv.map(p=>p[1])),Math.max(z1,...pv.map(p=>p[3])));
    if(z0<=HUB.z0+.5) add('n',x0,x1,Math.min(x0,...pv.map(p=>p[0])),Math.max(x1,...pv.map(p=>p[2])));
    if(z1>=HUB.z1-.5) add('s',x0,x1,Math.min(x0,...pv.map(p=>p[0])),Math.max(x1,...pv.map(p=>p[2]))); }
  /* building depth either side: 12 m, or half the gap to the next exit, kept off the viaducts */
  const viaT=side=>VIADUCTS.filter(V=>(side==='w'||side==='e')?V[4]==='x':V[4]==='z').map(V=>(side==='w'||side==='e')?[V[1],V[3]]:[V[0],V[2]]);
  for(const X of EDGE_EXITS){ const same=EDGE_EXITS.filter(Y=>Y.side===X.side&&Y!==X); let dl=12, dr=12;
    for(const Y of same){ if(Y.pb<=X.pa) dl=Math.min(dl,(X.pa-Y.pb)/2-.2); if(Y.pa>=X.pb) dr=Math.min(dr,(Y.pa-X.pb)/2-.2); }
    for(const [v0_,v1_] of viaT(X.side)){ if(v1_<=X.pa+.01) dl=Math.min(dl,X.pa-v1_-.3); if(v0_>=X.pb-.01) dr=Math.min(dr,v0_-X.pb-.3); }
    X.dl=Math.max(0,dl); X.dr=Math.max(0,dr); }
  for(const X of EDGE_EXITS){ if(EDGE_KIND[X.key]==='canal'||EDGE_KIND[X.key]==='towpath') X.gap=[13.7,26.3]; continuation(X); barrier(X); if(EDGE_KIND[X.key]==='brick-lane') railBridge(X); if(EDGE_KIND[X.key]==='canal'||EDGE_KIND[X.key]==='towpath') canal(X); }
  viaductOut();
  /* the Bethnal Green gasholders, over the canal north-east */
  gasholder(300,-330,24,26); gasholder(352,-300,19,21);
  console.log('[london] edges:',EDGE_EXITS.length,'exits',EDGE_EXITS.map(X=>X.key+'='+(EDGE_KIND[X.key]||'heras')).join(' '),'verts',EMIT.verts-v0,'ms',Math.round(performance.now()-t0)); }
buildEdges();
