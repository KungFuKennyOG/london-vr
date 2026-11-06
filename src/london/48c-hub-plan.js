/* ==========================================================================================================
   THE HUB PLAN: Bethnal Green, compressed but true to its shape. Every street, block character and landmark is placed
   here by hand; the kit fills each block's houses. x runs east, z runs south (Bethnal Green Road is z 2.6..10.4).
   Brick Lane is the west edge, Cambridge Heath Road and the Tube the east, Hackney Road the north, Mile End Road the
   south. Two railway viaducts cut it into thirds: the Overground runs north-south past Terry's arch, the main line
   east-west above Cheshire Street. Weavers Fields is the park in the south-west, the Bramley towers the north-east.
   ========================================================================================================== */
/* streets: [name, runs along ('x' = east-west), centre, from, to, road width, pavement width, frontage, sign] */
const STREETS=[
  ['hackney','x',-470,-790,790,11,4,'shops','HACKNEY ROAD'],
  ['columbia','x',-330,-760,-22,7,2.6,'market','COLUMBIA ROAD'],
  ['oldbg','x',-200,-760,760,7,2.6,'terrace','OLD BETHNAL GREEN ROAD'],
  ['derby','x',-95,-760,-22,6.5,2.5,'terrace','DERBYSHIRE STREET'],
  ['teesdale','x',-95,41,760,6.5,2.5,'terrace','TEESDALE STREET'],
  ['bgr','x',6.5,-790,790,7.8,0,'shops','BETHNAL GREEN ROAD'],     /* pavements set by hand below (5.6 north, 3.0 south) */
  ['hereford','x',72,-760,620,6.5,2.5,'terrace','HEREFORD STREET'],
  ['cheshire','x',135,-760,760,7,2.6,'vintage','CHESHIRE STREET'],
  ['colts','x',170,-760,760,6.5,2.5,'arches','THREE COLTS LANE'],
  ['buckhurst','x',330,-330,760,6.5,2.5,'terrace','BUCKHURST STREET'],
  ['mileend','x',470,-790,790,11,4,'shops','MILE END ROAD'],
  ['bricklane','z',-760,-470,470,7,2.6,'curry','BRICK LANE'],
  ['clubrow','z',-620,-470,135,6.5,2.5,'terrace','CLUB ROW'],
  ['gibraltar','z',-480,-470,135,6.5,2.5,'terrace','GIBRALTAR WALK'],
  ['vallance','z',-330,-470,470,8,2.6,'terrace','VALLANCE ROAD'],
  ['mape','z',-180,-330,135,6.5,2.5,'terrace','MAPE STREET'],
  ['weaver','z',-40,170,470,6.5,2.5,'terrace','WEAVER STREET'],
  ['wilmot','z',-22,-470,135,7,2.5,'terrace','WILMOT STREET'],
  ['pollard','z',41,-470,135,6,2,'arches','POLLARD ROW'],
  ['barnet','z',180,-470,470,6.5,2.5,'terrace','BARNET GROVE'],
  ['wellington','z',330,-470,135,6.5,2.5,'terrace','WELLINGTON ROW'],
  ['durant','z',480,-470,470,6.5,2.5,'terrace','DURANT STREET'],
  ['paradise','z',620,-200,470,6.5,2.5,'terrace','PARADISE ROW'],
  ['camheath','z',760,-470,470,11,4,'shops','CAMBRIDGE HEATH ROAD'],
];
/* viaducts: [x0,z0,x1,z1, axis, deck height] */
const VIADUCTS=[[-800,146,800,158,'x',7.4],[29.05,-470,33.4,146,'z',7.4]];
/* block characters by area (first match wins): brick, storeys, window kind, interior */
const ZONES=[
  [-800,-520,-620,500,{brick:['soot','stock','red'],st:[2,3],win:'sash'}],
  [-620,-520,-330,-200,{brick:['red'],st:[4,5],win:'mansion'}],
  [-620,-200,-330,500,{brick:['stock','soot','stucco','red','brown'],st:[2,3],win:'sash'}],
  [-330,-520,-22,500,{brick:['stock','soot','red','stock','grey','brown'],st:[2,3],win:'sash'}],
  [34,-520,330,500,{brick:['stock','red','stucco','brown','soot'],st:[2,3],win:'sash'}],
  [330,-520,800,500,{brick:['stock','cream','red','soot','brown','stucco'],st:[2,3],win:'sash'}],
];
/* hand-built blocks: the generator leaves these to 48d-hub-landmarks.js. [name, x0,z0,x1,z1] (inside the block rect) */
const LANDMARK_BLOCKS=[
  ['boundary',-753.9,-460.5,-625.6,-336.1], ['decks',-177.5,-323.9,-24.5,-206.1], ['bramley',185.6,-460.5,324.4,-206.1],
  ['weavers',-323.4,176.1,-45.6,323.9], ['school',-477.5,13.4,-336.6,65.8], ['supermarket',332.5,13.4,477.5,65.8],
  ['gardens',625.6,13.4,750.5,128.9], ['church',625.6,-89.5,750.5,-3], ['petrol',627,-460.5,750.5,-410],
];
const STREET_BY=new Map(STREETS.map(s=>[s[0],s]));
const RESERVED=[[627,-462,752,-408]]; /* the petrol station sits in a corner of a bigger block */
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
function houseFront(brick,seed){ const k=brick+'|'+(seed%6); if(HOUSEF.has(k)) return HOUSEF.get(k); const B=BRICKS[brick], r=hr(seed), w=5*PXM, h=Math.round(3.2*PXM);
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
  const lots=[];
  for(const k of ['n','s','w','e']){ if(!D[k]) continue; const S=E[k], f=S[7], horiz=k==='n'||k==='s';
    let a=horiz?x0:z0, b=horiz?x1:z1; if(!horiz){ if(D.n) a=z0+D.n; if(D.s) b=z1-D.s; }
    let run=0, brick=pick(r,Z.brick), st=Z.st[0]+(r()<.4?1:0), fv=r()*3|0, door=r()*100|0;
    for(let p=a;p<b-2;){ const shop=f==='shops'||f==='curry'||f==='market'||f==='vintage'; let w=shop?5+r()*3:4.6+r()*.9; if(b-p-w<4) w=b-p;
      if(--run<=0){ run=shop?2+(r()*3|0):5+(r()*9|0); brick=pick(r,Z.brick); st=(shop?Math.max(3,Z.st[1]+1):Z.st[0]+(r()<.45?1:0)); fv=r()*3|0; }
      lots.push({k,a:p,b:p+w,f,S,brick,st,fv,door:door++,corner:p===a||p+w>=b-.01}); p+=w; } }
  /* a pub on one good corner */
  for(const L of lots){ if(L.corner&&(L.f==='shops'||L.f==='terrace')&&r()<.16&&PUBN<40){ L.pub=PUBS[PUBN++%PUBS.length]; break; } }
  for(const L of lots) buildLot(L,B.r,D,r,Z);
  /* the yard inside: ground, a garden wall ring, sheds and garages, trees; an alley gate from the longest street side */
  const ix0=x0+(D.w||0)+7, iz0=z0+(D.n||0)+7, ix1=x1-(D.e||0)-7, iz1=z1-(D.s||0)-7;
  eFlat(x0,z0,x1,z1,PAVE_Y-.001,mYard,2,8);
  if(ix1-ix0>6&&iz1-iz0>6){ for(let n=(ix1-ix0)*(iz1-iz0)/420|0;n>0;n--){ const gx=ix0+2+r()*(ix1-ix0-6), gz=iz0+2+r()*(iz1-iz0-6), gw=3+r()*3, gd=5+r()*2, gh=2.4+r()*.3; if(reserved(gx-2,gz-2,gx+gw+2,gz+gd+2)) continue;
      if(r()<.62){ eBoxF(gx,gz,gx+gw,gz+gd,PAVE_Y,PAVE_Y+gh,{n:mBrickW,s:SHUT[r()*6|0],e:mBrickW,w:mBrickW,t:mFelt},{tu:gw,tv:gh}); hsol(gx,gz,gx+gw,gz+gd,PAVE_Y+gh); }
      else { tree(gx+1.5,gz+1.5,.8+r()*.5); } } }
}

/* one lot: ground floor by trade, upper floors, roof, chimneys, a rear extension, and a garden wall */
function buildLot(L,BR,D,r,Z){ const [x0,z0,x1,z1]=BR, k=L.k, d=D[k], horiz=k==='n'||k==='s';
  /* lot rect */ let lx0,lz0,lx1,lz1; if(k==='n'){ lx0=L.a; lx1=L.b; lz0=z0; lz1=z0+d; } else if(k==='s'){ lx0=L.a; lx1=L.b; lz0=z1-d; lz1=z1; } else if(k==='w'){ lz0=L.a; lz1=L.b; lx0=x0; lx1=x0+d; } else { lz0=L.a; lz1=L.b; lx0=x1-d; lx1=x1; }
  if(reserved(lx0-8,lz0-8,lx1+8,lz1+8)) return;
  const shop=L.f==='shops'||L.f==='curry'||L.f==='market'||L.f==='vintage', st=L.pub?3:L.st, gH=shop||L.pub?3.6:3.2, top=PAVE_Y+gH+(st-1)*HUB.FLOOR, F=facade(L.brick,Z.win,L.fv);
  const front={n:'n',s:'s',w:'w',e:'e'}[k], U=k==='n'?NX:k==='s'?X_:k==='w'?Z_:NZ, out=k==='n'?[0,0,-1]:k==='s'?[0,0,1]:k==='w'?[-1,0,0]:[1,0,0];
  const fx=k==='w'?lx0:k==='e'?lx1:(lx0+lx1)/2, fz=k==='n'?lz0:k==='s'?lz1:(lz0+lz1)/2, fw=horiz?lx1-lx0:lz1-lz0;
  /* upper floors (front face has windows, sides and back are plain brick of the same kind) */
  const faces=front+(L.corner?(horiz?(lx0<=x0+.01?'w':lx1>=x1-.01?'e':''):(lz0<=z0+.01?'n':lz1>=z1-.01?'s':'')):'');
  eFacade(lx0,lz0,lx1,lz1,PAVE_Y+gH,top,F,faces,{ou:(r()*4|0)/4,ov:(r()*3|0)/3,skip:L.corner?'':(horiz?'ew':'ns')});
  /* ground floor */
  if(L.pub) groundPub(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw,r);
  else if(shop){ L.F=F; groundShop(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw,r); }
  else { const hf=houseFront(L.brick,L.door), hm=hf.mBase, back={n:'s',s:'n',w:'e',e:'w'}[front];
    { const st=L.S[8]||'', no=(HOUSE_NO[st]=(HOUSE_NO[st]||0)+1), sx=fx-U[0]*fw/2+U[0]*1.05, sz=fz-U[2]*fw/2+U[2]*1.05; HOUSE_DOORS.push({x:sx+out[0]*.7,z:sz+out[2]*.7,yaw:Math.atan2(-out[0],-out[2]),street:st,no:no*2-(L.k==='n'||L.k==='w'?1:0)});
      /* the front: a stone step, the drainpipe on the party wall, a wheelie bin, now and then a dish or a pot */
      const at=(u,o)=>[fx-U[0]*fw/2+U[0]*u+out[0]*o, fz-U[2]*fw/2+U[2]*u+out[2]*o];
      { const [a0,b0]=at(.45,0), [a1,b1]=at(1.65,.38); const sf={t:mCope}; sf[front]=mCope; eBoxF(Math.min(a0,a1),Math.min(b0,b1),Math.max(a0,a1),Math.max(b0,b1),PAVE_Y,PAVE_Y+.16,sf); }
      if(L.door%2){ const [px,pz]=at(.06,.06), pf={}; pf[front]=mPipe; eBoxF(px-.05,pz-.05,px+.05,pz+.05,PAVE_Y,top,pf); }
      if(r()<.45){ const [bx,bz]=at(fw-.5,.42), bm=BINC[(L.door*3)%BINC.length]; eBoxF(bx-.3,bz-.3,bx+.3,bz+.3,PAVE_Y,PAVE_Y+1.07,{n:bm,s:bm,e:bm,w:bm,t:bm}); hsol(bx-.3,bz-.3,bx+.3,bz+.3,PAVE_Y+1.07); }
      if(r()<.18){ const [dx,dz]=at(fw*.7,.12); eGeo(cyl(.32,.32,.05,8),mDish,dx,PAVE_Y+gH+1.6,dz,Math.atan2(out[0],out[2]),Math.PI/2); }
      if(r()<.2){ const [qx,qz]=at(1.85,.25); eBoxF(qx-.16,qz-.16,qx+.16,qz+.16,PAVE_Y,PAVE_Y+.32,{n:mPot,s:mPot,e:mPot,w:mPot}); eBoxF(qx-.22,qz-.22,qx+.22,qz+.22,PAVE_Y+.32,PAVE_Y+.7,{n:mBush,s:mBush,e:mBush,w:mBush,t:mBush}); } }
    eBoxF(lx0,lz0,lx1,lz1,PAVE_Y,PAVE_Y+gH,{[front]:hm},{tu:fw,tv:gH,vb:PAVE_Y,cell:3});
    const rest={}; rest[back]=F.mBase; if(L.corner){ for(const q of (horiz?'ew':'ns')) rest[q]=F.mBase; } eBoxF(lx0,lz0,lx1,lz1,PAVE_Y,PAVE_Y+gH,rest,{tu:F.bays*HUB.BAY,tv:F.floors*HUB.FLOOR}); }
  /* parapet and coping, flat roof, chimney stack on the party wall */
  { const cf={t:mCope}; cf[front]=mCope; eBoxF(lx0-(k==='e'?.15:0),lz0-(k==='s'?.15:0),lx1+(k==='w'?.15:0),lz1+(k==='n'?.15:0),top,top+.18,cf); }
  eFlat(lx0,lz0,lx1,lz1,top+.01,mFelt,4,0);
  if(!shop&&L.door%2===0){ const cxs=horiz?lx0+.4:(lx0+lx1)/2, czs=horiz?(lz0+lz1)/2:lz0+.4, cw=horiz?.8:1.6, cd=horiz?1.6:.8; eBoxF(cxs-cw/2,czs-cd/2,cxs+cw/2,czs+cd/2,top,top+1.3,{n:mBrickW,s:mBrickW,e:mBrickW,w:mBrickW,t:mCope},{tu:1.6,tv:1.5});
    for(let i=0;i<(L.door%3===0?2:0);i++){ const px=cxs+(horiz?0:(i-.5)*.6), pz=czs+(horiz?(i-.5)*.6:0); eBoxF(px-.09,pz-.09,px+.09,pz+.09,top+1.3,top+1.7,{n:mPot,s:mPot,e:mPot,w:mPot}); } }
  hsol(lx0,lz0,lx1,lz1,top+.18);
  /* rear extension: one storey, half the width, roof you can climb onto from the garden */
  const ew=(horiz?lx1-lx0:lz1-lz0)*.5, ed=3.2, eh=2.55; let ex0,ez0,ex1,ez1;
  if(k==='n'){ ex0=lx0; ex1=lx0+ew; ez0=lz1; ez1=lz1+ed; } else if(k==='s'){ ex0=lx1-ew; ex1=lx1; ez0=lz0-ed; ez1=lz0; } else if(k==='w'){ ez0=lz0; ez1=lz0+ew; ex0=lx1; ex1=lx1+ed; } else { ez0=lz1-ew; ez1=lz1; ex0=lx0-ed; ex1=lx0; }
  if(!L.corner){ EXT_TOPS.push([(ex0+ex1)/2,PAVE_Y+eh,(ez0+ez1)/2]); eBoxF(ex0,ez0,ex1,ez1,PAVE_Y,PAVE_Y+eh,{n:mBrickW,s:mBrickW,e:mBrickW,w:mBrickW,t:mFelt},{tu:1.6,tv:1.5}); hsol(ex0,ez0,ex1,ez1,PAVE_Y+eh);
    /* garden wall between this lot and the next, 7 m back */ const gw=1.8;
    if(k==='n') { eBoxF(lx1-.12,lz1,lx1+.12,lz1+7,PAVE_Y,PAVE_Y+gw,{e:mBrickW,w:mBrickW,t:mCope},{tu:1.6,tv:1.5}); hsol(lx1-.12,lz1,lx1+.12,lz1+7,PAVE_Y+gw); }
    if(k==='s') { eBoxF(lx1-.12,lz0-7,lx1+.12,lz0,PAVE_Y,PAVE_Y+gw,{e:mBrickW,w:mBrickW,t:mCope},{tu:1.6,tv:1.5}); hsol(lx1-.12,lz0-7,lx1+.12,lz0,PAVE_Y+gw); }
    if(k==='w') { eBoxF(lx1,lz1-.12,lx1+7,lz1+.12,PAVE_Y,PAVE_Y+gw,{n:mBrickW,s:mBrickW,t:mCope},{tu:1.6,tv:1.5}); hsol(lx1,lz1-.12,lx1+7,lz1+.12,PAVE_Y+gw); }
    if(k==='e') { eBoxF(lx0-7,lz1-.12,lx0,lz1+.12,PAVE_Y,PAVE_Y+gw,{n:mBrickW,s:mBrickW,t:mCope},{tu:1.6,tv:1.5}); hsol(lx0-7,lz1-.12,lx0,lz1+.12,PAVE_Y+gw); } }
}
/* a shop front: riser, recessed lit room, frame, fascia sign from the atlas; some shuttered for the night */
function groundShop(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw,r){ const trades=L.f==='curry'?['curry','curry','beigel','kebab','offy','vintage']:L.f==='market'?['flowers','cafe','vintage','flowers','barber','charity']:L.f==='vintage'?['vintage','cafe','barber','vintage','hardware']:
    ['chicken','offy','phone','barber','laundry','cafe','nails','chemist','agent','gold','vape','kebab','bookie','hardware','charity','chicken','offy','phone'];
  let tk=pick(r,trades); for(let k=0;k<6&&tk===LAST_TRADE;k++) tk=pick(r,trades); LAST_TRADE=tk; const T=TRADES[tk]; tradeRoom(tk); const shut=r()<.2;
  /* the walls of the ground floor (sides and back plain) */
  const sideM=L.F?L.F.mBase:mDark, fk=out[2]<-.5?'n':out[2]>.5?'s':out[0]<-.5?'w':'e', GF={n:sideM,s:sideM,e:sideM,w:sideM,t:null}; GF[fk]=null; eBoxF(lx0,lz0,lx1,lz1,PAVE_Y,PAVE_Y+gH,GF,{tu:2,tv:2});
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
  const used=(USED_NAMES[L.S[0]]=USED_NAMES[L.S[0]]||new Set()); let name=pick(r,T.names.length?T.names:['SHOP']); for(let k=0;k<8&&(name===LAST_NAME||used.has(name));k++) name=pick(r,T.names); if(!name) name=T.sub.split(' · ')[0]; LAST_NAME=name; used.add(name); const uv=atlasSign(T.bg,T.fg,name,T.sub,{face:T.face,lit:true,subC:T.fg});
  const sy=PAVE_Y+gH-.5;
  eSign(uv,[fx+out[0]*.2,sy,fz+out[2]*.2],U,fw-.3,.72);
  if(r()<.35){ const n=2+(r()*3|0), bm=col(0x121214); for(let i=0;i<n;i++){ const t_=.15+i*.14+r()*.05, bx=fx+U[0]*(fw*.5-.5-t_*2)+out[0]*(.45+r()*.3), bz=fz+U[2]*(fw*.5-.5-t_*2)+out[2]*(.45+r()*.3), s_=.32+r()*.12; eGeo(cyl(s_,s_*.7,s_*1.5,6),bm,bx,PAVE_Y+s_*.7,bz,r()*3); } }
  eGeo(box(U[0]?fw-.2:.18,.8,U[2]?fw-.2:.18),mDark,fx+out[0]*.1,sy,fz+out[2]*.1); }
function groundPub(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw,r){ const green=r()<.5, wood=green?col(0x14301e):col(0x3a1414);
  const fk=out[2]<-.5?'n':out[2]>.5?'s':out[0]<-.5?'w':'e', GF={n:wood,s:wood,e:wood,w:wood,t:null}; eBoxF(lx0,lz0,lx1,lz1,PAVE_Y,PAVE_Y+gH,GF,{tu:2,tv:2,cell:3});
  /* the pub front stands proud of the wall, so its windows (a step behind) aren't hidden */ 
  const gw=fw-.6, ox=fx+out[0]*.03-U[0]*gw/2, oz=fz+out[2]*.03-U[2]*gw/2; tradeRoom('cafe');
  const pubRoom=TRADES.pubRoom||(TRADES.pubRoom={m:nightM(P2(128,64,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#ffcc80'],[1,'#a05a20']]); R(g,'#3a1a0a',0,h-14,w,14); for(let i=0;i<5;i++) R(g,'#5a2a10',8+i*24,30,14,20); for(let i=0;i<7;i++) ell(g,10+i*18,24,4,6,'#2a1408'); },0,1),{unlit:true},0)});
  for(let i=0;i<3;i++){ const pw_=gw/3-.25, o0=((L.door*7+i*3)%5)/5; eGrid(pubRoom.m,[ox+U[0]*(i*gw/3+.12)+out[0]*.04,PAVE_Y+.9,oz+U[2]*(i*gw/3+.12)+out[2]*.04],U,Y_,pw_,1.6,pw_*1.6,1.6,o0,0); }
  const uv=atlasSign(green?'#14301e':'#3a1414','#f0d48a',L.pub,'ALES · LAGERS · SKY SPORTS',{face:'cond',lit:true,subC:'#e8d8b0'});
  eSign(uv,[fx+out[0]*.22,PAVE_Y+gH-.4,fz+out[2]*.22],U,fw-.2,.7);
  STREET_LIGHT.pl.push([[fx+out[0]*1.4,PAVE_Y+2.4,fz+out[2]*1.4],[1.3,.85,.45],8]); PUB_SPOTS.push([fx+out[0]*1.6,fz+out[2]*1.6,Math.atan2(out[0],out[2])]); }
const PUB_SPOTS=[]; let LAST_TRADE='', LAST_NAME=''; const USED_NAMES={}; const HOUSE_DOORS=[], HOUSE_NO={}, EXT_TOPS=[];

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
function buildHub(){ const t0=performance.now();
  buildGround(); buildViaducts(); const blocks=findBlocks(); let nb=0;
  blocks.forEach((B,i)=>{ const [x0,z0,x1,z1]=B.r; const cx=(x0+x1)/2,cz=(z0+z1)/2; if(LANDMARK_BLOCKS.some(L=>cx>L[1]&&cx<L[3]&&cz>L[2]&&cz<L[4])) return; if(!B.rect) { B.r=[x0,z0,x1,z1]; } buildBlock(B,i); nb++; });
  buildLamps(); if(typeof buildLandmarks==='function') buildLandmarks();
  /* the old street's west end was a dead-end arch: it's a crossing now, so the arch goes, and the estate gets a proper boundary wall */
  ARCH.vis=false; sky.vis=false; eBox(-16.6,-27,-16.0,-3.2,PAVE_Y,PAVE_Y+2.4,mBrickW,{tu:1.6,tv:1.5}); hsol(-16.6,-27,-16.0,-3.2,PAVE_Y+2.4);
  HUBX={ floor:(x,z)=>onRoad(x,z)?0:PAVE_Y, walk:(x,z,rad)=>x>HUB.x0+rad&&x<HUB.x1-rad&&z>HUB.z0+rad&&z<HUB.z1-rad&&!inCore(x,z,0), blocks, built:nb, ms:performance.now()-t0 };
  console.log('[london] hub: blocks',blocks.length,'built',nb,'verts',EMIT.verts,'solids',GAME.SOL.length,'lights',STREET_LIGHT.pl.length,'ms',Math.round(HUBX.ms)); }
/* built at the end of 48d, once the landmarks are defined */
