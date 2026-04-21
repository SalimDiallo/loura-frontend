"use client";

import { PageHeader, PageHeaderAction } from "@/components/ui/page-header";
import { ReactNode } from "react";

interface DetailPageLayoutProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  icon?: any;
  avatar?: ReactNode;
  badge?: ReactNode;
  actions?: PageHeaderAction[];
  children: ReactNode;
}

export function DetailPageLayout({
  title,
  subtitle,
  backLink,
  icon,
  avatar,
  badge,
  actions = [],
  children,
}: DetailPageLayoutProps) {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {avatar && <div className="shrink-0">{avatar}</div>}
        <div className="flex-1 min-w-0">
          <PageHeader
            title={title}
            subtitle={subtitle}
            backLink={backLink}
            icon={icon}
            badge={badge}
            actions={actions}
            className="space-y-2"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {children}
      </div>
    </div>
  );
}
