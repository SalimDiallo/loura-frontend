"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import {
  useCategories,
  useOrganization,
  useUpdateOrganization,
  useUploadOrganizationLogo,
} from "@/lib/hooks/core";
import { organizationService } from "@/lib/services/core";
import { COUNTRIES, CURRENCIES } from "@/lib/constants/core";
import {
  ArrowLeft,
  Camera,
  Check,
  Coins,
  Globe,
  Layers,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ============================================================================
// COMPONENT
// ============================================================================

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.id as string;

  // API hooks
  const { data: org, isLoading, isError } = useOrganization(orgId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const updateMutation = useUpdateOrganization();
  const logoMutation = useUploadOrganizationLogo();

  // Form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when org loads
  useEffect(() => {
    if (org) {
      setName(org.name);
      setCategoryId(org.category?.id || "");
      setCountry(org.country || "");
      setCurrency(org.currency || "");
    }
  }, [org]);

  // Map categories to SmartSelector format
  const categoryItems: SmartSelectorItem[] = useMemo(() => 
    categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      subtitle: cat.description || undefined,
    }))
  , [categories]);

  const countryItems: SmartSelectorItem[] = useMemo(() => 
    COUNTRIES.map(c => ({ id: c.id, name: c.name }))
  , []);

  const currencyItems: SmartSelectorItem[] = useMemo(() => 
    CURRENCIES.map(c => ({ id: c.id, name: c.name }))
  , []);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDeleteLogo = useCallback(async () => {
    if (!orgId) return;
    setDeletingLogo(true);
    try {
      await organizationService.deleteLogo(orgId);
      setLogoPreview(null);
      setLogoFile(null);
    } catch {
      // ignore
    } finally {
      setDeletingLogo(false);
    }
  }, [orgId]);

  const handleSave = useCallback(async () => {
    try {
      await updateMutation.mutateAsync({
        id: orgId,
        data: {
          name: name.trim(),
          category_id: categoryId || null,
          country,
          currency,
        },
      });

      if (logoFile) {
        await logoMutation.mutateAsync({ id: orgId, file: logoFile });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error handled by mutation state
    }
  }, [orgId, name, categoryId, country, currency, logoFile, updateMutation, logoMutation]);

  const isPending = updateMutation.isPending || logoMutation.isPending;
  const currentLogoUrl = logoPreview || org?.logo || null;

  // Detect changes
  const hasChanges =
    org &&
    (name !== org.name ||
      categoryId !== (org.category?.id || "") ||
      country !== (org.country || "") ||
      currency !== (org.currency || "") ||
      logoFile !== null);

  // ========================================================================
  // LOADING
  // ========================================================================

  if (isLoading) {
    return (
      <div className="px-4 py-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 pb-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-52" />
        </div>
        <Card className="p-6 bg-muted/30 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  if (isError || !org) {
    return (
      <div className="px-4 py-8 max-w-2xl mx-auto">
        <div className="text-red-700 bg-red-100 px-4 py-3 rounded-lg text-sm">
          Organisation introuvable.
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.push("/core/dashboard/organizations")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Modifier l&apos;organisation</h1>
          <p className="text-xs text-muted-foreground">{org.slug}</p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 bg-muted/30 space-y-6">
        {/* Logo */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">
            Logo
          </label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoSelect}
            />
            <div
              className="relative h-20 w-20 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors group"
              onClick={() => fileInputRef.current?.click()}
            >
              {currentLogoUrl ? (
                <>
                  <img src={currentLogoUrl} alt={org.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">Ajouter</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-foreground font-medium">Changer le logo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WebP. 5 Mo max.</p>
              {currentLogoUrl && !logoPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteLogo}
                  disabled={deletingLogo}
                >
                  {deletingLogo ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Supprimer
                </Button>
              )}
              {logoFile && (
                <button
                  onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/20" />

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Nom de l&apos;organisation
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
            placeholder="Nom de votre organisation"
          />
        </div>

        {/* Category (SmartSelector) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Catégorie
          </label>
          {categoriesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <SmartSelector
              items={categoryItems}
              selectedIds={categoryId ? [categoryId] : []}
              onChange={(ids) => setCategoryId(ids[0] || "")}
              placeholder="Sélectionner une catégorie…"
              accentColor="primary"
            />
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/20" />

        {/* Country (SmartSelector) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pays
          </label>
          <SmartSelector
            items={countryItems}
            selectedIds={country ? [country] : []}
            onChange={(ids) => setCountry(ids[0] || "")}
            placeholder="Sélectionner un pays…"
            accentColor="blue"
          />
        </div>

        {/* Currency (SmartSelector) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Devise
          </label>
          <SmartSelector
            items={currencyItems}
            selectedIds={currency ? [currency] : []}
            onChange={(ids) => setCurrency(ids[0] || "")}
            placeholder="Sélectionner une devise…"
            accentColor="green"
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs"
          onClick={() => router.push("/core/dashboard/organizations")}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Retour
        </Button>
        <Button
          size="sm"
          className="h-9 text-xs min-w-[120px]"
          onClick={handleSave}
          disabled={!hasChanges || isPending || !name.trim()}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
          ) : (
            <Check className="h-3.5 w-3.5 mr-1.5" />
          )}
          {saved ? "Enregistré !" : "Enregistrer"}
        </Button>
      </div>

      {/* Error message */}
      {updateMutation.isError && (
        <p className="text-xs text-red-500 text-center">
          Une erreur est survenue. Veuillez réessayer.
        </p>
      )}
    </div>
  );
}
