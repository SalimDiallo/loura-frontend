"use client";

import { PermissionGuard } from "@/components/permissions";
import {
    PeriodFilter,
    defaultPeriod,
    type Period,
} from "@/components/reports/PeriodFilter";
import {
    KPICard,
    ReportEmpty,
    ReportSection,
} from "@/components/reports/ReportPrimitives";
import {
    QuickSelect,
    type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useServicesAnalyticsSummary } from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type { ServicesAnalyticsGranularity } from "@/lib/types";
import {
    AlertTriangle,
    BarChart3,
    DollarSign,
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

const GRANULARITY_ITEMS: QuickSelectItem[] = [
    { id: "day", name: "Jour" },
    { id: "week", name: "Semaine" },
    { id: "month", name: "Mois" },
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
                            Analyse de l&apos;activité, des encaissements et des
                            dépenses du module Services.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-40">
                        <QuickSelect
                            label="Granularité"
                            items={GRANULARITY_ITEMS}
                            selectedId={granularity}
                            onSelect={(id) =>
                                setGranularity(
                                    (id as ServicesAnalyticsGranularity) ||
                                        "day"
                                )
                            }
                            placeholder="Granularité"
                            canCreate={false}
                        />
                    </div>
                    <PeriodFilter value={period} onChange={setPeriod} />
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
                    {/* ── KPI cards ─────────────────────────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            label="Encaissements"
                            value={formatCurrency(Number(data.kpis.revenue))}
                            sublabel={`${data.kpis.completed_enrollments} dossier(s) terminé(s)`}
                            icon={<TrendingUp className="h-5 w-5" />}
                            accentColor="emerald"
                        />
                        <KPICard
                            label="Dépenses"
                            value={formatCurrency(Number(data.kpis.expense))}
                            sublabel={(() => {
                                // Détail des composantes : dépenses internes
                                // + remboursements clients (= total).
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
                        <KPICard
                            label="Marge nette"
                            value={formatCurrency(Number(data.kpis.net))}
                            sublabel="Recettes − dépenses sur la période"
                            icon={<DollarSign className="h-5 w-5" />}
                            accentColor={
                                Number(data.kpis.net) >= 0
                                    ? "emerald"
                                    : "red"
                            }
                        />
                        <KPICard
                            label="Encours clients"
                            value={formatCurrency(
                                Number(data.kpis.outstanding)
                            )}
                            sublabel={`${data.kpis.in_progress_enrollments} dossier(s) en cours`}
                            icon={<Wallet className="h-5 w-5" />}
                            accentColor="amber"
                        />
                    </div>

                    {/* ── Tendance recettes / dépenses ─────────────────── */}
                    <ReportSection
                        title="Tendance financière"
                        description="Encaissements vs dépenses agrégés par période."
                    >
                        {trendData.length === 0 ? (
                            <ReportEmpty
                                icon={BarChart3}
                                message="Aucune transaction confirmée sur la période."
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
                                        name="Encaissements"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expense"
                                        name="Dépenses"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="net"
                                        name="Marge nette"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </ReportSection>

                    {/* ── Top services + Statuts inscriptions ─────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ReportSection
                            title="Top services"
                            description="Classement par chiffre d'affaires encaissé."
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
                            title="Répartition des dossiers"
                            description="Inscriptions clients groupées par statut courant."
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
                        description="Distribution globale des modules clients par statut."
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
    );
}
