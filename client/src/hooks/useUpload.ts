import { useState, useCallback } from 'react';
import { isValidFileSize, isValidBatchSize } from '../utils/validation';

export type UploadFileStatus =
  | 'pending'
  | 'uploading'
  | 'done'
  | 'error';

export interface UploadFileEntry {
  file: File;
  status: UploadFileStatus;
  progress: number;
  error?: string;
}

interface UseUploadOptions {
  categoryId: string;
  onAllComplete?: () => void;
}

/**
 * Hook managing file uploads via the server's direct upload endpoint.
 * Files are sent to POST /api/files/upload as multipart form data.
 */
export function useUpload({ categoryId, onAllComplete }: UseUploadOptions) {
  const [entries, setEntries] = useState<UploadFileEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const startUpload = useCallback(
    async (files: File[]) => {
      if (!isValidBatchSize(files.length)) {
        setEntries(
          files.map((file) => ({
            file,
            status: 'error' as UploadFileStatus,
            progress: 0,
            error: 'Maximum 10 files per upload',
          }))
        );
        return;
      }

      // Validate sizes and build entries
      const newEntries: UploadFileEntry[] = files.map((file) => ({
        file,
        status: (isValidFileSize(file.size) ? 'pending' : 'error') as UploadFileStatus,
        progress: 0,
        error: !isValidFileSize(file.size) ? 'File exceeds 50 MB limit' : undefined,
      }));

      setEntries(newEntries);
      setIsUploading(true);

      // Filter valid files
      const validFiles = files.filter((f) => isValidFileSize(f.size));

      if (validFiles.length === 0) {
        setIsUploading(false);
        return;
      }

      // Upload all valid files in one request
      const formData = new FormData();
      formData.append('categoryId', categoryId);
      for (const file of validFiles) {
        formData.append('files', file);
      }

      // Mark all valid files as uploading
      setEntries((prev) =>
        prev.map((e) =>
          e.status === 'pending' ? { ...e, status: 'uploading', progress: 50 } : e
        )
      );

      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          const msg = data?.error?.message || 'Upload failed';
          setEntries((prev) =>
            prev.map((e) =>
              e.status === 'uploading' ? { ...e, status: 'error', error: msg } : e
            )
          );
        } else {
          setEntries((prev) =>
            prev.map((e) =>
              e.status === 'uploading' ? { ...e, status: 'done', progress: 100 } : e
            )
          );
        }
      } catch {
        setEntries((prev) =>
          prev.map((e) =>
            e.status === 'uploading' ? { ...e, status: 'error', error: 'Network error' } : e
          )
        );
      }

      setIsUploading(false);
      onAllComplete?.();
    },
    [categoryId, onAllComplete]
  );

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    isUploading,
    startUpload,
    clearEntries,
  };
}
