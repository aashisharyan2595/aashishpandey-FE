#!/usr/bin/env python3
"""One-off patch applied to world-v7.js on 2026-10-01: grip-limited turning, weight transfer, spring-damper lean,
cross-slope roll, weather grip, a visibly steering front end and a rider that responds to all of it.
world-v7.js is the source of truth (it was edited in place by the design tool), so this script is kept only as a record of what changed
and fails loudly if an anchor is missing. Run from the repo root: python3 scripts/physics-pass.py"""
import sys
p = 'world-v7.js'
s = open(p, encoding='utf8').read()

def sub(label, old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        sys.exit('anchor "%s" matched %d times, expected %d: %r' % (label, n, count, old[:80]))
    s = s.replace(old, new)

# state
sub('vars', "boostAmt = 0, wheelie = 0, surf = 0, freePitch = 0, jBuf = 0, coyote = 0, jHoldT = 0;",
    "boostAmt = 0, wheelie = 0, surf = 0, freePitch = 0, jBuf = 0, coyote = 0, jHoldT = 0;\n  let steerIn = 0, leanV = 0, lonAcc = 0, fsPrev = 0, rollS = 0, csN = 0;")
sub('PH', "wasNight: false, camF: 0 };",
    "wasNight: false, camF: 0 };\n  const PH = { lon: 0, roll: 0, landK: 0, steerVis: 0 }; // bike dynamics the rider and front end read: longitudinal accel, terrain roll, landing kick, bar angle")

# steering input eases in and out instead of snapping
sub('steerIn', "keyDir = clamp((keys.r || touch.r ? 1 : 0) - (keys.l || touch.l ? 1 : 0) + stickX, -1, 1);",
    "keyDir = clamp((keys.r || touch.r ? 1 : 0) - (keys.l || touch.l ? 1 : 0) + stickX, -1, 1); steerIn += (keyDir - steerIn) * (1 - Math.exp(-dt * (Math.abs(keyDir) >= Math.abs(steerIn) ? 7 : 11)));")

# grip: wet roads and snow cover, lateral and braking limits per surface
sub('grip', "topS = (onRoad ? 27 : sandy ? 17 : 22) + boostAmt * 10;",
    "topS = (onRoad ? 27 : sandy ? 17 : 22) + boostAmt * 10;\n      const gk = clamp(1 - clamp(WX.rain || 0, 0, 1) * (onRoad ? 0.24 : 0.12) - clamp(WX.snowCover || 0, 0, 1) * (onIce ? 0 : 0.28), 0.55, 1), aLat = (onIce ? 2.4 : onRoad ? 15 : sandy ? 6.5 : 9) * gk, brakeMax = (onIce ? 2.5 : onRoad ? 15 : sandy ? 7 : 10) * gk;")

# braking is grip-limited; coasting is rolling resistance plus air drag instead of an exponential snap
sub('accel', "thr < 0 ? (fs > 0 ? 26 : 7) : 0;\n        fs += thr * dt * accel; fs -= fs * dt * drag * (thr ? 0.22 : 1);",
    "thr < 0 ? (fs > 0 ? brakeMax : 7) : 0;\n        fs += thr * dt * accel;\n        if (thr) fs -= fs * dt * drag * 0.22; else { const c0 = onIce ? 0.35 : onRoad ? 1 : sandy ? 4 : 2.4, c1 = onIce ? 0.0008 : sandy ? 0.004 : 0.0045, rr = Math.min(Math.abs(fs), (c0 + c1 * fs * fs) * dt); fs -= Math.sign(fs) * rr; }")
sub('lonAcc', "fs = clamp(fs, -6, topS + 5);",
    "fs = clamp(fs, -6, topS + 5);\n      lonAcc += (clamp((fs - fsPrev) / Math.max(dt, 1e-3), -30, 16) - lonAcc) * (1 - Math.exp(-dt * 9)); fsPrev = fs;")

# turning is limited by lateral grip: tight at walking pace, wide at speed
sub('turn', "const turnRate = 2.4 * clamp(1 - Math.abs(fs) / 46, 0.55, 1) * (grounded ? 1 : 0.4);\n      const yawRate = -keyDir * turnRate",
    "const turnRate = Math.min(2.5, aLat / Math.max(Math.abs(fs), 1)) * (grounded ? 1 : 0.3);\n      const yawRate = -steerIn * turnRate")

# braking in a turn lets the rear step out; steep cross slopes pull the bike downhill
sub('slip', "slip += -yawRate * Math.abs(fs) * 0.1 * (grounded ? (onIce ? 3 : onRoad ? 0.5 : 1.3) : 0.2) * dt;",
    "slip += -yawRate * Math.abs(fs) * 0.1 * (grounded ? (onIce ? 3 : onRoad ? 0.5 : 1.3) : 0.2) * dt;\n      if (grounded) { if (thr < 0 && fs > 6) slip += -yawRate * Math.abs(fs) * 0.1 * (onIce ? 2 : onRoad ? 0.5 : 1.3) * dt; csN = (groundY(fx - Math.cos(fh) * 0.6, fz + Math.sin(fh) * 0.6) - groundY(fx + Math.cos(fh) * 0.6, fz - Math.sin(fh) * 0.6)) / 1.2; if (Math.abs(csN) > 0.32 && !onRoad) slip += clamp(csN, -1, 1) * 2.4 * dt; } else csN = 0;")

# nose dives under braking and squats under power
sub('pitch', "const pT = grounded ? Math.atan2(ga - gb, 1.6) + wheelie :",
    "const pT = grounded ? Math.atan2(ga - gb, 1.6) + wheelie + lonAcc * 0.003 :")

# lean follows the real lateral acceleration, through a spring-damper so it overshoots slightly and settles
sub('lean', "lean += (clamp(keyDir * fs * 0.04 + slip * 0.06, -0.6, 0.6) - lean) * (1 - Math.exp(-dt * 6));",
    "{ const lT = clamp(Math.atan(-yawRate * fs / 9.81) * 0.68 + slip * 0.05, -0.6, 0.6); leanV += ((lT - lean) * 70 - leanV * 11) * dt; lean += leanV * dt; rollS += ((grounded ? Math.atan(clamp(csN, -1, 1)) * 0.35 : 0) - rollS) * (1 - Math.exp(-dt * 6)); }")

# landing: compress the suspension and kick the rider
sub('landing', "shake = Math.max(shake, clamp(impact / 12, 0.25, 1)); if (impact > 9) fs *= 0.92;",
    "shake = Math.max(shake, clamp(impact / 12, 0.25, 1)); susVel -= clamp(impact * 0.3, 0, 5); PH.landK = Math.max(PH.landK, clamp(impact / 14, 0, 1)); if (impact > 9) fs *= 0.92;")

# outside explore mode the dynamics relax to neutral
sub('relax', "    prevZ = z; lastYaw = yaw;",
    "    if (!free) { rollS *= Math.exp(-dt * 5); lonAcc *= Math.exp(-dt * 5); steerIn *= Math.exp(-dt * 8); leanV = 0; }\n    prevZ = z; lastYaw = yaw;")

# suspension: ~0.5 damping ratio instead of 0.36 so it settles after a bump
sub('sus', "susVel *= Math.max(0, 1 - dt * 12.5);", "susVel *= Math.max(0, 1 - dt * 16); if (PH.landK > 0.001) PH.landK *= Math.exp(-dt * 4);")
sub('susF', "susFrontV *= Math.max(0, 1 - dt * 14);", "susFrontV *= Math.max(0, 1 - dt * 16);")
sub('susR', "susRearV *= Math.max(0, 1 - dt * 14);", "susRearV *= Math.max(0, 1 - dt * 16);")

# publish dynamics, steer the front end, roll with the terrain
sub('apply', "    bikeRoot.position.copy(bp); bikeRoot.rotation.set(",
    "    PH.lon = lonAcc; PH.roll = rollS;\n    { const svT = free ? -steerIn * lerp(0.46, 0.1, clamp(Math.abs(fs) / 20, 0, 1)) : -lean * 0.4; PH.steerVis += (svT - PH.steerVis) * (1 - Math.exp(-dt * 14)); const sg = bike.userData.steerG; if (sg) sg.quaternion.setFromAxisAngle(bike.userData.steerAx, PH.steerVis); }\n    bikeRoot.position.copy(bp); bikeRoot.rotation.set(")
sub('roll', "bike.rotation.z = -lean; bike.position.y =", "bike.rotation.z = -lean - rollS; bike.position.y =")

# the front assembly (wheel, fork, bars, headlight, mirrors) pivots on the steering axis
sub('steerG', "bike.userData.rig = { rider, spine, headG, A: RIGA, L: RIGL, hit: rHit, apply, kst }; }",
    "bike.userData.rig = { rider, spine, headG, A: RIGA, L: RIGL, hit: rHit, apply, kst }; }\n"
    "  await __y(); { const FRONT = new Set(['front-wheel', 'front-fender', 'fork', 'fork-cover', 'triple-clamp', 'headlight-bucket', 'headlight-ring', 'headlight-lens', 'headlight-beam', 'speedo', 'indicator', 'indicator-stem', 'handlebar', 'grip', 'lever', 'mirror-stem', 'mirror', 'mirror-glass', 'pixel-watch', 'watch-screen', 'brake-caliper']);\n"
    "    const sg = new THREE.Group(); sg.name = 'steer-assembly'; sg.position.set(0, 1, -0.49); bike.add(sg); bike.updateMatrixWorld(true);\n"
    "    bike.children.filter(c => c !== sg && (FRONT.has(c.name) || (c.type === 'Sprite' && c.position.z < -0.3) || (c.type === 'Object3D' && c.position.z < -5) || (c.isLight && c.position.z < -0.3))).forEach(c => sg.attach(c));\n"
    "    bike.userData.steerG = sg; bike.userData.steerAx = new THREE.Vector3(0, 0.64, 0.23).normalize(); }")

# rider: hands follow the bars, body tucks at speed, dives forward under braking, absorbs landings, leans into corners, head stays level
sub('hands', "RT.set(A.s * 0.335, 1.13, -0.37); let op = 0, rz = 0;",
    "RT.set(A.s * 0.335, 1.13, -0.37); if (on && PH.steerVis) { const c = Math.cos(PH.steerVis), s2 = Math.sin(PH.steerVis), zz = RT.z + 0.44, hxr = RT.x * c + zz * s2, hzr = -RT.x * s2 + zz * c - 0.44; RT.x = hxr; RT.z = hzr; } let op = 0, rz = 0;")
sub('body', "sz = RG.yawRate * 0.06 - RG.footK * 0.05 * RG.footSide;",
    "sz = RG.yawRate * 0.06 - RG.footK * 0.05 * RG.footSide;\n    if (on) { sx += -0.1 * sstep(11, 27, curSpeed) - clamp(-PH.lon, 0, 28) / 28 * 0.2 + clamp(PH.lon, 0, 14) / 14 * 0.09 - PH.landK * 0.22; sz += -lean * 0.3 + PH.roll * 0.5; }")
sub('head', "hy = clamp(RG.yawRate * 0.3, -0.5, 0.5), hz = 0, lp = null, lw = 0;",
    "hy = clamp(RG.yawRate * 0.3, -0.5, 0.5), hz = on ? lean * 0.85 + PH.roll * 0.35 : 0, lp = null, lw = 0;")

open(p, 'w', encoding='utf8').write(s)
print('physics pass applied')
