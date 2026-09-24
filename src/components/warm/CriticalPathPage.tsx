"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import SiteFooter from "@/components/warm/SiteFooter";
import WarmBody from "@/components/warm/WarmBody";
import styles from "@/components/warm/warm.module.css";
import {
  ACCENT,
  BG,
  CASES,
  fmt,
  H,
  INK,
  LOGOS,
  NAV,
  NOW,
  PHASES,
  ROWS,
  TRACKS,
  WORLDS,
  X,
  ZR,
} from "@/components/warm/critical-path-data";

/**
 * The homepage: a 3D scroll-driven Gantt chart of the whole career, ported
 * as directly as possible from the source design's single-class component.
 * Kept as one big imperative engine (refs + one mount effect) rather than
 * decomposed into many small components — the camera flythrough, scroll
 * hijacking, cursor, and 3D bar hover-highlighting are one tightly coupled
 * system reading a continuous scroll position every animation frame, not
 * something React state should drive frame-by-frame. Discrete UI state
 * (which chapter card is showing, which tab, modal open/closed) stays in
 * React state and renders normally with CSS transitions, exactly like the
 * source's own split between instance fields (continuous) and this.state
 * (discrete).
 */

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-ibm-plex-mono), monospace",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: ".06em",
};

type Anim = { o: string; t: string; y: string; pe: string };
function anim(ch: number, i: number): Anim {
  const on = ch === i;
  return { o: on ? "1" : "0", t: on ? "translateY(0)" : "translateY(40px)", y: on ? "translateY(0%)" : "translateY(106%)", pe: on ? "auto" : "none" };
}

export default function CriticalPathPage() {
  const [ch, setCh] = useState(0);
  const [world, setWorld] = useState(0);
  const [modal, setModal] = useState(-1);
  const [mtab, setMtab] = useState(0);
  const [sound, setSound] = useState(true);
  const [track, setTrack] = useState(-1);
  const [musicOpen, setMusicOpen] = useState(false);
  const [eqTick, setEqTick] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const hudDateRef = useRef<HTMLSpanElement>(null);
  const hudPctRef = useRef<HTMLSpanElement>(null);
  const curRingRef = useRef<HTMLDivElement>(null);
  const curDotRef = useRef<HTMLDivElement>(null);

  // Mutable engine state that must not trigger re-renders (read every
  // animation frame): scroll position, camera, hover targets, audio nodes.
  const eng = useRef<{
    c: number;
    plan: number;
    hlBar: number;
    hlWorld: number;
    sc: { cur: number; tgt: number; on: boolean };
    smooth: boolean;
    reduced: boolean;
    fine: boolean;
    ac: AudioContext | null;
    mOut: GainNode | null;
    mTimer: ReturnType<typeof setInterval> | null;
    savedTrack: number;
    loaderEl: HTMLDivElement | null;
    ready3D: boolean;
    pressed: boolean;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    cOn: boolean;
    cTarget: EventTarget | null;
    magEl: HTMLElement | null;
    wasHot: boolean | null;
    tickT: number;
    overEl: Element | null;
    lastHov: number;
    hotBar: boolean;
    hover: number;
  }>({
    c: 0,
    plan: 0,
    hlBar: -1,
    hlWorld: -1,
    sc: { cur: 0, tgt: 0, on: false },
    smooth: false,
    reduced: false,
    fine: false,
    ac: null,
    mOut: null,
    mTimer: null,
    savedTrack: -1,
    loaderEl: null,
    ready3D: false,
    pressed: false,
    cx: 0,
    cy: 0,
    rx: 0,
    ry: 0,
    cOn: false,
    cTarget: null,
    magEl: null,
    wasHot: null,
    tickT: 0,
    overEl: null,
    lastHov: -1,
    hotBar: false,
    hover: -1,
  });

  // Live refs mirroring the latest state, so the rAF loop (set up once)
  // always reads current values without re-subscribing every render.
  const chRef = useRef(ch);
  chRef.current = ch;
  const worldRef = useRef(world);
  worldRef.current = world;
  const modalRef = useRef(modal);
  modalRef.current = modal;
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const openCase = (j: number) => {
    setModal(j);
    setMtab(0);
    sfx("open");
  };
  const closeCase = () => {
    if (modalRef.current < 0) return;
    setModal(-1);
    sfx("close");
  };

  function sfx(kind: "tick" | "press" | "chap" | "open" | "close" | "bar") {
    const ac = eng.current.ac;
    if (!soundRef.current || !ac) return;
    if (ac.state === "suspended") ac.resume();
    const P: Record<string, [number, number, number, number, OscillatorType]> = {
      tick: [1900, 1500, 0.035, 0.018, "sine"],
      press: [240, 120, 0.09, 0.07, "triangle"],
      chap: [520, 780, 0.2, 0.04, "sine"],
      open: [330, 660, 0.24, 0.05, "triangle"],
      close: [620, 310, 0.16, 0.04, "triangle"],
      bar: [880, 1180, 0.06, 0.022, "sine"],
    };
    const p = P[kind];
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = p[4];
    o.frequency.setValueAtTime(p[0], t);
    o.frequency.exponentialRampToValueAtTime(p[1], t + p[2]);
    g.gain.setValueAtTime(p[3], t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + p[2]);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + p[2] + 0.02);
  }

  function audioInit() {
    if (eng.current.ac || !soundRef.current) return;
    try {
      eng.current.ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      // ignore
    }
  }

  function midi(n: number) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function stopMusic() {
    if (eng.current.mTimer) clearInterval(eng.current.mTimer);
    eng.current.mTimer = null;
    const ac = eng.current.ac;
    if (eng.current.mOut && ac) {
      const g = eng.current.mOut;
      g.gain.cancelScheduledValues(ac.currentTime);
      g.gain.setTargetAtTime(0, ac.currentTime, 0.3);
      setTimeout(() => {
        try {
          g.disconnect();
        } catch {
          // ignore
        }
      }, 1500);
    }
    eng.current.mOut = null;
  }

  function playTrack(i: number) {
    stopMusic();
    setTrack(i);
    setMusicOpen(false);
    try {
      localStorage.setItem("ap-track", String(i));
    } catch {
      // ignore
    }
    if (i < 0) return;
    audioInit();
    const ac = eng.current.ac;
    if (!ac) return;
    if (ac.state === "suspended") ac.resume();
    const Tr = TRACKS[i];
    const out = ac.createGain();
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = Tr.cut;
    out.gain.setValueAtTime(0, ac.currentTime);
    out.gain.linearRampToValueAtTime(0.13, ac.currentTime + 1.6);
    out.connect(lp).connect(ac.destination);
    eng.current.mOut = out;
    const spb = 60 / Tr.bpm / 2;
    let step = 0;
    let next = ac.currentTime + 0.1;
    const voice = (freq: number, t: number, dur: number, type: OscillatorType, vol: number, att: number) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + att);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    };
    const deg = (d: number, oct: number) => {
      const L = Tr.scale.length;
      return Tr.scale[((d % L) + L) % L] + 12 * (oct + Math.floor(d / L));
    };
    eng.current.mTimer = setInterval(() => {
      while (next < ac.currentTime + 0.25) {
        const bar = Math.floor(step / 8) % 4;
        const cr = Tr.root + Tr.prog[bar];
        if (step % 8 === 0) [0, 2, 4].forEach((d) => voice(midi(cr + deg(d, 0)), next, spb * 8.4, Tr.pad, 0.045, 0.5));
        if (step % 8 === 0) voice(midi(cr - 12), next, spb * 7, "sine", 0.07, 0.05);
        if (step % Tr.arpEvery === 0) {
          const d = [0, 2, 4, 2, 5, 4, 2, 1][step % 8] + (bar % 2 ? 1 : 0);
          voice(midi(cr + 12 + deg(d, 0)), next, spb * 1.6, Tr.arp, Tr.arp === "square" ? 0.014 : 0.03, 0.01);
        }
        if (Tr.kick && step % 4 === 0) {
          const o = ac.createOscillator();
          const g = ac.createGain();
          o.frequency.setValueAtTime(140, next);
          o.frequency.exponentialRampToValueAtTime(42, next + 0.14);
          g.gain.setValueAtTime(0.22, next);
          g.gain.exponentialRampToValueAtTime(0.0001, next + 0.2);
          o.connect(g).connect(out);
          o.start(next);
          o.stop(next + 0.22);
        }
        step++;
        next += spb;
      }
    }, 30);
  }

  function goTo(y: number) {
    const s = eng.current.sc;
    if (!eng.current.smooth) {
      window.scrollTo({ top: y, behavior: eng.current.reduced ? "auto" : "smooth" });
      return;
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    s.tgt = Math.max(0, Math.min(max, y));
    if (!s.on) {
      s.cur = window.scrollY;
      s.on = true;
    }
  }

  function goToChapter(i: number) {
    const el = document.getElementById("ch" + i);
    if (el) goTo(el.offsetTop);
  }

  function measureScroll() {
    const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-ch]")).sort((a, b) => Number(a.dataset.ch) - Number(b.dataset.ch));
    if (!secs.length) return;
    const y = window.scrollY;
    const offs = secs.map((s) => s.offsetTop);
    let i = 0;
    while (i < offs.length - 1 && y >= offs[i + 1]) i++;
    const span = i < offs.length - 1 ? offs[i + 1] - offs[i] : secs[i].offsetHeight - window.innerHeight;
    const f = Math.max(0, Math.min(1, (y - offs[i]) / Math.max(1, span)));
    const e = Math.max(0, Math.min(1, (f - 0.3) / 0.6));
    const ease = e * e * (3 - 2 * e);
    eng.current.c = i + (i < offs.length - 1 ? ease : 0);
    eng.current.plan = Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
    const nextCh = f > 0.72 && i < offs.length - 1 ? i + 1 : i;
    if (nextCh !== chRef.current) {
      if (chRef.current != null) sfx("chap");
      setCh(nextCh);
      eng.current.hlWorld = nextCh === 8 ? worldRef.current : -1;
    }
  }

  // ---------- loader ----------
  // A plain CSS fade instead of the source's WebGL fog shader (a full-screen
  // fragment shader with 5-octave noise, run every frame) — too heavy on
  // integrated GPUs/laptops for what's a ~2s loading transition.
  function showLoader() {
    const ov = document.createElement("div");
    ov.setAttribute("aria-hidden", "true");
    ov.style.cssText =
      "position:fixed;inset:0;z-index:200;pointer-events:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#f6ead6;color:#171b2e;font-family:var(--font-bricolage),Helvetica,sans-serif;text-align:center;transition:opacity .7s ease,filter .7s ease";
    ov.innerHTML =
      '<span style="font-family:var(--font-ibm-plex-mono),monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.65">Aashish Pandey · Project Manager</span><span data-n style="font-weight:800;font-size:clamp(90px,17vw,240px);line-height:.8;letter-spacing:-.05em">0</span><span data-s style="font-family:var(--font-ibm-plex-mono),monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#b4531f">Loading the plan</span>';
    document.body.appendChild(ov);
    eng.current.loaderEl = ov;
    const nEl = ov.querySelector<HTMLElement>("[data-n]");
    const start = performance.now();
    const finish = () => {
      ov.remove();
      eng.current.loaderEl = null;
    };
    const draw = () => {
      if (!eng.current.loaderEl) return;
      const el = (performance.now() - start) / 1000;
      const target = eng.current.ready3D ? 1 : Math.min(0.9, el / 1.8);
      const prog = Math.min(1, target);
      if (nEl) nEl.textContent = String(Math.round(prog * 100));
      if (prog >= 1 && el > 1.3) {
        sfx("open");
        ov.style.opacity = "0";
        setTimeout(finish, 500);
        return;
      }
      requestAnimationFrame(draw);
    };
    draw();
  }

  // ---------- mount: cursor, scroll hijack, input, loader, 3D ----------
  useEffect(() => {
    eng.current.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    eng.current.fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    eng.current.smooth = eng.current.fine && !eng.current.reduced;
    if (eng.current.fine) document.documentElement.classList.add("cp-cursor");

    let tk = -1;
    try {
      tk = Number(localStorage.getItem("ap-track") ?? -1);
    } catch {
      // ignore
    }
    eng.current.savedTrack = tk;
    if (!eng.current.reduced) showLoader();

    const resumeMusic = () => {
      if (eng.current.savedTrack >= 0 && track < 0) playTrack(eng.current.savedTrack);
      window.removeEventListener("pointerdown", resumeMusic);
      window.removeEventListener("keydown", resumeMusic);
    };
    window.addEventListener("pointerdown", resumeMusic);
    window.addEventListener("keydown", resumeMusic);

    const eqT = setInterval(() => {
      if (track >= 0) setEqTick((n) => n + 1);
    }, 350);

    eng.current.sc = { cur: window.scrollY, tgt: window.scrollY, on: false };

    const onWheel = (e: WheelEvent) => {
      if (!eng.current.smooth || modalRef.current >= 0 || e.ctrlKey) return;
      const target = e.target as HTMLElement;
      if (target.closest && target.closest("[data-own-scroll]")) return;
      e.preventDefault();
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const s = eng.current.sc;
      if (!s.on) {
        s.cur = window.scrollY;
        s.tgt = window.scrollY;
        s.on = true;
      }
      s.tgt = Math.max(0, Math.min(max, s.tgt + e.deltaY * (e.deltaMode === 1 ? 32 : 1)));
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    eng.current.cx = window.innerWidth / 2;
    eng.current.cy = window.innerHeight / 2;
    eng.current.rx = eng.current.cx;
    eng.current.ry = eng.current.cy;

    const onMove2 = (e: PointerEvent) => {
      eng.current.cx = e.clientX;
      eng.current.cy = e.clientY;
      eng.current.cOn = true;
      eng.current.cTarget = e.target;
      const target = e.target as HTMLElement;
      const m = target.closest ? (target.closest("[data-mag]") as HTMLElement | null) : null;
      if (eng.current.magEl && eng.current.magEl !== m) {
        eng.current.magEl.style.transform = "";
        eng.current.magEl = null;
      }
      if (m) {
        const b = m.getBoundingClientRect();
        m.style.transition = "transform .25s cubic-bezier(.2,.9,.2,1)";
        m.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.28}px, ${(e.clientY - b.top - b.height / 2) * 0.4}px)`;
        eng.current.magEl = m;
      }
    };
    window.addEventListener("pointermove", onMove2, { passive: true });

    const onDown = (e: PointerEvent) => {
      audioInit();
      eng.current.pressed = true;
      const el = (e.target as HTMLElement).closest && (e.target as HTMLElement).closest("a,button,[role=tab],li[tabindex]");
      if (el) {
        sfx("press");
        if (!eng.current.reduced && (el as HTMLElement).animate) {
          (el as HTMLElement).animate([{ scale: "1" }, { scale: ".94" }, { scale: "1.02" }, { scale: "1" }], { duration: 320, easing: "cubic-bezier(.2,.9,.2,1)" });
        }
        if (navigator.vibrate && e.pointerType === "touch") navigator.vibrate(8);
      }
    };
    window.addEventListener("pointerdown", onDown);
    const onUp = () => {
      eng.current.pressed = false;
    };
    window.addEventListener("pointerup", onUp);

    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest && (e.target as HTMLElement).closest("a,button,[role=tab],li[tabindex]");
      if (el && el !== eng.current.overEl) {
        const n = performance.now();
        if (n - eng.current.tickT > 60) {
          sfx("tick");
          eng.current.tickT = n;
        }
      }
      eng.current.overEl = el;
    };
    window.addEventListener("pointerover", onOver, { passive: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCase();
      audioInit();
    };
    window.addEventListener("keydown", onKey);

    let uiRaf = 0;
    let uiT = 0;
    const ui = () => {
      uiRaf = requestAnimationFrame(ui);
      const now = performance.now();
      const dt = Math.min(0.05, (now - (uiT || now)) / 1000);
      uiT = now;
      const s = eng.current.sc;
      if (s.on) {
        s.cur += (s.tgt - s.cur) * (1 - Math.exp(-dt * 6.5));
        if (Math.abs(s.tgt - s.cur) < 0.4) {
          s.cur = s.tgt;
          s.on = false;
        }
        window.scrollTo(0, s.cur);
      }
      const d = curDotRef.current;
      const rg = curRingRef.current;
      if (d && rg && eng.current.cOn && document.documentElement.classList.contains("cp-cursor")) {
        const k = 1 - Math.exp(-dt * 16);
        eng.current.rx += (eng.current.cx - eng.current.rx) * k;
        eng.current.ry += (eng.current.cy - eng.current.ry) * k;
        d.style.opacity = "1";
        rg.style.opacity = "1";
        d.style.transform = `translate(${eng.current.cx}px,${eng.current.cy}px)`;
        const t = eng.current.cTarget as HTMLElement | null;
        const hot = !!(t && t.closest && t.closest("a,button,[role=tab],li[tabindex]")) || !!eng.current.hotBar;
        if (hot !== eng.current.wasHot) {
          eng.current.wasHot = hot;
          Object.assign(
            rg.style,
            hot
              ? { width: "64px", height: "64px", margin: "-32px 0 0 -32px", backgroundColor: "rgba(232,119,58,.16)", borderColor: "#e8773a" }
              : { width: "36px", height: "36px", margin: "-18px 0 0 -18px", backgroundColor: "transparent", borderColor: "#171b2e" },
          );
        }
        rg.style.transform = `translate(${eng.current.rx}px,${eng.current.ry}px) scale(${eng.current.pressed ? 0.78 : 1})`;
      }
    };
    ui();

    const onScroll = () => {
      const s = eng.current.sc;
      if (s && !s.on) {
        s.cur = s.tgt = window.scrollY;
      }
      measureScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const t0 = setTimeout(onScroll, 50);

    let disposed = false;
    let raf3d = 0;
    let ro: ResizeObserver | null = null;
    let renderer: THREE.WebGLRenderer | null = null;

    async function init3D() {
      const el = stageRef.current;
      if (!el) return;
      let r: THREE.WebGLRenderer;
      try {
        r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return;
      }
      if (disposed || !stageRef.current) return;
      renderer = r;
      r.setPixelRatio(Math.min(window.devicePixelRatio, eng.current.fine ? 2 : 1.5));
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.05;
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      r.outputColorSpace = THREE.SRGBColorSpace;
      Object.assign(r.domElement.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" });
      el.appendChild(r.domElement);
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xf6ead6, 45, 190);
      const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
      scene.add(new THREE.HemisphereLight(0xfff1dc, 0x8fa3c4, 1.35));
      const sun = new THREE.DirectionalLight(0xffb070, 2.3);
      sun.position.set(30, 60, 50);
      sun.target.position.set(45, 0, 18);
      scene.add(sun.target);
      sun.castShadow = true;
      sun.shadow.mapSize.set(eng.current.fine ? 2048 : 1024, eng.current.fine ? 2048 : 1024);
      Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 50, bottom: -50, far: 200 });
      sun.shadow.bias = -0.0006;
      scene.add(sun);
      const std = (c: number, ro2 = 0.7, em = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: ro2, emissive: em ? c : 0x000000, emissiveIntensity: em });
      const M = {
        bone: std(0xf2e2c6),
        bone2: std(0xe6cfa8),
        ver: std(0xe8773a, 0.45, 0.15),
        verHot: std(0xf4b24a, 0.4, 0.6),
        ink: std(0x171b2e, 0.6),
        chipOff: std(0xf6ead6, 0.8),
        cob: new THREE.MeshBasicMaterial({ color: 0x5a6d96, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }),
        edge: new THREE.LineBasicMaterial({ color: 0x171b2e, transparent: true, opacity: 0.6 }),
        line: new THREE.MeshBasicMaterial({ color: 0x171b2e, transparent: true, opacity: 0.18 }),
      };
      const tex = (lines: [string, string, number][], w: number, h: number, o: { bg?: string; fg?: string; align?: CanvasTextAlign; pad?: number } = {}) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const g = c.getContext("2d")!;
        if (o.bg) {
          g.fillStyle = o.bg;
          g.fillRect(0, 0, w, h);
        }
        g.fillStyle = o.fg || "#171b2e";
        g.textBaseline = "middle";
        g.textAlign = o.align || "left";
        lines.forEach(([txt, font, y]) => {
          g.font = font;
          g.fillText(txt, o.align === "center" ? w / 2 : o.pad ?? 24, y);
        });
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        return t;
      };
      const plane = (w: number, h: number, map: THREE.Texture, opts: Partial<THREE.MeshBasicMaterialParameters> = {}) =>
        new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, fog: true, ...opts }));
      const edges = (mesh: THREE.Mesh) => {
        const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), M.edge);
        mesh.add(l);
      };

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ opacity: 0.16 }));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      const zMin = -8;
      const zMax = ZR(11) + 8;
      for (let y = 2018; y <= 2030; y++) {
        const ln = new THREE.Mesh(new THREE.BoxGeometry(y <= 2027 ? 0.06 : 0.03, 0.01, zMax - zMin), M.line);
        ln.position.set(X(y), 0.005, (zMin + zMax) / 2);
        scene.add(ln);
        if (y <= 2027) {
          const lab = plane(8, 2.4, tex([[String(y), '700 150px "Bricolage Grotesque"', 128]], 640, 192));
          lab.rotation.x = -Math.PI / 2;
          lab.position.set(X(y) + 4.1, 0.02, zMin + 0.8);
          scene.add(lab);
        }
        for (let q = 1; q < 4 && y < 2030; q++) {
          const qn = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, zMax - zMin), M.line);
          qn.position.set(X(y + q / 4), 0.004, (zMin + zMax) / 2);
          scene.add(qn);
        }
      }
      PHASES.forEach((p, i) => {
        const z0 = ZR(p.r0) - 1.6;
        const z1 = ZR(p.r1) + 1.6;
        const band = new THREE.Mesh(new THREE.BoxGeometry(X(p.b) - X(p.a), 0.02, z1 - z0), i % 2 ? M.bone2 : M.bone);
        band.position.set((X(p.a) + X(p.b)) / 2, 0.01, (z0 + z1) / 2);
        band.receiveShadow = true;
        scene.add(band);
        const lab = plane(12, 1.5, tex([[p.t, '600 70px "IBM Plex Mono"', 60]], 960, 120));
        lab.rotation.x = -Math.PI / 2;
        lab.position.set(X(p.a) + 6.2, 0.03, z0 - 1.1);
        scene.add(lab);
      });
      const today = new THREE.Mesh(new THREE.PlaneGeometry(zMax - zMin + 10, 16), M.cob);
      today.rotation.y = Math.PI / 2;
      today.position.set(X(NOW), 8, (zMin + zMax) / 2);
      scene.add(today);
      const tline = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, zMax - zMin + 10), new THREE.MeshBasicMaterial({ color: 0x5a6d96 }));
      tline.position.set(X(NOW), 0.03, (zMin + zMax) / 2);
      scene.add(tline);
      const tlab = plane(8, 2, tex([["TODAY →", '600 110px "IBM Plex Mono"', 96]], 640, 160, { fg: "#4f74ea" }));
      tlab.position.set(X(NOW) + 4.3, 14.5, zMin);
      scene.add(tlab);

      type BarEntry = { g: THREE.Group; m: THREE.Mesh; dia: THREE.Mesh | null; flag: boolean; lift: number; lv?: number };
      const bars: BarEntry[] = [];
      const chips: { c: THREE.Mesh; on: number; k: number }[] = [];
      ROWS.forEach((row, i) => {
        const len = X(row.b) - X(row.a);
        const h = H(i);
        const flag = row.c != null;
        const g = new THREE.Group();
        g.position.set(X(row.a) + len / 2, 0, ZR(i));
        scene.add(g);
        const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, 2), flag ? M.ver : M.bone);
        m.position.y = h / 2;
        m.castShadow = m.receiveShadow = true;
        m.userData.i = i;
        edges(m);
        g.add(m);
        const lh = Math.min(0.9, h - 0.2);
        const px2 = 140;
        const cw = Math.min(4096, Math.round(len * px2));
        const chh = Math.round(lh * px2);
        const lab = plane(
          cw / px2,
          lh,
          tex(
            [
              [row.short.toUpperCase(), `700 ${Math.round(chh * 0.46)}px "Bricolage Grotesque"`, chh * 0.36],
              [`${fmt(row.a)} – ${row.b >= NOW ? "now" : fmt(row.b)}`, `500 ${Math.round(chh * 0.22)}px "IBM Plex Mono"`, chh * 0.78],
            ],
            cw,
            chh,
            { pad: 18, fg: "#171b2e" },
          ),
        );
        lab.position.set(-len / 2 + cw / px2 / 2, h - lh / 2 - 0.1, 1.003);
        g.add(lab);
        row.w.forEach((on, k) => {
          const c = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), on ? M.ink : M.chipOff);
          c.position.set(-len / 2 + 0.55 + k * 0.72, h + 0.28, -0.3);
          c.castShadow = true;
          edges(c);
          g.add(c);
          chips.push({ c, on, k });
        });
        let dia: THREE.Mesh | null = null;
        if (flag) {
          const stem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 0.06), M.ink);
          stem.position.set(len / 2 - 0.4, h + 1.1, 0);
          g.add(stem);
          dia = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), M.ver);
          dia.position.set(len / 2 - 0.4, h + 2.8, 0);
          dia.castShadow = true;
          edges(dia);
          g.add(dia);
        }
        bars.push({ g, m, dia, flag, lift: 0 });
      });

      const cpPts = [new THREE.Vector3(-4, 0.2, -3)];
      [0, 3, 4, 7, 8, 9].forEach((i) => cpPts.push(new THREE.Vector3(X(ROWS[i].b), 0.2, ZR(i) + 1.25)));
      cpPts.push(new THREE.Vector3(X(NOW) + 6, 0.2, ZR(11) + 5), new THREE.Vector3(X(2029.5), 0.2, ZR(11) + 10));
      const curve = new THREE.CatmullRomCurve3(cpPts, false, "centripetal");
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 700, 0.16, 10), std(0xe8773a, 0.4, 0.5));
      tube.castShadow = true;
      scene.add(tube);
      const tubeCount = tube.geometry.index!.count;
      const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16), M.verHot);
      scene.add(pulse);

      const focus = (i: number) => {
        const x = (X(ROWS[i].a) + X(ROWS[i].b)) / 2;
        const z = ZR(i);
        const h = H(i);
        return { p: [x - 7, 9 + h, z + 19] as [number, number, number], t: [x + 4, h * 0.4, z - 1] as [number, number, number] };
      };
      const keys = [
        { p: [-24, 30, 58] as [number, number, number], t: [24, 0, 14] as [number, number, number] },
        focus(0),
        focus(3),
        focus(4),
        focus(7),
        focus(8),
        focus(9),
        { p: [44, 88, 104] as [number, number, number], t: [46, 0, 17] as [number, number, number] },
        { p: [100, 16, 46] as [number, number, number], t: [52, 0, 17] as [number, number, number] },
        { p: [90, 6, 50] as [number, number, number], t: [118, 4, 30] as [number, number, number] },
      ];
      const cp = new THREE.Vector3(...keys[0].p);
      const ct = new THREE.Vector3(...keys[0].t);
      const size = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return;
        r.setSize(w, h, false);
        cam.aspect = w / h;
        cam.fov = w / h < 0.9 ? 55 : 38;
        cam.updateProjectionMatrix();
      };
      size();
      ro = new ResizeObserver(size);
      ro.observe(el);

      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const hit = new THREE.Vector3();
      let mx = 0;
      let my = 0;
      let px = -1;
      let py = 0;
      let pt: EventTarget | null = null;
      const barMeshes = bars.map((b) => b.m);
      const gplane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const onMove = (e: PointerEvent) => {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
        px = e.clientX;
        py = e.clientY;
        pt = e.target;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      const onClick = () => {
        const hov = eng.current.hover;
        if (hov >= 0 && ROWS[hov].c != null) openCase(ROWS[hov].c as number);
      };
      r.domElement.addEventListener("click", onClick);

      const t0b = performance.now();
      let shown = "";
      const lt = { v: 0 };
      const loop = () => {
        raf3d = requestAnimationFrame(loop);
        const nowT = performance.now();
        const ldt = Math.min(0.05, (nowT - (lt.v || nowT)) / 1000);
        lt.v = nowT;
        const t = (performance.now() - t0b) / 1000;
        const c = eng.current.c ?? 0;
        const i0 = Math.floor(c);
        const i1 = Math.min(keys.length - 1, i0 + 1);
        const f = c - i0;
        const A = keys[i0];
        const B = keys[i1];
        const lerp = (a: number, b: number) => a + (b - a) * f;
        const wide = cam.aspect < 0.9 ? 1.45 : 1;
        const tp = new THREE.Vector3(lerp(A.p[0], B.p[0]), lerp(A.p[1], B.p[1]), lerp(A.p[2], B.p[2]));
        const tt = new THREE.Vector3(lerp(A.t[0], B.t[0]), lerp(A.t[1], B.t[1]), lerp(A.t[2], B.t[2]));
        tp.sub(tt).multiplyScalar(wide).add(tt);
        if (i0 !== i1 && !eng.current.reduced) {
          const arc = Math.sin(f * Math.PI);
          tp.y += arc * 6;
          tp.x -= arc * 3;
        }
        tp.x += mx * 3;
        tp.y -= my * 2;
        const k = eng.current.reduced ? 1 : 1 - Math.exp(-ldt * 2.4);
        const kt = eng.current.reduced ? 1 : 1 - Math.exp(-ldt * 3.2);
        cp.lerp(tp, k);
        ct.lerp(tt, kt);
        cam.position.copy(cp);
        cam.lookAt(ct);
        const yr = Math.max(2018, Math.min(NOW, 2018 + ct.x / 10));
        if (hudDateRef.current) hudDateRef.current.textContent = fmt(yr);
        if (hudPctRef.current) hudPctRef.current.textContent = Math.round((eng.current.plan || 0) * 100) + "%";
        const drawn = Math.max(0.02, Math.min(1, (c + 0.4) / 9.2));
        tube.geometry.setDrawRange(0, Math.floor((tubeCount * drawn) / 3) * 3);
        const pt2 = curve.getPointAt(eng.current.reduced ? drawn : ((t * 0.08) % 1) * drawn);
        pulse.position.set(pt2.x, 0.2, pt2.z);
        pulse.scale.setScalar(1 + 0.25 * Math.sin(t * 6));

        let hov = -1;
        const overCanvas = eng.current.fine && px >= 0 && pt && ((pt as HTMLElement) === r.domElement || ((pt as HTMLElement).closest && (pt as HTMLElement).closest("main") && getComputedStyle(pt as HTMLElement).pointerEvents === "none"));
        const tip = tipRef.current;
        if (overCanvas) {
          ndc.set((px / window.innerWidth) * 2 - 1, -(py / window.innerHeight) * 2 + 1);
          ray.setFromCamera(ndc, cam);
          const hits = ray.intersectObjects(barMeshes, false);
          if (hits.length) hov = (hits[0].object.userData as { i: number }).i;
          let txt = "";
          if (hov >= 0) {
            const R = ROWS[hov];
            txt = `${R.t} · ${fmt(R.a)} – ${R.b >= NOW ? "now" : fmt(R.b)}${R.c != null ? " · click to open" : ""}`;
          } else if (ray.ray.intersectPlane(gplane, hit)) {
            const y = 2018 + hit.x / 10;
            if (y > 2017.5 && y < 2031) txt = `▸ ${fmt(y)}${y > NOW ? " · unscheduled" : ""}`;
          }
          if (tip) {
            if (txt !== shown) {
              tip.textContent = txt;
              shown = txt;
            }
            tip.style.opacity = txt ? "1" : "0";
            tip.style.transform = `translate(${px + 14}px, ${py + 16}px)`;
          }
          r.domElement.style.cursor = hov >= 0 && ROWS[hov].c != null ? "pointer" : "crosshair";
        } else if (tip) tip.style.opacity = "0";
        if (hov !== eng.current.lastHov) {
          if (hov >= 0) sfx("bar");
          eng.current.lastHov = hov;
        }
        eng.current.hotBar = hov >= 0 && ROWS[hov].c != null;
        eng.current.hover = hov;
        const hl = hov >= 0 ? hov : eng.current.hlBar;
        bars.forEach((b, i) => {
          const target = i === hl ? 1.2 : 0;
          if (eng.current.reduced) b.lift = target;
          else {
            b.lv = ((b.lv || 0) + (target - b.lift) * 160 * ldt) * Math.exp(-ldt * 14);
            b.lift += (b.lv || 0) * ldt;
          }
          b.g.position.y = b.lift;
          if (b.dia) {
            b.dia.rotation.y = eng.current.reduced ? 0.6 : t * 0.9 + i;
            b.dia.position.y = H(i) + 2.8 + (eng.current.reduced ? 0 : Math.sin(t * 1.6 + i) * 0.2);
          }
          if (!b.flag) b.m.material = i === hl ? M.bone2 : M.bone;
        });
        chips.forEach(({ c: chip, on, k }) => {
          const w = eng.current.hlWorld;
          chip.material = on ? (w === k ? M.verHot : w >= 0 ? M.bone2 : M.ink) : M.chipOff;
          const s = on && w === k ? 1.25 : 1;
          chip.scale.setScalar(chip.scale.x + (s - chip.scale.x) * 0.2);
        });
        r.render(scene, cam);
      };
      loop();
      eng.current.ready3D = true;

      // expose archive-hover for the 3D bars via DOM event delegation
      const archiveEnter = (e: Event) => {
        const t = e.target as HTMLElement;
        const idx = t.closest?.("[data-archive-i]")?.getAttribute("data-archive-i");
        if (idx != null) eng.current.hlBar = Number(idx);
      };
      const archiveLeave = () => {
        eng.current.hlBar = -1;
      };
      document.addEventListener("mouseover", archiveEnter);
      document.addEventListener("mouseout", archiveLeave);

      return () => {
        window.removeEventListener("pointermove", onMove);
        r.domElement.removeEventListener("click", onClick);
        document.removeEventListener("mouseover", archiveEnter);
        document.removeEventListener("mouseout", archiveLeave);
      };
    }

    let cleanup3D: (() => void) | undefined;
    init3D().then((c) => {
      cleanup3D = c;
    });

    return () => {
      disposed = true;
      clearTimeout(t0);
      cancelAnimationFrame(uiRaf);
      cancelAnimationFrame(raf3d);
      clearInterval(eqT);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onMove2);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", resumeMusic);
      window.removeEventListener("keydown", resumeMusic);
      document.documentElement.classList.remove("cp-cursor");
      stopMusic();
      // eng is a stable ref holding one long-lived mutable engine object
      // (never reassigned across renders), not a DOM ref React clears on
      // unmount, so this read is safe despite the lint rule's generic
      // warning (it can't tell plain data refs from DOM refs).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const engObj = eng.current;
      engObj.loaderEl?.remove();
      engObj.ac?.close();
      ro?.disconnect();
      cleanup3D?.();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeWorld = WORLDS[world];
  const eqHeight = () => (track >= 0 ? `${4 + Math.random() * 8}px` : "3px");
  void eqTick; // referenced only to force the eq bars to re-sample on tick

  return (
    <div style={{ color: INK, fontFamily: "var(--font-bricolage), Helvetica, Arial, sans-serif", overflowX: "hidden" }}>
      <WarmBody />

      <div ref={stageRef} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, cursor: "crosshair" }} />
      <div
        ref={tipRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 30,
          pointerEvents: "none",
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 11,
          letterSpacing: ".04em",
          textTransform: "uppercase",
          background: INK,
          color: BG,
          padding: "6px 8px",
          opacity: 0,
          transition: "opacity .15s",
          whiteSpace: "nowrap",
        }}
      />

      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, padding: "14px clamp(14px,3vw,32px)", pointerEvents: "none" }}>
        <a
          href="#ch0"
          data-mag="1"
          onClick={(e) => {
            e.preventDefault();
            goTo(0);
          }}
          style={{
            pointerEvents: "auto",
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "-.01em",
            padding: "9px 16px 9px 12px",
            borderRadius: 999,
            background: "rgba(251,243,228,.78)",
            backdropFilter: "blur(14px) saturate(1.2)",
            border: "1px solid rgba(23,27,46,.1)",
            boxShadow: "0 10px 30px -18px rgba(23,27,46,.45)",
            color: INK,
            textDecoration: "none",
          }}
        >
          <span style={{ width: 11, height: 11, background: ACCENT, transform: "rotate(45deg)", borderRadius: 2 }} />
          Aashish Pandey
        </a>
        <nav
          aria-label="Primary"
          style={{ pointerEvents: "auto", display: "flex", gap: 2, padding: 4, borderRadius: 999, background: "rgba(251,243,228,.78)", backdropFilter: "blur(14px) saturate(1.2)", border: "1px solid rgba(23,27,46,.1)", boxShadow: "0 10px 30px -18px rgba(23,27,46,.45)" }}
        >
          {[
            { label: "Home", href: "/", current: true },
            { label: "Work", href: "/work" },
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              aria-current={l.current ? "page" : undefined}
              className={styles.navLink}
              style={{ padding: "8px 14px", borderRadius: 999, fontWeight: 600, fontSize: 14, textDecoration: "none", background: l.current ? INK : "transparent", color: l.current ? "#fbf3e4" : INK, transition: "background-color .25s,color .25s" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div style={{ pointerEvents: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <button
            data-mag="1"
            onClick={() => {
              audioInit();
              setSound((s) => !s);
            }}
            aria-label="Toggle sound"
            style={{
              borderRadius: 999,
              padding: "9px 12px",
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 11,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              cursor: "pointer",
              background: "rgba(251,243,228,.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(23,27,46,.1)",
            }}
          >
            {sound ? "Sound on" : "Sound off"}
          </button>
          <button
            data-mag="1"
            onClick={() => {
              audioInit();
              setMusicOpen((m) => !m);
            }}
            aria-label="Choose music"
            aria-expanded={musicOpen}
            className={styles.raceMode}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              padding: "9px 13px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: "rgba(251,243,228,.8)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(23,27,46,.1)",
            }}
          >
            <span style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 12 }}>
              <span style={{ width: 2, height: eqHeight(), background: ACCENT, transition: "height .3s" }} />
              <span style={{ width: 2, height: eqHeight(), background: ACCENT, transition: "height .3s" }} />
              <span style={{ width: 2, height: eqHeight(), background: ACCENT, transition: "height .3s" }} />
            </span>
            {track >= 0 ? TRACKS[track].name : "Music"}
          </button>
          <Link
            href="/ride"
            data-mag="1"
            className={styles.raceMode}
            style={{ borderRadius: 999, padding: "9px 14px", fontWeight: 600, fontSize: 14, textDecoration: "none", color: INK, background: "rgba(251,243,228,.78)", backdropFilter: "blur(14px) saturate(1.2)", border: "1px solid rgba(23,27,46,.1)" }}
          >
            Race mode ↗
          </Link>
          <Link
            href="/contact"
            data-mag="1"
            className={styles.talkCta}
            style={{ borderRadius: 999, padding: "10px 16px", fontWeight: 700, fontSize: 14, textDecoration: "none", background: INK, color: "#fbf3e4", boxShadow: "0 10px 24px -12px rgba(23,27,46,.7)" }}
          >
            Let&apos;s talk →
          </Link>
        </div>
      </header>

      <nav aria-label="Chapters" style={{ position: "fixed", right: "clamp(10px,2vw,24px)", top: "50%", transform: "translateY(-50%)", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, marginBottom: 6, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: "#5e6478" }}>
          <span ref={hudDateRef} style={{ fontWeight: 600, color: INK }}>
            Jan 2018
          </span>
          <span>
            <span ref={hudPctRef}>0%</span> of plan
          </span>
        </div>
        {NAV.map((n, i) => (
          <a
            key={n}
            href={`#ch${i}`}
            onClick={(e) => {
              e.preventDefault();
              goToChapter(i);
            }}
            aria-label={`Chapter ${i}: ${n}`}
            aria-current={i === ch ? "step" : undefined}
            style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", padding: "2px 0", color: INK, textDecoration: "none" }}
          >
            <span style={{ whiteSpace: "nowrap", opacity: i === ch ? 1 : 0, transition: "opacity .3s", background: "rgba(251,243,228,.85)", padding: "3px 6px", borderRadius: 6 }}>{n}</span>
            <span style={{ width: i === ch ? 28 : 10, height: 6, borderRadius: 999, background: i < ch ? INK : i === ch ? ACCENT : BG, border: "1px solid rgba(23,27,46,.25)", transition: "width .35s cubic-bezier(.2,.9,.2,1),background-color .3s" }} />
          </a>
        ))}
      </nav>

      <div
        ref={curRingRef}
        aria-hidden="true"
        style={{ position: "fixed", left: 0, top: 0, width: 36, height: 36, margin: "-18px 0 0 -18px", borderRadius: "50%", border: "1.5px solid #171b2e", zIndex: 70, pointerEvents: "none", opacity: 0, transition: "width .28s cubic-bezier(.2,.9,.2,1),height .28s cubic-bezier(.2,.9,.2,1),margin .28s cubic-bezier(.2,.9,.2,1),background-color .25s,border-color .25s,opacity .3s" }}
      />
      <div ref={curDotRef} aria-hidden="true" style={{ position: "fixed", left: 0, top: 0, width: 6, height: 6, margin: "-3px 0 0 -3px", borderRadius: "50%", background: ACCENT, zIndex: 71, pointerEvents: "none", opacity: 0, transition: "opacity .3s" }} />

      {modal >= 0 &&
        (() => {
          const k = CASES[modal];
          const stepKeys = ["Context", "Response", "Evidence"] as const;
          return (
            <div
              onClick={closeCase}
              style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center", padding: 16, background: "rgba(23,27,46,.26)", backdropFilter: "blur(14px) saturate(1.15)" }}
            >
              <article
                role="dialog"
                aria-modal="true"
                aria-label={k.title}
                onClick={(e) => e.stopPropagation()}
                style={{ width: "min(720px,100%)", maxHeight: "min(88vh,780px)", overflow: "auto", background: "#fbf3e4", borderRadius: 22, boxShadow: "0 40px 90px -30px rgba(23,27,46,.6),0 0 0 1px rgba(23,27,46,.08)" }}
              >
                <div style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "12px 14px 12px 20px", background: "#fbf3e4", borderBottom: "1px solid rgba(23,27,46,.1)", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  <span>
                    Milestone {k.n} / 05 · {k.phase}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#5e6478" }}>{k.yr}</span>
                    <button
                      data-mag="1"
                      onClick={closeCase}
                      aria-label="Close case study"
                      style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(23,27,46,.2)", background: "transparent", cursor: "pointer", fontSize: 16 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div style={{ padding: "22px 22px 6px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "#5e6478" }}>{k.client}</span>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(38px,5.4vw,68px)", lineHeight: 0.9, letterSpacing: "-.025em" }}>{k.title}</h2>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", padding: "14px 0", borderTop: "1px solid rgba(23,27,46,.12)", borderBottom: "1px solid rgba(23,27,46,.12)" }}>
                    <span style={{ fontWeight: 800, fontSize: "clamp(64px,9vw,112px)", lineHeight: 0.82, color: ACCENT, letterSpacing: "-.03em" }}>{k.metric}</span>
                    <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, textTransform: "uppercase", maxWidth: 200 }}>{k.metricLabel}</span>
                  </div>
                </div>
                <div role="tablist" aria-label="Case study sections" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, padding: "6px 22px 0" }}>
                  {stepKeys.map((label, ti) => {
                    const on = ti === mtab;
                    return (
                      <button
                        key={label}
                        role="tab"
                        aria-selected={on}
                        onClick={() => {
                          setMtab(ti);
                          sfx("tick");
                        }}
                        style={{ background: on ? INK : "#f4e6cf", border: 0, borderRadius: 12, padding: "12px 12px 10px", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: on ? "#fbf3e4" : INK, transition: "background-color .25s,color .25s" }}
                      >
                        {"0" + (ti + 1)} {label}
                      </button>
                    );
                  })}
                </div>
                <p role="tabpanel" style={{ margin: 0, padding: "18px 22px 22px", fontSize: 18, lineHeight: 1.55, minHeight: 150 }}>{k.s[mtab]}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "14px 22px 20px", borderTop: "1px solid rgba(23,27,46,.1)", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase" }}>
                  <span style={{ color: "#5e6478" }}>{k.disc}</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      data-mag="1"
                      onClick={() => {
                        setModal((modal + 4) % 5);
                        setMtab(0);
                        sfx("open");
                      }}
                      style={{ border: "1px solid rgba(23,27,46,.2)", background: "transparent", borderRadius: 999, padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, textTransform: "uppercase" }}
                    >
                      ← Prev
                    </button>
                    <button
                      data-mag="1"
                      onClick={() => {
                        setModal((modal + 1) % 5);
                        setMtab(0);
                        sfx("open");
                      }}
                      style={{ border: "1px solid rgba(23,27,46,.2)", background: "transparent", borderRadius: 999, padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, textTransform: "uppercase" }}
                    >
                      Next →
                    </button>
                    <a href={`mailto:aashishpandey406@gmail.com?subject=${encodeURIComponent("Re: " + k.title)}`} data-mag="1" style={{ background: INK, color: "#fbf3e4", borderRadius: 999, padding: "10px 16px", fontWeight: 600, textDecoration: "none" }}>
                      Discuss this ↗
                    </a>
                  </div>
                </div>
              </article>
            </div>
          );
        })()}

      {musicOpen && (
        <div role="menu" aria-label="Music" style={{ position: "fixed", top: 68, right: "clamp(14px,3vw,32px)", zIndex: 45, width: "min(300px,calc(100vw - 28px))", padding: 8, borderRadius: 20, background: "rgba(251,243,228,.96)", backdropFilter: "blur(16px)", border: "1px solid rgba(23,27,46,.1)", boxShadow: "0 30px 60px -30px rgba(23,27,46,.6)", display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ padding: "8px 10px 6px", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "#5e6478" }}>Soundtrack · generated live</span>
          <button
            role="menuitemradio"
            aria-checked={track < 0}
            onClick={() => playTrack(-1)}
            style={{ display: "grid", gridTemplateColumns: "18px minmax(0,1fr) auto", gap: 10, alignItems: "center", textAlign: "left", padding: "10px 10px", borderRadius: 12, border: 0, cursor: "pointer", background: track < 0 ? INK : "transparent", color: track < 0 ? "#fbf3e4" : INK }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: track < 0 ? ACCENT : "rgba(23,27,46,.2)", justifySelf: "center" }} />
            <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
              <strong style={{ fontWeight: 700, fontSize: 15 }}>Silence</strong>
              <span style={{ fontSize: 12, opacity: 0.7 }}>No music</span>
            </span>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, opacity: 0.7 }}>—</span>
          </button>
          {TRACKS.map((t, i) => {
            const on = track === i;
            return (
              <button
                key={t.name}
                role="menuitemradio"
                aria-checked={on}
                onClick={() => playTrack(i)}
                style={{ display: "grid", gridTemplateColumns: "18px minmax(0,1fr) auto", gap: 10, alignItems: "center", textAlign: "left", padding: "10px 10px", borderRadius: 12, border: 0, cursor: "pointer", background: on ? INK : "transparent", color: on ? "#fbf3e4" : INK }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: on ? ACCENT : "rgba(23,27,46,.2)", justifySelf: "center" }} />
                <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                  <strong style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</strong>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>{t.mood}</span>
                </span>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, opacity: 0.7 }}>{t.bpm} bpm</span>
              </button>
            );
          })}
        </div>
      )}

      <main style={{ position: "relative", zIndex: 1, pointerEvents: "none" }}>
        <section id="ch0" data-ch="0" style={{ height: "160vh", position: "relative" }}>
          <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "clamp(12px,2.4vh,28px)", padding: "clamp(76px,11vh,104px) clamp(64px,7vw,110px) clamp(16px,3vh,32px) clamp(16px,5vw,72px)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "clamp(16px,3vw,56px)", alignItems: "end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18, opacity: anim(ch, 0).o, transition: "opacity .8s" }}>
                <span style={{ alignSelf: "flex-start", display: "flex", gap: 8, alignItems: "center", ...monoLabel, padding: "7px 12px", borderRadius: 999, background: "rgba(251,243,228,.78)", backdropFilter: "blur(14px) saturate(1.2)", border: "1px solid rgba(23,27,46,.1)", boxShadow: "0 10px 30px -18px rgba(23,27,46,.45)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4f8a4a" }} />
                  Project Manager · Pune · Open to new projects
                </span>
                <h1 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(52px,min(10vw,17vh),190px)", lineHeight: 0.8, letterSpacing: "-.04em" }}>
                  <span style={{ display: "block", overflow: "hidden", paddingBottom: ".04em" }}>
                    <span style={{ display: "block", transform: anim(ch, 0).y, transition: "transform 1.1s cubic-bezier(.2,.8,.2,1)" }}>Critical</span>
                  </span>
                  <span style={{ display: "block", overflow: "hidden", paddingBottom: ".04em" }}>
                    <span style={{ display: "block", transform: anim(ch, 0).y, transition: "transform 1.1s cubic-bezier(.2,.8,.2,1) .08s", color: ACCENT }}>path.</span>
                  </span>
                </h1>
                <p style={{ margin: 0, maxWidth: 520, fontSize: "clamp(16px,min(1.6vw,2.8vh),22px)", lineHeight: 1.45 }}>
                  I turn ambiguous goals into dependency-mapped plans, then ship them. This is my plan since 2018, built in 3D: every bar is shipped work, and the red line is the critical path.
                </p>
              </div>
              <div style={{ pointerEvents: "auto", justifySelf: "end", width: "min(380px,100%)", borderRadius: 22, padding: "clamp(12px,2vh,18px)", display: "flex", flexDirection: "column", gap: "clamp(10px,1.6vh,16px)", background: "rgba(251,243,228,.78)", backdropFilter: "blur(14px) saturate(1.2)", border: "1px solid rgba(23,27,46,.1)", boxShadow: "0 10px 30px -18px rgba(23,27,46,.45)", opacity: anim(ch, 0).o, transition: "opacity .8s .15s,transform 1s cubic-bezier(.2,.8,.2,1) .15s" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    ["6+", "Years shipping", INK],
                    ["35+", "Platforms delivered", INK],
                    ["99%", "On-time delivery", ACCENT],
                    ["4+", "Time zones at once", INK],
                  ].map(([v, l, c]) => (
                    <div key={l} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "clamp(8px,1.4vh,12px) 14px", borderRadius: 14, background: "rgba(23,27,46,.04)" }}>
                      <strong style={{ fontWeight: 800, fontSize: "clamp(28px,5vh,44px)", lineHeight: 0.9, letterSpacing: "-.03em", color: c }}>{v}</strong>
                      <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", color: "#5e6478" }}>{l}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a data-mag="1" href="mailto:aashishpandey406@gmail.com?subject=Project%20enquiry" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "14px 18px", borderRadius: 999, background: INK, color: "#fbf3e4", fontWeight: 700, textDecoration: "none" }}>
                    Start a project →
                  </a>
                  <a
                    data-mag="1"
                    href="#ch2"
                    onClick={(e) => {
                      e.preventDefault();
                      goToChapter(2);
                    }}
                    style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "14px 18px", borderRadius: 999, border: "1px solid rgba(23,27,46,.2)", fontWeight: 700, textDecoration: "none", color: INK }}
                  >
                    See the work ↓
                  </a>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "14px 28px", paddingTop: 18, borderTop: "1px solid rgba(23,27,46,.14)", opacity: anim(ch, 0).o, transition: "opacity .8s .3s" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 28px" }}>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "#5e6478" }}>Shipped for</span>
                {LOGOS.map((lg) => (
                  <span key={lg} style={{ fontWeight: 800, fontSize: "clamp(15px,1.4vw,19px)", letterSpacing: "-.01em", opacity: 0.78 }}>
                    {lg}
                  </span>
                ))}
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>
                <span style={{ display: "inline-block" }}>↓</span>Scroll to run the plan
              </span>
            </div>
          </div>
        </section>

        <section id="ch1" data-ch="1" style={{ height: "150vh", position: "relative" }}>
          <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", padding: "90px clamp(64px,7vw,110px) 90px clamp(16px,4vw,56px)" }}>
            <article style={{ maxWidth: 520, background: "rgba(251,243,228,.86)", backdropFilter: "blur(12px)", border: "1px solid rgba(23,27,46,.12)", borderRadius: 18, boxShadow: "0 28px 60px -30px rgba(23,27,46,.5)", overflow: "hidden", pointerEvents: anim(ch, 1).pe as React.CSSProperties["pointerEvents"], opacity: anim(ch, 1).o, transform: anim(ch, 1).t, transition: "opacity .6s,transform .8s cubic-bezier(.2,.8,.2,1)" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(23,27,46,.18)", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
                <span>Phase 01 · Freelance</span>
                <span>2018 – Dec 2020</span>
              </div>
              <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(44px,5vw,76px)", lineHeight: 0.88, letterSpacing: "-.02em" }}>15+ client projects</h2>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
                  As a freelance web developer and project consultant I delivered complex client projects for ITC, Anchor and MSI India, focused on high-performance architecture and long-term maintainability. I worked as end-to-end product owner, from discovery and scope definition through launch and post-launch iteration.
                </p>
                <p style={{ margin: 0, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "#5e6478" }}>I started as a developer. The rest of the plan builds on that.</p>
              </div>
            </article>
          </div>
        </section>

        {CASES.map((k, j) => {
          const i = j + 2;
          const a = anim(ch, i);
          return (
            <section key={k.title} id={`ch${i}`} data-ch={String(i)} style={{ height: "170vh", position: "relative" }}>
              <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", padding: "84px clamp(64px,7vw,110px) 40px clamp(16px,4vw,56px)" }}>
                <article style={{ width: "min(560px,100%)", maxHeight: "calc(100vh - 160px)", overflow: "auto", background: "rgba(251,243,228,.86)", backdropFilter: "blur(12px)", border: "1px solid rgba(23,27,46,.12)", borderRadius: 18, boxShadow: "0 28px 60px -30px rgba(23,27,46,.5)", pointerEvents: a.pe as React.CSSProperties["pointerEvents"], opacity: a.o, transform: a.t, transition: "opacity .6s,transform .8s cubic-bezier(.2,.8,.2,1)" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(23,27,46,.18)", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span>
                      Milestone {k.n} / 05 · {k.phase}
                    </span>
                    <span>{k.yr}</span>
                  </div>
                  <div style={{ padding: "18px 18px 6px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "#5e6478" }}>{k.client}</span>
                    <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(34px,3.6vw,54px)", lineHeight: 0.92, letterSpacing: "-.02em", overflow: "hidden" }}>
                      <span style={{ display: "block", transform: a.y, transition: "transform 1s cubic-bezier(.2,.8,.2,1) .1s" }}>{k.title}</span>
                    </h2>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", borderTop: "1px solid rgba(23,27,46,.18)", borderBottom: "1px solid rgba(23,27,46,.18)", padding: "10px 0" }}>
                      <span style={{ fontWeight: 800, fontSize: "clamp(56px,6vw,92px)", lineHeight: 0.85, color: ACCENT, letterSpacing: "-.03em" }}>{k.metric}</span>
                      <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, textTransform: "uppercase", maxWidth: 180 }}>{k.metricLabel}</span>
                    </div>
                  </div>
                  <div style={{ padding: "6px 18px 18px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      data-mag="1"
                      onClick={() => openCase(j)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 10, background: INK, color: "#fbf3e4", border: 0, borderRadius: 999, padding: "14px 20px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                    >
                      Open case study <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "12px 18px", borderTop: "1px solid rgba(23,27,46,.18)", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase" }}>
                    <span style={{ color: "#5e6478" }}>{k.disc}</span>
                    <Link href={k.url} style={{ fontWeight: 600, color: INK, textDecoration: "none" }}>
                      Discuss this ↗
                    </Link>
                  </div>
                </article>
              </div>
            </section>
          );
        })}

        <section id="ch7" data-ch="7" style={{ height: "170vh", position: "relative" }}>
          <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexWrap: "wrap", alignContent: "flex-end", alignItems: "flex-end", justifyContent: "space-between", gap: 20, padding: "84px clamp(64px,7vw,110px) 40px clamp(16px,4vw,56px)", overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, opacity: anim(ch, 7).o, transition: "opacity .6s" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(56px,9vw,150px)", lineHeight: 0.82, letterSpacing: "-.035em" }}>
                <span style={{ display: "block", overflow: "hidden" }}>
                  <span style={{ display: "block", transform: anim(ch, 7).y, transition: "transform 1s cubic-bezier(.2,.8,.2,1)" }}>35+</span>
                </span>
                <span style={{ display: "block", overflow: "hidden" }}>
                  <span style={{ display: "block", transform: anim(ch, 7).y, transition: "transform 1s cubic-bezier(.2,.8,.2,1) .08s" }}>shipped.</span>
                </span>
              </h2>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase" }}>
                <span style={{ background: INK, color: BG, padding: "6px 8px" }}>6+ years in digital</span>
                <span style={{ background: INK, color: BG, padding: "6px 8px" }}>4+ time zones</span>
                <span style={{ background: INK, color: BG, padding: "6px 8px" }}>99% on time at Knowledge Units</span>
              </div>
            </div>
            <div style={{ width: "min(420px,100%)", maxHeight: "calc(100vh - 170px)", minHeight: 0, display: "flex", flexDirection: "column", background: "rgba(251,243,228,.86)", backdropFilter: "blur(12px)", border: "1px solid rgba(23,27,46,.12)", borderRadius: 18, boxShadow: "0 28px 60px -30px rgba(23,27,46,.5)", overflow: "hidden", pointerEvents: anim(ch, 7).pe as React.CSSProperties["pointerEvents"], opacity: anim(ch, 7).o, transform: anim(ch, 7).t, transition: "opacity .6s,transform .8s cubic-bezier(.2,.8,.2,1)" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(23,27,46,.18)", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
                <span>The whole plan</span>
                <span>Hover to find it</span>
              </div>
              <ol data-own-scroll="1" style={{ listStyle: "none", margin: 0, padding: 0, flex: 1, minHeight: 0, maxHeight: 460, overflow: "auto" }}>
                {ROWS.map((r, i) => (
                  <li
                    key={r.t}
                    data-archive-i={i}
                    tabIndex={0}
                    className={styles.archiveRow}
                    style={{ display: "grid", gridTemplateColumns: "18px minmax(0,1fr) auto", gap: 10, alignItems: "baseline", padding: "9px 14px", borderBottom: "1px solid #e2cfb2", fontSize: 14, cursor: "default" }}
                  >
                    <span style={{ width: 9, height: 9, background: r.c != null ? ACCENT : "transparent", border: "1px solid currentColor", transform: "rotate(45deg)" }} />
                    <span style={{ fontWeight: r.c != null ? 700 : 400 }}>{r.t}</span>
                    <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11 }}>
                      {Math.floor(r.a)}–{r.b >= NOW ? "now" : String(Math.floor(r.b)).slice(2)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="ch8" data-ch="8" style={{ height: "170vh", position: "relative" }}>
          <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", padding: "84px clamp(64px,7vw,110px) 40px clamp(16px,4vw,56px)" }}>
            <div style={{ width: "min(600px,100%)", maxHeight: "calc(100vh - 170px)", overflow: "auto", display: "flex", flexDirection: "column", gap: 14, pointerEvents: anim(ch, 8).pe as React.CSSProperties["pointerEvents"], opacity: anim(ch, 8).o, transform: anim(ch, 8).t, transition: "opacity .6s,transform .8s cubic-bezier(.2,.8,.2,1)" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(48px,6.5vw,110px)", lineHeight: 0.84, letterSpacing: "-.03em", background: BG, alignSelf: "flex-start", padding: "4px 8px 8px" }}>Four worlds.</h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, background: BG, padding: "10px 12px", border: "1px solid rgba(23,27,46,.18)" }}>
                Every bar carries four blocks: Product, Design, Technology, Delivery. Pick a world and it lights up everywhere it was used, so you see what I do and where I did it at once.
              </p>
              <div role="radiogroup" aria-label="Pick a world" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 4 }}>
                {WORLDS.map((w, i) => {
                  const on = i === world;
                  return (
                    <button
                      key={w.name}
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        eng.current.hlWorld = i;
                        setWorld(i);
                      }}
                      onMouseEnter={() => {
                        eng.current.hlWorld = i;
                        setWorld(i);
                      }}
                      style={{ border: "1px solid rgba(23,27,46,.18)", background: on ? ACCENT : BG, color: INK, padding: "12px 8px 10px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", transition: "background .25s,color .25s" }}
                    >
                      <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10 }}>0{i + 1}</span>
                      <span style={{ fontWeight: 700, fontSize: "clamp(14px,1.4vw,18px)" }}>{w.name}</span>
                      <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10 }}>×{ROWS.filter((r) => r.w[i]).length}</span>
                    </button>
                  );
                })}
              </div>
              <div aria-live="polite" style={{ background: INK, color: BG, padding: "16px 16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>{activeWorld.text}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {activeWorld.tools.map((tl) => (
                    <span key={tl} style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, border: "1px solid #6d6d73", padding: "4px 7px" }}>
                      {tl}
                    </span>
                  ))}
                </div>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", color: "#ff9a7d" }}>Used on: {ROWS.filter((r) => r.w[world]).map((r) => r.short).join(" · ")}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="ch9" data-ch="9" style={{ height: "130vh", position: "relative" }}>
          <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 24, padding: "90px clamp(64px,7vw,110px) 40px clamp(16px,4vw,56px)" }}>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", display: "flex", gap: 8, alignItems: "center", opacity: anim(ch, 9).o, transition: "opacity .6s" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#5a6d96" }} />
              Beyond today · unscheduled
            </span>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(60px,11vw,200px)", lineHeight: 0.8, letterSpacing: "-.035em" }}>
              <span style={{ display: "block", overflow: "hidden", paddingBottom: ".04em" }}>
                <span style={{ display: "block", transform: anim(ch, 9).y, transition: "transform 1s cubic-bezier(.2,.8,.2,1)" }}>The next bar</span>
              </span>
              <span style={{ display: "block", overflow: "hidden", paddingBottom: ".04em" }}>
                <span style={{ display: "block", transform: anim(ch, 9).y, transition: "transform 1s cubic-bezier(.2,.8,.2,1) .08s", color: ACCENT }}>is yours.</span>
              </span>
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 40px", alignItems: "center", pointerEvents: anim(ch, 9).pe as React.CSSProperties["pointerEvents"], opacity: anim(ch, 9).o, transition: "opacity .6s" }}>
              <p style={{ margin: 0, maxWidth: 460, fontSize: 18, lineHeight: 1.45, background: BG, padding: "12px 14px", border: "1px solid rgba(23,27,46,.18)" }}>
                Building, redesigning, migrating or scaling a digital product or website? Tell me what you&apos;re working on. I reply within 48 hours.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a data-mag="1" href="mailto:aashishpandey406@gmail.com?subject=Project%20enquiry" style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "20px 28px", background: ACCENT, color: INK, fontWeight: 800, fontSize: 20, border: "1px solid rgba(23,27,46,.18)", textDecoration: "none" }}>
                  Kick off a project <span style={{ fontSize: 24 }}>→</span>
                </a>
                <a data-mag="1" href="/assets/Aashish-Pandey-Resume.docx" download style={{ padding: "20px 20px", background: BG, border: "1px solid rgba(23,27,46,.18)", fontWeight: 700, textDecoration: "none", color: INK }}>
                  Résumé ↓
                </a>
                <a href="https://linkedin.com/in/aashish-kumar-pandey" style={{ padding: "20px 20px", background: BG, border: "1px solid rgba(23,27,46,.18)", fontWeight: 700, textDecoration: "none", color: INK }}>
                  LinkedIn
                </a>
                <a href="https://github.com/aashisharyan2595" style={{ padding: "20px 20px", background: BG, border: "1px solid rgba(23,27,46,.18)", fontWeight: 700, textDecoration: "none", color: INK }}>
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
