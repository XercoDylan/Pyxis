import { useState, useEffect, useRef, FormEvent } from 'react';
import { createYearFolder } from '../../api/yearFolders';

interface AddYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onSuccess: () => void;
}

export default function AddYearModal({
  isOpen,
  onClose,
  courseId,
  onSuccess,
}: AddYearModalProps) {
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setYear('');
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  function validate(): boolean {
    const trimmed = year.trim();

    if (!trimmed) {
      setError('Year is required');
      return false;
    }

    const parsed = Number(trimmed);

    if (!Number.isInteger(parsed)) {
      setError('Year must be a four-digit integer');
      return false;
    }

    if (parsed < 2000 || parsed > 2100) {
      setError('Year must be between 2000 and 2100');
      return false;
    }

    setError(null);
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createYearFolder(courseId, Number(year.trim()));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: { status?: number; data?: { error?: { message?: string; code?: string } } };
        };
        if (axiosErr.response?.status === 409) {
          setError(`A year folder for ${year.trim()} already exists in this course`);
        } else {
          setError(
            axiosErr.response?.data?.error?.message ||
              'Failed to create year folder. Please try again.'
          );
        }
      } else {
        setError('A network error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-year-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative w-full max-w-md rounded-lg border border-neutral-700 bg-primary-800 p-6 shadow-xl mx-4">
        <h2
          id="add-year-title"
          className="text-xl font-semibold text-neutral-100 mb-4"
        >
          Add Year Folder
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="year-input"
              className="block text-sm font-medium text-neutral-300 mb-1"
            >
              Year
            </label>
            <input
              ref={inputRef}
              id="year-input"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={2000}
              max={2100}
              placeholder="e.g., 2024"
              className="w-full rounded-md border border-neutral-600 bg-primary-700 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 text-sm"
              disabled={isSubmitting}
              aria-invalid={!!error}
              aria-describedby={error ? 'year-error' : undefined}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Enter a four-digit year between 2000 and 2100
            </p>
          </div>

          {error && (
            <p id="year-error" className="text-sm text-error" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-300 hover:text-neutral-100 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gold-600 text-neutral-100 rounded-md hover:bg-gold-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Year Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
