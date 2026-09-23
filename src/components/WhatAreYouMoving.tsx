"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { caseStudies, THEME_COLOR } from "@/lib/case-studies";
import { intents, services, type IntentKey } from "@/lib/field";

/**
 * The problem-based entry point — both a service-discovery mechanism and a
 * conversion path. Selecting an intent surfaces only the services and case
 * studies lib/field.ts actually links to it; "Hire me" / "Just say hello"
 * have no proof attached and just go straight to the CTA.
 */
export default function WhatAreYouMoving() {
  const [active, setActive] = useState<IntentKey | null>(null);
  const intent = intents.find((i) => i.key === active);
  const linkedCaseStudies = intent ? caseStudies.filter((c) => intent.caseStudySlugs.includes(c.slug)) : [];
  const linkedServices = intent ? services.filter((s) => intent.serviceKeys.includes(s.key)) : [];

  return (
    <section className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <Reveal className="max-w-2xl">
        <p className="eyebrow">How I can help</p>
        <h2 className="h1 mt-4">What are you trying to move?</h2>
      </Reveal>

      <Reveal delay={0.06} className="mt-10">
        <div className="flex flex-wrap gap-2" role="group" aria-label="What are you trying to move?">
          {intents.map((i) => (
            <button
              key={i.key}
              type="button"
              className="filter-btn"
              data-active={active === i.key}
              aria-pressed={active === i.key}
              onClick={() => setActive((cur) => (cur === i.key ? null : i.key))}
            >
              {i.label}
            </button>
          ))}
        </div>
      </Reveal>

      {intent && (
        <div className="mt-10 grid gap-10 border-t border-line pt-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="body text-muted">{intent.detail}</p>
            {linkedServices.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {linkedServices.map((s) => (
                  <span key={s.key} className="tag">
                    {s.label}
                  </span>
                ))}
              </div>
            )}
            <Link href="/contact" className="btn btn-primary mt-8 inline-flex">
              Start a brief
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          {linkedCaseStudies.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {linkedCaseStudies.map((c) => (
                <Link key={c.slug} href={`/work/${c.slug}`} className="card p-4">
                  <p className="meta-mono" style={{ color: THEME_COLOR[c.theme ?? "terracotta"] }}>
                    {c.metric.value}
                  </p>
                  <p className="body-sm mt-1 font-bold">{c.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
