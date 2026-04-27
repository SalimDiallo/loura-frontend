'use client';

import { useState } from 'react';

export interface PDFPreviewState {
  isOpen: boolean;
  title: string;
  pdfUrl: string;
  filename: string;
}

const INITIAL_STATE: PDFPreviewState = {
  isOpen: false,
  title: '',
  pdfUrl: '',
  filename: '',
};

export function usePDF() {
  const [previewState, setPreviewState] = useState<PDFPreviewState>(INITIAL_STATE);

  const openPreview = (title: string, pdfUrl: string, filename: string) => {
    setPreviewState({ isOpen: true, title, pdfUrl, filename });
  };

  const closePreview = () => {
    setPreviewState(INITIAL_STATE);
  };

  return {
    previewState,
    openPreview,
    closePreview,
  };
}
