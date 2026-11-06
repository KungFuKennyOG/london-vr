/* LOD records: every facade box, tree and lamp the hub builds is noted here as it's emitted, so 48k can build the cheap
   stand-ins drawn past the detail radius. Wraps the kit's emitters; arguments pass straight through. */
const LOD_REC={fac:[],trees:[],lamps:[]};
{ const _eF=eFacade, _tr=tree, _lp=lamp;
  eFacade=function(x0,z0,x1,z1,y0,y1,F,faces,o){ LOD_REC.fac.push([x0,z0,x1,z1,y0,y1,F,faces||'',(o&&o.skip)||'']); return _eF.apply(this,arguments); };
  tree=function(x,z,s,y0){ LOD_REC.trees.push([x,z,s??1,y0??PAVE_Y]); return _tr.apply(this,arguments); };
  lamp=function(x,z,dx,dz,o){ const h=(o&&o.h)||7, a=1.25; LOD_REC.lamps.push([x+dx*a,PAVE_Y+h-.4,z+dz*a]); return _lp.apply(this,arguments); }; }
