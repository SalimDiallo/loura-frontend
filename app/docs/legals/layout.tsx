"use client"
import Logo from '@/components/ui/Logo';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function LegalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <Logo showTitle className="flex items-center gap-2" />
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-border bg-background">
        <div className="container px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground sm:text-left w-full">
              © {new Date().getFullYear()} LouraTech. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <Link
                href="/docs/legals/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                CGU
              </Link>
              <Link
                href="/docs/legals/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}