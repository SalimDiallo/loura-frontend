import { apiClient } from '@/lib/api/client';

export class PDFService {
  static async download(url: string, filename: string): Promise<void> {
    const blob = await apiClient.get<Blob>(url);
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }
}
