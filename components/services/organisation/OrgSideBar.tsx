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
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { useOrganization } from "@/lib/hooks/core";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
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
    FaReceipt,
    FaShoppingCart,
    FaTachometerAlt,
    FaTags,
    FaTruck,
    FaUmbrellaBeach,
    FaUserCheck,
    FaUsers,
    FaWallet,
    FaWarehouse,
} from "react-icons/fa";

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
        { title: "Caisse", url: `${b}/inventory/sales/quick`, icon: FaShoppingCart },
        { title: "Ventes", url: `${b}/inventory/sales`, icon: FaReceipt },
        { title: "Créances", url: `${b}/inventory/credit-sales`, icon: FaCreditCard },
        { title: "Approvisionnement", url: `${b}/inventory/orders`, icon: FaTruck },
        { title: "Dépenses", url: `${b}/inventory/expenses`, icon: FaWallet },
        { title: "Produits", url: `${b}/inventory/products`, icon: FaBox },
        { title: "Catégories", url: `${b}/inventory/categories`, icon: FaTags },
        { title: "Entrepôts", url: `${b}/inventory/warehouses`, icon: FaWarehouse },
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
}: {
  group: MenuGroup;
  orgId: string;
  pathname: string;
}) {
  const base = `/organisation/${orgId}`;

  const hasActiveItem = useMemo(
    () => group.items.some((item) => isRouteActive(pathname, item.url, base)),
    [group.items, pathname, base]
  );

  const [open, setOpen] = useState(group.defaultOpen ?? true);
  const isOpen = open || hasActiveItem;

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
              {group.items.map((item) => {
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
// ORG SIDEBAR INNER
// ============================================================================

function OrgSideBarInner() {
  const params = useParams();
  const pathname = usePathname();
  const orgId = params.id as string;

  const { data: org } = useOrganization(orgId);
  const { canAny, isOwner, isLoading: permsLoading } = useOrgPermissions();

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
          <div className="h-8 w-8 shrink-0 rounded-lg bg-sidebar-accent flex items-center justify-center overflow-hidden">
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

      {/* ── Navigation ──────────────────────────────────── */}
      <SidebarContent className="pt-1">
        {menuGroups.map((group) => (
          <NavGroup
            key={group.id}
            group={group}
            orgId={orgId}
            pathname={pathname}
          />
        ))}
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

      <SidebarRail />
    </Sidebar>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default function OrgSideBar({ children }: { children?: ReactNode }) {
  return (
    <SidebarProvider>
      <OrgSideBarInner />
      {children}
    </SidebarProvider>
  );
}
