'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, Image as ImageIcon, Loader2, Trash2, Upload, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from './alert-dialog';
import { Button } from './button';

export interface FileUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  onUpload?: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  accept?: string;
  maxSize?: number; // en MB
  disabled?: boolean;
  isUploading?: boolean;
  isDeleting?: boolean;
  uploadProgress?: number;
  className?: string;
  previewClassName?: string;
  label?: string;
  description?: string;
  error?: string;
  showDeleteButton?: boolean;
}

/**
 * Composant réutilisable pour l'upload de fichiers avec preview
 */
export function FileUpload({
  value,
  onChange,
  onUpload,
  onDelete,
  accept = 'image/*',
  maxSize = 5,
  disabled = false,
  isUploading = false,
  isDeleting = false,
  uploadProgress = 0,
  className,
  previewClassName,
  label,
  description,
  error,
  showDeleteButton = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      // Vérifier la taille
      if (file.size > maxSize * 1024 * 1024) {
        setErrorMessage(`Le fichier est trop volumineux. Taille maximale : ${maxSize}MB`);
        setShowErrorDialog(true);
        return;
      }

      // Créer le preview pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      onChange(file);

      // Uploader si la fonction est fournie
      if (onUpload) {
        onUpload(file);
      }
    },
    [maxSize, onChange, onUpload]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled || isUploading) return;

      const files = e.target.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && !isDeleting) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading, isDeleting]);

  const handleDelete = useCallback(async () => {
    if (onDelete) {
      await onDelete();
      setPreview(null);
      onChange(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
    setShowDeleteDialog(false);
  }, [onDelete, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
          disabled || isUploading || isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          error && 'border-destructive',
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled || isUploading || isDeleting}
          className="hidden"
        />

        {preview ? (
          <div className={cn('relative p-4', previewClassName)}>
            <div className="flex items-center justify-center">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 max-w-full rounded-lg object-contain"
              />
            </div>

            {!disabled && !isUploading && !isDeleting && (
              <div className="absolute top-2 right-2 flex gap-2">
                {showDeleteButton && onDelete && value && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">
                    Upload en cours... {uploadProgress}%
                  </p>
                </div>
              </div>
            )}

            {isDeleting && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">
                    Suppression en cours...
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Upload en cours...
                </p>
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  {accept.startsWith('image/') ? (
                    <ImageIcon className="h-8 w-8 text-primary" />
                  ) : (
                    <Upload className="h-8 w-8 text-primary" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Cliquez pour uploader ou glissez un fichier
                </p>
                <p className="text-xs text-muted-foreground">
                  Taille maximale : {maxSize}MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertCircle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Erreur d'upload</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              Compris
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Supprimer l'image</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
