"use client";

import { DOCS_MANIFEST } from "@/lib/docs/manifest";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE = "/docs/documentation";

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-7">
      {DOCS_MANIFEST.map((section) => (
        <div key={section.id}>
          <h4 className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70 mb-2">
            {section.title}
          </h4>
          <ul className="space-y-px">
            {section.pages.map((page) => {
              const href = `${BASE}/${page.slug}`;
              const active = pathname === href;
              return (
                <li key={page.slug}>
                  <Link
                    href={href}
                    className={cn(
                      "group flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-[13px] leading-tight transition-colors",
                      active
                        ? "bg-primary/8 text-foreground font-medium border-l-2 border-primary -ml-px pl-[7px]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="truncate">{page.title}</span>
                    {page.badge && (
                      <span
                        className={cn(
                          "shrink-0 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold rounded",
                          page.badge === "Beta" &&
                            "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                          page.badge === "Nouveau" &&
                            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                          page.badge === "Bientôt" &&
                            "bg-muted text-muted-foreground"
                        )}
                      >
                        {page.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
