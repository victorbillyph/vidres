import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { SessionUser } from '../types';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  setupRequired: boolean;
  login: (payload: { email: string; password: string }) => Promise<SessionUser>;
  register: (payload: { name: string; email: string; password: string }) => Promise<SessionUser>;
  logout: () => Promise<void>;
  completeSetup: (payload: { name: string; email: string; password: string }) => Promise<SessionUser>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const refreshSession = async () => {
    setLoading(true);

    try {
      const setup = await api.getSetupStatus();
      setSetupRequired(setup.needsSetup);

      if (setup.needsSetup) {
        setUser(null);
        return;
      }

      try {
        const session = await api.me();
        setUser(session.user);
      } catch {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      setupRequired,
      login: async (payload) => {
        const response = await api.login(payload);
        setUser(response.user);
        return response.user;
      },
      register: async (payload) => {
        const response = await api.register(payload);
        setUser(response.user);
        return response.user;
      },
      logout: async () => {
        await api.logout();
        setUser(null);
      },
      completeSetup: async (payload) => {
        const response = await api.createSuperadmin(payload);
        setSetupRequired(false);
        setUser(response.user);
        return response.user;
      },
      refreshSession,
    }),
    [loading, setupRequired, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
