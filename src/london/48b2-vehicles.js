/* ==========================================================================================================
   THE VEHICLE KIT: every car, cab, van, bus and moped in London, parked or driving, from ONE painted atlas.
   - A body is a loft of cross-sections along its length (z forward, x across, y up; +x is the nearside/kerb side when
     driving on the left). Each section is bottom -> shoulder -> belt -> roof edge -> roof centre, so a body gets a real
     silhouette: tuck-under, a shoulder crease, tumblehome (the glasshouse narrower than the body), a raked screen and a
     rounded nose and tail. Faces are wound counter-clockwise seen from outside, by construction.
   - Every face is textured by planar projection onto one of its variant's pictures (each side as seen from that side,
     top, front, rear) by the face's main axis. The pictures are painted from the same loft (glass where the loft has glass,
     paint where it has paint), then the details go on top: shut lines, handles, arches, lamps, grilles, plates, wipers,
     interiors through the glass, grime. So everything lands exactly on the geometry.
   - Wheels, mirrors, the TAXI sign, the police light bar, ladder racks and roof rails are small parts on the same atlas.
   - Lamps (and the TAXI sign, the light bar, the bus's windows and blind) are a second mesh on one nightM material over
     the same atlas: they glow at night and sit dim by day. A moving vehicle is two draws; parked ones are emitted into
     their chunk and share its one atlas draw.
   vkGeo(variant) -> {g, lg, len, wid};  vkPick(kind, rnd) -> variant;  vkPark(x, z, variant, yaw, y0) emits one parked.
   ========================================================================================================== */
const VK={AW:2048,AH:0,tex:null,g:null,m:null,mL:null,vars:[],byType:{},sp:{},sh:{},reqs:[]};
const VK_COL={silver:'#a2a7ac',black:'#17181b',white:'#dcdbd4',navy:'#1d2946',red:'#8e1f1b',grey:'#585c62',green:'#25392c',brown:'#5e4634',
  blue:'#37557c',champagne:'#a69779',burgundy:'#4c1b23',rust:'#5a4030',cab:'#151619',cabgrey:'#33363b',police:'#e4e5e1',bus:'#b81d1a',vanwhite:'#dfded8',vansilver:'#9ca1a5',moped:'#d8d8d2'};
const VK_METAL=new Set(['silver','blue','brown','champagne','grey','navy','vansilver','burgundy','cabgrey','red']);
const VK_LET='ABCDEFGHJKLMNOPRSTUVWXY';
const vkReg=r=>'L'+VK_LET[r()*23|0]+['02','52','05','55','08','58','09','59','11','61','14','64','17','67','19','69'][r()*16|0]+' '+[0,1,2].map(()=>VK_LET[r()*23|0]).join('');

/* ---------------- body types ---------------- */
/* a car section at z: bottom, shoulder, belt, roof edge, roof centre (half-widths hs, hb, ht; cr = crown) */
const vkS=(z,yb,ysh,ybl,ytp,hs,hb,ht,cr=0)=>({z,p:[[hs-.035,yb],[hs,ysh],[hb,ybl],[ht,ytp],[0,ytp+cr]]});
/* segment labels: B all paint, G glass screen (side band and top band glass), O roof with side glass, W screen top only */
const vkLab=(ch,b,nb)=>ch==='G'?(b>=nb-2?'glass':'paint'):ch==='O'?(b===nb-2?'glass':'paint'):ch==='W'?(b===nb-1?'glass':'paint'):'paint';
const VKT={
  hatch:{L:3.96,W:1.74,wr:.30,wz:[1.26,-1.22],tw:.19,hub:'cap',ysh:.62,ybl:.95,
    st:[vkS(-1.98,.31,.50,.84,.84,.78,.74,.74),vkS(-1.92,.27,.58,.93,.93,.85,.82,.82),vkS(-1.74,.25,.62,.95,1.38,.87,.83,.67,.02),vkS(-.95,.23,.63,.96,1.44,.87,.83,.66,.035),
      vkS(.20,.23,.64,.93,1.45,.87,.83,.66,.035),vkS(1.00,.24,.64,.88,.88,.87,.82,.82,.02),vkS(1.78,.26,.62,.80,.80,.85,.79,.79,.015),vkS(1.93,.29,.58,.76,.76,.80,.72,.72),vkS(1.98,.31,.46,.60,.60,.72,.62,.62)],
    lab:'BGOOGBBB',doors:[[.90,-.06],[-.06,-.93]],bp:[-.06],cp:[[[-1.74,.95],[-1.06,.96],[-1.0,1.43],[-1.74,1.38]]],
    lampF:[[.40,.61,.72,.745]],lampR:[[.56,.80,.80,1.02]],grille:[.30,.60,.70],intake:[.46,.34,.47],plF:.46,plR:.58,bumpF:.56,bumpR:.62,
    rpil:[[.58,.93,.82,1.38]],mir:[.86,1.0,.92],sol:[[-1.98,-1.74,.95],[-1.74,.6,1.45],[.6,1.98,.86]],badge:'1.2 SE'},
  saloon:{L:4.46,W:1.80,wr:.31,wz:[1.40,-1.32],tw:.2,hub:'alloy',ysh:.66,ybl:1.0,
    st:[vkS(-2.23,.32,.54,.80,.80,.80,.76,.76),vkS(-2.15,.28,.62,.96,.96,.88,.84,.84,.01),vkS(-1.55,.25,.65,1.00,1.00,.90,.86,.86,.02),vkS(-.92,.23,.66,1.00,1.42,.90,.86,.68,.035),
      vkS(.30,.23,.66,.98,1.44,.90,.86,.68,.035),vkS(1.08,.24,.66,.92,.92,.90,.85,.85,.02),vkS(1.98,.26,.64,.82,.82,.88,.82,.82,.015),vkS(2.17,.29,.58,.76,.76,.82,.74,.74),vkS(2.23,.32,.46,.60,.60,.74,.64,.64)],
    lab:'BBGOGBBB',doors:[[1.0,-.02],[-.02,-.98]],bp:[-.02],cp:[[[-1.55,1.0],[-.95,1.0],[-.92,1.42]]],
    lampF:[[.42,.62,.76,.745]],lampR:[[.44,.74,.84,.93]],grille:[.34,.60,.71],intake:[.50,.35,.48],plF:.47,plR:.62,bumpF:.57,bumpR:.56,
    mir:[.89,1.05,1.0],sol:[[-2.23,-1.3,1.0],[-1.3,.7,1.44],[.7,2.23,.92]],badge:'2.0 GLX'},
  estate:{L:4.62,W:1.80,wr:.31,wz:[1.46,-1.36],tw:.2,hub:'cap',ysh:.66,ybl:.99,
    st:[vkS(-2.31,.32,.55,.82,.82,.80,.76,.76),vkS(-2.24,.28,.62,.95,.95,.88,.84,.84),vkS(-2.06,.25,.65,.98,1.42,.90,.86,.69,.03),vkS(-.90,.23,.66,.99,1.45,.90,.86,.68,.035),
      vkS(.30,.23,.66,.98,1.45,.90,.86,.68,.035),vkS(1.10,.24,.66,.92,.92,.90,.85,.85,.02),vkS(2.02,.26,.64,.82,.82,.88,.82,.82,.015),vkS(2.24,.29,.58,.76,.76,.82,.74,.74),vkS(2.31,.32,.46,.60,.60,.74,.64,.64)],
    lab:'BGOOGBBB',doors:[[1.02,0],[0,-1.0]],bp:[0,-1.0],cp:[[[-2.06,.98],[-1.80,.985],[-1.80,1.425],[-2.06,1.42]]],
    lampF:[[.42,.62,.76,.745]],lampR:[[.58,.78,.84,1.08]],grille:[.34,.60,.71],intake:[.50,.35,.48],plF:.47,plR:.62,bumpF:.57,bumpR:.64,
    rpil:[[.62,.95,.86,1.42]],mir:[.89,1.05,1.02],sol:[[-2.31,-2.0,1.0],[-2.0,.7,1.45],[.7,2.31,.92]],rails:true,badge:'1.8 ESTATE'},
  suv:{L:4.46,W:1.86,wr:.36,wz:[1.40,-1.32],tw:.23,hub:'alloy',ysh:.82,ybl:1.1,clad:true,
    st:[vkS(-2.23,.44,.70,1.00,1.00,.84,.80,.80),vkS(-2.17,.40,.78,1.08,1.08,.92,.88,.88),vkS(-2.07,.38,.80,1.10,1.64,.93,.89,.76,.02),vkS(-.80,.36,.82,1.10,1.70,.93,.89,.75,.03),
      vkS(.45,.36,.82,1.09,1.70,.93,.89,.75,.03),vkS(1.18,.38,.82,1.06,1.06,.93,.88,.88,.02),vkS(1.98,.40,.80,1.00,1.00,.92,.86,.86,.015),vkS(2.17,.42,.74,.95,.95,.86,.79,.79),vkS(2.23,.44,.62,.78,.78,.78,.70,.70)],
    lab:'BGOOGBBB',doors:[[1.10,-.02],[-.02,-1.02]],bp:[-.02,-1.02],cp:[[[-2.07,1.10],[-1.75,1.10],[-1.70,1.69],[-2.07,1.64]]],
    lampF:[[.46,.80,.80,.94]],lampR:[[.60,1.02,.86,1.24]],grille:[.40,.76,.94],intake:[.56,.48,.64],plF:.62,plR:.82,bumpF:.74,bumpR:.74,
    rpil:[[.64,1.08,.89,1.64]],mir:[.94,1.2,1.08],sol:[[-2.23,-2.0,1.1],[-2.0,.9,1.7],[.9,2.23,1.04]],rails:true,badge:'4X4'},
  cab:{L:4.58,W:1.80,wr:.33,wz:[1.46,-1.36],tw:.2,hub:'cab',ysh:.68,ybl:1.04,
    st:[vkS(-2.29,.34,.58,.86,.86,.76,.72,.72),vkS(-2.22,.30,.64,1.00,1.00,.86,.82,.82,.01),vkS(-1.96,.28,.66,1.03,1.03,.88,.84,.84,.02),vkS(-1.82,.27,.67,1.04,1.74,.89,.85,.72,.03),
      vkS(-.55,.26,.68,1.04,1.82,.90,.86,.71,.04),vkS(.55,.26,.68,1.03,1.80,.90,.86,.71,.04),vkS(1.00,.27,.68,1.02,1.02,.90,.85,.85,.03),vkS(1.86,.29,.66,.95,.95,.88,.80,.80,.03),
      vkS(2.18,.32,.60,.82,.82,.82,.74,.74,.01),vkS(2.29,.35,.50,.66,.66,.74,.64,.64)],
    lab:'BBGOOGBBB',doors:[[.92,.12],[.04,-1.02]],bp:[.08,-1.06],cp:[],
    lampF:[[.50,.60,.70,.80]],round:true,lampR:[[.66,.66,.84,.98]],grille:[.30,.48,.80],chrome:true,intake:[.40,.38,.46],plF:.44,plR:.52,bumpF:.50,bumpR:.50,
    mir:[.90,1.12,.98],sol:[[-2.29,-1.85,1.03],[-1.85,.7,1.82],[.7,2.29,.96]],taxi:true,badge:'TX'},
  van:{L:5.30,W:2.00,wr:.34,wz:[1.66,-1.62],tw:.22,hub:'steel',ysh:1.2,ybl:2.33,ppm:50,
    st:[vkS(-2.65,.42,1.2,2.28,2.33,.96,.94,.88),vkS(-2.58,.38,1.2,2.32,2.38,1.0,.98,.92,.02),vkS(-1.40,.37,1.2,2.33,2.39,1.0,.98,.92,.02),vkS(-.20,.37,1.2,2.33,2.39,1.0,.98,.92,.02),
      vkS(.95,.38,1.2,2.30,2.36,1.0,.98,.90,.02),vkS(1.80,.40,1.15,1.32,1.32,1.0,.96,.96,.02),vkS(2.40,.42,.95,1.12,1.12,.98,.92,.92,.01),vkS(2.60,.43,.74,.98,.98,.92,.84,.84),vkS(2.65,.44,.58,.80,.80,.86,.78,.78)],
    lab:'BBBBWBBB',lampF:[[.58,.86,.90,1.06]],lampR:[[.80,.92,.96,1.52]],grille:[.50,.80,1.04],intake:[.44,.50,.62],plF:.62,plR:.58,bumpF:.70,bumpR:.68,
    mir:[1.06,1.62,1.62],sol:[[-2.65,1.0,2.39],[1.0,2.65,1.14]],badge:'350 LWB'},
  bus:{L:10.40,W:2.50,wr:.50,wz:[2.45,-2.40],tw:.3,hub:'bus',ysh:.95,ybl:4.1,ppm:36,ppmF:52,ppmT:22,
    st:[[-5.2,.95],[-5.12,1],[-3.4,1],[-1.7,1],[0,1],[1.7,1],[3.4,1],[5.12,1],[5.2,.95]].map(([z,k])=>({z,p:[[1.21*k,.30],[1.25*k,.95],[1.25*k,2.35],[1.24*k,4.06],[1.14*k,4.18],[0,4.22]]})),
    lab:'BBBBBBBB',lampF:[[.86,.52,1.12,.72]],lampR:[[1.0,.70,1.16,1.40]],plF:.42,plR:.62,sol:[[-5.2,5.2,4.22]]},
  moped:{L:1.86,W:.64,wr:.21,wz:[.62,-.60],tw:.1,hub:'moped',ysh:.6,ybl:.9,ppm:110,
    st:[[-.82,.48,.76,.10,.06],[-.72,.40,.85,.16,.11],[-.20,.36,.88,.18,.14],[-.06,.33,.60,.16,.13],[.10,.30,.52,.15,.13],[.42,.30,.52,.15,.13],[.47,.32,1.02,.2,.15],[.55,.42,1.05,.15,.1]]
      .map(([z,yb,yt,hw,ht])=>({z,p:[[hw-.02,yb],[hw,yt-.06],[ht,yt],[0,yt+.012]]})),
    lab:'BBBBBBB',lampF:[[.0,.96,.06,1.02]],lampR:[[0,.72,.05,.78]],sol:[]}};
VKT.police=Object.assign({},VKT.estate,{badge:'',police:true,rails:false,hub:'alloy'});

/* ---------------- the loft: faces (pts CCW from outside, normal, picture kind, label), built once per type ---------------- */
const VK3={sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cr:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  nrm:a=>{ const l=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/l,a[1]/l,a[2]/l]; }};
function vkKind(n){ const ax=Math.abs(n[0]),ay=Math.abs(n[1]),az=Math.abs(n[2]); if(ax>=ay&&ax>=az) return n[0]>0?'sxp':'sxn'; if(ay>=az) return n[1]>0?'top':'under'; return n[2]>0?'front':'rear'; }
function vkLoft(T){ if(T.faces) return T.faces; const F=[], S=T.st, nb=S[0].p.length-1;
  const add=(pts,lab)=>{ const n3=pts.length===4?VK3.cr(VK3.sub(pts[2],pts[0]),VK3.sub(pts[3],pts[1])):VK3.cr(VK3.sub(pts[1],pts[0]),VK3.sub(pts[2],pts[0]));
    if(Math.hypot(...n3)<4e-4) return; const n=VK3.nrm(n3); F.push({pts,n,k:lab==='under'?'under':vkKind(n),lab}); };
  for(let k=0;k<S.length-1;k++){ const A=S[k],B=S[k+1];
    for(let b=0;b<nb;b++){ const lab=vkLab(T.lab[k],b,nb);
      for(const sd of [1,-1]){ const P=(st,i)=>[sd*st.p[i][0],st.p[i][1],st.z];
        sd>0?add([P(A,b),P(A,b+1),P(B,b+1),P(B,b)],lab):add([P(A,b),P(B,b),P(B,b+1),P(A,b+1)],lab); } }
    add([[-A.p[0][0],A.p[0][1],A.z],[A.p[0][0],A.p[0][1],A.z],[B.p[0][0],B.p[0][1],B.z],[-B.p[0][0],B.p[0][1],B.z]],'under'); }
  for(const [st,fr] of [[S[0],false],[S[S.length-1],true]]){ const ring=[]; for(let i=0;i<=nb;i++) ring.push([st.p[i][0],st.p[i][1],st.z]); for(let i=nb-1;i>=0;i--) ring.push([-st.p[i][0],st.p[i][1],st.z]);
    const c=[0,(st.p[0][1]+st.p[nb][1])/2,st.z]; for(let i=0;i<ring.length;i++){ const a=ring[i],b=ring[(i+1)%ring.length]; fr?add([c,a,b],'paint'):add([c,b,a],'paint'); } }
  T.faces=F; T.H=Math.max(...S.flatMap(s=>s.p.map(p=>p[1])))+(T.taxi?.16:T.police?.12:T.rails?.07:0); return F; }
/* the section at z, interpolated */
function vkSec(T,z){ const S=T.st; let k=0; while(k<S.length-2&&S[k+1].z<z) k++; const A=S[k],B=S[k+1], t=Math.max(0,Math.min(1,(z-A.z)/(B.z-A.z))); return A.p.map((p,i)=>[p[0]+(B.p[i][0]-p[0])*t,p[1]+(B.p[i][1]-p[1])*t]); }

/* the z of the windscreen's foot */
function vkZA(T){ const s=T.st.find((s,i)=>i>0&&'GW'.includes(T.lab[i-1])&&s.z>0); return s?s.z:T.L/4; }
/* ---------------- pictures and the atlas ---------------- */
/* a picture: model axes (a across, b up) -> atlas pixels. side: a=z (front to the right as seen from -x; mirrored for +x so text reads), top: a=z b=x, front/rear: a=x b=y */
const vkPX=(P,a,b)=>[P.x+(P.flip?(P.a1-a):(a-P.a0))*P.ppm, P.y+(P.b1-b)*P.ppm];
const vkAB=(P,p)=>P.k==='top'?[p[2],p[0]]:(P.k==='front'||P.k==='rear')?[p[0],p[1]]:[p[2],p[1]];
function vkReq(w,h){ const R={w:Math.ceil(w),h:Math.ceil(h),x:0,y:0}; VK.reqs.push(R); return R; }
function vkPic(k,ppm,a0,a1,b0,b1,flip=false){ const P=vkReq((a1-a0)*ppm,(b1-b0)*ppm); return Object.assign(P,{k,ppm,a0,a1,b0,b1,flip}); }
function vkVar(type,cn,o={}){ const T=VKT[type]; vkLoft(T); const L2=T.L/2+.03, W2=T.W/2+.03, H=T.H+.03, pp=T.ppm||56;
  const v={T,type,cn,col:VK_COL[cn],o,seed:7+VK.vars.length*131,pics:{}};
  v.pics.sxn=vkPic('sxn',pp,-L2,L2,0,H); if(o.asym||T===VKT.bus||T===VKT.van) v.pics.sxp=vkPic('sxp',pp,-L2,L2,0,H,true);
  v.pics.top=vkPic('top',T.ppmT||Math.min(44,pp),-L2,L2,-W2,W2); v.pics.front=vkPic('front',T.ppmF||pp,-W2,W2,0,H); v.pics.rear=vkPic('rear',T.ppmF||pp,-W2,W2,0,H,true);
  v.sw=vkReq(8,8); VK.vars.push(v); if(o.special) VK.sp[o.special]=v; else (VK.byType[type]||(VK.byType[type]=[])).push(v); return v; }
/* the variants: 8-12 London colours across the body types, with a few liveried ones */
for(const c of ['red','silver','white','blue','black','grey','champagne']) vkVar('hatch',c);
for(const c of ['silver','navy','black','burgundy','grey']) vkVar('saloon',c);
for(const c of ['silver','green','brown','white','navy']) vkVar('estate',c);
for(const c of ['black','grey','white','silver']) vkVar('suv',c);
vkVar('cab','cab'); vkVar('cab','cabgrey');
vkVar('van','vanwhite'); vkVar('van','vanwhite',{rack:true,livery:['D. MORRIS','BUILDING SERVICES','07700 900 318']}); vkVar('van','vansilver',{livery:['KHAN BROS','PLUMBING & HEATING','07700 900 742']});
vkVar('police','police'); vkVar('bus','bus'); vkVar('moped','moped');
/* one-offs placed by hand: Degsy's tired silver saloon, the estate's plumber's van and its burnt-out Escort */
vkVar('saloon','silver',{special:'degsy'}); vkVar('van','vanwhite',{special:'bakshi',livery:['K. BAKSHI','PLUMBING & HEATING','07700 900 461']}); vkVar('hatch','rust',{special:'burnt',burnt:true,hub:'burnt'});
/* burnt out: soot over everything, blistered rust, the glass gone (black holes with charred edges), no plates */
function vkBurn(v){ for(const k of ['sxn','sxp','top','front','rear']){ const P=v.pics[k]; if(!P) continue; const pp=vkPP(P), g=pp.g, r=hr(v.seed+k.length*7); pp.clip();
    vkFill(pp,v,k==='sxn'?['sxn','sxp']:[k],lab=>{ if(lab==='glass') pp.all('#070706'); });
    g.fillStyle='rgba(14,11,9,.72)'; g.fillRect(P.x,P.y,P.w,P.h);
    for(let i=0;i<P.w*P.h/40;i++){ const x=P.x+r()*P.w, y=P.y+r()*P.h, s_=1+r()*2.5; g.fillStyle=['rgba(96,54,30,.45)','rgba(70,40,24,.5)','rgba(6,5,4,.6)','rgba(120,74,44,.25)','rgba(60,58,54,.3)'][r()*5|0]; g.fillRect(x,y,s_,s_*(.6+r()*.8)); }
    for(let i=0;i<P.w/6;i++){ const x=P.x+r()*P.w; g.fillStyle='rgba(8,6,4,.5)'; g.fillRect(x,P.y,1+r()*2,P.h*(.3+r()*.6)); } pp.done(); } }
/* shared bits: wheels, tread, plain swatches, and the lit lamp pictures for the night mesh */
for(const k of ['cap','alloy','steel','cab','bus','moped','burnt']) VK.sh['hub_'+k]=vkReq(40,40);
for(const k of ['tread','under','black','chrome','alu','dark','rack','jacket','jeans','helmet','skin','glove','boxS','boxT']) VK.sh[k]=vkReq(8,8);
for(const [k,w,h] of [['head',32,16],['headR',32,32],['tail',32,16],['taxi',64,24],['taxiB',64,24],['blue',32,12],['win',64,32],['blind',128,24],['bar',64,16],['boxF',48,48]]) VK.sh[k]=vkReq(w,h);
/* pack: shelves, tallest first, 4 px gutters */
{ const L_=VK.reqs.slice().sort((a,b)=>b.h-a.h); let x=2,y=2,sh=0; for(const R of L_){ if(x+R.w+2>VK.AW){ x=2; y+=sh+4; sh=0; } R.x=x; R.y=y; x+=R.w+4; sh=Math.max(sh,R.h); } VK.AH=Math.ceil((y+sh+2)/64)*64; }
VK.tex=texS(VK.AW,VK.AH,'#26272a'); VK.g=VK.tex.c.getContext('2d');
const vkUV=(R,s,t)=>[(R.x+s*R.w)/VK.AW,1-(R.y+(1-t)*R.h)/VK.AH]; /* s right, t up, within a region */

/* ---------------- painting ---------------- */
function vkPP(P){ const g=VK.g, s=P.ppm, X=(a,b)=>vkPX(P,a,b);
  return {g,P,s,X,
    all(c){ g.fillStyle=c; g.fillRect(P.x-2,P.y-2,P.w+4,P.h+4); },
    rect(a0,b0,a1,b1,c){ const [x0,y0]=X(a0,b0),[x1,y1]=X(a1,b1); g.fillStyle=c; g.fillRect(Math.min(x0,x1),Math.min(y0,y1),Math.max(1,Math.abs(x1-x0)),Math.max(1,Math.abs(y1-y0))); },
    poly(pts,c){ g.beginPath(); pts.forEach(([a,b],i)=>{ const [x,y]=X(a,b); i?g.lineTo(x,y):g.moveTo(x,y); }); g.closePath(); g.fillStyle=c; g.fill(); },
    ell(a,b,ra,rb,c){ const [x,y]=X(a,b); g.fillStyle=c; g.beginPath(); g.ellipse(x,y,Math.max(.6,ra*s),Math.max(.6,rb*s),0,0,Math.PI*2); g.fill(); },
    ring(a,b,r,w,c){ const [x,y]=X(a,b); g.strokeStyle=c; g.lineWidth=Math.max(1,w*s); g.beginPath(); g.arc(x,y,r*s,0,Math.PI*2); g.stroke(); },
    line(a0,b0,a1,b1,c,w=1){ const [x0,y0]=X(a0,b0),[x1,y1]=X(a1,b1); g.strokeStyle=c; g.lineWidth=w; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); },
    pline(pts,c,w=1){ g.strokeStyle=c; g.lineWidth=w; g.beginPath(); pts.forEach(([a,b],i)=>{ const [x,y]=X(a,b); i?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); },
    text(str,a,b,h,c,font,maxW){ const [x,y]=X(a,b); g.save(); g.fillStyle=c; const bf=font.startsWith('bold ')?['bold ',font.slice(5)]:['',font]; g.font=`${bf[0]}${Math.max(5,Math.round(h*s))}px ${bf[1]}`; g.textAlign='center'; g.textBaseline='middle';
      const w=g.measureText(str).width, mw=(maxW||99)*s; g.translate(x,y); if(w>mw) g.scale(mw/w,1); g.fillText(str,0,0); g.restore(); },
    vg(b0,b1,stops){ const y0=X(0,b0)[1], y1=X(0,b1)[1], q=g.createLinearGradient(0,y0,0,y1); for(const [t,c] of stops) q.addColorStop(Math.max(0,Math.min(1,t)),c); return q; },
    ag(a0,a1,stops){ const x0=X(a0,0)[0], x1=X(a1,0)[0], q=g.createLinearGradient(x0,0,x1,0); for(const [t,c] of stops) q.addColorStop(Math.max(0,Math.min(1,t)),c); return q; },
    specks(n,c,seed,b0,b1,sz=1){ const r=hr(seed); g.fillStyle=c; const y0=X(0,b1)[1], y1=X(0,b0)[1]; for(let i=0;i<n;i++) g.fillRect(P.x+r()*P.w|0,(y0+r()*(y1-y0))|0,sz,sz); },
    clip(){ g.save(); g.beginPath(); g.rect(P.x,P.y,P.w,P.h); g.clip(); }, done(){ g.restore(); } }; }
/* the faces of a picture, filled by label through a clip so the looks run continuously across faces */
function vkFill(pp,v,kinds,look){ const by=new Map(); for(const f of v.T.faces){ if(!kinds.includes(f.k)) continue; (by.get(f.lab)||by.set(f.lab,[]).get(f.lab)).push(f); }
  for(const [lab,fs] of by){ const g=pp.g; g.save(); g.beginPath();
    for(const f of fs){ let q=f.pts.map(p=>pp.X(...vkAB(pp.P,p))); let A=0; for(let i=0;i<q.length;i++){ const a=q[i],b=q[(i+1)%q.length]; A+=a[0]*b[1]-b[0]*a[1]; } if(A<0) q=q.reverse(); q.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); }
    g.clip(); look(lab); g.restore(); } }
const vkDk=(c,k)=>mix(c,'#000000',k), vkLt=(c,k)=>mix(c,'#ffffff',k);
/* glass through which you can just make out the inside: seats and headrests */
function vkGlassSide(pp,T,flip){ const y0=T.ybl, y1=T.H; pp.g.fillStyle=pp.vg(y1,y0,[[0,'#2c3844'],[.45,'#1a222b'],[1,'#0f1418']]); pp.all();
  const zs=T===VKT.bus?[]:T===VKT.van?[1.15]:[.15,-.75]; for(const z of zs){ pp.ell(z,y0+.26,.1,.13,'#0a0c0e'); pp.rect(z-.24,y0,z+.12,y0+.12,'#0c0f12'); }
  for(const [a,w] of [[-.5,.28],[.9,.14],[-1.6,.1],[2.2,.2],[-3.6,.3]]) pp.poly([[a,y0],[a+w,y0],[a+w+.5,y1],[a+.5,y1]],'rgba(170,195,215,.13)'); }
function vkPaintSideLook(pp,v){ const T=v.T,c=v.col,H=T.H, sh=T.ysh, bl=T.ybl, t=y=>1-y/H;
  pp.g.fillStyle=pp.vg(H,0,[[0,vkLt(c,.18)],[t(bl),mix(c,'#dfe7ee',.3)],[t(sh)-.012,mix(c,'#eef2f6',.2)],[t(sh)-.004,vkLt(c,.32)],[t(sh)+.006,vkDk(c,.02)],[t(sh)+.02,c],[t(.42),vkDk(c,.2)],[t(.28),vkDk(c,.34)],[1,mix(c,'#2a2016',.55)]]); pp.all();
  if(VK_METAL.has(v.cn)) pp.specks(pp.P.w*pp.P.h/40|0,vkLt(c,.09),v.seed,0,H); pp.specks(pp.P.w*pp.P.h/90|0,'rgba(0,0,0,.07)',v.seed+1,0,H);
  pp.specks(pp.P.w*2|0,'rgba(60,48,36,.22)',v.seed+2,0,.34); pp.specks(pp.P.w|0,'rgba(70,56,40,.18)',v.seed+3,0,.24,2); }
function vkPaintFlatLook(pp,v,b0,b1,lt=.12){ const c=v.col; pp.g.fillStyle=pp.vg(b1,b0,[[0,mix(c,'#e2e8ee',lt+.1)],[.5,mix(c,'#e2e8ee',lt)],[1,vkDk(c,.12)]]); pp.all();
  if(VK_METAL.has(v.cn)) pp.specks(pp.P.w*pp.P.h/40|0,vkLt(c,.09),v.seed+5,-9,9); pp.specks(pp.P.w*pp.P.h/90|0,'rgba(0,0,0,.07)',v.seed+6,-9,9); }
/* number plates (UK: white front, yellow rear; black characters) */
function vkPlate(pp,cx,cy,front,reg,w=.52,h=.115){ pp.rect(cx-w/2-.008,cy-h/2-.008,cx+w/2+.008,cy+h/2+.008,'#1a1a1a'); pp.rect(cx-w/2,cy-h/2,cx+w/2,cy+h/2,front?'#ecebe4':'#e8c21e');
  pp.rect(cx-w/2,cy-h/2,cx-w/2+.045,cy+h/2,'#1f3a8a'); pp.text(reg,cx+.02,cy-.002,h*.82,'#141414','bold "Arial Narrow",Arial,sans-serif',w*.84); }
/* headlamps: a dark housing, a chrome reflector, two lenses, an amber indicator at the outer end */
function vkHeadlamp(pp,x0,y0,x1,y1,round){ const sx=Math.sign(x0+x1)||1, w=x1-x0, h=y1-y0;
  if(round){ const cx=(x0+x1)/2, cy=(y0+y1)/2, r=Math.min(w,h)/2; pp.ell(cx,cy,r+.02,r+.02,'#c8ccd0'); pp.ell(cx,cy,r,r,'#3a3e42'); pp.ell(cx,cy,r*.82,r*.82,'#dfe3e4'); pp.ell(cx-r*.15,cy+r*.15,r*.35,r*.35,'#ffffff'); pp.ell(cx+sx*(r+.08),cy-r*.4,.035,.03,'#d8862a'); return; }
  pp.poly([[x0,y0+h*.15],[x1,y0],[x1,y1],[x0,y1-h*.05]],'#24272b'); pp.poly([[x0+.015,y0+h*.25],[x1-.015,y0+h*.12],[x1-.015,y1-.015],[x0+.015,y1-h*.12]],pp.vg(y1,y0,[[0,'#e4e8ea'],[1,'#8a9096']]));
  const a=x0+w*.3, b=x0+w*.62, cy=y0+h*.52; pp.ell(a,cy,h*.26,h*.26,'#f8f8f2'); pp.ring(a,cy,h*.27,.008,'#5a5e62'); pp.ell(b,cy,h*.22,h*.22,'#f2f2ec'); pp.ring(b,cy,h*.23,.008,'#5a5e62');
  const ia=sx>0?x1-w*.16:x0, ib=sx>0?x1-.012:x0+w*.16; pp.rect(Math.min(ia,ib),y0+h*.2,Math.max(ia,ib),y1-h*.18,'#e0902a'); }
function vkTail(pp,x0,y0,x1,y1){ const h=y1-y0, w=x1-x0; pp.rect(x0-.01,y0-.01,x1+.01,y1+.01,'#1c1a1a'); pp.rect(x0,y0,x1,y1,pp.vg(y1,y0,[[0,'#d8301e'],[1,'#8a1410']]));
  pp.rect(x0+w*.08,y0+h*.12,x0+w*.4,y0+h*.42,'#ecebe6'); pp.rect(x0+w*.45,y0+h*.12,x0+w*.75,y0+h*.42,'#d8862a'); for(let i=1;i<4;i++) pp.line(x0,y0+h*i/4,x1,y0+h*i/4,'rgba(60,0,0,.5)',1); pp.rect(x0,y1-h*.12,x1,y1,'rgba(255,190,170,.35)'); }
/* the generic car painter (hatch, saloon, estate, SUV, cab, police) */
function vkPaintCar(v){ const T=v.T, c=v.col, r=hr(v.seed), reg=vkReg(r), dk=vkDk(c,.55), lt=vkLt(c,.4), blk='#121315', trim=T.clad||T===VKT.van?'#222326':blk, belt=z=>vkSec(T,z)[2][1], roof=z=>vkSec(T,z)[3][1], bot=z=>vkSec(T,z)[0][1];
  const Lf=T.L/2, Lr=-T.L/2, zsc=T.st.find((s,i)=>i>0&&'GW'.includes(T.lab[i-1])&&s.z>0), zA=zsc?zsc.z:1;
  /* the sides */
  for(const k of ['sxn','sxp']){ const P=v.pics[k]; if(!P) continue; const pp=vkPP(P); pp.clip(); vkPaintSideLook(pp,v);
    vkFill(pp,v,['sxn','sxp'].filter(q=>q===k||!v.pics.sxp),lab=>lab==='glass'?vkGlassSide(pp,T):vkPaintSideLook(pp,v));
    /* bumpers: a shut line where the bumper meets the wing, darker lower edge */
    pp.line(Lf-.32,bot(Lf-.32),Lf-.3,T.bumpF+.06,dk,1); pp.line(Lf-.3,T.bumpF+.06,Lf,T.bumpF,dk,1); pp.line(Lr+.3,bot(Lr+.3),Lr+.28,T.bumpR+.04,dk,1); pp.line(Lr+.28,T.bumpR+.04,Lr,T.bumpR,dk,1);
    if(T.clad){ pp.poly([[Lr,.38],[Lf,.42],[Lf,.56],[Lr,.52]],'#2a2b2e'); }
    /* doors: shut lines, handles, the sill */
    for(const [zf,zr] of T.doors||[]){ const y0=Math.max(bot(zf),bot(zr))+.05; pp.pline([[zf,belt(zf)-.01],[zf+.01,y0+.04],[zf-.03,y0],[zr+.03,y0],[zr,y0+.04],[zr,belt(zr)-.01]],dk,1.3);
      const hy=belt(zr)-.11; pp.rect(zr+.08,hy-.022,zr+.24,hy+.016,vkDk(c,.4)); pp.rect(zr+.09,hy+.004,zr+.23,hy+.016,T.chrome||T===VKT.cab?'#c8ccd0':lt); }
    pp.line(Lr+.6,T.ysh-.16,Lf-.6,T.ysh-.16,'rgba(0,0,0,.25)',1);
    if(T===VKT.saloon||T===VKT.estate||T===VKT.police) pp.rect(T.wz[1]+.45,.44,T.wz[0]-.45,.49,T.police?'#2a2c30':'#1a1b1d');
    /* police: Battenburg, two rows of yellow and blue squares along the body */
    if(T.police){ const q=.24; for(let z=Lr+.12,i=0;z<Lf-.2;z+=q,i++) for(let j=0;j<2;j++){ pp.rect(z,.5+j*q,z+q,.5+(j+1)*q,(i+j)%2?'#1c3c9a':'#e8d81e'); }
      pp.rect(Lr,.98,Lf,1.0,'#1c3c9a'); }
    /* wheel arches (black plastic cladding on the SUV) */
    for(const wz of T.wz){ if(T.clad) pp.ell(wz,T.wr,T.wr+.13,T.wr+.13,'#26272a'); pp.ell(wz,T.wr,T.wr+.065,T.wr+.065,vkDk(c,.3)); pp.ell(wz,T.wr,T.wr+.05,T.wr+.05,'#0b0b0c');
      const rr=hr(v.seed+wz*100); for(let i=0;i<14;i++){ const a=Math.PI*(.15+rr()*.7)*(rr()<.5?1:-1)+Math.PI/2, d=T.wr+.07+rr()*.14; pp.rect(wz+Math.cos(a)*d*(rr()<.5?1:-1),T.wr*.4+rr()*.25,wz+Math.cos(a)*d+.012,T.wr*.4+rr()*.25+.012,'rgba(70,55,40,.22)'); } }
    /* lamps wrapping round the corners */
    const lf=T.lampF[0], lr=T.lampR[0]; pp.poly([[Lf-.2,lf[1]+.01],[Lf+.02,lf[1]],[Lf+.02,lf[3]],[Lf-.24,lf[3]-.01]],T.round?'#c8ccd0':'#2a2d31');
    if(!T.round){ pp.poly([[Lf-.17,lf[1]+.025],[Lf,lf[1]+.02],[Lf,lf[3]-.015],[Lf-.2,lf[3]-.02]],'#b8bec2'); pp.rect(Lf-.08,lf[1]+.025,Lf,lf[3]-.02,'#d8862a'); }
    pp.poly([[Lr-.02,lr[1]],[Lr+.16,lr[1]+.01],[Lr+.18,lr[3]-.01],[Lr-.02,lr[3]]],'#a81c14'); pp.rect(Lr,lr[1],Lr+.1,lr[1]+(lr[3]-lr[1])*.35,'#d8862a');
    pp.rect(T.wz[0]-T.wr-.2,T.ysh-.05,T.wz[0]-T.wr-.16,T.ysh-.02,'#d8862a'); /* side repeater */
    /* the glasshouse: B pillars black, window rubbers, C/D pillars in paint */
    for(const zb of T.bp||[]){ const y0=belt(zb), y1=roof(zb); pp.poly([[zb-.05,y0],[zb+.05,y0],[zb+.05,y1+.01],[zb-.05,y1+.01]],blk); }
    for(const poly of T.cp||[]) pp.poly(poly,T===VKT.cab?blk:vkDk(c,.04));
    { const pts=[]; for(let i=0;i<T.st.length;i++){ const s=T.st[i]; if(s.p[3][1]-s.p[2][1]>.2) pts.push([s.z,s.p[3][1]-.01]); } if(pts.length) pp.pline(pts,blk,2); }
    { const zs=T.st.filter(s=>s.p[3][1]-s.p[2][1]>.2).map(s=>s.z); if(zs.length){ const z0=Math.min(...zs)-.1, z1=Math.max(...zs)+.4; pp.line(z0,belt(z0)+.012,z1,belt(z1)+.012,T.chrome||v.cn==='black'||v.cn==='cab'?'#9aa0a4':blk,2); } }
    if(T===VKT.cab){ pp.rect(-.95,belt(-.95)-.32,-.65,belt(-.95)-.22,'#e8e4d8'); pp.text('LICENSED',-.8,belt(-.95)-.27,.05,'#2a2a2a','bold Arial',.28); }
    if(k==='sxn') pp.ring(T.wz[1]+T.wr+.32,belt(T.wz[1]+.6)-.17,.05,.006,dk); /* fuel flap, offside */
    pp.done(); }
  /* the top */
  { const P=v.pics.top, pp=vkPP(P); pp.clip(); vkPaintFlatLook(pp,v,-1,1,.16);
    vkFill(pp,v,['top'],lab=>{ if(lab==='glass'){ pp.g.fillStyle=pp.ag(-T.L/2,T.L/2,[[0,'#2a3540'],[.5,'#3c4954'],[1,'#253038']]); pp.all();
        for(const z of [zA-.85,zA-1.75]) for(const x of [-.38,.38]) pp.ell(z,x,.1,.13,'rgba(8,10,12,.22)'); pp.rect(zA-.18,-.7,zA-.04,.7,'rgba(8,10,12,.3)');
        for(const [a,w] of [[-1.2,.25],[.4,.18],[1.4,.12]]) pp.poly([[a,-1],[a+w,-1],[a+w+.6,1],[a+.6,1]],'rgba(200,215,228,.16)'); } else vkPaintFlatLook(pp,v,-1,1,.16); });
    const rz=T.st.filter(s=>s.p[3][1]-s.p[2][1]>.2), z0=rz.length?rz[0].z:-T.L/2+.2, z1=rz.length?rz[rz.length-1].z:zA, rw=rz.length?Math.min(...rz.map(s=>s.p[3][0])):T.W/2-.1;
    if(rz.length){ pp.line(z0+.05,rw-.04,z1-.02,rw-.04,vkDk(c,.4),1); pp.line(z0+.05,-rw+.04,z1-.02,-rw+.04,vkDk(c,.4),1); }
    const bw=vkSec(T,zA+.2)[2][0]; pp.line(zA+.08,bw-.06,Lf-.12,bw-.1,vkDk(c,.4),1); pp.line(zA+.08,-bw+.06,Lf-.12,-bw+.1,vkDk(c,.4),1); pp.line(Lf-.12,-bw+.1,Lf-.12,bw-.1,vkDk(c,.3),1);
    pp.line(zA+.02,-.05,zA+.12,-.7,'#0c0c0e',2); pp.line(zA+.02,.6,zA+.12,-.05,'#0c0c0e',2);
    if(r()<.3&&!T.police&&T!==VKT.cab&&T!==VKT.van){ pp.rect(z0+.55,-.36,z0+1.15,.36,'#15191d'); pp.line(z0+.55,-.36,z0+1.15,-.36,'#55595e',1); }
    if(T.police) pp.text('M6',(z0+z1)/2,0,.42,'#141414','bold Arial',.9);
    if(T===VKT.van) for(let z=-2.4;z<.9;z+=.3) pp.rect(z,-.85,z+.06,.85,vkDk(c,.08));
    pp.specks(3,'rgba(235,235,225,.7)',v.seed+9,-1,1,2); pp.specks(30,'rgba(60,50,40,.18)',v.seed+10,-1,1,2); pp.done(); }
  /* the front */
  { const P=v.pics.front, pp=vkPP(P), w=T.W/2; pp.clip(); vkPaintFlatLook(pp,v,0,T.H);
    vkFill(pp,v,['front'],lab=>{ if(lab==='glass'){ const y0=T.ybl===2.33?1.32:belt(zA), y1=roof(zA-.5); pp.g.fillStyle=pp.vg(y1,y0,[[0,'#56646f'],[.5,'#2c3741'],[1,'#141a20']]); pp.all();
        for(const x of [-.38,.38]) { pp.ell(x,y0+.36,.11,.12,'#0b0d10'); pp.rect(x-.2,y0,x+.2,y0+.28,'#0e1215'); } pp.ring(-.38,y0+.2,.13,.025,'#08090a'); pp.rect(-w,y0,w,y0+.06,'#0a0b0c'); pp.rect(-.05,y1-.1,.08,y1-.05,'#0b0b0c');
        pp.poly([[-.6,y0],[-.35,y0],[.1,y1],[-.15,y1]],'rgba(205,220,232,.14)'); } else vkPaintFlatLook(pp,v,0,T.H); });
    if(T===VKT.cab||T===VKT.van||T===VKT.suv){ const y0=belt(zA); pp.line(-.05,y0+.02,-.55,y0+.12,'#0c0c0e',2); pp.line(.55,y0+.02,.05,y0+.12,'#0c0c0e',2); }
    /* bumper and the lower intake, fog lamps */
    pp.rect(-w,T.bumpF-.008,w,T.bumpF+.004,vkDk(c,.45)); const [iw,i0,i1]=T.intake;
    pp.poly([[-iw,i0],[iw,i0],[iw+.04,i1],[-iw-.04,i1]],T.chrome?'#141416':'#18191b'); for(let y=i0+.03;y<i1;y+=.035) pp.line(-iw,y,iw,y,'#2c2e31',1);
    if(T.clad||T===VKT.van){ pp.rect(-w,bot(Lf)-.02,w,T.bumpF-.03,'#26272a'); pp.poly([[-iw,i0],[iw,i0],[iw+.04,i1],[-iw-.04,i1]],'#141416'); }
    if(!T.chrome&&T!==VKT.van) for(const sx of [-1,1]) pp.ell(sx*(iw+.14),(i0+i1)/2,.045,.035,'#cfd2d0');
    if(T.chrome){ pp.rect(-w,T.bumpF-.04,w,T.bumpF+.0,'#b8bcbf'); }
    /* grille and badge */
    const [gw,g0,g1]=T.grille; if(T.chrome){ pp.ell(0,(g0+g1)/2,gw+.03,(g1-g0)/2+.03,'#c8ccd0'); pp.ell(0,(g0+g1)/2,gw,(g1-g0)/2,'#16171a'); for(let x=-gw+.04;x<gw;x+=.045) pp.line(x,g0+.03,x,g1-.03,'#a8acb0',1.4); }
    else { pp.poly([[-gw,g0],[gw,g0],[gw+.02,g1],[-gw-.02,g1]],'#141517'); for(let y=g0+.025;y<g1;y+=.03) pp.line(-gw+.02,y,gw-.02,y,T===VKT.van?'#3a3c40':'#2e3034',1.4);
      pp.line(-gw-.02,g1,gw+.02,g1,T===VKT.police?'#1c3c9a':'#9aa0a4',1.5); }
    pp.ell(0,g1-.02,.045,.032,'#d0d4d6'); pp.ell(0,g1-.02,.03,.02,'#5a6066'); pp.line(-.02,g1-.035,.02,g1-.005,'#d0d4d6',1);
    for(const L_ of T.lampF) for(const sx of [-1,1]) vkHeadlamp(pp,sx>0?L_[0]:-L_[2],L_[1],sx>0?L_[2]:-L_[0],L_[3],T.round);
    vkPlate(pp,0,T.plF,true,reg);
    if(T.police){ pp.text('POLICE',0,belt(Lf-.25)-.035,.075,'#1c3c9a','bold Arial',.7); }
    pp.specks(P.w*1.5,'rgba(40,30,20,.2)',v.seed+11,0,.45); pp.done(); }
  /* the rear */
  { const P=v.pics.rear, pp=vkPP(P), w=T.W/2; pp.clip(); vkPaintFlatLook(pp,v,0,T.H);
    vkFill(pp,v,['rear'],lab=>{ if(lab==='glass'){ pp.g.fillStyle=pp.vg(T.H,T.ybl,[[0,'#4a5762'],[.6,'#222b33'],[1,'#141a1f']]); pp.all(); for(const x of [-.4,.4]) pp.ell(x,T.ybl+.2,.1,.11,'#0b0d10');
        for(let y=T.ybl+.08;y<T.H-.1;y+=.05) pp.line(-.5,y,.5,y,'rgba(150,110,80,.35)',1); pp.poly([[-.2,T.ybl],[0,T.ybl],[.3,T.H],[.1,T.H]],'rgba(205,220,232,.12)'); } else vkPaintFlatLook(pp,v,0,T.H); });
    for(const R_ of T.rpil||[]) for(const sx of [-1,1]) pp.poly([[sx*R_[0],R_[1]],[sx*R_[2],R_[1]],[sx*(R_[2]-.17),R_[3]],[sx*(R_[0]-.08),R_[3]]],vkDk(c,.05));
    /* boot lid / tailgate shut lines, the plate recess, bumper, exhaust */
    const lr=T.lampR[0]; pp.pline([[-lr[0]+.02,T.bumpR+.02],[-lr[0]+.02,lr[3]],[lr[0]-.02,lr[3]],[lr[0]-.02,T.bumpR+.02],[-lr[0]+.02,T.bumpR+.02]],vkDk(c,.5),1.2);
    pp.rect(-w,T.bumpR-.01,w,T.bumpR+.003,vkDk(c,.45)); if(T.clad) pp.rect(-w,bot(Lr)-.02,w,T.bumpR-.04,'#26272a');
    pp.rect(-.7,bot(Lr)+.02,.7,bot(Lr)+.07,'#1c1d20'); pp.ell(-.55,bot(Lr)+.01,.045,.03,'#0a0a0a'); pp.ring(-.55,bot(Lr)+.01,.045,.01,'#6a6e72');
    for(const L_ of T.lampR) for(const sx of [-1,1]) vkTail(pp,sx>0?L_[0]:-L_[2],L_[1],sx>0?L_[2]:-L_[0],L_[3]);
    for(const sx of [-1,1]) pp.rect(sx*.62-.04,T.bumpR-.07,sx*.62+.04,T.bumpR-.045,'#8a1410');
    vkPlate(pp,0,T.plR,false,reg); if(T===VKT.cab){ pp.rect(-.16,T.plR+.1,.16,T.plR+.2,'#ecebe4'); pp.text('LICENSED HACKNEY',0,T.plR+.15,.03,'#1a1a1a','bold Arial',.3); }
    if(T.badge) pp.text(T.badge,.42,T.plR+.1,.04,'#c8ccd0','bold Arial',.3); pp.ell(0,T.plR+.11,.04,.028,'#c8ccd0');
    if(T.police){ for(let i=-4;i<4;i++){ const x=i*.2; pp.poly([[x,T.bumpR+.02],[x+.1,T.bumpR+.02],[x+.2,T.bumpR+.12],[x+.1,T.bumpR+.12]],i%2?'#d82a1a':'#e8d81e'); } pp.text('POLICE',0,T.plR+.13,.07,'#1c3c9a','bold Arial',.6); }
    if(T.ybl<1.05&&T.lab.indexOf('G')<2){ /* a hatch or estate: wiper and high brake light */ pp.line(0,T.ybl+.04,-.42,T.ybl+.16,'#0c0c0e',2); pp.rect(-.16,T.H-.08,.16,T.H-.06,'#a81c14'); }
    pp.specks(P.w*1.5,'rgba(40,30,20,.2)',v.seed+12,0,.6); pp.done(); }
  vkSwatch(v); }
function vkSwatch(v){ VK.g.fillStyle=v.col; VK.g.fillRect(v.sw.x-1,v.sw.y-1,v.sw.w+2,v.sw.h+2); }

/* the van: a car painter pass, then the cab door window, the sliding door, the rear doors and a trade livery */
function vkPaintVan(v){ vkPaintCar(v); const T=v.T, c=v.col, dk=vkDk(c,.5);
  for(const k of ['sxn','sxp']){ const pp=vkPP(v.pics[k]); pp.clip();
    pp.poly([[1.0,1.36],[1.66,1.36],[1.72,1.42],[1.12,2.14],[1.0,2.14]],'#101418'); pp.poly([[1.04,1.4],[1.6,1.4],[1.1,2.06],[1.04,2.06]],pp.vg(2.1,1.4,[[0,'#2c3844'],[1,'#141a20']]));
    pp.ell(1.18,1.62,.09,.12,'#090b0d'); pp.poly([[1.3,1.4],[1.42,1.4],[1.2,2.0],[1.1,2.0]],'rgba(190,210,225,.14)');
    pp.pline([[.95,2.2],[.95,.5],[1.85,.5],[1.85,1.3]],dk,1.3); const hy=1.22; pp.rect(1.0,hy-.02,1.16,hy+.02,'#1a1b1d');
    if(k==='sxp'){ pp.pline([[.85,2.2],[.85,.52],[-.62,.52],[-.62,2.2]],dk,1.3); pp.rect(-1.6,1.22,.9,1.25,vkDk(c,.35)); pp.rect(-.55,1.2,-.4,1.25,'#1a1b1d'); }
    pp.rect(-2.65,.5,2.65,.62,'#222326'); for(const wz of T.wz) pp.ell(wz,T.wr,T.wr+.09,T.wr+.09,'#222326'), pp.ell(wz,T.wr,T.wr+.05,T.wr+.05,'#0b0b0c');
    if(v.o.livery){ const [a,b,ph]=v.o.livery; pp.text(a,-.7,1.78,.24,'#1a3a7a','bold "LDN Oswald",Oswald,Arial Narrow,sans-serif',2.6); pp.text(b,-.7,1.52,.12,'#c8231c','bold Arial',2.4); pp.text(ph,-.7,1.34,.1,'#1a1a1a','bold Arial',1.6); }
    pp.specks(pp.P.w*3,'rgba(80,65,50,.2)',v.seed+30,0,.8,2); pp.done(); }
  { const pp=vkPP(v.pics.rear); pp.clip(); pp.line(0,.5,0,2.3,dk,1.5); pp.rect(.06,1.2,.2,1.25,'#1a1b1d'); for(const sx of [-1,1]) { pp.rect(sx*.12,1.56,sx*.78,2.08,'#11161b'); pp.rect(sx*.14,1.58,sx*.76,2.06,pp.vg(2.06,1.58,[[0,'#3a4752'],[1,'#151b21']])); }
    pp.rect(-1,.4,1,.72,'#222326'); vkPlate(pp,0,T.plR,false,vkReg(hr(v.seed))); pp.rect(-.2,2.2,.2,2.26,'#a81c14'); pp.done(); }
  { const pp=vkPP(v.pics.front); pp.clip(); pp.rect(-1,.42,1,.74,'#222326'); vkPlate(pp,0,T.plF,true,vkReg(hr(v.seed))); pp.done(); } }

/* the bus: London red, two decks of windows, doors on the nearside, a destination blind, adverts */
const VK_BUSAD=[['NOVA','PHONES · NO CONTRACT','#4a2a8a'],['LOAF','BREAD WORTH QUEUING FOR','#c86a20']];
function vkPaintBus(v){ const T=v.T, c=v.col, dk=vkDk(c,.45);
  const winRow=(pp,y0,y1,z0,z1,n,skip)=>{ const w=(z1-z0)/n; for(let i=0;i<n;i++){ const a=z0+i*w; if(skip&&skip(a,a+w)) continue; pp.rect(a+.03,y0,a+w-.03,y1,'#0e1216'); pp.rect(a+.06,y0+.03,a+w-.06,y1-.03,pp.vg(y1,y0,[[0,'#3a4550'],[.5,'#1c242c'],[1,'#12181d']])); pp.poly([[a+.2,y0+.03],[a+.4,y0+.03],[a+.75,y1-.03],[a+.55,y1-.03]],'rgba(200,215,230,.12)'); } };
  for(const k of ['sxn','sxp']){ const P=v.pics[k], pp=vkPP(P); pp.clip(); pp.g.fillStyle=pp.vg(4.3,0,[[0,vkLt(c,.12)],[.5,c],[.85,vkDk(c,.15)],[1,vkDk(c,.4)]]); pp.all();
    pp.rect(-5.3,.3,5.3,.62,'#1a1a1c'); pp.rect(-5.3,2.33,5.3,2.37,dk); pp.rect(-5.3,4.04,5.3,4.08,dk);
    const near=k==='sxp', doors=[[3.05,4.15],[-1.75,-.65]], inDoor=(a,b)=>near&&doors.some(([p,q])=>b>p&&a<q);
    winRow(pp,1.25,2.22,-4.9,4.9,8,inDoor); winRow(pp,2.72,3.86,-5.0,5.0,8);
    if(near) for(const [p,q] of doors){ pp.rect(p,.36,q,2.3,'#141618'); for(const h of [p,(p+q)/2]){ pp.rect(h+.05,.42,h+(q-p)/2-.04,2.22,pp.vg(2.2,.4,[[0,'#3a4550'],[1,'#141a20']])); pp.rect(h+.05,1.1,h+(q-p)/2-.04,1.14,'#c8ccd0'); } pp.rect(p-.04,2.28,q+.04,2.33,'#e8c040'); }
    const [ad,sub,ac]=VK_BUSAD[near?1:0]; pp.rect(-3.4,2.4,1.6,2.68,ac); pp.text(ad,-2.9,2.54,.22,'#ffffff','bold "LDN Anton",Anton,Arial Black,sans-serif',.9); pp.text(sub,-.6,2.54,.13,'#ffffff','bold Arial',3.2);
    for(const wz of T.wz){ pp.ell(wz,T.wr,T.wr+.08,T.wr+.08,'#141416'); pp.ell(wz,T.wr,T.wr+.05,T.wr+.05,'#0a0a0b'); }
    pp.text('LONDON BUS',near?3.3:-3.3,.82,.1,'rgba(240,230,200,.8)','bold Arial',1.6); pp.text('LT 412',near?-4.6:4.6,2.5,.08,'#f0e8d0','bold Arial',.6);
    pp.specks(P.w*4,'rgba(60,40,30,.2)',v.seed+40,0,.9,2); pp.done(); }
  { const pp=vkPP(v.pics.front); pp.clip(); pp.g.fillStyle=pp.vg(4.3,0,[[0,vkLt(c,.1)],[1,vkDk(c,.3)]]); pp.all();
    pp.rect(-1.18,.98,1.18,2.36,'#0e1216'); pp.rect(-1.12,1.02,1.12,2.32,pp.vg(2.32,1.0,[[0,'#56646f'],[.5,'#2c3741'],[1,'#141a20']])); pp.rect(-.03,1.02,.03,2.32,'#0e1216'); pp.rect(-1.12,1.02,1.12,1.16,'#0c0e10'); pp.ell(-.62,1.3,.14,.18,'rgba(8,10,12,.6)');
    pp.rect(-1.0,2.42,1.0,2.76,'#0a0a0a'); pp.text('8',-.82,2.59,.26,'#ffb020','bold Arial',.3); pp.text('OXFORD CIRCUS',.12,2.59,.2,'#ffb020','bold Arial',1.5);
    pp.rect(-1.16,2.86,1.16,3.92,'#0e1216'); for(const sx of [-1,1]) pp.rect(sx>0?.03:-1.12,2.9,sx>0?1.12:-.03,3.88,pp.vg(3.88,2.9,[[0,'#4a5864'],[1,'#1a222a']]));
    pp.rect(-1.25,.3,1.25,.8,'#1a1a1c'); for(const L_ of T.lampF) for(const sx of [-1,1]) vkHeadlamp(pp,sx>0?L_[0]:-L_[2],L_[1],sx>0?L_[2]:-L_[0],L_[3]);
    for(let y=.36;y<.5;y+=.03) pp.line(-.6,y,.6,y,'#2e3034',1.4); vkPlate(pp,0,T.plF,true,'LT61 BUS'); pp.done(); }
  { const pp=vkPP(v.pics.rear); pp.clip(); pp.g.fillStyle=pp.vg(4.3,0,[[0,vkLt(c,.1)],[1,vkDk(c,.3)]]); pp.all();
    pp.rect(-.9,3.0,.9,3.8,'#0e1216'); pp.rect(-.86,3.04,.86,3.76,pp.vg(3.76,3.04,[[0,'#3a4550'],[1,'#12181d']])); pp.rect(-1.1,1.6,1.1,2.6,'#2a5a8a'); pp.text('NOVA',0,2.25,.4,'#ffffff','bold "LDN Anton",Anton,Arial Black,sans-serif',1.8); pp.text('PHONES · NO CONTRACT',0,1.85,.16,'#ffffff','bold Arial',1.9);
    pp.rect(-1.25,.3,1.25,.62,'#1a1a1c'); for(let y=.7;y<1.4;y+=.06) pp.line(-.8,y,.8,y,vkDk(c,.4),1.5); vkPlate(pp,0,T.plR,false,'LT61 BUS');
    for(const L_ of T.lampR) for(const sx of [-1,1]) vkTail(pp,sx>0?L_[0]:-L_[2],L_[1],sx>0?L_[2]:-L_[0],L_[3]); pp.rect(-.3,3.88,.3,4.02,'#0a0a0a'); pp.text('8',0,3.95,.12,'#ffb020','bold Arial',.5); pp.done(); }
  { const pp=vkPP(v.pics.top); pp.clip(); vkPaintFlatLook(pp,v,-1.3,1.3,.1); for(const z of [-3,1.5]) pp.rect(z,-.4,z+.8,.4,vkDk(c,.3)); pp.specks(400,'rgba(60,50,40,.35)',v.seed+41,-1.3,1.3,2); pp.done(); }
  vkSwatch(v); }

/* the delivery moped: a white scooter with a black seat, a delivery box and its rider */
function vkPaintMoped(v){ const T=v.T, c=v.col;
  for(const k of ['sxn']){ const pp=vkPP(v.pics[k]); pp.clip(); pp.g.fillStyle=pp.vg(1.2,0,[[0,vkLt(c,.2)],[.6,c],[1,vkDk(c,.3)]]); pp.all();
    pp.poly([[-.72,.84],[-.22,.88],[-.18,.93],[-.7,.92]],'#141416'); pp.rect(-.2,.30,.46,.36,'#1a1a1c'); pp.poly([[-.8,.42],[-.4,.36],[-.2,.5],[-.78,.6]],'#2a2b2e');
    pp.rect(.47,.55,.66,.62,'#c8231c'); pp.rect(-.8,.72,-.74,.78,'#b81c14'); pp.done(); }
  for(const k of ['top','front','rear']){ const pp=vkPP(v.pics[k]); pp.clip(); vkPaintFlatLook(pp,v,0,1.2); if(k==='top') pp.rect(-.7,-.12,-.2,.12,'#141416');
    if(k==='front'){ pp.rect(-.16,.55,.16,.62,'#c8231c'); pp.ell(0,1.01,.06,.04,'#e8ecee'); } if(k==='rear'){ pp.rect(-.06,.72,.06,.78,'#b81c14'); pp.rect(-.1,.56,.1,.66,'#e8c21e'); pp.text('LD17',0,.61,.06,'#141414','bold Arial',.18); } pp.done(); }
  vkSwatch(v); }

/* shared: hubs, tread, swatches, lit lamps */
function vkPaintShared(){ const g=VK.g, S=VK.sh;
  const sw=(k,c)=>{ const R=S[k]; g.fillStyle=c; g.fillRect(R.x-1,R.y-1,R.w+2,R.h+2); };
  sw('tread','#1a1a1b'); sw('under','#0d0d0e'); sw('black','#131416'); sw('chrome','#b4b9bd'); sw('alu','#8e9398'); sw('dark','#08090a'); sw('rack','#5a5e62');
  sw('jacket','#20242c'); sw('jeans','#2a3448'); sw('helmet','#0e0f12'); sw('skin','#a86a48'); sw('glove','#141414'); sw('boxS','#1aa0a0'); sw('boxT','#168a8a');
  const hub=(k,fn)=>{ const R=S['hub_'+k], cx=R.x+R.w/2, cy=R.y+R.h/2, r=R.w/2; g.fillStyle='#121213'; g.fillRect(R.x-1,R.y-1,R.w+2,R.h+2); fn(cx,cy,r); };
  const circ=(x,y,r,c)=>{ g.fillStyle=c; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); };
  hub('cap',(x,y,r)=>{ circ(x,y,r*.66,'#9aa0a6'); circ(x,y,r*.6,'#c4c9cd'); for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; g.fillStyle='#7a8086'; g.fillRect(x+Math.cos(a)*r*.42-1,y+Math.sin(a)*r*.42-1,3,3); } circ(x,y,r*.16,'#5a6066'); });
  hub('alloy',(x,y,r)=>{ circ(x,y,r*.7,'#b8bec4'); circ(x,y,r*.62,'#2a2c30'); g.strokeStyle='#c8ced2'; g.lineWidth=r*.16; for(let i=0;i<5;i++){ const a=i/5*Math.PI*2-Math.PI/2; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*r*.62,y+Math.sin(a)*r*.62); g.stroke(); } circ(x,y,r*.15,'#9aa0a6'); });
  hub('steel',(x,y,r)=>{ circ(x,y,r*.66,'#55595e'); circ(x,y,r*.5,'#3a3d41'); for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; circ(x+Math.cos(a)*r*.33,y+Math.sin(a)*r*.33,r*.07,'#1a1b1d'); } circ(x,y,r*.2,'#6a6e72'); });
  hub('burnt',(x,y,r)=>{ circ(x,y,r,'#2a1e16'); circ(x,y,r*.82,'#5a3a26'); circ(x,y,r*.66,'#3a2a20'); { const q=hr(77); for(let i=0;i<30;i++){ g.fillStyle=i%2?'#7a4a2a':'#1a120c'; g.fillRect(x-r+q()*2*r,y-r+q()*2*r,2,2); } } circ(x,y,r*.18,'#1a120c'); });
  hub('cab',(x,y,r)=>{ circ(x,y,r*.66,'#c8ccd0'); circ(x,y,r*.56,'#9aa0a6'); circ(x,y,r*.3,'#d8dcdf'); circ(x,y,r*.12,'#3a3d41'); });
  hub('bus',(x,y,r)=>{ circ(x,y,r*.7,'#2a2b2e'); circ(x,y,r*.5,'#8a1a16'); for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; circ(x+Math.cos(a)*r*.36,y+Math.sin(a)*r*.36,r*.05,'#c8ccd0'); } circ(x,y,r*.18,'#c8ccd0'); });
  hub('moped',(x,y,r)=>{ circ(x,y,r*.7,'#3a3d41'); for(let i=0;i<5;i++){ const a=i/5*Math.PI*2; g.strokeStyle='#8a8e92'; g.lineWidth=2; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*r*.66,y+Math.sin(a)*r*.66); g.stroke(); } });
  const lit=(k,fn)=>{ const R=S[k]; g.save(); g.beginPath(); g.rect(R.x,R.y,R.w,R.h); g.clip(); g.clearRect(R.x-2,R.y-2,R.w+4,R.h+4); fn(R.x,R.y,R.w,R.h); g.restore(); };
  const rad=(x,y,r,stops)=>{ const q=g.createRadialGradient(x,y,0,x,y,r); for(const [t,c] of stops) q.addColorStop(t,c); g.fillStyle=q; };
  lit('head',(x,y,w,h)=>{ rad(x+w/2,y+h/2,w*.6,[[0,'#ffffff'],[.45,'#fff4d8'],[1,'#c8b890']]); g.fillRect(x,y,w,h); g.fillStyle='rgba(255,255,255,.9)'; g.beginPath(); g.arc(x+w*.3,y+h/2,h*.32,0,7); g.arc(x+w*.62,y+h/2,h*.26,0,7); g.fill(); g.fillStyle='#ffb040'; g.fillRect(x+w*.86,y+h*.2,w*.14,h*.6); });
  lit('headR',(x,y,w,h)=>{ rad(x+w/2,y+h/2,w/2,[[0,'#ffffff'],[.6,'#fff2d0'],[.92,'#d8c8a0'],[1,'rgba(0,0,0,0)']]); g.beginPath(); g.arc(x+w/2,y+h/2,w/2-1,0,7); g.fill(); });
  lit('tail',(x,y,w,h)=>{ rad(x+w/2,y+h/2,w*.6,[[0,'#ff6a50'],[.5,'#ff2a18'],[1,'#a01008']]); g.fillRect(x,y,w,h); g.fillStyle='rgba(120,0,0,.5)'; for(let i=1;i<4;i++) g.fillRect(x,y+h*i/4,w,1); });
  const taxi=(k,lit_)=>lit(k,(x,y,w,h)=>{ g.fillStyle=lit_?'#ffd030':'#d8a818'; g.fillRect(x,y,w,h); if(lit_){ rad(x+w/2,y+h/2,w*.6,[[0,'rgba(255,250,200,.8)'],[1,'rgba(255,200,40,0)']]); g.fillRect(x,y,w,h); } g.fillStyle='#141008'; g.font=`bold ${h*.78|0}px "LDN Archivo",Arial Black,Arial,sans-serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('TAXI',x+w/2,y+h/2+1,w*.86); });
  taxi('taxi',true); taxi('taxiB',false);
  lit('blue',(x,y,w,h)=>{ rad(x+w/2,y+h/2,w*.6,[[0,'#e8f0ff'],[.4,'#4a8aff'],[1,'#1a3aa8']]); g.fillRect(x,y,w,h); });
  lit('bar',(x,y,w,h)=>{ g.fillStyle='#1a1b1e'; g.fillRect(x,y,w,h); for(let i=0;i<4;i++){ g.fillStyle=i===1||i===2?'#c8ccd0':'#2a4aa8'; g.fillRect(x+2+i*w/4,y+2,w/4-4,h-4); } });
  lit('win',(x,y,w,h)=>{ const q=g.createLinearGradient(0,y,0,y+h); q.addColorStop(0,'#f4e4bc'); q.addColorStop(.6,'#c8a46c'); q.addColorStop(1,'#8a6a44'); g.fillStyle=q; g.fillRect(x,y,w,h); g.fillStyle='#fffaf0'; g.fillRect(x,y+1,w,2);
    for(let i=0;i<4;i++){ g.fillStyle='#3a2a3a'; g.fillRect(x+3+i*16,y+h*.72,11,h*.28); g.fillStyle='#4a3a5a'; g.fillRect(x+4+i*16,y+h*.74,9,3); } g.fillStyle='rgba(30,22,18,.85)'; for(const [px,pw] of [[9,7],[42,6]]){ g.beginPath(); g.arc(x+px,y+h*.6,pw/2,0,7); g.fill(); g.fillRect(x+px-pw/2-1,y+h*.66,pw+2,h*.2); } });
  lit('blind',(x,y,w,h)=>{ g.fillStyle='#0a0806'; g.fillRect(x,y,w,h); g.fillStyle='#ffc040'; g.font=`bold ${h*.7|0}px Arial,sans-serif`; g.textBaseline='middle'; g.textAlign='left'; g.fillText('8',x+4,y+h/2+1); g.textAlign='center'; g.fillText('OXFORD CIRCUS',x+w*.58,y+h/2+1,w*.78); });
  lit('boxF',(x,y,w,h)=>{ g.fillStyle='#1aa0a0'; g.fillRect(x,y,w,h); g.fillStyle='#ffffff'; g.font=`bold ${h*.34|0}px "LDN Lilita",Arial Black,sans-serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('SCOFF',x+w/2,y+h*.45,w*.9); g.fillRect(x+w*.2,y+h*.68,w*.6,2); }); }
function vkPaintAll(){ const g=VK.g; g.fillStyle='#26272a'; g.fillRect(0,0,VK.AW,VK.AH);
  for(const v of VK.vars){ if(v.T===VKT.bus) vkPaintBus(v); else if(v.T===VKT.moped) vkPaintMoped(v); else if(v.T===VKT.van) vkPaintVan(v); else vkPaintCar(v); if(v.o.burnt) vkBurn(v); }
  vkPaintShared(); grain(g,6,4242); }
vkPaintAll();
VK.m=M(VK.tex,{}); VK.mL=nightM(VK.tex,{unlit:true,cut:true},.5);
if(typeof FONTS_READY!=='undefined'&&FONTS_READY&&FONTS_READY.then) FONTS_READY.then(()=>{ vkPaintAll(); VK.tex.f=-1; if(typeof retex==='function') retex(VK.tex); });

/* ---------------- geometry: body + parts (one atlas material) and the lit mesh (nightM) ---------------- */
function vkTri(G,a,b,c,ua,ub,uc,want,n){ let N_=VK3.nrm(VK3.cr(VK3.sub(b,a),VK3.sub(c,a))); if(want&&VK3.dot(N_,want)<0){ [b,c]=[c,b]; [ub,uc]=[uc,ub]; N_=[-N_[0],-N_[1],-N_[2]]; } const o=G.P.length/3, nn=n||N_; G.v(a,nn,ua); G.v(b,nn,ub); G.v(c,nn,uc); G.I.push(o,o+1,o+2); }
/* a quad facing n (U = viewer's right, V = up), centre c, size su x sv; uv from a region (or a fixed uv) */
function vkQuad(G,c,n,su,sv,R,pts){ const up=Math.abs(n[1])>.9?[0,0,-1]:[0,1,0], U=VK3.nrm(VK3.cr(up,n)), V=VK3.cr(n,U);
  const P_=pts||[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[c[0]+U[0]*a*su/2+V[0]*b*sv/2,c[1]+U[1]*a*su/2+V[1]*b*sv/2,c[2]+U[2]*a*su/2+V[2]*b*sv/2]);
  const uv=Array.isArray(R)?[R,R,R,R]:[vkUV(R,0,0),vkUV(R,1,0),vkUV(R,1,1),vkUV(R,0,1)];
  vkTri(G,P_[0],P_[1],P_[2],uv[0],uv[1],uv[2],n,n); vkTri(G,P_[0],P_[2],P_[3],uv[0],uv[2],uv[3],n,n); }
const vkC=R=>vkUV(R,.5,.5);
function vkBox(G,c,s,R){ const RR=f=>typeof R==='function'?R(f):R; for(const n of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){ const fc=[c[0]+n[0]*s[0]/2,c[1]+n[1]*s[1]/2,c[2]+n[2]*s[2]/2];
  const su=n[0]?s[2]:s[0], sv=n[1]?s[2]:s[1]; const r_=RR(n); if(r_===null) continue; vkQuad(G,fc,n,su,sv,r_&&r_.w?r_:vkC(r_||VK.sh.black)); } }
function vkWheel(G,x,cy,cz,r,w,sd,hub,both){ const N_=10, ring=xx=>Array.from({length:N_},(_,i)=>{ const a=i/N_*Math.PI*2; return [xx,cy+Math.sin(a)*r,cz+Math.cos(a)*r]; });
  const o=ring(x), inn=ring(x-sd*w), R=VK.sh['hub_'+hub], uvA=i=>{ const a=i/N_*Math.PI*2; return vkUV(R,.5+Math.cos(a)*.5,.5+Math.sin(a)*.5); }, tr=vkC(VK.sh.tread);
  for(let i=0;i<N_;i++){ const j=(i+1)%N_; vkTri(G,[x,cy,cz],o[i],o[j],vkUV(R,.5,.5),uvA(i),uvA(j),[sd,0,0]);
    if(both) vkTri(G,[x-sd*w,cy,cz],inn[i],inn[j],vkUV(R,.5,.5),uvA(i),uvA(j),[-sd,0,0]);
    const a=(i+.5)/N_*Math.PI*2, rn=[0,Math.sin(a),Math.cos(a)]; vkTri(G,o[i],inn[i],inn[j],tr,tr,tr,rn,rn); vkTri(G,o[i],inn[j],o[j],tr,tr,tr,rn,rn); } }
/* where a ray along z from (x,y) meets the body's front (dir 1) or rear (dir -1) */
function vkCastZ(T,x,y,dir){ let best=null; for(const f of T.faces){ if(f.n[2]*dir<.15) continue; const p=f.pts, tris=p.length===4?[[p[0],p[1],p[2]],[p[0],p[2],p[3]]]:[p];
    for(const [a,b,c] of tris){ const d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]); if(Math.abs(d)<1e-9) continue; const l1=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/d, l2=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/d, l3=1-l1-l2;
      if(l1<-.02||l2<-.02||l3<-.02) continue; const z=l1*a[2]+l2*b[2]+l3*c[2]; if(best===null||z*dir>best*dir) best=z; } }
  return best===null?dir*T.L/2:best; }
function vkLamp(G,T,x0,y0,x1,y1,dir,R){ const pts=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([x,y])=>[x,y,vkCastZ(T,x,y,dir)+dir*.014]); const n=[0,0,dir];
  if(dir<0) [pts[0],pts[1],pts[2],pts[3]]=[pts[1],pts[0],pts[3],pts[2]]; vkQuad(G,null,n,0,0,R,pts); }
function vkGeo(v){ if(v.geo) return v.geo; const T=v.T, g=new Geo(), lg=new Geo(), pics=v.pics;
  for(const f of T.faces){ const P=f.k==='under'?null:f.k==='sxp'?(pics.sxp||pics.sxn):pics[f.k], uv=p=>{ if(!P) return vkC(VK.sh.under); const [a,b]=vkAB(P,p), [x,y]=vkPX(P,a,b); return [x/VK.AW,1-y/VK.AH]; };
    const o=g.P.length/3; for(const p of f.pts) g.v(p,f.n,uv(p)); if(f.pts.length===4) g.I.push(o,o+1,o+2,o,o+2,o+3); else g.I.push(o,o+1,o+2); }
  /* wheels */
  const mop=T===VKT.moped; for(const wz of T.wz) for(const sd of mop?[1]:[1,-1]){ const hw=mop?T.tw/2:vkSec(T,wz)[1][0]+.006; vkWheel(g,sd*hw,T.wr,wz,T.wr,T.tw,sd,v.o.hub||T.hub,mop);
    if(T===VKT.bus&&wz<0) vkWheel(g,sd*(hw-T.tw-.02),T.wr,wz,T.wr*.98,T.tw,sd,'bus'); }
  const sw=vkC(v.sw), blk=vkC(VK.sh.black);
  /* mirrors: housing in paint (black on vans and the bus), black glass facing back */
  const zA=vkZA(T), ms=vkSec(T,zA-.2), mir=T===VKT.van?T.mir:T.mir?[ms[2][0]+.06,ms[2][1]+.05,zA-.2]:null;
  if(mir) for(const sd of [1,-1]){ const [mx,my,mz]=mir, van=T===VKT.van; vkBox(g,[sd*mx,my,mz],van?[.09,.3,.12]:[.12,.1,.13],n=>n[2]<0?VK.sh.dark:van?VK.sh.black:v.sw); vkBox(g,[sd*(mx-.07),my-.03,mz+.02],[.06,.04,.06],VK.sh.black); }
  /* bus: the bull-horn mirrors hanging over the front corners */
  if(T===VKT.bus) for(const sd of [1,-1]){ vkBox(g,[sd*1.32,3.0,4.95],[.06,.06,.5],VK.sh.black); vkBox(g,[sd*1.36,2.62,4.75],[.08,.36,.16],n=>n[2]<0?VK.sh.dark:VK.sh.black); }
  /* roof rails, the van's ladder rack, the TAXI sign, the police light bar */
  const rz=T.st.filter(s=>s.p[3][1]-s.p[2][1]>.2), rf=rz.length?rz[rz.length-1].z:0, rr=rz.length?rz[0].z:0, ry=rz.length?Math.max(...rz.map(s=>s.p[3][1])):0, rw=rz.length?Math.min(...rz.map(s=>s.p[3][0])):0;
  if(T.rails) for(const sd of [1,-1]){ vkBox(g,[sd*(rw-.06),ry+.05,(rr+rf)/2],[.04,.03,rf-rr-.2],VK.sh.alu); for(const z of [rr+.15,rf-.15]) vkBox(g,[sd*(rw-.06),ry+.02,z],[.05,.05,.06],VK.sh.black); }
  if(v.o.rack){ for(const sd of [1,-1]) vkBox(g,[sd*.78,2.5,-.8],[.05,.05,3.4],VK.sh.rack); for(const z of [-2.3,-1.2,-.1,.8]) { vkBox(g,[0,2.5,z],[1.62,.04,.05],VK.sh.rack); for(const sd of [1,-1]) vkBox(g,[sd*.78,2.44,z],[.04,.1,.04],VK.sh.rack); }
    vkBox(g,[.3,2.56,-.8],[.42,.05,3.1],VK.sh.alu); for(let z=-2.2;z<.6;z+=.56) vkBox(g,[.3,2.58,z],[.42,.02,.03],VK.sh.rack); }
  if(T.taxi){ const ty=ry+.04, tz=rf-.22; vkBox(g,[0,ty+.07,tz],[.5,.14,.16],n=>n[2]?VK.sh.taxiB:n[1]>0?VK.sh.taxiB:VK.sh.black); vkQuad(lg,[0,ty+.07,tz+.081],[0,0,1],.48,.12,VK.sh.taxi); vkQuad(lg,[0,ty+.07,tz-.081],[0,0,-1],.48,.12,VK.sh.taxi); }
  if(T.police){ const ty=ry+.02, tz=(rr+rf)/2+.25; vkBox(g,[0,ty+.02,tz],[1.1,.04,.32],VK.sh.black); vkBox(g,[0,ty+.09,tz],[1.06,.1,.28],n=>n[1]?VK.sh.black:VK.sh.bar);
    for(const sx of [-1,1]){ vkQuad(lg,[sx*.36,ty+.09,tz+.142],[0,0,1],.3,.08,VK.sh.blue); vkQuad(lg,[sx*.36,ty+.09,tz-.142],[0,0,-1],.3,.08,VK.sh.blue); vkQuad(lg,[sx*.532,ty+.09,tz],[sx,0,0],.26,.08,VK.sh.blue); vkQuad(lg,[sx*.36,ty+.141,tz],[0,1,0],.3,.24,VK.sh.blue); } }
  /* the moped: handlebars, mirrors and the steering column (the rider is a rig person, 48f3-riders.js) */
  if(mop){ const J=VK.sh; vkBox(g,[0,1.12,.52],[.62,.035,.035],J.black); for(const sd of [1,-1]){ vkBox(g,[sd*.31,1.12,.52],[.05,.05,.12],J.black); vkBox(g,[sd*.24,1.3,.5],[.012,.18,.012],J.alu); vkBox(g,[sd*.25,1.4,.5],[.08,.05,.02],J.black); }
    vkBox(g,[0,1.06,.58],[.16,.12,.1],n=>v.sw); vkBox(g,[0,.62,.56],[.05,.6,.05],J.alu); }
  /* the lit mesh: head and tail lamps on the body's front and rear faces; the bus's windows and blind */
  for(const L_ of T.lampF||[]) for(const sx of mop?[1]:[1,-1]){ const a=sx*L_[0], b=sx*L_[2]; vkLamp(lg,T,Math.min(a,b)-(mop?.05:0),L_[1],Math.max(a,b),L_[3],1,T.round?VK.sh.headR:VK.sh.head); }
  for(const L_ of T.lampR||[]) for(const sx of mop?[1]:[1,-1]){ const a=sx*L_[0], b=sx*L_[2]; vkLamp(lg,T,Math.min(a,b)-(mop?.05:0),L_[1],Math.max(a,b),L_[3],-1,VK.sh.tail); }
  if(T===VKT.bus){ const W_=VK.sh.win, x=1.262; for(const sd of [1,-1]){ const n=[sd,0,0];
      for(let i=0;i<8;i++){ const w=9.8/8, a=-4.9+i*w; if(!(sd>0&&[[3.05,4.15],[-1.75,-.65]].some(([p,q])=>a+w>p&&a<q))) vkQuad(lg,[sd*x,1.735,a+w/2],n,w-.12,.91,W_); }
      for(let i=0;i<8;i++){ const w=10/8, a=-5+i*w; vkQuad(lg,[sd*(x-.005),3.29,a+w/2],n,w-.12,1.08,W_); } }
    for(const sx of [-1,1]) vkQuad(lg,[sx*.575,3.39,5.215],[0,0,1],1.06,.94,W_); vkQuad(lg,[0,2.59,5.215],[0,0,1],2.0,.32,VK.sh.blind); vkQuad(lg,[0,3.39,-5.215],[0,0,-1],1.7,.7,W_); }
  return v.geo={g,lg,len:T.L,wid:T.W}; }

/* the lamps glow from dusk to dawn; a police car with stars flashes them (and its blues) day or night */
function vkLit(v){ const L_=v.root.kids[1]; if(!L_) return; L_.vis=v.kind==='police'&&GAME.G.stars>0?Math.sin(LIFE.t*14)>0:TOD.day<.6; }
/* ---------------- choosing, and the parked emitter ---------------- */
function vkPick(kind,r){ const B=VK.byType, one=a=>a[r()*a.length|0];
  if(kind==='car'){ const u=r(); return one(B[u<.36?'hatch':u<.58?'saloon':u<.8?'estate':'suv']); }
  if(kind==='park'){ const u=r(); return u<.07?one(B.van):u<.12?one(B.cab):vkPick('car',r); }
  return one(B[kind]||B.hatch); }
/* a parked vehicle, baked into its chunk; standable bonnet, roof and boot (cars are parkour props) */
function vkPark(x,z,v,yaw=0,y0=PAVE_Y){ const G=vkGeo(v), T=v.T; eGeo(G.g,VK.m,x,y0,z,yaw);
  const cs=Math.cos(yaw), sn=Math.sin(yaw); for(const [z0,z1,y] of T.sol){ const zc=(z0+z1)/2; solR(x+sn*zc,z+cs*zc,T.W*.96,z1-z0,y0+y,yaw); } }
/* tools: every variant in a row (the line-up shots), with traffic and people out of the way */
window.__vk={VK,VKT,vkGeo,vkPick,lineup(x0=-150,z=7.2){ LIFE.on=false; for(const v of CAR_POOL){ v.alive=false; v.root.vis=false; } for(const p of PED_POOL){ p.alive=false; for(const k of ['root','n','node']) if(p[k]&&p[k].vis!==undefined) p[k].vis=false; }
  if(VK.line) return VK.line.map(o=>[o.v.type,o.v.cn,o.x]); VK.line=[]; let x=x0; for(const v of VK.vars){ const G=vkGeo(v), n=N(LIFE.root); n.dyn=true; x+=G.len/2; n.p=[x,0,z]; mk(G.g,VK.m,n); mk(G.lg,VK.mL,n); if(v.type==='moped'&&typeof makeRider==='function') makeRider(n); VK.line.push({n,x:Math.round(x*10)/10,v}); x+=G.len/2+2.6; }
  return VK.line.map(o=>[o.v.type,o.v.cn,o.x]); }, rot(y){ for(const o of VK.line||[]){ o.n.r=[0,y,0]; o.n.kids[1].vis=TOD.day<.6; } }};
/* the start street's hand-placed cars (47-dressing.js) and the estate's two (48-game.js) wear kit bodies. Degsy's saloon keeps
   its blinking hazard lamps (moved onto the corners of the new body); the cab keeps its lamps lit for the drop-off. */
{ const kitIn=(n,v,ry,lit)=>{ const G=vkGeo(v); mk(G.g,VK.m,n,0,0,0,0,ry,0); if(lit) mk(G.lg,VK.mL,n,0,0,0,0,ry,0); };
  const C=DRESS.cars; if(C){ const keep=k=>k.mesh&&C.degsy.ind.includes(k.mesh.mats[0]);
    for(const k of C.degsy.n.kids) if(!keep(k)) k.vis=false; else { const sx=Math.sign(k.p[0]), sz=Math.sign(k.p[2]); k.p=[sx*2.235,sx<0?.69:.84,sz*.71]; }
    for(const k of C.cab.n.kids) k.vis=false;
    kitIn(C.degsy.n,VK.sp.degsy,-Math.PI/2,false); kitIn(C.cab.n,VK.byType.cab[0],-Math.PI/2,true); }
  const PY=PAVE_Y, EST=N(STREET); mk(vkGeo(VK.sp.burnt).g,VK.m,EST,-6.3,PY-.07,-16.15,0,Math.PI/2+.05,0.025); mk(vkGeo(VK.sp.bakshi).g,VK.m,EST,-9.0,PY,-22.4,0,-Math.PI/2,0); }
