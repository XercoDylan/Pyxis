import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCategoryFiles, PaginatedFilesResponse, downloadCategoryZip } from '../api/files';
import { useUpload } from '../hooks/useUpload';
import FileList from '../components/files/FileList';
import FileSearchBar from '../components/files/FileSearchBar';
import UploadArea from '../components/files/UploadArea';
import Pagination from '../components/shared/Pagination';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import EmptyState from '../components/shared/EmptyState';

export default function CategoryPage() {
  const { categoryId } = useParams<{
    courseId: string;
    yearId: string;
    categoryId: string;
  }>();

  const [data, setData] = useState<PaginatedFilesResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadFiles = useCallback(async () => {
    if (!categoryId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchCategoryFiles(categoryId, currentPage, 50);
      setData(result);
    } catch {
      setError('Failed to load files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, currentPage]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUploadComplete = useCallback(() => {
    // Refresh file list after uploads finish
    setCurrentPage(1);
    loadFiles();
  }, [loadFiles]);

  const { entries, isUploading, startUpload, clearEntries } = useUpload({
    categoryId: categoryId || '',
    onAllComplete: handleUploadComplete,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-8">
        <ErrorMessage message={error} onRetry={loadFiles} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with ZIP download */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-100">Files</h1>

        <a
          href={downloadCategoryZip(categoryId!)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 border border-neutral-600 text-neutral-200 rounded-md hover:bg-primary-600 transition-colors text-sm"
          download
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download ZIP
        </a>
      </div>

      {/* Upload area */}
      <UploadArea
        entries={entries}
        isUploading={isUploading}
        onFilesSelected={startUpload}
        onClear={clearEntries}
      />

      {/* Error banner (when data exists but refresh failed) */}
      {error && data && (
        <ErrorMessage message={error} onRetry={loadFiles} />
      )}

      {/* File list or empty state */}
      {data && data.files.length === 0 ? (
        <EmptyState message="No materials have been uploaded to this category" />
      ) : data ? (
        (() => {
          const filteredFiles = data.files.filter((f) =>
            f.filename.toLowerCase().includes(searchTerm.toLowerCase())
          );
          return (
            <>
              <FileSearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                totalFiles={data.files.length}
                matchedFiles={filteredFiles.length}
              />
              {filteredFiles.length === 0 && searchTerm !== '' ? (
                <EmptyState message="No files match your search" />
              ) : (
                <FileList files={filteredFiles} />
              )}
              <Pagination
                currentPage={currentPage}
                totalPages={data.totalPages}
                onPageChange={handlePageChange}
              />
            </>
          );
        })()
      ) : null}
    </div>
  );
}
