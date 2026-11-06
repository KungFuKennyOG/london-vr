/* ==========================================================================================================
   THE CLOCK: a day in Bethnal Green is 24 real minutes (an hour a minute), starting at half ten at night.
   Keyframed: ambient, sun (moon at night), fog, sky, how hard the lamps and lit windows glow, how many people and
   cars are about, whether it's raining. Hold T (desktop) to wind the clock on.
   ========================================================================================================== */
const TOD={h:22.5, rate:1/60, fast:false, day:0, night:1};
/* [hour, ambient, sun colour, fog colour, fog far, sky, life density] */
const TODK=[
  [0,  [.27,.29,.29],[.10,.11,.14],[.05,.058,.055],95,'night',.5],
  [4.5,[.26,.28,.29],[.10,.11,.14],[.048,.054,.058],95,'night',.3],
  [5.6,[.34,.32,.34],[.55,.38,.32],[.22,.2,.22],105,'dawn',.30],
  [7,  [.47,.47,.5],[1.0,.82,.62],[.52,.53,.55],130,'day',.8],
  [12, [.52,.53,.55],[1.05,1.0,.9],[.6,.62,.63],140,'day',.95],
  [17, [.5,.5,.52],[1.05,.86,.66],[.55,.55,.56],135,'day',1.0],
  [19, [.4,.36,.37],[.85,.5,.34],[.22,.18,.19],115,'dusk',.85],
  [20.3,[.29,.3,.3],[.18,.16,.18],[.075,.072,.075],100,'night',.8],
  [24, [.27,.29,.29],[.10,.11,.14],[.05,.058,.055],95,'night',.6]];
const todL3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
/* skies: night (the old sodium-lit cloud), dawn, day, dusk */
const SKYT={night:tSky,
  dawn:P2(4,64,(g,w,h)=>vfill(g,0,0,w,h,[[0,'#2a3048'],[.55,'#7a6a7a'],[.85,'#d8987a'],[1,'#f0c090']]),0,1),
  day:P2(4,128,(g,w,h)=>vfill(g,0,0,w,h,[[0,'#8e969e'],[.35,'#a8aeb4'],[.75,'#c4c8ca'],[1,'#ccd0d0']]),0,1),
  dusk:P2(4,64,(g,w,h)=>vfill(g,0,0,w,h,[[0,'#1a1a30'],[.5,'#5a3a4a'],[.8,'#c86a40'],[1,'#e8a060']]),0,1)};
let skylineM=null;
function todTick(dt){ TOD.h=(TOD.h+dt*TOD.rate*(TOD.fast?40:1))%24; const h=TOD.h;
  let i=0; while(i<TODK.length-2&&TODK[i+1][0]<=h) i++; const A=TODK[i],B=TODK[i+1],k=clamp((h-A[0])/(B[0]-A[0]),0,1), e=k*k*(3-2*k);
  const amb=todL3(A[1],B[1],e), sun=todL3(A[2],B[2],e), fog=todL3(A[3],B[3],e), far=A[4]+(B[4]-A[4])*e;
  /* daylight 0..1, from the ambient */ TOD.day=clamp((amb[0]-.27)/.22,0,1); TOD.night=1-TOD.day; LOOK.day=TOD.day;
  const sa=(h-6)/12*Math.PI; STREET_LIGHT.amb=amb; STREET_LIGHT.dirCol=sun; STREET_LIGHT.dir=[Math.cos(sa)*.85,.5+.35*Math.max(0,Math.sin(sa)),.55]; STREET_LIGHT.fog=fog; const ey=(typeof GAME!=='undefined'&&GAME.P)?GAME.P.y:0, hk=1+Math.min(1.25,Math.max(0,ey-.6)/12); STREET_LIGHT.fogFar=Math.min(145,far*hk); /* the haze thins as you climb: a roof buys a view */ STREET_LIGHT.fogNear=Math.min(145,far*hk)*(.3+.3*TOD.day);
  STREET_LIGHT.lampK=Math.max(.06,TOD.night);
  for(const [m,c,dim] of NIGHT_MATS){ const f=1-dim*TOD.day*.88; m.color=[c[0]*f,c[1]*f,c[2]*f]; }
  /* sky: pick the nearest look, and dim or lift it */ const sk=e<.5?A[5]:B[5]; if(SKY.skyM.tex!==SKYT[sk]) SKY.skyM.tex=SKYT[sk];
  if(!skylineM) skylineM=SKY.kids[0].mesh.mats[0]; const dayS=TOD.day>.5; if(skylineM.tex!==(dayS?tSkylineDay:tSkyline)) skylineM.tex=dayS?tSkylineDay:tSkyline; const sl=dayS?.75+TOD.day*.3:.35+TOD.day*1.4; skylineM.color=[sl*.97,sl*.99,sl];
  LIFE.density=A[6]+(B[6]-A[6])*e;
  /* rain comes in at night */ const wet=h>21.5||h<4.5; if(state.rain!==wet){ state.rain=wet; RAIN.vis=wet; }
  if(typeof dayHideTick==='function'&&BAKED.kids.length) dayHideTick(); if(GAME.G.on) phoneDirtyT(); }
function todStr(){ const h=Math.floor(TOD.h), m=Math.floor((TOD.h-h)*60); return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'); }
let _todLast=''; function phoneDirtyT(){ const s=todStr(); if(s!==_todLast){ _todLast=s; if(typeof GAME.phoneDirty==='function') GAME.phoneDirty(); } }
addEventListener('keydown',e=>{ if(e.code==='KeyT') TOD.fast=true; });
/* phones: the clock button (bottom left) shows the time; hold it to wind the clock on, like T */
{ let clk=null, shown=-1; const hold=v=>e=>{ e.preventDefault(); e.stopPropagation(); TOD.fast=v; if(clk) clk.setAttribute('aria-pressed',v?'true':'false'); };
  const tickClock=()=>{ if(!clk){ clk=document.getElementById('tClock'); if(!clk) return; for(const [ev,v] of [['pointerdown',true],['pointerup',false],['pointercancel',false]]) clk.addEventListener(ev,hold(v)); addEventListener('pointerup',()=>{ if(TOD.fast&&clk.getAttribute('aria-pressed')==='true') hold(false)({preventDefault(){},stopPropagation(){}}); }); }
    const m=Math.floor(TOD.h*60)%1440; if(m!==shown){ shown=m; clk.textContent=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')+' ▸▸'; } };
  setInterval(tickClock,250); } addEventListener('keyup',e=>{ if(e.code==='KeyT') TOD.fast=false; });
