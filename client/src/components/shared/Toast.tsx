import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success';
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = 'error',
  onDismiss,
  duration = 4000,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Allow fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const bgColor =
    type === 'error'
      ? 'bg-red-800 border-red-600'
      : 'bg-green-800 border-green-600';

  const textColor =
    type === 'error' ? 'text-red-100' : 'text-green-100';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border px-4 py-3 shadow-lg transition-opacity duration-300 ${bgColor} ${textColor} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-center gap-2">
        {type === 'error' && (
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        )}
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="ml-auto flex-shrink-0 rounded p-1 hover:bg-white/10 transition-colors"
          aria-label="Dismiss notification"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
