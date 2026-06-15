import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

interface CategoryListProps {
  categories: Category[];
  courseId: string;
}

export default function CategoryList({ categories, courseId }: CategoryListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/courses/${courseId}/categories/${category.id}`}
          className="group flex items-center gap-3 rounded-lg border border-neutral-700 bg-primary-800 p-4 hover:border-gold-500 hover:bg-primary-700 transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-600 text-gold-400 group-hover:bg-gold-600 group-hover:text-neutral-100 transition-colors">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-100 truncate">
              {category.name}
            </p>
            {category.isDefault && (
              <span className="text-xs text-neutral-500">Default</span>
            )}
          </div>

          <svg
            className="h-4 w-4 text-neutral-500 group-hover:text-gold-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      ))}
    </div>
  );
}
