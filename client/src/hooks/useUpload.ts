import { useState, useCallback } from 'react';
import { getUploadUrl, confirmUpload } from '../api/files';
import { isValidFileSize, isValidBatchSize } from '../utils/validation';

export type UploadFileStatus =
  | 'pending'
  | 'uploading'
  | 'confirming'
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
 * Hook managing the presigned URL upload flow:
 * 1. Validate files (max 10, each < 50MB)
 * 2. For each file: get presigned URL → PUT to S3 → confirm
 * 3. Track per-file status and progress
 */
export function useUpload({ categoryId, onAllComplete }: UseUploadOptions) {
  const [entries, setEntries] = useState<UploadFileEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const updateEntry = (index: number, updates: Partial<UploadFileEntry>) => {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry))
    );
  };

  const uploadSingleFile = async (file: File, index: number): Promise<void> => {
    try {
      // Step 1: Get presigned URL
      updateEntry(index, { status: 'uploading', progress: 0 });

      const data = await getUploadUrl({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
        categoryId,
      });

      // Step 2: PUT to S3 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', data.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            updateEntry(index, { progress });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
      });

      // Step 3: Confirm upload
      updateEntry(index, { status: 'confirming', progress: 100 });

      await confirmUpload({
        fileId: data.fileId,
        filename: file.name,
        s3Key: data.s3Key,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
        categoryId,
      });

      updateEntry(index, { status: 'done', progress: 100 });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload failed';
      updateEntry(index, { status: 'error', error: message });
    }
  };

  const startUpload = useCallback(
    async (files: File[]) => {
      // Validate batch size
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

      // Validate individual file sizes and build entries
      const newEntries: UploadFileEntry[] = files.map((file) => ({
        file,
        status: 'pending' as UploadFileStatus,
        progress: 0,
        error: !isValidFileSize(file.size)
          ? 'File exceeds the 50 MB size limit'
          : undefined,
      }));

      // Mark oversized files as errors
      const finalEntries = newEntries.map((entry) =>
        entry.error ? { ...entry, status: 'error' as UploadFileStatus } : entry
      );

      setEntries(finalEntries);
      setIsUploading(true);

      // Upload valid files
      const uploadPromises = finalEntries.map((entry, index) => {
        if (entry.status === 'error') return Promise.resolve();
        return uploadSingleFile(entry.file, index);
      });

      await Promise.all(uploadPromises);
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
