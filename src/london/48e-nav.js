/* ==========================================================================================================
   NAV: a 1 m grid over the whole hub, built once from the same solids the player collides with.
   - walk: where a copper can walk (no climbing, no vaulting: anything from knee to head height stops them)
   - tall: what hides you (anything over 1.7 m: buildings, walls, the viaducts, vans)
   Cops chase on a breadth-first distance field from their goal, rebuilt as the goal moves, over a window round them;
   sight is a march along the grid (plus the old street's hand-placed sight blockers, clipped to the old street).
   ========================================================================================================== */
var NAV=null;
function buildNav(){ const t0=performance.now(), x0=HUB.x0,z0=HUB.z0, W=HUB.x1-HUB.x0, H=HUB.z1-HUB.z0, walk=new Uint8Array(W*H), tall=new Uint8Array(W*H);
  /* walkable ground: the hub everywhere outside the old street; inside it, the old WALK rects */
  for(let z=0;z<H;z++) for(let x=0;x<W;x++){ const wx=x0+x+.5, wz=z0+z+.5; if(!inCore(wx,wz,0)) walk[z*W+x]=1; }
  for(const r of GAME.WALK){ for(let z=Math.max(0,Math.ceil(r[1]-z0));z<Math.min(H,Math.floor(r[3]-z0));z++) for(let x=Math.max(0,Math.ceil(r[0]-x0));x<Math.min(W,Math.floor(r[2]-x0));x++) walk[z*W+x]=1; }
  /* solids: low ones (above a kerb) stop walking; tall ones also stop sight. Overhead ones (bridges, canopies) are neither */
  for(const s of GAME.SOL){ if(s.y0>1.6) continue; const blocksWalk=s.y1>PAVE_Y+.42, isTall=s.y1>1.75;
    if(!blocksWalk) continue; const r=s.r; const xa=Math.max(0,Math.floor(r[0]-x0)), xb=Math.min(W-1,Math.floor(r[2]-x0)), za=Math.max(0,Math.floor(r[1]-z0)), zb=Math.min(H-1,Math.floor(r[3]-z0));
    for(let z=za;z<=zb;z++) for(let x=xa;x<=xb;x++){ walk[z*W+x]=0; if(isTall) tall[z*W+x]=1; } }
  for(const b of GAME.BLOCK){ for(let z=Math.floor(b[1]-z0);z<=Math.floor(b[3]-z0);z++) for(let x=Math.floor(b[0]-x0);x<=Math.floor(b[2]-x0);x++) walk[z*W+x]=0; }
  NAV={x0,z0,W,H,walk,tall,ms:0}; NAV.ms=performance.now()-t0; console.log('[london] nav grid',W+'x'+H,'ms',Math.round(NAV.ms)); }
const navAt=(x,z)=>{ const ix=Math.floor(x-NAV.x0), iz=Math.floor(z-NAV.z0); return ix<0||iz<0||ix>=NAV.W||iz>=NAV.H?-1:iz*NAV.W+ix; };
function navWalk(x,z,rad=.22){ for(const [dx,dz] of [[0,0],[-rad,-rad],[rad,-rad],[-rad,rad],[rad,rad]]){ const k=navAt(x+dx,z+dz); if(k<0||!NAV.walk[k]) return false; } return true; }
/* sight across the grid: anything tall between two points (ends excluded) hides one from the other */
function navSight(ax,az,bx,bz){ const d=Math.hypot(bx-ax,bz-az), n=Math.ceil(d/.5); for(let i=2;i<n-1;i++){ const t=i/n, k=navAt(ax+(bx-ax)*t,az+(bz-az)*t); if(k>=0&&NAV.tall[k]) return false; } return true; }

/* a distance field to a goal over a window; returns a function giving the next waypoint from a position */
const FIELD_R=60;
function fieldTo(gx,gz,cx,cz){ const wx0=Math.floor(Math.min(gx,cx)-FIELD_R/2), wz0=Math.floor(Math.min(gz,cz)-FIELD_R/2), ww=Math.min(260,Math.ceil(Math.abs(gx-cx)+FIELD_R)), wh=Math.min(260,Math.ceil(Math.abs(gz-cz)+FIELD_R));
  const dist=new Uint16Array(ww*wh).fill(65535), q=new Int32Array(ww*wh); let qh=0,qt=0;
  const cell=(x,z)=>{ const ix=Math.floor(x-wx0), iz=Math.floor(z-wz0); return ix<0||iz<0||ix>=ww||iz>=wh?-1:iz*ww+ix; };
  const ok=k=>{ const ix=k%ww, iz=(k/ww)|0, g=navAt(wx0+ix+.5,wz0+iz+.5); return g>=0&&NAV.walk[g]; };
  /* seed from the goal, or the nearest walkable cell to it */
  let s=cell(gx,gz); if(s<0||!ok(s)){ let best=-1,bd=1e9; for(let dz=-4;dz<=4;dz++) for(let dx=-4;dx<=4;dx++){ const k=cell(gx+dx,gz+dz); if(k>=0&&ok(k)&&dx*dx+dz*dz<bd){ bd=dx*dx+dz*dz; best=k; } } s=best; }
  if(s>=0){ dist[s]=0; q[qt++]=s; }
  while(qh<qt){ const k=q[qh++], ix=k%ww, iz=(k/ww)|0, dk=dist[k]+1;
    if(ix>0&&dist[k-1]>dk&&ok(k-1)){ dist[k-1]=dk; q[qt++]=k-1; } if(ix<ww-1&&dist[k+1]>dk&&ok(k+1)){ dist[k+1]=dk; q[qt++]=k+1; }
    if(iz>0&&dist[k-ww]>dk&&ok(k-ww)){ dist[k-ww]=dk; q[qt++]=k-ww; } if(iz<wh-1&&dist[k+ww]>dk&&ok(k+ww)){ dist[k+ww]=dk; q[qt++]=k+ww; } }
  return { gx,gz, reach:(x,z)=>{ const k=cell(x,z); return k>=0&&dist[k]<65535; },
    next:(x,z)=>{ let k=cell(x,z); if(k<0||dist[k]===65535) return null; /* walk the field downhill a few cells: the waypoint is where it turns */
      let px=x,pz=z; for(let step=0;step<5;step++){ const ix=k%ww, iz=(k/ww)|0; let best=k; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){ const nx=ix+dx,nz=iz+dz; if(nx<0||nz<0||nx>=ww||nz>=wh) continue; const nk=nz*ww+nx; if(dist[nk]<dist[best]&&(dx===0||dz===0||(dist[iz*ww+nx]<65535&&dist[nz*ww+ix]<65535))) best=nk; }
        if(best===k) break; k=best; px=wx0+(k%ww)+.5; pz=wz0+((k/ww)|0)+.5; }
      return [px,pz]; } }; }
/* built at the end of 48j, after the street furniture */
