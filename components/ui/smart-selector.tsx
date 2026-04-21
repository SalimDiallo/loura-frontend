"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    Check,
    CheckCircle2,
    ChevronDown,
    Circle,
    Plus,
    Search,
    X
} from "lucide-react";
import React, { useMemo, useRef, useState } from "react";

export interface SmartSelectorItem {
  id: string;
  name: string;
  subtitle?: string;
  icon?: React.ElementType;
  group?: string;
  disabled?: boolean;
}

interface SmartSelectorProps {
  items: SmartSelectorItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  mode?: "dropdown" | "inline";
  accentColor?: "primary" | "blue" | "green" | "orange" | "purple";
  showGroups?: boolean;
  maxHeight?: string | number;
  className?: string;
  // Quick Create
  onCreate?: (name: string) => Promise<SmartSelectorItem | void>;
  createLabel?: string;
  canCreate?: boolean;
}

const accentClasses = {
  primary: {
    bg: "bg-primary/5",
    border: "border-primary/20",
    text: "text-primary",
    selected: "bg-primary/10 border-primary/30",
    icon: "text-primary",
  },
  blue: {
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    text: "text-blue-600",
    selected: "bg-blue-500/10 border-blue-500/30",
    icon: "text-blue-500",
  },
  green: {
    bg: "bg-green-500/5",
    border: "border-green-500/20",
    text: "text-green-600",
    selected: "bg-green-500/10 border-green-500/30",
    icon: "text-green-500",
  },
  orange: {
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
    text: "text-orange-600",
    selected: "bg-orange-500/10 border-orange-500/30",
    icon: "text-orange-500",
  },
  purple: {
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
    text: "text-purple-600",
    selected: "bg-purple-500/10 border-purple-500/30",
    icon: "text-purple-500",
  },
};

export function SmartSelector({
  items,
  selectedIds,
  onChange,
  multiple = false,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  mode = "dropdown",
  accentColor = "primary",
  showGroups = true,
  maxHeight = "400px",
  className,
  onCreate,
  createLabel = "Créer",
  canCreate = false,
}: SmartSelectorProps) {
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const accent = accentClasses[accentColor];

  // Add state to control DropdownMenu open/close
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
        item.group?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const groupedItems = useMemo(() => {
    if (!showGroups) return { "": filteredItems };
    return filteredItems.reduce((acc, item) => {
      const group = item.group || "";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {} as Record<string, SmartSelectorItem[]>);
  }, [filteredItems, showGroups]);

  // Keep ref for closing purposes if ever needed
  const triggerRef = useRef<HTMLDivElement>(null);

  const toggleItem = (id: string) => {
    if (multiple) {
      const newSelected = selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id];
      onChange(newSelected);
    } else {
      onChange([id]);
      setSearch("");
      // Mask the dropdown (close it) after selecting one
      setMenuOpen(false);
    }
  };

  const toggleGroup = (group: string, groupItems: SmartSelectorItem[]) => {
    const groupIds = groupItems.map((item) => item.id);
    const allSelected = groupIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      onChange(selectedIds.filter((id) => !groupIds.includes(id)));
    } else {
      const others = selectedIds.filter((id) => !groupIds.includes(id));
      onChange([...others, ...groupIds]);
    }
  };

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  const renderItem = (item: SmartSelectorItem) => {
    const isSelected = selectedIds.includes(item.id);
    const ItemIcon = item.icon || Circle;

    return (
      <div
        key={item.id}
        onClick={() => !item.disabled && toggleItem(item.id)}
        className={cn(
          "flex items-start gap-3 p-2.5 cursor-pointer transition-all border border-transparent",
          isSelected ? accent.selected : "hover:bg-muted/50",
          item.disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="mt-0.5 shrink-0">
          {multiple ? (
            <div className={cn(
              "h-4 w-4 border flex items-center justify-center transition-colors",
              isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
            )}>
              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
          ) : (
            isSelected ? (
              <CheckCircle2 className={cn("h-4 w-4", accent.icon)} />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/20" />
            )
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium leading-none truncate">
              {item.name}
            </span>
          </div>
          {item.subtitle && (
            <p className="text-[11px] text-muted-foreground truncate mt-1">
              {item.subtitle}
            </p>
          )}
        </div>
      </div>
    );
  };

  const content = (
    <div className="flex flex-col gap-3 h-full">
      {/* Search & Actions */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-50" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-8 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ScrollArea is handled below depending on mode */}
      {/* See new logic for inline mode scroll below */}
    </div>
  );

  if (mode === "inline") {
    // Correction du scroll : le secret c'est d'utiliser un parent flex, puis un enfant flex-grow et overflow-auto
    // comme ci-dessous :
    return (
      <div
        className={cn("p-4 border bg-card/50 flex flex-col", className)}
        style={{
          maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          height: maxHeight, // S'assurer que la carte occupe bien la height max
          overflow: "hidden",
        }}
      >
        {/* Search input (not scrollable) */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-50" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        {/* Options list is scrollable: utiliser un div flex-1 overflow-auto au lieu de ScrollArea */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "visible",
          }}
          className="pr-3 -mr-3"
        >
          <div className="space-y-4 pb-1">
            {Object.entries(groupedItems).map(([group, groupItems], groupIdx) => (
              <div key={group || groupIdx} className="space-y-2">
                {group && (
                  <div className="flex items-center justify-between px-1 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {group}
                    </h4>
                    {multiple && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group, groupItems);
                        }}
                        className="h-5 px-1.5 text-[10px] font-bold hover:bg-primary/10 hover:text-primary"
                      >
                        {groupItems.every((item) => selectedIds.includes(item.id))
                          ? "Tout désélectionner"
                          : "Tout sélectionner"}
                      </Button>
                    )}
                  </div>
                )}
                <div className={cn("grid gap-1", mode === "inline" && "grid-cols-1 md:grid-cols-2")}>
                  {groupItems.map(renderItem)}
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && !isCreating && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
                {canCreate && onCreate && search.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                    className="mt-3 gap-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {createLabel} "{search}"
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // dropdown mode: keep as before
  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <div
          ref={triggerRef}
          className={cn(
            "flex items-center justify-between px-3 py-2 border transition-all cursor-pointer group",
            "hover:border-primary/50 bg-background",
            selectedIds.length > 0 && accent.bg && accent.border
          )}
          onClick={() => setMenuOpen(true)}
        >
          <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
            {selectedIds.length === 0 ? (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            ) : multiple ? (
              selectedItems.map((item) => (
                <Badge
                  key={item.id}
                  variant="secondary"
                  className="h-6 px-2 gap-1 text-[11px] font-medium"
                >
                  {item.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItem(item.id);
                    }}
                  />
                </Badge>
              ))
            ) : (
              <div className="flex items-center gap-2">
                {(() => {
                  const SelectedIcon = selectedItems[0]?.icon;
                  return SelectedIcon && <SelectedIcon className={cn("h-4 w-4", accent.icon)} />;
                })()}
                <span className="text-sm font-medium truncate">{selectedItems[0]?.name}</span>
              </div>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-1 ml-2">
            {selectedIds.length > 0 && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
              />
            )}
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200"
            )} />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[350px] p-3 bg-background z-50 overflow-auto">
        {/* Use previous content pattern here for dropdown */}
        <div className="flex flex-col gap-3">
          {/* Search & Actions */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-50" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
          <ScrollArea style={{ maxHeight }} className="pr-3 -mr-3">
            <div className="space-y-4 pb-1">
              {Object.entries(groupedItems).map(([group, groupItems], groupIdx) => (
                <div key={group || groupIdx} className="space-y-2">
                  {group && (
                    <div className="flex items-center justify-between px-1 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {group}
                      </h4>
                      {multiple && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(group, groupItems);
                          }}
                          className="h-5 px-1.5 text-[10px] font-bold hover:bg-primary/10 hover:text-primary"
                        >
                          {groupItems.every((item) => selectedIds.includes(item.id))
                            ? "Tout désélectionner"
                            : "Tout sélectionner"}
                        </Button>
                      )}
                    </div>
                  )}
                  <div className={cn("grid gap-1", mode === "dropdown" ? "" : "grid-cols-1 md:grid-cols-2")}>
                    {groupItems.map(renderItem)}
                  </div>
             
                </div>
              ))}

              {filteredItems.length === 0 && !isCreating && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
                  {canCreate && onCreate && search.trim() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreating(true)}
                      className="mt-3 gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {createLabel} "{search}"
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
