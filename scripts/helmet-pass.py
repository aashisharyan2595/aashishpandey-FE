#!/usr/bin/env python3
"""One-off patch applied to world-v7.js on 2026-10-01: the rider's helmet becomes a modular adventure helmet in the style of the
user's reference photo: matte olive shell, matte black top panel and chin guard, wide dark panoramic visor in a gunmetal frame,
round gunmetal pivot hubs with a dial, white ring graphics on the sides, grey chin vents. No brand logo, no oxygen mask, no hoses.
world-v7.js is the source of truth; this script is a record and fails loudly if an anchor is missing. Run from the repo root."""
import sys
p = 'world-v7.js'
s = open(p, encoding='utf8').read()

def sub(label, old, new):
    global s
    n = s.count(old)
    if n != 1:
        sys.exit('anchor "%s" matched %d times: %r' % (label, n, old[:90]))
    s = s.replace(old, new)

a = s.index("    const hel = ball(0.155, chrome, 'helmet'")
b = s.index("    const ulimb = (r, r2, mat, name)")
new_head = """    const oliveM = new THREE.MeshPhysicalMaterial({ color: '#76874f', roughness: 0.72, metalness: 0.04 }), blackM = new THREE.MeshPhysicalMaterial({ color: '#17191a', roughness: 0.68, metalness: 0.08 }),
      gunM = new THREE.MeshPhysicalMaterial({ color: '#3d4243', roughness: 0.4, metalness: 0.55 }), whiteM = new THREE.MeshPhysicalMaterial({ color: '#ece9e0', roughness: 0.6, side: THREE.DoubleSide }), ventM = new THREE.MeshPhysicalMaterial({ color: '#7d8283', roughness: 0.4, metalness: 0.5 }),
      glassM = new THREE.MeshPhysicalMaterial({ color: '#0e1112', metalness: 0.6, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03 });
    const HC = V(0, 1.665, -0.02), hsc = o => { o.scale.set(0.98, 1.02, 1.14); return o; }, sec = (r, ws, hs, ps, pl, ts, tl, mat, name) => hsc(put(new THREE.SphereGeometry(r, ws, hs, ps, pl, ts, tl), mat, name, HC)), FR = Math.PI * 1.5; // helmet: forward is -z, phi 1.5 pi
    hsc(ball(0.155, oliveM, 'helmet', HC));
    sec(0.1575, 32, 10, FR - 1.7, 3.4, 0, 0.78, blackM, 'helmet-top'); sec(0.159, 40, 2, FR - 1.7, 3.4, 0.78, 0.04, whiteM, 'helmet-trim');
    sec(0.1605, 32, 4, FR - 1.3, 2.6, 0.84, 0.12, gunM, 'visor-frame'); sec(0.1615, 32, 12, FR - 1.18, 2.36, 0.95, 0.8, glassM, 'visor'); sec(0.1605, 32, 3, FR - 1.25, 2.5, 1.75, 0.06, gunM, 'visor-frame');
    sec(0.1575, 24, 10, FR - 0.95, 1.9, 1.81, 0.55, blackM, 'helmet-chin'); sec(0.158, 32, 3, 0, Math.PI * 2, 2.38, 0.14, blackM, 'neck-roll');
    [-1, 1].forEach(sd => { for (let k = 0; k < 3; k++) { const vent = put(new THREE.BoxGeometry(0.05, 0.008, 0.012), ventM, 'chin-vent', V(sd * 0.064, 1.595 - k * 0.012, -0.164)); vent.rotation.y = sd * 0.5; }
      const hub = put(new THREE.CylinderGeometry(0.042, 0.044, 0.012, 18), gunM, 'pivot-hub', V(sd * 0.1505, 1.655, -0.05)); hub.rotation.z = Math.PI / 2;
      const dial = put(new THREE.CylinderGeometry(0.026, 0.026, 0.008, 14), ventM, 'pivot-dial', V(sd * 0.1565, 1.655, -0.05)); dial.rotation.z = Math.PI / 2;
      const ring = put(new THREE.RingGeometry(0.036, 0.05, 28), whiteM, 'helmet-roundel', V(sd * 0.1345, 1.62, 0.065)); ring.rotation.y = sd * Math.PI / 2; ring.material = whiteM;
      const ring2 = put(new THREE.RingGeometry(0.012, 0.024, 20), whiteM, 'helmet-roundel', V(sd * 0.1345, 1.62, 0.065)); ring2.rotation.y = sd * Math.PI / 2; });
    put(new THREE.BoxGeometry(0.045, 0.008, 0.034), gunM, 'top-vent', V(0, 1.827, 0.07), -0.35);
"""
s = s[:a] + new_head + s[b:]
# the old center stripe goes away
a2 = s.index("    const hs2 = put(new THREE.TorusGeometry(0.153, 0.009, 6, 40, Math.PI), gloss, 'helmet-stripe'")
b2 = s.index("\n", a2) + 1
s = s[:a2] + s[b2:]
sub('attach', "['helmet', 'visor', 'chin-bar', 'helmet-spoiler', 'visor-pivot', 'helmet-stripe']",
    "['helmet', 'helmet-top', 'helmet-trim', 'visor', 'visor-frame', 'helmet-chin', 'neck-roll', 'chin-vent', 'pivot-hub', 'pivot-dial', 'helmet-roundel', 'top-vent']")
sub('camhack', "    sky.position.copy(camera.position);",
    "    if (window.__apW && window.__apW.camHack) { const h = window.__apW.camHack; camera.position.set(h[0], h[1], h[2]); camera.lookAt(h[3], h[4], h[5]); camera.fov = h[6] || 30; camera.updateProjectionMatrix(); } // debug only (?perf): lets tests take close-ups\n    sky.position.copy(camera.position);")
open(p, 'w', encoding='utf8').write(s)
print('helmet pass applied')
