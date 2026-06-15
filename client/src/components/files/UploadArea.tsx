import { useRef } from 'react';
import { UploadFileEntry } from '../../hooks/useUpload';
import { VALIDATION_CONSTANTS } from '../../utils/validation';

interface UploadAreaProps {
  entries: UploadFileEntry[];
  isUploading: boolean;
  onFilesSelected: (files: File[]) => void;
  onClear: () => void;
}

/**
 * Upload area with file picker button, size validation display,
 * and per-file progress indicators.
 *
 * Validates: max 10 files, each < 50MB.
 */
export default function UploadArea({
  entries,
  isUploading,
  onFilesSelected,
  onClear,
}: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    onFilesSelected(Array.from(fileList));
    // Reset input so same files can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gold-600 text-neutral-100 rounded-md hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Upload Files
        </button>

        <span className="text-xs text-neutral-500">
          Max {VALIDATION_CONSTANTS.MAX_BATCH_SIZE} files, {VALIDATION_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)} MB each
        </span>

        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-label="Select files to upload"
        />
      </div>

      {/* Progress entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <FileUploadEntry key={`${entry.file.name}-${index}`} entry={entry} />
          ))}

          {!isUploading && (
            <button
              onClick={onClear}
              className="text-xs text-neutral-500 hover:text-neutral-300 underline mt-2"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FileUploadEntry({ entry }: { entry: UploadFileEntry }) {
  const statusColors: Record<string, string> = {
    pending: 'text-neutral-400',
    uploading: 'text-info',
    confirming: 'text-gold-400',
    done: 'text-success',
    error: 'text-error',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    uploading: `Uploading ${entry.progress}%`,
    confirming: 'Confirming...',
    done: 'Done',
    error: entry.error || 'Failed',
  };

  return (
    <div className="flex items-center gap-3 bg-primary-700 rounded-md px-3 py-2">
      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-200 truncate">{entry.file.name}</p>
        <div className="mt-1 h-1.5 w-full bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              entry.status === 'error' ? 'bg-error' : 'bg-gold-500'
            }`}
            style={{ width: `${entry.progress}%` }}
            role="progressbar"
            aria-valuenow={entry.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Upload progress for ${entry.file.name}`}
          />
        </div>
      </div>

      {/* Status label */}
      <span className={`text-xs whitespace-nowrap ${statusColors[entry.status]}`}>
        {statusLabels[entry.status]}
      </span>
    </div>
  );
}
