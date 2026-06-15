import { Link, useLocation, useNavigate } from 'react-router-dom';
import { generateBreadcrumbs } from './breadcrumbs.utils';

export interface BreadcrumbsProps {
  /** Optional custom labels for dynamic segments (e.g., course name, category name) */
  customLabels?: Record<string, string>;
}

/**
 * Generates clickable breadcrumb navigation from the current route path.
 * Includes a back button and breadcrumb segments.
 * Each segment is a link to the corresponding route level.
 * The last segment is displayed as plain text (current page).
 */
export function Breadcrumbs({ customLabels = {} }: BreadcrumbsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = generateBreadcrumbs(location.pathname, customLabels);

  // Don't render breadcrumbs on the home page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="px-4 sm:px-6 py-3 flex items-center gap-3">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-100 transition-colors shrink-0"
        aria-label="Go back"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Back</span>
      </button>

      <span className="text-neutral-700" aria-hidden="true">|</span>

      {/* Breadcrumb trail */}
      <ol className="flex items-center gap-1 text-sm" role="list">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-neutral-500 mx-1" aria-hidden="true">
                  &gt;
                </span>
              )}
              {isLast ? (
                <span className="text-gold-400 font-medium" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-neutral-300 hover:text-neutral-100 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
