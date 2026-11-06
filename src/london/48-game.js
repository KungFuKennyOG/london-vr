/* =====================================================================================================
   THE MVP: "THE BAG". One job on Bethnal Green Road, on desktop or in the headset.
   You come out of Hollis House. Degsy, outside the Golden Rooster, has a bag on the boot of his motor that needs
   to get to Arch 9 under the railway bridge at the east end, and two coppers are between you and it.
   - Carry the bag where PC Hughes or PC Okafor can see it and their "?" fills: run, or stay in view close up, and
     it fills faster. Full: one star, and that copper comes for you at a walk.
   - Run while they can see you, or keep them chasing, and it goes to two stars: both of them, running.
   - Break line of sight (cars, the phone box, the bus shelter, a shop doorway, the Hollis House lobby) long enough
     and they lose you: they check where they last saw you, then go back to their posts.
   - A copper within arm's reach while you have stars: nicked. Get the bag to Arch 9 with no stars: job done.
   Everything else on the street is the art set (46, 47); this file adds the rules, the player, the coppers'
   eyes and legs (Stairwell's gait module), the barks, the HUD, and the WebXR loop.
   ===================================================================================================== */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const mv=(R,v)=>[R[0][0]*v[0]+R[1][0]*v[1]+R[2][0]*v[2],R[0][1]*v[0]+R[1][1]*v[1]+R[2][1]*v[2],R[0][2]*v[0]+R[1][2]*v[1]+R[2][2]*v[2]];
const mtv=(R,v)=>[v3.dot(R[0],v),v3.dot(R[1],v),v3.dot(R[2],v)];
const ryM=a=>[[Math.cos(a),0,-Math.sin(a)],[0,1,0],[Math.sin(a),0,Math.cos(a)]];
const RANGED={}; function sfx(){}
const PL={x:0,z:0};

const GAME=(()=>{
const G={on:false,xr:false,phase:'meet',stars:0,lostT:0,hasBag:false,t:0,line:null,lineT:0,queue:[],said:new Set(),maxStars:0,endT:0,result:null,heatT:0,obj:''};
const P={x:11.6,z:FZ-1.7,yaw:0,pitch:-.05,run:false,r:.24};
const START={x:11.6,z:FZ-1.7,yaw:0};
const LOCKUP={x:31,z:FZ+.6};
const BAG_HOME=[-8.4,1.13,KERB_Z+1.05];

/* ---------- where you can stand (point-in-rects, shrunk by your radius) and what blocks sight ---------- */
const WALK=[[-16.3,FZ+.22,36.4,ROAD_Z1+2.75],
  [-9.65,FZ-1.2,-4.95,FZ-.12],[-5.95,FZ-.4,-4.9,FZ+.8],           /* the Golden Rooster and its door */
  [-4.25,FZ-1.0,.05,FZ-.12],[-.95,FZ-.4,.15,FZ+.8],               /* Bethnal Wines */
  [10.45,FZ-2.75,12.75,FZ+.8],                                     /* Hollis House lobby */
  [11.0,FZ-6.0,12.2,FZ-2.0],                                       /* the passage through */
  [9.6,FZ-8.35,29.0,FZ-5.45],                                     /* the back alley, east to the bridge */
  [-15.8,-9.5,-13.9,FZ+.9],                                       /* the estate's vehicle gateway off the street */
  [-15.9,-25.95,10.4,-8.65],                                       /* the Hollis Estate courtyard */
  [30.0,FZ-1.6,32.0,FZ+.8]];                                       /* Arch 9 */
const BACKDOOR={x:28.7,z:FZ-6.9};
const FENCE_X=20.5;
const BLOCK=[[-12.55,KERB_Z+.12,-7.85,KERB_Z+1.98],[-.75,ROAD_Z1-1.98,3.95,ROAD_Z1-.12],[-3.72,ROAD_Z1+.73,-2.68,ROAD_Z1+1.77],
  [4.85,ROAD_Z1+2.7,8.35,ROAD_Z1+2.95],[4.8,ROAD_Z1+1.6,4.98,ROAD_Z1+2.85],[-4.86,KERB_Z-.86,-4.34,KERB_Z-.34]];
for(const x of [-9.6,-5,0,5,9.8]) BLOCK.push([x-.12,KERB_Z-.52,x+.12,KERB_Z-.28]);
BLOCK.push([FENCE_X-.08,FZ-8.45,FENCE_X+.08,FZ-5.5]); /* the hoarding across the back alley */
for(const [x,z] of [[3.6,KERB_Z-.35],[-8.6,KERB_Z-.35],[11.9,KERB_Z-.3],[14.9,ROAD_Z1+.3]]) BLOCK.push([x-.15,z-.15,x+.15,z+.15]); /* lamp columns, Belisha beacons */
/* sight: the cars, the phone box, the shelter's advert, every pier and shop wall along the frontage, the lobby's walls */
const SIGHT=BLOCK.slice(0,5);
for(const [x,w] of UNITS.map(u=>[u[0],u[1]])) for(const s of [-1,1]) SIGHT.push([x+s*(w/2+.21)-.21,FZ-2.6,x+s*(w/2+.21)+.21,FZ+.2]);
for(const x of [10.2,13.0]) SIGHT.push([x-.06,FZ-2.6,x+.06,FZ]);                   /* the lobby's side walls */
/* the buildings, with the gateway, the passage, the alley and the estate courtyard carved out */
SIGHT.push([-40,-60,-15.9,FZ-2.62],[-13.8,-8.6,10.95,FZ-2.62],[12.25,FZ-5.55,40,FZ-2.62],[10.45,-60,40,FZ-8.45],[-40,-60,10.45,-26.0],[29.05,FZ-8.45,40,FZ-5.55]);
SIGHT.push([FENCE_X-.08,FZ-8.45,FENCE_X+.08,FZ-5.5],[10.2,FZ-2.68,11.0,FZ-2.55],[12.2,FZ-2.68,13.0,FZ-2.55]);                  /* the lobby's back wall either side of the doorway */
for(let i=0;i<SIGHT.length;i++){ const r=SIGHT[i]; SIGHT[i]=[Math.max(r[0],-16.6),Math.max(r[1],-27.2),Math.min(r[2],36.5),Math.min(r[3],15.2)]; } /* the hub's own buildings hide you via the nav grid */
const inR=(r,x,z,m)=>x>r[0]+m&&x<r[2]-m&&z>r[1]+m&&z<r[3]-m;
function standable(x,z,rad){ if(NAV&&!inCore(x,z,0)) return navWalk(x,z,rad); if(!WALK.some(r=>inR(r,x,z,rad))) return false; for(const b of BLOCK) if(inR([b[0]-rad,b[1]-rad,b[2]+rad,b[3]+rad],x,z,0)) return false; return true; }
function segHits(ax,az,bx,bz,r){ /* slab test, 2D */ let t0=0,t1=1; const dx=bx-ax,dz=bz-az;
  for(const [p,d,lo,hi] of [[ax,dx,r[0],r[2]],[az,dz,r[1],r[3]]]){ if(Math.abs(d)<1e-9){ if(p<lo||p>hi) return false; continue; } let a=(lo-p)/d,b=(hi-p)/d; if(a>b){ const t=a; a=b; b=t; } t0=Math.max(t0,a); t1=Math.min(t1,b); if(t0>t1) return false; } return true; }
function clearLine(ax,az,bx,bz,high){ for(let i=0;i<SIGHT.length;i++){ if(high&&i<5&&i!==2) continue; /* up on something: cars and the shelter don't hide you */ if(segHits(ax,az,bx,bz,SIGHT[i])) return false; } if(NAV&&!navSight(ax,az,bx,bz)) return false; return true; }
function moveBody(o,dx,dz,rad){ if(standable(o.x+dx,o.z,rad)) o.x+=dx; if(standable(o.x,o.z+dz,rad)) o.z+=dz; }
const floorY=(x,z)=>(HUBX&&!inCore(x,z))?HUBX.floor(x,z):(z>KERB_Z&&z<ROAD_Z1?0:PAVE_Y);

/* ---------- Arch 9: the lock-up in the bridge's near abutment, shutter half up, light spilling out ---------- */
{ const A=N(STREET,LOCKUP.x,0,FZ+.02);
  const tIn=P2(128,64,(g,w,h)=>{ vfill(g,0,0,w,h,[[0,'#3a2412'],[1,'#ffb050']]); R(g,'#1a120c',0,0,w,18); for(let i=0;i<4;i++) R(g,'#2a2018',8+i*30,30,20,34); ell(g,64,58,22,6,'rgba(30,20,10,.8)'); R(g,'#c8c0b0',44,22,40,6); },0,1);
  wallP(2.0,2.4,tIn,0,PAVE_Y+1.2,-1.4,0,{parent:A,whole:true,unlit:true,cell:2});
  for(const s of [-1,1]) wallP(1.4,2.4,tConc,s*1.0,PAVE_Y+1.2,-.7,-s*Math.PI/2,{parent:A,tile:2,color:0x8a6a48});
  slab(2.0,1.4,tConc,0,PAVE_Y+.01,-.7,{parent:A,tile:.8,color:0xa08060});
  wallP(2.1,1.2,tShutterL,0,PAVE_Y+2.4,.0,0,{parent:A,whole:true});                     /* the shutter, half up */
  blk(2.3,.4,.4,col(0x2a2c2e),0,PAVE_Y+3.15,.1,A);
  mk(boxW(2.4,.5,.1,2.4,.5),MM(signTex(240,50,'#141414','#f0a23e','ARCH 9','T. MOTORS · CASH ONLY',{face:'anton',subC:'#e8e2d4',edge:'#f0a23e'}),{unlit:true}),A,0,PAVE_Y+3.7,.2);
  blk(.3,.12,.18,glowC(0xffe0a0),0,PAVE_Y+2.95,-.4,A); }

/* ---------- through Hollis House: a passage and the back alley behind the shops, to Arch 9's back door ---------- */
{ const B_=N(STREET), floorM=MM(tPaveW,{repeat:[1,1]}), z0=FZ-8.4,z1=FZ-5.6;
  slab(1.2,3.0,tConc,11.6,PAVE_Y,FZ-4.1,{parent:B_,tile:1,cell:1,color:0x8a8a84});
  for(const x of [11.0,12.2]) wallP(3.0,3.0,tConc,x,PAVE_Y+1.5,FZ-4.1,x<11.6?Math.PI/2:-Math.PI/2,{parent:B_,tile:2,color:0xd8dcd6});
  for(const z of [FZ-3.2,FZ-5.0]) blk(.12,.05,.9,glowC(0xeef6ff),11.6,PAVE_Y+2.94,z,B_);   /* strip lights */
  mk(boxW(1.0,.22,.03,1.0,.22),MM(signTex(200,44,'#eeebe2','#1b1b1b','TO REAR & BINS  ›',null,{face:'grot',frame:'#1b1b1b'}),{unlit:true}),B_,11.6,PAVE_Y+2.45,FZ-2.66,0,Math.PI,0);
 blk(.4,.06,.2,glowC(0xe8f0f4),11.6,PAVE_Y+2.95,FZ-4.0,B_);
  slab(18.6,2.8,tPaveW,(10.4+29)/2,PAVE_Y,(z0+z1)/2,{parent:B_,tile:1.2,cell:1.2});
  wallP(18.6,4.2,tSoot,(10.4+29)/2,PAVE_Y+2.1,z0,0,{parent:B_,tile:1.6,tileH:1.5,cell:1.2});                 /* the far wall of the alley */
  wallP(15.4,4.2,tSoot,10.4,PAVE_Y+2.1,z0-7.3,-Math.PI/2,{parent:B_,tile:1.6,tileH:1.5,cell:1.5});                    /* the courtyard's east wall, south of the alley mouth */
  wallP(11.0-10.0,4.2,tConc,10.5,PAVE_Y+2.1,z1,Math.PI,{parent:B_,tile:2}); wallP(29-12.2,4.2,tConc,(12.2+29)/2,PAVE_Y+2.1,z1,Math.PI,{parent:B_,tile:2,color:0x9a968e}); /* the backs of the shops */
  wallP(2.8,6.2,tSoot,29.05,PAVE_Y+3.1,(z0+z1)/2,-Math.PI/2,{parent:B_,tile:1.6,tileH:1.5});                /* the bridge abutment */
  /* back windows, bins, pipes, a security light, Arch 9's back door */
  for(const x of [14,17.5,21,24.5]){ wallP(.8,.9,(x|0)%2?tWinLit:tWinDark,x,PAVE_Y+2.6,z1-.03,Math.PI,{parent:B_,whole:true,unlit:(x|0)%2===1}); blk(.06,4.2,.06,col(0x2a2a2a),x+1.2,PAVE_Y+2.1,z1-.06,B_); }
  /* a hoarding across the alley, plastered with fly-posters; two wheelie bins in front are the way up */
  { const tPost=P2(256,128,(g,w,h)=>{ R(g,'#3a2c1e',0,0,w,h); const r=rng(1681); for(let i=0;i<w;i+=16) R(g,'rgba(0,0,0,.25)',i,0,2,h);
      const posters=[['#e83a8a','#111','RAVE','ROMFORD · SAT'],['#f2d43a','#111','GARAGE','MINISTRY'],['#2a6ac8','#fff','GRIME','CLUB 9'],['#ece8e0','#c8231c','LOST CAT','REWARD'],['#111','#f0a23e','JUNGLE','ALL NITE'],['#58b848','#111','SOUND','SYSTEM']];
      for(let k=0;k<14;k++){ const pp=posters[k%posters.length],x=(k*41+r()*20)%(w-40),y=6+r()*(h-60),pw=34+r()*10,ph=46+r()*8; g.save(); g.translate(x+pw/2,y+ph/2); g.rotate((r()-.5)*.12); R(g,pp[0],-pw/2,-ph/2,pw,ph); g.fillStyle=pp[1]; g.font=`bold 10px ${SANS}`; g.textAlign='center'; g.fillText(pp[2],0,-6); g.font='bold 5px sans-serif'; g.fillText(pp[3],0,6); g.restore(); } },4,1682);
    for(const sd of [-1,1]) wallP(2.9,2.3,tPost,FENCE_X+sd*.046,PAVE_Y+1.15,(z0+z1)/2,sd*Math.PI/2,{parent:B_,whole:true,unlit:true,color:0x9a9088}); /* both faces, lit by the security lamp above */
    blk(.08,2.36,2.95,col(0x2a2018),FENCE_X,PAVE_Y+1.15,(z0+z1)/2,B_); for(const z of [z0+.05,z1-.05]) blk(.12,2.5,.12,col(0x1a1410),FENCE_X,PAVE_Y+1.25,z,B_);
    for(const z of [FZ-6.2,FZ-6.95]){ blk(.62,1.1,.7,col(0x1a3a2a),FENCE_X-.55,PAVE_Y+.55,z,B_); blk(.66,.06,.74,col(0x111111),FENCE_X-.55,PAVE_Y+1.12,z,B_); } }
  for(const [x,c] of [[15.6,0x1a3a2a],[16.4,0x2a2a2a],[22.8,0x1a3a2a]]){ blk(.62,1.1,.7,col(c),x,PAVE_Y+.55,z0+.42,B_); blk(.66,.06,.74,col(0x111111),x,PAVE_Y+1.12,z0+.42,B_); }
  for(let i=0;i<4;i++) mk(cyl(.2,.24,.4,7),col(0x0d0e10),B_,19.5+i*.4,PAVE_Y+.2,z0+.3+(i%2)*.3,0,i,0);
  blk(.3,.15,.15,glowC(0xfff0d0),FENCE_X-.4,PAVE_Y+3.3,z1-.1,B_); { const gm=MM(tGlowSodium,{unlit:true,double:true}); gm.cut=2; mk(plane(1.4,1.4),gm,B_,FENCE_X-.4,PAVE_Y+3.2,z1-.2,0,Math.PI,0); }
  wallP(1.1,2.2,tShutterL,29.0,PAVE_Y+1.1,BACKDOOR_Z(),-Math.PI/2,{parent:B_,whole:true}); mk(boxW(1.2,.3,.06,1.2,.3),MM(signTex(160,40,'#141414','#f0a23e','ARCH 9',null,{face:'anton',edge:'#f0a23e'}),{unlit:true}),B_,28.98,PAVE_Y+2.45,BACKDOOR_Z(),0,-Math.PI/2,0);
  blk(.2,.1,.1,glowC(0xffd090),28.9,PAVE_Y+2.75,BACKDOOR_Z(),B_); }
function BACKDOOR_Z(){ return FZ-6.9; }

/* ---------- the bag ---------- */
const tBag=P2(64,32,(g,w,h)=>{ R(g,'#1a2236',0,0,w,h); R(g,'#e8e6e0',0,13,w,4); specks(g,'#0e1220',90,1671,w,h); R(g,'#0a0c14',30,0,4,h); },0,1);
const BAG=N(STREET,...BAG_HOME); BAG.dyn=true;
mk(box(.56,.3,.3),MM(tBag),BAG,0,0,0); for(const s of [-1,1]) mk(box(.04,.14,.03),col(0x0a0c14),BAG,s*.1,.21,0); mk(box(.24,.03,.03),col(0x0a0c14),BAG,0,.28,0);
BAG.r=[0,.1,0];

/* ---------- the coppers: eyes, a "?" over the head, legs from the gait module ---------- */
const tMark=k=>P2(64,64,(g,w,h)=>{ g.clearRect(0,0,w,h); g.font=`bold 56px ${SANS}`; g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle='#000'; g.fillText(k===3?'!':'?',w/2+3,h/2+5); g.fillStyle=k===3?'#ff3a28':k===2?'#ffd040':'#e8e2d4'; g.fillText(k===3?'!':'?',w/2,h/2+2); },0,1);
const markM=[1,2,3].map(k=>M(tMark(k),{unlit:true,cut:true,double:true}));
const COPS=[];
function makeCop(id,post,patrol,Cx){ const C=Cx||CAST[id],m=mk(plane(.3,.3),markM[0],STREET); m.vis=false; m.dyn=true;
  const c={id,C,post,patrol,pi:0,wait:0,state:'post',sus:0,mark:m,hd:post[2],pos:[post[0],post[1]],E:null,seeT:0,target:null,searchT:0,speed:0,look:0};
  c.E={J:C.J,o:C.o,hd:c.hd,pos:c.pos,walkAmt:0,runAmt:0,hp:{legL:1,legR:1,armL:1,armR:1},wpnHeld:false,kind:'pc',aware:false};
  COPS.push(c); return c; }

/* ---------- lines: subtitles over heads (world labels) and on screen ---------- */
const LINES={
  degsyWave:['degsy','Two Sugars! Over here, son.'],
  d1:['degsy','Just the man. Got a little job for you.'],
  d2:['degsy','Bag\'s on the boot of my motor. Take it to Arch 9, under the bridge. Terry\'s expecting it.'],
  d3:['degsy','Don\'t open it. Don\'t run. And don\'t let the Old Bill see it.'],
  dGo:['degsy','Bridge is east. Old Bill about? Go round the back: through Hollis House, or the estate gates at the end there. The back alley comes out at the arch.'],
  oi:['pcmale','Oi! You! What\'s in the bag?'],
  oiO:['pcfem','Stop right there!'],
  run2:['pcfem','Control, I\'m in foot pursuit, Bethnal Green Road!'],
  lost:['pcmale','...Lost him.'],
  search:['pcmale','Where\'d he go?'],
  terryNo:['terry','Not with the Old Bill on you. Lose \'em first.'],
  terryYes:['terry','Bag. Ta. Tell Degsy he\'s short. Again.'],
  nicked:['pcmale','You\'re nicked, son.'],
  nickedO:['pcfem','Hands where I can see them. You\'re nicked.'],
  maureen:['maureen','Bit late for you, isn\'t it, Danny?'],
  ali:['ali','Wings are fresh, Danny. Two for three quid.'],
  piotr:['piotr','Night, mate.'],
  kwame:['kwame','Stairs are mine, Two Sugars. You never came this way.'],
};
const tLab=()=>tex(512,96,null,null);
const labels={};
function retex(t){ t.f=-1; if(t.glt){ gl.bindTexture(gl.TEXTURE_2D,t.glt); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,t.c); curTex=null; } }
function drawLabel(t,text){ const g=t.c.getContext('2d'),w=512,h=96; g.clearRect(0,0,w,h); g.font=`bold 30px ${TYPEF}`; const words=text.split(' '); const lines=[]; let ln='';
  for(const wd of words){ const tr=ln?ln+' '+wd:wd; if(g.measureText(tr).width>w-40&&ln){ lines.push(ln); ln=wd; } else ln=tr; } lines.push(ln);
  const lh=36,bh=lines.length*lh+16,y0=h-bh; let mw=0; for(const l of lines) mw=Math.max(mw,g.measureText(l).width);
  g.fillStyle='rgba(6,6,6,1)'; g.fillRect((w-mw)/2-14,y0,mw+28,bh); g.fillStyle='#f4efe4'; g.textAlign='center'; g.textBaseline='middle';
  lines.forEach((l,i)=>g.fillText(l,w/2,y0+8+lh*(i+.5))); retex(t); }
function labelFor(who){ if(!labels[who]){ const t=tLab(); const n=mk(plane(1.3,.244),M(t,{unlit:true,cut:true,double:true}),STREET); n.vis=false; n.dyn=true; labels[who]={t,n}; } return labels[who]; }
function say(key,dur=3.2){ const [who,text]=LINES[key]; G.queue.push({who,text,dur}); }
function sayNow(key,dur=3){ G.queue.length=0; G.line=null; say(key,dur); }
function speakerHead(who){ if(who==='terry') return [LOCKUP.x,PAVE_Y+2.2,FZ-.2]; if(who==='lenny'&&typeof LENNY!=='undefined'&&LENNY) return v3.add(mulP(LENNY.C.J.head.world,[0,0,0]),[0,.42,0]); if(who==='danny') return null; const C=CAST[who]; if(!C) return null; return v3.add(mulP(C.J.head.world,[0,0,0]),[0,.42,0]); }

/* ---------- HUD (desktop HTML; in the headset, Danny's phone in the left hand) ---------- */
const $g=id=>document.getElementById(id);
function setObj(s){ if(G.obj===s) return; G.obj=s; const gb=$g('tGrab'); if(gb) gb.textContent=G.result?'Again':'Grab'; const e=$g('gObj'); if(e) e.textContent=s; phoneDirty=true; }
function setStars(n){ n=clamp(n,0,2); if(G.stars!==n){ G.stars=n; G.maxStars=Math.max(G.maxStars,n); phoneDirty=true; } const e=$g('gStars'); if(e){ e.dataset.n=n; e.textContent=n?'★'.repeat(n)+'☆'.repeat(2-n):''; } }
let phoneDirty=true;

/* ---------- the player in the world: a held bag on desktop, hands and a phone in the headset ---------- */
const HANDS={};
const tPhone=tex(256,448,'#0a0a0c',null);
function drawPhone(){ const g=tPhone.c.getContext('2d'),w=256,h=448; R(g,'#0b0c10',0,0,w,h); R(g,'#c8231c',0,0,w,46); g.fillStyle='#fff'; g.font=`bold 24px ${TYPEF}`; g.textAlign='left'; g.fillText('DEGSY',14,32);
  g.fillStyle='#f0ece2'; g.font=`bold 22px ${TYPEF}`; const words=G.obj.split(' '); let ln='',y=90; for(const wd of words){ const tr=ln?ln+' '+wd:wd; if(g.measureText(tr).width>w-28&&ln){ g.fillText(ln,14,y); ln=wd; y+=30; } else ln=tr; } g.fillText(ln,14,y);
  g.font=`64px ${SANS}`; g.fillStyle=G.stars?'#ffd040':'#3a3a3a'; g.fillText('★',20,h-40); g.fillStyle=G.stars>1?'#ffd040':'#3a3a3a'; g.fillText('★',110,h-40);
  g.font=`bold 18px ${TYPEF}`; g.fillStyle='#8a857a'; g.fillText((typeof todStr==='function'?todStr():'02:14')+'  E2',14,h-110); if(G.cash){ g.fillStyle='#7ad87a'; g.fillText('£'+G.cash+' found',140,h-110); } if(promptK){ g.fillStyle='#f0a23e'; g.font=`bold 22px ${TYPEF}`; g.fillText('A · '+(promptK==='climb'?'CLIMB':'VAULT'),14,h-140); } if(typeof phoneExtra==='function') phoneExtra(g,w,h); retex(tPhone); phoneDirty=false; }
function buildHands(){ const skin=M(null,{color:0xc8906c}),sleeve=M(null,{color:0x111214});
  for(const s of ['left','right']){ const n=N(STREET); n.dyn=true; mk(box(.085,.1,.11),skin,n,0,0,.02); mk(box(.03,.05,.06),skin,n,(s==='left'?1:-1)*.05,.02,-.01); mk(cyl(.045,.05,.2,8),sleeve,n,0,-.01,.15,Math.PI/2); n.vis=false; HANDS[s]={n,M:m4.make(),pos:[0,0,0],grip:false,gripEdge:false}; }
  const ph=N(HANDS.left.n); mk(box(.075,.14,.01),col(0x111111),ph,0,0,0); mk(plane(.066,.116),M(tPhone,{unlit:true}),ph,0,0,.006); ph.p=[0,.07,-.02]; ph.r=[-.9,0,0]; }

/* ---------- start / reset ---------- */
function reset(){
  G.phase='meet'; G.hasBag=false; G.lostT=0; G.queue=[]; G.line=null; G.said.clear(); G.maxStars=0; G.t=0; G.result=null; G.endT=0; setStars(0);
  P.x=START.x; P.z=START.z; P.yaw=START.yaw; P.pitch=-.05; P.run=false; ACT.on=false; P.hop=0; P.y=PAVE_Y; P.vy=0; P.vx=P.vz=0; P.ground=true; CLIMB.hand=null;
  BAG.p=BAG_HOME.slice(); BAG.r=[0,.1,0]; setParent(BAG,STREET);
  for(const c of COPS){ c.pos[0]=c.post[0]; c.pos[1]=c.post[1]; c.hd=c.post[2]; c.state='post'; c.sus=0; c.pi=0; c.wait=0; c.E.G=null; c.mark.vis=false; }
  for(const k in labels) labels[k].n.vis=false;
  if(typeof SEEN!=='undefined') SEEN.clear(); if(frozen) unfreeze();
  G.cash=0; for(const c of CASH){ c.got=false; c.n.vis=true; } { const e=$g('gCash'); if(e) e.hidden=true; }
  setObj('Degsy wants a word. He\'s outside the Golden Rooster, up the road to the west.');
  const end=$g('gEnd'); if(end) end.hidden=true; }
function start(vr){ G.on=true; G.xr=!!vr; document.body.classList.add('playing'); state.eye=true; state.layout='street'; place();
  if(!COPS.length){ makeCop('pcmale',[5.0,.55,-Math.PI/2],[[1.5,.55],[9.4,.55]]); makeCop('pcfem',[26.0,.7,-Math.PI/2],null); /* Hughes walks the near pavement; Okafor minds the front of the arches */ buildHands(); }
  CAST.danny.node.vis=false; /* you are Danny */
  reset(); }

/* ---------- copper brain ---------- */
function canSee(c){ const dx=P.x-c.pos[0],dz=P.z-c.pos[1],d=Math.hypot(dx,dz); if(d>14) return false;
  const fx=Math.sin(c.hd+c.look),fz=Math.cos(c.hd+c.look),cos=(dx*fx+dz*fz)/(d||1);
  if(d>2.2&&cos<Math.cos(1.05)) return false; return clearLine(c.pos[0],c.pos[1],P.x,P.z,P.y-floorY(P.x,P.z)>.6); }
function copTick(c,dt){ if(frozen&&state.pick===c.id) return;
  if(c.hub){ const far=Math.hypot(P.x-c.pos[0],P.z-c.pos[1]); c.C.node.vis=far<75; if(far>75&&c.state!=='chase'){ c.seeing=false; return; } }
  const sees=canSee(c), d=Math.hypot(P.x-c.pos[0],P.z-c.pos[1]); c.seeing=sees;
  let goal=null,speed=0,run=0;
  if(G.stars===0){
    if(sees&&G.hasBag){ c.sus+=dt*(P.running?2.6:.55)*(d<6?1.7:d>10?.45:1)*(c.state==='search'?1.5:1); } else c.sus=Math.max(0,c.sus-dt*.25);
    if(c.sus>=1){ setStars(1); c.state='chase'; c.target=[P.x,P.z]; sayNow(c.id==='pcmale'?'oi':'oiO',2.6); G.lostT=0; G.chaseT=0; for(const o of COPS) if(o!==c&&o.state!=='chase'){ o.state='alert'; } }
    if(c.state==='search'){ c.searchT-=dt; c.look=Math.sin(G.t*2.2)*.9; if(c.searchT<=0) c.state='return'; }
    if(c.state==='return'){ goal=[c.post[0],c.post[1]]; speed=1.2; if(Math.hypot(goal[0]-c.pos[0],goal[1]-c.pos[1])<.3){ c.state='post'; c.hd=c.post[2]; } }
    if(c.state==='post'||c.state==='alert'){ c.state='post';
      if(c.patrol){ if(c.wait>0){ c.wait-=dt; c.look=Math.sin(G.t*.9)*.6; } else { const t=c.patrol[c.pi]; goal=t; speed=1.0; if(Math.hypot(t[0]-c.pos[0],t[1]-c.pos[1])<.25){ c.pi=(c.pi+1)%c.patrol.length; c.wait=2.5; } } }
      else { c.look=Math.sin(G.t*.35+1)*.7; } }
  } else {
    if(c.state!=='chase'&&(G.stars===2||sees)) c.state='chase';
    if(c.state==='chase'){
      if(sees){ c.target=[P.x,P.z]; }
      goal=c.target; run=G.stars===2?1:0; speed=G.stars===2?3.25:1.95; c.look=0;
      if(goal&&Math.hypot(goal[0]-c.pos[0],goal[1]-c.pos[1])<.4&&!sees){ c.state='search'; c.searchT=3.5; if(!G.said.has('search')){ G.said.add('search'); say('search',2); } }
      if(d<1.0&&P.y-floorY(P.x,P.z)<.7&&!frozen) busted(c); }
    else if(c.state==='search'){ c.searchT-=dt; c.look=Math.sin(G.t*2.2)*1.1; if(sees) c.state='chase'; if(c.searchT<=0){ c.state='search'; c.searchT=2; } }
    else { goal=[c.post[0],c.post[1]]; speed=1.2; }
  }
  /* move: straight at the goal, sliding along whatever is in the way */
  c.E.walkAmt=0; c.E.runAmt=lerp(c.E.runAmt,run,Math.min(1,dt*4));
  /* round corners: follow the nav field to the goal, re-planned as the goal moves */
  if(goal&&speed>0&&NAV){ c.fT=(c.fT||0)-dt; if(!c.fld||c.fT<=0||Math.hypot(goal[0]-c.fld.gx,goal[1]-c.fld.gz)>1.5){ c.fld=fieldTo(goal[0],goal[1],c.pos[0],c.pos[1]); c.fT=.6; }
    const wp=Math.hypot(goal[0]-c.pos[0],goal[1]-c.pos[1])>1.2?c.fld.next(c.pos[0],c.pos[1]):null; if(wp) goal=wp; }
  if(goal&&speed>0){ const gx=goal[0]-c.pos[0],gz=goal[1]-c.pos[1],gd=Math.hypot(gx,gz);
    if(gd>.05){ const st=Math.min(gd,speed*dt),o={x:c.pos[0],z:c.pos[1]}; moveBody(o,gx/gd*st,gz/gd*st,.22);
      if(Math.hypot(o.x-c.pos[0],o.z-c.pos[1])<st*.3){ moveBody(o,gz/gd*st*(c.id==='pcmale'?1:-1),-gx/gd*st*(c.id==='pcmale'?1:-1),.22); } /* stuck: step round it */
      c.pos[0]=o.x; c.pos[1]=o.z; const want=Math.atan2(gx,gz); c.hd+=Math.atan2(Math.sin(want-c.hd),Math.cos(want-c.hd))*Math.min(1,dt*8); c.E.walkAmt=1; } }
  /* pose + legs */
  const C=c.C; C.node.p=[c.pos[0],floorY(c.pos[0],c.pos[1]),c.pos[1]]; C.node.r=[0,c.hd,0]; c.E.hd=c.hd; c.E.pos=c.pos;
  const J=C.J; for(const k of JOINTS) if(J[k]&&C.base[k]) J[k].r=C.base[k].slice(); J.hips.p=[0,C.hy0,0];
  J.head.r=[J.head.r[0],J.head.r[1]+c.look,J.head.r[2]];
  if(c.sus>.2||c.state==='chase'){ const dx=P.x-c.pos[0],dz=P.z-c.pos[1],a=Math.atan2(dx,dz)-c.hd,w=Math.atan2(Math.sin(a),Math.cos(a)); J.head.r[1]=clamp(w,-1.1,1.1); }
  gait(c.E,G.t,dt); if(!c.hub||((c.sk=(c.sk||0)+1)%(Math.hypot(P.x-c.pos[0],P.z-c.pos[1])>25?3:1)===0)) skinUpdate(C);
  /* the mark over the head */
  const k=G.stars>0&&c.state==='chase'?3:c.sus>.55?2:c.sus>.08?1:0; c.mark.vis=k>0&&!G.result; if(k) { c.mark.mesh.mats[0]=markM[k-1]; c.mark.mesh.runs=null; const hp=mulP(J.head.world,[0,0,0]); c.mark.p=[hp[0],hp[1]+.55+.04*Math.sin(G.t*6),hp[2]]; c.mark.r=[0,Math.atan2(P.x-hp[0],P.z-hp[2]),0]; const s=k===1?.6+.4*Math.min(1,c.sus*2):1; c.mark.s=[s,s,1]; }
}

/* ---------- the job ---------- */
function bark(id,key,r){ if(G.said.has(key)) return; const C=CAST[id]; if(!C) return; const p=C.node.p; if(Math.hypot(P.x-p[0],P.z-p[2])<r){ G.said.add(key); say(key,2.6); } }
function busted(c){ if(G.result) return; G.result='nicked'; G.endT=0; sayNow(c.id==='pcmale'?'nicked':'nickedO',3); setObj('Nicked.'); if(KEY_CAST.includes(c.id)) freezeOn(c.id,false); showEnd('NICKED','PC '+(c.id==='pcmale'?'Hughes':'Okafor')+' had you bang to rights. The bag goes in an evidence locker; Degsy goes very quiet.'); }
function done(){ if(G.result) return; G.result='done'; G.endT=0; sayNow('terryYes',3.4); setObj('Job done.'); setParent(BAG,STREET); BAG.p=[LOCKUP.x-.4,PAVE_Y+.15,FZ-.9]; BAG.r=[0,.6,0]; G.hasBag=false;
  showEnd('JOB DONE','£200 in your pocket. Degsy owes you £150 of it. '+(G.cash?'Plus £'+G.cash+' of his you found on the rooftops, which he doesn\'t need to know about. ':'')+(G.maxStars?'The Old Bill clocked you, and Ali\'s camera saw everything.':'Clean. Not even Ali\'s camera saw you.')); }
function showEnd(h,p){ const e=$g('gEnd'); if(!e) return; if(document.pointerLockElement) document.exitPointerLock?.(); $g('gEndH').textContent=h; $g('gEndP').textContent=p; e.hidden=false; e.dataset.kind=G.result; }
function cashTick(){ for(const c of CASH){ if(c.got) continue;
    if(Math.hypot(P.x-c.p[0],P.z-c.p[2])<.75&&Math.abs(P.y-c.p[1])<.8){ c.got=true; c.n.vis=false; G.cash=(G.cash||0)+20; const e=$g('gCash'); if(e){ e.textContent='£'+G.cash+' found'; e.hidden=false; } phoneDirty=true; } } }
function jobTick(dt){ cashTick();
  const deg=CAST.degsy.node.p, dDeg=Math.hypot(P.x-deg[0],P.z-deg[2]);
  if(G.phase==='meet'){ if(dDeg<9) bark('degsy','degsyWave',9); if(dDeg<2.6){ G.phase='brief'; G.queue=[]; G.line=null; say('d1',2.6); say('d2',4.4); say('d3',3.6); G.briefT=10.6; } }
  else if(G.phase==='brief'){ G.briefT-=dt; if(G.briefT<=0){ G.phase='getbag'; setObj('Grab the bag off the boot of Degsy\'s silver motor.'); } }
  if(G.phase==='getbag'&&G.hasBag){ G.phase='deliver'; say('dGo',2.6); setObj('Get the bag to Arch 9, under the railway bridge at the east end. Keep it away from the coppers. The estate round the back (Hollis House, or the gates at the west end) joins the back alley.'); }
  if((G.phase==='deliver'||G.phase==='leg2')&&!G.result){
    const dL=Math.min(Math.hypot(P.x-LOCKUP.x,P.z-(FZ-.4)),Math.hypot(P.x-BACKDOOR.x,P.z-BACKDOOR.z)+.4);
    if(dL<2.0&&G.phase==='deliver'){ if(G.stars===0){ if(typeof leg2Start==='function') leg2Start(); else done(); } else if(!G.said.has('terryNo')){ G.said.add('terryNo'); say('terryNo',3); } } else if(dL>4) G.said.delete('terryNo');
    if(G.stars>0){ const seen=COPS.some(c=>c.seeing); G.chaseT=(G.chaseT||0)+dt;
      if(seen){ G.lostT=0; if(G.stars===1&&(P.running||G.chaseT>14)){ setStars(2); sayNow('run2',3); } }
      else { G.lostT+=dt; if(G.lostT>(G.stars===1?5:8)){ setStars(0); for(const c of COPS){ c.sus=0; if(c.state==='chase'||c.state==='search'){ c.state='search'; c.searchT=3; } } say('lost',2.4); G.said.delete('search'); setObj(G.phase==='leg2'?G.goalText:'Lost \'em. Get the bag to Arch 9, under the railway bridge at the east end.'); } } }
    setObj(G.stars?(G.stars===1?'The Old Bill\'s onto you. Break their line of sight and lose them.':'Two coppers on your tail. Get out of sight and stay there.'):G.obj); }
  bark('maureen','maureen',2.8); bark('ali','ali',3.2); bark('piotr','piotr',2.6); bark('kwame','kwame',3.0);
}
function linesTick(dt){
  if(!G.line&&G.queue.length){ G.line=G.queue.shift(); G.lineT=G.line.dur; const L=labelFor(G.line.who); drawLabel(L.t,G.line.text); const s=$g('gSub'); if(s){ const nm={lenny:'LENNY',danny:'DANNY',degsy:'DEGSY',pcmale:'PC HUGHES',pcfem:'PC OKAFOR',terry:'TERRY (inside)',maureen:'MAUREEN',ali:'ALI',piotr:'PIOTR',kwame:'KWAME'}[G.line.who]||''; s.innerHTML=''; const b=document.createElement('b'); b.textContent=nm; s.append(b,document.createTextNode(' '+G.line.text)); s.hidden=false; } }
  for(const k in labels) labels[k].n.vis=false;
  if(G.line){ G.lineT-=dt; const L=labelFor(G.line.who),h=speakerHead(G.line.who); if(h){ L.n.vis=true; L.n.p=h; L.n.r=[0,Math.atan2(P.x-h[0],P.z-h[2]),0]; const k=clamp(Math.hypot(P.x-h[0],P.z-h[2])/2.6,1,2.4); L.n.s=[k,k,1]; }
    if(G.lineT<=0){ G.line=null; const s=$g('gSub'); if(s&&!G.queue.length) s.hidden=true; } }
}
/* pick up: desktop E near the bag and looking roughly at it; VR: a squeezed hand on it */
function tryGrab(handPos){ if(G.hasBag||G.result||G.phase==='meet'||G.phase==='brief') return false; const b=BAG.p; /* on the boot: STREET sits at the origin */
  if(handPos){ if(v3.len(v3.sub(handPos,b))>.38) return false; } else if(Math.hypot(P.x-b[0],P.z-b[2])>2.0) return false;
  G.hasBag=true; return true; }

/* ---------- the body: free movement in 3D. Jump any time; anything you can reach, you can get onto ----------
   Every solid on the street is a box with a top. Walk into something under 0.36 m and you step up (the kerb).
   Jump (Space / phone JUMP / headset A or X) whenever you like. Jump at something low and thin (a bollard, a bin, the
   hoarding from the bins) and you vault it; at something higher you can reach (a car bonnet, the bins, the hoarding,
   the bus shelter roof) and you pull yourself up onto it. Mid-air, run into a ledge in reach and you grab it.
   In the headset you can also climb with your hands: squeeze grip on a ledge and pull yourself up.
   The coppers can't do any of it. */
const STEP=.36, EYE=1.65, BODY=1.7, GRAV=17, JUMPV=4.4, REACH_GROUND=2.65, REACH_AIR=2.1;
const SOL=[]; const SOLH=RectHash(SOL,o=>o.r); const solNear=(x0,z0,x1,z1)=>SOLH.near(x0,z0,x1,z1); const sol=(x0,z0,x1,z1,y1,y0=0)=>{ const o={r:[x0,z0,x1,z1],y0,y1}; SOL.push(o); return o; };
for(const x of [-9.6,-5,0,5,9.8]) sol(x-.12,KERB_Z-.52,x+.12,KERB_Z-.28,PAVE_Y+.92);              /* bollards */
sol(-4.86,KERB_Z-.86,-4.34,KERB_Z-.34,PAVE_Y+.95);                                                  /* litter bin */
sol(-12.43,KERB_Z+.15,-7.97,KERB_Z+1.95,.95); sol(-10.55,KERB_Z+.3,-9.25,KERB_Z+1.8,1.44);          /* Degsy's motor: bonnet/boot, roof */
sol(-.69,ROAD_Z1-1.95,3.89,ROAD_Z1-.15,.96); sol(-.22,ROAD_Z1-1.75,2.15,ROAD_Z1-.35,1.82);             /* the cab */
sol(-3.7,ROAD_Z1+.75,-2.7,ROAD_Z1+1.75,PAVE_Y+2.9);                                                 /* phone kiosk */
sol(4.8,ROAD_Z1+1.45,8.4,ROAD_Z1+2.95,PAVE_Y+2.57,PAVE_Y+2.4);                                      /* bus shelter roof (you can walk under it) */
sol(4.9,ROAD_Z1+2.8,8.3,ROAD_Z1+2.92,PAVE_Y+2.4); sol(4.8,ROAD_Z1+1.6,4.98,ROAD_Z1+2.85,PAVE_Y+2.0); /* its back glass and advert */
sol(-17,ROAD_Z1+2.98,17,ROAD_Z1+3.24,PAVE_Y+.85);                                                   /* the front-garden wall across the road */
sol(FENCE_X-.08,FZ-8.45,FENCE_X+.08,FZ-5.5,PAVE_Y+2.3);                                             /* the alley hoarding */
for(const z of [FZ-6.2,FZ-6.95]) sol(FENCE_X-.86,z-.35,FENCE_X-.24,z+.35,PAVE_Y+1.15);              /* the bins in front of it */
for(const x of [15.6,16.4,22.8]) sol(x-.31,FZ-8.33,x+.31,FZ-7.63,PAVE_Y+1.15);
for(const [x,z] of [[3.6,KERB_Z-.35],[-8.6,KERB_Z-.35],[11.9,KERB_Z-.3],[14.9,ROAD_Z1+.3],[16+3,KERB_Z-.35],[16+11,KERB_Z-.35],[16+7,ROAD_Z1+.35]]) sol(x-.12,z-.12,x+.12,z+.12,9); /* lamp columns, beacons */
WALK.push([-16.9,ROAD_Z1+2.6,16.9,ROAD_Z1+3.85]);                                                    /* the front gardens behind that wall */

/* ---------- THE HOLLIS ESTATE: through the gateway at the west end, or out of the back alley. A courtyard with
   lock-up garages along one side (flat roofs you can get onto), a bin store, a burnt-out Escort, a works van, a
   fenced patch of grass with NO BALL GAMES, and Hollis House itself: four floors of deck-access flats with a stair
   up to the first-floor walkway. Kwame runs the stairwell. ---------- */
const EST=N(STREET);
function eBox(x0,z0,x1,z1,y0,y1,m,o={}){ const w=x1-x0,d=z1-z0,h=y1-y0,cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2;
  if(o.tex) blkT(w,h,d,o.tex,cx,cy,cz,{tile:o.tile||1.6,tileV:o.tileV||o.tile||1.5,color:o.color??0xffffff,parent:EST}); else if(m) blk(w,h,d,m,cx,cy,cz,EST);
  if(o.solid!==false) sol(x0,z0,x1,z1,y1,y0); if(o.block) BLOCK.push([x0,z0,x1,z1]); if(o.sight) SIGHT.push([x0,z0,x1,z1]); }
{ const PY=PAVE_Y, CZ0=-26, CZ1=-8.6, CX0=-16, CX1=10.4;
  slab(CX1-CX0,CZ1-CZ0,tPaveW,(CX0+CX1)/2,PY,(CZ0+CZ1)/2,{parent:EST,tile:1.2,cell:1.5});
  slab(2.0,5.6,tTarmac,-14.85,PY+.002,-5.8,{parent:EST,tile:2,cell:1.5});                                              /* the gateway's tarmac */
  for(const [x,ry] of [[-15.85,Math.PI/2],[-13.85,-Math.PI/2]]) wallP(5.6,4.2,tConc,x,2.1,-5.8,ry,{parent:EST,tile:3,tileH:3,color:0x9a968e});
  blk(2.0,.25,5.6,col(0x6a6a66),-14.85,4.15,-5.8,EST); blk(.3,.1,.2,glowC(0xffd090),-14.85,3.95,-5.0,EST);
  mk(boxW(2.1,.4,.06,2.1,.4),MM(signTex(252,48,'#1c2f5a','#f4f2ea','HOLLIS ESTATE','GARAGES · NO PARKING · NO BALL GAMES',{face:'grot',frame:'#f4f2ea',subC:'#c8d4ec'})),EST,-14.85,3.7,FZ+.03);
  /* north side: the backs of the shops (ground-floor extensions), the back of the deck block above */
  wallP(CX1+13.85,4.2,tConc,(CX1-13.85)/2,PY+2.1,CZ1,Math.PI,{parent:EST,tile:3,tileH:3,color:0x8e8a82});
  blk(26.4,.2,2.9,col(0x3a3a3c),(CX0+CX1)/2,4.25,-7.15,EST);
  { const tBack=P2(256,128,(g,w,h)=>{ R(g,'#6e6a62',0,0,w,h); const r=rng(1691); for(let f=0;f<4;f++) for(let i=0;i<8;i++){ const lit=r()<.3; R(g,lit?'#ffcc80':'#14161a',i*32+8,f*32+8,16,14); R(g,'#5a564e',i*32+6,f*32+23,20,2); if(r()<.2) R(g,'#c8c8c4',i*32+26,f*32+6,4,4); } for(let i=0;i<w;i+=64) R(g,'rgba(20,18,16,.4)',i,0,3,h); },6,1692);
    wallP(32,12.3,tBack,0,4.2+6.15,-5.74,Math.PI,{parent:EST,whole:true,cell:2}); }
  /* lock-up garages down the west side: up-and-over doors, flat roofs at 2.4 m */
  for(let k=0;k<6;k++){ const z=-11.2-k*2.25; eBox(-16,z-1.1,-12.2,z+1.1,0,PY+2.35,null,{tex:tConc,tile:2.5,color:0x8a8478,block:true,sight:true});
    wallP(1.9,1.9,shutterTex(1700+k),-12.18,PY+.95,z,Math.PI/2,{parent:EST,whole:true}); mk(boxW(.4,.18,.03,.4,.18),MM(signTex(64,28,'#eeebe2','#1b1b1b',String(k+1),null,{face:'grot',frame:'#1b1b1b'})),EST,-12.17,PY+2.1,z,0,Math.PI/2,0); }
  blk(3.9,.12,13.6,col(0x2a2a2c),-14.1,PY+2.41,-16.85,EST);                                                            /* felt roof */
  /* the bin store: a brick pen with the big communal bins; get up on the bins, then the wall */
  eBox(-4.2,-11.6,-.8,-11.4,0,PY+1.8,null,{tex:tStock,block:true,sight:true}); eBox(-4.2,-11.4,-4.0,-9.4,0,PY+1.8,null,{tex:tStock,block:true,sight:true}); eBox(-1.0,-11.4,-.8,-9.4,0,PY+1.8,null,{tex:tStock,block:true,sight:true});
  for(const x of [-3.3,-1.8]) eBox(x-.6,-11.3,x+.6,-10.2,0,PY+1.3,col(0x2e3a30),{block:true,sight:true});
  /* the burnt-out Escort and the works van */
  /* (their bodies come from the vehicle kit, 48b2-vehicles.js: these are their solids) */
  eBox(-8.28,-17.0,-4.32,-15.3,0,PY+.8,null,{block:true}); eBox(-7.2,-16.9,-5.3,-15.4,PY+.8,PY+1.34,null,{block:true});
  eBox(-10.4,-23.4,-6.35,-21.4,0,PY+2.39,null,{block:true,sight:true}); eBox(-11.65,-23.3,-10.4,-21.5,0,PY+1.14,null,{block:true,sight:true});
  /* NO BALL GAMES: a patch of grass inside a low wall you can sit on or hop */
  const gx0=0,gx1=7,gz0=-20,gz1=-14; slab(gx1-gx0,gz1-gz0,null,(gx0+gx1)/2,PY+.01,(gz0+gz1)/2,{parent:EST,color:0x2a3a22,cell:2});
  eBox(gx0,gz1-.2,gx1,gz1,0,PY+.55,null,{tex:tStock,block:true}); eBox(gx0,gz0,gx1,gz0+.2,0,PY+.55,null,{tex:tStock,block:true});
  eBox(gx0,gz0,gx0+.2,gz1,0,PY+.55,null,{tex:tStock,block:true}); eBox(gx1-.2,gz0,gx1,gz1-1.4,0,PY+.55,null,{tex:tStock,block:true});
  mk(boxW(1.0,.5,.04,1.0,.5),MM(signTex(160,80,'#f4f2ea','#c8231c','NO BALL GAMES','BY ORDER · TOWER HAMLETS HOMES',{face:'grot',frame:'#c8231c',subC:'#1b1b1b'})),EST,3.5,PY+1.2,gz1+.04); mk(cyl(.03,.03,1.0,6),col(0x2a2a2a),EST,3.5,PY+.5,gz1+.02);
  eBox(1.0,-13.2,3.2,-12.8,0,PY+.45,col(0x5a3a22),{block:true});                                                          /* bench */
  /* the courtyard lamp */
  mk(cyl(.07,.1,5.6,8),col(0x2a2d33),EST,-3,PY+2.8,-13.2); blk(.5,.18,.34,col(0x2a2d33),-3,5.7,-13.2,EST); blk(.42,.04,.26,glowC(0xffd090),-3,5.6,-13.2,EST);
  { const gm=MM(tGlowSodium,{unlit:true,double:true}); gm.cut=2; mk(plane(1.6,1.6),gm,EST,-3,5.45,-13.1); } sol(-3.12,-13.32,-2.88,-13.08,8); BLOCK.push([-3.12,-13.32,-2.88,-13.08]);
  /* Hollis House: four floors of deck-access flats along the south side */
  const tFlats=P2(256,64,(g,w,h)=>{ R(g,'#8a867c',0,0,w,h); const r=rng(1730); for(let i=0;i<8;i++){ const x=i*32; R(g,['#1c2a4a','#5a1a1a','#1a3a2a','#2a2a2a','#6a4a1a'][i%5],x+4,14,10,46); R(g,'#c8c4b8',x+12,30,2,3);
      const lit=r()<.35; R(g,lit?'#ffc878':'#14161a',x+18,18,12,22); if(lit) R(g,'rgba(120,40,30,.5)',x+18,18,4,22); R(g,'#d8d4c8',x+17,40,14,2); } R(g,'#6a665e',0,0,w,6); },6,1731);
  for(let f=0;f<4;f++){ const y=PY+f*2.8;
    wallP(26.4,2.8,tFlats,(CX0+CX1)/2,y+1.4,CZ0,0,{parent:EST,tile:8.8,tileH:2.8,cell:2.2});
    if(f>0){ blk(26.4,.22,1.6,col(0x8a8680),(CX0+CX1)/2,y-.11,CZ0+.8,EST); eBox(CX0,CZ0+1.45,7.6,CZ0+1.6,y,y+1.0,null,{tex:tConc,tile:2.5,color:0xa8a49c,solid:f===1}); if(f===1) eBox(9.6,CZ0+1.45,CX1,CZ0+1.6,y,y+1.0,null,{tex:tConc,tile:2.5,color:0xa8a49c}); } }
  blk(26.6,.4,2.0,col(0x6a665e),(CX0+CX1)/2,PY+11.4,CZ0+.4,EST);
  sol(CX0,CZ0,CX1,CZ0+1.6,PY+2.8,PY+2.58);                                                                            /* the first-floor deck: walk along it */
  for(let f=2;f<4;f++) sol(CX0,CZ0,CX1,CZ0+1.6,PY+f*2.8,PY+f*2.8-.22);
  /* the stair up to the first-floor deck, at the east end */
  for(let k=0;k<13;k++){ const y1=PY+(k+1)*(2.8/13), z0=-22.0-k*.2; eBox(7.6,z0-.2,9.6,z0,0,y1,col(k%2?0x8a8680:0x7e7a74),{block:k===0}); }
  eBox(7.45,-24.6,7.6,-21.9,0,PY+3.8,col(0x6a665e),{block:true}); eBox(9.6,-24.6,9.75,-21.9,0,PY+3.8,col(0x6a665e),{block:true});
  /* satellite dishes and washing on the decks; a few lit kitchens */
  for(const [x,f] of [[-12,2],[-4,1],[3,3],[6,2]]) mk(cyl(.28,.05,.08,10),col(0xd8d8d4),EST,x,PY+f*2.8+2.0,CZ0+.12,Math.PI/2.4);
  for(const [x,f] of [[-9,1],[-1,2]]){ blk(1.6,.02,.02,col(0xd8d8d8),x,PY+f*2.8+1.9,CZ0+1.2,EST); for(let i=0;i<4;i++) blk(.28,.4,.02,col([0xc8231c,0xe8e4d8,0x2a4a8a,0xd8b840][i]),x-.6+i*.4,PY+f*2.8+1.68,CZ0+1.2,EST); }
}

/* ---------- THE LINES: routes built for the parkour, all of them places the coppers can't follow.
   1. The rooftop run. From the courtyard, jump-grab the air-con unit on the back wall (or run and leap to it off the
      north end of the garage roofs), pull up onto the shops' rear extension roofs at 4.3 m, run east across vents and
      skylights, clear the 1.4 m gap over the Hollis House passage at a run (miss it and you land on the canopy), then
      along the narrow ledge behind the bridge-end buildings and drop into the alley right by Arch 9's back door.
   2. The deck: up the stair to Hollis House's first-floor walkway, along it, and hop across onto the garage roofs.
   3. The kerb: guard railings either side of the zebra, which you vault at speed and the coppers have to go round.
   Up there: five carrier bags of Degsy's money (£20 each), stashed where a man hides cash: behind a chimney, on a
   garage roof, on a bus shelter. No glow; you find them by looking. ---------- */
const ROOF_Y=PAVE_Y+4.23;
sol(-13.85,-8.6,10.95,-5.75,ROOF_Y); sol(12.2,-8.6,29.0,-5.6,ROOF_Y);                                                    /* the extension roofs */
sol(11.0,-8.6,12.2,-5.6,PAVE_Y+3.05,PAVE_Y+2.95);                                                                        /* the passage canopy (miss the gap: you land here) */
for(const [x0,x1,h] of [[16,21,11],[21.4,26,13],[26.4,31.6,10]]) sol(x0,-7.0,x1,-3,h);                                    /* the bridge-end buildings: the roof narrows to a ledge */
sol(-13.2,-8.9,-12.4,-8.6,PAVE_Y+2.5,PAVE_Y+1.85);                                                                      /* the air-con unit on the back wall */
WALK.push([-13.85,-8.7,10.95,-5.75],[12.2,-8.7,29.0,-5.6],[10.4,-8.7,12.8,-5.6]);
/* let the roof edges overhang the ground below, so you can step off a roof into the courtyard or the alley */
WALK.push([-15.9,-9.5,10.4,-8.0],[9.6,-9.5,29.0,-8.0]);
{ const RF=N(STREET), tFelt=P2(64,64,(g,w,h)=>{ R(g,'#2a2b2e',0,0,w,h); specks(g,'#3a3b3f',220,1740,w,h); specks(g,'#1a1b1d',160,1741,w,h); for(let i=0;i<4;i++) R(g,'rgba(70,80,90,.25)',(i*17)%w,(i*29)%h,14,9); },4,1742);
  slab(24.95,2.85,tFelt,(-13.85+10.95)/2+.0,ROOF_Y+.005,-7.175,{parent:RF,tile:2,cell:2,color:0x8a8e94});
  slab(16.8,3.0,tFelt,(12.2+29)/2,ROOF_Y+.005,-7.1,{parent:RF,tile:2,cell:2,color:0x8a8e94});
  blk(16.8,.2,3.0,col(0x3a3a3c),(12.2+29)/2,ROOF_Y-.1,-7.1,RF);
  /* the back wall under roof B (the alley's north side already has it); a lip along the roof edges */
  for(const [x0,x1] of [[-13.85,10.95],[12.2,29.0]]) blk(x1-x0,.14,.14,col(0x5a5a58),(x0+x1)/2,ROOF_Y+.07,-8.55,RF);
  /* clutter to vault and climb: vents, an air-con condenser, skylights, a water tank, chimney stacks, a dish */
  const vent=(x,z)=>{ eBox(x-.3,z-.3,x+.3,z+.3,ROOF_Y,ROOF_Y+.62,col(0x8a8c90),{}); blk(.7,.06,.7,col(0x6a6c70),x,ROOF_Y+.66,z,RF); };
  vent(-9.5,-6.6); vent(-2.2,-7.6); vent(6.2,-6.4); vent(14.5,-7.2); vent(23.6,-7.9);
  eBox(-6.0,-7.0,-4.8,-6.2,ROOF_Y,ROOF_Y+1.05,col(0xb8bab8),{});                                                         /* condenser */
  for(const x of [0.8,3.6]){ blk(1.4,.28,1.0,col(0x9aa2a8),x,ROOF_Y+.14,-6.8,RF); blk(1.3,.04,.9,glowC(0x8ac0e0),x,ROOF_Y+.3,-6.8,RF); sol(x-.7,-7.3,x+.7,-6.3,ROOF_Y+.28); }
  eBox(18.2,-6.95,19.6,-5.75,ROOF_Y,ROOF_Y+1.6,col(0x4a5a6a),{});                                                         /* water tank */
  eBox(8.6,-6.6,9.4,-5.8,ROOF_Y,ROOF_Y+2.2,null,{tex:tStock});                                                            /* chimney stack */
  mk(cyl(.32,.06,.1,10),col(0xd8d8d4),RF,-11.4,ROOF_Y+1.0,-6.0,-1.0,0,0); mk(cyl(.03,.03,1.0,6),col(0x8a8a8a),RF,-11.4,ROOF_Y+.5,-6.0);
  /* the air-con unit and a drainpipe on the courtyard wall */
  blk(.8,.65,.3,col(0xc8c8c4),-12.8,PAVE_Y+2.17,-8.75,RF); for(let i=0;i<5;i++) blk(.6,.02,.02,col(0x6a6a6a),-12.8,PAVE_Y+1.95+i*.1,-8.91,RF);
  blk(.08,4.2,.08,col(0x2a2a2a),-11.9,PAVE_Y+2.1,-8.66,RF);
  /* the passage canopy as something you can land on */
  blk(1.2,.1,3.0,col(0x5a5a58),11.6,PAVE_Y+3.0,-7.1,RF); }
/* kerbside guard railings either side of the zebra */
{ const tRail=P2(32,16,(g,w,h)=>{ R(g,'#c8ccd0',0,0,w,h); R(g,'#1a1a1a',0,0,w,2); R(g,'#1a1a1a',0,h-2,w,2); for(let x=3;x<w;x+=5) R(g,'#5a5e62',x,2,1,h-4); },0,1);
  for(const [x0,x1,z] of [[9.95,12.05,KERB_Z-.2],[14.75,16.9,KERB_Z-.2],[9.95,12.05,ROAD_Z1+.2],[14.75,16.9,ROAD_Z1+.2]]){
    eBox(x0,z-.03,x1,z+.03,0,PAVE_Y+1.0,null,{block:true}); mk(plane(x1-x0,.75),MM(tRail,{double:true,repeat:[(x1-x0)/1.2,1]}),STREET,(x0+x1)/2,PAVE_Y+.55,z);
    for(let x=x0;x<=x1+.01;x+=(x1-x0)/2) mk(cyl(.025,.025,1.0,6),col(0x2a2a2a),STREET,x,PAVE_Y+.5,z); } }
/* Degsy's cash, stashed up high */
const CASH=[[-14.1,PAVE_Y+2.35,-17.8],[9.0,ROOF_Y,-6.0],[27.4,ROOF_Y,-7.8],[6.6,PAVE_Y+2.57,ROAD_Z1+2.0],[-15.3,PAVE_Y+2.8,-25.2]].map(([x,y,z])=>{
  /* a brown envelope in a knotted carrier bag, tucked where a man hides money: no glow, you have to look */
  const n=N(STREET,x,y+.01,z); n.dyn=true; mk(box(.26,.16,.14,{tw:.8,td:.8}),col(0xe8e4dc),n,0,.08,0); mk(box(.06,.06,.04),col(0xd8d4cc),n,0,.19,0); mk(box(.2,.02,.12),col(0x9a7a4a),n,.02,.17,.02,0,.3,0);
  return {n,got:false,p:[x,y,z]}; });
/* spatial hashes: the hub has thousands of solids and hundreds of walk rects; every query only looks at the 4 m cells it touches */
function RectHash(list,get){ const H={cell:4,map:new Map(),n:-1,list,get,stamp:0};
  H.sync=()=>{ if(H.n===list.length) return; H.map.clear(); for(const it of list){ const r=get(it),c=H.cell; for(let i=Math.floor(r[0]/c);i<=Math.floor(r[2]/c);i++) for(let j=Math.floor(r[1]/c);j<=Math.floor(r[3]/c);j++){ const k=i*65536+j; let a=H.map.get(k); if(!a){ a=[]; H.map.set(k,a); } a.push(it); } } H.n=list.length; };
  H.near=(x0,z0,x1,z1)=>{ H.sync(); H.stamp++; const out=[],c=H.cell; for(let i=Math.floor(x0/c);i<=Math.floor(x1/c);i++) for(let j=Math.floor(z0/c);j<=Math.floor(z1/c);j++){ const a=H.map.get(i*65536+j); if(a) for(const it of a){ if(it._hs!==H.stamp){ it._hs=H.stamp; out.push(it); } } } return out; };
  return H; }
const WALKO=WALK.map(r=>({r})); const WALKH=RectHash(WALKO,o=>o.r); const addWalk=r=>{ WALK.push(r); WALKO.push({r}); };
const inWalk=(x,z,rad)=>{ if(HUBX&&HUBX.walk(x,z,rad)) return true; for(const o of WALKH.near(x,z,x,z)) if(inR(o.r,x,z,rad)) return true; return false; };
function solidHit(x,z,rad,feet,head){ for(const s of solNear(x-rad,z-rad,x+rad,z+rad)){ const r=s.r; if(x>r[0]-rad&&x<r[2]+rad&&z>r[1]-rad&&z<r[3]+rad&&s.y1>feet+STEP&&s.y0<head) return s; } return null; }
function groundAt(x,z,feet){ let g=floorY(x,z); const k=P.r*.5; for(const s of solNear(x-k,z-k,x+k,z+k)){ const r=s.r; if(x>r[0]-k&&x<r[2]+k&&z>r[1]-k&&z<r[3]+k&&s.y1<=feet+STEP+.001&&s.y1>g) g=s.y1; } return g; }
function free(x,z,feet){ return inWalk(x,z,P.r)&&!solidHit(x,z,P.r,feet,feet+BODY)&&!(feet<floorY(x,z)+1.2&&lifeBlocks(x,z,P.r)); }
function rayRect(x,z,fx,fz,r){ let t0=-1e9,t1=1e9; for(const [p,d,lo,hi] of [[x,fx,r[0],r[2]],[z,fz,r[1],r[3]]]){ if(Math.abs(d)<1e-9){ if(p<lo||p>hi) return null; continue; } let a=(lo-p)/d,b=(hi-p)/d; if(a>b){ const t=a; a=b; b=t; } t0=Math.max(t0,a); t1=Math.min(t1,b); } return t0<=t1?[t0,t1]:null; }
P.y=PAVE_Y; P.vy=0; P.vx=0; P.vz=0; P.ground=true;
const ACT={on:false,t:0,dur:0,kind:'',from:null,to:null,peakY:0};
function startAct(kind,to,peakY,dur){ Object.assign(ACT,{on:true,t:0,kind,from:[P.x,P.y,P.z],to,peakY,dur}); P.vy=0; return true; }
function actTick(dt){ ACT.t+=dt; const k=Math.min(1,ACT.t/ACT.dur),e=x=>x*x*(3-2*x),[x0,y0,z0]=ACT.from,[x1,y1,z1]=ACT.to;
  if(ACT.kind==='vault'){ const q=e(k); P.x=lerp(x0,x1,q); P.z=lerp(z0,z1,q); P.y=k<.5?lerp(y0,ACT.peakY,e(k/.5)):lerp(ACT.peakY,y1,e((k-.5)/.5)); }
  else { const up=.6,mx=lerp(x0,x1,.3),mz=lerp(z0,z1,.3); if(k<up){ const q=e(k/up); P.y=lerp(y0,y1+.06,q); P.x=lerp(x0,mx,q); P.z=lerp(z0,mz,q); } else { const q=e((k-up)/(1-up)); P.y=y1+.06*(1-q); P.x=lerp(mx,x1,q); P.z=lerp(mz,z1,q); } }
  P.running=true; if(k>=1){ ACT.on=false; P.x=x1; P.y=y1; P.z=z1; P.ground=true; P.vy=0; P.vx=P.vz=0; } }
/* the nearest solid straight ahead that you'd have to get over */
function solidAhead(fx,fz,maxD){ let best=null; const e=maxD+P.r+.1; for(const s of solNear(P.x-e,P.z-e,P.x+e,P.z+e)){ if(s.y1<=P.y+STEP||s.y0>P.y+BODY+.9||s.y1>P.y+REACH_GROUND+.5) continue; /* overhead ledges in reach count too */ const r=[s.r[0]-P.r,s.r[1]-P.r,s.r[2]+P.r,s.r[3]+P.r],h=rayRect(P.x,P.z,fx,fz,r);
  if(!h||h[1]<0||h[0]>maxD) continue; if(!best||h[0]<best.d) best={s,d:Math.max(0,h[0]),t1:h[1],thick:h[1]-h[0]-2*P.r}; } return best; }
function pathClear(x1,z1,top,skip){ for(const s of solNear(Math.min(P.x,x1)-.3,Math.min(P.z,z1)-.3,Math.max(P.x,x1)+.3,Math.max(P.z,z1)+.3)){ if(s===skip||s.y1<=top-.02||s.y0>top+BODY) continue; const r=[s.r[0]-P.r*.6,s.r[1]-P.r*.6,s.r[2]+P.r*.6,s.r[3]+P.r*.6]; if(segHits(P.x,P.z,x1,z1,r)) return false; } return true; }
function vaultLand(a,fx,fz){ for(const e of [.05,.35,.7]){ const x=P.x+fx*(a.t1+e),z=P.z+fz*(a.t1+e),g=groundAt(x,z,a.s.y1); if(g<=a.s.y1&&free(x,z,g)&&pathClear(x,z,a.s.y1+.14,a.s)) return [x,g,z]; } return null; }
function mantleSpot(s,fx,fz){ const h=rayRect(P.x,P.z,fx,fz,s.r); const t0=h?Math.max(0,h[0]):0;
  for(const e of [.32,.2,.45,.12]){ const x=h?P.x+fx*(t0+e):clamp(P.x,s.r[0]+.1,s.r[2]-.1),z=h?P.z+fz*(t0+e):clamp(P.z,s.r[1]+.1,s.r[3]-.1);
    if(Math.abs(groundAt(x,z,s.y1)-s.y1)>.03||!inWalk(x,z,0)||solidHit(x,z,P.r*.5,s.y1,s.y1+BODY)) continue; return [x,s.y1,z]; } return null; }
function jump(){ if(!G.on||G.result||ACT.on) return false; const fx=Math.sin(P.yaw),fz=Math.cos(P.yaw), a=solidAhead(fx,fz,.8);
  if(a){ const h=a.s.y1-P.y;
    if(h<=1.3&&a.thick<=.95){ const land=vaultLand(a,fx,fz); if(land) return startAct('vault',land,a.s.y1+.14,.55); }
    if(h<=(P.ground?REACH_GROUND:REACH_AIR)){ const sp=mantleSpot(a.s,fx,fz); if(sp) return startAct('mantle',sp,0,clamp(.38+h*.25,.42,1.05)); } }
  if(P.ground){ P.vy=JUMPV; P.ground=false; return true; } return false; }
/* one step of the body. f, s: input forward / strafe (-1..1); yaw: which way forward is */
function bodyTick(dt,f,s,yaw){
  if(ACT.on){ actTick(dt); return; }
  const L=Math.hypot(f,s); P.running=false; let vx=0,vz=0;
  if(L>=.12){ const sp=(P.run?3.5:1.6)*Math.min(1,L)/L; P.running=P.run; const fx=Math.sin(yaw),fz=Math.cos(yaw); vx=(fx*f-fz*s)*sp; vz=(fz*f+fx*s)*sp; }
  if(P.ground){ P.vx=vx; P.vz=vz; } else { const k=Math.min(1,dt*2.2); P.vx=lerp(P.vx,vx,k); P.vz=lerp(P.vz,vz,k); }
  const dx=P.vx*dt,dz=P.vz*dt; let hit=null;
  if(dx){ if(free(P.x+dx,P.z,P.y)) P.x+=dx; else hit=solidHit(P.x+dx,P.z,P.r,P.y,P.y+BODY)||hit; }
  if(dz){ if(free(P.x,P.z+dz,P.y)) P.z+=dz; else hit=solidHit(P.x,P.z+dz,P.r,P.y,P.y+BODY)||hit; }
  /* mid-air into a ledge you can reach: grab it */
  if(!P.ground&&hit&&hit.y1-P.y<=REACH_AIR&&hit.y1>P.y+STEP){ const m=Math.hypot(P.vx,P.vz)||1,sp=mantleSpot(hit,P.vx/m,P.vz/m); if(sp){ startAct('mantle',sp,0,clamp(.35+(hit.y1-P.y)*.25,.38,.9)); return; } }
  /* standing: stick to the ground, step up kerbs, step down small drops; walk off anything bigger and fall */
  if(P.ground){ const g=groundAt(P.x,P.z,P.y); if(P.y-g>STEP+.02) P.ground=false; else { P.y=g; P.vy=0; } }
  if(!P.ground){ const prev=P.y; P.vy-=GRAV*dt; P.y+=P.vy*dt; if(P.vy>0&&solidHit(P.x,P.z,P.r*.6,P.y+BODY-.3,P.y+BODY)) P.vy=0; /* head on the shelter roof */
    const g=groundAt(P.x,P.z,Math.max(prev,P.y)); if(P.y<=g){ P.y=g; P.vy=0; P.ground=true; } }
  PL.x=P.x; PL.z=P.z; }
P.hop=0;
/* ---------- desktop input and camera ---------- */
const keysG={}; addEventListener('keydown',e=>{ if(!G.on) return; keysG[e.code]=true; if(e.code==='KeyE') tryGrab(null); if(e.code==='Space'){ e.preventDefault(); jump(); } if(e.code==='KeyR'&&G.result) reset(); if(e.code==='Escape'&&G.result) reset(); });
addEventListener('keyup',e=>{ keysG[e.code]=false; });
addEventListener('mousemove',e=>{ if(!G.on||G.xr||document.pointerLockElement!==cv) return; P.yaw-=e.movementX*.0024; P.pitch=clamp(P.pitch-e.movementY*.0024,-1.3,1.25); });
cv.addEventListener('click',()=>{ if(G.on&&!G.xr&&document.pointerLockElement!==cv) cv.requestPointerLock?.(); if(G.on&&!G.xr) tryGrab(null); });
/* ---------- phone: a thumbstick bottom-left, drag anywhere else to look, RUN and GRAB buttons bottom-right ---------- */
const TOUCH={stick:[0,0],sid:null,run:false,look:null};
{ const st=$g('tStick'),kn=$g('tKnob'),R_=52;
  const setK=(x,y)=>{ if(kn) kn.style.transform=`translate(${x}px,${y}px)`; };
  if(st){ st.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); TOUCH.sid=e.pointerId; const r=st.getBoundingClientRect(); TOUCH.c=[r.left+r.width/2,r.top+r.height/2]; try{ st.setPointerCapture(e.pointerId); }catch(_){} move(e); });
    const move=e=>{ if(e.pointerId!==TOUCH.sid) return; let dx=e.clientX-TOUCH.c[0],dy=e.clientY-TOUCH.c[1]; const d=Math.hypot(dx,dy); if(d>R_){ dx*=R_/d; dy*=R_/d; } TOUCH.stick=[dx/R_,dy/R_]; setK(dx,dy); };
    st.addEventListener('pointermove',e=>{ e.preventDefault(); move(e); });
    const end=e=>{ if(e.pointerId!==TOUCH.sid) return; TOUCH.sid=null; TOUCH.stick=[0,0]; setK(0,0); };
    st.addEventListener('pointerup',end); st.addEventListener('pointercancel',end); }
  const rb=$g('tRun'),gb=$g('tGrab');
  if(rb) rb.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); TOUCH.run=!TOUCH.run; rb.setAttribute('aria-pressed',String(TOUCH.run)); });
  if(gb) gb.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); if(G.result) reset(); else tryGrab(null); });
  const jb=$g('tJump'); if(jb) jb.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); jump(); });
  /* look: a finger dragged on the view */
  cv.addEventListener('pointerdown',e=>{ if(!G.on||G.xr||e.pointerType==='mouse') return; TOUCH.look={id:e.pointerId,x:e.clientX,y:e.clientY}; });
  cv.addEventListener('pointermove',e=>{ const L_=TOUCH.look; if(!L_||e.pointerId!==L_.id) return; P.yaw-=(e.clientX-L_.x)*.0065; P.pitch=clamp(P.pitch-(e.clientY-L_.y)*.0055,-1.2,1.1); L_.x=e.clientX; L_.y=e.clientY; });
  const lend=e=>{ if(TOUCH.look&&e.pointerId===TOUCH.look.id) TOUCH.look=null; }; cv.addEventListener('pointerup',lend); cv.addEventListener('pointercancel',lend);
  if(matchMedia('(pointer: coarse)').matches||'ontouchstart' in window) document.body.classList.add('touch'); }
let promptK='';
function promptTick(){ let k=''; if(G.on&&!ACT.on&&!G.result){ const a=solidAhead(Math.sin(P.yaw),Math.cos(P.yaw),.8); if(a){ const h=a.s.y1-P.y; if(h<=1.3&&a.thick<=.95&&vaultLand(a,Math.sin(P.yaw),Math.cos(P.yaw))) k='vault'; else if(h<=(P.ground?REACH_GROUND:REACH_AIR)&&mantleSpot(a.s,Math.sin(P.yaw),Math.cos(P.yaw))) k='climb'; } }
  if(k===promptK) return; promptK=k;
  const el=$g('gAct'); if(el){ el.hidden=!k; el.textContent=(document.body.classList.contains('touch')?'JUMP':G.xr?'A':'SPACE')+' · '+(k==='climb'?'CLIMB':'VAULT'); }
  const jb=$g('tJump'); if(jb) jb.dataset.ready=k?'1':''; phoneDirty=true; }
function deskTick(dt){
  let f=(keysG.KeyW||keysG.ArrowUp?1:0)-(keysG.KeyS||keysG.ArrowDown?1:0), s=(keysG.KeyD||keysG.ArrowRight?1:0)-(keysG.KeyA||keysG.ArrowLeft?1:0);
  f-=TOUCH.stick[1]; s+=TOUCH.stick[0]; P.run=!!(keysG.ShiftLeft||keysG.ShiftRight||TOUCH.run); bodyTick(dt,f,s,P.yaw);
  const ey=P.y+EYE, cp=Math.cos(P.pitch);
  cam.t=[P.x,ey,P.z]; cam.r=.04; cam.th=P.yaw+Math.PI; cam.ph=Math.PI/2+P.pitch; goal.t=cam.t.slice(); goal.th=cam.th; goal.ph=cam.ph; goal.r=cam.r;
  /* the bag in your right hand, low at your side */
  if(G.hasBag){ setParent(BAG,STREET); const fx=Math.sin(P.yaw),fz=Math.cos(P.yaw),rx=-fz,rz=fx; BAG.p=[P.x+fx*.45+rx*-.32,ey-.72,P.z+fz*.45+rz*-.32]; BAG.r=[0,P.yaw+Math.PI/2,0]; } }

/* ---------- WebXR ---------- */
const XR={session:null,space:null,origin:[0,0,0],yaw:0,btn:{},runToggle:false,snap:false,last:0,stick:null};
/* hand climbing: squeeze on a ledge, pull down to go up; let go near the top and you're on it */
const CLIMB={hand:null,anchor:null,s:null};
function ledgeNear(p){ for(const s of solNear(p[0]-.2,p[2]-.2,p[0]+.2,p[2]+.2)){ if(s.y1<P.y+.3||s.y1>8) continue; const r=s.r; if(p[1]>s.y1-.2&&p[1]<s.y1+.14&&p[0]>r[0]-.14&&p[0]<r[2]+.14&&p[2]>r[1]-.14&&p[2]<r[3]+.14) return s; } return null; }
function climbPull(hp){ const d=v3.sub(CLIMB.anchor,hp); const ny=clamp(P.y+d[1],floorY(P.x,P.z),CLIMB.s.y1+.05), nx=P.x+d[0], nz=P.z+d[2];
  if(free(nx,nz,ny)||ny>=CLIMB.s.y1-STEP){ P.x=nx; P.z=nz; XR.origin[0]+=d[0]; XR.origin[2]+=d[2]; } P.y=ny; P.vy=0; P.ground=false;
  if(P.y>=CLIMB.s.y1-.05) climbRelease(); }
function climbRelease(){ const s=CLIMB.s; CLIMB.hand=null; if(!s) return; if(P.y>=s.y1-.45){ const sp=mantleSpot(s,Math.sin(P.yaw),Math.cos(P.yaw)); if(sp){ XR.origin[0]+=sp[0]-P.x; XR.origin[2]+=sp[2]-P.z; P.x=sp[0]; P.y=sp[1]; P.z=sp[2]; P.ground=true; P.vy=0; } } }
function worldFromLocal(){ const m=m4.make(); m4.compose(m,XR.origin,[0,XR.yaw,0],[1,1,1]); return m; }
function poseMat(pose){ const m=new Float32Array(16); m.set(pose.transform.matrix); const o=m4.make(); m4.mul(o,worldFromLocal(),m); return o; }
async function enterVR(){
  try{ const session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']}); await gl.makeXRCompatible();
    session.updateRenderState({baseLayer:new XRWebGLLayer(session,gl,{antialias:false,depth:false}),depthNear:.04,depthFar:200});
    let space; try{ space=await session.requestReferenceSpace('local-floor'); XR.floorY=0; }catch(_){ space=await session.requestReferenceSpace('local'); XR.floorY=1.62; }
    XR.session=session; XR.space=space; start(true); XR.yaw=START.yaw+Math.PI; XR.origin=[P.x,floorY(P.x,P.z)+XR.floorY,P.z]; XR.last=0;
    $g('gStart').hidden=true;
    session.addEventListener('end',()=>{ XR.session=null; G.xr=false; G.on=false; document.body.classList.remove('playing'); $g('gStart').hidden=false; resumeDesk(); });
    session.requestAnimationFrame(xrFrame); }
  catch(err){ fail('Could not start VR: '+(err&&err.message||err)+'. Open this page in the Quest browser and try again.'); } }
let resumeDesk=()=>{};
function xrFrame(t,xf){ const session=xf.session; session.requestAnimationFrame(xrFrame);
  const dt=Math.min(.05,XR.last?(t-XR.last)/1000:1/72); XR.last=t;
  const vp=xf.getViewerPose(XR.space); if(!vp) return;
  const Hm=poseMat(vp),eye=colOf(Hm,3),f=norm3(v3.sc(colOf(Hm,2),-1));
  const hy=Math.atan2(f[0],f[2]);
  /* the head can walk into walls physically: slide the play space back */
  { const nx=free(eye[0],P.z,P.y)?eye[0]:P.x, nz=free(nx,eye[2],P.y)?eye[2]:P.z; XR.origin[0]+=nx-eye[0]; XR.origin[2]+=nz-eye[2]; P.x=nx; P.z=nz; }
  P.yaw=hy; P.pitch=Math.asin(clamp(f[1],-1,1));
  for(const src of session.inputSources){ const hand=src.handedness; if(hand!=='left'&&hand!=='right') continue; const H_=HANDS[hand]; if(!H_) continue;
    const gp_=src.gripSpace&&xf.getPose(src.gripSpace,XR.space); if(gp_){ const Mh=poseMat(gp_); setLocal(H_.n,m4.make(),Mh); H_.n.vis=true; H_.pos=colOf(Mh,3); H_.M=Mh; }
    const gp=src.gamepad; if(!gp) continue; const b=gp.buttons,ax=gp.axes,pr=i=>!!(b[i]&&b[i].pressed),edge=i=>{ const k=hand+i,p=pr(i),w=XR.btn[k]; XR.btn[k]=p; return p&&!w; };
    const grip=edge(1),trig=edge(0),stickC=edge(3);
    if((grip||trig)&&!G.hasBag&&tryGrab(H_.pos)) G.bagHand=hand;
    else if(grip&&!(G.hasBag&&G.bagHand===hand)){ const s_=ledgeNear(H_.pos); if(s_){ CLIMB.hand=hand; CLIMB.anchor=H_.pos.slice(); CLIMB.s=s_; ACT.on=false; P.ground=false; P.vy=0; } }
    if(CLIMB.hand===hand){ if(pr(1)) climbPull(H_.pos); else climbRelease(); }
    const ax_=edge(4); if((trig||ax_)&&G.result) reset(); else if(ax_) jump();
    if(hand==='left'){ const sx=ax[2]||0,sz=ax[3]||0; if(stickC){ XR.runToggle=!XR.runToggle; } P.run=XR.runToggle; XR.stick=[-sz,sx]; if(Math.hypot(sx,sz)<.12) XR.runToggle=false; }
    else { const sx=ax[2]||0; if(Math.abs(sx)>.7&&!XR.snap){ XR.snap=true; const a=-Math.sign(sx)*Math.PI/4,c=Math.cos(a),s=Math.sin(a),dx=XR.origin[0]-eye[0],dz=XR.origin[2]-eye[2];
        XR.origin[0]=eye[0]+dx*c+dz*s; XR.origin[2]=eye[2]-dx*s+dz*c; XR.yaw+=a; } else if(Math.abs(sx)<.3) XR.snap=false; } }
  if(!CLIMB.hand){ const bx=P.x,bz=P.z; bodyTick(dt,XR.stick?XR.stick[0]:0,XR.stick?XR.stick[1]:0,hy); XR.origin[0]+=P.x-bx; XR.origin[2]+=P.z-bz; }
  XR.origin[1]=P.y+XR.floorY;
  if(G.hasBag&&G.bagHand&&HANDS[G.bagHand]){ setParent(BAG,HANDS[G.bagHand].n); BAG.p=[0,-.22,.02]; BAG.r=[0,Math.PI/2,0]; }
  if(phoneDirty) drawPhone();
  /* the cam fields drive the freeze-frame gaze test */
  cam.t=eye.slice(); cam.r=.04; cam.th=hy+Math.PI; cam.ph=Math.PI/2+P.pitch;
  stepWorld(dt);
  const layer=session.renderState.baseLayer; updateWorld(world,null);
  for(const v of vp.views){ const vpt=layer.getViewport(v); proj.set(v.projectionMatrix); const em=new Float32Array(16); em.set(v.transform.matrix); const wm=m4.make(); m4.mul(wm,worldFromLocal(),em); view.set(rigidInv(wm));
    const h=Math.max(1,Math.round(vpt.height*state.sharp)),w=Math.max(1,Math.round(vpt.width*state.sharp)); ensureFB(w,h); fbSmooth(); renderMats(w,h); postTo(layer.framebuffer,vpt.x,vpt.y,vpt.width,vpt.height,w,h); } }
/* renderScene, but with proj and view already set (the headset's own per-eye matrices) */
function renderMats(w,h){ gl.bindFramebuffer(gl.FRAMEBUFFER,fb); drawWorldLDN(world,w,h,null); }
function postTo(target,x,y,w,h,sw,sh){ gl.bindFramebuffer(gl.FRAMEBUFFER,target); gl.viewport(x,y,w,h); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); curCull=null; curTex=null;
  gl.useProgram(POST_LDN.p); gl.bindVertexArray(emptyVAO); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,fbTex);
  gl.uniform1i(POST_LDN.loc.tScene,0); gl.uniform2f(POST_LDN.loc.uRes,sw,sh); gl.uniform1f(POST_LDN.loc.uDither,state.dither?1:0); gl.uniform1f(POST_LDN.loc.uGrade,LOOK.grade?1:0); gl.uniform1f(POST_LDN.loc.uFreeze,LOOK.freeze); gl.uniform1f(POST_LDN.loc.uDay,LOOK.day||0);
  gl.drawArrays(gl.TRIANGLES,0,3); gl.bindVertexArray(null); gl.bindTexture(gl.TEXTURE_2D,null); }

/* ---------- one step of the game (the art-set loop calls this; the headset loop too) ---------- */
let stepWorld=()=>{};
function tick(dt){ if(!G.on) return; if(!G.xr) deskTick(dt); promptTick();
  G.t+=dt; if(G.result){ G.endT+=dt; linesTick(dt); return; }
  for(const c of COPS) copTick(c,dt); jobTick(dt); linesTick(dt); }
return {phoneDirty:()=>{ phoneDirty=true; },say,sayNow,setObj,setStars,LINES,makeCop,copTick,sol,G,P,COPS,ACT,SOL,WALK,CASH,BLOCK,LOCKUP,START,setInput:(f,s_,run)=>{ TOUCH.stick=[s_,-f]; TOUCH.run=!!run; },start,reset,tick,enterVR,tryGrab,jump,bodyTick,canSee,clearLine,setStepWorld:f=>{ stepWorld=f; },setResume:f=>{ resumeDesk=f; },labels,done,busted,standable};
})();
