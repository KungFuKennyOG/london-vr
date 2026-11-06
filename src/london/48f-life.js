/* ==========================================================================================================
   LIFE: people on the pavements, traffic on the roads, all pooled round the player so the whole 1.5 km feels lived in
   while only ~two dozen people and a dozen vehicles exist at once. People are cheap PS1 figures (one shared atlas
   texture, five parts, hinged limbs); vehicles are one mesh plus a lights mesh. Traffic drives on the left, stops for
   people in the road, queues, and turns at junctions. Density follows the clock (LIFE.density, set by the day cycle).
   ========================================================================================================== */
const LIFE={root:N(world),peds:[],cars:[],density:.55,t:0,on:true}; LIFE.root.dyn=true;
/* ---------------- the people atlas: 8x8 cells of 32 px; colour swatches, faces, hair ---------------- */
const PA={cells:8,c:null};
const PSKIN=['#f0c8a8','#d8a07a','#a86a48','#6a4028','#e6b48a','#8a5a3a'];
const PCLOTH=['#141416','#2a2c30','#1c2a44','#3a3a3e','#5a1a1a','#1e3a26','#c8c8c0','#6a5a44','#2a4a6a','#8a2a2a','#d8b030','#d86a20','#e8e4dc','#4a2a5a','#2a2a2a','#7a7a72',
  '#c8d44a','#1a1a1a','#4a4038','#30383c'];
const PHAIR=['#141210','#2a1c14','#4a3020','#8a6a40','#c8a870','#6a6a6a','#d8d8d4'];
const tPeople=P2(256,256,(g)=>{ R(g,'#000',0,0,256,256);
  const cell=(i,fn)=>{ const x=(i%8)*32, y=Math.floor(i/8)*32; g.save(); g.translate(x,y); fn(g); g.restore(); };
  PCLOTH.forEach((c,i)=>cell(i,g=>{ R(g,c,0,0,32,32); for(let k=0;k<30;k++) R(g,mix(c,'#000',.18),(k*7)%32,(k*13)%32,1,1); }));       /* 0..19 cloth */
  PSKIN.forEach((c,i)=>cell(20+i,g=>R(g,c,0,0,32,32)));                                                                                   /* 20..25 skin */
  PSKIN.forEach((c,i)=>cell(26+i,g=>{ R(g,c,0,0,32,32); /* faces: brows, eyes with whites, nose shade, mouth */
    R(g,mix(c,'#000',.55),6,10,7,2); R(g,mix(c,'#000',.55),19,10,7,2); R(g,'#f4f0e8',7,13,5,3); R(g,'#f4f0e8',20,13,5,3); R(g,'#1a1410',9,13,2,3); R(g,'#1a1410',22,13,2,3);
    R(g,mix(c,'#000',.22),15,15,2,6); R(g,mix(c,'#5a1a1a',.5),12,24,8,2); R(g,mix(c,'#000',.1),0,28,32,4); }));                    /* 26..31 faces */
  PHAIR.forEach((c,i)=>cell(32+i,g=>{ R(g,c,0,0,32,32); for(let k=0;k<40;k++) R(g,mix(c,'#fff',.12),(k*11)%32,(k*5)%32,1,2); }));      /* 32..38 hair */
  cell(40,g=>{ R(g,'#e8e8e4',0,0,32,32); R(g,'#c8c8c4',0,24,32,8); });                                                                   /* 40 trainer */
  cell(41,g=>{ R(g,'#c8d44a',0,0,32,32); R(g,'#e8e8e0',0,12,32,4); R(g,'#e8e8e0',0,22,32,4); });                                          /* 41 hi-vis */
  cell(42,g=>{ R(g,'#141c2a',0,0,32,32); R(g,'#e8e8e0',0,26,32,3); });                                                                   /* 42 police */
  cell(43,g=>{ R(g,'#2a2a2e',0,0,32,32); R(g,'#4a4a4e',15,0,2,32); });                                                                   /* 43 zipped jacket */
  cell(44,g=>{ R(g,'#ffd060',0,0,32,32); });                                                                                             /* 44 lit/glow */
  cell(45,g=>{ R(g,'#1a1a1c',0,0,32,32); R(g,'#2a2a2e',4,4,24,24); });                                                                   /* 45 car glass */
  cell(46,g=>{ R(g,'#ffffff',0,0,32,32); });                                                                                             /* 46 white */
  cell(47,g=>{ R(g,'#c41a1a',0,0,32,32); });                                                                                             /* 47 bus red */
  cell(48,g=>{ vfill(g,0,0,32,32,[[0,'#ffe0a0'],[1,'#e8b060']]); R(g,'#3a2a1a',0,26,32,6); });                                          /* 48 lit bus window */
  cell(49,g=>{ R(g,'#2a6aff',0,0,32,32); });                                                                                             /* 49 blue light */
  cell(50,g=>{ R(g,'#e8e8e0',0,0,32,32); for(let i=0;i<4;i++){ R(g,i%2?'#2a5ab8':'#d8c040',i*8,0,8,32); } });                          /* 50 battenburg */
},0,1);
const mPeople=M(tPeople,{emissive:0x0a0a0a}), mCarLights=nightM(tPeople,{unlit:true},.6);
/* a box whose six faces each sample one atlas cell (fc: [right,left,top,bottom,front,back] cells) */
function abox(w,h,d,fc,at=[0,0,0]){ const g=box(w,h,d,{at}); for(let fi=0;fi<6;fi++){ const c=fc[fi], cu=(c%8)/8, cv=1-(Math.floor(c/8)+1)/8; for(let k=0;k<4;k++){ const i=(fi*4+k)*2; g.T[i]=cu+(.06+.88*g.T[i])/8; g.T[i+1]=cv+(.06+.88*g.T[i+1])/8; } } return g; }
const all6=c=>[c,c,c,c,c,c];
function mergeG(list){ const g=new Geo(); for(const q of list){ const b=g.P.length/3; g.P.push(...q.P); g.Nm.push(...q.Nm); g.T.push(...q.T); for(const i of q.I) g.I.push(i+b); } return g; }

/* ---------------- a person: one of the crowd on the Stairwell rig ---------------- */
function makePed(i){ const id=CROWD[i%CROWD.length], root=N(LIFE.root); root.dyn=true; const C=makeChar(id,root,'cast'); applyPose(C,'idle');
  const E={J:C.J,o:C.o,hd:0,pos:[0,0],walkAmt:0,runAmt:0,hp:{legL:1,legR:1,armL:1,armR:1},wpnHeld:false,kind:'civ',aware:false};
  const r=hr(9300+i*31), kind=['local','local','local','elder','jogger','drunk','local'][r()*7|0];
  return {root,C,E,id,kind,ph:r()*6,speed:kind==='jogger'?2.4:kind==='elder'?.85:kind==='drunk'?.9:1.1+r()*.3,line:null,s:0,dir:1,lane:0,idle:null,x:0,z:0,yaw:0,alive:false,pause:0,skinT:0,pose:'idle'}; }
/* ---------------- where people walk: a line down the middle of every pavement ---------------- */
const PLINES=[]; /* {ax:'x'|'z', c (fixed coord), a, b} */
for(const S of STREETS){ const [id,ax,c,a,b,rw,pw]=S; let pn=pw,ps=pw; if(id==='bgr'){ pn=5.6; ps=3.0; }
  const o1=c-rw/2-pn/2, o2=c+rw/2+ps/2;
  for(const off of [o1,o2]){ /* split round the old street */ const cut=id==='bgr'?[[-17,37]]:[];
    let segs=[[a,b]]; for(const [p,q] of cut) segs=segs.flatMap(([u,v])=>q<=u||p>=v?[[u,v]]:[[u,p],[q,v]].filter(([s0,s1])=>s1-s0>3));
    for(const [u,v] of segs) PLINES.push({ax,c:off,a:u,b:v,id}); } }
function lineXZ(L,s){ return L.ax==='x'?[s,L.c]:[L.c,s]; }
/* what's nearby to hop onto at a line's end */
function nextLine(L,end){ const [ex,ez]=lineXZ(L,end), out=[];
  for(const M2 of PLINES){ if(M2===L) continue; const s=clamp(M2.ax==='x'?ex:ez,M2.a,M2.b), [px,pz]=lineXZ(M2,s), d=Math.hypot(px-ex,pz-ez); if(d<14) out.push([M2,s,d]); }
  return out.length?out[Math.random()*out.length|0]:null; }

/* idlers: smokers outside pubs, people waiting by the Tube and the chicken shops */
const IDLE_SPOTS=[];
function collectIdle(){ for(const [x,z,yaw] of PUB_SPOTS){ IDLE_SPOTS.push([x,z,yaw,'smoke'],[x+.9,z+.3,yaw+.6,'drink']); } for(const [x,z] of TUBES) IDLE_SPOTS.push([x+1.2,z-1,0,'phone']); }

/* ---------------- placing people round the player ---------------- */
const PED_N=18, PED_POOL=[]; for(let i=0;i<PED_N;i++){ const p=makePed(i); p.root.vis=false; PED_POOL.push(p); }
function spawnPed(p,px,pz,near){ /* a pavement point 25-55 m away (or anywhere in range at the start) */
  for(let tries=0;tries<30;tries++){ const L=PLINES[Math.random()*PLINES.length|0], s=L.a+Math.random()*(L.b-L.a), [x,z]=lineXZ(L,s), d=Math.hypot(x-px,z-pz);
    if(d<(near?6:26)||d>55||inCore(x,z,1)) continue; p.line=L; p.s=s; p.dir=Math.random()<.5?1:-1; p.lane=(Math.random()-.5)*1.4; p.idle=null; p.alive=true; p.root.vis=true; p.x=x; p.z=z; p.pause=0; return true; }
  return false; }
function spawnIdler(p,px,pz){ const c=IDLE_SPOTS.filter(q=>{ const d=Math.hypot(q[0]-px,q[1]-pz); return d>12&&d<50&&!PED_POOL.some(o=>o.alive&&o.idle===q); }); if(!c.length) return false;
  const q=c[Math.random()*c.length|0]; p.idle=q; p.line=null; p.x=q[0]; p.z=q[1]; p.yaw=q[2]; p.alive=true; p.root.vis=true; return true; }

function pedTick(p,dt,px,pz){ const far=Math.hypot(p.x-px,p.z-pz); if(far>62){ p.alive=false; p.root.vis=false; return; }
  let moving=false;
  if(!p.idle){ /* walk the line; slow for whoever's ahead; step round the player */
    let sp=p.speed*(p.pause>0?0:1); p.pause=Math.max(0,p.pause-dt);
    const dp=Math.hypot(P_x()-p.x,P_z()-p.z); if(dp<1.6){ p.lane=clamp(p.lane+(p.lane>0?1:-1)*dt*1.5,-1.2,1.2); if(dp<.9) sp*=.3; }
    if(GAME.G.stars>0&&dp<9&&p.kind!=='drunk'){ sp=p.speed*2.2; p.flee=1; } /* a chase on: people scarper */
    p.s+=p.dir*sp*dt; moving=sp>.05;
    if(p.s<p.line.a||p.s>p.line.b){ const end=p.s<p.line.a?p.line.a:p.line.b, nl=nextLine(p.line,end);
      if(nl&&Math.random()<.85){ p.line=nl[0]; p.s=nl[1]; p.dir=p.s-nl[0].a<1?1:p.s>nl[0].b-1?-1:(Math.random()<.5?1:-1); } else { p.dir*=-1; p.s=clamp(p.s,p.line.a,p.line.b); } if(Math.random()<.2) p.pause=2+Math.random()*4; }
    const [lx,lz]=lineXZ(p.line,p.s), ox=p.line.ax==='x'?0:p.lane, oz=p.line.ax==='x'?p.lane:0, tx=lx+ox, tz=lz+oz;
    const dx=tx-p.x, dz=tz-p.z, dd=Math.hypot(dx,dz); if(dd>.01){ const k=Math.min(1,dt*6); p.x+=dx*k; p.z+=dz*k; }
    const want=p.line.ax==='x'?(p.dir>0?Math.PI/2:-Math.PI/2):(p.dir>0?0:Math.PI); p.yaw+=Math.atan2(Math.sin(want-p.yaw),Math.cos(want-p.yaw))*Math.min(1,dt*5); }
  /* the body: a pose for the idlers, the gait (planted feet) for walkers; skinned near the player every frame, further off less often */
  const C=p.C, J=C.J, want=p.idle?(p.idle[3]==='phone'?'phone':p.idle[3]==='smoke'||p.idle[3]==='drink'?'watch':'lean'):'idle';
  if(p.pose!==want){ applyPose(C,want); p.pose=want; }
  for(const k of JOINTS) if(J[k]&&C.base[k]) J[k].r=C.base[k].slice(); J.hips.p=[0,C.hy0,0];
  p.root.p=[p.x,floorAt(p.x,p.z),p.z]; p.root.r=[0,p.yaw,0];
  if(p.idle){ const bt=LIFE.t*.8+p.ph; J.head.r=[J.head.r[0],J.head.r[1]+Math.sin(bt*.6)*.4,J.head.r[2]]; }
  else { p.E.hd=p.yaw; p.E.pos=[p.x,p.z]; p.E.walkAmt=moving?1:0; p.E.runAmt=p.kind==='jogger'||p.flee?1:0; gait(p.E,LIFE.t+p.ph,dt);
    if(p.kind==='drunk') J.spine.r=[J.spine.r[0],J.spine.r[1],J.spine.r[2]+Math.sin(LIFE.t*1.3+p.ph)*.12]; }
  /* look at the player when he's close */ const pdx=GAME.P.x-p.x, pdz=GAME.P.z-p.z, pd=Math.hypot(pdx,pdz); if(pd<5){ const a=Math.atan2(pdx,pdz)-p.yaw, w=Math.atan2(Math.sin(a),Math.cos(a)); J.head.r[1]=clamp(w,-1,1); }
  p.skinT-=dt; if(p.skinT<=0){ skinUpdate(C); p.skinT=far<14?0:far<28?.06:.14; } }
const P_x=()=>GAME.P.x, P_z=()=>GAME.P.z;
function floorAt(x,z){ return HUBX&&!inCore(x,z)?HUBX.floor(x,z):(z>KERB_Z&&z<ROAD_Z1?0:PAVE_Y); }

/* ---------------- traffic ---------------- */
/* lanes: drive on the left. A street along x: eastbound keeps to the north half */
const LANES=[]; for(const S of STREETS){ const [id,ax,c,a,b,rw]=S; const off=id==='bgr'?-.9:-rw/4; LANES.push({id,ax,c,a,b,rw,off}); }
function laneXZ(L,s,dir){ const o=L.off*dir*(L.ax==='x'?1:-1); return L.ax==='x'?[s,L.c+o]:[L.c+o,s]; }
/* junctions on each street: where another street's centre crosses it */
for(const L of LANES){ L.j=[]; for(const M2 of LANES){ if(M2.ax===L.ax) continue; if(M2.c>L.a&&M2.c<L.b&&L.c>M2.a&&L.c<M2.b) L.j.push({s:M2.c,to:M2}); } L.j.sort((p,q)=>p.s-q.s); }
const PVKINDS=[['car',.5],['cab',.18],['van',.12],['bus',.08],['moped',.1],['police',.02]];
function makeVehicle(kind,seed){ const r=hr(seed), root=N(LIFE.root); root.dyn=true; const paint=kind==='cab'?17:kind==='bus'?47:kind==='police'?46:kind==='van'?[12,6,15][r()*3|0]:[0,1,2,3,4,5,6,8,9,12,15][r()*11|0];
  let parts=[], lights=[], len=4.2, wid=1.8;
  if(kind==='bus'){ len=10.4; wid=2.5; parts.push(abox(wid,1.9,len,[47,47,47,47,47,47],[0,1.2,0]),abox(wid,1.9,len-.2,[48,48,47,47,45,47],[0,3.1,0]),abox(wid+.02,.9,len-.4,[48,48,47,47,45,48],[0,1.6,-.2]),abox(wid-.1,.1,len-.1,all6(47),[0,4.1,0])); }
  else if(kind==='moped'){ len=1.8; wid=.6; parts.push(abox(.3,.5,1.6,all6(14),[0,.45,0]),abox(.34,.34,.34,all6([10,11,8][r()*3|0]),[0,1.05,-.45]),abox(.32,.55,.22,all6(43),[0,1.15,-.05]),abox(.2,.2,.2,[20,20,32,20,26,32],[0,1.55,-.05])); }
  else if(kind==='van'){ len=5.2; wid=2.0; parts.push(abox(wid,1.9,len-1.2,all6(paint),[0,1.35,-.6]),abox(wid,1.2,1.4,[paint,paint,paint,paint,45,paint],[0,.95,len/2-.7]),abox(wid-.04,.6,1.2,[45,45,paint,paint,45,paint],[0,1.75,len/2-.8])); }
  else { parts.push(abox(wid,.7,len,all6(paint),[0,.62,0]),abox(wid-.16,.55,2.2,[45,45,paint,paint,45,45],[0,1.25,-.15]));
    if(kind==='cab'){ parts.push(abox(.42,.14,.18,all6(44),[0,1.6,.3])); }
    if(kind==='police'){ parts.push(abox(wid+.02,.22,len-.6,all6(50),[0,.7,0]),abox(.9,.14,.25,all6(49),[0,1.6,0])); } }
  for(const [wx,wz] of kind==='moped'?[[0,.6],[0,-.6]]:[[-wid/2+.1,len/2-.8],[wid/2-.1,len/2-.8],[-wid/2+.1,-len/2+.8],[wid/2-.1,-len/2+.8]]) parts.push(abox(.24,.6,.6,all6(17),[wx,.3,wz]));
  const body=mk(mergeG(parts),mPeople,root);
  /* lamps: two white at the front, two red at the back (one for a moped) */
  const fr=len/2+.02, bk=-len/2-.02, hl=kind==='moped'?[[0,.8,fr]]:[[-wid/2+.3,.65,fr],[wid/2-.3,.65,fr]], tl=kind==='moped'?[[0,.7,bk]]:[[-wid/2+.25,.75,bk],[wid/2-.25,.75,bk]];
  for(const [x,y,z] of hl) lights.push(abox(.28,.14,.04,all6(46),[x,y,z])); for(const [x,y,z] of tl) lights.push(abox(.24,.14,.04,all6(47),[x,y,z]));
  const lm=mk(mergeG(lights),mCarLights,root);
  return {kind,root,body,len,wid,lane:null,s:0,dir:1,v:0,vmax:kind==='bus'?7.5:kind==='moped'?9.5:8.5+r()*2.5,turn:null,alive:false,x:0,z:0,yaw:0,honk:0}; }
const CAR_N=14, CAR_POOL=[]; for(let i=0;i<CAR_N;i++){ let u=(i*.6180339)%1, kind='car'; for(const [k,p] of PVKINDS){ if(u<p){ kind=k; break; } u-=p; } const v=makeVehicle(i===3?'bus':i===7?'police':kind,9600+i*17); v.root.vis=false; CAR_POOL.push(v); }
function spawnCar(v,px,pz){ for(let tries=0;tries<30;tries++){ const L=LANES[Math.random()*LANES.length|0], s=L.a+Math.random()*(L.b-L.a), dir=Math.random()<.5?1:-1, [x,z]=laneXZ(L,s,dir), d=Math.hypot(x-px,z-pz);
    if(d<40||d>95) continue; if(CAR_POOL.some(o=>o.alive&&Math.hypot(o.x-x,o.z-z)<14)) continue; v.lane=L; v.s=s; v.dir=dir; v.v=v.vmax*.8; v.alive=true; v.root.vis=true; v.x=x; v.z=z; v.turn=null; return true; } return false; }
function carTick(v,dt,px,pz){ if(Math.hypot(v.x-px,v.z-pz)>110){ v.alive=false; v.root.vis=false; return; }
  if(v.turn){ /* a quarter-turn through the junction */ const T=v.turn; T.t+=dt*v.v/T.len; const k=Math.min(1,T.t), a=1-k;
    v.x=a*a*T.p0[0]+2*a*k*T.c[0]+k*k*T.p1[0]; v.z=a*a*T.p0[1]+2*a*k*T.c[1]+k*k*T.p1[1]; const tx=2*a*(T.c[0]-T.p0[0])+2*k*(T.p1[0]-T.c[0]), tz=2*a*(T.c[1]-T.p0[1])+2*k*(T.p1[1]-T.c[1]); v.yaw=Math.atan2(tx,tz);
    if(k>=1){ v.lane=T.to; v.dir=T.dir; v.s=T.s1; v.turn=null; } }
  else { const L=v.lane; let want=v.vmax;
    /* look ahead: the next junction, anything in the lane (vehicles, people, you) */
    const ahead=(x,z,rng)=>{ const rx=x-v.x, rz=z-v.z, fx=Math.sin(v.yaw), fz=Math.cos(v.yaw), along=rx*fx+rz*fz, side=Math.abs(rx*fz-rz*fx); return along>0&&along<rng&&side<v.wid*.5+.9?along:null; };
    for(const o of CAR_POOL){ if(o===v||!o.alive) continue; const a=ahead(o.x,o.z,14); if(a!==null) want=Math.min(want,Math.max(0,(a-o.len/2-v.len/2-2.5)*1.2)); }
    const ap=ahead(GAME.P.x,GAME.P.z,12); if(ap!==null){ want=Math.min(want,Math.max(0,(ap-v.len/2-2)*1.0)); if(ap<v.len/2+4) v.honk=Math.max(v.honk,.6); }
    for(const p of PED_POOL){ if(!p.alive) continue; const a=ahead(p.x,p.z,9); if(a!==null) want=Math.min(want,Math.max(0,(a-v.len/2-1.5))); }
    /* the junction ahead: slow, then go straight or turn onto the crossing street */
    const js=L.j.filter(j=>v.dir>0?j.s>v.s+.5:j.s<v.s-.5); const nj=js.length?(v.dir>0?js[0]:js[js.length-1]):null;
    const endS=v.dir>0?L.b:L.a, dj=nj?Math.abs(nj.s-v.s):Math.abs(endS-v.s);
    if(dj<14) want=Math.min(want,4+dj*.4);
    if(nj&&dj<1.2){ const to=nj.to, canStraight=v.dir>0?nj.s<L.b-10:nj.s>L.a+10, opts=[]; if(canStraight) opts.push('s','s');
      for(const d of [1,-1]){ const room=d>0?to.b-L.c:L.c-to.a; if(room>20) opts.push(d); }
      const pick_=opts[Math.random()*opts.length|0];
      if(pick_!=='s'&&pick_!==undefined){ const p0=[v.x,v.z], p1=laneXZ(to,L.c+pick_*(Math.abs(to.off)+3),pick_), c=L.ax==='x'?[p1[0],p0[1]]:[p0[0],p1[1]];
        v.turn={t:0,p0,p1,c,to,dir:pick_,s1:L.c+pick_*(Math.abs(to.off)+3),len:Math.hypot(p1[0]-p0[0],p1[1]-p0[1])*1.15}; }
      else if(!canStraight){ v.dir*=-1; } v.s+=v.dir*1.3; }
    if(!nj&&dj<2){ v.dir*=-1; v.s+=v.dir*2; } /* dead end: three-point it */
    v.v+=clamp(want-v.v,-9*dt,3*dt); v.s+=v.dir*v.v*dt; const [x,z]=laneXZ(L,v.s,v.dir); v.x=x; v.z=z; v.yaw=L.ax==='x'?(v.dir>0?Math.PI/2:-Math.PI/2):(v.dir>0?0:Math.PI); }
  v.honk=Math.max(0,v.honk-dt); v.root.p=[v.x,0,v.z]; v.root.r=[0,v.yaw,0];
  if(v.kind==='police') v.root.kids[1].vis=GAME.G.stars>0?Math.sin(LIFE.t*14)>0:true; }

/* ---------------- the tick ---------------- */
let lifeInit=false;
function lifeTick(dt,eye){ if(!LIFE.on||!HUBX) return; LIFE.t+=dt; const px=GAME.P.x, pz=GAME.P.z;
  if(!lifeInit){ lifeInit=true; collectIdle(); for(const p of PED_POOL) spawnPed(p,px,pz,true); for(const v of CAR_POOL) spawnCar(v,px,pz); }
  const wantPeds=Math.round(PED_N*LIFE.density), alivePeds=PED_POOL.filter(p=>p.alive).length;
  for(const p of PED_POOL){ if(p.alive) pedTick(p,dt,px,pz); else if(alivePeds<wantPeds&&Math.random()<dt*2){ if(!(Math.random()<.3&&spawnIdler(p,px,pz))) spawnPed(p,px,pz,false); break; } }
  const wantCars=Math.round(CAR_N*Math.min(1,LIFE.density*1.4));
  let aliveCars=0; for(const v of CAR_POOL){ if(v.alive){ aliveCars++; carTick(v,dt,px,pz); } }
  if(aliveCars<wantCars) for(const v of CAR_POOL) if(!v.alive){ spawnCar(v,px,pz); break; } }
/* people and vehicles push you back rather than letting you walk through them */
function lifeBlocks(x,z,r){ for(const v of CAR_POOL){ if(!v.alive) continue; const dx=x-v.x, dz=z-v.z, c=Math.cos(v.yaw), s=Math.sin(v.yaw), lx=dx*c-dz*s, lz=dx*s+dz*c; if(Math.abs(lx)<v.wid/2+r&&Math.abs(lz)<v.len/2+r) return true; }
  for(const p of PED_POOL){ if(p.alive&&Math.hypot(x-p.x,z-p.z)<r+.22) return true; } return false; }
