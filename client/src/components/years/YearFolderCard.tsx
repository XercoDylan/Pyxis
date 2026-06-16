import { useNavigate } from 'react-router-dom';
import { YearFolder } from '../../types';
import CompletionBadge from './CompletionBadge';

interface YearFolderCardProps {
  yearFolder: YearFolder;
  courseId: string;
}

export default function YearFolderCard({ yearFolder, courseId }: YearFolderCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/courses/${courseId}/years/${yearFolder.id}`)}
      className="w-full text-left p-4 bg-primary-700 border border-neutral-700 rounded-lg hover:border-gold-500 hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
      aria-label={`Open year folder ${yearFolder.year}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-gold-400 font-bold text-2xl">{yearFolder.year}</p>
        <CompletionBadge isComplete={yearFolder.isComplete} />
      </div>
      <p className="text-neutral-200 text-sm mt-1">
        {yearFolder.fileCount} {yearFolder.fileCount === 1 ? 'file' : 'files'}
      </p>
    </button>
  );
}
