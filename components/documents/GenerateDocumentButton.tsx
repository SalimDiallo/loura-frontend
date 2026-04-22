"use client";

import { Button } from "@/components/ui/button";
import type { DocumentType } from "@/lib/services/core";
import { FileText } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

type ButtonOwnProps = ComponentProps<typeof Button>;

interface GenerateDocumentButtonProps
  extends Omit<ButtonOwnProps, "onClick" | "children"> {
  orgId: string;
  docType: DocumentType;
  objectId: string;
  /** Contenu du bouton. Si omis, label par défaut "Générer le document". */
  children?: ReactNode;
  /** Titre affiché dans le modal. */
  modalTitle?: string;
  /** Sous-titre du modal (ex: nom du membre). */
  modalSubtitle?: string;
  /** Masque l'icône `FileText` par défaut. */
  hideIcon?: boolean;
}

/**
 * Bouton clé-en-main qui, cliqué, ouvre le `DocumentPreviewModal` pour
 * l'objet et le type de document indiqués.
 */
export function GenerateDocumentButton({
  orgId,
  docType,
  objectId,
  children,
  modalTitle,
  modalSubtitle,
  hideIcon,
  className,
  variant = "outline",
  ...buttonProps
}: GenerateDocumentButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        {...buttonProps}
      >
        {!hideIcon && <FileText className="h-4 w-4" />}
        {children ?? "Générer le document"}
      </Button>
      <DocumentPreviewModal
        open={open}
        onOpenChange={setOpen}
        orgId={orgId}
        docType={docType}
        objectId={objectId}
        title={modalTitle}
        subtitle={modalSubtitle}
      />
    </>
  );
}
