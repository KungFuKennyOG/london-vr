/* ==========================================================================================================
   THE JOB ACROSS THE HUB, AND THINGS TO DO.
   - Leg two: at Arch 9 Terry won't take it; Lenny wants the bag himself, at the boxing club under the arches on
     Cheshire Street, 600 m west across the hub.
   - Five more coppers walk their beats across the hub (the police car is in the traffic).
   - The phone points the way: an arrow and the distance to whatever you're after.
   - Side jobs: 25 stashes of Degsy's money hidden on roofs, extensions and decks; chicken deliveries for Ali against
     the clock to real front doors; the Roof Run, a timed line over the rooftops behind the shops.
   ========================================================================================================== */
const JOBS={target:null,label:'',gig:null,run:null,best:null,gigs:0,stashN:0};
try{ JOBS.best=+localStorage.getItem('ldn.roofrun')||null; }catch(e){}
const GG=()=>GAME.G, GP=()=>GAME.P;
Object.assign(GAME.LINES,{
  t1:['terry','Not here, son. Lenny wants it in his own hands.'],
  t2:['terry','Boxing club. Under the arches on Cheshire Street, the far end, past Vallance Road. Go.'],
  lenny:['lenny','Good lad. Degsy said you were quick. Tell him we\'re square.'],
  lennyNo:['lenny','Not with the filth on your heels. Lose them.'],
  aliGig:['ali','You want work? Wings for number {n}, {s}. Hot, mind. Go!'],
  aliTip:['ali','Quick! Here, that\'s yours.'],
  aliLate:['ali','Cold. They\'ve complained. Here\'s a fiver.'],
  runGo:['danny','Go!'],
});

/* ---------- the boxing club: an open arch on the main line, lit, with Lenny outside ---------- */
const BOXCLUB={x:-552,z:143.2};
{ const x=BOXCLUB.x, zf=146-.02, warm=(()=>{ const m=nightM(P2(128,128,(g,w,h)=>{ g.clearRect(0,0,w,h); g.save(); g.beginPath(); g.moveTo(8,h); g.lineTo(8,58); g.arc(64,58,56,Math.PI,0); g.lineTo(120,h); g.clip();
      vfill(g,0,0,w,h,[[0,'#ffd8a0'],[1,'#c87838']]); R(g,'#3a1a10',0,h-18,w,18); R(g,'#c81a1a',20,72,88,4); R(g,'#e8e8e0',20,82,88,3); R(g,'#2a5ab8',20,92,88,3); for(const px of [20,108]) R(g,'#1a1a1a',px-2,68,4,42);
      for(const bx of [14,112]){ R(g,'#3a3a3a',bx,30,2,24); ell(g,bx+1,70,6,16,'#8a1a1a'); } R(g,'#2a1a10',52,64,24,46); R(g,'#ffcf8a',55,67,18,18); g.restore(); },0,1),{unlit:true,cut:true},0); return m; })();
  eGrid(warm,[x+2.4,0,zf-.01],NX,Y_,4.8,4.8,4.8,4.8); eSign(atlasSign('#141414','#f2c24a','EAST END ABC','BOXING · EST. 1884 · ALL WELCOME',{face:'anton',subC:'#e8e2d4'}),[x,5.2,zf-.05],NX,5,.9);
  STREET_LIGHT.pl.push([[x,3,zf-2],[1.6,1.1,.6],9]); }
const LENNY_ID='ped9'; let LENNY=null;
function makeLenny(){ const n=N(LIFE.root,BOXCLUB.x+1.4,PAVE_Y,BOXCLUB.z-.6); n.dyn=true; const C=makeChar(LENNY_ID,n,'cast'); applyPose(C,'watch'); n.r=[0,Math.PI,0]; skinUpdate(C); C.node=n; LENNY={C,n}; }
function leg2Start(){ const G=GG(); G.phase='leg2'; G.queue.length=0; G.line=null; GAME.say('t1',2.6); GAME.say('t2',4.2);
  G.goalText='Take the bag to Lenny at the boxing club, under the railway arches on Cheshire Street (west, past Vallance Road).'; GAME.setObj(G.goalText); JOBS.target=[BOXCLUB.x,BOXCLUB.z-1.5]; JOBS.label='LENNY'; }

/* ---------- more coppers on the beat ---------- */
const BEATS=[['pcmale',[-200,-.4,Math.PI/2],[[-260,-.4],[-120,-.4]]],['pcfem',[-325.2,60,0],[[-325.2,20],[-325.2,125]]],['pcmale',[-755.2,0,0],[[-755.2,-70],[-755.2,70]]],
  ['pcfem',[750,22,Math.PI],null],['pcmale',[-500,-325.2,Math.PI/2],[[-600,-325.2],[-400,-325.2]]]];
let beatsMade=false;
function makeBeats(){ beatsMade=true; BEATS.forEach(([id,post,patrol],i)=>{ const n=N(LIFE.root,post[0],PAVE_Y,post[1]); n.dyn=true; const C=makeChar(id,n,'cast'); applyPose(C,'idle'); C.node=n; const c=GAME.makeCop(id,post,patrol,C); c.hub=true; c.id=id; }); }

/* ---------- stashes: Degsy's money, hidden ---------- */
function makeStashes(){ const r=hr(7701), picks=[];
  const pool=EXT_TOPS.filter(p=>!inCore(p[0],p[2],4)); for(let i=0;i<14&&pool.length;i++){ const k=(r()*pool.length)|0; picks.push(pool.splice(k,1)[0]); }
  picks.push(...BANDSTAND.map(b=>[b[0]+2,b[1]+.3,b[2]]));
  for(const [x,z] of [[-110,-312],[-100,-272],[-110,-232]]) picks.push([x,PAVE_Y+15.4,z]);                       /* the deck roofs */
  for(const f of [2,3,4]) picks.push([-130+f*8,PAVE_Y+f*3,-266.1]);                                               /* along the decks */
  picks.push([px0Weavers()+15,PAVE_Y+1.8,200.1],[200,PAVE_Y+2.5,-229]);
  for(const p of picks.slice(0,25)){ const [x,y,z]=p; if(!isFinite(x)) continue; const n=N(STREET,x,y+.01,z); n.dyn=true; mk(box(.26,.16,.14,{tw:.8,td:.8}),col(0xe8e4dc),n,0,.08,0); mk(box(.2,.02,.12),col(0x9a7a4a),n,.02,.17,.02,0,.3,0);
    GAME.CASH.push({n,got:false,p:[x,y,z],hub:true}); JOBS.stashN++; } }
function px0Weavers(){ const L_=LANDMARK_BLOCKS.find(q=>q[0]==='weavers'); return L_[3]-56; }

/* ---------- Ali's deliveries ---------- */
function gigOffer(){ const G=GG(), P=GP(), ali=CAST.ali.node.p; if(JOBS.gig||G.stars>0||G.phase==='meet'||G.phase==='brief') return;
  if(Math.hypot(P.x-ali[0],P.z-ali[2])<2.4&&!JOBS.offerCool){ const doors=HOUSE_DOORS.filter(d=>{ const dd=Math.hypot(d.x-P.x,d.z-P.z); return dd>120&&dd<420; }); if(!doors.length) return;
    const d=doors[Math.random()*doors.length|0], dist=Math.hypot(d.x-P.x,d.z-P.z); JOBS.gig={d,t:Math.round(dist/2.6+25),t0:0}; JOBS.offerCool=true;
    GAME.LINES.aliGigX=['ali',GAME.LINES.aliGig[1].replace('{n}',d.no).replace('{s}',titleCase(d.street))]; GAME.say('aliGigX',4);
    gigMarker(d); } else if(Math.hypot(P.x-ali[0],P.z-ali[2])>5) JOBS.offerCool=false; }
const titleCase=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
let GIGM=null; const tJobRing=P2(64,64,(g,w,h)=>{ g.clearRect(0,0,w,h); g.strokeStyle='#ffd040'; g.lineWidth=5; g.beginPath(); g.arc(32,32,26,0,7); g.stroke(); g.lineWidth=2; g.beginPath(); g.arc(32,32,18,0,7); g.stroke(); },0,1);
function gigMarker(d){ if(!GIGM){ GIGM=mk(plane(1.4,1.4),M(tJobRing,{unlit:true,cut:true,double:true,nofog:true}),LIFE.root); GIGM.dyn=true; GIGM.geo=GIGM.mesh.geo; GIGM.mesh.geo.noDist=true; } GIGM.vis=!!d; if(d){ GIGM.p=[d.x,PAVE_Y+.03,d.z]; GIGM.r=[-Math.PI/2,0,0]; } }
function gigTick(dt){ const g=JOBS.gig; if(!g) return; const P=GP(); g.t0+=dt; const left=g.t-g.t0;
  if(Math.hypot(P.x-g.d.x,P.z-g.d.z)<1.6){ const pay=left>0?15+Math.round(left/3):5; GG().cash=(GG().cash||0)+pay; GAME.say(left>0?'aliTip':'aliLate',2.4); JOBS.gig=null; JOBS.gigs++; gigMarker(null); GAME.phoneDirty(); toast('DELIVERED · £'+pay); }
  if(GIGM&&GIGM.vis){ GIGM.r=[-Math.PI/2,0,LIFE.t]; const s=1+.08*Math.sin(LIFE.t*5); GIGM.s=[s,s,s]; } }

/* ---------- the Roof Run: the line over the shops, timed ---------- */
const RUN_PTS=[[-12.8,PAVE_Y+2.5,-8.75],[-1,4.35,-7.2],[9.0,4.35,-6.4],[20,4.35,-7.0],[27.4,4.35,-7.8],[24,PAVE_Y,-7.0],[18.6,PAVE_Y,-7.0],[5,PAVE_Y,-15],[-14.1,PAVE_Y+2.35,-15.6],[8.4,PAVE_Y+2.8,-24.2]];
const RUN_START=[-14.4,PAVE_Y,-9.6];
const RUNM=[]; { const m=M(tJobRing,{unlit:true,cut:true,double:true}); for(let i=0;i<RUN_PTS.length;i++){ const n=mk(plane(1.1,1.1),m,LIFE.root); n.dyn=true; n.vis=false; RUNM.push(n); } }
const tRunTag=P2(128,64,(g,w,h)=>{ g.clearRect(0,0,w,h); g.font=`bold 44px ${SANS}`; g.fillStyle='#ffd040'; g.strokeStyle='#1a1a1a'; g.lineWidth=6; g.strokeText('RUN',18,48); g.fillText('RUN',18,48); R(g,'#ffd040',96,20,22,4); },0,1);
{ const n=mk(plane(1.6,.8),M(tRunTag,{cut:true}),STREET,-16.0+.04,PAVE_Y+1.6,-9.6,0,Math.PI/2,0); }
function runTick(dt){ const P=GP(), G=GG(); let R_=JOBS.run;
  if(!R_){ if(Math.hypot(P.x-RUN_START[0],P.z-RUN_START[2])<1.2&&!G.hasBag&&!JOBS.gig&&!JOBS.runCool){ JOBS.run=R_={i:0,t:0}; JOBS.runCool=true; GAME.say('runGo',1); toast('ROOF RUN · GO'); }
    else if(Math.hypot(P.x-RUN_START[0],P.z-RUN_START[2])>3) JOBS.runCool=false;
    for(const n of RUNM) n.vis=false; return; }
  R_.t+=dt; RUNM.forEach((n,i)=>{ n.vis=i===R_.i||i===R_.i+1; const p=RUN_PTS[i]; n.p=[p[0],p[1]+.9,p[2]]; n.r=[0,LIFE.t*2+i,0]; const s=i===R_.i?1:.6; n.s=[s,s,s]; });
  const p=RUN_PTS[R_.i]; if(Math.hypot(P.x-p[0],P.z-p[2])<1.4&&Math.abs(P.y-p[1])<1.2){ R_.i++; auBeep(); if(R_.i>=RUN_PTS.length){ const t=R_.t; JOBS.run=null; const pb=!JOBS.best||t<JOBS.best; if(pb){ JOBS.best=t; try{ localStorage.setItem('ldn.roofrun',String(t)); }catch(e){} } toast('ROOF RUN · '+t.toFixed(1)+' s'+(pb?' · BEST':'')); } }
  if(R_&&R_.t>180){ JOBS.run=null; toast('ROOF RUN · TIMED OUT'); } }
function auBeep(){ if(!AU.on) return; const c=AU.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain(); o.type='square'; o.frequency.value=880; g.gain.setValueAtTime(.08,t); g.gain.exponentialRampToValueAtTime(.001,t+.15); o.connect(g); g.connect(AU.master); o.start(t); o.stop(t+.16); }

/* ---------- where to go: the phone's arrow, and a line on the desktop HUD ---------- */
function curTarget(){ const G=GG(); if(JOBS.run){ const p=RUN_PTS[JOBS.run.i]; return [p[0],p[2],'NEXT']; } if(JOBS.gig) return [JOBS.gig.d.x,JOBS.gig.d.z,'NO. '+JOBS.gig.d.no];
  if(G.phase==='leg2'&&!G.result) return [JOBS.target[0],JOBS.target[1],'LENNY']; if(G.phase==='deliver'&&!G.result) return [31,-3.4,'ARCH 9']; if(G.phase==='meet') { const d=CAST.degsy.node.p; return [d[0],d[2],'DEGSY']; } return null; }
let navLast='';
function phoneExtra(g,w,h){ const T=curTarget(), P=GP(); g.textAlign='left';
  if(T){ const dx=T[0]-P.x, dz=T[1]-P.z, d=Math.hypot(dx,dz), a=Math.atan2(dx,dz)-P.yaw; g.save(); g.translate(w-46,h-170); g.rotate(-a); g.fillStyle='#ffd040'; g.beginPath(); g.moveTo(0,-26); g.lineTo(16,14); g.lineTo(0,6); g.lineTo(-16,14); g.closePath(); g.fill(); g.restore();
    g.fillStyle='#ffd040'; g.font=`bold 20px ${TYPEF}`; g.fillText(T[2]+' · '+(d<1000?Math.round(d)+' m':(d/1000).toFixed(1)+' km'),14,h-200); }
  if(JOBS.gig){ const left=Math.max(0,JOBS.gig.t-JOBS.gig.t0); g.fillStyle=left>10?'#7ad87a':'#ff6a4a'; g.font=`bold 22px ${TYPEF}`; g.fillText('WINGS · '+Math.ceil(left)+' s',14,h-228); }
  if(JOBS.run){ g.fillStyle='#ffd040'; g.font=`bold 22px ${TYPEF}`; g.fillText('ROOF RUN · '+JOBS.run.t.toFixed(1)+' s',14,h-228); }
  const got=GAME.CASH.filter(c=>c.hub&&c.got).length; g.fillStyle='#8a857a'; g.font=`bold 16px ${TYPEF}`; g.fillText('STASHES '+got+'/'+JOBS.stashN+(JOBS.best?' · RUN '+JOBS.best.toFixed(1)+'s':''),14,h-84); }
let navEl=null, toastEl=null, toastT=0;
function toast(s){ if(!toastEl){ toastEl=document.createElement('div'); toastEl.className='ldnToast'; document.body.append(toastEl); } toastEl.textContent=s; toastEl.hidden=false; toastT=2.6; }
function jobsTick(dt){ const G=GG(); if(!G.on) return; if(!beatsMade){ makeBeats(); makeStashes(); makeLenny(); }
  /* Lenny at the club */ if(LENNY){ const d=Math.hypot(GP().x-LENNY.n.p[0],GP().z-LENNY.n.p[2]); if(G.phase==='leg2'&&!G.result&&d<2.6){ if(G.stars===0){ G.queue.length=0; GAME.sayNow('lenny',3.4); GAME.done(); } else if(!G.said.has('lennyNo')){ G.said.add('lennyNo'); GAME.say('lennyNo',3); } } else if(d>5) G.said.delete('lennyNo'); }
  gigOffer(); gigTick(dt); runTick(dt);
  const T=curTarget(); const key=T?(Math.round(Math.hypot(T[0]-GP().x,T[1]-GP().z)/5)+'|'+Math.round((Math.atan2(T[0]-GP().x,T[1]-GP().z)-GP().yaw)*6)):'';
  if(key!==navLast||JOBS.gig||JOBS.run){ navLast=key; GAME.phoneDirty(); }
  if(!navEl){ navEl=document.createElement('div'); navEl.className='ldnNav'; document.body.append(navEl); }
  if(T&&!G.xr){ const dx=T[0]-GP().x, dz=T[1]-GP().z, a=Math.atan2(dx,dz)-GP().yaw; navEl.hidden=false; navEl.innerHTML='<i style="transform:rotate('+(-a)+'rad)">▲</i> '+T[2]+' · '+Math.round(Math.hypot(dx,dz))+' m'+(JOBS.gig?' · '+Math.ceil(Math.max(0,JOBS.gig.t-JOBS.gig.t0))+' s':'')+(JOBS.run?' · '+JOBS.run.t.toFixed(1)+' s':''); } else navEl.hidden=true;
  if(toastEl&&toastT>0){ toastT-=dt; if(toastT<=0) toastEl.hidden=true; } }
