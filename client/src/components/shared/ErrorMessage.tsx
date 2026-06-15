interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-md bg-red-900/20 border border-red-700 p-4">
      <p className="text-error text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-gold-400 hover:text-gold-300 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
