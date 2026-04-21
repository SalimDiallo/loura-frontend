"use client";

import AppHeader from "@/components/AppHeader";
import OrgSideBar from "@/components/services/organisation/OrgSideBar";
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
      <OrgSideBar>
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </OrgSideBar>
    </TooltipProvider>
  );
}