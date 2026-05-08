"use client";

/**
 * Hub des outils rapides du dashboard — version sobre.
 *
 * Grille minimaliste : icône + label + une seule ligne d'aperçu.
 * Inspiration Linear / Vercel : peu de chrome, hover discret, pas
 * de cards lourdes. Pensée pour grossir : ajouter un outil = une
 * entrée dans ``TOOLS``.
 */

import { ArrowLeft, ArrowUpRight, FileText, Sparkles } from "lucide-react";
import Link from "next/link";

interface QuickTool {
    href: string;
    title: string;
    /** Une seule ligne courte. */
    hint: string;
    icon: typeof FileText;
    available: boolean;
}

const TOOLS: QuickTool[] = [
    {
        href: "/core/dashboard/tools/quick-invoice",
        title: "Facture rapide",
        hint: "Document ad-hoc avec drag-and-drop",
        icon: FileText,
        available: true,
    },
];

export default function ToolsHubPage() {
    return (
        <div className="container mx-auto px-6 py-10 max-w-4xl">
            <Link
                href="/core/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
            </Link>

            <header className="mb-10">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    <Sparkles className="h-3 w-3" />
                    Outils
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Boîte à outils
                </h1>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/60 border border-border/60">
                {TOOLS.map((tool) => (
                    <ToolTile key={tool.href} tool={tool} />
                ))}
                {/* Slots vides pour conserver la grille propre quand
                    il y a peu d'outils. Retirer quand 6+ outils. */}
                {TOOLS.length < 3 &&
                    Array.from({ length: 3 - TOOLS.length }).map((_, i) => (
                        <div
                            key={`ghost-${i}`}
                            className="bg-background min-h-[120px]"
                            aria-hidden
                        />
                    ))}
            </div>
        </div>
    );
}

function ToolTile({ tool }: { tool: QuickTool }) {
    const Icon = tool.icon;
    const content = (
        <div
            className={`group relative bg-background h-full px-5 py-5 flex flex-col gap-3 transition-colors ${
                tool.available
                    ? "hover:bg-muted/40 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
            }`}
        >
            <div className="flex items-start justify-between">
                <Icon
                    className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors"
                    strokeWidth={1.75}
                />
                {tool.available && (
                    <ArrowUpRight
                        className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors"
                        strokeWidth={1.75}
                    />
                )}
            </div>
            <div>
                <p className="text-sm font-medium">{tool.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {tool.hint}
                </p>
            </div>
        </div>
    );

    return tool.available ? <Link href={tool.href}>{content}</Link> : content;
}
