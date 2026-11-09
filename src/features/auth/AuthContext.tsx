import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { AuthRepository } from './data/AuthRepository';
import { AccountType, UserSession } from './domain/models';

type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

interface AuthValue {
  status: AuthStatus;
  user: UserSession | null;
  login: (email: string, password: string) => Promise<UserSession>;
  register: (
    email: string,
    password: string,
    name: string,
    accountType: AccountType,
  ) => Promise<UserSession>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repository = useMemo(() => di.resolve<AuthRepository>(TOKENS.AuthRepo), [di]);
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    let active = true;
    repository
      .restoreSession()
      .then((restored) => {
        if (!active) return;
        setUser(restored ? repository.currentUser : null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setStatus(repository.currentUser ? 'signedIn' : 'signedOut');
      });
    return () => {
      active = false;
    };
  }, [repository]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await repository.login(email, password);
      setUser(session);
      setStatus('signedIn');
      return session;
    },
    [repository],
  );

  const register = useCallback(
    async (email: string, password: string, name: string, accountType: AccountType) => {
      const session = await repository.register(email, password, name, accountType);
      setUser(session);
      setStatus('signedIn');
      return session;
    },
    [repository],
  );

  const logout = useCallback(async () => {
    try {
      await repository.logout();
    } catch {
      // The session may already be gone on the server.
    } finally {
      setUser(null);
      setStatus('signedOut');
    }
  }, [repository]);

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
