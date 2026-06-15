import { useState, useEffect, useRef } from 'react';
import { isValidCategoryName, VALIDATION_CONSTANTS } from '../../utils/validation';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: () => void;
  courseId: string;
}

export default function AddCategoryModal({
  isOpen,
  onClose,
  onCategoryAdded,
  courseId,
}: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
      setIsSubmitting(false);
      // Focus the input after the modal renders
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!isValidCategoryName(trimmedName)) {
      if (trimmedName.length === 0) {
        setError('Category name is required');
      } else {
        setError(
          `Category name must be at most ${VALIDATION_CONSTANTS.MAX_CATEGORY_NAME_LENGTH} characters`
        );
      }
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/courses/${courseId}/categories`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 409) {
          setError('This category already exists in this course');
        } else {
          setError(
            data?.error?.message || 'Failed to create category. Please try again.'
          );
        }
        return;
      }

      onCategoryAdded();
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-category-title"
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
          id="add-category-title"
          className="text-xl font-semibold text-neutral-100 mb-4"
        >
          Add Category
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="category-name"
              className="block text-sm font-medium text-neutral-300 mb-1"
            >
              Category Name
            </label>
            <input
              ref={inputRef}
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={VALIDATION_CONSTANTS.MAX_CATEGORY_NAME_LENGTH}
              placeholder="e.g., Recitations"
              className="w-full rounded-md border border-neutral-600 bg-primary-700 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 text-sm"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-neutral-500">
              {name.length}/{VALIDATION_CONSTANTS.MAX_CATEGORY_NAME_LENGTH} characters
            </p>
          </div>

          {error && (
            <p className="text-sm text-error" role="alert">
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
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
