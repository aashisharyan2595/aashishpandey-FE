"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./mujasaurus.module.css";
import { INTRO_TIP, NAME, tipsFor } from "./mujasaurus-data";

type Action = "idle" | "walk" | "drag" | "eat" | "trick-spin" | "trick-jump" | "trick-roar" | "trick-dance";

const TRICKS: Action[] = ["trick-spin", "trick-jump", "trick-roar", "trick-dance"];
const TRICK_MS: Record<string, number> = { "trick-spin": 850, "trick-jump": 750, "trick-roar": 700, "trick-dance": 1050 };
const WALK_SPEED = 52; // px/s
const MARGIN = 14;

function poseClass(action: Action, sleeping: boolean): string {
  if (sleeping) return styles.sleeping;
  switch (action) {
    case "walk":
      return styles.walking;
    case "drag":
      return styles.dragging;
    case "eat":
      return styles.eating;
    case "trick-spin":
      return styles.trickSpin;
    case "trick-jump":
      return styles.trickJump;
    case "trick-roar":
      return styles.trickRoar;
    case "trick-dance":
      return styles.trickDance;
    default:
      return styles.idle;
  }
}

export default function Mujasaurus() {
  const pathname = usePathname() || "/";
  const rootRef = useRef<HTMLDivElement>(null);
  const eyelidRef = useRef<SVGRectElement>(null);
  const tipIdxRef = useRef(0);
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  // Mutable per-frame state (position, drag, wander timing) — kept out of
  // React state so the rAF loop never triggers a re-render; only the
  // occasional pose/UI changes below go through useState.
  const eng = useRef({
    x: 0,
    y: 0,
    w: 96,
    h: 78,
    dragging: false,
    dragDX: 0,
    dragDY: 0,
    downX: 0,
    downY: 0,
    downT: 0,
    moved: false,
    mode: "idle" as "idle" | "walk" | "settle",
    targetX: 0,
    nextWanderAt: 0,
    paused: false,
    reduced: false,
    ready: false,
  });

  const [mounted, setMounted] = useState(false);
  const [action, setAction] = useState<Action>("idle");
  const [facing, setFacing] = useState<1 | -1>(-1);
  const [sleeping, setSleeping] = useState(false);
  const [squashing, setSquashing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [berry, setBerry] = useState<{ x: number; top: number; drop: boolean } | null>(null);

  const actionRef = useRef(action);
  actionRef.current = action;
  const sleepingRef = useRef(sleeping);
  sleepingRef.current = sleeping;
  const menuOpenRef = useRef(menuOpen);
  menuOpenRef.current = menuOpen;

  const applyTransform = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const e = eng.current;
    el.style.transform = `translate3d(${e.x}px, ${e.y}px, 0)`;
  }, []);

  const clampAndSize = useCallback(() => {
    const e = eng.current;
    e.w = window.innerWidth < 480 ? 72 : 96;
    e.h = window.innerWidth < 480 ? 58 : 78;
    const maxX = window.innerWidth - e.w - MARGIN;
    const maxY = window.innerHeight - e.h - MARGIN;
    e.x = Math.min(Math.max(e.x, MARGIN), Math.max(MARGIN, maxX));
    e.y = Math.min(Math.max(e.y, MARGIN), Math.max(MARGIN, maxY));
    applyTransform();
  }, [applyTransform]);

  // ---------- mount: place dino, start rAF loop, blink timer ----------
  useEffect(() => {
    const e = eng.current;
    e.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    e.w = window.innerWidth < 480 ? 72 : 96;
    e.h = window.innerWidth < 480 ? 58 : 78;
    e.x = window.innerWidth - e.w - 28;
    e.y = window.innerHeight - e.h - 28;
    applyTransform();
    e.ready = true;
    setMounted(true);

    if (!e.reduced) e.nextWanderAt = performance.now() + 3500 + Math.random() * 4000;

    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      if (!e.ready || e.dragging || e.reduced) return;
      if (e.paused || sleepingRef.current || actionRef.current !== "idle") {
        if (actionRef.current === "walk") setAction("idle");
        return;
      }
      if (e.mode === "idle") {
        if (now > e.nextWanderAt) {
          const maxX = window.innerWidth - e.w - MARGIN;
          e.targetX = MARGIN + Math.random() * Math.max(1, maxX - MARGIN);
          e.mode = "walk";
          setAction("walk");
        }
        return;
      }
      // walking toward targetX
      const dx = e.targetX - e.x;
      const dir = dx > 0 ? 1 : -1;
      const step = dir * WALK_SPEED * dt;
      if (Math.abs(step) >= Math.abs(dx)) {
        e.x = e.targetX;
        e.mode = "idle";
        setAction("idle");
        e.nextWanderAt = now + 4000 + Math.random() * 6000;
      } else {
        e.x += step;
        setFacing((f) => (f !== (dir as 1 | -1) ? (dir as 1 | -1) : f));
      }
      applyTransform();
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => clampAndSize();
    window.addEventListener("resize", onResize);

    let blinkT: ReturnType<typeof setTimeout>;
    const blink = () => {
      const lid = eyelidRef.current;
      if (lid && !e.reduced) {
        lid.style.transform = "scaleY(1)";
        setTimeout(() => {
          if (lid) lid.style.transform = "scaleY(0.05)";
        }, 90);
      }
      blinkT = setTimeout(blink, 2400 + Math.random() * 2600);
    };
    blinkT = setTimeout(blink, 1800);

    let introT: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!localStorage.getItem("muja-intro-seen")) {
        introT = setTimeout(() => {
          setBubble(INTRO_TIP);
          setTimeout(() => setBubble((b) => (b === INTRO_TIP ? null : b)), 5200);
          try {
            localStorage.setItem("muja-intro-seen", "1");
          } catch {
            // ignore
          }
        }, 1600);
      }
    } catch {
      // ignore
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(blinkT);
      if (introT) clearTimeout(introT);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- drag handling ----------
  const onPointerDown = (ev: React.PointerEvent) => {
    const e = eng.current;
    (ev.target as Element).setPointerCapture?.(ev.pointerId);
    e.dragging = true;
    e.mode = "idle";
    e.paused = true;
    e.moved = false;
    e.downX = ev.clientX;
    e.downY = ev.clientY;
    e.downT = performance.now();
    e.dragDX = ev.clientX - e.x;
    e.dragDY = ev.clientY - e.y;
    setAction("drag");
    setBubble(null);
  };
  const onPointerMove = (ev: React.PointerEvent) => {
    const e = eng.current;
    if (!e.dragging) return;
    if (Math.abs(ev.clientX - e.downX) > 5 || Math.abs(ev.clientY - e.downY) > 5) e.moved = true;
    const maxX = window.innerWidth - e.w - MARGIN;
    const maxY = window.innerHeight - e.h - MARGIN;
    const nx = ev.clientX - e.dragDX;
    const ny = ev.clientY - e.dragDY;
    setFacing((f) => (nx < e.x && f !== -1 ? -1 : nx > e.x && f !== 1 ? 1 : f));
    e.x = Math.min(Math.max(nx, MARGIN), Math.max(MARGIN, maxX));
    e.y = Math.min(Math.max(ny, MARGIN), Math.max(MARGIN, maxY));
    applyTransform();
  };
  const onPointerUp = () => {
    const e = eng.current;
    if (!e.dragging) return;
    e.dragging = false;
    e.paused = false;
    const wasClick = !e.moved && performance.now() - e.downT < 300;
    if (wasClick) {
      setAction("idle");
      setMenuOpen((m) => !m);
      setBubble(null);
    } else {
      const groundY = window.innerHeight - e.h - MARGIN;
      e.y = groundY;
      const root = rootRef.current;
      if (root && !e.reduced) {
        root.style.transition = "transform .38s cubic-bezier(.34,1.56,.64,1)";
        setTimeout(() => {
          if (root) root.style.transition = "";
        }, 400);
      }
      applyTransform();
      setAction("idle");
      setSquashing(true);
      setTimeout(() => setSquashing(false), 420);
      e.nextWanderAt = performance.now() + 3000 + Math.random() * 4000;
    }
  };

  // ---------- menu actions ----------
  const doTrick = () => {
    if (actionRef.current.startsWith("trick") || sleepingRef.current) return;
    setMenuOpen(false);
    const kind = TRICKS[Math.floor(Math.random() * TRICKS.length)];
    eng.current.paused = true;
    eng.current.mode = "idle";
    setAction(kind);
    setTimeout(() => {
      setAction("idle");
      eng.current.paused = false;
      eng.current.nextWanderAt = performance.now() + 2500;
    }, TRICK_MS[kind]);
  };

  const feed = () => {
    if (berry || sleepingRef.current) return;
    setMenuOpen(false);
    eng.current.paused = true;
    eng.current.mode = "idle";
    const e = eng.current;
    const bx = Math.min(Math.max(e.x + e.w / 2 - 9, 10), window.innerWidth - 28);
    const landY = e.y + e.h * 0.32;
    setBerry({ x: bx, top: -40, drop: false });
    requestAnimationFrame(() => setBerry({ x: bx, top: landY, drop: true }));
    setTimeout(() => {
      setBerry(null);
      setAction("eat");
      setBubble("Yum, thank you!");
      setTimeout(() => setBubble((b) => (b === "Yum, thank you!" ? null : b)), 1800);
      setTimeout(() => {
        setAction("idle");
        eng.current.paused = false;
        eng.current.nextWanderAt = performance.now() + 3000;
      }, 1100);
    }, 720);
  };

  const toggleSleep = () => {
    setMenuOpen(false);
    eng.current.mode = "idle";
    setSleeping((s) => {
      eng.current.paused = !s;
      if (s) eng.current.nextWanderAt = performance.now() + 2000;
      return !s;
    });
    setAction("idle");
  };

  const showGuide = () => {
    setMenuOpen(false);
    eng.current.paused = true;
    eng.current.mode = "idle";
    const tips = tipsFor(pathRef.current);
    const idx = tipIdxRef.current % tips.length;
    tipIdxRef.current = idx + 1;
    setBubble(tips[idx]);
  };

  const nextTip = () => {
    const tips = tipsFor(pathRef.current);
    const idx = tipIdxRef.current % tips.length;
    tipIdxRef.current = idx + 1;
    setBubble(tips[idx]);
  };

  const closeBubble = () => {
    setBubble(null);
    eng.current.paused = menuOpenRef.current || sleepingRef.current;
  };

  useEffect(() => {
    if (!menuOpen && !bubble) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setMenuOpen(false);
        closeBubble();
      }
    };
    const onOutside = (ev: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(ev.target as Node)) {
        setMenuOpen(false);
        closeBubble();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen, bubble]);

  if (!mounted) return null;

  const ACC = "#e8773a";
  const HOT = "#f4b24a";
  const INK = "#171b2e";
  const CREAM = "#fbf3e4";

  return (
    <>
      {berry && (
        <div
          className={`${styles.berry} ${berry.drop ? styles.berryDrop : ""}`}
          style={{ left: berry.x, top: berry.top }}
          aria-hidden="true"
        />
      )}
      <div ref={rootRef} className={styles.root} style={{ width: eng.current.w, height: eng.current.h }}>
        {menuOpen && (
        <div className={styles.popover} role="menu" aria-label={`${NAME} actions`}>
          <div className={styles.menu}>
            <button type="button" className={styles.menuBtn} onClick={showGuide} title="Guide me" aria-label="Guide me around this page">
              🧭
            </button>
            <button type="button" className={styles.menuBtn} onClick={doTrick} title="Do a trick" aria-label="Do a trick">
              🎉
            </button>
            <button type="button" className={styles.menuBtn} onClick={feed} title="Feed me" aria-label="Feed me a berry">
              🍓
            </button>
            <button type="button" className={styles.menuBtn} onClick={toggleSleep} title={sleeping ? "Wake up" : "Sleep"} aria-label={sleeping ? "Wake me up" : "Put me to sleep"}>
              {sleeping ? "☀️" : "💤"}
            </button>
          </div>
        </div>
      )}
      {bubble && (
        <div className={styles.popover} role="status">
          <div className={styles.bubbleRow}>
            <div className={styles.bubble}>{bubble}</div>
            <button type="button" className={styles.bubbleNext} onClick={nextTip} aria-label="Next tip">
              Next
            </button>
            <button type="button" className={styles.bubbleNext} onClick={closeBubble} aria-label="Close">
              ×
            </button>
          </div>
        </div>
      )}
      <div
        className={`${styles.hit} ${poseClass(action, sleeping)}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="button"
        tabIndex={0}
        aria-label={`${NAME}, the site mascot — click for a menu, drag to move`}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            setMenuOpen((m) => !m);
          }
        }}
      >
        {sleeping && (
          <span className={styles.zzz} aria-hidden="true">
            Z Z Z
          </span>
        )}
        <div className={squashing ? styles.squash : undefined}>
          <div className={styles.flip} style={{ transform: `scaleX(${facing})` }}>
            <svg viewBox="0 0 120 100" className={styles.svg} aria-hidden="true">
              {/* tail */}
              <path className={styles.tail} d="M20 66 Q2 58 6 42 Q16 50 26 60 Z" fill={HOT} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
              {/* back legs */}
              <rect className={styles.legB} x="30" y="70" width="14" height="24" rx="7" fill={ACC} stroke={INK} strokeWidth="2.5" />
              <rect className={styles.legA} x="66" y="70" width="14" height="24" rx="7" fill={ACC} stroke={INK} strokeWidth="2.5" />
              {/* body */}
              <ellipse cx="58" cy="56" rx="38" ry="28" fill={ACC} stroke={INK} strokeWidth="2.5" />
              {/* belly */}
              <ellipse cx="56" cy="66" rx="24" ry="15" fill={CREAM} />
              {/* front legs */}
              <rect className={styles.legA} x="40" y="76" width="14" height="20" rx="7" fill={ACC} stroke={INK} strokeWidth="2.5" />
              <rect className={styles.legB} x="76" y="76" width="14" height="20" rx="7" fill={ACC} stroke={INK} strokeWidth="2.5" />
              {/* back spikes */}
              <polygon points="42,30 48,18 54,30" fill={HOT} stroke={INK} strokeWidth="2" />
              <polygon points="56,26 62,12 68,26" fill={HOT} stroke={INK} strokeWidth="2" />
              <polygon points="70,29 76,17 82,29" fill={HOT} stroke={INK} strokeWidth="2" />
              {/* arms */}
              <ellipse cx="34" cy="60" rx="7" ry="5" fill={ACC} stroke={INK} strokeWidth="2" />
              {/* head */}
              <circle cx="90" cy="42" r="24" fill={ACC} stroke={INK} strokeWidth="2.5" />
              {/* snout */}
              <ellipse cx="106" cy="48" rx="11" ry="8" fill={ACC} stroke={INK} strokeWidth="2.5" />
              <circle cx="112" cy="45" r="1.6" fill={INK} />
              {/* mouth */}
              <path className={styles.mouth} d="M98 52 Q106 57 114 52" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
              {/* blush */}
              <ellipse cx="78" cy="50" rx="5" ry="3.2" fill="#f2a06b" opacity="0.7" />
              {/* eye */}
              <circle cx="88" cy="34" r="9" fill={CREAM} stroke={INK} strokeWidth="2" />
              <circle cx="90" cy="35" r="4.4" fill={INK} />
              <circle cx="92" cy="32.5" r="1.4" fill={CREAM} />
              <rect ref={eyelidRef} x="79" y="24" width="18" height="10" fill={ACC} style={{ transformOrigin: "88px 25px", transform: "scaleY(0.05)" }} />
            </svg>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
