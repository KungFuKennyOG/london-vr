
/* =====================================================================================================
   HOUSE CALLS · art direction set 03 for Stairwell. Ray breaks into the houses of the five people who set his
   team up. Runs on the Stairwell engine (src/10-engine.js) plus the floor assets (src/20-floor-assets.js):
   same renderer, PS1 pass, painted garments and faces, same skinned rig. Everything below is new content.
   ===================================================================================================== */
for(const k in groups) groups[k].vis=false;

/* ---------- canvas painting helpers: smooth gradients first, the PS1 pass quantises them ---------- */
function P2(w,h,fn,gr=0,seed=1){ return tex(w,h,null,g=>{ fn(g,w,h); if(gr) grain(g,gr,seed); }); }
function grad(g,x0,y0,x1,y1,stops){ const q=g.createLinearGradient(x0,y0,x1,y1); for(const [t,c] of stops) q.addColorStop(t,c); return q; }
function vfill(g,x,y,w,h,stops){ g.fillStyle=grad(g,0,y,0,y+h,stops); g.fillRect(x,y,w,h); }
function hfill(g,x,y,w,h,stops){ g.fillStyle=grad(g,x,0,x+w,0,stops); g.fillRect(x,y,w,h); }
function radial(g,cx,cy,r,stops){ const q=g.createRadialGradient(cx,cy,0,cx,cy,r); for(const [t,c] of stops) q.addColorStop(t,c); g.fillStyle=q; g.fillRect(cx-r,cy-r,r*2,r*2); }
function ell(g,cx,cy,rx,ry,col){ g.fillStyle=col; g.beginPath(); g.ellipse(cx,cy,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2); g.fill(); }
function poly(g,pts,col){ g.fillStyle=col; g.beginPath(); pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); g.fill(); }
function rgba(hex,a){ const [r,g_,b]=hexRGB(hex); return `rgba(${r},${g_},${b},${a})`; }
