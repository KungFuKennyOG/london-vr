#!/usr/bin/env python3
"""Draw calls and triangles for one view at five standard spots, plus load time and the hub's own stats line.
   python3 tools/london_perf.py"""
import os,time
from playwright.sync_api import sync_playwright
html=open(os.path.join(os.path.dirname(__file__),'..','london.html')).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page(viewport={'width':1280,'height':720})
    pg.on('console',lambda m:print(m.text) if 'hub:' in m.text else None); pg.on('pageerror',lambda e:print('ERR',e))
    pg.add_init_script("""window.__CAPTURE=true; window.__dc={n:0,t:0}; const _o=WebGL2RenderingContext.prototype.drawElements; WebGL2RenderingContext.prototype.drawElements=function(m,c,ty,o){ window.__dc.n++; window.__dc.t+=c/3; return _o.call(this,m,c,ty,o); };""")
    pg.route('http://local/x.html',lambda r:r.fulfill(body=html,content_type='text/html')); t=time.time(); pg.goto('http://local/x.html'); pg.wait_for_function('!!window.__london',timeout=300000); print('load s',round(time.time()-t,1))
    for name,x,z,yaw,h in [['highstreet',-118,11.6,-1.75,23.5],['start',11.6,-1.5,0,23.5],['bgr_west_day',-60,9,-1.57,13],['towers',178,-93,2.28,13],['park',-182,95,-1.9,19],['camheath_day',326,10,3.14,12]]:
        r=pg.evaluate(f"""(()=>{{ const L=window.__london; if(!L.GAME.G.on) L.GAME.start(false); const P=L.GAME.P; P.x={x};P.z={z};P.yaw={yaw};P.pitch=-.04; L.setHour({h}); for(let i=0;i<60;i++) L.step(1/30); window.__dc.n=0; window.__dc.t=0; L.step(1/30); return [window.__dc.n, Math.round(window.__dc.t)]; }})()""")
        print(f'{name:14s} draws {r[0]:4d}  tris {r[1]}')
    b.close()
