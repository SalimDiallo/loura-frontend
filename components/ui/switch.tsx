"use client"

import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center border transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=unchecked]:border-input data-[state=unchecked]:bg-input data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block ring-0 shadow-sm transition-transform",
          "group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3",
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0.5",
          "bg-white data-[state=checked]:bg-primary-foreground"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch };
