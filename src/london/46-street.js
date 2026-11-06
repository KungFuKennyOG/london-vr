/* =====================================================================================================
   BETHNAL GREEN ROAD, 02:14, built for VR distance. You stand a metre from the shop glass here, so nothing at
   eye level is a flat picture: shopfronts are recessed with frames, a stall riser, a counter and a back wall;
   signs and shutter boxes have thickness; textures at eye level run 60-80 px per metre. Rain is a volume of
   crossed streaks around the viewer, not sheets. Lighting is per vertex, so lit surfaces are cut into cells.
   ===================================================================================================== */
const STREET=N(world);
const MC=new Map(); let MCID=0; function MM(t,o={}){ const k=(t?(t.mmid||(t.mmid=++MCID)):0)+'|'+JSON.stringify(o); if(!MC.has(k)) MC.set(k,M(t,o)); return MC.get(k); }
const col=c=>MM(null,{color:c}), glowC=c=>MM(null,{color:c,unlit:true});
/* a flat slab on the ground, UVs in metres, cut into cells for the lighting */
function slab(w,d,t,x,y,z,o={}){ const tl=o.tile||1; return mk(plane(w,d,Math.max(1,Math.ceil(w/(o.cell||1))),Math.max(1,Math.ceil(d/(o.cell||1)))),MM(t,{repeat:[w/tl,d/(o.tileD||tl)],color:o.color??0xffffff,unlit:!!o.unlit}),o.parent||STREET,x,y,z,-Math.PI/2); }
/* an upright panel facing +z (turned by ry). tile/tileH = metres per texture repeat; whole=true stretches it once */
function wallP(w,h,t,x,y,z,ry=0,o={}){ const tw=o.whole?w:(o.tile||1), th=o.whole?h:(o.tileH||o.tile||1);
  return mk(plane(w,h,Math.max(1,Math.ceil(w/(o.cell||1.2))),Math.max(1,Math.ceil(h/(o.cell||1.2)))),MM(t,{repeat:[w/tw,h/th],color:o.color??0xffffff,unlit:!!o.unlit,cut:!!o.cut,double:!!o.double,nofog:!!o.nofog}),o.parent||STREET,x,y,z,0,ry,0); }
/* a box whose every face carries UVs in metres, so one texture tiles at true scale on any size of box */
function boxW(w,h,d,tile=1,tileV=tile){ const g=box(w,h,d),S={w,h,d}; FACES.forEach(([n,U,V,ku,kv],fi)=>{ for(let k=0;k<4;k++){ const i=fi*4+k; g.T[i*2]*=S[ku]/tile; g.T[i*2+1]*=S[kv]/tileV; } }); return g; }
function blk(w,h,d,m,x,y,z,parent=STREET){ return mk(box(w,h,d),m,parent,x,y,z); }
function blkT(w,h,d,t,x,y,z,o={}){ return mk(boxW(w,h,d,o.tile||1,o.tileV||o.tile||1),MM(t,{color:o.color??0xffffff}),o.parent||STREET,x,y,z,0,o.ry||0,0); }
const SANS='"LDN Archivo","Arial Black",Arial,sans-serif';
/* ---------- signs: painted at up to 4x, no grain, real faces (39-fonts.js), text fitted not squashed, mipmapped in the engine ----------
   w,h are the sign's proportions in the old 1x pixels; o.face picks the lettering: fat (chicken shop), cond (offy, bookie), grot (council,
   street plates), anton (the arch). o.lit paints it as a backlit lightbox; o.logo draws at the left; o.plate makes a London street nameplate */
const SFACE={fat:['400','"LDN Lilita","Arial Black",Arial,sans-serif',0], cond:['600','"LDN Oswald","Arial Narrow",Arial,sans-serif',.04],
  grot:['700','"LDN Archivo",Arial,Helvetica,sans-serif',.01], anton:['400','"LDN Anton",Impact,"Arial Black",sans-serif',.06]};
const SUBF=['500','"LDN Archivo",Arial,Helvetica,sans-serif'];
const SIGNS=[];
function fitText(g,txt,wt,fam,px,maxW,track){ for(let i=0;i<40;i++){ g.font=`${wt} ${Math.round(px)}px ${fam}`; try{ g.letterSpacing=`${(track*px).toFixed(1)}px`; }catch(e){}
    const m=g.measureText(txt).width; if(m<=maxW) break; px*=Math.max(.6,maxW/m*.995); } return px; }
function drawSign(g,W,H,bg,fg,main,sub,o){ const K=W/o.w0; g.clearRect(0,0,W,H);
  if(o.plate){ /* the London street nameplate: white enamel, black keyline, borough on top, name in mixed case, postcode district in red */
    R(g,'#1a1a1a',0,0,W,H); const m=6*K; g.fillStyle='#f6f4ee'; g.beginPath(); g.roundRect(m*.5,m*.5,W-m,H-m,10*K); g.fill();
    g.strokeStyle='#161616'; g.lineWidth=3.2*K; g.beginPath(); g.roundRect(m*1.6,m*1.6,W-m*3.2,H-m*3.2,7*K); g.stroke();
    g.textAlign='center'; g.textBaseline='alphabetic'; g.fillStyle='#161616';
    let px=fitText(g,o.plate,SUBF[0],SUBF[1],H*.11,W*.8,.06); g.fillText(o.plate,W/2,H*.27);
    R(g,'#161616',W*.12,H*.33,W*.76,1.6*K);
    const pc=o.pc||''; px=fitText(g,main,'700',SFACE.grot[1],H*.36,W*(pc?.68:.84),0); const mw=g.measureText(main).width;
    g.font=`700 ${Math.round(px)}px ${SFACE.grot[1]}`; const pw=pc?g.measureText(' '+pc).width:0, x0=W/2-(mw+pw)/2;
    g.textAlign='left'; g.fillStyle='#161616'; g.fillText(main,x0,H*.72); if(pc){ g.fillStyle='#c41a1a'; g.fillText(' '+pc,x0+mw,H*.72); }
    return; }
  if(o.lit){ const q=g.createLinearGradient(0,0,0,H); q.addColorStop(0,mix(bg,'#000000',.12)); q.addColorStop(.5,mix(bg,'#ffffff',.08)); q.addColorStop(1,mix(bg,'#000000',.18)); g.fillStyle=q; g.fillRect(0,0,W,H);
    const r=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.55); r.addColorStop(0,'rgba(255,255,255,.07)'); r.addColorStop(1,'rgba(0,0,0,.12)'); g.fillStyle=r; g.fillRect(0,0,W,H); }
  else R(g,bg,0,0,W,H);
  if(o.edge){ R(g,o.edge,0,0,W,3*K); R(g,o.edge,0,H-3*K,W,3*K); R(g,o.edge,0,5.5*K,W,1*K); R(g,o.edge,0,H-6.5*K,W,1*K); }
  if(o.frame){ g.strokeStyle=o.frame; g.lineWidth=2*K; g.strokeRect(5*K,5*K,W-10*K,H-10*K); }
  let L=0,Rr=W; if(o.logo){ const lw=H*.95; o.logo(g,H*.12+lw/2,H/2,lw); L=H*.12+lw; if(o.logoBoth){ g.save(); g.translate(W,0); g.scale(-1,1); o.logo(g,H*.12+lw/2,H/2,lw); g.restore(); Rr=W-L; } }
  const cx=(L+Rr)/2, room=(Rr-L)*.9, [wt,fam,tr]=SFACE[o.face||'grot'];
  g.textAlign='center'; g.textBaseline='middle';
  const mpx=fitText(g,main,wt,fam,H*(sub?.5:.64),room,tr), my=sub?H*.4:H*.53;
  if(o.shadow){ g.fillStyle=o.shadow; g.fillText(main,cx+mpx*.045,my+mpx*.06); }
  g.fillStyle=fg; g.fillText(main,cx,my);
  if(sub){ const spx=fitText(g,sub,SUBF[0],SUBF[1],H*.15,room*.92,.14); g.fillStyle=o.subC||fg; g.fillText(sub,cx,H*.79);
    if(o.rule){ const sw=Math.min(room,g.measureText(sub).width); R(g,o.subC||fg,cx-sw/2,H*.64,sw,Math.max(1,K*.9)); } }
  try{ g.letterSpacing='0px'; }catch(e){} }
function signTex(w,h,bg,fg,main,sub,o={}){ const K=Math.min(4,1600/w), W=Math.round(w*K), H=Math.round(h*K); o.w0=w;
  const t=tex(W,H,null,g=>drawSign(g,W,H,bg,fg,main,sub,o)); t.smooth=true; SIGNS.push([t,()=>drawSign(t.c.getContext('2d'),W,H,bg,fg,main,sub,o)]); return t; }
/* the faces arrive a beat after the scene is built: repaint every sign with them and re-upload */
FONTS_READY.then(()=>{ for(const [t,paint] of SIGNS){ paint(); retex(t); } });
/* any small painted text, drawn at K times its size with the same code, mipmapped */
function hiP2(w,h,fn,K=4){ const t=tex(Math.round(w*K),Math.round(h*K),null,g=>{ g.scale(K,K); fn(g,w,h); }); t.smooth=true; return t; }
/* logos */
function roosterLogo(col,dark){ return (g,cx,cy,s)=>{ g.save(); g.translate(cx,cy); g.scale(s/100,s/100); g.fillStyle=col;
  g.beginPath(); g.ellipse(-4,8,30,22,-.15,0,Math.PI*2); g.fill();                                   /* body */
  g.beginPath(); g.moveTo(-28,0); g.quadraticCurveTo(-48,-30,-34,-40); g.quadraticCurveTo(-30,-20,-22,-8); g.fill();  /* tail */
  g.beginPath(); g.moveTo(-24,-4); g.quadraticCurveTo(-40,-38,-22,-44); g.quadraticCurveTo(-22,-22,-14,-8); g.fill();
  g.beginPath(); g.ellipse(18,-16,12,14,0,0,Math.PI*2); g.fill(); g.fillRect(10,-14,14,22);             /* neck and head */
  g.beginPath(); g.moveTo(12,-28); g.lineTo(15,-40); g.lineTo(19,-31); g.lineTo(23,-42); g.lineTo(26,-29); g.closePath(); g.fill(); /* comb */
  g.beginPath(); g.moveTo(29,-18); g.lineTo(42,-14); g.lineTo(29,-10); g.fill();                         /* beak */
  g.beginPath(); g.ellipse(26,-5,3.5,6,0,0,Math.PI*2); g.fill();                                          /* wattle */
  g.fillRect(-10,28,4,14); g.fillRect(2,28,4,14); g.fillRect(-14,40,10,3); g.fillRect(-2,40,10,3);        /* legs */
  g.fillStyle=dark; g.beginPath(); g.arc(20,-19,2.6,0,Math.PI*2); g.fill(); g.restore(); }; }
function starLogo(col){ return (g,cx,cy,s)=>{ g.fillStyle=col; for(const [dx,dy,r] of [[0,-.04,.3],[-.27,.2,.13],[.25,.22,.11]]){ g.beginPath();
  for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=(i%2?.42:1)*r*s; g.lineTo(cx+dx*s+Math.cos(a)*rr,cy+dy*s+Math.sin(a)*rr); } g.closePath(); g.fill(); } }; }

/* ---------- painted surfaces, eye-level ones at 60-80 px per metre ---------- */
/* London stock brick, 0.2 x 0.075 m courses: 128 x 120 px = 1.6 x 1.5 m */
function brickTex(seed,soot){ return P2(128,120,(g,w,h)=>{ R(g,soot?'#262220':'#3a342c',0,0,w,h); const r=rng(seed);
  for(let row=0;row<20;row++){ const off=(row%2)*8; for(let x=-16;x<w;x+=16){ const red=r()<.14,v=r(); g.fillStyle=soot?mix('#4a3c32','#2e2620',v):red?mix('#7e3e2c','#5a2a20',v):mix('#8e7a54','#66563a',v); g.fillRect(x+off+1,row*6+1,15,5);
      if(r()<.3){ g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x+off+1+(r()*12|0),row*6+1,3,5); } if(r()<.12){ g.fillStyle='rgba(255,240,210,.12)'; g.fillRect(x+off+2,row*6+1,13,1); } } }
  for(let i=0;i<10;i++){ const x=r()*w|0; vfill(g,x,0,2+(r()*4|0),h*(.3+r()*.6),[[0,'rgba(8,6,4,.5)'],[1,'rgba(8,6,4,0)']]); } },8,seed+1); }
const tStock=brickTex(1401,false), tSoot=brickTex(1403,true);
const tConc=P2(128,128,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#6c685f'],[1,'#58544b']]); const r=rng(1405); specks(g,'#4a463e',260,1406,w,h); specks(g,'#7e7a70',160,1407,w,h);
  for(let i=0;i<14;i++){ const x=r()*w|0; vfill(g,x,0,2+(r()*3|0),h*(.2+r()*.8),[[0,'rgba(20,18,14,.5)'],[1,'rgba(20,18,14,0)']]); } R(g,'rgba(0,0,0,.4)',0,0,w,2); R(g,'rgba(0,0,0,.4)',0,0,2,h); },10,1408);
/* paving: 0.6 m slabs, 128 px = 1.2 m, chips, gum, wet joints, the odd puddle catching the light */
const tPaveW=P2(128,128,(g,w,h)=>{ R(g,'#141310',0,0,w,h); const r=rng(1409);
  for(let y=0;y<2;y++) for(let x=0;x<2;x++){ vfill(g,x*64+2,y*64+2,60,60,[[0,mix('#4e4c46','#3c3b36',r())],[1,mix('#44423c','#34332e',r())]]); }
  specks(g,'#2a2924',300,1410,w,h); specks(g,'#5c5a52',140,1411,w,h);
  for(let i=0;i<9;i++) ell(g,r()*w,r()*h,1.6,1.3,'rgba(30,30,30,.7)');
  for(let i=0;i<3;i++){ const cx=r()*w,cy=r()*h,rx=8+r()*14,ry=4+r()*6; ell(g,cx,cy,rx,ry,'rgba(10,12,16,.62)'); ell(g,cx-rx*.3,cy-ry*.3,rx*.3,1,'rgba(170,170,185,.22)'); }
  R(g,'rgba(255,255,255,.04)',0,2,w,1); },6,1412);
const tTarmac=P2(128,128,(g,w,h)=>{ R(g,'#1c1c1e',0,0,w,h); specks(g,'#2e2e32',900,1413,w,h); specks(g,'#0e0e10',700,1414,w,h); specks(g,'#45454a',120,1415,w,h); const r=rng(1416);
  for(let i=0;i<3;i++){ const cx=r()*w,cy=r()*h; ell(g,cx,cy,14+r()*16,5+r()*5,'rgba(8,10,14,.6)'); ell(g,cx-6,cy-2,6,1,'rgba(150,150,170,.18)'); }
  g.strokeStyle='rgba(6,6,6,.7)'; g.lineWidth=1; for(let i=0;i<5;i++){ g.beginPath(); let x=r()*w,y=r()*h; g.moveTo(x,y); for(let k=0;k<6;k++){ x+=r()*10-5; y+=r()*10-5; g.lineTo(x,y); } g.stroke(); } },6,1417);
const tKerb=P2(64,16,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#8e8a80'],[.3,'#7a766c'],[1,'#56534c']]); specks(g,'#5e5a52',60,1418,w,h); R(g,'#2a2824',w-1,0,1,h); },6,1419);
const tYellow=P2(16,4,g=>{ R(g,'#d6aa22',0,0,16,4); specks(g,'#8a6a10',6,1420,16,4); },0,1);
const tWhiteLine=P2(16,4,g=>{ R(g,'#d8d4cc',0,0,16,4); specks(g,'#8a8a8a',5,1421,16,4); },0,1);
function shutterTex(seed){ return P2(128,128,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#727476'],[1,'#4c4e50']]); for(let y=0;y<h;y+=4){ R(g,'rgba(255,255,255,.14)',0,y,w,1); R(g,'rgba(0,0,0,.34)',0,y+2,w,1); }
  specks(g,'#3a3c3e',300,1422,w,h); const r=rng(seed); for(let i=0;i<5;i++){ const x=r()*w|0; vfill(g,x,h*.5,2,h*.5,[[0,'rgba(80,50,30,0)'],[1,'rgba(80,50,30,.4)']]); }
  for(let k=0;k<4;k++){ g.strokeStyle=['#c83a7a','#e8c840','#3aa8e8','#ece8e0'][k]; g.lineWidth=3; g.lineCap='round'; g.beginPath(); let x=12+r()*60,y=40+r()*50; g.moveTo(x,y); for(let s=0;s<3;s++) g.quadraticCurveTo(x+r()*14,y-14+r()*28,x+=8+r()*10,y+=r()*14-7); g.stroke(); } },6,seed+1); }
const tShutterL=shutterTex(1423);
const tWinLit=P2(32,32,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#ffd9a0'],[1,'#ffb866']]); R(g,'rgba(110,40,30,.55)',0,0,6,h); R(g,'rgba(110,40,30,.55)',w-6,0,6,h); R(g,'#4a4038',0,15,w,2); R(g,'#4a4038',15,0,2,h); ell(g,20,24,4,6,'rgba(60,30,20,.5)'); },0,1425);
const tWinDark=P2(32,32,(g,w,h)=>{ R(g,'#0d1014',0,0,w,h); R(g,'rgba(120,130,150,.16)',3,3,10,8); R(g,'#b9b2a5',0,15,w,2); R(g,'#b9b2a5',15,0,2,h); R(g,'#b9b2a5',0,0,w,2); R(g,'#b9b2a5',0,h-2,w,2); R(g,'#b9b2a5',0,0,2,h); R(g,'#b9b2a5',w-2,0,2,h); },0,1426);
const tSky=P2(4,64,(g,w,h)=>vfill(g,0,0,w,h,[[0,'#08080c'],[.5,'#221a1a'],[.8,'#4a3022'],[1,'#6a4226']]),0,1); /* low cloud lit sodium-orange from below */
const tGlowSodium=P2(32,32,(g,w,h)=>{ g.clearRect(0,0,w,h); radial(g,16,16,16,[[0,'rgba(255,220,160,1)'],[.45,'rgba(255,165,70,.95)'],[.62,'rgba(255,140,40,0)']]); },0,1427);

/* ---------- ground ---------- */
const PAVE_Y=.12, KERB_Z=2.6, ROAD_Z1=10.4, FZ=-3;
slab(32,KERB_Z-FZ,tPaveW,0,PAVE_Y,(KERB_Z+FZ)/2,{tile:1.2});
for(let x=-16;x<16;x+=.9) mk(boxW(.88,PAVE_Y+.02,.16,.9,.16),MM(tKerb),STREET,x+.45,(PAVE_Y+.02)/2,KERB_Z-.08);
slab(32,ROAD_Z1-KERB_Z,tTarmac,0,0,(KERB_Z+ROAD_Z1)/2,{tile:2});
for(const z of [KERB_Z+.2,KERB_Z+.36]) slab(32,.07,tYellow,0,.003,z,{cell:4,tile:.5,tileD:.07});
for(let x=-14;x<15;x+=6) slab(3,.12,tWhiteLine,x,.003,(KERB_Z+ROAD_Z1)/2,{cell:3,tile:1,tileD:.12});
/* a gully grate in the gutter: you will look down at it */
{ const tG=P2(32,16,(g,w,h)=>{ R(g,'#1a1a1c',0,0,w,h); for(let x=2;x<w-1;x+=3) R(g,'#050506',x,2,2,h-4); R(g,'#3a3a3e',0,0,w,1); },3,1428); mk(box(.6,.02,.3),MM(tG),STREET,-1.2,.005,KERB_Z+.17); }
slab(32,4,tPaveW,0,PAVE_Y,ROAD_Z1+2,{tile:1.2});
for(let x=-16;x<16;x+=.9) mk(boxW(.88,PAVE_Y+.02,.16,.9,.16),MM(tKerb),STREET,x+.45,(PAVE_Y+.02)/2,ROAD_Z1+.08);

/* ---------- the deck block: walkways above, shops at street level ---------- */
wallP(29.85,4.2,tConc,1.075,2.1,FZ-2.7,0,{tile:3,tileH:3}); /* the shops' back wall; the gap at the west end is the estate's vehicle gateway */
blkT(32,.32,.6,tConc,0,4.2,FZ-.1,{tile:3});                     /* the slab over the shopfronts */
for(let f=0;f<4;f++){ const b=4.36+f*3;
  blkT(32,.3,2.1,tConc,0,b+.15,FZ+.75,{tile:3,color:0xb0aca4});
  blkT(32,1.1,.18,tConc,0,b+.85,FZ+1.71,{tile:3,color:0xb0aca4});
  wallP(32,2.7,tConc,0,b+1.65,FZ-.3,0,{tile:3,tileH:2.7,color:0x8a8680});
  for(let x=-14;x<15;x+=4){ const lit=((x*7+f*13+100)%5)<2;
    blk(1.32,1.12,.08,col(0xd8d2c4),x+1.4,b+1.9,FZ-.27); wallP(1.2,1,lit?tWinLit:tWinDark,x+1.4,b+1.9,FZ-.22,0,{unlit:lit,whole:true,cell:2});
    blk(.98,2.08,.08,col(0x1a1a1c),x,b+1.34,FZ-.28); blk(.9,2,.06,col([0x24364f,0x4b1a1a,0x1d3a2c,0x2a2a2a,0x5a3b17][(x+20+f)%5]),x,b+1.3,FZ-.24); blk(.03,.03,.06,col(0xb8b4a8),x+.34,b+1.25,FZ-.18);
    blk(.3,.06,.4,glowC(0xfff0cf),x+2.2,b+2.96,FZ+.6); } }
blkT(32,1.1,.18,tConc,0,16.5+.55,FZ+1.71,{tile:3,color:0xb0aca4});

/* shopfronts: a recessed unit with real depth. kind: rooster | offy | shut | bookie | lobby */
const SHOP_DEPTH=2.6;
function backWall(t,x,w,unlit){ wallP(w-.2,2.9,t,x,1.55+PAVE_Y,FZ-SHOP_DEPTH,0,{whole:true,unlit,cell:1}); }
function shopFront(x,w,kind){
  const x0=x-w/2,x1=x+w/2,front=FZ+.02;
  for(const s of [-1,1]) blkT(.42,4.05,.6,tConc,x+s*(w/2+.21),2.03,FZ-.1,{tile:3,color:0xa8a49c});      /* piers between units */
  if(kind==='shut'||kind==='bookie'){
    blk(w,.5,.42,col(0x3a3c40),x,3.62,FZ+.05);                                                            /* shutter box */
    wallP(w,3.25,shutterTex(1423+Math.round(x*7)),x,1.78,FZ-.08,0,{tile:w/Math.max(1,Math.round(w/1.6)),tileH:3.25});
    blk(w,.07,.06,col(0x2a2c2e),x,.2,FZ-.04); blk(.08,.12,.04,col(0x8a8a86),x+w*.3,.26,FZ-.02);               /* bottom rail and padlock */
    if(kind==='bookie') mk(boxW(w,.62,.16,w,.62),MM(signTex(384,54,'#183466','#f6d53a','LUCKY STARS','BOOKMAKERS · LIVE RACING · FOOTBALL',{face:'cond',lit:true,subC:'#ffffff',edge:'#f6d53a',logo:starLogo('#f6d53a'),logoBoth:true}),{unlit:true}),STREET,x,4.0,FZ+.36);
    return; }
  if(kind==='lobby'){ blk(w,.06,SHOP_DEPTH,col(0x1a1c1e),x,PAVE_Y+.03,FZ-SHOP_DEPTH/2);
    for(const s of [-1,1]) wallP(SHOP_DEPTH,3.1,tConc,x+s*(w/2-.02),1.6,FZ-SHOP_DEPTH/2,s*-Math.PI/2,{tile:3});
    /* the back wall has a doorway: Hollis House runs through to the back alley */
    for(const s of [-1,1]) wallP((w-1.2)/2,3.1,tConc,x+s*(w/2+.6)/2,1.6,FZ-SHOP_DEPTH,0,{tile:3,color:0xc8d0d4}); wallP(1.2,.9,tConc,x,2.7,FZ-SHOP_DEPTH,0,{tile:3,color:0xc8d0d4});
    for(const s of [-1,1]) blk(.06,2.3,.06,col(0x9aa4aa),x+s*.55,1.27,FZ-1.2); blk(1.16,.06,.06,col(0x9aa4aa),x,2.42,FZ-1.2);
    for(let i=0;i<6;i++) blk(.3,.22,.04,col(0x6a6e72),x-1+(i%3)*.36,1.3+(i>2?.26:0),FZ-SHOP_DEPTH+.03);
    blk(.5,.05,.3,glowC(0xe9f4f8),x,3.05,FZ-1.4);
    mk(boxW(w,.48,.1,w,.48),MM(signTex(280,48,'#eeebe2','#1b1b1b','HOLLIS HOUSE','FLATS 1–96 · LONDON BOROUGH OF TOWER HAMLETS',{face:'grot',frame:'#1b1b1b',subC:'#2a4a8a'})),STREET,x,3.7,FZ+.3); return; }
  /* an open shop: floor, side walls, back wall, counter, frames, stall riser, sign box */
  slab(w,SHOP_DEPTH,tConc,x,PAVE_Y+.01,FZ-SHOP_DEPTH/2,{tile:.5,cell:1,color:kind==='rooster'?0xd8d0c4:0xb8b4ac});
  for(const s of [-1,1]) wallP(SHOP_DEPTH,3.2,tConc,x+s*(w/2-.02),1.6+PAVE_Y,FZ-SHOP_DEPTH/2,s*-Math.PI/2,{tile:3,color:kind==='rooster'?0xfff4e6:0xeee8da,unlit:true});
  blk(w,.06,SHOP_DEPTH,col(0xece6da),x,3.2+PAVE_Y,FZ-SHOP_DEPTH/2);
  blk(w*.7,.05,.5,glowC(0xffffff),x,3.14+PAVE_Y,FZ-1.2);
  if(kind==='rooster'){
    backWall(P2(512,256,(g,w2,h)=>{ R(g,'#f4efe6',0,0,w2,h); for(let ty=0;ty<h;ty+=16) R(g,'#c8c2b6',0,ty,w2,1); for(let tx=0;tx<w2;tx+=16) R(g,'#c8c2b6',tx,0,1,h); /* white tiles */
        R(g,'#c21b1b',0,0,w2,10); R(g,'#ffd23a',0,10,w2,3);
        for(let k=0;k<4;k++){ const bx=14+k*122; R(g,'#1a1a1a',bx-3,19,114,92); R(g,'#c21b1b',bx,22,108,86); ell(g,bx+28,62,20,16,'#ffa02a'); ell(g,bx+24,57,8,6,'#ffd27a');
          g.fillStyle='#ffd23a'; g.textAlign='left'; g.textBaseline='middle'; const nm=['2 PC MEAL','6 WINGS','BURGER','CHIPS'][k]; let fs=17; g.font=`bold ${fs}px Arial,sans-serif`; while(g.measureText(nm).width>56&&fs>9){ fs--; g.font=`bold ${fs}px Arial,sans-serif`; } g.fillText(nm,bx+50,46);
          g.font='bold 20px Arial,sans-serif'; g.fillStyle='#ffffff'; g.fillText(['£4.49','£3.99','£2.99','£1.50'][k],bx+50,76); }
        g.save(); g.translate(w2/2,170); g.scale(1.3,1.3); g.fillStyle='#c21b1b'; ell(g,0,0,30,22,'#c21b1b'); ell(g,22,-20,10,11,'#c21b1b'); R(g,'#ffd23a',28,-24,9,4); g.restore(); /* rooster logo */
        g.fillStyle='#c21b1b'; g.font='bold 22px Arial,sans-serif'; g.textAlign='center'; g.fillText('GOLDEN ROOSTER',w2/2,212);
        R(g,'#9aa0a6',0,232,w2,8); R(g,'#c8ccd0',30,222,150,22); ell(g,105,232,50,8,'rgba(255,170,60,.8)'); R(g,'#3a2a20',360,220,56,24); },0,1432),x,w,true);
    blkT(w*.78,1.0,.6,tConc,x,PAVE_Y+.5,FZ-1.65,{color:0xb81419}); blk(w*.8,.05,.66,col(0xc8ccd0),x,PAVE_Y+1.02,FZ-1.65);
    blk(.9,.36,.5,glowC(0xffc070),x-.9,PAVE_Y+1.22,FZ-1.65); for(let i=0;i<3;i++) blk(.22,.12,.18,col(0xc8a050),x-1.2+i*.3,PAVE_Y+1.12,FZ-1.65);
    blk(.38,.3,.32,col(0x2a2a2c),x+1.1,PAVE_Y+1.2,FZ-1.65); blk(.3,.02,.24,glowC(0x9ad0ff),x+1.1,PAVE_Y+1.36,FZ-1.65);   /* till */
    for(const s of [-1,1]) blk(.42,.75,.42,col(0xc21b1b),x+s*1.2,PAVE_Y+.37,FZ-.7);                                      /* two stools */
  } else {
    backWall(P2(256,128,(g,w2,h)=>{ R(g,'#efeadc',0,0,w2,h); const r=rng(1433);
        for(let s=0;s<5;s++){ R(g,'#8a8378',60,18+s*22,196,2); for(let bx=62;bx<254;bx+=6){ const ht=8+(r()*7|0); g.fillStyle=mix(['#c83a2a','#2a7a3a','#e8c040','#3a5ab8','#7a2a5a','#d8d4c8'][r()*6|0],'#000000',r()*.3); g.fillRect(bx,18+s*22-ht,4,ht); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(bx,18+s*22-ht+1,1,ht-2); } }
        R(g,'#cfc6b4',4,20,50,60); for(let i=0;i<6;i++) R(g,['#2a4a8a','#c8a020','#8a1a1a'][i%3],8+(i%3)*15,26+(i>2?24:0),12,18); },0,1434),x,w,true);
    blkT(1.8,1.05,.6,tConc,x+w/2-1.2,PAVE_Y+.52,FZ-1.4,{color:0x3a2f28}); blk(1.86,.05,.66,col(0x8a7a64),x+w/2-1.2,PAVE_Y+1.07,FZ-1.4);
    for(let i=0;i<5;i++) blk(.07,.28,.07,col([0x2a6a3a,0x6a1a1a,0xc8a040,0x2a3a7a,0xd8d4c8][i]),x+w/2-1.9+i*.16,PAVE_Y+1.24,FZ-1.25);
    blk(.5,1.9,.5,col(0xd8dce0),x-w/2+.5,PAVE_Y+.95,FZ-1.2); blk(.44,1.7,.02,glowC(0xeaf6ff),x-w/2+.5,PAVE_Y+.98,FZ-.94);  /* drinks fridge */ }
  /* the frontage: stall riser, frame, mullions, transom, door */
  blkT(w-.1,.5,.24,tConc,x+.4,PAVE_Y+.25,front-.08,{color:0x2a2c30});
  blk(w,.08,.12,col(0x1a1b1d),x,PAVE_Y+.54,front-.06); blk(w,.1,.12,col(0x1a1b1d),x,PAVE_Y+2.62,front-.06); blk(w,.08,.12,col(0x1a1b1d),x,PAVE_Y+3.12,front-.06);
  for(const fx of [x0+.05,x0+w*.4,x1-1.15,x1-.05]) blk(.07,3.12,.12,col(0x1a1b1d),fx,PAVE_Y+1.56,front-.06);
  blk(.95,.1,.1,col(0x1a1b1d),x1-.6,PAVE_Y+2.62,front-.06); blk(.04,.5,.04,col(0xb8bcc0),x1-1.0,PAVE_Y+1.1,front);         /* door head and handle */
  const sign=kind==='rooster'?signTex(512,80,'#c4161c','#ffd23a','GOLDEN ROOSTER','FRIED CHICKEN · BURGERS · PERI PERI',{face:'fat',lit:true,edge:'#ffd23a',subC:'#ffffff',shadow:'#6a0a0c',logo:roosterLogo('#ffd23a','#6a0a0c')})
    :signTex(472,80,'#0e3a2a','#f3ecd2','BETHNAL WINES','OFF LICENCE · GROCERIES · OPEN TIL LATE',{face:'cond',lit:true,subC:'#c9a54a',edge:'#c9a54a',shadow:'#04160f',rule:true});
  const sm=MM(sign,{unlit:true}),edge=col(kind==='rooster'?0x8a1010:0x0a2a1e);
  mk(box(w,.78,.18),[edge,edge,edge,edge,sm,edge],STREET,x,3.62+PAVE_Y,front+.1);
  /* a projecting sign you can read side-on from up the street */
  if(kind==='rooster'){ const ps=MM(signTex(128,128,'#c4161c','#ffd23a','24/7',null,{face:'fat',lit:true,shadow:'#6a0a0c'}),{unlit:true}); blk(.04,.04,.7,col(0x2a2a2c),x1-.2,3.3,front+.35); mk(box(.08,.62,.62),[ps,ps,edge,edge,edge,edge],STREET,x1-.2,2.92,front+.5); }
}
const UNITS=[[-12,2.8,'shut'],[-7.3,5,'rooster'],[-2.1,4.6,'offy'],[2.6,4.2,'shut'],[7.2,4.4,'bookie'],[11.6,2.8,'lobby']];
for(const [x,w,k] of UNITS) shopFront(x,w,k);
/* the street name on the pier, at eye height, enamel-sign style */
mk(boxW(1.9,.48,.03,1.9,.48),MM(signTex(320,80,'#f6f4ee','#161616','Bethnal Green Road',null,{plate:'LONDON BOROUGH OF TOWER HAMLETS',pc:'E2'})),STREET,-9.9,2.5,FZ+.22);
/* bollards, a litter bin, a bus-stop flag */
for(const x of [-9.6,-5,0,5,9.8]){ mk(cyl(.075,.09,.92,10),col(0x18191c),STREET,x,PAVE_Y+.46,KERB_Z-.4); mk(cyl(.078,.078,.04,10),col(0xc8a040),STREET,x,PAVE_Y+.78,KERB_Z-.4); }
mk(cyl(.24,.22,.9,10),col(0x14261a),STREET,-4.6,PAVE_Y+.45,KERB_Z-.6); mk(cyl(.26,.26,.06,10),col(0x0e1a12),STREET,-4.6,PAVE_Y+.92,KERB_Z-.6);

/* ---------- the lamp: tapered column, bracket, lantern ---------- */
const LAMP=[3.6,6.6,KERB_Z-.35], LAMP2=[-8.6,6.6,KERB_Z-.35];
mk(cyl(.07,.12,6.8,10),col(0x2a2d33),STREET,LAMP[0],PAVE_Y+3.4,LAMP[2]); mk(cyl(.16,.16,.5,10),col(0x22252a),STREET,LAMP[0],PAVE_Y+.25,LAMP[2]);
blk(.08,.08,1.3,col(0x2a2d33),LAMP[0],6.95,LAMP[2]+.62);
mk(box(.5,.18,.34,{tw:.8,td:.8}),col(0x2a2d33),STREET,LAMP[0],7.0,LAMP[2]+1.22); blk(.42,.04,.26,glowC(0xffd090),LAMP[0],6.9,LAMP[2]+1.22);
wallP(1.4,1.4,tGlowSodium,LAMP[0],6.75,LAMP[2]+1.3,0,{unlit:true,cut:true,whole:true,cell:2,double:true});
mk(cyl(.07,.12,6.8,10),col(0x2a2d33),STREET,LAMP2[0],PAVE_Y+3.4,LAMP2[2]); mk(cyl(.16,.16,.5,10),col(0x22252a),STREET,LAMP2[0],PAVE_Y+.25,LAMP2[2]);
blk(.08,.08,1.3,col(0x2a2d33),LAMP2[0],6.95,LAMP2[2]+.62);
mk(box(.5,.18,.34,{tw:.8,td:.8}),col(0x2a2d33),STREET,LAMP2[0],7.0,LAMP2[2]+1.22); blk(.42,.04,.26,glowC(0xffd090),LAMP2[0],6.9,LAMP2[2]+1.22);
wallP(1.4,1.4,tGlowSodium,LAMP2[0],6.75,LAMP2[2]+1.3,0,{unlit:true,cut:true,whole:true,cell:2,double:true});

/* ---------- across the road: terraces with real reveals ---------- */
const TZ=ROAD_Z1+4;
wallP(34,8.6,tStock,0,4.3,TZ,Math.PI,{tile:1.6,tileH:1.5,cell:2});
blk(34,.3,.3,col(0xc8c0b0),0,8.3,TZ-.12); blk(34,.2,.2,col(0xc8c0b0),0,3.4,TZ-.1);
for(let i=0;i<7;i++){ const zc=-15+i*5+2.5,lit=[1,0,0,1,0,1,0][i];
  for(const [wx,wy,ww,wh,l] of [[zc+.8,1.9,1.5,1.7,lit],[zc-1.1,5.3,1,1.6,!(i%3)],[zc+1.2,5.3,1,1.6,0]]){ blk(ww+.2,wh+.2,.1,col(0xd9d2c4),wx,wy,TZ-.05); wallP(ww,wh,l?tWinLit:tWinDark,wx,wy,TZ-.11,Math.PI,{unlit:!!l,whole:true,cell:2}); blk(ww+.3,.08,.2,col(0xd0c8b8),wx,wy-wh/2-.1,TZ-.1); }
  blk(1.04,2.24,.1,col(0xd9d2c4),zc-1.45,1.12+PAVE_Y,TZ-.04); blk(.96,2.2,.06,col([0x14213d,0x1d3b2a,0x6e1414,0x111111,0x0e3b3b][i%5]),zc-1.45,1.1+PAVE_Y,TZ-.1); }
blkT(34,.85,.25,tStock,0,PAVE_Y+.42,ROAD_Z1+3.1,{tile:1.6,tileV:1.5});

/* ---------- the railway arch at the end of the street, and the sky ---------- */
const ARCH=N(STREET,-17,0,4,0,Math.PI/2,0);
wallP(14,12,tSoot,0,6,0,0,{parent:ARCH,tile:1.6,tileH:1.5,cell:2});
mk(box(8.4,4.6,.3),col(0x050506),ARCH,0,2.3,.2); mk(cyl(4.2,4.2,.3,14),col(0x050506),ARCH,0,4.6,.2,Math.PI/2);
{ const tLock=P2(256,160,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#3a2a1a'],[1,'#ffb060']]); R(g,'#1a1410',0,0,w,40); for(let i=0;i<5;i++) R(g,'#2a2420',20+i*46,70,30,90);
    R(g,'#c8c0b0',96,46,64,10); ell(g,128,118,26,16,'#2a1a10'); R(g,'#6a6a6a',150,96,60,40); R(g,'#e8a040',0,h-6,w,6); },0,1450);
  wallP(5.6,4.4,tLock,0,2.3,.4,0,{parent:ARCH,whole:true,unlit:true,cell:3});
  mk(boxW(4.2,.6,.12,4.2,.6),MM(signTex(420,60,'#141414','#f0a23e','ARCH 9 MOTORS','MOT · TYRES · BODYWORK · NO QUESTIONS',{face:'anton',subC:'#e8e2d4',edge:'#f0a23e'}),{unlit:true}),ARCH,0,6.2,.45); }
const sky=N(STREET); wallP(140,44,tSky,0,20,-44,0,{parent:sky,unlit:true,nofog:true,whole:true,cell:140}); wallP(140,44,tSky,0,20,64,Math.PI,{parent:sky,unlit:true,nofog:true,whole:true,cell:140});
for(const [x,h] of [[-18,46],[-8,30],[22,38],[30,26]]) mk(box(9,h,9),MM(null,{color:0x0b0c11,nofog:true}),sky,x,h/2,-36);

/* ---------- rain: a volume of crossed streaks around the viewer, two stacked blocks that fall and wrap ---------- */
const tStreak=P2(4,32,(g,w,h)=>{ g.clearRect(0,0,w,h); for(let y=0;y<h;y++){ const a=y/h; const v=Math.round(110+80*a); R(g,a>.3?`rgba(${v},${v+8},${v+20},1)`:'rgba(0,0,0,0)',1,y,2,1); } },0,1440);
function rainGeo(n,size,height,seed){ const g=new Geo(),r=rng(seed),L=.24,W=.007;
  for(let i=0;i<n;i++){ const x=(r()-.5)*size,y=r()*height,z=(r()-.5)*size;
    for(const [ux,uz] of [[1,0],[0,1]]){ const b=g.P.length/3; for(const [a,v] of [[-1,0],[1,0],[1,1],[-1,1]]) g.v([x+ux*a*W,y+v*L,z+uz*a*W],[0,0,1],[(a+1)/2,v]); g.I.push(b,b+1,b+2,b,b+2,b+3); } }
  g.groups.push({start:0,count:g.I.length,mi:0}); g.noCull=true; return g; }
const RAIN=N(STREET); RAIN.dyn=true; const rainMat=MM(tStreak,{unlit:true,cut:true,double:true});
const RAIN_H=7, rainBlocks=[0,1].map(i=>({n:mk(rainGeo(900,16,RAIN_H,1441+i),rainMat,RAIN,0,i*RAIN_H,0),i}));
function rainTick(t,eye){ RAIN.p=[Math.round(eye[0]),0,Math.round(eye[2])]; const fall=(t*8.5)%RAIN_H; for(const b of rainBlocks){ let y=b.i*RAIN_H-fall; if(y<-1) y+=RAIN_H*2; b.n.p[1]=y; } }

/* ---------- light ---------- */
const STREET_LIGHT={amb:[.23,.25,.25],dir:[-.3,1,.4],dirCol:[.16,.15,.14],fog:[.042,.05,.048],fogNear:12,fogFar:42,
  pl:[[[LAMP[0],5.2,LAMP[2]+1.0],[2.3,1.3,.5],13],[[-7.3,2.6,-1.4],[1.25,.6,.42],6],[[-2.1,2.6,-1.4],[.75,.9,.8],5],[[11.6,2.6,FZ-4.6],[1.0,1.1,1.2],8],
      [[LAMP2[0],5.2,LAMP2[2]+1.0],[2.3,1.3,.5],13],[[-3,6.2,-17],[2.1,1.25,.55],17],[[-1,2.6,5.4],[.62,.68,.7],10],[[-7.3,2.8,-4.4],[1.1,.92,.72],4.5]]};
