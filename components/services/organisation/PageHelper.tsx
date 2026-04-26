"use client";

import { useTour } from "@/components/services/organisation/TourProvider";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { getToursForPath } from "@/lib/tours/registry";
import { cn } from "@/lib/utils";
import { HelpCircle, Play, Sparkles } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

export default function PageHelper() {
  const pathname = usePathname();
  const params = useParams();
  const orgId = (params?.id as string) || "";
  const { startTour } = useTour();
  const [open, setOpen] = useState(false);

  const { primary, related } = getToursForPath(pathname, orgId);
  const total = primary.length + related.length;
  if (total === 0) return null;

  const launch = (id: string) => {
    setOpen(false);
    startTour(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Aide"
          className={cn(
            "inline-flex items-center justify-center h-7 w-7 rounded-full",
            "text-muted-foreground/60 hover:text-primary",
            "hover:bg-primary/10 transition-colors",
            "border border-transparent hover:border-primary/20"
          )}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-80 p-0 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">
              Visites guidées
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Apprenez à utiliser cette page en 30 secondes.
          </p>
        </div>

        {primary.length > 0 && (
          <div className="py-2">
            <div className="px-4 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
              Pour cette page
            </div>
            {primary.map((tour) => {
              const Icon = tour.icon;
              return (
                <button
                  key={tour.id}
                  type="button"
                  onClick={() => launch(tour.id)}
                  className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-muted/40 transition-colors text-left group"
                >
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {tour.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      {tour.description}
                    </div>
                  </div>
                  <Play className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary mt-1.5 shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {related.length > 0 && (
          <div className="py-2 border-t border-border">
            <div className="px-4 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
              {primary.length > 0 ? "Aussi disponibles" : "Suggérées"}
            </div>
            {related.map((tour) => {
              const Icon = tour.icon;
              return (
                <button
                  key={tour.id}
                  type="button"
                  onClick={() => launch(tour.id)}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-muted/40 transition-colors text-left group"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <span className="text-xs text-foreground/80 flex-1 truncate">
                    {tour.title}
                  </span>
                  <Play className="h-2.5 w-2.5 text-muted-foreground/30 group-hover:text-primary shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
