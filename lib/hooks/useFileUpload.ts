'use client';

import { apiClient } from '@/lib/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export interface FileUploadOptions {
  endpoint: string;
  maxSize?: number; // en MB
  acceptedTypes?: string[];
  onProgress?: (progress: number) => void;
}

export interface FileUploadResult {
  url: string;
  message: string;
}

/**
 * Hook réutilisable pour l'upload de fichiers
 */
export function useFileUpload(options: FileUploadOptions) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    // Vérifier la taille
    if (options.maxSize) {
      const maxSizeBytes = options.maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `Le fichier est trop volumineux. Taille maximale : ${options.maxSize}MB`;
      }
    }

    // Vérifier le type
    if (options.acceptedTypes && options.acceptedTypes.length > 0) {
      if (!options.acceptedTypes.includes(file.type)) {
        return `Type de fichier non autorisé. Types acceptés : ${options.acceptedTypes.join(', ')}`;
      }
    }

    return null;
  };

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<FileUploadResult> => {
      // Valider le fichier
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Créer le FormData
      const formData = new FormData();
      formData.append('file', file);

      // Uploader le fichier
      setUploadProgress(0);

      const response = await apiClient.post<{ message: string; data: any }>(
        options.endpoint,
        formData,
        {
          // Ne pas définir Content-Type pour FormData
          // Le navigateur va automatiquement ajouter le boundary
          headers: {},
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
              options.onProgress?.(progress);
            }
          },
        }
      );

      setUploadProgress(100);

      return {
        url: response.data.avatar_url || '',
        message: response.message,
      };
    },

    onSuccess: (data) => {
      // Invalider les queries concernées
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      // Dispatcher l'événement d'upload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('loura:file-uploaded', { detail: data })
        );
      }
    },

    onError: (error) => {
      console.error('File upload failed:', error);
      setUploadProgress(0);
    },
  });

  return {
    upload: mutation.mutate,
    uploadAsync: mutation.mutateAsync,
    isUploading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    uploadProgress,
    reset: mutation.reset,
  };
}
