/* ==========================================================================================================
   STREET DRESSING, hub-wide: markings, zebras, light pools, furniture, bus stops, trees. Everything here is emitted
   into the chunks before they're flushed. Night-only things (pools, glows) live in materials the clock hides by day.
   ========================================================================================================== */
const DAYHIDE=[]; const mBeaconH=M(null,{color:0xffa020,emissive:0xff8a10}); /* materials whose baked chunks are hidden in daylight */
/* ---------- light pools: a soft warm ellipse under every lamp, and a wet streak out across the road ---------- */
const D_tPool=P2(64,64,(g,w,h)=>{ g.clearRect(0,0,w,h); radial(g,32,32,32,[[0,'rgba(255,190,110,.75)'],[.5,'rgba(255,170,90,.35)'],[1,'rgba(255,150,70,0)']]); },0,1);
const tStreakR=P2(16,64,(g,w,h)=>{ g.clearRect(0,0,w,h); for(let y=0;y<h;y++){ const a=Math.pow(Math.sin(y/h*Math.PI),1.6)*.65; g.fillStyle=`rgba(255,${170+(y%5)*8},90,${a*(.6+.4*Math.random())})`; g.fillRect(3+(Math.random()*3|0),y,w-6-(Math.random()*3|0),1); } },0,1);
const mPool=(()=>{ const m=M(D_tPool,{unlit:true}); m.cut=2; DAYHIDE.push(m); return m; })(), mStreakR=(()=>{ const m=M(tStreakR,{unlit:true}); m.cut=2; DAYHIDE.push(m); return m; })();
DAYHIDE.push(mGlow);
for(const L_ of LAMPS){ const [x,y,z]=L_[0], fy=floorAt(x,z)+.02; eGrid(mPool,[x-3.6,fy,z+3.6],X_,NZ,7.2,7.2,7.2,7.2);
  /* the wet streak: from under the lamp out toward the middle of the road */ const onX=STREETS.find(S=>S[1]==='x'&&Math.abs(S[2]-z)<S[5]/2+1&&x>S[3]&&x<S[4]), onZ=STREETS.find(S=>S[1]==='z'&&Math.abs(S[2]-x)<S[5]/2+1&&z>S[3]&&z<S[4]);
  if(onX){ const dz=Math.sign(onX[2]-z); eGrid(mStreakR,[x-.5,.015,z],X_,[0,0,dz],1.0,onX[5]*.7,1,onX[5]*.7); }
  else if(onZ){ const dx=Math.sign(onZ[2]-x); eGrid(mStreakR,[x,.015,z+.5],NZ,[dx,0,0],1.0,onZ[5]*.7,1,onZ[5]*.7); } }

/* ---------- road markings ---------- */
const tDash=P2(64,8,(g,w,h)=>{ g.clearRect(0,0,w,h); R(g,'#d8d4c8',0,2,26,4); specks(g,'rgba(0,0,0,.4)',10,8601,26,8); },0,1);
const tDY=P2(16,16,(g,w,h)=>{ g.clearRect(0,0,w,h); R(g,'#d6aa22',0,2,w,3); R(g,'#d6aa22',0,9,w,3); },0,1);
const tGive=P2(32,8,(g,w,h)=>{ g.clearRect(0,0,w,h); R(g,'#d8d4c8',0,1,18,2); R(g,'#d8d4c8',0,5,18,2); },0,1);
const tZebra=P2(32,16,(g,w,h)=>{ g.clearRect(0,0,w,h); R(g,'#e4e0d6',0,0,16,h); },0,1);
const cutM=t=>{ const m=M(t,{}); m.cut=1; return m; }, mDash=cutM(tDash), mDY=cutM(tDY), mGive=cutM(tGive), mZebra=cutM(tZebra);
/* spans of a street not inside another road (the junctions), for lines that should stop at a junction */
function openSpans(S){ const [id,ax,c,a,b,rw]=S; let spans=[[a,b]];
  for(const R_ of ROADR){ if(R_[4]===id) continue; const cross=ax==='x'?(R_[1]<c+rw/2&&R_[3]>c-rw/2):(R_[0]<c+rw/2&&R_[2]>c-rw/2); if(!cross) continue;
    const lo=(ax==='x'?R_[0]:R_[1])-2.5, hi=(ax==='x'?R_[2]:R_[3])+2.5; spans=spans.flatMap(([p,q])=>hi<=p||lo>=q?[[p,q]]:[[p,lo],[hi,q]].filter(([u,v])=>v-u>3)); }
  for(const C_ of CORE_CUT){ const lo=ax==='x'?C_[0]:C_[1], hi=ax==='x'?C_[2]:C_[3], inC=ax==='x'?(c>C_[1]&&c<C_[3]):(c>C_[0]&&c<C_[2]); if(!inC) continue; spans=spans.flatMap(([p,q])=>hi<=p||lo>=q?[[p,q]]:[[p,lo],[hi,q]].filter(([u,v])=>v-u>3)); }
  for(const V of VIADUCTS){ const lo=ax==='x'?V[0]:V[1], hi=ax==='x'?V[2]:V[3], inV=ax==='x'?(c>V[1]-1&&c<V[3]+1):(c>V[0]-1&&c<V[2]+1); if(!inV) continue; } return spans; }
for(const S of STREETS){ const [id,ax,c,a,b,rw]=S, spans=openSpans(S);
  for(const [p,q] of spans){ const L_=q-p;
    if(ax==='x'){ eGrid(mDash,[p,.012,c+.06],X_,NZ,L_,.12,9,.12); for(const s of [-1,1]){ const zz=c+s*(rw/2-.32); eGrid(mDY,[p,.012,zz+.12],X_,NZ,L_,.24,1,.24); } }
    else { eGrid(mDash,[c-.06,.012,q],NZ,NX,L_,.12,9,.12); for(const s of [-1,1]){ const xx=c+s*(rw/2-.32); eGrid(mDY,[xx-.12,.012,q],NZ,NX,L_,.24,1,.24); } } }
  /* give-way lines where a minor street meets a bigger one */
  for(const end of [a,b]){ const other=STREETS.find(T=>T!==S&&T[1]!==ax&&Math.abs(T[2]-end)<.5&&c>T[3]&&c<T[4]); if(!other) continue; const ow=other[5]/2, mouth=end+(end===a?ow+.6:-(ow+.6));
    if(ax==='x') eGrid(mGive,[mouth-.15,.013,c+rw/2],[0,0,-1],[1,0,0],rw,.3,1.2,.3); else eGrid(mGive,[c-rw/2,.013,mouth-.15],X_,Z_,rw,.3,1.2,.3); } }
/* zebras on the high street, with Belisha beacons */
for(const zx of [-120,-262,120,252]){ const z0=2.6,z1=10.4; eGrid(mZebra,[zx-1.3,.014,z1],[0,0,-1],[1,0,0],z1-z0,2.6,1.0,2.6);
  for(const [bx,bz] of [[zx-1.6,z0-.35],[zx+1.6,z1+.35]]){ eGeo(cyl(.05,.05,2.4,6),MM(null,{color:0x1a1a1a}),bx,PAVE_Y+1.2,bz); eGeo(cyl(.17,.17,.32,10),mBeaconH,bx,PAVE_Y+2.56,bz); hsol(bx-.08,bz-.08,bx+.08,bz+.08,PAVE_Y+2.4); } }

/* ---------- furniture along every pavement ---------- */
const mShelter=col(0x5c6266), tAd=(seed,name,tag,c1,c2)=>P2(64,128,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,c1],[1,c2]]); g.fillStyle='#fff'; g.font=`bold 15px ${SANS}`; g.textAlign='center'; g.fillText(name,w/2,30); g.font=`600 7px ${SANS}`; g.fillText(tag,w/2,44); R(g,'rgba(255,255,255,.7)',18,60,28,50); },0,seed);
const ADS=[tAd(8701,'VOLT','STAY UP.','#0e2a6a','#06102e'),tAd(8702,'FRESHA','SPARKLING WATER','#2a8a6a','#0e3a2a'),tAd(8703,'LOAF','BREAD WORTH QUEUING FOR','#c86a20','#5a2a10'),tAd(8704,'NOVA','PHONES · NO CONTRACT','#4a2a8a','#1a0e3a')].map(t=>nightM(t,{unlit:true},.3));
function busStop(x,z,ax,side){ /* shelter on the pavement, back to the buildings */ const w=3.4,d=1.2, a=ax==='x'?0:Math.PI/2;
  const lx=(u,v)=>ax==='x'?[x+u,z+side*v]:[x+side*v,z+u];
  for(const u of [-w/2,w/2]){ const [px,pz]=lx(u,-d/2); eBox(px-.04,pz-.04,px+.04,pz+.04,PAVE_Y,PAVE_Y+2.3,mShelter); const [qx,qz]=lx(u,d/2); eBox(qx-.04,qz-.04,qx+.04,qz+.04,PAVE_Y,PAVE_Y+2.3,mShelter); }
  const [cx,cz]=lx(0,0); if(ax==='x') eBox(x-w/2-.1,cz-d/2-.1,x+w/2+.1,cz+d/2+.1,PAVE_Y+2.3,PAVE_Y+2.4,mShelter); else eBox(cx-d/2-.1,z-w/2-.1,cx+d/2+.1,z+w/2+.1,PAVE_Y+2.3,PAVE_Y+2.4,mShelter);
  const ad=ADS[Math.abs(Math.round(x+z))%ADS.length], [ex,ez]=lx(w/2,0); if(ax==='x') eBoxF(ex-.06,ez-d/2,ex+.06,ez+d/2,PAVE_Y+.3,PAVE_Y+2.1,{e:ad,w:ad},{tu:d,tv:1.8}); else eBoxF(ex-d/2,ez-.06,ex+d/2,ez+.06,PAVE_Y+.3,PAVE_Y+2.1,{n:ad,s:ad},{tu:d,tv:1.8});
  const [bx,bz]=lx(-w/2-.8,0); eBox(bx-.04,bz-.04,bx+.04,bz+.04,PAVE_Y,PAVE_Y+2.9,mPole); eSign(atlasSign('#c8231c','#ffffff','BUS STOP','8 · 388 · N8',{face:'grot'}),[bx,PAVE_Y+2.65,bz+(ax==='x'?side*.05:0)],ax==='x'?X_:Z_,.7,.4);
  if(ax==='x') hsol(x-w/2,cz-d/2,x+w/2,cz+d/2,PAVE_Y+2.4,PAVE_Y+2.25); else hsol(cx-d/2,z-w/2,cx+d/2,z+w/2,PAVE_Y+2.4,PAVE_Y+2.25);
  if(ax==='x') hsol(ex-.06,ez-d/2,ex+.06,ez+d/2,PAVE_Y+2.1); else hsol(ex-d/2,ez-.06,ex+d/2,ez+.06,PAVE_Y+2.1);
  BUS_STOPS.push([cx,cz]); }
const BUS_STOPS=[];
const mKiosk=col(0xb01810), mKioskGlass=nightM(null,{color:0xfff2d0,unlit:true},.7);
function kiosk(x,z){ const w=.95,h=2.5; eBoxF(x-w/2,z-w/2,x+w/2,z+w/2,PAVE_Y,PAVE_Y+h,{n:mKiosk,s:mKiosk,e:mKiosk,w:mKiosk,t:mKiosk},{tu:w,tv:h}); eBox(x-w/2-.03,z-w/2-.03,x+w/2+.03,z+w/2+.03,PAVE_Y+h,PAVE_Y+h+.25,mKiosk); eBox(x-.3,z-.3,x+.3,z+.3,PAVE_Y+h+.25,PAVE_Y+h+.45,mKiosk);
  for(const [u,o] of [[X_,[x-w/2+.12,PAVE_Y+.9,z+w/2+.005]],[NX,[x+w/2-.12,PAVE_Y+.9,z-w/2-.005]],[NZ,[x+w/2+.005,PAVE_Y+.9,z+w/2-.12]],[Z_,[x-w/2-.005,PAVE_Y+.9,z-w/2+.12]]]) eGrid(mKioskGlass,o,u,Y_,w-.24,1.3,1,1);
  hsol(x-w/2,z-w/2,x+w/2,z+w/2,PAVE_Y+h+.45); }
{ const r=hr(8801), near=(x,z,d)=>LAMPS.some(L_=>Math.hypot(L_[0][0]-x,L_[0][2]-z)<d)||BUS_STOPS.some(b=>Math.hypot(b[0]-x,b[1]-z)<5);
  const busRoads=new Set(['bgr','camheath','oldbg']);
  for(const S of STREETS){ const [id,ax,c,a,b,rw,pw]=S; let pn=pw,ps=pw; if(id==='bgr'){ pn=5.6; ps=3.0; } const spans=openSpans(S);
    for(const [side,pwid] of [[-1,pn],[1,ps]]){ const kerb=c+side*(rw/2+.55), back=c+side*(rw/2+pwid-.5);
      for(const [p,q] of spans){ let next=p+8+r()*10, nextBus=p+60+r()*80;
        for(let s=p+6;s<q-6;s+=1){ const X=ax==='x'?s:kerb, Z=ax==='x'?kerb:s; if(inCore(X,Z,6)) continue;
          if(busRoads.has(id)&&s>nextBus&&pwid>2.6){ busStop(ax==='x'?s:back-side*.6,ax==='x'?back-side*.6:s,ax,side); nextBus=s+180+r()*80; next=s+10; continue; }
          if(s<next) continue; next=s+16+r()*22; if(near(X,Z,2.5)) continue; const k=r();
          if(pwid>=2.4&&id!=='bgr'&&k<.42){ tree(X,Z,1.1+r()*.3); eBox(X-.6,Z-.6,X+.6,Z+.6,PAVE_Y,PAVE_Y+.03,col(0x2a221c)); }
          else if(k<.62) bin(X,Z); else if(k<.72) postbox(X,Z); else if(k<.8&&pwid>2.8){ bench(ax==='x'?X:back-side*.4,ax==='x'?back-side*.4:Z,ax==='x'?(side<0?Math.PI:0):(side<0?-Math.PI/2:Math.PI/2)); }
          else if(k<.83&&busRoads.has(id)) kiosk(ax==='x'?X:back-side*.8,ax==='x'?back-side*.8:Z);
          else bollard(X,Z); } } } } }

/* parked cars: one kerb of every one-way street, both kerbs of the wide roads */
{ const r=hr(8901), wide=new Set(['camheath']);
  STREETS.forEach((S,si)=>{ const [id,ax,c,a,b,rw]=S, L=LANES[si]; if(!(L.oneway||wide.has(id))) return; const sides=L.oneway?[1]:[-1,1];
    for(const side of sides) for(const [p,q] of openSpans(S)){ for(let s=p+4;s<q-4;s+=5.6){ if(r()>.62) continue; const off=c+side*(rw/2-1.0), x=ax==='x'?s:off, z=ax==='x'?off:s;
        if(inCore(x,z,4)||BUS_STOPS.some(b_=>Math.hypot(b_[0]-x,b_[1]-z)<6)) continue; carPark(x,z,(si*7+Math.round(s))%8,ax==='x'?Math.PI/2:0,0); } } }); }
/* the night-only chunks (pools, streaks, glows) go away in daylight */
let DAYNODES=null; function dayHideTick(){ if(!DAYNODES) DAYNODES=BAKED.kids.filter(n=>n.mesh&&DAYHIDE.includes(n.mesh.mats[0])); const v=TOD.night>.35; for(const n of DAYNODES) n.vis=v; mBeaconH.emis=(Math.floor(LIFE.t/.75)%2)?[1.25,.62,.12]:[.25,.12,.04]; }
buildNav();
