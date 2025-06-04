import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type UserRole = 'USER' | 'ADMIN' | 'BROKER' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  userRole: null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  isAdmin: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const { toast } = useToast();

  // Check if user has admin role (role_id = 2)
  const checkAdminRole = async (userId: string): Promise<boolean> => {
    try {
      console.log(`[Auth] Checking admin role for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select('role_id')
        .eq('user_id', userId)
        .eq('role_id', 2); // Admin role ID is 2
      
      if (error) {
        console.error('[Auth] Error checking admin role:', error);
        return false;
      }
      
      const isAdmin = data && data.length > 0;
      console.log(`[Auth] Admin check result: ${isAdmin}`);
      return isAdmin;
    } catch (error) {
      console.error('[Auth] Exception in admin check:', error);
      return false;
    }
  };

  // Check if user has broker role (role_id = 3)
  const checkBrokerRole = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select('role_id')
        .eq('user_id', userId)
        .eq('role_id', 3); // Broker role ID is 3
      
      if (error) {
        console.error('[Auth] Error checking broker role:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('[Auth] Exception in broker check:', error);
      return false;
    }
  };

  // Determine user role based on role assignments
  const determineUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const isAdmin = await checkAdminRole(userId);
      if (isAdmin) {
        console.log('[Auth] User has admin role');
        return 'ADMIN';
      }

      const isBroker = await checkBrokerRole(userId);
      if (isBroker) {
        console.log('[Auth] User has broker role');
        return 'BROKER';
      }

      console.log('[Auth] User has default USER role');
      return 'USER';
    } catch (error) {
      console.error('[Auth] Error determining user role:', error);
      return 'USER';
    }
  };

  // Initialize authentication state
  useEffect(() => {
    console.log('[Auth] Initializing auth provider');
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (!session) {
          console.log('[Auth] No session found');
          if (isMounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            setLoading(false);
          }
          return;
        }

        console.log('[Auth] Session found:', session.user.id);
        
        if (isMounted) {
          setUser(session.user);
          setSession(session);
        }

        // Determine user role
        const role = await determineUserRole(session.user.id);
        if (isMounted) {
          setUserRole(role);
          setLoading(false);
        }

      } catch (error) {
        console.error('[Auth] Error in auth initialization:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state change:', event);
        
        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setSession(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        setUser(session.user);
        setSession(session);

        // Determine role for new session
        const role = await determineUserRole(session.user.id);
        setUserRole(role);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Get user role with timeout protection
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    if (!userId) return 'USER';
    
    try {
      console.log(`[Auth] Checking roles for user: ${userId}`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<UserRole>(resolve => {
        setTimeout(() => resolve('USER'), 2000);
      });
      
      // Create the role check promise
      const rolePromise = (async () => {
        try {
          // Using a simpler query with count
          const { count } = await supabase
            .from('user_role_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('role_id', 3); // 3 = BROKER role
            
          if (count && count > 0) {
            console.log('[Auth] User has BROKER role');
            return 'BROKER';
          }
          
          return 'USER';
        } catch (e) {
          console.error('[Auth] Error checking roles:', e);
          return 'USER';
        }
      })();
      
      // Race between the actual query and the timeout
      return Promise.race([rolePromise, timeoutPromise]);
      
    } catch (error) {
      console.error('[Auth] Error in fetchUserRole:', error);
      return 'USER';
    }
  };
  
  // Sign in with safer admin check
  const signIn = async (email: string, password: string) => {
    try {
      console.log(`[Auth] Starting login process for: ${email}`);
      
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[Auth] Authentication error:', error);
        return { error };
      }
      
      if (!data || !data.user) {
        console.error('[Auth] No user data received');
        return { error: new Error('No user data received') };
      }
      
      console.log(`[Auth] User authenticated successfully:`, data.user.id);
      
      // Set user and session immediately
      setUser(data.user);
      setSession(data.session);
      
      // Special handling for admin@admin.com (hardcoded for guaranteed access)
      if (email.toLowerCase() === 'admin@admin.com') {
        console.log('[Auth] Setting admin role by email match');
        setUserRole('ADMIN');
        return { error: null };
      }
      
      // Check admin status in background
      Promise.resolve().then(async () => {
        if (!data.user.email) {
          setUserRole('USER');
          return;
        }
        
        try {
          const isAdmin = await checkAdminRole(data.user.id);
          
          if (isAdmin) {
            console.log('[Auth] User confirmed as admin');
            setUserRole('ADMIN');
          } else {
            const role = await fetchUserRole(data.user.id);
            console.log(`[Auth] User role: ${role}`);
            setUserRole(role);
          }
        } catch (e) {
          console.error('[Auth] Error in admin check:', e);
          setUserRole('USER');
        }
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Sign in error:', error);
      return { error };
    }
  };
  
  // Sign up (simplified)
  const signUp = async (email: string, password: string) => {
    try {
      // First check if this email is an admin email
      
      // Proceed with normal registration
      const { error, data } = await supabase.auth.signUp({ email, password });
      
      if (error) return { error, data: null };
      
      console.log('[Auth] Registration successful');
      
      return { error: null, data };
    } catch (error: any) {
      console.error('[Auth] Sign up error:', error);
      return { error, data: null };
    }
  };
  
  // Sign out
  const signOut = async () => {
    try {
      // Clear state first
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      console.log('[Auth] Signed out successfully');
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    }
  };
  
  // Reset password
  const resetPassword = async (email: string) => {
    try {
      if (!email) return { error: new Error('Email is required') };
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // Helper function to check if current user is admin
  const isAdmin = (): boolean => {
    return userRole === 'ADMIN';
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
