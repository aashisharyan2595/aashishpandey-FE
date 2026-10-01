#!/usr/bin/env python3
"""One-off patch applied to world-v7.js on 2026-10-01: 160 km/h top speed, 180 with boost, a launch kick on Shift,
and a much stronger sense of speed (field of view, edge blur, camera pull-back and vibration, longer wind streaks, exhaust sparks).
The speedometer shows true speed x 6, so 160 on the display is 26.67 m/s and 180 is 30 m/s.
world-v7.js is the source of truth; this script is a record and fails loudly if an anchor is missing. Run from the repo root."""
import sys
p = 'world-v7.js'
s = open(p, encoding='utf8').read()

def sub(label, old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        sys.exit('anchor "%s" matched %d times, expected %d: %r' % (label, n, count, old[:90]))
    s = s.replace(old, new)

# state
sub('vars', "let steerIn = 0, leanV = 0, lonAcc = 0, fsPrev = 0, rollS = 0, csN = 0;",
    "let steerIn = 0, leanV = 0, lonAcc = 0, fsPrev = 0, rollS = 0, csN = 0, punch = 0, boostHold = 0, boostWas = false, punchCd = 0, punchFx = false;")
sub('PH', "const PH = { lon: 0, roll: 0, landK: 0, steerVis: 0 };", "const PH = { lon: 0, roll: 0, landK: 0, steerVis: 0, punch: 0 };")

# Shift: a launch kick on the press, then a stronger burst that builds the longer it is held
sub('punch', "boost = keys.boost && thr > 0 ? 1 : (orbBoostT > 0 && thr > 0 ? 0.8 : 0); boostAmt += (boost - boostAmt) * (1 - Math.exp(-dt * 4));",
    "boost = keys.boost && thr > 0 ? 1 : (orbBoostT > 0 && thr > 0 ? 0.8 : 0); boostAmt += (boost - boostAmt) * (1 - Math.exp(-dt * 4));\n"
    "      { const bKey = !!keys.boost && thr > 0; boostHold = bKey ? boostHold + dt : Math.max(0, boostHold - dt * 2); punchCd -= dt;\n"
    "        if (bKey && !boostWas && punchCd <= 0 && grounded) { punch = 1; punchCd = 1.3; fs += 1.2; shake = Math.max(shake, 0.25); punchFx = true; }\n"
    "        boostWas = bKey; punch *= Math.exp(-dt * 2.4); }")

# 160 km/h on the road (26.67 m/s on the display scale), 180 with boost; dirt and sand stay lower
sub('top', "topS = (onRoad ? 27 : sandy ? 17 : 22) + boostAmt * 10;", "topS = (onRoad ? 26.67 : sandy ? 18 : 24) + Math.max(boostAmt, punch) * 3.33;")
sub('accel', "const accel = thr > 0 ? (fs < 0 ? 22 : 13 + boostAmt * 10) * (1 - Math.min(0.8, Math.max(0, fs) / topS)) :",
    "const accel = thr > 0 ? (fs < 0 ? 22 : 13 + boostAmt * (9 + 6 * sstep(0.3, 2.5, boostHold)) + punch * 34) * clamp((topS * 1.06 - Math.max(0, fs)) / (topS * 0.25), 0, 1) :")
sub('cap', "fs = clamp(fs, -6, topS + 5);", "fs = Math.max(fs, -6); if (fs > topS) fs += (topS - fs) * Math.min(1, dt * 10);")
sub('wheelie', "wheelie += ((grounded && thr > 0 && fs > 1 && fs < 9 ? 0.16 + boostAmt * 0.12 : 0) - wheelie) * (1 - Math.exp(-dt * 5));",
    "wheelie += ((grounded && thr > 0 && fs > 1 && fs < 9 ? 0.16 + boostAmt * 0.12 : 0) + (grounded ? punch * 0.22 : 0) - wheelie) * (1 - Math.exp(-dt * 6));")
sub('curSpeed', "curSpeed += (Math.min(spd, 30) - curSpeed)", "curSpeed += (Math.min(spd, 34) - curSpeed)")
sub('relax', "if (!free) { rollS *= Math.exp(-dt * 5);", "if (!free) { punch *= Math.exp(-dt * 5); boostHold = 0; boostWas = false; rollS *= Math.exp(-dt * 5);")

# camera: wider field of view with speed and a spike on the punch; pulls back and drops lower; vibrates at speed
sub('fov', "{ const fT = (camera.aspect < 1 ? 64 : 52) + clamp((curSpeed - 12) / 18, 0, 1) * 6 + boostAmt * 5; if (Math.abs(camera.fov - fT) > 0.03) { camera.fov += (fT - camera.fov) * (1 - Math.exp(-dt * 3)); camera.updateProjectionMatrix(); } }",
    "{ const fk = camera.aspect < 1 ? 0.7 : 1, fT = (camera.aspect < 1 ? 64 : 52) + (free && !reduceMotion ? (sstep(5, 26, curSpeed) * 9 + boostAmt * 3 + punch * 3.5) * fk : clamp((curSpeed - 12) / 18, 0, 1) * 6 + boostAmt * 5); if (Math.abs(camera.fov - fT) > 0.03) { camera.fov += (fT - camera.fov) * (1 - Math.exp(-dt * (punch > 0.15 ? 5 : 3))); camera.updateProjectionMatrix(); } }")
sub('camD', "D = (free ? 6.4 : 5.6) + dwell * 1.2 + cc[2] * dwell * 1.5;",
    "D = (free ? 6.4 + (reduceMotion ? 0 : sstep(8, 27, curSpeed) * 0.8 + punch * 1.0) : 5.6) + dwell * 1.2 + cc[2] * dwell * 1.5;")
sub('camY', "chase.y = bp.y + 2.1 + cc[2] * dwell + pitchOff * D;",
    "chase.y = bp.y + 2.1 - (free && !reduceMotion ? sstep(8, 27, curSpeed) * 0.3 : 0) + cc[2] * dwell + pitchOff * D;")
sub('vib', "chase.y += (Math.random() - 0.5) * 0.12 * shake; }",
    "chase.y += (Math.random() - 0.5) * 0.12 * shake; }\n"
    "    if (free && !reduceMotion) { const vb = Math.pow(clamp(curSpeed / 26.7, 0, 1.15), 3) * 0.02 + boostAmt * 0.008; if (vb > 0.002) { chase.x += (Math.random() - 0.5) * vb; chase.y += (Math.random() - 0.5) * vb * 0.7; } }")

# wind streaks: more of them, longer, faster, stronger on boost
sub('sAmt', "const sAmt = clamp((curSpeed - 7) / 14, 0, 1) * (0.7 + boostAmt * 0.5);", "const sAmt = clamp((curSpeed - 6) / 18, 0, 1) * (0.8 + boostAmt * 0.6 + punch * 0.8);")
sub('sOp', "streakMat.opacity = sAmt * 0.28;", "streakMat.opacity = sAmt * 0.26;")
sub('sV', "s.z += dt * (curSpeed * 1.8 + 6);", "s.z += dt * (curSpeed * 2.6 + 6);")
sub('sL', "wO.scale.set(1, 1, s.l * (0.3 + sAmt * 1.6));", "wO.scale.set(1, 1, s.l * (0.3 + sAmt * 2.6));")

# radial blur toward the screen edges, stronger with speed and on the punch
sub('postU', "focus: { value: 0 }, texelF:", "focus: { value: 0 }, speedFx: { value: 0 }, texelF:")
sub('postDecl', "uniform float time,night,bloomAmt,focus;", "uniform float time,night,bloomAmt,focus,speedFx;")
sub('postBlur', "void main(){ vec3 c=texture2D(map,vUv).rgb;\n        if(focus>0.001){",
    "void main(){ vec3 c=texture2D(map,vUv).rgb;\n"
    "        if(speedFx>0.003){ vec2 dc=vUv-vec2(.5,.47); float sa=smoothstep(.5,1.05,length(dc*vec2(1.25,1.)))*speedFx; if(sa>0.002){ vec2 st=-dc*sa*.05; vec3 acc=c; acc+=texture2D(map,vUv+st).rgb; acc+=texture2D(map,vUv+st*2.).rgb; acc+=texture2D(map,vUv+st*3.).rgb; acc+=texture2D(map,vUv+st*4.).rgb; acc+=texture2D(map,vUv+st*5.).rgb; c=acc/6.; } }\n"
    "        if(focus>0.001){")
sub('vig', "float vig=1.0-smoothstep(0.46,1.02,length(ce))*0.3;", "float vig=1.0-smoothstep(0.46,1.02,length(ce))*(0.3+speedFx*0.06);")
sub('postSet', "postU.focus.value = tier >= 2 && !free && intro >= 1 ? dwell * 0.85 : 0;",
    "postU.focus.value = tier >= 2 && !free && intro >= 1 ? dwell * 0.85 : 0;\n"
    "    postU.speedFx.value = free && !reduceMotion && tier >= 1 && intro >= 1 ? clamp(sstep(18, 27, curSpeed) * 0.14 + boostAmt * 0.1 + punch * 0.16, 0, 0.45) : 0;")

# exhaust sparks: a burst on the punch, a trickle while boosting
sub('sparks', "PH.lon = lonAcc; PH.roll = rollS;",
    "PH.lon = lonAcc; PH.roll = rollS; PH.punch = punch;\n"
    "    if (free && !reduceMotion && (punchFx || boostAmt > 0.45)) { const ex = bp.x - fr.f.x * 1.0 + fr.r.x * 0.22, ez = bp.z - fr.f.z * 1.0 + fr.r.z * 0.22; if (punchFx) { burst(ex, bp.y + 0.45, ez, 4, '#ffc46b', 3.4, 0.5); burst(ex - fr.r.x * 0.44, bp.y + 0.45, ez - fr.r.z * 0.44, 4, '#ffc46b', 3.4, 0.5); } else if (Math.random() < dt * 12) burst(ex, bp.y + 0.45, ez, 1, '#ff9d4a', 1.1, 0.2); }\n"
    "    punchFx = false;")

# rider is thrown back by the kick
sub('riderPunch', "- PH.landK * 0.22; sz += -lean * 0.3 + PH.roll * 0.5; }", "- PH.landK * 0.22 + PH.punch * 0.3; sz += -lean * 0.3 + PH.roll * 0.5; }")

# debug probe additions
sub('probe', "roadX, roadW, roadDist }; } };", "roadX, roadW, roadDist, punch, boostAmt, curSpeed, fov: camera.fov }; } };")

open(p, 'w', encoding='utf8').write(s)
print('speed feel pass applied')
