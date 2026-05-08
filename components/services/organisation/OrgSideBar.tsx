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
import type { ModuleCode } from "@/lib/types/core";
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
    FaClipboardCheck,
    FaClipboardList,
    FaCoins,
    FaConciergeBell,
    FaCreditCard,
    FaDochub,
    FaExclamationTriangle,
    FaHistory,
    FaMoneyBillWave,
    FaProjectDiagram,
    FaReceipt,
    FaSearch,
    FaShoppingCart,
    FaSitemap,
    FaTachometerAlt,
    FaTags,
    FaTimes,
    FaTruck,
    FaUmbrellaBeach,
    FaUserCheck,
    FaUserPlus,
    FaUsers,
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
  requiredPermission?: string | string[];
}

interface MenuGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
  defaultOpen?: boolean;
  /** Si renseigné, le groupe n'est affiché que si le module correspondant
   *  est installé sur l'organisation. Les groupes "transverses" (ex :
   *  ``general``, ``org``) laissent ce champ à ``undefined``. */
  requiredModule?: ModuleCode;
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
      requiredModule: "hr",
      items: [
        { title: "Vue d'ensemble", url: `${b}/hr`, icon: FaClipboardList },
        { title: "Départements", url: `${b}/hr/departments`, icon: FaBriefcase, requiredPermission: PERMISSIONS.HR.VIEW_EMPLOYEES },
        { title: "Postes", url: `${b}/hr/positions`, icon: FaBriefcase, requiredPermission: PERMISSIONS.HR.VIEW_EMPLOYEES },
        { title: "Employés", url: `${b}/hr/employees`, icon: FaUserCheck, requiredPermission: PERMISSIONS.HR.VIEW_EMPLOYEES },
        { title: "Rôles & Permissions", url: `${b}/hr/roles`, icon: FaBriefcase, requiredPermission: PERMISSIONS.HR.MANAGE_ROLES },
        { title: "Paie", url: `${b}/hr/payroll`, icon: FaCreditCard},
        { title: "Contrats", url: `${b}/hr/contracts`, icon: FaClipboardList },
        { title: "Congés", url: `${b}/hr/leaves`, icon: FaUmbrellaBeach },
        {
          title: "Clients",
          url: `${b}/hr/clients`,
          icon: FaUserCheck,
          requiredPermission: PERMISSIONS.CUSTOMERS.VIEW,
        },
        // { title: "Pointage", url: `${b}/hr/attendance`, icon: FaClock },
      ],
    },
    {
      id: "inventory",
      title: "Gestion des stocks",
      icon: FaBoxOpen,
      defaultOpen: false,
      requiredModule: "inventory",
      items: [
        { 
          title: "Vue d'ensemble", 
          url: `${b}/inventory`, 
          icon: FaClipboardList, 
          requiredPermission: PERMISSIONS.INVENTORY_REPORTS.VIEW 
        },
        { 
          title: "Caisse", 
          url: `${b}/inventory/pos`, 
          icon: FaShoppingCart, 
          requiredPermission: PERMISSIONS.SALES.VIEW 
        },
        { 
          title: "Ventes", 
          url: `${b}/inventory/sales`, 
          icon: FaReceipt, 
          requiredPermission: PERMISSIONS.SALES.VIEW 
        },
        { 
          title: "Créances", 
          url: `${b}/inventory/credit-sales`, 
          icon: FaCreditCard,
          requiredPermission: PERMISSIONS.SALES.VIEW 
        },
        { 
          title: "Approvisionnements", 
          url: `${b}/inventory/purchase-orders`, 
          icon: FaTruck,
          requiredPermission: PERMISSIONS.PURCHASE_ORDERS.VIEW 
        },
        // { 
        //   title: "Dépenses", 
        //   url: `${b}/inventory/expenses`, 
        //   icon: FaWallet,
        //   requiredPermission: PERMISSIONS.PURCHASE_ORDERS.VIEW 
        // },
        { 
          title: "Produits", 
          url: `${b}/inventory/products`, 
          icon: FaBox, 
          requiredPermission: PERMISSIONS.PRODUCTS.VIEW 
        },
        { 
          title: "Catégories", 
          url: `${b}/inventory/categories`, 
          icon: FaTags,
          requiredPermission: PERMISSIONS.PRODUCT_CATEGORIES.VIEW 
        },
        { 
          title: "Fournisseurs", 
          url: `${b}/inventory/suppliers`, 
          icon: FaUserCheck,
          requiredPermission: PERMISSIONS.SUPPLIERS.VIEW 
        },
        { 
          title: "Devis & Pro Forma", 
          url: `${b}/inventory/quotes`, 
          icon: FaDochub,
          requiredPermission: PERMISSIONS.SALES.VIEW 
        },
        {
          title: "Entrepôts",
          url: `${b}/inventory/warehouses`, 
          icon: FaWarehouse,
          requiredPermission: PERMISSIONS.WAREHOUSES.VIEW 
        },
        { 
          title: "Inventaires (Stock)", 
          url: `${b}/inventory/inventories`, 
          icon: FaBoxOpen,
          requiredPermission: PERMISSIONS.STOCK.VIEW 
        },
        { 
          title: "Inventaires physiques", 
          url: `${b}/inventory/physical-inventories`, 
          icon: FaClipboardCheck, 
          requiredPermission: PERMISSIONS.STOCK.VIEW 
        },
        { 
          title: "Alertes", 
          url: `${b}/inventory/alerts`, 
          icon: FaExclamationTriangle,
          requiredPermission: PERMISSIONS.STOCK.VIEW 
        },
        {
          title: "Dépenses",
          url: `${b}/inventory/expenses`,
          icon: FaCoins,
          requiredPermission: PERMISSIONS.EXPENSES.VIEW
        },
        {
          title: "Rapports",
          url: `${b}/inventory/reports`,
          icon: FaChartBar,
          requiredPermission: PERMISSIONS.INVENTORY_REPORTS.VIEW
        },

      ],

    },
    {
      id: "services",
      title: "Services",
      icon: FaConciergeBell,
      defaultOpen: false,
      requiredModule: "services",
      items: [
        {
          title: "Vue d'ensemble",
          url: `${b}/services`,
          icon: FaClipboardList,
          requiredPermission: PERMISSIONS.SERVICES.VIEW,
        },
        {
          title: "Catalogue",
          url: `${b}/services/catalog`,
          icon: FaConciergeBell,
          requiredPermission: PERMISSIONS.SERVICES.VIEW,
        },
        {
          title: "Catégories",
          url: `${b}/services/categories`,
          icon: FaSitemap,
          requiredPermission: PERMISSIONS.SERVICE_CATEGORIES.VIEW,
        },
        {
          title: "Dossiers clients",
          url: `${b}/services/enrollments`,
          icon: FaUserPlus,
          requiredPermission: PERMISSIONS.SERVICE_ENROLLMENTS.VIEW,
        },
        {
          title: "Workflow modules",
          url: `${b}/services/workflow`,
          icon: FaProjectDiagram,
          requiredPermission: PERMISSIONS.SERVICE_ENROLLMENTS.VIEW,
        },
        {
          title: "Transactions",
          url: `${b}/services/transactions`,
          icon: FaMoneyBillWave,
          requiredPermission: PERMISSIONS.SERVICE_TRANSACTIONS.VIEW,
        },
        {
          title: "Journal d'activité",
          url: `${b}/services/activity`,
          icon: FaHistory,
          requiredPermission: PERMISSIONS.SERVICE_ENROLLMENTS.VIEW,
        },
        {
          title: "Rapports",
          url: `${b}/services/reports`,
          icon: FaChartBar,
          requiredPermission: PERMISSIONS.SERVICE_REPORTS.VIEW,
        },
      ],
    },
  ];
}

// ============================================================================
// ROUTE MATCHING
// ============================================================================

// Nouvelle logique pour "is active": juste un "pathname.includes(url)"
function isRouteActive(pathname: string, url: string, base: string): boolean {
  // On veut que le matching soit strict de path sur la partie "après orgId"
  // Ex: url="/organisation/ORGID/hr/roles", on veut matcher "hr/roles" dans pathname
  // On extrait le "sublink" de url après /organisation/ORGID/, et vérifie que ce sublink existe dans pathname
  const orgBase = `/organisation/${base.split('/').pop()}/`;
  const relUrl = url.startsWith(orgBase) ? url.slice(orgBase.length) : url;
  // On cherche un segment "/hr/roles", "/services/transactions", etc. dans le pathname
  return pathname.includes(`/${relUrl}`);
}

// ============================================================================
// COLLAPSIBLE NAV GROUP
// ============================================================================

function NavGroup({
  group,
  orgId,
  pathname,
  query,
  onMenuLinkClick
}: {
  group: MenuGroup;
  orgId: string;
  pathname: string;
  query: string;
  onMenuLinkClick?: () => void;
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
      <SidebarGroup className="py-0.5" data-tour={`sidebar-group-${group.id}`}>
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
                // Couleur d'item actif: couleur bg-primary (voir @app/globals.css: bg-primary et text-white)
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      size="sm"
                      className={cn(
                        "ml-1 text-sidebar-foreground/60",
                        active &&
                          "text-white font-semibold bg-primary hover:bg-primary/90",
                        // hover, focus styles en dehors de l'actif
                        !active && "hover:bg-sidebar-accent/60"
                      )}
                    >
                      <Link
                        href={item.url}
                        onClick={onMenuLinkClick}
                        passHref
                      >
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

export function SidebarToggle() {
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
// RESIZE HANDLE
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
      movedRef.current = false;
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

  const {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  } = useSidebar() as {
    state: "expanded" | "collapsed";
    open: boolean;
    setOpen: (open: boolean) => void;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    toggleSidebar: () => void;
  };

  // Handler to automatically collapse sidebar on mobile after link click
  const handleMenuLinkClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  const installedModules = useMemo<Set<string>>(
    () => new Set(org?.module_codes ?? []),
    [org?.module_codes],
  );

  const menuGroups = useMemo(() => {
    const allGroups = buildMenuGroups(orgId);
    if (permsLoading) return allGroups;

    return allGroups
      // 1) Filtre par module installé. Tant que l'org n'est pas chargée
      //    on n'affiche **que** les groupes transverses pour éviter un
      //    flash trompeur des sections métier.
      .filter((group) => {
        if (!group.requiredModule) return true;
        if (!org) return false;
        return installedModules.has(group.requiredModule);
      })
      // 2) Filtre par permission au niveau item.
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
  }, [orgId, canAny, isOwner, permsLoading, org, installedModules]);

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
      <SidebarHeader className="p-3 pb-2" data-tour="sidebar-header">
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

          {/* Org info */}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-sidebar-foreground truncate leading-tight">
              {orgName}
            </p>
            {org?.category && (
              <p className="text-[10px] text-sidebar-foreground/35 truncate leading-tight mt-0.5">
                {org.category.name}
              </p>
            )}
          </div>

          {/* Collapse toggle — always visible now */}
          <div>
            <SidebarToggle />
          </div>
        </div>
      </SidebarHeader>

      {/* ── Subtle divider ──────────────────────────────── */}
      <div className="mx-3 h-px bg-sidebar-border/50 group-data-[collapsible=icon]:mx-1" />

      {/* ── Search filter — masqué en mode icon ─────────── */}
      <div className="px-3 pt-2 pb-1 group-data-[collapsible=icon]:hidden" data-tour="sidebar-search">
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
            onMenuLinkClick={handleMenuLinkClick}
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
              <Link
                href="/core/dashboard"
                onClick={handleMenuLinkClick}
                passHref
              >
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
