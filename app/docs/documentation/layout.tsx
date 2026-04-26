"use client";

import DocsSidebar from "@/components/docs/DocsSidebar";
import Logo from "@/components/ui/Logo";
import Link from "next/link";
import type { ReactNode } from "react";
import { FaArrowLeft, FaGithub } from "react-icons/fa";

export default function DocsDocumentationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1400px] mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Logo
                showTitle
                className="[&_img]:h-7 [&_img]:w-auto"
              />
            </Link>
            <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground border-l border-border pl-4">
              Documentation
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
            >
              <FaGithub className="h-3.5 w-3.5" />
              GitHub
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
            >
              <FaArrowLeft className="h-3.5 w-3.5" />
              Accueil
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Body : Sidebar + Content ───────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto w-full flex-1 flex">
        {/* Sidebar gauche */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-4 pl-6">
            <DocsSidebar />
          </div>
        </aside>

        {/* Contenu */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} LouraTech — Documentation
          </p>
          <div className="flex gap-5 text-[11px]">
            <Link
              href="/docs/legals/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              CGU
            </Link>
            <Link
              href="/docs/legals/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
