import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

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
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const { toast } = useToast();

  // Use a simple SQL RPC function to check if an admin exists by email
  // This avoids the issue with direct table queries
  const checkIfAdminByEmail = async (email: string): Promise<boolean> => {
    if (!email) return false;
    
    try {
      // Using a direct stored procedure/function call
      const { data, error } = await supabase.rpc('is_admin_by_email', { 
        admin_email: email.toLowerCase() 
      });
      
      if (error) {
        console.error('[Auth] RPC error checking admin status:', error);
        
        // Fallback to raw SQL query as direct access
        // Using count to avoid schema issues
        const { count, error: countError } = await supabase
          .from('admins')
          .select('*', { count: 'exact', head: true })
          .eq('email', email.toLowerCase());
        
        if (countError) {
          console.error('[Auth] Fallback admin check failed:', countError);
          return false;
        }
        
        return count ? count > 0 : false;
      }
      
      console.log(`[Auth] Admin check result:`, data);
      return data === true;
      
    } catch (error) {
      console.error('[Auth] Error checking admin status:', error);
      return false;
    }
  };

  // Check if email is in admin list (manually maintained fallback)
  const isAdminEmail = (email: string): boolean => {
    if (!email) return false;
    
    // Hardcoded list of admin emails as last-resort fallback
    const adminEmails = [
      'admin@admin.com',
      // Add other admin emails here
    ];
    
    return adminEmails.includes(email.toLowerCase());
  };

  // Initialize authentication state
  useEffect(() => {
    console.log('[Auth] Initializing authentication provider');
    let isMounted = true;
    
    const setData = async () => {
      try {
        // Check current session with Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          if (isMounted) setLoading(false);
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
        
        // Set user and session immediately
        if (isMounted) {
          setUser(session.user);
          setSession(session);
        }
        
        console.log('[Auth] Session found for user:', session.user.id);
        
        // Use a safer approach to check admin status
        if (session.user.email) {
          try {
            // Try the database check first
            const isAdmin = await checkIfAdminByEmail(session.user.email);
            
            if (isAdmin) {
              console.log('[Auth] User confirmed as admin in database');
              if (isMounted) setUserRole('ADMIN');
            } else {
              // Fallback to hardcoded check
              const isAdminHardcoded = isAdminEmail(session.user.email);
              
              if (isAdminHardcoded) {
                console.log('[Auth] User is admin by hardcoded list');
                if (isMounted) setUserRole('ADMIN');
              } else {
                // Not admin, check for broker role
                const role = await fetchUserRole(session.user.id);
                if (isMounted) setUserRole(role);
              }
            }
          } catch (error) {
            console.error('[Auth] Error in admin check:', error);
            if (isMounted) setUserRole('USER');
          }
        } else {
          if (isMounted) setUserRole('USER');
        }
      } catch (e) {
        console.error('[Auth] Error in setData:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    setData();
    
    // Safety timeout - force loading to complete after 3 seconds max
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Auth] Safety timeout triggered, ending loading');
        setLoading(false);
        setUserRole('USER');
      }
    }, 3000);
    
    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state change:', event);
        
        if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
            setSession(null);
            setUserRole(null);
            setLoading(false);
          }
          return;
        }
        
        if (!session) {
          if (isMounted) {
            setUser(null);
            setSession(null);
            setUserRole(null);
            setLoading(false);
          }
          return;
        }
        
        // Set user and session immediately
        if (isMounted) {
          setUser(session.user);
          setSession(session);
        }
        
        // Check admin status with safer methods
        if (session.user.email) {
          try {
            // Try the database check with timeout protection
            const isAdmin = await Promise.race([
              checkIfAdminByEmail(session.user.email),
              new Promise<boolean>(resolve => setTimeout(() => resolve(false), 2000))
            ]);
            
            if (isAdmin) {
              console.log('[Auth] User confirmed as admin');
              if (isMounted) setUserRole('ADMIN');
            } else {
              // Fallback to hardcoded list
              if (isAdminEmail(session.user.email)) {
                console.log('[Auth] User is admin by hardcoded list');
                if (isMounted) setUserRole('ADMIN');
              } else {
                // Check other roles
                const role = await fetchUserRole(session.user.id);
                if (isMounted) setUserRole(role);
              }
            }
          } catch (error) {
            console.error('[Auth] Error checking admin status:', error);
            if (isMounted) setUserRole('USER');
          }
        } else {
          if (isMounted) setUserRole('USER');
        }
        
        if (isMounted) setLoading(false);
      }
    );
    
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
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
          const isAdmin = await checkIfAdminByEmail(data.user.email);
          
          if (isAdmin) {
            console.log('[Auth] User confirmed as admin');
            setUserRole('ADMIN');
          } else if (isAdminEmail(data.user.email)) {
            console.log('[Auth] User is admin by hardcoded list');
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
      if (isAdminEmail(email)) {
        return {
          error: new Error('This email is already reserved for administrator use'),
          data: null
        };
      }
      
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
      
      // Don't allow password reset for admin emails
      if (isAdminEmail(email)) {
        return {
          error: new Error('Administrators should contact technical support to reset their password')
        };
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { error };
    } catch (error: any) {
      return { error };
    }
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
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);