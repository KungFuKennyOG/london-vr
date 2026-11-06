/* =====================================================================================================
   VIEW, CAST, FREEZE-FRAMES, LOOP. One view of the street. The cast stands where they'd be at 02:14, or in a
   line-up along the kerb. Pick someone and you walk up to them and the world freezes, with their name card beside them.
   ===================================================================================================== */
const state={ps1:true,res:480,sharp:.95,snap:false,affine:false,dither:true,rain:true,layout:'street',pose:'stand',pick:null,eye:false};
const cam={t:[0,1.4,0],th:.32,ph:1.32,r:11},goal={t:[0,1.4,0],th:.32,ph:1.32,r:11};
const HOME={t:[-1.2,1.6,0],th:.28,ph:1.36,r:11.5};
function setGoal(c,instant){ goal.t=c.t.slice(); goal.ph=c.ph; goal.r=c.r; let th=c.th; while(th-cam.th>Math.PI) th-=Math.PI*2; while(th-cam.th<-Math.PI) th+=Math.PI*2; goal.th=th; if(instant){ cam.t=goal.t.slice(); cam.th=goal.th; cam.ph=goal.ph; cam.r=goal.r; } }
function effR(){ const asp=cv.width/Math.max(1,cv.height); return cam.r*Math.max(1,(asp<.8?.82:1.1)/asp); }
function eyePos(){ const r=effR(); return [cam.t[0]+r*Math.sin(cam.ph)*Math.sin(cam.th),cam.t[1]+r*Math.cos(cam.ph),cam.t[2]+r*Math.sin(cam.ph)*Math.cos(cam.th)]; }
const clampGoal=()=>{ if(state.eye){ goal.ph=Math.min(2.7,Math.max(.45,goal.ph)); goal.r=.04; return; } goal.ph=Math.min(1.62,Math.max(.25,goal.ph)); goal.r=Math.min(22,Math.max(1.4,goal.r)); };
const ptrs=new Map(); let lastPinch=0,panMode=false;
cv.addEventListener('pointerdown',e=>{ cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY}); panMode=e.button===2||e.shiftKey; if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; lastPinch=Math.hypot(a.x-b.x,a.y-b.y); } if(frozen&&frozenT>.4) unfreeze(); });
cv.addEventListener('pointermove',e=>{ const p=ptrs.get(e.pointerId); if(!p) return; const dx=e.clientX-p.x,dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
  if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); if(lastPinch) goal.r*=lastPinch/d; lastPinch=d; pan(dx/2,dy/2); }
  else if(panMode&&!state.eye) pan(dx,dy); else { goal.th+=(state.eye?1:-1)*dx*.006; goal.ph+=(state.eye?1:-1)*dy*.005; } clampGoal(); });
const endPtr=e=>{ ptrs.delete(e.pointerId); if(ptrs.size<2) lastPinch=0; };
cv.addEventListener('pointerup',endPtr); cv.addEventListener('pointercancel',endPtr); cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{ e.preventDefault(); if(state.eye){ walk(-e.deltaY*.004,0); return; } goal.r*=Math.exp(e.deltaY*.0012); clampGoal(); },{passive:false});
const keys={}; addEventListener('keydown',e=>{ keys[e.code]=true; }); addEventListener('keyup',e=>{ keys[e.code]=false; });
/* eye level: you stand on the pavement at 1.65 m, as in the headset. Drag to look, WASD or the wheel to walk. */
function walk(f,s){ const fx=-Math.sin(goal.th),fz=-Math.cos(goal.th); goal.t[0]+=fx*f+fz*s*-1; goal.t[2]+=fz*f+fx*s; goal.t[0]=Math.max(-15,Math.min(15,goal.t[0])); goal.t[2]=Math.max(FZ-2.3,Math.min(ROAD_Z1+3,goal.t[2])); goal.t[1]=(goal.t[2]>KERB_Z&&goal.t[2]<ROAD_Z1?0:PAVE_Y)+1.65; }
function setEye(on){ state.eye=on; unfreeze(); if(on){ const e=eyePos(); setGoal({t:[Math.max(-14,Math.min(14,e[0])),PAVE_Y+1.65,Math.min(KERB_Z-.4,Math.max(FZ+.6,1.8))],th:cam.th+Math.PI,ph:Math.PI/2,r:.04}); if(state.layout==='street') setGoal({t:[1.2,PAVE_Y+1.65,2],th:-1.15+Math.PI*0+1.15+.9,ph:1.6,r:.04}); } else setGoal(state.layout==='lineup'?{t:[0,1.05,1.4],th:0,ph:1.42,r:innerWidth>760?7.4:9.6}:HOME); renderCard(); }
cv.addEventListener('keydown',e=>{ const k={ArrowLeft:[.12,0],ArrowRight:[-.12,0],ArrowUp:[0,-.08],ArrowDown:[0,.08]}[e.key];
  if(k){ e.preventDefault(); goal.th+=k[0]; goal.ph+=k[1]; clampGoal(); } if(e.key==='+'||e.key==='='){ goal.r*=.9; clampGoal(); } if(e.key==='-'){ goal.r*=1.1; clampGoal(); } if(e.key==='Escape') unfreeze(); });
function pan(dx,dy){ const s=goal.r*.0016; const rx=Math.cos(cam.th),rz=-Math.sin(cam.th); goal.t[0]-=rx*dx*s; goal.t[2]-=rz*dx*s; goal.t[1]+=dy*s; goal.t[1]=Math.max(.3,Math.min(8,goal.t[1])); goal.t[0]=Math.max(-14,Math.min(14,goal.t[0])); goal.t[2]=Math.max(-2.5,Math.min(12,goal.t[2])); }

/* ---------- the cast on the street ---------- */
/* where each of them is at 02:14: [x, z, heading, pose] */
const SPOTS={danny:[-.6,1.1,.15,'stand'],degsy:[-5.6,-.9,.55,'smoke'],kwame:[8.4,-21.0,.25,'stand'],ali:[-7.0,-5.15,0,'watch'],
  maureen:[1.8,.5,-.9,'stand'],piotr:[4.6,1.4,-.5,'phone'],pcmale:[7.4,3.6,-1.1,'stand'],pcfem:[9,4.4,-1.3,'stand']};
const CAST={};
for(const id of ORDER){ const n=N(STREET,0,PAVE_Y,0); n.dyn=true; const C=makeChar(id,n,'cast'); C.node=n; CAST[id]=C;
  const P=C.poses, hy=C.o.thigh+C.o.shin+C.o.foot+.05;
  P.smoke={hipsY:hy,wpn:'fight',j:{armR:[-.4,0,.28],elbowR:[-1.55,0,0],armL:[.08,0,.14],elbowL:[-.25,0,0],spine:[.03,0,0],head:[-.05,.25,0],thighL:[-.06,0,.06],thighR:[.05,0,-.04],kneeL:[.08,0,0]}};
  if(id==='maureen') P.fight={hipsY:hy,wpn:'fight',j:{armR:[-.95,0,.12],elbowR:[-1.15,0,0],armL:[.05,0,.12],elbowL:[-.5,0,0],spine:[.08,0,0],head:[.1,0,0]}};
  if(id==='kwame') P.fight={hipsY:hy,wpn:'fight',j:{armR:[.08,0,-.1],elbowR:[-.35,0,0],armL:[.1,0,.1],elbowL:[-.3,0,0],head:[.06,-.3,0],thighL:[-.04,0,.04]}};
  if(id==='danny'||id==='degsy'||id==='piotr'||id==='ali') P.fight=Object.assign({},P.idle,{wpn:'fight'}); }
function place(){ const n=ORDER.length; ORDER.forEach((id,i)=>{ const C=CAST[id];
    if(state.layout==='lineup'){ C.node.p=[(i-(n-1)/2)*1.05,PAVE_Y,1.4]; C.node.r=[0,0,0]; }
    else { const s=SPOTS[id]; const onRoad=s[1]>KERB_Z; C.node.p=[s[0],onRoad?0:PAVE_Y,s[1]]; C.node.r=[0,s[2],0]; } });
  poseAll(); }
function poseOf(id){ const p=state.pose; if(p==='stand') return state.layout==='lineup'?'fight':SPOTS[id][3]==='stand'?'fight':SPOTS[id][3]; return p==='scared'?'cower':p; }
function poseAll(){ for(const id of ORDER){ const C=CAST[id]; const name=poseOf(id); applyPose(C,name);
  if(state.pose==='handsup'||state.pose==='scared'){ C.J.headMesh.mesh.mats[0]=C.faceM.shock; C.J.headMesh.mesh.runs=null; } skinUpdate(C); } }

/* ---------- freeze-frame, the VR way ----------
   The world stops (time, rain, smoke, the cast) and the colour drains to the grade; the viewer's head does not move.
   The name card is an object in the world at the character's shoulder, turned to face you. In the headset it has to
   earn the look: within 4 m, looking at them for 0.6 s. It lets go after 3.2 s, on a click, or on Escape. */
let frozen=false,frozenT=0,pending=null,lookT=0;
const SEEN=new Set(), KEY_CAST=['degsy','kwame','ali','maureen','piotr','pcmale','pcfem'];
const CARDS={}, CARD=N(STREET); CARD.vis=false; CARD.dyn=true;
const NAMEF="'Anton','Impact','Arial Narrow',sans-serif", TYPEF="'Courier Prime','Courier New',monospace";
function cardTex(id){ const R_=ROSTER[id]; return P2(1024,512,(g,w,h)=>{ g.clearRect(0,0,w,h); R(g,'rgba(6,6,6,1)',0,20,w,h-40); R(g,'#c8231c',0,20,w,8);
    const name=R_.name.replace(/ ".*" /,' ').toUpperCase(), role=R_.role.toUpperCase();
    g.font=`700 34px ${TYPEF}`; g.fillStyle='#f4efe4'; g.fillText(role,24,76,w-48);
    g.save(); g.scale(.82,1); const fs=name.length>12?150:196; g.font=`400 ${fs}px ${NAMEF}`; g.fillStyle='#000'; g.fillText(name,24/.82,96+fs*.86+8); g.fillStyle='#f5d02e'; g.fillText(name,14/.82,96+fs*.86); g.restore();
    g.font=`700 40px ${TYPEF}`; g.fillStyle='#e8a040'; const words=R_.card.split(' '); let line='',y=410; for(const wd of words){ const tr=line?line+' '+wd:wd; if(g.measureText(tr).width>w-60&&line){ g.fillText(line,24,y); line=wd; y+=44; } else line=tr; } g.fillText(line,24,y); },0,1500); }
function cardFor(id){ if(!CARDS[id]){ CARDS[id]=mk(plane(.76,.38,2,1),ungraded(M(cardTex(id),{unlit:true,cut:true,double:true})),CARD); } return CARDS[id]; }
const FILL=6, FILL0=STREET_LIGHT.pl[FILL].map(v=>Array.isArray(v)?v.slice():v);
function headOf(id){ const p=CAST[id].node.p; return [p[0],p[1]+1.62,p[2]]; }
function freezeOn(id,walkUp){ if(walkUp!==false){ const C=CAST[id],p=C.node.p,h=C.node.r[1]+.3,d=1.5;
    /* the viewer walks up to them: eye height, 2.1 m in front and a little to one side, then the world stops */
    state.eye=true; setGoal({t:[p[0]+Math.sin(h)*d,PAVE_Y+1.65,Math.min(KERB_Z+1.2,p[2]+Math.cos(h)*d)],th:h,ph:1.6,r:.04}); renderCard(); pending={id,t:.7}; return; }
  const th=cam.th,right=[Math.cos(th),0,-Math.sin(th)],hd=headOf(id);
  for(const k in CARDS) CARDS[k].vis=false; const c=cardFor(id); c.vis=true; CARD.vis=true;
  CARD.p=[hd[0]+right[0]*.44+Math.sin(th)*.3,hd[1]-.14,hd[2]+right[2]*.44+Math.cos(th)*.3]; CARD.r=[0,th,-.05];
  STREET_LIGHT.pl[FILL]=[[hd[0]+Math.sin(th)*1.3,hd[1]+.35,hd[2]+Math.cos(th)*1.3],[1.0,.95,.88],4.2];
  state.pick=id; SEEN.add(id); frozen=true; frozenT=0; document.body.classList.add('frozen'); renderCard(); }
function unfreeze(){ pending=null; if(!frozen) return; frozen=false; CARD.vis=false; STREET_LIGHT.pl[FILL]=FILL0.map(v=>Array.isArray(v)?v.slice():v); document.body.classList.remove('frozen'); renderCard(); }
function lookTick(dt){ if(!state.eye||frozen||pending||window.__CAPTURE) { lookT=0; return; } const e=eyePos(),f=[-Math.sin(cam.th)*Math.sin(cam.ph),-Math.cos(cam.ph),-Math.cos(cam.th)*Math.sin(cam.ph)];
  for(const id of KEY_CAST){ if(SEEN.has(id)) continue; const hd=headOf(id),d=[hd[0]-e[0],hd[1]-e[1],hd[2]-e[2]],L=Math.hypot(...d); if(L>4) continue;
    const cosA=(d[0]*f[0]+d[1]*f[1]+d[2]*f[2])/L; if(cosA>Math.cos(.3)){ lookT+=dt; if(lookT>.6){ lookT=0; freezeOn(id,false); } return; } } lookT=0; }

/* ---------- card ---------- */
const card=document.getElementById('card'), clockEl=document.getElementById('clock');
const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
function segOf(opts,cur,onPick){ const s=el('div','seg'); for(const [v,label] of opts){ const b=el('button',null,label); b.type='button'; b.dataset.v=v; b.setAttribute('aria-pressed',String(v===cur)); b.addEventListener('click',()=>{ s.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); onPick(v); }); s.append(b); } return s; }
function renderCard(){ card.innerHTML='';
  card.append(el('p','sub','Case file · the cast'),el('h2',null,'Who\'s out at 2 a.m.'));
  card.append(el('p','body','Pick someone and you walk up to them; the street stops for their freeze-frame. At eye level, just look at someone close by for a moment.'));
  const row=el('div','row'); card.append(row);
  const eb=el('button','btn',state.eye?'Back to the overview':'Eye level (1.65 m)'); eb.type='button'; eb.setAttribute('aria-pressed',String(state.eye)); eb.addEventListener('click',()=>setEye(!state.eye)); row.append(eb);
  row.append(segOf([['street','On the street'],['lineup','Line-up']],state.layout,v=>{ state.layout=v; unfreeze(); place(); setGoal(v==='lineup'?{t:[0,1.05,1.4],th:0,ph:1.42,r:innerWidth>760?7.4:9.6}:HOME); }));
  card.append(el('p','seg-label','Show them'),segOf([['stand','As they are'],['handsup','Hands up'],['scared','Scared'],['hurt','Hurt']],state.pose,p=>{ state.pose=p; poseAll(); }));
  const ul=el('ul','list');
  for(const id of ORDER){ const R_=ROSTER[id],li=el('li'),b=el('button'); b.type='button'; b.setAttribute('aria-pressed',String(state.pick===id&&frozen));
    const lead=el('span','dot'); lead.style.background=R_.color;
    const txt=el('span'); txt.style.minWidth='0'; const sd=SIDES[R_.side]; txt.append(el('span','tag '+sd[0],sd[1]),el('b',null,R_.name),el('span','who',R_.role.split(' · ')[1]||''),el('small',null,R_.note));
    b.append(lead,txt); b.addEventListener('click',()=>{ freezeOn(id); }); li.append(b); ul.append(li); }
  card.append(ul);
  const w=el('p','note'); w.append(el('b',null,'The Old Bill. '),'One star brings PC Hughes on foot. Two brings PC Okafor in the car, and she runs. Lose them both and the street goes back to normal, but Ali\'s camera saw everything.'); card.append(w); }
function updateClock(){ clockEl.innerHTML=''; clockEl.append(el('b',null,'02:14'),'Bethnal Green Rd · E2'); }

const $=id=>document.getElementById(id);
function syncLook(){ LOOK.grade=$('grade').checked; state.ps1=$('ps1').checked; state.rain=$('rain').checked; RAIN.vis=state.rain; }
document.querySelectorAll('.look input').forEach(i=>i.addEventListener('change',syncLook));
syncLook();

/* ---------- loop ---------- */
function resize(){ const wide=innerWidth>760; viewShift[0]=wide?Math.min(.3,260/innerWidth*1.1):0; viewShift[1]=wide?.04:-.3;
  const dpr=Math.min(devicePixelRatio||1,2); const w=Math.max(1,Math.round(innerWidth*dpr)),h=Math.max(1,Math.round(innerHeight*dpr)); if(cv.width!==w||cv.height!==h){ cv.width=w; cv.height=h; } }
let lastT=performance.now(),clock=0,wclock=0;
function draw(){ drawLondon(eyePos(),cam.t); }
function stepWorld(dt){ clock+=dt; wclock+=dt; LOOK.time=clock; /* the freeze-frame only stops the character being introduced */
  if(pending){ pending.t-=dt; if(pending.t<=0){ const id=pending.id; pending=null; freezeOn(id,false); } }
  if(frozen){ frozenT+=dt; if(frozenT>3.2&&!window.__CAPTURE) unfreeze(); } lookTick(dt);
  LOOK.freeze=0;
  if(GAME.G.on) GAME.tick(dt);
  else { const k=1-Math.exp(-dt*(frozen?9:6)); for(let i=0;i<3;i++) cam.t[i]+=(goal.t[i]-cam.t[i])*k; cam.th+=(goal.th-cam.th)*k; cam.ph+=(goal.ph-cam.ph)*k; cam.r+=(goal.r-cam.r)*k;
    if(state.eye){ const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),s_=(keys.KeyD?1:0)-(keys.KeyA?1:0); if(f||s_) walk(f*1.6*dt,s_*1.6*dt); } }
  for(const id of ORDER){ if(GAME.G.on&&(id==='pcmale'||id==='pcfem')) continue; if(frozen&&state.pick===id) continue; const C=CAST[id]; animateChar(C,wclock); skinUpdate(C); }
  rainTick(wclock,eyePos()); DRESS.tick(wclock,eyePos()); skyTick(eyePos()); lifeTick(dt,eyePos()); todTick(dt); audioTick(dt,eyePos(),cam.th+Math.PI); if(GAME.G.on) jobsTick(dt); const fl=Math.sin(wclock*31)>.97&&Math.sin(wclock*3.1)>.6; STREET_LIGHT.pl[1][1]=fl?[.5,.22,.15]:[1.35,.62,.42]; setLights(lightsNear(STREET_LIGHT,eyePos())); }
function step(dt){ stepWorld(dt); if(!GAME.G.xr&&!window.__noDraw){ resize(); draw(); } }
function frame(now){ if(GAME.G.xr) return; const dt=Math.min(.05,(now-lastT)/1000); lastT=now; step(dt); requestAnimationFrame(frame); }
GAME.setStepWorld(stepWorld); GAME.setResume(()=>{ lastT=performance.now(); requestAnimationFrame(frame); });
if(window.__CAPTURE) document.body.classList.add('capture');
place(); renderCard(); updateClock(); setGoal(HOME,true); setLights(lightsNear(STREET_LIGHT,eyePos()));
const BAKE=bakeStatic(STREET); console.log('[london] baked',BAKE.meshes,'meshes into',BAKE.chunks,'chunks');
const ld=document.getElementById('loading'); if(ld) ld.hidden=true;
window.__london={state,CAST,setGoal,freezeOn,unfreeze,place,poseAll,step,cam,goal,setClock:v=>{wclock=v;},GAME,BAKE,PERF,EMIT,BIDX,hub:()=>HUBX,LIFE:()=>({cars:CAR_POOL,peds:PED_POOL}),setHour:h=>{ TOD.h=h; },TOD,leg2:()=>leg2Start(),JOBS,FRONTAGES,SOL:GAME.SOL,TRADES:Object.keys(TRADES)};
/* the job: start screen buttons */
{ const pb=document.getElementById('gPlay'),vb=document.getElementById('gVR'),again=document.getElementById('gAgain'),look=document.getElementById('gLook');
  if(pb) pb.addEventListener('click',()=>{ document.getElementById('gStart').hidden=true; GAME.start(false); cv.requestPointerLock?.(); cv.focus(); });
  if(vb){ if(navigator.xr&&navigator.xr.isSessionSupported) navigator.xr.isSessionSupported('immersive-vr').then(ok=>{ vb.hidden=!ok; }).catch(()=>{}); vb.addEventListener('click',()=>GAME.enterVR()); }
  if(again) again.addEventListener('click',()=>{ GAME.reset(); cv.requestPointerLock?.(); });
  if(look) look.addEventListener('click',()=>{ document.getElementById('gStart').hidden=true; document.body.classList.add('lookdev'); }); }
if(!window.__CAPTURE) requestAnimationFrame(frame);
})();
