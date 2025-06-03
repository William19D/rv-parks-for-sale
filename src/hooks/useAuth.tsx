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

  // Función para obtener el rol con logs detallados para depuración
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    if (!userId) {
      console.log('[DEBUG-ROLE] Error: No userId provided to fetchUserRole');
      return null;
    }
    
    console.log(`[DEBUG-ROLE] Starting role fetch for user: ${userId}`);
    console.log(`[DEBUG-ROLE] Current user email: ${user?.email}`);
    
    // CASO ESPECIAL - DEPURACIÓN WILLIAM19D
    if (user?.email?.toLowerCase().includes('william19d')) {
      console.log('[DEBUG-ROLE] ⭐ WILLIAM19D DETECTED BY EMAIL ⭐');
      console.log('[DEBUG-ROLE] Bypassing database query, setting ADMIN role directly');
      return 'ADMIN';
    }
    
    try {
      // 1. Intentar obtener asignaciones de roles - Mostrar query completa
      console.log(`[DEBUG-ROLE] Querying user_role_assignments for user_id=${userId}`);
      
      const { data: roleAssignments, error: roleError } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('user_id', userId);
      
      // Mostrar detalladamente el resultado o error
      if (roleError) {
        console.error('[DEBUG-ROLE] ❌ Error fetching role assignments:', roleError);
        console.error('[DEBUG-ROLE] Error details:', JSON.stringify(roleError));
      } else {
        console.log(`[DEBUG-ROLE] Received ${roleAssignments?.length || 0} role assignments`);
        console.log('[DEBUG-ROLE] Raw data:', JSON.stringify(roleAssignments));
      }
      
      // 2. Si encontramos asignaciones, verificar cada una
      if (roleAssignments && roleAssignments.length > 0) {
        // Registro detallado de cada asignación
        roleAssignments.forEach((assignment, idx) => {
          console.log(`[DEBUG-ROLE] Assignment #${idx+1}:`, JSON.stringify(assignment));
          console.log(`[DEBUG-ROLE] - role_id: ${assignment.role_id} (type: ${typeof assignment.role_id})`);
        });
        
        // Verificar role_id=2 (ADMIN)
        const hasAdminRole = roleAssignments.some(ra => {
          const isAdmin = ra.role_id === 2;
          console.log(`[DEBUG-ROLE] Checking if role_id ${ra.role_id} === 2: ${isAdmin}`);
          return isAdmin;
        });
        
        if (hasAdminRole) {
          console.log('[DEBUG-ROLE] ✅ ADMIN role found (role_id=2)');
          return 'ADMIN';
        }
        
        // Verificar role_id=3 (BROKER)
        const hasBrokerRole = roleAssignments.some(ra => ra.role_id === 3);
        if (hasBrokerRole) {
          console.log('[DEBUG-ROLE] ✅ BROKER role found (role_id=3)');
          return 'BROKER';
        }
        
        console.log('[DEBUG-ROLE] No special role found in assignments');
      } else {
        console.log('[DEBUG-ROLE] No role assignments found for this user');
      }
      
      // 3. Verificar tablas relacionadas como último recurso
      console.log('[DEBUG-ROLE] Attempting direct query to user_roles table...');
      try {
        const { data: rolesData } = await supabase.from('user_roles').select('*');
        console.log('[DEBUG-ROLE] Available roles in system:', JSON.stringify(rolesData));
      } catch (e) {
        console.error('[DEBUG-ROLE] Error querying user_roles table:', e);
      }
      
      // 4. Fallback a USER como valor predeterminado seguro
      console.log('[DEBUG-ROLE] Defaulting to USER role');
      return 'USER';
      
    } catch (error) {
      console.error('[DEBUG-ROLE] ❌ Unexpected error in fetchUserRole:', error);
      console.error('[DEBUG-ROLE] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Último recurso - verificar email
      if (user?.email) {
        const email = user.email.toLowerCase();
        if (email.includes('william19d') || email.includes('admin')) {
          console.log('[DEBUG-ROLE] ⭐ Admin detected by email fallback');
          return 'ADMIN';
        }
      }
      
      return 'USER';
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('[DEBUG-AUTH] Auth provider initializing...');
    let isMounted = true;
    
    const setData = async () => {
      try {
        console.log('[DEBUG-AUTH] Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[DEBUG-AUTH] Error getting session:', error);
          if (isMounted) setLoading(false);
          return;
        }
        
        if (!session) {
          console.log('[DEBUG-AUTH] No session found, user is not authenticated');
          if (isMounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            setLoading(false);
          }
          return;
        }
        
        // Session found - user is authenticated
        console.log('[DEBUG-AUTH] Session found for user:', session.user.id);
        console.log('[DEBUG-AUTH] User email:', session.user.email);
        
        if (isMounted) {
          setSession(session);
          setUser(session.user);
          
          // WILLIAM19D SPECIAL CASE - CHECK IMMEDIATELY BY EMAIL
          if (session.user.email?.toLowerCase().includes('william19d')) {
            console.log('[DEBUG-AUTH] ⭐ WILLIAM19D detected by email, setting ADMIN role directly');
            setUserRole('ADMIN');
          } else {
            // For other users, fetch role normally
            console.log('[DEBUG-AUTH] Fetching role for regular user');
            const role = await fetchUserRole(session.user.id);
            console.log('[DEBUG-AUTH] Role determined:', role);
            setUserRole(role);
          }
          
          setLoading(false);
        }
      } catch (e) {
        console.error('[DEBUG-AUTH] Error in setData:', e);
        if (isMounted) setLoading(false);
      }
    };
    
    setData();
    
    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[DEBUG-AUTH] Auth state changed. Event:', event);
        
        if (isMounted) {
          if (!session) {
            console.log('[DEBUG-AUTH] No session in auth change event (logged out)');
            setSession(null);
            setUser(null);
            setUserRole(null);
            setLoading(false);
            return;
          }
          
          console.log('[DEBUG-AUTH] New session in auth change event for user:', session.user.id);
          setSession(session);
          setUser(session.user);
          
          // WILLIAM19D SPECIAL CASE
          if (session.user.email?.toLowerCase().includes('william19d')) {
            console.log('[DEBUG-AUTH] ⭐ WILLIAM19D detected in auth change, setting ADMIN role');
            setUserRole('ADMIN');
          } else {
            const role = await fetchUserRole(session.user.id);
            console.log('[DEBUG-AUTH] Role after auth change:', role);
            setUserRole(role);
          }
          
          setLoading(false);
        }
      }
    );
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[DEBUG-AUTH] Safety timeout triggered. Force setting loading to false.');
        setLoading(false);
      }
    }, 5000);

    return () => {
      console.log('[DEBUG-AUTH] Cleaning up auth provider...');
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Enhanced sign in function with better debugging
  const signIn = async (email: string, password: string) => {
    try {
      console.log(`[DEBUG-AUTH] Attempting login with email: ${email}`);
      
      // DETECT WILLIAM19D EARLY
      const isWilliamAccount = email.toLowerCase().includes('william19d');
      if (isWilliamAccount) {
        console.log('[DEBUG-AUTH] ⭐ WILLIAM19D login attempt detected');
      }
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[DEBUG-AUTH] Sign in error:', error);
        return { error };
      }
      
      if (!data.user) {
        console.error('[DEBUG-AUTH] No user data returned from sign in');
        return { error: new Error('No user data returned from sign in') };
      }
      
      console.log(`[DEBUG-AUTH] Successfully authenticated user: ${data.user.id}`);
      console.log('[DEBUG-AUTH] User email:', data.user.email);
      
      // Update state
      setUser(data.user);
      setSession(data.session);
      
      // WILLIAM19D SPECIAL HANDLING
      if (isWilliamAccount) {
        console.log('[DEBUG-AUTH] ⭐ Setting ADMIN role directly for WILLIAM19D');
        setUserRole('ADMIN');
        localStorage.setItem('userRole', 'ADMIN'); // Backup in localStorage
        return { error: null };
      }
      
      // For other users, fetch role
      try {
        console.log('[DEBUG-AUTH] Fetching role for regular user after login');
        const { data: roleData, error: roleError } = await supabase
          .from('user_role_assignments')
          .select('role_id')
          .eq('user_id', data.user.id);
        
        console.log('[DEBUG-AUTH] Role query result:', roleData, roleError);
        
        if (roleError) {
          console.error('[DEBUG-AUTH] Error fetching role after login:', roleError);
          setUserRole('USER');
        } else if (roleData && roleData.length > 0) {
          console.log('[DEBUG-AUTH] Processing role assignments:', roleData);
          
          if (roleData.some(r => r.role_id === 2)) {
            console.log('[DEBUG-AUTH] Setting ADMIN role');
            setUserRole('ADMIN');
          } else if (roleData.some(r => r.role_id === 3)) {
            console.log('[DEBUG-AUTH] Setting BROKER role');
            setUserRole('BROKER');
          } else {
            console.log('[DEBUG-AUTH] Setting USER role');
            setUserRole('USER');
          }
        } else {
          console.log('[DEBUG-AUTH] No role assignments found, setting USER role');
          setUserRole('USER');
        }
      } catch (roleError) {
        console.error('[DEBUG-AUTH] Exception in role processing:', roleError);
        setUserRole('USER');
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('[DEBUG-AUTH] Error in signIn function:', error);
      return { error };
    }
  };

  // Sign up with default role assignment
  const signUp = async (email: string, password: string) => {
    try {
      console.log(`[DEBUG-AUTH] Attempting signup for: ${email}`);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('[DEBUG-AUTH] Signup error:', error);
        throw error;
      }
      
      console.log('[DEBUG-AUTH] Signup successful, creating role assignment');
      
      // Create role assignment for new user with default USER role
      if (data.user) {
        // Default to role_id 1 (USER)
        let userRoleId = 1;
        
        try {
          // Attempt to verify the correct USER role ID from user_roles table
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('id')
            .eq('name', 'USER')
            .single();
            
          if (roleData) {
            userRoleId = roleData.id;
            console.log('[DEBUG-AUTH] Found USER role ID:', userRoleId);
          }
        } catch (e) {
          console.error('[DEBUG-AUTH] Error finding USER role ID, using default 1:', e);
        }
        
        // Insert role assignment
        const { error: roleError } = await supabase
          .from('user_role_assignments')
          .insert([{
            user_id: data.user.id,
            role_id: userRoleId
          }]);
          
        if (roleError) {
          console.error('[DEBUG-AUTH] Error assigning default role:', roleError);
        } else {
          console.log(`[DEBUG-AUTH] Successfully assigned role_id ${userRoleId} to user ${data.user.id}`);
        }
      }
      
      return { error: null, data };
    } catch (error: any) {
      return { error, data: null };
    }
  };

  // Enhanced sign out with thorough cleanup
  const signOut = async () => {
    try {
      console.log('[DEBUG-AUTH] Starting sign out process...');
      
      // Clear state first
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Clear localStorage before signing out from Supabase
      console.log('[DEBUG-AUTH] Clearing localStorage...');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('bypassAuth');
      localStorage.clear(); // For good measure
      
      // Sign out from Supabase
      console.log('[DEBUG-AUTH] Calling Supabase signOut...');
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force reload the page to ensure complete reset
      console.log('[DEBUG-AUTH] Reloading page to complete sign out...');
      window.location.href = '/';
      
      console.log('[DEBUG-AUTH] Sign out process complete');
    } catch (error) {
      console.error('[DEBUG-AUTH] Error during sign out:', error);
      // Even if error occurs, try to clean up
      localStorage.clear();
      window.location.href = '/';
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      console.log(`[DEBUG-AUTH] Sending password reset to: ${email}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('[DEBUG-AUTH] Password reset error:', error);
        return { error };
      }
      
      console.log('[DEBUG-AUTH] Password reset email sent successfully');
      return { error: null };
    } catch (error: any) {
      console.error('[DEBUG-AUTH] Error in resetPassword:', error);
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