"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Shield, CheckCircle2, Circle } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface Permission {
  id: string;
  codename: string;
  label: string;
  module: string;
}

interface PermissionsSelectorProps {
  permissions: Permission[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export function PermissionsSelector({
  permissions,
  selectedIds,
  onChange,
  className,
}: PermissionsSelectorProps) {
  const [search, setSearch] = useState("");

  // Groupement et filtrage des permissions
  const groupedPermissions = useMemo(() => {
    const filtered = permissions.filter(
      (p) =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.codename.toLowerCase().includes(search.toLowerCase()) ||
        p.module.toLowerCase().includes(search.toLowerCase())
    );

    return filtered.reduce((acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions, search]);

  const togglePermission = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onChange(newSelected);
  };

  const toggleModule = (module: string, perms: Permission[]) => {
    const moduleIds = perms.map((p) => p.id);
    const allSelected = moduleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Deselect all in module
      onChange(selectedIds.filter((id) => !moduleIds.includes(id)));
    } else {
      // Select all in module (avoid duplicates)
      const others = selectedIds.filter((id) => !moduleIds.includes(id));
      onChange([...others, ...moduleIds]);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une permission ou un module..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {Object.entries(groupedPermissions).map(([module, perms]) => {
          const selectedInModule = perms.filter((p) => selectedIds.includes(p.id));
          const isAllSelected = selectedInModule.length === perms.length && perms.length > 0;

          return (
            <div key={module} className="border rounded-xl overflow-hidden bg-card">
              {/* Module Header */}
              <div className={cn(
                "px-4 py-3 flex items-center justify-between border-b transition-colors",
                selectedInModule.length > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    selectedInModule.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider">{module}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedInModule.length} sur {perms.length} sélectionnées
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleModule(module, perms)}
                  className="text-xs h-8"
                >
                  {isAllSelected ? "Tout décocher" : "Tout cocher"}
                </Button>
              </div>

              {/* Permissions List */}
              <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                {perms.map((perm) => {
                  const isChecked = selectedIds.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border border-transparent",
                        isChecked 
                          ? "bg-primary/10 border-primary/20 shadow-sm" 
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-medium leading-none cursor-pointer block truncate">
                          {perm.label}
                        </Label>
                        <code className="text-[10px] text-muted-foreground block truncate mt-1">
                          {perm.codename}
                        </code>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {Object.keys(groupedPermissions).length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-xl">
            <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucune permission ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
