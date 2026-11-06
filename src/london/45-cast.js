/* =====================================================================================================
   THE CAST of Bethnal Green Road, on the Stairwell rig: you, the crew you want in with, the people who live
   on the street, and the Old Bill. Painted faces and garments, the same skinned body as the tower cast.
   ===================================================================================================== */
Object.assign(HEADS,{
  danny:{seed:1201,skin:'#d2a07e',skinD:'#a07258',hair:'buzz',hairC:'#2a1c12',hairFront:14,brow:'#2a1c12',iris:'#4a3a2a',lip:'#a8665a',beard:'stubble',beardC:'#3a2818',acne:true},
  degsy:{seed:1202,skin:'#e0ae8c',skinD:'#ae7e62',hair:'buzz',hairC:'#6a4a2a',hairFront:15,shadow:true,brow:'#5a3a22',browT:2,iris:'#5a7a8a',lip:'#b0705e',beard:'stubble',beardC:'#6a4a2a',scar:true},
  kwame:{seed:1203,skin:'#5e3a26',skinD:'#3a2214',hair:'shaved',hairFront:14,brow:'#120c08',browT:2,iris:'#1a0e08',lip:'#4e2c1e',beard:'goatee',beardC:'#120c08',white:'#d8cfc0'},
  maureen:{seed:1204,skin:'#ecc4aa',skinD:'#bc967e',hair:'long',hairC:'#d8d4cc',hairFront:12,sideburn:42,behind:46,nape:48,brow:'#b8b4ac',iris:'#5a7a9a',lip:'#b07a72',age:true,spots:true,glasses:'#6a5a3a'},
  piotr:{seed:1205,skin:'#e8bc9c',skinD:'#bc9072',hair:'buzz',hairC:'#a8804a',hairFront:14,brow:'#8a6a3a',iris:'#5a7aa0',lip:'#b07a6a',beard:'full',beardC:'#8a6a3a'},
  ali:{seed:1208,skin:'#a87050',skinD:'#784a32',hair:'slick',hairC:'#141010',hairFront:13,sideburn:38,brow:'#141010',browT:2,iris:'#2a1a10',lip:'#8a4a3a',beard:'full',beardC:'#141010'},
  pcmale:{seed:1206,skin:'#d8a486',skinD:'#a8765c',hair:'slick',hairC:'#3a2a1c',hairFront:13,sideburn:36,brow:'#3a2a1c',iris:'#4a5a6a',lip:'#a86a5e',beard:'mustache',beardC:'#3a2a1c'},
  pcfem:{seed:1207,skin:'#b88462',skinD:'#8a5a40',hair:'long',hairC:'#1a120c',hairFront:13,sideburn:44,behind:48,nape:50,brow:'#1a120c',iris:'#2a1a10',lip:'#8a4a3a'}
});

/* ---------- shared bits ---------- */
const tTrainerW=garment(64,32,1290,()=>['#ece8e2','leather',.2],{folds:2,grime:.14,decor:I=>{ softRect(I,0,23,64,9,'#c4c0b6',1,1); for(const y of [8,13]) softLine(I,26,y,38,y,'#3a3a3c',.8,1); softRect(I,46,11,10,4,'#2a2a2c',.8,.8); }});
const tBootBlk=garment(64,32,1291,()=>['#17181a','leather',.3],{folds:3,decor:I=>{ softRect(I,0,22,64,10,'#0b0b0c',1,1); for(const y of [4,9,14]) softLine(I,26,y,38,y,'#3a3a3e',.8,1); }});
const tShoeFlat=garment(64,32,1292,()=>['#1a1616','leather',.2],{folds:2,grime:.05,decor:I=>softRect(I,0,26,64,6,'#0a0808',1,1)});
const quilt=(I,y0,y1,step,col)=>{ for(let y=y0;y<y1;y+=step){ softLine(I,0,y,128,y,col,.85,1.6); softLine(I,0,y-step*.45,128,y-step*.45,'#ffffff',.09,step*.3); } };

/* Danny (you): black track jacket with white piping, grey trackies, white trainers. Nineteen and sure of himself. */
const tDanTorso=torsoP('danny',1301,(x,y)=>{ if(y>T3.belt+2) return ['#6c6c70','knit',.7]; if(crewNeck(x,y,12,10)) return sk('danny'); return ['#17181b','poly',.6]; },{decor:I=>{ neckShadow(I);
  softRect(I,0,T3.neck,128,9,'#0e0f11',.95,1); softLine(I,64,T3.neck+9,64,T3.belt-10,'#bdbdbd',.9,1.2); softRect(I,61,T3.neck+10,6,7,'#9a9a9a',1,.6);
  for(const x of [30,98]) softLine(I,x,T3.neck+12,x,T3.belt-10,'#e2ddd2',.9,1.1); softRect(I,0,T3.belt-12,128,10,'#0e0f11',.9,2); for(const x of [60,68]) softLine(I,x,T3.belt+3,x,T3.belt+16,'#e2ddd2',.9,1); }});
const tDanArm=armP(1303,(x,y)=>y<116?['#17181b','poly',.6]:['#0e0f11','knit',.3],{decor:I=>{ for(const x of [14,50]) softLine(I,x,0,x,116,'#e2ddd2',.9,1.1); }});
const tDanLeg=legP(1305,(x,y)=>y<116?['#6c6c70','knit',.7]:['#55555a','knit',.3],{decor:I=>{ blob(I,32,64,10,7,.12); softLine(I,52,12,50,40,'#4a4a4e',.7,1.2); }});

/* Degsy: bottle-green puffer, black joggers, black cap. Knows a bloke. */
const LGREEN='#1f3b2d';
const tDegTorso=torsoP('degsy',1311,(x,y)=>{ if(y>T3.belt+10) return ['#1c1d20','knit',.6]; if(crewNeck(x,y,13,9)) return sk('degsy'); return [LGREEN,'nylon',.35]; },{folds:8,decor:I=>{ neckShadow(I);
  softRect(I,0,T3.neck,128,14,'#183026',.95,1.5); quilt(I,T3.neck+30,T3.belt+8,22,'#122219'); softLine(I,64,T3.neck+12,64,T3.belt+8,'#0e1a14',.95,1.6); softLine(I,65,T3.neck+12,65,T3.belt+8,'#7a8a80',.35,1); softRect(I,0,T3.belt+2,128,8,'#152a1f',.9,2);
  softRect(I,38,T3.chest+8,8,2,'#0a1410',.9,.5); }});
const tDegArm=armP(1313,(x,y)=>y<118?[LGREEN,'nylon',.35]:['#141416','knit',.3],{decor:I=>{ for(let y=14;y<118;y+=18){ softLine(I,0,y,64,y,'#122219',.85,1.4); softLine(I,0,y-8,64,y-8,'#ffffff',.08,5); } }});
const tDegLeg=legP(1315,(x,y)=>y<118?['#1c1d20','knit',.6]:['#141416','knit',.3],{decor:I=>{ softLine(I,0,0,0,118,'#3a3a3e',.6,1.4); blob(I,32,64,10,6,.1); }});
/* a roll-up held between the fingers: filter, paper, ash, the coal. Built to be looked at from 30 cm. */
function pFag(g){ const c=N(g,.012,-.07,.03,.15,0,0); mk(cyl(.0042,.0042,.018,8),M(null,{color:0xd8a868}),c,0,0,-.012,Math.PI/2); mk(cyl(.004,.004,.05,8),M(null,{color:0xeee8dc}),c,0,0,.022,Math.PI/2);
  mk(cyl(.0043,.0043,.007,8),M(null,{color:0x5a5652}),c,0,0,.05,Math.PI/2); mk(cyl(.0038,.0038,.003,8),M(null,{color:0xff5a18,unlit:true}),c,0,0,.055,Math.PI/2); return g; }

/* Kwame: navy tracksuit, hood up, chicken box in hand. Says nothing, misses nothing. */
const LNAVY='#1d2547';
const tKwaTorso=torsoP('kwame',1321,(x,y)=>{ if(crewNeck(x,y,12,9)) return sk('kwame'); return [LNAVY,'knit',.7]; },{decor:I=>{ neckShadow(I);
  softRect(I,40,T3.nav-30,48,28,'#161d3a',.9,1.2); softLine(I,40,T3.nav-30,88,T3.nav-30,'#2a3462',.6,1); for(const s of [-1,1]) softLine(I,64+s*5,T3.neck+8,64+s*6,T3.neck+44,'#d8d4cc',.9,1); softRect(I,0,T3.belt-8,128,10,'#161d3a',.9,2); }});
const tKwaArm=armP(1323,()=>[LNAVY,'knit',.7],{decor:I=>softRect(I,0,114,64,14,'#161d3a',.9,2)});
const tKwaLeg=legP(1325,(x,y)=>[LNAVY,'knit',.7],{decor:I=>{ softRect(I,0,114,64,14,'#161d3a',.9,2); softLine(I,0,0,0,114,'#d8d4cc',.7,1.4); }});
const tChickBox=P2(64,64,(g,w,h)=>{ R(g,'#c21b1b',0,0,w,h); R(g,'#ffd23a',0,22,w,14); R(g,'#8a1010',0,0,w,3); ell(g,32,48,9,7,'#ffd23a'); ell(g,32,48,5,4,'#c21b1b'); g.fillStyle='#c21b1b'; g.font='bold 9px Arial,sans-serif'; g.textAlign='center'; g.fillText('GOLDEN ROOSTER',32,32); specks(g,'#ffcf9a',30,1328,w,22); },4,1327);
const tGrease=P2(16,16,(g,w,h)=>{ R(g,'#c21b1b',0,0,w,h); ell(g,6,9,4,3,'rgba(90,30,10,.5)'); },3,1329);
/* the box of wings: lid and base with a seam, the logo printed on top, a grease spot, held by the side */
function pChickenBox(g){ const b=N(g,0,-.05,.06); const t=M(tChickBox),gr=M(tGrease); mk(box(.17,.05,.12),[gr,gr,gr,gr,gr,gr],b,0,-.026,0); mk(box(.172,.045,.122),[t,t,t,gr,t,t],b,0,.022,0); mk(box(.174,.004,.124),M(null,{color:0x7a0c0c}),b,0,-.0005,0); return g; }
function hoodUp(J,col){ hairBack(J,col,.04); const m=M(null,{color:hexInt(col),double:true}); crown(J,[[.12,.092,.112],[.2,.094,.114],[.25,.072,.094],[.275,.02,.03]],m,-.03); }

/* Maureen: burgundy mac, headscarf, umbrella. Seventy-eight. Has seen it all on this street, twice. */
const tMauTorso=torsoP('maureen',1331,(x,y)=>{ if(crewNeck(x,y,13,9)) return sk('maureen'); return ['#5a2630','poly',.5]; },{decor:I=>{ neckShadow(I);
  softRect(I,0,T3.neck,128,10,'#e2ddd0',.9,1); buttons(I,[56,72],T3.neck+30,T3.belt+40,26,'#2a1014'); softRect(I,0,T3.nav+4,128,8,'#4a1c24',.95,1); softRect(I,60,T3.nav+2,10,12,'#c8b070',.9,.6);
  for(const s of [-1,1]) softLine(I,64+s*20,T3.neck+12,64+s*12,T3.nav,'#3a1218',.7,1.4); }});
const tMauArm=armP(1333,(x,y)=>y<112?['#5a2630','poly',.5]:sk('maureen'),{decor:I=>softRect(I,0,104,64,8,'#4a1c24',.9,1)});
const tMauLeg=legP(1335,()=>['#3a2c2c','knit',.2],{decor:I=>blob(I,32,60,8,6,.08)});
const tMacSkirt=garment(64,64,1337,()=>['#5a2630','poly',.5],{folds:6,decor:I=>{ softLine(I,32,0,32,64,'#3a1218',.8,1.4); buttons(I,[28,36],8,60,20,'#2a1014'); }});
/* a proper umbrella: crook handle, shaft, eight ribs under the canopy, the ferrule on top */
function pBrolly(g){ const m=M(null,{color:0x16171a,double:true}),steel=M(null,{color:0x8a8e94}),dk=M(null,{color:0x2a2a2c});
  mk(cyl(.006,.006,.72,6),steel,g,0,-.02,.3,Math.PI/2); mk(cyl(.016,.014,.12,8),M(null,{color:0x4a2c1a}),g,0,-.02,-.06,Math.PI/2); mk(box(.024,.06,.024),M(null,{color:0x4a2c1a}),g,0,-.05,-.12);
  mk(lathe([[0,.52,.52],[.1,.44,.44],[.2,.26,.26],[.25,.06,.06],[.26,.012,.012]],8,{capB:false}),m,g,0,-.02,.62,Math.PI/2);
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+Math.PI/8; const rib=N(g,0,-.02,.62,0,0,a); mk(box(.004,.5,.004,{at:[0,.25,0]}),dk,rib,0,0,.02,-.42,0,0); }
  mk(cyl(.004,.004,.06,6),steel,g,0,-.02,.9,Math.PI/2); return g; }
function headscarf(J){ const m=M(P2(16,16,(g,w,h)=>{ R(g,'#2e4a6a',0,0,w,h); for(let i=0;i<w;i+=4){ R(g,'#c8a050',i,0,1,h); R(g,'#c8a050',0,i,w,1); } },4,1338),{double:true});
  crown(J,[[.12,.088,.106],[.19,.09,.108],[.24,.07,.088],[.265,.015,.02]],m,-.02); }

/* Piotr: night shift on the railway. Hi-vis over a fleece, work trousers, boots, beanie. */
const tPioTorso=torsoP('piotr',1341,(x,y)=>{ if(y>T3.belt+2) return ['#33363a','twill',.6]; if(crewNeck(x,y,12,9)) return sk('piotr'); return ['#2a2c30','knit',.8]; },{decor:I=>{ neckShadow(I); softRect(I,0,T3.neck,128,12,'#22242a',.9,1); beltI(I,'#141414','#5a5a5a'); }});
const tPioArm=armP(1343,()=>['#2a2c30','knit',.8],{decor:I=>softRect(I,0,112,64,16,'#22242a',.9,2)});
const tPioLeg=legP(1345,()=>['#33363a','twill'],{decor:I=>{ seam(I,48,0,48,128); softRect(I,6,34,24,22,'#2a2c30',.9,1); softRect(I,34,34,24,22,'#2a2c30',.9,1); softRect(I,0,96,64,4,'#c8cc30',.8,.6); }});
const tHivis=garment(128,64,1347,()=>['#d8e23a','poly',.3],{folds:4,grime:.22,decor:I=>{ for(const y of [26,44]){ softRect(I,0,y,128,6,'#b4b8bc',1,.6); softLine(I,0,y+1,128,y+1,'#ffffff',.4,1); } for(const cx of [40,88]) softRect(I,cx-3,0,6,26,'#b4b8bc',1,.6); textI(I,'NETWORK',-22,12,'#2a2c30',1.5); }});
function beanie(J,col){ crown(J,[[.13,.09,.11],[.2,.092,.112],[.25,.072,.09],[.28,.03,.04]],M(P2(16,16,(g,w,h)=>{ R(g,col,0,0,w,h); for(let x=0;x<w;x+=2) R(g,'rgba(0,0,0,.2)',x,0,1,h); R(g,'rgba(0,0,0,.25)',0,13,w,3); },6,1349)),-.01); }

/* Ali: runs the chicken shop. Red polo, black trousers, a fresh fade. Feeds half the street after midnight. */
const tAliTorso=torsoP('ali',1351,(x,y)=>{ if(vNeck(x,y,8,16)) return sk('ali'); if(y>T3.belt+2) return ['#1a1a1c','twill',.6]; return ['#b8161c','cotton',.7]; },{decor:I=>{ neckShadow(I); softRect(I,50,T3.neck,28,6,'#9a1015',.9,1); softEll(I,86,T3.chest-8,8,6,'#ffd23a',.9,.5); beltI(I,'#141414','#a8a49c'); }});
const tAliArm=armP(1353,(x,y)=>y<44?['#b8161c','cotton',.7]:sk('ali'),{decor:I=>{ blob(I,32,48,30,3,-.18); softRect(I,0,40,64,4,'#9a1015',.9,1); }});
const tAliLeg=legP(1355,()=>['#1a1a1c','twill'],{decor:I=>{ seam(I,48,0,48,128); seam(I,16,0,16,128); }});

/* the Old Bill: Met response officers. Black kit, stab vest with POLICE front and back, radio on the chest. */
const tMetTorso=k=>torsoP(k,1361+(k==='pcfem'?50:0),(x,y)=>{ if(crewNeck(x,y,11,8)) return sk(k); return y>T3.belt+2?['#121316','poly',.5]:['#141518','poly',.45]; },{decor:I=>{ neckShadow(I); beltI(I,'#0e0e10','#5a5a5e'); softRect(I,92,T3.belt-6,12,22,'#0a0a0c',.95,1); }});
const tMetArm=armP(1363,()=>['#141518','poly',.45],{decor:I=>{ softRect(I,20,22,24,16,'#1e2024',.9,1); softRect(I,24,26,16,8,'#2e4a8a',.9,.6); }});
const tMetLeg=legP(1365,()=>['#121316','poly',.5],{decor:I=>{ softRect(I,40,36,20,26,'#0e0f12',.9,1); seam(I,16,0,16,128); }});
const tStab=garment(128,64,1367,()=>['#15161a','cordura',.5],{folds:6,decor:I=>{ for(const cx of [64,0,128]){ textI(I,'POLICE',cx-23,8,'#e8e6e0',2); }
  softRect(I,40,28,10,16,'#0a0a0c',.95,.6); softRect(I,41,26,2,6,'#2a2a2e',1,.4); softRect(I,74,30,12,10,'#0a0a0c',.95,.6); softEll(I,80,35,2.5,2.5,'#c82020',.9,.4);
  for(let x=0;x<128;x+=8) softRect(I,x,58,4,6,(x>>3)%2?'#e8e6e0':'#1e3a8a',.95,.3); }});
function helmetMet(J){ const m=M(P2(16,32,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#1a1c22'],[1,'#0e0f12']]); R(g,'rgba(255,255,255,.1)',4,2,2,20); },4,1369));
  mk(lathe([[.12,.112,.13,-.008],[.16,.108,.124,-.008],[.24,.098,.112,-.01],[.31,.074,.082,-.012],[.36,.04,.046,-.012],[.385,.012,.012,-.012]],12),m,J.head);
  mk(box(.24,.012,.27),m,J.head,0,.125,-.008); mk(box(.012,.03,.012),M(null,{color:0xc8ccd0}),J.head,0,.39,-.012);
  mk(box(.05,.06,.01),M(null,{color:0xc8ccd0}),J.head,0,.21,.115,-.25); }
function flatCap(J){ const band=M(P2(32,8,(g,w,h)=>{ for(let x=0;x<w;x+=4) for(let y=0;y<h;y+=4) R(g,((x+y)>>2)%2?'#e8e6e0':'#1e3a8a',x,y,4,4); },0,1370),{repeat:[4,1]});
  crown(J,[[.16,.09,.108],[.2,.092,.11]],band,-.01); crown(J,[[.2,.096,.114],[.23,.11,.13],[.245,.1,.12],[.25,0,0]],M(null,{color:0x111216}),-.01); mk(box(.15,.01,.07),M(null,{color:0x0a0a0c}),J.head,0,.165,.12,.25); }
/* kit on the vest and belt, as geometry: radio with its aerial and the red button, body-worn camera, cuffs and the CS pouch */
function metKit(J,o){ const sy=1.09*o.hf,blk_=M(null,{color:0x0c0c0e}),grey=M(null,{color:0x2a2c30});
  const zf=y=>frontAt(o,y)+.034;
  mk(box(.06,.11,.034),blk_,J.spine,.075,1.33*o.hf-sy,zf(1.33)); mk(box(.008,.07,.008),grey,J.spine,.092,1.43*o.hf-sy,zf(1.33)); mk(box(.012,.01,.006),M(null,{color:0xd02020}),J.spine,.06,1.39*o.hf-sy,zf(1.33)+.018);
  mk(box(.055,.075,.03),blk_,J.spine,0,1.26*o.hf-sy,zf(1.26)); mk(cyl(.011,.011,.006,10),M(null,{color:0x3a5a8a,unlit:true}),J.spine,0,1.27*o.hf-sy,zf(1.26)+.016,Math.PI/2); mk(box(.006,.006,.004),M(null,{color:0xff2020,unlit:true}),J.spine,.018,1.29*o.hf-sy,zf(1.26)+.016);
  const t=torsoAt(o,.97*o.hf); for(const [ang,w,h] of [[.9,.07,.09],[-.9,.05,.12],[2.3,.07,.07]]){ const r=Math.hypot(t[1],t[2])*.95; mk(box(w,h,.04),blk_,J.hips,Math.sin(ang)*t[1]*1.08,-.03,Math.cos(ang)*t[2]*1.1+t[3],0,ang,0); } }
function pBaton(g){ mk(cyl(.012,.012,.2,6),M(null,{color:0x1a1a1c}),g,0,0,.02,Math.PI/2); mk(cyl(.008,.008,.34,6),M(null,{color:0x2a2c30}),g,0,0,.29,Math.PI/2); mk(box(.018,.018,.018),M(null,{color:0x2a2c30}),g,0,0,.46); return g; }
const BATON={prop:pBaton,gripHand:true,wFight:{p:[0,-.075,0],r:[1.4,0,0]},fight:{armR:[-.55,0,.2],elbowR:[-.9,0,0],armL:[-.35,0,-.2],elbowL:[-1.1,0,0],spine:[.08,0,0],thighL:[-.15,0,.06],kneeL:[.15,0,0],thighR:[.12,0,-.05]}};

/* ---------- the roster ---------- */
const SIDES={you:['you','You'],crew:['crew','The crew'],local:['civ','Lives here'],law:['law','Old Bill']};
const ROSTER={
  danny:{side:'you',name:'Danny "Two Sugars" Doyle',role:'You · 19, Hollis House',color:'#e8a33d',card:'Wants in. Hasn\'t thought much past that.',
    note:'Grew up on the fourth floor of Hollis House. Takes his tea with two sugars and his chances with none. Wants to be somebody on this street by Christmas.',
    o:{hf:.98,w:.95,depth:.94,lg:.96,ag:.95,jacket:.01,pants:.012},torso:tDanTorso,arm:tDanArm,leg:tDanLeg,foot:tTrainerW,extra:(J,o)=>collar(J,o,M(flat(64,16,1307,'#0e0f11','knit'),{double:true}),.05,.012)},
  degsy:{side:'crew',name:'Degsy',role:'The crew · runs errands for the old firm',color:'#2f6a4e',card:'Knows a bloke. Can\'t remember which one.',
    note:'Outside the Golden Rooster most nights, smoking, hazards on. Hands out the jobs nobody else wants, and the bag that starts all this.',
    o:{hf:1.0,w:1.06,depth:1.1,belly:1.08,lg:1.0,ag:1.04,jacket:.03,pants:.012},torso:tDegTorso,arm:tDegArm,leg:tDegLeg,foot:tTrainerW,prop:pFag,wFight:{p:[0,-.07,.02],r:[1.2,0,0]},extra:J=>cap(J,'#141416','#141416')},
  kwame:{side:'crew',name:'Kwame',role:'The crew · Degsy\'s shadow',color:'#2a3462',card:'Says nothing. Remembers everything.',
    note:'Never more than two metres from Degsy and never without a box of wings. The one who actually knows the bloke.',
    o:{hf:1.03,w:1.0,depth:.98,lg:1.04,ag:1.02,jacket:.012,pants:.014},torso:tKwaTorso,arm:tKwaArm,leg:tKwaLeg,foot:tTrainerW,prop:pChickenBox,wFight:{p:[0,-.04,.02],r:[0,0,0]},extra:J=>hoodUp(J,LNAVY)},
  maureen:{side:'local',name:'Maureen',role:'Lives here · Hollis House, flat 12',color:'#8a3040',card:'Has seen it all on this street. Twice.',
    note:'Walks to the all-night garage for milk at two in the morning because she can. Knows your mum. Will tell her.',
    o:Object.assign({jacket:.02,pants:.004,belly:1.08},FEM,{hf:.9}),torso:tMauTorso,arm:tMauArm,leg:tMauLeg,foot:tShoeFlat,prop:pBrolly,wFight:{p:[0,-.07,0],r:[-1.35,0,0]},extra:(J,o)=>{ headscarf(J); skirt(J,o,tMacSkirt,.42,1.14); }},
  piotr:{side:'local',name:'Piotr',role:'Lives here · night shift on the railway',color:'#c8cc30',card:'Fixes the trains. Doesn\'t fix other people\'s problems.',
    note:'Walks home under the arches at the same time every night. Big, calm, and the only person on the street the police would believe.',
    o:{hf:1.04,w:1.1,depth:1.08,belly:1.06,lg:1.08,ag:1.1,jacket:.008,pants:.012},torso:tPioTorso,arm:tPioArm,leg:tPioLeg,foot:tBootBlk,extra:(J,o)=>{ vest(J,o,M(tHivis,{double:true}),.03); beanie(J,'#1e2024'); }},
  ali:{side:'local',name:'Ali',role:'Lives here · the Golden Rooster',color:'#c21b1b',card:'Open till four. Sees everything through the glass.',
    note:'Owns the chicken shop and the CCTV over its door. Gives Degsy free chips and the police free tapes, and somehow stays friends with both.',
    o:{hf:.98,w:1.02,depth:1.04,belly:1.12,lg:.98,ag:1.0,jacket:.004,pants:.01},torso:tAliTorso,arm:tAliArm,leg:tAliLeg,foot:tShoeFlat,extra:J=>cap(J,'#b8161c','#9a1015')},
  pcmale:Object.assign({side:'law',name:'PC Hughes',role:'Old Bill · Met response, Bethnal Green',color:'#1e3a8a',card:'Twenty-two years in. Still walks the beat.',
    note:'First on scene at one star: on foot, helmet on, in no hurry. Knows half the street by name and the other half by reputation.',
    o:{hf:1.02,w:1.06,depth:1.06,belly:1.08,lg:1.04,ag:1.06,jacket:.004,pants:.01},torso:tMetTorso('pcmale'),arm:tMetArm,leg:tMetLeg,foot:tBootBlk,extra:(J,o)=>{ vest(J,o,M(tStab,{double:true}),.024); helmetMet(J); metKit(J,o); }},BATON),
  pcfem:Object.assign({side:'law',name:'PC Okafor',role:'Old Bill · Met response, Bethnal Green',color:'#2e4a8a',card:'Faster than you. Has been since school.',
    note:'Arrives at two stars in the response car and gets out running. Doesn\'t stop at the fence you just climbed.',
    o:Object.assign({jacket:.004,pants:.01},FEM,{hf:.97}),torso:tMetTorso('pcfem'),arm:tMetArm,leg:tMetLeg,foot:tBootBlk,extra:(J,o)=>{ vest(J,o,M(tStab,{double:true}),.024); bun(J,'#1a120c'); flatCap(J); metKit(J,o); }},BATON)
};
const ORDER=['danny','degsy','kwame','maureen','piotr','ali','pcmale','pcfem'];
