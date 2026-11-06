#!/usr/bin/env python3
"""Parkour audit: every obstacle that looks vaultable or climbable should be.
   Finds every solid whose top is 0.4-2.6 m above the ground next to it (street, yard, park or rooftop, anywhere you can
   stand), and from each open side puts the player 0.7 m off it, facing it, and jumps (standing, then a running jump).
   Each test is vaulted / mantled / over / fail; failures get the reason the game's rules gave.
   usage: python3 tools/london_parkour_audit.py <outdir> [--max N] [--area x0,z0,x1,z1] [--all] [--root <checkout>]
   writes <outdir>/parkour_audit.json (all failures, with reasons) and prints a table by kind.
   Run it under the browser lock: flock /tmp/london-browser.lock python3 tools/london_parkour_audit.py out"""
import sys, os, json, re, glob, collections
from playwright.sync_api import sync_playwright

args = sys.argv[1:]
out = args[0] if args and not args[0].startswith('--') else 'review/parkour'
MAXN = int(args[args.index('--max') + 1]) if '--max' in args else 4000
AREA = list(map(float, args[args.index('--area') + 1].split(','))) if '--area' in args else None
os.makedirs(out, exist_ok=True)
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
if '--root' in args: root = os.path.abspath(args[args.index('--root') + 1])   # audit another checkout's build (a baseline)
html = open(os.path.join(root, 'london.html')).read()

# map a line of london.html back to src file:line (build.sh: head + '\n'.join(parts))
files = ['src/engine/10-engine.js', 'src/engine/40-helpers.js', 'src/engine/43-castkit.js', 'src/engine/51-gait.js'] + \
        sorted(os.path.relpath(f, root) for f in glob.glob(os.path.join(root, 'src/london/*.js')))
head = open(os.path.join(root, 'src/london/00-head.html')).read()
starts = []; line = head.count('\n') + 1
for f in files:
    starts.append((line, f)); line += open(os.path.join(root, f)).read().count('\n') + 1
def srcline(n):
    best = None
    for st, f in starts:
        if st <= n: best = (f, n - st + 1)
    return best

JS = r"""
(opt)=>{ const MODES=['stand','touch','angle','run']; const L=window.__london, Gm=L.GAME, P=Gm.P, D=Gm.dbg, SOL=Gm.SOL, ACT=Gm.ACT, HX=L.hub();
  if(!D.obstacleAhead){ /* an older build (before obstacle clusters): diagnose with its single nearest solid */ const vl=D.vaultLand;
    D.obstacleAhead=(fx,fz,d)=>{ const a=D.solidAhead(fx,fz,d); return a&&{a,mem:[a],low:[a],top:a.s.y1,vtop:a.s.y1,end:a.t1,vend:a.t1,thick:a.thick,vthick:a.thick,bar:false}; };
    D.mantleOnto=(o,fx,fz)=>D.mantleSpot(o.a.s,fx,fz); D.vaultLand=(o,fx,fz)=>vl(o.a,fx,fz); }
  for(const v of L.LIFE().cars) v.alive=false;                  /* moving traffic off: only the fixed world */
  if(!Gm.G.on) Gm.start(false); Gm.G.result=null;
  const dt=1/30, R=P.r;
  /* who built it: the first frames of the stack below sol/hsol */
  const who=s=>{ const st=(s.src||'').split('\n').slice(1).map(l=>{ const m=l.match(/at (?:(\S+) \()?.*?:(\d+):(\d+)\)?$/); return m?{fn:m[1]||'?',ln:+m[2]}:null; }).filter(Boolean);
    const fr=st.filter(f=>!/^(sol|hsol|Object\.sol|GAME\.sol)$/.test(f.fn)); return {fns:fr.slice(0,4).map(f=>f.fn), ln:fr.length?fr[0].ln:0}; };
  const SIDES=[[-1,0],[1,0],[0,-1],[0,1]];   /* outward normal of the face we jump at */
  const tests=[];
  for(let si=0;si<SOL.length;si++){ const s=SOL[si], r=s.r;
    if(opt.area&&(r[2]<opt.area[0]||r[0]>opt.area[2]||r[3]<opt.area[1]||r[1]>opt.area[3])) continue;
    if(s.y1-s.y0<.05&&s.y1>20) continue;
    for(const [nx,nz] of SIDES){ const along=nx?[r[1],r[3]]:[r[0],r[2]], Lf=along[1]-along[0]; if(Lf<.08) continue;
      const n=Math.max(1,Math.min(4,Math.round(Lf/3.5)));
      for(let k=0;k<n;k++){ const t=along[0]+Lf*(k+.5)/n, face=nx<0?r[0]:nx>0?r[2]:nz<0?r[1]:r[3];
        const dist=R+.46, x=nx?face+nx*dist:t, z=nz?face+nz*dist:t;
        if(HX&&!HX.walk(x,z,0)&&!D.inWalk(x,z,R)) continue;
        /* the ground you'd stand on here, below the obstacle's top by at least 0.4 m */
        const g=D.groundAt(x,z,s.y1-.4-D.STEP); const h=s.y1-g; if(h<.4||h>2.6) continue;
        if(s.y0>g+D.BODY+.9) continue;                         /* overhead, out of reach */
        if(!D.free(x,z,g)) continue;
        /* hidden: this bit of face is inside something at least as tall (a garden wall run into a house) */
        const fxp=nx?face+nx*.02:t, fzp=nz?face+nz*.02:t; let hid=false; for(const o of SOL){ if(o===s||o.y1<s.y1-.01||o.y0>g+.3) continue; const q=o.r; if(fxp>q[0]&&fxp<q[2]&&fzp>q[1]&&fzp<q[3]){ hid=true; break; } } if(hid) continue;
        tests.push({si,x,z,nx,nz,g,h,face,t}); } } }
  /* spread: one test per 1.5 m cell per solid side when the cap bites */
  let T=tests; if(T.length>opt.max){ const step=T.length/opt.max; const o=[]; for(let i=0;i<opt.max;i++) o.push(T[Math.floor(i*step)]); T=o; }
  const res=[];
  const place=(x,z,y,yaw)=>{ P.x=x; P.z=z; P.y=y; P.vy=0; P.vx=P.vz=0; P.ground=true; P.yaw=yaw; P.run=false; ACT.on=false; };
  /* one jump at the obstacle. mode: stand (0.7 m off, square on), touch (right up against it), angle (0.7 m off, 30 degrees
     off square, aimed at the same spot), run (a 1.8 m run-up, jump at 0.7 m) */
  const sim=(te,mode,k)=>{ const s=SOL[te.si], tx=te.nx?0:1, tz=te.nx?1:0, fpx=te.nx?te.face:te.t, fpz=te.nx?te.t:te.face;
    let ox=te.nx, oz=te.nz, dist=R+.46;
    if(mode==='touch') dist=R+.03;
    if(mode==='angle'){ const a=(k%2?1:-1)*Math.PI/6, c=Math.cos(a), sn=Math.sin(a); ox=te.nx*c+tx*sn; oz=te.nz*c+tz*sn; dist=(R+.46)/c; }
    if(mode==='run') dist=R+.46+1.8;
    const x=fpx+ox*dist, z=fpz+oz*dist, fx=-ox, fz=-oz, yaw=Math.atan2(fx,fz);
    if(mode!=='stand'){ if(!D.free(x,z,te.g)||Math.abs(D.groundAt(x,z,te.g)-te.g)>.03) return null; }
    place(x,z,te.g,yaw); let kind='', top=te.g, crossed=false;
    if(mode==='run'){ P.run=true; let n=0; while(n++<40){ const d=(te.nx?(P.x-te.face)*te.nx:(P.z-te.face)*te.nz); if(d<=R+.46) break; Gm.bodyTick(dt,1,0,yaw); if(!P.ground) return null; }
      if(n>=40) return {blocked:true}; }
    const o=D.obstacleAhead(fx,fz,.8), a=o&&o.a, diag=a?{ahead:a.s===s?'self':SOL.indexOf(a.s), pieces:o.mem.length, inc:o.mem.some(m=>m.s===s), ay1:+a.s.y1.toFixed(2), top:+o.top.toFixed(2), vtop:+o.vtop.toFixed(2), ah:+(o.top-P.y).toFixed(2), thick:+o.vthick.toFixed(2), bar:o.bar}:{ahead:'none'};
    if(o){ diag.vland=!!D.vaultLand(o,fx,fz); diag.mspot=!!D.mantleOnto(o,fx,fz,D.REACH_GROUND);
      /* why the mantle spot was refused on each piece in reach, at the middle probe */
      if(!diag.mspot) diag.mwhy=o.mem.filter(m=>m.s.y1-P.y<=D.REACH_GROUND+.04).map(m=>{ const s2=m.s, hh=D.rayRect(P.x,P.z,fx,fz,s2.r), t0=hh?Math.max(0,hh[0]):0, mx=P.x+fx*(t0+.2), mz=P.z+fz*(t0+.2), gg=D.groundAt(mx,mz,s2.y1);
        const hs=D.solidHit(mx,mz,R*.5,gg,gg+D.BODY); return SOL.indexOf(s2)+':'+(s2.bar?'bar':gg<s2.y1-.03?'ground '+gg.toFixed(2):!D.inWalk(mx,mz,0)?'walk':hs?'head '+SOL.indexOf(hs)+' y'+hs.y0.toFixed(2)+'-'+hs.y1.toFixed(2):'?'); }).join(', ')||'out of reach';
      if(!diag.vland&&o.vtop-P.y<=1.34){ const x2=P.x+fx*(o.vend+.35), z2=P.z+fz*(o.vend+.35), g2=D.groundAt(x2,z2,o.vtop); const hs=D.solidHit(x2,z2,R,g2,g2+D.BODY);
        diag.vwhy=o.vthick>1.1?'thick':g2>o.vtop?'ground '+g2.toFixed(2):!D.inWalk(x2,z2,R)?'walk':hs?'solid '+SOL.indexOf(hs)+' y'+hs.y0.toFixed(2)+'-'+hs.y1.toFixed(2):!D.pathClear(x2,z2,o.vtop+.14,new Set(o.low.map(m=>m.s)),1.15)?'path':'?'; } }
    const px=P.x, pz=P.z;
    Gm.jump(); if(ACT.on) kind=ACT.kind;
    for(let i=0;i<40;i++){ Gm.bodyTick(dt,1,0,yaw); if(!ACT.on&&P.ground){ top=Math.max(top,P.y); }
      const past=te.nx?(P.x-(te.nx<0?s.r[2]:s.r[0]))*-te.nx:(P.z-(te.nz<0?s.r[3]:s.r[1]))*-te.nz; if(past>R*.5&&P.ground&&!ACT.on) crossed=true; if(crossed&&i>12) break; }
    let out=kind==='vault'?'vault':kind==='mantle'?'mantle':(top>=te.g+.35?'onto':crossed?'over':'fail');
    if(out==='fail'){ /* by design: a wall out of reach standing right behind it (a sliver of garden wall proud of a house) */
      const tf=Math.hypot(fpx-px,fpz-pz), th=te.nx?s.r[2]-s.r[0]:s.r[3]-s.r[1];
      for(const o2 of SOL){ if(o2.y1<=te.g+D.REACH_GROUND+.05||o2.y0>te.g+1) continue; const hh=D.rayRect(px,pz,fx,fz,o2.r); if(hh&&hh[1]>0&&hh[0]<tf+th/Math.max(.5,Math.abs(fx*te.nx+fz*te.nz))+.3){ diag.backed=SOL.indexOf(o2); break; } } }
    return {out,diag,at:[+px.toFixed(2),+pz.toFixed(2)],end:[+P.x.toFixed(2),+P.y.toFixed(2),+P.z.toFixed(2)]}; };
  let k=0; for(const te of T){ const s=SOL[te.si], w=who(s), r_={si:te.si,x:+te.x.toFixed(2),z:+te.z.toFixed(2),side:te.nx<0?'w':te.nx>0?'e':te.nz<0?'n':'s',g:+te.g.toFixed(2),h:+te.h.toFixed(2),
      r:s.r.map(v=>+v.toFixed(2)),y0:+s.y0.toFixed(2),y1:+s.y1.toFixed(2),fns:w.fns,ln:w.ln};
    for(const m of MODES) r_[m]=sim(te,m,k++); res.push(r_); }
  /* every other solid a reason names, so the report can say what it is */
  const refs={}; for(const t of res) for(const m of MODES){ const d=t[m]&&t[m].diag; if(!d) continue; const ids=(String(d.mwhy||'')+' '+String(d.vwhy||'')).match(/(?:head|solid) (\d+)/g)||[]; if(typeof d.ahead==='number') ids.push('x '+d.ahead);
    for(const q of ids){ const i=+q.split(' ')[1], s=SOL[i]; if(s&&!refs[i]){ const w=who(s); refs[i]={r:s.r.map(v=>+v.toFixed(2)),y0:+s.y0.toFixed(2),y1:+s.y1.toFixed(2),fns:w.fns,ln:w.ln}; } } }
  return {n:tests.length,ran:T.length,sol:SOL.length,res,refs}; }
"""

def kind_of(t, src):
    fns = t['fns']; f = ' '.join(fns); w = t['r'][2] - t['r'][0]; d = t['r'][3] - t['r'][1]; th = min(w, d); ln = max(w, d); h = t['y1'] - t['y0']
    file = src[0] if src else ''
    if 'carPark' in f or 'vkPark' in f: return 'car'
    if 'bin' in fns[:1]: return 'bin'
    if 'postbox' in f: return 'postbox'
    if 'railing' in f: return 'railing'
    if 'awning' in f: return 'awning'
    if 'cage' in f: return 'fence (cage)'
    if 'heras' in f: return 'heras (edge)'
    if 'hoarding' in f: return 'hoarding (edge)'
    if 'van' in fns[:1] or 'bus' in fns[:1]: return 'edge vehicle'
    if 'steps' in f or 'flight' in f: return 'steps/stair'
    if 'lamp' in fns[:1] or 'tree' in fns[:1]: return 'post'
    if 'solR' in f: return 'turned box (solR)'
    if 'lotBox' in f: return 'lot box (yard/garden)'
    if '48d3' in file: return 'vertical kit'
    if '48j' in file: return 'dressing'
    if '48c-hub' in file: return 'lot (wall/garage/ext)'
    if '48d-hub' in file: return 'landmark'
    if '48d2' in file: return 'edge'
    if '48-game' in file: return 'core street'
    if th < .35 and h > .4: return 'thin wall/fence'
    return 'other'

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={'width': 640, 'height': 360}); pg.on('pageerror', lambda e: print('ERR', e))
    pg.route('**fonts.g*/**', lambda r: r.abort()); pg.add_init_script('window.__CAPTURE=true;window.__AUDIT=true;window.__noDraw=true')
    pg.route('http://local/x.html', lambda r: r.fulfill(body=html, content_type='text/html'))
    pg.goto('http://local/x.html'); pg.wait_for_function('!!window.__london', timeout=300000)
    pg.evaluate("window.__noDraw=true;window.__london.GAME.start(false)")
    r = pg.evaluate(JS, {'max': MAXN, 'area': AREA})
    b.close()

res = r['res']; print(f"solids {r['sol']}, obstacle faces tested {r['ran']} (of {r['n']}), each: standing square on, touching, at 30 degrees, running")
PASS = ('vault', 'mantle', 'onto', 'over')
def verdict(m):
    """ok / design (refused on purpose) / FAIL / None (no room to try it from there)"""
    if not m or 'out' not in m: return None
    if m['out'] in PASS: return 'ok'
    d = m['diag']
    if d.get('bar') or 'backed' in d or (d.get('mwhy') == 'out of reach' and not d.get('inc')): return 'design'
    return 'FAIL'
def reason(d):
    if d.get('bar'): return 'by design: edge barrier'
    if 'backed' in d: return 'by design: wall out of reach right behind it'
    if d.get('ahead') == 'none': return 'nothing ahead'
    if not d.get('inc'): return 'another solid nearer, not touching it'
    if d.get('mwhy') == 'out of reach': return 'out of reach'
    return 'no foothold on top, no vault landing'
by = collections.defaultdict(collections.Counter); fails = []; why = collections.Counter()
for t in res:
    src = srcline(t['ln']) if t['ln'] else None
    t['src'] = f"{src[0]}:{src[1]}" if src else ''
    k = kind_of(t, src); t['kind'] = k
    v = {m: verdict(t[m]) for m in ('stand', 'touch', 'angle', 'run')}
    if v['stand'] in ('FAIL', 'design') and v['run'] == 'ok': v['stand'] = 'ok'          # a running jump gets you over: fine
    t['v'] = v; by[k]['tests'] += 1
    worst = 'FAIL' if 'FAIL' in v.values() else 'design' if 'design' in v.values() else 'ok'
    t['verdict'] = worst; by[k][worst] += 1
    for m in ('stand', 'touch', 'angle'):
        if v[m] == 'FAIL': by[k]['F' + m] += 1
    if t['stand'] and t['stand']['out'] in PASS: by[k][t['stand']['out']] += 1
    if worst != 'ok':
        fails.append(t)
        for m in ('stand', 'touch', 'angle'):
            if v[m] in ('FAIL', 'design'): why[f"{m:5s} {reason(t[m]['diag'])}"] += 1
print(f"\n{'kind':24s} {'faces':>6s} {'ok':>6s} {'design':>6s} {'FAIL':>5s} | FAIL by: stand touch angle | stand: vault mantle onto")
tot = collections.Counter()
for k in sorted(by, key=lambda k: (-by[k]['FAIL'], -by[k]['tests'])):
    c = by[k]; tot.update(c)
    print(f"{k:24s} {c['tests']:6d} {c['ok']:6d} {c['design']:6d} {c['FAIL']:5d} |         {c['Fstand']:5d} {c['Ftouch']:5d} {c['Fangle']:5d} |        {c['vault']:5d} {c['mantle']:6d} {c['onto']:4d}")
print(f"{'TOTAL':24s} {tot['tests']:6d} {tot['ok']:6d} {tot['design']:6d} {tot['FAIL']:5d} |         {tot['Fstand']:5d} {tot['Ftouch']:5d} {tot['Fangle']:5d}")
print("  ok: every approach vaulted it, climbed it or got over it; design: refused on purpose (an edge barrier, or a wall out of\n"
      "  reach right behind it); FAIL: looks passable and one of the approaches can't get over or onto it")
print('\nrefusals by approach and reason:'); [print(f'  {n:5d}  {k}') for k, n in why.most_common()]
for i, o in r['refs'].items():
    src = srcline(o['ln']) if o['ln'] else None; o['src'] = f"{src[0]}:{src[1]}" if src else ''
json.dump({'refs': r['refs'], 'summary': {k: dict(v) for k, v in by.items()}, 'fails': fails, **({'all': res} if '--all' in args else {})}, open(os.path.join(out, 'parkour_audit.json'), 'w'), indent=1)
print('wrote', os.path.join(out, 'parkour_audit.json'), len(fails), 'faces refused somewhere,', sum(t['verdict'] == 'FAIL' for t in fails), 'FAIL')
