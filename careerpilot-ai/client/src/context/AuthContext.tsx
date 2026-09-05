import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import { getCurrentTokens } from '../services/authService';

interface AuthContextValue {
  token: string | null;
  refreshToken: string | null;
  user: { id: string; name: string; email: string; role: string } | null;
  loading: boolean;
  setUser: (user: AuthContextValue['user']) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getCurrentTokens().token);
  const [refreshToken, setRefreshToken] = useState<string | null>(() => getCurrentTokens().refreshToken);
  const [user, setUser] = useState<AuthContextValue['user'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      const t = getCurrentTokens().token;
      if (!t) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }
      try {
        const me = await apiClient.get<{ success: boolean; data: any }>('/api/v1/users/me');
        if (!cancelled && me && me.data) {
          setUser({
            id: me.data._id,
            name: me.data.name,
            email: me.data.email,
            role: me.data.role,
          });
        }
      } catch {
        apiClient.clearTokens();
        setToken(null);
        setRefreshToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout', { refreshToken: getCurrentTokens().refreshToken }).catch(() => {});
    } finally {
      apiClient.clearTokens();
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ token, refreshToken, user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
