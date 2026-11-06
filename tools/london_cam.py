#!/usr/bin/env python3
"""Shoot arbitrary London frames: python3 tools/london_cam.py <out.jpg> '<setup js>' [<out2> '<js2>' ...]"""
import sys,os
from playwright.sync_api import sync_playwright
html=open(os.path.join(os.path.dirname(__file__),'..','london.html')).read(); pairs=list(zip(sys.argv[1::2],sys.argv[2::2]))
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=b.new_page(viewport={'width':1280,'height':720}); pg.on('pageerror',lambda e:print('ERR',e))
    pg.route('**fonts.g*/**',lambda r:r.abort()); pg.add_init_script('window.__CAPTURE=true')
    pg.route('http://local/x.html',lambda r:r.fulfill(body=html,content_type='text/html'))
    pg.goto('http://local/x.html'); pg.wait_for_function('!!window.__london',timeout=180000)
    for out,js in pairs:
        pg.evaluate(js+';for(let k=0;k<30;k++)window.__london.step(1/30)'); pg.screenshot(path=out,quality=90,timeout=180000); print('shot',out,flush=True)
    b.close()
