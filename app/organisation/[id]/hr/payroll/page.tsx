"use client";

import { GenerateDocumentButton } from "@/components/documents";
import { ListPageLayout, ListSearchFilters, ListStat } from "@/components/layout/ListPageLayout";
import { Can, useOrgPermissions } from "@/components/permissions";
import { Label } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useAdvanceRequests,
    useDeletePayment,
    usePayments,
    useReviewAdvanceRequest,
    useUpdatePayment
} from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdvanceRequest, Payment, PaymentStatus, PaymentType } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import * as fa from "react-icons/fa";
import { FaCheck, FaX } from "react-icons/fa6";
import { toast } from "sonner";

const PAYMENT_TYPES: { id: PaymentType; label: string }[] = [
  { id: "salary", label: "Salaire" },
  { id: "bonus", label: "Bonus" },
  { id: "premium", label: "Prime" },
  { id: "adjustment", label: "Ajustement" },
];

const PAYMENT_STATUSES: { id: PaymentStatus; label: string }[] = [
  { id: "pending", label: "En attente" },
  { id: "approved", label: "Approuvé" },
  { id: "rejected", label: "Rejeté" },
];

function paymentStatusVariant(status: PaymentStatus) {
  switch (status) {
    case "approved": return "default";
    case "pending": return "secondary";
    case "rejected": return "destructive";
    default: return "outline";
  }
}

function advanceStatusVariant(status: string): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "approved": return "default";
    case "pending": return "secondary";
    case "rejected": return "destructive";
    default: return "outline";
  }
}

function getMemberName(m: any) {
  return `${m?.employee?.user?.first_name || ""} ${m?.employee?.user?.last_name || ""}`.trim();
}

export default function PayrollPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();

  // Utilisation du hook de monnaie
  const { formatCurrency } = useCurrencyFormatter();

  const [activeTab, setActiveTab] = useState<"payments" | "advances">("payments");

  // ── Payments state ──
  const [paySearch, setPaySearch] = useState("");
  const [payTypeFilter, setPayTypeFilter] = useState<string | null>(null);
  const [payStatusFilter, setPayStatusFilter] = useState<string | null>(null);
  const [payFilterOpen, setPayFilterOpen] = useState(false);
  const [payAction, setPayAction] = useState<{ payment: Payment; action: "approve" | "reject" | "delete" } | null>(null);

  // ── Advances state ──
  const [advSearch, setAdvSearch] = useState("");
  const [advStatusFilter, setAdvStatusFilter] = useState<string | null>(null);
  const [advFilterOpen, setAdvFilterOpen] = useState(false);
  const [advAction, setAdvAction] = useState<{ advance: AdvanceRequest; action: "approve" | "reject" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // ── Queries ──
  const payFilters = useMemo(() => ({ payment_type: payTypeFilter || undefined, status: payStatusFilter || undefined, page_size: "all" as const }), [payTypeFilter, payStatusFilter]);
  const { data: paymentsRaw, isLoading: payLoading, error: payError } = usePayments(orgId, payFilters);
  const payments: Payment[] = Array.isArray(paymentsRaw) ? paymentsRaw : ((paymentsRaw as any)?.results || []);

  const advFilters = useMemo(() => ({ status: advStatusFilter || undefined, page_size: "all" as const }), [advStatusFilter]);
  const { data: advancesRaw, isLoading: advLoading, error: advError } = useAdvanceRequests(orgId, advFilters);
  const advances: AdvanceRequest[] = Array.isArray(advancesRaw) ? advancesRaw : ((advancesRaw as any)?.results || []);

  // ── Mutations ──
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const reviewAdvance = useReviewAdvanceRequest();

  // ── Filters ──
  const filteredPayments = useMemo(() => {
    if (!paySearch) return payments;
    const lc = paySearch.toLowerCase();
    return payments.filter((p) => {
      const name = getMemberName(p.membership).toLowerCase();
      return name.includes(lc) || (p.membership?.employee?.user?.email || "").toLowerCase().includes(lc);
    });
  }, [payments, paySearch]);

  const filteredAdvances = useMemo(() => {
    if (!advSearch) return advances;
    const lc = advSearch.toLowerCase();
    return advances.filter((a) => {
      const name = getMemberName(a.membership).toLowerCase();
      return name.includes(lc) || (a.membership?.employee?.user?.email || "").toLowerCase().includes(lc);
    });
  }, [advances, advSearch]);

  const payFiltersActive = !!payTypeFilter || !!payStatusFilter;
  const advFiltersActive = !!advStatusFilter;
  const totalApproved = payments.filter((p) => p.status === "approved").reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingAdvances = advances.filter((a) => a.status === "pending").length;

  // ── Handlers ──
  const handlePaymentAction = async () => {
    if (!payAction) return;
    const { payment, action } = payAction;
    try {
      if (action === "delete") {
        await deletePayment.mutateAsync({ orgId, paymentId: payment.id });
        toast.success("Paiement supprimé.");
      } else {
        await updatePayment.mutateAsync({ orgId, paymentId: payment.id, data: { status: action === "approve" ? "approved" : "rejected" } });
        toast.success(action === "approve" ? "Paiement approuvé." : "Paiement rejeté.");
      }
      setPayAction(null);
    } catch (error: any) {
      toast.error("Erreur", { description: error.message || "Action impossible" });
    }
  };

  const handleAdvanceAction = async () => {
    if (!advAction) return;
    const { advance, action } = advAction;
    try {
      await reviewAdvance.mutateAsync({
        orgId,
        advanceId: advance.id,
        data: { action, rejection_reason: action === "reject" ? rejectionReason : undefined },
      });
      toast.success(action === "approve" ? "Demande approuvée." : "Demande rejetée.");
      setAdvAction(null);
      setRejectionReason("");
    } catch (error: any) {
      toast.error("Erreur", { description: error.message || "Action impossible" });
    }
  };

  if (payError || advError) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Erreur : {(payError || advError)?.message}
        </div>
      </div>
    );
  }

  // For Dialog icons, preserve original ones for Button and Badge
  // But rewrite all usages of FaClock, FaCreditCard, FaHandHoldingUsd, FaMoneyBillWave, FaPlus, FaUserTie as fa.FaClock, etc.

  // Hoist icons for clarity
  const FaCreditCard = fa.FaCreditCard;
  const FaMoneyBillWave = fa.FaMoneyBillWave;
  const FaHandHoldingUsd = fa.FaHandHoldingUsd;
  const FaPlus = fa.FaPlus;
  const FaUserTie = fa.FaUserTie;
  const FaClock = fa.FaClock;

  // Local Dialog support icons/components
  // For icons not from fa, keep their original import OR assume exist
  // For the rest, leave as-is
  // The below assumes Check, X, Loader2, Trash2, Label, Dialog et al. are still imported elsewhere.

  return (
    <ListPageLayout
      title="Paie & Avances"
      icon={FaCreditCard}
      description="Gérez les paiements et les demandes d'avance"
      stats={[
        <ListStat
          key="total"
          label="Paiements"
          value={payments.length}
          icon={<FaMoneyBillWave className="h-4 w-4 text-muted-foreground" />}
        />,
        <ListStat
          key="approved"
          label="Montant Approuvé"
          value={formatCurrency(totalApproved)}
          icon={<FaCreditCard className="h-4 w-4 text-green-600" />}
        />,
        <ListStat
          key="pending"
          label="Avances en attente"
          value={pendingAdvances}
          icon={<FaHandHoldingUsd className="h-4 w-4 text-orange-500" />}
        />,
      ]}
      content={
        <>
          {/* Tabs + Create buttons */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex gap-2">
              <Button variant={activeTab === "payments" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("payments")}>
                <FaMoneyBillWave className="mr-2 h-4 w-4" /> Paiements ({payments.length})
              </Button>
              <Button variant={activeTab === "advances" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("advances")}>
                <FaHandHoldingUsd className="mr-2 h-4 w-4" /> Avances ({advances.length})
              </Button>
            </div>
            <div className="flex gap-2">
              {activeTab === "payments" && (
                <Can permission={PERMISSIONS.PAYMENTS.MANAGE}>
                  <Button size="sm" className="gap-2" onClick={() => router.push(`/organisation/${orgId}/hr/payroll/create-payment`)}>
                    <FaPlus className="h-4 w-4" /> Nouveau paiement
                  </Button>
                </Can>
              )}
              {activeTab === "advances" && (
                <Can permission={[PERMISSIONS.ADVANCES.REQUEST, PERMISSIONS.ADVANCES.REVIEW]} mode="any">
                  <Button size="sm" className="gap-2" onClick={() => router.push(`/organisation/${orgId}/hr/payroll/create-advance`)}>
                    <FaPlus className="h-4 w-4" /> Nouvelle demande
                  </Button>
                </Can>
              )}
            </div>
          </div>

          {/* ═══ PAYMENTS TAB ═══ */}
          {activeTab === "payments" && (
            <Card>
              <CardHeader>
                <CardTitle>Paiements</CardTitle>
                <CardDescription>Créez, approuvez ou rejetez les paiements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ListSearchFilters
                  searchValue={paySearch} onSearchChange={setPaySearch}
                  searchPlaceholder="Rechercher par employé..."
                  filtersOpen={payFilterOpen} onFiltersOpenChange={setPayFilterOpen}
                  filtersAreActive={payFiltersActive}
                  filters={
                    <>
                      <div>
                        <div className="text-xs font-medium uppercase text-muted-foreground mb-2">Type</div>
                        <select className="w-full text-sm border-border bg-background rounded-md p-2 focus:ring-1 focus:ring-primary outline-none" value={payTypeFilter || ""} onChange={(e) => setPayTypeFilter(e.target.value || null)}>
                          <option value="">Tous</option>
                          {PAYMENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="mt-4">
                        <div className="text-xs font-medium uppercase text-muted-foreground mb-2">Statut</div>
                        <select className="w-full text-sm border-border bg-background rounded-md p-2 focus:ring-1 focus:ring-primary outline-none" value={payStatusFilter || ""} onChange={(e) => setPayStatusFilter(e.target.value || null)}>
                          <option value="">Tous</option>
                          {PAYMENT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>
                      {payFiltersActive && (
                        <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => { setPayTypeFilter(null); setPayStatusFilter(null); }}>Réinitialiser</Button>
                      )}
                    </>
                  }
                />

                {payLoading ? (
                  <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                ) : filteredPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <FaMoneyBillWave className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-lg font-medium">Aucun paiement trouvé</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      {paySearch || payFiltersActive ? "Modifiez vos filtres" : "Créez un premier paiement"}
                    </p>
                    <Can permission={PERMISSIONS.PAYMENTS.MANAGE}>
                      {!paySearch && !payFiltersActive && (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/organisation/${orgId}/hr/payroll/create-payment`)}>
                          <FaPlus className="h-4 w-4" /> Nouveau paiement
                        </Button>
                      )}
                    </Can>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPayments.map((p) => (
                      <div key={p.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FaUserTie className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{getMemberName(p.membership)}</p>
                            <Badge variant="secondary" className="text-xs font-normal">{p.payment_type_display}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {/* Utilisation de formatCurrency */}
                            {formatCurrency(Number(p.amount))} • {p.payment_date}
                            {p.approved_by && ` • Validé par ${getMemberName(p.approved_by)}`}
                          </p>
                          {/* ==== Ajout du lien "Voir paiement" ==== */}
                          <Button
                            variant="link"
                            size="sm"
                            className="px-0 text-primary underline mt-2"
                            onClick={() => router.push(`/organisation/${orgId}/hr/payroll/payments/${p.id}`)}
                          >
                            Voir paiement
                          </Button>
                        </div>
                        <Badge variant={paymentStatusVariant(p.status)} className="shrink-0">
                          {p.status === "pending" && <FaClock className="mr-1 h-3 w-3" />}
                          {p.status === "approved" && <FaClock className="mr-1 h-3 w-3" />}
                          {p.status === "rejected" && <FaX className="mr-1 h-3 w-3" />}
                          {p.status_display}
                        </Badge>
                        {/* Reçu PDF */}
                        <GenerateDocumentButton
                          orgId={orgId}
                          docType="payment"
                          objectId={p.id}
                          modalTitle="Reçu de paiement"
                          modalSubtitle={getMemberName(p.membership)}
                          size="icon-sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-primary shrink-0"
                          title="Générer le reçu"
                          hideIcon
                        >
                          <fa.FaFilePdf className="h-4 w-4" />
                        </GenerateDocumentButton>
                        {/* Action buttons */}
                        {p.status === "pending" && can(PERMISSIONS.PAYMENTS.APPROVE) && (
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon-sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" title="Approuver" onClick={(e) => { e.stopPropagation(); setPayAction({ payment: p, action: "approve" }); }}>
                              <fa.FaCheck className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Rejeter" onClick={(e) => { e.stopPropagation(); setPayAction({ payment: p, action: "reject" }); }}>
                              <FaX className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {can(PERMISSIONS.PAYMENTS.MANAGE) && (
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive shrink-0" title="Supprimer" onClick={(e) => { e.stopPropagation(); setPayAction({ payment: p, action: "delete" }); }}>
                            <fa.FaTrash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ ADVANCES TAB ═══ */}
          {activeTab === "advances" && (
            <Card>
              <CardHeader>
                <CardTitle>Demandes d'avance</CardTitle>
                <CardDescription>Les membres demandent des avances, les administrateurs les approuvent ou les rejettent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ListSearchFilters
                  searchValue={advSearch} onSearchChange={setAdvSearch}
                  searchPlaceholder="Rechercher par employé..."
                  filtersOpen={advFilterOpen} onFiltersOpenChange={setAdvFilterOpen}
                  filtersAreActive={advFiltersActive}
                  filters={
                    <>
                      <div>
                        <div className="text-xs font-medium uppercase text-muted-foreground mb-2">Statut</div>
                        <select className="w-full text-sm border-border bg-background rounded-md p-2 focus:ring-1 focus:ring-primary outline-none" value={advStatusFilter || ""} onChange={(e) => setAdvStatusFilter(e.target.value || null)}>
                          <option value="">Tous</option>
                          <option value="pending">En attente</option>
                          <option value="approved">Approuvée</option>
                          <option value="rejected">Refusée</option>
                        </select>
                      </div>
                      {advFiltersActive && (
                        <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setAdvStatusFilter(null)}>Réinitialiser</Button>
                      )}
                    </>
                  }
                />

                {advLoading ? (
                  <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                ) : filteredAdvances.length === 0 ? (
                  <div className="text-center py-12">
                    <FaHandHoldingUsd className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-lg font-medium">Aucune demande d'avance</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      {advSearch || advFiltersActive ? "Modifiez vos filtres" : "Aucune demande pour le moment"}
                    </p>
                    <Can permission={[PERMISSIONS.ADVANCES.REQUEST, PERMISSIONS.ADVANCES.REVIEW]} mode="any">
                      {!advSearch && !advFiltersActive && (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/organisation/${orgId}/hr/payroll/create-advance`)}>
                          <FaPlus className="h-4 w-4" /> Nouvelle demande
                        </Button>
                      )}
                    </Can>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAdvances.map((a) => (
                      <div key={a.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FaUserTie className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{getMemberName(a.membership)}</p>
                            <span className="text-sm font-semibold">{formatCurrency(Number(a.amount))}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.reason}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Demandée le {a.request_date}
                            {a.reviewed_by && (
                              <> • {a.status === "approved" ? "Approuvée" : "Rejetée"} par <span className="font-medium text-foreground">{getMemberName(a.reviewed_by)}</span>
                                {a.reviewed_at && ` le ${new Date(a.reviewed_at).toLocaleDateString("fr-FR")}`}
                              </>
                            )}
                            {a.rejection_reason && <> • Motif : {a.rejection_reason}</>}
                          </p>
                        </div>
                        <Badge variant={advanceStatusVariant(a.status)} className="shrink-0">
                          {a.status === "pending" && <FaClock className="mr-1 h-3 w-3" />}
                          {a.status === "approved" && <FaCheck className="mr-1 h-3 w-3" />}
                          {a.status === "rejected" && <FaX className="mr-1 h-3 w-3" />}
                          {a.status_display}
                        </Badge>
                        {/* Document PDF */}
                        <GenerateDocumentButton
                          orgId={orgId}
                          docType="advance"
                          objectId={a.id}
                          modalTitle="Demande d'avance"
                          modalSubtitle={getMemberName(a.membership)}
                          size="icon-sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-primary shrink-0"
                          title="Générer le document"
                          hideIcon
                        >
                          <fa.FaFilePdf className="h-4 w-4" />
                        </GenerateDocumentButton>
                        {a.status === "pending" && can(PERMISSIONS.ADVANCES.REVIEW) && (
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon-sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" title="Approuver" onClick={() => setAdvAction({ advance: a, action: "approve" })}>
                              <FaCheck className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Rejeter" onClick={() => setAdvAction({ advance: a, action: "reject" })}>
                              <FaX className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ PAYMENT ACTION DIALOG ═══ */}
          <Dialog open={!!payAction} onOpenChange={() => setPayAction(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {payAction?.action === "approve" && "Approuver le paiement"}
                  {payAction?.action === "reject" && "Rejeter le paiement"}
                  {payAction?.action === "delete" && "Supprimer le paiement"}
                </DialogTitle>
                <DialogDescription>
                  {payAction?.action === "delete"
                    ? `Voulez-vous supprimer le paiement de ${payAction ? formatCurrency(Number(payAction.payment.amount)) : ""} pour ${getMemberName(payAction.payment.membership)} ? Cette action est irréversible.`
                    : `Voulez-vous ${payAction?.action === "approve" ? "approuver" : "rejeter"} le paiement de ${payAction ? formatCurrency(Number(payAction.payment.amount)) : ""} pour ${payAction ? getMemberName(payAction.payment.membership) : ""} ?`
                  }
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayAction(null)}>Annuler</Button>
                <Button
                  variant={payAction?.action === "delete" || payAction?.action === "reject" ? "destructive" : "default"}
                  onClick={handlePaymentAction}
                  disabled={updatePayment.isPending || deletePayment.isPending}
                  className="gap-2"
                >
                  {(updatePayment.isPending || deletePayment.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ═══ ADVANCE ACTION DIALOG ═══ */}
          <Dialog open={!!advAction} onOpenChange={() => { setAdvAction(null); setRejectionReason(""); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {advAction?.action === "approve" ? "Approuver la demande" : "Rejeter la demande"}
                </DialogTitle>
                <DialogDescription>
                  Demande de {advAction ? getMemberName(advAction.advance.membership) : ""} pour{" "}
                  {advAction ? formatCurrency(Number(advAction.advance.amount)) : ""}
                  <br />
                  <span className="italic">Motif : {advAction?.advance.reason}</span>
                </DialogDescription>
              </DialogHeader>

              {advAction?.action === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="rejection_reason">Motif du refus</Label>
                  <textarea
                    id="rejection_reason"
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Expliquez le motif du refus..."
                    className="flex w-full border rounded-md border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => { setAdvAction(null); setRejectionReason(""); }}>Annuler</Button>
                <Button
                  variant={advAction?.action === "reject" ? "destructive" : "default"}
                  onClick={handleAdvanceAction}
                  disabled={reviewAdvance.isPending}
                  className="gap-2"
                >
                  {reviewAdvance.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {advAction?.action === "approve" ? "Approuver" : "Rejeter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    />
  );
}
