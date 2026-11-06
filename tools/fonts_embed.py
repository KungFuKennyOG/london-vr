# writes src/london/39-fonts.js: the sign faces (SIL OFL, via @fontsource) as base64 FontFaces, so the signs look the same on a Quest, a phone or a desktop
import base64,os
D=os.path.join(os.path.dirname(__file__),'..'); fd=os.path.join(D,'assets/fonts')
faces=[('LDN Lilita','lilita-one-latin-400-normal.woff2','400'),('LDN Oswald','oswald-latin-600-normal.woff2','600'),
       ('LDN Archivo','archivo-latin-700-normal.woff2','700'),('LDN Archivo','archivo-latin-500-normal.woff2','500'),('LDN Anton','anton-latin-400-normal.woff2','400')]
out=['/* ---------- sign faces: Lilita One, Oswald, Archivo, Anton (SIL Open Font License), embedded so every device paints the same signs ---------- */',
     'const FONT_FACES=[']
for fam,f,wt in faces:
    b=base64.b64encode(open(os.path.join(fd,f),'rb').read()).decode()
    out.append(f"  ['{fam}','{wt}','{b}'],")
out.append('];')
out.append("""const FONTS_READY=(()=>{ try{ return Promise.all(FONT_FACES.map(([fam,wt,b])=>{ const bin=atob(b),u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
  const ff=new FontFace(fam,u.buffer,{weight:wt}); document.fonts.add(ff); return ff.load(); })).catch(()=>null); } catch(e){ return Promise.resolve(null); } })();""")
open(os.path.join(D,'src/london/39-fonts.js'),'w').write('\n'.join(out)+'\n')
