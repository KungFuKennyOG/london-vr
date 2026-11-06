/* ==========================================================================================================
   THE HUB KIT: Bethnal Green at 1.5 km. The street plan, blocks and landmarks are placed by hand in 48c-hub-map.js;
   this file is the kit that builds them: painted facades with a separate lit-window layer (so the day/night cycle can
   fade it), terrace houses, shop rows with signs from one atlas, estate slabs, towers, railway viaducts with arches,
   street furniture, trees and lamps. Geometry goes straight into the chunk buckets (41-perf.js); collision goes into
   the game's SOL list; the ground is a set of rects (roads, pavements, grass) with a hash for floor height.
   ========================================================================================================== */
var HUBX=null; /* set when the hub is built; the game's walk and floor queries look at it */
const HUB={x0:-370,z0:-250,x1:370,z1:240, FLOOR:3.0, BAY:2.5};
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
  brown:{base:'#5e4632',dark:'#46342a',light:'#705842',mortar:'#3a2c22',soot:.3},
  cream:{base:'#b8b4a8',dark:'#98948a',light:'#c8c4b8',mortar:null,soot:.32},
  /* hand-written frontages: yellow London stock, 1950s buff, and painted brick (the courses still show through the paint) */
  yellow:{base:'#9a875c',dark:'#7a6a44',light:'#b09a6c',mortar:'#6a5e48',soot:.32},
  lbuff:{base:'#a08a68',dark:'#86704f',light:'#b29c78',mortar:'#7a6c56',soot:.2},
  paintW:{base:'#d4d0c4',dark:'#bcb8ac',light:'#e2ded4',mortar:null,soot:.18,paint:true},
  paintCr:{base:'#d0bf96',dark:'#b8a880',light:'#ddd0aa',mortar:null,soot:.2,paint:true},
  paintBl:{base:'#7e98a6',dark:'#6a8290',light:'#90aab6',mortar:null,soot:.22,paint:true},
  paintPk:{base:'#bf8f86',dark:'#a87a72',light:'#cc9e96',mortar:null,soot:.22,paint:true},
  paintGr:{base:'#7e8e72',dark:'#6a7a60',light:'#8e9e82',mortar:null,soot:.22,paint:true},
  paintNv:{base:'#2c3648',dark:'#222a3a',light:'#364258',mortar:null,soot:.15,paint:true},
  paintBk:{base:'#242426',dark:'#1a1a1c',light:'#2e2e30',mortar:null,soot:.1,paint:true},
};
function paintWall(g,B,w,h,r){ R(g,B.base,0,0,w,h);
  if(B.mortar){ for(let y=0;y<h;y+=3){ const off=(y/3%2)*4; for(let x=-8+off;x<w;x+=8){ const v=r(); g.fillStyle=v<.15?B.dark:v>.88?B.light:B.base; g.fillRect(x,y,7,2); } g.fillStyle=B.mortar; g.fillRect(0,y+2,w,1); } }
  else if(B.panel){ for(let y=0;y<h;y+=PXM*1.5) R(g,B.dark,0,y,w,1); for(let x=0;x<w;x+=PXM*2.5) R(g,B.dark,x,0,1,h); for(let i=0;i<w*h/40;i++) R(g,r()<.5?B.dark:B.light,r()*w|0,r()*h|0,1,1); }
  else { for(let i=0;i<w*h/30;i++) R(g,r()<.5?B.dark:B.light,r()*w|0,r()*h|0,1,1); if(B.paint) for(let y=2;y<h;y+=3) R(g,'rgba(0,0,0,.07)',0,y,w,1); }
  for(let i=0;i<w/6;i++){ const x=r()*w|0; vfill(g,x,0,1+(r()*3|0),h*(.2+r()*.7),[[0,`rgba(10,8,6,${B.soot})`],[1,'rgba(10,8,6,0)']]); } }
/* window kinds: sash (Victorian), estate (wide), shopflat (over shops), mansion (Boundary-estate red brick) */
const WIN={seg:{w:1.0,h:1.6,sill:.9,seg:true}, factory:{w:2.0,h:1.7,sill:.8,panes:true}, sash:{w:1.0,h:1.65,sill:.9,lintel:true}, estate:{w:1.7,h:1.3,sill:1.0}, mansion:{w:1.1,h:1.8,sill:.85,lintel:true,arch:true}, tower:{w:1.9,h:1.4,sill:.9}};
const LITC=[['#ffcf8a','#ffb060'],['#ffe2b0','#ffc080'],['#ffd8a0','#ff9a50'],['#9ab8ff','#6a88d0'],['#fff2d8','#e8d0a8'],['#ffb878','#e08040']];
/* returns {base, lit}: bays x floors tile, BAY wide, FLOOR tall */
function facadeTex(brick,win,seed,bays=4,floors=3,litP=.32){ const W_=WIN[win],B=BRICKS[brick],bw=HUB.BAY*PXM,fh=HUB.FLOOR*PXM,w=bays*bw,h=floors*fh;
  const r=hr(seed), plan=[]; for(let f=0;f<floors;f++) for(let b=0;b<bays;b++){ const lit=r()<litP; plan.push({f,b,lit,c:LITC[r()*LITC.length|0],cur:r(),fig:lit&&r()<.12,tv:r()<.15,blind:r()<.3}); }
  const ww=W_.w*PXM,wh=W_.h*PXM;
  const base=P2S(w,h,(g)=>{ paintWall(g,B,w,h,r);
    for(const p of plan){ const x=p.b*bw+(bw-ww)/2, y=h-(p.f*fh+W_.sill*PXM+wh);
      if(W_.lintel) R(g,brick==='stucco'||brick==='cream'||B.paint?'#e8e2d2':'#c8c0a8',x-2,y-4,ww+4,4); R(g,'#b8b2a0',x-2,y+wh,ww+4,3);
      if(W_.seg){ g.fillStyle=B.paint?'#e8e2d2':'#9a4a34'; g.beginPath(); g.ellipse(x+ww/2,y+2,ww/2+3,7,0,Math.PI,0); g.fill(); R(g,g.fillStyle,x-3,y-1,ww+6,3); }
      R(g,W_.panes?'#2a2c2e':'#e6e2d8',x-1,y-1,ww+2,wh+2); vfill(g,x+1,y+1,ww-2,wh-2,[[0,'#1c2430'],[1,'#0c1016']]);
      if(W_.panes){ for(let i=1;i<4;i++) R(g,'#2a2c2e',x+i*ww/4,y,1,wh); for(let i=1;i<3;i++) R(g,'#2a2c2e',x,y+i*wh/3,ww,1); if(p.cur<.3) R(g,'#6a6a64',x+ww/4+1,y+wh/3+1,ww/4-1,wh/3-1); }
      if(!p.lit&&p.blind) R(g,'#3a3630',x+1,y+1,ww-2,(wh-2)*(.3+p.cur*.5));
      if(!W_.panes){ R(g,'#e6e2d8',x,y+wh*.5,ww,2); if(win!=='estate'&&win!=='tower') R(g,'#e6e2d8',x+ww/2-1,y,2,wh); }
      g.fillStyle='rgba(160,180,200,.18)'; g.fillRect(x+2,y+2,ww*.3,wh*.4); }
    if(B.panel) for(let f=1;f<floors;f++) R(g,'#6a6860',0,h-f*fh-2,w,3); },0,seed);
  const lit=P2S(w,h,(g)=>{ g.clearRect(0,0,w,h);
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
function eFacade(x0,z0,x1,z1,y0,y1,F,faces,o={}){ if(o.atlas) return eFacadeA(x0,z0,x1,z1,y0,y1,F,faces,o);
  const tu=o.tu||F.bays*HUB.BAY, tv=F.floors*HUB.FLOOR, ou=o.ou||0, ov=o.ov||0, plain=o.plain||F.mBase;
  const skip=o.skip||'', fm=k=>skip.includes(k)?null:faces.includes(k)?F.mBase:plain;
  /* street faces get vertices every 3 m for the lamps to light; plain backs are single quads */
  const G={n:fm('n'),s:fm('s'),e:fm('e'),w:fm('w')};
  for(const k of 'nsew'){ if(!G[k]) continue; const one={n:null,s:null,e:null,w:null,t:null}; one[k]=G[k]; eBoxF(x0,z0,x1,z1,y0,y1,one,faces.includes(k)?{tu,tv,vb:y0,ou,ov,cell:3,cellV:HUB.FLOOR}:{tu,tv,vb:y0,ou,ov}); }
  const e=.02, lm=F.mLit;
  if(faces.includes('s')) eGrid(lm,[x0,y0,z1+e],X_,Y_,x1-x0,y1-y0,tu,tv,ou,ov);
  if(faces.includes('n')) eGrid(lm,[x1,y0,z0-e],NX,Y_,x1-x0,y1-y0,tu,tv,ou,ov);
  if(faces.includes('e')) eGrid(lm,[x1+e,y0,z1],NZ,Y_,z1-z0,y1-y0,tu,tv,ou,ov);
  if(faces.includes('w')) eGrid(lm,[x0-e,y0,z0],Z_,Y_,z1-z0,y1-y0,tu,tv,ou,ov); }
/* the same on the facade atlas (FA/FAL): every face except o.skip is cut into whole bays (about 2.5 m, stretched to fit) and whole floors,
   in pieces of at most 4 bays x 3 floors, each showing a window-aligned piece of its brick's cell: one draw per chunk for every facade.
   o.seed varies which bays and floors of the cell a piece shows (so the lit windows differ house to house) */
function eFacadeA(x0,z0,x1,z1,y0,y1,F,faces,o){ const rc=faCell(F), du=rc[2]-rc[0], dv=rc[3]-rc[1], skip=o.skip||'', H=y1-y0, nf=Math.max(1,Math.round(H/HUB.FLOOR)), fh=H/nf; let sd=(o.seed|0)>>>0;
  const face=(org,U,len,N)=>{ const nb=Math.max(1,Math.round(len/HUB.BAY)), bw=len/nb;
    for(let b=0;b<nb;b+=4){ const cb=Math.min(4,nb-b); for(let f=0;f<nf;f+=3){ const cf=Math.min(3,nf-f); sd=(sd*1103515245+12345)>>>0; const sb=(sd>>>8)%(5-cb), sf=(sd>>>16)%(4-cf);
        const p=[org[0]+U[0]*b*bw,y0+f*fh,org[2]+U[2]*b*bw], w=cb*bw, h=cf*fh, tu=w/(du*cb/4), tv=h/(dv*cf/3), ou=rc[0]+du*sb/4, ov=rc[1]+dv*sf/3;
        eGrid(FA.m,p,U,Y_,w,h,tu,tv,ou,ov,3,HUB.FLOOR); eGrid(FAL.m,[p[0]+N[0]*.02,p[1],p[2]+N[2]*.02],U,Y_,w,h,tu,tv,ou,ov); } } };
  if(!skip.includes('s')) face([x0,0,z1],X_,x1-x0,Z_); if(!skip.includes('n')) face([x1,0,z0],NX,x1-x0,NZ);
  if(!skip.includes('e')) face([x1,0,z1],NZ,z1-z0,X_); if(!skip.includes('w')) face([x0,0,z0],Z_,z1-z0,NX); }

/* the big atlas pages are plain software canvases: hundreds of draws go into them, and accelerated canvases this size starve the
   browser's canvas budget (every small canvas painted after them, like the cast's, then crawled) */
function P2S(w,h,fn){ return texS(w,h,null,g=>fn(g,w,h)); }
function texS(w,h,base,fn){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d',{willReadFrequently:true}); if(base){ g.fillStyle=base; g.fillRect(0,0,w,h); } if(fn) fn(g,w,h); return {c,glt:null,f:-1}; }
/* the facade atlas: each brick-and-window facade's 4-bay x 3-floor tile as a cell, and its lit-window layer at half size on a twin page */
const FA={W:2048,H:648,cw:240,ch:216,cols:8,rows:3,n:0}; /* 24 facades (about 16 in use) */ FA.t=texS(FA.W,FA.H,null,g=>{ R(g,'#5a4a3a',0,0,FA.W,FA.H); }); FA.g=FA.t.c.getContext('2d'); FA.m=M(FA.t,{});
const FAL={t:texS(FA.W/2,FA.H/2,null,g=>{ g.clearRect(0,0,FA.W/2,FA.H/2); })}; FAL.g=FAL.t.c.getContext('2d'); FAL.m=nightM(FAL.t,{unlit:true,cut:true});
function faCell(F){ if(F.fa) return F.fa; if(FA.n>=FA.cols*FA.rows){ console.warn('[london] facade atlas full'); return (F.fa=FA.first.fa); } if(!FA.n) FA.first=F;
  const i=FA.n++, x=(i%FA.cols)*FA.cw, y=Math.floor(i/FA.cols)*FA.ch; FA.g.drawImage(F.base.c,x,y,FA.cw,FA.ch); FAL.g.drawImage(F.lit.c,x/2,y/2,FA.cw/2,FA.ch/2);
  return (F.fa=[(x+.5)/FA.W,1-(y+FA.ch-.5)/FA.H,(x+FA.cw-.5)/FA.W,1-(y+.5)/FA.H]); }

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
/* pages of 2048 x 1024 (5 x 18 signs of 384 x 56), opened as they fill: every hand-written shop has its own name */
const SA={W:2048,H:1024,cw:384,ch:56,cols:5,rows:18,pages:[],all:[],cache:new Map()};
function signPage(){ const P={n:0}; P.t=texS(SA.W,SA.H,null,g=>{ R(g,'#000',0,0,SA.W,SA.H); }); P.t.smooth=true; P.c=P.t.c.getContext('2d'); P.m=nightM(P.t,{unlit:true},.35); SA.pages.push(P); return P; }
signPage(); SA.t=SA.pages[0].t; SA.m=SA.pages[0].m;
function paintSignCell(P,cx,cy,args){ const g=P.c; g.save(); g.translate(cx,cy); g.beginPath(); g.rect(0,0,SA.cw,SA.ch); g.clip(); drawSign(g,SA.cw,SA.ch,...args); g.restore(); }
/* returns [u0,v0,u1,v1] of a painted sign (same args as signTex), with .m its page's material */
function atlasSign(bg,fg,main,sub,o={}){ const key=[bg,fg,main,sub,o.face,o.subC,o.lit].join('|'); if(SA.cache.has(key)) return SA.cache.get(key);
  let P=SA.pages[SA.pages.length-1]; if(P.n>=SA.cols*SA.rows){ if(SA.pages.length>=8){ console.warn('[london] sign atlas full'); return SA.cache.values().next().value; } P=signPage(); }
  const i=P.n++, cx=(i%SA.cols)*SA.cw, cy=Math.floor(i/SA.cols)*SA.ch, args=[bg,fg,main,sub,Object.assign({w0:SA.cw/3},o)]; paintSignCell(P,cx,cy,args); SA.all.push([P,cx,cy,args]);
  const uv=[(cx+.5)/SA.W,1-(cy+SA.ch-.5)/SA.H,(cx+SA.cw-.5)/SA.W,1-(cy+.5)/SA.H]; uv.m=P.m; SA.cache.set(key,uv); return uv; }
/* the faces arrive after the hub is built: repaint every sign in the atlas with them */
FONTS_READY.then(()=>{ for(const [P,cx,cy,args] of SA.all){ P.c.clearRect(cx,cy,SA.cw,SA.ch); paintSignCell(P,cx,cy,args); } for(const P of SA.pages) retex(P.t); });
/* a sign quad on a face: centre c, along U, width w, height h, outward normal from U x Y */
function eSign(uv,c,U,w,h){ const o=[c[0]-U[0]*w/2,c[1]-h/2,c[2]-U[2]*w/2], B=emitBucket(uv.m||SA.m,c[0],c[2],4), b0=B.n, n=[U[1]*0-U[2]*1,U[2]*0-U[0]*0,U[0]*1-U[1]*0];
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
  charity:{bg:'#5a2a6a',fg:'#ffffff',face:'grot',names:['EAST END HOSPICE','ST MARY\'S CHARITY SHOP','HELPING HANDS'],sub:'CHARITY SHOP',room:'#ece4f0'},
  flowers:{bg:'#2a4a2a',fg:'#f6e6c0',face:'cond',names:['COLUMBIA FLOWERS','THE FLOWER STALL','PETALS'],sub:'FLOWERS · PLANTS',room:'#e8f0e0'},
  vintage:{bg:'#2a2a2a',fg:'#e8d8b8',face:'cond',names:['ROKIT','BEYOND RETRO','THE VINTAGE STORE','CHESHIRE VINTAGE'],sub:'VINTAGE · RECORDS',room:'#e0d4c0'},
  /* the hand-written high streets: names come from the frontage, these are fallbacks */
  piemash:{bg:'#1e4a2e',fg:'#f2e6c8',face:'cond',names:['PIE & MASH'],sub:'PIE · MASH · LIQUOR · JELLIED EELS',room:'#e4ece2'},
  bakery:{bg:'#f2e2c0',fg:'#5a2a10',face:'grot',names:['BAKERY'],sub:'BREAD · CAKES · SAMOSAS',room:'#f6e8cc'},
  cashcarry:{bg:'#d8201a',fg:'#ffffff',face:'anton',names:['CASH & CARRY'],sub:'WHOLESALE · RETAIL · RICE · SPICES',room:'#ecece4'},
  grocer:{bg:'#1a6a2a',fg:'#ffffff',face:'grot',names:['SUPERSTORE'],sub:'HALAL MEAT · FRESH FISH · VEG',room:'#eef0e0'},
  sweets:{bg:'#e8b020',fg:'#7a0a1a',face:'fat',names:['SWEET CENTRE'],sub:'SWEETS · SAMOSAS · CATERING',room:'#fff4dc'},
  pound:{bg:'#e8d020',fg:'#1a1a8a',face:'anton',names:['POUND PLUS'],sub:'EVERYTHING £1 · HOUSEHOLD · TOYS',room:'#f0f0e8'},
  money:{bg:'#0a3a6a',fg:'#ffd84a',face:'grot',names:['MONEY TRANSFER'],sub:'SEND MONEY HOME · BUREAU · TOP UP',room:'#e6eaf0'},
  butcher:{bg:'#7a1010',fg:'#ffffff',face:'cond',names:['HALAL BUTCHERS'],sub:'HALAL MEAT · POULTRY · LAMB',room:'#f4ece8'},
  travel:{bg:'#f6f6f2',fg:'#0a4a8a',face:'grot',names:['TRAVEL'],sub:'FLIGHTS TO DHAKA & SYLHET · HAJJ',room:'#eef2f6'},
  tailor:{bg:'#2a2a3a',fg:'#e8e0c8',face:'cond',names:['TAILORS'],sub:'ALTERATIONS · DRY CLEANING',room:'#e8e2d4'},
  records:{bg:'#141414',fg:'#ff5a3a',face:'anton',names:['RECORDS'],sub:'VINYL · BOUGHT & SOLD',room:'#e0d8c8'},
  plants:{bg:'#2e3a2a',fg:'#e8e0c0',face:'cond',names:['PLANTS'],sub:'HOUSEPLANTS · POTS · CUT FLOWERS',room:'#e0e8d4'},
  gallery:{bg:'#f4f2ec',fg:'#1a1a1a',face:'grot',names:['GALLERY'],sub:'PRINTS · PAINTINGS',room:'#f6f6f2'},
  antiques:{bg:'#3a2a1a',fg:'#e8d098',face:'cond',names:['ANTIQUES'],sub:'ANTIQUES · CURIOS · CLEARANCES',room:'#d8c8a8'},
  deli:{bg:'#f0e8d0',fg:'#3a2a1a',face:'cond',names:['DELI'],sub:'CHEESE · DELI · WINE',room:'#f2e6d0'},
  homeware:{bg:'#c8d8d0',fg:'#2a3a3a',face:'cond',names:['HOMEWARE'],sub:'CERAMICS · LINEN · GIFTS',room:'#eef0ea'},
  workshop:{bg:'#2a2a2a',fg:'#e8e0d0',face:'grot',names:['WORKSHOP'],sub:'JOINERY · CABINET MAKERS',room:'#c8b8a0'},
  garage:{bg:'#1a1a1a',fg:'#f2c200',face:'anton',names:['MOT CENTRE'],sub:'MOT · TYRES · EXHAUSTS · REPAIRS',room:'#9a9690'},
  builders:{bg:'#e86a10',fg:'#1a1a1a',face:'anton',names:['BUILDERS MERCHANTS'],sub:'TIMBER · SAND · CEMENT',room:'#c8c0b0'},
  fabric:{bg:'#4a1a4a',fg:'#f2dca8',face:'cond',names:['FABRICS'],sub:'SILKS · COTTONS · SARIS',room:'#efe2e8'},
  optician:{bg:'#1a3a5a',fg:'#ffffff',face:'grot',names:['OPTICIANS'],sub:'EYE TESTS · NHS',room:'#eef2f4'},
  tolet:{bg:'#f4f4f0',fg:'#c41a1a',face:'anton',names:['TO LET'],sub:'SHOP TO LET · 020 7739 0418',room:'#3a3a38'},
};
/* real chains and real cafés are out: these are generic names, but drop any that read as a real business */
for(const k in TRADES) TRADES[k].names=TRADES[k].names.filter(n=>!/BETFRED|PADDY|ROKIT|BEYOND RETRO|OXFAM|CANCER RESEARCH|BRITISH HEART|PELLICCI|CHICKEN COTTAGE|TFC|DIXY/.test(n));
function tradeRoom(k){ const T=TRADES[k]; if(T.tex) return T.tex; const r=hr(9000+Object.keys(TRADES).indexOf(k)*13);
  T.tex=P2S(256,128,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,mix(T.room,'#ffffff',.2)],[1,mix(T.room,'#000000',.15)]]); R(g,mix(T.room,'#000000',.4),0,h-18,w,18);
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
    else if(k==='piemash'){ for(let x=0;x<w;x+=8) for(let y=0;y<h-18;y+=8) R(g,(x+y)%16?'#d8e4d6':'#c4d4c2',x,y,7,7); R(g,'#2a5a3a',0,44,w,4); for(let i=0;i<4;i++){ R(g,'#f0ece4',14+i*60,78,46,5); R(g,'#3a2a20',22+i*60,83,6,24); R(g,'#3a2a20',48+i*60,83,6,24); } }
    else if(k==='bakery'||k==='sweets'||k==='deli'){ R(g,'#3a2a1a',0,64,w,4); R(g,'#e8e4dc',8,70,w-16,30); for(let s=0;s<2;s++) for(let x=6;x<w-6;x+=12) ell(g,x+6,18+s*24,5,4,k==='sweets'?['#e84a8a','#f6d040','#ffffff','#f08030','#7ad04a'][r()*5|0]:k==='deli'?['#f0d890','#c88a40','#e8e0c0'][r()*3|0]:['#c8843a','#a86428','#e0b060'][r()*3|0]);
      for(let x=12;x<w-12;x+=14) R(g,k==='sweets'?['#ffd040','#ff7aa0','#a0e070','#ffffff'][r()*4|0]:'#d8a050',x,76,10,8); }
    else if(k==='cashcarry'||k==='pound'||k==='grocer'||k==='fabric'||k==='homeware'||k==='antiques'){ for(let s=0;s<4;s++){ R(g,'#6a6058',0,20+s*22,w,2); for(let x=2;x<w;x+=k==='fabric'?9:6){ const ht=k==='fabric'?18:6+(r()*12|0); g.fillStyle=mix(k==='fabric'?['#c82a6a','#2a4ab8','#e8b020','#2a8a5a','#8a2ab8'][r()*5|0]:['#c83a2a','#2a7a3a','#e8c040','#3a5ab8','#d8d4c8','#f0f0e8'][r()*6|0],'#000',r()*.3); g.fillRect(x,20+s*22-ht,k==='fabric'?8:5,ht); } } }
    else if(k==='money'||k==='travel'||k==='optician'){ for(let i=0;i<4;i++){ R(g,'#c8d0dc',10+i*62,10,50,34); R(g,k==='travel'?['#2a8ac8','#e8b020','#2a9a5a','#c83a3a'][i]:'#ffffff',14+i*62,14,42,26); } R(g,'#4a5a6a',0,62,w,6); R(g,'#d8dce4',0,68,w,28); for(let i=0;i<4;i++) R(g,'#9aa8b8',20+i*62,40,30,22); }
    else if(k==='butcher'){ for(let x=0;x<w;x+=8) for(let y=0;y<h-18;y+=8) R(g,(x+y)%16?'#f4f0ec':'#e4e0dc',x,y,7,7); R(g,'#8a8a8a',0,14,w,2); for(let x=10;x<w;x+=18){ R(g,'#8a8a8a',x+3,14,1,8); ell(g,x+4,30,6,9,['#a82a2a','#c84a3a','#e8c8b8'][r()*3|0]); } R(g,'#e8e8ec',0,70,w,28); for(let x=8;x<w;x+=16) R(g,'#b83a3a',x,74,12,8); }
    else if(k==='tailor'){ R(g,'#3a3a3a',0,20,w,2); for(let x=4;x<w;x+=7){ R(g,['#2a2a3a','#5a4a3a','#e8e4dc','#3a4a6a','#1a1a1a'][r()*5|0],x,22,6,40+(r()*16|0)); } R(g,'#a89070',20,80,120,20); }
    else if(k==='records'){ for(let i=0;i<6;i++){ R(g,'#2a2420',8+i*42,60,36,38); for(let j=0;j<6;j++) R(g,['#e84a2a','#1a1a1a','#f6d040','#3a8ac8','#f0f0e8'][r()*5|0],10+i*42+j*5,56-(r()*6|0),4,40); } for(let i=0;i<8;i++) R(g,['#c83a2a','#1a1a1a','#e8c040','#3a5ab8'][r()*4|0],6+i*31,8,26,26); }
    else if(k==='plants'){ for(let i=0;i<70;i++){ const x=r()*w, y=30+r()*70; ell(g,x,y,6+r()*8,5+r()*7,['#2a5a2a','#3a7a3a','#4a8a3a','#1e4a22'][r()*4|0]); } for(let x=6;x<w;x+=24) R(g,'#a85a3a',x,96,16,12); }
    else if(k==='gallery'){ for(let i=0;i<4;i++){ R(g,'#2a2a2a',16+i*60,22,40,30); R(g,['#c83a2a','#2a5ab8','#e8c040','#3a3a3a'][i],18+i*60,24,36,26); } R(g,'#d8d4cc',0,h-22,w,22); }
    else if(k==='workshop'||k==='builders'||k==='garage'){ R(g,'#5a5048',0,0,w,h); for(let i=0;i<10;i++) R(g,k==='garage'?'#2a2a2a':'#b8945a',r()*w,40+r()*50,30+r()*40,4); if(k==='garage'){ R(g,'#3a5a8a',60,60,120,34); ell(g,80,96,12,12,'#111'); ell(g,160,96,12,12,'#111'); R(g,'#e8c040',0,10,w,6); } }
    else if(k==='tolet'){ R(g,'#2a2a28',0,0,w,h); R(g,'#4a4a46',0,h-30,w,30); for(let i=0;i<6;i++) R(g,'#5a5a56',r()*w,80+r()*20,20,6); }
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
  for(let k=0;k<3;k++){ const a=k*Math.PI/3, U=[Math.cos(a),0,Math.sin(a)]; eGrid(mGlow,[hx-U[0]*.62,y0+h-1.42,hz-U[2]*.62],U,Y_,1.24,1.24,1.24,1.24); } /* three crossed cards, centred under the head so it never clips them */
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
tRailing.nomip=true; const mRailing=(()=>{ const m=M(tRailing,{double:true,cut:true}); return m; })();
function railing(x0,z0,x1,z1,h=1.1,y0=PAVE_Y,solid=true){ const L_=Math.hypot(x1-x0,z1-z0),U=[(x1-x0)/L_,0,(z1-z0)/L_]; eGrid(mRailing,[x0,y0,z0],U,Y_,L_,h,.62,h);
  if(solid) hsol(x0-.05,z0-.05,x1+.05,z1+.05,y0+h); }

/* ==========================================================================================================
   THE HAND KIT: one lit atlas page (KA) for house fronts, awning stripes, hoarding posters and plain colour swatches,
   so a whole terrace of different doors, bricks and paint is one draw per chunk; a half-size unlit twin (KAL) for the
   ground-floor windows that are lit at night; and one unlit page (RA) for every shop interior and its room colours.
   ========================================================================================================== */
const KA={W:2048,H:1424,cw:160,ch:104,cols:12,rows:12,n:0,sw:0,cache:new Map()}; /* 144 cells (about 110 in use) and 1408 swatches */
KA.t=texS(KA.W,KA.H,null,g=>{ R(g,'#7a7a7a',0,0,KA.W,KA.H); }); KA.g=KA.t.c.getContext('2d'); KA.m=M(KA.t,{});
const KAL={t:texS(KA.W/2,KA.H/2,null,g=>{ g.clearRect(0,0,KA.W/2,KA.H/2); })}; KAL.g=KAL.t.c.getContext('2d'); KAL.m=nightM(KAL.t,{unlit:true,cut:true});
/* a cell: paint(g,w,h) on the lit page, lit(g,w,h) (optional) on the night twin at half size; returns [u0,v0,u1,v1] */
function kaCell(key,paint,lit){ let c=KA.cache.get(key); if(c) return c; if(KA.n>=KA.cols*KA.rows){ console.warn('[london] kit atlas full'); return KA.cache.get(KA.first); }
  const i=KA.n++, x=(i%KA.cols)*KA.cw, y=Math.floor(i/KA.cols)*KA.ch; if(!i) KA.first=key;
  for(const [G,s,fn] of [[KA.g,1,paint],[KAL.g,.5,lit]]){ if(!fn) continue; G.save(); G.translate(x*s,y*s); G.scale(s,s); G.beginPath(); G.rect(0,0,KA.cw,KA.ch); G.clip(); fn(G,KA.cw,KA.ch); G.restore(); }
  c=[(x+1)/KA.W,1-(y+KA.ch-1)/KA.H,(x+KA.cw-1)/KA.W,1-(y+1)/KA.H]; KA.cache.set(key,c); return c; }
/* a plain colour: a 16 px swatch below the cells; quads sample its centre */
function kaSw(c){ const k='#'+c; let s=KA.cache.get(k); if(s) return s; const i=Math.min(KA.sw++,128*11-1), x=(i%128)*16, y=KA.rows*KA.ch+Math.floor(i/128)*16;
  R(KA.g,c,x,y,16,16); s=[(x+8)/KA.W,1-(y+8)/KA.H]; KA.cache.set(k,s); return s; }
/* a quad showing the sub-rect [f0..f1] x [g0..g1] of a cell (m: KA.m or KAL.m) */
function eKA(o,U,V,w,h,rc,f0=0,f1=1,g0=0,g1=1,m=KA.m){ const du=rc[2]-rc[0], dv=rc[3]-rc[1]; eGrid(m,o,U,V,w,h,w/(du*(f1-f0)),h/(dv*(g1-g0)),rc[0]+du*f0,rc[1]+dv*g0); }
/* a quad of one plain colour */
function eQK(o,U,V,w,h,c){ const s=kaSw(c); eGrid(KA.m,o,U,V,w,h,1e6,1e6,s[0],s[1]); }
/* a box of one plain colour; faces from 'nsewtb' */
function eBoxK(x0,z0,x1,z1,y0,y1,c,faces='nsewt'){ const s=kaSw(c), w=x1-x0,d=z1-z0,h=y1-y0, q=(o,U,V,a,b)=>eGrid(KA.m,o,U,V,a,b,1e6,1e6,s[0],s[1]);
  if(faces.includes('s')) q([x0,y0,z1],X_,Y_,w,h); if(faces.includes('n')) q([x1,y0,z0],NX,Y_,w,h); if(faces.includes('e')) q([x1,y0,z1],NZ,Y_,d,h); if(faces.includes('w')) q([x0,y0,z0],Z_,Y_,d,h);
  if(faces.includes('t')) q([x0,y1,z1],X_,NZ,w,d); if(faces.includes('b')) q([x0,y0,z0],X_,Z_,w,d); }
/* an engine geometry painted one plain colour (for eGeo) */
function swG(g,c){ const s=kaSw(c); for(let i=0;i<g.T.length;i+=2){ g.T[i]=s[0]; g.T[i+1]=s[1]; } return g; }
/* a box in lot space: u along the front (from its left end, as you face it), o out from the wall, y up. faces: f(ront) b(ack) s(ides) t(op) u(nderside).
   solid: false, true (from the ground) or the solid's bottom height */
function lotBox(P0,U,out,u0,u1,o0,o1,y0,y1,c,faces='fbst',solid=false){ const xs=[P0[0]+U[0]*u0+out[0]*o0,P0[0]+U[0]*u1+out[0]*o1], zs=[P0[2]+U[2]*u0+out[2]*o0,P0[2]+U[2]*u1+out[2]*o1];
  const x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs); let f=''; const fk=out[2]<-.5?'n':out[2]>.5?'s':out[0]<-.5?'w':'e', bk={n:'s',s:'n',e:'w',w:'e'}[fk], side=fk==='n'||fk==='s'?'ew':'ns';
  if(faces.includes('f')) f+=fk; if(faces.includes('b')) f+=bk; if(faces.includes('s')) f+=side; if(faces.includes('t')) f+='t'; if(faces.includes('u')) f+='b';
  eBoxK(x0,z0,x1,z1,y0,y1,c,f); if(solid!==false) hsol(x0,z0,x1,z1,y1,solid===true?0:solid); return [x0,z0,x1,z1]; }

/* ---------------- the room page: every trade's interior on one unlit texture, plus the room colours ---------------- */
const RA={W:2048,H:1024,cw:256,ch:128,cols:8,rows:7,n:0,sw:0,cache:new Map()};
RA.t=texS(RA.W,RA.H,null,g=>{ R(g,'#000',0,0,RA.W,RA.H); }); RA.g=RA.t.c.getContext('2d'); RA.m=nightM(RA.t,{unlit:true},0);
/* the trade's painted room, toned down (rooms seen through glass are never as bright as the street thinks) with a darker floor and corners */
function raRoom(k){ const T=TRADES[k]; if(T.ra) return T.ra; if(!T.tex) tradeRoom(k); if(RA.n>=RA.cols*RA.rows) return (T.ra=TRADES.cafe.ra||raRoom('cafe'));
  const i=RA.n++, x=(i%RA.cols)*RA.cw, y=Math.floor(i/RA.cols)*RA.ch, g=RA.g; g.drawImage(T.tex.c,x,y,RA.cw,RA.ch);
  g.save(); g.globalCompositeOperation='multiply'; g.fillStyle='#968b78'; g.fillRect(x,y,RA.cw,RA.ch); g.restore();
  vfill(g,x,y+RA.ch*.72,RA.cw,RA.ch*.28,[[0,'rgba(0,0,0,0)'],[1,'rgba(10,8,6,.45)']]); vfill(g,x,y,RA.cw,RA.ch*.15,[[0,'rgba(10,8,6,.35)'],[1,'rgba(0,0,0,0)']]);
  T.ra=[(x+1)/RA.W,1-(y+RA.ch-1)/RA.H,(x+RA.cw-1)/RA.W,1-(y+1)/RA.H]; return T.ra; }
function raSw(c){ let s=RA.cache.get(c); if(s) return s; const i=Math.min(RA.sw++,128*8-1), x=(i%128)*16, y=RA.rows*RA.ch+Math.floor(i/128)*16; R(RA.g,c,x,y,16,16); s=[(x+8)/RA.W,1-(y+8)/RA.H]; RA.cache.set(c,s); return s; }
/* a quad showing the sub-rect [f0..f1] x [g0..g1] of a room cell, and a quad of one room colour */
function eRA(o,U,V,w,h,rc,f0=0,f1=1,g0=0,g1=1){ const du=rc[2]-rc[0], dv=rc[3]-rc[1]; eGrid(RA.m,o,U,V,w,h,w/(du*(f1-f0)),h/(dv*(g1-g0)),rc[0]+du*f0,rc[1]+dv*g0); }
function eRQ(o,U,V,w,h,c){ const s=raSw(c); eGrid(RA.m,o,U,V,w,h,1e6,1e6,s[0],s[1]); }
/* the pub's bar seen through its windows */
const PUB_ROOM=(()=>{ const t=P2S(256,128,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#e8b070'],[1,'#8a4a18']]); R(g,'#3a1a0a',0,h-28,w,28); R(g,'#6a3a1a',0,h-34,w,6); for(let i=0;i<10;i++) R(g,'#5a2a10',8+i*24,60,14,34);
  for(let i=0;i<14;i++) ell(g,10+i*18,48,4,6,'#2a1408'); for(let i=0;i<5;i++){ R(g,'#2a1408',12+i*50,8,40,26); R(g,['#c8a050','#8a3a2a','#3a5a3a'][i%3],14+i*50,10,36,22); } for(let x=6;x<w;x+=9) R(g,['#e8d8a0','#3a8a3a','#c83a2a','#e8e8e0'][x%4],x,40,5,10); },0,1);
  TRADES.pubRoom={tex:t,names:[],sub:'',room:'#a05a20'}; return raRoom('pubRoom'); })();

/* ---------------- house fronts: the ground floor of a Victorian terrace house, painted per brick, door colour and layout ---------------- */
/* layouts in metres on a 5 x 3.25 m front: door [x0,x1,doorTop,fanlightTop], windows [x0,x1,sill,top], bay [x0,x1,height] */
const HLAY={flat:{d:[.45,1.4,2.15,2.55],w:[[2.35,3.6,.85,2.6]]}, pair:{d:[.35,1.25,2.15,2.55],w:[[1.85,2.9,.85,2.55],[3.5,4.55,.85,2.55]]},
  bay:{d:[.45,1.4,2.15,2.55],w:[[2.25,4.35,.75,2.5]],bay:[2.0,4.6,2.95]}, cottage:{d:[.5,1.38,1.95,2.3],w:[[2.4,3.55,.95,2.3]]}, conv:{d:[.3,1.2,2.15,2.55],w:[[1.75,4.7,.55,2.6]]}};
function hlay(hv,mir){ const L=HLAY[hv]||HLAY.flat; if(!mir) return L; const f=([a,b,...r])=>[5-b,5-a,...r]; return {d:f(L.d),w:L.w.map(f),bay:L.bay&&f(L.bay)}; }
/* the wall of a house front (no door: that is a separate strip, so a door colour costs no wall cell); mirrored houses flip the UVs. nv: nets variant */
function houseCell(brick,hv,stuc,nv){ const L=hlay(hv,false); return kaCell(['h',brick,hv,stuc||'',nv].join('|'),(g,w,h)=>{ const S=32, Y=m=>h-m*S, B=BRICKS[brick]||BRICKS.stock, r=hr(4400+nv*7+brick.length*13);
    if(stuc){ R(g,stuc,0,0,w,h); for(let y=h-9;y>0;y-=9) R(g,'rgba(0,0,0,.13)',0,y,w,1); specks(g,'rgba(0,0,0,.08)',120,4401,w,h); } else paintWall(g,B,w,h,r);
    R(g,'rgba(0,0,0,.28)',0,Y(.32),w,.32*S); R(g,'rgba(255,255,255,.08)',0,Y(.32),w,1);
    const stone=stuc?mix(stuc,'#ffffff',.25):B.paint?mix(B.base,'#ffffff',.3):'#d2ccbc', [d0,d1,dt,ft]=L.d;
    /* the door's stucco surround and hood (the door itself sits back in its recess) */
    R(g,stone,d0*S-6,Y(ft+.2),(d1-d0)*S+12,(ft+.2)*S); R(g,mix(stone,'#000000',.15),d0*S-9,Y(ft+.32),(d1-d0)*S+18,5); R(g,'#1a1612',d0*S,Y(ft),(d1-d0)*S,ft*S);
    /* windows: lintel, sill, frame, glass, sash bars, nets or blinds */
    if(L.bay){ const [b0,b1,bh]=L.bay; R(g,stone,b0*S,Y(bh),(b1-b0)*S,bh*S); R(g,mix(stone,'#000000',.2),b0*S,Y(bh),(b1-b0)*S,4); R(g,mix(stone,'#000000',.12),b0*S,Y(.6),(b1-b0)*S,.6*S); }
    for(const [x0,x1,sl,tp] of L.w){ const ww=(x1-x0)*S, wh=(tp-sl)*S, X=x0*S, Yt=Y(tp);
      if(!L.bay){ R(g,stone,X-4,Yt-6,ww+8,6); R(g,mix(stone,'#000000',.1),X-5,Y(sl),ww+10,5); }
      R(g,'#e6e2d8',X-2,Yt-2,ww+4,wh+4); vfill(g,X,Yt,ww,wh,[[0,'#1c2430'],[1,'#0a0e14']]); R(g,'rgba(160,180,200,.18)',X+2,Yt+2,ww*.28,wh*.4);
      if(nv===0){ g.fillStyle='rgba(226,222,212,.62)'; g.fillRect(X,Yt+wh*.5,ww,wh*.5); for(let x=X;x<X+ww;x+=4) R(g,'rgba(255,255,255,.18)',x,Yt+wh*.5,1,wh*.5); } else if(nv===1) R(g,'#c8b890',X,Yt,ww,wh*.4);
      const n=Math.max(2,Math.round(ww/34)); for(let i=1;i<n;i++) R(g,'#e6e2d8',X+i*ww/n-1,Yt,2,wh); R(g,'#e6e2d8',X,Yt+wh*.5-1,ww,3); }
    vfill(g,0,h-14,w,14,[[0,'rgba(20,16,12,0)'],[1,'rgba(20,16,12,.4)']]); },
  /* the night twin: only the glass, warm, with curtains */
  (g,w,h)=>{ const S=32, Y=m=>h-m*S; g.clearRect(0,0,w,h);
    for(const [x0,x1,sl,tp] of L.w){ const ww=(x1-x0)*S, wh=(tp-sl)*S, X=x0*S, Yt=Y(tp), c=LITC[(nv*2+brick.length)%LITC.length];
      vfill(g,X,Yt,ww,wh,[[0,c[0]],[1,c[1]]]); const cc=['rgba(120,40,30,.8)','rgba(40,60,90,.75)','rgba(150,120,60,.75)'][nv%3]; R(g,cc,X,Yt,ww*.2,wh); R(g,cc,X+ww*.8,Yt,ww*.2,wh);
      if(nv===0){ g.fillStyle='rgba(240,232,214,.55)'; g.fillRect(X,Yt+wh*.5,ww,wh*.5); } const n=Math.max(2,Math.round(ww/34)); for(let i=1;i<n;i++) R(g,'rgba(30,24,20,.9)',X+i*ww/n-1,Yt,2,wh); R(g,'rgba(30,24,20,.9)',X,Yt+wh*.5-1,ww,3); } }); }
/* front doors: five to a cell, each 1 m x 3.25 m: a panelled door, letterbox, knob, and the fanlight over it. cot: the cottage proportions */
const DOOR_SLOTS=new Map(), DOOR_N={std:0,cot:0};
function doorSlot(dc,cot){ const t=cot?'cot':'std', k=t+dc; if(DOOR_SLOTS.has(k)) return DOOR_SLOTS.get(k); const n=DOOR_N[t]++, ci=n/5|0, si=n%5, dt=cot?1.95:2.15, ft=cot?2.3:2.55;
  const rc=kaCell('dr|'+t+'|'+ci,(g,w,h)=>{ R(g,'#1a1612',0,0,w,h); }); const px=Math.round(rc[0]*KA.W-1), py=Math.round((1-rc[3])*KA.H-1), g=KA.g, S=32, X=px+si*32, Y=m=>py+KA.ch-m*S;
  R(g,dc,X,Y(dt),32,dt*S); const pd=mix(dc,'#000000',.28), pl=mix(dc,'#ffffff',.12);
  for(const [qx,qy,qw,qh] of [[.14,.1,.32,.34],[.54,.1,.32,.34],[.14,.5,.32,.4],[.54,.5,.32,.4]]){ R(g,pd,X+qx*32,Y(dt)+qy*dt*S,qw*32,qh*dt*S); R(g,pl,X+qx*32,Y(dt)+qy*dt*S,qw*32,1); }
  R(g,'#c8a040',X+11,Y(dt*.47),9,3); R(g,'#c8a040',X+26,Y(dt*.5),3,3); R(g,'#e8e4da',X+13,Y(dt*.78),6,4);
  vfill(g,X,Y(ft),32,(ft-dt)*S,[[0,'#3a3a30'],[1,'#5a5444']]); for(let i=1;i<4;i++) R(g,'#e6e2d8',X+i*8,Y(ft),1,(ft-dt)*S); R(g,'#e6e2d8',X,Y(dt)-1,32,2);
  const out={rc,f0:si/5+.004,f1:(si+1)/5-.004,ft}; DOOR_SLOTS.set(k,out); return out; }
/* roller shutters (six graffitied variants) as kit cells, so a row of shut shops and lock-ups is no extra draw */
function eShut(o,U,w,h,i){ const k=Math.abs(i|0)%6, rc=kaCell('sh|'+k,(g,cw,ch)=>{ g.drawImage(SHUT[k].tex.c,0,0,cw,ch); }); eKA(o,U,Y_,w,h,rc); }
/* awning stripes and fly-posted hoardings */
function awnCell(c1,c2){ return kaCell('a|'+c1+'|'+c2,(g,w,h)=>{ R(g,c1,0,0,w,h); if(c2) for(let x=0;x<w;x+=20) R(g,c2,x,0,10,h); for(let y=0;y<h;y+=3) R(g,'rgba(0,0,0,.05)',0,y,w,1); R(g,'rgba(0,0,0,.25)',0,h-10,w,10); }); }
function posterCell(v){ return kaCell('p|'+v,(g,w,h)=>{ const r=hr(4600+v*11); R(g,['#6a5a44','#3a4a3a','#4a4a52'][v%3],0,0,w,h);
  for(let i=0;i<9;i++){ const pw=26+r()*30, ph=34+r()*30, x=r()*(w-pw), y=r()*(h-ph); R(g,['#e8e0d0','#d82a2a','#f6d040','#2a2a2a','#3a8ac8','#f08ab0','#ffffff'][r()*7|0],x,y,pw,ph);
    R(g,['#1a1a1a','#ffffff','#c81a1a'][r()*3|0],x+3,y+4,pw-6,ph*.28); R(g,'rgba(0,0,0,.25)',x+3,y+ph*.5,pw-6,2); R(g,'rgba(0,0,0,.25)',x+3,y+ph*.62,(pw-6)*.7,2); }
  for(let i=0;i<3;i++){ g.strokeStyle=['#e8e8e0','#2a2a2a','#c83a7a'][i]; g.lineWidth=3; g.beginPath(); let x=r()*w,y=h*.6+r()*h*.3; g.moveTo(x,y); for(let k=0;k<4;k++) g.lineTo(x+=8+r()*10,y+=r()*10-5); g.stroke(); } }); }
/* debris netting on scaffolds: a cut-out weave */
const tNet=P2(32,32,(g,w,h)=>{ g.clearRect(0,0,w,h); for(let y=0;y<h;y+=2) for(let x=(y/2%2);x<w;x+=2) R(g,'rgba(40,70,80,1)',x,y,1,1); R(g,'#1a3038',0,0,w,1); },0,1); tNet.nomip=true;
const mNet=(()=>{ const m=M(tNet,{double:true,cut:true}); return m; })();

/* ---------------- ways up: scaffolds, fire escapes, viaduct stairs, roof furniture, awnings ---------------- */
const STEEL='#26282a', TIMBER='#8a6a3e', GALV='#7e8284';
const SCAFS=[], FIRE_ESC=[], RAIL_STAIRS=[]; /* also on window.__SCAFS / window.__FIRE, for the climbing bots */
/* a tube scaffold on a facade: two rows of standards, a boarded lift every 2 m (each one you can stand on and pull up from), ladders, toe boards, some netting.
   P0 the facade's left end at ground, w its width, top the roof (the last lift is a step below it) */
function scaffold(P0,U,out,w,top,seed=0){ const r=hr(9700+seed), lifts=[], y0=PAVE_Y+2.0, y1=top-.5, n=Math.max(1,Math.ceil((y1-y0)/2.35)); for(let i=0;i<=n;i++) lifts.push(y0+(y1-y0)*i/n); /* evenly spaced, 1.9-2.35 m: room to stand, in reach of the next */
  const nS=Math.max(1,Math.ceil((w-.3)/2.4)); for(let i=0;i<=nS;i++){ const u=.15+i*(w-.3)/nS; for(const o of [.2,1.3]) lotBox(P0,U,out,u-.03,u+.03,o-.03,o+.03,PAVE_Y,top+1.1,GALV,'fbs'); }
  /* each lift is boarded except for the hatch over the ladder from the lift below: stand in the hatch, jump, grab its edge */
  const ladU=i=>(i%2?w-1.6:.9);
  lifts.forEach((y,i)=>{ const h0=i?ladU(i-1)-.15:w, h1=i?ladU(i-1)+.65:w, segs=i?[[0,h0,.1,1.4],[h1,w,.1,1.4],[h0,h1,.1,.6]]:[[0,w,.1,1.4]]; for(const [a,b,o0,o1] of segs) if(b-a>.1) lotBox(P0,U,out,a,b,o0,o1,y-.06,y,TIMBER,'fbstu',y-.06); lotBox(P0,U,out,0,w,1.36,1.4,y,y+.15,TIMBER,'fb');
    for(const o of [.2,1.3]) lotBox(P0,U,out,0,w,o-.025,o+.025,y+.9,y+.95,GALV,'fbt');
    if(i<lifts.length-1){ const lu=ladU(i); for(const du of [0,.45]) lotBox(P0,U,out,lu+du,lu+du+.05,.75,.8,y,lifts[i+1]+1,TIMBER,'fbs'); for(let ry=y+.3;ry<lifts[i+1];ry+=.3) lotBox(P0,U,out,lu,lu+.5,.76,.79,ry,ry+.04,TIMBER,'fbt'); } });
  lotBox(P0,U,out,0,w,1.36,1.4,top+.9,top+1.1,GALV,'fbt');
  if(r()<.7){ const a=r()*w*.4, b=Math.min(w,a+w*(.4+r()*.5)), y0=lifts[Math.min(1,lifts.length-1)]+.2; eGrid(mNet,[P0[0]+U[0]*a+out[0]*1.42,y0,P0[2]+U[2]*a+out[2]*1.42],U,Y_,b-a,top+1-y0,1.2,1.2); }
  SCAFS.push([P0[0]+U[0]*w/2+out[0],P0[2]+U[2]*w/2+out[2],{P0,U,out,w,top,lifts,lad:lifts.map((_,i)=>ladU(i))}]); window.__SCAFS=SCAFS; }
/* an external steel stair up the back of a building: per storey two half-flights, the inner band climbing one way and the outer band back,
   a turn landing at the far end and a floor landing across both bands at each storey; rails on the outside. Every tread and landing is a solid.
   P0 the back wall's left end (as you face the wall) at ground, out away from the wall, floors the storey heights */
function fireEscape(P0,U,out,w,floors){ let y=PAVE_Y; const IN=[.05,1.0], OUT=[1.0,1.95], u0=Math.max(.2,(w-4.3)/2), rp=(uu,o)=>[P0[0]+U[0]*uu+out[0]*o,P0[2]+U[2]*uu+out[2]*o];
  const land=(a,b,yy)=>{ lotBox(P0,U,out,a,b,IN[0],OUT[1],yy-.08,yy,STEEL,'fbstu',yy-.08); };
  const flight=(ua,dir,band,yb,H)=>{ const n=Math.max(1,Math.ceil(H/.24)), rise=H/n, go=Math.min(.25,1.9/n); for(let i=0;i<n;i++){ const s0=ua+dir*i*go, s1=s0+dir*go, yy=yb+(i+1)*rise; lotBox(P0,U,out,Math.min(s0,s1),Math.max(s0,s1),band[0],band[1],yy-.05,yy,STEEL,'fbstu',yy-.3); } return ua+dir*n*go; };
  for(const H of floors){ const h=H/2, ue=flight(u0+1.0,1,IN,y,h); land(ue,ue+1.0,y+h); railing(...rp(ue,OUT[1]),...rp(ue+1.0,OUT[1]),1.0,y+h,false); railing(...rp(ue+1.0,IN[0]),...rp(ue+1.0,OUT[1]),1.0,y+h,false);
    flight(ue,-1,OUT,y+h,h); railing(...rp(u0+1.0,OUT[1]),...rp(ue,OUT[1]),1.0,y+h+.25,false); y+=H; land(u0,u0+1.0,y); railing(...rp(u0,OUT[1]),...rp(u0+1.0,OUT[1]),1.0,y,false); }
  FIRE_ESC.push(rp(w/2,1)); FIRE_ESC[FIRE_ESC.length-1].d={P0,U,out,w,floors,u0}; window.__FIRE=FIRE_ESC; }
/* a Network Rail access stair up the side of a viaduct: a straight steel flight along the wall to a landing at parapet height, a gate at its foot you can vault.
   x,z the foot, U along the wall (the flight climbs this way), out away from the wall (the wall is behind -out) */
function railStair(x,z,U,out,top){ const P0=[x,0,z], n=Math.ceil((top-PAVE_Y)/.24), rise=(top-PAVE_Y)/n, go=.24;
  for(let i=0;i<n;i++){ const yy=PAVE_Y+(i+1)*rise; lotBox(P0,U,out,1.2+i*go,1.2+(i+1)*go,.05,1.0,yy-.05,yy,STEEL,'fbstu',yy-.3); }
  const ue=1.2+n*go; lotBox(P0,U,out,ue,ue+1.3,.05,1.0,top-.08,top,STEEL,'fbstu',top-.08);
  const rp=(uu,o,y)=>[P0[0]+U[0]*uu+out[0]*o,P0[2]+U[2]*uu+out[2]*o]; railing(...rp(1.2,1.0),...rp(ue,1.0),1.0,PAVE_Y+.9,false); railing(...rp(ue,1.0),...rp(ue+1.3,1.0),1.0,top,false);
  /* the cage gate at the foot: a thin panel, solid, low enough to vault */ lotBox(P0,U,out,.3,.36,.05,1.0,PAVE_Y,PAVE_Y+1.15,'#3a5a3a','fbst',true);
  lotBox(P0,U,out,.1,.4,.05,1.0,PAVE_Y,PAVE_Y+.04,'#d8b020','t');
  const sp=[P0[0]+U[0]*.6+out[0]*1.3,P0[2]+U[2]*.6+out[2]*1.3]; eSign(atlasSign('#f4f4f0','#c41a1a','NO ACCESS','NETWORK RAIL · AUTHORISED PERSONNEL ONLY',{face:'grot',subC:'#1a1a1a'}),[P0[0]+U[0]*.33+out[0]*1.03,PAVE_Y+.75,P0[2]+U[2]*.33+out[2]*1.03],[out[2],0,-out[0]],.9,.24);
  RAIL_STAIRS.push(sp); }
/* things on a flat roof: tanks, hatches, skylights, AC boxes, aerials, vents. Anything taller than a step is a solid you can stand on.
   stepAt: -1/1 = a taller neighbour on the left/right end, so a tank goes against that party wall to climb on */
function roofKit(P0,U,out,fw,d,top,kind,r,stepAt){ const back=-d+.3, put=(u0,u1,o0,o1,h,c,solid=true)=>lotBox(P0,U,out,u0,u1,o0,o1,top,top+h,c,'fbst',solid?top:false);
  if(stepAt){ const u=stepAt<0?.15:fw-1.55; put(u,u+1.4,back+1.2,back+2.4,1.3,'#5c6062'); lotBox(P0,U,out,u+.2,u+1.2,back+1.4,back+2.2,top+1.3,top+1.36,'#4a4e50','t'); }
  const k=r();
  if(kind==='shop'||kind==='pub'||kind==='works'){ if(k<.6) put(fw*.3,fw*.3+.9,back+1.6,back+2.2,.75,'#c8c8c2'); if(r()<.4) put(fw*.6,fw*.6+1.2,back+3,back+4.1,1.1,'#5a5e60'); if(r()<.5) put(fw*.5-.4,fw*.5+.4,-1.8,-1.1,.45,'#3a3c3e'); }
  else { if(k<.3) put(fw*.55,fw*.55+.9,-2.6,-1.4,.12,'#4a5a68',false); else if(k<.5) put(fw*.4,fw*.4+.7,back+2,back+2.7,.4,'#3a3c3e');
    if(r()<.22){ const u=fw*(.3+r()*.4); lotBox(P0,U,out,u-.02,u+.02,-1.5,-1.46,top,top+1.6,STEEL,'fbs'); lotBox(P0,U,out,u-.5,u+.5,-1.5,-1.46,top+1.4,top+1.44,STEEL,'fbt'); } }
  if(r()<.35){ const u=fw*(.15+r()*.7); lotBox(P0,U,out,u-.05,u+.05,back+.4,back+.5,top,top+.9,'#2a2c2e','fbs'); } }
/* a solid, standable awning over a shopfront: sloped canvas, valance, dark underside */
function awning(P0,U,out,u0,u1,y,c1,c2){ const rc=awnCell(c1,c2), w=u1-u0, dep=1.35, drop=.5, o=[P0[0]+U[0]*u0,y,P0[2]+U[2]*u0], L_=Math.hypot(dep,drop), V=[out[0]*dep/L_,-drop/L_,out[2]*dep/L_];
  eKA([o[0]+U[0]*w,y,o[2]+U[2]*w],[-U[0],0,-U[2]],V,w,L_,rc,0,1,.1,1); const vo=[o[0]+out[0]*dep,y-drop,o[2]+out[2]*dep]; eKA([vo[0],y-drop-.28,vo[2]],U,Y_,w,.28,rc,0,1,0,.12);
  eKA([vo[0]+U[0]*w,y-drop-.28,vo[2]+U[2]*w],[-U[0],0,-U[2]],Y_,w,.28,rc,0,1,0,.12);
  eQK(o,U,V,w,L_,mix(c1,'#000000',.45));
  const xs=[o[0],o[0]+U[0]*w+out[0]*dep], zs=[o[2],o[2]+U[2]*w+out[2]*dep]; hsol(Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs),y-drop*.45,y-drop-.3); }
