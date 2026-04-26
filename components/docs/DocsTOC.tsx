"use client";

import type { TocEntry } from "@/lib/docs/markdown";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function DocsTOC({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;

    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    entries.forEach((e) => {
      const el = document.getElementById(e.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-label="Table des matières" className="text-[12.5px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70 mb-3">
        Sur cette page
      </p>
      <ul className="space-y-1.5 border-l border-border">
        {entries.map((entry) => {
          const active = activeId === entry.id;
          return (
            <li
              key={entry.id}
              className={cn(entry.level === 3 && "pl-3")}
            >
              <a
                href={`#${entry.id}`}
                className={cn(
                  "block -ml-px pl-3 border-l border-transparent leading-snug py-0.5 transition-colors",
                  active
                    ? "text-primary border-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
