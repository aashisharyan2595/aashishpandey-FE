"use client";

import { useMemo, useState } from "react";
import WorkGrid from "@/components/WorkGrid";
import type { CaseStudy } from "@/lib/case-studies";

/**
 * Client-side filter over the real case-study tags — no invented taxonomy,
 * just the tags each project already carries in its data.
 */
export default function WorkFilterGrid({ items }: { items: CaseStudy[] }) {
  const tags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => item.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const [active, setActive] = useState<string | null>(null);

  const filtered = active ? items.filter((item) => item.tags.includes(active)) : items;

  return (
    <div>
      <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filter by discipline">
        <button
          type="button"
          className="filter-btn"
          data-active={active === null}
          onClick={() => setActive(null)}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className="filter-btn"
            data-active={active === tag}
            onClick={() => setActive(active === tag ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <WorkGrid items={filtered} />
    </div>
  );
}
