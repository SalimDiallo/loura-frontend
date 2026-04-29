"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard } from "@/components/permissions";
import { PaymentModeBadge } from "@/components/services/services/ServiceStatusBadge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    QuickSelect,
    type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCurrencyFormatter } from "@/lib/hooks";
import { usePaginatedCustomers, usePaginatedMembers } from "@/lib/hooks/hr";
import {
    useCreateEnrollment,
    usePaginatedServices,
    useService
} from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    CreateServiceEnrollmentData,
    ServicePaymentMode,
} from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaConciergeBell,
    FaMoneyBillWave,
    FaUserCheck,
    FaUserPlus,
    FaUsers,
} from "react-icons/fa";
import { toast } from "sonner";

export default function CreateEnrollmentPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICE_ENROLLMENTS.MANAGE}>
      <CreateEnrollmentPage />
    </PermissionGuard>
  );
}

function CreateEnrollmentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = params.id as string;
  const { formatCurrency } = useCurrencyFormatter();

  const presetServiceId = searchParams.get("service") ?? "";
  const presetCustomerId = searchParams.get("customer") ?? "";

  const [serviceId, setServiceId] = useState<string>(presetServiceId);
  const [customerId, setCustomerId] = useState<string>(presetCustomerId);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [expectedEndDate, setExpectedEndDate] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<ServicePaymentMode | "">("");
  const [notes, setNotes] = useState("");
  // Par défaut : pas de génération massive — on ajoute les étapes au coup
  // par coup depuis le détail de l'inscription, ce qui correspond mieux au
  // workflow réel (« seulement les modules dont on a besoin »).
  const [autoGenerate, setAutoGenerate] = useState(false);

  const services = usePaginatedServices(
    orgId,
    { is_active: "true" },
    { pageSize: 100 }
  );
  const customers = usePaginatedCustomers(
    orgId,
    { is_active: "true" },
    { pageSize: 100 }
  );
  const members = usePaginatedMembers(orgId, undefined, { pageSize: 100 });

  const { data: selectedService } = useService(orgId, serviceId || undefined);
  const create = useCreateEnrollment(orgId);

  // Mode de paiement effectif : choix explicite, sinon hérité du service.
  const effectivePaymentMode: ServicePaymentMode | "" =
    paymentMode || (selectedService?.payment_mode ?? "");

  const selectedCustomer = useMemo(
    () => customers.data.find((c) => c.id === customerId) || null,
    [customers.data, customerId]
  );

  const serviceItems: QuickSelectItem[] = useMemo(
    () =>
      services.data.map((s) => ({
        id: s.id,
        name: s.name,
        subtitle: [s.code, s.payment_mode_display]
          .filter(Boolean)
          .join(" · "),
      })),
    [services.data]
  );

  const customerItems: QuickSelectItem[] = useMemo(
    () =>
      customers.data.map((c) => ({
        id: c.id,
        name: c.name,
        subtitle: c.email || c.phone || c.code || undefined,
      })),
    [customers.data]
  );

  const memberItems: QuickSelectItem[] = useMemo(
    () =>
      members.data.map((m) => {
        const u = m.employee?.user;
        const fullName =
          [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "—";
        return {
          id: m.id,
          name: fullName,
          subtitle: u?.email,
        };
      }),
    [members.data]
  );

  const paymentModeItems: QuickSelectItem[] = useMemo(
    () => [
      {
        id: "global",
        name: "Paiement global",
        subtitle: "Le client paie le total en une fois",
      },
      {
        id: "per_step",
        name: "Paiement par étape",
        subtitle: "Encaissement au fil des étapes",
      },
      {
        id: "partial",
        name: "Paiement partiel libre",
        subtitle: "Échéances libres",
      },
    ],
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !customerId) {
      toast.error("Champs obligatoires", {
        description: "Sélectionnez un service et un client.",
      });
      return;
    }
    const payload: CreateServiceEnrollmentData = {
      service: serviceId,
      customer: customerId,
      assignee: assigneeId || null,
      start_date: startDate || null,
      expected_end_date: expectedEndDate || null,
      payment_mode: (paymentMode as ServicePaymentMode) || undefined,
      notes,
      auto_generate_modules: autoGenerate,
    };
    try {
      const resp = await create.mutateAsync(payload);
      toast.success("Inscription créée.");
      router.push(
        `/organisation/${orgId}/services/enrollments/${resp.data.id}`
      );
    } catch (err: unknown) {
      const e = err as {
        data?: { detail?: string; service?: string[]; customer?: string[] };
        message?: string;
      };
      toast.error("Création impossible", {
        description:
          e?.data?.detail ||
          e?.data?.service?.[0] ||
          e?.data?.customer?.[0] ||
          e?.message,
      });
    }
  };

  return (
    <FormPageLayout
      title="Nouvelle inscription"
      subtitle="Inscrivez un client à un service. Les étapes seront générées automatiquement."
      backLink={`/organisation/${orgId}/services/enrollments`}
      sidebar={
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>Récapitulatif de l&apos;inscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <FaConciergeBell className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {selectedService?.name || "Service à choisir"}
              </span>
            </div>
            {selectedService && (
              <div className="space-y-1">
                <PaymentModeBadge
                  mode={
                    (effectivePaymentMode as ServicePaymentMode) ||
                    selectedService.payment_mode
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {selectedService.modules_count} étape(s) ·{" "}
                  {selectedService.computed_price !== null
                    ? formatCurrency(Number(selectedService.computed_price))
                    : "Prix à définir"}
                </p>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex items-center gap-2">
                <FaUserCheck className="h-4 w-4 text-muted-foreground" />
                <span>{selectedCustomer?.name || "Client à sélectionner"}</span>
              </div>
            </div>
            {assigneeId && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FaUsers className="h-3 w-3" />
                <span>
                  {members.data.find((m) => m.id === assigneeId)
                    ?.employee?.user?.email ?? "—"}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground border-t pt-2">
              {autoGenerate
                ? "Les étapes du service seront auto-créées et le total recalculé."
                : "Aucune étape ne sera générée automatiquement."}
            </p>
          </CardContent>
        </Card>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Service & client</CardTitle>
            <CardDescription>Choisissez le service et le client concerné.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Service<span className="text-destructive">*</span>
              </Label>
              <QuickSelect
                label="Service"
                items={serviceItems}
                selectedId={serviceId}
                onSelect={(id) => {
                  setServiceId(id);
                  setPaymentMode("");
                }}
                placeholder="Rechercher un service..."
                icon={FaConciergeBell}
                accentColor="primary"
                required
                canCreate={false}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Client<span className="text-destructive">*</span>
              </Label>
              <QuickSelect
                label="Client"
                items={customerItems}
                selectedId={customerId}
                onSelect={setCustomerId}
                placeholder="Rechercher un client..."
                icon={FaUserCheck}
                accentColor="blue"
                required
                canCreate={false}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Responsable (optionnel)</Label>
              <QuickSelect
                label="Responsable"
                items={memberItems}
                selectedId={assigneeId}
                onSelect={setAssigneeId}
                placeholder="Rechercher un employé..."
                icon={FaUsers}
                accentColor="purple"
                canCreate={false}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Mode de paiement
                {selectedService && !paymentMode && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (hérite : {selectedService.payment_mode_display})
                  </span>
                )}
              </Label>
              <QuickSelect
                label="Mode de paiement"
                items={paymentModeItems}
                selectedId={paymentMode}
                onSelect={(id) =>
                  setPaymentMode((id as ServicePaymentMode) || "")
                }
                placeholder="Hériter du service ou choisir..."
                icon={FaMoneyBillWave}
                accentColor="orange"
                canCreate={false}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planning</CardTitle>
            <CardDescription>
              Dates prévisionnelles. Vous pourrez les ajuster ensuite.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start">Date de début</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expected">Date de fin prévue</Label>
              <Input
                id="expected"
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium">
                Générer toutes les étapes immédiatement
              </p>
              <p className="text-xs text-muted-foreground">
                Si désactivé (recommandé), vous ajouterez les étapes une par
                une depuis l&apos;inscription, selon les besoins du client.
              </p>
            </div>
            <Switch
              checked={autoGenerate}
              onCheckedChange={setAutoGenerate}
              aria-label="Auto-générer les étapes"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={create.isPending}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FaUserPlus className="h-4 w-4 mr-2" />
            )}
            Créer l&apos;inscription
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
}
