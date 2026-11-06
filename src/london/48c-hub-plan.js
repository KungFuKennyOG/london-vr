/* ==========================================================================================================
   THE HUB PLAN: Bethnal Green, compressed but true to its shape. Every street, block character and landmark is placed
   here by hand; the kit fills each block's houses. x runs east, z runs south (Bethnal Green Road is z 2.6..10.4).
   Brick Lane is the west edge, Cambridge Heath Road and the Tube the east, Hackney Road the north, Mile End Road the
   south. Two railway viaducts cut it into thirds: the Overground runs north-south past Terry's arch, the main line
   east-west above Cheshire Street. Weavers Fields is the park in the south-west, the Bramley towers the north-east.
   ========================================================================================================== */
/* streets: [name, runs along ('x' = east-west), centre, from, to, road width, pavement width, frontage, sign] */
const STREETS=[
  ['oldbg','x',-210,-370,370,7,2.6,'terrace','OLD BETHNAL GREEN ROAD'],
  ['columbia','x',-110,-330,-22,7,2.6,'market','COLUMBIA ROAD'],
  ['derby','x',-55,-330,-22,6.5,2.5,'terrace','DERBYSHIRE STREET'],
  ['teesdale','x',-95,41,330,6.5,2.5,'terrace','TEESDALE STREET'],
  ['kirkwall','x',-48,41,180,6,2.2,'terrace','KIRKWALL PLACE'],
  ['bgr','x',6.5,-370,370,7.8,0,'shops','BETHNAL GREEN ROAD'],     /* pavements set by hand below (5.6 north, 3.0 south) */
  ['hereford','x',72,-180,330,6.5,2.5,'terrace','HEREFORD STREET'],
  ['cheshire','x',120,-370,370,7,2.6,'vintage','CHESHIRE STREET'],
  ['colts','x',155,-370,370,6.5,2.5,'arches','THREE COLTS LANE'],
  ['buckhurst','x',215,-370,370,6.5,2.5,'terrace','BUCKHURST STREET'],
  ['vallance','z',-330,-250,240,8,2.6,'terrace','VALLANCE ROAD'],
  ['mape','z',-180,-210,120,6.5,2.5,'terrace','MAPE STREET'],
  ['gosset','z',-100,-55,120,6,2.2,'terrace','GOSSET STREET'],
  ['wilmot','z',-22,-210,120,7,2.5,'terrace','WILMOT STREET'],
  ['pollard','z',41,-210,120,6,2,'arches','POLLARD ROW'],
  ['florida','z',105,-210,120,6.5,2.5,'terrace','FLORIDA STREET'],
  ['barnet','z',180,-210,240,6.5,2.5,'terrace','BARNET GROVE'],
  ['camheath','z',330,-250,240,11,4,'shops','CAMBRIDGE HEATH ROAD'],
];
/* viaducts: [x0,z0,x1,z1, axis, deck height] */
const VIADUCTS=[[-370,131,370,143,'x',7.4],[29.05,-250,33.4,131,'z',7.4]];
/* block characters by area (first match wins): brick, storeys, window kind, interior */
const ZONES=[
  [-370,-250,-180,240,{brick:['stock','soot','red','brown'],st:[2,3],win:'sash'}],
  [-180,-250,-22,240,{brick:['stock','soot','red','stock','grey','brown'],st:[2,3],win:'sash'}],
  [-22,-250,180,240,{brick:['stock','red','stucco','brown','soot'],st:[2,3],win:'sash'}],
  [180,-250,370,240,{brick:['stock','cream','red','soot','brown','stucco'],st:[2,3],win:'sash'}],
];
/* hand-built blocks: the generator leaves these to 48d-hub-landmarks.js. [name, x0,z0,x1,z1] (the block rect inside its pavements) */
const LANDMARK_BLOCKS=[
  ['boundary',-323.4,-203.9,-185.75,-116.1], ['decks',-174.25,-203.9,-28,-116.1], ['bramley',185.75,-203.9,320.5,-100.75],
  ['weavers',-323.4,13.4,-185.75,113.9], ['school',46,13.4,99.25,66.25], ['supermarket',110.75,13.4,174.75,66.25],
  ['gardens',185.75,13.4,320.5,66.25], ['church',185.75,-89.25,320.5,-3], ['petrol',248,-247,320.5,-218],
];
const STREET_BY=new Map(STREETS.map(s=>[s[0],s]));
const RESERVED=[[246,-249,322,-216]]; /* the petrol station sits in a corner of a bigger block */
const reserved=(x0,z0,x1,z1)=>RESERVED.some(q=>x0<q[2]&&x1>q[0]&&z0<q[3]&&z1>q[1]);

/* ---------------- ground: road and pavement rects ---------------- */
const ROADR=[], PAVER=[];
function streetRects(S){ const [id,ax,c,a,b,rw,pw]=S; let pn=pw,ps=pw; if(id==='bgr'){ pn=5.6; ps=3.0; }
  /* ends run to the crossing street's centre; nothing at the map edge */
  if(ax==='x'){ ROADR.push([a,c-rw/2,b,c+rw/2,id]); PAVER.push([a,c-rw/2-pn,b,c-rw/2,id]); PAVER.push([a,c+rw/2,b,c+rw/2+ps,id]); }
  else { ROADR.push([c-rw/2,a,c+rw/2,b,id]); PAVER.push([c-rw/2-pn,a,c-rw/2,b,id]); PAVER.push([c+rw/2,a,c+rw/2+ps,b,id]); } }
STREETS.forEach(streetRects);
/* rect minus rect -> up to four rects */
function rsub(r,c){ if(c[0]>=r[2]||c[2]<=r[0]||c[1]>=r[3]||c[3]<=r[1]) return [r]; const out=[];
  if(c[1]>r[1]) out.push([r[0],r[1],r[2],c[1]]); if(c[3]<r[3]) out.push([r[0],c[3],r[2],r[3]]);
  const z0=Math.max(r[1],c[1]),z1=Math.min(r[3],c[3]); if(c[0]>r[0]) out.push([r[0],z0,c[0],z1]); if(c[2]<r[2]) out.push([c[2],z0,r[2],z1]); return out.filter(q=>q[2]-q[0]>.01&&q[3]-q[1]>.01); }
const rsubAll=(rs,cs)=>{ let out=rs; for(const c of cs){ const nx=[]; for(const r of out) nx.push(...rsub(r,c)); out=nx; } return out; };
const CORE_CUT=[[-16,-27,29.05,15],[29.05,-9.4,37,21]];
const VIA_CUT=VIADUCTS.map(v=>[v[0],v[1],v[2],v[3]]);
const ROADS=rsubAll(ROADR.map(r=>r.slice(0,4)),CORE_CUT);
const PAVES=rsubAll(rsubAll(PAVER.map(r=>r.slice(0,4)),ROADR.map(r=>r.slice(0,4))),CORE_CUT);
const ROADO=ROADS.map(r=>({r})), ROADH=(()=>{ const H=new Map(); for(const o of ROADO){ for(let i=Math.floor(o.r[0]/16);i<=Math.floor(o.r[2]/16);i++) for(let j=Math.floor(o.r[1]/16);j<=Math.floor(o.r[3]/16);j++){ const k=i*65536+j; (H.get(k)||H.set(k,[]).get(k)).push(o.r); } } return H; })();
function onRoad(x,z){ const a=ROADH.get(Math.floor(x/16)*65536+Math.floor(z/16)); if(a) for(const r of a) if(x>r[0]&&x<r[2]&&z>r[1]&&z<r[3]) return true;
  /* the core street's own road continues under the bridge */ return false; }

/* ---------------- blocks: what's left between the streets, found on a 1 m raster ---------------- */
function findBlocks(){ const W=HUB.x1-HUB.x0, H=HUB.z1-HUB.z0, g=new Uint8Array(W*H);
  const mark=(r,v)=>{ for(let z=Math.max(0,Math.floor(r[1]-HUB.z0));z<Math.min(H,Math.ceil(r[3]-HUB.z0));z++) for(let x=Math.max(0,Math.floor(r[0]-HUB.x0));x<Math.min(W,Math.ceil(r[2]-HUB.x0));x++) g[z*W+x]=v; };
  for(const r of ROADR) mark(r,1); for(const r of PAVER) mark(r,1); for(const r of CORE_CUT) mark(r,2); for(const v of VIADUCTS) mark([v[0],v[1]-3,v[2],v[3]+3],3);
  mark([HUB.x0,HUB.z0,HUB.x1,HUB.z0+1],1); mark([HUB.x0,HUB.z1-1,HUB.x1,HUB.z1],1); mark([HUB.x0,HUB.z0,HUB.x0+1,HUB.z1],1); mark([HUB.x1-1,HUB.z0,HUB.x1,HUB.z1],1);
  const blocks=[], st=new Int32Array(W*H), cells=[];
  for(let i=0;i<W*H;i++){ if(g[i]) continue; let sp=0; st[sp++]=i; g[i]=9; let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9,n=0; cells.length=0;
    while(sp){ const k=st[--sp], x=k%W, z=(k/W)|0; n++; cells.push(k); if(x<x0)x0=x; if(x>x1)x1=x; if(z<z0)z0=z; if(z>z1)z1=z;
      if(x>0&&!g[k-1]){ g[k-1]=9; st[sp++]=k-1; } if(x<W-1&&!g[k+1]){ g[k+1]=9; st[sp++]=k+1; } if(z>0&&!g[k-W]){ g[k-W]=9; st[sp++]=k-W; } if(z<H-1&&!g[k+W]){ g[k+W]=9; st[sp++]=k+W; } }
    if(n<60) continue; const rect=n>=(x1-x0+1)*(z1-z0+1)*.97;
    if(rect){ blocks.push({r:[x0+HUB.x0,z0+HUB.z0,x1+1+HUB.x0,z1+1+HUB.z0],n,rect}); continue; }
    /* an odd shape: rows of runs, stacked into rects while the run stays the same */
    const rows=new Map(); cells.sort((a,b)=>a-b); for(const k of cells){ const x=k%W, z=(k/W)|0; let rr=rows.get(z); if(!rr){ rr=[]; rows.set(z,rr); } const last=rr[rr.length-1]; if(last&&last[1]===x) last[1]=x+1; else rr.push([x,x+1]); }
    const open=new Map(), flush=o=>blocks.push({r:[o.x0+HUB.x0,o.z0+HUB.z0,o.x1+HUB.x0,o.z1+HUB.z0],n:(o.x1-o.x0)*(o.z1-o.z0),rect:true,part:true});
    const zs=[...rows.keys()].sort((a,b)=>a-b); let prevZ=null;
    for(const z of zs){ const runs=rows.get(z), seen=new Set();
      if(prevZ!==z-1){ for(const o of open.values()) flush(o); open.clear(); }
      for(const [a,b] of runs){ const key=a+'|'+b; seen.add(key); const o=open.get(key); if(o) o.z1=z+1; else open.set(key,{x0:a,x1:b,z0:z,z1:z+1}); }
      for(const [k,o] of [...open]) if(!seen.has(k)){ flush(o); open.delete(k); } prevZ=z; }
    for(const o of open.values()) flush(o); }
  return blocks; }

/* which street (if any) a block edge faces: probe 1.5 m out from the edge midpoint */
function streetAt(x,z){ for(const r of PAVER) if(x>=r[0]-.01&&x<=r[2]+.01&&z>=r[1]-.01&&z<=r[3]+.01) return STREET_BY.get(r[4]); return null; }

/* ---------------- one block: a ring of frontage lots, gardens and a yard inside ---------------- */
const PUBS=['THE MARQUIS','THE KING\'S HEAD','THE CARPENTERS ARMS','THE BLIND PIG','THE OLD GLOBE','THE ROYAL OAK','THE HARE','THE DUKE OF WELLINGTON','THE CAMEL','THE JOLLY BUTCHERS','THE NAG\'S HEAD','THE BELL'];
let PUBN=0;
const DOORC=['#141414','#1c2a4a','#7a1a1a','#1e3a26','#c8a020','#3a2a4a','#f2efe6','#2a5a6a'];
const HOUSEF=new Map();
function houseFront(brick,seed){ const k=brick+'|'+(seed%DOORC.length); if(HOUSEF.has(k)) return HOUSEF.get(k); const B=BRICKS[brick], r=hr(seed), w=5*PXM, h=Math.round(3.2*PXM);
  const t=P2(w,h,(g)=>{ paintWall(g,B,w,h,r); const dc=DOORC[seed%DOORC.length];
    /* door with fanlight and steps */ R(g,'#d8d2c2',10,h-62,30,62); R(g,dc,13,h-54,24,52); R(g,'#ffd890',13,h-62,24,7); R(g,'#c8a040',30,h-30,3,3); R(g,'#8a8478',8,h-4,34,4);
    /* bay window */ R(g,'#d8d2c2',54,h-64,58,48); vfill(g,57,h-61,52,40,[[0,'#1c2430'],[1,'#0c1016']]); R(g,'#e6e2d8',57+17,h-61,2,40); R(g,'#e6e2d8',57+34,h-61,2,40); R(g,'#b8b2a0',52,h-16,62,4);
    R(g,mix(B.base,'#000',.2),52,h-12,62,12); vfill(g,0,h-18,w,18,[[0,'rgba(20,16,12,0)'],[1,'rgba(20,16,12,.45)']]); },0,seed);
  const m={mBase:MM(t)}; HOUSEF.set(k,m); return m; }
const pick=(r,a)=>a[r()*a.length|0]; const mPot=col(0x8a5a3a), mBush=col(0x2a4a22), mPipe=col(0x1e2022), mDish=col(0xc8c8c4), BINC=[col(0x1a1a1c),col(0x2a4a2a),col(0x2a3a6a),col(0x5a3a2a)];

function buildBlock(B,bi){ const [x0,z0,x1,z1]=B.r, r=hr(5000+bi*7919), cx=(x0+x1)/2, cz=(z0+z1)/2;
  const Z=(ZONES.find(q=>cx>=q[0]&&cx<q[2]&&cz>=q[1]&&cz<q[3])||ZONES[0])[4];
  /* edges: n (z=z0 faces north), s, w, e; each gets the street it faces */
  const E={n:streetAt(cx,z0-1.2),s:streetAt(cx,z1+1.2),w:streetAt(x0-1.2,cz),e:streetAt(x1+1.2,cz)};
  const depth=k=>{ const S=E[k]; if(!S) return 0; const f=S[7]; return f==='shops'||f==='curry'||f==='market'||f==='vintage'?12:f==='arches'?10:9.5; };
  const W=x1-x0, H=z1-z0, D={n:depth('n'),s:depth('s'),w:depth('w'),e:depth('e')};
  if(W<8||H<8){ eFlat(x0,z0,x1,z1,PAVE_Y,mYard,2,4); return; } /* an apron by the railway */
  if(W<14||H<14){ /* a sliver: one plain building */ const ht=6+r()*3; eFacade(x0,z0,x1,z1,0,ht,facade(pick(r,Z.brick),'sash',0),'nsew'); eFlat(x0,z0,x1,z1,ht,mFelt,4,6); hsol(x0,z0,x1,z1,ht); return; }
  /* lots along each edge, corners belong to the n/s edges */
  const lots=[], gaps=[];
  for(const k of ['n','s','w','e']){ if(!D[k]) continue; const S=E[k], f=S[7], horiz=k==='n'||k==='s';
    let a=horiz?x0:z0, b=horiz?x1:z1; if(!horiz){ if(D.n) a=z0+D.n; if(D.s) b=z1-D.s; }
    let run=0, brick=pick(r,Z.brick), st=Z.st[0]+(r()<.4?1:0), fv=r()*3|0, door=r()*100|0;
    /* a hand-written frontage for this side of this block? */
    const side=S[1]==='x'?(k==='n'?'s':'n'):(k==='w'?'e':'w'), key=S[0]+':'+side+':'+Math.round(horiz?(x0+x1)/2:(z0+z1)/2);
    FRONTAGES.push({key,street:S[8],side,from:+a.toFixed(1),to:+b.toFixed(1),len:+(b-a).toFixed(1),depth:D[k],frontage:f,hand:!!HAND[key]});
    if(HAND[key]){ handSide(HAND[key].flat(),k,a,b,S,f,lots,gaps,brick,door,Z.brick); continue; }
    for(let p=a;p<b-2;){ const shop=f==='shops'||f==='curry'||f==='market'||f==='vintage'; let w=shop?5+r()*3:4.6+r()*.9; if(b-p-w<4) w=b-p;
      if(--run<=0){ run=shop?2+(r()*3|0):5+(r()*9|0); brick=pick(r,Z.brick); st=(shop?Math.max(3,Z.st[1]+1):Z.st[0]+(r()<.45?1:0)); fv=r()*3|0; }
      lots.push({k,a:p,b:p+w,f,S,brick,st,fv,door:door++,corner:p===a||p+w>=b-.01}); p+=w; } }
  /* a pub on one good corner */
  if(!lots.some(L=>L.hand)) for(const L of lots){ if(L.corner&&(L.f==='shops'||L.f==='terrace')&&r()<.16&&PUBN<40){ L.pub=PUBS[PUBN++%PUBS.length]; break; } }
  /* every hand-written block has a way up from the street: a scaffold, an infill's balconies, or a fire escape reached by an alley */
  if(lots.some(L=>L.hand)){ const up=lots.some(L=>L.scaf)||lots.some(L=>L.t==='infill'&&L.b-L.a>=10)||(lots.some(L=>L.fe&&!(L.corner&&(L.k==='n'||L.k==='s')))&&gaps.some(G=>G.g==='alley'));
    if(!up){ const c=lots.filter(L=>L.hand&&!L.corner&&L.t==='house'); const L=c[c.length>>1]||lots.find(L=>L.hand&&!L.corner)||lots[0]; if(L) L.scaf=true; } }
  for(const L of lots) buildLot(L,B.r,D,r,Z);
  for(const G of gaps) buildGap(G,B.r,D);
  /* the yard inside: ground, a garden wall ring, sheds and garages, trees; an alley gate from the longest street side */
  const ix0=x0+(D.w||0)+7, iz0=z0+(D.n||0)+7, ix1=x1-(D.e||0)-7, iz1=z1-(D.s||0)-7;
  eFlat(x0,z0,x1,z1,PAVE_Y-.001,mYard,2,8);
  if(ix1-ix0>6&&iz1-iz0>6){ for(let n=(ix1-ix0)*(iz1-iz0)/420|0;n>0;n--){ const gx=ix0+2+r()*(ix1-ix0-6), gz=iz0+2+r()*(iz1-iz0-6), gw=3+r()*3, gd=5+r()*2, gh=2.4+r()*.3; if(reserved(gx-2,gz-2,gx+gw+2,gz+gd+2)) continue;
      if(r()<.62){ eBoxF(gx,gz,gx+gw,gz+gd,PAVE_Y,PAVE_Y+gh,{n:mBrickW,e:mBrickW,w:mBrickW,t:mFelt},{tu:gw,tv:gh}); eShut([gx,PAVE_Y,gz+gd],X_,gw,gh,r()*6|0); hsol(gx,gz,gx+gw,gz+gd,PAVE_Y+gh); }
      else { tree(gx+1.5,gz+1.5,.8+r()*.5); } } }
}
/* a hand-written side: items laid end to end, widths scaled to fit; each lot learns its neighbours' heights (party walls, roof steps, planks) */
function lotGH(L){ return L.t==='works'?((L.it&&L.it.gh)||4.0):(L.t==='shop'||L.t==='pub')?3.6:3.2; }
function lotTop(L){ return L.t==='infill'?PAVE_Y+L.st*2.85:PAVE_Y+lotGH(L)+(L.st-1)*HUB.FLOOR; }
function handSide(list,k,a,b,S,f,lots,gaps,brick,door,ZB){ const tot=list.reduce((q,it)=>q+it.w,0), sc=(b-a)/tot; let p=a; const made=[];
  list.forEach((it,ii)=>{ const w=it.w*sc;
    if(it.t==='gap'){ const G={gap:true,k,a:p,b:p+w,S,g:it.g||'alley',it}; gaps.push(G); made.push(G); }
    else { const t=it.t, L={k,a:p,b:p+w,S,t,it,hand:true,f:t==='shop'?'shops':t==='pub'?f:t==='house'?'terrace':t,brick:it.brick||(t==='house'?brick:ZB[((door>>2)+(ii>>1)*3)%ZB.length]),st:it.st||(t==='shop'||t==='pub'?3:t==='infill'?4:2),fv:it.fv??0,door:it.door??(door+ii),
        corner:ii===0||ii===list.length-1,pub:t==='pub'?(it.name||'THE ROYAL OAK'):undefined,trade:it.trade,name:it.name,doorC:it.doorC,shut:it.shut,scaf:!!it.scaf,fe:!!it.fe,win:it.win||(t==='works'?'factory':undefined)};
      L.top=lotTop(L); lots.push(L); made.push(L); }
    p+=w; });
  /* a neighbour across a narrow alley still counts for the roof steps: you jump the alley from the tank */
  const tp=q=>q&&!q.gap?q.top:0, near=(i,d)=>{ const q=made[i+d]; if(q&&q.gap&&q.b-q.a<=2.6) return tp(made[i+2*d]); return tp(q); };
  /* and the direct neighbours, for the side walls: a gap, the end of the run or a set-back council block leaves the wall exposed */
  const dt=q=>q&&!q.gap&&q.t!=='infill'?q.top:0;
  made.forEach((L,i)=>{ if(L.gap){ L.tA=tp(made[i-1]); L.tB=tp(made[i+1]); } else { L.nA=near(i,-1); L.nB=near(i,1); L.dA=dt(made[i-1]); L.dB=dt(made[i+1]); } }); }

/* one lot: ground floor by trade, upper floors, roof, chimneys, a rear extension, and a garden wall */
function lotRect(k,a,b,BR,d){ const [x0,z0,x1,z1]=BR; if(k==='n') return [a,z0,b,z0+d]; if(k==='s') return [a,z1-d,b,z1]; if(k==='w') return [x0,a,x0+d,b]; return [x1-d,a,x1,b]; }
/* the front of a rect: centre, along-vector U (left to right as you face it), outward normal, width, and P0 its left end */
function lotFront(k,lx0,lz0,lx1,lz1){ const U=k==='n'?NX:k==='s'?X_:k==='w'?Z_:NZ, out=k==='n'?[0,0,-1]:k==='s'?[0,0,1]:k==='w'?[-1,0,0]:[1,0,0];
  const fx=k==='w'?lx0:k==='e'?lx1:(lx0+lx1)/2, fz=k==='n'?lz0:k==='s'?lz1:(lz0+lz1)/2, fw=(k==='n'||k==='s')?lx1-lx0:lz1-lz0; return {U,out,fx,fz,fw,P0:[fx-U[0]*fw/2,0,fz-U[2]*fw/2]}; }
function buildLot(L,BR,D,r,Z){ const [x0,z0,x1,z1]=BR, k=L.k, d=D[k], horiz=k==='n'||k==='s';
  let [lx0,lz0,lx1,lz1]=lotRect(k,L.a,L.b,BR,d);
  if(reserved(lx0-8,lz0-8,lx1+8,lz1+8)) return;
  if(L.t==='infill') return buildInfill(L,lx0,lz0,lx1,lz1,BR,d,r);
  const shop=L.f==='shops'||L.f==='curry'||L.f==='market'||L.f==='vintage', st=L.hand?L.st:L.pub?3:L.st, gH=L.hand?lotGH(L):shop||L.pub?3.6:3.2, top=PAVE_Y+gH+(st-1)*HUB.FLOOR, F=facade(L.brick,L.win||Z.win,L.fv);
  const front=k, {U,out,fx,fz,fw,P0}=lotFront(k,lx0,lz0,lx1,lz1);
  /* upper floors (front face has windows, sides and back are plain brick of the same kind) */
  const cornerK=L.corner?(horiz?(lx0<=x0+.01?'w':lx1>=x1-.01?'e':''):(lz0<=z0+.01?'n':lz1>=z1-.01?'s':'')):'', sideK=horiz?'ew':'ns';
  if(L.hand){ eFacadeA(lx0,lz0,lx1,lz1,PAVE_Y+gH,top,F,front+cornerK,{seed:L.door*7919+Math.round(L.a*13),skip:[...sideK].filter(q=>q!==cornerK).join('')}); lodRec(lx0,lz0,lx1,lz1,PAVE_Y+gH,top,F,front+cornerK);
    /* the sides: a windowed corner, gable ends wherever a party wall stands clear */
    lotSides(L,lx0,lz0,lx1,lz1,gH,top,F,cornerK,sideK,r); }
  else eFacade(lx0,lz0,lx1,lz1,PAVE_Y+gH,top,F,front+cornerK,{ou:(r()*4|0)/4,ov:(r()*3|0)/3,skip:L.corner?'':sideK});
  /* ground floor */
  L.F=F; if(L.pub) (L.hand?groundPubH:groundPub)(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw,r,P0);
  else if(L.t==='works') groundWorks(L,lx0,lz0,lx1,lz1,gH,U,out,fw,P0,F);
  else if(shop){ L.F=F; (L.hand?groundShopH:groundShop)(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw,r,P0); }
  else if(L.hand) houseFrontH(L,lx0,lz0,lx1,lz1,gH,U,out,fw,P0,F,top,r);
  else { const hf=houseFront(L.brick,L.doorC!==undefined?DOORC.indexOf(L.doorC)>=0?DOORC.indexOf(L.doorC):L.door:L.door), hm=hf.mBase, back={n:'s',s:'n',w:'e',e:'w'}[front];
    { const st=L.S[8]||'', no=(HOUSE_NO[st]=(HOUSE_NO[st]||0)+1), sx=fx-U[0]*fw/2+U[0]*1.05, sz=fz-U[2]*fw/2+U[2]*1.05; HOUSE_DOORS.push({x:sx+out[0]*.7,z:sz+out[2]*.7,yaw:Math.atan2(-out[0],-out[2]),street:st,no:no*2-(L.k==='n'||L.k==='w'?1:0)});
      const at=(u,o)=>[fx-U[0]*fw/2+U[0]*u+out[0]*o, fz-U[2]*fw/2+U[2]*u+out[2]*o];
      { const [a0,b0]=at(.45,0), [a1,b1]=at(1.65,.38); const sf={t:mCope}; sf[front]=mCope; eBoxF(Math.min(a0,a1),Math.min(b0,b1),Math.max(a0,a1),Math.max(b0,b1),PAVE_Y,PAVE_Y+.16,sf); }
      if(L.door%2){ const [px,pz]=at(.06,.06), pf={}; pf[front]=mPipe; eBoxF(px-.05,pz-.05,px+.05,pz+.05,PAVE_Y,top,pf); }
      if(r()<.45){ const [bx,bz]=at(fw-.5,.42), bm=BINC[(L.door*3)%BINC.length]; eBoxF(bx-.3,bz-.3,bx+.3,bz+.3,PAVE_Y,PAVE_Y+1.07,{n:bm,s:bm,e:bm,w:bm,t:bm}); hsol(bx-.3,bz-.3,bx+.3,bz+.3,PAVE_Y+1.07); }
      if(r()<.18){ const [dx,dz]=at(fw*.7,.12); eGeo(cyl(.32,.32,.05,8),mDish,dx,PAVE_Y+gH+1.6,dz,Math.atan2(out[0],out[2]),Math.PI/2); }
      if(r()<.2){ const [qx,qz]=at(1.85,.25); eBoxF(qx-.16,qz-.16,qx+.16,qz+.16,PAVE_Y,PAVE_Y+.32,{n:mPot,s:mPot,e:mPot,w:mPot}); eBoxF(qx-.22,qz-.22,qx+.22,qz+.22,PAVE_Y+.32,PAVE_Y+.7,{n:mBush,s:mBush,e:mBush,w:mBush,t:mBush}); } }
    eBoxF(lx0,lz0,lx1,lz1,PAVE_Y,PAVE_Y+gH,{[front]:hm},{tu:fw,tv:gH,vb:PAVE_Y,cell:3});
    const rest={}; rest[back]=F.mBase; if(L.corner){ for(const q of sideK) rest[q]=F.mBase; } eBoxF(lx0,lz0,lx1,lz1,PAVE_Y,PAVE_Y+gH,rest,{tu:F.bays*HUB.BAY,tv:F.floors*HUB.FLOOR}); }
  /* parapet and coping, flat roof, chimney stack on the party wall */
  if(L.hand){ lotBox(P0,U,out,-.02,fw+.02,-.32,.12,top,top+.36,'#8a8680','fbst'); lotBox(P0,U,out,0,fw,-d,-d+.25,top,top+.3,'#7a766e','fbt'); lotBox(P0,U,out,0,fw,-d,0,top,top+.2,'#8a8680','s'); lotBox(P0,U,out,-.06,.06,-d,-.32,top+.17,top+.32,'#6a5a48','st'); eFlat(lx0,lz0,lx1,lz1,top+.17,mFelt,4,0); }
  else { const cf={t:mCope}; cf[front]=mCope; eBoxF(lx0-(k==='e'?.15:0),lz0-(k==='s'?.15:0),lx1+(k==='w'?.15:0),lz1+(k==='n'?.15:0),top,top+.18,cf); eFlat(lx0,lz0,lx1,lz1,top+.01,mFelt,4,0); }
  if(!shop&&L.door%2===0){ const cxs=horiz?lx0+.4:(lx0+lx1)/2, czs=horiz?(lz0+lz1)/2:lz0+.4, cw=horiz?.8:1.6, cd=horiz?1.6:.8; eBoxF(cxs-cw/2,czs-cd/2,cxs+cw/2,czs+cd/2,top,top+1.3,{n:mBrickW,s:mBrickW,e:mBrickW,w:mBrickW,t:mCope},{tu:1.6,tv:1.5}); if(L.hand) hsol(cxs-cw/2,czs-cd/2,cxs+cw/2,czs+cd/2,top+1.3);
    for(let i=0;i<(L.door%3===0?2:0);i++){ const px=cxs+(horiz?0:(i-.5)*.6), pz=czs+(horiz?(i-.5)*.6:0); eBoxF(px-.09,pz-.09,px+.09,pz+.09,top+1.3,top+1.7,{n:mPot,s:mPot,e:mPot,w:mPot}); } }
  hsol(lx0,lz0,lx1,lz1,top+.18);
  if(L.hand){ /* roof furniture, a tank to climb on where the neighbour is a storey taller, scaffolds and fire escapes */
    const u0a=k==='s'||k==='w', nU0=u0a?L.nA:L.nB, nU1=u0a?L.nB:L.nA; const stepAt=nU0-top>2.3?-1:nU1-top>2.3?1:0;
    roofKit(P0,U,out,fw,d,top+.18,L.pub?'pub':L.t==='works'?'works':shop?'shop':'house',r,stepAt);
    if(L.scaf) scaffold(P0,U,out,fw,top+.18,L.door);
    if(L.fe&&!cornerK){ const Pb=[P0[0]-out[0]*d+U[0]*fw,0,P0[2]-out[2]*d+U[2]*fw], fl=[gH]; for(let i=1;i<st;i++) fl.push(HUB.FLOOR); fireEscape(Pb,[-U[0],0,-U[2]],[-out[0],0,-out[2]],fw,fl); } }
  /* rear extension: one storey, half the width, roof you can climb onto from the garden */
  const ew=(horiz?lx1-lx0:lz1-lz0)*.5, ed=3.2, eh=2.55; let ex0,ez0,ex1,ez1;
  if(k==='n'){ ex0=lx0; ex1=lx0+ew; ez0=lz1; ez1=lz1+ed; } else if(k==='s'){ ex0=lx1-ew; ex1=lx1; ez0=lz0-ed; ez1=lz0; } else if(k==='w'){ ez0=lz0; ez1=lz0+ew; ex0=lx1; ex1=lx1+ed; } else { ez0=lz1-ew; ez1=lz1; ex0=lx0-ed; ex1=lx0; }
  if(!L.corner){ if(!L.fe){ EXT_TOPS.push([(ex0+ex1)/2,PAVE_Y+eh,(ez0+ez1)/2]); eBoxF(ex0,ez0,ex1,ez1,PAVE_Y,PAVE_Y+eh,{n:mBrickW,s:mBrickW,e:mBrickW,w:mBrickW,t:mFelt},{tu:1.6,tv:1.5}); hsol(ex0,ez0,ex1,ez1,PAVE_Y+eh); }
    /* garden wall between this lot and the next, 7 m back */ const gw=1.8;
    if(k==='n') { eBoxF(lx1-.12,lz1,lx1+.12,lz1+7,PAVE_Y,PAVE_Y+gw,{e:mBrickW,w:mBrickW,t:mCope},{tu:1.6,tv:1.5}); hsol(lx1-.12,lz1,lx1+.12,lz1+7,PAVE_Y+gw); }
    if(k==='s') { eBoxF(lx1-.12,lz0-7,lx1+.12,lz0,PAVE_Y,PAVE_Y+gw,{e:mBrickW,w:mBrickW,t:mCope},{tu:1.6,tv:1.5}); hsol(lx1-.12,lz0-7,lx1+.12,lz0,PAVE_Y+gw); }
    if(k==='w') { eBoxF(lx1,lz1-.12,lx1+7,lz1+.12,PAVE_Y,PAVE_Y+gw,{n:mBrickW,s:mBrickW,t:mCope},{tu:1.6,tv:1.5}); hsol(lx1,lz1-.12,lx1+7,lz1+.12,PAVE_Y+gw); }
    if(k==='e') { eBoxF(lx0-7,lz1-.12,lx0,lz1+.12,PAVE_Y,PAVE_Y+gw,{n:mBrickW,s:mBrickW,t:mCope},{tu:1.6,tv:1.5}); hsol(lx0-7,lz1-.12,lx0,lz1+.12,PAVE_Y+gw); } }
}

/* the side walls of a hand-written lot. A corner lot's street side gets windows on every floor (the ground floor too, so nothing inside
   shows). A party wall is plain brick where its neighbour hides it; wherever it stands clear (over a lower neighbour, beside an alley, a gap
   or a set-back council block, at the end of a run) it is a gable end in the lot's own brick: a few small sash windows, a chimney breast
   carried up into a stack, a downpipe, and on the big ones now and then the ghost of a painted advert */
const GHOSTS=[['PEARCE\'S PICKLES','PICCALILLI · CHUTNEYS · EST. 1888'],['STEPNEY STOUT','BREWED IN THE EAST END'],['MARSHALL\'S MUSTARD','HOT ENGLISH · SINCE 1851'],['BOW BELLS BOOT POLISH','A SHINE FIT FOR A KING'],
  ['EASTERN TEA COMPANY','FINE TEAS · ALDGATE'],['GLOBE SOAP WORKS','FOR THE WEEKLY WASH'],['H. LEVY · FURNITURE','REMOVALS · STORAGE · CASH OR CREDIT'],['VICTORIA COCOA','GRATEFUL · COMFORTING']];
let GHOST_N=0;
function sideFrame(q,lx0,lz0,lx1,lz1){ if(q==='e') return {P0:[lx1,0,lz1],U:NZ,out:[1,0,0],w:lz1-lz0}; if(q==='w') return {P0:[lx0,0,lz0],U:Z_,out:[-1,0,0],w:lz1-lz0};
  if(q==='n') return {P0:[lx1,0,lz0],U:NX,out:[0,0,-1],w:lx1-lx0}; return {P0:[lx0,0,lz1],U:X_,out:[0,0,1],w:lx1-lx0}; }
function lotSides(L,lx0,lz0,lx1,lz1,gH,top,F,cornerK,sideK,r){ const B=BRICKS[L.brick]||BRICKS.stock, G=facade(L.brick,'gable',0), others=q=>'nsew'.replace(q,'');
  if(cornerK) eFacadeA(lx0,lz0,lx1,lz1,PAVE_Y,PAVE_Y+gH,F,'',{seed:L.door*17+3,skip:others(cornerK)});
  for(const q of sideK){ if(q===cornerK) continue; const nT=(q==='w'||q==='n')?L.dA:L.dB, from=nT>=top-.3?top:Math.max(PAVE_Y,nT);
    if(from>PAVE_Y+.01){ const one={}; one[q]=mBrickW; eBoxF(lx0,lz0,lx1,lz1,PAVE_Y,from,one,{tu:1.6,tv:1.5}); }
    if(top-from<.4) continue;
    eFacadeA(lx0,lz0,lx1,lz1,from,top,G,'',{seed:L.door*29+(q.charCodeAt(0)),skip:others(q)});
    const S=sideFrame(q,lx0,lz0,lx1,lz1), bc=mix(B.base,'#000000',.08);
    const ghost=top-from>5&&S.w>8.5&&(L.door+GHOST_N)%3===0;
    if(top-from>2.4&&S.w>6){ const u=ghost?S.w-.85:S.w*(L.door%2?.62:.38); lotBox(S.P0,S.U,S.out,u-.6,u+.6,0,.32,from,top+1.45,bc,'fst'); lotBox(S.P0,S.U,S.out,u-.7,u+.7,-.1,.42,top+1.45,top+1.6,'#8a8680','fbst');
      for(const du of [-.3,.3]) lotBox(S.P0,S.U,S.out,u+du-.1,u+du+.1,.06,.26,top+1.6,top+2.0,'#a85a3a','fbs'); }
    lotBox(S.P0,S.U,S.out,S.w-.35,S.w-.27,.02,.1,Math.max(PAVE_Y,from-3),top,'#1e2022','fs');
    if(ghost){ const g=GHOSTS[GHOST_N++%GHOSTS.length], fade=mix(B.base,'#e8e0cc',.35), ink=mix(B.base,'#1a1612',.45), sw=Math.min(S.w-3,7), uc=(S.w-1.5)/2;
      eSign(atlasSign(fade,ink,g[0],g[1],{face:'anton',subC:ink}),[S.P0[0]+S.U[0]*uc+S.out[0]*.03,top-1.6,S.P0[2]+S.U[2]*uc+S.out[2]*.03],S.U,sw,Math.min(1.3,sw/5.5)); } } }

/* ---------------- hand-written ground floors ---------------- */
const BACKK={n:'s',s:'n',w:'e',e:'w'};
/* the back wall of a hand-written ground floor, windows and all, on the facade atlas */
function backGF(L,lx0,lz0,lx1,lz1,gH,F){ eFacadeA(lx0,lz0,lx1,lz1,PAVE_Y,PAVE_Y+gH,F,'',{seed:L.door*53+1,skip:'nsew'.replace(BACKK[L.k],'')}); }
/* the stand-in city (48k) gets one whole box per hand-written lot, all four sides, rather than the pieces the detail is built from */
function lodRec(x0,z0,x1,z1,y0,y1,F,faces){ if(typeof LOD_REC!=='undefined') LOD_REC.fac.push([x0,z0,x1,z1,y0,y1,F,faces,'']); }
/* a terrace house front: atlas-painted wall, the door in a real recess with reveals, a projecting bay where there is one, sills, a string course; the lit twin at night */
function houseFrontH(L,lx0,lz0,lx1,lz1,gH,U,out,fw,P0,F,top,r){ const it=L.it, k=L.k, hv=it.hv||'flat', mir=it.mir??(L.door%2===1), dc=L.doorC||DOORC[L.door%DOORC.length], B=BRICKS[L.brick]||BRICKS.stock;
  const cell=houseCell(L.brick,hv,it.stuc,L.door%3), lay=HLAY[hv]||HLAY.flat, sx=fw/5, sy=gH/3.25, [d0,d1,dt,ft]=lay.d, nOut=[-out[0],0,-out[2]];
  const Pu=(u,o=0,y=PAVE_Y)=>[P0[0]+U[0]*u+out[0]*o,y,P0[2]+U[2]*u+out[2]*o], wx=x=>(mir?5-x:x)*sx;
  /* a piece of the cell [x0,x1] x [y0,y1] (cell metres) onto the front at depth o; mirrored houses flip it */
  const Q=(x0,x1,y0,y1,o=0,m=KA.m,rc=cell,fa=0,fb=1)=>{ const u0=mir?wx(x1):wx(x0), w=(x1-x0)*sx, f=x=>fa+(fb-fa)*x/5; eKA(Pu(u0,o,PAVE_Y+y0*sy),U,Y_,w,(y1-y0)*sy,rc,mir?f(x1):f(x0),mir?f(x0):f(x1),y0/3.25,y1/3.25,m); };
  const stone=it.stuc?mix(it.stuc,'#ffffff',.25):B.paint?mix(B.base,'#ffffff',.3):'#c8c2b2';
  /* the wall either side of the door, and over it */ Q(0,d0,0,3.25); Q(d1,5,0,3.25); Q(d0,d1,ft,3.25);
  /* the door, 22 cm back, with its reveals and soffit */ const dd=.22, ds=doorSlot(dc,hv==='cottage'), du0=Math.min(wx(d0),wx(d1)), dw=(d1-d0)*sx;
  eKA(Pu(du0,-dd),U,Y_,dw,ft*sy,ds.rc,mir?ds.f1:ds.f0,mir?ds.f0:ds.f1,0,ft/3.25);
  eQK(Pu(du0),nOut,Y_,dd,ft*sy,stone); eQK(Pu(du0+dw,-dd),out,Y_,dd,ft*sy,stone); eQK(Pu(du0,-dd,PAVE_Y+ft*sy),U,out,dw,dd,mix(stone,'#000000',.3));
  lotBox(P0,U,out,du0-.1,du0+dw+.1,-dd,.32,PAVE_Y,PAVE_Y+.15,'#9e9a90','fst');
  /* the bay: its own front shows the painted window, a lead roof on top, a solid you can climb */
  const lit=hr(L.door*31+7)()<.36;
  if(lay.bay){ const [b0,b1,bh]=lay.bay, bo=.55, h=bh*sy, bu0=Math.min(wx(b0),wx(b1)), bw=(b1-b0)*sx; Q(b0,b1,0,bh,bo); lotBox(P0,U,out,bu0,bu0+bw,0,bo,PAVE_Y,PAVE_Y+h,stone,'s');
    lotBox(P0,U,out,bu0-.05,bu0+bw+.05,0,bo+.07,PAVE_Y+h,PAVE_Y+h+.14,'#3e4246','fst',PAVE_Y); if(lit) for(const [w0,w1,sl,tp] of lay.w) Q(w0,w1,sl,tp,bo+.02,KAL.m); }
  else for(const [w0,w1,sl,tp] of lay.w){ const a=Math.min(wx(w0),wx(w1)); lotBox(P0,U,out,a-.07,a+(w1-w0)*sx+.07,0,.09,PAVE_Y+sl*sy-.07,PAVE_Y+sl*sy,stone,'fstu'); if(lit) Q(w0,w1,sl,tp,.02,KAL.m); }
  /* a string course at first-floor level */ lotBox(P0,U,out,0,fw,0,.07,PAVE_Y+gH-.03,PAVE_Y+gH+.1,stone,'fstu');
  /* the back of the ground-floor box */ backGF(L,lx0,lz0,lx1,lz1,gH,F);
  /* door number for Ali's deliveries, the drainpipe, a bin, now and then a dish or a pot */
  const st=L.S[8]||'', no=(HOUSE_NO[st]=(HOUSE_NO[st]||0)+1), [hx,,hz]=Pu(du0+dw/2,.7); HOUSE_DOORS.push({x:hx,z:hz,yaw:Math.atan2(-out[0],-out[2]),street:st,no:no*2-(k==='n'||k==='w'?1:0)});
  const pu=mir?.06:fw-.06; lotBox(P0,U,out,pu-.05,pu+.05,.02,.12,PAVE_Y,top,'#1e2022','fs');
  if(r()<.5){ const bu=mir?.55:fw-.55, bc=['#1a1a1c','#2a4a2a','#2a3a6a','#5a3a2a','#1a1a1c'][L.door%5]; lotBox(P0,U,out,bu-.3,bu+.3,.12,.72,PAVE_Y,PAVE_Y+1.07,bc,'fbst',true); }
  if(r()<.2){ const [dx,,dz]=Pu(fw*(mir?.3:.7),.12); eGeo(swG(cyl(.32,.32,.05,8),'#c8c8c4'),KA.m,dx,PAVE_Y+gH+1.6,dz,Math.atan2(out[0],out[2]),Math.PI/2); }
  if(r()<.22){ const pu2=mir?du0-.35:du0+dw+.35; lotBox(P0,U,out,pu2-.16,pu2+.16,.1,.42,PAVE_Y,PAVE_Y+.32,'#8a5a3a','fbst'); lotBox(P0,U,out,pu2-.22,pu2+.22,.04,.48,PAVE_Y+.32,PAVE_Y+.72,'#2e4a24','fbst'); } }

/* a shopfront: pilasters, stallriser, mullions, a fascia (lightbox on the high street, signwritten on Columbia and Cheshire), a cornice ledge you can stand on,
   a room behind the glass with depth (shelved side walls, a back wall, ceiling, strip light, counter, floor); or a shutter. Awnings and pavement displays from the item */
const SHOPPC=['#1e3a2a','#1c2438','#3a1a1a','#1a1a1c','#4a3a2a','#2a4a4a','#5a2a3a','#2a2a3a','#6a5a3a','#d8d0bc'];
function groundShopH(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw,r,P0){ const it=L.it, tk=TRADES[L.trade]?L.trade:'cafe', T=TRADES[tk], shut=tk==='tolet'||!!L.shut, trad=it.sf?it.sf==='trad':(L.S[7]==='market'||L.S[7]==='vintage');
  const pc=it.pc||(trad?SHOPPC[L.door%SHOPPC.length]:['#1c1d20','#8e9092','#1c1d20','#2a2c30'][L.door%4]), k=L.k, Pi=(u,o,y)=>[P0[0]+U[0]*u+out[0]*o,y,P0[2]+U[2]*u+out[2]*o], nOut=[-out[0],0,-out[2]];
  backGF(L,lx0,lz0,lx1,lz1,gH,L.F);
  const pil=.3, cTop=PAVE_Y+gH-.85, sr=PAVE_Y+(trad?.6:.42), DEEP=2.6, u0=pil, u1=fw-pil, ow=u1-u0, ch=gH-.7;
  if(!shut){ const rc=raRoom(tk), wc=mix(T.room,'#1a1612',.5);
    eRA(Pi(u0,-DEEP,PAVE_Y),U,Y_,ow,ch,rc); eRA(Pi(u0,0,PAVE_Y),nOut,Y_,DEEP,ch,rc,0,.3); eRA(Pi(u1,-DEEP,PAVE_Y),out,Y_,DEEP,ch,rc,.7,1);
    eRQ(Pi(u0,-DEEP,PAVE_Y+ch),U,out,ow,DEEP,mix(T.room,'#2a2622',.35)); eRQ(Pi(u0,0,PAVE_Y+.02),U,nOut,ow,DEEP,mix(T.room,'#1a1612',.7)); eRQ(Pi(u0+ow*.25,-DEEP*.55,PAVE_Y+ch-.02),U,out,ow*.5,.14,'#fff6dc');
    const c0=u0+ow*(L.door%2?.06:.5), cl=ow*.44; eRQ(Pi(c0,-1.45,PAVE_Y),U,Y_,cl,.95,mix(wc,'#000000',.35)); eRQ(Pi(c0,-1.45,PAVE_Y+.95),U,nOut,cl,.55,mix(T.room,'#000000',.15));
    for(const t of [0,.4,1]){ const uc=Math.min(u1-.035,Math.max(u0+.035,u0+ow*t)); lotBox(P0,U,out,uc-.035,uc+.035,0,.06,sr,cTop,pc,'fs'); }
    lotBox(P0,U,out,u0,u1,0,.06,cTop-.42,cTop-.36,pc,'fstu'); if(trad) for(const t of [.2,.7]) lotBox(P0,U,out,u0+ow*t-.025,u0+ow*t+.025,0,.05,sr,cTop-.42,pc,'f');
    lotBox(P0,U,out,u0,u1,0,.07,PAVE_Y,sr,trad?mix(pc,'#000000',.15):'#2a2a2c','fst');
    if(L.door%3===0) STREET_LIGHT.pl.push([[fx+out[0]*1.2,PAVE_Y+2.4,fz+out[2]*1.2],[.9,.8,.62],6]); }
  else { eShut(Pi(u0,.03,PAVE_Y),U,ow,cTop-PAVE_Y,L.door); lotBox(P0,U,out,u0,u1,0,.24,cTop-.32,cTop,'#4e5052','fstu'); }
  /* pilasters, consoles, fascia, cornice ledge */
  for(const [a,b] of [[0,pil],[fw-pil,fw]]){ lotBox(P0,U,out,a,b,0,.14,PAVE_Y,PAVE_Y+gH-.08,pc,'fs'); if(trad) lotBox(P0,U,out,a+.03,b-.03,.14,.3,cTop-.1,PAVE_Y+gH-.1,mix(pc,'#000000',.2),'fst'); }
  lotBox(P0,U,out,pil,fw-pil,0,.18,cTop,PAVE_Y+gH-.08,trad?pc:'#141416','f');
  lotBox(P0,U,out,-.04,fw+.04,0,.34,PAVE_Y+gH-.08,PAVE_Y+gH+.06,trad?mix(pc,'#000000',.25):'#3e4042','fstu',PAVE_Y+gH-.08);
  const name=L.name||T.names[0]||T.sub.split(' · ')[0], sub=it.sub||T.sub;
  const uv=tk==='tolet'?(it.was?atlasSign('#3a3836','#8a8478',it.was,null,{face:'cond'}):null):trad?atlasSign(pc,it.fg||(pc==='#d8d0bc'?'#2a2a2a':'#ead8a0'),name,sub,{face:it.face||'cond',subC:it.fg||(pc==='#d8d0bc'?'#2a2a2a':'#ead8a0')}):atlasSign(it.bg||T.bg,it.fg||T.fg,name,sub,{face:it.face||T.face,lit:true,subC:it.fg||T.fg});
  if(uv) eSign(uv,Pi(fw/2,.185,(cTop+PAVE_Y+gH-.08)/2),U,fw-.7,.62);
  if(tk==='tolet') eSign(atlasSign('#f6f6f2','#c41a1a','TO LET',it.agent||'SHOP & UPPERS · 020 7739 0418',{face:'anton',subC:'#1a1a1a'}),Pi(fw/2,.05,PAVE_Y+gH+1.1),U,Math.min(fw-.6,2.6),.38);
  if(it.aw){ const [c1,c2]=it.aw.split('/'); awning(P0,U,out,u0,u1,cTop-.04,c1,c2); }
  if(it.disp) shopDisplay(it.disp,P0,U,out,fw,L.door); }
/* what spills onto the pavement: veg on astroturf, flower buckets, a clothes rail, an A-board, a junk table, plants, café chairs, a newspaper rack */
function shopDisplay(kind,P0,U,out,fw,seed){ const r=hr(7300+seed*13), u0=.45, u1=Math.max(u0+1,fw-.45), B=(a,b,o0,o1,y0,y1,c,f='fbst',s=false)=>lotBox(P0,U,out,a,b,o0,o1,PAVE_Y+y0,PAVE_Y+y1,c,f,s===false?false:PAVE_Y);
  const PROD=['#e8781a','#c81e1e','#5a9a2a','#e8c81e','#7a2a5a','#d8d0b0','#3a7a2a','#f0a030'];
  if(kind==='veg'){ B(u0,u1,.12,1.1,0,.62,'#2e6a2a','fbst',true); for(let u=u0+.04;u<u1-.4;u+=.46){ for(const [o0,y] of [[.15,.62],[.6,.62]]){ B(u,u+.42,o0,o0+.4,y,y+.16,'#9a7448','fbs'); B(u+.03,u+.39,o0+.03,o0+.37,y+.16,y+.22,PROD[r()*PROD.length|0],'t'); } } }
  else if(kind==='flowers'){ B(u0,u1,.15,.75,0,.45,'#3a3a36','fbst',true); B(u0,u1,.15,.45,.45,.85,'#3a3a36','fbst',PAVE_Y+.45); for(let u=u0+.05;u<u1-.3;u+=.36) for(const [o0,y] of [[.48,.45],[.18,.85]]){ B(u,u+.28,o0,o0+.24,y,y+.32,'#1a1a1c','fbs'); B(u-.03,u+.31,o0-.03,o0+.27,y+.32,y+.56,['#e84a6a','#f6d040','#f0f0e8','#c86ad8','#f08030','#d8303a','#3a7a2a'][r()*7|0],'fbst'); } }
  else if(kind==='rail'){ const a=u0, b=Math.min(u1,u0+2.4); for(const u of [a,b]) B(u-.03,u+.03,.55,.61,0,1.6,'#9a9c9e','fbs'); B(a,b,.56,.6,1.55,1.6,'#9a9c9e','fbt'); for(let u=a+.1;u<b-.1;u+=.13) B(u,u+.1,.38,.78,.7+r()*.2,1.5,['#c83a2a','#2a3a6a','#e8d8b0','#3a6a3a','#1a1a1a','#a87a3a','#7a3a6a'][r()*7|0],'fbst'); }
  else if(kind==='board'){ const u=fw*(seed%2?.25:.75); B(u-.3,u+.3,.9,1.0,0,.85,'#1a1a1c','fbst'); B(u-.24,u+.24,1.0,1.01,.12,.78,'#e8e4da','f'); }
  else if(kind==='bric'){ B(u0,u1,.15,1.0,.7,.75,'#6a5440','fbstu',true); for(const u of [u0+.05,u1-.1]) B(u,u+.05,.2,.95,0,.7,'#4a3a2a','fbs'); for(let u=u0+.1;u<u1-.3;u+=.32+r()*.2) B(u,u+.2+r()*.15,.25+r()*.3,.5+r()*.4,.75,.85+r()*.3,['#c8b890','#5a4a3a','#8a8a8a','#2a4a6a','#a83a2a','#e8e0d0'][r()*6|0],'fbst'); }
  else if(kind==='plants'){ B(u0,u1,.15,.8,0,.35,'#5a4a3a','fbst',true); for(let u=u0+.05;u<u1-.3;u+=.4){ const h=.3+r()*.6; B(u,u+.3,.3,.6,.35,.6,'#a85a3a','fbs'); B(u-.08,u+.38,.22,.68,.6,.6+h,['#2a5a2a','#3a7a3a','#1e4a22','#4a8a3a'][r()*4|0],'fbst'); } }
  else if(kind==='chairs'){ for(const u of [fw*.3,fw*.72]){ B(u-.3,u+.3,.55,1.15,.72,.76,'#2a2a2a','fbstu'); B(u-.03,u+.03,.82,.88,0,.72,'#2a2a2a','fs'); for(const du of [-.55,.45]) { B(u+du,u+du+.1+.3,.65,1.05,.44,.48,'#8a6a3e','t'); B(u+du+(du<0?0:.36),u+du+.04+(du<0?0:.36),.65,1.05,.48,.9,'#8a6a3e','fbs'); } } }
  else if(kind==='news'){ const u=fw*.7; B(u-.5,u+.5,.15,.6,0,1.1,'#1a3a6a','fbst'); for(let i=0;i<3;i++) B(u-.45,u+.45,.6,.62,.2+i*.3,.45+i*.3,['#e8e4da','#c81e1e','#e8e4da'][i],'f'); } }
/* a hand-written pub: bays of the bar seen through deep windows between painted pilasters, a gilt fascia, a hanging sign, baskets, a lantern */
const PUBPC={green:'#173a24',oxblood:'#4a1414',black:'#18181a',navy:'#17223e',cream:'#cfc4a4',tile:'#4a2a18',blue:'#1e3a5a',maroon:'#3a1424'};
function pubSignCell(pc,v){ return kaCell('ps|'+pc+'|'+v%6,(g,w,h)=>{ R(g,'#c8a050',0,0,w,h); R(g,pc,6,6,w-12,h-12); g.fillStyle='#e8cc80'; g.strokeStyle='#e8cc80'; g.lineWidth=5; const cx=w/2, cy=h/2;
  if(v%6===0){ g.beginPath(); g.moveTo(cx-34,cy+20); g.lineTo(cx-34,cy-14); g.lineTo(cx-17,cy+2); g.lineTo(cx,cy-24); g.lineTo(cx+17,cy+2); g.lineTo(cx+34,cy-14); g.lineTo(cx+34,cy+20); g.fill(); }
  else if(v%6===1){ ell(g,cx,cy-10,34,26,'#2e5a24'); R(g,'#5a3a1a',cx-6,cy+10,12,26); }
  else if(v%6===2){ for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?14:34; if(!i) g.beginPath(); g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr); } g.closePath(); g.fill(); }
  else if(v%6===3){ g.beginPath(); g.moveTo(cx-30,cy-26); g.lineTo(cx+30,cy+26); g.moveTo(cx+30,cy-26); g.lineTo(cx-30,cy+26); g.stroke(); ell(g,cx-30,cy-26,8,8,'#e8cc80'); ell(g,cx+30,cy-26,8,8,'#e8cc80'); }
  else if(v%6===4){ ell(g,cx,cy,30,30,'#e8cc80'); ell(g,cx,cy,22,22,pc); ell(g,cx+8,cy-6,6,6,'#e8cc80'); }
  else { ell(g,cx-6,cy,26,16,'#e8cc80'); ell(g,cx+20,cy-14,10,14,'#e8cc80'); R(g,'#e8cc80',cx-26,cy+10,6,22); R(g,'#e8cc80',cx+8,cy+10,6,22); } }); }
function groundPubH(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw,r,P0){ const it=L.it, pc=PUBPC[it.pc]||it.pc||PUBPC.green, dark=mix(pc,'#000000',.4), gold=it.pc==='cream'?'#2a1a10':'#e8cc80', k=L.k, Pi=(u,o,y)=>[P0[0]+U[0]*u+out[0]*o,y,P0[2]+U[2]*u+out[2]*o], nOut=[-out[0],0,-out[2]];
  backGF(L,lx0,lz0,lx1,lz1,gH,L.F);
  const nb=Math.max(2,Math.round(fw/2.6)), bw=fw/nb, cTop=PAVE_Y+gH-.85, wb=PAVE_Y+.85, dv=L.door%nb;
  for(let i=0;i<nb;i++){ const a=i*bw+.17, b=(i+1)*bw-.17, w=b-a;
    if(i===dv){ eQK(Pi(a,-.3,PAVE_Y),U,Y_,w,cTop-PAVE_Y,dark); eRA(Pi(a+.12,-.29,PAVE_Y+1.3),U,Y_,w-.24,cTop-PAVE_Y-1.45,PUB_ROOM,.2,.5,.3,1); lotBox(P0,U,out,a-.05,b+.05,-.3,.25,PAVE_Y,PAVE_Y+.13,'#8e8a82','fst'); }
    else { const f0=((i*.37+L.door*.11)%.55); eRA(Pi(a,-.3,wb),U,Y_,w,cTop-wb,PUB_ROOM,f0,f0+.45); lotBox(P0,U,out,a,b,-.3,0,PAVE_Y,wb,dark,'f'); lotBox(P0,U,out,a,b,0,.06,wb-.06,wb,'#c8b890','fst'); lotBox(P0,U,out,a,b,-.3,-.26,(wb+cTop)/2-.03,(wb+cTop)/2+.03,dark,'f'); }
    eQK(Pi(a,0,PAVE_Y),nOut,Y_,.3,cTop-PAVE_Y,dark); eQK(Pi(b,-.3,PAVE_Y),out,Y_,.3,cTop-PAVE_Y,dark); eQK(Pi(a,-.3,cTop),U,out,w,.3,mix(dark,'#000000',.3)); }
  for(let i=0;i<=nb;i++){ const u=i*bw; lotBox(P0,U,out,Math.max(0,u-.2),Math.min(fw,u+.2),0,.16,PAVE_Y,PAVE_Y+gH-.08,pc,'fs'); }
  lotBox(P0,U,out,0,fw,0,.2,cTop,PAVE_Y+gH-.08,pc,'f'); lotBox(P0,U,out,-.05,fw+.05,0,.36,PAVE_Y+gH-.08,PAVE_Y+gH+.08,dark,'fstu',PAVE_Y+gH-.08);
  eSign(atlasSign(pc,gold,L.pub,it.sub||'ALES · LAGERS · SKY SPORTS',{face:'cond',subC:gold}),Pi(fw/2,.205,(cTop+PAVE_Y+gH-.08)/2),U,fw-.5,.66);
  /* the hanging sign on its bracket, both faces painted */ const hu=L.door%2?.35:fw-.35, hy=PAVE_Y+gH+1.1, ps=pubSignCell(pc,L.door);
  lotBox(P0,U,out,hu-.03,hu+.03,0,1.2,hy+1.0,hy+1.06,STEEL,'fbstu'); eKA(Pi(hu,.3,hy),out,Y_,.85,.95,ps); eKA(Pi(hu,1.15,hy),nOut,Y_,.85,.95,ps);
  for(const u of [.55,fw-.55]){ lotBox(P0,U,out,u-.22,u+.22,.3,.74,PAVE_Y+gH+.1,PAVE_Y+gH+.48,'#2e5a24','fbstu'); for(let i=0;i<4;i++) lotBox(P0,U,out,u-.24+i*.12,u-.14+i*.12,.28,.36,PAVE_Y+gH+.18+(i%2)*.12,PAVE_Y+gH+.3+(i%2)*.12,['#d83a6a','#f0d040','#f0f0e8','#c84ad8'][i],'f'); lotBox(P0,U,out,u-.01,u+.01,.5,.52,PAVE_Y+gH+.48,PAVE_Y+gH+.9,STEEL,'fs'); }
  { const lu=fw/2; lotBox(P0,U,out,lu-.13,lu+.13,.25,.5,PAVE_Y+gH+.25,PAVE_Y+gH+.62,'#1e1e1e','fbst'); eRQ(Pi(lu-.1,.505,PAVE_Y+gH+.3),U,Y_,.2,.27,'#ffd890'); lotBox(P0,U,out,lu-.02,lu+.02,0,.38,PAVE_Y+gH+.62,PAVE_Y+gH+.66,STEEL,'fbt'); }
  STREET_LIGHT.pl.push([[fx+out[0]*1.4,PAVE_Y+2.4,fz+out[2]*1.4],[1.3,.85,.45],8]); PUB_SPOTS.push([fx+out[0]*1.6,fz+out[2]*1.6,Math.atan2(out[0],out[2])]); }
/* a workshop or warehouse: common brick, a big opening with a roller shutter or painted timber doors, a signwritten name on the brickwork */
function groundWorks(L,lx0,lz0,lx1,lz1,gH,U,out,fw,P0,F){ const it=L.it, wm=L.brick==='soot'?mSootW:mBrickW, k=L.k, Pi=(u,o,y)=>[P0[0]+U[0]*u+out[0]*o,y,P0[2]+U[2]*u+out[2]*o], nOut=[-out[0],0,-out[2]];
  backGF(L,lx0,lz0,lx1,lz1,gH,F);
  const dw=Math.min(it.dw||3.6,fw-1.4), du0=it.dl!==undefined?Math.min(fw-dw-.4,it.dl):(fw-dw)/2, du1=du0+dw, dh=Math.min(gH-.9,3.2), ou=u=>(u/1.6)%1;
  eGrid(wm,Pi(0,0,PAVE_Y),U,Y_,du0,gH,1.6,1.5,0,0,3,3); eGrid(wm,Pi(du1,0,PAVE_Y),U,Y_,fw-du1,gH,1.6,1.5,ou(du1),0,3,3); eGrid(wm,Pi(du0,0,PAVE_Y+dh),U,Y_,dw,gH-dh,1.6,1.5,ou(du0),dh/1.5,3,0);
  const rec=.3; eQK(Pi(du0,0,PAVE_Y),nOut,Y_,rec,dh,'#3a302a'); eQK(Pi(du1,-rec,PAVE_Y),out,Y_,rec,dh,'#3a302a'); eQK(Pi(du0,-rec,PAVE_Y+dh),U,out,dw,rec,'#241e1a');
  lotBox(P0,U,out,du0-.1,du1+.1,0,.1,PAVE_Y+dh,PAVE_Y+dh+.25,'#5a5a56','fstu');
  if(it.doors){ eQK(Pi(du0,-rec,PAVE_Y),U,Y_,dw,dh,it.doors); for(let u=du0+.25;u<du1-.1;u+=.25) lotBox(P0,U,out,u-.015,u+.015,-rec,-rec+.02,PAVE_Y,PAVE_Y+dh,mix(it.doors,'#000000',.3),'f'); lotBox(P0,U,out,(du0+du1)/2-.03,(du0+du1)/2+.03,-rec,-rec+.04,PAVE_Y,PAVE_Y+dh,mix(it.doors,'#000000',.45),'f'); }
  else if(it.open){ const rc=raRoom(L.trade&&TRADES[L.trade]?L.trade:'workshop'); eRA(Pi(du0,-4,PAVE_Y),U,Y_,dw,dh,rc); eRQ(Pi(du0,-rec,PAVE_Y),nOut,Y_,3.7,dh,'#3a3430'); eRQ(Pi(du1,-4,PAVE_Y),out,Y_,3.7,dh,'#3a3430'); eRQ(Pi(du0,-4,PAVE_Y+dh),U,out,dw,3.7,'#2a2622'); eRQ(Pi(du0,-rec,PAVE_Y+.02),U,nOut,dw,3.7,'#2e2a26'); }
  else eShut(Pi(du0,-rec,PAVE_Y),U,dw,dh,L.door);
  const T=TRADES[L.trade]||TRADES.workshop, name=L.name||T.names[0], sw=Math.min(fw-.8,6.5), sh=Math.min(.75,(gH-dh)*.75);
  if(gH-dh>.5) eSign(atlasSign(it.bg||'#1a1a1a',it.fg||'#e8e0c8',name,it.sub||T.sub,{face:it.face||'cond',subC:it.fg||'#e8e0c8'}),Pi(fw/2,.03,PAVE_Y+dh+.25+(gH-dh-.25)/2),U,sw,sh); }

/* ---------------- post-war council infill: set back behind a low wall and a strip of grass, flat-fronted, wide windows, concrete bands,
   a canopy over the entrance, a balcony stack you can climb, a bin store, a lift room on the roof ---------------- */
function buildInfill(L,lx0,lz0,lx1,lz1,BR,d,r){ const it=L.it, k=L.k, sb=it.sb??2.2, st=L.st, top=PAVE_Y+st*2.85;
  const f0=lotFront(k,lx0,lz0,lx1,lz1); if(k==='n') lz0+=sb; else if(k==='s') lz1-=sb; else if(k==='w') lx0+=sb; else lx1-=sb;
  const {U,out,fw,P0}=lotFront(k,lx0,lz0,lx1,lz1), horiz=k==='n'||k==='s', sideK=horiz?'ew':'ns', F=facade(L.brick||'estbrick','estate',L.fv);
  eFacadeA(lx0,lz0,lx1,lz1,PAVE_Y,top,F,k,{seed:L.door*31,skip:sideK}); lodRec(lx0,lz0,lx1,lz1,PAVE_Y,top,F,k); lotSides(L,lx0,lz0,lx1,lz1,2.85,top,F,'',sideK,r);
  for(let f=1;f<st;f++) lotBox(P0,U,out,0,fw,0,.09,PAVE_Y+f*2.85-.14,PAVE_Y+f*2.85+.08,'#a29e94','fstu');
  lotBox(P0,U,out,-.1,fw+.1,0,.2,top-.1,top+.25,'#a29e94','fst');
  /* the entrance: a lit lobby door, a canopy you can stand on, the name */ const c=it.door??fw*.38;
  lotBox(P0,U,out,c-.85,c+.85,0,.05,PAVE_Y,PAVE_Y+2.35,'#5a5c5e','f'); eRQ([P0[0]+U[0]*(c-.75)+out[0]*.055,PAVE_Y,P0[2]+U[2]*(c-.75)+out[2]*.055],U,Y_,1.5,2.25,'#b8ccd2');
  lotBox(P0,U,out,c-.02,c+.02,.056,.07,PAVE_Y,PAVE_Y+2.25,'#3a3c3e','f'); lotBox(P0,U,out,c-1.3,c+1.3,0,1.3,PAVE_Y+2.6,PAVE_Y+2.78,'#8e8a82','fstu',PAVE_Y+2.6);
  eSign(atlasSign('#1c2f5a','#f4f2ea',it.name||'1–24 PARFETT HOUSE',it.sub||'LONDON BOROUGH OF TOWER HAMLETS',{face:'grot',subC:'#c8d4ec'}),[P0[0]+U[0]*c+out[0]*.06,PAVE_Y+3.15,P0[2]+U[2]*c+out[2]*.06],U,2.4,.36);
  /* a balcony stack: slab, solid parapet you can stand on, the next slab in reach; a bin store under the first */ const ba=it.bal??(fw>=9?fw-3.4:-1);
  if(ba>=0){ lotBox(P0,U,out,ba,ba+2.8,0,1.6,PAVE_Y,PAVE_Y+1.45,'#7a7a72','fbst',true); lotBox(P0,U,out,ba+.1,ba+2.7,.02,1.62,PAVE_Y+.2,PAVE_Y+1.3,'#4a4c4a','f');
    for(let f=1;f<st;f++){ const y=PAVE_Y+f*2.85; lotBox(P0,U,out,ba,ba+2.8,0,1.15,y-.15,y,'#9a968c','fbstu',y-.15); lotBox(P0,U,out,ba,ba+2.8,1.03,1.15,y,y+1.0,'#8e8a82','fbst',y); for(const u of [ba,ba+2.68]) lotBox(P0,U,out,u,u+.12,0,1.03,y,y+1.0,'#8e8a82','fs',y); } }
  /* forecourt: grass, a low wall with a gap for the path */ const fp=f0.P0, fO=[out[0],0,out[2]];
  { const g=[[0,c-.9],[c+.9,fw]]; const Pf=[fp[0],0,fp[2]]; for(const [a,b] of g) if(b-a>.2) lotBox(Pf,U,fO,a,b,-.25,0,PAVE_Y,PAVE_Y+.6,'#8a6a4e','fbst',true);
    const gx=[Pf[0]-out[0]*sb, Pf[0]], gz=[Pf[2]-out[2]*sb, Pf[2]]; const xs=[...gx,...gx.map(v=>v+U[0]*fw)], zs=[...gz,...gz.map(v=>v+U[2]*fw)];
    eFlat(Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs),PAVE_Y-.005,mGrass,2,4);
    const px=[Pf[0]+U[0]*(c-.8),Pf[0]+U[0]*(c+.8)-out[0]*sb], pz=[Pf[2]+U[2]*(c-.8),Pf[2]+U[2]*(c+.8)-out[2]*sb]; eFlat(Math.min(...px),Math.min(...pz),Math.max(...px),Math.max(...pz),PAVE_Y+.004,mPath,2,0); }
  /* the roof: felt, coping, a lift motor room and a tank you can climb on */
  eFlat(lx0,lz0,lx1,lz1,top+.02,mFelt,4,0); hsol(lx0,lz0,lx1,lz1,top+.02); lotBox(P0,U,out,0,fw,-(d-sb),0,top,top+.25,'#a29e94','sb'); lotBox(P0,U,out,fw*.3,fw*.3+2.6,-d+sb+1.5,-d+sb+4,top,top+2.2,'#8a8680','fbst',top);
  roofKit(P0,U,out,fw,d-sb,top+.02,'works',r,0); }

/* ---------------- the gaps in a hand-written side ---------------- */
function buildGap(G,BR,D){ const k=G.k, d=D[k], it=G.it, [lx0,lz0,lx1,lz1]=lotRect(k,G.a,G.b,BR,d), {U,out,fw,P0}=lotFront(k,lx0,lz0,lx1,lz1), r=hr(Math.round(G.a*7+G.b*3)|0), Pi=(u,o,y)=>[P0[0]+U[0]*u+out[0]*o,y,P0[2]+U[2]*u+out[2]*o];
  const wall=(a,b,h,o0=-.35,o1=0)=>{ const xs=[P0[0]+U[0]*a+out[0]*o0,P0[0]+U[0]*b+out[0]*o1], zs=[P0[2]+U[2]*a+out[2]*o0,P0[2]+U[2]*b+out[2]*o1], q=[Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs)];
    eBoxF(q[0],q[1],q[2],q[3],PAVE_Y,PAVE_Y+h,{n:mBrickW,s:mBrickW,e:mBrickW,w:mBrickW},{tu:1.6,tv:1.5}); lotBox(P0,U,out,a-.03,b+.03,o0-.04,o1+.04,PAVE_Y+h,PAVE_Y+h+.08,'#8a8680','fbst'); hsol(q[0],q[1],q[2],q[3],PAVE_Y+h+.08); };
  const g=G.g; if(g==='none'||reserved(Math.min(lx0,lx1)-1,Math.min(lz0,lz1)-1,Math.max(lx0,lx1)+1,Math.max(lz0,lz1)+1)) return;
  if(g==='gate'){ const gw=Math.min(fw-.8,it.gw||3.0), g0=(fw-gw)/2, gc=it.c||'#2a3a2a'; wall(0,g0,2.3); wall(g0+gw,fw,2.3);
    lotBox(P0,U,out,g0,g0+gw,-.3,-.24,PAVE_Y,PAVE_Y+2.1,gc,'fbst',true); for(let u=g0+.2;u<g0+gw;u+=.2) lotBox(P0,U,out,u-.012,u+.012,-.24,-.22,PAVE_Y+.05,PAVE_Y+2.05,mix(gc,'#000000',.3),'f');
    lotBox(P0,U,out,g0+gw/2-.02,g0+gw/2+.02,-.24,-.21,PAVE_Y,PAVE_Y+2.1,mix(gc,'#000000',.5),'f'); if(it.sign!==false) eSign(atlasSign('#f4f2ea','#c41a1a','NO PARKING',it.sign||'GATES IN CONSTANT USE',{face:'grot',subC:'#1a1a1a'}),Pi(g0+gw/2,-.21,PAVE_Y+1.5),U,1.1,.18); }
  else if(g==='wall'){ wall(0,fw,1.9); if(fw>3){ const t=Pi(fw/2,-3.5,0); tree(t[0],t[2],.9); } }
  else if(g==='garage'){ const n=Math.max(1,Math.round(fw/3.2)), gw=fw/n, gd=Math.min(6,d-.5), gh=2.5;
    for(let i=0;i<n;i++){ const a=i*gw; eShut(Pi(a+.2,.0,PAVE_Y),U,gw-.4,2.2,i+Math.round(G.a)); lotBox(P0,U,out,a,a+.2,-gd,0,PAVE_Y,PAVE_Y+gh,'#8a7a64','fs'); lotBox(P0,U,out,a+gw-.2,a+gw,-gd,0,PAVE_Y,PAVE_Y+gh,'#8a7a64','fs'); lotBox(P0,U,out,a+.2,a+gw-.2,-.05,0,PAVE_Y+2.2,PAVE_Y+gh,'#8a7a64','f'); }
    lotBox(P0,U,out,0,fw,-gd-.12,-gd,PAVE_Y,PAVE_Y+gh,'#7a6a54','b'); const q=lotBox(P0,U,out,0,fw,-gd-.12,0,PAVE_Y+gh,PAVE_Y+gh+.1,'#2c2d30','fbst'); hsol(q[0],q[1],q[2],q[3],PAVE_Y+gh+.1); eSign(atlasSign('#1c2f5a','#f4f2ea','GARAGES',it.sign||'RESIDENTS ONLY · NO PARKING',{face:'grot',subC:'#c8d4ec'}),Pi(fw/2,.02,PAVE_Y+2.36),U,Math.min(fw-.5,1.6),.22); }
  else if(g==='yard'){ const pc=posterCell(Math.round(G.a)%7&3); eKA(Pi(0,0,PAVE_Y),U,Y_,fw,2.4,pc); eKA(Pi(fw,-.06,PAVE_Y),[-U[0],0,-U[2]],Y_,fw,2.4,pc,0,1,0,1); lotBox(P0,U,out,0,fw,-.06,0,PAVE_Y+2.4,PAVE_Y+2.45,'#5a4a34','t',true);
    lotBox(P0,U,out,fw*.2,fw*.2+3.2,-5.5,-3.6,PAVE_Y,PAVE_Y+1.3,'#e0a81a','fbst',true); lotBox(P0,U,out,fw*.2+.1,fw*.2+3.1,-5.4,-3.7,PAVE_Y+1.3,PAVE_Y+1.36,'#5a4a3a','t'); }
  else if(g==='garden'){ lotBox(P0,U,out,0,fw,-.3,0,PAVE_Y,PAVE_Y+.6,'#7a5a40','fbst',true); { const a=Pi(0,-.15,0), b=Pi(fw,-.15,0); railing(a[0],a[2],b[0],b[2],.7,PAVE_Y+.6,false); }
    const q=[Pi(0,-.3,0),Pi(fw,-d,0)]; eFlat(Math.min(q[0][0],q[1][0]),Math.min(q[0][2],q[1][2]),Math.max(q[0][0],q[1][0]),Math.max(q[0][2],q[1][2]),PAVE_Y+.003,mGrass,2,4); const t=Pi(fw/2,-d*.55,0); tree(t[0],t[2],1.0); if(fw>4){ const b=Pi(fw*.25,-1.4,0); bench(b[0],b[2],Math.atan2(out[0],out[2])); } }
  else { /* an alley: brick piers at the mouth, setts running back into the yard, a bollard */ for(const [a,b] of [[0,.42],[fw-.42,fw]]) lotBox(P0,U,out,a,b,-.42,0,PAVE_Y,PAVE_Y+2.4,'#6a5a44','fbst',true);
    const q=[Pi(.42,0,0),Pi(fw-.42,-d-3,0)]; eFlat(Math.min(q[0][0],q[1][0]),Math.min(q[0][2],q[1][2]),Math.max(q[0][0],q[1][0]),Math.max(q[0][2],q[1][2]),PAVE_Y+.004,mPath,1.2,3); const bp=Pi(fw/2,-.3,0); if(fw>1.8) bollard(bp[0],bp[2]); }
  /* boards across the gap at roof level, for the rooftop runs */
  if(it.plank&&G.tA&&G.tB&&Math.abs(G.tA-G.tB)<.6){ const y=Math.min(G.tA,G.tB)+.18; lotBox(P0,U,out,-.7,fw+.7,-d*.5-.28,-d*.5+.28,y-.06,y,TIMBER,'fbstu',y-.06); } }

/* ---------------- Network Rail stairs up the viaduct sides, so the tracks are a run of their own ---------------- */
function buildRailStairs(){ const V=VIADUCTS[0], Vz=VIADUCTS[1], top=V[5]+1.1;
  for(const x of [-128,58,246]) railStair(x,V[1],X_,[0,0,-1],top);
  for(const x of [-64,118]) railStair(x,V[3],X_,[0,0,1],top);
  for(const z of [-128,44]) railStair(Vz[2],z,Z_,[1,0,0],top); }

/* a shop front: riser, recessed lit room, frame, fascia sign from the atlas; some shuttered for the night */
function groundShop(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw,r){ const trades=L.f==='curry'?['curry','curry','beigel','kebab','offy','vintage']:L.f==='market'?['flowers','cafe','vintage','flowers','barber','charity']:L.f==='vintage'?['vintage','cafe','barber','vintage','hardware']:
    ['chicken','offy','phone','barber','laundry','cafe','nails','chemist','agent','gold','vape','kebab','bookie','hardware','charity','chicken','offy','phone'];
  let tk=L.trade&&TRADES[L.trade]?L.trade:pick(r,trades); if(!L.trade) for(let k=0;k<6&&tk===LAST_TRADE;k++) tk=pick(r,trades); LAST_TRADE=tk; const T=TRADES[tk]; tradeRoom(tk); const shut=L.shut??(L.hand?false:r()<.2);
  /* the walls of the ground floor (sides and back plain) */
  const sideM=mBrickW, fk=out[2]<-.5?'n':out[2]>.5?'s':out[0]<-.5?'w':'e', GF={n:sideM,s:sideM,e:sideM,w:sideM,t:null}; GF[fk]=null; eBoxF(lx0,lz0,lx1,lz1,PAVE_Y,PAVE_Y+gH,GF,{tu:1.6,tv:1.5});
  /* the reveal: side walls and ceiling of the recess, so the glass sits in a real opening */
  const DEEP=1.0, wallM=shut?mDark:(T.mWall||(T.mWall=nightM(null,{color:parseInt(mix(T.room,'#000000',.12).slice(1),16),unlit:true},0)));
  { const gwh=(fw-.6)/2, bx=fx-U[0]*gwh, bz=fz-U[2]*gwh, ex=fx+U[0]*gwh, ez=fz+U[2]*gwh, ix=-out[0]*DEEP, iz=-out[2]*DEEP;
    eGrid(wallM,[bx+ix,PAVE_Y,bz+iz],[out[0],0,out[2]],Y_,DEEP,gH,1,1); eGrid(wallM,[ex,PAVE_Y,ez],[-out[0],0,-out[2]],Y_,DEEP,gH,1,1);
    eGrid(wallM,[bx+ix,PAVE_Y+gH-.6,bz+iz],U,[out[0],0,out[2]],fw-.6,DEEP,1,1); eGrid(mDark,[bx,PAVE_Y+.5,bz],U,[-out[0],0,-out[2]],fw-.6,DEEP,1,1);
    if(!shut){ const cm=col(0x2a2420), c0=.25+r()*.2, cx0=bx+U[0]*(fw-.6)*c0-out[0]*(DEEP-.45), cz0=bz+U[2]*(fw-.6)*c0-out[2]*(DEEP-.45), cl=(fw-.6)*.45;
      eGrid(cm,[cx0,PAVE_Y+.5,cz0],U,Y_,cl,.95,1,1); eGrid(col(0x6a625a),[cx0,PAVE_Y+1.45,cz0],U,[-out[0],0,-out[2]],cl,.4,1,1); } }
  const inset=DEEP, gw=fw-.6, gh=gH-1.15, ox=fx+out[0]*.03-U[0]*gw/2, oz=fz+out[2]*.03-U[2]*gw/2;
  if(shut){ eGrid(SHUT[L.door%6],[ox,PAVE_Y+.05,oz],U,Y_,gw,gh+.55,gw,gh+.55); }
  else { eGrid(T.mRoom,[ox-out[0]*inset+U[0]*.0,PAVE_Y+.5,oz-out[2]*inset],U,Y_,gw,gh,gw,gh);
    eGrid(mDark,[ox,PAVE_Y,oz],U,Y_,gw,.5,gw,.5);
    for(const t of [0,.38,1]) eGeo(box(U[0]?.07:.12,gH-.9,U[2]?.07:.12),mFrame,ox+U[0]*gw*t+out[0]*.02,PAVE_Y+(gH-.9)/2,oz+U[2]*gw*t+out[2]*.02);
    if(r()<.3){ STREET_LIGHT.pl.push([[fx+out[0]*1.2,PAVE_Y+2.4,fz+out[2]*1.2],[.9,.8,.62],6]); } }
  /* fascia: a box proud of the wall with the sign on its face */
  const used=(USED_NAMES[L.S[0]]=USED_NAMES[L.S[0]]||new Set()); let name=L.name||pick(r,T.names.length?T.names:['SHOP']); if(!L.name) for(let k=0;k<8&&(name===LAST_NAME||used.has(name));k++) name=pick(r,T.names); if(!name) name=T.sub.split(' · ')[0]; LAST_NAME=name; used.add(name); const uv=atlasSign(T.bg,T.fg,name,T.sub,{face:T.face,lit:true,subC:T.fg});
  const sy=PAVE_Y+gH-.5;
  eSign(uv,[fx+out[0]*.2,sy,fz+out[2]*.2],U,fw-.3,.72);
  if(r()<.35){ const n=2+(r()*3|0), bm=col(0x121214); for(let i=0;i<n;i++){ const t_=.15+i*.14+r()*.05, bx=fx+U[0]*(fw*.5-.5-t_*2)+out[0]*(.45+r()*.3), bz=fz+U[2]*(fw*.5-.5-t_*2)+out[2]*(.45+r()*.3), s_=.32+r()*.12; eGeo(cyl(s_,s_*.7,s_*1.5,6),bm,bx,PAVE_Y+s_*.7,bz,r()*3); } }
  eGeo(box(U[0]?fw-.2:.18,.8,U[2]?fw-.2:.18),mDark,fx+out[0]*.1,sy,fz+out[2]*.1); }
function groundPub(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw,r){ const green=r()<.5, wood=green?col(0x14301e):col(0x3a1414);
  const fk=out[2]<-.5?'n':out[2]>.5?'s':out[0]<-.5?'w':'e', GF={n:wood,s:wood,e:wood,w:wood,t:null}; eBoxF(lx0,lz0,lx1,lz1,PAVE_Y,PAVE_Y+gH,GF,{tu:2,tv:2,cell:3});
  /* the pub front stands proud of the wall, so its windows (a step behind) aren't hidden */ 
  const gw=fw-.6, ox=fx+out[0]*.03-U[0]*gw/2, oz=fz+out[2]*.03-U[2]*gw/2; tradeRoom('cafe');
  const pubRoom=TRADES.pubRoomG||(TRADES.pubRoomG={m:nightM(P2(128,64,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#ffcc80'],[1,'#a05a20']]); R(g,'#3a1a0a',0,h-14,w,14); for(let i=0;i<5;i++) R(g,'#5a2a10',8+i*24,30,14,20); for(let i=0;i<7;i++) ell(g,10+i*18,24,4,6,'#2a1408'); },0,1),{unlit:true},0)});
  for(let i=0;i<3;i++){ const pw_=gw/3-.25, o0=((L.door*7+i*3)%5)/5; eGrid(pubRoom.m,[ox+U[0]*(i*gw/3+.12)+out[0]*.04,PAVE_Y+.9,oz+U[2]*(i*gw/3+.12)+out[2]*.04],U,Y_,pw_,1.6,pw_*1.6,1.6,o0,0); }
  const uv=atlasSign(green?'#14301e':'#3a1414','#f0d48a',L.pub,'ALES · LAGERS · SKY SPORTS',{face:'cond',lit:true,subC:'#e8d8b0'});
  eSign(uv,[fx+out[0]*.22,PAVE_Y+gH-.4,fz+out[2]*.22],U,fw-.2,.7);
  STREET_LIGHT.pl.push([[fx+out[0]*1.4,PAVE_Y+2.4,fz+out[2]*1.4],[1.3,.85,.45],8]); PUB_SPOTS.push([fx+out[0]*1.6,fz+out[2]*1.6,Math.atan2(out[0],out[2])]); }
const PUB_SPOTS=[], FRONTAGES=[]; var HAND=HAND||{}; let LAST_TRADE='', LAST_NAME=''; const USED_NAMES={}; const HOUSE_DOORS=[], HOUSE_NO={}, EXT_TOPS=[];
/* HAND-HELPERS: writing a street side by hand (48c1-3). Widths are relative (scaled to fit the side); a house is about 5 m.
   Door letters: k black, n navy, r red, g green, y yellow, p plum, w white, t teal, o orange, b blue, s sage, m maroon, x oak, l pale blue, c cream;
   an UPPER-case letter is a house with a bay; '|' an alley (1.4 m), '/' a gated yard entry (2.6 m) */
const DOORK={k:'#141414',n:'#1c2a4a',r:'#7a1a1a',g:'#1e3a26',y:'#c8a020',p:'#3a2a4a',w:'#f2efe6',t:'#2a5a6a',o:'#b8561c',b:'#3a6aa0',s:'#7a8a6a',m:'#5a1e30',x:'#7a5a3a',l:'#8ab0c0',c:'#d8c8a0'};
/* a run of terrace houses; o: {hv, w, stuc (painted ground floor), scaf: index of the house with a scaffold, cot: cottage layout} */
function hT(brick,st,doors,o={}){ const out=[]; [...doors].forEach((ch,i)=>{ if(ch==='|'){ out.push({t:'gap',w:1.4,g:'alley'}); return; } if(ch==='/'){ out.push({t:'gap',w:2.6,g:'gate'}); return; } if(ch===' ') return;
  const low=ch.toLowerCase(); out.push({t:'house',w:o.w||5,brick,st,doorC:DOORK[low]||'#141414',hv:ch!==low?'bay':(o.hv||'flat'),stuc:o.stuc,scaf:o.scaf===i,mir:o.mir}); }); return out; }
const hH=(brick,st,door,o={})=>Object.assign({t:'house',w:5,brick,st,doorC:DOORK[door]||door,hv:'flat'},o);
const hS=(trade,name,o={})=>Object.assign({t:'shop',w:5.5,trade,name},o);
const hP=(name,pc,o={})=>Object.assign({t:'pub',w:8,name,pc,fe:true},o);
const hG=(g,w,o={})=>Object.assign({t:'gap',w,g},o);
const hI=(name,brick,st,w,o={})=>Object.assign({t:'infill',w,name,brick,st},o);
const hW=(name,trade,o={})=>Object.assign({t:'works',w:8,name,trade,brick:'soot',st:2},o);
/* /HAND-HELPERS */

/* ---------------- the viaducts: brick body, arches on both faces, bridges over the streets ---------------- */
const ARCHT=(()=>{ const out=[]; for(let v=0;v<4;v++){ const r=hr(8400+v), w=5*PXM, h=7.4*PXM; const fill=['lock','shut','brick','lit'][v];
  const base=P2(w,h,(g)=>{ paintWall(g,BRICKS.soot,w,h,r); g.fillStyle='#0a0a0a'; g.beginPath(); g.moveTo(12,h); g.lineTo(12,h-4.4*PXM); g.arc(w/2,h-4.4*PXM,w/2-12,Math.PI,0); g.lineTo(w-12,h); g.fill();
    if(fill==='shut'){ for(let y=h-4.3*PXM;y<h;y+=4) R(g,y%8?'#5a5c5e':'#4a4c4e',14,y,w-28,3); }
    if(fill==='brick'){ g.save(); g.clip(); paintWall(g,BRICKS.stock,w,h,r); g.restore(); R(g,'#3a2a20',w/2-14,h-2.2*PXM,28,2.2*PXM); }
    if(fill==='lock'){ R(g,'#1a1612',14,h-4.2*PXM,w-28,4.2*PXM); R(g,'#2a2420',w/2-20,h-2.6*PXM,40,2.6*PXM); }
    R(g,'#2a221c',0,h-6.4*PXM,w,4); },0,8400+v);
  const lit=P2(w,h,(g)=>{ g.clearRect(0,0,w,h); if(fill!=='lit'&&fill!=='lock') return; g.save(); g.beginPath(); g.moveTo(14,h); g.lineTo(14,h-4.3*PXM); g.arc(w/2,h-4.3*PXM,w/2-14,Math.PI,0); g.lineTo(w-14,h); g.clip();
    if(fill==='lit'){ vfill(g,0,0,w,h,[[0,'#ff9a40'],[1,'#ffd890']]); for(let i=0;i<6;i++) R(g,'#3a2010',10+i*18,h-60,8,60); R(g,'#2a1408',0,h-14,w,14); }
    else { R(g,'#ffb860',w/2-18,h-2.4*PXM,36,6); } g.restore(); },0,8410+v);
  out.push({m:MM(base),lit:nightM(lit,{unlit:true,cut:true})}); } return out; })();
function buildViaducts(){ for(const V of VIADUCTS){ const [x0,z0,x1,z1,ax,top]=V, along=ax==='x';
    /* gaps where streets cross (a street crossing = a road rect that cuts across) */
    const cuts=[]; for(const R_ of ROADR){ const cross=along?(R_[1]<z0&&R_[3]>z1):(R_[0]<x0&&R_[2]>x1); if(!cross) continue; const a=along?R_[0]:R_[1], b=along?R_[2]:R_[3]; const pv=PAVER.filter(p=>p[4]===R_[4]); let a2=a,b2=b; for(const p of pv){ const pa=along?p[0]:p[1], pb=along?p[2]:p[3]; if(along?(p[1]<z0&&p[3]>z1):(p[0]<x0&&p[2]>x1)){ a2=Math.min(a2,pa); b2=Math.max(b2,pb); } } cuts.push([a2,b2]); }
    /* the Overground's bridge over Bethnal Green Road is the old street's own (47-dressing) */
    if(!along) cuts.push([-9.4,21]);
    cuts.sort((p,q)=>p[0]-q[0]); const segs=[]; let p=along?x0:z0; const end=along?x1:z1;
    for(const [a,b] of cuts){ if(a>p) segs.push([p,a]); p=Math.max(p,b); } if(p<end) segs.push([p,end]);
    for(const [a,b] of segs){ const n=Math.max(1,Math.round((b-a)/5)), step=(b-a)/n;
      for(let i=0;i<n;i++){ const s0=a+i*step, s1=s0+step, v=ARCHT[(Math.abs(Math.round(s0*13.7))%7)%4], vv=ARCHT[(Math.abs(Math.round(s0*7.3))%5)%4];
        if(along){ eBoxF(s0,z0,s1,z1,0,top,{n:v.m,s:vv.m,e:null,w:null,t:null},{tu:step,tv:top,vb:0}); eGrid(v.lit,[s1,0,z0-.03],NX,Y_,step,top,step,top); eGrid(vv.lit,[s0,0,z1+.03],X_,Y_,step,top,step,top); }
        else { eBoxF(x0,s0,x1,s1,0,top,{e:v.m,w:vv.m,n:null,s:null,t:null},{tu:step,tv:top,vb:0}); eGrid(v.lit,[x1+.03,0,s1],NZ,Y_,step,top,step,top); eGrid(vv.lit,[x0-.03,0,s0],Z_,Y_,step,top,step,top); } }
      if(along){ eBoxF(a,z0,b,z1,0,top,{e:mSootW,w:mSootW},{tu:1.6,tv:1.5}); hsol(a,z0,b,z1,top+1.1); } else { eBoxF(x0,a,x1,b,0,top,{n:mSootW,s:mSootW},{tu:1.6,tv:1.5}); hsol(x0,a,x1,b,top+1.1); }
      /* parapet */ if(along){ eBox(a,z0,b,z0+.35,top,top+1.1,mSootW,{tu:1.6,tv:1.5}); eBox(a,z1-.35,b,z1,top,top+1.1,mSootW,{tu:1.6,tv:1.5}); } else { eBox(x0,a,x0+.35,b,top,top+1.1,mSootW,{tu:1.6,tv:1.5}); eBox(x1-.35,a,x1,b,top,top+1.1,mSootW,{tu:1.6,tv:1.5}); } }
    /* bridges: a steel girder deck over each street gap, walk under */
    for(const [a,b] of cuts){ if(!along&&a>=-9.5&&b<=21.1) continue; const gm=col(0x22302a); if(along){ eBox(a,z0,b,z1,top-1.6,top+.3,gm); hsol(a,z0,b,z1,top+1.1,top-1.6); } else { eBox(x0,a,x1,b,top-1.6,top+.3,gm); hsol(x0,a,x1,b,top+1.1,top-1.6); } }
  } }

/* ---------------- the build ---------------- */
function buildGround(){
  for(const r of ROADS) eFlat(r[0],r[1],r[2],r[3],0,mTarmac,6,4);
  for(const r of PAVES) eFlat(r[0],r[1],r[2],r[3],PAVE_Y,mPave,1.2,3);
  /* kerb faces: along every road edge where pavement meets it */
  for(const r of ROADS){ const ed=[[r[0],r[1],r[2],r[1],'n'],[r[0],r[3],r[2],r[3],'s'],[r[0],r[1],r[0],r[3],'w'],[r[2],r[1],r[2],r[3],'e']];
    for(const [ax0,az0,ax1,az1,k] of ed){ const horiz=k==='n'||k==='s', px=horiz?(ax0+ax1)/2:ax0+(k==='w'?-.3:.3), pz=horiz?az0+(k==='n'?-.3:.3):(az0+az1)/2;
      if(onRoad(px,pz)||inCore(px,pz)) continue; /* the edge runs on into another road (a crossing), not a kerb */
      if(horiz) eGrid(mKerb,k==='n'?[ax1,0,az0]:[ax0,0,az1],k==='n'?NX:X_,Y_,ax1-ax0,PAVE_Y,.9,PAVE_Y);
      else eGrid(mKerb,k==='w'?[ax0,0,az0]:[ax0,0,az1],k==='w'?Z_:NZ,Y_,az1-az0,PAVE_Y,.9,PAVE_Y); } }
}
function buildLamps(){ for(const S of STREETS){ const [id,ax,c,a,b,rw]=S; const step=id==='bgr'?20:26; let side=0;
    for(let p=a+12;p<b-6;p+=step){ side^=1; const s=side?-1:1, off=rw/2+.45; const x=ax==='x'?p:c+s*off, z=ax==='x'?c+s*off:p;
      if(inCore(x,z,3)||onRoad(x,z)) continue; if(VIADUCTS.some(v=>x>v[0]-2&&x<v[2]+2&&z>v[1]-2&&z<v[3]+2)) continue;
      lamp(x,z,ax==='x'?0:-s,ax==='x'?-s:0); } } }
function buildHub(){ const t0=performance.now();  buildGround(); buildViaducts(); const blocks=findBlocks(); let nb=0;
  blocks.forEach((B,i)=>{ const [x0,z0,x1,z1]=B.r; const cx=(x0+x1)/2,cz=(z0+z1)/2; if(LANDMARK_BLOCKS.some(L=>cx>L[1]&&cx<L[3]&&cz>L[2]&&cz<L[4])) return; if(!B.rect) { B.r=[x0,z0,x1,z1]; } buildBlock(B,i); nb++; });
  buildLamps(); buildRailStairs(); if(typeof buildLandmarks==='function') buildLandmarks();
  /* the old street's west end was a dead-end arch: it's a crossing now, so the arch goes, and the estate gets a proper boundary wall */
  ARCH.vis=false; sky.vis=false; eBox(-16.6,-27,-16.0,-3.2,PAVE_Y,PAVE_Y+2.4,mBrickW,{tu:1.6,tv:1.5}); hsol(-16.6,-27,-16.0,-3.2,PAVE_Y+2.4);
  HUBX={ floor:(x,z)=>onRoad(x,z)?0:PAVE_Y, walk:(x,z,rad)=>x>HUB.x0+rad&&x<HUB.x1-rad&&z>HUB.z0+rad&&z<HUB.z1-rad&&!inCore(x,z,0), blocks, built:nb, ms:performance.now()-t0 };
  console.log('[london] hub: blocks',blocks.length,'built',nb,'verts',EMIT.verts,'solids',GAME.SOL.length,'lights',STREET_LIGHT.pl.length,'ms',Math.round(HUBX.ms),'atlas kit',KA.n+'/'+KA.cols*KA.rows,'facades',FA.n+'/'+FA.cols*FA.rows,'swatches',KA.sw,'rooms',RA.n,'sign pages',SA.pages.length,'signs',SA.all.length,'scaffolds',SCAFS.length,'fire escapes',FIRE_ESC.length); }
/* built at the end of 48d, once the landmarks are defined */
