import { useState, useEffect, useCallback } from 'react';
import { getMembers, createMember, removeMember, MemberEntry } from '../../api/admin';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

export default function AccessListManager() {
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  // Remove state
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreate = async () => {
    setCreateError(null);
    setNewToken(null);

    if (!name.trim()) {
      setCreateError('Name is required');
      return;
    }

    setIsCreating(true);
    try {
      const member = await createMember({
        name: name.trim(),
        major: major.trim(),
        grade: grade.trim(),
        isAdmin,
      });
      setNewToken(member.token);
      setName('');
      setMajor('');
      setGrade('');
      setIsAdmin(false);
      await fetchMembers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create member');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemove = async (id: string) => {
    setIsRemoving(true);
    try {
      await removeMember(id);
      setConfirmRemove(null);
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchMembers} />;
  }

  return (
    <div className="space-y-8">
      {/* Create Member */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-100 mb-3">
          Create New Member
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name *"
            className="px-3 py-2 bg-primary-700 border border-neutral-600 rounded-md text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 text-sm"
          />
          <input
            type="text"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="Major"
            className="px-3 py-2 bg-primary-700 border border-neutral-600 rounded-md text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 text-sm"
          />
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Grade (e.g., Senior)"
            className="px-3 py-2 bg-primary-700 border border-neutral-600 rounded-md text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="rounded border-neutral-600"
            />
            Admin privileges
          </label>
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="mt-3 px-4 py-2 bg-gold-600 text-neutral-100 rounded-md hover:bg-gold-500 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Member'}
        </button>
        {createError && (
          <p className="mt-2 text-sm text-error">{createError}</p>
        )}
        {newToken && (
          <div className="mt-3 p-3 bg-gold-600/10 border border-gold-600 rounded-md">
            <p className="text-sm text-neutral-200">Member created! Their access token is:</p>
            <p className="text-xl font-mono font-bold text-gold-400 mt-1 tracking-widest">{newToken}</p>
            <p className="text-xs text-neutral-400 mt-1">Share this token with them. They'll use it to sign in.</p>
          </div>
        )}
      </section>

      {/* Members Table */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-100 mb-3">
          Members ({members.length})
        </h3>
        {members.length === 0 ? (
          <p className="text-neutral-400 text-sm">No members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-neutral-700 bg-primary-700">
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-300 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-300 uppercase tracking-wider">Major</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-300 uppercase tracking-wider">Grade</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-300 uppercase tracking-wider">Token</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-300 uppercase tracking-wider">Admin</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-neutral-800 hover:bg-primary-700/50">
                    <td className="py-3 px-4 text-neutral-100">{member.name}</td>
                    <td className="py-3 px-4 text-neutral-300">{member.major || '—'}</td>
                    <td className="py-3 px-4 text-neutral-300">{member.grade || '—'}</td>
                    <td className="py-3 px-4 font-mono text-gold-400 tracking-wider">{member.token}</td>
                    <td className="py-3 px-4 text-neutral-300">{member.isAdmin ? '✓' : '—'}</td>
                    <td className="py-3 px-4">
                      {confirmRemove === member.id ? (
                        <span className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemove(member.id)}
                            disabled={isRemoving}
                            className="text-error hover:text-red-400 text-sm font-medium disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="text-neutral-400 hover:text-neutral-200 text-sm"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(member.id)}
                          className="text-error hover:text-red-400 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
