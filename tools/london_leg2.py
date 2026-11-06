from playwright.sync_api import sync_playwright
import json,sys
html=open(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','london.html')).read()
RUN=sys.argv[1]=='run' if len(sys.argv)>1 else False
JS="""(([run])=>{ const L=window.__london,G=L.GAME; window.__noDraw=true; G.start(false); const leg2Start=window.__london.leg2; const P=G.P; for(let i=0;i<5;i++) L.step(1/30);
  G.G.hasBag=true; leg2Start(); P.x=18; P.z=-10; for(let i=0;i<10;i++) L.step(1/30);
  const pts=[[10,-9.0],[-14.8,-9.0],[-14.8,-1],[-17.2,-1],[-17.2,-90.5],[-175.3,-90.5],[-175.3,139.8],[-548,139.8],[-550,142.4]]; let i=0,t=0,log=[],fr=0,dt=1/30,ev=[]; let st=0;
  while(t<900&&i<pts.length){ const [tx,tz]=pts[i],dx=tx-P.x,dz=tz-P.z; if(Math.hypot(dx,dz)<1.2){ i++; continue; } P.yaw=Math.atan2(dx,dz); if(!window.__lp||Math.hypot(P.x-window.__lp[0],P.z-window.__lp[1])>.02){ window.__lp=[P.x,P.z]; window.__st=0; } else if(++window.__st>20){ ev.push(["stall",+P.x.toFixed(1),+P.z.toFixed(1)]); P.x+=Math.cos(P.yaw)*.6; P.z-=Math.sin(P.yaw)*.6; window.__st=0; } G.setInput(1,0,run); L.step(dt); t+=dt;
    if(G.G.stars!==st){ ev.push([+t.toFixed(1),'stars',G.G.stars,+P.x.toFixed(0),+P.z.toFixed(0)]); st=G.G.stars; }
    if(G.G.result){ ev.push([+t.toFixed(1),'RESULT',G.G.result]); break; } }
  for(let k=0;k<200&&!G.G.result;k++){ L.step(dt); t+=dt; if(G.G.result) ev.push([+t.toFixed(1),'RESULT',G.G.result]); }
  return {phase:G.G.phase,t:+t.toFixed(1),at:[+P.x.toFixed(0),+P.z.toFixed(0)],ev,obj:G.G.obj}; })"""
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page()
    pg.add_init_script('window.__CAPTURE=true'); pg.route('http://local/x.html',lambda r:r.fulfill(body=html,content_type='text/html'))
    pg.on('pageerror',lambda e:print('ERR',e)); pg.goto('http://local/x.html'); pg.wait_for_function('!!window.__london',timeout=300000)
    print(json.dumps(pg.evaluate(JS,[RUN]),indent=0))
    b.close()
