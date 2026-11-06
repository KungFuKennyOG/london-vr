#!/usr/bin/env python3
"""Writes docs/frontages.json and docs/FRONTAGES.md: every street side of every generated block, with the key a hand-written
   frontage uses (HAND['key']=[...] in src/london/48c*-hand-*.js), its extent along the street, length, depth and whether it's hand-written."""
import os,json
from playwright.sync_api import sync_playwright
D=os.path.join(os.path.dirname(__file__),'..')
html=open(os.path.join(D,'london.html')).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page()
    pg.add_init_script('window.__CAPTURE=true'); pg.route('http://local/x.html',lambda r:r.fulfill(body=html,content_type='text/html'))
    pg.goto('http://local/x.html'); pg.wait_for_function('!!window.__london',timeout=300000)
    F=pg.evaluate('window.__london.FRONTAGES'); T=pg.evaluate('window.__london.TRADES'); b.close()
json.dump(F,open(os.path.join(D,'docs/frontages.json'),'w'),indent=0)
lines=['# Frontages','','Every street side of every generated block. Key format `street:side:midpoint`. Lengths in metres. `hand` = already written.','',f'Trades: {", ".join(T)}','','| key | street | side | from | to | len | depth | kind | hand |','|---|---|---|---|---|---|---|---|---|']
for f in sorted(F,key=lambda f:(f['street'],f['side'],f['from'])): lines.append(f"| `{f['key']}` | {f['street']} | {f['side']} | {f['from']} | {f['to']} | {f['len']} | {f['depth']} | {f['frontage']} | {'yes' if f['hand'] else ''} |")
open(os.path.join(D,'docs/FRONTAGES.md'),'w').write('\n'.join(lines)+'\n'); print(len(F),'frontages,',sum(1 for f in F if f['hand']),'hand-written, total length',round(sum(f['len'] for f in F)),'m')
