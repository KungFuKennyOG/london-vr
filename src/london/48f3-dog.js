/* ==========================================================================================================
   THE DOGS: Staffies on leads (it's Bethnal Green). A small skinned mesh on its own 13-bone skeleton: a deep chest,
   tucked waist and big shoulders, a broad head with cheeks and a short muzzle, rose ears, a whip tail, four legs with
   paws. One painted texture per coat (brindle, blue, fawn, black-and-white) with eyes, nose, collar and the lead,
   and the lead itself is part of the same mesh, so a dog is one draw. It walks and trots on a diagonal gait, sits when
   its owner stops, sniffs, wags, and looks at you when you're close.
   ========================================================================================================== */
const DOG_B=[['pelvis',-1,[0,.4,-.17]],['chest',0,[0,.41,.1]],['neck',1,[0,.47,.21]],['head',2,[0,.55,.3]],['tail',0,[0,.44,-.28]],
  ['flu',1,[.07,.35,.15]],['fll',5,[.07,.19,.16]],['fru',1,[-.07,.35,.15]],['frl',7,[-.07,.19,.16]],
  ['hlu',0,[.066,.38,-.2]],['hll',9,[.066,.18,-.26]],['hru',0,[-.066,.38,-.2]],['hrl',11,[-.066,.18,-.26]]];
const DBI={}; DOG_B.forEach((b,i)=>DBI[b[0]]=i);
const DOG_COATS={brindle:{base:'#6e4a2a',dark:'#33200f',chest:'#e8e2d6',muz:'#4a3220',stripes:1,socks:0},blue:{base:'#5c6068',dark:'#4a4e56',chest:'#e4e2dc',muz:'#4a4e56',stripes:0,socks:1},
  fawn:{base:'#c49464',dark:'#a8784a',chest:'#e8d8c0',muz:'#1e1612',stripes:0,socks:0},bw:{base:'#18181a',dark:'#101012',chest:'#ecebe6',muz:'#18181a',stripes:0,socks:1,blaze:1}};
/* texture layout (128x128): body, head, legs, tail, ears, collar, lead, neck */
const DR={body:[0,0,128,44],head:[0,44,64,40],leg:[64,44,64,40],tail:[0,84,32,22],ear:[32,84,32,22],collar:[64,84,32,22],lead:[96,84,32,22],neck:[0,106,64,22]};
const DOG_TEX={};
function dogTex(coat){ if(DOG_TEX[coat]) return DOG_TEX[coat]; const C=DOG_COATS[coat]||DOG_COATS.brindle, r=rng(7700+coat.length*13);
  return DOG_TEX[coat]=tex(128,128,null,g=>{ R(g,C.base,0,0,128,128);
    for(let i=0;i<1400;i++) R(g,r()<.5?mix(C.base,'#000000',.18):mix(C.base,'#ffffff',.1),r()*128|0,r()*128|0,1,2);
    /* brindle: fine dark streaks that wander, running round the body (flank to belly) */
    if(C.stripes) for(const [x0,y0,w,h] of [DR.body,DR.leg,DR.neck,DR.tail,DR.head]){ g.globalAlpha=.55; for(let y=y0+1;y<y0+h;y+=2+(r()*2|0)){ let x=x0, yy=y; while(x<x0+w){ const l=2+r()*6; if(r()<.6) R(g,C.dark,x,yy,l,1); x+=l+r()*3; yy+=r()<.3?(r()<.5?-1:1):0; } } g.globalAlpha=1; }
    /* the white chest and belly: the underside of the front of the body, and the throat */
    g.fillStyle=C.chest; g.beginPath(); g.ellipse(96,40,coat==='bw'?30:20,coat==='bw'?16:10,0,0,7); g.fill(); g.beginPath(); g.ellipse(48,124,14,coat==='bw'?14:9,0,0,7); g.fill();
    if(C.blaze){ R(g,C.chest,13,44,6,40); g.beginPath(); g.ellipse(48,80,20,6,0,0,7); g.fill(); }
    /* the face: muzzle, nose, eyes, mouth */ const H=DR.head;
    g.fillStyle=C.muz; g.fillRect(H[0],H[1]+30,64,10); if(coat==='bw'){ g.fillStyle=C.chest; g.fillRect(H[0]+38,H[1]+24,20,16); }
    R(g,'#0e0c0c',H[0]+5,H[1]+36,28,4); R(g,'#2a2222',H[0]+12,H[1]+33,14,3); /* the nose: on top of the end of the muzzle, and the tip */
    for(const ex of [10,22]){ R(g,'#120c08',ex-2,H[1]+19,5,4); R(g,'#5a3a18',ex-1,H[1]+20,3,2); R(g,'#e8e4dc',ex,H[1]+20,1,1); R(g,mix(C.base,'#000',.4),ex-3,H[1]+18,7,1); }
    for(const mx of [36,60]) R(g,'#2a1612',mx-4,H[1]+30,9,1); R(g,'#b85a5a',44,H[1]+31,8,2);
    if(C.socks) R(g,C.chest,DR.leg[0],DR.leg[1]+30,64,10);
    R(g,mix(C.base,'#000',.35),DR.ear[0],DR.ear[1],32,22);
    /* collar: red leather, a ring; lead: red webbing */ R(g,'#a01818',DR.collar[0],DR.collar[1],32,22); R(g,'#5a0a0a',DR.collar[0],DR.collar[1],32,2); R(g,'#c8c8cc',DR.collar[0]+14,DR.collar[1]+8,4,6);
    R(g,'#b81c1c',DR.lead[0],DR.lead[1],32,22); R(g,'#6a0a0a',DR.lead[0],DR.lead[1]+10,32,2); }); }
/* a loft: rings along a path, [centre, rx (side), ry (up/fore), weights, z-lean]; u around, v along, inside one texture rect */
function dogLoft(G,rings,seg,rect,cap0,cap1){ const base=G.P.length/3, n=rings.length, uv=(fu,fv)=>[(rect[0]+fu*rect[2])/128,1-(rect[1]+fv*rect[3])/128];
  const frames=[]; for(let k=0;k<n;k++){ const a=rings[Math.max(0,k-1)][0], b=rings[Math.min(n-1,k+1)][0], d=norm3([b[0]-a[0],b[1]-a[1],b[2]-a[2]]), ref=Math.abs(d[1])>.8?[0,0,1]:[0,1,0], X=norm3(v3.cross(ref,d)), Y=v3.cross(d,X); frames.push([d,X,Y]);
    const [c,rx,ry,w]=rings[k]; for(let i=0;i<=seg;i++){ const t=i/seg*Math.PI*2, ca=Math.cos(t), sa=Math.sin(t);
      G.v([c[0]+X[0]*ca*rx+Y[0]*sa*ry,c[1]+X[1]*ca*rx+Y[1]*sa*ry,c[2]+X[2]*ca*rx+Y[2]*sa*ry],norm3([X[0]*ca/rx+Y[0]*sa/ry,X[1]*ca/rx+Y[1]*sa/ry,X[2]*ca/rx+Y[2]*sa/ry]),uv(i/seg,k/Math.max(1,n-1))); G.W.push(w); } }
  for(let k=0;k<n-1;k++) for(let i=0;i<seg;i++){ const a=base+k*(seg+1)+i, b=a+1, c=a+seg+2, d=a+seg+1; G.I.push(a,b,c,a,c,d); }
  for(const [on,k,sg] of [[cap0,0,-1],[cap1,n-1,1]]){ if(!on) continue; const d=frames[k][0], c0=G.v(rings[k][0],[d[0]*sg,d[1]*sg,d[2]*sg],uv(.5,k?1:0)); G.W.push(rings[k][3]); const r0=base+k*(seg+1);
    for(let i=0;i<seg;i++) if(sg>0) G.I.push(c0,r0+i,r0+i+1); else G.I.push(c0,r0+i+1,r0+i); }
  return [base,G.P.length/3]; }
const DW=(a,b,t)=>t<=0?[[DBI[a],1]]:t>=1?[[DBI[b],1]]:[[DBI[a],1-t],[DBI[b],t]];
const DOG_LEAD_N=9;
function dogGeo(){ const G=new Geo(); G.W=[];
  /* the body: rump to chest, a tucked waist, a deep chest */
  dogLoft(G,[[[0,.43,-.31],.05,.06,DW('pelvis','pelvis',0)],[[0,.42,-.27],.088,.1,DW('pelvis','pelvis',0)],[[0,.41,-.18],.1,.118,DW('pelvis','pelvis',0)],[[0,.43,-.08],.084,.088,DW('pelvis','chest',.35)],
    [[0,.42,.01],.1,.122,DW('pelvis','chest',.75)],[[0,.395,.1],.122,.158,DW('chest','chest',0)],[[0,.405,.18],.124,.15,DW('chest','chest',0)],[[0,.43,.245],.09,.11,DW('chest','neck',.3)]],12,DR.body,true,true);
  /* the neck, thick, up to the back of the skull */
  dogLoft(G,[[[0,.44,.19],.085,.085,DW('chest','neck',.4)],[[0,.49,.25],.075,.072,DW('neck','neck',0)],[[0,.53,.3],.068,.064,DW('neck','head',.6)]],10,DR.neck,false,false);
  /* the collar */ dogLoft(G,[[[0,.475,.225],.08,.077,DW('neck','neck',0)],[[0,.49,.245],.079,.075,DW('neck','neck',0)]],10,DR.collar,false,false);
  /* the head: a broad skull, round cheeks, the stop, a short square muzzle, the nose */
  dogLoft(G,[[[0,.565,.255],.04,.04,DW('head','head',0)],[[0,.57,.28],.075,.07,DW('head','head',0)],[[0,.56,.32],.092,.078,DW('head','head',0)],[[0,.545,.36],.086,.07,DW('head','head',0)],
    [[0,.525,.39],.062,.052,DW('head','head',0)],[[0,.515,.425],.054,.046,DW('head','head',0)],[[0,.515,.452],.044,.038,DW('head','head',0)],[[0,.518,.464],.026,.024,DW('head','head',0)]],10,DR.head,true,true);
  /* rose ears, folded back */ for(const s of [1,-1]) dogLoft(G,[[[s*.052,.6,.29],.026,.012,DW('head','head',0)],[[s*.08,.615,.275],.016,.008,DW('head','head',0)],[[s*.095,.6,.258],.003,.003,DW('head','head',0)]],4,DR.ear,true,true);
  /* the tail: a whip, carried low */ dogLoft(G,[[[0,.44,-.29],.024,.024,DW('tail','tail',0)],[[0,.41,-.36],.018,.018,DW('tail','tail',0)],[[0,.36,-.42],.011,.011,DW('tail','tail',0)],[[0,.31,-.45],.004,.004,DW('tail','tail',0)]],6,DR.tail,false,true);
  /* legs: muscled shoulders and hams, straight forelegs, angled hocks, round paws */
  for(const [s,u,l] of [[1,'flu','fll'],[-1,'fru','frl']]){ const x=s*.07;
    dogLoft(G,[[[x,.37,.15],.05,.062,DW(u,u,0)],[[x,.29,.16],.04,.046,DW(u,u,0)],[[x,.2,.165],.031,.034,DW(u,l,.5)],[[x,.11,.16],.026,.028,DW(l,l,0)],[[x,.05,.16],.025,.028,DW(l,l,0)],[[x,.02,.175],.032,.04,DW(l,l,0)]],8,DR.leg,false,true); }
  for(const [s,u,l] of [[1,'hlu','hll'],[-1,'hru','hrl']]){ const x=s*.066;
    dogLoft(G,[[[x,.41,-.19],.056,.075,DW(u,u,0)],[[x,.3,-.2],.048,.06,DW(u,u,0)],[[x,.2,-.25],.03,.034,DW(u,l,.5)],[[x,.12,-.24],.024,.026,DW(l,l,0)],[[x,.05,-.21],.025,.028,DW(l,l,0)],[[x,.02,-.195],.031,.038,DW(l,l,0)]],8,DR.leg,false,true); }
  /* the lead: a strip of rings rewritten every frame from the collar to the hand */
  const lead0=G.P.length/3; const lr=[]; for(let k=0;k<DOG_LEAD_N;k++) lr.push([[0,.49,.25+k*.1],.007,.007,DW('neck','neck',0)]); dogLoft(G,lr,4,DR.lead,false,false); G.lead=[lead0,G.P.length/3];
  return G; }
/* a dog for a walker: one node, one mesh, one draw */
function makeDog(parent,coat,sc){ const G=dogGeo(), n=N(parent); n.dyn=true; n.s=[sc,sc,sc];
  const nv=G.P.length/3, bi=new Uint8Array(nv*2), bw=new Float32Array(nv*2); G.W.forEach((w,i)=>{ bi[i*2]=w[0][0]; bw[i*2]=w[0][1]; if(w[1]){ bi[i*2+1]=w[1][0]; bw[i*2+1]=w[1][1]; } });
  delete G.W; G.groups=[{start:0,count:G.I.length,mi:0}]; G.bs={c:[-.15,.45,-.05],r:1.15};
  n.mesh={geo:G,mats:[M(dogTex(coat),{double:true})],runs:null};
  const D={n,G,bi,bw,bindP:new Float32Array(G.P),bindN:new Float32Array(G.Nm),P:new Float32Array(G.P),Nn:new Float32Array(G.Nm),coat,
    rot:DOG_B.map(()=>[0,0,0]),hy:0,ph:Math.random()*6,still:0,state:'stand',wag:0,skinT:0,loc:DOG_B.map(()=>m4.make()),world:DOG_B.map(()=>m4.make()),skin:DOG_B.map(()=>m4.make()),tmp:m4.make(),hand:null};
  dogSkin(D); return D; }
/* pose targets, blended to: [bone, x, y, z] */
const DOG_POSE={stand:{hy:0},sit:{hy:-.15,pelvis:[-.75,0,0],chest:[.38,0,0],neck:[-.05,0,0],flu:[.37,0,0],fru:[.37,0,0],fll:[0,0,0],frl:[0,0,0],hlu:[-1.15,0,.12],hru:[-1.15,0,-.12],hll:[1.9,0,0],hrl:[1.9,0,0],tail:[.6,0,0]},
  sniff:{hy:-.035,chest:[.16,0,0],neck:[.72,0,0],head:[.28,0,0],flu:[-.16,0,0],fru:[-.16,0,0],fll:[.12,0,0],frl:[.12,0,0],hlu:[.1,0,0],hru:[.1,0,0],tail:[-.25,0,0]}};
function dogSkin(D){ const G=D.G; if(!G.vao) upload(G); const T=[0,0,0], one=[1,1,1];
  DOG_B.forEach(([nm,par,P],i)=>{ const pp=par<0?[0,0,0]:DOG_B[par][2]; T[0]=P[0]-pp[0]; T[1]=P[1]-pp[1]+(par<0?D.hy:0); T[2]=P[2]-pp[2]; m4.compose(D.loc[i],T,D.rot[i],one);
    if(par<0) D.world[i].set(D.loc[i]); else m4.mul(D.world[i],D.world[par],D.loc[i]); const S=D.skin[i]; S.set(D.world[i]);
    S[12]-=S[0]*P[0]+S[4]*P[1]+S[8]*P[2]; S[13]-=S[1]*P[0]+S[5]*P[1]+S[9]*P[2]; S[14]-=S[2]*P[0]+S[6]*P[1]+S[10]*P[2]; });
  const BP=D.bindP,BN=D.bindN,Po=D.P,No=D.Nn,bi=D.bi,bw=D.bw, nv=BP.length/3, L0=G.lead[0], L1=G.lead[1];
  for(let i=0;i<L0;i++){ let px=0,py=0,pz=0,nx=0,ny=0,nz=0; const x=BP[i*3],y=BP[i*3+1],z=BP[i*3+2],a=BN[i*3],b=BN[i*3+1],c=BN[i*3+2];
    for(let k=0;k<2;k++){ const w=bw[i*2+k]; if(!w) continue; const m=D.skin[bi[i*2+k]];
      px+=w*(m[0]*x+m[4]*y+m[8]*z+m[12]); py+=w*(m[1]*x+m[5]*y+m[9]*z+m[13]); pz+=w*(m[2]*x+m[6]*y+m[10]*z+m[14]); nx+=w*(m[0]*a+m[4]*b+m[8]*c); ny+=w*(m[1]*a+m[5]*b+m[9]*c); nz+=w*(m[2]*a+m[6]*b+m[10]*c); }
    Po[i*3]=px; Po[i*3+1]=py; Po[i*3+2]=pz; No[i*3]=nx; No[i*3+1]=ny; No[i*3+2]=nz; }
  /* the lead: from the collar ring, sagging, to the owner's hand (or folded up by the collar if there's no hand) */
  const m=D.skin[DBI.neck], cx=m[0]*0+m[4]*.49+m[8]*.25+m[12], cy=m[1]*0+m[5]*.49+m[9]*.25+m[13], cz=m[2]*0+m[6]*.49+m[10]*.25+m[14], H=D.hand||[cx,cy+.05,cz+.05];
  const dx=H[0]-cx, dy=H[1]-cy, dz=H[2]-cz, dist=Math.hypot(dx,dy,dz)||1e-3, sag=Math.sqrt(Math.max(0,1.25*1.25-dist*dist))*.45, per=(L1-L0)/DOG_LEAD_N;
  for(let k=0;k<DOG_LEAD_N;k++){ const t=k/(DOG_LEAD_N-1), lx=cx+dx*t, ly=cy+dy*t-sag*Math.sin(Math.PI*t), lz=cz+dz*t;
    for(let j=0;j<per;j++){ const v=L0+k*per+j, o=j%4; Po[v*3]=lx+(o===1?.007:o===3?-.007:0); Po[v*3+1]=ly+(o===0?.007:o===2?-.007:0); Po[v*3+2]=lz; No[v*3]=0; No[v*3+1]=1; No[v*3+2]=0; } }
  gl.bindBuffer(gl.ARRAY_BUFFER,G.bufs[0]); gl.bufferSubData(gl.ARRAY_BUFFER,0,Po); gl.bindBuffer(gl.ARRAY_BUFFER,G.bufs[1]); gl.bufferSubData(gl.ARRAY_BUFFER,0,No); }
/* ---------------- the hooks the crowd calls ---------------- */
const DOG_COAT_CELL={53:'brindle',54:'blue',63:'fawn',56:'bw'};
function kitDog(parent,c,sc){ return makeDog(parent,typeof c==='string'?c:DOG_COAT_CELL[c]||'brindle',sc||1); }
const HAND_L=BONES.indexOf('handL');
function dogTick(p,dt,moving){ const D=p.dog, sniff=p.sniff>0, walkDbg=!!p.walkDbg; if(sniff) p.sniff-=dt;
  const mv=moving||walkDbg, run=p.flee>0; D.still=mv?0:D.still+dt;
  const want=mv?'walk':sniff?'sniff':D.still>2.2?'sit':'stand'; D.state=want;
  /* where the dog is: on the left, a little ahead; further ahead with its nose down when it sniffs */
  /* never in a wall, a bin or a parked car: if the left's blocked, the right, else tucked in behind (48f4) */
  const wob=Math.sin(LIFE.t*1.7+p.ph)*.06; let tz=sniff?.9:mv?.55:.42; D.sideT=(D.sideT||0)-dt; const inNow=D.sideT>0&&!dogClear(p,D.n.p[0],D.n.p[2]);
  if(D.sideT<=0||inNow){ D.sideT=.25; D.side=dogSide(p,tz); } const S_=DOG_SIDES[D.side||0], tx=S_[0]+wob*Math.sign(S_[0]); if(S_[1]!==1) tz=S_[1];
  const kk=Math.min(1,dt*(inNow?14:3)); D.n.p[0]+=(tx-D.n.p[0])*kk; D.n.p[1]=0; D.n.p[2]+=(tz-D.n.p[2])*kk; D.n.r[1]+=((sniff&&!D.side?.5:mv?wob*.6:.25*Math.sign(S_[0]))-D.n.r[1])*Math.min(1,dt*3);
  /* skin near you every frame, further off less often */ const far=p.far||0; D.skinT-=dt; if(D.skinT>0&&far>8) return; D.skinT=far<16?.033:far<30?.08:.2; const adt=Math.max(dt,.033);
  const tgt=DOG_POSE[want==='walk'?'stand':want]||DOG_POSE.stand, k=Math.min(1,adt*5);
  DOG_B.forEach(([nm],i)=>{ const t=tgt[nm]||[0,0,0], r=D.rot[i]; r[0]+=(t[0]-r[0])*k; r[1]+=(t[1]-r[1])*k; r[2]+=(t[2]-r[2])*k; }); D.hy+=((tgt.hy||0)-D.hy)*k;
  /* the gait: diagonal pairs (left fore with right hind), a trot when the owner runs */
  if(mv){ D.ph+=adt*(run?17:11)*Math.max(.7,p.speed); const sw=run?.6:.42, f=D.ph;
    const leg=(u,l,ph,fore)=>{ const s=Math.sin(ph), c=Math.cos(ph); D.rot[DBI[u]][0]=-s*sw; D.rot[DBI[l]][0]=(fore?1:.8)*Math.max(0,c)*(run?1.1:.75); };
    leg('flu','fll',f,1); leg('hru','hrl',f+.25,0); leg('fru','frl',f+Math.PI,1); leg('hlu','hll',f+Math.PI+.25,0);
    D.hy=Math.abs(Math.sin(f))*(run?.03:.012)-(run?.02:0); D.rot[DBI.chest][2]=Math.sin(f)*.04; D.rot[DBI.pelvis][2]=-Math.sin(f)*.04; D.rot[DBI.head][0]=Math.sin(f*2)*.04+(run?-.1:0); D.rot[DBI.neck][0]=run?-.15:.05; }
  /* the tail wags; the head follows you about when you're near */
  D.wag+=adt*(want==='sniff'?6:want==='sit'?5:9); D.rot[DBI.tail][1]=Math.sin(D.wag)*(want==='sit'?.25:.45); if(want!=='sit') D.rot[DBI.tail][0]=.15+(mv?.1:0);
  const yw=p.yaw+D.n.r[1], c=Math.cos(p.yaw), s=Math.sin(p.yaw), wx=p.x+c*D.n.p[0]+s*D.n.p[2], wz=p.z-s*D.n.p[0]+c*D.n.p[2], ddx=CW.px-wx, ddz=CW.pz-wz, dd=Math.hypot(ddx,ddz);
  if(dd<4.5&&want!=='sniff'){ const a=clamp(wrapPI(Math.atan2(ddx,ddz)-yw),-1.2,1.2); D.rot[DBI.neck][1]=a*.45; D.rot[DBI.head][1]=a*.55; D.rot[DBI.head][2]=-a*.12; } else { D.rot[DBI.neck][1]*=.9; D.rot[DBI.head][1]=Math.sin(LIFE.t*.4+p.ph)*.25; }
  /* the owner's left hand, from the rig, into the dog's space */
  const S=p.C.J.skin; if(S&&S.rel&&HAND_L>=0){ const h=S.rel[HAND_L], hx=h[4]*-.07+h[12], hy=h[5]*-.07+h[13], hz=h[6]*-.07+h[14], qx=hx-D.n.p[0], qz=hz-D.n.p[2], cr=Math.cos(D.n.r[1]), sr=Math.sin(D.n.r[1]), is=1/D.n.s[0];
    D.hand=D.hand||[0,0,0]; D.hand[0]=(cr*qx-sr*qz)*is; D.hand[1]=(hy-D.n.p[1])*is; D.hand[2]=(sr*qx+cr*qz)*is; }
  dogSkin(D); }
