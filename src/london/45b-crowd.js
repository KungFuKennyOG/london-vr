/* =====================================================================================================
   THE CROWD: the people of Bethnal Green, on the same Stairwell rig as the cast (skinned bodies, painted faces,
   painted garments). Thirty-two adults, each one a person rather than a shuffle of parts, in a mix that follows the
   2021 census for the ward (about a third Bangladeshi, a quarter White British, then other White, Black African and
   Caribbean, Chinese and mixed) and the street's trades: East End nans with tartan trolleys, uncles in topi and kurta,
   aunties in hijab and sari, builders in hi-vis, the Columbia Road traders, lads by the chicken shop, office workers,
   delivery riders on foot, a cabbie, dog walkers, a nurse off a night shift. No children anywhere.
   Each person is baked into ONE skinned mesh with its own texture atlas (body, face, hands, hats, props), so a person
   costs one draw call instead of twenty. The life system (48f2-crowd.js) builds them a few a frame and pools them.
   ===================================================================================================== */
/* ---------- where the crowd can do things: captured while the hub is built. The builders are hoisted function
   declarations in files other people own, so they're wrapped here (this file runs first) and only record what they place. ---------- */
const CROWD_SPOTS={shops:[],benches:[],stops:[],kiosks:[]};
{ let shopNow=null; const _gs=groundShop,_tr=tradeRoom,_eg=eGrid,_be=bench,_bs=busStop,_ki=kiosk;
  groundShop=function(L,lx0,lz0,lx1,lz1,gH,fx,fz,U,out,fw){ shopNow={x:fx,z:fz,ox:out[0],oz:out[2],ux:U[0],uz:U[2],w:fw,trade:null,shut:false,street:L&&L.S?L.S[0]:''};
    try{ return _gs.apply(this,arguments); } finally { CROWD_SPOTS.shops.push(shopNow); shopNow=null; } };
  tradeRoom=function(k){ if(shopNow&&!shopNow.trade) shopNow.trade=k; return _tr.apply(this,arguments); };
  eGrid=function(m){ if(shopNow&&!shopNow.shut&&SHUT.indexOf(m)>=0) shopNow.shut=true; return _eg.apply(this,arguments); };
  bench=function(x,z,ry){ CROWD_SPOTS.benches.push({x,z,yaw:ry}); return _be.apply(this,arguments); };
  busStop=function(x,z,ax,side){ CROWD_SPOTS.stops.push({x,z,ax,side,q:[]}); return _bs.apply(this,arguments); };
  kiosk=function(x,z){ CROWD_SPOTS.kiosks.push({x,z}); return _ki.apply(this,arguments); }; }

/* ---------- the wardrobe: painted tops, legs and sleeves from a short spec ---------- */
const FAB={puffer:'nylon',hoodie:'knit',track:'poly',coat:'wool',mac:'poly',suit:'wool',shirt:'cotton',kurta:'cotton',sari:'cotton',abaya:'cotton',cardi:'knit',fleece:'knit',chore:'twill',scrubs:'cotton',bomber:'nylon',leather:'leather',runner:'poly',wax:'twill',quilt:'nylon',courier:'nylon',check:'cotton',jumper:'knit',tweed:'wool',
  jeans:'denim',jogs:'knit',trousers:'twill',chinos:'twill',tights:'knit',leggings:'knit',work:'cordura',skirt:'wool'};
const LONGTOP=new Set(['kurta','sari','abaya']);
function crowdTorso(id,seed,S){ const tc=S.tc, dk=mix(tc,'#000000',.3), lt=mix(tc,'#ffffff',.25), c2=S.tc2||dk;
  return torsoP(id,seed,(x,y)=>{
    if(y>T3.belt+4&&!LONGTOP.has(S.top)&&!S.longCoat) return [S.lc,FAB[S.legs]||'twill',.6];
    if(S.top==='shirt'||S.top==='suit'||S.top==='check'){ if(vNeck(x,y,9,26)) return S.top==='suit'?['#e8e8ea','cotton',.3]:sk(id); }
    else if(S.top==='cardi'||S.top==='scrubs'){ if(vNeck(x,y,10,30)) return S.inner?[S.inner,'cotton',.3]:sk(id); }
    else if(crewNeck(x,y,12,9)) return S.neckC?[S.neckC,'cotton',.3]:sk(id);
    if(S.top==='check'){ const u=((x>>3)+(y>>3))%2, v=(x>>3)%2, w=(y>>3)%2; return [v&&w?mix(tc,'#000',.45):u?tc:mix(tc,'#ffffff',.18),'cotton',.5]; }
    if(S.top==='sari'){ /* the pallu: a band from the left hip over the right shoulder, gold-bordered */ const d=(x-64)*.9+(y-150)*.55; if(Math.abs(d)<16) return [Math.abs(d)>12?'#d8b040':c2,'cotton',.4]; }
    if(S.top==='quilt'&&((x+y)%14<2||(x-y+280)%14<2)) return [dk,'nylon',.4];
    return [tc,FAB[S.top]||'cotton',S.top==='puffer'||S.top==='quilt'?.35:.5]; },
    {folds:S.top==='puffer'?6:S.top==='leather'?8:14,decor:I=>{ neckShadow(I); const t=S.top;
      if(t==='puffer'){ quilt(I,T3.neck+26,T3.belt+6,20,dk); softLine(I,64,T3.neck+10,64,T3.belt+6,dk,.95,1.6); softRect(I,0,T3.neck,128,12,dk,.9,1.4); }
      if(t==='hoodie'){ softRect(I,36,T3.nav-36,56,30,dk,.7,2); for(const x of [58,70]) softLine(I,x,T3.neck+4,x,T3.neck+30,lt,.9,1); softRect(I,0,T3.belt-6,128,10,dk,.8,2); }
      if(t==='track'){ softLine(I,64,T3.neck+8,64,T3.belt-8,'#bdbdbd',.9,1.2); for(const x of [30,98]) softLine(I,x,T3.neck+12,x,T3.belt-10,S.stripe||'#e2ddd2',.9,1.6); softRect(I,0,T3.neck,128,8,dk,.9,1); softRect(I,0,T3.belt-10,128,10,dk,.9,1.5); }
      if(t==='coat'||t==='tweed'){ softLine(I,64,T3.neck+8,64,256,dk,.9,1.4); for(let y=T3.chest;y<T3.belt+30;y+=26){ softEll(I,58,y,2,2,'#141414',.9); softEll(I,70,y,2,2,'#141414',.9); } for(const s of [-1,1]) softLine(I,64+s*6,T3.neck+4,64+s*20,T3.chest-6,dk,.85,2.2); softRect(I,30,T3.nav,18,4,dk,.7,1); softRect(I,80,T3.nav,18,4,dk,.7,1);
        if(t==='tweed') for(let y=T3.neck;y<256;y+=6) softLine(I,0,y,128,y,lt,.08,1); }
      if(t==='mac'){ buttons(I,[54,74],T3.neck+30,T3.belt,24,dk); softRect(I,0,T3.nav+6,128,8,dk,.9,1); softRect(I,60,T3.nav+4,10,12,'#c8b070',.8,.6); for(const s of [-1,1]) softLine(I,64+s*20,T3.neck+12,64+s*12,T3.nav,dk,.7,1.4); }
      if(t==='suit'){ softLine(I,64,T3.neck+6,64,T3.belt,S.tie||'#8a1a1a',.95,3); for(const s of [-1,1]) softLine(I,64+s*8,T3.neck+4,64+s*22,T3.chest+10,dk,.9,2); buttons(I,[64],T3.nav-30,T3.nav+10,18,'#141414'); }
      if(t==='shirt'||t==='check'){ seam(I,64,T3.neck+20,64,T3.belt); buttons(I,[64],T3.neck+30,T3.belt,22,'#e8e8e8'); for(const s of [-1,1]) softLine(I,64+s*3,T3.neck,64+s*14,T3.neck+10,mix(tc,'#fff',.4),.9,2); }
      if(t==='kurta'){ softLine(I,64,T3.neck+4,64,T3.chest+10,dk,.7,1.2); buttons(I,[66],T3.neck+10,T3.chest+10,14,'#c8c0a8'); softRect(I,52,T3.neck,24,3,mix(tc,'#c8a040',.4),.6,.8); }
      if(t==='cardi'){ buttons(I,[64],T3.neck+36,T3.belt,20,dk); softRect(I,0,T3.belt-8,128,10,dk,.6,1.5); }
      if(t==='fleece'){ softLine(I,64,T3.neck+4,64,T3.chest,dk,.9,1.4); softRect(I,0,T3.neck,128,10,dk,.8,1); }
      if(t==='chore'){ for(const [x,y,w] of [[34,T3.chest-10,18],[76,T3.chest-10,18],[30,T3.nav-8,22],[76,T3.nav-8,22]]) softRect(I,x,y,w,w,dk,.55,1); buttons(I,[64],T3.neck+20,T3.belt,26,'#2a2420'); }
      if(t==='scrubs'){ softRect(I,74,T3.chest-12,16,14,dk,.6,1); if(S.coatC) for(const [x0,x1] of [[0,48],[80,128]]) softRect(I,x0,T3.neck,x1-x0,256,S.coatC,1,1.5); }
      if(t==='bomber'){ softRect(I,0,T3.neck,128,8,dk,.95,1); softRect(I,0,T3.belt-10,128,12,dk,.9,1.5); softLine(I,64,T3.neck+8,64,T3.belt-8,'#8a8a8a',.8,1); }
      if(t==='leather'){ softLine(I,52,T3.neck+8,80,T3.belt-6,'#9a9a9a',.9,1.2); softRect(I,0,T3.belt-10,128,8,'#0a0a0a',.8,1); for(const s of [-1,1]) softLine(I,64+s*10,T3.neck+2,64+s*28,T3.chest,'#2a2a2a',.9,2.4); }
      if(t==='runner'){ for(const x of [44,84]) softLine(I,x,T3.neck+6,x,T3.belt,'#e8f0e8',.9,1.5); softRect(I,0,T3.chest+18,128,4,'#d8e0d8',.8,.6); }
      if(t==='wax'){ softRect(I,0,T3.neck,128,12,'#5a3a22',.95,1); for(const x of [30,76]) softRect(I,x,T3.nav-30,22,8,dk,.8,1); softLine(I,64,T3.neck+12,64,T3.belt+20,dk,.9,1.4); }
      if(t==='quilt'){ softLine(I,64,T3.neck+8,64,256,dk,.9,1.4); softRect(I,0,T3.neck,128,10,dk,.9,1.2); }
      if(t==='courier'){ softLine(I,64,T3.neck+8,64,T3.belt,dk,.9,1.6); softRect(I,0,T3.chest+30,128,5,'#c8ccc8',.9,.6); softRect(I,0,T3.neck,128,10,dk,.9,1); }
      if(t==='jumper'){ softRect(I,0,T3.belt-10,128,12,dk,.6,1.5); for(let x=0;x<128;x+=4) softLine(I,x,T3.belt-10,x,T3.belt,dk,.3,1); }
      if(t==='abaya') softLine(I,64,T3.neck+10,64,256,dk,.5,1.2);
      if(S.lanyard){ for(const s of [-1,1]) softLine(I,64+s*12,T3.neck+2,64+s*2,T3.chest+6,S.lanyard,.95,1.4); softRect(I,58,T3.chest+6,12,16,'#e8e8e4',.95,.6); softRect(I,60,T3.chest+9,8,6,'#5a7a9a',.8,.4); }
      if(S.badge) softEll(I,82,T3.chest-6,5,6,S.badge,.95,.4);
      if(S.belt) beltI(I,'#141414','#8a8a8a');
      if(S.bib) for(let y=T3.neck;y<T3.chest+16;y++){ const hw=30*(1-(y-T3.neck)/(T3.chest+16-T3.neck)); softRect(I,64-hw,y,hw*2,1,S.bib,.95,.4); } /* a hijab's drape over the chest */
      if(S.strap) softLine(I,98,T3.neck+4,34,T3.nav,S.strap,.95,2.2); /* a bag strap across the chest */
    }}); }
function crowdArm(seed,S){ const sc=S.armC||S.tc, dk=mix(sc,'#000000',.3), skinTo=S.short?44:999;
  return armP(seed,(x,y)=>y>skinTo?['#000000','skin',0]:y<118?[sc,FAB[S.armTop||S.top]||'knit',.5]:[S.cuff||dk,'knit',.3],{decor:I=>{ const t=S.armTop||S.top;
    if(t==='puffer'||t==='quilt') for(let y=14;y<118;y+=18) softLine(I,0,y,64,y,dk,.85,1.4);
    if(t==='track') for(const x of [14,50]) softLine(I,x,0,x,116,S.stripe||'#e2ddd2',.9,1.4);
    if(t==='check') for(let y=0;y<118;y+=16) softRect(I,0,y,64,8,mix(sc,'#000',.4),.6,.5);
    if(t==='runner'||t==='courier') softRect(I,0,70,64,4,'#d8e0d8',.85,.6);
    if(S.armBadge) softRect(I,18,24,26,14,S.armBadge,.95,.6);
    if(S.hivisArm) softRect(I,0,60,64,7,'#e8e8e0',.95,.6); }}); }
function crowdLeg(seed,S){ const lc=S.lc, k=S.legs, dk=mix(lc,'#000000',.2);
  return legP(seed,(x,y)=>y<118?[lc,FAB[k]||'twill',k==='tights'?.15:.6]:[k==='tights'?lc:dk,'knit',.3],{decor:I=>{
    if(k==='jeans'){ softLine(I,52,10,50,110,mix(lc,'#fff',.2),.6,1); if(S.turnup) softRect(I,0,112,64,8,mix(lc,'#fff',.25),.9,.6); }
    if(k==='jogs'&&S.stripe) softLine(I,0,0,0,118,S.stripe,.8,2);
    if(k==='work'){ softRect(I,6,34,24,22,dk,.9,1); softRect(I,34,34,24,22,dk,.9,1); seam(I,48,0,48,128); }
    if(k==='trousers'||k==='chinos') seam(I,16,0,16,128);
    if(k==='tights') blob(I,32,64,10,7,-.12); }}); }
function crowdSkirt(c,seed,o={}){ return garment(64,64,seed,(x,y)=>{ if(o.border&&(y>56||y<4)) return [o.border,'cotton',.3]; if(o.check&&((x>>2)+(y>>2))%3===0) return [mix(c,'#000',.25),'wool',.4]; return [c,o.fab||'cotton',.5]; },{folds:8,dir:'v',decor:I=>{ if(o.slit) softLine(I,32,0,32,64,mix(c,'#000',.4),.8,1.2); if(o.pattern) for(let i=0;i<40;i++){ const r=rng(seed+i); softEll(I,r()*64,r()*64,1.6,1.6,o.pattern,.7,.4); } }}); }
const tTrainerB=garment(64,32,1293,()=>['#1a1a1c','leather',.2],{folds:2,grime:.1,decor:I=>{ softRect(I,0,23,64,9,'#e8e4dc',1,1); for(const y of [8,13]) softLine(I,26,y,38,y,'#e8e4dc',.7,1); }});
const tRigger=garment(64,32,1294,()=>['#5a4028','leather',.4],{folds:3,grime:.3,decor:I=>{ softRect(I,0,22,64,10,'#2a1a10',1,1); softRect(I,20,0,24,8,'#3a2a1a',.8,1); }});
/* ---------- hats, hair and coverings (all on the head joint, all baked into the person's mesh) ---------- */
const mFlat=c=>M(null,{color:hexInt(c)}), mFab=(c,seed,fn)=>M(P2(16,16,(g,w,h)=>{ R(g,c,0,0,w,h); if(fn) fn(g,w,h); },6,seed),{double:true});
function topi(J,c){ crown(J,[[.185,.083,.103],[.225,.084,.104],[.248,.062,.08],[.258,0,0]],mFab(c,1801,(g,w,h)=>{ for(let y=1;y<h;y+=3) for(let x=(y%2);x<w;x+=3) R(g,'rgba(0,0,0,.16)',x,y,1,1); }),-.012); }
function hijab(J,o,c,seed){ const m=mFab(c,seed,(g,w,h)=>{ for(let x=0;x<w;x+=5) R(g,'rgba(0,0,0,.12)',x,0,2,h); });
  crown(J,[[.1,.088,.106],[.16,.094,.113],[.21,.092,.11],[.25,.072,.09],[.275,.02,.03]],m,-.022);
  mk(box(.19,.26,.06,{tw:1.06,td:1.2,at:[0,-.13,0]}),m,J.head,0,.21,-.08,-.06,0,0); for(const s of [-1,1]) mk(box(.03,.19,.11,{at:[0,-.095,0]}),m,J.head,s*.079,.17,-.005,-.02,0,s*.06);
  const t=torsoAt(o,1.53*o.hf); mk(lathe([[-.07,t[1]+.045,t[2]+.05,t[3]],[0,t[1]+.03,t[2]+.035,t[3]],[.07,t[1]+.016,t[2]+.024,t[3]+.006]],10,{capB:false,capT:false}),m,J.neck); }
function capFlat(J,c){ const m=mFab(c,1803,(g,w,h)=>{ for(let i=0;i<w;i+=3){ R(g,'rgba(255,255,255,.08)',i,0,1,h); R(g,'rgba(0,0,0,.12)',0,i,w,1); } });
  crown(J,[[.17,.09,.108],[.205,.094,.116],[.225,.096,.128,.012],[.24,.07,.1,.02],[.245,0,0,.02]],m,-.005); mk(box(.15,.012,.06),m,J.head,0,.172,.122,.22); }
function bobble(J,c,c2){ beanie(J,c); mk(box(.05,.05,.05),M(null,{color:hexInt(c2||c)}),J.head,0,.3,-.01); }
function headwrap(J,c,c2,seed){ const m=mFab(c,seed,(g,w,h)=>{ for(let i=0;i<w;i+=4){ R(g,c2,i,0,2,h); R(g,mix(c2,'#000',.3),0,i+1,w,1); } });
  crown(J,[[.12,.092,.112],[.19,.1,.12],[.26,.104,.118],[.31,.085,.095],[.335,.03,.035]],m,-.01); }
function hardHat(J,c){ const m=M(null,{color:hexInt(c)}); crown(J,[[.17,.1,.118],[.22,.098,.114],[.27,.08,.094],[.31,.045,.05],[.32,0,0]],m,-.008); mk(box(.22,.012,.26),m,J.head,0,.175,.005); }
function headphones(J,c){ const m=M(null,{color:hexInt(c),double:true}); for(const s of [-1,1]) mk(box(.035,.06,.065),m,J.head,s*.084,.11,-.006); mk(lathe([[0,.098,.098],[.024,.098,.098]],12,{capB:false,capT:false}),m,J.head,0,.12,-.016,Math.PI/2,0,0); }
function bunHair(J,c){ bun(J,c); }
/* ---------- props, held or worn; each sits on a joint and is baked in with the body ---------- */
const pm=c=>M(null,{color:hexInt(c)});
function aCarrier(J,side,c){ const h=J['hand'+side], m=pm(c); mk(box(.24,.3,.11,{tw:.86,td:.9}),m,h,0,-.24,0); mk(box(.012,.07,.012),m,h,-.05,-.07,0); mk(box(.012,.07,.012),m,h,.05,-.07,0); }
function aTote(J,o,c){ const m=M(P2(16,16,(g,w,h)=>{ R(g,c,0,0,w,h); R(g,'rgba(0,0,0,.25)',2,5,12,6); R(g,'rgba(255,255,255,.2)',3,6,10,1); },4,1811)); const sy=1.09*o.hf;
  mk(box(.06,.36,.3,{at:[0,-.15,0]}),m,J.spine,-.2*o.w,1.08*o.hf-sy-.04,-.01); }
function aRuck(J,o,c){ const m=pm(c), sy=1.09*o.hf, t=torsoAt(o,1.2*o.hf); mk(box(.3,.4,.15,{tw:.92,td:.85}),m,J.spine,0,1.22*o.hf-sy,-(t[2]-t[3])-.07); mk(box(.22,.12,.05),pm(mix(c,'#000',.3)),J.spine,0,1.1*o.hf-sy,-(t[2]-t[3])-.15); }
function aThermal(J,o,c){ const sy=1.09*o.hf, t=torsoAt(o,1.2*o.hf), m=M(P2(16,16,(g,w,h)=>{ R(g,c,0,0,w,h); R(g,'rgba(0,0,0,.3)',0,0,w,1); R(g,'rgba(0,0,0,.3)',0,h-1,w,1); R(g,'rgba(255,255,255,.18)',2,7,12,2); },4,1812));
  mk(box(.42,.44,.36),m,J.spine,0,1.24*o.hf-sy,-(t[2]-t[3])-.2); }
function aCross(J,o,c){ const sy=1.09*o.hf; mk(box(.2,.13,.06),pm(c),J.spine,.1,1.02*o.hf-sy,frontAt(o,1.02)+.03,0,0,-.1); }
/* things held upright with the forearm level (coffee, a can): the grip runs along the hand's z, on the palm side */
const palmX=side=>side==='R'?.036:-.036;
function aCup(J,side,c){ const h=J['hand'+side], x=palmX(side); mk(cyl(.036,.03,.12,8),pm(c||'#ece8e0'),h,x,-.075,.01,Math.PI/2,0,0); mk(cyl(.038,.038,.04,8),pm('#7a5a3a'),h,x,-.075,.0,Math.PI/2,0,0); mk(cyl(.037,.037,.012,8),pm('#1a1a1a'),h,x,-.075,.066,Math.PI/2,0,0); }
function aPhone(J,side){ const h=J['hand'+side], x=palmX(side)*.6; mk(box(.075,.15,.012),pm('#141416'),h,x,-.085,.03); mk(box(.066,.13,.004),M(null,{color:0x5a7a9a,emissive:0x203040}),h,x,-.085,.038); }
function aCan(J,side,c){ mk(cyl(.033,.033,.12,8),pm(c||'#c8c8cc'),J['hand'+side],palmX(side),-.075,.02,Math.PI/2,0,0); }
function aFag(J,side){ pFag(J['hand'+side]); }
function aChick(J,side){ const h=J['hand'+side], t=M(tChickBox), gr=M(tGrease); mk(box(.17,.09,.12),[gr,gr,t,gr,gr,gr],h,0,-.06,.07); }
function aFlowers(J,side,c1,c2){ const h=J['hand'+side], paper=M(P2(16,16,(g,w,h)=>{ R(g,'#d8d0b8',0,0,w,h); R(g,'rgba(0,0,0,.08)',0,0,4,h); },4,1813),{double:true}), fl=M(P2(16,16,(g,w,h)=>{ R(g,'#2a4a1a',0,0,w,h); const r=rng(1814); for(let i=0;i<34;i++) R(g,r()<.5?c1:c2,r()*w|0,r()*h|0,2,2); },0,1815));
  mk(cyl(.075,.02,.3,8,{open:true}),paper,h,0,-.06,.04,Math.PI,0,0); mk(lathe([[0,.07,.07],[.06,.1,.1],[.12,.06,.06],[.14,0,0]],8),fl,h,0,-.22,.04,Math.PI,0,0); }
function aHelmet(J,side,c){ const h=J['hand'+side]; mk(lathe([[0,.12,.15],[.08,.12,.15],[.15,.08,.11],[.19,0,0]],8),pm(c),h,0,-.16,.0,Math.PI,0,0); }
function aHardHatHand(J,side,c){ const h=J['hand'+side], m=pm(c); mk(lathe([[0,.1,.12],[.06,.1,.115],[.12,.06,.07],[.14,0,0]],8),m,h,0,-.12,0,Math.PI,0,0); mk(box(.22,.012,.26),m,h,0,-.12,0); }
function aToolbag(J,side){ const h=J['hand'+side]; mk(box(.42,.22,.18),pm('#2a2c30'),h,0,-.17,0); mk(box(.42,.02,.19),pm('#c8a020'),h,0,-.08,0); }
function aStick(J,side){ const h=J['hand'+side]; mk(cyl(.011,.011,.86,6),pm('#4a3020'),h,0,-.44,.05); mk(box(.08,.02,.02),pm('#4a3020'),h,0,-.03,.04); }
function aHandbag(J,side,c){ const h=J['hand'+side], m=pm(c); mk(box(.26,.18,.1,{tw:.8}),m,h,0,-.2,0); mk(box(.012,.08,.012),m,h,0,-.08,0); }
function aGilet(J,o,c){ vest(J,o,M(P2(16,32,(g,w,h)=>{ R(g,c,0,0,w,h); for(let y=2;y<h;y+=5) R(g,'rgba(0,0,0,.28)',0,y,w,1); R(g,'rgba(0,0,0,.4)',7,0,2,h); },4,1816),{double:true}),.03); }
function aHivis(J,o,c){ vest(J,o,M(garment(128,64,1817+c.length,()=>[c,'poly',.3],{folds:4,grime:.2,decor:I=>{ for(const y of [26,44]){ softRect(I,0,y,128,6,'#b4b8bc',1,.6); softLine(I,0,y+1,128,y+1,'#ffffff',.4,1); } for(const cx of [40,88]) softRect(I,cx-3,0,6,26,'#b4b8bc',1,.6); }}),{double:true}),.03); }
function aWaistcoat(J,o,c){ vest(J,o,M(P2(16,32,(g,w,h)=>{ R(g,c,0,0,w,h); R(g,'rgba(0,0,0,.45)',7,0,2,h); for(let y=6;y<h;y+=7) R(g,'#b8b0a0',9,y,1,1); },4,1818),{double:true}),.02); }
/* ---------- the people: who they are, what they wear, what they carry, how they hold it ---------- */
const CSK={w1:['#f0c8aa','#c49a7e'],w2:['#e8bc9c','#bc9072'],w3:['#ecc4aa','#bc967e'],b1:['#a87050','#784a32'],b2:['#9a6444','#6e4430'],b3:['#b88462','#8a5a40'],k1:['#5e3a26','#3a2214'],k2:['#7a4a30','#4e2c1c'],k3:['#4a2c1c','#2e1a10'],c1:['#e8c49a','#b8946e'],m1:['#c8916c','#986448']};
/* role: what they do and when (48f2 has the schedule). hold: the arms when walking (R,L). rain: brolly | hood | none */
const PEOPLE=[
  {role:'nan',fem:1,skin:'w3',hair:['slick','#d8d4cc',12],age:1,glasses:'#6a5a3a',top:'quilt',tc:'#8a7a9a',longCoat:.36,legs:'tights',lc:'#8a6a5a',foot:'flat',body:{hf:.9,belly:1.12,w:1.02},trolley:51,hold:['back','carry'],props:J=>aHandbag(J,'L','#3a1a1a'),rain:'brolly'},
  {role:'nan',fem:1,skin:'k2',hair:['slick','#9a9a96',12],age:1,top:'coat',tc:'#4a2a4a',longCoat:.38,legs:'tights',lc:'#2a2024',foot:'flat',body:{hf:.92,belly:1.15,w:1.06},hat:J=>beanie(J,'#6a1a2a'),trolley:52,hold:['back','carry'],props:J=>aCarrier(J,'L','#e8e8e4'),rain:'brolly'},
  {role:'nan',fem:1,skin:'w1',hair:['slick','#c8b8a8',12],age:1,top:'mac',tc:'#3a4a5a',longCoat:.4,legs:'tights',lc:'#7a6050',foot:'flat',body:{hf:.89,belly:1.1},hat:J=>headscarf(J),trolley:51,hold:['back','carry'],props:J=>aCarrier(J,'L','#2a5ab8'),rain:'brolly'},
  {role:'elderM',fem:0,skin:'b2',hair:['shaved','#e8e4dc',13],age:1,beard:['full','#e8e4dc'],top:'kurta',tc:'#e8e2d0',kurta:.42,legs:'trousers',lc:'#d8d4c4',foot:'flat',body:{hf:.95,w:.95,belly:1.05},hat:J=>topi(J,'#f0eee8'),over:(J,o)=>aWaistcoat(J,o,'#3a3a40'),hold:['rdown','carry'],props:J=>aCarrier(J,'L','#2a5ab8'),rain:'none'},
  {role:'elderM',fem:0,skin:'b1',hair:['shaved','#2a2420',13],age:1,beard:['full','#b8501a'],top:'puffer',tc:'#1c2230',kurtaUnder:'#d8d8d0',kurta:.4,legs:'trousers',lc:'#2a2a2e',foot:'flat',body:{hf:.97,belly:1.1},hat:J=>topi(J,'#e8e8e4'),hold:['rdown','stick'],props:J=>aStick(J,'L'),rain:'none'},
  {role:'elderM',fem:0,skin:'b3',hair:['slick','#1a1410',13],beard:['full','#1a1410'],top:'kurta',tc:'#b8c8c0',kurta:.44,legs:'trousers',lc:'#e8e4dc',foot:'flat',body:{hf:1.0},hat:J=>topi(J,'#ffffff'),over:(J,o)=>aGilet(J,o,'#22242a'),hold:['chest','rdown'],props:J=>aPhone(J,'R'),rain:'brolly'},
  {role:'bangF',fem:1,skin:'b1',top:'abaya',tc:'#16161c',abaya:.92,legs:'trousers',lc:'#16161c',foot:'flat',body:{hf:.93,belly:1.08},hijab:'#141416',hold:['carry','carry'],props:J=>{ aCarrier(J,'R','#e8e8e4'); aCarrier(J,'L','#2a5ab8'); },rain:'brolly'},
  {role:'bangF',fem:1,skin:'b2',age:1,top:'sari',tc:'#9a1a5a',tc2:'#c84a7a',armC:'#2a2a3a',armTop:'cardi',sari:.94,legs:'trousers',lc:'#9a1a5a',foot:'flat',body:{hf:.9,belly:1.14,w:1.04},hijab:'#d8b0c0',trolley:52,hold:['back','carry'],props:J=>aCarrier(J,'L','#e8e8e4'),rain:'brolly'},
  {role:'youngF',fem:1,skin:'b3',top:'coat',tc:'#a8845a',longCoat:.4,legs:'trousers',lc:'#16161a',foot:'trainer',body:{hf:.96},hijab:'#c8a8a0',hold:['text','carry'],props:J=>{ aPhone(J,'R'); aHandbag(J,'L','#1a1a1a'); },rain:'brolly'},
  {role:'auntie',fem:1,skin:'k1',top:'puffer',tc:'#4a2a5a',longCoat:.42,legs:'skirt',lc:'#c86a20',foot:'flat',body:{hf:.95,belly:1.15,w:1.08},skirtPat:['#c86a20','#2a6a3a'],hat:J=>headwrap(J,'#d87a20','#2a6a3a',1821),hold:['carry','carry'],props:J=>{ aCarrier(J,'R','#e8e8e4'); aCarrier(J,'L','#e8e8e4'); },rain:'none'},
  {role:'builder',fem:0,skin:'w2',hair:['buzz','#6a4a2a',14],beard:['stubble','#5a3a20'],top:'hoodie',tc:'#3a3a3e',legs:'work',lc:'#2a2c30',foot:'rigger',body:{hf:1.02,w:1.08,depth:1.06,belly:1.08,ag:1.06},hat:J=>beanie(J,'#1e2024'),over:(J,o)=>aHivis(J,o,'#d8e23a'),hold:['chest','rdown'],props:J=>aCup(J,'R','#f0ece4'),rain:'hood'},
  {role:'builder',fem:0,skin:'k1',hair:['shaved','#141010',14],beard:['goatee','#141010'],top:'fleece',tc:'#2a2c30',legs:'work',lc:'#33363a',foot:'rigger',body:{hf:1.04,w:1.1,depth:1.06,ag:1.08},over:(J,o)=>aHivis(J,o,'#e8701a'),hold:['carry','carry'],props:J=>{ aToolbag(J,'R'); aHardHatHand(J,'L','#e8e8e4'); },rain:'none'},
  {role:'hipster',fem:0,skin:'w1',hair:['slick','#8a4a20',13],beard:['full','#8a4a20'],top:'chore',tc:'#1c2a44',legs:'jeans',lc:'#1c2230',turnup:1,foot:'boot',body:{hf:1.0,w:.96},hat:J=>beanie(J,'#c8a040'),strap:'#c8bca0',hold:['chest','rdown'],props:(J,o)=>{ aCup(J,'R','#e8e4dc'); aTote(J,o,'#d8ccb0'); },rain:'none'},
  {role:'hipster',fem:1,skin:'m1',hair:['bleach','#e8d8a8',13],hairBack:.06,top:'coat',tc:'#1a1a1c',longCoat:.42,legs:'trousers',lc:'#5a4a3a',foot:'boot',body:{hf:.97},strap:'#c8bca0',hold:['chest','rdown'],props:(J,o)=>{ aCup(J,'R','#e8e4dc'); aTote(J,o,'#e0d8c4'); },rain:'brolly'},
  {role:'trader',fem:0,skin:'w1',hair:['buzz','#8a8070',14],age:1,beard:['stubble','#8a8070'],top:'check',tc:'#8a2a2a',legs:'jeans',lc:'#2a3a5a',foot:'boot',body:{hf:1.0,w:1.1,belly:1.2,depth:1.1},hat:J=>capFlat(J,'#3a3430'),over:(J,o)=>aGilet(J,o,'#1c2230'),hold:['rdown','raise'],props:J=>aFlowers(J,'L','#e8d020','#e84a6a'),rain:'none'},
  {role:'trader',fem:1,skin:'w2',hair:['slick','#4a3020',12],top:'fleece',tc:'#2a4a3a',legs:'jogs',lc:'#2a2a2e',foot:'boot',body:{hf:.95,belly:1.1},hat:J=>bobble(J,'#a01a1a','#e8e8e4'),over:(J,o)=>aGilet(J,o,'#14301e'),hold:['rdown','raise'],props:J=>aFlowers(J,'L','#f0f0f0','#9a4ac8'),rain:'none'},
  {role:'lad',fem:0,skin:'k1',hair:['buzz','#141010',15],top:'puffer',tc:'#141416',legs:'jogs',lc:'#1a1a1c',foot:'trainer',body:{hf:1.03,w:1.0,lg:1.04},hold:['chest','rdown'],props:J=>aPhone(J,'R'),rain:'hood',hoodC:'#141416'},
  {role:'lad',fem:0,skin:'b1',hair:['slick','#141010',15],top:'track',tc:'#6a6a70',stripe:'#1a1a1c',legs:'jogs',lc:'#6a6a70',foot:'trainer',body:{hf:.99},hold:['rdown','chest'],props:(J,o)=>{ aCross(J,o,'#141414'); aChick(J,'L'); },rain:'hood',hoodC:'#5a5a60'},
  {role:'lad',fem:0,skin:'w1',hair:['buzz','#4a3020',15],top:'track',tc:'#1c2a5a',legs:'jogs',lc:'#1c2a5a',stripe:'#e2ddd2',foot:'trainer',body:{hf:1.0,w:.96},hat:J=>cap(J,'#141416','#141416'),hold:['chest','rdown'],props:J=>aPhone(J,'R'),rain:'none'},
  {role:'office',fem:1,skin:'k2',hair:['long','#141010',13],bun:1,top:'coat',tc:'#1c2230',longCoat:.38,legs:'trousers',lc:'#141418',foot:'flat',body:{hf:.98},lanyard:'#c8231c',hold:['text','carry'],props:J=>{ aPhone(J,'R'); aHandbag(J,'L','#2a1a14'); },rain:'brolly'},
  {role:'office',fem:0,skin:'b3',hair:['slick','#141010',13],glasses:'#1a1a1a',top:'suit',tc:'#2a2c34',tie:'#2a3a6a',legs:'trousers',lc:'#2a2c34',foot:'flat',body:{hf:1.0,w:.98},hold:['chest','rdown'],props:(J,o)=>{ aCup(J,'R','#3a6a5a'); aRuck(J,o,'#1a1a1c'); },rain:'brolly'},
  {role:'office',fem:0,skin:'w2',hair:['slick','#5a3a22',13],top:'shirt',tc:'#9ab0c8',legs:'chinos',lc:'#b8a880',foot:'trainer',body:{hf:1.02,w:1.0},over:(J,o)=>aGilet(J,o,'#1c2440'),lanyard:'#2a5ab8',hold:['ear','rdown'],props:(J,o)=>{ aPhone(J,'R'); aRuck(J,o,'#4a4a50'); },rain:'brolly'},
  {role:'rider',fem:0,skin:'b2',hair:['slick','#141010',14],beard:['stubble','#141010'],top:'courier',tc:'#22262a',legs:'jogs',lc:'#1a1a1c',foot:'trainer',body:{hf:1.0},hold:['text','carry'],props:(J,o)=>{ aPhone(J,'R'); aHelmet(J,'L','#e8e8e4'); aThermal(J,o,'#2aa8a0'); },rain:'hood',hoodC:'#22262a'},
  {role:'rider',fem:0,skin:'k2',hair:['buzz','#141010',14],top:'puffer',tc:'#3a4a2a',legs:'jeans',lc:'#1c2230',foot:'trainer',body:{hf:1.01},hat:J=>beanie(J,'#141416'),hold:['chest','rdown'],props:(J,o)=>{ aPhone(J,'R'); aThermal(J,o,'#e8862a'); },rain:'none'},
  {role:'cabbie',fem:0,skin:'w1',hair:['shaved','#a8a49c',13],age:1,beard:['mustache','#a8a49c'],top:'fleece',tc:'#3a3a40',legs:'trousers',lc:'#22222a',foot:'flat',body:{hf:.98,w:1.08,belly:1.25,depth:1.12},badge:'#2a7a3a',hold:['chest','rdown'],props:J=>aCup(J,'R','#f0ece4'),rain:'none'},
  {role:'dog',fem:1,skin:'w1',hair:['long','#6a4a2a',12],pony:1,top:'wax',tc:'#3a4028',legs:'jeans',lc:'#2a3a5a',foot:'boot',body:{hf:.95,belly:1.05},dog:{c:53,s:1},hold:['rdown','lead'],rain:'none'},
  {role:'dog',fem:0,skin:'k1',hair:['buzz','#141010',14],beard:['goatee','#141010'],top:'coat',tc:'#5a5a3a',legs:'jogs',lc:'#2a2a2e',foot:'trainer',body:{hf:1.03,w:1.04},hat:J=>beanie(J,'#2a2a2e'),dog:{c:54,s:1.05},hold:['chest','lead'],props:J=>aPhone(J,'R'),rain:'hood',hoodC:'#5a5a3a'},
  {role:'nurse',fem:1,skin:'k1',hair:['long','#141010',13],bun:1,top:'scrubs',tc:'#1c3a7a',inner:'#1c3a7a',coatC:'#141416',armC:'#141416',legs:'trousers',lc:'#1c3a7a',foot:'trainer',body:{hf:.97,belly:1.05},lanyard:'#2a5ab8',hold:['rdown','carry'],props:J=>aHandbag(J,'L','#1a1a1a'),rain:'brolly'},
  {role:'security',fem:0,skin:'k3',hair:['shaved','#141010',14],top:'bomber',tc:'#141416',armBadge:'#d8d4c4',legs:'trousers',lc:'#141418',foot:'boot',body:{hf:1.05,w:1.12,depth:1.1,ag:1.1},hold:['rdown','rdown'],props:J=>aPhone(J,'R'),rain:'none'},
  {role:'drunk',fem:0,skin:'w2',hair:['slick','#5a3a22',14],beard:['stubble','#4a3020'],top:'suit',tc:'#1c2440',tie:'#8a1a1a',legs:'trousers',lc:'#1c2440',foot:'flat',body:{hf:1.0,belly:1.15},hold:['chest','rdown'],props:J=>aCan(J,'R','#c8a020'),rain:'none'},
  {role:'geezer',fem:0,skin:'w3',hair:['slick','#d8d4cc',13],age:1,top:'tweed',tc:'#5a4a3a',legs:'trousers',lc:'#4a4a4e',foot:'flat',body:{hf:.97,belly:1.15},hat:J=>capFlat(J,'#4a4036'),hold:['low','rdown'],props:J=>aFag(J,'R'),rain:'none'},
  {role:'student',fem:1,skin:'c1',hair:['long','#141010',13],hairBack:.12,top:'puffer',tc:'#d8d8d4',longCoat:.4,legs:'leggings',lc:'#141416',foot:'trainer',body:{hf:.94},hat:J=>headphones(J,'#e8e8e4'),strap:'#2a2a2e',hold:['text','rdown'],props:(J,o)=>{ aPhone(J,'R'); aTote(J,o,'#2a2a2e'); },rain:'hood',hoodC:'#d8d8d4'},
  {role:'nightout',fem:1,skin:'w1',hair:['bleach','#e8d8a8',12],hairBack:.14,top:'leather',tc:'#141414',legs:'jeans',lc:'#141418',foot:'boot',body:{hf:.96},hold:['low','rdown'],props:J=>aFag(J,'R'),rain:'none'},
  {role:'jogger',fem:1,skin:'k2',hair:['long','#141010',13],pony:1,top:'runner',tc:'#c83a6a',legs:'leggings',lc:'#141416',foot:'trainer',body:{hf:.97,w:.94},hat:J=>headphones(J,'#141416'),hold:['rdown','down'],rain:'none'},
];
/* more of the same kinds of people, re-dressed: other faces, other colours (so two of a kind never look like twins) */
for(const [k,o] of [[19,{skin:'w1',hair:['long','#a8804a',13],tc:'#6a2430',lanyard:'#2a6a3a'}],[20,{skin:'k2',hair:['buzz','#141010',14],glasses:null,tc:'#44474e',lc:'#44474e',tie:'#6a1a1a'}],
    [21,{skin:'c1',hair:['slick','#141010',13],tc:'#e8e8e4',lc:'#2a2c34'}],[12,{skin:'k1',hair:['buzz','#141010',14],beard:['full','#141010'],tc:'#5a6a3a'}],[13,{skin:'w1',hair:['bleach','#d8c8a8',13],tc:'#5a4a7a'}],
    [16,{skin:'b2',tc:'#3a3a2a'}],[18,{skin:'k2',tc:'#141416',lc:'#141416',stripe:'#c8231c'}],[8,{skin:'b1',hijab:'#2a3a5a',tc:'#1a1a1c'}],[31,{skin:'b3',hair:['long','#2a1c12',13],tc:'#2a4a6a'}],
    [10,{skin:'w1',hair:['buzz','#a8804a',14],beard:['full','#a8804a'],tc:'#2a3a5a'}],[3,{skin:'b1',beard:['full','#d8d4cc'],tc:'#d8d0b8'}],[6,{skin:'b3',hijab:'#4a2a3a',tc:'#2a1a24',lc:'#2a1a24'}],
    [0,{skin:'w1',tc:'#4a5a3a',trolley:52}],[32,{skin:'k2',hair:['long','#141010',12],tc:'#5a1a2a'}],[30,{skin:'w1',hair:['slick','#a8a49c',13],tc:'#3a3a40'}],[24,{skin:'w2',tc:'#1a2a4a'}]])
  PEOPLE.push(Object.assign({},PEOPLE[k],o));
const CROWD_N=PEOPLE.length, CROWD=[], CROWD_DRESS=[]; /* painting the clothes is the slow part: done a person at a time, after load (48f2) */
{ const r=rng(4401), pickr=a=>a[r()*a.length|0], t0=performance.now();
  PEOPLE.forEach((S,i)=>{ const id='ped'+i, sk_=CSK[S.skin], fem=!!S.fem, hs=S.hair||['long','#141010',13];
    if(S.hijab){ S.neckC=S.hijab; S.bib=S.hijab; }
    HEADS[id]={seed:1400+i*7,skin:sk_[0],skinD:sk_[1],hair:S.hijab?null:hs[0],hairC:hs[1],hairFront:S.hijab?12:hs[2],brow:mix(S.age?'#8a8478':hs[1],'#000',.2),iris:pickr(['#2a1a10','#3a2a1a','#4a3a2a','#5a7a8a']),lip:mix(sk_[1],'#8a3a3a',.4),
      beard:S.beard?S.beard[0]:null,beardC:S.beard?S.beard[1]:null,sideburn:fem?42:36,behind:fem?46:undefined,nape:fem?48:undefined,age:!!S.age,glasses:S.glasses};
    const Sx=Object.assign({},S); if(S.kurtaUnder){ Sx.tc2=S.kurtaUnder; }
    const foot={trainer:tTrainerW,boot:tBootBlk,flat:tShoeFlat,rigger:tRigger,black:tTrainerB}[S.foot]||tTrainerW;
    const b=S.body||{}, o=fem?Object.assign({jacket:S.top==='puffer'?.02:.012,pants:.008},FEM,b):Object.assign({jacket:S.top==='puffer'?.03:.012,pants:.012},b);
    ROSTER[id]={side:'local',name:'Londoner',role:S.role,color:'#888',card:'',note:'',o,torso:null,arm:null,leg:null,foot,
      extra:(J,oo)=>{ if(S.hijab) hijab(J,oo,S.hijab,1830+i); if(S.hat) S.hat(J,oo); if(S.bun) bunHair(J,hs[1]); if(S.pony) ponytail(J,hs[1]); if(S.hairBack) hairBack(J,hs[1],S.hairBack);
        if(S.abaya) skirt(J,oo,crowdSkirt(S.tc,1840+i,{slit:1}),S.abaya,1.08);
        if(S.sari) skirt(J,oo,crowdSkirt(S.tc,1840+i,{border:'#d8b040'}),S.sari,1.06);
        if(S.kurta) skirt(J,oo,crowdSkirt(S.kurtaUnder||S.tc,1840+i,{slit:1}),S.kurta,1.1);
        if(S.longCoat) skirt(J,oo,crowdSkirt(S.tc,1840+i,{slit:1,fab:'wool'}),S.longCoat,1.14);
        if(S.legs==='skirt') skirt(J,oo,crowdSkirt(S.lc,1850+i,{pattern:S.skirtPat&&S.skirtPat[1]}),.86,1.1);
        if(S.over) S.over(J,oo); if(S.props) S.props(J,oo); }};
    CROWD_DRESS[i]=()=>{ const R_=ROSTER[id]; if(R_.torso) return; R_.torso=crowdTorso(id,1500+i*11,Sx); R_.arm=crowdArm(1600+i*11,Sx); R_.leg=crowdLeg(1700+i*11,S.abaya||S.sari?Object.assign({},S,{legs:'trousers',lc:S.lc}):S); };
    CROWD.push(id); }); console.log('[london] crowd wardrobe: people',CROWD.length,'ms',Math.round(performance.now()-t0)); }
/* ---------- baking: one person, one mesh, one texture ----------
   Everything under the rig's root (the skinned body, the head, nose, ears, hands, shoes, hats, props) is merged into the
   body's skinned geometry: rigid parts ride their joint with weight 1, so the engine's skinUpdate moves them as before.
   Their textures (or flat colours) are packed into one atlas per person. Nodes marked keep (a rain hood, an umbrella)
   stay separate so they can be shown and hidden. */
const CROWD_ATLAS={}; let _crowdTexId=1;
function crowdAtlas(id,mats){ let A=CROWD_ATLAS[id]; if(!A) A=CROWD_ATLAS[id]={regions:new Map(),list:[],tex:null,mat:null};
  const key=m=>(m.tex?(m.tex.__cid||(m.tex.__cid=_crowdTexId++)):'c')+'|'+m.color.map(v=>v.toFixed(3)).join(',')+'|'+m.rep.join('x')+'|'+(m.emis[0]+m.emis[1]+m.emis[2]>0?m.emis.map(v=>v.toFixed(2)).join(','):'');
  if(!A.tex){ for(const m of mats){ const k=key(m); if(A.regions.has(k)) continue; const t=m.tex, rp=[Math.min(4,Math.max(1,Math.round(m.rep[0]))),Math.min(4,Math.max(1,Math.round(m.rep[1])))];
      const w=t?Math.min(256,t.c.width*rp[0]):4, h=t?Math.min(256,t.c.height*rp[1]):4, R_={k,m,w,h,rp,x:0,y:0}; A.regions.set(k,R_); A.list.push(R_); }
    /* shelf-pack into a 512-wide sheet, tallest first, with a 2 px gutter */
    const L=A.list.slice().sort((a,b)=>b.h-a.h||b.w-a.w), W=512; let x=0,y=0,rowH=0; for(const q of L){ if(x+q.w+4>W){ x=0; y+=rowH+4; rowH=0; } q.x=x+2; q.y=y+2; x+=q.w+4; rowH=Math.max(rowH,q.h); }
    let H=16; while(H<y+rowH+4) H*=2; const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
    for(const q of L){ const m=q.m, col=`rgb(${m.color.map(v=>Math.round(Math.min(1,v+m.emis[0]*.5)*255)).join(',')})`;
      if(!m.tex){ g.fillStyle=col; g.fillRect(q.x-2,q.y-2,q.w+4,q.h+4); continue; }
      const s=m.tex.c, tw=q.w/q.rp[0], th=q.h/q.rp[1]; g.drawImage(s,0,0,s.width,s.height,q.x-2,q.y-2,q.w+4,q.h+4);
      for(let a=0;a<q.rp[0];a++) for(let b2=0;b2<q.rp[1];b2++) g.drawImage(s,0,0,s.width,s.height,q.x+a*tw,q.y+b2*th,tw,th);
      if(m.color.some(v=>v<.995)){ g.globalCompositeOperation='multiply'; g.fillStyle=col; g.fillRect(q.x,q.y,q.w,q.h); g.globalCompositeOperation='source-over'; } }
    A.W=W; A.H=H; A.tex={c,glt:null,f:-1}; A.mat=M(A.tex,{double:true}); }
  return {A,region:m=>A.regions.get(key(m))}; }
function crowdBake(C,id){ const J=C.J, root=J.root;
  for(const k of JOINTS) if(J[k]) J[k].r=[0,0,0]; J.hips.p=[0,C.hy0,0]; root.p=[0,0,0]; root.r=[0,0,0];
  const boneIx=new Map(); BONES.forEach((b,i)=>boneIx.set(J[b],i));
  const parts=[], skip=new Set([J.body,C.blood]), I4=m4.make();
  const walk=(n,pm_,bone)=>{ if(!n.vis||n.keep) return; const l=m4.make(); m4.compose(l,n.p,n.r,n.s); const w=m4.make(); m4.mul(w,pm_,l); const b=boneIx.has(n)?boneIx.get(n):bone;
    if(n.mesh&&!skip.has(n)&&b>=0) parts.push({n,w,b}); for(const k of n.kids) walk(k,w,b); };
  for(const k of root.kids) walk(k,I4,-1);
  const S=J.skin, bodyMats=J.body.mesh.mats, all=[...bodyMats]; for(const p of parts) all.push(...p.n.mesh.mats);
  const {A,region}=crowdAtlas(id,all);
  const g=new Geo(), bi=[], bw=[];
  const add=(src,P,Nm,mats,wts,Mx)=>{ const runs=mats.length===1?[{start:0,count:src.I.length,m:mats[0]}]:src.groups.map(gr=>({start:gr.start,count:gr.count,m:mats[gr.mi]||mats[0]}));
    for(const ru of runs){ const q=region(ru.m), map=new Map(); if(!q) continue;
      const u0=q.x/A.W, u1=(q.x+q.w)/A.W, v0=1-(q.y+q.h)/A.H, v1=1-q.y/A.H, iu=.5/A.W, iv=.5/A.H;
      for(let k=ru.start;k<ru.start+ru.count;k++){ const vi=src.I[k]; let ni=map.get(vi);
        if(ni===undefined){ ni=g.P.length/3; map.set(vi,ni); let x=P[vi*3],y=P[vi*3+1],z=P[vi*3+2],nx=Nm[vi*3],ny=Nm[vi*3+1],nz=Nm[vi*3+2];
          if(Mx){ const X=Mx[0]*x+Mx[4]*y+Mx[8]*z+Mx[12], Y=Mx[1]*x+Mx[5]*y+Mx[9]*z+Mx[13], Z=Mx[2]*x+Mx[6]*y+Mx[10]*z+Mx[14]; x=X; y=Y; z=Z;
            const NX=Mx[0]*nx+Mx[4]*ny+Mx[8]*nz, NY=Mx[1]*nx+Mx[5]*ny+Mx[9]*nz, NZ_=Mx[2]*nx+Mx[6]*ny+Mx[10]*nz, l=Math.hypot(NX,NY,NZ_)||1; nx=NX/l; ny=NY/l; nz=NZ_/l; }
          const u=clamp(src.T[vi*2],0,1), v=clamp(src.T[vi*2+1],0,1);
          g.P.push(x,y,z); g.Nm.push(nx,ny,nz); g.T.push(clamp(u0+u*(u1-u0),u0+iu,u1-iu),clamp(v0+v*(v1-v0),v0+iv,v1-iv)); wts(vi); }
        g.I.push(ni); } } };
  add(S.geo,S.bindP,S.bindN,bodyMats,vi=>{ bi.push(S.bi[vi*2],S.bi[vi*2+1]); bw.push(S.bw[vi*2],S.bw[vi*2+1]); },null);
  for(const p of parts) add(p.n.mesh.geo,p.n.mesh.geo.P,p.n.mesh.geo.Nm,p.n.mesh.mats,()=>{ bi.push(p.b,0); bw.push(1,0); },p.w);
  g.groups=[{start:0,count:g.I.length,mi:0}]; g.bs={c:[0,.95,0],r:1.3};
  J.body.mesh={geo:g,mats:[A.mat],runs:null};
  J.skin={geo:g,bi:new Uint8Array(bi),bw:new Float32Array(bw),bindP:new Float32Array(g.P),bindN:new Float32Array(g.Nm),P:new Float32Array(g.P),N:new Float32Array(g.Nm),bpos:S.bpos,rel:S.rel,loc:S.loc};
  for(const p of parts) p.n.mesh=null; J.headMesh={mesh:{mats:[null],runs:null}};
  /* drop the emptied leaves so the scene walk stays short */
  const bones=new Set(BONES.map(b=>J[b])); const prune=n=>{ for(let i=n.kids.length-1;i>=0;i--){ const k=n.kids[i]; prune(k); if(!k.mesh&&!k.kids.length&&!bones.has(k)&&!k.keep&&k!==C.blood) n.kids.splice(i,1); } }; prune(root);
  return g.P.length/3; }
