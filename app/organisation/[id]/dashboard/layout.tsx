"use client";

import { ReactNode } from "react";

/**
 * Layout for Organisation Dashboard — handles fetching and business logic.
 * Passes current time and salutation props to the child "page" component.
 */
export default function OrganisationDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
 
  return (
    <>
      {children}
    </>
  );
}