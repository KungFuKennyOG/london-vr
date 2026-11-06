/* ==========================================================================================================
   DRAW DISTANCE: full detail out to LOD.near; past it, out to the haze, every building is a stand-in box wearing its own
   facade (shrunk into one atlas, so the whole distant city is two materials), with its lit windows at night, the trees
   as single cards, the lamps as glows, and the ground as one painted map of the hub. Chunked like the detail, so the
   frustum culls it; drawBaked() picks detail or stand-in per chunk by its nearest distance to the eye.
   ========================================================================================================== */
const LOD={near:46, idx:new Map(), root:N(null), map:null, verts:0};
const LCELL=64, LATW=1024, LCOLS=LATW/LCELL;
function buildLOD(){ const t0=performance.now(), Fs=[...new Set(LOD_REC.fac.map(r=>r[6]))];
  /* the atlases: cell 0 roof felt, 1 a ground floor (dark shopfronts / lit shop glow), 2.. one per facade */
  const cellUV=i=>{ const cx=(i%LCOLS)*LCELL, cy=Math.floor(i/LCOLS)*LCELL, e=1.5; return [(cx+e)/LATW,1-(cy+LCELL-e)/LATW,(cx+LCELL-e)/LATW,1-(cy+e)/LATW]; };
  const cellOf=new Map(); Fs.forEach((F,i)=>cellOf.set(F,2+i)); const TREEC=2+Fs.length;
  const base=P2(LATW,LATW,(g,w,h)=>{ R(g,'#2c2d30',0,0,w,h); R(g,'#2a2a2c',LCELL,0,LCELL,LCELL); for(let k=0;k<4;k++){ R(g,'#141518',LCELL+4+k*15,LCELL*.25,11,LCELL*.75); }
    Fs.forEach((F,i)=>{ const c=2+i; if(F.base&&F.base.c) g.drawImage(F.base.c,(c%LCOLS)*LCELL,Math.floor(c/LCOLS)*LCELL,LCELL,LCELL); });
    { const c=TREEC, x=(c%LCOLS)*LCELL, y=Math.floor(c/LCOLS)*LCELL; g.clearRect(x,y,LCELL,LCELL); g.drawImage(tTree.c,x,y,LCELL,LCELL); R(g,'#3a3228',((c+1)%LCOLS)*LCELL,Math.floor((c+1)/LCOLS)*LCELL,LCELL,LCELL); } },0,1);
  const lit=P2(LATW,LATW,(g,w,h)=>{ g.clearRect(0,0,w,h); for(let k=0;k<4;k++){ R(g,k%2?'#ffd8a0':'#f4f0e4',LCELL+4+k*15,LCELL*.35,11,LCELL*.45); }
    Fs.forEach((F,i)=>{ const c=2+i; if(F.lit&&F.lit.c) g.drawImage(F.lit.c,(c%LCOLS)*LCELL,Math.floor(c/LCOLS)*LCELL,LCELL,LCELL); });
    if(tGlowS&&tGlowS.c){ const c=TREEC+2; g.drawImage(tGlowS.c,(c%LCOLS)*LCELL,Math.floor(c/LCOLS)*LCELL,LCELL,LCELL); } },0,1);
  const mB=M(base,{cut:true,double:true}), mL=nightM(lit,{unlit:true,cut:true,double:true}); LOD.mB=mB; LOD.mL=mL;
  /* emit into a private bucket set, then flush into the LOD index */
  const saved=EMIT.buckets; EMIT.buckets=new Map(); const v0=EMIT.verts;
  const quadSeg=(m,o,U,w,h,uv,cw,ch,y0)=>{ /* tile a face with cell-sized pieces: cw x ch metres per cell */
    for(let s=0;s<w-.01;s+=cw) for(let t=0;t<h-.01;t+=ch){ const sw=Math.min(cw,w-s), th=Math.min(ch,h-t), p=[o[0]+U[0]*s,o[1]+t,o[2]+U[2]*s];
      eGrid(m,p,U,Y_,sw,th,cw/(uv[2]-uv[0]),ch/(uv[3]-uv[1]),uv[0],uv[1]); } };
  for(const [x0,z0,x1,z1,y0,y1,F,faces,skip] of LOD_REC.fac){ const c=cellOf.get(F), uv=cellUV(c), cw=(F.bays||4)*HUB.BAY, ch=(F.floors||3)*HUB.FLOOR, g1=cellUV(1);
    const sides={s:[[x0,0,z1],X_,x1-x0],n:[[x1,0,z0],NX,x1-x0],e:[[x1,0,z1],NZ,z1-z0],w:[[x0,0,z0],Z_,z1-z0]};
    for(const k of 'nsew'){ if(skip.includes(k)) continue; const [o,U,w]=sides[k], street=faces.includes(k);
      quadSeg(mB,[o[0],y0,o[2]],U,w,y1-y0,uv,cw,ch); const nx=-U[2]*.03, nz=U[0]*.03; if(street) quadSeg(mL,[o[0]+nx,y0,o[2]+nz],U,w,y1-y0,uv,cw,ch);
      if(y0>.5){ quadSeg(mB,[o[0],0,o[2]],U,w,y0,g1,10,y0); if(street&&((Math.round(x0*7+z0*3)&3)!==0)) quadSeg(mL,[o[0]+nx,0,o[2]+nz],U,w,y0,g1,10,y0); } }
    const r0=cellUV(0); eGrid(mB,[x0,y1,z1],X_,NZ,x1-x0,z1-z0,(x1-x0)/(r0[2]-r0[0]),(z1-z0)/(r0[3]-r0[1]),r0[0],r0[1]); }
  /* trees: one card each, turned to face along x (crossed pairs cost twice; one reads fine at range) */
  { const tu=cellUV(TREEC), bu=cellUV(TREEC+1), card=(o,U,w,h,uv)=>eGrid(mB,o,U,Y_,w,h,w/(uv[2]-uv[0]),h/(uv[3]-uv[1]),uv[0],uv[1]);
    for(const [x,z,s,y0] of LOD_REC.trees){ const cw=6*s, cy=y0+3.2*s-1.2*s; card([x-cw/2,cy,z],X_,cw,cw,tu); card([x,cy,z-cw/2],Z_,cw,cw,tu); card([x-.15*s,y0,z],X_,.3*s,cy-y0+.5,bu); card([x,y0,z-.15*s],Z_,.3*s,cy-y0+.5,bu); } }
  /* lamps: the glow card, which is what you see of a lamp from 100 m at night */
  { const gu=cellUV(TREEC+2); for(const [x,y,z] of LOD_REC.lamps){ eGrid(mL,[x-.7,y-.7,z],X_,Y_,1.4,1.4,1.4/(gu[2]-gu[0]),1.4/(gu[3]-gu[1]),gu[0],gu[1]); eGrid(mL,[x,y-.7,z-.7],Z_,Y_,1.4,1.4,1.4/(gu[2]-gu[0]),1.4/(gu[3]-gu[1]),gu[0],gu[1]); } }
  LOD.verts=EMIT.verts-v0; let n=0;
  for(const [k,list] of EMIT.buckets) for(const B of list){ if(!B.I.length) continue; const g=new Geo(); g.P=new Float32Array(B.P); g.Nm=new Float32Array(B.Nm); g.T=new Float32Array(B.T); g.I=new Uint16Array(B.I);
    const node=mk(g,B.m,LOD.root); geoBounds(g); const c=g.bs.c, ck=Math.floor(c[0]/CHUNK)*4096+Math.floor(c[2]/CHUNK); (LOD.idx.get(ck)||LOD.idx.set(ck,[]).get(ck)).push(node); n++; }
  EMIT.buckets=saved; EMIT.verts=v0;
  /* the ground: one painted top-down map of the whole hub (and the street continuations), under everything */
  { const X0=HUB.x0-60, Z0=HUB.z0-60, W=HUB.x1-HUB.x0+120, H=HUB.z1-HUB.z0+120, S=1024/W;
    const t=P2(1024,Math.ceil(H*S),(g,w,h)=>{ R(g,'#3a3a36',0,0,w,h); const fr=(r,c)=>R(g,c,(r[0]-X0)*S,(r[1]-Z0)*S,(r[2]-r[0])*S,(r[3]-r[1])*S);
      for(const r of PAVES) fr(r,'#6a6862'); for(const r of ROADS) fr(r,'#2a2a2c');
      for(const L_ of LANDMARK_BLOCKS){ const [nm,a,b,c,d]=L_; if(['weavers','gardens','church'].includes(nm)) fr([a,b,c,d],'#2e4226'); }
      for(const X of (typeof EDGE_EXITS!=='undefined'?EDGE_EXITS:[])){ const F=EDGEF[X.side]; fr(F.R(0,EDGE_D+7,X.a,X.b),'#2a2a2c'); } },0,1);
    const g=new Geo(); const y=-.03; g.v([X0,y,Z0+H],[0,1,0],[0,0]); g.v([X0+W,y,Z0+H],[0,1,0],[1,0]); g.v([X0+W,y,Z0],[0,1,0],[1,1]); g.v([X0,y,Z0],[0,1,0],[0,1]); g.I.push(0,1,2,0,2,3); g.noDist=true; geoBounds(g);
    LOD.map=mk(g,M(t,{}),LOD.root); }
  console.log('[london] lod: facades',LOD_REC.fac.length,'kinds',Fs.length,'trees',LOD_REC.trees.length,'lamps',LOD_REC.lamps.length,'verts',LOD.verts,'nodes',n,'ms',Math.round(performance.now()-t0)); }
buildLOD();
