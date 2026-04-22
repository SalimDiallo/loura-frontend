"use client";

import { Can } from "@/components/permissions";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useHRLeavesAnalytics } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { CalendarDays } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Widget, WidgetEmpty, WidgetError, WidgetLoading } from "./primitives";

interface Props {
  orgId: string;
}

// Palette sobre pour les statuts
const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(38 92% 50%)", // amber
  approved: "hsl(142 71% 45%)", // emerald
  rejected: "hsl(0 72% 51%)", // rose
  cancelled: "hsl(215 16% 57%)", // slate
};

const chartConfig = {
  requests: {
    label: "Demandes",
    color: "var(--chart-1, hsl(217 91% 60%))",
  },
  approved: {
    label: "Approuvées",
    color: "hsl(142 71% 45%)",
  },
} satisfies ChartConfig;

/**
 * Widget congés : breakdown par statut + tendance mensuelle + résumé soldes.
 * Permission : `hr.view_leaves`.
 */
export function LeavesWidget({ orgId }: Props) {
  return (
    <Can permission={PERMISSIONS.LEAVES.VIEW}>
      <LeavesInner orgId={orgId} />
    </Can>
  );
}

function formatMonth(key: string): string {
  // 'YYYY-MM' → 'Mmm'
  const [, m] = key.split("-");
  const months = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];
  const idx = Math.max(0, Math.min(11, Number(m) - 1));
  return months[idx];
}

function LeavesInner({ orgId }: Props) {
  const { data, isLoading, isError, error } = useHRLeavesAnalytics(orgId);

  const totalLeaves = data
    ? data.by_status.reduce((acc, b) => acc + b.count, 0)
    : 0;

  return (
    <Widget
      title="Activité congés"
      description={
        data ? `${totalLeaves.toLocaleString("fr-FR")} demandes au total` : undefined
      }
      icon={CalendarDays}
      minBodyHeight={320}
    >
      {isLoading ? (
        <WidgetLoading rows={6} />
      ) : isError ? (
        <WidgetError message={error?.message} />
      ) : !data ? (
        <WidgetEmpty />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Donut par statut */}
          <div className="lg:col-span-2 flex flex-col">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Par statut
            </p>
            {totalLeaves === 0 ? (
              <WidgetEmpty message="Aucune demande." />
            ) : (
              <>
                <ChartContainer config={chartConfig} className="aspect-square h-[170px] mx-auto">
                  <PieChart>
                    <ChartTooltip
                      content={<ChartTooltipContent hideLabel nameKey="label" />}
                    />
                    <Pie
                      data={data.by_status.filter((s) => s.count > 0)}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={45}
                      outerRadius={70}
                      strokeWidth={0}
                    >
                      {data.by_status
                        .filter((s) => s.count > 0)
                        .map((entry) => (
                          <Cell
                            key={entry.status}
                            fill={STATUS_COLORS[entry.status] || "hsl(215 16% 57%)"}
                          />
                        ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                <ul className="mt-2 space-y-1">
                  {data.by_status.map((s) => (
                    <li
                      key={s.status}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2 shrink-0"
                          style={{
                            background:
                              STATUS_COLORS[s.status] || "hsl(215 16% 57%)",
                          }}
                        />
                        <span className="text-foreground truncate">{s.label}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">
                        {s.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Tendance 6 mois */}
          <div className="lg:col-span-3 flex flex-col">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Demandes sur 6 mois
            </p>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[190px] w-full"
            >
              <BarChart
                data={data.monthly.map((m) => ({
                  month: formatMonth(m.month),
                  requests: m.requests,
                  approved: m.approved,
                }))}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  width={28}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="requests" fill="var(--color-requests)" radius={0} />
                <Bar dataKey="approved" fill="var(--color-approved)" radius={0} />
              </BarChart>
            </ChartContainer>

            {/* Résumé soldes de l'année */}
            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border/60 pt-3">
              <BalanceStat
                label={`Alloué ${data.balance_summary.year}`}
                value={data.balance_summary.total_days}
              />
              <BalanceStat
                label="Consommé"
                value={data.balance_summary.used_days}
                tone="warning"
              />
              <BalanceStat
                label="Restant"
                value={data.balance_summary.remaining_days}
                tone="success"
              />
            </div>
          </div>
        </div>
      )}
    </Widget>
  );
}

function BalanceStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "text-amber-600"
      : tone === "success"
        ? "text-emerald-600"
        : "text-foreground";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`text-lg font-semibold tabular-nums ${toneClass}`}>
        {value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} j
      </p>
    </div>
  );
}
