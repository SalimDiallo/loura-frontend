"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useServicesAnalyticsSummary } from "@/lib/hooks/services";
import type { ServicesAnalyticsGranularity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarRange, ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ReportEmpty, ReportSection } from "./ReportPrimitives";
import {
    chartAxisLine,
    chartAxisTick,
    chartGrid,
    chartTooltipItemStyle,
    chartTooltipLabelStyle,
    chartTooltipStyle,
    compactNumber,
} from "./chartTheme";

// ─── Types ──────────────────────────────────────────────────────────────────

type Mode = "year" | "month" | "week" | "custom";

interface Range {
    from: string; // YYYY-MM-DD
    to: string;
    label: string;
}

interface PeriodComparisonProps {
    orgId: string;
    /**
     * Granularité d'agrégation par défaut. Quand le mode est `year`, on
     * surcharge à `month` (les agrégations par jour sur 365 j sont peu
     * lisibles).
     */
    defaultGranularity?: ServicesAnalyticsGranularity;
}

// ─── Helpers : ranges prédéfinis ────────────────────────────────────────────

const toISO = (d: Date) => d.toISOString().split("T")[0];

function rangesForMode(mode: Mode): { current: Range; previous: Range } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (mode) {
        case "year": {
            const y = today.getFullYear();
            return {
                current: {
                    from: toISO(new Date(y, 0, 1)),
                    to: toISO(today),
                    label: `Année ${y}`,
                },
                previous: {
                    // Année précédente complète : 1er janvier → 31 décembre
                    from: toISO(new Date(y - 1, 0, 1)),
                    to: toISO(new Date(y - 1, 11, 31)),
                    label: `Année ${y - 1}`,
                },
            };
        }
        case "month": {
            const y = today.getFullYear();
            const m = today.getMonth();
            const startCurrent = new Date(y, m, 1);
            const startPrev = new Date(y, m - 1, 1);
            const endPrev = new Date(y, m, 0); // jour 0 du mois courant = dernier jour du mois précédent
            return {
                current: {
                    from: toISO(startCurrent),
                    to: toISO(today),
                    label: monthLabel(startCurrent),
                },
                previous: {
                    from: toISO(startPrev),
                    to: toISO(endPrev),
                    label: monthLabel(startPrev),
                },
            };
        }
        case "week": {
            // ISO week (lundi → dimanche) avec semaine en cours et précédente.
            const day = today.getDay() || 7; // dimanche = 7
            const startCurrent = new Date(today);
            startCurrent.setDate(today.getDate() - day + 1);
            const startPrev = new Date(startCurrent);
            startPrev.setDate(startCurrent.getDate() - 7);
            const endPrev = new Date(startCurrent);
            endPrev.setDate(startCurrent.getDate() - 1);
            return {
                current: {
                    from: toISO(startCurrent),
                    to: toISO(today),
                    label: "Semaine en cours",
                },
                previous: {
                    from: toISO(startPrev),
                    to: toISO(endPrev),
                    label: "Semaine précédente",
                },
            };
        }
        case "custom":
        default:
            // Initialisation par défaut pour le mode personnalisé (mois courant
            // vs précédent), l'utilisateur ajustera ensuite.
            return rangesForMode("month");
    }
}

function monthLabel(d: Date): string {
    const fmt = d.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
    });
    return fmt.charAt(0).toUpperCase() + fmt.slice(1);
}

function granularityForMode(mode: Mode): ServicesAnalyticsGranularity {
    if (mode === "year") return "month";
    if (mode === "month") return "day";
    return "day";
}

/**
 * Calcule la durée d'une plage en jours (inclusive).
 */
function daysBetween(from: string, to: string): number {
    const f = new Date(from).getTime();
    const t = new Date(to).getTime();
    if (!Number.isFinite(f) || !Number.isFinite(t)) return 0;
    return Math.max(1, Math.round((t - f) / 86_400_000) + 1);
}

/**
 * Variation en pourcentage avec gestion du cas `previous = 0` :
 *   - both 0 → 0%
 *   - prev 0, curr > 0 → +∞ symbolisé par null (on affichera "—")
 */
function pct(curr: number, prev: number): number | null {
    if (prev === 0 && curr === 0) return 0;
    if (prev === 0) return null;
    return ((curr - prev) / Math.abs(prev)) * 100;
}

// ─── Composant principal ────────────────────────────────────────────────────

export function PeriodComparison({ orgId }: PeriodComparisonProps) {
    const { formatCurrency } = useCurrencyFormatter();
    const [mode, setMode] = useState<Mode>("year");

    // Plages courante / précédente, dérivées du mode (sauf custom où l'user
    // édite manuellement les bornes).
    const [ranges, setRanges] = useState<{ current: Range; previous: Range }>(
        () => rangesForMode("year"),
    );

    const onModeChange = (v: Mode) => {
        setMode(v);
        if (v !== "custom") setRanges(rangesForMode(v));
    };

    const granularity = granularityForMode(mode);

    // ── Fetch des deux summaries en parallèle ──
    const summaryA = useServicesAnalyticsSummary(orgId, {
        from: ranges.current.from,
        to: ranges.current.to,
        granularity,
    });
    const summaryB = useServicesAnalyticsSummary(orgId, {
        from: ranges.previous.from,
        to: ranges.previous.to,
        granularity,
    });

    const isLoading = summaryA.isLoading || summaryB.isLoading;
    const error = summaryA.error || summaryB.error;

    // ── KPIs comparés ──
    const kpiA = summaryA.data?.kpis;
    const kpiB = summaryB.data?.kpis;
    const revA = kpiA ? Number(kpiA.revenue) + Number(kpiA.other_revenue) : 0;
    const revB = kpiB ? Number(kpiB.revenue) + Number(kpiB.other_revenue) : 0;
    const expA = kpiA ? Number(kpiA.expense) : 0;
    const expB = kpiB ? Number(kpiB.expense) : 0;
    const netA = kpiA ? Number(kpiA.net) : 0;
    const netB = kpiB ? Number(kpiB.net) : 0;

    // ── Données du chart : on aligne les deux séries sur un axe « offset »
    //    (jour 1 → jour N) plutôt que sur une date absolue, afin que les deux
    //    courbes se superposent visuellement. ──
    const chartData = useMemo(() => {
        const trendA = summaryA.data?.transactions_trend ?? [];
        const trendB = summaryB.data?.transactions_trend ?? [];
        const len = Math.max(trendA.length, trendB.length);
        return Array.from({ length: len }, (_, i) => {
            const a = trendA[i];
            const b = trendB[i];
            return {
                offset: i + 1,
                labelA: a?.period ? formatPeriodTick(a.period, granularity) : "",
                labelB: b?.period ? formatPeriodTick(b.period, granularity) : "",
                revenueA: a ? Number(a.revenue) : null,
                revenueB: b ? Number(b.revenue) : null,
                expenseA: a ? Number(a.expense) : null,
                expenseB: b ? Number(b.expense) : null,
            };
        });
    }, [summaryA.data, summaryB.data, granularity]);

    const hasData =
        chartData.some(
            (d) =>
                (d.revenueA ?? 0) > 0 ||
                (d.revenueB ?? 0) > 0 ||
                (d.expenseA ?? 0) > 0 ||
                (d.expenseB ?? 0) > 0,
        );

    // ── Render ──
    return (
        <ReportSection
            title="Comparer deux périodes"
            description="Évaluez l'évolution de vos revenus et dépenses entre deux fenêtres temporelles."
            actions={
                <ComparisonControls
                    mode={mode}
                    onModeChange={onModeChange}
                    ranges={ranges}
                    onRangesChange={setRanges}
                />
            }
        >
            {/* ── KPIs delta ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <DeltaKpi
                    label="Revenus"
                    valueA={revA}
                    valueB={revB}
                    labelA={ranges.current.label}
                    labelB={ranges.previous.label}
                    formatValue={formatCurrency}
                    isLoading={isLoading}
                />
                <DeltaKpi
                    label="Dépenses"
                    valueA={expA}
                    valueB={expB}
                    labelA={ranges.current.label}
                    labelB={ranges.previous.label}
                    formatValue={formatCurrency}
                    invertTrend
                    isLoading={isLoading}
                />
                <DeltaKpi
                    label="Marge nette"
                    valueA={netA}
                    valueB={netB}
                    labelA={ranges.current.label}
                    labelB={ranges.previous.label}
                    formatValue={formatCurrency}
                    isLoading={isLoading}
                />
            </div>

            {/* ── Chart ─────────────────────────────────────────────── */}
            {error ? (
                <ReportEmpty
                    icon={CalendarRange}
                    message="Impossible de charger la comparaison."
                />
            ) : isLoading ? (
                <Skeleton className="h-72 w-full" />
            ) : !hasData ? (
                <ReportEmpty
                    icon={CalendarRange}
                    message="Aucune transaction sur les deux périodes choisies."
                />
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid {...chartGrid} />
                        <XAxis
                            dataKey="offset"
                            tick={chartAxisTick}
                            axisLine={chartAxisLine}
                            tickLine={false}
                            label={{
                                value: granularityAxisLabel(granularity),
                                position: "insideBottom",
                                offset: -2,
                                style: chartAxisTick,
                            }}
                        />
                        <YAxis
                            tick={chartAxisTick}
                            axisLine={chartAxisLine}
                            tickLine={false}
                            tickFormatter={compactNumber}
                        />
                        <Tooltip
                            contentStyle={chartTooltipStyle}
                            labelStyle={chartTooltipLabelStyle}
                            itemStyle={chartTooltipItemStyle}
                            formatter={(v) =>
                                formatCurrency(Number(v))
                            }
                            labelFormatter={(offset, payload) => {
                                const p = payload?.[0]?.payload as
                                    | { labelA?: string; labelB?: string }
                                    | undefined;
                                return `${granularityAxisLabel(granularity)} ${offset} · ${p?.labelA || "—"} vs ${p?.labelB || "—"}`;
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                            type="monotone"
                            dataKey="revenueA"
                            name={`Revenus · ${ranges.current.label}`}
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                        />
                        <Line
                            type="monotone"
                            dataKey="revenueB"
                            name={`Revenus · ${ranges.previous.label}`}
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            opacity={0.5}
                            connectNulls
                        />
                        <Line
                            type="monotone"
                            dataKey="expenseA"
                            name={`Dépenses · ${ranges.current.label}`}
                            stroke="var(--chart-3)"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                        />
                        <Line
                            type="monotone"
                            dataKey="expenseB"
                            name={`Dépenses · ${ranges.previous.label}`}
                            stroke="var(--chart-3)"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            opacity={0.5}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </ReportSection>
    );
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function ComparisonControls({
    mode,
    onModeChange,
    ranges,
    onRangesChange,
}: {
    mode: Mode;
    onModeChange: (m: Mode) => void;
    ranges: { current: Range; previous: Range };
    onRangesChange: (r: { current: Range; previous: Range }) => void;
}) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Select value={mode} onValueChange={(v) => onModeChange(v as Mode)}>
                <SelectTrigger className="w-44 h-9" aria-label="Type de comparaison">
                    <SelectValue placeholder="Comparer" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="year">Année courante / précédente</SelectItem>
                    <SelectItem value="month">Mois courant / précédent</SelectItem>
                    <SelectItem value="week">Semaine courante / précédente</SelectItem>
                    <SelectItem value="custom">Périodes personnalisées</SelectItem>
                </SelectContent>
            </Select>

            {mode === "custom" && (
                <CustomRangePopover
                    ranges={ranges}
                    onChange={onRangesChange}
                />
            )}
        </div>
    );
}

function CustomRangePopover({
    ranges,
    onChange,
}: {
    ranges: { current: Range; previous: Range };
    onChange: (r: { current: Range; previous: Range }) => void;
}) {
    const [open, setOpen] = useState(false);
    const [a, setA] = useState(ranges.current);
    const [b, setB] = useState(ranges.previous);

    const apply = () => {
        if (!a.from || !a.to || a.from > a.to) return;
        if (!b.from || !b.to || b.from > b.to) return;
        onChange({
            current: { ...a, label: a.label.trim() || "Période A" },
            previous: { ...b, label: b.label.trim() || "Période B" },
        });
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9">
                    <CalendarRange className="h-3.5 w-3.5" />
                    <span className="text-xs truncate max-w-[260px]">
                        {ranges.current.label} · {ranges.previous.label}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4 space-y-4" align="end">
                <RangeEditor
                    title="Période A (en cours)"
                    range={a}
                    onChange={setA}
                />
                <RangeEditor
                    title="Période B (référence)"
                    range={b}
                    onChange={setB}
                />
                <Button
                    size="sm"
                    onClick={apply}
                    disabled={
                        !a.from ||
                        !a.to ||
                        a.from > a.to ||
                        !b.from ||
                        !b.to ||
                        b.from > b.to
                    }
                    className="w-full h-8 text-xs"
                >
                    Appliquer la comparaison
                </Button>
            </PopoverContent>
        </Popover>
    );
}

function RangeEditor({
    title,
    range,
    onChange,
}: {
    title: string;
    range: Range;
    onChange: (r: Range) => void;
}) {
    const days = daysBetween(range.from, range.to);
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{title}</Label>
                {range.from && range.to && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                        {days} j
                    </span>
                )}
            </div>
            <Input
                value={range.label}
                onChange={(e) => onChange({ ...range, label: e.target.value })}
                placeholder="Étiquette (ex : T1 2026)"
                className="h-8 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] text-muted-foreground">Du</Label>
                    <Input
                        type="date"
                        value={range.from}
                        onChange={(e) => onChange({ ...range, from: e.target.value })}
                        max={range.to}
                        className="h-8 text-xs"
                    />
                </div>
                <div>
                    <Label className="text-[10px] text-muted-foreground">Au</Label>
                    <Input
                        type="date"
                        value={range.to}
                        onChange={(e) => onChange({ ...range, to: e.target.value })}
                        min={range.from}
                        className="h-8 text-xs"
                    />
                </div>
            </div>
        </div>
    );
}

function DeltaKpi({
    label,
    valueA,
    valueB,
    labelA,
    labelB,
    formatValue,
    invertTrend = false,
    isLoading,
}: {
    label: string;
    valueA: number;
    valueB: number;
    labelA: string;
    labelB: string;
    formatValue: (v: number) => string;
    /**
     * Pour les KPIs "négatifs" (dépenses) : une hausse est défavorable.
     * Inverse la couleur du trend.
     */
    invertTrend?: boolean;
    isLoading?: boolean;
}) {
    const variation = pct(valueA, valueB);
    const isUp = variation !== null && variation > 0;
    const isDown = variation !== null && variation < 0;
    const isFavorable = invertTrend ? isDown : isUp;
    const isUnfavorable = invertTrend ? isUp : isDown;

    return (
        <div className="border rounded-md p-3 bg-muted/20">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {label}
            </p>
            {isLoading ? (
                <Skeleton className="h-7 w-32 mt-2" />
            ) : (
                <p className="text-xl font-bold mt-1.5 tabular-nums">
                    {formatValue(valueA)}
                </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {labelA}
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className="text-[10px] text-muted-foreground truncate">
                    vs {labelB} : {isLoading ? "…" : formatValue(valueB)}
                </span>
                {!isLoading && (
                    <span
                        className={cn(
                            "inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums",
                            variation === null
                                ? "text-muted-foreground"
                                : isFavorable
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : isUnfavorable
                                    ? "text-rose-700 dark:text-rose-400"
                                    : "text-muted-foreground",
                        )}
                    >
                        {variation === null ? (
                            "—"
                        ) : (
                            <>
                                {isUp && <TrendingUp className="h-3 w-3" />}
                                {isDown && <TrendingDown className="h-3 w-3" />}
                                {variation === 0 && "—"}
                                {variation !== 0 &&
                                    `${variation > 0 ? "+" : ""}${variation.toFixed(1)} %`}
                            </>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Helpers d'axe ──────────────────────────────────────────────────────────

function granularityAxisLabel(g: ServicesAnalyticsGranularity): string {
    switch (g) {
        case "month":
            return "Mois";
        case "week":
            return "Semaine";
        case "day":
        default:
            return "Jour";
    }
}

function formatPeriodTick(
    iso: string,
    granularity: ServicesAnalyticsGranularity,
): string {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return iso;
    if (granularity === "month") {
        return d.toLocaleDateString("fr-FR", {
            month: "short",
            year: "2-digit",
        });
    }
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
