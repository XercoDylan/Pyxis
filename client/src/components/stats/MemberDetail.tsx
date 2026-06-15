import { useState, useEffect } from 'react';
import { getMemberDetail, MemberDetailData } from '../../api/stats';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

interface MemberDetailProps {
  memberId: string;
  onClose: () => void;
}

export default function MemberDetail({ memberId, onClose }: MemberDetailProps) {
  const [data, setData] = useState<MemberDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getMemberDetail(memberId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load member details'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getMemberDetail(memberId);
        if (cancelled) return;
        setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load member details'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  if (isLoading) {
    return (
      <div className="mt-6 rounded-lg bg-primary-800 border border-neutral-700 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg bg-primary-800 border border-neutral-700 p-6">
        <ErrorMessage
          message={error}
          onRetry={fetchData}
        />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-6 rounded-lg bg-primary-800 border border-neutral-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gold-400">{data.name}</h3>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-200 text-sm"
          aria-label="Close member detail"
        >
          ✕ Close
        </button>
      </div>

      {data.courses.length === 0 ? (
        <p className="text-neutral-400 text-sm">No contributions found.</p>
      ) : (
        <div className="space-y-6">
          {data.courses.map((course) => (
            <div key={course.courseNumber}>
              <h4 className="text-sm font-medium text-neutral-200 mb-2">
                {course.courseNumber} — {course.courseName}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-neutral-600 bg-primary-700">
                      <th className="px-3 py-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                        Filename
                      </th>
                      <th className="px-3 py-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-3 py-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                        Upload Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.files.map((file, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-neutral-700"
                      >
                        <td className="px-3 py-2 text-sm text-neutral-200">
                          {file.filename}
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-300">
                          {file.category}
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-300">
                          {formatDate(file.uploadedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
