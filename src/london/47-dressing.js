/* =====================================================================================================
   STREET DRESSING: what makes it London at 2 a.m. and not just a street.
   - A zebra crossing with zig-zags, LOOK RIGHT, and two Belisha beacons blinking amber.
   - Degsy's motor at the kerb, hazards going, and a black cab dropping off across the road.
   - A red phone kiosk, a bus shelter with a lit advert, bin bags, chicken boxes, cans, a traffic cone.
   - Wet-road reflections: the lights streak down the tarmac towards you (screen-door cut-outs that turn to
     face the viewer, so they read in stereo), and steam rolls out of a manhole in the middle of the road.
   DRESS.tick(t, eye) runs every frame (frozen time stops all of it).
   ===================================================================================================== */
const DRESS=(()=>{
const D=N(STREET), ticks=[];
const once=(c,o={})=>M(null,Object.assign({color:c},o));
/* ---------- the zebra and its beacons ---------- */
const ZX0=12.2, ZX1=14.6;
const tZebra=P2(16,16,g=>{ R(g,'#d8d4cc',0,0,16,16); specks(g,'#8a8a86',10,1601,16,16); },0,1);
for(let z=KERB_Z+.2;z<ROAD_Z1-.3;z+=1.0) slab(ZX1-ZX0,.5,tZebra,(ZX0+ZX1)/2,.004,z+.25,{cell:3,tile:.5,tileD:.5,parent:D});
for(const side of [-1,1]) for(let k=0;k<6;k++){ const x=side<0?ZX0-1.0-k*1.05:ZX1+1.0+k*1.05;
  for(const z of [KERB_Z+.5,ROAD_Z1-.5]) mk(plane(1.18,.09),MM(tWhiteLine),D,x,.004,z,-Math.PI/2,0,(k%2?.32:-.32)); }
{ const t=hiP2(128,24,(g,w,h)=>{ g.clearRect(0,0,w,h); g.fillStyle='#e4e0d6'; g.font=`bold 20px ${SANS}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('LOOK RIGHT',w/2,h/2+1); });
  const m=M(t,{cut:true}); mk(plane(2.0,.38),m,D,(ZX0+ZX1)/2,.006,KERB_Z+.5,-Math.PI/2,0,Math.PI);
  const t2=hiP2(128,24,(g,w,h)=>{ g.clearRect(0,0,w,h); g.fillStyle='#e4e0d6'; g.font=`bold 20px ${SANS}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('LOOK LEFT',w/2,h/2+1); });
  mk(plane(2.0,.38),M(t2,{cut:true}),D,(ZX0+ZX1)/2,.006,ROAD_Z1-.5,-Math.PI/2); }
const tPole=P2(4,32,(g,w,h)=>{ for(let i=0;i<8;i++) R(g,i%2?'#141414':'#e8e6e0',0,i*4,w,4); },0,1);
const beaconM=M(null,{color:0xffa020,emissive:0xff8a10}), beaconOff=[.25,.12,.04], beaconOn=[2.2,1.15,.3];
const BEACONS=[[ZX0-.3,KERB_Z-.3],[ZX1+.3,ROAD_Z1+.3]];
for(const [x,z] of BEACONS){ const y0=z>ROAD_Z1?PAVE_Y:PAVE_Y; mk(cyl(.05,.05,2.4,8),MM(tPole,{repeat:[1,1]}),D,x,y0+1.2,z); mk(cyl(.17,.17,.32,12),beaconM,D,x,y0+2.56,z); mk(cyl(.07,.07,.06,8),col(0x141414),D,x,y0+2.75,z); }
/* ---------- Degsy's motor, hazards going; a black cab across the road ---------- */
function car(x,z,ry,body,o={}){ const n=N(D,x,0,z,0,ry,0), b=col(body), dark=col(0x0b0c0e), glass=MM(null,{color:0x14181e}), chrome=col(0x8a8e92);
  const L=o.L||4.4,W=o.W||1.78;
  mk(box(L,.62,W,{tw:.98,td:.97}),b,n,0,.62,0); mk(box(L*.96,.18,W*.98),dark,n,0,.28,0);
  mk(box(L*.5,.5,W*.86,{tw:.82,td:.86}),[glass,glass,b,b,glass,glass],n,-L*.04+(o.cabX||0),1.17,0);
  for(const sx of [-1,1]) for(const sz of [-1,1]){ mk(cyl(.31,.31,.2,10),dark,n,sx*L*.33,.31,sz*W*.47,Math.PI/2); mk(cyl(.17,.17,.21,8),chrome,n,sx*L*.33,.31,sz*W*.47,Math.PI/2); }
  const tail=M(null,{color:0x8a1010,emissive:o.tail?0x9a1408:0x2a0402}), head=M(null,{color:0xd8d8cc,emissive:o.head?0xfff0d0:0x202020});
  for(const sz of [-1,1]){ mk(box(.06,.14,.34),tail,n,L/2,.74,sz*W*.34); mk(box(.06,.14,.34),head,n,-L/2,.74,sz*W*.34); }
  const ind=[]; for(const sx of [-1,1]) for(const sz of [-1,1]){ const m=M(null,{color:0xff9a20,emissive:0x000000}); mk(box(.08,.08,.12),m,n,sx*(L/2+.01),.62,sz*W*.44); ind.push(m); }
  mk(box(.06,.12,.52),[chrome],n,-L/2-.02,.5,0); mk(box(.06,.12,.52),[chrome],n,L/2+.02,.5,0); /* number plates */
  return {n,ind}; }
const degsyCar=car(-10.2,KERB_Z+1.05,0,0x6a6e76,{L:4.6,W:1.8});           /* a tired silver saloon, nose east */
const cab=car(1.6,ROAD_Z1-1.05,Math.PI,0x0c0d10,{L:4.6,W:1.8,cabX:.25,tail:true});
{ const sign=M(P2(32,8,(g,w,h)=>{ R(g,'#ffc020',0,0,w,h); g.fillStyle='#1a1408'; g.font='bold 7px sans-serif'; g.textAlign='center'; g.fillText('TAXI',w/2,7); },0,1),{unlit:true});
  mk(box(.42,.13,.18),[sign,sign,col(0x1a1408),col(0x1a1408),sign,sign],cab.n,.2,1.5,0); }
/* ---------- a red phone kiosk and a bus shelter across the road ---------- */
{ const K=N(D,-3.2,PAVE_Y,ROAD_Z1+1.25,0,Math.PI,0), red=col(0xa8160f), w=.92,h=2.45;
  for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]) mk(box(.09,h,.09),red,K,sx*(w/2-.045),h/2,sz*(w/2-.045));
  mk(box(w+.06,.12,w+.06),red,K,0,.06,0); mk(box(w+.04,.32,w+.04),red,K,0,h+.16,0); mk(cyl(.36,.5,.2,12),red,K,0,h+.42,0,0,Math.PI/4);
  const tTel=hiP2(64,12,(g,w2,h2)=>{ R(g,'#141414',0,0,w2,h2); g.fillStyle='#f4f0e2'; g.font=`bold 9px ${SANS}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('TELEPHONE',w2/2,h2/2+1); });
  const tm=M(tTel,{unlit:true}); for(let k=0;k<4;k++){ const a=k*Math.PI/2; mk(plane(.7,.15),tm,K,Math.sin(a)*(w/2+.025),h+.16,Math.cos(a)*(w/2+.025),0,a,0); }
  const tPane=P2(32,64,(g,w2,h2)=>{ R(g,'rgba(0,0,0,0)',0,0,w2,h2); g.clearRect(0,0,w2,h2); R(g,'#a8160f',0,0,w2,2); R(g,'#a8160f',0,h2-2,w2,2); R(g,'#a8160f',0,0,2,h2); R(g,'#a8160f',w2-2,0,2,h2);
    for(let i=1;i<3;i++) R(g,'#a8160f',i*w2/3-1,0,2,h2); for(let j=1;j<8;j++) R(g,'#a8160f',0,j*h2/8-1,w2,2); },0,1);
  const pane=M(tPane,{cut:true,double:true}); for(let k=0;k<4;k++){ const a=k*Math.PI/2; mk(plane(w-.1,1.55,1,2),pane,K,Math.sin(a)*(w/2-.04),.95+.78,Math.cos(a)*(w/2-.04),0,a,0);
    mk(plane(w-.1,.8),red,K,Math.sin(a)*(w/2-.04),.5,Math.cos(a)*(w/2-.04),0,a,0); }
  mk(box(.3,.4,.16),col(0x1a1a1a),K,0,1.45,-w/2+.12); mk(box(.2,.06,.1),glowC(0xfff2d0),K,0,h-.1,0); }
{ const S_=N(D,6.6,PAVE_Y,ROAD_Z1+1.6), steel=col(0x6c7074), w=3.4,d=1.25;
  for(const sx of [-1,1]) for(const sz of [0,1]) mk(box(.07,2.4,.07),steel,S_,sx*w/2,1.2,sz*d);
  mk(box(w+.2,.1,d+.3),steel,S_,0,2.45,d/2); mk(box(2,.05,.28),steel,S_,-.2,.6,d-.25);
  const ad=hiP2(64,128,(g,w2,h2)=>{ vfill(g,0,0,w2,h2,[[0,'#0e2a6a'],[1,'#06102e']]); g.fillStyle='#f0f4ff'; g.font=`bold 22px ${SANS}`; g.textAlign='center'; g.fillText('VOLT',w2/2,34); g.font=`500 8px ${SANS}`; g.fillText('STAY UP.',w2/2,48); R(g,'#4ac8ff',22,62,20,52); R(g,'#f0f4ff',22,62,20,7); });
  mk(box(.12,1.9,d-.1),[MM(ad,{unlit:true}),MM(ad,{unlit:true}),col(0x1a1a1a),col(0x1a1a1a),col(0x1a1a1a),col(0x1a1a1a)],S_,-w/2-.06,1.12,d/2);
  const flag=hiP2(32,32,(g,w2,h2)=>{ R(g,'#f2f0ea',0,0,w2,h2); R(g,'#c8231c',0,0,w2,11); g.fillStyle='#fff'; g.font=`bold 7px ${SANS}`; g.textAlign='center'; g.fillText('BUS STOP',w2/2,8); g.fillStyle='#c8231c'; g.font=`bold 8px ${SANS}`; g.fillText('8  388',w2/2,22); });
  mk(cyl(.04,.04,2.9,8),steel,S_,w/2+.7,1.45,-.4); mk(box(.5,.5,.03),[col(0xf2f0ea),col(0xf2f0ea),col(0xf2f0ea),col(0xf2f0ea),MM(flag),MM(flag)],S_,w/2+.7,2.55,-.4); }
/* ---------- rubbish: bin bags by the shut units, chicken boxes, cans, a cone ---------- */
const bagM=col(0x0d0e10), bagHi=col(0x22252a);
for(const [x,z,n] of [[-12.6,FZ+.45,6],[1.9,FZ+.4,4],[8.3,FZ+.42,3]]){ const r=rng(x*13+7); for(let i=0;i<n;i++){ const s=.42+r()*.16; mk(cyl(s*.62,s*.7,s*(.9+r()*.3),7),i%3?bagM:bagHi,D,x+(r()-.5)*1.3,PAVE_Y+s*.48,z+r()*.45,(r()-.5)*.3,r()*3,(r()-.5)*.3); } }
{ const tBox=P2(16,16,(g,w,h)=>{ R(g,'#c21b1b',0,0,w,h); R(g,'#ffd23a',0,6,w,3); },0,1), bm=MM(tBox), can=[col(0xc8c8c8),col(0x2a6ab8),col(0x9a1a1a)], r=rng(1607);
  for(let i=0;i<7;i++) mk(box(.2,.07,.13),bm,D,-8.8+r()*3.4,PAVE_Y+.035,FZ+.4+r()*2.6,0,r()*3,(r()<.3?.4:0));
  for(let i=0;i<9;i++) mk(cyl(.033,.033,.12,6),can[i%3],D,-13+r()*24,PAVE_Y+.033,FZ+.3+r()*3.5,Math.PI/2,r()*3,0);
  for(let i=0;i<4;i++) mk(cyl(.033,.033,.12,6),can[i%3],D,-12+r()*22,.033,KERB_Z+.15+r()*.2,Math.PI/2,r()*3,0);
  mk(cyl(.03,.17,.62,8),col(0xe8601a),D,9.6,PAVE_Y+.33,KERB_Z-.25,.25,0,0); mk(box(.36,.04,.36),col(0x1a1a1a),D,9.6,PAVE_Y+.02,KERB_Z-.25); }
/* ---------- wet-road reflections: streaks that run from each light's foot towards the viewer ---------- */
const tStreakW=P2(16,64,(g,w,h)=>{ const d=g.createImageData(w,h); for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const u=(x/(w-1))*2-1,v=y/(h-1),a=Math.exp(-u*u*(4+10*v))*Math.pow(1-v,1.3)*(.75+.25*Math.sin(v*40+x)); const k=(y*w+x)*4; d.data[k]=255; d.data[k+1]=255; d.data[k+2]=255; d.data[k+3]=Math.max(0,Math.min(255,a*255)); } g.putImageData(d,0,0); },0,1);
const streaks=[];
/* flat on the ground, running from the node along +z (v = 0 at the light's foot); ry turns it to the viewer */
function streak(x,z,y,colr,len,wid){ const g=plane(wid,len,1,4); for(let i=0;i<g.P.length;i+=3){ const py=g.P[i+1]; g.P[i+1]=0; g.P[i+2]=len/2-py; g.Nm[i+1]=1; g.Nm[i+2]=0; }
  const m=M(tStreakW,{color:colr,unlit:true,double:true}); m.cut=2; const n=mk(g,m,D,x,y,z); n.dyn=true; const s={n,m,base:colr}; streaks.push(s); return s; }
for(const L_ of [LAMP,LAMP2]) streak(L_[0],L_[2]+1.22,.01,0xff9a40,8,.8);
streak(-7.3,FZ+.6,PAVE_Y+.006,0xff6050,3.2,1.6); streak(-2.1,FZ+.6,PAVE_Y+.006,0xc8e8d8,3.2,1.5);
const beaconStreaks=BEACONS.map(([x,z])=>streak(x,z+(z>ROAD_Z1?-.5:.5),.008,0xff9020,4,.4));
const hazardStreaks=[streak(-10.2-2.35,KERB_Z+1.05,.008,0xff9020,2.4,.35),streak(-10.2+2.35,KERB_Z+1.05,.008,0xff9020,2.4,.35)];
/* ---------- steam from a manhole in the road ---------- */
mk(cyl(.34,.34,.02,12),col(0x1a1a1c),D,5.2,.006,6.4);
const tPuff=P2(32,32,(g,w,h)=>{ g.clearRect(0,0,w,h); radial(g,16,16,16,[[0,'rgba(200,196,190,.55)'],[.5,'rgba(190,186,180,.22)'],[1,'rgba(180,176,170,0)']]); },0,1);
const puffs=[]; for(let i=0;i<9;i++){ const m=M(tPuff,{color:0xa8a49c,double:true}); m.cut=2; const n=mk(plane(1,1),m,D,5.2,.3,6.4); n.dyn=true; puffs.push({n,ph:i/9}); }
/* ---------- the vista east: the road carries on past more lamps and lit windows to the railway bridge, where an
   Overground train crosses every so often, lit windows sliding over the street ---------- */
const VX0=16, BRX=31;
slab(BRX+6-VX0,KERB_Z-FZ+1,tPaveW,(VX0+BRX+6)/2,PAVE_Y,(KERB_Z+FZ-1)/2,{tile:1.2,cell:3,parent:D});
slab(BRX+6-VX0,ROAD_Z1-KERB_Z,tTarmac,(VX0+BRX+6)/2,0,(KERB_Z+ROAD_Z1)/2,{tile:2,cell:3,parent:D});
slab(BRX+6-VX0,4,tPaveW,(VX0+BRX+6)/2,PAVE_Y,ROAD_Z1+2,{tile:1.2,cell:3,parent:D});
const tLitW=P2(64,64,(g,w,h)=>{ g.clearRect(0,0,w,h); const r=rng(1621); for(let y=0;y<4;y++) for(let x=0;x<4;x++){ if(r()<.42) continue; const c=r()<.8?['#ffc070','#ffd8a0','#ff9a50'][r()*3|0]:'#9ab8ff'; R(g,c,x*16+4,y*16+3,8,10); if(r()<.5) R(g,'rgba(80,30,20,.6)',x*16+4,y*16+3,3,10); } },0,1);
const litM=M(tLitW,{unlit:true,cut:true,nofog:false});
for(const [x0,w,h,side] of [[VX0,5,11,1],[VX0+5.4,4.6,13,1],[VX0+10.4,5.2,10,1],[VX0,4.4,9,-1],[VX0+4.8,6,10.5,-1],[VX0+11.2,4.2,12,-1]]){
  const z=side>0?FZ-2:TZ+2, cx=x0+w/2; blkT(w,h,4,tSoot,cx,h/2,z,{tile:1.6,tileV:1.5,parent:D,color:0x8a8078});
  wallP(w-.6,h-3.4,tLitW,cx,h/2+1.2,z+side*2.02,side>0?0:Math.PI,{tile:3,tileH:3,unlit:true,cut:true,parent:D});
  if(side>0) wallP(w-.8,2.6,shutterTex(1630+x0|0),cx,1.4,z+2.02,0,{whole:true,parent:D}); }
for(const [x,z,s] of [[VX0+3,KERB_Z-.35,1],[VX0+11,KERB_Z-.35,1],[VX0+7,ROAD_Z1+.35,-1]]){
  mk(cyl(.07,.11,6.8,8),col(0x2a2d33),D,x,PAVE_Y+3.4,z); blk(.08,.08,1.3,col(0x2a2d33),x,6.95,z+s*.62,D); blk(.42,.06,.26,glowC(0xffd090),x,6.9,z+s*1.22,D);
  const gm=MM(tGlowSodium,{unlit:true,double:true,nofog:true}); gm.cut=2; mk(plane(1.6,1.6),gm,D,x,6.75,z+s*1.3);
  streak(x,z+s*1.22,.01,0xff9a40,7,.7); }
/* the bridge: brick abutments, a girder deck across the road, and the train */
{ const deckY=6.2,z0=FZ-6,z1=TZ+6;
  for(const z of [FZ-3.5,TZ+3.5]) blkT(4,deckY,7,tSoot,BRX,deckY/2,z,{tile:1.6,tileV:1.5,parent:D});
  blk(3.4,1.3,z1-z0,col(0x22302a),BRX,deckY+.65,(z0+z1)/2,D); for(let z=z0;z<z1;z+=1.2) blk(3.5,.12,.08,col(0x18221e),BRX,deckY+.2,z,D);
  blk(3.6,.12,z1-z0,col(0x3a4a40),BRX,deckY+1.36,(z0+z1)/2,D);
  const tB=hiP2(256,32,(g,w,h)=>{ R(g,'#22302a',0,0,w,h); g.fillStyle='#d8d4c8'; g.font=`bold 20px ${SANS}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('BETHNAL GREEN',w/2,h/2+1); });
  mk(plane(7,.9),MM(tB),D,BRX-1.72,deckY+.65,(KERB_Z+ROAD_Z1)/2,0,-Math.PI/2,0);
  mk(box(.3,.4,.2),glowC(0xfff0d0),D,BRX-1.8,deckY-.3,(KERB_Z+ROAD_Z1)/2); }
const tTrain=P2(128,32,(g,w,h)=>{ R(g,'#d8d8d4',0,0,w,h); R(g,'#e86a10',0,h-8,w,5); R(g,'#1a1a1c',0,4,w,2); for(let x=4;x<w;x+=16){ R(g,'#ffe8c0',x,9,11,12); R(g,'rgba(60,40,30,.5)',x+7,13,3,8); } R(g,'#2a2a2c',60,8,8,18); },0,1);
const TRAIN=N(D,BRX,6.2+1.42,0); TRAIN.dyn=true; const trainM=MM(tTrain,{unlit:true,nofog:true,repeat:[4,1]});
for(let c=0;c<3;c++) mk(box(2.8,3.0,19.6),[trainM,trainM,col(0x4a4a4c),col(0x101010),col(0xc8c8c4),col(0xc8c8c4)],TRAIN,0,1.5,c*20);
/* ---------- the tick ---------- */
function face(n,eye){ n.r=[0,Math.atan2(eye[0]-n.p[0],eye[2]-n.p[2]),0]; }
const sc=(c,k)=>[((c>>16)&255)/255*k,((c>>8)&255)/255*k,(c&255)/255*k];
return { tick(t,eye){
  const bOn=(Math.floor(t/.75)%2)===0; beaconM.emis=bOn?beaconOn:beaconOff;
  for(const s of beaconStreaks){ s.m.color=sc(s.base,bOn?1:.0); }
  const hz=(Math.floor(t/.55)%2)===0; for(const m of degsyCar.ind) m.emis=hz?[1.6,.8,.15]:[0,0,0];
  for(const s of hazardStreaks) s.m.color=sc(s.base,hz?.8:0);
  for(const s of streaks){ const n=s.n; n.r=[0,Math.atan2(eye[0]-n.p[0],eye[2]-n.p[2]),0]; }
  { const per=26, k=(t%per)/per; TRAIN.vis=k<.42; TRAIN.p[2]=-70+k/.42*170; }
  for(const p of puffs){ const k=(t*.22+p.ph)%1, s=.35+k*1.1; p.n.p=[5.2+k*.7+Math.sin(t+p.ph*9)*.12,.2+k*2.0,6.4+k*.3]; p.n.s=[s,s,s]; face(p.n,eye);
    if(k>.8){ const q=1-(k-.8)/.2; p.n.s=[s*q,s*q,s*q]; } }
} };
})();
