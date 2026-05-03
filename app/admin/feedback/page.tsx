"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteFeedback,
  useFeedbackList,
  useUpdateFeedbackStatus,
} from "@/lib/hooks/feedback";
import type {
  FeedbackItem,
  FeedbackListFilters,
  FeedbackStatus,
  FeedbackType,
} from "@/lib/services/feedback/feedback.service";
import {
  Bug,
  Heart,
  Lightbulb,
  MessageSquare,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const TYPE_META: Record<
  FeedbackType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  idea: { label: "Idée", icon: Lightbulb },
  bug: { label: "Bug", icon: Bug },
  love: { label: "J'aime", icon: Heart },
  other: { label: "Autre", icon: MessageSquare },
};

const STATUS_META: Record<
  FeedbackStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  new: { label: "Nouveau", variant: "default" },
  reviewed: { label: "Vu", variant: "secondary" },
  resolved: { label: "Résolu", variant: "outline" },
};

function TypeCell({ type }: { type: FeedbackType }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {meta.label}
    </span>
  );
}

function Stars({ n }: { n: number | null }) {
  if (!n) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= n
              ? "h-3 w-3 fill-amber-400 text-amber-400"
              : "h-3 w-3 text-muted-foreground/40"
          }
        />
      ))}
    </span>
  );
}

export default function AdminFeedbackPage() {
  const [filters, setFilters] = useState<FeedbackListFilters>({ page: 1 });
  const [selected, setSelected] = useState<FeedbackItem | null>(null);

  const { data, isLoading } = useFeedbackList(filters);
  const updateStatus = useUpdateFeedbackStatus();
  const remove = useDeleteFeedback();

  const counts = useMemo(() => {
    const results = data?.results ?? [];
    return {
      total: data?.count ?? 0,
      new: results.filter((r) => r.status === "new").length,
    };
  }, [data]);

  const handleChangeStatus = (id: number, status: FeedbackStatus) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success("Statut mis à jour"),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Erreur"),
      },
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Supprimer définitivement ce feedback ?")) return;
    remove.mutate(id, {
      onSuccess: () => {
        toast.success("Feedback supprimé");
        setSelected(null);
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
    });
  };

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
          <p className="text-sm text-muted-foreground">
            Retours envoyés par les utilisateurs via le widget.{" "}
            {counts.total > 0 && (
              <span>
                {counts.total} au total, {counts.new} nouveau
                {counts.new > 1 ? "x" : ""} sur cette page.
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/monitoring"
          className="text-sm text-primary hover:underline"
        >
          ← Retour
        </Link>
      </header>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-4">
          <Input
            placeholder="Rechercher (message, email, URL)…"
            value={filters.q ?? ""}
            onChange={(e) =>
              setFilters({ ...filters, q: e.target.value, page: 1 })
            }
          />
          <Select
            value={filters.type ?? "all"}
            onValueChange={(v) =>
              setFilters({
                ...filters,
                type: v === "all" ? undefined : (v as FeedbackType),
                page: 1,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="idea">Idée</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="love">J&apos;aime</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? "all"}
            onValueChange={(v) =>
              setFilters({
                ...filters,
                status: v === "all" ? undefined : (v as FeedbackStatus),
                page: 1,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="new">Nouveau</SelectItem>
              <SelectItem value="reviewed">Vu</SelectItem>
              <SelectItem value="resolved">Résolu</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setFilters({ page: 1 })}>
            Réinitialiser
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Chargement…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data?.results.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Aucun feedback pour les filtres actuels.
                  </TableCell>
                </TableRow>
              )}
              {data?.results.map((f) => (
                <TableRow
                  key={f.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setSelected(f)}
                >
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(f.created_at).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <TypeCell type={f.type} />
                  </TableCell>
                  <TableCell>
                    <Stars n={f.rating} />
                  </TableCell>
                  <TableCell className="max-w-[420px] truncate text-xs">
                    {f.message}
                  </TableCell>
                  <TableCell className="text-xs">
                    {f.user_email || f.email || (
                      <span className="text-muted-foreground">anonyme</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_META[f.status].variant}>
                      {STATUS_META[f.status].label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {data ? `${data.count} feedbacks au total` : "—"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.previous}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                page: Math.max(1, (f.page ?? 1) - 1),
              }))
            }
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.next}
            onClick={() =>
              setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
            }
          >
            Suivant
          </Button>
        </div>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected ? (
                <span className="flex items-center gap-2">
                  <TypeCell type={selected.type} />
                  <Badge variant={STATUS_META[selected.status].variant}>
                    {STATUS_META[selected.status].label}
                  </Badge>
                </span>
              ) : (
                "Détail"
              )}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? `${new Date(selected.created_at).toLocaleString("fr-FR")} · ${
                    selected.user_email || selected.email || "anonyme"
                  }`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                  Message
                </h3>
                <p className="whitespace-pre-wrap break-words">
                  {selected.message}
                </p>
              </div>

              {selected.rating ? (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Note
                  </h3>
                  <Stars n={selected.rating} />
                </div>
              ) : null}

              {selected.page_url ? (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Page
                  </h3>
                  <p className="font-mono text-xs break-all">
                    {selected.page_url}
                  </p>
                </div>
              ) : null}

              {selected.organization_slug ? (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Organisation
                  </h3>
                  <p className="font-mono text-xs">
                    {selected.organization_slug}
                  </p>
                </div>
              ) : null}

              {selected.user_agent ? (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    User-Agent
                  </h3>
                  <p className="font-mono text-[11px] text-muted-foreground break-all">
                    {selected.user_agent}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <Select
                  value={selected.status}
                  onValueChange={(v) =>
                    handleChangeStatus(selected.id, v as FeedbackStatus)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Nouveau</SelectItem>
                    <SelectItem value="reviewed">Vu</SelectItem>
                    <SelectItem value="resolved">Résolu</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selected.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Supprimer
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
