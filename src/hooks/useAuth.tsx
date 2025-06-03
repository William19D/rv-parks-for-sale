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

  // Function to fetch user role with better error handling and logging
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    if (!userId) return null;
    
    try {
      console.log('[Auth] Fetching role for user:', userId);
      
      // Consulta directa y simple a la tabla user_role_assignments
      const { data: roleAssignments, error: roleError } = await supabase
        .from('user_role_assignments')
        .select('role_id')
        .eq('user_id', userId);
      
      console.log('[Auth] Raw role assignments data:', JSON.stringify(roleAssignments));
      
      if (roleError) {
        console.error('[Auth] Error fetching role assignments:', roleError);
        return null;
      }
      
      if (!roleAssignments || roleAssignments.length === 0) {
        console.log('[Auth] No role assignments found for user', userId);
        return 'USER';
      }
      
      // Verificar explícitamente el role_id = 2 para ADMIN
      for (const assignment of roleAssignments) {
        console.log('[Auth] Checking role assignment:', assignment);
        
        if (assignment.role_id === 2) {
          console.log('[Auth] Found ADMIN role (role_id = 2)');
          return 'ADMIN';
        }
      }
      
      // Si llegamos aquí, el usuario no es admin, verificar si es broker (role_id = 3)
      if (roleAssignments.some(ra => ra.role_id === 3)) {
        console.log('[Auth] Found BROKER role (role_id = 3)');
        return 'BROKER';
      }
      
      // Si no tiene roles especiales, asignar como usuario normal
      console.log('[Auth] No special role found, defaulting to USER');
      return 'USER';
    } catch (error) {
      console.error('[Auth] Error in fetchUserRole:', error);
      console.error('[Auth] Error details:', JSON.stringify(error));
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('[Auth] Initializing auth provider...');
    let isMounted = true;
    
    const setData = async () => {
      try {
        console.log('[Auth] Checking for existing session...');
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
        
        console.log('[Auth] Session found for user:', session.user.id);
        
        if (isMounted) {
          setSession(session);
          setUser(session.user);
          
          // Fetch user role
          const role = await fetchUserRole(session.user.id);
          console.log('[Auth] Fetched user role:', role);
          setUserRole(role);
          
          setLoading(false);
        }
      } catch (e) {
        console.error('[Auth] Error in setData:', e);
        if (isMounted) setLoading(false);
      }
    };
    
    setData();
    
    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed. Event:', event);
        
        if (isMounted) {
          if (!session) {
            // User logged out
            console.log('[Auth] No session in auth change event');
            setSession(null);
            setUser(null);
            setUserRole(null);
            setLoading(false);
            return;
          }
          
          // User logged in or session updated
          console.log('[Auth] New session in auth change event for user:', session.user.id);
          setSession(session);
          setUser(session.user);
          
          // Fetch role
          const role = await fetchUserRole(session.user.id);
          console.log('[Auth] User role after auth change:', role);
          setUserRole(role);
          
          setLoading(false);
        }
      }
    );
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Auth] Safety timeout triggered. Force setting loading to false.');
        setLoading(false);
      }
    }, 5000);

    return () => {
      console.log('[Auth] Cleaning up auth provider...');
      isMounted = false;
      clearTimeout(safetyTimeout);
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
      
      // Actualizar estados de usuario y sesión inmediatamente
      setUser(data.user);
      setSession(data.session);
      
      // Buscar explícitamente el rol directo en la base de datos
      console.log(`[Auth] Checking role assignments for user ${data.user.id}...`);
      
      try {
        const { data: roleData, error: roleError } = await supabase
          .from('user_role_assignments')
          .select('role_id')
          .eq('user_id', data.user.id);
        
        console.log('[Auth] Role assignments found:', roleData);
        
        if (roleError) {
          console.error('[Auth] Error fetching role:', roleError);
        } else if (roleData && roleData.length > 0) {
          // Asignar rol explícitamente basado en role_id
          if (roleData.some(r => r.role_id === 2)) {
            console.log('[Auth] Setting user role to ADMIN');
            setUserRole('ADMIN');
          } else if (roleData.some(r => r.role_id === 3)) {
            console.log('[Auth] Setting user role to BROKER');
            setUserRole('BROKER');
          } else {
            console.log('[Auth] Setting user role to USER');
            setUserRole('USER');
          }
        } else {
          console.log('[Auth] No roles found, defaulting to USER');
          setUserRole('USER');
        }
      } catch (roleError) {
        console.error('[Auth] Error in role checking:', roleError);
        setUserRole('USER'); // Default fallback
      }
      
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
      console.log('[Auth] Iniciando proceso de cierre de sesión...');
      
      // Limpiar estado local primero
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Limpiar localStorage y sesión de Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Forzar la limpieza del localStorage para evitar persistencia no deseada
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
      
      // Limpiar cualquier dato adicional que pueda haber
      localStorage.removeItem('userRole');
      localStorage.removeItem('bypassAuth');
      localStorage.removeItem('userFirstName');
      localStorage.removeItem('userLastName');
      
      // Forzar recarga de la página para asegurar limpieza completa
      window.location.href = '/';
      
      console.log('[Auth] Sesión cerrada correctamente');
    } catch (error) {
      console.error('[Auth] Error en función signOut:', error);
      // Incluso si hay error, intentar forzar la limpieza
      localStorage.clear();
      window.location.href = '/';
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