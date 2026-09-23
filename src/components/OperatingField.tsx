"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { caseStudies, THEME_COLOR } from "@/lib/case-studies";
import { services, type ServiceKey } from "@/lib/field";

/**
 * The Operating Field — the site's signature interaction. Selecting a
 * capability (a real service, e.g. "D2C & Commerce") highlights the real
 * case studies that demonstrate it, per lib/field.ts's data model. Built as
 * real DOM buttons/links positioned over a decorative SVG connector layer,
 * not canvas/WebGL: every node is keyboard-focusable and readable by a
 * screen reader on its own, and the connective lines are aria-hidden
 * decoration layered behind them — the interaction works with the lines
 * removed entirely. No invented relationships: every connector comes
 * straight from each service's real `caseStudySlugs`.
 */

const FIELD_W = 1000;
const FIELD_H = 480;
const SERVICE_Y = 70;
const CASE_Y = 400;

function xForIndex(i: number, count: number, w: number, pad: number) {
  if (count === 1) return w / 2;
  return pad + ((w - pad * 2) / (count - 1)) * i;
}

function subscribeMobile(onChange: () => void) {
  const mql = window.matchMedia("(max-width: 767px)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

export default function OperatingField() {
  const [active, setActive] = useState<ServiceKey | null>(null);
  const isMobile = useIsMobile();

  const activeService = services.find((s) => s.key === active);
  const linkedSlugs = new Set(activeService?.caseStudySlugs ?? []);

  const toggle = (key: ServiceKey) => setActive((cur) => (cur === key ? null : key));

  if (isMobile) {
    return (
      <div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Select a capability">
          {services.map((s) => (
            <button
              key={s.key}
              type="button"
              className="filter-btn"
              data-active={active === s.key}
              aria-pressed={active === s.key}
              onClick={() => toggle(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-3">
          {caseStudies
            .filter((c) => active === null || linkedSlugs.has(c.slug))
            .map((c) => (
              <Link key={c.slug} href={`/work/${c.slug}`} className="card flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="meta-mono" style={{ color: THEME_COLOR[c.theme ?? "terracotta"] }}>
                    {c.metric.value}
                  </p>
                  <p className="body-sm mt-1 font-bold">{c.title}</p>
                </div>
              </Link>
            ))}
        </div>
      </div>
    );
  }

  const servicePositions = services.map((s, i) => ({
    ...s,
    x: xForIndex(i, services.length, FIELD_W, 90),
    y: SERVICE_Y,
  }));
  const casePositions = caseStudies.map((c, i) => ({
    ...c,
    x: xForIndex(i, caseStudies.length, FIELD_W, 110),
    y: CASE_Y,
  }));

  return (
    <div className="relative mx-auto w-full" style={{ aspectRatio: `${FIELD_W} / ${FIELD_H}` }}>
      <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} className="absolute inset-0 h-full w-full" aria-hidden>
        {servicePositions.map((s) =>
          s.caseStudySlugs.map((slug) => {
            const c = casePositions.find((cs) => cs.slug === slug);
            if (!c) return null;
            const isActiveEdge = active === s.key;
            const isDimmed = active !== null && !isActiveEdge;
            const midY = (s.y + c.y) / 2;
            const d = `M ${s.x} ${s.y} Q ${(s.x + c.x) / 2} ${midY} ${c.x} ${c.y}`;
            return (
              <motion.path
                key={`${s.key}-${slug}`}
                d={d}
                fill="none"
                stroke="var(--gold)"
                strokeWidth={isActiveEdge ? 2 : 1}
                initial={false}
                animate={{ opacity: isDimmed ? 0.05 : isActiveEdge ? 0.85 : 0.16 }}
                transition={{ duration: 0.35 }}
              />
            );
          }),
        )}
      </svg>

      {servicePositions.map((s) => {
        const isActive = active === s.key;
        const isDimmed = active !== null && !isActive;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => toggle(s.key)}
            className="filter-btn absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
            style={{
              left: `${(s.x / FIELD_W) * 100}%`,
              top: `${(s.y / FIELD_H) * 100}%`,
              opacity: isDimmed ? 0.4 : 1,
            }}
            data-active={isActive}
            aria-pressed={isActive}
          >
            {s.label}
          </button>
        );
      })}

      {casePositions.map((c) => {
        const isLinked = active === null || linkedSlugs.has(c.slug);
        const accent = THEME_COLOR[c.theme ?? "terracotta"];
        return (
          <Link
            key={c.slug}
            href={`/work/${c.slug}`}
            className="card w-40 p-3 text-center"
            style={{
              position: "absolute",
              left: `${(c.x / FIELD_W) * 100}%`,
              top: `${(c.y / FIELD_H) * 100}%`,
              transform: "translate(-50%, -50%)",
              opacity: isLinked ? 1 : 0.25,
              borderColor: isLinked && active !== null ? accent : undefined,
            }}
          >
            <p className="meta-mono" style={{ color: accent }}>
              {c.metric.value}
            </p>
            <p className="body-sm mt-1 font-bold leading-snug">{c.title}</p>
          </Link>
        );
      })}
    </div>
  );
}
