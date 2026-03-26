'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(data);
        }
      } catch {
        // Ignore errors during initial load
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          setProfile(data);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/admin/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
