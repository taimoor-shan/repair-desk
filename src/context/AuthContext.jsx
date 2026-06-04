import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const backend = import.meta.env.VITE_DB_BACKEND || 'dexie';

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    if (backend !== 'supabase') {
      return { user: { id: 'local' }, session: null, loading: false };
    }
    return { user: null, session: null, loading: true };
  });

  useEffect(() => {
    if (backend !== 'supabase') return;

    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) setState((s) => ({ ...s, loading: false }));
    }, 5000);

    import('../lib/supabase.js').then(({ supabase }) => {
      if (cancelled) return;

      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        clearTimeout(timeout);
        const s = data.session;
        setState({ user: s?.user ?? null, session: s, loading: false });
      });

      supabase.auth.onAuthStateChange((_event, s) => {
        setState({ user: s?.user ?? null, session: s, loading: false });
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  async function signIn(email, password) {
    const { supabase } = await import('../lib/supabase.js');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { supabase } = await import('../lib/supabase.js');
    await supabase.auth.signOut();
    setState({ user: null, session: null, loading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
