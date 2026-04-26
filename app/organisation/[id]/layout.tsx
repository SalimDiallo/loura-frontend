"use client";

import AppHeader from "@/components/AppHeader";
import { PermissionsProvider } from "@/components/permissions";
import OrgSideBar from "@/components/services/organisation/OrgSideBar";
import TourProvider from "@/components/services/organisation/TourProvider";
import { SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactNode } from "react";

export default function OrganisationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TooltipProvider>
      <PermissionsProvider>
        <TourProvider>
          <OrgSideBar>
            <SidebarInset>
              <AppHeader />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </SidebarInset>
          </OrgSideBar>
        </TourProvider>
      </PermissionsProvider>
    </TooltipProvider>
  );
}