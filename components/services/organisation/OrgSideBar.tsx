"use client";

import { useOrgPermissions } from "@/components/permissions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { useOrganization } from "@/lib/hooks/core";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaArrowLeft,
  FaBox,
  FaBoxOpen,
  FaBriefcase,
  FaChartBar,
  FaChevronDown,
  FaClipboardList,
  FaCog,
  FaCreditCard,
  FaExclamationTriangle,
  FaReceipt,
  FaSearch,
  FaShoppingCart,
  FaTachometerAlt,
  FaTags,
  FaTimes,
  FaTruck,
  FaUmbrellaBeach,
  FaUserCheck,
  FaUsers,
  FaWallet,
  FaWarehouse
} from "react-icons/fa";

// ============================================================================
// RESIZE CONSTANTS
// ============================================================================

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 480;
const SIDEBAR_DEFAULT_WIDTH = 256; // 16rem
const SIDEBAR_WIDTH_STORAGE_KEY = "org-sidebar-width";

const clampWidth = (w: number) =>
  Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, w));

// ============================================================================
// TYPES
// ============================================================================

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  /**
   * Permission(s) requise(s) pour voir l'item.
   * Si absent, l'item est visible pour tout membre.
   * Si array, tout match (mode "any").
   */
  requiredPermission?: string | string[];
}

interface MenuGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
  defaultOpen?: boolean;
}

// ============================================================================
// MENU CONFIG
// ============================================================================

function buildMenuGroups(orgId: string): MenuGroup[] {
  const b = `/organisation/${orgId}`;

  return [
    {
      id: "general",
      title: "Général",
      icon: FaTachometerAlt,
      defaultOpen: true,
      items: [
        { title: "Tableau de bord", url: `${b}/dashboard`, icon: FaTachometerAlt },
      ],
    },
    {
      id: "hr",
      title: "Ressources humaines",
      icon: FaUsers,
      defaultOpen: false,
      items: [
        { title: "Vue d'ensemble", url: `${b}/hr`, icon: FaClipboardList },
        { title: "Départements", url: `${b}/hr/departments`, icon: FaBriefcase, requiredPermission: PERMISSIONS.HR.VIEW_EMPLOYEES },
        { title: "Postes", url: `${b}/hr/positions`, icon: FaBriefcase, requiredPermission: PERMISSIONS.HR.VIEW_EMPLOYEES },
        { title: "Employés", url: `${b}/hr/employees`, icon: FaUserCheck, requiredPermission: PERMISSIONS.HR.VIEW_EMPLOYEES },
        { title: "Rôles & Permissions", url: `${b}/hr/roles`, icon: FaBriefcase, requiredPermission: PERMISSIONS.HR.MANAGE_ROLES },
        { title: "Paie", url: `${b}/hr/payroll`, icon: FaCreditCard},
        { title: "Contrats", url: `${b}/hr/contracts`, icon: FaClipboardList },
        { title: "Congés", url: `${b}/hr/leaves`, icon: FaUmbrellaBeach },
        // { title: "Pointage", url: `${b}/hr/attendance`, icon: FaClock },
      ],
    },
    {
      id: "inventory",
      title: "Gestion des stocks",
      icon: FaBoxOpen,
      defaultOpen: false,
      items: [
        { title: "Vue d'ensemble", url: `${b}/inventory`, icon: FaClipboardList },
        { title: "Caisse", url: `${b}/inventory/pos`, icon: FaShoppingCart },
        { title: "Ventes", url: `${b}/inventory/sales`, icon: FaReceipt },
        { title: "Créances", url: `${b}/inventory/credit-sales`, icon: FaCreditCard },
        { title: "Approvisionnements", url: `${b}/inventory/purchase-orders`, icon: FaTruck },
        { title: "Dépenses", url: `${b}/inventory/expenses`, icon: FaWallet },
        { title: "Produits", url: `${b}/inventory/products`, icon: FaBox },
        { title: "Catégories", url: `${b}/inventory/categories`, icon: FaTags },
        { title: "Fournisseurs", url: `${b}/inventory/suppliers`, icon: FaUserCheck },
        { title: "Clients", url: `${b}/inventory/clients`, icon: FaUserCheck },
        { title: "Entrepôts", url: `${b}/inventory/warehouses`, icon: FaWarehouse },
        { title: "Inventaires", url: `${b}/inventory/inventories`, icon: FaBoxOpen },
        { title: "Alertes", url: `${b}/inventory/alerts`, icon: FaExclamationTriangle },
        { title: "Rapports", url: `${b}/inventory/reports`, icon: FaChartBar },
   
      ],
 
    },
    {
      id: "org",
      title: "Organisation",
      icon: FaCog,
      defaultOpen: true,
      items: [
        { title: "Paramètres", url: `${b}/settings`, icon: FaCog },
      ],
    },
  ];
}

// Add missing FaClock import for the "Pointage" menu entry

// ============================================================================
// ROUTE MATCHING
// ============================================================================

const EXACT_ROUTES = new Set(["/dashboard", "/inventory", "/hr"]);

function isRouteActive(pathname: string, url: string, base: string): boolean {
  if (pathname === url) return true;
  const relative = url.replace(base, "");
  if (EXACT_ROUTES.has(relative)) return false;
  return pathname.startsWith(url + "/");
}

// ============================================================================
// COLLAPSIBLE NAV GROUP
// ============================================================================

function NavGroup({
  group,
  orgId,
  pathname,
  query,
}: {
  group: MenuGroup;
  orgId: string;
  pathname: string;
  query: string;
}) {
  const base = `/organisation/${orgId}`;

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return group.items;
    return group.items.filter((i) => i.title.toLowerCase().includes(q));
  }, [group.items, query]);

  const hasActiveItem = useMemo(
    () => group.items.some((item) => isRouteActive(pathname, item.url, base)),
    [group.items, pathname, base]
  );

  const [open, setOpen] = useState(group.defaultOpen ?? true);
  // Auto-open when searching so matches are visible
  const isOpen = open || hasActiveItem || query.trim().length > 0;

  if (filteredItems.length === 0) return null;

  const GroupIcon = group.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setOpen}>
      <SidebarGroup className="py-0.5">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel
            className={cn(
              "cursor-pointer select-none h-8 gap-1.5 px-2",
              "hover:text-sidebar-foreground transition-colors duration-150",
              hasActiveItem && "text-sidebar-foreground/70"
            )}
          >
            <GroupIcon className="!size-3.5 opacity-50" />
            <span className="flex-1">{group.title}</span>
            <FaChevronDown
              className={cn(
                "!size-3 opacity-40 transition-transform duration-200",
                !isOpen && "-rotate-90"
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>

        <CollapsibleContent className="transition-all duration-200 ease-out data-[state=closed]:animate-none">
          <SidebarGroupContent className="mt-0.5">
            <SidebarMenu>
              {filteredItems.map((item) => {
                const active = isRouteActive(pathname, item.url, base);
                const ItemIcon = item.icon;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      size="sm"
                      className={cn(
                        "ml-1 text-sidebar-foreground/60",
                        active && "text-sidebar-foreground font-medium"
                      )}
                    >
                      <Link href={item.url}>
                        <ItemIcon className={cn(
                          "opacity-50",
                          active && "opacity-80"
                        )} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

// ============================================================================
// TOGGLE BUTTON
// ============================================================================

function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
        "text-sidebar-foreground/30 hover:text-sidebar-foreground/60",
        "hover:bg-sidebar-accent/50 transition-all duration-150"
      )}
      title={isCollapsed ? "Agrandir la navigation" : "Réduire la navigation"}
    >
      {isCollapsed ? (
        <FaAngleDoubleRight className="h-3.5 w-3.5" />
      ) : (
        <FaAngleDoubleLeft className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ============================================================================
// RESIZE HANDLE — remplace SidebarRail
// Drag = redimensionner, Click = toggle (en mode collapsed), Double-click = reset
// ============================================================================

function ResizeHandle({
  onResize,
  onResetWidth,
}: {
  onResize: (widthPx: number) => void;
  onResetWidth: () => void;
}) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const [isActive, setIsActive] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Toujours reset le flag de drag — sinon un drag précédent bloque le
      // click-to-toggle quand on re-clique sur le rail en mode collapsed.
      movedRef.current = false;
      // En mode collapsed, on ne drag pas : on laisse le click toggler.
      if (isCollapsed) return;
      e.preventDefault();
      draggingRef.current = true;
      setIsActive(true);
      const startX = e.clientX;
      const prevUserSelect = document.body.style.userSelect;
      const prevCursor = document.body.style.cursor;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      const onMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;
        if (Math.abs(ev.clientX - startX) > 3) movedRef.current = true;
        onResize(ev.clientX);
      };
      const onUp = () => {
        draggingRef.current = false;
        setIsActive(false);
        document.body.style.userSelect = prevUserSelect;
        document.body.style.cursor = prevCursor;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [isCollapsed, onResize]
  );

  const handleClick = useCallback(() => {
    // Click sans drag → toggle (utile surtout en mode collapsed)
    if (!movedRef.current) toggleSidebar();
  }, [toggleSidebar]);

  const handleDoubleClick = useCallback(() => {
    if (!isCollapsed) onResetWidth();
  }, [isCollapsed, onResetWidth]);

  return (
    <button
      type="button"
      aria-label={isCollapsed ? "Ouvrir la navigation" : "Redimensionner la navigation"}
      title={
        isCollapsed
          ? "Ouvrir la navigation"
          : "Glisser pour redimensionner · Double-clic pour réinitialiser"
      }
      tabIndex={-1}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-active={isActive ? "true" : "false"}
      className={cn(
        "group/rail absolute inset-y-0 -right-2 z-20 hidden w-3 sm:block",
        isCollapsed ? "cursor-e-resize" : "cursor-col-resize",
        "group-data-[collapsible=offcanvas]:hidden"
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2",
          "bg-sidebar-border/40 transition-all duration-150",
          "group-hover/rail:w-[2px] group-hover/rail:bg-sidebar-border",
          isActive && "w-[2px] bg-primary/60"
        )}
      />
    </button>
  );
}

// ============================================================================
// ORG SIDEBAR INNER
// ============================================================================

function OrgSideBarInner({
  onResize,
  onResetWidth,
}: {
  onResize: (widthPx: number) => void;
  onResetWidth: () => void;
}) {
  const params = useParams();
  const pathname = usePathname();
  const orgId = params.id as string;

  const { data: org } = useOrganization(orgId);
  const { canAny, isOwner, isLoading: permsLoading } = useOrgPermissions();

  const [query, setQuery] = useState("");

  const menuGroups = useMemo(() => {
    const allGroups = buildMenuGroups(orgId);
    // Ne pas filtrer tant que les permissions ne sont pas chargées (éviter un flash vide)
    if (permsLoading) return allGroups;

    return allGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!item.requiredPermission) return true;
          if (isOwner) return true;
          const perms = Array.isArray(item.requiredPermission)
            ? item.requiredPermission
            : [item.requiredPermission];
          return canAny(perms);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [orgId, canAny, isOwner, permsLoading]);

  const orgName = org?.name || "Organisation";
  const orgInitials = orgName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar collapsible="icon">
      {/* ── Header ──────────────────────────────────────── */}
      <SidebarHeader className="p-3 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Org avatar */}
          <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center overflow-hidden">
            {org?.logo ? (
              <img
                src={org.logo}
                alt={orgName}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <span className="text-sidebar-foreground font-semibold text-[10px] tracking-wide">
                {orgInitials}
              </span>
            )}
          </div>

          {/* Org info — hidden in icon mode */}
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-[13px] font-semibold text-sidebar-foreground truncate leading-tight">
              {orgName}
            </p>
            {org?.category && (
              <p className="text-[10px] text-sidebar-foreground/35 truncate leading-tight mt-0.5">
                {org.category.name}
              </p>
            )}
          </div>

          {/* Collapse toggle — hidden in icon mode */}
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarToggle />
          </div>
        </div>
      </SidebarHeader>

      {/* ── Subtle divider ──────────────────────────────── */}
      <div className="mx-3 h-px bg-sidebar-border/50 group-data-[collapsible=icon]:mx-1" />

      {/* ── Search filter — masqué en mode icon ─────────── */}
      <div className="px-3 pt-2 pb-1 group-data-[collapsible=icon]:hidden">
        <div className="relative">
          <FaSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-sidebar-foreground/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className={cn(
              "h-7 w-full rounded-md bg-sidebar-accent/30 pl-7 pr-7 text-[12px]",
              "text-sidebar-foreground placeholder:text-sidebar-foreground/30",
              "outline-none ring-0 border border-transparent",
              "focus:bg-sidebar-accent/50 focus:border-sidebar-border/60",
              "transition-colors duration-150"
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Effacer la recherche"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded flex items-center justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
            >
              <FaTimes className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <SidebarContent className="pt-1">
        {menuGroups.map((group) => (
          <NavGroup
            key={group.id}
            group={group}
            orgId={orgId}
            pathname={pathname}
            query={query}
          />
        ))}
        {query.trim() &&
          menuGroups.every(
            (g) =>
              !g.items.some((i) =>
                i.title.toLowerCase().includes(query.trim().toLowerCase())
              )
          ) && (
            <div className="px-4 py-3 text-center text-[11px] text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
              Aucun résultat pour «&nbsp;{query}&nbsp;»
            </div>
          )}
      </SidebarContent>

      {/* ── Subtle divider ──────────────────────────────── */}
      <div className="mx-3 h-px bg-sidebar-border/50 group-data-[collapsible=icon]:mx-1" />

      {/* ── Footer ──────────────────────────────────────── */}
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Mes organisations"
              size="sm"
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
            >
              <Link href="/core/dashboard">
                <FaArrowLeft className="opacity-60" />
                <span>Mes organisations</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <ResizeHandle onResize={onResize} onResetWidth={onResetWidth} />
    </Sidebar>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default function OrgSideBar({ children }: { children?: ReactNode }) {
  const [width, setWidth] = useState<number>(SIDEBAR_DEFAULT_WIDTH);
  const [hydrated, setHydrated] = useState(false);

  // Charger la largeur persistée après mount (évite tout mismatch SSR)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      if (raw) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) setWidth(clampWidth(n));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const handleResize = useCallback((px: number) => {
    const w = clampWidth(px);
    setWidth(w);
  }, []);

  const handleResetWidth = useCallback(() => {
    setWidth(SIDEBAR_DEFAULT_WIDTH);
  }, []);

  // Persister (débouncé naturellement par React batching)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
    } catch {
      /* ignore */
    }
  }, [width, hydrated]);

  const style = useMemo<CSSProperties>(
    () =>
      ({
        "--sidebar-width": `${width}px`,
      }) as CSSProperties,
    [width]
  );

  return (
    <SidebarProvider style={style}>
      <OrgSideBarInner onResize={handleResize} onResetWidth={handleResetWidth} />
      {children}
    </SidebarProvider>
  );
}
