/* ==========================================================================================================
   WHAT PEOPLE WALK ROUND: every solid at body height (buildings, walls, railings, shelters' ad panels, kiosks, bins,
   postboxes, parked cars, stalls, scaffold standards) from GAME.SOL, plus the street furniture you can see but the
   player walks through (lamp columns, tree trunks, bollards, benches, bus-shelter posts), in one 2 m hash built once.
   - pobHit / pobPush: is a person here, and push them out if so (every frame, no allocations).
   - pobClear: is a straight walk from A to B clear.
   - pobLane: the free lane ahead on a pavement, so walkers step round a bin or a shelter instead of through it.
   - pedPlan / pedFollow: anyone leaving the pavement line (to a bench, a queue, a door, the bus, back to the pavement,
     across a junction) walks a path: straight if it's clear, else a small A* over a 1 m grid round them (pavement
     cheaper than road), pulled tight. Up to 12 waypoints in a buffer each person keeps; the search's arrays are shared.
   The crowd is never solid to the player; this only keeps people out of things.
   ========================================================================================================== */
const POB={cell:2,map:new Map(),R:null,ready:false,n:0};
/* CROWD_FURN (45b): footprints of things that aren't in GAME.SOL, captured as the dressing is built */
function pobBuild(){ const L=[]; const add=(x0,z0,x1,z1)=>{ L.push(Math.min(x0,x1),Math.min(z0,z1),Math.max(x0,x1),Math.max(z0,z1)); };
  for(const s of GAME.SOL){ if(s.y0<1.55&&s.y1>PAVE_Y+.32){ const r=s.r; add(r[0],r[1],r[2],r[3]); } }
  for(const f of CROWD_FURN) add(f[0],f[1],f[2],f[3]);
  for(const st of CROWD_SPOTS.stops){ const w=3.4,d=1.2, lx=(u,v)=>st.ax==='x'?[st.x+u,st.z+st.side*v]:[st.x+st.side*v,st.z+u];
    for(const u of [-w/2,w/2]) for(const v of [-d/2,d/2]){ const [px,pz]=lx(u,v); add(px-.06,pz-.06,px+.06,pz+.06); } const [bx,bz]=lx(-w/2-.8,0); add(bx-.06,bz-.06,bx+.06,bz+.06); }
  const R=POB.R=new Float32Array(L), c=POB.cell, m=.6; POB.n=R.length/4;
  for(let k=0;k<POB.n;k++){ const x0=R[k*4]-m,z0=R[k*4+1]-m,x1=R[k*4+2]+m,z1=R[k*4+3]+m; if(x1-x0>400||z1-z0>400) continue;
    for(let i=Math.floor(x0/c);i<=Math.floor(x1/c);i++) for(let j=Math.floor(z0/c);j<=Math.floor(z1/c);j++){ const key=i*65536+j; let a=POB.map.get(key); if(!a) POB.map.set(key,a=[]); a.push(k); } }
  POB.ready=true; }
/* the rect index a circle of radius rad (up to 0.6) at (x,z) overlaps, or -1 */
function pobHit(x,z,rad){ const a=POB.map.get(Math.floor(x/POB.cell)*65536+Math.floor(z/POB.cell)); if(!a) return -1; const R=POB.R;
  for(let i=0;i<a.length;i++){ const k=a[i]*4; if(x>R[k]-rad&&x<R[k+2]+rad&&z>R[k+1]-rad&&z<R[k+3]+rad) return a[i]; } return -1; }
/* push a person out of anything they've ended up in, the shortest way */
const PED_R=.2;
function pobPush(p){ for(let it=0;it<3;it++){ const k=pobHit(p.x,p.z,PED_R); if(k<0) return it>0; const R=POB.R, i=k*4;
    const l=p.x-(R[i]-PED_R), r=(R[i+2]+PED_R)-p.x, t=p.z-(R[i+1]-PED_R), b=(R[i+3]+PED_R)-p.z, m=Math.min(l,r,t,b);
    if(m===l) p.x-=l+.01; else if(m===r) p.x+=r+.01; else if(m===t) p.z-=t+.01; else p.z+=b+.01; } return true; }
/* a straight walk, sampled every 0.25 m */
function pobClear(ax,az,bx,bz,rad=.18){ const d=Math.hypot(bx-ax,bz-az), n=Math.max(1,Math.ceil(d/.25)); for(let i=0;i<=n;i++){ const t=i/n; if(pobHit(ax+(bx-ax)*t,az+(bz-az)*t,rad)>=0) return false; } return true; }
/* walking along a pavement: the nearest free lane a little way ahead (or the current one if it's clear), null if none */
function pobLaneOK(L,s,dir,ln){ for(let k=0;k<3;k++){ const ss=s+dir*(k===0?.5:k===1?1.2:2), x=L.ax==='x'?ss:L.c+ln, z=L.ax==='x'?L.c+ln:ss; if(pobHit(x,z,.24)>=0) return false; } return true; }
function pobLane(L,s,dir,lane){ const hw=L.hw; if(pobLaneOK(L,s,dir,lane)) return lane;
  for(let d=.25;d<=hw*2+.01;d+=.25){ for(let sg=1;sg>=-1;sg-=2){ const ln=lane+sg*d; if(ln<-hw-.01||ln>hw+.01) continue; if(pobLaneOK(L,s,dir,ln)) return ln; } } return null; }
/* pavement lines that run into a building (or anything that fills the pavement) are cut there; a cut end is capped
   (it isn't a junction, so nobody crosses the road from it) */
function pobSplitLines(){ const out=[]; let cuts=0; POB.lines0=PLINES.length;
  for(const L of PLINES){ let start=null; const free=s=>{ for(let ln=-L.hw;ln<=L.hw+.01;ln+=.25){ const x=L.ax==='x'?s:L.c+ln, z=L.ax==='x'?L.c+ln:s; if(pobHit(x,z,.2)<0) return true; } return false; };
    for(let s=L.a;s<=L.b+.001;s+=.5){ const f=free(s); if(f&&start===null) start=s; if((!f||s+.5>L.b)&&start!==null){ const e=f?L.b:s-.5; if(e-start>2.5) out.push(Object.assign({},L,{a:start,b:e,capA:start>L.a+.01,capB:e<L.b-.01})); start=null; } } }
  for(const L of out){ if(L.capA) cuts++; if(L.capB) cuts++; }
  PLINES.length=0; for(const L of out) PLINES.push(L); POB.cuts=cuts; }

/* ---------------- paths: straight when clear, else A* over a 1 m grid in a 64 m window ---------------- */
const PW=64, PWN=PW*PW, PATH_MAX=12;
const PTH={g:new Float32Array(PWN),par:new Int32Array(PWN),stamp:new Uint32Array(PWN),closed:new Uint32Array(PWN),free:new Uint8Array(PWN),fst:new Uint32Array(PWN),heap:new Int32Array(PWN*4),hk:new Float32Array(PWN*4),run:0,cells:new Int32Array(PWN),calls:0,ms:0,fails:0};
function paFree(k,wx0,wz0){ /* is a grid cell's centre clear for a body (cached per search) */ if(PTH.fst[k]===PTH.run) return PTH.free[k]; PTH.fst[k]=PTH.run;
  const x=wx0+(k%PW)+.5, z=wz0+((k/PW)|0)+.5, f=pobHit(x,z,.22)<0&&(!NAV||navAt(x,z)>=0)?1:0; PTH.free[k]=f; return f; }
function heapPush(n,k,f){ let i=n; PTH.heap[i]=k; PTH.hk[i]=f; while(i>0){ const pi=(i-1)>>1; if(PTH.hk[pi]<=PTH.hk[i]) break; const tk=PTH.heap[pi],tf=PTH.hk[pi]; PTH.heap[pi]=PTH.heap[i]; PTH.hk[pi]=PTH.hk[i]; PTH.heap[i]=tk; PTH.hk[i]=tf; i=pi; } return n+1; }
function heapPop(n){ const top=PTH.heap[0]; n--; PTH.heap[0]=PTH.heap[n]; PTH.hk[0]=PTH.hk[n]; let i=0;
  for(;;){ const l=i*2+1, r=l+1; let m=i; if(l<n&&PTH.hk[l]<PTH.hk[m]) m=l; if(r<n&&PTH.hk[r]<PTH.hk[m]) m=r; if(m===i) break; const tk=PTH.heap[m],tf=PTH.hk[m]; PTH.heap[m]=PTH.heap[i]; PTH.hk[m]=PTH.hk[i]; PTH.heap[i]=tk; PTH.hk[i]=tf; i=m; } return top; }
/* A* from (sx,sz) to (tx,tz); writes up to max waypoints (x,z pairs) into out, returns the count (0: no path) */
function navPath(sx,sz,tx,tz,out,max){ const t0=performance.now(); PTH.calls++;
  if(Math.abs(tx-sx)>PW-8||Math.abs(tz-sz)>PW-8){ PTH.fails++; return 0; }
  const wx0=Math.floor((sx+tx)/2)-PW/2, wz0=Math.floor((sz+tz)/2)-PW/2; PTH.run++; const run=PTH.run;
  const ci=(x,z)=>Math.floor(z-wz0)*PW+Math.floor(x-wx0), s=ci(sx,sz), g=ci(tx,tz), gx=g%PW, gz=(g/PW)|0;
  let n=0; PTH.stamp[s]=run; PTH.g[s]=0; PTH.par[s]=-1; n=heapPush(n,s,0); let found=-1, exp=0;
  while(n>0&&exp<1600){ const k=heapPop(n); n--; if(PTH.closed[k]===run) continue; PTH.closed[k]=run; exp++; if(k===g){ found=k; break; }
    const ix=k%PW, iz=(k/PW)|0, cx=wx0+ix+.5, cz=wz0+iz+.5;
    for(let d=0;d<8;d++){ const dx=d<4?(d===0?1:d===1?-1:0):(d===4||d===5?1:-1), dz=d<4?(d===2?1:d===3?-1:0):(d===4||d===6?1:-1), nx=ix+dx, nz=iz+dz;
      if(nx<0||nz<0||nx>=PW||nz>=PW) continue; const nk=nz*PW+nx; if(PTH.closed[nk]===run) continue;
      if(nk===g){ if(!pobClear(cx,cz,tx,tz,.14)) continue; } else if(!paFree(nk,wx0,wz0)) continue;
      if(dx&&dz&&(!paFree(iz*PW+nx,wx0,wz0)||!paFree(nz*PW+ix,wx0,wz0))) continue; /* no cutting corners */
      if(pobHit(cx+dx*.5,cz+dz*.5,.15)>=0) continue; /* a thin wall between the two centres */
      const step=(dx&&dz?1.414:1)*(onRoad(cx+dx,cz+dz)?3:1), ng=PTH.g[k]+step;
      if(PTH.stamp[nk]===run&&PTH.g[nk]<=ng) continue; PTH.stamp[nk]=run; PTH.g[nk]=ng; PTH.par[nk]=k;
      const hx=Math.abs(nx-gx), hz=Math.abs(nz-gz); n=heapPush(n,nk,ng+Math.max(hx,hz)+.414*Math.min(hx,hz)); } }
  if(found<0){ PTH.fails++; PTH.ms+=performance.now()-t0; return 0; }
  /* the cells, start to goal, then pulled tight: from each anchor, the furthest cell still in a clear straight line */
  let m=0; for(let k=found;k>=0;k=PTH.par[k]) PTH.cells[m++]=k; const C=PTH.cells; for(let i=0;i<m>>1;i++){ const t=C[i]; C[i]=C[m-1-i]; C[m-1-i]=t; }
  const X=i=>i===m-1?tx:wx0+(C[i]%PW)+.5, Z=i=>i===m-1?tz:wz0+((C[i]/PW)|0)+.5;
  let ax=sx, az=sz, i=0, w=0;
  while(i<m-1&&w<max-1){ let j=i+1; while(j<m-1&&pobClear(ax,az,X(j+1),Z(j+1),.16)) j++; out[w*2]=X(j); out[w*2+1]=Z(j); w++; ax=X(j); az=Z(j); i=j; }
  if(w===0||out[(w-1)*2]!==tx||out[(w-1)*2+1]!==tz){ out[w*2]=tx; out[w*2+1]=tz; w++; }
  PTH.ms+=performance.now()-t0; return w; }
/* a person plans a walk to (tx,tz): false if there's no way there */
function pedPlan(p,tx,tz){ if(!p.pth) p.pth=new Float32Array(PATH_MAX*2); p.pi=0; p.ptx=tx; p.ptz=tz;
  if(pobClear(p.x,p.z,tx,tz,.16)){ p.pth[0]=tx; p.pth[1]=tz; p.pn=1; return true; }
  const n=navPath(p.x,p.z,tx,tz,p.pth,PATH_MAX); p.pn=n; return n>0; }
/* walk the plan at speed sp: returns the distance still to go (0 when there), or -1 with no plan */
function pedFollow(p,dt,sp,turnK){ if(!(p.pn>0)) return -1; let wx=p.pth[p.pi*2], wz=p.pth[p.pi*2+1], dx=wx-p.x, dz=wz-p.z, d=Math.hypot(dx,dz);
  while(d<.2&&p.pi<p.pn-1){ p.pi++; wx=p.pth[p.pi*2]; wz=p.pth[p.pi*2+1]; dx=wx-p.x; dz=wz-p.z; d=Math.hypot(dx,dz); }
  if(p.pi>0) p.free0=false; if(d<.05) return 0; const st=Math.min(d,sp*dt); p.x+=dx/d*st; p.z+=dz/d*st;
  if(!(p.free0&&p.pi===0)&&pobPush(p)) p.pushT=(p.pushT||0)+dt; else p.pushT=0;
  turnTo(p,Math.atan2(dx,dz),dt,turnK||6); return p.pi<p.pn-1?d+1:d; }
/* the nearest pavement point a person can actually walk to from here (not the one through the wall behind them) */
function nearestReach(x,z){ let best=null,bd=1e9,bs=0,best2=null,bd2=1e9,bs2=0;
  for(const L of PLINES){ const s=clamp(L.ax==='x'?x:z,L.a,L.b), [px,pz]=lineXZ(L,s), d=Math.hypot(px-x,pz-z); if(d>bd2&&d>bd) continue;
    if(d<bd&&d<30&&pobClear(x,z,px,pz,.16)){ bd=d; best=L; bs=s; } else if(d<bd2){ bd2=d; best2=L; bs2=s; } }
  if(best&&(!best2||bd<bd2+6)) return {L:best,s:bs,d:bd,clear:true}; return best2?{L:best2,s:bs2,d:bd2,clear:false}:best?{L:best,s:bs,d:bd,clear:true}:null; }
/* back to the pavement: walk to the nearest reachable line point, then carry on along it (dir: which way, 0 = either) */
function pedJoin(p,L,s,dir,strict){ const [lx,lz]=lineXZ(L,s), ok=pedPlan(p,lx,lz); if(!ok&&strict) return false; /* strict: only if there's a way */
  p.line=L; p.s=s; p.jdir=dir||(Math.random()<.5?1:-1); p.tx=lx; p.tz=lz; p.act='emerge'; p.t=0;
  if(!ok){ if(!inView(p.x,p.z,p.far||99)||p.far>30){ hide(p); return false; } p.pth[0]=lx; p.pth[1]=lz; p.pn=1; } return true; }
function pedRejoin(p,dir){ const nl=nearestReach(p.x,p.z); if(!nl){ hide(p); return false; } return pedJoin(p,nl.L,nl.s,dir); }
/* is a point clear to stand on (nudged along (ox,oz) up to n steps of 0.15 m if not); returns [x,z] or null */
function pobFree(x,z,ox,oz,n,rad){ for(let k=0;k<=n;k++){ const X=x+ox*.15*k, Z=z+oz*.15*k; if(pobHit(X,Z,rad||.22)<0) return [X,Z]; } return null; }
/* the dogs: on the owner's left, or the right, or tucked in behind, whichever is clear: [across, along (1: as asked)] */
const DOG_SIDES=[[.62,1],[-.62,1],[.32,-.55],[-.32,-.55],[.22,.25]];
function dogClear(p,lat,fwd){ const c=Math.cos(p.yaw), s=Math.sin(p.yaw), X=p.x+p.dodge[0], Z=p.z+p.dodge[1];
  for(let e=-1;e<=1;e++){ const f=fwd+e*.34, wx=X+c*lat+s*f, wz=Z-s*lat+c*f; if(pobHit(wx,wz,.16)>=0) return false; } return true; }
function dogSide(p,tz){ for(let k=0;k<DOG_SIDES.length;k++){ const S=DOG_SIDES[k]; if(dogClear(p,S[0],S[1]===1?tz:S[1])) return k; } return 4; }
/* for the tools (tools/london_crowd_solids.py): the furniture footprints people walk round, shelter posts included */
window.__crowd.furn=()=>{ const out=CROWD_FURN.map(f=>[f[0],f[1],f[2],f[3],f[4]||'furn']);
  for(const st of CROWD_SPOTS.stops){ const w=3.4,d=1.2, lx=(u,v)=>st.ax==='x'?[st.x+u,st.z+st.side*v]:[st.x+st.side*v,st.z+u];
    for(const u of [-w/2,w/2]) for(const v of [-d/2,d/2]){ const [px,pz]=lx(u,v); out.push([px-.04,pz-.04,px+.04,pz+.04,'post']); } const [bx,bz]=lx(-w/2-.8,0); out.push([bx-.04,bz-.04,bx+.04,bz+.04,'post']); }
  return out; };
window.__crowd.paths=()=>({calls:PTH.calls,fails:PTH.fails,ms:Math.round(PTH.ms),cuts:POB.cuts,rects:POB.n});
/* a first step before the plan (off a bench): walked without being pushed out of what you're leaving */
function pathPrepend(p,x,z){ const n=Math.min(p.pn,PATH_MAX-1); for(let i=n;i>0;i--){ p.pth[i*2]=p.pth[i*2-2]; p.pth[i*2+1]=p.pth[i*2-1]; } p.pth[0]=x; p.pth[1]=z; p.pn=n+1; p.pi=0; p.free0=true; }
window.__crowd.navPath=(a,b,c,d)=>{ const o=new Float32Array(PATH_MAX*2), n=navPath(a,b,c,d,o,PATH_MAX); return [n,Array.from(o.slice(0,n*2)).map(v=>+v.toFixed(2))]; };
window.__crowd.pob=(x,z,r)=>pobHit(x,z,r||.2);
/* the nearest point to (x,z) a body fits on, within maxR (rings of 0.25 m), or null */
function pobNear(x,z,maxR,rad){ if(pobHit(x,z,rad||.22)<0) return [x,z]; for(let r=.25;r<=maxR+.001;r+=.25){ const n=Math.max(8,Math.ceil(r*12)); for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, X=x+Math.cos(a)*r, Z=z+Math.sin(a)*r; if(pobHit(X,Z,rad||.22)<0) return [X,Z]; } } return null; }
