"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { getApiErrorMessage } from "@/lib/api";
import { COUNTRIES, CURRENCIES } from "@/lib/constants/core";
import {
  useCategories,
  useCreateOrganization,
  useModulesCatalog,
  useUploadOrganizationLogo,
} from "@/lib/hooks/core";
import type { ModuleCode } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  Briefcase,
  Building2,
  Check,
  Crown,
  Globe,
  ImagePlus,
  Loader2,
  Package,
  PartyPopper,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

const STEPS = [
  { id: 1, label: "Nom", icon: Building2 },
  { id: 2, label: "Catégorie", icon: Check },
  { id: 3, label: "Modules", icon: Blocks },
  { id: 4, label: "Paramètres", icon: Globe },
  { id: 5, label: "Finalisation", icon: Check },
] as const;

const LAST_FORM_STEP = 4;

/**
 * Mapping code module → icône Lucide pour la card de sélection.
 * Sert de fallback quand le backend ne renvoie pas explicitement d'icône.
 */
const MODULE_ICONS: Record<string, LucideIcon> = {
  hr: Users,
  inventory: Package,
  services: Briefcase,
};

// ============================================================================
// COMPONENT
// ============================================================================

function CreateOrganizationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";
  const [step, setStep] = useState(1);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [country, setCountry] = useState("Guinée");
  const [currency, setCurrency] = useState("GNF");
  const [selectedModules, setSelectedModules] = useState<ModuleCode[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: modules = [], isLoading: modulesLoading } = useModulesCatalog();
  const createMutation = useCreateOrganization();
  const logoMutation = useUploadOrganizationLogo();

  const toggleModule = useCallback((code: ModuleCode) => {
    setSelectedModules((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }, []);

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

  const canGoNext = useCallback(() => {
    switch (step) {
      case 1: return name.trim().length >= 2;
      case 2: return true; // Category is optional
      case 3: return true; // Modules are optional too (mais on encourage la sélection)
      case 4: return true;
      default: return false;
    }
  }, [step, name]);

  const handleNext = useCallback(async () => {
    if (step === LAST_FORM_STEP) {
      // Create the organization (étape finale du formulaire)
      try {
        const org = await createMutation.mutateAsync({
          name: name.trim(),
          category_id: categoryId || null,
          country,
          currency,
          module_codes: selectedModules,
        });
        setCreatedOrgId(org.id);
        setStep(LAST_FORM_STEP + 1);
      } catch {
        // Error is handled by mutation state
      }
    } else {
      setStep((s) => s + 1);
    }
  }, [step, name, categoryId, country, currency, selectedModules, createMutation]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleLogoUpload = useCallback(async () => {
    if (!logoFile || !createdOrgId) return;
    try {
      await logoMutation.mutateAsync({ id: createdOrgId, file: logoFile });
    } catch {
      // Error handled by mutation
    }
  }, [logoFile, createdOrgId, logoMutation]);

  const handleFinish = useCallback(async () => {
    if (logoFile && createdOrgId) {
      await handleLogoUpload();
    }
    // Si on était dans le flow onboarding, on enchaîne sur la visite guidée de la nouvelle org
    if (isOnboarding && createdOrgId) {
      router.push(`/organisation/${createdOrgId}/dashboard?onboarding=1`);
    } else {
      router.push("/core/dashboard");
    }
  }, [logoFile, createdOrgId, handleLogoUpload, router, isOnboarding]);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Créer une organisation
          </h1>
          <p className="text-sm text-muted-foreground">
            {step <= LAST_FORM_STEP
              ? `Étape ${step} sur ${LAST_FORM_STEP}`
              : "Votre organisation est prête !"}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                  step > s.id
                    ? "bg-primary text-primary-foreground"
                    : step === s.id
                      ? "bg-primary/15 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {step > s.id ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <s.icon className="h-3.5 w-3.5" />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1 transition-colors duration-300",
                    step > s.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <Card className="p-6 bg-muted/30">
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Nom de l&apos;organisation
                </label>
                <Input
                  placeholder="Ex: Acme Corp, Ma Boutique…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Vous pourrez le modifier plus tard.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Catégorie d&apos;activité
                </label>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <SmartSelector
                    items={categoryItems}
                    selectedIds={categoryId ? [categoryId] : []}
                    onChange={(ids) => setCategoryId(ids[0] || "")}
                    placeholder="Sélectionner une catégorie…"
                    accentColor="primary"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Optionnel — aide à organiser vos espaces.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Modules */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Modules à activer
                </label>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez les domaines métier que vous souhaitez utiliser. Vous pourrez en
                  ajouter ou retirer plus tard depuis les paramètres de l'organisation.
                </p>
              </div>

              {modulesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : modules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aucun module disponible.
                </p>
              ) : (
                <div className="space-y-2">
                  {modules.map((m) => {
                    const Icon = MODULE_ICONS[m.code] ?? Blocks;
                    const isSelected = selectedModules.includes(m.code);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleModule(m.code)}
                        className={cn(
                          "w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                          isSelected
                            ? "border-primary/60 bg-primary/5"
                            : "border-border/60 bg-background hover:border-border hover:bg-muted/40",
                        )}
                      >
                        <div
                          className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                            isSelected
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {m.name}
                            </span>
                            <span
                              className={cn(
                                "h-4 w-4 rounded-md border flex items-center justify-center transition-colors",
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-border bg-background",
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                          </div>
                          {m.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {m.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
                {selectedModules.length === 0
                  ? "Aucun module sélectionné — vous pourrez en activer plus tard."
                  : `${selectedModules.length} module${selectedModules.length > 1 ? "s" : ""} sélectionné${selectedModules.length > 1 ? "s" : ""}.`}
              </p>
            </div>
          )}

          {/* Step 4: Settings */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Pays</label>
                <SmartSelector
                  items={countryItems}
                  selectedIds={country ? [country] : []}
                  onChange={(ids) => setCountry(ids[0] || "")}
                  placeholder="Sélectionner un pays…"
                  accentColor="blue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Devise</label>
                <SmartSelector
                  items={currencyItems}
                  selectedIds={currency ? [currency] : []}
                  onChange={(ids) => setCurrency(ids[0] || "")}
                  placeholder="Sélectionner une devise…"
                  accentColor="green"
                />
              </div>
            </div>
          )}

          {/* Step 5: Finalization */}
          {step === LAST_FORM_STEP + 1 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <PartyPopper className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Félicitations !
                </h2>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{name}</span> a été créée avec succès.
                </p>
              </div>

              {/* Logo upload */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Ajoutez un logo pour personnaliser votre espace.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoSelect}
                />
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden border-2 border-primary/20">
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                      <button
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="absolute top-1 right-1 h-5 w-5 bg-background/80 rounded-full flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mx-auto flex flex-col items-center gap-2 py-6 px-8 border-2 border-dashed border-border/60 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Choisir un fichier</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 1 && step <= LAST_FORM_STEP ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-9 text-xs font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Retour
            </Button>
          ) : (
            <div />
          )}

          {step <= LAST_FORM_STEP ? (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canGoNext() || createMutation.isPending}
              className="h-9 text-xs font-medium ml-auto"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : step === LAST_FORM_STEP ? (
                <Check className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
              )}
              {step === LAST_FORM_STEP ? "Créer" : "Suivant"}
            </Button>
          ) : (
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/core/dashboard")}
                className="h-9 text-xs font-medium"
              >
                Passer
              </Button>
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={logoMutation.isPending}
                className="h-9 text-xs font-medium"
              >
                {logoMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                )}
                Terminer
              </Button>
            </div>
          )}
        </div>

        {/* Error display - Amélioré pour limites de plan */}
        {createMutation.isError && (
          <div className="space-y-3">
            {(() => {
              const rawError = createMutation.error;
              const message = getApiErrorMessage(rawError);
              const isPlanLimit = message.toLowerCase().includes("forfait") || 
                                  message.toLowerCase().includes("plan") ||
                                  message.toLowerCase().includes("limite");
              
              if (isPlanLimit) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Crown className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900">
                          Limite de forfait atteinte
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          {message}
                        </p>
                      </div>
                    </div>
                    <Button 
                      asChild 
                      size="sm" 
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      <Link href="/core/billing">
                        <Crown className="h-4 w-4 mr-2" />
                        Voir les forfaits disponibles
                      </Link>
                    </Button>
                  </div>
                );
              }
              
              return (
                <p className="text-sm text-destructive text-center">
                  {message || "Une erreur est survenue. Veuillez réessayer."}
                </p>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateOrganizationPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><span className="text-sm text-muted-foreground">Chargement…</span></div>}>
      <CreateOrganizationContent />
    </Suspense>
  );
}
