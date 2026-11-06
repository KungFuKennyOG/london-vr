/* =====================================================================
   WALKING: planted feet and a real gait cycle (replaces the old sine-wave legs)
   Feet live in the world. A planted foot stays exactly where it landed, so nothing skates. A swinging foot flies from
   where it lifted to where it will land, predicted from how fast he's moving, so it lands ahead of the hip and passes
   under it at midstance. The legs are solved onto the feet with two-bone IK (knees forward), heel strikes and the heel
   peels up before toe-off, the pelvis bobs, sways over the standing foot and turns with the stride, the shoulders
   counter-turn and free arms swing against the legs. A gun stays steady: the chest cancels the pelvis turn.
   Standing still, a foot only steps when it ends up too far from where the pose wants it (turning on the spot,
   being shoved by a hit), so a man pivots and shuffles instead of sliding round on his heels.
   ===================================================================== */
const GAIT={walkD:.62,runD:.36,settleErr:.13,settleDur:.3};
const fract=x=>x-Math.floor(x);
const smooth01=x=>{ x=clamp(x,0,1); return x*x*(3-2*x); };
const wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a));

/* two-bone leg IK in pose space. T: where the ankle joint goes; fwd: the foot's forward (horizontal unit); pitch > 0 = toes down */
const locM=n=>{ const l=m4.make(); m4.compose(l,n.p,n.r,n.s); return l; };
const mulM=(A,B)=>{ const o=m4.make(); m4.mul(o,A,B); return o; };
function ikLeg(J,H,s,T,fwd,pitch){
  const th=J['thigh'+s],kn=J['knee'+s],an=J['ankle'+s],side=s==='L'?1:-1;
  const S=mulP(H,th.p);
  const U=Math.hypot(...kn.p),Lo=Math.hypot(...an.p);
  const D=v3.sub(T,S),d=Math.hypot(...D),dc=Math.min(U+Lo-.003,Math.max(Math.abs(U-Lo)+.01,d)),a=v3.sc(D,1/(d||1));
  const ca=clamp((U*U+dc*dc-Lo*Lo)/(2*U*dc),-1,1),sa=Math.sqrt(Math.max(0,1-ca*ca));
  const pole=norm3([fwd[0]+side*.12,0,fwd[2]]),b=norm3(v3.sub(pole,v3.sc(a,v3.dot(a,pole)))); /* knees forward, a touch out */
  const K=v3.add(S,v3.add(v3.sc(a,U*ca),v3.sc(b,U*sa)));
  const Uw=norm3(v3.sub(S,K)),Zw=norm3(v3.sub(b,v3.sc(Uw,v3.dot(b,Uw)))),Xw=v3.cross(Uw,Zw);
  const u=norm3(v3.sc(kn.p,-1)),zl=norm3(v3.sub([0,0,1],v3.sc(u,u[2]))),xl=v3.cross(u,zl);
  const Rw=fromCols(Xw,Uw,Zw,[0,0,0]),Rl=fromCols(xl,u,zl,[0,0,0]),R=m4.make(); m4.mul(R,Rw,rigidInv(Rl)); R[12]=S[0]; R[13]=S[1]; R[14]=S[2];
  setLocal(th,H,R);
  const cg=clamp((U*U+Lo*Lo-dc*dc)/(2*U*Lo),-1,1); kn.r=[Math.PI-Math.acos(cg),0,0]; /* the knee only folds back */
  an.r=[0,0,0]; const Kw=mulM(R,locM(kn)),Ap=mulP(Kw,an.p);
  /* the foot: flat on the floor along fwd, then pitched */
  const cp=Math.cos(pitch),sp=Math.sin(pitch),Zf=norm3([fwd[0]*cp,-sp,fwd[2]*cp]),Yf=norm3([fwd[0]*sp,cp,fwd[2]*sp]),Xf=v3.cross(Yf,Zf);
  setLocal(an,Kw,fromCols(Xf,Yf,Zf,Ap));
}

/* stance: heel strike, foot flat, heel peels up to toe-off. q = 0..1 through the stance */
function stancePitch(q,rn){ const hs=lerp(-.24,-.04,rn),to=lerp(.5,.62,rn),qr=lerp(.55,.42,rn);
  return q<.16?lerp(hs,0,smooth01(q/.16)):q<qr?0:to*smooth01((q-qr)/(1-qr)); }
/* swing: toes still pointing down as it leaves, level by mid swing, toes up ready for the heel to land */
function swingPitch(s,rn,from){ const land=lerp(-.22,-.04,rn); return s<.45?lerp(from,0,smooth01(s/.45)):lerp(0,land,smooth01((s-.45)/.5)); }

function gait(E,t,dt){
  const J=E.J,o=E.o,Ry=ryM(E.hd);
  /* where the pose itself puts the feet (pose space), and which way they point */
  const H0=locM(J.hips),rest={},restYaw={};
  for(const s of ['L','R']){ const A=mulM(mulM(mulM(H0,locM(J['thigh'+s])),locM(J['knee'+s])),locM(J['ankle'+s])); rest[s]=colOf(A,3); const z=colOf(A,2); restYaw[s]=Math.atan2(z[0],z[2]); }
  const toW=(px,pz)=>{ const q=mv(Ry,[px,0,pz]); return [E.pos[0]+q[0],E.pos[1]+q[2]]; };
  let G=E.G;
  const fresh=!G||Math.hypot(E.pos[0]-G.last[0],E.pos[1]-G.last[1])>.6; /* new, or teleported (reset, a new floor) */
  if(fresh){ G=E.G={u:0,v:[0,0],amt:0,last:E.pos.slice(),was:false,f:{}};
    for(const s of ['L','R']) G.f[s]={w:toW(rest[s][0],rest[s][2]),yaw:E.hd+restYaw[s],sw:null,pitch:0}; }
  if(dt>0&&dt<.5){ const k=Math.min(1,dt*10); G.v[0]=lerp(G.v[0],(E.pos[0]-G.last[0])/dt,k); G.v[1]=lerp(G.v[1],(E.pos[1]-G.last[1])/dt,k); }
  G.last=E.pos.slice();
  const sp=Math.hypot(G.v[0],G.v[1]),moving=sp>.2&&E.walkAmt>.25,rn=E.runAmt||0;
  G.amt=lerp(G.amt,moving?1:0,Math.min(1,dt*(moving?5:3.5)));
  const a=G.amt,D=lerp(GAIT.walkD,GAIT.runD,rn),f=.7+.23*Math.max(sp,.55); /* cycles a second: ~0.9 strolling, ~1.4 running */
  const liftU={L:D,R:fract(.5+D)},contactU={L:0,R:.5};
  const stepYaw=s=>E.hd+lerp(restYaw[s],s==='L'?.09:-.09,a); /* walking, the toes turn slightly out */
  const lift=(s,dur,settle)=>{ const F=G.f[s]; F.sw={from:F.w.slice(),y0:F.yaw,t:0,dur,settle,p0:F.pitch}; };
  /* the cycle */
  if(moving){
    if(!G.was){ /* setting off: the foot further behind goes first */
      const dx=G.v[0]/sp,dz=G.v[1]/sp,back=s=>(G.f[s].w[0]-E.pos[0])*dx+(G.f[s].w[1]-E.pos[1])*dz;
      G.u=back('L')<=back('R')?liftU.L-.001:liftU.R-.001; }
    const u0=G.u,u1=u0+f*dt; G.u=fract(u1);
    for(const s of ['L','R']){ const L=liftU[s]; const crossed=L>u0?u1>=L:u1>=L+1;
      if(crossed&&!G.f[s].sw) lift(s,(1-D)/f,false); } }
  G.was=moving;
  /* standing: step a foot back under him if it has ended up out of place */
  if(!moving&&!G.f.L.sw&&!G.f.R.sw){ let worst=null,we=GAIT.settleErr;
    for(const s of ['L','R']){ const F=G.f[s],r=toW(rest[s][0],rest[s][2]),e=Math.hypot(F.w[0]-r[0],F.w[1]-r[1])+.22*Math.abs(wrapA(F.yaw-stepYaw(s))); if(e>we){ we=e; worst=s; } }
    if(worst) lift(worst,GAIT.settleDur,true); }
  if(!moving&&a<.02&&!G.f.L.sw&&!G.f.R.sw){ let ok=true;
    for(const s of ['L','R']){ const F=G.f[s],r=toW(rest[s][0],rest[s][2]); if(Math.hypot(F.w[0]-r[0],F.w[1]-r[1])>.03||Math.abs(wrapA(F.yaw-E.hd-restYaw[s]))>.08) ok=false; }
    if(ok){ for(const s of ['L','R']) G.f[s].pitch=0; return; } } /* feet where the pose has them: nothing to solve */
  /* layer the pelvis and trunk first: the hips move, then the legs are solved to reach the feet from wherever the hips went */
  const u=G.u,TAU=Math.PI*2;
  const bobA=lerp(.016,-.022,rn),bob=bobA*Math.cos(2*TAU*(u-D/2));
  let limp=0; for(const s of ['L','R']){ const h=E.hp['leg'+s]; if(h<.9) limp+=(1-h)*.07*Math.max(0,Math.cos(TAU*(u-contactU[s]-D/2))); } /* sags onto the bad leg */
  J.hips.p[1]+=(bob-(.022+.028*rn)-limp)*a;
  J.hips.p[0]+=lerp(.026,.01,rn)*Math.cos(TAU*(u-D/2))*a; /* over the standing foot */
  const yaw=-lerp(.08,.11,rn)*Math.cos(TAU*u)*a,roll=lerp(.035,.02,rn)*Math.cos(TAU*(u-D/2))*a; /* the swinging leg's hip comes forward and drops */
  J.hips.r[1]+=yaw; J.hips.r[2]+=roll;
  const gun=E.wpnHeld&&RANGED[E.kind];
  J.spine.r[0]+=(.04+.2*rn)*a; /* leans into it */
  J.spine.r[1]-=yaw*(gun?1:1.9); J.spine.r[2]-=roll*(gun?1:1.2); /* shoulders counter-turn; with a gun the chest stays square on */
  /* free arms swing against the legs */
  for(const s of ['L','R']){ if(E.wpnHeld&&(E.wpnHand===s||RANGED[E.kind])||E.hp['arm'+s]<.45) continue;
    const sg=s==='L'?1:-1,c=Math.cos(TAU*u)*sg,A=J['arm'+s],El=J['elbow'+s],amp=lerp(.26,.62,rn)*a;
    A.r[0]+=c*amp-.12*rn*a; A.r[2]=lerp(A.r[2],sg*.14,a*.6);
    El.r[0]=lerp(El.r[0],lerp(-.25,-1.45,rn),a)-.25*Math.max(0,-c)*a; }
  /* feet */
  const H=locM(J.hips);
  const bz=o.shoeL*.5,hz=o.shoeL*.12,fh=o.foot;
  for(const s of ['L','R']){ const F=G.f[s];
    let wx,wz,y=fh,pitch,fyw;
    if(F.sw){ const W=F.sw; W.t+=dt; const k=Math.min(1,W.t/W.dur);
      let tg,ty;
      if(W.settle){ tg=toW(rest[s][0],rest[s][2]); ty=E.hd+restYaw[s]; }
      else { const ahead=(1-k)*W.dur+D/f*.5,rx=rest[s][0]*.9,rz=rest[s][2]*(1-.75*a); const r0=toW(rx,rz); tg=[r0[0]+G.v[0]*ahead,r0[1]+G.v[1]*ahead]; ty=stepYaw(s); }
      const e=smooth01(k),hk=Math.pow(k,lerp(1,.7,rn));
      wx=lerp(W.from[0],tg[0],e); wz=lerp(W.from[1],tg[1],e);
      y+=(W.settle?.05:lerp(.075,.2,rn))*Math.sin(Math.PI*hk); /* running: the heel kicks up early */
      fyw=W.y0+wrapA(ty-W.y0)*e;
      pitch=W.settle?.18*Math.sin(Math.PI*k):swingPitch(k,rn,W.p0);
      if(k>=1){ F.w=tg; F.yaw=ty; F.sw=null; F.pitch=pitch;
        if(!W.settle||E.aware){ const dP=Math.hypot(PL.x-tg[0],PL.z-tg[1]); if(dP<14) sfx(typeof tunWet==='function'&&tunWet(tg[0],tg[1])?'step_mud':'step_hard',(W.settle?.05:.1+.18*rn)*(1-dP/14),[tg[0],0,tg[1]]); } } }
    else { wx=F.w[0]; wz=F.w[1]; fyw=F.yaw;
      const q=fract(u-contactU[s])/D; pitch=moving&&q<=1?stancePitch(q,rn)*a:0; F.pitch=pitch; }
    /* into pose space; the foot rolls over its heel or the ball of the foot, so that point stays on the floor */
    const pl=mtv(Ry,[wx-E.pos[0],0,wz-E.pos[1]]),fy=fyw-E.hd,fwd=[Math.sin(fy),0,Math.cos(fy)];
    const cp=Math.cos(pitch),spp=Math.sin(pitch),Yf=[fwd[0]*spp,cp,fwd[2]*spp],Zf=[fwd[0]*cp,-spp,fwd[2]*cp],pz=pitch>0?bz:-hz;
    const T=[pl[0]+fwd[0]*pz+Yf[0]*fh-Zf[0]*pz, y-fh+Yf[1]*fh-Zf[1]*pz, pl[2]+fwd[2]*pz+Yf[2]*fh-Zf[2]*pz];
    ikLeg(J,H,s,T,fwd,pitch); }
}
