#!/usr/bin/env python3
"""Top-down plan of the London hub: walkable rects, solids by height, cops, cash, start, lock-up.
   python3 tools/london_map.py <out.png> [px_per_m] [x0 z0 x1 z1]"""
import sys,os,json
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
out=sys.argv[1]; S=float(sys.argv[2]) if len(sys.argv)>2 else 2
html=open(os.path.join(os.path.dirname(__file__),'..','london.html')).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page()
    pg.add_init_script('window.__CAPTURE=true'); pg.route('http://local/x.html',lambda r:r.fulfill(body=html,content_type='text/html'))
    pg.on('pageerror',lambda e:print('ERR',e)); pg.goto('http://local/x.html'); pg.wait_for_function('!!window.__london',timeout=180000)
    d=pg.evaluate("""(()=>{const G=window.__london.GAME; return {walk:G.WALK, sol:G.SOL.map(s=>[...s.r,s.y0,s.y1]), cash:G.CASH.map(c=>c.p), cops:G.COPS.map(c=>[c.pos,c.patrol]), start:G.START, lock:G.LOCKUP, extra:(window.__london.MAPX||[])}})()""")
    b.close()
xs=[r[0] for r in d['walk']]+[r[2] for r in d['walk']]; zs=[r[1] for r in d['walk']]+[r[3] for r in d['walk']]
if len(sys.argv)>6: X0,Z0,X1,Z1=map(float,sys.argv[3:7])
else: X0,Z0,X1,Z1=min(xs)-5,min(zs)-5,max(xs)+5,max(zs)+5
W,H=int((X1-X0)*S),int((Z1-Z0)*S); im=Image.new('RGB',(W,H),(14,16,18)); g=ImageDraw.Draw(im)
T=lambda x,z:((x-X0)*S,(z-Z0)*S)
for r in d['walk']: g.rectangle([*T(r[0],r[1]),*T(r[2],r[3])],fill=(70,74,78))
for (x0,z0,x1,z1,y0,y1) in sorted(d['sol'],key=lambda s:s[5]):
    h=min(1,y1/20); c=(int(120+135*h),int(90+60*(1-h)),int(60*(1-h)))
    if y0>.5: c=(80,140,200)
    g.rectangle([*T(x0,z0),*T(x1,z1)],fill=c,outline=(0,0,0))
for e in d['extra']: g.line([T(*a) for a in e['pts']],fill=tuple(e.get('c',(255,255,255))),width=e.get('w',1))
for c in d['cash']: x,y=T(c[0],c[2]); g.ellipse([x-3,y-3,x+3,y+3],fill=(60,220,90))
for pos,pat in d['cops']:
    x,y=T(*pos); g.ellipse([x-4,y-4,x+4,y+4],fill=(40,90,255))
    if pat: g.line([T(*q) for q in pat],fill=(40,90,255),width=1)
x,y=T(d['start']['x'],d['start']['z']); g.ellipse([x-5,y-5,x+5,y+5],fill=(255,255,255))
x,y=T(d['lock']['x'],d['lock']['z']); g.rectangle([x-5,y-5,x+5,y+5],fill=(255,160,40))
# 10 m grid labels
for gx in range(int(X0//50*50),int(X1)+1,50): g.line([T(gx,Z0),T(gx,Z1)],fill=(40,44,48)); g.text(T(gx+1,Z0+1),str(gx),fill=(150,150,150))
for gz in range(int(Z0//50*50),int(Z1)+1,50): g.line([T(X0,gz),T(X1,gz)],fill=(40,44,48)); g.text(T(X0+1,gz+1),str(gz),fill=(150,150,150))
im.save(out); print(out,W,H)
