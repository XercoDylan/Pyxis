import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getYearFolder, toggleYearCompletion } from '../api/yearFolders';
import { YearFolderWithCategories } from '../types';
import CategoryList from '../components/categories/CategoryList';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import EmptyState from '../components/shared/EmptyState';
import Toast from '../components/shared/Toast';

export default function YearPage() {
  const { courseId, yearId } = useParams<{ courseId: string; yearId: string }>();
  const [yearFolder, setYearFolder] = useState<YearFolderWithCategories | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchYearFolder = useCallback(async () => {
    if (!yearId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getYearFolder(yearId);
      setYearFolder(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load year folder'
      );
    } finally {
      setIsLoading(false);
    }
  }, [yearId]);

  useEffect(() => {
    fetchYearFolder();
  }, [fetchYearFolder]);

  const handleToggleCompletion = async () => {
    if (!yearFolder || !yearId || isToggling) return;

    const previousState = yearFolder.isComplete;
    const newState = !previousState;

    // Optimistic UI update
    setYearFolder({ ...yearFolder, isComplete: newState });
    setIsToggling(true);

    try {
      await toggleYearCompletion(yearId, newState);
    } catch {
      // Rollback on failure
      setYearFolder({ ...yearFolder, isComplete: previousState });
      setToastMessage('Failed to update completion status. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorMessage message={error} onRetry={fetchYearFolder} />
      </div>
    );
  }

  if (!yearFolder) {
    return (
      <div className="py-8">
        <ErrorMessage message="Year folder not found" />
      </div>
    );
  }

  const sortedCategories = [...yearFolder.categories].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-6">
      {/* Year header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-100">
          {yearFolder.year}
        </h1>

        <button
          onClick={handleToggleCompletion}
          disabled={isToggling}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            yearFolder.isComplete
              ? 'bg-green-700 text-green-100 hover:bg-green-600 border border-green-600'
              : 'bg-primary-700 text-neutral-200 hover:bg-primary-600 border border-neutral-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {yearFolder.isComplete ? (
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {yearFolder.isComplete ? 'Mark as Incomplete' : 'Mark as Complete'}
        </button>
      </div>

      {/* Category list */}
      {sortedCategories.length === 0 ? (
        <EmptyState message="No categories found for this year." />
      ) : (
        <CategoryList
          categories={sortedCategories}
          courseId={courseId!}
          yearId={yearId!}
        />
      )}

      {/* Toast notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
