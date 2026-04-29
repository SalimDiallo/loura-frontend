"use client";

import { Badge } from "@/components/ui/badge";
import type {
  ServiceEnrollmentStatus,
  ServiceModuleInstanceStatus,
  ServicePaymentMode,
  ServiceTransactionStatus,
  ServiceTransactionType,
} from "@/lib/types";
import {
  FaBan,
  FaCheck,
  FaClock,
  FaCoins,
  FaExchangeAlt,
  FaForward,
  FaHandHoldingUsd,
  FaPause,
  FaPlay,
  FaRegMoneyBillAlt,
  FaShoppingBag,
  FaStop,
  FaTimes,
  FaUndo,
} from "react-icons/fa";

type Variant = {
  label: string;
  icon: React.ElementType;
  className: string;
};

const ENROLLMENT_VARIANTS: Record<ServiceEnrollmentStatus, Variant> = {
  pending: {
    label: "En attente",
    icon: FaClock,
    className:
      "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800",
  },
  in_progress: {
    label: "En cours",
    icon: FaPlay,
    className:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800",
  },
  completed: {
    label: "Terminée",
    icon: FaCheck,
    className:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800",
  },
  suspended: {
    label: "Suspendue",
    icon: FaPause,
    className:
      "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800",
  },
  cancelled: {
    label: "Annulée",
    icon: FaBan,
    className:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800",
  },
};

const MODULE_VARIANTS: Record<ServiceModuleInstanceStatus, Variant> = {
  pending: {
    label: "En attente",
    icon: FaClock,
    className:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700",
  },
  in_progress: {
    label: "En cours",
    icon: FaPlay,
    className:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800",
  },
  completed: {
    label: "Terminé",
    icon: FaCheck,
    className:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800",
  },
  blocked: {
    label: "Bloqué",
    icon: FaStop,
    className:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800",
  },
  skipped: {
    label: "Ignoré",
    icon: FaForward,
    className:
      "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700",
  },
};

const TX_STATUS_VARIANTS: Record<ServiceTransactionStatus, Variant> = {
  pending: {
    label: "En attente",
    icon: FaClock,
    className:
      "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800",
  },
  confirmed: {
    label: "Validée",
    icon: FaCheck,
    className:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800",
  },
  cancelled: {
    label: "Annulée",
    icon: FaTimes,
    className:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800",
  },
};

const TX_TYPE_VARIANTS: Record<ServiceTransactionType, Variant> = {
  client_payment: {
    label: "Paiement client",
    icon: FaHandHoldingUsd,
    className:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800",
  },
  revenue: {
    label: "Revenu",
    icon: FaCoins,
    className:
      "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-200 dark:border-teal-800",
  },
  internal_expense: {
    label: "Dépense",
    icon: FaShoppingBag,
    className:
      "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800",
  },
  refund: {
    label: "Remboursement",
    icon: FaUndo,
    className:
      "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-200 dark:border-purple-800",
  },
};

const PAYMENT_MODE_VARIANTS: Record<ServicePaymentMode, Variant> = {
  global: {
    label: "Global",
    icon: FaRegMoneyBillAlt,
    className: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  per_step: {
    label: "Par étape",
    icon: FaExchangeAlt,
    className: "bg-cyan-50 text-cyan-800 border-cyan-200",
  },
  partial: {
    label: "Partiel libre",
    icon: FaRegMoneyBillAlt,
    className: "bg-pink-50 text-pink-800 border-pink-200",
  },
};

function StatusBadgeBase({
  variant,
  withIcon = true,
  className = "",
}: {
  variant: Variant;
  withIcon?: boolean;
  className?: string;
}) {
  const Icon = variant.icon;
  return (
    <Badge
      variant="outline"
      className={`gap-1 border px-2 py-0.5 ${variant.className} ${className}`.trim()}
      aria-label={variant.label}
    >
      {withIcon && <Icon className="h-3 w-3" aria-hidden />}
      {variant.label}
    </Badge>
  );
}

export function EnrollmentStatusBadge({
  status,
  className,
}: {
  status: ServiceEnrollmentStatus;
  className?: string;
}) {
  const variant = ENROLLMENT_VARIANTS[status];
  if (!variant) return null;
  return <StatusBadgeBase variant={variant} className={className} />;
}

export function ModuleStatusBadge({
  status,
  className,
  withIcon,
}: {
  status: ServiceModuleInstanceStatus;
  className?: string;
  withIcon?: boolean;
}) {
  const variant = MODULE_VARIANTS[status];
  if (!variant) return null;
  return (
    <StatusBadgeBase
      variant={variant}
      className={className}
      withIcon={withIcon}
    />
  );
}

export function TransactionStatusBadge({
  status,
  className,
}: {
  status: ServiceTransactionStatus;
  className?: string;
}) {
  const variant = TX_STATUS_VARIANTS[status];
  if (!variant) return null;
  return <StatusBadgeBase variant={variant} className={className} />;
}

export function TransactionTypeBadge({
  type,
  className,
}: {
  type: ServiceTransactionType;
  className?: string;
}) {
  const variant = TX_TYPE_VARIANTS[type];
  if (!variant) return null;
  return <StatusBadgeBase variant={variant} className={className} />;
}

export function PaymentModeBadge({
  mode,
  className,
}: {
  mode: ServicePaymentMode;
  className?: string;
}) {
  const variant = PAYMENT_MODE_VARIANTS[mode];
  if (!variant) return null;
  return <StatusBadgeBase variant={variant} className={className} />;
}

export function ProgressBar({
  value,
  className = "",
  label,
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between mb-1 text-xs text-muted-foreground">
          <span>{label}</span>
          <span>{safe.toFixed(0)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full bg-muted overflow-hidden"
      >
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}
