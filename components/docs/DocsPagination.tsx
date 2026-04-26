import type { DocPage } from "@/lib/docs/manifest";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

const BASE = "/docs/documentation";

export default function DocsPagination({
  prev,
  next,
}: {
  prev: DocPage | null;
  next: DocPage | null;
}) {
  if (!prev && !next) return null;

  return (
    <div className="mt-16 pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
      {prev ? (
        <Link
          href={`${BASE}/${prev.slug}`}
          className="group flex flex-col gap-1 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors"
        >
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Précédent
          </span>
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`${BASE}/${next.slug}`}
          className="group flex flex-col gap-1 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-right sm:text-right"
        >
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground flex items-center gap-1 sm:justify-end">
            Suivant
            <ArrowRight className="h-3 w-3" />
          </span>
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
