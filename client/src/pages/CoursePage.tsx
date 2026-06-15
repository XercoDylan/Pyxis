import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getCourse, CourseWithCategories } from '../api/courses';
import { downloadCourseZip } from '../api/files';
import CategoryList from '../components/categories/CategoryList';
import AddCategoryModal from '../components/categories/AddCategoryModal';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import EmptyState from '../components/shared/EmptyState';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseWithCategories | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getCourse(courseId);
      setCourse(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load course details'
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleCategoryAdded = () => {
    setIsAddCategoryOpen(false);
    fetchCourse();
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
        <ErrorMessage message={error} onRetry={fetchCourse} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-8">
        <ErrorMessage message="Course not found" />
      </div>
    );
  }

  const sortedCategories = [...course.categories].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-6">
      {/* Course header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">
            {course.courseNumber}
          </h1>
          <p className="text-neutral-400 text-sm mt-1">{course.courseName}</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={downloadCourseZip(courseId!)}
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
            Download All
          </a>

          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-600 text-neutral-100 rounded-md hover:bg-gold-500 transition-colors text-sm font-medium"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Category
          </button>
        </div>
      </div>

      {/* Category list */}
      {sortedCategories.length === 0 ? (
        <EmptyState
          message="No categories found for this course."
          action={{
            label: 'Add Category',
            onClick: () => setIsAddCategoryOpen(true),
          }}
        />
      ) : (
        <CategoryList
          categories={sortedCategories}
          courseId={course.id}
        />
      )}

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onCategoryAdded={handleCategoryAdded}
        courseId={course.id}
      />
    </div>
  );
}
