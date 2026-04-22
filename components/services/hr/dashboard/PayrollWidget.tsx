"use client";

import { Can } from "@/components/permissions";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useHRPayrollAnalytics } from "@/lib/hooks/hr";
import { useCurrencyFormatter } from "@/lib/hooks/useCurrency";
import { PERMISSIONS } from "@/lib/permissions";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Widget, WidgetEmpty, WidgetError, WidgetLoading } from "./primitives";

interface Props {
  orgId: string;
}

const chartConfig = {
  total: {
    label: "Masse salariale",
    color: "var(--chart-2, hsl(217 91% 60%))",
  },
} satisfies ChartConfig;

const MONTHS_FR = [
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

function formatMonth(key: string): string {
  const [, m] = key.split("-");
  const idx = Math.max(0, Math.min(11, Number(m) - 1));
  return MONTHS_FR[idx];
}

/**
 * Widget paie : tendance 6 mois + variation mois actuel vs mois précédent.
 * Permission : `hr.view_payments`.
 */
export function PayrollWidget({ orgId }: Props) {
  return (
    <Can permission={PERMISSIONS.PAYMENTS.VIEW}>
      <PayrollInner orgId={orgId} />
    </Can>
  );
}

function PayrollInner({ orgId }: Props) {
  const { data, isLoading, isError, error } = useHRPayrollAnalytics(orgId);
  const { formatCompactCurrency, formatCurrency } = useCurrencyFormatter(orgId);

  const variation =
    data && data.previous_month > 0
      ? ((data.current_month - data.previous_month) / data.previous_month) * 100
      : null;

  return (
    <Widget
      title="Masse salariale"
      description="Évolution des paiements approuvés"
      icon={Wallet}
      minBodyHeight={280}
    >
      {isLoading ? (
        <WidgetLoading rows={6} />
      ) : isError ? (
        <WidgetError message={error?.message} />
      ) : !data ? (
        <WidgetEmpty />
      ) : (
        <div className="space-y-4">
          {/* Stats résumé */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Mois en cours
              </p>
              <p className="text-xl font-semibold tabular-nums">
                {formatCurrency(data.current_month)}
              </p>
              {variation !== null && (
                <div
                  className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                    variation >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {variation >= 0 ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  <span>
                    {variation >= 0 ? "+" : ""}
                    {variation.toFixed(1)}% vs mois précédent
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                En attente
              </p>
              <p className="text-xl font-semibold tabular-nums text-amber-600">
                {formatCurrency(data.pending_amount)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.pending_count.toLocaleString("fr-FR")} paiement
                {data.pending_count > 1 ? "s" : ""}
                {data.pending_advances > 0 &&
                  ` · ${data.pending_advances} avance${data.pending_advances > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Tendance 6 mois */}
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[180px] w-full"
          >
            <AreaChart
              data={data.monthly.map((m) => ({
                month: formatMonth(m.month),
                total: m.total,
              }))}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillPayroll" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
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
                tick={{ fontSize: 11 }}
                width={48}
                tickFormatter={(v) => formatCompactCurrency(Number(v))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {formatCurrency(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Area
                dataKey="total"
                type="monotone"
                stroke="var(--color-total)"
                strokeWidth={2}
                fill="url(#fillPayroll)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </Widget>
  );
}
