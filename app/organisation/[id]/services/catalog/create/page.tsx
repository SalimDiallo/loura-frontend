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
import { MoneyInput } from "@/components/ui/money-input";
import {
  QuickSelect,
  type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
  useCreateService,
  usePaginatedServiceCategories,
} from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type { CreateServiceData, ServicePaymentMode } from "@/lib/types";
import { Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaConciergeBell,
  FaHashtag,
  FaInfoCircle,
  FaMoneyBillWave,
  FaTags,
} from "react-icons/fa";
import { toast } from "sonner";

export default function CreateServicePageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICES.MANAGE}>
      <CreateServicePage />
    </PermissionGuard>
  );
}

function CreateServicePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { formatCurrency } = useCurrencyFormatter();

  const create = useCreateService(orgId);
  const categories = usePaginatedServiceCategories(
    orgId,
    { is_active: "true" },
    { pageSize: 100 }
  );

  const categoryItems: QuickSelectItem[] = categories.data.map((c) => ({
    id: c.id,
    name: c.full_path,
    subtitle: c.description || undefined,
  }));

  const paymentModeItems: QuickSelectItem[] = [
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
  ];

  const [form, setForm] = useState<CreateServiceData>({
    name: "",
    code: "",
    category: null,
    description: "",
    base_price: null,
    duration_days: null,
    payment_mode: "global",
    parameters: {},
    is_active: true,
  });

  const setField = <K extends keyof CreateServiceData>(
    key: K,
    value: CreateServiceData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error("Champ manquant", { description: "Le nom est obligatoire." });
      return;
    }
    try {
      const payload: CreateServiceData = {
        ...form,
        name: form.name.trim(),
        code: form.code?.trim() || "",
        base_price:
          form.base_price === null || form.base_price === ""
            ? null
            : String(form.base_price),
        duration_days:
          form.duration_days === null || form.duration_days === undefined
            ? null
            : Number(form.duration_days),
      };
      const resp = await create.mutateAsync(payload);
      toast.success("Service créé.");
      router.push(
        `/organisation/${orgId}/services/catalog/${resp.data.id}`
      );
    } catch (err: unknown) {
      const e = err as {
        data?: { detail?: string; name?: string[]; code?: string[] };
        message?: string;
      };
      toast.error("Création impossible", {
        description:
          e?.data?.name?.[0] ||
          e?.data?.code?.[0] ||
          e?.data?.detail ||
          e?.message,
      });
    }
  };

  return (
    <FormPageLayout
      title="Nouveau service"
      subtitle="Décrivez le service que vous proposez. Vous ajouterez ses étapes après création."
      backLink={`/organisation/${orgId}/services/catalog`}
      sidebar={
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>Résumé du service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <FaConciergeBell className="h-4 w-4 text-primary" />
              <span className="font-medium">{form.name || "Nom du service"}</span>
            </div>
            {form.code && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FaHashtag className="h-3 w-3" />
                <span>{form.code}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <PaymentModeBadge mode={form.payment_mode || "global"} />
            </div>
            {form.base_price !== null && form.base_price !== "" && (
              <div className="flex items-center gap-2">
                <FaMoneyBillWave className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold">
                  {formatCurrency(Number(form.base_price || 0))}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <FaInfoCircle className="h-3 w-3" />
              <span>{form.is_active ? "Actif" : "Inactif"}</span>
            </div>
          </CardContent>
        </Card>
      }
      actions={[]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations principales</CardTitle>
            <CardDescription>
              Le nom est public pour vos clients. Le code est interne (optionnel).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nom du service<span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Accompagnement visa étudiant"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code">Code interne</Label>
              <Input
                id="code"
                value={form.code ?? ""}
                onChange={(e) => setField("code", e.target.value)}
                placeholder="SRV-001"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <QuickSelect
                label="Catégorie"
                items={categoryItems}
                selectedId={form.category ?? ""}
                onSelect={(id) => setField("category", id || null)}
                placeholder="Rechercher une catégorie..."
                icon={FaTags}
                accentColor="blue"
                canCreate={false}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Décrivez ce service en quelques lignes..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarification & durée</CardTitle>
            <CardDescription>
              Prix global facultatif. En mode « Par étape », c&apos;est la somme
              des modules qui fait foi.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Mode de paiement</Label>
              <QuickSelect
                label="Mode de paiement"
                items={paymentModeItems}
                selectedId={form.payment_mode || "global"}
                onSelect={(id) =>
                  setField(
                    "payment_mode",
                    (id as ServicePaymentMode) || "global"
                  )
                }
                placeholder="Choisir un mode..."
                icon={FaMoneyBillWave}
                accentColor="orange"
                canCreate={false}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration">Durée totale (jours)</Label>
              <Input
                id="duration"
                type="number"
                min={0}
                value={form.duration_days ?? ""}
                onChange={(e) =>
                  setField(
                    "duration_days",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                placeholder="Ex : 30"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="base_price">Prix de base (optionnel)</Label>
              <MoneyInput
                id="base_price"
                value={form.base_price ?? ""}
                onChange={(v) =>
                  setField("base_price", v === "" ? null : v)
                }
                min={0}
                step={1000}
                showUsdSubtitle
                placeholder="Laisser vide pour calculer depuis les modules"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium">Service actif</p>
              <p className="text-xs text-muted-foreground">
                Les services inactifs sont masqués des inscriptions.
              </p>
            </div>
            <Switch
              checked={!!form.is_active}
              onCheckedChange={(v) => setField("is_active", v)}
              aria-label="Service actif"
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
              <Save className="h-4 w-4 mr-2" />
            )}
            Créer le service
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
}
