#!/usr/bin/env python3
"""Headless playtest of the job: drives the player along waypoints with the real game rules and logs what happens.
usage: python3 tools/london_play.py <outdir> <scenario>   scenarios: near (walk east on the near pavement), far (sneak the far side), run"""
import sys,os,json
from playwright.sync_api import sync_playwright
out=sys.argv[1]; sc=sys.argv[2] if len(sys.argv)>2 else 'near'; os.makedirs(out,exist_ok=True)
html=open(os.path.join(os.path.dirname(__file__),'..','london.html')).read()
JS=r"""
window.__sim=function(pts,run,maxT,shots){ const L=window.__london,Gm=L.GAME,G=Gm.G,P=Gm.P,log=[]; let t=0,i=0,last='';
  const st=()=>`${G.phase}|stars${G.stars}|${Gm.COPS.map(c=>c.id+':'+c.state+':'+(Math.floor(c.sus*4)/4)).join(',')}|${G.result||''}`;
  while(t<maxT){ const w=pts[i]; let wait=false;
    if(w&&w.until){ const h=Gm.COPS[0]; const ok=w.until==='hughesEast'?(Math.sin(h.hd)>.7&&h.pos[0]>7.5&&h.state==='post'):w.until==='hughesWest'?(Math.sin(h.hd)<-.7&&h.pos[0]<6&&h.state==='post'):true; if(ok) i++; wait=true; }
    else if(w&&w.wait){ w.left=(w.left??w.wait)-1/30; if(w.left<=0) i++; wait=true; }
    else if(w&&w.grab){ Gm.tryGrab(null); i++; }
    else if(w&&w.jump){ Gm.jump(); i++; }
    else if(w){ const dx=w[0]-P.x,dz=w[1]-P.z,d=Math.hypot(dx,dz); if(d<.25) i++; else { P.yaw=Math.atan2(dx,dz); const sp=(w[2]||run)?3.5:1.6,s=Math.min(d,sp/30),o={x:P.x,z:P.z}; P.run=!!(w[2]||run); P.running=P.run; const bx=P.x,bz=P.z; if(Gm.standable(P.x+dx/d*s,P.z,.24)) P.x+=dx/d*s; if(Gm.standable(P.x,P.z+dz/d*s,.24)) P.z+=dz/d*s; if(Math.hypot(P.x-bx,P.z-bz)<s*.2){ w.stuck=(w.stuck||0)+1/30; if(w.stuck>1.5){ log.push('stuck at '+bx.toFixed(1)+','+bz.toFixed(1)); i++; } } } }
    else { P.running=false; }
    if(!w||w.wait||w.until) P.running=false;
    P.y=Math.max(P.y,0); L.step(1/30); t+=1/30; const s=st(); if(s!==last){ log.push(t.toFixed(1)+'s '+P.x.toFixed(1)+','+P.z.toFixed(1)+' '+s); last=s; }
    if(G.line&&!log.includes('say '+G.line.text)) log.push('say '+G.line.text);
    if(shots&&shots.length&&t>=shots[0]) { shots.shift(); log.push('SHOT@'+t.toFixed(1)); return {log,pause:true,t}; }
    if(G.phase==='leg2'&&!G.result){ log.push('RESULT done (arch 9; leg two open)'); break; } if(G.result) { for(let k=0;k<20;k++) L.step(1/30); log.push('RESULT '+G.result); break; } }
  return {log,t}; };
"""
DEG=[[11.6,0.2],[2,0.4],[-5.6,0.6],{'wait':11},[-7.3,2.3],[-7.3,3.5],{'grab':1}]
SC={'near':DEG+[[-6,2.0],[0,0.5],[10,0.5],[20,0.6],[31,-2.0]],
    'far':DEG+[[-5,6.0],[-1.5,10.9],[4,10.9],[9,12.4],[16,11.5],[24,11.2],[28,6],[31,-2.0]],
    'alley':DEG+[[-6.2,1.4],[-4.5,6],[-1.5,10.9],{'until':'hughesWest'},[11.6,10.9],[11.6,0.3],[11.6,-1.5],[11.6,-7.0],[12,-10],[28.3,-10]],
    'chase':DEG+[[-6.2,1.4],[1.0,1.2],[6,1.0,1],[11.6,0.0,1],[11.6,-1.5,1],[11.6,-7.0,1],[12,-10,1],[20,-10,1],{'wait':6},[28.3,-10]],
    'climb':DEG+[[-6.2,1.4],[1.0,1.2],[6,1.0,1],[11.6,0.0,1],[11.6,-1.5,1],[11.6,-7.0,1],[12,-9.2,1],[19.0,-9.2,1],{'jump':1},{'wait':1},{'jump':1},{'wait':1},[28.3,-10]],
    'estate':DEG+[[-12,1.4],[-14.85,0.5],[-14.85,-7],[-10,-12],[9.8,-12.5],[12,-10],[19.0,-9.2],{'jump':1},{'wait':1},{'jump':1},{'wait':1},[28.3,-10]],
    'run':DEG+[[-6,2.0],[0,0.5,1],[10,0.5,1],[20,0.6,1],[31,-2.0,1]]}
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=b.new_page(viewport={'width':1280,'height':720}); pg.on('pageerror',lambda e:print('ERR',e.stack))
    pg.route('**fonts.g*/**',lambda r:r.abort()); pg.add_init_script('window.__CAPTURE=true')
    pg.route('http://local/x.html',lambda r:r.fulfill(body=html,content_type='text/html'))
    pg.goto('http://local/x.html'); pg.wait_for_function('!!window.__london',timeout=180000)
    pg.evaluate(JS); pg.evaluate("window.__noDraw=true;window.__london.GAME.start(false)")
    r=pg.evaluate(f"window.__sim({json.dumps(SC[sc])},false,140,null)")
    print('\n'.join(r['log'])); print('t',r['t'])
    pg.evaluate('window.__noDraw=false;window.__london.step(1/30)'); pg.screenshot(path=os.path.join(out,sc+'_end.jpg'),quality=85,timeout=180000)
    b.close()
