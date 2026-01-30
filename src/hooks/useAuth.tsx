import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/lib/types';
import { logLogin, logLogout } from '@/lib/audit-logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching role for user:', userId);
      
      // Method 1: Try direct query first
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        console.log('Role found via direct query:', data.role);
        setRole(data.role as AppRole);
        return;
      }
      
      if (error) {
        console.log('Direct query failed, trying alternative methods:', error.message);
        
        // Method 2: Try without .single()
        const { data: allRoles, error: error2 } = await supabase
          .from('user_roles')
          .select('role, user_id')
          .eq('user_id', userId);
        
        if (allRoles && allRoles.length > 0) {
          console.log('Role found via alternative query:', allRoles[0].role);
          setRole(allRoles[0].role as AppRole);
          return;
        }
        
        console.log('All methods failed, errors:', { error, error2 });
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Log login attempt
    if (data.user) {
      await logLogin(data.user.id, !error, { 
        email,
        timestamp: new Date().toISOString(),
        method: 'password'
      });
    } else if (error) {
      // Log failed login attempt
      await logLogin('unknown', false, { 
        email,
        error: error.message,
        timestamp: new Date().toISOString(),
        method: 'password'
      });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
      });
    }

    return { error };
  };

  const signOut = async () => {
    const userId = user?.id;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    
    // Log logout if user was authenticated
    if (userId) {
      await logLogout(userId);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
