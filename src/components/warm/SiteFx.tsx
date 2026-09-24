"use client";

import { useEffect } from "react";
import * as THREE from "three";

/**
 * Shared 3D backdrop + custom cursor + micro-interaction sound effects for
 * the "warm" redesign's inner pages. Ported from the design export's
 * site-fx.js as directly as possible — the original is procedural/singleton
 * (one canvas + one cursor pair appended to document.body, one rAF loop) so
 * this stays a direct imperative port inside a single effect rather than
 * being decomposed into idiomatic React state; the complexity is inherent
 * to driving Three.js and Web Audio, not something React state would
 * simplify. Mount once per page (the page component itself, not a shared
 * layout, since each scene's geometry differs).
 */

const INK = 0x171b2e;
const CREAM = 0xf2e2c6;
const CREAM2 = 0xe6cfa8;
const EMBER = 0xe8773a;
const GOLD = 0xf4b24a;

export type SiteFxScene = "work" | "about" | "contact";

export default function SiteFx({ scene }: { scene: SiteFxScene }) {
  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    // ---------- sound ----------
    let ac: AudioContext | null = null;
    let soundOn = true;
    try {
      soundOn = localStorage.getItem("ap-sound") !== "off";
    } catch {
      // ignore
    }
    const audio = () => {
      if (ac || !soundOn) return;
      try {
        ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        // ignore
      }
    };
    const sfx = (kind: "tick" | "press") => {
      if (!soundOn || !ac) return;
      if (ac.state === "suspended") ac.resume();
      const P = {
        tick: [1900, 1500, 0.035, 0.016, "sine"] as const,
        press: [240, 120, 0.09, 0.06, "triangle"] as const,
      }[kind];
      const t = ac.currentTime;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = P[4] as OscillatorType;
      o.frequency.setValueAtTime(P[0], t);
      o.frequency.exponentialRampToValueAtTime(P[1], t + P[2]);
      g.gain.setValueAtTime(P[3], t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + P[2]);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + P[2] + 0.02);
    };

    // ---------- cursor, magnet, press ----------
    const HOT = "a,button,[role=tab],label,input,textarea,li";
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let rx = cx;
    let ry = cy;
    let cOn = false;
    let pressed = false;
    let hot = false;
    let magEl: HTMLElement | null = null;
    let overEl: Element | null = null;
    let tickT = 0;
    let dot: HTMLDivElement | null = null;
    let ring: HTMLDivElement | null = null;

    let styleTag: HTMLStyleElement | null = null;
    if (fine) {
      styleTag = document.createElement("style");
      styleTag.textContent = ".fx-cursor,.fx-cursor *{cursor:none!important}";
      document.head.appendChild(styleTag);
      document.documentElement.classList.add("fx-cursor");
      ring = document.createElement("div");
      ring.setAttribute("aria-hidden", "true");
      ring.style.cssText =
        "position:fixed;left:0;top:0;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;border:1.5px solid #171b2e;z-index:9999;pointer-events:none;opacity:0;transition:width .28s cubic-bezier(.2,.9,.2,1),height .28s cubic-bezier(.2,.9,.2,1),margin .28s cubic-bezier(.2,.9,.2,1),background-color .25s,border-color .25s,opacity .3s";
      dot = document.createElement("div");
      dot.setAttribute("aria-hidden", "true");
      dot.style.cssText =
        "position:fixed;left:0;top:0;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#e8773a;z-index:10000;pointer-events:none;opacity:0;transition:opacity .3s";
      document.body.append(ring, dot);
    }

    const onPointerMove = (e: PointerEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      cOn = true;
      const t = e.target as HTMLElement | null;
      hot = !!(t && t.closest && ((t.closest(HOT) && !t.closest("li:not([tabindex])")) || t.closest("a,button,label,input,textarea")));
      if (!fine) return;
      const m = t && t.closest ? (t.closest("a,button") as HTMLElement | null) : null;
      if (magEl && magEl !== m) {
        magEl.style.translate = "";
        magEl = null;
      }
      if (m && m.getBoundingClientRect().width < 360) {
        const b = m.getBoundingClientRect();
        m.style.transition = (m.style.transition ? m.style.transition + "," : "") + "translate .25s cubic-bezier(.2,.9,.2,1)";
        m.style.translate = `${(e.clientX - b.left - b.width / 2) * 0.22}px ${(e.clientY - b.top - b.height / 2) * 0.32}px`;
        magEl = m;
      }
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    cleanups.push(() => window.removeEventListener("pointermove", onPointerMove));

    const onPointerDown = (e: PointerEvent) => {
      audio();
      pressed = true;
      const el = (e.target as HTMLElement).closest && (e.target as HTMLElement).closest("a,button,[role=tab]");
      if (el) {
        sfx("press");
        if (!reduced && (el as HTMLElement).animate) {
          (el as HTMLElement).animate(
            [{ scale: "1" }, { scale: ".94" }, { scale: "1.02" }, { scale: "1" }],
            { duration: 320, easing: "cubic-bezier(.2,.9,.2,1)" },
          );
        }
        if (navigator.vibrate && e.pointerType === "touch") navigator.vibrate(8);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    cleanups.push(() => window.removeEventListener("pointerdown", onPointerDown));

    const onPointerUp = () => {
      pressed = false;
    };
    window.addEventListener("pointerup", onPointerUp);
    cleanups.push(() => window.removeEventListener("pointerup", onPointerUp));

    const onPointerOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest && (e.target as HTMLElement).closest("a,button,[role=tab]");
      if (el && el !== overEl) {
        const n = performance.now();
        if (n - tickT > 60) {
          sfx("tick");
          tickT = n;
        }
      }
      overEl = el;
    };
    window.addEventListener("pointerover", onPointerOver, { passive: true });
    cleanups.push(() => window.removeEventListener("pointerover", onPointerOver));

    const onKeydownOnce = () => audio();
    window.addEventListener("keydown", onKeydownOnce, { once: true });
    cleanups.push(() => window.removeEventListener("keydown", onKeydownOnce));

    // ---------- 3D backdrop ----------
    let renderer: THREE.WebGLRenderer | null = null;
    let sceneObj: THREE.Scene | null = null;
    let cam: THREE.PerspectiveCamera | null = null;
    const groups: THREE.Object3D[] = [];
    let pulse: { m: THREE.Mesh; curve?: THREE.CatmullRomCurve3 } | null = null;
    const t0 = performance.now();
    let mx = 0;
    let my = 0;
    let scrollF = 0;
    let raf = 0;
    let veilEl: HTMLDivElement | null = null;

    const onMoveCam = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMoveCam, { passive: true });
    cleanups.push(() => window.removeEventListener("pointermove", onMoveCam));

    const onScrollCam = () => {
      scrollF = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    window.addEventListener("scroll", onScrollCam, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScrollCam));

    let disposed = false;
    let resizeHandler: (() => void) | null = null;

    async function init3D() {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return;
      }
      if (disposed) return;
      const r = renderer;
      r.setPixelRatio(Math.min(window.devicePixelRatio, fine ? 2 : 1.25));
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFShadowMap;
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.05;
      Object.assign(r.domElement.style, {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        zIndex: "-2",
        pointerEvents: "none",
        display: "block",
        opacity: "0",
        transition: "opacity 1.2s ease",
      });
      requestAnimationFrame(() => {
        r.domElement.style.opacity = "0.55";
      });
      const veil = document.createElement("div");
      veil.setAttribute("aria-hidden", "true");
      veil.style.cssText =
        "position:fixed;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,rgba(246,234,214,.82) 0%,rgba(246,234,214,.55) 55%,rgba(246,234,214,.15) 100%)";
      veilEl = veil;
      r.domElement.setAttribute("aria-hidden", "true");
      document.body.prepend(veil);
      document.body.prepend(r.domElement);

      const sc = new THREE.Scene();
      sc.fog = new THREE.Fog(0xf4dfc0, 40, 120);
      sceneObj = sc;
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 300);
      cam = camera;
      sc.add(new THREE.HemisphereLight(0xfff1dc, 0x8fa3c4, 1.3));
      const sun = new THREE.DirectionalLight(0xffb070, 2.6);
      sun.position.set(-20, 40, 25);
      sun.castShadow = true;
      sun.shadow.mapSize.set(fine ? 2048 : 1024, fine ? 2048 : 1024);
      Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, far: 120 });
      sun.shadow.bias = -0.0006;
      sc.add(sun);
      const rim = new THREE.DirectionalLight(0x8fa9d6, 0.8);
      rim.position.set(30, 12, -30);
      sc.add(rim);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.14 }));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      sc.add(floor);

      const std = (c: number, ro = 0.7, em = 0) =>
        new THREE.MeshStandardMaterial({ color: c, roughness: ro, emissive: em ? c : 0, emissiveIntensity: em });
      const M = {
        bone: std(CREAM),
        bone2: std(CREAM2),
        ember: std(EMBER, 0.45, 0.15),
        gold: std(GOLD, 0.4, 0.3),
        ink: std(INK, 0.6),
        edge: new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.45 }),
      };
      const bar = (len: number, w: number, h: number, mat: THREE.Material, x: number, z: number) => {
        const g = new THREE.Group();
        const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, w), mat);
        m.position.set(len / 2, h / 2, 0);
        m.castShadow = m.receiveShadow = true;
        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), M.edge));
        g.add(m);
        g.position.set(x, 0, z);
        sc.add(g);
        return g;
      };
      const diamond = (x: number, y: number, z: number, s = 1, mat: THREE.Material = M.ember) => {
        const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.9 * s), mat);
        d.position.set(x, y, z);
        d.castShadow = true;
        sc.add(d);
        return d;
      };
      const lineM = new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.12 });
      for (let i = -6; i <= 6; i++) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 60), lineM);
        l.position.set(i * 8, 0.005, 0);
        sc.add(l);
      }

      if (scene === "work") {
        ([
          [-26, -8, 22, 3.2],
          [-12, -2, 18, 5.0],
          [0, 4, 14, 4.2],
          [10, -10, 16, 3.6],
          [-18, 10, 12, 2.8],
        ] as const).forEach(([x, z, len, h], i) => {
          const g = bar(len, 2.6, h, i % 2 ? M.bone : M.bone2, x, z);
          g.userData = { base: 0, ph: i, k: 1 };
          groups.push(g);
          const d = diamond(x + len / 2, h + 2.4, z, 0.9, i === 1 ? M.gold : M.ember);
          d.userData = { ph: i, dia: true, base: h + 2.4 };
          groups.push(d);
        });
        for (let i = 0; i < 14; i++) {
          const g = bar(4 + ((i * 7) % 9), 1.4, 0.6, M.bone, -34 + ((i * 11) % 60), -22 + ((i * 5) % 40));
          g.userData = { base: 0, ph: i + 5, k: 0.3 };
          groups.push(g);
        }
      } else if (scene === "about") {
        ([
          [-24, 10, 2.2],
          [-10, 10, 3.6],
          [4, 14, 5.4],
          [18, 12, 7.6],
        ] as const).forEach(([x, len, h], i) => {
          const g = bar(len, 4, h, i === 3 ? M.ember : i % 2 ? M.bone2 : M.bone, x, -i * 3);
          g.userData = { base: 0, ph: i, k: 0.6 };
          groups.push(g);
        });
        const pts = [
          [-19, 2.4, 0],
          [-5, 3.8, -3],
          [11, 5.6, -6],
          [26, 7.8, -9],
          [36, 9.5, -12],
        ].map((p) => new THREE.Vector3(...(p as [number, number, number])));
        const curve = new THREE.CatmullRomCurve3(pts);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.18, 8), std(EMBER, 0.4, 0.4));
        sc.add(tube);
        pulse = { m: diamond(0, 0, 0, 0.6, M.gold), curve };
      } else {
        const g = bar(26, 3, 4, M.bone2, -30, 0);
        g.userData = { base: 0, ph: 0, k: 0.4 };
        groups.push(g);
        const ghostGeo = new THREE.BoxGeometry(18, 4, 3);
        const ghost = new THREE.LineSegments(
          new THREE.EdgesGeometry(ghostGeo),
          new THREE.LineDashedMaterial({ color: EMBER, dashSize: 0.6, gapSize: 0.4 }),
        );
        ghost.computeLineDistances();
        ghost.position.set(5, 2, 0);
        sc.add(ghost);
        const fill = new THREE.Mesh(ghostGeo, new THREE.MeshBasicMaterial({ color: EMBER, transparent: true, opacity: 0.08, depthWrite: false }));
        fill.position.copy(ghost.position);
        sc.add(fill);
        fill.userData = { glow: true };
        groups.push(fill);
        const today = new THREE.Mesh(new THREE.BoxGeometry(0.12, 12, 0.12), M.ink);
        today.position.set(-4, 6, 0);
        sc.add(today);
        pulse = { m: diamond(5, 7.5, 0, 1.2, M.gold) };
      }

      const size = () => {
        r.setSize(window.innerWidth, window.innerHeight, false);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      };
      size();
      resizeHandler = size;
      window.addEventListener("resize", size);
    }

    const cp = { x: 0, y: 0, z: 0 };
    const tickState = { l: 0, h: false };
    function frame() {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - (tickState.l || now)) / 1000);
      tickState.l = now;
      if (dot && ring && cOn) {
        const k = 1 - Math.exp(-dt * 16);
        rx += (cx - rx) * k;
        ry += (cy - ry) * k;
        dot.style.opacity = ring.style.opacity = "1";
        dot.style.transform = `translate(${cx}px,${cy}px)`;
        if (hot !== tickState.h) {
          tickState.h = hot;
          Object.assign(
            ring.style,
            hot
              ? { width: "64px", height: "64px", margin: "-32px 0 0 -32px", backgroundColor: "rgba(232,119,58,.16)", borderColor: "#e8773a" }
              : { width: "36px", height: "36px", margin: "-18px 0 0 -18px", backgroundColor: "transparent", borderColor: "#171b2e" },
          );
        }
        ring.style.transform = `translate(${rx}px,${ry}px) scale(${pressed ? 0.78 : 1})`;
      }
      if (!renderer || !sceneObj || !cam) return;
      const wide = cam.aspect < 0.9 ? 1.5 : 1;
      const ang = Math.PI / 4 + (reduced ? 0 : scrollF * 0.9 + mx * 0.25);
      const tx = Math.cos(ang) * 58 * wide;
      const tz = Math.sin(ang) * 58 * wide;
      const ty = (34 - scrollF * 10 - my * 6) * wide;
      const k = reduced ? 1 : 1 - Math.exp(-dt * 2.4);
      cp.x += (tx - cp.x) * k;
      cp.y += (ty - cp.y) * k;
      cp.z += (tz - cp.z) * k;
      cam.position.set(cp.x, cp.y, cp.z);
      cam.lookAt(-6, 9, 0);
      groups.forEach((g) => {
        const u = g.userData as { dia?: boolean; ph: number; base: number; glow?: boolean; k: number };
        if (reduced) return;
        if (u.dia) {
          g.rotation.y = t * 0.9 + u.ph;
          g.position.y = u.base + Math.sin(t * 1.6 + u.ph) * 0.3;
        } else if (u.glow) {
          ((g as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.06 + (Math.sin(t * 2) + 1) * 0.05;
        } else {
          g.position.y = Math.max(0, Math.sin(t * 0.8 + u.ph) * 0.35 * u.k);
        }
      });
      if (pulse && !reduced) {
        if (pulse.curve) {
          const p = pulse.curve.getPointAt((t * 0.08) % 1);
          pulse.m.position.set(p.x, p.y + 0.8, p.z);
        } else {
          pulse.m.position.y = 7.5 + Math.sin(t * 2) * 0.5;
        }
        pulse.m.rotation.y = t * 1.4;
      }
      renderer.render(sceneObj, cam);
    }
    frame();
    init3D();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
      veilEl?.remove();
      dot?.remove();
      ring?.remove();
      styleTag?.remove();
      document.documentElement.classList.remove("fx-cursor");
      if (ac) ac.close();
    };
  }, [scene]);

  return null;
}
