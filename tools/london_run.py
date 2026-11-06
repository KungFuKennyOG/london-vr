#!/usr/bin/env python3
"""A bot runs (or walks) a route of waypoints across the hub; prints the time and any place it got stuck.
   python3 tools/london_run.py run|walk x0,z0 x1,z1 [x2,z2 ...]"""
import sys,os,json
from playwright.sync_api import sync_playwright
mode=sys.argv[1]; pts=[list(map(float,a.split(','))) for a in sys.argv[2:]]
html=open(os.path.join(os.path.dirname(__file__),'..','london.html')).read()
JS="""(([pts,run])=>{ const L=window.__london,G=L.GAME; window.__noDraw=true; G.start(false); const P=G.P; P.x=pts[0][0]; P.z=pts[0][1]; P.y=0.12; P.vy=0;
  let i=1,t=0,last=[P.x,P.z],lastT=0,stuck=[],dt=1/30;
  while(i<pts.length&&t<1500){ const [tx,tz]=pts[i], dx=tx-P.x, dz=tz-P.z, d=Math.hypot(dx,dz); if(d<1.5){ i++; continue; }
    P.yaw=Math.atan2(dx,dz); G.setInput(1,0,run); L.step(dt); t+=dt;
    if(t-lastT>3){ if(Math.hypot(P.x-last[0],P.z-last[1])<2){ stuck.push([+P.x.toFixed(1),+P.z.toFixed(1)]); if(G.jump) G.jump(); P.x+=Math.sin(P.yaw+1.57)*0.6; P.z+=Math.cos(P.yaw+1.57)*0.6; } last=[P.x,P.z]; lastT=t; }
    if(G.G.result){ return {t,abort:G.G.result,at:[P.x,P.z]}; } }
  return {t:+t.toFixed(1),reached:i>=pts.length,at:[+P.x.toFixed(1),+P.z.toFixed(1)],stuck:stuck.slice(0,20)}; })"""
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page()
    pg.add_init_script('window.__CAPTURE=true'); pg.route('http://local/x.html',lambda r:r.fulfill(body=html,content_type='text/html'))
    pg.on('pageerror',lambda e:print('ERR',e)); pg.goto('http://local/x.html'); pg.wait_for_function('!!window.__london',timeout=300000)
    r=pg.evaluate(JS,[pts,mode=='run']); print(json.dumps(r)); 
    if 't' in r: print('minutes',round(r['t']/60,2))
    b.close()
