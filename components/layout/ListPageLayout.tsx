import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader, PageHeaderAction } from "@/components/ui/page-header";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import React, { useEffect, useRef, useState } from "react";
import { FaFilter, FaSearch, FaTimes } from "react-icons/fa";

/* --------------------------
   PATTERN COMMUN POUR PAGES DE LISTES 
-------------------------- */

// Statistique réutilisable pour les pages de listes
export function ListStat({ label, value, icon }: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// Recherche + filtres réutilisable
export function ListSearchFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filtersOpen,
  onFiltersOpenChange,
  filtersAreActive,
  filters,
}: {
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  filtersAreActive: boolean;
  filters: React.ReactNode;
}) {
  const [collapseVisible, setCollapseVisible] = useState(filtersOpen);
  const collapseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCollapseVisible(filtersOpen);
  }, [filtersOpen]);

  // Gestion fermeture sur clic extérieur pour la zone collapse
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        collapseRef.current &&
        !collapseRef.current.contains(event.target as Node)
      ) {
        setCollapseVisible(false);
        onFiltersOpenChange(false);
      }
    }
    if (collapseVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [collapseVisible, onFiltersOpenChange]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
        {/* Barre de recherche */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            spellCheck={false}
          />
          {searchValue && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Effacer la recherche"
              onClick={() => onSearchChange("")}
              type="button"
              tabIndex={0}
            >
              <FaTimes className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Bouton Filtre à droite */}
        <div className="flex-shrink-0 relative">
          <Button
            size="icon"
            variant={filtersAreActive ? "secondary" : "ghost"}
            className={`ml-0 sm:ml-2 ${filtersAreActive ? "text-primary border border-primary/40" : ""}`}
            aria-label="Filtrer"
            onClick={() => {
              setCollapseVisible((pv) => !pv);
              onFiltersOpenChange(!collapseVisible);
            }}
          >
            <FaFilter className="h-5 w-5" />
            {filtersAreActive && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>
      </div>
      {/* Collapse sur toute la largeur */}
      <div
        ref={collapseRef}
        className={`transition-all duration-300 overflow-hidden bg-popover border mt-2 ${collapseVisible ? "max-h-[600px] opacity-100 p-4" : "max-h-0 opacity-0 p-0"
          } w-full`}
        style={{ width: "100%" }}
      >
        {collapseVisible &&
          <div className="space-y-4">{filters}</div>
        }
      </div>
    </div>
  );
}

// Table générique
export function ListTable({
  columns,
  data,
  onRowClick,
}: {
  columns: React.ReactNode[];
  data: any[];
  onRowClick?: (row: any) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col: any, i) =>
              React.cloneElement(col, { as: "th", key: i })
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIdx) => (
            <TableRow
              key={row.id || rowIdx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined}
            >
              {columns.map((col: any, colIdx) =>
                React.cloneElement(col, {
                  value: row,
                  as: "td",
                  key: colIdx,
                })
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Colonne de table générique
export function ListTableColumn({
  header,
  children,
  value,
  as = "td",
  align,
}: {
  header?: React.ReactNode;
  children: (props: { value: any }) => React.ReactNode;
  value?: any;
  as?: "td" | "th";
  align?: "right" | "left" | "center";
}) {
  if (as === "th") {
    return <TableHead className={align === "right" ? "text-right" : ""}>{header}</TableHead>;
  }
  return (
    <TableCell className={align === "right" ? "text-right" : ""}>
      {children({ value })}
    </TableCell>
  );
}

// Pagination générique
export function ListPagination({
  meta,
  onPageChange,
  onNext,
  onPrev,
}: {
  meta: any,
  onPageChange: (n: number) => void,
  onNext: () => void,
  onPrev: () => void,
}) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Page {meta.currentPage} sur {meta.totalPages} ({meta.totalItems} au total)
      </div>
      <nav className="flex items-center gap-1">
        <Button size="icon" variant="ghost" disabled={!meta.hasPreviousPage} onClick={onPrev} className="h-8 w-8">
          {"<"}
        </Button>
        {meta.currentPage > 2 && (
          <Button size="icon" variant="ghost" onClick={() => onPageChange(1)} className="h-8 w-8">
            1
          </Button>
        )}
        {meta.currentPage > 3 && <span className="px-1 text-muted-foreground">…</span>}
        {meta.currentPage > 1 && (
          <Button size="icon" variant="ghost" onClick={() => onPageChange(meta.currentPage - 1)} className="h-8 w-8">
            {meta.currentPage - 1}
          </Button>
        )}
        <Button size="icon" variant="secondary" disabled className="h-8 w-8">
          {meta.currentPage}
        </Button>
        {meta.currentPage < meta.totalPages && (
          <Button size="icon" variant="ghost" onClick={() => onPageChange(meta.currentPage + 1)} className="h-8 w-8">
            {meta.currentPage + 1}
          </Button>
        )}
        {meta.currentPage < meta.totalPages - 2 && <span className="px-1 text-muted-foreground">…</span>}
        {meta.currentPage < meta.totalPages - 1 && (
          <Button size="icon" variant="ghost" onClick={() => onPageChange(meta.totalPages)} className="h-8 w-8">
            {meta.totalPages}
          </Button>
        )}
        <Button size="icon" variant="ghost" disabled={!meta.hasNextPage} onClick={onNext} className="h-8 w-8">
          {">"}
        </Button>
      </nav>
    </div>
  );
}

// Layout principal de page de liste
export function ListPageLayout({
  title,
  icon,
  description,
  headerActions = [],
  stats = [],
  searchFilters,
  content,
}: {
  title: string;
  icon?: any;
  description?: string;
  headerActions?: PageHeaderAction[];
  stats?: React.ReactNode[];
  searchFilters?: React.ReactNode;
  content: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title={title}
        subtitle={description}
        icon={icon}
        actions={headerActions}
      />

      {stats && stats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, i) => (
            <React.Fragment key={i}>{stat}</React.Fragment>
          ))}
        </div>
      )}

      {searchFilters ? (
        <Card>
          <CardHeader>
            <CardTitle>Liste</CardTitle>
            <CardDescription>Recherchez et gérez vos éléments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {searchFilters}
            {content}
          </CardContent>
        </Card>
      ) : (
        content
      )}
    </div>
  );
}

// Re-export ListHeaderAction equivalent from PageHeader if needed, 
// but we prefer using PageHeaderAction interface now.