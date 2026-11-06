/* ==========================================================================================================
   WHAT PEOPLE WALK ROUND: every solid at body height (buildings, walls, railings, shelters' ad panels, kiosks, bins,
   postboxes, parked cars, stalls, scaffold standards) from GAME.SOL, plus the street furniture you can see but the
   player walks through (lamp columns, tree trunks, bollards, bus-shelter posts), in one 2 m hash built once.
   - pobHit / pobPush: is a person here, and push them out if so (every frame, no allocations).
   - pobClear: is a straight walk from A to B clear (for hops between pavements, doors, walking up to a spot).
   - pobLane: the free lane ahead on a pavement, so walkers step round a bin or a shelter instead of through it.
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
/* the rect index a circle of radius rad at (x,z) overlaps, or -1 */
function pobHit(x,z,rad){ const a=POB.map.get(Math.floor(x/POB.cell)*65536+Math.floor(z/POB.cell)); if(!a) return -1; const R=POB.R;
  for(let i=0;i<a.length;i++){ const k=a[i]*4; if(x>R[k]-rad&&x<R[k+2]+rad&&z>R[k+1]-rad&&z<R[k+3]+rad) return a[i]; } return -1; }
/* push a person out of anything they've ended up in, the shortest way */
const PED_R=.2;
function pobPush(p){ for(let it=0;it<3;it++){ const k=pobHit(p.x,p.z,PED_R); if(k<0) return it>0; const R=POB.R, i=k*4;
    const l=p.x-(R[i]-PED_R), r=(R[i+2]+PED_R)-p.x, t=p.z-(R[i+1]-PED_R), b=(R[i+3]+PED_R)-p.z, m=Math.min(l,r,t,b);
    if(m===l) p.x-=l+.01; else if(m===r) p.x+=r+.01; else if(m===t) p.z-=t+.01; else p.z+=b+.01; } return true; }
/* a straight walk, sampled every 0.25 m */
function pobClear(ax,az,bx,bz,rad=.18){ const d=Math.hypot(bx-ax,bz-az), n=Math.max(1,Math.ceil(d/.25)); for(let i=0;i<=n;i++){ const t=i/n; if(pobHit(ax+(bx-ax)*t,az+(bz-az)*t,rad)>=0) return false; } return true; }
/* walking along a pavement: the nearest free lane a little way ahead (or the current one if it's clear) */
function pobLane(L,s,dir,lane){ const hw=L.hw, ok=ln=>{ for(const a of [.5,1.2,2]){ const ss=s+dir*a, x=L.ax==='x'?ss:L.c+ln, z=L.ax==='x'?L.c+ln:ss; if(pobHit(x,z,.24)>=0) return false; } return true; };
  if(ok(lane)) return lane; for(let d=.25;d<=hw*2+.01;d+=.25){ for(const sg of [1,-1]){ const ln=lane+sg*d; if(ln<-hw-.01||ln>hw+.01) continue; if(ok(ln)) return ln; } } return null; }
/* pavement lines that run into a building (or anything that fills the pavement) are cut there */
function pobSplitLines(){ const out=[];
  for(const L of PLINES){ let start=null; const free=s=>{ for(let ln=-L.hw;ln<=L.hw+.01;ln+=.25){ const x=L.ax==='x'?s:L.c+ln, z=L.ax==='x'?L.c+ln:s; if(pobHit(x,z,.2)<0) return true; } return false; };
    for(let s=L.a;s<=L.b+.001;s+=.5){ const f=free(s); if(f&&start===null) start=s; if((!f||s+.5>L.b)&&start!==null){ const e=f?L.b:s-.5; if(e-start>2.5) out.push(Object.assign({},L,{a:start,b:e})); start=null; } } }
  PLINES.length=0; for(const L of out) PLINES.push(L); }
