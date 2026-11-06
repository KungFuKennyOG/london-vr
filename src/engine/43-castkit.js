/* =====================================================================================================
   CAST KIT: the generic pieces every art set builds characters with: women's and kids' body shapes on the rig,
   faces painted on demand, hair, hats, skirts, poses (including civilians' hands up and cowering), makeChar().
   Each page supplies its own HEADS entries, painted outfits and ROSTER.
   ===================================================================================================== */
/* ---------- body shapes: the rig's torso rings are a man's. A woman's and a child's are reshaped here before rigging. ---------- */
const SHAPES={
  fem:{rx:{0.86:1.05,0.93:1.12,1:1.06,1.08:.86,1.18:.9,1.28:.97,1.38:.86,1.45:.84},rz:{0.93:1.06,1.18:1.02,1.28:1.16,1.38:1.04},cz:{0.93:-.012,1.28:.022,1.38:.01}},
  kid:{rx:{1.08:1.04,1.18:1.02,1.28:.94,1.38:.9,1.45:.9},rz:{1:1.06,1.08:1.1,1.18:1.04},cz:{1.08:.01}},
  teen:{rx:{0.93:1.06,1.08:.9,1.28:.95,1.38:.88,1.45:.86},rz:{1.28:1.06},cz:{1.28:.01}}
};
function shapedRig(o,parent,shape){ const S=SHAPES[shape]; if(!S) return rig(o,parent); const keep=TORSO.map(r=>r.slice());
  for(const r of TORSO){ const y=String(r[0]); if(S.rx[y]) r[1]*=S.rx[y]; if(S.rz[y]) r[2]*=S.rz[y]; if(S.cz[y]) r[3]+=S.cz[y]; }
  try{ return rig(o,parent); } finally { keep.forEach((r,i)=>{ for(let k=0;k<4;k++) TORSO[i][k]=r[k]; }); } }

const FACE_EX=['fight','hurt','beg','sleep','agony','shock','choke'];
function lazyFaces(C,k,kid){ for(const ex of FACE_EX){ let m=null; const paint=kid&&ex!=='fight'&&ex!=='sleep'?'shock':ex;
    Object.defineProperty(C.faceM,ex,{configurable:true,enumerable:true,get(){ if(!m){ FACE[k]=FACE[k]||{}; FACE[k][paint]=FACE[k][paint]||paintHead(HEADS[k],paint); m=M(FACE[k][paint]); } return m; }}); } }

/* ---------- props ---------- */
const mGold=M(null,{color:0xd4ad5a}), mChrome=M(null,{color:0xc8ccd0});
function pClub(g){ mk(cyl(.012,.012,.9,6,{at:[0,0,0]}),M(null,{color:0x9aa0a6,double:true}),g,0,0,.38,Math.PI/2); mk(box(.03,.03,.14),M(null,{color:0x1a1a1c}),g,0,0,0);
  mk(box(.03,.06,.1),M(null,{color:0x2a2a2e}),g,0,-.03,.84); return g; }
function pPhone(g){ mk(box(.04,.08,.01),M(null,{color:0x111114}),g,0,-.04,.02); mk(plane(.034,.068),M(null,{color:0x7fa8d8,unlit:true}),g,0,-.04,.026); return g; }
function pTeddy(g){ const fur=M(null,{color:0x8a6040}); mk(box(.09,.11,.07),fur,g,0,-.08,.04); mk(box(.08,.07,.07),fur,g,0,.0,.04); for(const s of [-1,1]) mk(box(.03,.03,.02),fur,g,s*.035,.04,.04); return g; }

/* ---------- small painted helpers ---------- */
const vNeck=(x,y,w0,drop)=>y<T3.neck+drop&&Math.abs(x-64)<w0*(1-(y-T3.neck)/drop);
const crewNeck=(x,y,w0,d)=>y<T3.neck+d&&Math.abs(x-64)<w0*Math.sqrt(Math.max(0,1-((y-T3.neck)/d)**2));
const buttons=(I,xs,y0,y1,step,col)=>{ for(const x of xs) for(let y=y0;y<y1;y+=step){ softEll(I,x,y,1.8,1.8,col,1,.4); softEll(I,x-.5,y-.5,.7,.7,'#ffffff',.4,.4); } };
const sk=k=>[HEADS[k].skin,'skin',0];
const stripes=(c1,c2,p)=>(y)=>((y/p|0)%2)?c1:c2;
const plaid=(x,y,a,b,c)=>{ const u=(x>>3)%2,v=(y>>3)%2; return u&&v?c:u||v?b:a; };
function stain(I,x,y,r,col,seed){ blob(I,x,y,r,r*.8,.45,col); const q=rng(seed); for(let i=0;i<3;i++) blob(I,x+(q()-.5)*r*2,y+(q()-.5)*r*2,r*.4,r*.35,.3,col); }

function chainI(I,col){ for(let x=48;x<=80;x+=2){ const y=T3.neck+14-Math.pow((x-64)/16,2)*-6; softEll(I,x,y,1.1,1,col,1,.4); } }
/* ---------- extras on the rig ---------- */
const mHair=c=>M(null,{color:hexInt(c)});
function crown(J,rings,m,cz=-.008){ return mk(lathe(rings.map(([y,rx,rz])=>[y,rx,rz,cz]),10),m,J.head); }
/* long hair: a shell over the back of the head that falls to the shoulders */
function hairBack(J,col,len=.2,hs=1){ const m=M(null,{color:hexInt(col),double:true}),H=.13+len;
  mk(box(.168*hs,H*hs,.05*hs,{tw:1.04,td:1.3,at:[0,-H*hs/2,0]}),m,J.head,0,.215*hs,-.085*hs,-.08,0,0);
  for(const s of [-1,1]) mk(box(.024*hs,(.13+len*.6)*hs,.07*hs,{at:[0,-(.13+len*.6)*hs/2,0]}),m,J.head,s*.074*hs,.2*hs,-.02*hs,-.05,0,s*.04); }
function ponytail(J,col,hs=1){ mk(lathe([[-.2,.006,.006],[-.16,.018,.016],[-.06,.026,.024],[0,.016,.016]],6),M(null,{color:hexInt(col),double:true}),J.head,0,.17*hs,-.1*hs,.5); }
function bun(J,col,hs=1){ mk(lathe([[0,.012,.012],[.03,.045,.045],[.06,.046,.046],[.09,.012,.012]],8),M(null,{color:hexInt(col)}),J.head,0,.16*hs,-.085*hs,-1.2); }
function cap(J,col,brim,hs=1){ const m=M(null,{color:hexInt(col)}); crown(J,[[.17*hs,.086*hs,.106*hs],[.23*hs,.088*hs,.106*hs],[.26*hs,.06*hs,.08*hs],[.27*hs,0,0]],m); mk(box(.14,.012,.09),M(null,{color:hexInt(brim||col)}),J.head,0,.185*hs,.13*hs,.12); }
function skirt(J,o,t,len,flare=1.25,top=.0){ /* a cone from the hips; it rides on the hips joint */
  const h=o.thigh+o.shin, y0=-.04+top, y1=y0-len*h, T=torsoAt(o,.93*o.hf);
  mk(lathe([[y1,T[1]*flare+.02,T[2]*flare+.03,0],[y0,T[1]+.008,T[2]+.008,T[3]]],10,{capB:false,capT:false}),M(t,{double:true}),J.hips); }
function earpiece(J){ mk(box(.01,.02,.012),mBlack,J.head,.078,.1,0); mk(box(.004,.08,.004),M(null,{color:0xd8d4cc}),J.head,.08,.04,-.01,0,0,.2); }
function readingGlasses(J){ for(const s of [-1,1]) mk(box(.05,.03,.006),M(null,{color:0x9ab0c0,emissive:0x1a2a3a}),J.head,s*.032,.124,.094); }
/* ---------- poses ---------- */
const ONE_HAND={armR:[-2.0,0,.25],elbowR:[-1.1,0,0],armL:[-.7,0,-.35],elbowL:[-.9,0,0],spine:[.15,-.25,0],head:[0,.25,0],thighL:[-.25,0,.06],kneeL:[.3,0,0],thighR:[.15,0,-.05],kneeR:[.1,0,0]};
const AIM_ONE={spine:[.1,0,0],neck:[-.06,0,0],armR:[-1.42,0,.05],elbowR:[-.05,0,0],armL:[.05,0,.12],elbowL:[-.25,0,0],head:[-.02,0,0],thighL:[-.12,0,.05],thighR:[.06,0,-.04]};
const CLUB={armR:[-2.4,0,.4],elbowR:[-1.3,0,0],armL:[-1.6,0,-.2],elbowL:[-1.2,0,0],spine:[.05,-.3,0],head:[.05,.3,0],thighL:[-.25,0,.06],kneeL:[.3,0,0],thighR:[.15,0,-.05],kneeR:[.1,0,0]};
const PISTOL={prop:pPistol,support:true,gripHand:true,wFight:{p:[.036,-.139,.035],r:[Math.PI/2,0,0]}};
const REVOLVER={prop:pRevolver,gripHand:true,wFight:{p:[.036,-.089,.035],r:[Math.PI/2,0,0]},fight:AIM_ONE};
const TWO=(p,gun)=>({prop:p,twoHand:true,gripHand:true,gun,wFight:{p:[0,0,0],r:[0,0,0]},fight:TWO_HAND_ARMS,two:true});
/* civilians: hands up, cowering, and (kids) curled up hiding. Begging and hurt come from the rig's standard set. */
function civPoses(C){ const o=C.o,P=C.poses,hy=o.thigh+o.shin+o.foot+.05;
  P.handsup={hipsY:hy-.02,wpn:'drop',j:{armL:[-2.55,0,.42],elbowL:[-.85,0,0],armR:[-2.55,0,-.42],elbowR:[-.85,0,0],spine:[-.06,0,0],head:[.08,0,0],thighL:[-.05,0,.04],thighR:[.04,0,-.04]}};
  P.cower={hipsY:o.thigh*.42+o.legW*.4,wpn:'drop',j:{thighL:[-1.75,0,.18],thighR:[-1.75,0,-.18],kneeL:[2.3,0,0],kneeR:[2.3,0,0],ankleL:[-.5,0,0],ankleR:[-.5,0,0],spine:[.75,0,0],neck:[.3,0,0],head:[.35,0,0],
    armL:[-1.75,.5,.55],elbowL:[-2.5,0,0],armR:[-1.75,-.5,-.55],elbowR:[-2.5,0,0]}};
  P.watch={hipsY:hy,wpn:'hang',j:{armL:[-.2,0,.12],elbowL:[-.9,0,0],armR:[-.1,0,-.1],elbowR:[-1.3,0,0],spine:[.04,0,0],head:[.12,.2,0]}};
  P.phone={hipsY:hy,wpn:'hang',j:{armR:[-.6,0,.3],elbowR:[-2.3,0,0],armL:[-.3,0,.3],elbowL:[-1.4,0,0],head:[.06,-.15,.12],thighL:[-.04,0,.04]}};
  P.lean={hipsY:hy,wpn:'hang',j:{armL:[-.9,0,.2],elbowL:[-.7,0,0],armR:[-.9,0,-.2],elbowR:[-.7,0,0],spine:[.32,0,0],head:[-.1,0,0],thighL:[-.1,0,.04],thighR:[.1,0,-.04]}}; }

const FEM={hf:.95,w:.92,depth:.92,lg:.9,ag:.84,belly:.95,shoeW:.085,shape:'fem'};
const KID=(hf,hs)=>({hf,w:.78*hf/.72*.94,depth:.86,lg:.74*hf/.72,ag:.72*hf/.72,belly:1.04,headS:hs,shoeW:.07+.02*(hf-.72)/.2,jacket:.006,pants:.008,shape:'kid'});
/* over: per-use changes (a different prop, say). R_.as makes a restyled character play as one of the tower kinds in the game */
function makeChar(id,parent,grp,over){
  const R_=over?Object.assign({},ROSTER[id],over):ROSTER[id]; if(R_.maker){ const C=R_.maker(parent,grp); C.id=id; civPoses(C); return C; }
  const o=Object.assign(baseMatsLazy(id),R_.o,{torsoM:M(R_.torso),armM:M(R_.arm),legM:M(R_.leg),footM:M(R_.foot)});
  if(R_.hand) o.handM=M(R_.hand);
  const J=shapedRig(o,parent,o.shape); if(R_.extra) R_.extra(J,o);
  const kid=R_.side==='kid';
  const s={kind:R_.as||id,faces:{},grp,fight:R_.fight||{},showDrop:false,gripHand:R_.gripHand};
  if(R_.prop){ Object.assign(s,{prop:R_.prop,wFight:R_.wFight||{p:[0,-.06,.02],r:[1.3,0,0]},twoHand:R_.twoHand,gun:R_.gun,support:R_.support}); if(R_.two) s.fightHipsY=J.hips.p[1]-.055; }
  const Cc=finish(parent,J,o,s); Cc.id=id; Cc.kid=kid; Cc.faceM={}; lazyFaces(Cc,id,kid);
  civPoses(Cc); if(kid){ Cc.poses.hurt=Cc.poses.cower; Cc.poses.beg=Cc.poses.cower; }
  applyPose(Cc,R_.side==='civ'||kid?'idle':'fight');
  return Cc; }
/* baseMats paints every face up front; this one only paints the neutral face */
function baseMatsLazy(k){ const s=HEADS[k],sk_=skinOf(k); FACE[k]=FACE[k]||{}; FACE[k].fight=FACE[k].fight||paintHead(s,'fight');
  return {headM:M(FACE[k].fight),noseM:M(null,{color:hexInt(mix(s.skin,s.skinD,.18))}),earM:M(null,{color:hexInt(mix(s.skin,s.skinD,.35))}),handM:M(sk_.hand)}; }

