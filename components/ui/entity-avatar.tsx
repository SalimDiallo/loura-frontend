"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface EntityAvatarProps {
  src?: string | null;
  fallback: string; // Généralement "Prénom Nom"
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function EntityAvatar({
  src,
  fallback,
  size = "md",
  className,
}: EntityAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-16 w-16 text-lg",
    xl: "h-20 w-20 text-xl",
  };

  const initials = fallback
    ? fallback
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <Avatar className={cn(sizeClasses[size], "border border-border/50 shadow-sm", className)}>
      {src && <AvatarImage src={src} alt={fallback} className="object-cover" />}
      <AvatarFallback className="bg-primary/5 text-primary font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
