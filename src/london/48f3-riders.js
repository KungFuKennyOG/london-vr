/* ==========================================================================================================
   THE DELIVERY RIDERS: whoever is on a moped is a real person on the Stairwell rig (never a block person), dressed and
   baked exactly like the crowd (45b-crowd.js: painted face and clothes, one skinned mesh, one atlas, ONE draw), then
   sat on the scooter: bum on the seat, feet on the footboard, hands on the bars, an open-face helmet and the insulated
   food bag on the back. Posed once (they ride, they don't fidget), so skinning costs nothing per frame.
   Runs after 48f-life (the traffic pool) and 48f2-crowd (poses), and puts a rider on every moped in the pool.
   ========================================================================================================== */
const RIDERS=[{skin:'b2',hair:['slick','#141010',14],beard:['stubble','#141010'],top:'courier',tc:'#22262a',legs:'jogs',lc:'#1a1a1c',helmet:'#e8e8e4',bag:'#2aa8a0'},
  {skin:'k2',hair:['buzz','#141010',14],top:'puffer',tc:'#2a3a2a',legs:'jeans',lc:'#1c2230',helmet:'#141416',bag:'#e8862a'},
  {skin:'w2',hair:['buzz','#5a3a22',14],top:'courier',tc:'#1c2a44',legs:'jogs',lc:'#22252a',helmet:'#c8231c',bag:'#2aa8a0'}];
/* an open-face (jet) helmet with a dark peak, on the head joint */
function riderHelmet(J,c){ const m=M(null,{color:hexInt(c)}); crown(J,[[.05,.118,.132],[.13,.126,.142],[.21,.118,.132],[.27,.09,.1],[.31,.05,.056],[.322,0,0]],m,-.012);
  mk(box(.2,.025,.07),M(null,{color:0x101012}),J.head,0,.205,.12,-.25,0,0); }
let riderN=0;
function makeRider(parent){ const k=riderN++, id='rider'+k, S=Object.assign({role:'rider',fem:0,foot:'trainer',body:{hf:1.0}},RIDERS[k%RIDERS.length]), sk_=CSK[S.skin], hs=S.hair, r=rng(4700+k);
  HEADS[id]={seed:2400+k*7,skin:sk_[0],skinD:sk_[1],hair:hs[0],hairC:hs[1],hairFront:hs[2],brow:mix(hs[1],'#000',.2),iris:['#2a1a10','#3a2a1a'][r()*2|0],lip:mix(sk_[1],'#8a3a3a',.4),
    beard:S.beard?S.beard[0]:null,beardC:S.beard?S.beard[1]:null,sideburn:36};
  const o=Object.assign({jacket:S.top==='puffer'?.03:.012,pants:.012},S.body);
  ROSTER[id]={side:'local',name:'Rider',role:'rider',color:'#888',card:'',note:'',o,torso:crowdTorso(id,2500+k*11,S),arm:crowdArm(2600+k*11,S),leg:crowdLeg(2700+k*11,S),foot:tTrainerW,
    extra:(J,oo)=>{ riderHelmet(J,S.helmet); aThermal(J,oo,S.bag); }};
  FACE[id]=FACE[id]||{}; if(!FACE[id].fight) FACE[id].fight=paintHead(HEADS[id],'fight');
  const root=N(parent); root.dyn=true; const C=makeChar(id,root,'cast'); applyPose(C,'idle'); crowdBake(C,id);
  /* the riding pose: seated, thighs a touch above level, shins down and forward to the footboard, leaning into the bars */
  const J=C.J, P={thighL:[-1.42,0,.1],thighR:[-1.42,0,-.1],kneeL:[1.18,0,0],kneeR:[1.18,0,0],ankleL:[.25,0,0],ankleR:[.25,0,0],spine:[.2,0,0],neck:[-.08,0,0],head:[-.12,0,0],
    armL:[-.98,.1,.24],armR:[-.98,-.1,-.24],elbowL:[-.3,0,0],elbowR:[-.3,0,0]};
  for(const n of JOINTS) if(J[n]) J[n].r=P[n]?P[n].slice():[0,0,0];
  J.hips.p=[0,C.poses.sit.hipsY,0]; root.p=[0,RIDER_Y-C.poses.sit.hipsY,-.27]; skinUpdate(C); return root; }
const RIDER_Y=.98; /* where the hips sit above the road on the moped's seat */
for(const v of CAR_POOL) if(v.kind==='moped') v.rider=makeRider(v.root);
