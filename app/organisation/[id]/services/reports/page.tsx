"use client";

import { PermissionGuard } from "@/components/permissions";
import { PeriodComparison } from "@/components/reports/PeriodComparison";
import {
    PeriodFilter,
    defaultPeriod,
    type Period,
} from "@/components/reports/PeriodFilter";
import {
    ReportEmpty,
    ReportSection,
} from "@/components/reports/ReportPrimitives";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useServicesAnalyticsSummary } from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type { ServicesAnalyticsGranularity } from "@/lib/types";
import {
    AlertTriangle,
    BarChart3,
    DollarSign,
    HelpCircle,
    Info,
    PieChart as PieChartIcon,
    TrendingDown,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const GRANULARITY_OPTIONS: {
    value: ServicesAnalyticsGranularity;
    label: string;
}[] = [
    { value: "day", label: "Jour" },
    { value: "week", label: "Semaine" },
    { value: "month", label: "Mois" },
];

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminée",
    suspended: "Suspendue",
    cancelled: "Annulée",
};

const ENROLLMENT_STATUS_COLORS: Record<string, string> = {
    pending: "#94a3b8", // slate-400
    in_progress: "#f59e0b", // amber-500
    completed: "#10b981", // emerald-500
    suspended: "#6366f1", // indigo-500
    cancelled: "#ef4444", // red-500
};

const MODULE_STATUS_LABELS: Record<string, string> = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminé",
    blocked: "Bloqué",
    skipped: "Ignoré",
};

const MODULE_STATUS_COLORS: Record<string, string> = {
    pending: "#94a3b8",
    in_progress: "#f59e0b",
    completed: "#10b981",
    blocked: "#ef4444",
    skipped: "#a78bfa",
};

function formatChartDate(
    iso: string,
    granularity: ServicesAnalyticsGranularity
): string {
    const d = new Date(iso);
    if (granularity === "month") {
        return d.toLocaleDateString("fr-FR", {
            month: "short",
            year: "2-digit",
        });
    }
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/** Phrase humaine décrivant la période active. */
function formatPeriodSentence(period: Period): string {
    const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    return `${fmt(period.from)} → ${fmt(period.to)}`;
}

/**
 * Bulle d'aide affichée à côté d'un libellé technique.
 * Au survol, affiche une définition courte et accessible.
 */
function InfoHint({ children }: { children: React.ReactNode }) {
    return (
        <UITooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors"
                    aria-label="Définition"
                >
                    <Info className="h-3 w-3" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-[11px] leading-relaxed">
                {children}
            </TooltipContent>
        </UITooltip>
    );
}

/**
 * Carte KPI enrichie d'un tooltip explicatif. Suit le même design que
 * `KPICard` mais expose le label en `ReactNode` pour intégrer une
 * `InfoHint` à côté.
 */
function ExplainedKpi({
    label,
    explanation,
    value,
    sublabel,
    icon,
    accentColor = "primary",
}: {
    label: string;
    explanation: React.ReactNode;
    value: string;
    sublabel?: string;
    icon: React.ReactNode;
    accentColor?: "primary" | "emerald" | "amber" | "red";
}) {
    const accents: Record<string, string> = {
        primary: "text-primary bg-primary/10",
        emerald: "text-emerald-700 bg-emerald-100",
        amber: "text-amber-700 bg-amber-100",
        red: "text-red-700 bg-red-100",
    };
    return (
        <div className="border bg-card rounded-md p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                            {label}
                        </p>
                        <InfoHint>{explanation}</InfoHint>
                    </div>
                    <p className="text-2xl font-bold mt-1 truncate tabular-nums">
                        {value}
                    </p>
                    {sublabel && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                            {sublabel}
                        </p>
                    )}
                </div>
                <div
                    className={`h-10 w-10 flex items-center justify-center rounded-md shrink-0 ${accents[accentColor]}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

export default function ServicesReportsPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SERVICE_REPORTS.VIEW}>
            <ServicesReportsPage />
        </PermissionGuard>
    );
}

function ServicesReportsPage() {
    const params = useParams();
    const orgId = params.id as string;
    const { formatCurrency } = useCurrencyFormatter();

    const [period, setPeriod] = useState<Period>(defaultPeriod());
    const [granularity, setGranularity] =
        useState<ServicesAnalyticsGranularity>("day");

    const summary = useServicesAnalyticsSummary(orgId, {
        from: period.from,
        to: period.to,
        granularity,
    });

    const data = summary.data;

    const trendData = useMemo(
        () =>
            (data?.transactions_trend ?? []).map((p) => ({
                period: formatChartDate(p.period, granularity),
                revenue: Number(p.revenue),
                expense: Number(p.expense),
                net: Number(p.revenue) - Number(p.expense),
            })),
        [data, granularity]
    );

    const enrollmentPie = useMemo(() => {
        const map = (data?.enrollments_by_status ?? {}) as Record<
            string,
            number
        >;
        return Object.entries(map)
            .filter(([, v]) => Number(v) > 0)
            .map(([k, v]) => ({
                name: ENROLLMENT_STATUS_LABELS[k] || k,
                value: Number(v),
                color: ENROLLMENT_STATUS_COLORS[k] || "#94a3b8",
            }));
    }, [data]);

    const modulePie = useMemo(() => {
        const map = (data?.modules_by_status ?? {}) as Record<
            string,
            number
        >;
        return Object.entries(map)
            .filter(([, v]) => Number(v) > 0)
            .map(([k, v]) => ({
                name: MODULE_STATUS_LABELS[k] || k,
                value: Number(v),
                color: MODULE_STATUS_COLORS[k] || "#94a3b8",
            }));
    }, [data]);

    const topServices = useMemo(
        () =>
            (data?.top_services ?? []).map((s) => ({
                name:
                    s.service_name.length > 20
                        ? `${s.service_name.slice(0, 20)}…`
                        : s.service_name,
                fullName: s.service_name,
                revenue: Number(s.revenue),
                payments: s.payments_count,
            })),
        [data]
    );

    return (
        <TooltipProvider delayDuration={250}>
        <div className="container mx-auto p-6 space-y-6">
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 inline-flex items-center justify-center bg-primary/10 text-primary">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">
                            Rapports Services
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Suivez ce que vous gagnez, ce que vous dépensez,
                            et où en sont vos clients.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Select
                        value={granularity}
                        onValueChange={(v) =>
                            setGranularity(v as ServicesAnalyticsGranularity)
                        }
                    >
                        <SelectTrigger
                            className="w-40 h-9"
                            aria-label="Vue par"
                        >
                            <SelectValue placeholder="Vue par" />
                        </SelectTrigger>
                        <SelectContent>
                            {GRANULARITY_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    Vue par {o.label.toLowerCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <PeriodFilter value={period} onChange={setPeriod} />
                </div>
            </div>

            {/* ── Bandeau résumé contextuel : aide à comprendre quoi regarder ── */}
            <div className="flex items-start gap-3 px-4 py-3 bg-muted/40 border rounded-md">
                <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <HelpCircle className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0 text-xs leading-relaxed text-muted-foreground">
                    <p>
                        Cette page résume votre activité du{" "}
                        <span className="font-medium text-foreground">
                            {formatPeriodSentence(period)}
                        </span>
                        . Chaque indicateur affiche une{" "}
                        <Info className="inline h-3 w-3 align-text-bottom" />
                        {" "}au survol pour vous expliquer son calcul. Modifiez la période
                        ou la vue (jour / semaine / mois) en haut à droite.
                    </p>
                </div>
            </div>

            {summary.isLoading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-28" />
                        ))}
                    </div>
                    <Skeleton className="h-72" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Skeleton className="h-72" />
                        <Skeleton className="h-72" />
                    </div>
                </div>
            ) : summary.error || !data ? (
                <ReportEmpty
                    icon={AlertTriangle}
                    message="Impossible de charger les rapports."
                />
            ) : (
                <>
                    {/* ── KPI cards (chacune avec une définition au survol) ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <ExplainedKpi
                            label="Argent encaissé"
                            explanation={
                                <>
                                    <span className="font-semibold text-foreground">
                                        Total des paiements clients
                                    </span>{" "}
                                    réellement reçus sur la période.
                                    N&apos;inclut pas les factures émises mais
                                    pas encore payées.
                                </>
                            }
                            value={formatCurrency(Number(data.kpis.revenue))}
                            sublabel={`${data.kpis.completed_enrollments} dossier${data.kpis.completed_enrollments > 1 ? "s" : ""} terminé${data.kpis.completed_enrollments > 1 ? "s" : ""}`}
                            icon={<TrendingUp className="h-5 w-5" />}
                            accentColor="emerald"
                        />
                        <ExplainedKpi
                            label="Argent sorti"
                            explanation={
                                <>
                                    <span className="font-semibold text-foreground">
                                        Total des sorties d&apos;argent
                                    </span>{" "}
                                    sur la période : dépenses internes (achats,
                                    matériel…) + remboursements versés à des clients.
                                </>
                            }
                            value={formatCurrency(Number(data.kpis.expense))}
                            sublabel={(() => {
                                const internal = Number(
                                    data.kpis.internal_expense
                                );
                                const refunds = Number(data.kpis.refunds);
                                const parts: string[] = [];
                                if (internal > 0) {
                                    parts.push(
                                        `${formatCurrency(internal)} interne`
                                    );
                                }
                                if (refunds > 0) {
                                    parts.push(
                                        `${formatCurrency(refunds)} remboursé`
                                    );
                                }
                                return parts.length > 0
                                    ? parts.join(" · ")
                                    : "Aucune sortie sur la période";
                            })()}
                            icon={<TrendingDown className="h-5 w-5" />}
                            accentColor="red"
                        />
                        <ExplainedKpi
                            label="Bénéfice"
                            explanation={
                                <>
                                    <span className="font-semibold text-foreground">
                                        Argent encaissé − argent sorti.
                                    </span>{" "}
                                    Une valeur positive signifie que vous
                                    avez gagné plus que dépensé sur la période.
                                </>
                            }
                            value={formatCurrency(Number(data.kpis.net))}
                            sublabel={
                                Number(data.kpis.net) >= 0
                                    ? "Vous êtes en positif"
                                    : "Vous êtes en négatif"
                            }
                            icon={<DollarSign className="h-5 w-5" />}
                            accentColor={
                                Number(data.kpis.net) >= 0
                                    ? "emerald"
                                    : "red"
                            }
                        />
                        <ExplainedKpi
                            label="Reste à encaisser"
                            explanation={
                                <>
                                    <span className="font-semibold text-foreground">
                                        Argent que vos clients vous doivent
                                    </span>{" "}
                                    pour des prestations en cours ou en
                                    attente — somme des factures non encore
                                    réglées.
                                </>
                            }
                            value={formatCurrency(
                                Number(data.kpis.outstanding)
                            )}
                            sublabel={`${data.kpis.in_progress_enrollments} dossier${data.kpis.in_progress_enrollments > 1 ? "s" : ""} en cours`}
                            icon={<Wallet className="h-5 w-5" />}
                            accentColor="amber"
                        />
                    </div>

                    {/* ── Tendance recettes / dépenses ─────────────────── */}
                    <ReportSection
                        title="Évolution dans le temps"
                        description="Comment vos rentrées et sorties d'argent évoluent au fil des jours, semaines ou mois. La courbe pointillée bleue correspond à votre bénéfice (rentrées − sorties)."
                    >
                        {trendData.length === 0 ? (
                            <ReportEmpty
                                icon={BarChart3}
                                message="Aucune transaction validée sur cette période. Validez vos paiements en attente pour voir l'évolution apparaître ici."
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart
                                    data={trendData}
                                    margin={{
                                        top: 10,
                                        right: 16,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e5e7eb"
                                    />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) =>
                                            new Intl.NumberFormat("fr-FR", {
                                                notation: "compact",
                                            }).format(v)
                                        }
                                    />
                                    <Tooltip
                                        formatter={(value) =>
                                            formatCurrency(Number(value))
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Argent encaissé"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expense"
                                        name="Argent sorti"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="net"
                                        name="Bénéfice"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </ReportSection>

                    {/* ── Comparaison de périodes (an / mois / semaine / custom) ── */}
                    <PeriodComparison orgId={orgId} />

                    {/* ── Top services + Statuts inscriptions ─────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ReportSection
                            title="Vos services qui rapportent le plus"
                            description="Classement de vos services selon l'argent réellement encaissé sur la période."
                        >
                            {topServices.length === 0 ? (
                                <ReportEmpty
                                    icon={BarChart3}
                                    message="Aucun encaissement par service sur la période."
                                />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={topServices}
                                        layout="vertical"
                                        margin={{
                                            top: 5,
                                            right: 16,
                                            left: 8,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e5e7eb"
                                        />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 11 }}
                                            tickFormatter={(v) =>
                                                new Intl.NumberFormat("fr-FR", {
                                                    notation: "compact",
                                                }).format(v)
                                            }
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fontSize: 11 }}
                                            width={140}
                                        />
                                        <Tooltip
                                            formatter={(value) =>
                                                formatCurrency(Number(value))
                                            }
                                            labelFormatter={(_, payload) =>
                                                payload?.[0]?.payload
                                                    ?.fullName ?? ""
                                            }
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            name="Encaissé"
                                            fill="#10b981"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ReportSection>

                        <ReportSection
                            title="État de vos dossiers clients"
                            description="Combien de dossiers sont en attente, en cours, terminés ou annulés. Un dossier = une inscription d'un client à un service."
                            actions={<PieChartIcon className="h-4 w-4 text-muted-foreground" />}
                        >
                            {enrollmentPie.length === 0 ? (
                                <ReportEmpty
                                    icon={Users}
                                    message="Aucune inscription dans cette organisation."
                                />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Pie
                                            data={enrollmentPie}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            label={({ value }) =>
                                                `${value ?? ""}`
                                            }
                                        >
                                            {enrollmentPie.map((entry, idx) => (
                                                <Cell
                                                    key={idx}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ReportSection>
                    </div>

                    {/* ── Statuts modules ─────────────────────────────── */}
                    <ReportSection
                        title="Avancement des étapes"
                        description="Une étape = une phase à réaliser dans le dossier d'un client (rendez-vous, livraison, document à fournir…). Vous voyez ici combien d'étapes sont encore à faire, en cours ou terminées."
                    >
                        {modulePie.length === 0 ? (
                            <ReportEmpty
                                icon={PieChartIcon}
                                message="Aucune étape dans cette organisation."
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Tooltip />
                                        <Pie
                                            data={modulePie}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, value }) =>
                                                `${name ?? ""} (${value ?? 0})`
                                            }
                                        >
                                            {modulePie.map((entry, idx) => (
                                                <Cell
                                                    key={idx}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <ul className="space-y-2 text-sm">
                                    {modulePie.map((m) => (
                                        <li
                                            key={m.name}
                                            className="flex items-center justify-between border p-2"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 inline-block"
                                                    style={{
                                                        backgroundColor:
                                                            m.color,
                                                    }}
                                                />
                                                {m.name}
                                            </span>
                                            <span className="font-semibold tabular-nums">
                                                {m.value}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </ReportSection>
                </>
            )}
        </div>
        </TooltipProvider>
    );
}
