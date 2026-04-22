"use client";

import { Can } from "@/components/permissions";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useHRHeadcountAnalytics } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Widget, WidgetEmpty, WidgetError, WidgetLoading } from "./primitives";

interface Props {
  orgId: string;
}

const chartConfig = {
  count: {
    label: "Effectif",
    color: "var(--chart-1, hsl(217 91% 60%))",
  },
} satisfies ChartConfig;

/**
 * Widget "Effectif par département".
 * Permission : `hr.view_employees`.
 */
export function HeadcountWidget({ orgId }: Props) {
  return (
    <Can permission={PERMISSIONS.HR.VIEW_EMPLOYEES}>
      <HeadcountInner orgId={orgId} />
    </Can>
  );
}

function HeadcountInner({ orgId }: Props) {
  const { data, isLoading, isError, error } = useHRHeadcountAnalytics(orgId);

  return (
    <Widget
      title="Effectif par département"
      description={
        data
          ? `${data.total_active.toLocaleString("fr-FR")} membres actifs`
          : "Répartition par rattachement"
      }
      icon={Users}
      minBodyHeight={280}
    >
      {isLoading ? (
        <WidgetLoading rows={6} />
      ) : isError ? (
        <WidgetError message={error?.message} />
      ) : !data || data.by_department.length === 0 ? (
        <WidgetEmpty message="Aucun département à afficher." />
      ) : (
        <div className="space-y-4">
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
            <BarChart
              data={data.by_department.map((d) => ({
                label: d.label,
                count: d.count,
              }))}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                width={28}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={0} />
            </BarChart>
          </ChartContainer>

          {/* Breakdown par rôle */}
          {data.by_role.length > 0 && (
            <div className="border-t border-border/60 pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Par rôle
              </p>
              <ul className="space-y-1.5">
                {data.by_role.slice(0, 5).map((row) => (
                  <li
                    key={row.id ?? row.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground truncate">{row.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {row.count.toLocaleString("fr-FR")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Widget>
  );
}
