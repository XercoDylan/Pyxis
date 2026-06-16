import { YearFolder } from '../../types';
import YearFolderCard from './YearFolderCard';

interface YearFolderGridProps {
  yearFolders: YearFolder[];
  courseId: string;
}

export default function YearFolderGrid({ yearFolders, courseId }: YearFolderGridProps) {
  const sorted = [...yearFolders].sort((a, b) => b.year - a.year);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {sorted.map((yearFolder) => (
        <YearFolderCard key={yearFolder.id} yearFolder={yearFolder} courseId={courseId} />
      ))}
    </div>
  );
}
