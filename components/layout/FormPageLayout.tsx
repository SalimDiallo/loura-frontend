"use client";

import { PageHeader, PageHeaderAction } from "@/components/ui/page-header";
import { ReactNode } from "react";

interface FormPageLayoutProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  actions?: PageHeaderAction[];
  sidebar?: ReactNode;
  children: ReactNode;
  infoBanner?: ReactNode;
}

export function FormPageLayout({
  title,
  subtitle,
  backLink,
  actions = [],
  sidebar,
  children,
  infoBanner,
}: FormPageLayoutProps) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        backLink={backLink}
        actions={actions}
      />

      {infoBanner && <div>{infoBanner}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {children}
        </div>
        {sidebar && (
          <div className="space-y-6">
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
}
