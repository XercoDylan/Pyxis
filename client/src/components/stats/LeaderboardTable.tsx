interface LeaderboardEntry {
  memberId: string;
  name: string;
  totalFiles: number;
  distinctCourses: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  onMemberClick: (memberId: string) => void;
}

export default function LeaderboardTable({
  entries,
  onMemberClick,
}: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-neutral-600 bg-primary-700">
            <th className="px-4 py-3 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Total Files
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Distinct Courses
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.memberId}
              className="border-b border-neutral-700 hover:bg-primary-700 transition-colors"
            >
              <td className="px-4 py-3">
                <button
                  onClick={() => onMemberClick(entry.memberId)}
                  className="text-gold-400 hover:text-gold-300 underline text-sm font-medium"
                >
                  {entry.name}
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-neutral-200">
                {entry.totalFiles}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-200">
                {entry.distinctCourses}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
