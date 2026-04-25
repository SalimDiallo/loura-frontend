"use client";

import { PermissionGuard } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import {
    useAssignments,
    useDepartmentTree,
    useMembers,
    usePositions,
} from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    DepartmentTree,
    Membership,
    PositionAssignment,
    Position as PositionType,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaBriefcase,
    FaChevronDown,
    FaChevronRight,
    FaCrown,
    FaNetworkWired,
    FaSearch,
    FaSitemap,
    FaUsers,
    FaUserSlash,
} from "react-icons/fa";

export default function OrganigramPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.HR.VIEW_EMPLOYEES}>
            <OrganigramPage />
        </PermissionGuard>
    );
}


function OrganigramPage() {
    const params = useParams();
    const orgId = params.id as string;

    const { data: treeData, isLoading: loadingTree } = useDepartmentTree(orgId);
    const tree = useMemo<DepartmentTree[]>(
        () => toArray<DepartmentTree>(treeData),
        [treeData]
    );
    const { data: positionsList } = usePositions(orgId, {
        page_size: "all",
    });
    const { data: assignmentsList } = useAssignments(orgId, {
        is_active: true,
        page_size: "all",
    });
    const { data: membersList } = useMembers(orgId, {
        is_active: true,
        page_size: "all" as any,
    });

    const positions = useMemo<PositionType[]>(
        () => toArray<PositionType>(positionsList),
        [positionsList]
    );
    const assignments = useMemo<PositionAssignment[]>(
        () => toArray<PositionAssignment>(assignmentsList),
        [assignmentsList]
    );
    const members = useMemo<Membership[]>(
        () => toArray<Membership>(membersList),
        [membersList]
    );

    // Membres actifs sans aucune position assignment active
    const unassignedMembers = useMemo<Membership[]>(() => {
        const assigned = new Set(assignments.map((a) => a.membership?.id));
        return members.filter((m) => m.is_active && !assigned.has(m.id));
    }, [members, assignments]);

    const [search, setSearch] = useState("");
    const [zoom, setZoom] = useState(1);

    // Index positions par département
    const positionsByDept = useMemo(() => {
        const map: Record<string, PositionType[]> = {};
        for (const p of positions) {
            const key = p.department?.id ?? "_orphan";
            (map[key] ??= []).push(p);
        }
        return map;
    }, [positions]);

    // Index assignations par position
    const assignmentsByPosition = useMemo(() => {
        const map: Record<string, PositionAssignment[]> = {};
        for (const a of assignments) {
            const key = a.position?.id;
            if (!key) continue;
            (map[key] ??= []).push(a);
        }
        return map;
    }, [assignments]);

    // Stats globales
    const stats = useMemo(() => {
        const countDepts = (nodes: DepartmentTree[]): number =>
            nodes.reduce(
                (s, n) => s + 1 + (n.children?.length ? countDepts(n.children) : 0),
                0
            );
        return {
            depts: countDepts(tree),
            positions: positions.length,
            members: assignments.length,
        };
    }, [tree, positions, assignments]);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <PageHeader
                title="Organigramme"
                subtitle="Hiérarchie des départements, postes et membres"
                icon={FaSitemap}
                backLink={`/organisation/${orgId}/hr/departments`}
            />

            {/* Stats + recherche */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard
                    icon={FaNetworkWired}
                    label="Départements"
                    value={stats.depts}
                />
                <StatCard
                    icon={FaBriefcase}
                    label="Postes"
                    value={stats.positions}
                />
                <StatCard
                    icon={FaUsers}
                    label="Membres assignés"
                    value={stats.members}
                />
                <StatCard
                    icon={FaUserSlash}
                    label="Sans poste"
                    value={unassignedMembers.length}
                />
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <label className="text-xs text-muted-foreground">
                            Rechercher
                        </label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Département, poste, membre..."
                                className="pl-9 h-9"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Zoom */}
            <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-muted-foreground">Zoom</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
                    className="h-7 w-7 p-0"
                >
                    −
                </Button>
                <span className="text-xs font-mono w-10 text-center">
                    {Math.round(zoom * 100)}%
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                    className="h-7 w-7 p-0"
                >
                    +
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(1)}
                    className="h-7 text-xs"
                >
                    Réinitialiser
                </Button>
            </div>

            {/* Organigramme */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-auto bg-muted/10 p-8">
                        {loadingTree ? (
                            <div className="space-y-4">
                                <Skeleton className="h-32 w-80 mx-auto rounded-lg" />
                                <Skeleton className="h-32 w-full rounded-lg" />
                            </div>
                        ) : tree.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div
                                className="origin-top transition-transform duration-200 mx-auto"
                                style={{
                                    transform: `scale(${zoom})`,
                                    width: "fit-content",
                                }}
                            >
                                <div className="flex flex-col items-center gap-12">
                                    {tree.map((root) => (
                                        <DeptNode
                                            key={root.id}
                                            node={root}
                                            depth={0}
                                            search={search.trim().toLowerCase()}
                                            positionsByDept={positionsByDept}
                                            assignmentsByPosition={
                                                assignmentsByPosition
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Membres sans poste */}
            {unassignedMembers.length > 0 && (
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <FaUserSlash className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">
                                Membres sans poste
                            </h3>
                            <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 font-normal"
                            >
                                {unassignedMembers.length}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                                Pas encore rattachés à une fiche de poste
                            </span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {unassignedMembers
                                .filter((m) => {
                                    if (!search.trim()) return true;
                                    const q = search.trim().toLowerCase();
                                    return membershipLabel(m)
                                        .toLowerCase()
                                        .includes(q);
                                })
                                .map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-center gap-2 p-2 rounded-md border bg-muted/20"
                                    >
                                        <div className="w-8 h-8 rounded-full border bg-card flex items-center justify-center text-foreground/70 text-xs font-semibold shrink-0">
                                            {membershipInitials(m)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium truncate">
                                                {membershipLabel(m)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                {m.employee?.user?.email}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ─── Stat card ─────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border bg-muted/40 flex items-center justify-center text-foreground/70">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Empty state ───────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="text-center py-20 text-muted-foreground">
            <FaSitemap className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucun département</p>
            <p className="text-sm mt-1">
                Créez vos premiers départements pour visualiser l'organigramme.
            </p>
        </div>
    );
}

// ─── Department node ───────────────────────────────────────────────────────

function DeptNode({
    node,
    depth,
    search,
    positionsByDept,
    assignmentsByPosition,
}: {
    node: DepartmentTree;
    depth: number;
    search: string;
    positionsByDept: Record<string, PositionType[]>;
    assignmentsByPosition: Record<string, PositionAssignment[]>;
}) {
    const [open, setOpen] = useState(true);
    const positions = positionsByDept[node.id] ?? [];
    const memberCount = positions.reduce(
        (s, p) => s + (assignmentsByPosition[p.id]?.length ?? 0),
        0
    );
    const hasChildren = node.children && node.children.length > 0;

    // Filtrage par recherche : le node passe si lui-même OU un descendant matche
    const matchesSelf = nodeMatches(node, positions, assignmentsByPosition, search);
    const matchesAny =
        !search ||
        matchesSelf ||
        anyChildMatches(node, search, positionsByDept, assignmentsByPosition);
    if (!matchesAny) return null;

    const dim = !!search && !matchesSelf;

    return (
        <div className="flex flex-col items-center">
            {/* Carte département */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "group relative bg-card border rounded-lg hover:border-foreground/30 transition-colors min-w-[280px] max-w-[320px] text-left",
                    depth === 0 && "border-foreground/40",
                    dim && "opacity-50",
                    !node.is_active && "border-dashed"
                )}
            >
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 w-10 h-10 rounded-lg border bg-muted/40 flex items-center justify-center text-foreground/70">
                            <FaNetworkWired className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm leading-tight truncate">
                                    {node.name}
                                </p>
                                {!node.is_active && (
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] px-1 py-0 h-4"
                                    >
                                        Inactif
                                    </Badge>
                                )}
                            </div>
                            {node.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                    {node.description}
                                </p>
                            )}
                        </div>
                        {hasChildren && (
                            <div className="text-muted-foreground shrink-0">
                                {open ? (
                                    <FaChevronDown className="h-3 w-3" />
                                ) : (
                                    <FaChevronRight className="h-3 w-3" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Manager */}
                    {node.manager && (
                        <div className="mt-3 flex items-center gap-2 p-2 rounded-md bg-muted/40 border">
                            <div className="w-7 h-7 rounded-full border bg-card flex items-center justify-center text-foreground/70">
                                <FaCrown className="h-3 w-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold leading-none">
                                    Manager
                                </p>
                                <p className="text-xs font-medium truncate">
                                    {node.manager.first_name}{" "}
                                    {node.manager.last_name}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Stats compactes */}
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <FaBriefcase className="h-3 w-3" />
                            {positions.length} poste
                            {positions.length > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                            <FaUsers className="h-3 w-3" />
                            {memberCount} membre
                            {memberCount > 1 ? "s" : ""}
                        </span>
                    </div>
                </div>

                {/* Liste postes/membres en accordéon */}
                {open && positions.length > 0 && (
                    <div className="border-t bg-muted/30 px-3 py-2 space-y-1.5">
                        {positions.map((pos) => (
                            <PositionRow
                                key={pos.id}
                                position={pos}
                                members={assignmentsByPosition[pos.id] ?? []}
                                search={search}
                            />
                        ))}
                    </div>
                )}
            </button>

            {/* Connecteur + enfants */}
            {open && hasChildren && (
                <>
                    <div className="w-px h-8 bg-border" />
                    <div className="relative flex items-stretch gap-8">
                        {/* Ligne horizontale */}
                        {node.children.length > 1 && (
                            <div className="absolute top-0 left-0 right-0 h-px bg-border" />
                        )}
                        {node.children.map((child) => (
                            <div
                                key={child.id}
                                className="flex flex-col items-center relative"
                            >
                                <div className="w-px h-8 bg-border" />
                                <DeptNode
                                    node={child}
                                    depth={depth + 1}
                                    search={search}
                                    positionsByDept={positionsByDept}
                                    assignmentsByPosition={
                                        assignmentsByPosition
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Position row ──────────────────────────────────────────────────────────

function PositionRow({
    position,
    members,
    search,
}: {
    position: PositionType;
    members: PositionAssignment[];
    search: string;
}) {
    const [expanded, setExpanded] = useState(members.length > 0 && members.length <= 3);

    if (search) {
        const matches =
            position.name.toLowerCase().includes(search) ||
            members.some((m) =>
                memberLabel(m).toLowerCase().includes(search)
            );
        if (!matches) return null;
    }

    return (
        <div className="space-y-1">
            <div
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1.5 py-1 transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((v) => !v);
                }}
            >
                <FaBriefcase className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium truncate flex-1">
                    {position.name}
                </span>
                <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 h-4 font-normal"
                >
                    {position.level_display}
                </Badge>
                <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">
                    {members.length}
                </span>
            </div>

            {expanded && members.length > 0 && (
                <div className="ml-5 space-y-1">
                    {members.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-center gap-2 text-[11px] py-0.5"
                        >
                            <div className="w-5 h-5 rounded-full border bg-muted flex items-center justify-center text-foreground/70 text-[9px] font-semibold shrink-0">
                                {memberInitials(m)}
                            </div>
                            <span className="truncate">{memberLabel(m)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function toArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object" && "results" in (value as any)) {
        const r = (value as any).results;
        return Array.isArray(r) ? (r as T[]) : [];
    }
    return [];
}

function membershipLabel(m: Membership): string {
    const u = m.employee?.user;
    if (!u) return "—";
    return `${u.first_name} ${u.last_name}`.trim() || u.email;
}

function membershipInitials(m: Membership): string {
    const u = m.employee?.user;
    if (!u) return "?";
    return (
        `${(u.first_name ?? "")[0] ?? ""}${(u.last_name ?? "")[0] ?? ""}`
            .toUpperCase() ||
        (u.email?.[0] ?? "?").toUpperCase()
    );
}

function memberLabel(a: PositionAssignment): string {
    const u = a.membership?.employee?.user;
    if (!u) return "—";
    return `${u.first_name} ${u.last_name}`.trim() || u.email;
}

function memberInitials(a: PositionAssignment): string {
    const u = a.membership?.employee?.user;
    if (!u) return "?";
    return `${(u.first_name ?? "")[0] ?? ""}${(u.last_name ?? "")[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase();
}

function nodeMatches(
    node: DepartmentTree,
    positions: PositionType[],
    assignmentsByPosition: Record<string, PositionAssignment[]>,
    search: string
): boolean {
    if (!search) return true;
    if (node.name.toLowerCase().includes(search)) return true;
    if (
        node.manager &&
        `${node.manager.first_name} ${node.manager.last_name}`
            .toLowerCase()
            .includes(search)
    )
        return true;
    for (const p of positions) {
        if (p.name.toLowerCase().includes(search)) return true;
        const members = assignmentsByPosition[p.id] ?? [];
        if (members.some((m) => memberLabel(m).toLowerCase().includes(search)))
            return true;
    }
    return false;
}

function anyChildMatches(
    node: DepartmentTree,
    search: string,
    positionsByDept: Record<string, PositionType[]>,
    assignmentsByPosition: Record<string, PositionAssignment[]>
): boolean {
    if (!node.children?.length) return false;
    return node.children.some((c) => {
        const positions = positionsByDept[c.id] ?? [];
        if (nodeMatches(c, positions, assignmentsByPosition, search))
            return true;
        return anyChildMatches(c, search, positionsByDept, assignmentsByPosition);
    });
}

