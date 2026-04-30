"use client";

/**
 * Carte de statut de paiement améliorée avec visualisation de progression
 * et détails de la transaction Djomy.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DjomyTransaction } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    CreditCard,
    Loader2,
    RefreshCw,
    Shield,
    Smartphone,
    Wallet,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaymentStatusCardProps {
  transaction: DjomyTransaction | null | undefined;
  isLoading: boolean;
  onRetry?: () => void;
  error?: string;
}

type PaymentStep = {
  id: string;
  label: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "error";
};

// ─── Helper : icône de méthode de paiement ────────────────────────────────────

function getPaymentMethodIcon(method?: string) {
  switch (method?.toUpperCase()) {
    case "OM":
    case "MOMO":
    case "KULU":
    case "SOUTRA_MONEY":
      return Smartphone;
    case "CARD":
    case "PAYCARD":
      return CreditCard;
    default:
      return Wallet;
  }
}

// ─── Helper : statut en français ──────────────────────────────────────────────

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    CREATED: "Créée",
    REDIRECTED: "Redirigé",
    SUCCESS: "Réussi",
    CAPTURED: "Encaissé",
    FAILED: "Échoué",
    CANCELLED: "Annulé",
    TIMEOUT: "Délai dépassé",
    REFUNDED: "Remboursé",
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-500",
    CREATED: "bg-blue-500",
    REDIRECTED: "bg-blue-500",
    SUCCESS: "bg-emerald-500",
    CAPTURED: "bg-emerald-500",
    FAILED: "bg-red-500",
    CANCELLED: "bg-gray-500",
    TIMEOUT: "bg-orange-500",
    REFUNDED: "bg-purple-500",
  };
  return colors[status] || "bg-gray-500";
}

// ─── Composant : Étapes de paiement ───────────────────────────────────────────

function PaymentSteps({ transaction, isLoading }: { transaction: DjomyTransaction | null; isLoading: boolean }) {
  const getStepStatus = (stepId: string): PaymentStep["status"] => {
    if (!transaction) return isLoading ? "in-progress" : "pending";
    
    const status = transaction.status;
    const isTerminal = transaction.is_terminal;
    const isSuccess = transaction.is_successful;

    switch (stepId) {
      case "init":
        return "completed";
      case "redirect":
        if (["CREATED", "REDIRECTED", "PENDING"].includes(status)) return "in-progress";
        return "completed";
      case "payment":
        if (isSuccess) return "completed";
        if (isTerminal && !isSuccess) return "error";
        return "pending";
      case "confirmation":
        if (isSuccess) return "completed";
        if (isTerminal && !isSuccess) return "error";
        return "pending";
      default:
        return "pending";
    }
  };

  const steps: PaymentStep[] = [
    { id: "init", label: "Initialisation", description: "Transaction créée", status: getStepStatus("init") },
    { id: "redirect", label: "Redirection", description: "Vers Djomy", status: getStepStatus("redirect") },
    { id: "payment", label: "Paiement", description: "En cours chez l'opérateur", status: getStepStatus("payment") },
    { id: "confirmation", label: "Confirmation", description: "Finalisation", status: getStepStatus("confirmation") },
  ];

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const hasError = steps.some((s) => s.status === "error");
  const progress = hasError ? 100 : (completedCount / steps.length) * 100;

  return (
    <div className="space-y-4">
      <Progress 
        value={progress} 
        className={cn(
          "h-2",
          hasError && "bg-red-100 [&>div]:bg-red-500"
        )} 
      />
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step) => (
          <div key={step.id} className="text-center">
            <div
              className={cn(
                "mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-1.5",
                step.status === "completed" && "bg-emerald-100 text-emerald-600",
                step.status === "in-progress" && "bg-blue-100 text-blue-600 ring-2 ring-blue-500 ring-offset-2",
                step.status === "error" && "bg-red-100 text-red-600",
                step.status === "pending" && "bg-gray-100 text-gray-400"
              )}
            >
              {step.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : step.status === "error" ? (
                <XCircle className="h-4 w-4" />
              ) : step.status === "in-progress" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </div>
            <p className={cn(
              "text-xs font-medium",
              step.status === "pending" && "text-muted-foreground"
            )}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Composant principal : PaymentStatusCard ─────────────────────────────────

export function PaymentStatusCard({
  transaction,
  isLoading,
  onRetry,
  error,
}: PaymentStatusCardProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!transaction || transaction.is_terminal) return;
    
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [transaction]);

  // État de chargement
  if (isLoading || !transaction) {
    return (
      <Card className="border-blue-500/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle>Vérification du paiement...</CardTitle>
          <CardDescription>
            Nous confirmons votre transaction auprès de Djomy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentSteps transaction={null} isLoading={true} />
        </CardContent>
      </Card>
    );
  }

  const status = transaction.status;
  const isSuccess = transaction.is_successful;
  const isTerminal = transaction.is_terminal;
  const isPending = !isTerminal;

  // Paiement en cours
  if (isPending) {
    return (
      <Card className="border-blue-500/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle>Paiement en cours</CardTitle>
          <CardDescription>
            Statut : <Badge variant="outline">{getStatusLabel(status)}</Badge>
            {elapsed > 0 && (
              <span className="text-muted-foreground ml-2">
                ({Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PaymentSteps transaction={transaction} isLoading={false} />
          
          {/* Détails de la transaction */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Référence</span>
              <code className="bg-background px-2 py-1 rounded text-xs">
                {transaction.reference}
              </code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-medium">
                {transaction.amount} {transaction.currency}
              </span>
            </div>
            {transaction.payer_number && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Numéro</span>
                <span className="font-medium">{transaction.payer_number}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground text-center">
              Le traitement peut prendre jusqu'à 2 minutes selon l'opérateur.
            </p>
            <Button variant="outline" onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir le statut
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Paiement réussi
  if (isSuccess) {
    const PaymentIcon = getPaymentMethodIcon(transaction.allowed_payment_methods?.[0]);

    return (
      <Card className="border-emerald-500/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-emerald-700">Paiement réussi !</CardTitle>
          <CardDescription>
            Votre abonnement <strong>{transaction.plan_code}</strong> est maintenant actif.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Récapitulatif */}
          <div className="bg-emerald-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700">Montant payé</span>
              <span className="text-lg font-bold text-emerald-700">
                {transaction.amount} {transaction.currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600">Plan</span>
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-700">
                {transaction.plan_code} · {transaction.cycle}
              </Badge>
            </div>
            {transaction.payer_number && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-600">Payé depuis</span>
                <span className="text-emerald-700 flex items-center gap-1">
                  <PaymentIcon className="h-3.5 w-3.5" />
                  {transaction.payer_number}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600">Référence</span>
              <code className="text-xs bg-white px-2 py-1 rounded">
                {transaction.reference}
              </code>
            </div>
          </div>

          {/* Sécurité */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Transaction sécurisée via Djomy
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <Link href="/core/billing">Voir mon abonnement</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/core/dashboard">Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Échec ou erreur
  const isCancelled = status === "CANCELLED";
  const isTimeout = status === "TIMEOUT";

  return (
    <Card className="border-red-500/50">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          {isCancelled ? (
            <XCircle className="h-8 w-8 text-red-600" />
          ) : isTimeout ? (
            <Clock className="h-8 w-8 text-orange-600" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-red-600" />
          )}
        </div>
        <CardTitle className="text-red-700">
          {isCancelled ? "Paiement annulé" : isTimeout ? "Délai dépassé" : "Paiement échoué"}
        </CardTitle>
        <CardDescription>
          {isCancelled 
            ? "Vous avez annulé le paiement. Aucun montant n'a été débité."
            : isTimeout
            ? "Le délai de paiement a été dépassé. Veuillez réessayer."
            : "Le paiement n'a pas pu être traité. Veuillez réessayer."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <PaymentSteps transaction={transaction} isLoading={false} />

        {/* Détails de l'erreur */}
        {(error || transaction.last_status_payload) && (
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-700">
              {error || "Une erreur est survenue lors du traitement."}
            </p>
          </div>
        )}

        {/* Détails transaction */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Référence</span>
            <code className="bg-background px-2 py-1 rounded text-xs">
              {transaction.reference}
            </code>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Statut</span>
            <Badge variant="destructive">{getStatusLabel(status)}</Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button asChild className="flex-1" variant="default">
            <Link href={`/core/billing/upgrade/${transaction.plan_code}?cycle=${transaction.cycle}`}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/core/billing">Retour</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
