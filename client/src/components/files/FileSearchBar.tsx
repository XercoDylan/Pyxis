interface FileSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalFiles: number;
  matchedFiles: number;
}

export default function FileSearchBar({
  searchTerm,
  onSearchChange,
  totalFiles,
  matchedFiles,
}: FileSearchBarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <label htmlFor="file-search" className="sr-only">
          Search files
        </label>
        <input
          id="file-search"
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files by name..."
          aria-label="Search files"
          className="w-full px-4 py-2 pl-10 bg-primary-700 border border-neutral-700 rounded-md text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <p className="text-sm text-neutral-400" aria-live="polite">
        Showing {matchedFiles} of {totalFiles} files
      </p>
    </div>
  );
}
