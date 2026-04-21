import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PermissionsBadgeListProps {
  permissions: string[];
  maxDisplay?: number;
  className?: string;
  variant?: "outline" | "secondary";
}

export function PermissionsBadgeList({
  permissions,
  maxDisplay = 6,
  className,
  variant = "outline",
}: PermissionsBadgeListProps) {
  if (!permissions || permissions.length === 0) {
    return <span className="text-xs text-muted-foreground italic">Aucune permission</span>;
  }

  const displayed = permissions.slice(0, maxDisplay);
  const hiddenCount = permissions.length - maxDisplay;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayed.map((codename) => (
        <Badge 
          key={codename} 
          variant={variant} 
          className="text-[10px] uppercase tracking-wider font-semibold py-0"
        >
          {codename.split('.').pop()?.replace(/_/g, ' ')}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge variant={variant} className="text-[10px] py-0">
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
}
