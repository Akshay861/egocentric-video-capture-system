import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { AuthSession, IdentifierType } from '../types/auth';
import { login as loginService, logout as logoutService, restoreSession } from '../services/auth/authService';
import { uploadQueueWorker } from '../services/upload/uploadQueueWorker';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  workerId: string | null;
  login: (identifier: string, identifierType: IdentifierType) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    void (async () => {
      const existingSession = await restoreSession();
      if (existingSession) {
        setSession(existingSession);
        setStatus('authenticated');
        return;
      }

      setStatus('unauthenticated');
    })();
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.workerId) {
      uploadQueueWorker.setWorkerId(session.workerId);
      uploadQueueWorker.start();
      return () => uploadQueueWorker.stop();
    }

    uploadQueueWorker.setWorkerId(null);
    uploadQueueWorker.stop();
  }, [status, session?.workerId]);

  const login = useCallback(async (identifier: string, identifierType: IdentifierType) => {
    const nextSession = await loginService({ identifier, identifierType });
    setSession(nextSession);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      workerId: session?.workerId ?? null,
      login,
      logout,
    }),
    [status, session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
