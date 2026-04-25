"use client";

import { AuditFootprint } from "@/components/services/AuditBadge";
import { Card, CardContent } from "@/components/ui/card";
import {
    PageHeader,
    PageHeaderAction,
} from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserMiniInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { ComponentType, ReactNode } from "react";

export interface DetailPageTab {
    value: string;
    label: string;
    icon?: ComponentType<{ className?: string }>;
    badge?: ReactNode;
    content: ReactNode;
}

export interface DetailPageAudit {
    created_at: string;
    updated_at: string;
    created_by_info?: UserMiniInfo | null;
    updated_by_info?: UserMiniInfo | null;
}

interface DetailPageLayoutProps {
    title: string;
    subtitle?: string;
    backLink?: string;
    icon?: ComponentType<{ className?: string }>;
    avatar?: ReactNode;
    badge?: ReactNode;
    actions?: PageHeaderAction[];

    /** Ligne libre sous le header (ex: client · entrepôt · date). */
    headerExtras?: ReactNode;
    /** Bandeaux contextuels (succès, info, erreur) au-dessus du contenu. */
    banners?: ReactNode;
    /** Cards résumé (rendues dans une grid responsive 1/2/4 cols). */
    summaryCards?: ReactNode;
    /** Onglets déclaratifs ; si fourni, prend le pas sur `children`. */
    tabs?: DetailPageTab[];
    /** Onglet actif par défaut (sinon le premier). */
    defaultTab?: string;
    /** Empreinte d'audit affichée en pied de page. */
    audit?: DetailPageAudit;
    /** Slot pour Dialog/AlertDialog rendus en dehors du flux. */
    dialogs?: ReactNode;

    /** Skeleton intégré. */
    isLoading?: boolean;
    /** Carte d'erreur intégrée. */
    error?: { message: string } | string | null;

    containerClassName?: string;
    children?: ReactNode;
}

export function DetailPageLayout({
    title,
    subtitle,
    backLink,
    icon,
    avatar,
    badge,
    actions = [],
    headerExtras,
    banners,
    summaryCards,
    tabs,
    defaultTab,
    audit,
    dialogs,
    isLoading,
    error,
    containerClassName,
    children,
}: DetailPageLayoutProps) {
    if (error) {
        const message =
            typeof error === "string" ? error : error.message;
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">Erreur : {message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    const activeTab = defaultTab ?? tabs?.[0]?.value;

    return (
        <>
            <div
                className={cn(
                    "container mx-auto p-6 space-y-6",
                    containerClassName
                )}
            >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {avatar && <div className="shrink-0">{avatar}</div>}
                    <div className="flex-1 min-w-0 space-y-2">
                        <PageHeader
                            title={title}
                            subtitle={subtitle}
                            backLink={backLink}
                            icon={icon}
                            badge={badge}
                            actions={actions}
                            className="space-y-2"
                        />
                        {headerExtras && (
                            <div className="text-sm text-muted-foreground">
                                {headerExtras}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bandeaux contextuels */}
                {banners}

                {/* Cards résumé */}
                {summaryCards && (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        {summaryCards}
                    </div>
                )}

                {/* Tabs OU children (rétrocompat) */}
                {tabs && tabs.length > 0 ? (
                    <Tabs defaultValue={activeTab} className="space-y-4">
                        <TabsList>
                            {tabs.map((t) => {
                                const Icon = t.icon;
                                return (
                                    <TabsTrigger key={t.value} value={t.value}>
                                        <span className="flex items-center gap-2">
                                            {Icon && (
                                                <Icon className="h-3 w-3" />
                                            )}
                                            {t.label}
                                            {t.badge}
                                        </span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                        {tabs.map((t) => (
                            <TabsContent key={t.value} value={t.value}>
                                {t.content}
                            </TabsContent>
                        ))}
                    </Tabs>
                ) : (
                    <div className="grid gap-6">{children}</div>
                )}

                {/* Audit footer */}
                {audit && (
                    <AuditFootprint
                        created_at={audit.created_at}
                        updated_at={audit.updated_at}
                        created_by_info={audit.created_by_info ?? null}
                        updated_by_info={audit.updated_by_info ?? null}
                        className="pt-2"
                    />
                )}
            </div>

            {/* Dialogs en dehors du container */}
            {dialogs}
        </>
    );
}
