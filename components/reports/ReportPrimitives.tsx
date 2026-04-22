"use client";

/**
 * Primitives BI sobres, réutilisables dans toutes les pages de rapports.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KPICardProps {
    label: string;
    value: string | number;
    sublabel?: string;
    trend?: {
        value: number; // % variation
        positive?: boolean;
    };
    icon?: ReactNode;
    accentColor?: "primary" | "emerald" | "amber" | "blue" | "purple" | "red";
}

const ACCENTS: Record<NonNullable<KPICardProps["accentColor"]>, string> = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-700 bg-emerald-100",
    amber: "text-amber-700 bg-amber-100",
    blue: "text-blue-700 bg-blue-100",
    purple: "text-purple-700 bg-purple-100",
    red: "text-red-700 bg-red-100",
};

export function KPICard({
    label,
    value,
    sublabel,
    trend,
    icon,
    accentColor = "primary",
}: KPICardProps) {
    return (
        <Card>
            <CardContent className="pt-6 pb-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                            {label}
                        </p>
                        <p className="text-2xl font-bold mt-1 truncate">{value}</p>
                        {sublabel && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                {sublabel}
                            </p>
                        )}
                        {trend && (
                            <div
                                className={cn(
                                    "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                                    trend.positive ?? trend.value >= 0
                                        ? "text-emerald-700"
                                        : "text-red-700"
                                )}
                            >
                                {(trend.positive ?? trend.value >= 0) ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                {Math.abs(trend.value).toFixed(1)}%
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div
                            className={cn(
                                "h-10 w-10 flex items-center justify-center rounded-md shrink-0",
                                ACCENTS[accentColor]
                            )}
                        >
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Report Section ──────────────────────────────────────────────────────────

interface ReportSectionProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function ReportSection({
    title,
    description,
    actions,
    children,
    className,
}: ReportSectionProps) {
    return (
        <Card className={className}>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {description}
                        </p>
                    )}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

interface CsvExportButtonProps {
    filename: string;
    rows: Record<string, unknown>[];
    headers?: { key: string; label: string }[];
    disabled?: boolean;
}

function toCsv(rows: Record<string, unknown>[], headers?: { key: string; label: string }[]): string {
    if (rows.length === 0) return "";
    const keys = headers ? headers.map((h) => h.key) : Object.keys(rows[0]);
    const labels = headers ? headers.map((h) => h.label) : keys;
    const escape = (v: unknown): string => {
        if (v === null || v === undefined) return "";
        const s = String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    const lines = [
        labels.map(escape).join(","),
        ...rows.map((row) => keys.map((k) => escape(row[k])).join(",")),
    ];
    return lines.join("\n");
}

export function CsvExportButton({
    filename,
    rows,
    headers,
    disabled,
}: CsvExportButtonProps) {
    const handleExport = () => {
        const csv = toCsv(rows, headers);
        const blob = new Blob(["\ufeff" + csv], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={disabled || rows.length === 0}
            className="gap-1.5 h-8 text-xs"
        >
            <Download className="h-3.5 w-3.5" />
            CSV
        </Button>
    );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

export function ReportEmpty({
    icon: Icon,
    message,
}: {
    icon: React.ComponentType<{ className?: string }>;
    message: string;
}) {
    return (
        <div className="text-center py-10 text-muted-foreground">
            <Icon className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{message}</p>
        </div>
    );
}
