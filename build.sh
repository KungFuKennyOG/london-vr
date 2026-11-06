#!/bin/bash
# Builds london.html: one self-contained page. The engine (src/engine, forked from Stairwell) and then src/london/*.js in name order.
set -e; cd "$(dirname "$0")"
python3 tools/fonts_embed.py
python3 - <<'PY'
import glob
parts=[open(f).read() for f in ['src/engine/10-engine.js','src/engine/40-helpers.js','src/engine/43-castkit.js','src/engine/51-gait.js']]+[open(f).read() for f in sorted(glob.glob('src/london/*.js'))]
open('london.html','w').write(open('src/london/00-head.html').read()+'\n'.join(parts)+'\n</script>\n')
PY
node -e "const fs=require('fs');const s=fs.readFileSync('london.html','utf8');const js=s.split('<script>')[1].split('</script>')[0];try{new Function(js);console.log('london.html syntax ok')}catch(e){console.log('london.html SYNTAX',e.message);process.exit(1)}"
