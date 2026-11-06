/* ==========================================================================================================
   SOUND: all made here with WebAudio, nothing downloaded. Rain on the hood, the city's hum, cars that pass you in
   3D (HRTF panning, so in the headset you hear where they are), horns, footsteps on wet paving, a pub's murmur and
   muffled music, the two-tone siren when the Old Bill are on you, and a fox at night. Starts on the first tap.
   ========================================================================================================== */
const AU={ctx:null,on:false,voices:[],pub:null,siren:null,foxT:40};
function noiseBuf(ctx,sec,brown){ const n=ctx.sampleRate*sec, b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0); let last=0; for(let i=0;i<n;i++){ const w=Math.random()*2-1; if(brown){ last=(last+.02*w)/1.02; d[i]=last*3.5; } else d[i]=w; } return b; }
function auLoop(buf,filt,freq,q,gain,dest){ const c=AU.ctx, s=c.createBufferSource(); s.buffer=buf; s.loop=true; const f=c.createBiquadFilter(); f.type=filt; f.frequency.value=freq; f.Q.value=q; const g=c.createGain(); g.gain.value=gain; s.connect(f); f.connect(g); g.connect(dest); s.start(); return {s,f,g}; }
function auPanner(){ const p=AU.ctx.createPanner(); p.panningModel='HRTF'; p.distanceModel='inverse'; p.refDistance=3; p.maxDistance=80; p.rolloffFactor=1.3; p.connect(AU.master); return p; }
function audioStart(){ if(AU.ctx) { if(AU.ctx.state==='suspended') AU.ctx.resume(); return; } try{ const c=new (window.AudioContext||window.webkitAudioContext)(); AU.ctx=c; } catch(e){ return; }
  const c=AU.ctx; AU.master=c.createGain(); AU.master.gain.value=.8; AU.master.connect(c.destination);
  AU.white=noiseBuf(c,2,false); AU.brown=noiseBuf(c,3,true);
  AU.rain=auLoop(AU.white,'bandpass',2600,.5,0,AU.master); AU.rainLo=auLoop(AU.brown,'lowpass',500,.7,0,AU.master);
  AU.hum=auLoop(AU.brown,'lowpass',180,.5,.18,AU.master);
  /* four car voices, given to the nearest cars each frame */
  for(let i=0;i<4;i++){ const p=auPanner(), n=auLoop(AU.brown,'lowpass',300,1,0,p), o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=40; const og=c.createGain(); og.gain.value=0; const of=c.createBiquadFilter(); of.type='lowpass'; of.frequency.value=220; o.connect(of); of.connect(og); og.connect(p); o.start();
    const hornO=c.createOscillator(), hornO2=c.createOscillator(), hg=c.createGain(); hornO.type='square'; hornO2.type='square'; hornO.frequency.value=410; hornO2.frequency.value=520; hg.gain.value=0; hornO.connect(hg); hornO2.connect(hg); hg.connect(p); hornO.start(); hornO2.start();
    AU.voices.push({p,n,o,og,hg,car:null}); }
  /* the pub: murmur and a muffled jukebox, placed at the nearest pub */
  { const p=auPanner(); p.refDistance=2; const m=auLoop(AU.white,'bandpass',600,1.4,0,p); const mus=c.createOscillator(); mus.type='square'; const mf=c.createBiquadFilter(); mf.type='lowpass'; mf.frequency.value=380; const mg=c.createGain(); mg.gain.value=0; mus.connect(mf); mf.connect(mg); mg.connect(p); mus.start(); AU.pub={p,m,mus,mg,beat:0}; }
  /* the siren: hi-lo two-tone */
  { const p=auPanner(); p.refDistance=6; const o=c.createOscillator(); o.type='triangle'; const g=c.createGain(); g.gain.value=0; o.connect(g); g.connect(p); o.start(); AU.siren={p,o,g}; }
  AU.on=true; }
for(const ev of ['pointerdown','keydown','touchstart']) addEventListener(ev,audioStart,{passive:true});
function setPos(p,x,y,z){ const t=AU.ctx.currentTime; if(p.positionX){ p.positionX.setTargetAtTime(x,t,.05); p.positionY.setTargetAtTime(y,t,.05); p.positionZ.setTargetAtTime(z,t,.05); } else p.setPosition(x,y,z); }
let stepAcc=0;
function audioTick(dt,eye,yaw){ if(!AU.on||!AU.ctx) return; const c=AU.ctx, t=c.currentTime, L_=c.listener, fx=Math.sin(yaw), fz=Math.cos(yaw);
  if(L_.positionX){ L_.positionX.value=eye[0]; L_.positionY.value=eye[1]; L_.positionZ.value=eye[2]; L_.forwardX.value=fx; L_.forwardY.value=0; L_.forwardZ.value=fz; L_.upX.value=0; L_.upY.value=1; L_.upZ.value=0; }
  else { L_.setPosition(eye[0],eye[1],eye[2]); L_.setOrientation(fx,0,fz,0,1,0); }
  const wet=RAIN.vis?1:0; AU.rain.g.gain.setTargetAtTime(.07*wet,t,.5); AU.rainLo.g.gain.setTargetAtTime(.1*wet,t,.5); AU.hum.g.gain.setTargetAtTime(.12+.12*TOD.day,t,1);
  /* cars */ const near=CAR_POOL.filter(v=>v.alive).sort((a,b)=>Math.hypot(a.x-eye[0],a.z-eye[2])-Math.hypot(b.x-eye[0],b.z-eye[2])).slice(0,AU.voices.length);
  AU.voices.forEach((V,i)=>{ const v=near[i]; if(!v){ V.n.g.gain.setTargetAtTime(0,t,.2); V.og.gain.setTargetAtTime(0,t,.2); V.hg.gain.setTargetAtTime(0,t,.05); return; }
    setPos(V.p,v.x,.6,v.z); const sp=v.v/10, big=v.kind==='bus'||v.kind==='van'?1.6:v.kind==='moped'?.5:1;
    V.n.g.gain.setTargetAtTime(.25*sp*big+.03,t,.1); V.n.f.frequency.setTargetAtTime(200+sp*500,t,.1);
    V.o.frequency.setTargetAtTime((v.kind==='moped'?90:v.kind==='bus'?32:44)*(.7+sp*.9),t,.1); V.og.gain.setTargetAtTime(.05*big+.04*sp,t,.1);
    V.hg.gain.setTargetAtTime(v.honk>.3?.09:0,t,.02); });
  /* the nearest pub */ let bp=null,bd=1e9; for(const q of PUB_SPOTS){ const d=Math.hypot(q[0]-eye[0],q[1]-eye[2]); if(d<bd){ bd=d; bp=q; } }
  if(bp){ setPos(AU.pub.p,bp[0],1.5,bp[1]); const on=bd<30?1:0, late=TOD.night>.5?1:.6; AU.pub.m.g.gain.setTargetAtTime(.22*on*late,t,.3); AU.pub.beat+=dt;
    const chords=[110,98,131,123], ci=Math.floor(AU.pub.beat/1.6)%4; AU.pub.mus.frequency.setTargetAtTime(chords[ci]*(Math.floor(AU.pub.beat*2.5)%2?1:1.5),t,.02); AU.pub.mg.gain.setTargetAtTime(.05*on*late,t,.3); }
  /* the siren: on the police car when there's a chase, else on the nearest copper */
  const pol=CAR_POOL.find(v=>v.alive&&v.kind==='police'); const chase=GAME.G.stars>0;
  if(chase){ const s=pol&&Math.hypot(pol.x-eye[0],pol.z-eye[2])<120?[pol.x,pol.z]:[eye[0]+40*Math.sin(t*.1),eye[2]+40*Math.cos(t*.1)]; setPos(AU.siren.p,s[0],1.5,s[1]); AU.siren.o.frequency.setValueAtTime(Math.floor(t/.62)%2?960:770,t); AU.siren.g.gain.setTargetAtTime(.16,t,.2); }
  else AU.siren.g.gain.setTargetAtTime(0,t,.4);
  /* footsteps: a soft scuff each stride, wetter at night */
  const P_=GAME.P; if(GAME.G.on&&P_.ground!==false){ const moving=Math.hypot(P_.vx||0,P_.vz||0)>.5||GAME.isMoving&&GAME.isMoving(); stepAcc+=dt*(P_.running?2.6:1.8)*(moving?1:0); if(stepAcc>1){ stepAcc=0; auBurst(P_.running?.12:.07,wet?1800:900,wet?.06:.03); } }
  /* a fox screams, now and then, at night */ AU.foxT-=dt; if(AU.foxT<0){ AU.foxT=90+Math.random()*120; if(TOD.night>.6) foxScream(eye); }
}
function auBurst(g0,freq,len){ const c=AU.ctx,t=c.currentTime,s=c.createBufferSource(); s.buffer=AU.white; const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=.8; const g=c.createGain(); g.gain.setValueAtTime(g0,t); g.gain.exponentialRampToValueAtTime(.001,t+len); s.connect(f); f.connect(g); g.connect(AU.master); s.start(t,Math.random()); s.stop(t+len+.02); }
function foxScream(eye){ const c=AU.ctx,t=c.currentTime,p=auPanner(),a=Math.random()*6.28; setPos(p,eye[0]+Math.cos(a)*35,1,eye[2]+Math.sin(a)*35);
  for(let k=0;k<3;k++){ const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter(); o.type='sawtooth'; f.type='bandpass'; f.frequency.value=1400; f.Q.value=2; const t0=t+k*.55; o.frequency.setValueAtTime(900,t0); o.frequency.linearRampToValueAtTime(1500,t0+.12); o.frequency.linearRampToValueAtTime(700,t0+.4);
    g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(.25,t0+.05); g.gain.linearRampToValueAtTime(0,t0+.42); o.connect(f); f.connect(g); g.connect(p); o.start(t0); o.stop(t0+.45); } }
