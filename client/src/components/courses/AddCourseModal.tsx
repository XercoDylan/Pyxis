import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse } from '../../api/courses';
import { isValidCourseNumber, isValidCourseName } from '../../utils/validation';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCourseModal({ isOpen, onClose }: AddCourseModalProps) {
  const navigate = useNavigate();
  const [courseNumber, setCourseNumber] = useState('');
  const [courseName, setCourseName] = useState('');
  const [errors, setErrors] = useState<{ courseNumber?: string; courseName?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  function validate(): boolean {
    const newErrors: { courseNumber?: string; courseName?: string } = {};

    if (!courseNumber.trim()) {
      newErrors.courseNumber = 'Course number is required';
    } else if (!isValidCourseNumber(courseNumber.trim())) {
      newErrors.courseNumber = 'Course number must be at most 20 characters';
    }

    if (!courseName.trim()) {
      newErrors.courseName = 'Course name is required';
    } else if (!isValidCourseName(courseName.trim())) {
      newErrors.courseName = 'Course name must be at most 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const course = await createCourse({
        courseNumber: courseNumber.trim(),
        courseName: courseName.trim(),
      });
      onClose();
      navigate(`/courses/${course.id}`);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: { message?: string; code?: string } } } };
        const errorData = axiosErr.response?.data?.error;
        if (errorData?.code === 'COURSE_EXISTS') {
          setApiError('A course with this number already exists');
        } else {
          setApiError(errorData?.message || 'Failed to create course. Please try again.');
        }
      } else {
        setApiError('Failed to create course. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-course-title"
    >
      <div className="bg-primary-700 border border-neutral-700 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2
          id="add-course-title"
          className="text-xl font-semibold text-neutral-100 mb-4"
        >
          Add Course
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="courseNumber"
              className="block text-sm font-medium text-neutral-300 mb-1"
            >
              Course Number
            </label>
            <input
              id="courseNumber"
              type="text"
              value={courseNumber}
              onChange={(e) => setCourseNumber(e.target.value)}
              placeholder="e.g., 6.042"
              maxLength={20}
              className="w-full px-3 py-2 bg-primary-800 border border-neutral-600 rounded-md text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
              aria-invalid={!!errors.courseNumber}
              aria-describedby={errors.courseNumber ? 'courseNumber-error' : undefined}
            />
            {errors.courseNumber && (
              <p id="courseNumber-error" className="mt-1 text-sm text-error">
                {errors.courseNumber}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="courseName"
              className="block text-sm font-medium text-neutral-300 mb-1"
            >
              Course Name
            </label>
            <input
              id="courseName"
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g., Mathematics for Computer Science"
              maxLength={100}
              className="w-full px-3 py-2 bg-primary-800 border border-neutral-600 rounded-md text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
              aria-invalid={!!errors.courseName}
              aria-describedby={errors.courseName ? 'courseName-error' : undefined}
            />
            {errors.courseName && (
              <p id="courseName-error" className="mt-1 text-sm text-error">
                {errors.courseName}
              </p>
            )}
          </div>

          {apiError && (
            <div className="mb-4 rounded-md bg-red-900/20 border border-red-700 p-3">
              <p className="text-sm text-error">{apiError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-300 border border-neutral-600 rounded-md hover:bg-primary-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-gold-600 text-neutral-100 rounded-md hover:bg-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
