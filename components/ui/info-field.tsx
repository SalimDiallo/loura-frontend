import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface InfoFieldProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "inline" | "compact";
  className?: string;
  iconClassName?: string;
}

export function InfoField({
  label,
  value,
  icon: Icon,
  variant = "default",
  className,
  iconClassName,
}: InfoFieldProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center justify-between text-sm py-1", className)}>
        <span className="text-muted-foreground flex items-center gap-2">
          {Icon && <Icon className={cn("h-3.5 w-3.5", iconClassName)} />}
          {label}
        </span>
        <span className="font-medium">{value || <span className="italic text-muted-foreground font-normal">Non renseigné</span>}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3", className)}>
      {Icon && (
        <div className={cn("h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0", iconClassName)}>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">
          {label}
        </p>
        <div className="text-sm font-medium text-foreground truncate">
          {value || <span className="italic text-muted-foreground font-normal">Non renseigné</span>}
        </div>
      </div>
    </div>
  );
}
