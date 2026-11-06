'use strict';
(function(){
const cv=document.getElementById('view');
const gl=cv.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance'});
const errBox=document.getElementById('err');
function fail(msg){ errBox.textContent=msg; errBox.hidden=false; }
if(!gl){ fail('This page needs WebGL2, which this browser has turned off. Try the Quest browser, or Chrome, Firefox or Safari.'); return; }

/* ================= math ================= */
const m4={
  make(){ const m=new Float32Array(16); m[0]=m[5]=m[10]=m[15]=1; return m; },
  mul(o,a,b){ for(let c=0;c<4;c++){ const b0=b[c*4],b1=b[c*4+1],b2=b[c*4+2],b3=b[c*4+3];
    o[c*4]=a[0]*b0+a[4]*b1+a[8]*b2+a[12]*b3; o[c*4+1]=a[1]*b0+a[5]*b1+a[9]*b2+a[13]*b3;
    o[c*4+2]=a[2]*b0+a[6]*b1+a[10]*b2+a[14]*b3; o[c*4+3]=a[3]*b0+a[7]*b1+a[11]*b2+a[15]*b3; } return o; },
  persp(o,fovy,aspect,near,far){ const f=1/Math.tan(fovy/2); o.fill(0); o[0]=f/aspect; o[5]=f; o[10]=(far+near)/(near-far); o[11]=-1; o[14]=2*far*near/(near-far); return o; },
  lookAt(o,e,c,up){
    let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2]; let l=Math.hypot(zx,zy,zz)||1; zx/=l; zy/=l; zz/=l;
    let xx=up[1]*zz-up[2]*zy, xy=up[2]*zx-up[0]*zz, xz=up[0]*zy-up[1]*zx; l=Math.hypot(xx,xy,xz)||1; xx/=l; xy/=l; xz/=l;
    const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
    o[0]=xx;o[1]=yx;o[2]=zx;o[3]=0; o[4]=xy;o[5]=yy;o[6]=zy;o[7]=0; o[8]=xz;o[9]=yz;o[10]=zz;o[11]=0;
    o[12]=-(xx*e[0]+xy*e[1]+xz*e[2]); o[13]=-(yx*e[0]+yy*e[1]+yz*e[2]); o[14]=-(zx*e[0]+zy*e[1]+zz*e[2]); o[15]=1; return o; },
  compose(o,p,r,s){
    const a=Math.cos(r[0]),b=Math.sin(r[0]),c=Math.cos(r[1]),d=Math.sin(r[1]),e=Math.cos(r[2]),f=Math.sin(r[2]);
    const ae=a*e,af=a*f,be=b*e,bf=b*f;
    o[0]=c*e*s[0]; o[1]=(af+be*d)*s[0]; o[2]=(bf-ae*d)*s[0]; o[3]=0;
    o[4]=-c*f*s[1]; o[5]=(ae-bf*d)*s[1]; o[6]=(be+af*d)*s[1]; o[7]=0;
    o[8]=d*s[2]; o[9]=-b*c*s[2]; o[10]=a*c*s[2]; o[11]=0;
    o[12]=p[0]; o[13]=p[1]; o[14]=p[2]; o[15]=1; return o; }
};
const norm3=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; };
const rng=seed=>()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };

/* ================= scene graph ================= */
class Node{ constructor(){ this.p=[0,0,0]; this.r=[0,0,0]; this.s=[1,1,1]; this.kids=[]; this.vis=true; this.local=m4.make(); this.world=m4.make(); this.mesh=null; this.par=null; }
  add(n){ this.kids.push(n); n.par=this; return n; } }
function N(parent,x=0,y=0,z=0,rx=0,ry=0,rz=0){ const n=new Node(); n.p=[x,y,z]; n.r=[rx,ry,rz]; if(parent) parent.add(n); return n; }
function mk(geo,mats,parent,x=0,y=0,z=0,rx=0,ry=0,rz=0){ const n=N(parent,x,y,z,rx,ry,rz); n.mesh={geo,mats:Array.isArray(mats)?mats:[mats],runs:null}; return n; }
function setParent(n,p){ if(n.par===p) return; if(n.par){ const i=n.par.kids.indexOf(n); if(i>=0) n.par.kids.splice(i,1); } p.add(n); }
function updateWorld(n,pw){ if(!n.vis) return; m4.compose(n.local,n.p,n.r,n.s); if(pw) m4.mul(n.world,pw,n.local); else n.world.set(n.local); for(const k of n.kids) updateWorld(k,n.world); }

/* ================= geometry ================= */
let GEO_TEMP=false;
class Geo{ constructor(){ this.P=[]; this.Nm=[]; this.T=[]; this.I=[]; this.groups=[]; this.vao=null; this.bufs=null; this.temp=GEO_TEMP; }
  v(p,n,t){ this.P.push(p[0],p[1],p[2]); this.Nm.push(n[0],n[1],n[2]); this.T.push(t[0],t[1]); return this.P.length/3-1; } }
function shift(g,x,y,z){ for(let i=0;i<g.P.length;i+=3){ g.P[i]+=x; g.P[i+1]+=y; g.P[i+2]+=z; } return g; }
function flatNormals(g){ for(let i=0;i<g.I.length;i+=3){ const a=g.I[i]*3,b=g.I[i+1]*3,c=g.I[i+2]*3,P=g.P;
  const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
  const n=norm3([uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx]); for(const k of [a,b,c]){ g.Nm[k]=n[0]; g.Nm[k+1]=n[1]; g.Nm[k+2]=n[2]; } } return g; }
const FACES=[[[1,0,0],[0,0,-1],[0,1,0],'d','h','w'],[[-1,0,0],[0,0,1],[0,1,0],'d','h','w'],[[0,1,0],[1,0,0],[0,0,-1],'w','d','h'],[[0,-1,0],[1,0,0],[0,0,1],'w','d','h'],[[0,0,1],[1,0,0],[0,1,0],'w','h','d'],[[0,0,-1],[-1,0,0],[0,1,0],'w','h','d']];
function box(w,h,d,o={}){
  const g=new Geo(),S={w,h,d};
  FACES.forEach(([n,U,V,ku,kv,ko],fi)=>{ const start=g.I.length,base=g.P.length/3,du=S[ku]/2,dv=S[kv]/2,off=S[ko]/2;
    for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]) g.v([0,1,2].map(k=>n[k]*off+U[k]*a*du+V[k]*b*dv),n,[(a+1)/2,(b+1)/2]);
    g.I.push(base,base+1,base+2,base,base+2,base+3); g.groups.push({start,count:6,mi:fi}); });
  if(o.tw!==undefined||o.td!==undefined){ const tw=o.tw??1,td=o.td??1; for(let i=0;i<g.P.length;i+=3) if(g.P[i+1]>0){ g.P[i]*=tw; g.P[i+2]*=td; } flatNormals(g); }
  if(o.pivot==='t') shift(g,0,-h/2,0); else if(o.pivot==='b') shift(g,0,h/2,0);
  if(o.at) shift(g,o.at[0],o.at[1],o.at[2]);
  return g;
}
function plane(w,h,sx=1,sy=1){ const g=new Geo();
  for(let j=0;j<=sy;j++) for(let i=0;i<=sx;i++) g.v([(i/sx-.5)*w,(j/sy-.5)*h,0],[0,0,1],[i/sx,j/sy]);
  for(let j=0;j<sy;j++) for(let i=0;i<sx;i++){ const a=j*(sx+1)+i,b=a+1,c=a+sx+2,d=a+sx+1; g.I.push(a,b,c,a,c,d); }
  g.groups.push({start:0,count:g.I.length,mi:0}); return g; }
function cyl(rt,rb,h,seg,o={}){ const g=new Geo(),hh=h/2,slope=(rb-rt)/h;
  for(let j=0;j<=1;j++){ const y=j?hh:-hh,r=j?rt:rb; for(let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2,sx=Math.sin(a),cz=Math.cos(a); g.v([r*sx,y,r*cz],norm3([sx,slope,cz]),[i/seg,j]); } }
  for(let i=0;i<seg;i++){ const a=i,b=i+1,c=i+seg+2,d=i+seg+1; g.I.push(a,b,c,a,c,d); }
  g.groups.push({start:0,count:g.I.length,mi:0});
  if(!o.open){ for(const top of [1,0]){ const start=g.I.length,y=top?hh:-hh,r=top?rt:rb,ny=top?1:-1; const c=g.v([0,y,0],[0,ny,0],[.5,.5]);
    for(let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2; g.v([r*Math.sin(a),y,r*Math.cos(a)],[0,ny,0],[.5+Math.sin(a)/2,.5+Math.cos(a)/2]); }
    for(let i=0;i<seg;i++){ if(top) g.I.push(c,c+1+i,c+2+i); else g.I.push(c,c+2+i,c+1+i); }
    g.groups.push({start,count:g.I.length-start,mi:top?1:2}); } }
  if(o.at) shift(g,o.at[0],o.at[1],o.at[2]); return g; }
function torus(R,r,rs,ts){ const g=new Geo();
  for(let j=0;j<=rs;j++) for(let i=0;i<=ts;i++){ const u=i/ts*Math.PI*2,v=j/rs*Math.PI*2,cx=R*Math.cos(u),cy=R*Math.sin(u);
    const p=[(R+r*Math.cos(v))*Math.cos(u),(R+r*Math.cos(v))*Math.sin(u),r*Math.sin(v)]; g.v(p,norm3([p[0]-cx,p[1]-cy,p[2]]),[i/ts,j/rs]); }
  for(let j=1;j<=rs;j++) for(let i=1;i<=ts;i++){ const a=(ts+1)*j+i-1,b=(ts+1)*(j-1)+i-1,c=(ts+1)*(j-1)+i,d=(ts+1)*j+i; g.I.push(a,b,d,b,c,d); }
  g.groups.push({start:0,count:g.I.length,mi:0}); return g; }
/* merge axis-aligned boxes into one single-material geometry (one draw call) */
function mergeBoxes(list){ const g=new Geo();
  for(const it of list){ const b=box(it[3],it[4],it[5]); const base=g.P.length/3;
    for(let i=0;i<b.P.length;i+=3) g.P.push(b.P[i]+it[0],b.P[i+1]+it[1],b.P[i+2]+it[2]);
    for(const v of b.Nm) g.Nm.push(v);
    for(let i=0;i<b.T.length;i+=2){ g.T.push(b.T[i]*(it[6]||1),b.T[i+1]*(it[7]||1)); }
    for(const ix of b.I) g.I.push(ix+base); }
  g.groups=[{start:0,count:g.I.length,mi:0}]; return g; }

/* ================= textures ================= */
function tex(w,h,base,fn){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d',{willReadFrequently:true}); /* software canvases: painting hundreds of pages is far faster than round-tripping a GPU canvas */ if(base){ g.fillStyle=base; g.fillRect(0,0,w,h); } if(fn) fn(g,w,h); return {c,glt:null,f:-1}; }
function R(g,col,x,y,w,h){ g.fillStyle=col; g.fillRect(x,y,w,h); }
function grain(g,amt,seed=1){ const w=g.canvas.width,h=g.canvas.height,d=g.getImageData(0,0,w,h),r=rng(seed); for(let i=0;i<d.data.length;i+=4){ if(!d.data[i+3]) continue; const n=(r()-.5)*amt; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } g.putImageData(d,0,0); }
function specks(g,col,n,seed,w,h,x0=0,y0=0){ const r=rng(seed); for(let i=0;i<n;i++) R(g,col,x0+(r()*w|0),y0+(r()*h|0),1,1); }
function grid(g,rows,pal){ rows.forEach((row,y)=>{ for(let x=0;x<row.length;x++){ const col=pal[row[x]]; if(col) R(g,col,x,y,1,1); } }); }
const FONT={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',Q:'010101101110011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111','0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110','4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110','-':'000000111000000',':':'000010000010000','#':'101111101111101','!':'010010010000010','.':'000000000000010','/':'001001010100100','+':'000010111010000','>':'100010001010100','^':'010101000000000'};
function text(g,str,x,y,col,s=1){ g.fillStyle=col; let cx=x; for(const ch of str.toUpperCase()){ const gl_=FONT[ch]; if(gl_) for(let i=0;i<15;i++) if(gl_[i]==='1') g.fillRect(cx+(i%3)*s,y+Math.floor(i/3)*s,s,s); cx+=4*s; } }
const textW=(str,s=1)=>str.length*4*s-s;
function cl(w,h,base,amt,seed,fn){ return tex(w,h,base,g=>{ if(fn) fn(g,w,h); grain(g,amt,seed); }); }

/* --- shared environment --- */
const tConcrete=tex(32,32,'#45464a',g=>{ grain(g,28,23); const r=rng(24); let x=8,y=0; for(let i=0;i<30;i++){ R(g,'#2c2d30',x,y,1,1); x+=r()>.5?1:0; y+=1; if(y>31) break; } R(g,'#2c2d30',0,31,32,1); R(g,'#2c2d30',31,0,1,32); specks(g,'#2a2b2e',14,25,32,32); });
const tStairWall=cl(32,32,'#7e7d73',18,201,g=>{ R(g,'#3f5146',0,16,32,16); R(g,'#2b382f',0,15,32,1); const r=rng(202); for(let i=0;i<5;i++){ const x=r()*32|0; for(let y=16;y<32;y++) if(r()>.35) R(g,'rgba(30,24,14,.4)',x,y,1,1); } specks(g,'#5d5c54',20,203,32,15); });
const tFireDoor=cl(16,32,'#5a2a25',12,204,g=>{ R(g,'#3e1d19',0,0,16,1); R(g,'#3e1d19',0,0,1,32); R(g,'#3e1d19',15,0,1,32); R(g,'#22292c',4,5,8,9); for(let k=5;k<14;k+=2) R(g,'#5f6d72',4,k,8,1); for(let k=4;k<12;k+=2) R(g,'#5f6d72',k,5,1,9); R(g,'#8f9294',1,18,14,1); R(g,'#6b6e70',1,19,14,1); R(g,'#7a7c7d',0,27,16,5); R(g,'#5c0a0a',3,22,1,2); });
const tFluo=tex(8,8,'#dfe9f2',g=>{ R(g,'#ffffff',1,3,6,2); });
const tFluoDead=tex(8,8,'#4a4d50',g=>{ R(g,'#5f6366',1,3,6,2); });
const tBlack=tex(8,8,'#1b1c1e',g=>grain(g,10,36));
const tSteel=tex(32,32,'#8a9197',g=>{ const r=rng(11); for(let y=0;y<32;y++) R(g,r()>.5?'rgba(255,255,255,.08)':'rgba(0,0,0,.09)',0,y,32,1); grain(g,16,12); });
const tBlued=tex(16,8,'#232427',g=>{ R(g,'#34363a',0,0,16,1); grain(g,10,37); });
const tWood=tex(8,8,'#4a2e1c',g=>{ R(g,'#3a2214',0,2,8,1); R(g,'#3a2214',0,6,8,1); grain(g,14,38); });
const tWoodLight=tex(8,8,'#7a5634',g=>{ R(g,'#5f4026',0,3,8,1); grain(g,14,39); });
const tPlinth=tex(32,32,'#2b2c30',g=>{ grain(g,18,44); R(g,'#3a3b40',0,0,32,2); });
const tBloodSplat=tex(16,16,null,g=>{ const r=rng(301); for(let y=0;y<16;y++) for(let x=0;x<16;x++){ const d=Math.hypot(x-7.5,(y-6)*1.2); if(d<5.2+r()*1.6) R(g,d<2.6?'#7e1212':'#5a0909',x,y,1,1); } for(const x of [5,9,11]){ for(let y=10;y<16;y++) if(r()>.25) R(g,'#5a0909',x,y,1,1); } });
const tPool=tex(32,24,null,g=>{ const r=rng(302); for(let y=0;y<24;y++) for(let x=0;x<32;x++){ const d=Math.hypot((x-16)/15,(y-12)/10.5); if(d<.78+r()*.18) R(g,d<.45?'#4f0707':'#3a0505',x,y,1,1); } specks(g,'#7a1010',6,303,24,14,4,5); });
const tGlint=tex(4,4,'#fff6d8');
const tRing=tex(16,16,null,g=>{ for(let y=0;y<16;y++) for(let x=0;x<16;x++){ const d=Math.hypot(x-7.5,y-7.5); if(d>5.4&&d<7.6) R(g,'#ffffff',x,y,1,1); } });

/* --- character textures: painted and cylinder-mapped (the front of each body part sits in the middle of its texture) --- */
const hexRGB=h=>{ const n=parseInt(h.slice(1),16); return [n>>16&255,n>>8&255,n&255]; };
const mix=(a,b,t)=>{ const A=hexRGB(a),B=hexRGB(b); return '#'+[0,1,2].map(i=>Math.max(0,Math.min(255,Math.round(A[i]+(B[i]-A[i])*t))).toString(16).padStart(2,'0')).join(''); };
const hexInt=h=>parseInt(h.slice(1),16);
function cylShade(g,w,h,amt){ const d=g.getImageData(0,0,w,h); for(let x=0;x<w;x++){ const t=Math.abs((x+.5)/w-.5)*2,k=1-amt*Math.min(1,Math.max(0,(t-.3)/.7)); for(let y=0;y<h;y++){ const i=(y*w+x)*4; d.data[i]*=k; d.data[i+1]*=k; d.data[i+2]*=k; } } g.putImageData(d,0,0); }
function detailPass(g,w,h,seed,o={}){ const d=g.getImageData(0,0,w,h),r=rng(seed+999),cs=o.cell||4,gw=Math.ceil(w/cs)+2,gh=Math.ceil(h/cs)+2,grd=[];
  for(let i=0;i<gw*gh;i++) grd.push(r()-.5);
  const val=(x,y)=>{ const gx=x/cs,gy=y/cs,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,a=grd[iy*gw+ix],b=grd[iy*gw+ix+1],c=grd[(iy+1)*gw+ix],e=grd[(iy+1)*gw+ix+1]; return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+e*fx)*fy; };
  const mo=o.mottle??.22,we=o.weave??.04,ao=o.ao??.14,lt=o.light??.1;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=(y*w+x)*4; if(!d.data[i+3]) continue; const ty=(y+.5)/h;
    let k=1+val(x,y)*mo+(((x+(y>>(o.twill?0:1)))&1)?we:-we)+lt*(.5-ty); k*=1-ao*(Math.max(0,1-ty*6)+Math.max(0,(ty-.86)*7));
    d.data[i]*=k; d.data[i+1]*=k; d.data[i+2]*=k; }
  g.putImageData(d,0,0);
  const n=o.grime??(w>=32?(h>=64?7:4):0); for(let i=0;i<n;i++){ const cx=r()*w,cy=r()*h,rx=2+r()*w*.12,ry=2+r()*h*.1; for(let y=Math.floor(cy-ry);y<cy+ry;y++) for(let x=Math.floor(cx-rx);x<cx+rx;x++){ const q=Math.hypot((x-cx)/rx,(y-cy)/ry); if(q<1&&r()<1-q) R(g,'rgba(28,20,12,.18)',((x%w)+w)%w,y,1,1); } } }
function cloth(w,h,base,seed,fn,shade=.22,gr=9,o){ return tex(w,h,base,g=>{ if(fn) fn(g,w,h); detailPass(g,w,h,seed,o); if(shade) cylShade(g,w,h,shade); grain(g,gr,seed); }); }
function folds(g,col,seed,n,x0,y0,w,h){ const r=rng(seed); for(let i=0;i<n;i++){ let x=x0+r()*w,y=y0+r()*h; const dx=(r()-.5)*1.4,len=3+(r()*5|0); for(let k=0;k<len;k++){ const X=Math.round(x),Y=Math.round(y); R(g,col,X,Y,1,1); R(g,'rgba(255,255,255,.11)',X+1,Y,1,1); R(g,'rgba(0,0,0,.12)',X-1,Y,1,1); x+=dx; y+=1; } } }
function vlines(g,col,xs,y0,h){ for(const x of xs){ R(g,col,x,y0,1,h); for(let y=y0;y<y0+h;y+=2) R(g,'rgba(255,255,255,.1)',x+1,y,1,1); } }

/* faces: 128x64, the face in the middle third, hair wrapping round the back */
const HEADS={
  ray:{seed:11,skin:'#a06a4a',skinD:'#74452e',hair:'buzz',hairC:'#1a1411',hairFront:14,shadow:true,brow:'#1a1411',browT:2,iris:'#3a2416',lip:'#7a4232',beard:'stubble',beardC:'#3a2418',cut:true,bruise:true,splitlip:true,headwound:true},
  corner:{seed:21,skin:'#d29a76',skinD:'#a46a50',hair:'bleach',hairC:'#d0b880',hairFront:15,brow:'#8a6a3c',iris:'#4a6a8a',lip:'#b0624e',acne:true},
  cutter:{seed:31,skin:'#8a5a3c',skinD:'#5a3622',hair:'long',hairC:'#140f0d',hairFront:14,sideburn:40,behind:56,nape:63,shadow:true,brow:'#140f0d',browT:2,iris:'#2a1a10',lip:'#5e2e22',beard:'goatee',beardC:'#1a120e',scar:true},
  gunman:{seed:41,skin:'#c48e6a',skinD:'#946446',hair:'slick',hairC:'#241a14',hairFront:13,sideburn:36,shadow:true,brow:'#241a14',iris:'#3a2a1a',lip:'#8a4a38',beard:'mustache',beardC:'#241a14'},
  doorman:{seed:51,skin:'#5e3a26',skinD:'#3a2214',hair:'shaved',hairFront:14,shadow:true,brow:'#140e0a',browT:2,iris:'#1a0e08',lip:'#4e2c1e',beard:'full',beardC:'#120c08',gold:true,white:'#d8cfc0'},
  enforcer:{seed:61,skin:'#b98a6a',skinD:'#8a5e44',bal:'#18191b',brow:'#2a1e16',iris:'#4a5a3a',lip:'#8a4a3a'},
  landlord:{seed:71,skin:'#c99a80',skinD:'#9a6e58',hair:'fringe',hairC:'#d6d2c8',brow:'#e4e0d6',browT:2,iris:'#5a6a7a',lip:'#9a5a4e',age:true,spots:true,glasses:'#8a7a4a'}
};
/* --- painted textures: smooth tonal gradients, fabric weave, soft folds and baked light; the PS1 pass (15-bit colour, dither, nearest filtering) does the rest --- */
const hash2=(x,y,s)=>{ let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,982451653))|0; h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; };
function vn(x,y,s){ const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
  const a=hash2(ix,iy,s),b=hash2(ix+1,iy,s),c=hash2(ix,iy+1,s),d=hash2(ix+1,iy+1,s),t=a+(b-a)*ux; return t+((c+(d-c)*ux)-t)*uy; }
function fbm(x,y,s,oct=4){ let v=0,a=.5,f=1; for(let i=0;i<oct;i++){ v+=a*(vn(x*f,y*f,s+i*17)-.5); a*=.5; f*=2; } return v*2; }
const sst=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
const F3=h=>{ const n=parseInt(h.slice(1),16); return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]; };
const lerp3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
function Img(w,h){ return {w,h,d:new Float32Array(w*h*3)}; }
function idx(I,x,y){ x=Math.round(x); y=Math.round(y); if(y<0||y>=I.h) return -1; x=((x%I.w)+I.w)%I.w; return (y*I.w+x)*3; }
function put(I,x,y,c,a=1){ const i=idx(I,x,y); if(i<0||a<=0) return; a=Math.min(1,a); for(let k=0;k<3;k++) I.d[i+k]+=(c[k]-I.d[i+k])*a; }
function mul(I,x,y,m){ const i=idx(I,x,y); if(i<0) return; for(let k=0;k<3;k++) I.d[i+k]*=m; }
/* gaussian blob: col null multiplies brightness by (1+amt*g), otherwise blends toward col */
function blob(I,cx,cy,rx,ry,amt,col){ col=col&&F3(col);
  for(let y=Math.floor(cy-ry*2.6);y<=cy+ry*2.6;y++) for(let x=Math.floor(cx-rx*2.6);x<=cx+rx*2.6;x++){ const g=Math.exp(-(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2)); if(g<.01) continue; if(col) put(I,x,y,col,amt*g); else mul(I,x,y,1+amt*g); } }
function softLine(I,x0,y0,x1,y1,col,a,wd=1){ col=F3(col); const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1;
  for(let y=Math.floor(Math.min(y0,y1)-wd*2);y<=Math.max(y0,y1)+wd*2;y++) for(let x=Math.floor(Math.min(x0,x1)-wd*2);x<=Math.max(x0,x1)+wd*2;x++){
    const t=Math.max(0,Math.min(1,((x+.5-x0)*dx+(y+.5-y0)*dy)/L2)),d=Math.hypot(x+.5-x0-dx*t,y+.5-y0-dy*t); const al=a*Math.max(0,1-d/wd); if(al>0) put(I,x,y,col,al); } }
function softRect(I,x0,y0,w,h,col,a,fe=1){ col=F3(col); for(let y=Math.floor(y0-fe);y<=y0+h+fe;y++) for(let x=Math.floor(x0-fe);x<=x0+w+fe;x++){ const dx=Math.max(x0-(x+.5),(x+.5)-(x0+w),0),dy=Math.max(y0-(y+.5),(y+.5)-(y0+h),0),d=Math.hypot(dx,dy); const al=a*Math.max(0,1-d/fe); if(al>0) put(I,x,y,col,al); } }
function softEll(I,cx,cy,rx,ry,col,a,fe=.25){ col=F3(col); for(let y=Math.floor(cy-ry-2);y<=cy+ry+2;y++) for(let x=Math.floor(cx-rx-2);x<=cx+rx+2;x++){ const d=Math.hypot((x+.5-cx)/rx,(y+.5-cy)/ry); const al=a*Math.min(1,Math.max(0,(1-d)/fe)); if(al>0) put(I,x,y,col,al); } }
/* a sewn edge: a dark crease with a lit lip beside it, optional dashed stitching */
function seam(I,x0,y0,x1,y1,stitch){ softLine(I,x0,y0,x1,y1,'#000000',.32,1.3); softLine(I,x0+1,y0,x1+1,y1,'#ffffff',.07,1);
  if(stitch){ const n=Math.hypot(x1-x0,y1-y0)|0; for(let i=0;i<n;i+=3){ const t=i/n; put(I,x0+(x1-x0)*t+2,y0+(y1-y0)*t,F3(stitch),.55); } } }
function textI(I,str,x,y,col,s=1,a=1){ col=F3(col); let cx=x; for(const ch of str.toUpperCase()){ const gl_=FONT[ch]; if(gl_) for(let i=0;i<15;i++) if(gl_[i]==='1') for(let yy=0;yy<s;yy++) for(let xx=0;xx<s;xx++) put(I,cx+(i%3)*s+xx,y+Math.floor(i/3)*s+yy,col,a); cx+=4*s; } }
function toTex(I){ return tex(I.w,I.h,null,g=>{ const id=g.createImageData(I.w,I.h); for(let i=0,j=0;i<I.d.length;i+=3,j+=4){ id.data[j]=Math.max(0,Math.min(255,I.d[i]*255)); id.data[j+1]=Math.max(0,Math.min(255,I.d[i+1]*255)); id.data[j+2]=Math.max(0,Math.min(255,I.d[i+2]*255)); id.data[j+3]=255; } g.putImageData(id,0,0); }); }
/* soft stress folds: each a ridge, lit on one side and shaded on the other */
function makeFolds(seed,n,w,h,dir,wd,amp){ const r=rng(seed),F=[];
  for(let i=0;i<n;i++){ const x=r()*w,y=r()*h,len=h*(.08+r()*.16); let a=dir==='v'?Math.PI/2+(r()-.5)*.5:dir==='h'?(r()-.5)*.35:(r()<.5?.6:-.6)+(r()-.5)*.6; F.push({x,y,dx:Math.cos(a),dy:Math.sin(a),len,wd:wd*(.7+r()*.6),amp:amp*(.6+r()*.6)}); }
  return (x,y)=>{ let v=0; for(const f of F){ for(const ox of [0,-w,w]){ const px_=x-(f.x+ox),py=y-f.y,t=px_*f.dx+py*f.dy; if(Math.abs(t)>f.len) continue; const s=(-px_*f.dy+py*f.dx)/f.wd; if(Math.abs(s)>3) continue; v+=f.amp*(1-(t/f.len)**2)*(-s*Math.exp(-s*s))*1.6; } } return v; }; }
/* fabric tone at a texel, multiplier around 1 */
function weave(f,x,y,s){
  switch(f){
    case 'denim': return (((x+y)%3===0)?.86:1.04)*(1+.12*fbm(x*.7,y*.05,s))*(1+.18*sst(.05,.5,fbm(x*.06,y*.025,s+5)));
    case 'cotton': return 1+.05*fbm(x*.8,y*.8,s)+(((x+y)&1)?.02:-.02);
    case 'twill': return (((x+y)%2===0)?.95:1.03)*(1+.05*fbm(x*.6,y*.6,s));
    case 'wool': return 1+.06*fbm(x*1.1,y*1.1,s);
    case 'knit': return (1+.09*Math.sin(x*Math.PI*.5))*(1+.05*fbm(x*.5,y*.5,s));
    case 'leather': return (1+.16*fbm(x*.09,y*.09,s+3))*(1+.05*fbm(x*.7,y*.7,s));
    case 'poly': return 1+.1*fbm(x*.04,y*.06,s+4)+.03*fbm(x*.6,y*.6,s);
    case 'nylon': return 1+.08*fbm(x*.05,y*.05,s)+.03*fbm(x*.7,y*.7,s);
    case 'cordura': return (((x^y)&1)?1.04:.96)*(1+.07*fbm(x*.3,y*.3,s));
    case 'skin': return 1+.035*fbm(x*.18,y*.18,s);
    case 'glass': return 1;
    default: return 1;
  }
}
/* garment(w,h,seed,zone,o): zone(x,y) -> [hex colour, fabric, fold weight]; cylinder-wrapped light; o.decor(I) draws details */
function garment(w,h,seed,zone,o={}){
  const I=Img(w,h),folds=makeFolds(seed,o.folds??12,w,h,o.dir||'d',o.foldW??3,o.foldAmp??.22),Lx=-.35,Lz=.82;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const z=zone(x,y),c=F3(z[0]),fab=z[1]||'cotton',fk=z[2]??1;
    let m=weave(fab,x,y,seed);
    if(fk) m*=1+folds(x,y)*fk;
    if(o.wrap!==false){ const a=((x+.5)/w-.5)*2*Math.PI; m*=.7+.3*Math.max(0,Lx*Math.sin(a)+Lz*Math.cos(a))+.3*.4; }
    m*=1+(o.vlight??.08)*(.5-(y+.5)/h);
    m*=1-(o.grime??.13)*sst(.3,.75,fbm(x*.05+9,y*.04,seed+9));
    if(z[3]) m*=z[3];
    const i=(y*w+x)*3; I.d[i]=c[0]*m; I.d[i+1]=c[1]*m; I.d[i+2]=c[2]*m;
  }
  if(o.decor) o.decor(I);
  return toTex(I);
}
const flat=(w,h,seed,hex,fab,o={})=>garment(w,h,seed,()=>[hex,fab,o.fk??.6],Object.assign({folds:4,wrap:false},o));
function bloodSoak(I,x,y,rx,ry,seed){ const r=rng(seed); blob(I,x,y,rx,ry,.8,'#4a0606'); blob(I,x,y,rx*.55,ry*.55,.7,'#2e0303'); for(let i=0;i<5;i++){ const dx=(r()-.5)*rx*1.6; softLine(I,x+dx,y+ry*.5,x+dx+(r()-.5)*2,y+ry*(1+r()*1.4),'#3e0505',.7,1.2); } }

/* Faces, painted soft at 256x128 and wrapped round the head, front in the middle.
   Real layout: eyes halfway between chin and crown, hairline three quarters up, nose base a third, mouth a quarter. */
const FL3={hair:30,brow:54,eye:62,nose:82,mouth:94,chin:108};
function paintHead(s,ex){
  const W=256,H=128,cx=128,I=Img(W,H),SK=F3(s.skin),SD=F3(s.skinD),seed=s.seed;
  const E=FL3.eye,BR=FL3.brow,NO=FL3.nose,MO=FL3.mouth,CH=FL3.chin,HL=(s.hairFront??15)*2;
  const T=x=>Math.abs(x+.5-cx)/128;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const t=T(x); let c=lerp3(SK,SD,Math.min(1,sst(.12,.62,t)*.5+(y>CH+6?.35*sst(CH+6,CH+16,y):0)));
    const m=1+.035*fbm(x*.12,y*.12,seed); const i=(y*W+x)*3; I.d[i]=c[0]*m; I.d[i+1]=c[1]*m; I.d[i+2]=c[2]*m; }
  const warm='#c0604a';
  for(const sx of [-1,1]){ const ex_=cx+sx*18;
    blob(I,ex_,E,13,7,-.26); blob(I,ex_,E+7,10,3.5,-.12); blob(I,cx+sx*27,E+17,12,9,.12,warm); blob(I,cx+sx*28,E+11,10,5,.07);
    blob(I,ex_,BR-5,14,4,.05); blob(I,cx+sx*40,E-8,10,16,-.12); blob(I,cx+sx*16,NO+4,6,10,-.06); }
  blob(I,cx,HL+12,24,9,.07); blob(I,cx,NO-4,6,5,.14,warm); blob(I,cx,CH-4,11,5,.07); blob(I,cx,CH+8,22,5,-.25);
  softLine(I,cx,E-4,cx,NO-6,'#ffffff',.14,2.4); for(const sx of [-1,1]){ blob(I,cx+sx*7,NO-8,3,8,-.22); softLine(I,cx+sx*9,NO-1,cx+sx*15,MO+3,'#000000',s.age?.22:.09,2); }
  blob(I,cx,NO+1,9,2.4,-.32); for(const sx of [-1,1]) blob(I,cx+sx*4,NO,2.2,1.4,-.6); blob(I,cx,MO-7,2.2,4,-.08); blob(I,cx,MO+7,10,2.6,-.2);
  if(s.age){ for(const yy of [HL+6,HL+11]) softLine(I,cx-22,yy,cx+22,yy,'#000000',.13,1.2); for(const sx of [-1,1]) for(const dy of [-3,0,3]) softLine(I,cx+sx*28,E+dy,cx+sx*33,E+dy*1.6,'#000000',.12,1); }
  if(s.shadow) for(let y=MO-8;y<H;y++) for(let x=0;x<W;x++){ const t=T(x); if(t>.42) continue; const lips=y>=MO-2&&y<=MO+5&&Math.abs(x+.5-cx)<14; if(!lips) put(I,x,y,[.2,.25,.32],.09*sst(.42,.3,t)); }
  if(s.bal){ const KN=F3(s.bal); for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const dx=Math.abs(x+.5-cx),eyeD=Math.max(dx/32,Math.abs(y+.5-(E-1))/9),mD=Math.hypot(dx/15,(y+.5-(MO+1))/8);
      const inHole=Math.min(eyeD,mD); if(inHole<1) { if(inHole>.85) put(I,x,y,[.05,.05,.06],.6); continue; } const rib=1+.12*Math.sin(x*1.6)+.04*fbm(x*.4,y*.4,seed); put(I,x,y,[KN[0]*rib,KN[1]*rib,KN[2]*rib],1); } }
  else {
    for(const ex_ of [64,192]){ blob(I,ex_,(E+NO)/2,7,15,.22,warm); softEll(I,ex_,(E+NO)/2,6,13,'#000000',.12,.6); blob(I,ex_+1,(E+NO)/2+1,3,7,-.25); }
    hair3(I,s,T); beard3(I,s,T);
  }
  // brows
  const slope=ex==='hurt'?-1.1:ex==='agony'?-1.8:ex==='beg'?1.3:ex==='shock'?.8:ex==='choke'?1.1:0,base=ex==='beg'?BR-3:ex==='hurt'?BR+3:ex==='agony'?BR+4:ex==='shock'?BR-6:ex==='choke'?BR-4:BR,BC=F3(s.brow),r=rng(seed+ex.length);
  for(const sx of [-1,1]){ const e=cx+sx*18; for(let i=-9;i<=9;i++){ const t=-sx*i/9,yy=base-slope*t*3+(Math.abs(i)>6?(Math.abs(i)-6)*.6:0)-(1-Math.abs(i)/9)*1.2;
    const th=(s.browT||1)>1?2.2:1.5; for(let k=0;k<2;k++) softLine(I,e+i,yy+r()*th,e+i+sx*.6,yy-1+r()*.6,s.brow,.55+r()*.3,1); } }
  if(ex==='shock'||ex==='choke'){ for(const dy of [-13,-18,-23]) softLine(I,cx-24,BR+dy+(dy===-18?1:0),cx+24,BR+dy,'#000000',.13,1.2);
    if(ex==='shock') for(let y=BR-24;y<CH+6;y++) for(let x=cx-60;x<=cx+60;x++){ const q=1-((x-cx)/60)**2-((y-(E+16))/44)**2; if(q>0) put(I,x,y,[.76,.73,.71],.16*q*q); } } /* raised brows crease the forehead; shock drains the colour */
  if(ex==='agony'){ for(const sx of [-1,1]){ softLine(I,cx+sx*3,BR-7,cx+sx*2,BR+3,'#000000',.32,1.3); softLine(I,cx+sx*9,NO-3,cx+sx*21,MO+2,'#000000',.32,1.8); }
    for(const dy of [-1,3]) softLine(I,cx-6,E+dy,cx+6,E+dy-1,'#000000',.2,1); } /* the frown knot, the nose wrinkled up, deep lines from nose to mouth */
  // eyes
  const WH=F3(s.white||'#ddd6c8'),IR=F3(s.iris),DK=lerp3(SD,[0,0,0],.55);
  for(const sx of [-1,1]){ const e=cx+sx*18;
    if(ex==='agony'){ for(let i=-8;i<=8;i++) put(I,e+i,E+1.5+Math.abs(i)*.18,DK,.95); softLine(I,e-9,E-3.5,e+9,E-2.5,'#000000',.32,1.6); softLine(I,e-7,E+5,e+7,E+6,'#000000',.28,1.4); for(const dy of [-3,0,3,6]) softLine(I,e+sx*9,E+dy*.5,e+sx*16,E+dy*1.3,'#000000',.24,1); softLine(I,e+sx*4,E+8,e+sx*12,E+10,'#000000',.18,1); }
    else if(ex==='hurt'){ for(let i=-7;i<=7;i++) put(I,e+i,E+1+Math.abs(i)*.12,DK,.9); softLine(I,e-8,E-3,e+8,E-3,'#000000',.25,1.4); softLine(I,e-6,E+5,e+6,E+5,'#000000',.2,1.2); for(const dy of [-2,1,4]) softLine(I,e+sx*9,E+dy*.5,e+sx*14,E+dy,'#000000',.2,1); }
    else if(ex==='sleep'){ for(let i=-7;i<=7;i++) put(I,e+i,E+1+(1-(i/7)**2)*1,DK,.9); softLine(I,e-6,E-3,e+6,E-3,'#000000',.12,1.4); }
    else { const ry=ex==='beg'?3.6:ex==='shock'?4.5:ex==='choke'?4.2:2.6,wide=ex==='shock'||ex==='choke';
      for(let y=Math.floor(E-ry-1);y<=E+ry+1;y++) for(let x=e-8;x<=e+8;x++){ const u=(x+.5-e)/7.5,v=(y+.5-E)/ry,inside=v*v<(1-u*u)*(1-u*u)*1.05; if(!inside) continue;
        let c=lerp3(WH,SD,Math.abs(u)*.45+(v<-.3?.2:0)); if(ex==='choke'&&Math.abs(u)>.35) c=lerp3(c,[.72,.25,.22],.35); const ir=Math.hypot(x+.5-e,y+.5-E-.3),irR=wide?2.5:3,pu=wide?.9:1.3; if(ir<irR) c=lerp3(IR,[0,0,0],ir>irR-.8?.5:.15); if(ir<pu) c=[.03,.02,.02]; put(I,x,y,c,1); }
      put(I,e-1,E-1,[.97,.95,.92],.9);
      for(let x=e-8;x<=e+8;x++){ const u=(x+.5-e)/7.5; if(Math.abs(u)>1) continue; const top=E-ry*(1-u*u); put(I,x,top-.5,DK,.95); put(I,x,top-1.5,DK,.45); put(I,x,E+ry*(1-u*u)+.6,lerp3(SK,SD,.7),.5); }
      softLine(I,e-7,E-ry-4,e+7,E-ry-4,'#000000',.16,1.4); } }
  // mouth
  const LP=F3(s.lip),LD=lerp3(LP,[0,0,0],.45);
  if(ex==='agony'){ const TE=s.teeth||'#d8cfba'; softEll(I,cx,MO+2,18,6.5,'#120303',1,.2); softRect(I,cx-15,MO-3,30,2.6,TE,1,.5); softRect(I,cx-13,MO+4.5,26,2.6,TE,.95,.5);
    for(const xx of [-10,-5,0,5,10]) softLine(I,cx+xx,MO-3,cx+xx,MO+7,'#2a0a08',.55,.8); softLine(I,cx-19,MO-4,cx+19,MO-4,s.lip,.85,1.4); softLine(I,cx-17,MO+8.5,cx+17,MO+8.5,s.lip,.85,1.6);
    for(const sx of [-1,1]) softLine(I,cx+sx*19,MO-4,cx+sx*22,MO+3,'#000000',.3,1.2); } /* teeth bared, lips pulled back hard */
  else if(ex==='shock'||ex==='choke'){ const ch=ex==='choke'; softEll(I,cx,MO+4,ch?8.5:7,ch?7.5:9,'#140303',1,.2); softEll(I,cx,MO+7,4.5,4,'#3a0e0a',.8,.3); softRect(I,cx-5,MO-5,10,2,s.teeth||'#d8cfba',.85,.5);
    softLine(I,cx-8,MO-6,cx+8,MO-6,s.lip,.9,1.4); softLine(I,cx-7,MO+13,cx+7,MO+13,s.lip,.85,1.6);
    if(ch){ softEll(I,cx,MO+9,7,2.2,'#5e0909',.85,.4); softLine(I,cx-7,MO+4,cx-9,MO+26,'#5e0909',.95,2.2); softLine(I,cx+6,MO+5,cx+8,MO+30,'#4a0606',.9,1.8); softLine(I,cx-1,MO+12,cx,MO+34,'#5e0909',.8,1.4); } } /* jaw hanging; choking brings blood up */
  else if(ex==='hurt'){ softEll(I,cx,MO+1,14,4.5,'#160404',1,.2); softRect(I,cx-11,MO-2,22,2,s.teeth||'#d8cfba',1,.5); softRect(I,cx-9,MO+3,18,2,s.teeth||'#d8cfba',.9,.5); for(const xx of [-6,0,6]) softLine(I,cx+xx,MO-2,cx+xx,MO+4,'#2a0a08',.6,.8); softLine(I,cx-14,MO-3,cx+14,MO-3,s.lip,.8,1.4); softLine(I,cx-12,MO+6,cx+12,MO+6,s.lip,.8,1.6); }
  else if(ex==='beg'){ softEll(I,cx,MO+2,7.5,6.5,'#160404',1,.2); softEll(I,cx,MO+3.5,5,3.5,'#3a0e0a',.8,.3); softRect(I,cx-5,MO-4,10,2,'#d8cfba',.9,.5); softEll(I,cx,MO+2,9,8.5,s.lip,.0); softLine(I,cx-6,MO-5,cx+6,MO-5,s.lip,.9,1.4); softLine(I,cx-6,MO+9,cx+6,MO+9,s.lip,.9,1.6); }
  else { for(let x=-13;x<=13;x++){ const u=x/13,bow=Math.abs(x)<3?.6:0,up=(1-u*u)*3-bow,lo=(1-u*u)*3.6;
      for(let y=MO-up;y<=MO;y+=.5) put(I,cx+x,y,lerp3(LP,LD,.35),.85); for(let y=MO;y<=MO+lo;y+=.5) put(I,cx+x,y,lerp3(LP,[1,1,1],(y-MO<1.5&&Math.abs(x)<6)?.15:0),.85); put(I,cx+x,MO,LD,.95); }
    if(s.gold) softEll(I,cx+4,MO+.5,1.2,1,'#d4a838',1,.4); }
  // tears, blood, injuries
  const BL='#5e0909',BLD='#360404';
  if(ex==='beg') for(const sx of [-1,1]) softLine(I,cx+sx*15,E+4,cx+sx*14,E+22,'#c8dae6',.45,1.2);
  if(ex==='agony') for(const sx of [-1,1]) softLine(I,cx+sx*15,E+6,cx+sx*15,E+20,'#c8dae6',.4,1.1);
  if(ex==='hurt'||ex==='beg'||ex==='agony'||ex==='choke'){ softLine(I,cx-4,NO,cx-4,MO-3,BL,.9,1.8); softLine(I,cx+4,NO,cx+5,NO+8,BL,.85,1.4); bloodSoak(I,cx+22,BR-12,4,3,seed+3); }
  if(s.cut){ softLine(I,cx+16,BR-6,cx+26,BR-8,BLD,.95,1.3); softLine(I,cx+20,BR-6,cx+20,BR+2,BL,.7,1); }
  if(s.bruise) blob(I,cx+20,E+1,12,8,.4,'#5a3a50');
  if(s.splitlip) softEll(I,cx+5,MO+1,2,2,BL,.9);
  if(s.headwound){ bloodSoak(I,cx+40,16,7,6,seed+4); for(const [x,len] of [[36,44],[41,30],[45,52],[49,22]]) softLine(I,cx+x,20,cx+x+2,20+len,BL,.85,1.4); }
  if(s.scar) softLine(I,cx-32,E-6,cx-16,E+26,'#e0b090',.45,1.2);
  if(s.acne){ const r2=rng(seed+5); for(let i=0;i<12;i++) softEll(I,cx-30+r2()*60,E+8+r2()*30,1.2,1.2,'#b85a48',.5,.5); }
  if(s.spots) for(const [x,y] of [[-16,14],[24,22],[40,E+12]]) blob(I,cx+x,y,2.5,2,.35,'#7a4a30');
  if(s.glasses){ const G_=s.glasses; for(const sx of [-1,1]){ const e=cx+sx*18; softRect(I,e-11,E-7,22,14,'#a8c0c8',.08,1); for(const [a,b,c,d] of [[e-11,E-7,e+11,E-7],[e-11,E+7,e+11,E+7],[e-11,E-7,e-11,E+7],[e+11,E-7,e+11,E+7]]) softLine(I,a,b,c,d,G_,.95,1); }
    softLine(I,cx-7,E-2,cx+7,E-2,G_,.95,1); softLine(I,cx+29,E-3,cx+64,E-1,G_,.9,1); softLine(I,cx-29,E-3,cx-64,E-1,G_,.9,1); }
  if(s.post) s.post(I,ex,T); /* per-face extras (lines, freckles, make-up): opt-in, see the team in src/frontera/45-cast.js */
  return toTex(I);
}
function hair3(I,s,T){
  const st=s.hair; if(!st) return; const C=F3(s.hairC||s.skin),SK=F3(s.skin),seed=s.seed,HL=(s.hairFront??15)*2;
  const row=x=>{ const t=T(x); if(t<.18) return HL; if(t<.3) return HL+(t-.18)/.12*14; if(t<.42) return (s.sideburn??38)*2; if(t<.58) return 54; if(t<.74) return (s.behind??44)*2; return (s.nape??52)*2; };
  for(let x=0;x<I.w;x++){ const h=row(x)+2.5*fbm(x*.15,0,seed+11);
    if(st==='fringe'){ const t=T(x); if(t<.3) continue; const top=44+3*fbm(x*.2,1,seed),bot=t>.72?92:76; for(let y=top|0;y<bot;y++){ const a=Math.min(1,(y-top)/3)*Math.min(1,(bot-y)/4); const v=1+.25*fbm(x*.5,y*.06,seed+2); put(I,x,y,[C[0]*v,C[1]*v,C[2]*v],.9*a); } continue; }
    for(let y=0;y<h+2;y++){ const a=Math.min(1,(h-y)/2.5); if(a<=0) continue; let v;
      if(st==='buzz'){ v=.85+.2*fbm(x*.9,y*.9,seed); a2(I,x,y,lerp3(C,SK,.18+.15*Math.max(0,fbm(x*.6,y*.6,seed+1))),v,a*.95); continue; }
      if(st==='shaved'){ v=.92+.1*fbm(x*.8,y*.8,seed); a2(I,x,y,lerp3(SK,[0,0,0],.18),v,a*.6); continue; }
      if(st==='slick') v=.8+.35*fbm(x*.08+y*.04,y*.5,seed)+.25*sst(.5,.9,Math.sin((x*.3+y*.9)*.35));
      else if(st==='long') v=.8+.35*fbm(x*.7,y*.05,seed);
      else v=.85+.3*fbm(x*.5,y*.08,seed);
      let c=C; if(st==='bleach') c=lerp3(C,[.35,.25,.15],sst(h-8,h,y)*.5);
      const sheen=Math.exp(-(((y-10)/5)**2))*(T(x)<.45?.25:.1); a2(I,x,y,c,v+sheen,a); } }
  if(st==='shaved'||st==='fringe') blob(I,128,10,24,7,.18);
}
const a2=(I,x,y,c,v,a)=>put(I,x,y,[c[0]*v,c[1]*v,c[2]*v],a);
function beard3(I,s,T){
  const b=s.beard; if(!b) return; const C=F3(s.beardC),cx=128,MO=FL3.mouth,seed=s.seed,r=rng(seed+21);
  for(let y=66;y<128;y++) for(let x=0;x<256;x++){ const t=T(x); if(t>.44) continue; const dx=Math.abs(x+.5-cx);
    const lips=y>=MO-3&&y<=MO+5&&dx<14, must=y>=MO-8&&y<=MO-3&&dx<16, jaw=y>=(t>.3?74:MO+4)&&!lips, chin=y>=MO+5&&dx<12;
    let d=0;
    if(b==='stubble') d=(jaw||must)&&!lips?.5*sst(.44,.3,t):0;
    else if(b==='full') d=(jaw||must)&&!lips?1:0;
    else if(b==='goatee') d=(must||(chin&&!lips)||(y>=MO-3&&y<=MO+10&&Math.abs(dx-14)<2.5))?1:0;
    else if(b==='mustache') d=(y>=MO-6&&y<=MO-3&&dx<13)?1:0;
    if(!d) continue;
    if(b==='stubble'){ if(r()<d) put(I,x,y,C,.55); }
    else { const v=.85+.3*fbm(x*.6,y*.4,seed+5); put(I,x,y,[C[0]*v,C[1]*v,C[2]*v],.92); } }
}
const FACE={}; for(const k in HEADS) FACE[k]={fight:paintHead(HEADS[k],'fight'),hurt:paintHead(HEADS[k],'hurt'),beg:paintHead(HEADS[k],'beg'),sleep:paintHead(HEADS[k],'sleep'),
  agony:paintHead(HEADS[k],'agony'),shock:paintHead(HEADS[k],'shock'),choke:paintHead(HEADS[k],'choke')}; /* agony: blade in him; shock: just lost something; choke: throat or strangled */
const SKIN={};
function skinOf(k){ if(!SKIN[k]){ const s=HEADS[k]; SKIN[k]={ hand:flat(16,16,s.seed+43,s.skin,'skin',{grime:0,decor:I=>{ for(const x of [3,7,11]) blob(I,x,3,1.6,1.2,-.14); blob(I,8,14,8,2,-.18); blob(I,8,7,5,4,.06); }}) }; } return SKIN[k]; }

/* Clothing, painted. Torso 128x256 (neck at top, belt at row 198, pants below), arms 64x128 (shoulder top, elbow row 75, wrist at bottom),
   legs 64x128 (hip top, knee row 69, ankle at bottom). Front of the body is the middle column. */
const T3={neck:29,sh:54,chest:102,nav:173,belt:198};
const skinZ=k=>{ const s=HEADS[k]; return [s.bal||s.skin,s.bal?'knit':'skin',0]; };
function torsoP(k,seed,zone,o){ return garment(128,256,seed,(x,y)=>y<T3.neck?skinZ(k):zone(x,y),Object.assign({folds:18},o)); }
const armP=(seed,zone,o)=>garment(64,128,seed,zone,Object.assign({folds:9,dir:'h'},o));
const legP=(seed,zone,o)=>garment(64,128,seed,zone,Object.assign({folds:10,dir:'v'},o));
const neckShadow=I=>{ for(let x=0;x<128;x++) for(let y=T3.neck-6;y<T3.neck+1;y++) mul(I,x,y,.82+.03*(T3.neck-y)); };
const sideSeams=(I,y0,y1,st)=>{ seam(I,32,y0,32,y1,st); seam(I,96,y0,96,y1,st); };
const beltI=(I,col,buckle)=>{ softRect(I,0,T3.belt-3,128,7,col,1,.6); softLine(I,0,T3.belt-3,128,T3.belt-3,'#ffffff',.12,1); softRect(I,60,T3.belt-3,9,7,buckle,1,.6); softRect(I,62,T3.belt-1,5,3,col,.8,.5); };
/* Ray: SWAT officer left for dead */
const NV='#252e3f',NVD='#181e29';
const tRayTorso=torsoP('ray',301,(x,y)=>y<T3.belt-3?[NV,'twill']:[NV,'twill',.6,.92],{decor:I=>{ neckShadow(I);
  softRect(I,0,T3.neck,128,6,NVD,.8,1); softEll(I,64,T3.neck+4,7,9,HEADS.ray.skin,1,.3); blob(I,64,T3.neck+10,5,4,-.25);
  seam(I,64,T3.neck+14,64,T3.belt-4); for(let y=T3.neck+24;y<T3.belt;y+=24) softEll(I,66.5,y,1.4,1.4,'#0c1018',.9);
  sideSeams(I,T3.neck,T3.belt); beltI(I,'#141416','#5a5a5e'); seam(I,64,T3.belt+5,64,T3.belt+40);
  bloodSoak(I,98,140,8,14,302); bloodSoak(I,90,176,5,6,303); }});
const rayArm=torn=>armP(torn?306:304,(x,y)=>torn&&y>12&&y<52+(Math.sin(x*1.3)*2|0)?[HEADS.ray.skin,'skin',0]:[NV,'twill'],{decor:I=>{
  if(torn){ for(let x=0;x<64;x++) softLine(I,x,51+Math.sin(x*1.3)*2,x+1,52+Math.sin(x*1.3)*2,'#1a2030',.8,1.4); bloodSoak(I,24,26,6,8,307); blob(I,42,34,5,4,.35,'#8a5040'); }
  else { softRect(I,40,18,12,14,'#1a2030',.95,1); softRect(I,42,21,8,2,'#c9b07a',.9,.5); softRect(I,42,25,8,4,'#d8d6cc',.9,.5); blob(I,30,90,4,6,.6,'#4a0606'); }
  softRect(I,0,116,64,12,NVD,.55,2); seam(I,16,0,16,128); }});
const tRayArmR=rayArm(false), tRayArmL=rayArm(true);
const tRayLeg=legP(308,()=>[NV,'twill'],{decor:I=>{ for(const x of [4,42]){ softRect(I,x,30,17,24,NVD,.6,1); softRect(I,x,30,17,5,'#2d374b',.9,.6); seam(I,x,35,x+17,35); }
  seam(I,48,0,48,128); seam(I,16,0,16,128); softRect(I,0,112,64,16,NVD,.5,3); bloodSoak(I,30,22,5,10,309); }});
const tRayVest=garment(128,64,311,()=>['#1d2331','cordura',.5],{folds:6,decor:I=>{
  for(let y=34;y<58;y+=8) for(let x=2;x<128;x+=8) if((x>>3)%4!==3){ softRect(I,x,y,6,4,'#141924',.9,.4); softLine(I,x,y,x+6,y,'#3a445a',.4,.8); }
  for(const cx of [64,0,128]){ softRect(I,cx-24,7,48,15,'#161b26',.95,.8); softLine(I,cx-24,7,cx+24,7,'#3a445a',.35,.8); softLine(I,cx-24,22,cx+24,22,'#3a445a',.35,.8); } /* blank ID panels: no lettering */
  softRect(I,0,0,128,3,'#10141c',1,1); softRect(I,0,61,128,3,'#10141c',1,1); bloodSoak(I,50,30,3,4,312); }});
const tRayBoot=garment(64,32,313,()=>['#17181a','leather',.3],{folds:3,decor:I=>{ softRect(I,0,22,64,10,'#0b0b0c',1,1); for(const y of [4,9,14]) softLine(I,26,y,38,y,'#3a3a3e',.8,1); softRect(I,24,0,16,4,'#2a2a2e',.8,1); }});
const tTape=flat(16,16,313,HEADS.ray.skin,'skin',{decor:I=>{ blob(I,5,4,3,2,.8,'#5c0a0a'); blob(I,11,6,2,2,.7,'#3e0606'); blob(I,8,12,6,2,-.2); }});
const tRayGlove=flat(16,16,314,'#17181b','leather',{decor:I=>{ for(const x of [3,7,11]) softLine(I,x,4,x,13,'#2e3036',.6,1); }});
const tPad=flat(16,16,315,'#141619','cordura',{decor:I=>{ softRect(I,2,2,12,4,'#2a2d33',.8,.6); softRect(I,2,10,12,2,'#2a2d33',.8,.6); }});
const tNavyCollar=flat(64,16,316,NVD,'twill');
/* Corner boy: faded red tracksuit */
const RED='#8e2a25',WS='#e2ddd2';
const tCornerTorso=torsoP('corner',321,(x,y)=>y<T3.belt-14?[RED,'poly']:y<T3.belt+2?[RED,'knit',.3,.82]:[RED,'poly',.6],{decor:I=>{ neckShadow(I);
  softRect(I,0,T3.neck,128,10,WS,1,1); softRect(I,0,T3.neck+9,128,2,'#000000',.15,1); softLine(I,64,T3.neck+10,64,T3.belt-15,'#cfc9bd',1,1.4); softRect(I,61,T3.neck+12,6,8,'#b8b2a6',1,.6);
  for(const x of [29,35,93,99]) softLine(I,x,T3.neck+10,x,T3.belt-15,WS,.95,1.3); softRect(I,40,T3.sh+10,6,4,WS,.9,.6);
  for(const x of [30,34,94,98]) softLine(I,x,T3.belt+4,x,256,WS,.95,1.2); softLine(I,60,T3.belt+3,60,T3.belt+18,WS,.9,1); softLine(I,68,T3.belt+3,67,T3.belt+16,WS,.9,1); bloodSoak(I,74,120,3,4,322); }});
const tCornerArm=armP(323,(x,y)=>y<114?[RED,'poly']:[RED,'knit',.2,.82],{decor:I=>{ for(const x of [13,18,45,50]) softLine(I,x,0,x,114,WS,.95,1.2); }});
const tCornerLeg=legP(325,(x,y)=>y<120?[RED,'poly']:[RED,'knit',.2,.82],{decor:I=>{ for(const x of [13,18,45,50]) softLine(I,x,0,x,120,WS,.95,1.2); }});
const tSneakerW=garment(64,32,327,()=>['#e0dcd2','leather',.2],{folds:2,grime:.18,decor:I=>{ softRect(I,0,23,64,9,'#aaa69c',1,1); for(const y of [7,12]) softLine(I,26,y,38,y,'#2a2a2c',.8,1); softRect(I,44,10,10,4,'#c0392f',.9,1); softRect(I,10,10,10,4,'#c0392f',.9,1); }});
const tRibWhite=flat(64,16,328,WS,'knit');
/* Cutter: brown leather jacket open over a stained vest, dark jeans */
const LE='#3f2b1f',VEST='#c4b68c';
const tCutterTorso=torsoP('cutter',331,(x,y)=>{ const open=Math.abs(x-64)<(y<T3.neck+30?14:19); return y>T3.belt+2?['#2a3140','denim',.7]:(open&&y<T3.belt-6)?[VEST,'cotton',.8]:[LE,'leather']; },{decor:I=>{ neckShadow(I);
  softEll(I,64,T3.neck+6,11,14,HEADS.cutter.skin,1,.3); softLine(I,64-11,T3.neck+18,64,T3.neck+20,'#9a8a60',.6,1.4); softLine(I,64+11,T3.neck+18,64,T3.neck+20,'#9a8a60',.6,1.4);
  for(const s of [-1,1]){ softLine(I,64+s*14,T3.neck,64+s*19,T3.neck+30,'#2a1c13',.9,2); softLine(I,64+s*19,T3.neck+30,64+s*19,T3.belt-6,'#2a1c13',.85,1.6); softLine(I,64+s*21,T3.neck+30,64+s*21,T3.belt-6,'#8a8a86',.35,1); softLine(I,64+s*14,T3.neck,64+s*30,T3.neck+18,'#2a1c13',.8,1.5); }
  blob(I,58,110,6,8,.45,'#8a7a4a'); blob(I,70,150,5,5,.4,'#7a6a3a'); bloodSoak(I,66,128,4,6,332);
  for(const x of [36,92]) softLine(I,x,T3.neck+20,x,T3.belt-10,'#6a4c38',.35,2); sideSeams(I,T3.neck,T3.belt-6); softRect(I,0,T3.belt-8,128,6,'#2a1c13',.8,1); beltI(I,'#3a2616','#a89a6a'); seam(I,64,T3.belt+5,64,T3.belt+40,'#9a7a40'); }});
const tCutterArm=armP(335,(x,y)=>[LE,'leather'],{decor:I=>{ softLine(I,40,10,42,100,'#6a4c38',.3,2); softRect(I,0,116,64,12,'#2a1c13',.6,2); softLine(I,44,104,44,128,'#9a9a96',.7,1); }});
const tCutterLeg=legP(337,()=>['#2a3140','denim'],{decor:I=>{ seam(I,48,0,48,128,'#a8834a'); seam(I,16,0,16,128,'#a8834a'); blob(I,32,40,9,20,.12,'#6a7a9a'); blob(I,32,72,7,6,.15,'#6a7a9a'); softRect(I,0,118,64,10,'#1f2530',.6,2); }});
const tBlackBoot=garment(64,32,339,()=>['#1d1d1f','leather',.3],{folds:3,decor:I=>{ softRect(I,0,22,64,10,'#0d0d0e',1,1); softRect(I,24,1,16,4,'#2e2e30',.8,1); softLine(I,28,12,36,12,'#3a3a3c',.6,1); }});
const tPonytail=flat(16,32,340,'#16110e','cotton',{decor:I=>{ for(const x of [3,7,11]) softLine(I,x,0,x+1,32,'#2e241c',.6,1); }});
/* Gunman: 90s print shirt, short sleeves, black slacks */
const PR='#2c5550';
function printI(I,x0,y0,w,h,seed){ const r=rng(seed); for(let i=0;i<w*h/90;i++){ const x=x0+r()*w,y=y0+r()*h,c=r()>.5?'#4f8277':'#1d3a37'; softEll(I,x,y,2.5+r()*3,1.5+r()*2,c,.85,.4); if(r()<.3) softEll(I,x+3,y+2,1,1,'#b8964a',.9,.4); } }
const tGunTorso=torsoP('gunman',341,(x,y)=>y<T3.belt-3?[PR,'cotton']:['#19191c','wool',.6],{decor:I=>{ neckShadow(I); printI(I,0,T3.neck,128,T3.belt-T3.neck-3,342);
  softEll(I,64,T3.neck+8,11,20,HEADS.gunman.skin,1,.25); softLine(I,55,T3.neck+18,64,T3.neck+24,'#c9a23a',.9,1.2); softLine(I,73,T3.neck+18,64,T3.neck+24,'#c9a23a',.9,1.2);
  for(const s of [-1,1]) softLine(I,64+s*10,T3.neck,64+s*20,T3.neck+12,'#1d3a37',.9,2.4); seam(I,64,T3.neck+28,64,T3.belt-4); for(let y=T3.neck+34;y<T3.belt;y+=22) softEll(I,66,y,1.3,1.3,'#e6dcc4',.9);
  for(let x=0;x<128;x+=6) softLine(I,x,T3.belt-14,x+2,T3.belt-4,'#000000',.15,1.2); beltI(I,'#0e0e10','#c9a23a'); seam(I,64,T3.belt+5,64,T3.belt+40);
  /* shoulder holster painted into the shirt: straps over both shoulders front and back, a holster under his left arm, mag pouches under the right */
  const SR='#2a190f',SH='#5c3a24';
  for(const s of [-1,1]){ for(const [x0,x1] of [[64+s*18,64+s*25],[s<0?14:114,s<0?25:103]]){ softLine(I,x0,T3.neck-2,x1,T3.chest+16,SR,.95,3.6); softLine(I,x0+.9,T3.neck,x1+.9,T3.chest+15,SH,.5,1); }
    const sx=s>0?96:32; softLine(I,64+s*25,T3.chest+16,sx-s*3,T3.chest+8,SR,.9,3.2); softLine(I,s<0?25:103,T3.chest+16,sx+s*3,T3.chest+8,SR,.9,3.2); }
  softLine(I,0,T3.sh+26,25,T3.sh+24,SR,.9,3); softLine(I,103,T3.sh+24,128,T3.sh+26,SR,.9,3);
  softRect(I,89,T3.sh+12,15,42,'#22140c',.97,2); softRect(I,91,T3.sh+13,11,9,'#121214',.92,1); softLine(I,90,T3.sh+24,103,T3.sh+24,'#4a2e1c',.55,1);
  for(const y of [T3.sh+20,T3.sh+34]){ softRect(I,26,y,12,12,'#22140c',.95,1.5); softLine(I,27,y+2,37,y+2,'#4a2e1c',.5,1); } }});
const tGunArm=armP(344,(x,y)=>y<44?[PR,'cotton']:[HEADS.gunman.skin,'skin',0],{decor:I=>{ printI(I,0,0,64,42,345); softRect(I,0,40,64,4,'#1d3a37',.9,1); blob(I,32,47,30,3,-.18);
  const r=rng(346); for(let i=0;i<80;i++){ const x=r()*64,y=50+r()*70; softLine(I,x,y,x+.6,y+1.4,'#7a5038',.35,.7); } blob(I,32,76,10,4,-.1); }});
const tGunLeg=legP(347,()=>['#19191c','wool'],{decor:I=>{ softLine(I,32,0,32,128,'#3a3a40',.5,1); softLine(I,0,0,0,128,'#3a3a40',.4,1); seam(I,48,0,48,128); seam(I,16,0,16,128); }});
const tShoeBlack=garment(64,32,349,()=>['#151517','leather',.2],{folds:2,grime:.05,decor:I=>{ softRect(I,0,24,64,8,'#0a0a0b',1,1); blob(I,32,10,12,4,.25); softLine(I,26,6,38,6,'#3a3a3e',.6,1); }});
const tStrapBrown=flat(8,16,350,'#3a2416','leather');
/* Doorman: black MA-1 bomber with the orange lining, black cargos */
const BK='#1d1e21';
const puff=(y,p)=>.9+.14*Math.sin(((y%p)/p)*Math.PI);
const tDoorTorso=torsoP('doorman',351,(x,y)=>y<T3.neck+14?['#151517','knit',.2]:y<T3.belt-14?[BK,'nylon',.5,puff(y-T3.neck,22)]:y<T3.belt+2?['#151517','knit',.2,.85]:['#212226','cotton',.7],{decor:I=>{ neckShadow(I);
  softRect(I,56,T3.neck,16,14,'#d8641c',1,.8); softLine(I,64,T3.neck+14,64,T3.belt-15,'#8a8e92',.9,1.2); softLine(I,66,T3.neck+14,66,T3.belt-15,'#d8641c',.85,1);
  for(let y=T3.neck+14;y<T3.belt-14;y+=22) softLine(I,0,y,128,y,'#000000',.25,1.5); for(const s of [-1,1]) softLine(I,64+s*22,T3.chest+30,64+s*30,T3.chest+60,'#000000',.4,1.6);
  blob(I,40,T3.chest,14,30,.18); seam(I,64,T3.belt+5,64,T3.belt+40); }});
const tDoorArm=armP(352,(x,y)=>y<112?[BK,'nylon',.5,puff(y,20)]:['#151517','knit',.2],{decor:I=>{ for(let y=0;y<112;y+=20) softLine(I,0,y,64,y,'#000000',.25,1.4); softRect(I,40,14,12,18,'#26272b',.95,1); softLine(I,40,15,52,15,'#8a8e92',.7,1); softRect(I,44,16,3,3,'#d8641c',.9,.5); }});
const tDoorLeg=legP(353,()=>['#212226','cotton'],{decor:I=>{ for(const x of [4,42]){ softRect(I,x,32,17,24,'#18191c',.6,1); softRect(I,x,32,17,5,'#2c2d31',.9,.6); } seam(I,48,0,48,128); seam(I,16,0,16,128); softRect(I,0,114,64,14,'#151618',.5,3); }});
const tKnitBlack=flat(64,16,355,'#151517','knit',{decor:I=>softRect(I,0,12,64,4,'#d8641c',.9,1)});
/* Enforcer: black long sleeve, olive plate vest, tactical pants */
const tEnfTorso=torsoP('enforcer',361,(x,y)=>y<T3.belt-3?['#1e2023','cotton']:['#2d2f32','twill',.7],{decor:I=>{ neckShadow(I); sideSeams(I,T3.neck,T3.belt); beltI(I,'#1a1b1d','#5a5c4c'); seam(I,64,T3.belt+5,64,T3.belt+40); }});
const tEnfArm=armP(363,()=>['#1e2023','cotton'],{decor:I=>{ softRect(I,40,16,14,14,'#2c2e24',.95,1); softRect(I,0,116,64,12,'#141518',.6,2); }});
const tEnfLeg=legP(365,()=>['#2d2f32','twill'],{decor:I=>{ for(const x of [4,42]){ softRect(I,x,26,17,26,'#232528',.7,1); softRect(I,x,26,17,5,'#383a3e',.9,.6); } seam(I,48,0,48,128); seam(I,16,0,16,128); softRect(I,0,114,64,14,'#1b1c1e',.5,3); }});
const tVest=garment(128,64,367,()=>['#4b4d3f','cordura',.5],{folds:6,decor:I=>{ for(let y=30;y<58;y+=8) for(let x=2;x<128;x+=8) if((x>>3)%4!==3){ softRect(I,x,y,6,4,'#383a2e',.9,.4); softLine(I,x,y,x+6,y,'#62644f',.4,.8); }
  softRect(I,40,5,48,18,'#3e4033',.9,1); softLine(I,40,5,88,5,'#6a6c58',.5,1); softRect(I,58,9,12,8,'#2e3026',.9,.6); softRect(I,0,0,128,3,'#2a2c22',1,1); softRect(I,0,61,128,3,'#2a2c22',1,1); }});
const tPouch=flat(16,16,368,'#3f4135','cordura',{decor:I=>{ softRect(I,0,0,16,4,'#2e3026',.9,.6); softLine(I,0,4,16,4,'#5a5c4c',.4,.8); }});
const tKnee=flat(16,16,369,'#131416','cordura',{decor:I=>{ softRect(I,2,2,12,5,'#2a2c2e',.9,.8); }});
const tGlove=tRayGlove;
/* Landlord: maroon cardigan, shirt and tie, grey slacks, slippers */
const CA='#5c2428';
const tLordTorso=torsoP('landlord',371,(x,y)=>{ const open=Math.abs(x-64)<13-Math.min(6,(y-T3.neck)/14); return y>T3.belt?['#5f5c56','wool',.6]:open?['#dcd8cc','cotton',.6]:y>T3.belt-12?[CA,'knit',.2,.85]:[CA,'knit',.8]; },{decor:I=>{ neckShadow(I);
  softRect(I,61,T3.neck+4,6,6,'#3e2716',1,.6); softLine(I,64,T3.neck+10,64,T3.nav-4,'#5a3a22',1,3.2); for(let y=T3.neck+16;y<T3.nav;y+=6) softLine(I,61,y,67,y+3,'#3e2716',.35,.8); softLine(I,64,T3.nav-4,64,T3.nav,'#3e2716',1,2);
  for(const s of [-1,1]) softLine(I,64+s*3,T3.neck,64+s*12,T3.neck+8,'#c8c2b4',1,2); for(let y=T3.chest-30;y<T3.belt-12;y+=24) softEll(I,48,y,1.8,1.8,'#c9b07a',1,.3);
  for(const x of [30,82]){ softRect(I,x,T3.nav-14,16,18,'#000000',.15,1); seam(I,x,T3.nav-14,x+16,T3.nav-14); } beltI(I,'#2a1e14','#8a7a5a'); seam(I,64,T3.belt+5,64,T3.belt+40); }});
const tLordArm=armP(373,(x,y)=>y<114?[CA,'knit',.7]:y<126?[CA,'knit',.2,.85]:['#dcd8cc','cotton',0]);
const tLordLeg=legP(374,()=>['#5f5c56','wool'],{decor:I=>{ softLine(I,32,0,32,128,'#77746c',.6,1); seam(I,48,0,48,128); seam(I,16,0,16,128); }});
const tSlipper=garment(64,32,376,(x,y)=>[((x>>2)+(y>>2))&1?'#6a4a32':'#5a3c28','wool',.2],{folds:2,decor:I=>softRect(I,0,24,64,8,'#2a1a10',1,1)});
const tWhite=flat(16,16,377,'#d8d4c8','cotton');
const tShirtCollar=flat(64,16,378,'#dcd8cc','cotton');

/* --- weapon textures --- */
const tGlass=tex(8,8,'#2c4a24',g=>{ R(g,'#5a8a48',1,0,1,8); grain(g,10,171); });
const tGlassJag=tex(16,16,'#2c4a24',g=>{ R(g,'#5a8a48',3,0,1,16); R(g,'#c9b98a',0,9,16,4); R(g,'#8a3020',5,10,6,2); for(let x=0;x<16;x++){ const cut=1+((x*7)%5); g.clearRect(x,0,1,cut); } grain(g,10,172); });
const tBladeBlood=tex(16,32,'#b4b8bc',g=>{ R(g,'#e2e6ea',0,0,3,32); grain(g,14,173); const r=rng(174); for(let i=0;i<22;i++) R(g,r()>.4?'#6e0d0d':'#4a0808',4+(r()*12|0),8+(r()*20|0),r()>.5?2:1,1); });
const tBlade=tex(8,16,'#b4b8bc',g=>{ R(g,'#e2e6ea',0,0,2,16); grain(g,12,175); });
const tAxeRed=cl(8,8,'#a8241c',12,176,g=>R(g,'#c9473a',0,0,8,1));
const tAxeHandle=cl(8,16,'#c9a36a',10,177,g=>{ R(g,'#9a7a48',0,0,8,1); R(g,'#9a7a48',3,4,1,8); });

/* ================= materials ================= */
const hex3=h=>Array.isArray(h)?h:[((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
function M(t=null,o={}){ return {tex:t,color:hex3(o.color??0xffffff),emis:hex3(o.emissive??0),unlit:o.unlit?1:0,rep:o.repeat||[1,1],cut:o.cut?1:0,dbl:!!o.double,nofog:o.nofog?1:0}; }
const F=(side,front,back=side,top=side,bottom=side)=>[side,side,top,bottom,front,back];
const mBlack=M(tBlack), mBlued=M(tBlued), mWood=M(tWood), mSteel=M(tSteel);

/* ================= renderer ================= */
const VS=`#version 300 es
precision highp float;
in vec3 position; in vec3 normal; in vec2 uv;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
uniform float uSnap, uAffine, uUnlit;
uniform vec2 uRes;
uniform vec3 uAmb, uDirDir, uDirCol;
uniform vec3 uPLPos[8]; uniform vec3 uPLCol[8]; uniform float uPLDist[8];
uniform float uFogNear, uFogFar;
in vec4 aRect; /* an atlas rectangle for a tiled texture (z>0), or, on the far field, the centre and radius of the tile it stands in for */
uniform float uFar, uFarSwap; uniform vec3 uFarEye;
out vec3 vAff; out vec3 vLight; out vec3 vView; out vec4 vRect;
void main(){
  vec4 wp = modelMatrix * vec4(position,1.0);
  vec3 n = normalize(mat3(modelMatrix) * normal);
  vec3 L = uAmb + uDirCol * max(dot(n, normalize(uDirDir)), 0.0);
  if(uUnlit < 0.5) for(int i=0;i<8;i++){
    vec3 d = uPLPos[i] - wp.xyz; float dist = length(d);
    float a = clamp(1.0 - dist / uPLDist[i], 0.0, 1.0); a *= a;
    L += uPLCol[i] * a * max(dot(n, d / max(dist, 1e-4)), 0.0);
  }
  vLight = mix(L, vec3(1.0), uUnlit);
  vec4 vp = viewMatrix * wp;
  vec4 cp = projectionMatrix * vp;
  if(uSnap > 0.01){ vec2 g = uRes * 0.5 * uSnap; cp.xy = floor(cp.xy / cp.w * g + 0.5) / g * cp.w; } /* uSnap scales the grid: 1 = PS1, higher = finer, lighter */
  vView = vp.xyz; /* fog goes by true distance (per pixel), the same distance the culling uses, so nothing pops at the edges of a wide headset view */
  float aw = mix(1.0, cp.w, clamp(uAffine, 0.0, 1.0)); vAff = vec3(uv * aw, aw); /* uAffine 0..1: how much of the PS1 texture warp */
  gl_Position = cp;
  vRect = uFar > 0.5 ? vec4(0.0) : aRect;
  /* the far field: a stand-in only shows while the real tile it stands in for is too far to be drawn (the same test the CPU uses) */
  if(uFar > 0.5 && length(uFarEye - aRect.xyz) - aRect.w <= uFarSwap) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const FS=`#version 300 es
precision highp float;
uniform sampler2D map; uniform float uHasMap, uCut;
uniform vec3 uColor, uEmissive, uFogCol; uniform vec2 uRepeat; uniform float uNoFog, uFogNear, uFogFar, uSkyFade;
in vec3 vAff; in vec3 vLight; in vec3 vView; in vec4 vRect;
out vec4 outColor;
void main(){
  vec2 uv = vAff.xy / vAff.z * uRepeat;
  if(vRect.z > 0.0) uv = vRect.xy + fract(uv) * vRect.zw; /* a tiled texture living in the atlas: wrap inside its own rectangle */
  vec4 t = uHasMap > 0.5 ? texture(map, uv) : vec4(1.0);
  if(uCut > 0.5 && t.a < 0.5) discard;
  vec3 c = t.rgb * uColor * vLight + t.rgb * uEmissive;
  float f = clamp((length(vView) - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0) * (1.0 - uNoFog); /* uNoFog: the sky and things in it (a backdrop past the fog) */
  /* uSkyFade: on a level with a sky, the last stretch of the fog dissolves into the sky already drawn behind (blended), instead of
     leaving a black cut-out that vanishes when it's culled */
  outColor = vec4(mix(c, uFogCol, f), 1.0 - uSkyFade * smoothstep(0.8, 1.0, f));
}`;
const PVS=`#version 300 es
out vec2 vUv;
void main(){ vec2 p = vec2(float((gl_VertexID<<1)&2), float(gl_VertexID&2)); vUv = p; gl_Position = vec4(p*2.0-1.0, 0.0, 1.0); }`;
const PFS=`#version 300 es
precision highp float;
uniform sampler2D tScene; uniform vec2 uRes; uniform float uDither;
in vec2 vUv; out vec4 outColor;
float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
void main(){
  vec2 px = floor(vUv * uRes);
  vec3 c = texture(tScene, (px + 0.5) / uRes).rgb;
  if(uDither > 0.5){ float L = 31.0; c += (bayer4(px) - 0.5) / L; c = floor(c * L + 0.5) / L; }
  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
function program(vs,fs,attribs){ const p=gl.createProgram();
  for(const [src,type] of [[vs,gl.VERTEX_SHADER],[fs,gl.FRAGMENT_SHADER]]){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); gl.attachShader(p,s); }
  (attribs||[]).forEach((a,i)=>gl.bindAttribLocation(p,i,a)); gl.linkProgram(p); if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const loc={}; const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS); for(let i=0;i<n;i++){ const u=gl.getActiveUniform(p,i); loc[u.name.replace('[0]','')]=gl.getUniformLocation(p,u.name); } return {p,loc}; }
let MAIN,POST;
try{ MAIN=program(VS,FS,['position','normal','uv','aRect']); POST=program(PVS,PFS); } catch(e){ fail('The renderer could not start: '+e.message); return; }
const emptyVAO=gl.createVertexArray();
let texFilter=gl.NEAREST, texMips=false; const ANISO=gl.getExtension('EXT_texture_filter_anisotropic');
function glTex(t){
  if(!t.glt){ t.glt=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t.glt); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,t.c);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT); t.f=-1; }
  if(t.smooth){ if(t.f!==-2){ gl.bindTexture(gl.TEXTURE_2D,t.glt); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      if(ANISO) gl.texParameterf(gl.TEXTURE_2D,ANISO.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(ANISO.MAX_TEXTURE_MAX_ANISOTROPY_EXT))); t.f=-2; } return t.glt; } /* lettering: mipmapped, so it reads at a distance instead of shimmering */
  if(texMips&&!t.nomip){ if(t.f!==-3){ gl.bindTexture(gl.TEXTURE_2D,t.glt); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      if(ANISO) gl.texParameterf(gl.TEXTURE_2D,ANISO.TEXTURE_MAX_ANISOTROPY_EXT,4); t.f=-3; } return t.glt; } /* opt-in (London): crisp texels up close, no shimmer far away */
  if(t.f!==texFilter){ gl.bindTexture(gl.TEXTURE_2D,t.glt); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,texFilter); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,texFilter); t.f=texFilter; }
  return t.glt; }
/* repaint a canvas texture in place (the signs, once their fonts have loaded) */
function retex(t){ if(!t.glt) return; gl.bindTexture(gl.TEXTURE_2D,t.glt); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,t.c); t.f=-1; }
function upload(g){ g.vao=gl.createVertexArray(); gl.bindVertexArray(g.vao); g.bufs=[];
  [[g.P,3],[g.Nm,3],[g.T,2],...(g.R?[[g.R,4]]:[])].forEach(([arr,size],i)=>{ const b=gl.createBuffer(); g.bufs.push(b); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW); gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i,size,gl.FLOAT,false,0,0); });
  const ib=gl.createBuffer(); g.bufs.push(ib); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(g.I),gl.STATIC_DRAW); gl.bindVertexArray(null); }
function disposeTree(n){ if(n.mesh){ const g=n.mesh.geo; if(g.temp&&g.vao){ gl.deleteVertexArray(g.vao); for(const b of g.bufs) gl.deleteBuffer(b); g.vao=null; } } for(const k of n.kids) disposeTree(k); }
const L={amb:[.1,.1,.1],dirDir:[0,1,0],dirCol:[0,0,0],plPos:new Float32Array(24),plCol:new Float32Array(24),plDist:new Float32Array([1,1,1,1,1,1,1,1]),fog:[0,0,0],fogNear:8,fogFar:30};
function setLights(o){ L.amb=o.amb; L.dirDir=o.dir; L.dirCol=o.dirCol; L.fog=o.fog; L.fogNear=o.fogNear; L.fogFar=o.fogFar; L.plPos.fill(0); L.plCol.fill(0); L.plDist.fill(1);
  o.pl.forEach((pl,i)=>{ L.plPos.set(pl[0],i*3); L.plCol.set(pl[1],i*3); L.plDist[i]=pl[2]; }); }
let fb=null,fbTex=null,fbDepth=null,fbW=0,fbH=0;
function ensureFB(w,h){ if(w===fbW&&h===fbH) return; fbW=w; fbH=h;
  if(!fb){ fb=gl.createFramebuffer(); fbTex=gl.createTexture(); fbDepth=gl.createRenderbuffer(); }
  gl.bindTexture(gl.TEXTURE_2D,fbTex); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,k,gl.NEAREST);
  for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);
  gl.bindRenderbuffer(gl.RENDERBUFFER,fbDepth); gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);
  gl.bindFramebuffer(gl.FRAMEBUFFER,fb); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,fbTex,0); gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,fbDepth); gl.bindFramebuffer(gl.FRAMEBUFFER,null); }
const view=m4.make(),proj=m4.make(); let curCull=null,curMat=null,curTex=null; const viewShift=[0,0];
/* frustum culling: one bounding sphere per geometry (skinned bodies and the dynamic blood meshes are never culled), tested against
   the current eye's clip planes and the fog distance. Material state is only re-sent when it actually changes. */
const FR=new Float32Array(24),VPm=m4.make(); let cullOn=false,cullEye=[0,0,0],cullFar=1e9,swapEye=[0,0,0],swapD=1e9;
/* near/far swap: a real tile (g.dsph, its tile's sphere) is drawn while that sphere is within swapD of the head; its far-field stand-in
   takes over past that, decided in the vertex shader with the same numbers. One eye position for both eyes, so they swap together */
function setSwap(eye,d){ swapEye=eye; swapD=d; }
function setCull(eye,far){ m4.mul(VPm,proj,view); const m=VPm;
  const rows=[[m[3]+m[0],m[7]+m[4],m[11]+m[8],m[15]+m[12]],[m[3]-m[0],m[7]-m[4],m[11]-m[8],m[15]-m[12]],[m[3]+m[1],m[7]+m[5],m[11]+m[9],m[15]+m[13]],[m[3]-m[1],m[7]-m[5],m[11]-m[9],m[15]-m[13]],[m[3]+m[2],m[7]+m[6],m[11]+m[10],m[15]+m[14]],[m[3]-m[2],m[7]-m[6],m[11]-m[10],m[15]-m[14]]];
  rows.forEach((r,i)=>{ const l=Math.hypot(r[0],r[1],r[2])||1; FR[i*4]=r[0]/l; FR[i*4+1]=r[1]/l; FR[i*4+2]=r[2]/l; FR[i*4+3]=r[3]/l; }); cullOn=true; cullEye=eye; cullFar=far; }
function geoBounds(g){ if(g.bs) return g.bs; const P=g.P; let x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9; for(let i=0;i<P.length;i+=3){ if(P[i]<x0)x0=P[i]; if(P[i]>x1)x1=P[i]; if(P[i+1]<y0)y0=P[i+1]; if(P[i+1]>y1)y1=P[i+1]; if(P[i+2]<z0)z0=P[i+2]; if(P[i+2]>z1)z1=P[i+2]; }
  const c=[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2]; let r=0; for(let i=0;i<P.length;i+=3) r=Math.max(r,Math.hypot(P[i]-c[0],P[i+1]-c[1],P[i+2]-c[2])); return g.bs={c,r}; }
function culled(n,g){ if(!cullOn||g.noCull||!g.P.length) return false; const b=geoBounds(g),w=n.world,c=b.c;
  const x=w[0]*c[0]+w[4]*c[1]+w[8]*c[2]+w[12],y=w[1]*c[0]+w[5]*c[1]+w[9]*c[2]+w[13],z=w[2]*c[0]+w[6]*c[1]+w[10]*c[2]+w[14];
  const r=b.r*Math.max(Math.hypot(w[0],w[1],w[2]),Math.hypot(w[4],w[5],w[6]),Math.hypot(w[8],w[9],w[10]));
  if(g.dsph){ const s=g.dsph.c; if(Math.hypot(s[0]-swapEye[0],s[1]-swapEye[1],s[2]-swapEye[2])-g.dsph.r>swapD) return true; }
  else if(!g.noDist&&Math.hypot(x-cullEye[0],y-cullEye[1],z-cullEye[2])-r>cullFar) return true;
  for(let i=0;i<24;i+=4) if(FR[i]*x+FR[i+1]*y+FR[i+2]*z+FR[i+3]<-r) return true; return false; }
function runsOf(mesh){ if(mesh.runs) return mesh.runs; const runs=[]; const g=mesh.geo;
  if(mesh.mats.length===1){ runs.push({start:0,count:g.I.length,m:mesh.mats[0]}); }
  else for(const gr of g.groups){ const m=mesh.mats[gr.mi]||mesh.mats[0]; const last=runs[runs.length-1]; if(last&&last.m===m&&last.start+last.count===gr.start) last.count+=gr.count; else runs.push({start:gr.start,count:gr.count,m}); }
  return mesh.runs=runs; }
function drawTree(n){ if(!n.vis) return;
  if(n.mesh){ const g=n.mesh.geo; if(!culled(n,g)){ if(!g.vao) upload(g); gl.bindVertexArray(g.vao); gl.uniformMatrix4fv(MAIN.loc.modelMatrix,false,n.world);
    for(const run of runsOf(n.mesh)){ const m=run.m; const cull=!m.dbl; if(cull!==curCull){ cull?gl.enable(gl.CULL_FACE):gl.disable(gl.CULL_FACE); curCull=cull; }
      if(m!==curMat){ curMat=m; if(m.tex){ const t=glTex(m.tex); if(t!==curTex){ gl.bindTexture(gl.TEXTURE_2D,t); curTex=t; } }
        gl.uniform1f(MAIN.loc.uHasMap,m.tex?1:0); gl.uniform3fv(MAIN.loc.uColor,m.color); gl.uniform3fv(MAIN.loc.uEmissive,m.emis);
        gl.uniform1f(MAIN.loc.uUnlit,m.unlit); gl.uniform2fv(MAIN.loc.uRepeat,m.rep); gl.uniform1f(MAIN.loc.uCut,m.cut); gl.uniform1f(MAIN.loc.uNoFog,m.nofog||0); gl.uniform1f(MAIN.loc.uFar,m.far?1:0); }
      gl.drawElements(gl.TRIANGLES,run.count,gl.UNSIGNED_SHORT,run.start*2); } } }
  for(const k of n.kids) drawTree(k); }
function renderScene(root,eye,target,w,h,snapRes){
  m4.persp(proj,50*Math.PI/180,w/h,0.05,120); proj[8]=-viewShift[0]; proj[9]=-viewShift[1]; m4.lookAt(view,eye,target,[0,1,0]);
  updateWorld(root,null);
  gl.viewport(0,0,w,h); gl.clearColor(L.fog[0],L.fog[1],L.fog[2],1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.useProgram(MAIN.p); curCull=null; curMat=null; curTex=null; gl.activeTexture(gl.TEXTURE0); cullOn=false; const u=MAIN.loc;
  gl.uniformMatrix4fv(u.viewMatrix,false,view); gl.uniformMatrix4fv(u.projectionMatrix,false,proj);
  gl.uniform1f(u.uSnap,state.ps1&&state.snap?1:0); gl.uniform1f(u.uAffine,state.ps1&&state.affine?1:0); gl.uniform2f(u.uRes,snapRes[0],snapRes[1]);
  gl.uniform3fv(u.uAmb,L.amb); gl.uniform3fv(u.uDirDir,L.dirDir); gl.uniform3fv(u.uDirCol,L.dirCol);
  gl.uniform3fv(u.uPLPos,L.plPos); gl.uniform3fv(u.uPLCol,L.plCol); gl.uniform1fv(u.uPLDist,L.plDist);
  gl.uniform3fv(u.uFogCol,L.fog); gl.uniform1f(u.uFogNear,L.fogNear); gl.uniform1f(u.uFogFar,L.fogFar); gl.uniform1i(u.map,0); if(u.uSkyFade) gl.uniform1f(u.uSkyFade,0);
  drawTree(root); gl.bindVertexArray(null); }

/* ================= world ================= */
const world=N(null);
const groups={cast:N(world),arsenal:N(world),floor:N(world)};
const spinners=[]; let chars=[];

/* --- character rig: one continuous low-poly body skinned to a skeleton (about 1,000 triangles), rigid head, hands and shoes ---
   Proportions are for a real 1.80 m man: 7.7 heads tall, 40 cm across the shoulders, fingertips at mid-thigh. */
function smoothNormals(g){ const acc=new Map(), P=g.P, key=i=>`${P[i*3].toFixed(4)},${P[i*3+1].toFixed(4)},${P[i*3+2].toFixed(4)}`;
  for(let t=0;t<g.I.length;t+=3){ const a=g.I[t],b=g.I[t+1],c=g.I[t+2];
    const ux=P[b*3]-P[a*3],uy=P[b*3+1]-P[a*3+1],uz=P[b*3+2]-P[a*3+2],vx=P[c*3]-P[a*3],vy=P[c*3+1]-P[a*3+1],vz=P[c*3+2]-P[a*3+2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    for(const v of [a,b,c]){ const k=key(v); let s=acc.get(k); if(!s){ s=[0,0,0]; acc.set(k,s); } s[0]+=nx; s[1]+=ny; s[2]+=nz; } }
  for(let i=0;i<P.length/3;i++){ const s=norm3(acc.get(key(i))||[0,1,0]); g.Nm[i*3]=s[0]; g.Nm[i*3+1]=s[1]; g.Nm[i*3+2]=s[2]; } return g; }
/* rigid lathe, rings bottom to top: [y, half-width, half-depth, forward offset, side offset] */
function lathe(rings,seg=10,o={}){
  const g=new Geo(),y0=rings[0][0],y1=rings[rings.length-1][0],rs=seg+1;
  rings.forEach(([y,rx,rz,cz=0,cx=0])=>{ const v=Math.min(.992,Math.max(.008,(y-y0)/((y1-y0)||1))); for(let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2+Math.PI; g.v([cx+rx*Math.sin(a),y,cz+rz*Math.cos(a)],[0,1,0],[i/seg,v]); } });
  for(let j=0;j<rings.length-1;j++) for(let i=0;i<seg;i++){ const a=j*rs+i,b=a+1,c=a+rs+1,d=a+rs; g.I.push(a,b,c,a,c,d); }
  if(o.capB!==false){ const r0=rings[0],c=g.v([r0[4]||0,y0,r0[3]||0],[0,-1,0],[.5,.008]); for(let i=0;i<seg;i++) g.I.push(c,i+1,i); }
  if(o.capT!==false){ const r1=rings[rings.length-1],base=(rings.length-1)*rs,c=g.v([r1[4]||0,y1,r1[3]||0],[0,1,0],[.5,.992]); for(let i=0;i<seg;i++) g.I.push(c,base+i,base+i+1); }
  smoothNormals(g); g.groups.push({start:0,count:g.I.length,mi:0}); return g; }
/* skinned tube: rings {c:[x,y,z], rx, rz, v, w:[[bone,weight],...]} bottom to top */
function tube(g,sk,rings,seg,mi,o={}){
  const start=g.I.length,base=g.P.length/3,rs=seg+1;
  for(const q of rings) for(let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2+Math.PI; g.v([q.c[0]+q.rx*Math.sin(a),q.c[1],q.c[2]+q.rz*Math.cos(a)],[0,1,0],[i/seg,Math.min(.992,Math.max(.008,q.v))]); sk.push(q.w); }
  for(let j=0;j<rings.length-1;j++) for(let i=0;i<seg;i++){ const a=base+j*rs+i,b=a+1,c=a+rs+1,d=a+rs; g.I.push(a,b,c,a,c,d); }
  if(o.capB){ const q=rings[0],c=g.v(q.c,[0,-1,0],[.5,q.v]); sk.push(q.w); for(let i=0;i<seg;i++) g.I.push(c,base+i+1,base+i); }
  if(o.capT){ const q=rings[rings.length-1],b1=base+(rings.length-1)*rs,c=g.v(q.c,[0,1,0],[.5,.992]); sk.push(q.w); for(let i=0;i<seg;i++) g.I.push(c,b1+i,b1+i+1); }
  g.groups.push({start,count:g.I.length-start,mi}); }
const JOINTS=['hips','spine','neck','head','armL','armR','elbowL','elbowR','handL','handR','thighL','thighR','kneeL','kneeR','ankleL','ankleR'];
const BONES=['hips','spine','neck','head','armL','elbowL','handL','armR','elbowR','handR','thighL','kneeL','ankleL','thighR','kneeR','ankleR'];
const BONE_PARENT={hips:null,spine:'hips',neck:'spine',head:'neck',armL:'spine',elbowL:'armL',handL:'elbowL',armR:'spine',elbowR:'armR',handR:'elbowR',thighL:'hips',kneeL:'thighL',ankleL:'kneeL',thighR:'hips',kneeR:'thighR',ankleR:'kneeR'};
/* base male, 1.80 m. torso rings: [y, half-width, half-depth, forward offset] */
const TORSO=[[.82,.1,.085,0],[.86,.135,.1,-.005],[.93,.168,.115,-.014],[1.0,.162,.108,-.004],[1.08,.148,.102,.006],[1.18,.152,.108,.012],[1.28,.168,.122,.02],[1.38,.178,.118,.014],[1.45,.17,.098,0],[1.5,.105,.075,-.012],[1.53,.066,.062,-.006],[1.58,.058,.058,.004],[1.62,.052,.054,.008]];
const TORSO_W=y=>y<=.93?[['hips',1]]:y<=1.0?[['hips',.8],['spine',.2]]:y<=1.08?[['hips',.4],['spine',.6]]:y<1.48?[['spine',1]]:y<=1.5?[['spine',.7],['neck',.3]]:y<=1.53?[['neck',.7],['spine',.3]]:y<=1.58?[['neck',.7],['head',.3]]:[['neck',.4],['head',.6]];
const LEG=[[.09,.03,.034,.004],[.16,.034,.038,0],[.27,.044,.05,-.008],[.38,.054,.064,-.012],[.47,.052,.056,0],[.53,.054,.058,.008],[.64,.064,.068,.004],[.78,.077,.08,.004],[.9,.087,.09,0],[.98,.088,.092,-.005]];
const LEG_W=(y,s)=>{ const t='thigh'+s,k='knee'+s,a='ankle'+s; return y<=.1?[[k,.7],[a,.3]]:y<=.44?[[k,1]]:y<=.5?[[k,.7],[t,.3]]:y<=.56?[[t,.6],[k,.4]]:y<=.86?[[t,1]]:y<=.92?[[t,.8],['hips',.2]]:[[t,.5],['hips',.5]]; };
const ARM=[[.9,.02,.028],[.95,.03,.034],[1.03,.044,.04],[1.11,.043,.042],[1.15,.042,.044],[1.19,.045,.046],[1.27,.05,.052],[1.36,.056,.055],[1.44,.062,.06],[1.5,.056,.056]];
const ARM_W=(y,s)=>{ const a='arm'+s,e='elbow'+s,h='hand'+s; return y<=.91?[[e,.8],[h,.2]]:y<=1.12?[[e,1]]:y<=1.16?[[e,.5],[a,.5]]:y<=1.2?[[a,.85],[e,.15]]:y<=1.42?[[a,1]]:y<=1.46?[[a,.85],['spine',.15]]:[[a,.5],['spine',.5]]; };
const HEAD_RINGS=[[0,.03,.03,.04],[.03,.056,.062,.024],[.07,.066,.08,.01],[.11,.071,.088,.004],[.15,.075,.094,-.002],[.19,.074,.095,-.008],[.215,.064,.085,-.012],[.235,.035,.05,-.012]];
function torsoAt(o,y){ const T=o.torsoRings; if(y<=T[0][0]) return T[0]; for(let i=1;i<T.length;i++) if(y<=T[i][0]){ const a=T[i-1],b=T[i],f=(y-a[0])/(b[0]-a[0]); return a.map((v,k)=>v+(b[k]-v)*f); } return T[T.length-1]; }
/* hands: an open pose, and one solid closed fist (the PS1 way) that the grip passes through. The grip runs running along the knuckle line (hand z) at
   (palm side * .036, -.074). The palm is on the -s side: +x for the right hand, -x for the left. */
function hand(wr,o,s,m){
  const ps=-s;
  const open=N(wr); mk(box(.032,.095,.08,{tw:.9,td:.92,at:[0,-.048,0]}),m,open); const f=N(open,0,-.09,0,0,0,-s*.5); mk(box(.028,.075,.074,{at:[0,-.036,0]}),m,f);
  mk(box(.022,.055,.024,{at:[0,-.026,0]}),m,open,-s*.004,-.035,.042,-.45,0,0);
  const wrap=N(wr); wrap.vis=false;
  mk(box(.066,.09,.076,{tw:.88,td:.94,at:[0,-.045,0]}),m,wrap,ps*.018,-.022,0);
  return {open,wrap}; }
function setGrip(J,L_,on){ if(J['open'+L_]){ J['open'+L_].vis=!on; J['wrap'+L_].vis=on; } }
function shoe(an,o){ const w=o.shoeW,l=o.shoeL;
  mk(box(w*1.06,.022,l*1.02,{at:[0,-o.foot+.011,l*.2]}),o.soleM||mBlack,an);
  mk(lathe([[-o.foot+.02,w*.52,l*.47,l*.2],[-o.foot*.55,w*.5,l*.42,l*.16],[-.01,w*.42,w*.62,.012],[.035,w*.36,w*.42,0]],6),o.footM,an); }
function rig(o,parent){
  const hf=o.hf||1,w=o.w||1,dp=o.depth||1,bl=o.belly||1,lg=o.lg||1,ag=o.ag||1,jk=o.jacket||0,pl=o.pants||.006;
  o.torsoRings=TORSO.map(([y,rx,rz,cz])=>{ const neck=y>=1.5, mid=y>=1.0&&y<=1.28, worn=y>=.93&&y<=1.46;
    const kx=neck?(.9+.1*w):w, kz=neck?1:dp*(mid?bl:1);
    return [y*hf, rx*kx*(mid?(1+(bl-1)*.45):1)+(worn?jk:y<.93?pl:0), rz*kz+(worn?jk:y<.93?pl:0), cz+(mid?(bl-1)*.12:0)]; });
  o.thigh=.43*hf; o.shin=.42*hf; o.foot=.08*hf; o.legW=.11*lg; o.torso=.41*hf; o.shoeW=o.shoeW||.1; o.shoeL=o.shoeL||.28*Math.min(1.08,hf);
  const tc=torsoAt(o,1.21*hf); o.torsoD=(tc[2]+tc[3])*2;
  const P={}; // bind positions of the joints, root space
  P.hips=[0,.99*hf,0]; P.spine=[0,1.09*hf,0]; P.neck=[0,1.5*hf,0]; P.head=[0,1.57*hf,0];
  for(const s of [1,-1]){ const L_=s>0?'L':'R';
    P['thigh'+L_]=[s*.09*w,.93*hf,0]; P['knee'+L_]=[s*.09*w,.5*hf,0]; P['ankle'+L_]=[s*.09*w,.08*hf,0];
    P['arm'+L_]=[s*.19*w,1.45*hf,0]; P['elbow'+L_]=[s*(.19*w+.032*ag),1.15*hf,0]; P['hand'+L_]=[s*(.19*w+.044*ag),.89*hf,0]; }
  const root=N(parent),J={root};
  for(const b of BONES){ const par=BONE_PARENT[b],pp=par?P[par]:[0,0,0]; J[b]=N(par?J[par]:root,P[b][0]-pp[0],P[b][1]-pp[1],P[b][2]-pp[2]); }
  /* the skinned body */
  const g=new Geo(),sk=[];
  const T=o.torsoRings,y0=T[0][0],yT=T[T.length-1][0];
  tube(g,sk,T.map(([y,rx,rz,cz])=>({c:[0,y,cz],rx,rz,v:(y-y0)/(yT-y0),w:TORSO_W(y/hf)})),12,0,{capB:true,capT:true});
  for(const s of [1,-1]){ const L_=s>0?'L':'R',S=P['arm'+L_],E=P['elbow'+L_],H=P['hand'+L_];
    const ax=y=>y>=S[1]?S[0]:y>=E[1]?E[0]+(S[0]-E[0])*(y-E[1])/(S[1]-E[1]):H[0]+(E[0]-H[0])*(y-H[1])/(E[1]-H[1]);
    const rings=ARM.map(([y,rx,rz])=>{ const Y=y*hf; return {c:[ax(Y),Y,0],rx:rx*ag+jk*.6,rz:rz*ag+jk*.6,v:(y-.9)/.6,w:ARM_W(y,L_)}; });
    tube(g,sk,rings,10,s>0?1:2,{capB:true,capT:true}); }
  for(const s of [1,-1]){ const L_=s>0?'L':'R';
    const rings=LEG.map(([y,rx,rz,cz])=>({c:[s*.09*w,y*hf,cz],rx:rx*lg+pl,rz:rz*lg+pl,v:(y-.09)/.89,w:LEG_W(y,L_)}));
    tube(g,sk,rings,10,s>0?3:4,{capB:true,capT:true}); }
  smoothNormals(g);
  const n=g.P.length/3,bi=new Uint8Array(n*2),bw=new Float32Array(n*2);
  sk.forEach((ws,i)=>{ ws.slice(0,2).forEach(([b,wt],k)=>{ bi[i*2+k]=BONES.indexOf(b); bw[i*2+k]=wt; }); });
  J.body=mk(g,[o.torsoM,o.armLM||o.armM,o.armM,o.legM,o.legM],root);
  g.noCull=true; J.skin={geo:g,bi,bw,bindP:new Float32Array(g.P),bindN:new Float32Array(g.Nm),P:new Float32Array(g.P),N:new Float32Array(g.Nm),bpos:BONES.map(b=>P[b]),rel:BONES.map(()=>m4.make()),loc:m4.make()};
  /* rigid parts */
  const hs=o.headS||1;
  J.headMesh=mk(lathe(HEAD_RINGS.map(([y,rx,rz,cz])=>[y*hs,rx*hs,rz*hs,cz*hs]),12),o.headM,J.head);
  mk(box(.02*hs,.042*hs,.016,{tw:.45,td:.35}),o.noseM,J.head,0,.094*hs,.091*hs,-.25);
  for(const s of [1,-1]) mk(box(.014,.052*hs,.032,{td:.7}),o.earM,J.head,s*.073*hs,.108*hs,-.006*hs);
  for(const s of [1,-1]){ const L_=s>0?'L':'R'; const h=hand(J['hand'+L_],o,s,(s>0&&o.handML)||o.handM); J['open'+L_]=h.open; J['wrap'+L_]=h.wrap; shoe(J['ankle'+L_],o); }
  return J;
}
function skinUpdate(C){
  const S=C.J.skin; if(!S) return; const g=S.geo; if(!g.vao) upload(g);
  const J=C.J,rel=S.rel,loc=S.loc;
  BONES.forEach((b,i)=>{ const n=J[b]; m4.compose(loc,n.p,n.r,n.s); const par=BONE_PARENT[b]; if(par) m4.mul(rel[i],rel[BONES.indexOf(par)],loc); else rel[i].set(loc); });
  const BP=S.bindP,BN=S.bindN,P=S.P,Nn=S.N,bi=S.bi,bw=S.bw,bp=S.bpos,n=BP.length/3;
  for(let i=0;i<n;i++){ let px=0,py=0,pz=0,nx=0,ny=0,nz=0;
    for(let k=0;k<2;k++){ const wt=bw[i*2+k]; if(!wt) continue; const b=bi[i*2+k],m=rel[b],q=bp[b];
      const x=BP[i*3]-q[0],y=BP[i*3+1]-q[1],z=BP[i*3+2]-q[2];
      px+=wt*(m[0]*x+m[4]*y+m[8]*z+m[12]); py+=wt*(m[1]*x+m[5]*y+m[9]*z+m[13]); pz+=wt*(m[2]*x+m[6]*y+m[10]*z+m[14]);
      const a=BN[i*3],c=BN[i*3+1],d=BN[i*3+2]; nx+=wt*(m[0]*a+m[4]*c+m[8]*d); ny+=wt*(m[1]*a+m[5]*c+m[9]*d); nz+=wt*(m[2]*a+m[6]*c+m[10]*d); }
    P[i*3]=px; P[i*3+1]=py; P[i*3+2]=pz; Nn[i*3]=nx; Nn[i*3+1]=ny; Nn[i*3+2]=nz; }
  gl.bindBuffer(gl.ARRAY_BUFFER,g.bufs[0]); gl.bufferSubData(gl.ARRAY_BUFFER,0,P);
  gl.bindBuffer(gl.ARRAY_BUFFER,g.bufs[1]); gl.bufferSubData(gl.ARRAY_BUFFER,0,Nn);
}
function stdPoses(o,fight){
  const hy=o.thigh+o.shin+o.foot+.05;
  return {
    fight:Object.assign({wpn:'fight'},fight),
    hurt:{hipsY:hy-.07,wpn:'hang',j:{spine:[.36,0,.06],neck:[.12,0,0],head:[.22,.25,.12],armL:[-.6,0,-.28],elbowL:[-1.0,0,-.9],armR:[.05,0,-.1],elbowR:[-.25,0,0],thighL:[-.3,0,.05],kneeL:[.5,0,0],ankleL:[-.2,0,0],thighR:[.08,0,-.07],kneeR:[.22,0,0],ankleR:[-.3,0,0]}},
    beg:{hipsY:o.thigh+.06+o.legW*.43,wpn:'drop',j:{thighL:[0,0,.08],thighR:[0,0,-.08],kneeL:[1.5,0,0],kneeR:[1.5,0,0],ankleL:[1.4,0,0],ankleR:[1.4,0,0],spine:[.1,0,0],head:[-.28,0,0],armL:[-.35,-.5,.55],elbowL:[-1.9,0,0],armR:[-.35,.5,-.55],elbowR:[-1.9,0,0]}},
    idle:{wpn:'hang',j:{armL:[.04,0,.1],armR:[-.15,0,-.08],elbowR:[-.35,0,0],elbowL:[-.15,0,0],thighL:[-.04,0,.03],thighR:[.03,0,-.03],head:[.08,.3,0]}},
    sit:{hipsY:o.shin+o.foot+.08,wpn:'drop',j:{thighL:[-1.5,0,.06],thighR:[-1.5,0,-.06],kneeL:[1.45,0,0],kneeR:[1.45,0,0],spine:[-.18,0,0],head:[.25,0,0],armL:[-.5,0,.15],elbowL:[-.7,0,0],armR:[-.5,0,-.15],elbowR:[-.7,0,0]}},
    sleep:{lie:true,wpn:'drop',j:{armL:[0,0,.35],armR:[0,0,-.35],elbowL:[-.3,0,0],head:[0,.6,0],thighL:[-.15,0,.05],kneeL:[.3,0,0]}}
  };
}
function finish(parent,J,o,s){
  const C={J,o,kind:s.kind,phase:Math.random()*6,twoHand:!!s.twoHand,faceM:{},hy0:J.hips.p[1],state:'fight',base:{},grp:s.grp||'cast',lieY:.14,showDrop:s.showDrop!==false};
  for(const k in s.faces) C.faceM[k]=M(s.faces[k]);
  if(s.prop){ const w=N(J.handR); s.prop(w); C.wpn=w; C.wFight=s.wFight; C.gun=s.gun; C.support=!!s.support; C.gripHand=!!s.gripHand;
    const d=N(parent,.28,.035,.42,0,.6,Math.PI/2); s.prop(d); d.vis=false; C.dropped=d; }
  C.blood=mk(plane(.17,.2),M(tBloodSplat,{cut:true}),J.spine,.04,o.torso*.35,(s.frontZ??o.torsoD*.52)+.012); C.blood.vis=false;
  C.pool=mk(plane(.9,.62,2,2),M(tPool,{cut:true}),parent,0,.008,.22,-Math.PI/2); C.pool.vis=false;
  C.poses=s.poses||stdPoses(o,{j:s.fight,hipsY:s.fightHipsY});
  applyPose(C,'fight'); chars.push(C); return C;
}
function applyPose(C,name){
  const J=C.J; const P=C.poses[name]||C.poses.fight;
  for(const k of JOINTS) if(J[k]) J[k].r=[0,0,0];
  J.hips.p=[0,P.hipsY??C.hy0,0]; J.root.r=[0,0,0]; J.root.p=[0,0,0];
  if(P.lie){ J.root.r=[-Math.PI/2,0,0]; J.root.p=[0,C.lieY,0]; }
  for(const k in P.j) J[k].r=P.j[k].slice();
  const mode=P.wpn||'fight';
  if(C.wpn){ C.wpn.vis=mode!=='drop';
    if(C.dropped) C.dropped.vis=mode==='drop'&&C.showDrop&&!P.lie&&name!=='sit';
    if(mode==='fight'){ setParent(C.wpn,J.handR); C.wpn.p=C.wFight.p.slice(); C.wpn.r=C.wFight.r.slice(); if(C.twoHand) reachLeftHand(C); else if(C.support) supportHand(C); }
    else if(C.twoHand){ setParent(C.wpn,J.handR); C.wpn.p=[0,-.08,.02]; C.wpn.r=[1.25,0,0]; }
    else { setParent(C.wpn,J.handR); C.wpn.p=[0,-.075,0]; C.wpn.r=[1.35,0,0]; } }
  const fistUp=C.kind==='ray'&&name!=='sleep'&&name!=='sit';
  setGrip(J,'R',fistUp||(mode==='fight'&&C.gripHand)); setGrip(J,'L',fistUp||(mode==='fight'&&(C.twoHand||C.support)));
  C.blood.vis=name==='hurt'||name==='beg'; C.pool.vis=name==='hurt'||name==='beg'; C.pool.s=name==='hurt'?[.55,.55,1]:[1,1,1];
  const fk=name==='hurt'?'hurt':name==='beg'?'beg':name==='sleep'?'sleep':'fight';
  J.headMesh.mesh.mats[0]=C.faceM[fk]; J.headMesh.mesh.runs=null;
  C.state=name; C.base={}; for(const k of JOINTS) if(J[k]) C.base[k]=J[k].r.slice(); C.baseHipX=0;
}
function animateChar(C,t){
  const J=C.J,b=C.base,ph=C.phase,st=C.state;
  const sp=st==='hurt'?3.4:st==='beg'?4.6:st==='sleep'?.9:1.7, amp=st==='hurt'?.05:st==='sleep'?.03:.018;
  const br=Math.sin(t*sp+ph);
  J.spine.r[0]=b.spine[0]+br*amp;
  if(st==='sleep') return;
  J.head.r[1]=b.head[1]+Math.sin(t*.45+ph)*(st==='beg'?.1:.2); J.head.r[0]=b.head[0]+br*.02;
  if(st==='beg'){ const tr=Math.sin(t*11+ph)*.03; J.armL.r[2]=b.armL[2]+tr; J.armR.r[2]=b.armR[2]-tr; J.spine.r[1]=Math.sin(t*.7+ph)*.05; }
  else if(st==='hurt'){ J.spine.r[2]=b.spine[2]+Math.sin(t*.9+ph)*.05; J.hips.p[0]=Math.sin(t*.9+ph)*.025; }
  else { J.armL.r[0]=b.armL[0]+br*.03; J.armR.r[0]=b.armR[0]-br*.03; }
}

/* --- weapons, each built along +z with the grip at the origin --- */
function pFists(g){ const t=M(tTape); for(const s of [1,-1]) mk(box(.09,.11,.1),F(t,t,t,t,t),g,s*.07,0,0,0,0,s*.08); return g; }
function pBottle(g){ const m=M(tGlass,{double:true});
  mk(cyl(.013,.013,.1,6),m,g,0,0,.0,Math.PI/2); mk(cyl(.04,.013,.05,8,{open:true}),m,g,0,0,.075,Math.PI/2);
  mk(cyl(.04,.04,.1,8,{open:true}),M(tGlassJag,{double:true,cut:true}),g,0,0,.15,Math.PI/2); return g; }
function pKnife(g){ mk(box(.022,.028,.11),mBlack,g,0,0,0); mk(box(.03,.034,.012),mSteel,g,0,0,.058);
  mk(box(.004,.17,.034,{td:.15}),M(tBlade),g,0,-.004,.145,Math.PI/2); return g; }
function pMachete(g){ mk(box(.026,.032,.12),mWood,g,0,0,0); mk(box(.006,.37,.07,{td:.8}),M(tBladeBlood,{double:true}),g,0,-.012,.245,Math.PI/2); return g; }
function pAxe(g){ const h=M(tAxeHandle,{double:true}); mk(cyl(.017,.017,.74,6),h,g,0,0,.26,Math.PI/2);
  mk(box(.036,.075,.09),M(tAxeRed),g,0,0,.6); mk(box(.012,.15,.085,{td:.6}),M(tBlade),g,0,-.1,.6,Math.PI); mk(box(.022,.07,.03,{tw:.4,td:.4}),M(tAxeRed),g,0,.07,.6); return g; }
const tMP5Recv=tex(16,16,'#1d1e20',g=>{ R(g,'#34363a',0,0,16,2); R(g,'#2a2c2f',0,2,16,2); R(g,'#141516',0,13,16,3); grain(g,8,741); });
const tMP5Poly=tex(16,16,'#323437',g=>{ R(g,'#3e4044',0,0,16,3); R(g,'#383a3d',0,3,16,3); R(g,'#28292c',0,12,16,4); grain(g,9,742); specks(g,'#2a2c2f',6,743,16,16); });
const tMP5Mag=tex(16,32,'#18191b',g=>{ R(g,'#2c2e31',0,0,16,32); R(g,'#18191b',2,0,12,32); R(g,'#9aa0a6',9,0,2,32); R(g,'#5a5f65',11,0,1,32); for(let y=6;y<20;y+=3) R(g,'#7d8186',4,y,4,1); grain(g,8,744); });
const tMP5Pad=tex(8,8,'#202123',g=>{ R(g,'#2c2d30',0,0,8,1); grain(g,14,745); });
const mMP5Recv=M(tMP5Recv), mMP5Poly=M(tMP5Poly), mMP5Mag=M(tMP5Mag), mMP5Pad=M(tMP5Pad);
/* --- guns: same level as the MP5. Painted 16px textures, axis-aligned parts merged per material, anchors (grip, muzzle, bore, sights) unchanged. --- */
const tGunWalnut=tex(32,16,'#5a321c',g=>{ R(g,'#6c3e24',0,0,32,3); R(g,'#422210',0,13,32,3); const r=rng(751); for(let i=0;i<7;i++){ let y=r()*16; const dy=(r()-.5)*.25; for(let x=0;x<32;x++){ if(r()>.15) R(g,'rgba(34,16,6,.4)',x,Math.round(y),1,1); y+=dy; } } grain(g,8,752); });
const tRevGrip=tex(16,32,'#5e3018',g=>{ R(g,'#70402a',0,0,16,4); for(let y=8;y<26;y++) for(let x=3;x<13;x++) if(((x+y)&1)&&((x-y)&3)) R(g,'#3a1c0c',x,y,1,1); R(g,'#b8b4a8',7,4,2,2); grain(g,8,753); });
const tPistolSlide=tex(16,16,'#1f2022',g=>{ R(g,'#383a3e',0,0,16,2); R(g,'#2a2c2f',0,2,16,2); R(g,'#131415',0,14,16,2); grain(g,7,754); });
const tPolyFrame=tex(16,16,'#28292b',g=>{ R(g,'#34363a',0,0,16,2); grain(g,14,755); specks(g,'#1c1d1f',10,756,16,16); });
const tShotPump=tex(32,16,'#5a321c',g=>{ R(g,'#6e4026',0,0,32,4); R(g,'#3e2010',0,12,32,4); for(let x=2;x<32;x+=4) R(g,'#2a1408',x,0,1,16); grain(g,10,757); });
const tRevCyl=tex(24,8,'#232427',g=>{ R(g,'#3a3c40',0,0,24,1); for(let x=2;x<24;x+=4) R(g,'#0e0f10',x,1,2,6); grain(g,8,758); });
const mWalnut=M(tGunWalnut), mRevGrip=M(tRevGrip), mPistolSlide=M(tPistolSlide), mPolyFrame=M(tPolyFrame), mShotPump=M(tShotPump), mRevCyl=M(tRevCyl,{double:true}), mBead=M(null,{color:0xd8d0b8});
/* .38 revolver: blued K-frame, fluted 6-shot cylinder, exposed ejector rod, spurred hammer, round trigger guard, checkered walnut grips */
function pRevolver(g){
  mk(mergeBoxes([
    [0,.02,.006, .026,.05,.026],     /* frame behind the cylinder */
    [0,.0445,.045, .016,.006,.054],  /* top strap */
    [0,.002,.045, .022,.012,.054],   /* crane under the cylinder */
    [0,.032,.075, .024,.032,.012],   /* frame front where the barrel screws in */
    [0,-.022,.03, .008,.005,.036],   /* trigger guard bottom */
    [0,-.003,-.013, .014,.04,.012]   /* backstrap into the grip */
  ]),mBlued,g);
  mk(cyl(.019,.019,.042,12),mRevCyl,g,0,.024,.045,Math.PI/2);
  mk(cyl(.0085,.0085,.072,8),M(tBlued,{double:true}),g,0,.036,.11,Math.PI/2);
  mk(cyl(.0035,.0035,.046,6),mBlack,g,0,.021,.093,Math.PI/2); mk(cyl(.005,.005,.007,6),mBlack,g,0,.021,.117,Math.PI/2); /* ejector rod and its knob */
  mk(box(.004,.009,.012,{td:.5}),mBlued,g,0,.044,.139);                 /* half-moon front sight */
  const hm=N(g,0,.038,-.004,-.5,0,0); mk(box(.007,.016,.01),mBlack,hm,0,.006,0); mk(box(.009,.005,.013),mBlack,hm,0,.014,-.005); /* hammer and spur */
  mk(box(.008,.022,.006),mBlued,g,0,-.01,.05,.35); mk(box(.005,.022,.007),mSteel,g,0,-.006,.026,-.2); /* guard front, trigger */
  const gp=N(g,0,-.03,-.015,.3,0,0); mk(box(.031,.078,.039,{tw:.95,td:.95}),mRevGrip,gp,0,0,0); mk(box(.022,.006,.03),mBlued,gp,0,-.041,0);
  return g; }
/* 9mm pistol: polymer-frame striker gun, dark slide with rear serrations, ejection port, squared trigger guard, stippled grip, accessory rail */
function pPistol(g){
  mk(box(.028,.03,.19,{tw:.9}),mPistolSlide,g,0,.0475,.055);
  const ser=[]; for(let i=0;i<6;i++) for(const s of [-1,1]) ser.push([s*.0142,.048,-.03+i*.008, .0016,.024,.003]);
  mk(mergeBoxes(ser.concat([[.0135,.057,.06, .003,.01,.034],[0,.045,.151, .02,.02,.004]])),mBlack,g); /* serrations, ejection port, muzzle face */
  mk(cyl(.0055,.0055,.006,8),M(null,{color:0x0a0a0a,double:true}),g,0,.045,.152,Math.PI/2); /* bore */
  mk(mergeBoxes([
    [0,.024,.093, .026,.018,.112],   /* dust cover */
    [0,.023,.02, .027,.02,.05],      /* frame over the trigger */
    [0,-.013,.062, .013,.006,.054],  /* trigger guard bottom */
    [0,.003,.086, .013,.03,.007],    /* trigger guard front */
    [0,.014,-.025, .029,.018,.026],  /* beavertail */
    [0,.004,.0, .028,.022,.05]      /* frame over the grip */
  ]),mPolyFrame,g);
  const rl=[]; for(let i=0;i<4;i++) rl.push([0,.013,.11+i*.01, .022,.004,.004]); mk(mergeBoxes(rl),mBlack,g); /* rail slots */
  mk(box(.005,.02,.006),mBlack,g,0,.004,.044,-.2);                       /* trigger */
  const gp=N(g,0,-.032,-.006,.28,0,0); mk(box(.03,.098,.05,{td:.96}),mPolyFrame,gp,0,0,0); mk(box(.033,.008,.054),mBlack,gp,0,-.052,0);
  return g; }
/* pump shotgun: blued receiver, plain barrel with a brass bead, magazine tube and cap, ribbed walnut fore-end on action bars, walnut stock and wrist, rubber pad */
function pShotgun(g){
  mk(box(.048,.066,.2,{tw:.82}),mMP5Recv,g,0,0,0);
  mk(mergeBoxes([
    [.0242,.008,.03, .002,.022,.07],  /* ejection port */
    [0,-.04,-.045, .03,.016,.11],     /* trigger plate */
    [0,-.066,-.055, .01,.005,.05],    /* guard bottom */
    [0,-.053,-.029, .01,.026,.006],   /* guard front */
    [0,.002,.465, .014,.034,.012]     /* barrel band */
  ]),mBlack,g);
  mk(cyl(.0115,.0115,.5,8),M(tBlued,{double:true}),g,0,.02,.35,Math.PI/2);
  mk(cyl(.0125,.0125,.012,8),mBlack,g,0,.02,.594,Math.PI/2);
  mk(box(.005,.005,.005),mBead,g,0,.033,.59);
  mk(cyl(.0115,.0115,.38,8),M(tBlued,{double:true}),g,0,-.016,.3,Math.PI/2); mk(cyl(.0128,.0128,.03,8),mBlack,g,0,-.016,.49,Math.PI/2); /* mag tube, cap */
  mk(box(.005,.02,.006),mSteel,g,0,-.052,-.055,-.2);                       /* trigger */
  /* the fore-end slides on g.pump (60-weapons sets its z): ribbed wood plus the action bars that run back into the receiver */
  const pu=N(g,0,-.018,.21); g.pump=pu; mk(box(.046,.044,.17,{tw:.9}),mShotPump,pu,0,0,0);
  mk(mergeBoxes([[.013,.012,-.15, .003,.006,.13],[-.013,.012,-.15, .003,.006,.13]]),mBlack,pu);
  /* stock: the wrist drops from the receiver, then the butt with its comb, then the pad */
  mk(box(.036,.05,.07,{tw:.9}),mWalnut,g,0,-.014,-.13,.12);
  mk(box(.042,.106,.17,{tw:.8,td:1.05}),mWalnut,g,0,-.036,-.235,.08);
  mk(box(.045,.11,.02),mMP5Pad,g,0,-.044,-.324,.08);
  return g; }
/* MP5A3 (black, from Kenny's reference photo): satin-black stamped receiver, charcoal stippled polymer slimline handguard and
   trigger housing, hooded front ring over the cocking tube, cocking handle up on the left, 3-lug muzzle,
   rotary drum rear sight, curved black 30-round magazine with a light streak, black retractable stock rails and rubber butt pad.
   Axis-aligned black parts are merged into one draw; about 22 draws in all. Anchors kept: bore y .012, muzzle z .29,
   grip about (0,-.07,-.07), handguard about z .12, sights at z .205 / -.11. */
function pSMG(g){
  /* receiver, rails, end caps, sight bases: one merged black mesh [x,y,z, w,h,d] */
  mk(mergeBoxes([
    [0,.02,-.0425, .036,.05,.215],   /* stamped receiver */
    [0,.047,-.04, .026,.006,.2],     /* raised top with the claw-mount flats */
    [0,.014,.064, .04,.046,.01],     /* handguard joint */
    [0,.016,-.156, .04,.05,.016],    /* rear housing the stock slides into */
    [0,-.016,.03, .034,.036,.052],   /* magazine well */
    [0,.046,-.11, .022,.008,.024],   /* rear sight base */
    [0,.022,.215, .024,.044,.02],    /* front sight block */
    [0,.044,.215, .012,.012,.012],   /* front post base */
    [.019,.021,-.235, .006,.009,.15],[-.019,.021,-.235, .006,.009,.15], /* stock rails */
    [0,.016,-.31, .046,.028,.02],    /* stock yoke */
    [0,-.03,.0, .02,.012,.012]       /* magazine release paddle */
  ]),mMP5Recv,g);
  /* trigger housing, guard and pistol grip: charcoal polymer */
  mk(mergeBoxes([[0,-.018,-.0625, .033,.032,.125],[0,-.061,-.042, .01,.006,.056],[0,-.047,-.012, .01,.03,.008]]),mMP5Poly,g);
  mk(box(.031,.098,.044,{tw:1.05,td:1.08}),mMP5Poly,g,0,-.081,-.088,.32);
  mk(box(.005,.022,.006),mBlack,g,0,-.044,-.04,-.25);                 /* trigger */
  mk(box(.004,.024,.008),mBlack,g,-.0185,-.012,-.055,.6,0,0);      /* selector lever */
  /* slimline handguard: rounded, a touch taller than wide, cross bolt at the back */
  const hg=mk(cyl(.025,.025,.138,8),mMP5Poly,g,0,.003,.137,Math.PI/2); hg.s=[.94,1,1.16];
  mk(cyl(.005,.005,.05,6),mBlack,g,0,-.002,.082,0,0,Math.PI/2);
  /* cocking tube over the barrel, handle up on the left with its knurled knob */
  mk(cyl(.0095,.0095,.16,6),M(tBlued,{double:true}),g,0,.036,.145,Math.PI/2);
  const ch=N(g,-.009,.04,.12,0,0,.75); mk(box(.005,.022,.007),mBlack,ch,0,.011,0); mk(box(.014,.013,.014),mMP5Pad,ch,0,.025,0);
  /* hooded front ring, barrel and 3-lug muzzle */
  mk(torus(.0115,.0026,4,10),mBlack,g,0,.05,.215);
  mk(cyl(.0085,.0085,.06,6),M(tBlued,{double:true}),g,0,.012,.25,Math.PI/2);
  mk(cyl(.0115,.0115,.028,8),mBlack,g,0,.012,.277,Math.PI/2); mk(cyl(.0135,.0135,.008,8),mBlack,g,0,.012,.264,Math.PI/2);
  /* rotary drum rear sight (low enough that the notch peeks over it) */
  mk(cyl(.012,.012,.026,8),mBlack,g,0,.04,-.11,0,0,Math.PI/2);
  /* curved 30-round magazine, sweeping forward */
  const mg=N(g,0,-.032,.03,-.14,0,0); mk(box(.022,.075,.034),mMP5Mag,mg,0,-.0375,0);
  const m2=N(mg,0,-.073,0,-.3,0,0); mk(box(.022,.085,.034),mMP5Mag,m2,0,-.042,0); mk(box(.026,.008,.038),mBlack,m2,0,-.087,0);
  /* rubber butt pad on the retracted stock */
  mk(box(.05,.105,.026,{tw:1,td:.85}),mMP5Pad,g,0,-.022,-.327,-.06);
  return g; }
const WEAPONS={fists:pFists,bottle:pBottle,knife:pKnife,machete:pMachete,revolver:pRevolver,pistol:pPistol,shotgun:pShotgun,smg:pSMG};

/* --- the cast --- */
function baseMats(k){ const s=HEADS[k],sk=skinOf(k); return {headM:M(FACE[k].fight),noseM:M(null,{color:hexInt(mix(s.skin,s.skinD,.18))}),earM:M(null,{color:hexInt(mix(s.skin,s.skinD,.35))}),handM:M(sk.hand)}; }
/* two-handed low ready: the gun is placed against the body (butt at the right shoulder pocket, muzzle forward and down),
   then both arms are solved so the right hand lands on the grip and the left hand on the pump or handguard */
/* a fighting stance, not a mannequin: bladed (right shoulder back), weight forward on a bent front knee, rear leg braced, head down on the stock */
const TWO_HAND_ARMS={spine:[.15,.3,0],neck:[.06,0,0],head:[.12,-.3,.08],armR:[-.5,0,.25],elbowR:[-1.2,0,0],armL:[-.8,0,-.35],elbowL:[-1.1,0,0],
  thighL:[-.36,-.12,.1],kneeL:[.46,0,0],ankleL:[-.08,.1,0],thighR:[.24,.25,-.16],kneeR:[.3,0,0],ankleR:[-.24,-.2,0]};
const GUNS={shotgun:{butt:.33,grip:[0,-.04,-.08],fore:[0,-.02,.21],dir:[.33,-.52,.79]},smg:{butt:.26,grip:[0,-.03,-.06],fore:[0,-.03,.15],dir:[.22,-.3,.93]}};
function chainMat(J,name){ const chain=[]; for(let b=name;b;b=BONE_PARENT[b]) chain.unshift(b); let m=m4.make(); const loc=m4.make();
  for(const b of chain){ const n=J[b]; m4.compose(loc,n.p,n.r,n.s); const t=m4.make(); m4.mul(t,m,loc); m=t; } return m; }
const mulP=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
function solveArm(J,L_,target){ ikArm(J,L_,target); return polishArm(J,L_,target); }
function polishArm(J,L_,target){
  const arm=J['arm'+L_],el=J['elbow'+L_],sgn=L_==='L'?1:-1;
  const P=[[arm.r,0],[arm.r,1],[arm.r,2],[el.r,0]],lo=[-3.2,-3.2,-3.2,-2.8],hi=[3.2,3.2,3.2,0];
  const err=()=>{ const q=mulP(chainMat(J,'hand'+L_),[0,0,0]); return Math.hypot(q[0]-target[0],q[1]-target[1],q[2]-target[2]); };
  let best=err(),step=.03;
  for(let it=0;it<200&&step>.0005;it++){ let imp=false;
    P.forEach(([a,k],i)=>{ for(const d of [step,-step]){ const old=a[k]; a[k]=Math.max(lo[i],Math.min(hi[i],old+d)); const e=err(); if(e<best-1e-6){ best=e; imp=true; } else a[k]=old; } });
    if(!imp) step*=.5; }
  return best; }
/* Two-handed hold. Both fists close round the gun's centre line: each hand is turned so its knuckle line runs along the gun
   and the gun sits in the curl of the fingers, the arm is solved to put the wrist there, then the gun is re-fitted through
   where the two fists actually ended up, so neither hand can float off it. */
/* analytic two-bone arm IK: law of cosines for the elbow, elbows dropped down and out */
function ikArm(J,L_,T){
  const side=L_==='L'?1:-1,arm=J['arm'+L_],el=J['elbow'+L_],hd=J['hand'+L_];
  arm.r=[0,0,0]; el.r=[0,0,0];
  const SP=chainMat(J,arm===J.armL||arm===J.armR?'spine':'spine'),Sm=chainMat(J,'arm'+L_),S=colOf(Sm,3);
  const U=Math.hypot(...el.p),Fo=Math.hypot(...hd.p);
  let D=v3.sub(T,S),d=Math.hypot(...D); const dc=Math.min(U+Fo-.002,Math.max(Math.abs(U-Fo)+.002,d)); const a=v3.sc(D,1/(d||1));
  const ca=(U*U+dc*dc-Fo*Fo)/(2*U*dc),sa=Math.sqrt(Math.max(0,1-ca*ca));
  const pole=norm3([side*.45,-1,-.25]),b=norm3(v3.sub(pole,v3.sc(a,v3.dot(a,pole))));
  const E=v3.add(S,v3.add(v3.sc(a,U*ca),v3.sc(b,U*sa))),Wt=v3.add(S,v3.sc(a,dc));
  const Uw=norm3(v3.sub(S,E)),fw=v3.sub(Wt,E),Zw=norm3(v3.sub(fw,v3.sc(Uw,v3.dot(fw,Uw)))),Xw=v3.cross(Uw,Zw);
  const u=norm3(v3.sc(el.p,-1)),zl=norm3(v3.sub([0,0,1],v3.sc(u,u[2]))),xl=v3.cross(u,zl);
  const Rw=fromCols(Xw,Uw,Zw,[0,0,0]),Rl=fromCols(xl,u,zl,[0,0,0]),R=m4.make(); m4.mul(R,Rw,rigidInv(Rl)); R[12]=S[0]; R[13]=S[1]; R[14]=S[2];
  setLocal(arm,chainMat(J,'spine'),R);
  const cg=(U*U+Fo*Fo-dc*dc)/(2*U*Fo); el.r=[-(Math.PI-Math.acos(Math.max(-1,Math.min(1,cg)))),0,0];
}
const v3={ sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sc:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]] };
const colOf=(m,c)=>[m[c*4],m[c*4+1],m[c*4+2]];
function fromCols(X,Y,Z,P){ const m=m4.make(); m.set([...X,0,...Y,0,...Z,0,...P,1]); return m; }
function rigidInv(m){ const X=colOf(m,0),Y=colOf(m,1),Z=colOf(m,2),P=colOf(m,3),o=m4.make();
  o.set([X[0],Y[0],Z[0],0, X[1],Y[1],Z[1],0, X[2],Y[2],Z[2],0, -v3.dot(X,P),-v3.dot(Y,P),-v3.dot(Z,P),1]); return o; }
function setLocal(n,parentM,worldM){ const L=m4.make(); m4.mul(L,rigidInv(parentM),worldM);
  n.p=[L[12],L[13],L[14]]; n.r=[Math.atan2(-L[9],L[10]),Math.asin(Math.max(-1,Math.min(1,L[8]))),Math.atan2(-L[4],L[0])]; }
const GRIP_OFF=.036, GRIP_DROP=.074;
/* world rotation for a fist round the axis a, turned to need the least wrist twist */
function fistFrame(J,L_,a){ const side=L_==='R'?1:-1,el=chainMat(J,'elbow'+L_),wr=colOf(chainMat(J,'hand'+L_),3),up=norm3(v3.sub(colOf(el,3),wr));
  let best=null;
  for(const zs of [1,-1]){ const Z=v3.sc(a,zs),Y=norm3(v3.sub(up,v3.sc(Z,v3.dot(up,Z)))),X=v3.cross(Y,Z);
    const tw=v3.dot(X,colOf(el,0))+v3.dot(Y,colOf(el,1))+v3.dot(Z,colOf(el,2)); if(!best||tw>best.tw) best={X,Y,Z,tw}; }
  best.off=v3.add(v3.sc(best.X,side*GRIP_OFF),v3.sc(best.Y,-GRIP_DROP)); return best; }
/* pistol in two hands: the support hand wraps round the shooting hand from the inside, fingers over fingers */
function supportHand(C){
  const J=C.J,o=C.o,hf=o.hf||1;
  /* 1. decide where the pistol is: centred in front of the chest, arms' length, aimed slightly down */
  const T=[-.02,1.35*hf,.43],d=norm3([.02,-.07,1]),Y=v3.sc(d,-1),Z=norm3(v3.sub([0,1,0],v3.sc(d,d[1]))),X=v3.cross(Y,Z);
  const R=fromCols(X,Y,Z,[0,0,0]),wR=v3.sub(T,mulP(R,C.wFight.p));
  /* 2. shooting hand: arm solved to the grip, fist turned so the barrel runs along the forearm */
  solveArm(J,'R',wR); setLocal(J.handR,chainMat(J,'elbowR'),fromCols(X,Y,Z,colOf(chainMat(J,'handR'),3)));
  /* 3. support hand wraps the shooting hand from the inside, fingers over fingers */
  const HR=chainMat(J,'handR'),P=colOf(HR,3),wL=v3.add(P,v3.add(v3.sc(X,.082),v3.add(v3.sc(Y,.012),v3.sc(Z,-.01))));
  C.supportMiss=solveArm(J,'L',wL); setLocal(J.handL,chainMat(J,'elbowL'),fromCols(X,Y,Z,colOf(chainMat(J,'handL'),3)));
}
function reachLeftHand(C){
  const J=C.J,o=C.o,G=GUNS[C.gun],w=C.wpn;
  setParent(w,J.spine);
  const fz=frontAt(o,1.4,C.kind==='enforcer'?.026:0),butt=[-.13*(o.w||1),(G.buttY??.31)*o.hf,fz*(G.buttZ??.7)],d0=norm3(G.dir);
  w.p=[butt[0]+d0[0]*G.butt,butt[1]+d0[1]*G.butt,butt[2]+d0[2]*G.butt]; w.r=[Math.asin(-d0[1]/Math.cos(Math.asin(d0[0]))),Math.asin(d0[0]),0];
  const SP=chainMat(J,'spine'),loc=m4.make(); let gm=m4.make(); m4.compose(loc,w.p,w.r,w.s); m4.mul(gm,SP,loc);
  const gz=G.grip[2],fzz=G.fore[2],gy=G.grip[1];
  let cR=mulP(gm,[0,gy,gz]),cL=mulP(gm,[0,gy,fzz]),aR,aL,fR,fL;
  for(let it=0;it<4;it++){
    const a=norm3(colOf(gm,2));
    fR=fistFrame(J,'R',a); solveArm(J,'R',v3.sub(cR,fR.off)); fR=fistFrame(J,'R',a);
    fL=fistFrame(J,'L',a); solveArm(J,'L',v3.sub(cL,fL.off)); fL=fistFrame(J,'L',a);
    for(const [L_,f] of [['R',fR],['L',fL]]) setLocal(J['hand'+L_],chainMat(J,'elbow'+L_),fromCols(f.X,f.Y,f.Z,colOf(chainMat(J,'hand'+L_),3)));
    aR=v3.add(colOf(chainMat(J,'handR'),3),fR.off); aL=v3.add(colOf(chainMat(J,'handL'),3),fL.off);
    const Z=norm3(v3.sub(aL,aR)),upH=colOf(gm,1),X=norm3(v3.cross(upH,Z)),Y=v3.cross(Z,X);
    const R0=fromCols(X,Y,Z,[0,0,0]),org=v3.sub(aR,mulP(R0,[0,gy,gz]));
    gm=fromCols(X,Y,Z,org); cR=aR; cL=v3.add(aR,v3.sc(Z,fzz-gz)); }
  setLocal(w,SP,gm);
}
function frontAt(o,y,m=0){ const t=torsoAt(o,y*o.hf); return t[2]+t[3]+m; }
function vest(J,o,m,margin=.022){ const sy=1.09*o.hf;
  mk(lathe([1.1,1.26,1.38,1.46].map((y,i)=>{ const t=torsoAt(o,y*o.hf),k=i===3?.88:1; return [y*o.hf-sy,t[1]*k+margin,t[2]*k+margin,t[3]]; }),10,{capB:false,capT:false}),m,J.spine); }
function collar(J,o,m,h=.06,extra=.012){ const t=torsoAt(o,1.53*o.hf); mk(lathe([[-.035,t[1]+extra+.008,t[2]+extra+.008,t[3]],[-.035+h,t[1]+extra,t[2]+extra,t[3]]],8,{capB:false,capT:false}),m,J.neck); }
function kneePads(J,o){ for(const k of ['kneeL','kneeR']) mk(box(.11,.11,.035),M(tKnee),J[k],0,.0,.058*(o.lg||1)+.022); }
function makeRay(parent){
  const o=Object.assign(baseMats('ray'),{hf:1.0,w:1.04,depth:1.02,lg:1.04,ag:1.06,jacket:.006,pants:.008,
    torsoM:M(tRayTorso),armM:M(tRayArmR),armLM:M(tRayArmL),legM:M(tRayLeg),footM:M(tRayBoot)});
  o.handM=M(tTape); o.handML=M(tRayGlove);
  const J=rig(o,parent);
  vest(J,o,M(tRayVest,{double:true}));
  const sy=1.09*o.hf,fz=frontAt(o,1.18,.022),pm=M(tPad);
  for(const x of [-.09,0,.09]){ mk(box(.075,.085,.04),pm,J.spine,x,1.18*o.hf-sy,fz+.016); mk(box(.075,.028,.045),pm,J.spine,x,1.18*o.hf-sy+.05,fz+.03,-.7); }
  kneePads(J,o);
  const hol=N(J.thighR,-(.088*o.lg+.02),-.14,0); mk(box(.022,.2,.11),pm,hol,0,-.04,0); mk(box(.04,.14,.06),M(tBlack),hol,-.02,-.02,.02);
  mk(box(.012,.024,.018),mBlack,J.head,.078,.108,0); mk(box(.004,.11,.004),mBlack,J.head,.08,.04,-.01,0,0,.2);
  collar(J,o,M(tNavyCollar,{double:true}),.04,.004);
  const hy=o.thigh+o.shin+o.foot+.05;
  const guard={spine:[.06,.3,0],head:[.1,-.3,0],armL:[-.95,0,-.22],elbowL:[-1.95,0,0],armR:[-.85,0,.25],elbowR:[-2.0,0,0],thighL:[-.18,0,.06],kneeL:[.28,0,0],thighR:[.16,0,-.05],kneeR:[.18,0,0],ankleL:[-.1,0,0]};
  const P=stdPoses(o,{j:guard,hipsY:hy-.05});
  P.hurt={hipsY:hy-.08,j:Object.assign({},guard,{spine:[.4,.2,.05],head:[.2,-.2,.1],armL:[-.6,0,-.28],elbowL:[-1.0,0,-.9],armR:[-.5,0,.2],elbowR:[-1.6,0,0]})};
  P.beg=P.hurt;
  return finish(parent,J,o,{kind:'ray',faces:FACE.ray,poses:P,frontZ:frontAt(o,1.23,.022)});
}
function makeCorner(parent,grp){
  const o=Object.assign(baseMats('corner'),{hf:.97,w:.92,depth:.95,lg:.9,ag:.88,jacket:.012,pants:.012,shoeW:.095,
    torsoM:M(tCornerTorso),armM:M(tCornerArm),legM:M(tCornerLeg),footM:M(tSneakerW),soleM:M(tWhite)});
  const J=rig(o,parent);
  collar(J,o,M(tRibWhite,{double:true}),.05,.014);
  mk(torus(.066,.007,4,14),M(null,{color:0xc9a23a}),J.neck,0,.0,.03,Math.PI/2-.45);
  const fight={armR:[-.9,0,.2],elbowR:[-1.6,0,0],armL:[-.8,0,-.3],elbowL:[-1.7,0,0],spine:[.1,-.2,0],head:[.05,.2,0],thighL:[-.15,0,.05],kneeL:[.2,0,0],thighR:[.12,0,-.04]};
  return finish(parent,J,o,{kind:'corner',faces:FACE.corner,prop:pBottle,wFight:{p:[0,-.075,0],r:[1.57,0,0]},fight,grp});
}
function makeCutter(parent,grp){
  const o=Object.assign(baseMats('cutter'),{hf:1.0,w:.98,depth:1.0,lg:.98,ag:1.0,jacket:.014,pants:.006,
    torsoM:M(tCutterTorso),armM:M(tCutterArm),legM:M(tCutterLeg),footM:M(tBlackBoot)});
  const J=rig(o,parent);
  collar(J,o,M(tCutterArm,{double:true}),.07,.016);
  mk(lathe([[-.15,.012,.013],[-.07,.022,.024],[0,.026,.022]],5),M(tPonytail),J.head,0,.16,-.095,.35);
  const fight={armR:[-2.0,0,.25],elbowR:[-1.1,0,0],armL:[-.7,0,-.35],elbowL:[-.9,0,0],spine:[.15,-.25,0],head:[0,.25,0],thighL:[-.25,0,.06],kneeL:[.3,0,0],thighR:[.15,0,-.05],kneeR:[.1,0,0]};
  return finish(parent,J,o,{kind:'cutter',faces:FACE.cutter,prop:pMachete,wFight:{p:[0,-.075,0],r:[1.57,0,0]},fight,grp});
}
function makeGunman(parent,grp){
  const o=Object.assign(baseMats('gunman'),{hf:.99,w:.97,depth:.98,lg:.96,ag:.96,jacket:.005,pants:.008,shoeW:.095,
    torsoM:M(tGunTorso),armM:M(tGunArm),legM:M(tGunLeg),footM:M(tShoeBlack)});
  const J=rig(o,parent);
  const sy=1.09*o.hf,st=M(tStrapBrown),f=frontAt(o,1.33,.004),t=torsoAt(o,1.33*o.hf),bk=-t[2]+t[3]-.004;
  mk(box(.06,.022,.06),M(null,{color:0xc9a23a}),J.handL,0,.01,0);
  for(const s of [1,-1]) mk(box(.05,.01,.055,{td:.4}),M(tGunArm),J.neck,s*.045,.0,.045,.5,0,s*.3);
  const fight={armR:[-1.22,-.2,.1],elbowR:[-.55,0,0],armL:[-1.1,0,-.3],elbowL:[-.5,0,0],spine:[.05,0,0],head:[.1,0,0],thighL:[-.22,0,.04],kneeL:[.22,0,0],thighR:[.12,0,-.08],kneeR:[.08,0,0],ankleL:[.0,-.3,0]};
  return finish(parent,J,o,{kind:'gunman',faces:FACE.gunman,prop:pPistol,support:true,gripHand:true,wFight:{p:[.036,-.139,.035],r:[Math.PI/2,0,0]},fight,grp});
}
function makeDoorman(parent,grp){
  const o=Object.assign(baseMats('doorman'),{hf:1.06,w:1.18,depth:1.15,belly:1.1,lg:1.18,ag:1.22,jacket:.022,pants:.012,headS:1.04,shoeW:.11,
    torsoM:M(tDoorTorso),armM:M(tDoorArm),legM:M(tDoorLeg),footM:M(tBlackBoot)});
  const J=rig(o,parent);
  collar(J,o,M(tKnitBlack,{double:true}),.065,.02);
  return finish(parent,J,o,{kind:'doorman',faces:FACE.doorman,prop:pShotgun,twoHand:true,gripHand:true,gun:'shotgun',wFight:{p:[0,0,0],r:[0,0,0]},fight:TWO_HAND_ARMS,fightHipsY:J.hips.p[1]-.055,grp});
}
function makeEnforcer(parent,grp){
  const o=Object.assign(baseMats('enforcer'),{hf:1.01,w:1.04,depth:1.02,lg:1.04,ag:1.04,jacket:.004,pants:.01,
    torsoM:M(tEnfTorso),armM:M(tEnfArm),legM:M(tEnfLeg),footM:M(tBlackBoot)});
  o.handM=M(tGlove);
  const J=rig(o,parent);
  vest(J,o,M(tVest,{double:true}),.026);
  const sy=1.09*o.hf,fz=frontAt(o,1.18,.026);
  for(const x of [-.09,0,.09]) mk(box(.08,.1,.045),M(tPouch),J.spine,x,1.18*o.hf-sy,fz+.02);
  kneePads(J,o);
  return finish(parent,J,o,{kind:'enforcer',faces:FACE.enforcer,prop:pSMG,twoHand:true,gripHand:true,gun:'smg',wFight:{p:[0,0,0],r:[0,0,0]},fight:TWO_HAND_ARMS,fightHipsY:J.hips.p[1]-.055,frontZ:frontAt(o,1.23,.026),grp});
}
function makeLandlord(parent,grp){
  const o=Object.assign(baseMats('landlord'),{hf:.95,w:.95,depth:1.0,belly:1.16,lg:.9,ag:.86,jacket:.01,pants:.012,headS:.98,shoeW:.095,
    torsoM:M(tLordTorso),armM:M(tLordArm),legM:M(tLordLeg),footM:M(tSlipper)});
  const J=rig(o,parent);
  collar(J,o,M(tShirtCollar,{double:true}),.04,.006);
  const fight={spine:[.14,0,0],neck:[-.08,0,0],armR:[-1.4,0,.05],elbowR:[-.05,0,0],armL:[.05,0,.08],elbowL:[-.2,0,0],head:[-.04,0,0],thighL:[-.06,0,.03]};
  const C=finish(parent,J,o,{kind:'landlord',faces:FACE.landlord,prop:pRevolver,gripHand:true,wFight:{p:[.036,-.089,.035],r:[Math.PI/2,0,0]},fight,grp});
  C.poses.idle.j.spine=[.16,0,0]; return C;
}

