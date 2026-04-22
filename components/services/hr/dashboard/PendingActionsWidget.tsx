"use client";

import { useHRPendingActions } from "@/lib/hooks/hr";
import type { HRPendingActions } from "@/lib/services/hr/analytics.service";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  CreditCard,
  FileText,
  Inbox,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { Widget, WidgetEmpty, WidgetError, WidgetLoading } from "./primitives";

interface Props {
  orgId: string;
}

interface Row {
  key: string;
  label: string;
  value: number;
  href: string;
  icon: ComponentType<{ className?: string }>;
  highlight?: boolean;
}

/**
 * Widget "Actions en attente" : liste adaptative selon les permissions.
 * Chaque entrée n'apparaît que si le backend la retourne
 * (cohérent avec la permission de l'utilisateur).
 */
export function PendingActionsWidget({ orgId }: Props) {
  const { data, isLoading, isError, error } = useHRPendingActions(orgId);

  return (
    <Widget
      title="À traiter"
      description="Demandes et échéances à votre attention"
      icon={Inbox}
    >
      {isLoading ? (
        <WidgetLoading rows={4} />
      ) : isError ? (
        <WidgetError message={error?.message} />
      ) : !data ? (
        <WidgetEmpty />
      ) : (
        <PendingActionsList orgId={orgId} data={data} />
      )}
    </Widget>
  );
}

function PendingActionsList({
  orgId,
  data,
}: {
  orgId: string;
  data: HRPendingActions;
}) {
  const base = `/organisation/${orgId}`;
  const rows: Row[] = [];

  if (typeof data.leaves_to_review === "number") {
    rows.push({
      key: "leaves_to_review",
      label: "Congés à valider",
      value: data.leaves_to_review,
      href: `${base}/hr/leaves`,
      icon: CalendarClock,
      highlight: data.leaves_to_review > 0,
    });
  }
  if (typeof data.advances_to_review === "number") {
    rows.push({
      key: "advances_to_review",
      label: "Avances à traiter",
      value: data.advances_to_review,
      href: `${base}/hr/payroll`,
      icon: Wallet,
      highlight: data.advances_to_review > 0,
    });
  }
  if (typeof data.payments_to_approve === "number") {
    rows.push({
      key: "payments_to_approve",
      label: "Paiements à approuver",
      value: data.payments_to_approve,
      href: `${base}/hr/payroll`,
      icon: CreditCard,
      highlight: data.payments_to_approve > 0,
    });
  }
  if (typeof data.contracts_ending === "number") {
    rows.push({
      key: "contracts_ending",
      label: "Contrats bientôt terminés",
      value: data.contracts_ending,
      href: `${base}/hr/contracts`,
      icon: FileText,
      highlight: data.contracts_ending > 0,
    });
  }
  if (typeof data.my_pending_leaves === "number" && data.my_pending_leaves > 0) {
    rows.push({
      key: "my_pending_leaves",
      label: "Mes demandes de congé en attente",
      value: data.my_pending_leaves,
      href: `${base}/hr/leaves`,
      icon: CalendarClock,
    });
  }
  if (
    typeof data.my_pending_advances === "number" &&
    data.my_pending_advances > 0
  ) {
    rows.push({
      key: "my_pending_advances",
      label: "Mes demandes d'avance en attente",
      value: data.my_pending_advances,
      href: `${base}/hr/payroll`,
      icon: Wallet,
    });
  }

  if (rows.length === 0) {
    return <WidgetEmpty message="Rien à traiter pour le moment." />;
  }

  return (
    <ul className="divide-y divide-border/60 -mx-5">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <li key={row.key}>
            <Link
              href={row.href}
              className={cn(
                "flex items-center justify-between gap-3 px-5 py-3",
                "hover:bg-muted/40 transition-colors",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate">
                  {row.label}
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  row.highlight ? "text-amber-600" : "text-muted-foreground",
                )}
              >
                {row.value.toLocaleString("fr-FR")}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
