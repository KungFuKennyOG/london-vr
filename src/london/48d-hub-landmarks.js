/* ==========================================================================================================
   SKY AND LANDMARKS. The sky is a box and a skyline ring that ride with the eye (they're "at infinity"): the City's
   towers to the west, Canary Wharf to the south-east, cranes, and the endless low roofline of the East End with its
   lit windows. The hand-built blocks (estates, park, school, Tube, church...) are filled in buildLandmarks().
   ========================================================================================================== */
const SKY=N(world); SKY.dyn=true;
const tSkyline=P2(2048,256,(g,w,h)=>{ g.clearRect(0,0,w,h); const r=hr(8801); const dark='#2a2e38';
  const tower=(x,tw,th,lit=.25,top=null)=>{ g.fillStyle=dark; g.fillRect(x,h-th,tw,th);
    if(top==='spire'){ g.beginPath(); g.moveTo(x,h-th); g.lineTo(x+tw/2,h-th-th*.25); g.lineTo(x+tw,h-th); g.fill(); }
    if(top==='pyramid'){ g.beginPath(); g.moveTo(x,h-th); g.lineTo(x+tw/2,h-th-tw*.5); g.lineTo(x+tw,h-th); g.fill(); R(g,'#ff2a1a',x+tw/2-1,h-th-tw*.5-3,3,3); }
    if(top==='curve'){ g.beginPath(); g.ellipse(x+tw/2,h-th,tw/2,tw*.9,0,Math.PI,0); g.fill(); }
    for(let y=h-th+3;y<h-2;y+=4) for(let xx=x+2;xx<x+tw-2;xx+=3) if(r()<lit) R(g,r()<.85?'#ffd9a0':'#bcd4ff',xx,y,2,2); };
  /* the endless low roofline all the way round */
  let x=0; while(x<w){ const bw=10+r()*30, bh=10+r()*18; g.fillStyle=dark; g.fillRect(x,h-bh,bw+1,bh); if(r()<.4) g.fillRect(x+bw*.3,h-bh-4,3,4);
    for(let y=h-bh+3;y<h-2;y+=5) for(let xx=x+2;xx<x+bw-2;xx+=4) if(r()<.12) R(g,'#ffcf8a',xx,y,2,2); x+=bw; }
  /* compass on the ring: u=0 east, .25 south, .5 west, .75 north */
  const U=u=>u*w;
  /* the City, west: a tight cluster of glass towers */
  for(const [u,tw,th,top] of [[.47,22,120,null],[.485,18,150,'curve'],[.5,26,170,null],[.515,14,135,'spire'],[.525,20,110,null],[.54,16,95,null],[.455,12,80,null],[.505,10,185,'spire']]) tower(U(u),tw,th,.3,top);
  /* Canary Wharf, south-east: three tall blocks, one with the pyramid and its light */
  for(const [u,tw,th,top] of [[.115,20,140,null],[.13,22,175,'pyramid'],[.148,18,150,null],[.165,12,95,null]]) tower(U(u),tw,th,.22,top);
  /* council towers dotted about, and cranes */
  for(const u of [.31,.36,.66,.7,.82,.9,.97]) tower(U(u),12,60+r()*30,.3);
  g.strokeStyle='#30343c'; g.lineWidth=2; for(const u of [.2,.44,.6,.78]){ const cx=U(u); g.beginPath(); g.moveTo(cx,h); g.lineTo(cx,h-150); g.moveTo(cx-40,h-145); g.lineTo(cx+70,h-145); g.stroke(); R(g,'#ff2a1a',cx-1,h-153,3,3); }
},0,1);
tSkyline.nomip=false;
{ const R_=86, N_=32, H_=44, gR=new Geo(); for(let i=0;i<=N_;i++){ const a=i/N_*Math.PI*2, x=Math.cos(a)*R_, z=Math.sin(a)*R_; gR.v([x,-2,z],[-Math.cos(a),0,-Math.sin(a)],[i/N_,0]); gR.v([x,H_,z],[-Math.cos(a),0,-Math.sin(a)],[i/N_,1]); }
  for(let i=0;i<N_;i++){ const a=i*2; gR.I.push(a,a+2,a+3,a,a+3,a+1); } gR.noDist=true;
  mk(gR,MM(tSkyline,{unlit:true,cut:true,double:true,nofog:true}),SKY,0,0,0);
  const gS=new Geo(); /* the sky: an open box of gradient, sodium-lit cloud low down */
  for(let i=0;i<=N_;i++){ const a=i/N_*Math.PI*2, x=Math.cos(a)*(R_+8), z=Math.sin(a)*(R_+8); gS.v([x,-4,z],[0,0,1],[0,1]); gS.v([x,90,z],[0,0,1],[0,0]); }
  for(let i=0;i<N_;i++){ const a=i*2; gS.I.push(a,a+2,a+3,a,a+3,a+1); } gS.noDist=true;
  const skyM=MM(tSky,{unlit:true,double:true,nofog:true}); SKY.skyM=skyM; mk(gS,skyM,SKY,0,0,0); }
function skyTick(eye){ SKY.p=[eye[0],0,eye[2]]; }

/* ---------------- landmark helpers ---------------- */
/* a box turned by yaw about its centre, faces tiled like eBoxF; F keys: f (front, local +z), b, l, r, t */
function eBoxR(cx,cz,w,d,y0,y1,yaw,F,o={}){ const c=Math.cos(yaw),s_=Math.sin(yaw), ax=[c,0,-s_], az=[s_,0,c], tu=o.tu||1,tv=o.tv||1,h=y1-y0, ov=o.ov||0, ou=o.ou||0, cell=o.cell||0;
  const P_=(lx,lz,y)=>[cx+ax[0]*lx+az[0]*lz,y,cz+ax[2]*lx+az[2]*lz], neg=v=>[-v[0],-v[1],-v[2]];
  if(F.f) eGrid(F.f,P_(-w/2,d/2,y0),ax,Y_,w,h,tu,tv,ou,ov,cell,cell?HUB.FLOOR:0);
  if(F.b) eGrid(F.b,P_(w/2,-d/2,y0),neg(ax),Y_,w,h,tu,tv,ou,ov,cell,cell?HUB.FLOOR:0);
  if(F.r) eGrid(F.r,P_(w/2,d/2,y0),neg(az),Y_,d,h,tu,tv,ou,ov,cell,cell?HUB.FLOOR:0);
  if(F.l) eGrid(F.l,P_(-w/2,-d/2,y0),az,Y_,d,h,tu,tv,ou,ov,cell,cell?HUB.FLOOR:0);
  if(F.t) eGrid(F.t,P_(-w/2,d/2,y1),ax,neg(az),w,d,o.ttu||4,o.ttu||4); }
/* collision for a turned box: a row of small axis-aligned boxes along its length */
function solR(cx,cz,w,d,y1,yaw,y0=0){ const c=Math.cos(yaw),s_=Math.sin(yaw), n=Math.max(1,Math.ceil(w/2.5));
  for(let i=0;i<n;i++){ const lx=-w/2+(i+.5)*w/n, px=cx+c*lx, pz=cz-s_*lx, hw=Math.abs(c)*w/n/2+Math.abs(s_)*d/2, hd=Math.abs(s_)*w/n/2+Math.abs(c)*d/2; hsol(px-hw*.8,pz-hd*.8,px+hw*.8,pz+hd*.8,y1,y0); } }
/* a straight flight of steps up the +dir axis; each step is a solid */
function steps(x,z,dir,w,n,rise,go,m){ for(let i=0;i<n;i++){ const y=PAVE_Y+(i+1)*rise; let x0,z0,x1,z1;
    if(dir==='x'){ x0=x+i*go; x1=x0+go; z0=z-w/2; z1=z+w/2; } else if(dir==='-x'){ x1=x-i*go; x0=x1-go; z0=z-w/2; z1=z+w/2; } else if(dir==='z'){ z0=z+i*go; z1=z0+go; x0=x-w/2; x1=x+w/2; } else { z1=z-i*go; z0=z1-go; x0=x-w/2; x1=x+w/2; }
    eBox(x0,z0,x1,z1,PAVE_Y,y,m,{tu:1,tv:1}); hsol(x0,z0,x1,z1,y); } }
const tMesh=P2(32,32,(g,w,h)=>{ g.clearRect(0,0,w,h); g.strokeStyle='#5a6064'; g.lineWidth=1; for(let i=-32;i<64;i+=6){ g.beginPath(); g.moveTo(i,0); g.lineTo(i+32,32); g.stroke(); g.beginPath(); g.moveTo(i+32,0); g.lineTo(i,32); g.stroke(); } R(g,'#3a3e42',0,0,w,2); },0,1);
const mMesh=(()=>{ const m=M(tMesh,{double:true,cut:true}); return m; })(), mPost2=col(0x3a3e42);
function cage(x0,z0,x1,z1,h,gaps=[]){ /* a chain-link fence round a rect; gaps: [side, from, to] */
  const side=(k,a,b)=>{ const segs=[[a,b]]; for(const [gk,ga,gb] of gaps) if(gk===k){ const s0=segs.pop(); if(ga>s0[0]) segs.push([s0[0],ga]); if(gb<s0[1]) segs.push([gb,s0[1]]); } return segs; };
  for(const [a,b] of side('n',x0,x1)){ eGrid(mMesh,[a,PAVE_Y,z0],X_,Y_,b-a,h,1.2,1.2); hsol(a,z0-.05,b,z0+.05,PAVE_Y+h); }
  for(const [a,b] of side('s',x0,x1)){ eGrid(mMesh,[a,PAVE_Y,z1],X_,Y_,b-a,h,1.2,1.2); hsol(a,z1-.05,b,z1+.05,PAVE_Y+h); }
  for(const [a,b] of side('w',z0,z1)){ eGrid(mMesh,[x0,PAVE_Y,a],Z_,Y_,b-a,h,1.2,1.2); hsol(x0-.05,a,x0+.05,b,PAVE_Y+h); }
  for(const [a,b] of side('e',z0,z1)){ eGrid(mMesh,[x1,PAVE_Y,a],Z_,Y_,b-a,h,1.2,1.2); hsol(x1-.05,a,x1+.05,b,PAVE_Y+h); }
  for(const [px,pz] of [[x0,z0],[x1,z0],[x0,z1],[x1,z1]]) eBox(px-.05,pz-.05,px+.05,pz+.05,PAVE_Y,PAVE_Y+h,mPost2); }
/* railings round a rect with gates */
function railRect(x0,z0,x1,z1,gaps=[],h=1.2){ const cut=(k,a,b)=>{ let segs=[[a,b]]; for(const [gk,ga,gb] of gaps) if(gk===k) segs=segs.flatMap(([p,q])=>ga>=q||gb<=p?[[p,q]]:[[p,ga],[gb,q]].filter(([u,v])=>v-u>.2)); return segs; };
  for(const [a,b] of cut('n',x0,x1)) railing(a,z0,b,z0,h); for(const [a,b] of cut('s',x0,x1)) railing(a,z1,b,z1,h);
  for(const [a,b] of cut('w',z0,z1)) railing(x0,a,x0,b,h); for(const [a,b] of cut('e',z0,z1)) railing(x1,a,x1,b,h); }
/* a path strip between two points */
function pathStrip(x0,z0,x1,z1,w,m=mPath){ const L_=Math.hypot(x1-x0,z1-z0), U=[(x1-x0)/L_,0,(z1-z0)/L_], V=[U[2],0,-U[0]]; eGrid(m,[x0-V[0]*w/2,PAVE_Y+.012,z0-V[2]*w/2],U,V,L_,w,2,2,0,0,3,0); }
/* a park lamp: shorter, white-ish light */
function parkLamp(x,z){ eBoxF(x-.06,z-.06,x+.06,z+.06,PAVE_Y,PAVE_Y+4.2,{n:mPole,s:mPole,e:mPole,w:mPole}); eBox(x-.2,z-.2,x+.2,z+.2,PAVE_Y+4.2,PAVE_Y+4.55,mLampHead);
  eGrid(mGlow,[x-.7,PAVE_Y+3.7,z],X_,Y_,1.4,1.4,1.4,1.4); eGrid(mGlow,[x,PAVE_Y+3.7,z-.7],Z_,Y_,1.4,1.4,1.4,1.4); const L_=[[x,PAVE_Y+4.2,z],[1.7,1.5,1.1],11]; STREET_LIGHT.pl.push(L_); LAMPS.push(L_); }
/* a named entrance sign on a wall (council style) */
const councilSign=(name,sub,c,U,w=2.4,h=.5)=>eSign(atlasSign('#1c2f5a','#f4f2ea',name,null,{face:'grot'}),c,U,w,h*.75);
/* the tall bits that should read over the rooftops from far off: drawn without fog, dark with lit windows (the clock lifts them by day) */
const FARM=[]; function farMat(t,o){ const m=MM(t,Object.assign({nofog:true},o)); FARM.push([m,m.color.slice()]); return m; }
const FAR=N(world);
function farBox(x0,z0,x1,z1,y0,y1,m,lit){ const g=new Geo(), w=x1-x0,d=z1-z0,h=y1-y0; /* four walls as one node, never culled by distance */
  const add=(o,U,len)=>{ const b=g.P.length/3, n=[U[1]*0-U[2]*1,0,U[0]]; for(const [s,t] of [[0,0],[1,0],[1,1],[0,1]]){ g.v([o[0]+U[0]*len*s,o[1]+h*t,o[2]+U[2]*len*s],n,[len*s/(4*HUB.BAY),h*t/(3*HUB.FLOOR)]); } g.I.push(b,b+1,b+2,b,b+2,b+3); };
  add([x0,y0,z1],X_,w); add([x1,y0,z0],NX,w); add([x1,y0,z1],NZ,d); add([x0,y0,z0],Z_,d); g.noDist=true; mk(g,m,FAR); if(lit){ const g2=new Geo(); g2.P=g.P.map((v,i)=>v); g2.Nm=g.Nm.slice(); g2.T=g.T.slice(); g2.I=g.I.slice();
    /* push the lit layer out 3 cm along each face normal */ for(let i=0;i<g2.P.length;i+=3){ g2.P[i]+=g2.Nm[i]*.03; g2.P[i+2]+=g2.Nm[i+2]*.03; } g2.noDist=true; mk(g2,lit,FAR); } }

/* ---------------- the hand-built blocks ---------------- */
const LM={};
/* WEAVERS FIELDS: railings and gates, a cross of paths and a perimeter loop, plane trees, a football cage, a playground, benches, park lamps */
LM.weavers=([x0,z0,x1,z1])=>{ const cx=(x0+x1)/2, cz=(z0+z1)/2;
  eFlat(x0,z0,x1,z1,PAVE_Y,mGrass,2,6); railRect(x0+.5,z0+.5,x1-.5,z1-.5,[['n',cx-3,cx+3],['s',cx-3,cx+3],['w',cz-3,cz+3],['e',cz-3,cz+3],['n',x0+4,x0+8],['s',x1-8,x1-4]]);
  pathStrip(cx,z0,cx,z1,3); pathStrip(x0,cz,x1,cz,3); pathStrip(x0+6,z0+6,x1-6,z0+6,2.4); pathStrip(x0+6,z1-6,x1-6,z1-6,2.4); pathStrip(x0+6,z0+6,x0+6,z1-6,2.4); pathStrip(x1-6,z0+6,x1-6,z1-6,2.4);
  pathStrip(x0+6,z0+6,cx-2,cz-2,2.4); pathStrip(x1-6,z1-6,cx+2,cz+2,2.4);
  const r=hr(6101); for(let x=x0+12;x<x1-10;x+=14){ for(const z of [z0+10,z1-10,cz-6,cz+6]){ if(Math.abs(x-cx)<8) continue; tree(x+r()*3,z+r()*2,1.1+r()*.4); } }
  for(let z=z0+18;z<z1-12;z+=16){ tree(x0+11,z,1.2); tree(x1-11,z,1.2); }
  /* the football cage (green surface, goals) and the playground */
  const fx0=x0+30,fz0=z0+22,fx1=fx0+36,fz1=fz0+22; eFlat(fx0,fz0,fx1,fz1,PAVE_Y+.01,MM(P2(32,32,(g,w,h)=>{ R(g,'#1e4a2e',0,0,w,h); specks(g,'#2a5a3a',90,6102,w,h); R(g,'#d8d8d0',0,0,w,1); },0,1)),4,6);
  cage(fx0,fz0,fx1,fz1,4,[['e',fz0+9,fz0+13]]); for(const gx of [fx0+.6,fx1-.6]){ eBox(gx-.05,(fz0+fz1)/2-1.6,gx+.05,(fz0+fz1)/2+1.6,PAVE_Y+2,PAVE_Y+2.1,col(0xe8e8e0)); for(const s of [-1.6,1.6]) eBox(gx-.05,(fz0+fz1)/2+s-.05,gx+.05,(fz0+fz1)/2+s+.05,PAVE_Y,PAVE_Y+2.1,col(0xe8e8e0)); }
  const px0=x1-56,pz0=z0+20; eFlat(px0,pz0,px0+24,pz0+18,PAVE_Y+.01,MM(P2(32,32,(g,w,h)=>{ R(g,'#7a3a2a',0,0,w,h); specks(g,'#8a4a3a',120,6103,w,h); },0,1)),3,6); railRect(px0,pz0,px0+24,pz0+18,[['w',pz0+7,pz0+10]],1.0);
  const red=col(0xb83020), yel=col(0xd8a020), blu=col(0x2a5aa8);
  /* swings */ for(const s of [0,4]){ eBox(px0+3+s,pz0+4,px0+3.12+s,pz0+4.12,PAVE_Y,PAVE_Y+2.4,red); eBox(px0+6+s,pz0+4,px0+6.12+s,pz0+4.12,PAVE_Y,PAVE_Y+2.4,red); } eBox(px0+3,pz0+4,px0+10.12,pz0+4.12,PAVE_Y+2.4,PAVE_Y+2.52,red);
  /* slide */ eBox(px0+14,pz0+3,px0+16,pz0+5,PAVE_Y,PAVE_Y+1.8,yel); hsol(px0+14,pz0+3,px0+16,pz0+5,PAVE_Y+1.8); eGrid(blu,[px0+16,PAVE_Y+1.8,pz0+5],[.8,-.6,0],Z_,3,2,1,1); eGrid(blu,[px0+16,PAVE_Y+1.8,pz0+3],Z_,[.8,-.6,0],2,3,1,1);
  /* roundabout */ eGeo(cyl(1.6,1.6,.25,10),blu,px0+7,PAVE_Y+.2,pz0+12); hsol(px0+5.8,pz0+10.8,px0+8.2,pz0+13.2,PAVE_Y+.35);
  for(const [bx,bz,ry] of [[cx-6,cz-3.2,0],[cx+6,cz+3.2,Math.PI],[cx-3.2,z0+20,Math.PI/2],[cx+3.2,z1-20,-Math.PI/2]]) bench(bx,bz,ry);
  for(let x=x0+20;x<x1-10;x+=34){ parkLamp(x,cz-2.2); parkLamp(x,z0+6+1.6); parkLamp(x,z1-6-1.6); } parkLamp(cx+2.2,z0+26); parkLamp(cx+2.2,z1-26);
  bin(cx+2.4,cz-4); bin(cx-2.4,cz+4);
  PARK_SPOTS.push([cx,cz],[fx0+18,fz0+11],[px0+12,pz0+9]);
};
const PARK_SPOTS=[], DECK_SPOTS=[], GARAGE_TOPS=[];
/* a flight of steps from y0, n steps of rise and go, along dir */
function flight(x,z,dir,w,n,y0,rise,go,m){ for(let i=0;i<n;i++){ const y=y0+(i+1)*rise; let x0,z0,x1,z1;
    if(dir==='x'){ x0=x+i*go; x1=x0+go; z0=z-w/2; z1=z+w/2; } else if(dir==='-x'){ x1=x-i*go; x0=x1-go; z0=z-w/2; z1=z+w/2; } else if(dir==='z'){ z0=z+i*go; z1=z0+go; x0=x-w/2; x1=x+w/2; } else { z1=z-i*go; z0=z1-go; x0=x-w/2; x1=x+w/2; }
    eBoxF(x0,z0,x1,z1,y-rise-.02,y,{n:m,s:m,e:m,w:m,t:m},{tu:1,tv:1}); hsol(x0,z0,x1,z1,y,y-rise-.3); } }
/* upper floors of a tall block that read from across the hub: a fogged lower part and a fog-free upper part */
function tallBlock(x0,z0,x1,z1,h,F,cut=18){ if(cut>3.3) eFacade(x0,z0,x1,z1,PAVE_Y+3.2,PAVE_Y+cut,F,'nsew');
  F.farB=F.farB||farMat(F.base,{}); F.farL=F.farL||farMat(F.lit,{unlit:true,cut:true}); farBox(x0,z0,x1,z1,PAVE_Y+cut,PAVE_Y+h,F.farB,F.farL); hsol(x0,z0,x1,z1,PAVE_Y+h); }
const mConcW=MM(P2(64,64,(g,w,h)=>{ paintWall(g,BRICKS.estate,w,h,hr(6201)); },0,1)), mLobby=nightM(P2(64,64,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#e8f0f2'],[1,'#a8b8c0']]); R(g,'#5a6a72',0,h-10,w,10); R(g,'#3a4a52',20,10,24,44); },0,1),{unlit:true},0);
const mRed=nightM(null,{color:0xff2010,unlit:true,nofog:true},0);

/* THE BRAMLEY ESTATE: three twenty-storey towers you can see from anywhere, a deck block, garages, a car park, a playground */
LM.bramley=([x0,z0,x1,z1])=>{ eFlat(x0,z0,x1,z1,PAVE_Y,mYard,2,8); const F=facade('estate','tower',0), r=hr(6301), W=x1-x0, H=z1-z0;
  const T=[[x0+18,z0+18,'BRAMLEY HOUSE'],[x1-22,(z0+z1)/2-6,'ASHLEY HOUSE'],[x0+18,z1-30,'CROMER HOUSE']];
  for(const [tx,tz,name] of T){ const a=tx-11,b=tz-11,c=tx+11,d=tz+11; eBoxF(a,b,c,d,PAVE_Y,PAVE_Y+3.2,{n:mConcW,s:mConcW,e:mConcW,w:mConcW},{tu:2.5,tv:3.2,cell:3}); tallBlock(a,b,c,d,62,F,3.2);
    eGrid(mLobby,[tx-2.5,PAVE_Y,d+.03],X_,Y_,5,2.6,5,2.6); eBox(tx-3.5,d,tx+3.5,d+2.5,PAVE_Y+2.8,PAVE_Y+3.1,mConcW); councilSign(name,'',[tx,PAVE_Y+3.5,d+.05],X_,3.6,.6);
    STREET_LIGHT.pl.push([[tx,PAVE_Y+2.4,d+2],[1.0,1.15,1.2],7]); eBox(tx-4,tz-4,tx+4,tz+4,PAVE_Y+62,PAVE_Y+65,mConcW); eBox(tx-.2,tz-.2,tx+.2,tz+.2,PAVE_Y+65,PAVE_Y+65.4,mRed); tree(a-3,d-3,1.1); }
  /* garages along the south edge, a car park by the main road, a small playground */
  for(let i=0;i<7;i++){ const gx=x0+40+i*6.2; eBoxF(gx,z1-9,gx+5.8,z1-3,PAVE_Y,PAVE_Y+2.5,{n:SHUT[i%6],s:mBrickW,e:mBrickW,w:mBrickW,t:mFelt},{tu:5.8,tv:2.5}); hsol(gx,z1-9,gx+5.8,z1-3,PAVE_Y+2.5); GARAGE_TOPS.push([gx+2.9,PAVE_Y+2.5,z1-6]); }
  const tBay=P2(32,32,(g,w,h)=>{ R(g,'#2a2a2c',0,0,w,h); specks(g,'#353538',120,6302,w,h); R(g,'#d8d8d0',0,0,1,h); },0,1); eFlat(x1-44,z0+4,x1-4,z0+40,PAVE_Y+.005,MM(tBay),2.5,6);
  for(let i=0;i<8;i++) carPark(x1-38+(i%4)*10,z0+10+(i>3?20:0),i); parkLamp(x1-24,z0+22);
  cage(x0+44,z0+50,x0+68,z0+66,1.2,[['n',x0+54,x0+58]]); eFlat(x0+44,z0+50,x0+68,z0+66,PAVE_Y+.01,MM(P2(32,32,(g,w,h)=>{ R(g,'#3a6a8a',0,0,w,h); specks(g,'#4a7a9a',80,6303,w,h); },0,1)),3,6);
  for(let i=0;i<8;i++) tree(x0+40+r()*(W-60),z0+40+r()*(H-55),.9+r()*.5); parkLamp(x0+40,z0+44); parkLamp(x0+80,z1-14);
};
/* a parked car (static): body, cabin, wheels, lights */
const CARC=[0x1a1a1c,0xb8bcc0,0x2a3a5a,0x6a1a1a,0xd8d8d0,0x3a4a3a,0x5a5a5e,0x8a6a2a];
function carPark(x,z,i,yaw=0,y0=PAVE_Y){ const c=col(CARC[i%CARC.length]), gl_=col(0x0c1014);
  eBoxR(x,z,1.8,4.2,y0+.28,y0+.95,yaw,{f:c,b:c,l:c,r:c,t:c}); eBoxR(x,z+.2,1.6,2.2,y0+.95,y0+1.45,yaw,{f:gl_,b:gl_,l:gl_,r:gl_,t:c});
  for(const [wx,wz] of [[-.8,1.3],[.8,1.3],[-.8,-1.3],[.8,-1.3]]){ const c_=Math.cos(yaw),s_=Math.sin(yaw); eBoxR(x+c_*wx+s_*wz,z-s_*wx+c_*wz,.24,.62,y0,y0+.62,yaw,{f:mDark,b:mDark,l:mDark,r:mDark}); }
  solR(x,z,1.8,4.2,y0+1.45,yaw); }

/* THE DECKS: three deck-access slabs, five storeys, with walkways and stair towers you can climb */
LM.decks=([x0,z0,x1,z1])=>{ eFlat(x0,z0,x1,z1,PAVE_Y,mYard,2,8); const r=hr(6401), H_=z1-z0;
  const slabs=[[x0+16,x0+100,z0+16],[x0+30,x0+114,z0+44],[x0+16,x0+100,z0+72]];
  slabs.forEach(([a,b,zc],si)=>{ const zn=zc-5, zs=zc+5, H=5, F=facade(['estbrick','estate','estbrick'][si],'estate',si+3);
    eFacade(a,zn,b,zs,PAVE_Y,PAVE_Y+H*3,F,'nsew'); eFlat(a,zn,b,zs,PAVE_Y+H*3+.01,mFelt,4,0); eBoxF(a-.1,zn-.1,b+.1,zs+.1,PAVE_Y+H*3,PAVE_Y+H*3+.4,{n:mConcW,s:mConcW,e:mConcW,w:mConcW,t:mConcW},{tu:2.5,tv:.4}); hsol(a,zn,b,zs,PAVE_Y+H*3+.4);
    for(let f=1;f<H;f++){ const y=PAVE_Y+f*3; eBoxF(a,zs,b,zs+1.8,y-.28,y,{s:mConcW,t:mConcW,e:mConcW,w:mConcW},{tu:2.5,tv:.3}); eBoxF(a,zs+1.6,b,zs+1.8,y,y+1.05,{s:mConcW,n:mConcW,t:mConcW},{tu:2.5,tv:1.05});
      hsol(a,zs,b,zs+1.8,y,y-.3); hsol(a,zs+1.6,b,zs+1.8,y+1.05,y); if(f>=2) DECK_SPOTS.push([a+20+f*8,y,zs+.9]); }
    DECK_SPOTS.push([(a+b)/2,PAVE_Y+15.4,zc]);
    const sx=a-5.5; eBoxF(sx,zs-4,a,zs+1.8,PAVE_Y,PAVE_Y+H*3+1,{n:mConcW,w:mConcW,t:mConcW},{tu:2.5,tv:3});
    for(let f=0;f<H-1;f++){ const y0=PAVE_Y+f*3; flight(sx+.4,zs-2.9,'x',1.6,8,y0,.1875,.55,mConcW); eBoxF(sx+4.8,zs-3.8,a,zs-.4,y0+1.5-.2,y0+1.5,{t:mConcW,n:mConcW,s:mConcW,e:mConcW,w:mConcW}); hsol(sx+4.8,zs-3.8,a,zs-.4,y0+1.5,y0+1.2);
      flight(a,zs+.9,'-x',1.6,8,y0+1.5,.1875,.55,mConcW); }
    councilSign(['HOLLAND','KENSWORTH','DUNMORE'][si]+' HOUSE','',[(a+b)/2,PAVE_Y+2.4,zs+.05],X_,3.2,.55);
    for(let k=0;k<3;k++) tree(a+10+k*28+r()*6,zs+8+r()*3,1); bin(b+3,zn+2); parkLamp(a+20,zs+6); parkLamp(b-20,zs+6); });
  for(let i=0;i<5;i++) carPark(x1-10,z0+14+i*7,i+3,Math.PI/2);
};

/* ARNOLD CIRCUS: a mound with a bandstand, ringed by red-brick mansion blocks of the Boundary Estate */
LM.boundary=([x0,z0,x1,z1])=>{ const cx=(x0+x1)/2, cz=(z0+z1)/2; eFlat(x0,z0,x1,z1,PAVE_Y,mPave,1.2,4);
  const gr=MM(tGrass); for(const [rr,h] of [[12.5,1.0],[9.5,2.0],[6.5,3.0]]){ eGeo(cyl(rr,rr,h,16),[gr,gr,gr],cx,PAVE_Y+h/2,cz); const q=rr*.78; hsol(cx-q,cz-q,cx+q,cz+q,PAVE_Y+h); }
  for(const [dx,dz,dir] of [[0,12.5,'-z'],[0,-12.5,'z'],[12.5,0,'-x'],[-12.5,0,'x']]) flight(cx+dx,cz+dz,dir,2.2,12,PAVE_Y,.25,.5,mPave);
  const top=PAVE_Y+3, bm=col(0x1e3a2a); for(let k=0;k<8;k++){ const a=k/8*Math.PI*2; eBox(cx+Math.cos(a)*4.4-.1,cz+Math.sin(a)*4.4-.1,cx+Math.cos(a)*4.4+.1,cz+Math.sin(a)*4.4+.1,top,top+3,bm); }
  eGeo(cyl(5.2,.3,2,8),bm,cx,top+4,cz); eGeo(cyl(5,5,.3,8),col(0x8a7a5a),cx,top+.15,cz); hsol(cx-4.6,cz-4.6,cx+4.6,cz+4.6,top+.3);
  for(let k=0;k<10;k++){ const a=k/10*Math.PI*2; tree(cx+Math.cos(a)*16,cz+Math.sin(a)*16,1.1); }
  const F=facade('red','mansion',0), F2=facade('red','mansion',1);
  for(let k=0;k<8;k++){ const a=k/8*Math.PI*2+Math.PI/8, R_=Math.min(x1-x0,z1-z0)/2-6, bx=cx+Math.cos(a)*R_*((x1-x0)/(z1-z0)>1.2?1.35:1), bz=cz+Math.sin(a)*R_, yaw=Math.atan2(Math.cos(a),Math.sin(a))+Math.PI, FF=k%2?F:F2, H=PAVE_Y+15, w=20, d=10;
    eBoxR(bx,bz,w,d,PAVE_Y,H,yaw,{f:FF.mBase,b:FF.mBase,l:FF.mBase,r:FF.mBase,t:mFelt},{tu:FF.bays*HUB.BAY,tv:FF.floors*HUB.FLOOR,cell:3});
    eBoxR(bx,bz,w+.06,d+.06,PAVE_Y,H,yaw,{f:FF.mLit,b:FF.mLit},{tu:FF.bays*HUB.BAY,tv:FF.floors*HUB.FLOOR}); eBoxR(bx,bz,w+.3,d+.3,H,H+.5,yaw,{f:mCope,b:mCope,l:mCope,r:mCope,t:mCope});
    solR(bx,bz,w,d,H+.5,yaw); }
  for(let k=0;k<6;k++) parkLamp(cx+Math.cos(k/6*Math.PI*2)*19,cz+Math.sin(k/6*Math.PI*2)*19);
  STREET_LIGHT.pl.push([[cx,top+2.4,cz],[1.6,1.2,.8],12]); BANDSTAND.push([cx,top,cz]);
};
const BANDSTAND=[], CHURCH_TOWER=[];

/* THE SCHOOL: a tall Victorian board school, its playground in a cage */
WIN.school={w:1.6,h:2.3,sill:.6,lintel:true};
LM.school=([x0,z0,x1,z1])=>{ eFlat(x0,z0,x1,z1,PAVE_Y,mPave,1.2,4); const F=facade('stock','school',0), bx1=x0+(x1-x0)*.58;
  eFacade(x0+3,z0+5,bx1,z1-4,PAVE_Y,PAVE_Y+13,F,'nsew'); hsol(x0+3,z0+5,bx1,z1-4,PAVE_Y+13); eFlat(x0+3,z0+5,bx1,z1-4,PAVE_Y+13.01,mSlate,2,0);
  const gx=(x0+3+bx1)/2; eBoxF(gx-5,z0+4,gx+5,z0+5,PAVE_Y+13,PAVE_Y+17,{n:F.mBase,s:F.mBase,e:F.mBase,w:F.mBase,t:mCope},{tu:10,tv:9}); eGeo(box(10.4,.4,1.4),mCope,gx,PAVE_Y+17,z0+4.5);
  const pg=MM(P2(64,64,(g,w,h)=>{ R(g,'#2a2a2e',0,0,w,h); specks(g,'#36363a',260,6501,w,h); g.strokeStyle='#d8c040'; g.lineWidth=2; g.strokeRect(8,8,48,48); g.beginPath(); g.arc(32,32,10,0,7); g.stroke(); },0,1));
  eFlat(bx1+3,z0+3,x1-2,z1-3,PAVE_Y+.01,pg,12,6); cage(bx1+3,z0+3,x1-2,z1-3,3.2,[['n',bx1+6,bx1+10]]);
  railing(x0+2,z0+1.5,bx1,z0+1.5,1.6); councilSign('VALLANCE PRIMARY SCHOOL','',[gx,PAVE_Y+2.6,z0+1.53],[-1,0,0],5,.7);
};

/* THE SUPERMARKET: a big lit shed and its car park */
LM.supermarket=([x0,z0,x1,z1])=>{ eFlat(x0,z0,x1,z1,PAVE_Y,MM(P2(32,32,(g,w,h)=>{ R(g,'#2a2a2c',0,0,w,h); specks(g,'#353538',120,6601,w,h); R(g,'#d8d8d0',0,0,1,h); },0,1)),2.5,6);
  const sx0=x0+3,sx1=x0+(x1-x0)*.62,sz0=z0+9,sz1=z1-2; eBoxF(sx0,sz0,sx1,sz1,PAVE_Y,PAVE_Y+7.5,{n:mConcW,s:mConcW,e:mConcW,w:mConcW,t:mFelt},{tu:2.5,tv:3,cell:4}); hsol(sx0,sz0,sx1,sz1,PAVE_Y+7.5);
  const glass=nightM(P2(128,64,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#f4f8f4'],[1,'#c8d4d0']]); for(let i=0;i<8;i++){ R(g,'#6a8a7a',4+i*16,20,10,44); for(let k=0;k<5;k++) R(g,['#c83a2a','#e8c040','#3a7a3a','#f0f0f0'][k%4],5+i*16,24+k*8,8,5); } },0,1),{unlit:true},0);
  eGrid(glass,[sx1-2,PAVE_Y,sz0-.03],NX,Y_,sx1-sx0-6,3.2,sx1-sx0-6,3.2); eSign(atlasSign('#0e5a3a','#ffffff','FOODSAVE','OPEN 7AM – 11PM',{face:'grot',subC:'#bfe8d0'}),[(sx0+sx1)/2,PAVE_Y+5.4,sz0-.05],NX,12,1.8);
  for(let i=0;i<6;i++) carPark(sx1+5+(i%3)*7,z0+10+(i>2?24:0),i+1,0); parkLamp(sx1+12,(z0+z1)/2);
  STREET_LIGHT.pl.push([[(sx0+sx1)/2,PAVE_Y+3,sz0-3],[1.2,1.3,1.25],10]);
};

/* MUSEUM GARDENS, THE MUSEUM, AND THE TUBE */
LM.gardens=([x0,z0,x1,z1])=>{ const cx=(x0+x1)/2; eFlat(x0,z0,x1,z1,PAVE_Y,mGrass,2,6); railRect(x0+.5,z0+.5,x1-.5,z1-.5,[['n',cx-3,cx+3],['w',z0+20,z0+24],['e',z0+20,z0+24]]);
  pathStrip(cx,z0,cx,z1-34,3); pathStrip(x0,z0+22,x1,z0+22,3); for(let x=x0+8;x<x1-6;x+=12){ tree(x,z0+10,1.2); tree(x,z0+34,1.1); } parkLamp(cx+2,z0+12); parkLamp(cx+2,z0+40); parkLamp(x0+20,z0+24); parkLamp(x1-20,z0+24);
  const F=facade('red','mansion',2); eFacade(x0+10,z1-32,x1-10,z1-6,PAVE_Y,PAVE_Y+12,F,'nsew'); eFlat(x0+10,z1-32,x1-10,z1-6,PAVE_Y+12.01,mSlate,2,0); hsol(x0+10,z1-32,x1-10,z1-6,PAVE_Y+12);
  eSign(atlasSign('#2a2a2a','#f0e8d8','BETHNAL GREEN MUSEUM','TOYS · GAMES · CHILDHOOD · FREE ENTRY',{face:'cond',subC:'#d8c8a8'}),[cx,PAVE_Y+7,z1-32.05],NX,10,1.3);
  /* the Tube: a stair well behind railings, its sign on a post */
  tubeEntrance(x1-7,z0+5,'z');
};
const mTubeSign=nightM(null,{color:0xf2f2ee,unlit:true},.0);
function tubeEntrance(x,z,ax){ const w=3.2,l=7; const x0=x-w/2,x1=x+w/2,z0=z-l/2,z1=z+l/2;
  eGrid(col(0x0a0a0c),[x0,PAVE_Y+.01,z1],X_,NZ,w,l,1,1); for(let i=0;i<10;i++){ const zz=z0+i*.7; eBox(x0,zz,x1,zz+.7,PAVE_Y-.2-i*.3,PAVE_Y-.1-i*.3,col(0x6a6a6a)); }
  railRect(x0-.1,z0-.1,x1+.1,z1+.1,[['n',x0+.2,x1-.2]],1.1); eGrid(mTile(),[x0,PAVE_Y-3,z0],Z_,Y_,l,3,1,1); eGrid(mTile(),[x1,PAVE_Y-3,z1],NZ,Y_,l,3,1,1);
  eBox(x0-.6,z0-.6,x0-.45,z0-.45,PAVE_Y,PAVE_Y+3,mPole); eSign(atlasSign('#1a2a6a','#ffffff','BETHNAL GREEN','STATION · CENTRAL LINE',{face:'grot',subC:'#e8e8ff'}),[x0-.52,PAVE_Y+3.3,z0-.42],X_,2.2,.5);
  STREET_LIGHT.pl.push([[x,PAVE_Y+2.5,z0-1],[1.1,1.2,1.3],7]); TUBES.push([x,z0-1]); }
const TUBES=[]; let _mTile=null; function mTile(){ return _mTile||(_mTile=nightM(P2(32,32,(g,w,h)=>{ R(g,'#e8e4d8',0,0,w,h); for(let i=0;i<w;i+=8) R(g,'#c8c4b8',i,0,1,h); for(let i=0;i<h;i+=8) R(g,'#c8c4b8',0,i,w,1); R(g,'#1a2a6a',0,12,w,4); },0,1),{unlit:true},.4)); }

function churchFacade(){ if(LM._ch) return LM._ch; const w=5*PXM, h=12*PXM, B=BRICKS.cream, r=hr(6901), draw=(g,lit)=>{ if(!lit){ paintWall(g,B,w,h,r); for(let i=0;i<10;i++){ const x=r()*w|0; vfill(g,x,h*.1,3+(r()*6|0),h*.8,[[0,'rgba(40,36,30,.35)'],[1,'rgba(40,36,30,0)']]); } R(g,'rgba(30,26,20,.28)',0,h-26,w,26); } else g.clearRect(0,0,w,h);
    const ww=1.6*PXM, wh=6.2*PXM, x=(w-ww)/2, y=h-(1.6*PXM+wh);
    g.save(); g.beginPath(); g.moveTo(x,y+wh); g.lineTo(x,y+ww/2); g.arc(x+ww/2,y+ww/2,ww/2,Math.PI,0); g.lineTo(x+ww,y+wh); g.closePath();
    if(lit){ g.clip(); vfill(g,x,y,ww,wh,[[0,'#ffe0a8'],[1,'#e8a050']]); for(let k=1;k<6;k++) R(g,'rgba(60,40,20,.8)',x,y+k*wh/6,ww,2); R(g,'rgba(60,40,20,.8)',x+ww/2-1,y,2,wh); }
    else { g.fillStyle='#e8e2d2'; g.lineWidth=4; g.strokeStyle='#e8e2d2'; g.stroke(); g.clip(); vfill(g,x,y,ww,wh,[[0,'#1c2430'],[1,'#0c1016']]); }
    g.restore(); if(!lit){ R(g,'#d8d0bc',0,h-11*PXM,w,6); R(g,'#d8d0bc',0,h-1.4*PXM,w,5); } };
  const base=P2(w,h,g=>draw(g,false),0,6902), lit=P2(w,h,g=>draw(g,true),0,6903);
  return LM._ch={base,lit,bays:2,floors:4,mBase:MM(base),mLit:nightM(lit,{unlit:true,cut:true})}; }
/* ST JOHN ON BETHNAL GREEN: a pale stone church with a tall clock tower and cupola, a churchyard with graves */
LM.church=([x0,z0,x1,z1])=>{ eFlat(x0,z0,x1,z1,PAVE_Y,mGrass,2,6); railRect(x0+.5,z0+.5,x1-.5,z1-.5,[['s',(x0+x1)/2-3,(x0+x1)/2+3],['e',z1-14,z1-10]]);
  const cx=(x0+x1)/2, F=churchFacade(), stone=MM(P2(64,64,(g,w,h)=>{ paintWall(g,BRICKS.cream,w,h,hr(6801)); for(let y=0;y<h;y+=12) R(g,'#b8ac90',0,y,w,1); },0,1));
  eFacade(cx-14,z0+18,cx+14,z1-24,PAVE_Y,PAVE_Y+13,F,'nsew'); eGeo(box(29,.6,z1-z0-41),mCope,cx,PAVE_Y+13.3,(z0+18+z1-24)/2); eFlat(cx-14,z0+18,cx+14,z1-24,PAVE_Y+13.6,mSlate,2,0); hsol(cx-14,z0+18,cx+14,z1-24,PAVE_Y+13.6);
  /* portico */ const pz=z1-24; for(let k=0;k<4;k++) eGeo(cyl(.4,.4,8,8),stone,cx-6+k*4,PAVE_Y+4,pz+3); eBox(cx-8,pz,cx+8,pz+4.4,PAVE_Y+8,PAVE_Y+9.4,stone); hsol(cx-8,pz,cx+8,pz+4.4,PAVE_Y+9.4,PAVE_Y+8); steps(cx,pz+5.2,'-z',14,3,.17,.4,stone);
  /* the tower: square, then a lantern stage, then the cupola */ const tz=pz-4; eBox(cx-4,tz-4,cx+4,tz+4,PAVE_Y+13.6,PAVE_Y+20,stone,{tu:2,tv:2});
  const sB=farMat(P2(64,64,(g,w,h)=>{ paintWall(g,BRICKS.cream,w,h,hr(6802)); R(g,'#1a1a1a',24,20,16,30); },0,1),{});
  farBox(cx-3.4,tz-3.4,cx+3.4,tz+3.4,PAVE_Y+20,PAVE_Y+27,sB); farBox(cx-2.4,tz-2.4,cx+2.4,tz+2.4,PAVE_Y+27,PAVE_Y+31,sB);
  const clock=nightM(P2(64,64,(g,w,h)=>{ g.clearRect(0,0,w,h); ell(g,32,32,30,30,'#f2ecd8'); ell(g,32,32,27,27,'#fffaf0'); for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; R(g,'#1a1a1a',32+Math.cos(a)*23-1,32+Math.sin(a)*23-1,3,3); } g.strokeStyle='#1a1a1a'; g.lineWidth=3; g.beginPath(); g.moveTo(32,32); g.lineTo(32,12); g.moveTo(32,32); g.lineTo(44,38); g.stroke(); },0,1),{unlit:true,cut:true,nofog:true},.0);
  for(const [U,o] of [[X_,[cx-1.6,PAVE_Y+22,tz+3.42]],[NX,[cx+1.6,PAVE_Y+22,tz-3.42]],[Z_,[cx-3.42,PAVE_Y+22,tz-1.6]],[NZ,[cx+3.42,PAVE_Y+22,tz+1.6]]]){ const g=new Geo(); const n=[U[1]*0-U[2],0,U[0]]; for(const [s_,t] of [[0,0],[1,0],[1,1],[0,1]]) g.v([o[0]+U[0]*3.2*s_,o[1]+3.2*t,o[2]+U[2]*3.2*s_],n,[s_,t]); g.I.push(0,1,2,0,2,3); g.noDist=true; mk(g,clock,FAR); }
  const cup=new Geo(); { const t=cyl(1.6,.15,3.2,8); cup.P=t.P; cup.Nm=t.Nm; cup.T=t.T; cup.I=t.I; cup.groups=t.groups; } cup.noDist=true; mk(cup,sB,FAR,cx,PAVE_Y+32.6,tz); hsol(cx-4,tz-4,cx+4,tz+4,PAVE_Y+20); hsol(cx-3.4,tz-3.4,cx+3.4,tz+3.4,PAVE_Y+27); hsol(cx-2.4,tz-2.4,cx+2.4,tz+2.4,PAVE_Y+31); CHURCH_TOWER.push([cx,tz,pz]);
  const r=hr(6803); for(let i=0;i<40;i++){ const gx=x0+4+r()*(x1-x0-8), gz=z0+4+r()*(z1-z0-8); if(Math.abs(gx-cx)<18&&gz>z0+14) continue; eBox(gx-.35,gz-.08,gx+.35,gz+.08,PAVE_Y,PAVE_Y+.7+r()*.5,stone); }
  for(let i=0;i<10;i++) tree(x0+6+r()*(x1-x0-12),z0+5+r()*12,1.2); parkLamp(x0+8,z1-12); parkLamp(x1-8,z1-12);
  tubeEntrance(x1-6,z1-6,'z'); STREET_LIGHT.pl.push([[cx,PAVE_Y+1,z1-12],[1.4,1.3,1.1],22]);
};

/* THE PETROL STATION: a lit canopy, pumps, a kiosk */
LM.petrol=([x0,z0,x1,z1])=>{ const fx0=x0+2,fx1=x1-2,fz0=z0+2,fz1=z1-2; eFlat(fx0,fz0,fx1,fz1,PAVE_Y+.005,mTarmac,2,6);
  const cX0=fx0+8,cX1=fx0+38,cZ0=fz0+6,cZ1=fz0+20, white=col(0xe8e8e4), under=nightM(null,{color:0xf4f8ff,unlit:true},.0), red=col(0xc81a1a);
  eBoxF(cX0,cZ0,cX1,cZ1,PAVE_Y+5,PAVE_Y+6,{n:red,s:red,e:red,w:red,t:white},{tu:2,tv:1}); eGrid(under,[cX0,PAVE_Y+4.99,cZ0],X_,Z_,cX1-cX0,cZ1-cZ0,4,4); hsol(cX0,cZ0,cX1,cZ1,PAVE_Y+6,PAVE_Y+5);
  for(const px of [cX0+3,cX1-3]) eBox(px-.25,(cZ0+cZ1)/2-.25,px+.25,(cZ0+cZ1)/2+.25,PAVE_Y,PAVE_Y+5,white);
  for(let i=0;i<4;i++){ const px=cX0+5+i*6.5, pz=(cZ0+cZ1)/2; eBox(px-.6,pz-2,px+.6,pz+2,PAVE_Y,PAVE_Y+.2,col(0x8a8a86)); eBox(px-.35,pz-.5,px+.35,pz+.5,PAVE_Y+.2,PAVE_Y+1.9,white); eBox(px-.36,pz-.3,px+.36,pz+.3,PAVE_Y+1.1,PAVE_Y+1.6,under); hsol(px-.6,pz-2,px+.6,pz+2,PAVE_Y+1.9); }
  STREET_LIGHT.pl.push([[(cX0+cX1)/2,PAVE_Y+4.5,(cZ0+cZ1)/2],[1.5,1.6,1.7],12]);
  const kx0=fx1-26,kx1=fx1-2,kz0=fz0,kz1=fz0+9; eBoxF(kx0,kz0,kx1,kz1,PAVE_Y,PAVE_Y+3.6,{n:mConcW,s:mConcW,e:mConcW,w:mConcW,t:mFelt},{tu:2.5,tv:3.6}); hsol(kx0,kz0,kx1,kz1,PAVE_Y+3.6); tradeRoom('offy'); eGrid(TRADES.offy.mRoom,[kx0+2,PAVE_Y+.3,kz1+.03],X_,Y_,kx1-kx0-4,2.6,kx1-kx0-4,2.6);
  eSign(atlasSign('#c81a1a','#ffffff','FUEL & SHOP','OPEN 24 HOURS',{face:'grot',subC:'#ffe0d0'}),[(kx0+kx1)/2,PAVE_Y+3.2,kz1+.1],X_,12,.8);
};


function buildLandmarks(){ for(const [name,...r] of LANDMARK_BLOCKS){ if(LM[name]) LM[name](r); else eFlat(r[0],r[1],r[2],r[3],PAVE_Y,mYard,2,6); } }
buildHub();
