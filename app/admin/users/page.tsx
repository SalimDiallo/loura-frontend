"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useAdminUsersBilling } from "@/lib/hooks/admin"
import type { AdminUserBillingRow } from "@/lib/types/admin"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { UserBillingDrawer } from "./_components/user-billing-drawer"

function PlanBadge({ code }: { code: string | null }) {
  if (!code) return <Badge variant="outline">—</Badge>
  const colorMap: Record<string, "default" | "secondary" | "outline"> = {
    free: "outline",
    basic: "secondary",
    pro: "default",
    enterprise: "default",
  }
  return <Badge variant={colorMap[code] ?? "secondary"}>{code}</Badge>
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">aucun</Badge>
  const variant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    cancelled: "secondary",
    expired: "destructive",
    past_due: "destructive",
  }
  return <Badge variant={variant[status] ?? "secondary"}>{status}</Badge>
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [planCode, setPlanCode] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading } = useAdminUsersBilling({
    search: search.trim() || undefined,
    plan_code: planCode === "all" ? undefined : planCode,
    status: status === "all" ? undefined : (status as never),
    page,
    page_size: 20,
  })

  function openDrawer(userId: string) {
    setSelectedUserId(userId)
    setDrawerOpen(true)
  }

  const rows = data?.results ?? []
  const totalPages = data?.total_pages ?? 1

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Utilisateurs & Abonnements
          </h1>
          <p className="text-sm text-muted-foreground">
            Recherche, change le plan, offre des mois gratuits et annule
            des abonnements.
          </p>
        </div>
        <Link
          href="/admin/monitoring"
          className="text-sm text-primary hover:underline"
        >
          ← Monitoring
        </Link>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Email, prénom ou nom…"
            className="pl-9"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Plan</span>
          <Select
            value={planCode}
            onValueChange={(v) => {
              setPlanCode(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Entreprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Statut</span>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
              <SelectItem value="expired">Expiré</SelectItem>
              <SelectItem value="past_due">Paiement en attente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Fin de période</TableHead>
              <TableHead>Auto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur ne correspond.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u: AdminUserBillingRow) => (
                <TableRow
                  key={u.id}
                  onClick={() => openDrawer(u.id)}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  <TableCell className="font-mono text-xs">{u.email}</TableCell>
                  <TableCell>{u.full_name || "—"}</TableCell>
                  <TableCell><PlanBadge code={u.plan_code} /></TableCell>
                  <TableCell><StatusBadge status={u.sub_status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.cycle === "yearly"
                      ? "annuel"
                      : u.cycle === "monthly"
                      ? "mensuel"
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {u.current_period_end
                      ? new Date(u.current_period_end).toLocaleDateString("fr-FR")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {u.auto_renew ? "✓" : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data?.current_page ?? page} / {totalPages} — {data?.count ?? 0} utilisateurs
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.previous}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.next}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <UserBillingDrawer
        userId={selectedUserId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}
