"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { COUNTRIES, CURRENCIES } from "@/lib/constants/core";
import { useCategories, useCreateOrganization, useUploadOrganizationLogo } from "@/lib/hooks/core";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Globe,
  ImagePlus,
  Loader2,
  PartyPopper,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

const STEPS = [
  { id: 1, label: "Nom", icon: Building2 },
  { id: 2, label: "Catégorie", icon: Check },
  { id: 3, label: "Paramètres", icon: Globe },
  { id: 4, label: "Finalisation", icon: Check },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export default function CreateOrganizationPage() {
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const createMutation = useCreateOrganization();
  const logoMutation = useUploadOrganizationLogo();

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
      case 3: return true;
      default: return false;
    }
  }, [step, name]);

  const handleNext = useCallback(async () => {
    if (step === 3) {
      // Create the organization
      try {
        const org = await createMutation.mutateAsync({
          name: name.trim(),
          category_id: categoryId || null,
          country,
          currency,
        });
        setCreatedOrgId(org.id);
        setStep(4);
      } catch {
        // Error is handled by mutation state
      }
    } else {
      setStep((s) => s + 1);
    }
  }, [step, name, categoryId, country, currency, createMutation]);

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
            {step < 4
              ? `Étape ${step} sur 3`
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

          {/* Step 3: Settings */}
          {step === 3 && (
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

          {/* Step 4: Finalization */}
          {step === 4 && (
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
          {step > 1 && step < 4 ? (
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

          {step < 4 ? (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canGoNext() || createMutation.isPending}
              className="h-9 text-xs font-medium ml-auto"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : step === 3 ? (
                <Check className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
              )}
              {step === 3 ? "Créer" : "Suivant"}
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

        {/* Error display */}
        {createMutation.isError && (
          <p className="text-xs text-red-500 text-center">
            Une erreur est survenue. Veuillez réessayer.
          </p>
        )}
      </div>
    </div>
  );
}
