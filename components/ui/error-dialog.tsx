'use client';

import { ApiError } from '@/lib/api/client';
import { AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from './alert-dialog';

export interface ErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error?: Error | ApiError | null;
  title?: string;
  description?: string;
  actionLabel?: string;
}

/**
 * Composant réutilisable pour afficher les erreurs dans un AlertDialog
 */
export function ErrorDialog({
  open,
  onOpenChange,
  error,
  title = 'Une erreur est survenue',
  description,
  actionLabel = 'Fermer',
}: ErrorDialogProps) {
  // Extraire le message d'erreur
  const getErrorMessage = () => {
    if (description) return description;

    if (error instanceof ApiError) {
      // Gérer les erreurs de validation multiples
      if (error.data?.errors) {
        const errors = error.data.errors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => {
            const msgs = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgs.join(', ')}`;
          })
          .join('\n');
        return errorMessages || error.message;
      }
      return error.message;
    }

    if (error) {
      return error.message;
    }

    return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {getErrorMessage()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook pour gérer l'affichage des erreurs dans un dialog
 */
export function useErrorDialog() {
  const [error, setError] = React.useState<Error | ApiError | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const showError = React.useCallback((err: Error | ApiError | string) => {
    if (typeof err === 'string') {
      setError(new Error(err));
    } else {
      setError(err);
    }
    setIsOpen(true);
  }, []);

  const hideError = React.useCallback(() => {
    setIsOpen(false);
    // Attendre que l'animation de fermeture se termine avant de nettoyer
    setTimeout(() => setError(null), 300);
  }, []);

  return {
    error,
    isOpen,
    showError,
    hideError,
    ErrorDialogComponent: (
      <ErrorDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        error={error}
      />
    ),
  };
}

// Import React pour le hook
import * as React from 'react';
