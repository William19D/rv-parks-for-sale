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

  // Function to fetch user role
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    if (!userId) {
      console.log('[Auth] No userId provided to fetchUserRole');
      return null;
    }
    
    try {
      console.log('[Auth] Fetching role for user:', userId);
      
      const { data: roleAssignments, error: roleError } = await supabase
        .from('user_role_assignments')
        .select('role_id')
        .eq('user_id', userId);
      
      console.log('[Auth] Role assignments query result:', { roleAssignments, roleError });
      
      if (roleError) {
        console.error('[Auth] Error fetching role assignments:', roleError);
        return 'USER'; // Default to USER on error
      }
      
      if (!roleAssignments || roleAssignments.length === 0) {
        console.log('[Auth] No role assignments found, defaulting to USER');
        return 'USER';
      }
      
      // Check for admin role (role_id = 2)
      const hasAdminRole = roleAssignments.some(assignment => assignment.role_id === 2);
      if (hasAdminRole) {
        console.log('[Auth] User has ADMIN role (role_id = 2)');
        return 'ADMIN';
      }
      
      // Check for broker role (role_id = 3)
      const hasBrokerRole = roleAssignments.some(assignment => assignment.role_id === 3);
      if (hasBrokerRole) {
        console.log('[Auth] User has BROKER role (role_id = 3)');
        return 'BROKER';
      }
      
      console.log('[Auth] User has USER role (default)');
      return 'USER';
    } catch (error) {
      console.error('[Auth] Error in fetchUserRole:', error);
      return 'USER'; // Default to USER on error
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('[Auth] Initializing auth provider...');
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        if (currentSession) {
          console.log('[Auth] Found existing session for user:', currentSession.user.id);
          if (isMounted) {
            setSession(currentSession);
            setUser(currentSession.user);
            
            // Fetch user role
            const role = await fetchUserRole(currentSession.user.id);
            console.log('[Auth] Fetched role for existing session:', role);
            setUserRole(role);
          }
        } else {
          console.log('[Auth] No existing session found');
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (e) {
        console.error('[Auth] Error in initializeAuth:', e);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Auth state changed. Event:', event, 'Session:', !!newSession);
        
        if (isMounted) {
          if (newSession) {
            console.log('[Auth] Setting new session for user:', newSession.user.id);
            setSession(newSession);
            setUser(newSession.user);
            
            // Fetch role for new session
            const role = await fetchUserRole(newSession.user.id);
            console.log('[Auth] Fetched role for new session:', role);
            setUserRole(role);
          } else {
            console.log('[Auth] Clearing session and user data');
            setSession(null);
            setUser(null);
            setUserRole(null);
          }
        }
      }
    );
    
    // Initialize auth
    initializeAuth();

    return () => {
      console.log('[Auth] Cleaning up auth provider...');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log(`[Auth] Attempting login with email: ${email}`);
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[Auth] Sign in error:', error);
        return { error };
      }
      
      if (!data.user) {
        console.error('[Auth] No user data returned from sign in');
        return { error: new Error('No user data returned from sign in') };
      }
      
      console.log(`[Auth] Successfully authenticated user: ${data.user.id}`);
      
      // The auth state change listener will handle setting user, session, and role
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Error in signIn:', error);
      return { error };
    }
  };

  // Sign up with default role assignment
  const signUp = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('[Auth] Sign up error:', error);
        return { error, data: null };
      }
      
      console.log('[Auth] Sign up successful for:', email);
      
      // Create role assignment for new user with default USER role
      if (data.user) {
        console.log('[Auth] Assigning default USER role to new user:', data.user.id);
        
        // Default to role_id 1 (USER)
        let userRoleId = 1;
        
        try {
          // Attempt to verify the correct USER role ID from user_roles table
          const { data: roleData, error: roleQueryError } = await supabase
            .from('user_roles')
            .select('id')
            .eq('name', 'USER')
            .single();
            
          if (roleQueryError) {
            console.error('[Auth] Error finding USER role ID:', roleQueryError);
          } else if (roleData) {
            userRoleId = roleData.id;
            console.log('[Auth] Found USER role ID:', userRoleId);
          }
        } catch (e) {
          console.error('[Auth] Error finding USER role ID, using default 1:', e);
        }
        
        // Insert role assignment
        const { error: roleError } = await supabase
          .from('user_role_assignments')
          .insert([{
            user_id: data.user.id,
            role_id: userRoleId
          }]);
          
        if (roleError) {
          console.error('[Auth] Error assigning default role:', roleError);
        } else {
          console.log('[Auth] Successfully assigned role_id', userRoleId, 'to user', data.user.id);
        }
      }
      
      return { error: null, data };
    } catch (error: any) {
      console.error('[Auth] Error in signUp:', error);
      return { error, data: null };
    }
  };

  // FUNCIÓN DE CIERRE DE SESIÓN CORREGIDA
  const signOut = async () => {
    try {
      console.log('[Auth] Starting logout process...');
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('[Auth] Logout completed successfully');
    } catch (error) {
      console.error('[Auth] Error in signOut function:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('[Auth] Reset password error:', error);
        return { error };
      }
      
      console.log('[Auth] Password reset email sent to:', email);
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Error in resetPassword:', error);
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
