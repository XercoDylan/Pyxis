import { useState, useEffect } from 'react';

export interface AuthUser {
  memberId: string;
  name: string;
  isAdmin: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch('/auth/session', {
          credentials: 'include',
        });

        if (cancelled) return;

        if (response.ok) {
          const data = await response.json();
          setState({
            isAuthenticated: true,
            isLoading: false,
            user: {
              memberId: data.memberId,
              name: data.name,
              isAdmin: data.isAdmin,
            },
          });
        } else {
          // Not authenticated — show login page (handled by Layout)
          setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
        }
      } catch {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
