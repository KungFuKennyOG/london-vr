#!/usr/bin/env python3
"""Do people (and their dogs) ever end up inside something solid? Stands the player at a set of busy spots, runs the
crowd for a while at each of several hours, and samples every person and dog four times a second against the solids:
everything in GAME.SOL at body height (buildings, walls, railings, shelters' ad panels, kiosks, bins, parked cars,
scaffold standards, stalls) plus the street furniture the player walks through but people shouldn't (lamp columns,
tree trunks, bollards, benches, bus-shelter posts).
usage: python3 tools/london_crowd_solids.py [--html london.html] [--secs 60] [--hours 8,13,19,23] [--furn in.json] [--dump-furn out.json] [--shots outdir]
  --dump-furn writes the furniture footprints (needs a build with CROWD_FURN); --furn reads them, so an older build
  without CROWD_FURN can be checked against the same furniture (the layout is seeded, so it matches)."""
import os,sys,json,argparse
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser(); ap.add_argument('--html',default=os.path.join(os.path.dirname(__file__),'..','london.html')); ap.add_argument('--secs',type=float,default=60)
ap.add_argument('--hours',default='8,13,19,23'); ap.add_argument('--furn'); ap.add_argument('--dump-furn'); ap.add_argument('--shots'); ap.add_argument('--spots')
a=ap.parse_args(); html=open(a.html).read()
SPOTS=[('bgr_west',-118,3.2,1.57),('bgr_wilmot',-26,3.0,-1.57),('bgr_east',150,2.8,1.57),('columbia',-150,-105.5,1.57),('camheath',323,20,3.14),
       ('cheshire_florida',101,116.5,1.57),('oldbg_mape',-184,-206.5,-1.57),('teesdale',100,-99.5,1.57),('vallance',-325,-60,0)]
if a.spots: SPOTS=[s for s in SPOTS if s[0] in a.spots.split(',')]
JS=r"""
window.__solids=function(furnIn){ const L=window.__london, SOLS=[];
  const add=(x0,z0,x1,z1,y0,y1,kind)=>SOLS.push([Math.min(x0,x1),Math.min(z0,z1),Math.max(x0,x1),Math.max(z0,z1),y0,y1,kind]);
  for(const s of L.GAME.SOL){ const r=s.r; if(r[2]-r[0]>400||r[3]-r[1]>400) continue; add(r[0],r[1],r[2],r[3],s.y0,s.y1,'sol'); }
  const PY=.12; let furn=furnIn; if(!furn&&window.__crowd.furn) furn=window.__crowd.furn();
  if(!furn) furn=[]; window.__furn=furn;
  for(const f of furn) add(f[0],f[1],f[2],f[3],PY,PY+2.3,f[4]||'furn');
  const H=new Map(), C=2; SOLS.forEach((s,k)=>{ for(let i=Math.floor(s[0]/C);i<=Math.floor(s[2]/C);i++) for(let j=Math.floor(s[1]/C);j<=Math.floor(s[3]/C);j++){ const key=i*65536+j; let q=H.get(key); if(!q) H.set(key,q=[]); q.push(k); } });
  window.__SH={SOLS,H,C}; return {sols:SOLS.length,furn:furn.length}; };
window.__inside=function(x,z,y,rad,skip){ const {SOLS,H,C}=window.__SH, seen=new Set();
  for(let i=Math.floor((x-rad)/C);i<=Math.floor((x+rad)/C);i++) for(let j=Math.floor((z-rad)/C);j<=Math.floor((z+rad)/C);j++){ const q=H.get(i*65536+j); if(!q) continue;
    for(const k of q){ if(seen.has(k)) continue; seen.add(k); const s=SOLS[k]; if(s[4]>=y+1.5||s[5]<=y+.4||s[6]===skip) continue; /* overhead, or underfoot (kerbs, steps, slabs) */
      if(x>s[0]-rad&&x<s[2]+rad&&z>s[1]-rad&&z<s[3]+rad) return k; } } return -1; };
window.__run=function(x,z,yaw,hour,secs){ const L=window.__london, G=L.GAME, P=G.P; L.TOD.rate=0; L.setHour(hour); P.x=x; P.z=z; P.yaw=yaw; P.pitch=-.04; P.y=0;
  const out={samples:0,ped:0,dog:0,pedIn:0,dogIn:0,hits:{},acts:{},pk:new Set(),max:0}; const dt=1/30; let t=0, nx=0;
  while(t<secs){ P.x=x; P.z=z; L.step(dt); t+=dt; if(t<nx) continue; nx=t+.25; out.samples++; let n=0;
    for(const p of window.__crowd.pool){ if(!p.alive||!p.root.vis) continue; n++; out.ped++; const X=p.root.p[0], Z=p.root.p[2], Y=p.root.p[1]; const k=window.__inside(X,Z,Y,.15,p.act==='bench'||(p.free0&&p.pi===0)?'bench':null); /* sitting on a bench, or the step up off it, is fine */
      if(k>=0){ out.pedIn++; const s=window.__SH.SOLS[k], key='ped '+p.act+' '+s[6]+' @'+X.toFixed(1)+','+Z.toFixed(1); const kk=p.i+':'+k; if(!out.pk.has(kk)){ out.pk.add(kk); out.hits[key]=(out.hits[key]||0)+1; out.acts[p.act]=(out.acts[p.act]||0)+1; } }
      if(p.dog&&p.dog.n){ const D=p.dog, c=Math.cos(p.yaw), s_=Math.sin(p.yaw), wx=X+c*D.n.p[0]+s_*D.n.p[2], wz=Z-s_*D.n.p[0]+c*D.n.p[2], dy=p.yaw+D.n.r[1], fx=Math.sin(dy)*.3, fz=Math.cos(dy)*.3; out.dog++;
        let k2=-1; for(const [ox,oz] of [[0,0],[fx,fz],[-fx,-fz]]){ k2=window.__inside(wx+ox,wz+oz,Y,.08); if(k2>=0) break; }
        if(k2>=0){ out.dogIn++; const s=window.__SH.SOLS[k2], key='dog '+p.act+' '+s[6]+' @'+wx.toFixed(1)+','+wz.toFixed(1); const kk='d'+p.i+':'+k2; if(!out.pk.has(kk)){ out.pk.add(kk); out.hits[key]=(out.hits[key]||0)+1; } } } }
    out.max=Math.max(out.max,n); }
  out.incidents=out.pk.size; delete out.pk; return out; };
"""
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=b.new_page(viewport={'width':1280,'height':720}); pg.on('pageerror',lambda e:print('ERR',e.stack))
    pg.route('**fonts.g*/**',lambda r:r.abort()); pg.add_init_script('window.__CAPTURE=true')
    pg.route('http://local/x.html',lambda r:r.fulfill(body=html,content_type='text/html'))
    pg.goto('http://local/x.html'); pg.wait_for_function('!!window.__london',timeout=300000)
    pg.evaluate(JS); pg.evaluate("window.__noDraw=true;window.__london.GAME.start(false);for(let i=0;i<120;i++)window.__london.step(1/30)")
    furn=json.load(open(a.furn)) if a.furn else None
    print('solids',pg.evaluate("f=>window.__solids(f)",furn))
    if a.dump_furn: json.dump(pg.evaluate("window.__furn"),open(a.dump_furn,'w'))
    tot={'samples':0,'ped':0,'dog':0,'pedIn':0,'dogIn':0,'incidents':0}; allhits={}
    for h in [float(x) for x in a.hours.split(',')]:
        hs={'ped':0,'pedIn':0,'dog':0,'dogIn':0,'incidents':0}
        for name,x,z,yaw in SPOTS:
            r=pg.evaluate(f"window.__run({x},{z},{yaw},{h},{a.secs})")
            for k in tot: tot[k]+=r[k]
            for k in hs: hs[k]+=r[k]
            for k,v in r['hits'].items(): allhits[f'h{h:g} {name} '+k]=v
            print(f"  h{h:>4g} {name:17s} ped-samples {r['ped']:6d} inside {r['pedIn']:4d}  dog-samples {r['dog']:5d} inside {r['dogIn']:4d}  incidents {r['incidents']:3d}  max out {r['max']}  {r['acts']}",flush=True)
        print(f"hour {h:g}: people inside {hs['pedIn']}/{hs['ped']}  dogs inside {hs['dogIn']}/{hs['dog']}  incidents {hs['incidents']}",flush=True)
    print('TOTAL',json.dumps(tot))
    kinds={}
    for k,v in allhits.items(): w=k.split(' '); kk=' '.join(w[2:5]); kinds[kk]=kinds.get(kk,0)+v
    print('incidents by who/act/what:',json.dumps(dict(sorted(kinds.items(),key=lambda q:-q[1]))))
    for k,v in sorted(allhits.items())[:40]: print('  ',k,v)
    if a.shots:
        os.makedirs(a.shots,exist_ok=True); pg.evaluate("window.__noDraw=false")
        stops=pg.evaluate("window.__crowd.spots.stops.map(s=>[s.x,s.z,s.ax,s.side])")
        views=[]
        for i,(sx,sz,ax,side) in enumerate(stops[:3]):
            # stand on the pavement 7 m along from the shelter, looking at it
            if ax=='x': views.append((f'shelter{i}',sx+7,sz-side*0.3,-1.57-0.25*side))
            else: views.append((f'shelter{i}',sx-side*0.3,sz+7,3.14+0.25*side))
        views+= [('corner_bgr_wilmot',-30,1.5,0.9),('corner_columbia',-157,-104.5,1.2),('corner_cheshire',96,115.5,1.9)]
        for name,x,z,yaw in views:
            for h in [13,19]:
                pg.evaluate(f"(()=>{{ const L=window.__london,P=L.GAME.P; L.TOD.rate=0; L.setHour({h}); P.x={x};P.z={z};P.yaw={yaw};P.pitch=-.08; window.__noDraw=true; for(let i=0;i<40*30;i++){{ P.x={x};P.z={z}; L.step(1/30); }} window.__noDraw=false; L.step(1/30); }})()")
                pg.screenshot(path=os.path.join(a.shots,f'{name}_h{h}.jpg'),quality=85,timeout=180000); print('shot',name,h,flush=True)
    b.close()
