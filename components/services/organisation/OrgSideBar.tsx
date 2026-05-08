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
    SidebarMenuAction,
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
    FaRegClock,
    FaRegStar,
    FaSearch,
    FaShoppingCart,
    FaSitemap,
    FaStar,
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
const SIDEBAR_FAVORITES_KEY = "org-sidebar-favorites";
const SIDEBAR_RECENTS_KEY = "org-sidebar-recents";
const SIDEBAR_GROUPS_OPEN_KEY = "org-sidebar-groups-open";
const RECENTS_LIMIT = 5;

const clampWidth = (w: number) =>
  Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, w));

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// ============================================================================
// SMART SIDEBAR HOOK — favorites, recents, group state (per-org)
// ============================================================================

interface SmartSidebarState {
  favorites: string[];
  recents: string[];
  groupsOpen: Record<string, boolean>;
  toggleFavorite: (url: string) => void;
  isFavorite: (url: string) => boolean;
  trackVisit: (url: string) => void;
  setGroupOpen: (id: string, open: boolean) => void;
}

function useSmartSidebar(orgId: string): SmartSidebarState {
  const favKey = `${SIDEBAR_FAVORITES_KEY}:${orgId}`;
  const recKey = `${SIDEBAR_RECENTS_KEY}:${orgId}`;
  const grpKey = `${SIDEBAR_GROUPS_OPEN_KEY}:${orgId}`;

  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFavorites(readJSON<string[]>(favKey, []));
    setRecents(readJSON<string[]>(recKey, []));
    setGroupsOpen(readJSON<Record<string, boolean>>(grpKey, {}));
  }, [favKey, recKey, grpKey]);

  const toggleFavorite = useCallback(
    (url: string) => {
      setFavorites((prev) => {
        const next = prev.includes(url)
          ? prev.filter((u) => u !== url)
          : [...prev, url];
        writeJSON(favKey, next);
        return next;
      });
    },
    [favKey]
  );

  const isFavorite = useCallback(
    (url: string) => favorites.includes(url),
    [favorites]
  );

  const trackVisit = useCallback(
    (url: string) => {
      setRecents((prev) => {
        const next = [url, ...prev.filter((u) => u !== url)].slice(
          0,
          RECENTS_LIMIT
        );
        writeJSON(recKey, next);
        return next;
      });
    },
    [recKey]
  );

  const setGroupOpen = useCallback(
    (id: string, open: boolean) => {
      setGroupsOpen((prev) => {
        const next = { ...prev, [id]: open };
        writeJSON(grpKey, next);
        return next;
      });
    },
    [grpKey]
  );

  return {
    favorites,
    recents,
    groupsOpen,
    toggleFavorite,
    isFavorite,
    trackVisit,
    setGroupOpen,
  };
}

// ============================================================================
// TYPES
// ============================================================================

interface MenuItem {
  title: string;
  active: string;
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
        { 
          title: "Tableau de bord", 
          url: `${b}/dashboard`, 
          icon: FaTachometerAlt,
          active: "/dashboard"
        },
      ],
    },
    {
      id: "hr",
      title: "Ressources humaines",
      icon: FaUsers,
      defaultOpen: false,
      requiredModule: "hr",
      items: [
        { 
          title: "Vue d'ensemble", 
          url: `${b}/hr`, 
          icon: FaClipboardList, 
          active: "/hr"
        },
        { 
          title: "Départements", 
          url: `${b}/hr/departments`, 
          icon: FaBriefcase, 
          requiredPermission: PERMISSIONS.HR.VIEW_EMPLOYEES,
          active: "/hr/departments"
        },
        { 
          title: "Postes", 
          url: `${b}/hr/positions`, 
          icon: FaBriefcase, 
          requiredPermission: PERMISSIONS.HR.VIEW_EMPLOYEES,
          active: "/hr/positions"
        },
        { 
          title: "Employés", 
          url: `${b}/hr/employees`, 
          icon: FaUserCheck, 
          requiredPermission: PERMISSIONS.HR.VIEW_EMPLOYEES,
          active: "/hr/employees"
        },
        { 
          title: "Rôles & Permissions", 
          url: `${b}/hr/roles`, 
          icon: FaBriefcase, 
          requiredPermission: PERMISSIONS.HR.MANAGE_ROLES,
          active: "/hr/roles"
        },
        { 
          title: "Paie", 
          url: `${b}/hr/payroll`, 
          icon: FaCreditCard,
          active: "/hr/payroll"
        },
        { 
          title: "Contrats", 
          url: `${b}/hr/contracts`, 
          icon: FaClipboardList,
          active: "/hr/contracts"
        },
        { 
          title: "Congés", 
          url: `${b}/hr/leaves`, 
          icon: FaUmbrellaBeach,
          active: "/hr/leaves"
        },
        {
          title: "Clients",
          url: `${b}/hr/clients`,
          icon: FaUserCheck,
          requiredPermission: PERMISSIONS.CUSTOMERS.VIEW,
          active: "/hr/clients"
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
          requiredPermission: PERMISSIONS.INVENTORY_REPORTS.VIEW,
          active: "/inventory"
        },
        { 
          title: "Caisse", 
          url: `${b}/inventory/pos`, 
          icon: FaShoppingCart, 
          requiredPermission: PERMISSIONS.SALES.VIEW,
          active: "/inventory/pos"
        },
        { 
          title: "Ventes", 
          url: `${b}/inventory/sales`, 
          icon: FaReceipt, 
          requiredPermission: PERMISSIONS.SALES.VIEW,
          active: "/inventory/sales"
        },
        { 
          title: "Créances", 
          url: `${b}/inventory/credit-sales`, 
          icon: FaCreditCard,
          requiredPermission: PERMISSIONS.SALES.VIEW,
          active: "/inventory/credit-sales"
        },
        { 
          title: "Approvisionnements", 
          url: `${b}/inventory/purchase-orders`, 
          icon: FaTruck,
          requiredPermission: PERMISSIONS.PURCHASE_ORDERS.VIEW,
          active: "/inventory/purchase-orders"
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
          requiredPermission: PERMISSIONS.PRODUCTS.VIEW,
          active: "/inventory/products"
        },
        { 
          title: "Catégories", 
          url: `${b}/inventory/categories`, 
          icon: FaTags,
          requiredPermission: PERMISSIONS.PRODUCT_CATEGORIES.VIEW,
          active: "/inventory/categories"
        },
        { 
          title: "Fournisseurs", 
          url: `${b}/inventory/suppliers`, 
          icon: FaUserCheck,
          requiredPermission: PERMISSIONS.SUPPLIERS.VIEW,
          active: "/inventory/suppliers"
        },
        { 
          title: "Devis & Pro Forma", 
          url: `${b}/inventory/quotes`, 
          icon: FaDochub,
          requiredPermission: PERMISSIONS.SALES.VIEW,
          active: "/inventory/quotes"
        },
        {
          title: "Entrepôts",
          url: `${b}/inventory/warehouses`, 
          icon: FaWarehouse,
          requiredPermission: PERMISSIONS.WAREHOUSES.VIEW,
          active: "/inventory/warehouses"
        },
        { 
          title: "Inventaires (Stock)", 
          url: `${b}/inventory/inventories`, 
          icon: FaBoxOpen,
          requiredPermission: PERMISSIONS.STOCK.VIEW,
          active: "/inventory/inventories"
        },
        { 
          title: "Inventaires physiques", 
          url: `${b}/inventory/physical-inventories`, 
          icon: FaClipboardCheck, 
          requiredPermission: PERMISSIONS.STOCK.VIEW,
          active: "/inventory/physical-inventories"
        },
        { 
          title: "Alertes", 
          url: `${b}/inventory/alerts`, 
          icon: FaExclamationTriangle,
          requiredPermission: PERMISSIONS.STOCK.VIEW,
          active: "/inventory/alerts"
        },
        {
          title: "Dépenses",
          url: `${b}/inventory/expenses`,
          icon: FaCoins,
          requiredPermission: PERMISSIONS.EXPENSES.VIEW,
          active: "/inventory/expenses"
        },
        {
          title: "Rapports",
          url: `${b}/inventory/reports`,
          icon: FaChartBar,
          requiredPermission: PERMISSIONS.INVENTORY_REPORTS.VIEW,
          active: "/inventory/reports"
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
          active: "/services"
        },
        {
          title: "Catalogue",
          url: `${b}/services/catalog`,
          icon: FaConciergeBell,
          requiredPermission: PERMISSIONS.SERVICES.VIEW,
          active: "/services/catalog"
        },
        {
          title: "Catégories",
          url: `${b}/services/categories`,
          icon: FaSitemap,
          requiredPermission: PERMISSIONS.SERVICE_CATEGORIES.VIEW,
          active: "/services/categories"
        },
        {
          title: "Dossiers clients",
          url: `${b}/services/enrollments`,
          icon: FaUserPlus,
          requiredPermission: PERMISSIONS.SERVICE_ENROLLMENTS.VIEW,
          active: "/services/enrollments"
        },
        {
          title: "Workflow modules",
          url: `${b}/services/workflow`,
          icon: FaProjectDiagram,
          requiredPermission: PERMISSIONS.SERVICE_ENROLLMENTS.VIEW,
          active: "/services/workflow"
        },
        {
          title: "Transactions",
          url: `${b}/services/transactions`,
          icon: FaMoneyBillWave,
          requiredPermission: PERMISSIONS.SERVICE_TRANSACTIONS.VIEW,
          active: "/services/transactions"
        },
        {
          title: "Journal d'activité",
          url: `${b}/services/activity`,
          icon: FaHistory,
          requiredPermission: PERMISSIONS.SERVICE_ENROLLMENTS.VIEW,
          active: "/services/activity"
        },
        {
          title: "Rapports",
          url: `${b}/services/reports`,
          icon: FaChartBar,
          requiredPermission: PERMISSIONS.SERVICE_REPORTS.VIEW,
          active: "/services/reports"
        },
      ],
    },
  ];
}

// ============================================================================
// ROUTE MATCHING
// ============================================================================

// ACTIVE: vérifie que pathname contient le champ "active" de l'item pour déterminer si c'est actif.
function isRouteActive(pathname: string, itemActive: string): boolean {
  // On considère l'item actif si "pathname" contient exactement le segment "active"
  // (ex: /inventory/products ou /hr/employees)
  if (!itemActive) return false;
  return pathname.includes(itemActive);
}

// ============================================================================
// COLLAPSIBLE NAV GROUP
// ============================================================================

interface SmartItemProps {
  item: MenuItem;
  active: boolean;
  isFavorite: boolean;
  onToggleFavorite: (url: string) => void;
  onLinkClick: (url: string) => void;
  showFavoriteToggle?: boolean;
}

function SmartMenuItem({
  item,
  active,
  isFavorite,
  onToggleFavorite,
  onLinkClick,
  showFavoriteToggle = true,
}: SmartItemProps) {
  const ItemIcon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.title}
        size="sm"
        className={cn(
          "ml-1 rounded-md text-sidebar-foreground/60 transition-all duration-150",
          active && [
            "bg-primary! text-white! font-semibold shadow-sm",
            "hover:bg-primary/90! hover:text-white!",
            "data-[active=true]:bg-primary! data-[active=true]:text-white!",
          ],
          !active && "hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        )}
      >
        <Link href={item.url} onClick={() => onLinkClick(item.url)} passHref>
          <ItemIcon
            className={cn(
              "opacity-50 transition-opacity",
              active && "opacity-100 text-white!"
            )}
          />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {showFavoriteToggle && (
        <SidebarMenuAction
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(item.url);
          }}
          aria-label={
            isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          title={isFavorite ? "Retirer des favoris" : "Épingler"}
          showOnHover={!isFavorite}
          className={cn(
            "transition-colors",
            isFavorite
              ? "text-amber-400 hover:text-amber-300"
              : "text-sidebar-foreground/40 hover:text-amber-400"
          )}
        >
          {isFavorite ? (
            <FaStar className="size-3" />
          ) : (
            <FaRegStar className="size-3" />
          )}
        </SidebarMenuAction>
      )}
    </SidebarMenuItem>
  );
}

function NavGroup({
  group,
  pathname,
  query,
  isOpen,
  onOpenChange,
  smart,
  onLinkClick,
}: {
  group: MenuGroup;
  pathname: string;
  query: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  smart: SmartSidebarState;
  onLinkClick: (url: string) => void;
}) {
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return group.items;
    return group.items.filter((i) => i.title.toLowerCase().includes(q));
  }, [group.items, query]);

  const hasActiveItem = useMemo(
    () => group.items.some((item) => isRouteActive(pathname, item.active)),
    [group.items, pathname]
  );

  // Auto-open when searching, when group has active item, or when explicitly opened.
  const effectiveOpen = isOpen || hasActiveItem || query.trim().length > 0;

  if (filteredItems.length === 0) return null;

  const GroupIcon = group.icon;

  return (
    <Collapsible open={effectiveOpen} onOpenChange={onOpenChange}>
      <SidebarGroup className="py-0.5" data-tour={`sidebar-group-${group.id}`}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel
            className={cn(
              "cursor-pointer select-none h-8 gap-1.5 px-2",
              "hover:text-sidebar-foreground transition-colors duration-150",
              hasActiveItem && "text-sidebar-foreground/70"
            )}
          >
            <GroupIcon className="size-3.5! opacity-50" />
            <span className="flex-1">{group.title}</span>
            <FaChevronDown
              className={cn(
                "size-3! opacity-40 transition-transform duration-200",
                !effectiveOpen && "-rotate-90"
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>

        <CollapsibleContent className="transition-all duration-200 ease-out data-[state=closed]:animate-none">
          <SidebarGroupContent className="mt-0.5">
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SmartMenuItem
                  key={item.url}
                  item={item}
                  active={isRouteActive(pathname, item.active)}
                  isFavorite={smart.isFavorite(item.url)}
                  onToggleFavorite={smart.toggleFavorite}
                  onLinkClick={onLinkClick}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

// ============================================================================
// SPECIAL GROUPS — Favorites + Recents
// ============================================================================

function SpecialGroup({
  id,
  title,
  Icon,
  items,
  pathname,
  isOpen,
  onOpenChange,
  smart,
  onLinkClick,
  emptyHint,
}: {
  id: string;
  title: string;
  Icon: React.ElementType;
  items: MenuItem[];
  pathname: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  smart: SmartSidebarState;
  onLinkClick: (url: string) => void;
  emptyHint?: string;
}) {
  if (items.length === 0 && !emptyHint) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <SidebarGroup className="py-0.5" data-tour={`sidebar-group-${id}`}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel
            className={cn(
              "cursor-pointer select-none h-8 gap-1.5 px-2",
              "hover:text-sidebar-foreground transition-colors duration-150"
            )}
          >
            <Icon className="size-3.5! opacity-50" />
            <span className="flex-1">{title}</span>
            <FaChevronDown
              className={cn(
                "size-3! opacity-40 transition-transform duration-200",
                !isOpen && "-rotate-90"
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>

        <CollapsibleContent className="transition-all duration-200 ease-out data-[state=closed]:animate-none">
          <SidebarGroupContent className="mt-0.5">
            <SidebarMenu>
              {items.map((item) => (
                <SmartMenuItem
                  key={`${id}-${item.url}`}
                  item={item}
                  active={isRouteActive(pathname, item.active)}
                  isFavorite={smart.isFavorite(item.url)}
                  onToggleFavorite={smart.toggleFavorite}
                  onLinkClick={onLinkClick}
                  showFavoriteToggle={id === "favorites"}
                />
              ))}
              {items.length === 0 && emptyHint && (
                <li className="px-3 py-1.5 text-[11px] text-sidebar-foreground/40">
                  {emptyHint}
                </li>
              )}
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

  const { setOpenMobile, isMobile } = useSidebar() as {
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
  };

  const smart = useSmartSidebar(orgId);

  // Handler to automatically collapse sidebar on mobile after link click
  // and track recent visits.
  const handleMenuLinkClick = useCallback(
    (url: string) => {
      smart.trackVisit(url);
      if (isMobile) setOpenMobile(false);
    },
    [isMobile, setOpenMobile, smart]
  );

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

  // URL → item lookup, only over visible items.
  const itemsByUrl = useMemo(() => {
    const map = new Map<string, MenuItem>();
    for (const g of menuGroups) for (const i of g.items) map.set(i.url, i);
    return map;
  }, [menuGroups]);

  const favoriteItems = useMemo(
    () =>
      smart.favorites
        .map((url) => itemsByUrl.get(url))
        .filter((i): i is MenuItem => Boolean(i)),
    [smart.favorites, itemsByUrl]
  );

  const recentItems = useMemo(
    () =>
      smart.recents
        .map((url) => itemsByUrl.get(url))
        .filter((i): i is MenuItem => Boolean(i)),
    [smart.recents, itemsByUrl]
  );

  // Filter favorites/recents by search query as well.
  const filteredFavorites = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favoriteItems;
    return favoriteItems.filter((i) => i.title.toLowerCase().includes(q));
  }, [favoriteItems, query]);

  const filteredRecents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recentItems;
    return recentItems.filter((i) => i.title.toLowerCase().includes(q));
  }, [recentItems, query]);

  // Auto-collapse intelligent: when pathname changes, ensure the group
  // containing the active route is open and others are closed (unless the
  // user explicitly opened them in this session). We treat persisted state
  // as the source of truth, but re-align it on navigation.
  const lastPathnameRef = useRef<string>("");
  useEffect(() => {
    if (!pathname || pathname === lastPathnameRef.current) return;
    lastPathnameRef.current = pathname;
    const activeGroupId = menuGroups.find((g) =>
      g.items.some((i) => isRouteActive(pathname, i.active))
    )?.id;
    if (!activeGroupId) return;
    // Open the active group, close other business groups (keep "general" + favorites/recents user state).
    for (const g of menuGroups) {
      const shouldOpen = g.id === activeGroupId || g.id === "general";
      if (smart.groupsOpen[g.id] !== shouldOpen) {
        smart.setGroupOpen(g.id, shouldOpen);
      }
    }
  }, [pathname, menuGroups, smart]);

  const isGroupOpen = useCallback(
    (g: MenuGroup) => {
      const stored = smart.groupsOpen[g.id];
      return stored ?? (g.defaultOpen ?? false);
    },
    [smart.groupsOpen]
  );

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
        {/* Favoris (épinglés par l'utilisateur) */}
        {filteredFavorites.length > 0 && (
          <SpecialGroup
            id="favorites"
            title="Favoris"
            Icon={FaStar}
            items={filteredFavorites}
            pathname={pathname}
            isOpen={smart.groupsOpen.favorites ?? true}
            onOpenChange={(o) => smart.setGroupOpen("favorites", o)}
            smart={smart}
            onLinkClick={handleMenuLinkClick}
          />
        )}

        {/* Récents (auto, masqué quand vide) */}
        {filteredRecents.length > 0 && !query.trim() && (
          <SpecialGroup
            id="recents"
            title="Récents"
            Icon={FaRegClock}
            items={filteredRecents}
            pathname={pathname}
            isOpen={smart.groupsOpen.recents ?? false}
            onOpenChange={(o) => smart.setGroupOpen("recents", o)}
            smart={smart}
            onLinkClick={handleMenuLinkClick}
          />
        )}

        {menuGroups.map((group) => (
          <NavGroup
            key={group.id}
            group={group}
            pathname={pathname}
            query={query}
            isOpen={isGroupOpen(group)}
            onOpenChange={(o) => smart.setGroupOpen(group.id, o)}
            smart={smart}
            onLinkClick={handleMenuLinkClick}
          />
        ))}
        {query.trim() &&
          filteredFavorites.length === 0 &&
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
                onClick={() => handleMenuLinkClick("/core/dashboard")}
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
