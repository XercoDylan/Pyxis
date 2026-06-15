import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { CourseFile } from '../types';
import { fetchFileMetadata, getViewUrl } from '../api/files';
import { isViewableContentType, truncateFilename } from '../utils/formatting';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';

/**
 * FileViewerPage renders an inline preview for supported file formats
 * (PDF via <embed>, images via <img>) and a download button for all files.
 * Unsupported formats show a "cannot preview" message with a download option.
 */
export default function FileViewerPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const location = useLocation();

  const [file, setFile] = useState<CourseFile | null>(
    (location.state as { file?: CourseFile })?.file ?? null
  );
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Fetch metadata if not passed via route state
        const metadata = file ?? (await fetchFileMetadata(fileId!));
        if (cancelled) return;
        setFile(metadata);

        // Fetch view URL for viewable types
        if (isViewableContentType(metadata.contentType)) {
          const url = await getViewUrl(fileId!);
          if (cancelled) return;
          setViewUrl(url);
        }
      } catch (err) {
        if (cancelled) return;
        setError('Failed to load file. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  function handleRetry() {
    setFile((location.state as { file?: CourseFile })?.file ?? null);
    setViewUrl(null);
    setLoading(true);
    setError(null);
    // Re-trigger effect by forcing a state change
    setFile(null);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-neutral-400 text-sm">Loading file…</p>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorMessage
          message={error ?? 'File not found.'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const downloadUrl = `/api/files/${fileId}/download`;
  const viewable = isViewableContentType(file.contentType);
  const isPdf = file.contentType === 'application/pdf';

  return (
    <div className="space-y-4">
      {/* Header with filename and download button */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-100 truncate">
          {truncateFilename(file.filename)}
        </h1>
        <a
          href={downloadUrl}
          download={file.filename}
          className="inline-flex items-center gap-2 rounded-md bg-gold-600 px-4 py-2 text-sm font-medium text-primary-900 hover:bg-gold-500 transition-colors shrink-0"
        >
          <DownloadIcon />
          Download
        </a>
      </div>

      {/* Preview area */}
      {viewable ? (
        <div className="rounded-lg border border-neutral-700 bg-primary-700 overflow-hidden">
          {isPdf ? (
            <embed
              src={viewUrl!}
              type="application/pdf"
              className="w-full h-[80vh]"
              title={file.filename}
            />
          ) : (
            <div className="flex items-center justify-center p-4 min-h-[40vh]">
              <img
                src={viewUrl!}
                alt={file.filename}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-700 bg-primary-700 py-24 px-8">
          <NoPreviewIcon />
          <p className="mt-4 text-neutral-300 text-lg font-medium">
            This file cannot be previewed
          </p>
          <p className="mt-1 text-neutral-400 text-sm">
            The format "{file.contentType}" is not supported for inline viewing.
          </p>
          <a
            href={downloadUrl}
            download={file.filename}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-gold-600 px-5 py-2.5 text-sm font-medium text-primary-900 hover:bg-gold-500 transition-colors"
          >
            <DownloadIcon />
            Download File
          </a>
        </div>
      )}
    </div>
  );
}

/** Simple download icon (arrow pointing down into tray) */
function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Icon shown when file cannot be previewed */
function NoPreviewIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-16 w-16 text-neutral-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}
