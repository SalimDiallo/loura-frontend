"use client";

import { Can } from "@/components/permissions";
import { useHRContractsAnalytics } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import Link from "next/link";
import { Widget, WidgetEmpty, WidgetError, WidgetLoading } from "./primitives";

interface Props {
  orgId: string;
}

/**
 * Widget contrats : répartition par type + contrats bientôt terminés.
 * Permission : `hr.view_contracts`.
 */
export function ContractsWidget({ orgId }: Props) {
  return (
    <Can permission={PERMISSIONS.CONTRACTS.VIEW}>
      <ContractsInner orgId={orgId} />
    </Can>
  );
}

function ContractsInner({ orgId }: Props) {
  const { data, isLoading, isError, error } = useHRContractsAnalytics(orgId);

  return (
    <Widget
      title="Contrats"
      description={
        data
          ? `${data.total_active.toLocaleString("fr-FR")} contrat${data.total_active > 1 ? "s" : ""} actif${data.total_active > 1 ? "s" : ""}`
          : "Répartition par type"
      }
      icon={FileText}
      minBodyHeight={280}
    >
      {isLoading ? (
        <WidgetLoading rows={6} />
      ) : isError ? (
        <WidgetError message={error?.message} />
      ) : !data ? (
        <WidgetEmpty />
      ) : (
        <div className="space-y-5">
          {/* Barres horizontales proportionnelles */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Par type (actifs)
            </p>
            {data.total_active === 0 ? (
              <WidgetEmpty message="Aucun contrat actif." />
            ) : (
              <ul className="space-y-2">
                {data.by_type
                  .filter((t) => t.count > 0)
                  .map((t) => {
                    const pct = data.total_active
                      ? (t.count / data.total_active) * 100
                      : 0;
                    return (
                      <li key={t.type}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{t.label}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {t.count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full bg-muted/60">
                          <div
                            className="h-full bg-foreground/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>

          {/* Contrats arrivant à échéance */}
          <div className="border-t border-border/60 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Échéances (30 jours)
            </p>
            {data.ending_soon.length === 0 ? (
              <WidgetEmpty message="Aucune échéance proche." />
            ) : (
              <ul className="divide-y divide-border/60 -mx-5">
                {data.ending_soon.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/organisation/${orgId}/hr/contracts`}
                      className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {c.employee_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.contract_type.toUpperCase()} · fin{" "}
                          {c.end_date
                            ? new Date(c.end_date).toLocaleDateString("fr-FR")
                            : "—"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold tabular-nums shrink-0",
                          c.days_until_end !== null && c.days_until_end <= 7
                            ? "text-rose-600"
                            : "text-amber-600",
                        )}
                      >
                        {c.days_until_end !== null
                          ? `${c.days_until_end} j`
                          : "—"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Widget>
  );
}
