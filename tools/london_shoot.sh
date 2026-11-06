#!/bin/bash
# Shoot frames from the player's eye: tools/london_shoot.sh <outdir> name,x,z,yaw,hour[,pitch[,feetY]] ... (feetY puts the player up on a roof)
# Three shots per browser launch (one browser at a time: more runs out of memory). The player is placed, the world runs ~7 s, then the frame is taken.
cd "$(dirname "$0")/.."; S=$1; shift; mkdir -p "$S"
L='const L=window.__london; L.GAME.start(false); const P=L.GAME.P; const go=(x,z,yaw,h,pitch,ey)=>{P.x=x;P.z=z;P.yaw=yaw;P.pitch=pitch??-.04;if(ey!==undefined){P.y=ey;P.vy=0;}L.setHour(h);for(let i=0;i<200;i++)L.step(1/30);P.x=x;P.z=z;P.yaw=yaw;if(ey!==undefined){P.y=ey;P.vy=0;}L.step(1/30);};'
args=(); n=0
while [ $# -gt 0 ]; do IFS=, read nm x z y h p e <<< "$1"; shift; args+=("$S/$nm.jpg" "$L;go($x,$z,$y,$h,${p:-undefined},${e:-undefined})"); n=$((n+1))
  if [ $n -eq 3 ] || [ $# -eq 0 ]; then timeout 900 python3 tools/london_cam.py "${args[@]}" 2>&1 | grep ERR | head -2; args=(); n=0; fi; done
