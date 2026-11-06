/* =====================================================================================================
   THE CROWD: the people of the hub, on the same Stairwell rig as the cast (skinned bodies, painted faces,
   painted garments). Fourteen Londoners, mixed and matched from outfits, faces and hair; the life system pools
   them round the player. Generated from seeds, so the same people live here every night.
   ===================================================================================================== */
const CROWD_N=14, CROWD=[];
{ const r=rng(4401), pickr=a=>a[r()*a.length|0];
  const SKINS=[['#f0c8aa','#c49a7e'],['#e0ae8c','#ae7e62'],['#c8916c','#986448'],['#a87050','#784a32'],['#7a4a30','#4e2c1c'],['#5e3a26','#3a2214'],['#d8a486','#a8765c'],['#b88462','#8a5a40']];
  const HAIRS=['buzz','slick','long','shaved','bleach','buzz','slick'];
  const HCOL=['#141010','#2a1c12','#4a3020','#6a4a2a','#a8804a','#d8d4cc','#1a120c'];
  const JACK=[['puffer','#141416'],['puffer','#1f3b2d'],['puffer','#5a1a1a'],['hoodie','#3a3a3e'],['hoodie','#1c2a44'],['hoodie','#6a6a70'],['track','#17181b'],['track','#1c2a5a'],
    ['coat','#3a2e24'],['coat','#22242a'],['hivis','#c8d44a'],['suit','#22262e'],['denim','#3a5a7a'],['abaya','#141416'],['abaya','#2a2438'],['fleece','#2a4a3a']];
  const LEGS=[['jeans','#2a3a5a'],['jeans','#1c2230'],['jogs','#2a2a2e'],['jogs','#6c6c70'],['trousers','#1c1d20'],['trousers','#3a3630']];
  for(let i=0;i<CROWD_N;i++){ const id='ped'+i, fem=r()<.45, sk_=pickr(SKINS), hair=fem?(r()<.7?'long':'slick'):pickr(HAIRS), hc=pickr(HCOL), [jk,jc]=i===13?['abaya','#141416']:i===6?['abaya','#2a2438']:pickr(JACK), [lk,lc]=pickr(LEGS);
    const isAbaya=jk==='abaya', beard=!fem&&r()<.4?pickr(['stubble','full','goatee','mustache']):null;
    HEADS[id]={seed:1400+i*7,skin:sk_[0],skinD:sk_[1],hair:isAbaya?'long':hair,hairC:hc,hairFront:fem?12+(r()*3|0):13+(r()*3|0),brow:mix(hc,'#000',.2),iris:pickr(['#2a1a10','#4a3a2a','#5a7a8a','#3a5a3a']),lip:mix(sk_[1],'#8a3a3a',.4),
      beard,beardC:hc,sideburn:fem?42:36,behind:fem?46:undefined,nape:fem?48:undefined,age:r()<.15,glasses:r()<.12?'#2a2a2a':undefined};
    const dark=mix(jc,'#000000',.3), lite=mix(jc,'#ffffff',.25);
    const torso=torsoP(id,1500+i*11,(x,y)=>{ if(isAbaya) return [jc,'cotton',.5]; if(y>T3.belt+6&&jk!=='coat') return [lc,lk==='jeans'?'denim':lk==='jogs'?'knit':'twill',.6]; if(crewNeck(x,y,12,9)) return jk==='suit'?['#e8e8ea','cotton',.3]:sk('ped'+i);
        return [jc,jk==='puffer'?'nylon':jk==='hoodie'||jk==='fleece'?'knit':jk==='track'?'poly':jk==='coat'?'wool':jk==='denim'?'denim':jk==='suit'?'wool':'poly',.5]; },
      {folds:jk==='puffer'?6:14,decor:I=>{ neckShadow(I);
        if(jk==='puffer'){ quilt(I,T3.neck+26,T3.belt+6,20,dark); softLine(I,64,T3.neck+10,64,T3.belt+6,dark,.95,1.6); softRect(I,0,T3.neck,128,12,dark,.9,1.4); }
        if(jk==='hoodie'){ softRect(I,36,T3.nav-36,56,30,dark,.7,2); for(const x of [58,70]) softLine(I,x,T3.neck+4,x,T3.neck+30,lite,.9,1); softRect(I,0,T3.belt-6,128,10,dark,.8,2); }
        if(jk==='track'){ softLine(I,64,T3.neck+8,64,T3.belt-8,'#bdbdbd',.9,1.2); for(const x of [30,98]) softLine(I,x,T3.neck+12,x,T3.belt-10,'#e2ddd2',.9,1.1); }
        if(jk==='coat'){ softLine(I,64,T3.neck+8,64,256,dark,.9,1.4); for(let y=T3.chest;y<T3.belt+30;y+=26){ softEll(I,58,y,2,2,'#141414',.9); softEll(I,70,y,2,2,'#141414',.9); } softRect(I,0,T3.belt-2,128,6,dark,.9,1); }
        if(jk==='hivis'){ for(const y of [T3.chest+20,T3.chest+44]) softRect(I,0,y,128,7,'#e8e8e0',.95,.6); softLine(I,64,T3.neck+8,64,T3.belt,'#8a9a2a',.8,1.2); }
        if(jk==='suit'){ softLine(I,64,T3.neck+6,64,T3.belt,'#8a1a1a',.95,3); for(const s of [-1,1]) softLine(I,64+s*8,T3.neck+4,64+s*22,T3.chest+10,dark,.9,2); }
        if(jk==='denim'){ for(const x of [40,88]) softRect(I,x-8,T3.chest-6,16,14,dark,.6,1); seam(I,64,T3.neck+8,64,T3.belt); }
        if(jk==='fleece'){ softLine(I,64,T3.neck+4,64,T3.chest,dark,.9,1.4); } }});
    const arm=armP(1600+i*11,(x,y)=>y<118?[jc,jk==='puffer'?'nylon':'knit',.5]:[dark,'knit',.3],{decor:I=>{ if(jk==='puffer') for(let y=14;y<118;y+=18) softLine(I,0,y,64,y,dark,.85,1.4); if(jk==='track') for(const x of [14,50]) softLine(I,x,0,x,116,'#e2ddd2',.9,1.1); if(jk==='hivis') softRect(I,0,60,64,7,'#e8e8e0',.95,.6); }});
    const leg=legP(1700+i*11,(x,y)=>isAbaya?[jc,'cotton',.5]:y<118?[lc,lk==='jeans'?'denim':lk==='jogs'?'knit':'twill',.6]:[mix(lc,'#000',.2),'knit',.3],{decor:I=>{ if(lk==='jeans') softLine(I,52,10,50,110,mix(lc,'#fff',.2),.6,1); }});
    const foot=pickr([tTrainerW,tTrainerW,tBootBlk,tShoeFlat]);
    const o=fem?Object.assign({jacket:.012,pants:.008},FEM,{hf:.92+r()*.08}):{hf:.94+r()*.12,w:.95+r()*.15,depth:.95+r()*.15,belly:.95+r()*.2,lg:.95+r()*.1,ag:.95+r()*.1,jacket:jk==='puffer'?.03:.012,pants:.012};
    const hat=isAbaya?'hood':r()<.3?pickr(['cap','beanie','hood']):null, hatC=isAbaya?jc:pickr(['#141416','#1c2a44','#5a1a1a','#3a3a3e','#c8a040']);
    ROSTER[id]={side:'local',name:'Londoner',role:'',color:'#888',card:'',note:'',o,torso,arm,leg,foot,
      extra:(J,oo)=>{ if(hat==='cap') cap(J,hatC,hatC); if(hat==='beanie') beanie(J,hatC); if(hat==='hood') hoodUp(J,hatC); if(isAbaya) skirt(J,oo,tAbaya(jc),.5,1.12); if(jk==='hivis'&&!hat&&r()<2) beanie(J,'#1e2024'); }};
    CROWD.push(id); } }
function tAbaya(c){ return garment(64,128,1800,()=>[c,'cotton',.5],{folds:8,dir:'v'}); }
