/* ==========================================================================================================
   VERTICALITY (Kenny: "the whole area should feel it could be explored on different levels"): the landmarks get
   ways up and things to do on top. Scaffolding (lifts every 2 m, ladders in alternating hatch bays), steel fire
   escapes, step-up stacks of skips, cages and plant, roof detail, and the viaducts' decks made walkable: ballast and
   rails at deck height with parapets, a 700 m elevated run. Coppers can't climb, so up is the way out.
   Runs after the landmarks (48d) and the edges (48d2), before the nav grid (48j).
   ========================================================================================================== */
const mTube=col(0x8c9092), mBoard=MM(P2(32,32,(g,w,h)=>{ R(g,'#7a6440',0,0,w,h); for(let y=0;y<h;y+=8){ R(g,'#5a4a30',0,y,w,1); specks(g,'#8a744e',30,9600+y,w,7,0,y+1); } },0,1)),
  mSteelV=col(0x2c3236), mSteelGV=col(0x1e3a2a), mPlant=col(0x9a9c98), mSkip=col(0xd8a020);
const tLadder=P2(16,32,(g,w,h)=>{ g.clearRect(0,0,w,h); R(g,'#9a9ea0',0,0,2,h); R(g,'#9a9ea0',w-2,0,2,h); for(let y=2;y<h;y+=8) R(g,'#9a9ea0',0,y,w,2); },0,1); tLadder.nomip=true;
const mLadder=(()=>{ const m=M(tLadder,{double:true,cut:true}); return m; })();
const tNetV=P2(32,32,(g,w,h)=>{ g.clearRect(0,0,w,h); for(let y=0;y<h;y+=2) for(let x=(y/2)%2;x<w;x+=2) R(g,'rgba(30,70,90,.9)',x,y,1,1); },0,1); tNetV.nomip=true;
const mNetV=(()=>{ const m=M(tNetV,{double:true}); m.cut=2; return m; })();
/* a face-local frame: s along the face, d out from it. ax 'x' = face runs along x at z=c; 'z' = along z at x=c. out = +1/-1 */
const faceR=(ax,c,out)=>(s0,s1,d0,d1)=>{ const p=c+out*d0, q=c+out*d1; return ax==='x'?[Math.min(s0,s1),Math.min(p,q),Math.max(s0,s1),Math.max(p,q)]:[Math.min(p,q),Math.min(s0,s1),Math.max(p,q),Math.max(s0,s1)]; };
const tubeV=(r,y0,y1)=>eBox(r[0],r[1],r[2],r[3],y0,y1,mTube);

/* SCAFFOLDING up a face from y0 to a roof at top: two rows of standards, a boarded lift every 2 m, guardrails, a ladder
   in a hatch bay at alternate ends, debris netting over the upper half. Every lift is a standable solid. */
function scaffoldV(ax,c,a,b,out,top,o={}){ const y0=o.y0??PAVE_Y, Dp=1.35, F=faceR(ax,c,out), lifts=[];
  for(let y=y0+2;y<=top-.95;y+=2) lifts.push(y); if(!lifts.length||top-lifts[lifts.length-1]>1.25) lifts.push(top-1);
  const yTop=lifts[lifts.length-1]+1.05;
  for(let s=a;s<=b+.01;s+=Math.min(2.5,(b-a)/Math.max(1,Math.round((b-a)/2.5)))) for(const d of [.15,Dp]){ const r=F(s-.03,s+.03,d-.03,d+.03); tubeV(r,y0,yTop); }
  lifts.forEach((y,k)=>{ const hatch=k%2?[a,a+2.4]:[b-2.4,b], below=k?lifts[k-1]:y0;
    for(const d of [.15,Dp]){ const r=F(a,b,d-.03,d+.03); eBox(r[0],r[1],r[2],r[3],y-.06,y,mTube); const g_=F(a,b,Dp-.03,Dp+.03); eBox(g_[0],g_[1],g_[2],g_[3],y+.95,y+1.0,mTube); }
    for(const [s0,s1] of [[a,hatch[0]],[hatch[1],b]]){ if(s1-s0<.1) continue; const r=F(s0,s1,.1,Dp); eBox(r[0],r[1],r[2],r[3],y-.05,y,mBoard,{tu:1,tv:1}); hsol(r[0],r[1],r[2],r[3],y,y-.1);
      const t=F(s0,s1,Dp-.02,Dp+.02); eBox(t[0],t[1],t[2],t[3],y,y+.15,mBoard); }
    /* the ladder: a leaning ladder card plus invisible steps from the lift below up to this one, inside the hatch bay */
    const n=Math.ceil((y-below)/.32), go=2.1/n, dir=k%2?1:-1, s0=k%2?a+.15:b-.15;
    for(let i=0;i<n;i++){ const sa=s0+dir*i*go, sb=sa+dir*go, yy=below+(i+1)*(y-below)/n, r=F(sa,sb,.2,.8); hsol(r[0],r[1],r[2],r[3],yy,yy-.14); }
    { const p0=k%2?a+.15:b-.15, p1=p0+dir*2.1, A=ax==='x'?[p0,below,c+out*.5]:[c+out*.5,below,p0], L_=Math.hypot(2.1,y-below), U=ax==='x'?[dir*2.1/L_,(y-below)/L_,0]:[0,(y-below)/L_,dir*2.1/L_], V=ax==='x'?[0,0,out]:[out,0,0];
      eGrid(mLadder,[A[0]-V[0]*.25,A[1],A[2]-V[2]*.25],U,V,L_,.5,L_,.5); } });
  if(o.net!==false){ const h0=y0+(yTop-y0)*.45, r=F(a,b,Dp+.06,Dp+.06), U=ax==='x'?X_:Z_; eGrid(mNetV,[r[0],h0,r[1]],U,Y_,b-a,yTop-h0,2,2); } }

/* a STEEL FIRE ESCAPE: flights along the face between landings, switching back, up to a top landing a metre under the roof */
function fireEscapeV(ax,c,s0,out,levels,o={}){ const F=faceR(ax,c,out), y0=o.y0??PAVE_Y, W=1.2; let y=y0, s=s0, dir=1;
  for(const L of levels){ const rise=L-y, n=Math.max(2,Math.ceil(rise/.3)), go=.28, st=rise/n, len=n*go;
    for(let i=0;i<n;i++){ const sa=s+dir*i*go, sb=sa+dir*go, yy=y+(i+1)*st, r=F(sa,sb,.1,.1+W); eBox(r[0],r[1],r[2],r[3],yy-.05,yy,mSteelV); hsol(r[0],r[1],r[2],r[3],yy,yy-st-.25); }
    const se=s+dir*len, lr=F(se,se+dir*1.4,.1,.1+W); eBox(lr[0],lr[1],lr[2],lr[3],L-.08,L,mSteelV); hsol(lr[0],lr[1],lr[2],lr[3],L,L-.2);
    const rail=F(Math.min(s,se+dir*1.4),Math.max(s,se+dir*1.4),.1+W-.03,.1+W+.03); eBox(rail[0],rail[1],rail[2],rail[3],L+.95,L+1.0,mSteelV);
    for(const sp of [s,se+dir*1.4]){ const p=F(sp-.03,sp+.03,.1+W-.03,.1+W+.03); eBox(p[0],p[1],p[2],p[3],y0,L+1,mSteelV); }
    y=L; s=se; dir=-dir; } }

/* plant on a flat roof: AC units, a skylight strip, a hatch; all standable */
function roofKitV(x0,z0,x1,z1,y,seed){ const r=hr(seed); const n=2+(r()*3|0);
  for(let i=0;i<n;i++){ const w=1.2+r()*1.4, d=.9+r()*.8, x=x0+1.5+r()*(x1-x0-3-w), z=z0+1.5+r()*(z1-z0-3-d), h=.7+r()*.6; eBox(x,z,x+w,z+d,y,y+h,mPlant); eBox(x+.15,z-.01,x+w-.15,z,y+.15,y+h-.15,mDark); hsol(x,z,x+w,z+d,y+h,y); }
  if(x1-x0>8){ const sx=x0+(x1-x0)*.3, sz=(z0+z1)/2; eBox(sx,sz-.8,sx+(x1-x0)*.4,sz+.8,y,y+.45,MM(P2(16,16,(g,w,h)=>{ R(g,'#6a7a80',0,0,w,h); R(g,'#a8b8c0',1,1,w-2,h-2); },0,1))); hsol(sx,sz-.8,sx+(x1-x0)*.4,sz+.8,y+.45,y); } }

/* ---------------- the viaduct decks: ballast and rails at deck height, parapets you can't fall through ---------------- */
const tBallast=(tracks)=>P2(64,64,(g,w,h)=>{ R(g,'#46403a',0,0,w,h); specks(g,'#5a544c',500,9700,w,h); specks(g,'#2e2a26',400,9701,w,h);
  for(const t of tracks){ const c=t*w; for(let y=0;y<h;y+=5) R(g,'#3a2e24',c-7,y,14,2); R(g,'#9a9a98',c-4,0,1,h); R(g,'#9a9a98',c+3,0,1,h); } },0,1);
const mBallast2=MM(tBallast([.3,.7])), mBallast1=MM(tBallast([.5]));
function viaductDecks(){ for(const V of VIADUCTS){ const [x0,z0,x1,z1,ax,top]=V, along=ax==='x';
    for(const o of GAME.SOL){ const r=o.r, inV=along?(Math.abs(r[1]-z0)<.01&&Math.abs(r[3]-z1)<.01):(Math.abs(r[0]-x0)<.01&&Math.abs(r[2]-x1)<.01); if(!inV) continue;
      if(o.y0===0&&Math.abs(o.y1-(top+1.1))<1e-3){ o.y1=top+.05; if(along){ hsol(r[0],z0,r[2],z0+.35,top+1.1,top); hsol(r[0],z1-.35,r[2],z1,top+1.1,top); } else { hsol(x0,r[1],x0+.35,r[3],top+1.1,top); hsol(x1-.35,r[1],x1,r[3],top+1.1,top); } }
      else if(Math.abs(o.y0-(top-1.6))<1e-3&&Math.abs(o.y1-(top+1.1))<1e-3) o.y1=top+.3; }
    /* the track bed: rails run along the viaduct (the texture's lines run along v, so the z viaduct is laid straight, the x one turned) */
    const from=along?Math.max(x0,HUB.x0-60):Math.max(z0,HUB.z0-60), to=along?Math.min(x1,HUB.x1+60):Math.min(z1,HUB.z1+60), m=along?mBallast2:mBallast1;
    if(along){ for(let a=x0;a<x1;a+=CHUNK){ const b=Math.min(x1,a+CHUNK); eGrid(m,[a,top+.02,z0],Z_,X_,z1-z0,b-a,z1-z0,z1-z0); } }
    else { for(let a=z0;a<z1;a+=CHUNK){ const b=Math.min(z1,a+CHUNK); if(b>-9.4&&a<21){ if(a<-9.4) eGrid(m,[x0,top+.02,-9.4],X_,NZ,x1-x0,-9.4-a,x1-x0,x1-x0); if(b>21) eGrid(m,[x0,top+.02,b],X_,NZ,x1-x0,b-21,x1-x0,x1-x0); continue; } eGrid(m,[x0,top+.02,b],X_,NZ,x1-x0,b-a,x1-x0,x1-x0); } } } }

/* ---------------- the landmarks, made climbable ---------------- */
function buildVertical(){ const t0=performance.now(), v0=EMIT.verts, LB=n=>LANDMARK_BLOCKS.find(L=>L[0]===n)?.slice(1);
  viaductDecks();
  /* ST JOHN'S: restoration scaffold up the nave's east side, then up the tower from the nave roof */
  { const B=LB('church'); if(B&&CHURCH_TOWER.length){ const [x0,z0,x1,z1]=B, [cx,tz,pz]=CHURCH_TOWER[0];
      scaffoldV('z',cx+14,pz-14,pz-1,1,PAVE_Y+13.6); scaffoldV('z',cx+4,tz-3.6,tz+3.6,1,PAVE_Y+20,{y0:PAVE_Y+13.6,net:false}); } }
  /* THE SCHOOL: a steel fire escape down the playground side, roof plant */
  { const B=LB('school'); if(B){ const [x0,z0,x1,z1]=B, bx1=x0+(x1-x0)*.58; fireEscapeV('z',bx1,z0+9,1,[PAVE_Y+4.3,PAVE_Y+8.6,PAVE_Y+12.1]); roofKitV(x0+3,z0+5,bx1,z1-4,PAVE_Y+13.01,9801); } }
  /* THE SUPERMARKET: round the back, a skip, roll cages, the plant stack and ductwork step you up onto the roof */
  { const B=LB('supermarket'); if(B){ const [x0,z0,x1,z1]=B, sx1=x0+(x1-x0)*.62, sz1=z1-2, top=PAVE_Y+7.5;
      const st=[[1.5,mSkip,3.6],[3.1,col(0x6a7076),2.6],[4.8,mPlant,2.6],[6.2,mSteelV,2.4]]; let z=sz1-1;
      for(const [h,m,len] of st){ const za=z-len; eBox(sx1+.05,za,sx1+2.3,z,PAVE_Y,PAVE_Y+h,m); hsol(sx1+.05,za,sx1+2.3,z,PAVE_Y+h); z=za; }
      roofKitV(x0+3,z0+9,sx1,sz1,top,9802); } }
  /* THE PETROL STATION: ice chest and gas cage onto the kiosk, the jet-wash roof, then the canopy */
  { const B=LB('petrol'); if(B){ const [x0,z0,x1,z1]=B, fx0=x0+2,fx1=x1-2,fz0=z0+2, cX1=fx0+38, kx0=fx1-26, kz0=fz0, kz1=fz0+9;
      eBox(kx0+1,kz1+.2,kx0+2.4,kz1+1.1,PAVE_Y,PAVE_Y+1.0,col(0xe8eef2)); hsol(kx0+1,kz1+.2,kx0+2.4,kz1+1.1,PAVE_Y+1.0);
      eBox(kx0-1.15,kz1-1.0,kx0-.05,kz1+.2,PAVE_Y,PAVE_Y+2.0,mMesh); hsol(kx0-1.15,kz1-1.0,kx0-.05,kz1+.2,PAVE_Y+2.0); /* against the kiosk's side, not through it */
      eBoxF(cX1+.2,kz0+1,kx0-.1,kz1-1,PAVE_Y+4.0,PAVE_Y+4.35,{n:mSteelV,s:mSteelV,e:mSteelV,w:mSteelV,t:col(0x5a6066)}); hsol(cX1+.2,kz0+1,kx0-.1,kz1-1,PAVE_Y+4.35,PAVE_Y+4.0);
      for(const px of [cX1+.4,kx0-.3]) for(const pz of [kz0+1.2,kz1-1.2]) eBox(px-.06,pz-.06,px+.06,pz+.06,PAVE_Y,PAVE_Y+4,mSteelV);
      roofKitV(kx0,kz0,fx1-2,kz1,PAVE_Y+3.6,9803); } }
  /* BRAMLEY: a bin store at the end of the garages, the lobby canopies */
  { const B=LB('bramley'); if(B){ const [x0,z0,x1,z1]=B; eBoxF(x0+33.6,z1-9,x0+39.6,z1-4.5,PAVE_Y,PAVE_Y+1.5,{n:mMesh,s:mBrickW,e:mBrickW,w:mBrickW,t:mFelt},{tu:2,tv:1.5}); hsol(x0+33.6,z1-9,x0+39.6,z1-4.5,PAVE_Y+1.5);
      for(const [tx,tz] of [[x0+18,z0+18],[x1-22,(z0+z1)/2-6],[x0+18,z1-30]]) hsol(tx-3.5,tz+11,tx+3.5,tz+13.5,PAVE_Y+3.1,PAVE_Y+2.8); } }
  /* ARNOLD CIRCUS: chimney stacks along each mansion block's ridge (silhouette and handholds) */
  { const B=LB('boundary'); if(B){ const [x0,z0,x1,z1]=B, cx=(x0+x1)/2, cz=(z0+z1)/2;
      for(let k=0;k<ARNOLD.n;k++){ const [bx,bz,yaw]=arnoldBlock(cx,cz,k), H=PAVE_Y+15.5;
        for(const lx of [-7.5,0,7.5]){ const c=Math.cos(yaw),s_=Math.sin(yaw), px=bx+c*lx, pz=bz-s_*lx; eBoxR(px,pz,2.4,.9,H,H+1.7,yaw,{f:mBrickW,b:mBrickW,l:mBrickW,r:mBrickW,t:mDark},{tu:1.6,tv:1.5}); solR(px,pz,2.4,.9,H+1.7,yaw,H); }
      } } }
  console.log('[london] vertical: verts',EMIT.verts-v0,'ms',Math.round(performance.now()-t0)); }
buildVertical();
