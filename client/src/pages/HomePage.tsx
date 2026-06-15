import { useState, useEffect, useMemo } from 'react';
import { fetchCourses } from '../api/courses';
import { Course } from '../types';
import CourseGrid from '../components/courses/CourseGrid';
import SearchBar from '../components/courses/SearchBar';
import AddCourseModal from '../components/courses/AddCourseModal';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import EmptyState from '../components/shared/EmptyState';

/**
 * Filter courses by search term — case-insensitive substring match
 * on courseNumber or courseName.
 */
export function filterCourses(courses: Course[], searchTerm: string): Course[] {
  if (!searchTerm.trim()) return courses;
  const term = searchTerm.toLowerCase();
  return courses.filter(
    (course) =>
      course.courseNumber.toLowerCase().includes(term) ||
      course.courseName.toLowerCase().includes(term)
  );
}

/**
 * Sort courses alphabetically by course number.
 */
export function sortCourses(courses: Course[]): Course[] {
  return [...courses].sort((a, b) =>
    a.courseNumber.localeCompare(b.courseNumber)
  );
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadCourses() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCourses();
      setCourses(data);
    } catch {
      setError('Failed to load courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const sortedCourses = useMemo(() => sortCourses(courses), [courses]);
  const filteredCourses = useMemo(
    () => filterCourses(sortedCourses, searchTerm),
    [sortedCourses, searchTerm]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadCourses} />;
  }

  // Empty state — no courses exist at all
  if (courses.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-100">Courses</h1>
        </div>
        <EmptyState
          message="No courses have been added yet"
          action={{
            label: 'Add Course',
            onClick: () => setIsModalOpen(true),
          }}
        />
        <AddCourseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-100">Courses</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gold-600 text-neutral-100 rounded-md hover:bg-gold-500 transition-colors text-sm font-medium"
        >
          + Add Course
        </button>
      </div>

      <div className="mb-6">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-400 text-sm">No courses match your search</p>
        </div>
      ) : (
        <CourseGrid courses={filteredCourses} />
      )}

      <AddCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
