import { useState, useEffect } from 'react';
import { getLeaderboard, LeaderboardEntry } from '../api/stats';
import LeaderboardTable from '../components/stats/LeaderboardTable';
import MemberDetail from '../components/stats/MemberDetail';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';

export default function StatsPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  async function fetchLeaderboard() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getLeaderboard();
      setEntries(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load leaderboard'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  function handleMemberClick(memberId: string) {
    setSelectedMemberId(memberId);
  }

  function handleCloseDetail() {
    setSelectedMemberId(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-100 mb-6">
        Contribution Leaderboard
      </h1>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchLeaderboard} />}

      {!isLoading && !error && entries.length === 0 && (
        <p className="text-neutral-400 text-sm">
          No contributions yet. Be the first to upload course materials!
        </p>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <div className="rounded-lg bg-primary-800 border border-neutral-700 overflow-hidden">
          <LeaderboardTable
            entries={entries}
            onMemberClick={handleMemberClick}
          />
        </div>
      )}

      {selectedMemberId && (
        <MemberDetail
          memberId={selectedMemberId}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
