"use client";

/**
 * Sélecteur visuel des méthodes de paiement Djomy avec icônes et détails.
 * 
 * Méthodes supportées (d'après openapi-partner.json) :
 * - OM : Orange Money
 * - MOMO : MTN Mobile Money  
 * - KULU : Kulu Digital Pay
 * - SOUTRA_MONEY : Soutra Money
 * - PAYCARD : PayCard
 * - CARD : Carte bancaire (Visa/Mastercard)
 */

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreditCard, Wallet, Smartphone } from "lucide-react";

export type DjomyPaymentMethod = 
  | "OM" 
  | "MOMO" 
  | "KULU" 
  | "SOUTRA_MONEY" 
  | "PAYCARD" 
  | "CARD";

interface PaymentMethodConfig {
  code: DjomyPaymentMethod;
  name: string;
  description: string;
  icon: typeof Smartphone;
  color: string;
  bgColor: string;
  popular?: boolean;
  instant?: boolean;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    code: "OM",
    name: "Orange Money",
    description: "Paiement instantané via Orange Money",
    icon: Smartphone,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    popular: true,
    instant: true,
  },
  {
    code: "MOMO",
    name: "MTN Mobile Money",
    description: "Paiement sécurisé via MTN",
    icon: Smartphone,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    popular: true,
    instant: true,
  },
  {
    code: "KULU",
    name: "Kulu Pay",
    description: "Solution digitale Kulu",
    icon: Wallet,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    instant: true,
  },
  {
    code: "SOUTRA_MONEY",
    name: "Soutra Money",
    description: "Paiement via Soutra",
    icon: Wallet,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    code: "PAYCARD",
    name: "PayCard",
    description: "Carte prépayée PayCard",
    icon: CreditCard,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    code: "CARD",
    name: "Carte Bancaire",
    description: "Visa / Mastercard",
    icon: CreditCard,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
];

interface PaymentMethodSelectorProps {
  selectedMethods: DjomyPaymentMethod[];
  onChange: (methods: DjomyPaymentMethod[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function PaymentMethodSelector({
  selectedMethods,
  onChange,
  disabled,
  compact,
}: PaymentMethodSelectorProps) {
  const toggleMethod = (code: DjomyPaymentMethod) => {
    if (disabled) return;
    
    const isSelected = selectedMethods.includes(code);
    if (isSelected) {
      // Empêcher de tout déselectionner - garder au moins une méthode
      if (selectedMethods.length > 1) {
        onChange(selectedMethods.filter((m) => m !== code));
      }
    } else {
      onChange([...selectedMethods, code]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(PAYMENT_METHODS.map((m) => m.code));
  };

  const clearAll = () => {
    if (disabled) return;
    // Sélectionner les méthodes populaires par défaut
    const popular = PAYMENT_METHODS.filter((m) => m.popular).map((m) => m.code);
    onChange(popular.length > 0 ? popular : ["OM"]);
  };

  return (
    <div className="space-y-3">
      <div className={cn(
        "grid gap-3",
        compact 
          ? "grid-cols-2 sm:grid-cols-3" 
          : "grid-cols-1 sm:grid-cols-2"
      )}>
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethods.includes(method.code);

          return (
            <Card
              key={method.code}
              onClick={() => toggleMethod(method.code)}
              className={cn(
                "relative cursor-pointer transition-all duration-200",
                "hover:shadow-md",
                isSelected 
                  ? "ring-2 ring-primary border-primary" 
                  : "border-muted hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed hover:shadow-none",
                compact ? "p-3" : "p-4"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "rounded-lg p-2 shrink-0",
                    method.bgColor,
                    compact && "p-1.5"
                  )}
                >
                  <Icon className={cn("h-5 w-5", method.color, compact && "h-4 w-4")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-medium", compact ? "text-sm" : "text-base")}>
                      {method.name}
                    </span>
                    {method.popular && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        Populaire
                      </Badge>
                    )}
                  </div>
                  {!compact && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {method.description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Actions rapides */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {selectedMethods.length} méthode{selectedMethods.length > 1 ? "s" : ""} sélectionnée
          {selectedMethods.length > 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <button
            onClick={clearAll}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Réinitialiser
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={selectAll}
            disabled={disabled}
            className="text-primary hover:text-primary/80 font-medium disabled:opacity-50"
          >
            Tout sélectionner
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook utilitaire pour les méthodes de paiement par défaut
export function getDefaultPaymentMethods(): DjomyPaymentMethod[] {
  return ["OM", "MOMO"];
}

export function getAllPaymentMethods(): DjomyPaymentMethod[] {
  return PAYMENT_METHODS.map((m) => m.code);
}
