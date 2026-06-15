import { useState, FormEvent } from 'react';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = token.trim();
    if (!trimmed) {
      setError('Please enter your access token');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: trimmed }),
      });

      if (response.ok) {
        // Reload the page to trigger the auth check and render the app
        window.location.href = '/';
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.error?.message || 'Invalid token. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Chocolate City"
            className="w-20 h-20 rounded-lg object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-neutral-100">Pyxis</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Chocolate City Course Materials
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-neutral-300 mb-1"
            >
              Access Token
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => {
                setToken(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="Enter your 8-character token"
              maxLength={8}
              className="w-full px-4 py-3 bg-primary-700 border border-neutral-600 rounded-md text-neutral-100 placeholder-neutral-500 text-center text-lg tracking-widest font-mono focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
              autoFocus
              autoComplete="off"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-error text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gold-600 text-neutral-100 rounded-md hover:bg-gold-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-neutral-500 text-xs text-center mt-6">
          Contact your Academic Chair if you don't have a token.
        </p>
      </div>
    </div>
  );
}
