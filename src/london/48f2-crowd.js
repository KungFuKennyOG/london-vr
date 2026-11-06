/* ==========================================================================================================
   THE CROWD AT WORK: who's out at what hour and what they're doing. Pooled round the player (up to 24 out of 32 people
   at once), built a person a frame so the page doesn't wait for them.
   - The hour decides how many and who: commuters to the Tube on Cambridge Heath Road at eight, nans and aunties with
     their shopping by day, traders calling on Columbia Road till three, the pub crowd and the chicken-shop queue in the
     evening, cabbies, drunks, night-shift workers and the odd dog walker after midnight. Rain thins it and puts the
     umbrellas and hoods up.
   - Things to do, not just walking: smoking and chatting outside the pubs, queueing at the chicken shop, sitting on the
     benches, waiting at the bus stops (and getting on when a bus pulls in), window-shopping, stopping for a call,
     nans resting on their trolleys, two people stopping for a natter, leaning on the estate decks of an evening.
   - Reactions: bump into someone and they sidestep and tut; with the Old Bill after you the people round you stop and
     stare, and someone gets their phone out; crowdAlarm(x,z,radius,level) startles (1), scatters (2) or panics (3) them.
   - Nobody ever blocks you: people are never solid, they step out of your way.
   ========================================================================================================== */
const PED_MAX=34, PED_POOL=[], CROWD_LOG={built:0,ms:0,verts:0};
/* ---------------- poses: a body, an arm on each side and the head, put together per person ---------------- */
/* arms: [shoulder x,y,z (z = outward)], elbow x. Mirrored for the right arm */
const ARMP={down:[[.04,0,.1],-.15],rdown:[[-.1,0,.08],-.32],carry:[[.02,0,.2],-.08],chest:[[-.4,-.45,-.1],-1.5],text:[[-.45,-.55,-.18],-1.7],ear:[[-.62,-.2,-.32],-2.3],
  mouth:[[-.5,-.35,-.38],-2.4],low:[[-.18,-.3,-.04],-1.25],pocket:[[.14,0,.03],-.55],back:[[.42,0,.04],-.12],lead:[[-.42,0,.06],-.5],stick:[[-.2,0,.12],-.28],
  brolly:[[-.75,-.2,-.05],-1.65],cup:[[-.6,-.35,-.45],-2.45],raise:[[-1.35,0,.22],-.5],film:[[-1.2,-.4,-.22],-1.15],fold:[[-.4,-.95,-.42],-1.9],bar:[[-.55,-.1,-.12],-.55],
  lap:[[-.62,0,-.18],-.75],dangle:[[.1,0,.2],-.1],hips:[[.12,0,.55],-1.7],up:[[-2.55,0,.42],-.85],wave:[[-1.9,0,.3],-.8]};
const ARM_LOCK=new Set(['chest','text','ear','mouth','low','back','lead','stick','brolly','cup','raise','film','fold','bar','pocket','carry']);
/* bodies: legs, spine and head; hips height from the pose */
function bodyJ(C,k){ const P=C.poses, o=C.o, hy=o.thigh+o.shin+o.foot+.05;
  if(k==='sit') return {hy:P.sit.hipsY,j:{thighL:[-1.5,0,.07],thighR:[-1.5,0,-.07],kneeL:[1.42,0,0],kneeR:[1.42,0,0],spine:[-.12,0,0],head:[.18,0,0]}};
  if(k==='slump') return {hy:P.sit.hipsY-.02,j:{thighL:[-1.35,0,.16],thighR:[-1.4,0,-.12],kneeL:[1.2,0,0],kneeR:[1.5,0,0],spine:[.32,0,.12],neck:[.2,0,0],head:[.55,.2,.15]}};
  if(k==='lean') return {hy:hy-.02,j:{spine:[.3,0,0],head:[-.12,0,0],thighL:[-.1,0,.04],thighR:[.12,0,-.04]}};
  if(k==='rail') return {hy:hy-.01,j:{spine:[.18,0,0],head:[.05,0,0],thighL:[-.06,0,.05],kneeL:[.1,0,0],thighR:[.12,0,-.03]}};
  if(k==='cower') return {hy:P.cower.hipsY,j:Object.assign({},P.cower.j)};
  if(k==='stoop') return {hy:hy-.015,j:{spine:[.16,0,0],neck:[-.06,0,0],head:[-.06,0,0],thighL:[-.05,0,.03],thighR:[.04,0,-.03]}};
  if(k==='cocky') return {hy:hy,j:{spine:[-.04,0,.03],head:[-.04,0,0],thighL:[-.08,0,.1],kneeL:[.12,0,0],thighR:[.02,0,-.06]}};
  return {hy:C.hy0,j:{thighL:[-.04,0,.03],thighR:[.03,0,-.03],head:[.04,0,0]}}; }
function pedPose(p,body,aR,aL,headX){ const key=body+'|'+aR+'|'+aL+'|'+(headX||0); if(p.poseKey===key) return; p.poseKey=key;
  const C=p.C, B=bodyJ(C,body), j=B.j, put=(n,v)=>{ p.base[n][0]=v[0]; p.base[n][1]=v[1]; p.base[n][2]=v[2]; };
  for(const n of JOINTS){ const b=p.base[n]||(p.base[n]=[0,0,0]); b[0]=b[1]=b[2]=0; }
  for(const n in j) put(n,j[n]);
  if(body!=='cower'){ for(const [s,a] of [['R',aR],['L',aL]]){ const A=ARMP[a]||ARMP.down, sg=s==='L'?1:-1; put('arm'+s,[A[0][0],A[0][1]*sg,A[0][2]*sg]); put('elbow'+s,[A[1],0,0]); } }
  if(headX) p.base.head[0]+=headX; p.hipY=B.hy; p.lockR=ARM_LOCK.has(aR); p.lockL=ARM_LOCK.has(aL); }
/* ---------------- the kit that isn't baked: trolleys, dogs, umbrellas, rain hoods, flower buckets ---------------- */
function flatten(n,m){ /* all meshes under n into one mesh on n (one draw), in n's space */ const list=[]; const I4=m4.make();
  const walk=(q,pm_)=>{ const l=m4.make(); m4.compose(l,q.p,q.r,q.s); const w=m4.make(); m4.mul(w,pm_,l); if(q.mesh) list.push([q.mesh.geo,w]); for(const k of q.kids) walk(k,w); };
  for(const k of n.kids) walk(k,I4); const g=new Geo();
  for(const [s,w] of list){ const b=g.P.length/3; for(let i=0;i<s.P.length;i+=3){ const x=s.P[i],y=s.P[i+1],z=s.P[i+2],a=s.Nm[i],c=s.Nm[i+1],d=s.Nm[i+2];
      g.P.push(w[0]*x+w[4]*y+w[8]*z+w[12],w[1]*x+w[5]*y+w[9]*z+w[13],w[2]*x+w[6]*y+w[10]*z+w[14]); g.Nm.push(w[0]*a+w[4]*c+w[8]*d,w[1]*a+w[5]*c+w[9]*d,w[2]*a+w[6]*c+w[10]*d); }
    for(const t of s.T) g.T.push(t); for(const i of s.I) g.I.push(i+b); }
  g.groups=[{start:0,count:g.I.length,mi:0}]; n.kids.length=0; n.mesh={geo:g,mats:[m],runs:null}; return n; }
function kitTrolley(parent,c){ const n=N(parent); n.dyn=true; const parts=[abox(.36,.5,.26,all6(c),[0,.42,.05]),abox(.37,.06,.27,all6(56),[0,.69,.05]),abox(.025,.98,.025,all6(56),[-.16,.49,-.1]),abox(.025,.98,.025,all6(56),[.16,.49,-.1]),
    abox(.34,.035,.035,all6(56),[0,.97,-.1]),abox(.3,.025,.2,all6(57),[0,.14,.04]),abox(.06,.16,.16,all6(56),[-.2,.08,-.06]),abox(.06,.16,.16,all6(56),[.2,.08,-.06])];
  mk(mergeG(parts),mPeople,n); return n; }
function kitDog(parent,c,sc){ const n=N(parent); n.dyn=true; const body=N(n); const d=mergeG([abox(.2,.2,.42,all6(c),[0,.34,0]),abox(.23,.22,.18,[c,c,c,55,55,c],[0,.36,.15]),abox(.17,.15,.15,all6(c),[0,.46,.3]),abox(.1,.08,.1,[c,c,c,c,56,c],[0,.42,.4]),
    abox(.05,.06,.02,all6(c),[-.06,.55,.28]),abox(.05,.06,.02,all6(c),[.06,.55,.28]),abox(.03,.03,.16,all6(c),[0,.42,-.26])]); mk(d,mPeople,body);
  const legs=[]; for(const [x,z] of [[-.07,.16],[.07,.16],[-.07,-.15],[.07,-.15]]){ const L=N(body,x,.26,z); mk(abox(.055,.26,.06,all6(c),[0,-.13,0]),mPeople,L); legs.push(L); }
  n.s=[sc,sc,sc]; const lead=N(parent); lead.dyn=true; mk(abox(.012,.012,1,all6(62),[0,0,.5]),mPeople,lead); return {n,body,legs,lead}; }
function kitBrolly(J,cell){ const n=N(J.spine); n.keep=true; n.dyn=true; mk(lathe([[0,.5,.5],[.1,.43,.43],[.17,.26,.26],[.2,.05,.05],[.21,0,0]],8,{capB:false}),mPeople,n,.1,.74,.22); mk(abox(.014,.5,.014,all6(57),[0,.25,0]),mPeople,n,.1,.3,.22);
  const g=n.kids[0].mesh.geo; for(let i=0;i<g.T.length;i+=2){ const cu=(cell%8)/8, cv=1-(Math.floor(cell/8)+1)/8; g.T[i]=cu+(.1+.8*(g.T[i]%1))/8; g.T[i+1]=cv+(.1+.8*(g.T[i+1]%1))/8; }
  flatten(n,mPeople); n.vis=false; return n; }
function kitHood(J,c){ const n=N(J.head); n.keep=true; n.dyn=true; hoodUp({head:n},c); flatten(n,M(null,{color:hexInt(c),double:true})); n.vis=false; return n; }
function kitBuckets(){ const n=N(LIFE.root); n.dyn=true; const parts=[]; for(const [x,z,h] of [[-.45,0,.34],[0,.05,.4],[.45,0,.3],[.22,-.38,.3],[-.25,-.4,.36]]){ parts.push(abox(.28,h,.28,all6(59),[x,h/2,z]),abox(.36,.24,.36,all6(58),[x,h+.1,z])); }
  mk(mergeG(parts),mPeople,n); n.vis=false; return n; }
/* ---------------- the people, made a few a frame ---------------- */
const ROLE_SPEED={nan:.68,elderM:.85,bangF:1.0,auntie:.92,youngF:1.25,builder:1.3,hipster:1.2,trader:1.0,lad:1.08,office:1.45,rider:1.5,cabbie:1.05,dog:1.0,nurse:1.35,security:1.2,drunk:.75,geezer:.88,student:1.22,nightout:1.1,jogger:2.6};
const ROLE_BODY={nan:'stoop',elderM:'stoop',geezer:'stoop',lad:'cocky',builder:'cocky'};
function makeCrowdPed(i){ const t0=performance.now(), id=CROWD[i], S=PEOPLE[i], root=N(LIFE.root); root.dyn=true; root.vis=false;
  crowdPrep(i,0); crowdPrep(i,1);
  const tc=performance.now(); const C=makeChar(id,root,'cast'); applyPose(C,'idle'); CROWD_LOG.char=(CROWD_LOG.char||0)+performance.now()-tc;
  const p={i,id,S,role:S.role,root,C,base:{},poseKey:'',hipY:C.hy0,lockR:false,lockL:false,alive:false,act:'walk',x:0,z:0,y:0,yaw:0,line:null,s:0,dir:1,lane:0,speed:(ROLE_SPEED[S.role]||1.15)*(.92+((i*37)%17)/100),
    ph:(i*1.7)%6.28,hasPhone:String(S.props||'').includes('aPhone'),t:0,dur:0,spot:null,pause:0,animAcc:9,far:99,react:null,look:null,lookW:0,barkT:0,dodge:[0,0],goal:null,flee:0,hold:S.hold||['rdown','down'],
    E:{J:C.J,o:C.o,hd:0,pos:[0,0],walkAmt:0,runAmt:0,hp:{legL:1,legR:1,armL:1,armR:1},wpnHeld:false,kind:'civ',aware:false},
    voice:{fem:!!S.fem,age:S.age?1:0,f0:(S.fem?200:112)*(S.age?.9:1)*(.92+((i*13)%15)/100)}};
  if(S.rain==='hood') p.hood=kitHood(C.J,S.hoodC||S.tc); if(S.rain==='brolly') p.brolly=kitBrolly(C.J,i%3?60:61);
  const tb=performance.now(); CROWD_LOG.verts+=crowdBake(C,id); CROWD_LOG.bake=(CROWD_LOG.bake||0)+performance.now()-tb; if(p.brolly) p.brolly.vis=false;
  if(S.trolley) p.trolley=kitTrolley(root,S.trolley); if(S.dog) p.dog=kitDog(root,S.dog.c,S.dog.s);
  pedPose(p,ROLE_BODY[p.role]||'stand',p.hold[0],p.hold[1]); skinUpdate(C);
  CROWD_LOG.ms+=performance.now()-t0; CROWD_LOG.built++; return p; }
/* the slow parts, one at a time: 0 paint the clothes, 1 paint the face */
function crowdPrep(i,stage){ const t0=performance.now(), id=CROWD[i];
  if(stage===0) CROWD_DRESS[i](); else { FACE[id]=FACE[id]||{}; if(!FACE[id].fight) FACE[id].fight=paintHead(HEADS[id],'fight'); }
  const k=stage?'face':'dress'; CROWD_LOG[k]=(CROWD_LOG[k]||0)+performance.now()-t0; }
/* ---------------- pavements: a line down the middle of each, with its half-width ---------------- */
const PLINES=[];
for(const S of STREETS){ const [id,ax,c,a,b,rw,pw]=S; let pn=pw,ps=pw; if(id==='bgr'){ pn=5.6; ps=3.0; }
  for(const [off,w,side] of [[c-rw/2-pn/2,pn,-1],[c+rw/2+ps/2,ps,1]]){ const cut=id==='bgr'?[[-17,37]]:[]; let segs=[[a,b]];
    for(const [p_,q] of cut) segs=segs.flatMap(([u,v])=>q<=u||p_>=v?[[u,v]]:[[u,p_],[q,v]].filter(([s0,s1])=>s1-s0>3));
    for(const [u,v] of segs) PLINES.push({ax,c:off,a:u,b:v,id,hw:Math.max(.25,w/2-.45),side,road:c}); } }
const lineXZ=(L,s)=>L.ax==='x'?[s,L.c]:[L.c,s];
function nextLine(L,end,goal){ const [ex,ez]=lineXZ(L,end), out=[];
  for(const M2 of PLINES){ if(M2===L) continue; const s=clamp(M2.ax==='x'?ex:ez,M2.a,M2.b), [px,pz]=lineXZ(M2,s), d=Math.hypot(px-ex,pz-ez); if(d<14) out.push([M2,s,d]); }
  if(!out.length) return null; if(!goal&&Math.random()<.6){ const h=TOD.h; let tot=0; for(const o of out){ o[3]=lively(o[0],h); tot+=o[3]; } let u=Math.random()*tot; for(const o of out){ u-=o[3]; if(u<=0) return o; } }
  if(goal&&Math.random()<.8){ let best=null,bd=1e9; for(const o of out){ const [M2,s]=o, ends=[M2.a,M2.b]; for(const e of ends){ const [qx,qz]=lineXZ(M2,e), d=Math.hypot(qx-goal[0],qz-goal[1]); if(d<bd){ bd=d; best=o; } } } if(best) return best; }
  return out[Math.random()*out.length|0]; }
function nearestLine(x,z){ let best=null,bd=1e9,bs=0; for(const L of PLINES){ const s=clamp(L.ax==='x'?x:z,L.a,L.b), [px,pz]=lineXZ(L,s), d=Math.hypot(px-x,pz-z); if(d<bd){ bd=d; best=L; bs=s; } } return best?{L:best,s:bs,d:bd}:null; }
/* ---------------- spots, gathered once the hub and its furniture exist ---------------- */
const CS={pubs:[],queues:[],windows:[],benches:[],stops:[],decks:[],pitches:[],tubes:[],ready:false};
const QTRADES=new Set(['chicken','kebab']), WTRADES=new Set(['vintage','phone','gold','charity','flowers','cafe','chemist','nails','hardware','agent','barber','offy','beigel','curry']);
function crowdSpots(){ CS.ready=true;
  for(const [x,z,yaw] of PUB_SPOTS){ if(inCore(x,z,2)) continue; const ox=Math.sin(yaw), oz=Math.cos(yaw), ux=Math.cos(yaw), uz=-Math.sin(yaw);
    CS.pubs.push({x,z,ox,oz,door:1,slots:[[x-ux*.55,z-uz*.55],[x+ux*.55,z+uz*.55],[x+ox*.65,z+oz*.65]].map(([sx,sz])=>({x:sx,z:sz,p:null}))}); }
  for(const sh of CROWD_SPOTS.shops){ if(inCore(sh.x,sh.z,3)||sh.shut) continue;
    if(QTRADES.has(sh.trade)){ const slots=[]; for(let k=0;k<5;k++){ const d=.9+k*.78; slots.push({x:sh.x+sh.ox*.8+sh.ux*d,z:sh.z+sh.oz*.8+sh.uz*d,p:null}); } CS.queues.push({sh,slots,door:[sh.x+sh.ox*.25-sh.ux*.6,sh.z+sh.oz*.25-sh.uz*.6],next:10+Math.random()*15}); }
    else if(WTRADES.has(sh.trade)) CS.windows.push(sh); }
  for(const b of CROWD_SPOTS.benches){ const fx=Math.sin(b.yaw), fz=Math.cos(b.yaw), ux=Math.cos(b.yaw), uz=-Math.sin(b.yaw); if(inCore(b.x,b.z,2)) continue;
    CS.benches.push({x:b.x,z:b.z,yaw:b.yaw,slots:[-.42,.42].map(u=>({x:b.x+ux*u-fx*.06,z:b.z+uz*u-fz*.06,p:null}))}); }
  for(const st of CROWD_SPOTS.stops){ const rx=st.ax==='x'?0:-st.side, rz=st.ax==='x'?-st.side:0, ux=st.ax==='x'?1:0, uz=st.ax==='x'?0:1; let k=1; while(k<6&&!onRoad(st.x+rx*k,st.z+rz*k)) k+=.25;
    const yaw=Math.atan2(rx,rz); st.yaw=yaw; st.kerb=[st.x+rx*(k-.45),st.z+rz*(k-.45)]; st.slots=[-1.1,0,1.1,2.4].map((u,ii)=>({x:st.x+ux*u+(ii===3?rx*(k-1.2):0),z:st.z+uz*u+(ii===3?rz*(k-1.2):0),p:null})); CS.stops.push(st); }
  for(const d of DECK_SPOTS){ if(d[1]>PAVE_Y+13) continue; CS.decks.push({x:d[0],y:d[1],z:d[2]+.38,yaw:0,slots:[{x:d[0],z:d[2]+.38,p:null}]}); }
  /* Columbia Road: pitches along both kerbs, where the pavement's clear */
  const CR=STREETS.find(S=>S[0]==='columbia'); if(CR){ const [,,c,a,b,rw]=CR; for(const [x0,side] of [[-130,-1],[-178,1],[-236,-1],[-282,1],[-92,1]]){ for(let dx=0;dx<16;dx+=1){ const x=x0+dx, kz=c+side*(rw/2+.75), tz=c+side*(rw/2+1.45);
        if(navWalk(x-.7,kz,.25)&&navWalk(x+.7,kz,.25)&&navWalk(x,tz,.25)){ CS.pitches.push({x,z:tz,bx:x,bz:kz,yaw:side<0?Math.PI:0,slots:[{x,z:tz,p:null}],buckets:null}); break; } } } }
  for(const [x,z] of TUBES) CS.tubes.push([x,z]);
  console.log('[london] crowd spots: pubs',CS.pubs.length,'queues',CS.queues.length,'windows',CS.windows.length,'benches',CS.benches.length,'stops',CS.stops.length,'decks',CS.decks.length,'pitches',CS.pitches.length); }
/* ---------------- the hours ---------------- */
const hourW=(R_,h)=>{ let w=0; for(const [a,b,v] of R_) if(a<=b?(h>=a&&h<b):(h>=a||h<b)) w=Math.max(w,v); return w; };
/* how busy, by the hour (of 24 people out at most) */
const DENS=[.34,.27,.2,.13,.09,.12,.28,.62,.9,.74,.66,.76,.9,.9,.82,.8,.86,1,.94,.84,.74,.64,.54,.44];
const crowdDensity=h=>{ const a=Math.floor(h)%24, b=(a+1)%24, k=h-Math.floor(h); return DENS[a]+(DENS[b]-DENS[a])*k; };
const ROLE_H={nan:[[8.5,16.5,1]],elderM:[[6,21.5,1],[12.5,14,1.6],[18,20.5,1.4]],bangF:[[9,19,1]],youngF:[[8,22,1]],auntie:[[9,18,1]],builder:[[6.2,17,1],[6.5,8.5,2.2]],
  hipster:[[8,23.5,1]],trader:[],lad:[[15,24,1],[0,3,1.2]],office:[[7,9.8,2.6],[12,14,1],[17,19.5,2.2],[19.5,22,.6]],rider:[[11,14.5,1],[17,24,1.5],[0,1.5,.8]],
  cabbie:[[21,24,1],[0,6,1.3]],dog:[[6,9.5,1.4],[16,22,1]],nurse:[[6,8.5,1.8],[19,22.5,1.6]],security:[[5.5,8,1],[18,23.5,1]],drunk:[[22.5,24,1.2],[0,4.5,2]],
  geezer:[[10,23,1]],student:[[9,24,1]],nightout:[[19.5,24,1],[0,3.5,1.3]],jogger:[[6,9,1],[17,20.5,1]]};
const ACT_ROLES={pub:new Set(['geezer','hipster','office','builder','nightout','drunk','student']),queue:new Set(['lad','rider','cabbie','drunk','nightout','student','security','builder']),
  bench:new Set(['nan','elderM','geezer','bangF','auntie','student','youngF','office','drunk']),stop:new Set(['nan','elderM','bangF','auntie','youngF','office','student','nurse','security','hipster','builder','drunk','nightout']),
  deck:new Set(['geezer','lad','security','builder']),chat:new Set(['elderM','bangF','auntie','hipster','lad','nightout','office','student','geezer']),window:new Set(['nan','bangF','auntie','youngF','hipster','student','elderM','office','geezer'])};
const ACT_H={pub:[[12,17,.35],[17,24,1.5],[0,1.5,1.1]],queue:[[11.5,14,.5],[18,24,1.6],[0,3.5,1.5]],bench:[[8,20,.7],[0,5,.35]],stop:[[6,24,.8],[0,5,.5]],deck:[[19,24,.35],[0,2,.35]],chat:[[8,23,.45]]};
const COMMUTE=new Set(['office','nurse','security','builder']);
const isRain=()=>!!(RAIN&&RAIN.vis);
/* ---------------- placing people ---------------- */
let CW={stage:0,px:0,pz:0,pvx:0,pvz:0,warm:true,lastX:null,lastZ:null,spawnT:0,chase:0,chaseOff:0,barkG:0,filmer:null,nearT:0,nearL:[]};
function inView(x,z,d){ const P=GAME.P, dx=x-P.x, dz=z-P.z; return d<46&&(dx*Math.sin(P.yaw)+dz*Math.cos(P.yaw))/(d||1)>.5; }
function okSpot(x,z,near){ const d=Math.hypot(x-CW.px,z-CW.pz); if(d<(near||10)||d>48) return false; if(!CW.warm&&inView(x,z,d)&&d<38) return false; return !inCore(x,z,1); }
const seen=(x,z)=>typeof navSight!=='function'||!NAV||navSight(CW.px,CW.pz,x,z);
function freePed(roles,h){ /* a person not out yet whose role fits, weighted by the hour */ let tot=0; const c=[];
  for(const p of PED_POOL){ if(p.alive||p.cool>LIFE.t||(roles&&!roles.has(p.role))) continue; const w=hourW(ROLE_H[p.role]||[],h); if(w>0){ c.push([p,w]); tot+=w; } }
  if(!c.length) return null; let u=Math.random()*tot; for(const [p,w] of c){ u-=w; if(u<=0) return p; } return c[c.length-1][0]; }
function show(p,x,z,yaw,act){ p.alive=true; p.root.vis=true; p.x=x; p.z=z; p.y=floorAt(x,z); p.yaw=yaw; p.act=act; p.t=0; p.react=null; p.flee=0; p.pause=0; p.goal=null; p.dodge[0]=p.dodge[1]=0; p.animAcc=9; p.E.G=null; p.look=null; p.lookW=0; p.partner=null; p.home=null; p.alight=0; p.sniff=0;
  if(p.trolley) trolleyAt(p,act==='bench'||act==='rest'||act==='stop'||act==='queue'?'front':'pull'); return p; }
function hide(p){ p.alive=false; p.root.vis=false; if(p.spot){ p.spot.p=null; p.spot=null; } if(p.stop){ const q=p.stop.q, k=q.indexOf(p); if(k>=0) q.splice(k,1); p.stop=null; } p.cool=LIFE.t+4; if(CW.filmer===p) CW.filmer=null; }
function startWalk(p,L,s,dir){ p.line=L; p.s=s; p.dir=dir; p.lane=(Math.random()-.5)*Math.min(1.2,L.hw*1.4); p.act='walk'; p.t=0; }
/* which streets are busy when: the high streets and the market by day, the high street's takeaways and pubs at night */
const STREET_KIND={}; for(const S of STREETS) STREET_KIND[S[0]]=S[7];
function lively(L,h){ const k=STREET_KIND[L.id]; const day=h>8&&h<19; if(k==='shops') return day?3:2.2; if(k==='market') return day?3.2:.8; if(k==='vintage') return day?2:1.2; if(k==='arches') return 1; return day?.7:.55; }
function nearLines(){ if(LIFE.t<CW.nearT&&CW.nearL.length) return CW.nearL; CW.nearT=LIFE.t+1; const out=[];
  for(const L of PLINES){ const s=clamp(L.ax==='x'?CW.px:CW.pz,L.a,L.b), [x,z]=lineXZ(L,s); if(Math.hypot(x-CW.px,z-CW.pz)<46) out.push(L); } return CW.nearL=out; }
/* a pavement point to start walking from: in sight of you if possible, never popping up in front of you */
function pickLine(h,minD){ const NL=nearLines(); let best=null,bs=-1;
  for(let k=0;k<14&&NL.length;k++){ const L=NL[Math.random()*NL.length|0], c=L.ax==='x'?CW.px:CW.pz, s=clamp(c+(Math.random()*2-1)*46,L.a,L.b), [x,z]=lineXZ(L,s);
    if(!okSpot(x,z,minD)) continue; const sc=lively(L,h)*(seen(x,z)?2.2:1)*(.6+Math.random()*.8); if(sc>bs){ bs=sc; best=[L,s,x,z]; } } return best; }
function commute(p,x,z,L){ const h_=TOD.h; if(!COMMUTE.has(p.role)||!CS.tubes.length) return; const T=CS.tubes.reduce((a,b)=>Math.hypot(b[0]-x,b[1]-z)<Math.hypot(a[0]-x,a[1]-z)?b:a);
  const toward=(L.ax==='x'?T[0]-x:T[1]-z)>0?1:-1; if(h_>=6.5&&h_<10){ p.goal=T; p.dir=toward; } else if(h_>=17&&h_<20) p.dir=-toward; }
function spawnWalker(p,h){ const f=pickLine(h,CW.warm?8:20); if(!f) return false; const [L,s,x,z]=f; show(p,x,z,0,'walk');
  const toMe=(L.ax==='x'?CW.px-x:CW.pz-z)>0?1:-1, fw=L.ax==='x'?Math.sin(GAME.P.yaw):Math.cos(GAME.P.yaw), ahead=((x-CW.px)*Math.sin(GAME.P.yaw)+(z-CW.pz)*Math.cos(GAME.P.yaw))>0;
  startWalk(p,L,s,Math.random()<.65?(ahead?toMe:(fw>=0?1:-1)):(Math.random()<.5?1:-1)); commute(p,x,z,L);
  p.yaw=L.ax==='x'?(p.dir>0?Math.PI/2:-Math.PI/2):(p.dir>0?0:Math.PI); return true; }
/* doors: people come out of their houses and the shops, and go in again */
const DOORS=new Map(); let doorsReady=false; const dkey=(x,z)=>Math.floor(x/16)*4096+Math.floor(z/16);
function addDoor(d){ const k=dkey(d.x,d.z); let a=DOORS.get(k); if(!a) DOORS.set(k,a=[]); a.push(d); }
function doorsInit(){ doorsReady=true; for(const d of HOUSE_DOORS) if(!inCore(d.x,d.z,2)) addDoor({x:d.x,z:d.z,ix:Math.sin(d.yaw),iz:Math.cos(d.yaw),kind:'house'});
  for(const sh of CROWD_SPOTS.shops) if(!sh.shut&&!inCore(sh.x,sh.z,2)) addDoor({x:sh.x+sh.ox*.55,z:sh.z+sh.oz*.55,ix:-sh.ox,iz:-sh.oz,kind:'shop',trade:sh.trade}); }
function doorsNear(x,z,r){ const out=[]; for(let a=Math.floor((x-r)/16);a<=Math.floor((x+r)/16);a++) for(let b=Math.floor((z-r)/16);b<=Math.floor((z+r)/16);b++){ const L=DOORS.get(a*4096+b); if(L) for(const d of L) if(Math.abs(d.x-x)<r&&Math.abs(d.z-z)<r) out.push(d); } return out; }
const SHOP_H={chicken:[[11,24,1],[0,3,1]],kebab:[[11,24,1],[0,3,1]],offy:[[7,24,1]],cafe:[[7,17,1]],curry:[[12,23,1]],beigel:[[0,24,1]]};
const doorOpen=(d,h)=>d.kind==='house'?(h>1&&h<6?.25:1):hourW(SHOP_H[d.trade]||[[9,18,1]],h);
function spawnFromDoor(p,h){ const D=doorsNear(CW.px,CW.pz,34); let best=null,bs=0;
  for(let k=0;k<12&&D.length;k++){ const d=D[Math.random()*D.length|0], dist=Math.hypot(d.x-CW.px,d.z-CW.pz); if(dist<9||dist>34) continue; const w=doorOpen(d,h)*(d.kind==='shop'?1.6:1); if(!w) continue;
    const sc=w*(seen(d.x,d.z)?2.5:.3)*(.5+Math.random()); if(sc>bs){ bs=sc; best=d; } }
  if(!best) return false; const nl=nearestLine(best.x,best.z); if(!nl||nl.d>4) return false;
  show(p,best.x+best.ix*.45,best.z+best.iz*.45,Math.atan2(-best.ix,-best.iz),'emerge'); p.line=nl.L; p.s=nl.s; const [lx,lz]=lineXZ(nl.L,nl.s); p.tx=lx; p.tz=lz; commute(p,lx,lz,nl.L); return true; }
function spawnAt(p,spot,slot,act,yaw,from){ slot.p=p; p.spot=slot; show(p,from?from[0]:slot.x,from?from[1]:slot.z,yaw,act); p.home=spot; return true; }
function freeSlot(list,near,walkIn){ const c=[]; for(const s of list){ const d=Math.hypot(s.x-CW.px,s.z-CW.pz); if(d<8||d>48) continue; for(const sl of s.slots) if(!sl.p&&!inCore(sl.x,sl.z,1)&&(CW.warm||walkIn||d>near||!inView(sl.x,sl.z,d)||s.door)) { c.push([s,sl,seen(s.x,s.z)?3:1]); break; } }
  let tot=0; for(const q of c) tot+=q[2]; let u=Math.random()*tot; for(const q of c){ u-=q[2]; if(u<=0) return q; } return null; }
/* where someone walking up to a spot comes from: along the pavement, from out of sight if possible */
function approach(x,z){ if(CW.warm) return null; const nl=nearestLine(x,z); if(!nl) return null; for(const sg of [1,-1]){ const s=clamp(nl.s+sg*(7+Math.random()*4),nl.L.a,nl.L.b), [ax,az]=lineXZ(nl.L,s), d=Math.hypot(ax-CW.px,az-CW.pz); if(!inView(ax,az,d)||d>30) return [ax,az]; } const s=clamp(nl.s+8,nl.L.a,nl.L.b); return lineXZ(nl.L,s); }
function spawnActivity(h){ const rain=isRain(), w={walk:1.5,door:1.5}; for(const k in ACT_H) w[k]=hourW(ACT_H[k],h)*(rain&&(k==='bench'||k==='chat')?0:rain&&k==='pub'?.7:1)*1.4;
  let tot=0; for(const k in w) tot+=w[k]; let u=Math.random()*tot, act='walk'; for(const k in w){ u-=w[k]; if(u<=0){ act=k; break; } }
  if(act==='walk'||act==='door'){ const p=freePed(null,h); if(!p||p.role==='trader') return false; if(act==='door'&&!CW.warm&&spawnFromDoor(p,h)) return true; return spawnWalker(p,h); }
  if(act==='chat'){ const a=freePed(ACT_ROLES.chat,h); if(!a) return false; a.alive=true; const b=freePed(new Set([a.role,...(a.role==='nightout'?['drunk']:[])]),h); a.alive=false; if(!b) return false;
    const f=pickLine(h,CW.warm?8:20); if(!f) return false; const [L,s,x,z]=f, ax=L.ax==='x', d=.48; show(a,ax?x-d:x,ax?z:z-d,ax?Math.PI/2:0,'chat'); show(b,ax?x+d:x,ax?z:z+d,ax?-Math.PI/2:Math.PI,'chat'); a.partner=b; b.partner=a; a.line=b.line=L; a.s=b.s=s; a.dur=b.dur=14+Math.random()*30; return true; }
  const list=act==='pub'?CS.pubs:act==='queue'?CS.queues:act==='bench'?CS.benches:act==='stop'?CS.stops:CS.decks; const f=freeSlot(list,act==='deck'?20:30,act==='queue'||act==='bench'||act==='stop'); if(!f) return false;
  const p=freePed(ACT_ROLES[act],h); if(!p) return false; const [spot,slot]=f;
  if(act==='pub'){ /* out of the pub door for a smoke, often with company */ const door=[spot.x-spot.ox*1.3,spot.z-spot.oz*1.3]; spawnAt(p,spot,slot,'pub',Math.atan2(spot.ox,spot.oz),CW.warm?null:door); p.dur=40+Math.random()*90;
    const q=spot.slots.find(s=>!s.p); const o=q&&Math.random()<.7?freePed(ACT_ROLES.pub,h):null; if(o){ spawnAt(o,spot,q,'pub',Math.atan2(spot.ox,spot.oz),CW.warm?null:[door[0]+.4,door[1]+.4]); o.dur=p.dur*(.7+Math.random()*.6); } return true; }
  if(act==='queue'){ spawnAt(p,spot,slot,'queue',0,approach(slot.x,slot.z)); p.dur=999; return true; }
  if(act==='bench'){ if(p.role==='drunk'&&h>5&&h<22) return false; spawnAt(p,spot,slot,'bench',spot.yaw,approach(slot.x,slot.z)); p.dur=25+Math.random()*70; return true; }
  if(act==='stop'){ spawnAt(p,spot,slot,'stop',spot.yaw,approach(slot.x,slot.z)); spot.q.push(p); p.stop=spot; p.dur=70+Math.random()*90; return true; }
  if(act==='deck'){ spawnAt(p,spot,slot,'deck',0); p.y=spot.y; p.dur=60+Math.random()*120; return true; }
  return false; }
function spawnTraders(h){ if(h<7.8||h>15.2) { for(const P_ of CS.pitches) if(P_.buckets) P_.buckets.vis=false; return; }
  for(const pt of CS.pitches){ const d=Math.hypot(pt.x-CW.px,pt.z-CW.pz); if(!pt.buckets){ pt.buckets=kitBuckets(); pt.buckets.p=[pt.bx,PAVE_Y,pt.bz]; pt.buckets.r=[0,pt.yaw,0]; }
    pt.buckets.vis=d<70; const sl=pt.slots[0]; if(sl.p||d>52) continue; const p=PED_POOL.find(q=>!q.alive&&q.role==='trader'&&!(q.cool>LIFE.t)); if(!p) return;
    spawnAt(p,pt,sl,'trader',pt.yaw); p.dur=1e9; } }
/* ---------------- the bus: pull in where people are waiting, let them on ---------------- */
function busStopWant(v,dt){ if(v.dwell>0){ v.dwell-=dt; if(v.dwell<3.2&&!v.boarded){ v.boarded=true; crowdBoard(v); } if(v.dwell<=0){ v.served=v.stopAt; v.stopAt=null; v.boarded=false; } return v.dwell>0?0:v.vmax; }
  if(v.served&&Math.hypot(v.served.x-v.x,v.served.z-v.z)>30) v.served=null;
  const fx=Math.sin(v.yaw), fz=Math.cos(v.yaw);
  for(const S of CS.stops){ if(!S.q.length||S===v.served) continue; const rx=S.x-v.x, rz=S.z-v.z, along=rx*fx+rz*fz, side=rx*fz-rz*fx;
    if(along>-1.5&&along<32&&side>1.2&&side<9){ if(along<1.4&&v.v<.6){ v.dwell=6; v.stopAt=S; return 0; } return Math.max(0,(along-.4)*.75); } }
  return v.vmax; }
function crowdBoard(v){ const S=v.stopAt; if(!S) return; const fx=Math.sin(v.yaw), fz=Math.cos(v.yaw), lx=fz, lz=-fx, door=[v.x+fx*(v.len/2-1.6)+lx*(v.wid/2+.2),v.z+fz*(v.len/2-1.6)+lz*(v.wid/2+.2)];
  for(const p of S.q.slice()){ if(Math.random()<.85){ if(p.spot){ p.spot.p=null; p.spot=null; } p.act='board'; p.tx=door[0]; p.tz=door[1]; p.t=0; } }
  S.q.length=0; /* someone gets off */ const o=freePed(ACT_ROLES.stop,TOD.h); if(o&&Math.random()<.7&&alivePeds()<PED_MAX){ const nl=nearestLine(S.x,S.z); if(nl){ show(o,door[0],door[1],v.yaw,'walk'); startWalk(o,nl.L,nl.s,Math.random()<.5?1:-1); o.alight=1.2; } } }
const alivePeds=()=>{ let n=0; for(const p of PED_POOL) if(p.alive) n++; return n; };
/* ---------------- alarm: the hook for later (fights, gunshots, a car through a window) ---------------- */
/* level 1: startled, stop and look. 2: scatter, run away from it. 3: panic: run screaming, anyone very close cowers first */
function crowdAlarm(x,z,radius=20,level=2){ let screams=0;
  for(const p of PED_POOL){ if(!p.alive) continue; const d=Math.hypot(p.x-x,p.z-z); if(d>radius) continue; const lv=d<radius*.4?level:Math.max(1,level-1);
    if(lv<=1){ p.react={k:'startle',t:3+Math.random()*4,x,z}; if(screams<1&&Math.random()<.5){ crowdBark(p,'gasp'); screams++; } continue; }
    if(p.spot){ p.spot.p=null; p.spot=null; } if(p.stop){ const q=p.stop.q, k=q.indexOf(p); if(k>=0) q.splice(k,1); p.stop=null; } p.partner=null;
    if(p.act!=='walk'){ const nl=nearestLine(p.x,p.z); if(nl) startWalk(p,nl.L,nl.s,1); }
    if(p.line) p.dir=(p.line.ax==='x'?p.x-x:p.z-z)>=0?1:-1; p.act='walk';
    p.flee=8+Math.random()*7; p.fleeFrom=[x,z]; p.react=lv>=3&&d<4&&Math.random()<.5?{k:'cower',t:2+Math.random()*3,x,z}:null; p.pause=0;
    if(screams<(lv>=3?3:1)&&Math.random()<.6){ crowdBark(p,lv>=3?'scream':'gasp'); screams++; } } }
function crowdBark(p,kind){ if(typeof auVoice==='function') auVoice(kind,p.x,p.z,p.voice); }
/* ---------------- one person, one frame ---------------- */
function trolleyAt(p,mode){ const n=p.trolley; if(mode==='front'){ n.p=[-.04,0,.5]; n.r=[0,0,0]; } else { n.p=[-.27,0,-.72]; n.r=[.5,0,0]; } p.trolleyMode=mode; }
const wrapPI=a=>Math.atan2(Math.sin(a),Math.cos(a));
function turnTo(p,want,dt,k=5){ p.yaw+=wrapPI(want-p.yaw)*Math.min(1,dt*k); }
function walkStep(p,dt){ const L=p.line; let sp=p.speed*(isRain()?1.12:1); const hw=L.hw;
  if(p.flee>0){ p.flee-=dt; sp=Math.max(sp*2.4,3.1); }
  if(p.pause>0){ p.pause-=dt; sp=0; }
  /* drunks weave; everyone keeps out of your way and out of each other's */
  let laneT=p.lane; if(p.role==='drunk'&&!p.flee){ laneT=Math.sin(LIFE.t*.55+p.ph)*hw*.85; sp*=.75+.35*Math.sin(LIFE.t*1.3+p.ph); if(Math.random()<dt*.05) p.pause=1.5+Math.random()*2; }
  const lat=L.ax==='x'?CW.pz-L.c:CW.px-L.c, along=(L.ax==='x'?CW.px:CW.pz)-p.s, dp=Math.hypot(CW.px-p.x,CW.pz-p.z);
  if(dp<2.2&&Math.abs(along)<2.6){ const away=p.lane-lat||(p.i%2?1:-1); laneT=clamp(lat+Math.sign(away)*Math.min(hw*2,1.05),-hw,hw); if(Math.abs(laneT-lat)<.6) laneT=clamp(lat-Math.sign(away)*1.05,-hw,hw); if(dp<1.1&&along*p.dir>0) sp*=.35; }
  else { for(const o of PED_POOL){ if(o===p||!o.alive) continue; const dx=o.x-p.x, dz=o.z-p.z; if(dx*dx+dz*dz<1.1){ const ol=L.ax==='x'?o.z-L.c:o.x-L.c; laneT=clamp(p.lane+(p.lane>=ol?.5:-.5),-hw,hw); break; } } }
  p.lane+=clamp(laneT-p.lane,-dt*1.8,dt*1.8);
  p.s+=p.dir*sp*dt;
  if(p.goal&&Math.hypot(p.goal[0]-p.x,p.goal[1]-p.z)<7){ p.act='goal'; return sp; }
  if(p.s<L.a||p.s>L.b){ const end=p.s<L.a?L.a:L.b, nl=nextLine(L,end,p.goal||(p.flee>0&&p.fleeFrom?[2*p.x-p.fleeFrom[0],2*p.z-p.fleeFrom[1]]:null));
    if(nl&&Math.random()<.9){ p.line=nl[0]; p.s=nl[1]; const L2=nl[0]; p.dir=p.s-L2.a<1?1:p.s>L2.b-1?-1:p.goal?((L2.ax==='x'?p.goal[0]:p.goal[1])>p.s?1:-1):(Math.random()<.5?1:-1); p.lane=clamp(p.lane,-L2.hw,L2.hw); }
    else { p.dir*=-1; p.s=clamp(p.s,L.a,L.b); } if(Math.random()<.15&&!p.flee) p.pause=1.5+Math.random()*3; }
  const [lx,lz]=lineXZ(p.line,p.s), tx=lx+(p.line.ax==='x'?0:p.lane), tz=lz+(p.line.ax==='x'?p.lane:0), k=Math.min(1,dt*6); p.x+=(tx-p.x)*k; p.z+=(tz-p.z)*k;
  turnTo(p,p.line.ax==='x'?(p.dir>0?Math.PI/2:-Math.PI/2):(p.dir>0?0:Math.PI),dt);
  return sp; }
/* walking past an open shop by day, some stop and look in; a nan rests on her trolley; someone takes a call */
function walkIdeas(p,h){ if(p.flee>0||p.goal||p.pause>0) return;
  const late=!hourW(ROLE_H[p.role]||[],h); /* past their hours: heading home */
  if(late&&p.far>24&&!inView(p.x,p.z,p.far)){ hide(p); return; }
  if(h>9&&h<19&&ACT_ROLES.window.has(p.role)&&Math.random()<.22){ for(const sh of CS.windows){ const dx=p.x-sh.x, dz=p.z-sh.z; if(Math.abs(dx)>4.5||Math.abs(dz)>4.5) continue; const o=dx*sh.ox+dz*sh.oz; if(o<0||o>4) continue; const u=dx*sh.ux+dz*sh.uz; if(Math.abs(u)>sh.w/2-.4) continue;
      p.act='window'; p.tx=sh.x+sh.ox*.7+sh.ux*u; p.tz=sh.z+sh.oz*.7+sh.uz*u; p.tyaw=Math.atan2(-sh.ox,-sh.oz); p.dur=4+Math.random()*6; p.t=0; return; } }
  if(Math.random()<.4&&p.alight<=0){ for(const d of doorsNear(p.x,p.z,2.2)){ const dx=p.x-d.x, dz=p.z-d.z; if(dx*dx+dz*dz>4.8||dx*d.ix+dz*d.iz>0) continue; /* home, or into a shop */
      const want=late&&d.kind==='house'?.9:(d.kind==='house'?(h>18||h<8?.14:.04):.07)*doorOpen(d,h); if(Math.random()<want){ p.act='board'; p.tx=d.x+d.ix*.55; p.tz=d.z+d.iz*.55; p.t=0; return; } } }
  if(p.trolley&&Math.random()<.05){ p.act='rest'; p.dur=5+Math.random()*7; p.t=0; trolleyAt(p,'front'); return; }
  if(p.dog&&Math.random()<.08){ p.pause=2+Math.random()*3; p.sniff=p.pause; return; }
  if(p.hasPhone&&Math.random()<.012){ p.act='call'; p.dur=6+Math.random()*10; p.t=0; } }
function leaveSpot(p){ if(p.spot){ p.spot.p=null; p.spot=null; } if(p.stop){ const q=p.stop.q, k=q.indexOf(p); if(k>=0) q.splice(k,1); p.stop=null; } const nl=nearestLine(p.x,p.z); if(!nl){ hide(p); return; } startWalk(p,nl.L,nl.s,Math.random()<.5?1:-1); if(p.trolley) trolleyAt(p,'pull'); }
function crowdPed(p,dt,h){ const far=Math.hypot(p.x-CW.px,p.z-CW.pz); p.far=far; p.t+=dt;
  if(far>64&&!(p.act==='trader'&&far<75)){ hide(p); return; }
  let moving=0, run=0, aR=p.hold[0], aL=p.hold[1], body=ROLE_BODY[p.role]||'stand', headX=0, gest=null, look=null, legsFree=true;
  const R_=p.react; if(R_){ R_.t-=dt; if(R_.t<=0) p.react=null; }
  /* the chase: people round you stop and stare; one of them films it */
  const watching=CW.chase>0&&far<17&&p.flee<=0&&p.act!=='board'&&p.role!=='drunk'&&!(p.react&&p.react.k==='cower');
  if(p.act==='walk'){
    if(watching||(p.react&&(p.react.k==='startle'||p.react.k==='tut'))){ /* stand and look */ look=p.react&&p.react.k==='startle'?[p.react.x,p.react.z]:[CW.px,CW.pz]; turnTo(p,Math.atan2(look[0]-p.x,look[1]-p.z),dt,watching?2.5:4); }
    else { const sp=walkStep(p,dt); moving=sp>.05; run=p.flee>0||p.role==='jogger'?1:0; if(Math.random()<dt*.6) walkIdeas(p,h); if(p.alight>0) p.alight-=dt; }
    if(p.act==='walk'&&p.flee<=0&&far>46&&Math.random()<dt*.02&&!inView(p.x,p.z,far)) { hide(p); return; } }
  else if(p.act==='goal'){ /* into the station */ const dx=p.goal[0]-p.x, dz=p.goal[1]-p.z, d=Math.hypot(dx,dz); if(d<.8){ hide(p); return; } const sp=p.speed*dt; p.x+=dx/d*sp; p.z+=dz/d*sp; moving=1; turnTo(p,Math.atan2(dx,dz),dt); }
  else if(p.act==='board'){ const dx=p.tx-p.x, dz=p.tz-p.z, d=Math.hypot(dx,dz); if(d<.5||p.t>6){ hide(p); return; } const sp=1.5*dt; p.x+=dx/d*Math.min(d,sp); p.z+=dz/d*Math.min(d,sp); moving=1; turnTo(p,Math.atan2(dx,dz),dt,7); }
  else if(p.act==='emerge'){ const dx=p.tx-p.x, dz=p.tz-p.z, d=Math.hypot(dx,dz); if(d<.15||p.t>8){ const L=p.line, g=p.goal; startWalk(p,L,p.s,p.dir||(Math.random()<.5?1:-1)); p.goal=g; }
    else { const sp=Math.min(d,p.speed*dt); p.x+=dx/d*sp; p.z+=dz/d*sp; moving=1; turnTo(p,Math.atan2(dx,dz),dt,6); } }
  else if(p.act==='window'){ const dx=p.tx-p.x, dz=p.tz-p.z, d=Math.hypot(dx,dz);
    if(p.t<p.dur&&d>.08){ const sp=Math.min(d,p.speed*.8*dt); p.x+=dx/d*sp; p.z+=dz/d*sp; moving=1; turnTo(p,Math.atan2(dx,dz),dt); }
    else if(p.t<p.dur){ turnTo(p,p.tyaw,dt,3); gest='browse'; if(p.trolley&&p.trolleyMode!=='front') trolleyAt(p,'front'); }
    else { p.act='walk'; if(p.trolley) trolleyAt(p,'pull'); } }
  else if(p.act==='rest'){ body='lean'; aR='bar'; aL='bar'; headX=-.05; if(p.t>p.dur){ p.act='walk'; trolleyAt(p,'pull'); } }
  else if(p.act==='call'){ aR='ear'; gest='call'; if(p.t>p.dur) p.act='walk'; }
  else if(p.act==='line'&&p.dbg){ const D=p.dbg; body=D.body||body; aR=D.aR||aR; aL=D.aL||aL; gest=D.gest||null; legsFree=body!=='sit'&&body!=='slump'&&body!=='cower'; if(D.trolley&&p.trolley) trolleyAt(p,D.trolley); if(D.react) p.react={k:D.react,t:99,x:CW.px,z:CW.pz}; }
  else { /* standing or sitting somewhere */
    const sl=p.spot; let arrived=true; if(sl){ const dx=sl.x-p.x, dz=sl.z-p.z, d=Math.hypot(dx,dz); if(d>.04){ const sp=Math.min(d,(d>1?p.speed:.9)*dt); p.x+=dx/d*sp; p.z+=dz/d*sp; if(d>.22){ arrived=false; moving=1; turnTo(p,Math.atan2(dx,dz),dt,6); } } }
    if(!arrived){ p.t=0; if(p.act==='pub'&&p.trolley) trolleyAt(p,'pull'); }
    else if(p.act==='pub'){ gest=p.hold[0]==='low'?'smoke':'chat'; if(gest==='chat'&&p.hold[0]!=='chest') aR='pocket'; look=nearestFriend(p); if(p.home&&!watching) turnTo(p,Math.atan2(p.home.x-p.x,p.home.z-p.z),dt,2); if(p.t>p.dur&&!watching){ leaveSpot(p); } }
    else if(p.act==='chat'){ gest='chat'; if(p.partner&&p.partner.alive) look=[p.partner.x,p.partner.z]; if(p.t>p.dur||!p.partner||!p.partner.alive){ const b=p.partner; p.partner=null; leaveSpot(p); if(b&&b.alive&&b.act==='chat'){ b.partner=null; b.t=b.dur+1; } } }
    else if(p.act==='queue'){ if(aR==='rdown'||aR==='down') aR=p.i%3?'pocket':'fold'; if(aL==='down'||aL==='rdown') aL=aR==='fold'?'fold':'pocket'; gest=p.hold[0]==='text'||p.hold[0]==='chest'?'text':'look'; if(gest==='text'&&p.hold[0]!=='text') aR='text'; if(gest==='text') aL='text'; }
    else if(p.act==='bench'){ body=p.role==='drunk'?'slump':'sit'; legsFree=false; if(aR!=='chest'&&aR!=='text') aR='lap'; if(aL!=='text') aL='lap'; if(p.role==='drunk') { aR='dangle'; aL='dangle'; }
      if(p.trolley&&p.trolleyMode!=='front') trolleyAt(p,'front'); if(p.t>p.dur&&!isRain()) leaveSpot(p); if(isRain()&&p.t>4) leaveSpot(p); }
    else if(p.act==='stop'){ if(aR==='rdown') aR=p.i%2?'pocket':'rdown'; gest=p.hold[0]==='text'?'text':'look'; if(p.t>p.dur) leaveSpot(p); }
    else if(p.act==='deck'){ body='rail'; aR=p.hold[0]==='low'?'low':'bar'; aL='bar'; gest=p.hold[0]==='low'?'smoke':'look'; }
    else if(p.act==='trader'){ aL='raise'; gest='trader'; if(h<7.8||h>15.2){ leaveSpot(p); } }
    if(!arrived){}
    else if(watching&&p.act!=='bench'){ look=[CW.px,CW.pz]; turnTo(p,Math.atan2(CW.px-p.x,CW.pz-p.z),dt,2); }
    else if(p.act==='bench'||p.act==='stop') turnTo(p,p.home.yaw,dt,p.act==='bench'?8:3);
    if(arrived&&p.act==='queue'&&p.home){ turnTo(p,Math.atan2(p.home.door[0]-p.x,p.home.door[1]-p.z),dt,3); }
    if(arrived&&p.act==='chat'&&look) turnTo(p,Math.atan2(look[0]-p.x,look[1]-p.z),dt,3); }
  if(watching){ look=look||[CW.px,CW.pz]; if(CW.filmer===p||(!CW.filmer&&p.hold[0]!=='back'&&p.hasPhone&&Math.random()<dt*.5)){ CW.filmer=p; aR='film'; aL='film'; headX=-.05; gest=null; }
    else if(p.act!=='bench'&&!moving&&p.role==='nan') { aL='fold'; aR=p.trolley?'bar':'fold'; } }
  if(p.react){ const k=p.react.k; if(k==='cower'){ body='cower'; legsFree=false; } if(k==='startle'){ look=[p.react.x,p.react.z]; if(p.react.t>2.2) aR=aL='up'; } if(k==='tut'){ gest='tut'; look=[CW.px,CW.pz]; } }
  /* you: walk into someone and they get out of the way and let you know about it */
  if(far<.8&&CW.pspeed>.5&&p.act!=='bench'&&!(p.react&&p.react.k==='cower')){ const ax=(p.x-CW.px)/(far||1), az=(p.z-CW.pz)/(far||1); p.dodge[0]+=ax*dt*3.2; p.dodge[1]+=az*dt*3.2;
    if(!p.react&&p.barkT<LIFE.t&&CW.barkG<LIFE.t){ p.react={k:'tut',t:1.1}; p.barkT=LIFE.t+7; CW.barkG=LIFE.t+1.2; crowdBark(p,p.role==='lad'||p.role==='builder'||p.role==='nightout'?'oi':p.role==='nan'||p.role==='geezer'?'tut':Math.random()<.5?'tut':'watch'); } }
  else { p.dodge[0]*=1-Math.min(1,dt*.8); p.dodge[1]*=1-Math.min(1,dt*.8); }
  if(watching&&far<2.6&&CW.pspeed>2){ const ax=(p.x-CW.px)/(far||1), az=(p.z-CW.pz)/(far||1); p.dodge[0]+=ax*dt*2.4; p.dodge[1]+=az*dt*2.4; }
  const dl=Math.hypot(p.dodge[0],p.dodge[1]); if(dl>.9){ p.dodge[0]*=.9/dl; p.dodge[1]*=.9/dl; }
  /* barks: a trader's call, a laugh outside the pub, a drunk's song, a dog that doesn't like you */
  if(p.barkT<LIFE.t&&far<22&&CW.barkG<LIFE.t){ let k=null;
    if(p.act==='trader'&&Math.random()<dt*.18) k='call'; else if(p.act==='pub'&&h>18&&Math.random()<dt*.04) k=Math.random()<.7?'laugh':'cough'; else if(p.role==='drunk'&&p.act==='walk'&&Math.random()<dt*.05) k='sing';
    else if(p.dog&&far<5&&Math.random()<dt*.4) k='woof'; else if(watching&&Math.random()<dt*.05) k=Math.random()<.5?'ooh':'mutter';
    if(k){ crowdBark(p,k); p.barkT=LIFE.t+(k==='call'?5:9)+Math.random()*6; CW.barkG=LIFE.t+.8; if(k==='call') p.callT=1.3; } }
  if(p.callT>0) p.callT-=dt;
  /* the body, placed every frame; posed and skinned near you every frame, further off less often */
  const X=p.x+p.dodge[0], Z=p.z+p.dodge[1], Y=p.act==='deck'?p.y:floorAt(X,Z); p.root.p[0]=X; p.root.p[1]=Y; p.root.p[2]=Z; p.root.r[1]=p.yaw;
  if(p.act==='walk'&&isRain()&&p.brolly&&!p.flee) aL='brolly';
  if(p.hood) p.hood.vis=isRain(); if(p.brolly) p.brolly.vis=aL==='brolly';
  if(p.dog) dogTick(p,dt,moving);
  p.animAcc+=dt; const due=far<12?0:far<26?.066:inView(p.x,p.z,far)?.12:.25; if(p.animAcc<due) return; const adt=p.animAcc; p.animAcc=0;
  if(moving&&p.trolley&&p.trolleyMode==='front') trolleyAt(p,'pull');
  pedPose(p,body,aR,aL,headX); const C=p.C, J=C.J, B=p.base;
  for(const n of JOINTS){ const b=B[n], r=J[n].r; r[0]=b[0]; r[1]=b[1]; r[2]=b[2]; } J.hips.p[0]=0; J.hips.p[1]=p.hipY; J.hips.p[2]=0;
  const t=LIFE.t+p.ph; J.spine.r[0]+=Math.sin(t*1.6)*.012; /* breathing */
  if(gest==='smoke'){ const c=(t*.14)%1, up=c<.2?Math.sin(c/.2*Math.PI):0; const lo=ARMP.low, mo=ARMP.mouth; J.armR.r[0]=lo[0][0]+(mo[0][0]-lo[0][0])*up; J.armR.r[2]=-(lo[0][2]+(mo[0][2]-lo[0][2])*up); J.elbowR.r[0]=lo[1]+(mo[1]-lo[1])*up; J.head.r[0]+=-.12*up; }
  else if(gest==='chat'){ const k=Math.max(0,Math.sin(t*.7)); J.armR.r[0]+=Math.sin(t*2.4)*.16*k; J.elbowR.r[0]+=Math.sin(t*3.1)*.22*k-.3*k; J.head.r[0]+=Math.sin(t*2.9)*.05; }
  else if(gest==='text'){ J.head.r[0]+=.32+(Math.sin(t*.3)>.85?-.3:0); J.spine.r[0]+=.04; }
  else if(gest==='call'){ J.head.r[2]+=.12; J.head.r[1]+=Math.sin(t*.4)*.3; }
  else if(gest==='look'){ J.head.r[1]+=Math.sin(t*.23)*.5; }
  else if(gest==='browse'){ J.head.r[0]+=.12; J.head.r[1]+=Math.sin(t*.5)*.35; }
  else if(gest==='tut'){ J.head.r[1]+=Math.sin(t*16)*.22; J.armR.r[0]-=.35; J.elbowR.r[0]-=.6; J.armR.r[2]+=.25; }
  else if(gest==='trader'){ const c=p.callT>0?1:0; if(c){ const cu=ARMP.cup; J.armR.r[0]=cu[0][0]; J.armR.r[2]=-cu[0][2]; J.elbowR.r[0]=cu[1]; J.armL.r[0]-=.3; } J.head.r[1]+=Math.sin(t*.35)*.6; J.armL.r[0]+=Math.sin(t*1.1)*.06; }
  if(p.role==='drunk'){ J.spine.r[2]+=Math.sin(t*1.3)*.1; J.head.r[2]+=Math.sin(t*.9)*.12; J.head.r[0]+=.15; }
  /* the head turns to whatever has their attention, or to you when you're close */
  if(!look&&far<5) look=[CW.px,CW.pz];
  if(look){ const a=wrapPI(Math.atan2(look[0]-p.x,look[1]-p.z)-p.yaw); p.lookW=Math.min(1,p.lookW+adt*3); J.head.r[1]+=clamp(a,-1.1,1.1)*p.lookW; J.neck.r[1]+=clamp(a,-1.4,1.4)*.25*p.lookW; } else p.lookW=Math.max(0,p.lookW-adt*2);
  if(legsFree&&body!=='cower'){ const E=p.E; E.hd=p.yaw; E.pos[0]=X; E.pos[1]=Z; E.walkAmt=moving?1:0; E.runAmt=run; E.hp.armR=p.lockR&&!run?.4:1; E.hp.armL=p.lockL&&!run?.4:1; gait(E,LIFE.t+p.ph,adt); }
  else p.E.G=null;
  skinUpdate(C); }
function nearestFriend(p){ let b=null,bd=3; for(const o of PED_POOL){ if(o===p||!o.alive||o.home!==p.home) continue; const d=Math.hypot(o.x-p.x,o.z-p.z); if(d<bd){ bd=d; b=o; } } return b?[b.x,b.z]:null; }
function dogTick(p,dt,moving){ const D=p.dog; D.ph=(D.ph||0)+dt*(moving?p.speed*7.5:0); const sw=moving?Math.sin(D.ph)*.55:0;
  D.legs[0].r[0]=sw; D.legs[3].r[0]=sw; D.legs[1].r[0]=-sw; D.legs[2].r[0]=-sw;
  const sniff=p.sniff>0; if(sniff) p.sniff-=dt; const wob=Math.sin(LIFE.t*1.7+p.ph)*.08;
  D.n.p=[.62+wob,0,sniff?.95:.55+Math.abs(sw)*.03]; D.n.r=[0,sniff?.6:wob*.8,0]; D.body.r=[sniff?.32:0,0,0]; D.body.p=[0,sniff?-.04:Math.abs(Math.sin(D.ph))*.015,0];
  /* the lead: from the left hand (about) to the collar */ const hx=.27, hy=p.hipY*.86, hz=.32, cx=D.n.p[0]+Math.sin(D.n.r[1])*.3*D.n.s[0], cy=.44*D.n.s[0]-(sniff?.12:0), cz=D.n.p[2]+Math.cos(D.n.r[1])*.3*D.n.s[0];
  const dx=cx-hx, dy=cy-hy, dz=cz-hz, l=Math.hypot(dx,dy,dz); D.lead.p=[hx,hy,hz]; D.lead.r=[Math.atan2(-dy,dz),Math.asin(clamp(dx/l,-1,1)),0]; D.lead.s=[1,1,l]; }
/* ---------------- the tick ---------------- */
let crowdBuilt=0;
function crowdTick(dt,eye){ if(!CS.ready) crowdSpots(); if(!doorsReady) doorsInit();
  const P=GAME.P; if(CW.lastX!==null&&Math.hypot(P.x-CW.lastX,P.z-CW.lastZ)>25){ /* a teleport (start, a ride, a load): fill the new place */ for(const p of PED_POOL) if(p.alive) hide(p); for(const p of PED_POOL) p.cool=0; CW.warm=true; CW.warmT=LIFE.t; CW.nearT=0; CW.nearL=[]; }
  CW.pspeed=CW.lastX===null?0:Math.hypot(P.x-CW.lastX,P.z-CW.lastZ)/Math.max(dt,1e-3); CW.lastX=P.x; CW.lastZ=P.z; CW.px=P.x; CW.pz=P.z;
  if(CW.warm&&LIFE.t-(CW.warmT||0)>6) CW.warm=false;
  /* build a person or two a frame until all are made */
  if(crowdBuilt<CROWD_N){ const t0=performance.now(); do { if(CW.stage<2) crowdPrep(crowdBuilt,CW.stage++); else { PED_POOL.push(makeCrowdPed(crowdBuilt++)); CW.stage=0; } } while(crowdBuilt<CROWD_N&&performance.now()-t0<8);
    if(crowdBuilt===CROWD_N) console.log('[london] crowd: people',CROWD_N,'ms',Math.round(CROWD_LOG.ms),'verts',CROWD_LOG.verts); }
  const h=TOD.h; CW.chase=GAME.G.stars>0?1:Math.max(0,CW.chase-dt*.4); if(CW.chase<=0) CW.filmer=null;
  /* how many, who and doing what */
  const want=Math.round(PED_MAX*crowdDensity(h)*(isRain()?.75:1)); let alive=alivePeds();
  spawnTraders(h);
  CW.spawnT-=dt; let tries=CW.warm?8:1; while(alive<want&&tries-->0&&CW.spawnT<=0){ if(spawnActivity(h)) alive=alivePeds(); if(!CW.warm) CW.spawnT=.35; }
  if(alive>want+2){ /* too many for the hour: someone out of sight goes home */ for(const p of PED_POOL) if(p.alive&&p.far>30&&!inView(p.x,p.z,p.far)&&p.act!=='trader'){ hide(p); break; } }
  /* the chicken-shop queues move up */
  for(const Q of CS.queues){ Q.next-=dt; if(Q.next>0) continue; Q.next=18+Math.random()*20; const head=Q.slots[0].p; if(!head) { for(let k=0;k<Q.slots.length-1;k++){ if(!Q.slots[k].p&&Q.slots[k+1].p){ const m=Q.slots[k+1].p; Q.slots[k+1].p=null; Q.slots[k].p=m; m.spot=Q.slots[k]; } } continue; }
    Q.slots[0].p=null; head.spot=null; head.act='board'; head.tx=Q.door[0]; head.tz=Q.door[1]; head.t=0;
    for(let k=0;k<Q.slots.length-1;k++){ const m=Q.slots[k+1].p; if(m){ Q.slots[k+1].p=null; Q.slots[k].p=m; m.spot=Q.slots[k]; } } }
  for(const p of PED_POOL) if(p.alive) crowdPed(p,dt,h); }
/* for the tools: stats, the alarm, a line-up of everyone for a picture */
window.__crowd={tick:(dt,eye)=>crowdTick(dt,eye),alarm:crowdAlarm,pool:PED_POOL,spots:CS,stats:()=>{ const a={}; for(const p of PED_POOL) if(p.alive){ const k=p.act+':'+p.role; a[k]=(a[k]||0)+1; } return {built:crowdBuilt,alive:alivePeds(),want:Math.round(PED_MAX*crowdDensity(TOD.h)*(isRain()?.75:1)),log:CROWD_LOG,acts:a}; },
  lineup:(x,z,yaw,act,from=0,n=99,dbg=null)=>{ const fx=Math.cos(yaw), fz=-Math.sin(yaw), L=PED_POOL.slice(from,from+n); PED_POOL.forEach(p=>{ if(p.alive) hide(p); p.cool=1e9; }); L.forEach((p,k)=>{ const u=(k-(L.length-1)/2)*1.0; show(p,x+fx*u,z+fz*u,yaw,act||'line'); p.dur=1e9; p.dbg=dbg; }); },
  build:()=>{ while(crowdBuilt<CROWD_N){ PED_POOL.push(makeCrowdPed(crowdBuilt++)); CW.stage=0; } }};
