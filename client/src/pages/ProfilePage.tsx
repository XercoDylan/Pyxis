import { useState, useEffect } from 'react';
import { getMyProfile, ProfileData } from '../api/stats';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfile() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load profile'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchProfile} />;
  }

  if (!profile) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-100 mb-6">My Profile</h1>

      <div className="rounded-lg bg-primary-800 border border-neutral-700 p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Name
            </label>
            <p className="text-neutral-100 text-sm">{profile.name}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Grade
            </label>
            <p className="text-neutral-100 text-sm">{profile.grade || '—'}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Major
            </label>
            <p className="text-neutral-100 text-sm">{profile.major || '—'}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Join Date
            </label>
            <p className="text-neutral-100 text-sm">
              {formatDate(profile.joinedAt)}
            </p>
          </div>

          <div className="border-t border-neutral-700 pt-4">
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Total Contributions
            </label>
            <p className="text-gold-400 text-lg font-semibold">
              {profile.totalContributions}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Last Contribution
            </label>
            <p className="text-neutral-100 text-sm">
              {profile.lastContributionDate
                ? formatDate(profile.lastContributionDate)
                : 'No contributions yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
