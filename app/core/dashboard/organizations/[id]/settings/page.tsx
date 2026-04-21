"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOrganization,
  useOrganizationSettings,
  useUpdateOrganizationSettings,
} from "@/lib/hooks/core";
import type { UpdateOrganizationSettingsData } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Check,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Palette,
  Phone,
  Receipt,
  Type,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// ============================================================================
// FONT OPTIONS
// ============================================================================

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Nunito",
  "Raleway",
  "Arial",
  "Helvetica",
];

// ============================================================================
// COLOR PICKER
// ============================================================================

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-9 w-9 rounded-lg shadow-sm cursor-pointer relative overflow-hidden shrink-0"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono uppercase mt-0.5"
          maxLength={7}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.id as string;

  // Data
  const { data: org, isLoading: orgLoading } = useOrganization(orgId);
  const { data: settings, isLoading: settingsLoading } = useOrganizationSettings(orgId);
  const updateMutation = useUpdateOrganizationSettings();

  // Form state
  const [form, setForm] = useState<UpdateOrganizationSettingsData>({});
  const [saved, setSaved] = useState(false);

  // Populate form when settings arrive
  useEffect(() => {
    if (settings) {
      setForm({
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        font_family: settings.font_family,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        tax_id: settings.tax_id,
        tax_rate: settings.tax_rate,
        invoice_footer: settings.invoice_footer,
        invoice_prefix: settings.invoice_prefix,
        receipt_prefix: settings.receipt_prefix,
      });
    }
  }, [settings]);

  // Change detection
  const hasChanges = useMemo(() => {
    if (!settings) return false;
    return Object.keys(form).some(
      (key) => form[key as keyof typeof form] !== settings[key as keyof typeof settings]
    );
  }, [form, settings]);

  const updateField = useCallback(
    <K extends keyof UpdateOrganizationSettingsData>(
      key: K,
      value: UpdateOrganizationSettingsData[K]
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setSaved(false);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    try {
      await updateMutation.mutateAsync({ orgId, data: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // handled by mutation state
    }
  }, [hasChanges, form, orgId, updateMutation]);

  // ========================================================================
  // LOADING
  // ========================================================================

  if (orgLoading || settingsLoading) {
    return (
      <div className="px-4 py-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!org || !settings) {
    return (
      <div className="px-4 py-8 max-w-3xl mx-auto text-center text-muted-foreground">
        Organisation non trouvée.
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Paramètres — {org.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Branding, coordonnées et configuration des documents.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            size="sm"
            className={cn(
              "h-9 text-xs font-medium transition-all",
              saved && "bg-emerald-600 hover:bg-emerald-600"
            )}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : saved ? (
              <Check className="h-3.5 w-3.5 mr-1.5" />
            ) : null}
            {saved ? "Enregistré" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Section: Branding */}
      <Card className="p-5 bg-muted/30 space-y-5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Palette className="h-4 w-4 text-muted-foreground" />
          Branding
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorInput
            label="Couleur principale"
            value={form.primary_color || "#6366F1"}
            onChange={(v) => updateField("primary_color", v)}
          />
          <ColorInput
            label="Couleur secondaire"
            value={form.secondary_color || "#E5E7EB"}
            onChange={(v) => updateField("secondary_color", v)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5" />
            Police des documents
          </label>
          <div className="flex flex-wrap gap-2">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font}
                onClick={() => updateField("font_family", font)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs border transition-all",
                  form.font_family === font
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-background text-foreground hover:border-primary/40"
                )}
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div
          className="p-4 rounded-lg border border-dashed"
          style={{ fontFamily: form.font_family }}
        >
          <p className="text-xs text-muted-foreground mb-2">Aperçu</p>
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-md"
              style={{ backgroundColor: form.primary_color }}
            />
            <div
              className="h-8 w-8 rounded-md"
              style={{ backgroundColor: form.secondary_color }}
            />
            <span className="text-sm font-medium">{org.name}</span>
          </div>
          <p className="text-xs mt-2 text-muted-foreground" style={{ fontFamily: form.font_family }}>
            Facture N° {form.invoice_prefix}-2026-001 — {form.font_family}
          </p>
        </div>
      </Card>

      {/* Section: Coordonnées */}
      <Card className="p-5 bg-muted/30 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Coordonnées
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Adresse</label>
          <textarea
            value={form.address || ""}
            onChange={(e) => updateField("address", e.target.value)}
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            placeholder="123 Rue de la Paix, Conakry"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              Téléphone
            </label>
            <Input
              value={form.phone || ""}
              onChange={(e) => updateField("phone", e.target.value)}
              className="h-9"
              placeholder="+224 621 00 00 00"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              Email
            </label>
            <Input
              value={form.email || ""}
              onChange={(e) => updateField("email", e.target.value)}
              className="h-9"
              placeholder="contact@organisation.com"
              type="email"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-3 w-3" />
            Site web
          </label>
          <Input
            value={form.website || ""}
            onChange={(e) => updateField("website", e.target.value)}
            className="h-9"
            placeholder="https://www.organisation.com"
            type="url"
          />
        </div>
      </Card>

      {/* Section: Fiscal */}
      <Card className="p-5 bg-muted/30 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          Informations fiscales
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">N° identification fiscale</label>
            <Input
              value={form.tax_id || ""}
              onChange={(e) => updateField("tax_id", e.target.value)}
              className="h-9"
              placeholder="NIF-123456789"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Taux de taxe (%)</label>
            <Input
              value={form.tax_rate || ""}
              onChange={(e) => updateField("tax_rate", e.target.value)}
              className="h-9"
              placeholder="18.00"
              type="number"
              step="0.01"
              min="0"
              max="100"
            />
          </div>
        </div>
      </Card>

      {/* Section: Documents */}
      <Card className="p-5 bg-muted/30 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Documents (PDF)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Préfixe factures</label>
            <Input
              value={form.invoice_prefix || ""}
              onChange={(e) => updateField("invoice_prefix", e.target.value.toUpperCase())}
              className="h-9 font-mono uppercase"
              placeholder="FAC"
              maxLength={10}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Préfixe reçus</label>
            <Input
              value={form.receipt_prefix || ""}
              onChange={(e) => updateField("receipt_prefix", e.target.value.toUpperCase())}
              className="h-9 font-mono uppercase"
              placeholder="REC"
              maxLength={10}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Pied de page des factures</label>
          <textarea
            value={form.invoice_footer || ""}
            onChange={(e) => updateField("invoice_footer", e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            placeholder="Merci pour votre confiance. Conditions de paiement : 30 jours net."
          />
        </div>
      </Card>

      {/* Sticky save bar (mobile) */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t sm:hidden z-50">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full h-10 text-sm font-medium"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Enregistrer les modifications
          </Button>
        </div>
      )}

      {/* Error */}
      {updateMutation.isError && (
        <p className="text-xs text-red-500 text-center">
          Une erreur est survenue. Veuillez réessayer.
        </p>
      )}
    </div>
  );
}
