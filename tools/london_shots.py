#!/usr/bin/env python3
"""London VR review capture: the same six frames every pass, so before/after line up.
Usage: python3 tools/london_shots.py <outdir> [london.html] [only=01,06]
Needs Playwright with Chromium (SwiftShader WebGL2). UI is hidden; only the freeze card shows in 05."""
import sys,os
from playwright.sync_api import sync_playwright
out=sys.argv[1]; page_path=sys.argv[2] if len(sys.argv)>2 else os.path.join(os.path.dirname(__file__),'..','london.html')
html=open(page_path).read(); os.makedirs(out,exist_ok=True)
only=sys.argv[3].split('=')[1].split(',') if len(sys.argv)>3 else None
EYE="window.__london.state.eye=true;"
SHOTS=[ # name, setup js (camera goals are instant), all at 1280x720
 ('01_street_orbit',"window.__london.state.layout='street';window.__london.place();"),
 ('02_eye_street',EYE+"window.__london.setGoal({t:[0.5,1.77,2.0],th:1.0,ph:1.6,r:.04},true)"),
 ('03_eye_shop_glass',EYE+"window.__london.setGoal({t:[-7.3,1.77,-1.0],th:0,ph:1.66,r:.04},true)"),
 ('04_cast_lineup',"window.__london.state.eye=false;window.__london.state.layout='lineup';window.__london.place();window.__london.setGoal({t:[0,1.05,1.4],th:0,ph:1.42,r:7.4},true)"),
 ('05_freeze_degsy',"window.__london.state.layout='street';window.__london.place();window.__london.freezeOn('degsy');window.__london.cam.t=window.__london.goal.t.slice();Object.assign(window.__london.cam,{th:window.__london.goal.th,ph:window.__london.goal.ph,r:window.__london.goal.r})"),
 ('06_face_close',"window.__london.unfreeze();window.__london.state.eye=true;window.__london.setGoal({t:[-5.6,1.74,-.9],th:.55,ph:1.57,r:.04},true);window.__london.setGoal({t:[-5.6+Math.sin(.55)*.62,1.74,-.9+Math.cos(.55)*.62],th:.55,ph:1.57,r:.04},true)"),
]
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=b.new_page(viewport={'width':1280,'height':720}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('**fonts.g*/**',lambda r:r.abort()); pg.add_init_script('window.__CAPTURE=true')
    pg.route('http://local/x.html',lambda r:r.fulfill(body=html,content_type='text/html'))
    pg.goto('http://local/x.html'); pg.wait_for_function('!!window.__london',timeout=180000)
    for name,js in SHOTS:
        if only and name[:2] not in only and name[:2]!='01': pass
        pg.evaluate(js+';for(let k=0;k<30;k++)window.__london.step(1/30)')
        pg.screenshot(path=os.path.join(out,name+'.jpg'),quality=90,timeout=180000); print('shot',name,flush=True)
    b.close()
print('page errors:',errs or 'none')
