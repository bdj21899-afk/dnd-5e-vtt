import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, mapSupabaseUser } from '@/lib/auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (u: AuthUser) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null, loading: true,
  login: () => {}, logout: () => {},
});

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((u: AuthUser) => setUser(u), []);
  const logout = useCallback(() => setUser(null), []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) login(mapSupabaseUser(session.user));
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) { login(mapSupabaseUser(session.user)); setLoading(false); }
      else if (event === 'SIGNED_OUT') { logout(); setLoading(false); }
      else if (event === 'TOKEN_REFRESHED' && session?.user) { login(mapSupabaseUser(session.user)); }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [login, logout]);

  return { user, loading, login, logout };
}

export function useAuth() {
  return useContext(AuthContext);
}
