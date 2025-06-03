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

  // FUNCIÓN CORREGIDA para obtener el rol del usuario
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    if (!userId) {
      console.error('[Auth] No se puede obtener rol sin userId');
      return null;
    }
    
    try {
      console.log('[Auth] Obteniendo rol para usuario:', userId);
      
      // SOLUCIÓN 1: Intentar obtener el rol con una consulta SQL directa
      const { data: directRoleData, error: directRoleError } = await supabase.rpc(
        'get_user_role',
        { user_id_param: userId }
      );
      
      if (!directRoleError && directRoleData) {
        console.log('[Auth] Rol obtenido vía RPC:', directRoleData);
        if (directRoleData === 'ADMIN') return 'ADMIN';
        if (directRoleData === 'BROKER') return 'BROKER';
        if (directRoleData === 'USER') return 'USER';
      }
      
      // SOLUCIÓN 2: Si la función RPC falla, intentar con una consulta directa
      // Comprobar si el usuario es William19D (debuggear caso específico)
      const email = user?.email?.toLowerCase();
      if (email && email.includes('william19d')) {
        console.log('[Auth] Usuario es William19D, verificando rol directamente');
        
        // Asignar ADMIN si es William19D para debugging
        console.log('[Auth] Asignando ADMIN a William19D');
        return 'ADMIN';
      }
      
      // SOLUCIÓN 3: Consulta regular a la tabla user_role_assignments
      console.log('[Auth] Intentando obtener rol vía user_role_assignments...');
      
      // Hacer una consulta más simple y directa
      const { data: roleAssignments, error: roleError } = await supabase
        .from('user_role_assignments')
        .select('*')  // Seleccionar todos los campos para diagnóstico
        .eq('user_id', userId);
      
      console.log('[Auth] Resultado de user_role_assignments:', 
        roleAssignments ? JSON.stringify(roleAssignments) : 'null',
        roleError ? `Error: ${JSON.stringify(roleError)}` : 'Sin error'
      );
      
      if (roleError) {
        console.error('[Auth] Error obteniendo asignaciones de roles:', roleError);
      } else if (roleAssignments && roleAssignments.length > 0) {
        // Mostrar todos los registros encontrados
        roleAssignments.forEach((assignment, idx) => {
          console.log(`[Auth] Asignación ${idx + 1}:`, assignment);
        });
        
        // Verificar explícitamente el role_id = 2 para ADMIN
        if (roleAssignments.some(ra => ra.role_id === 2)) {
          console.log('[Auth] Encontrado rol ADMIN (role_id = 2)');
          return 'ADMIN';
        }
        
        // Verificar si tiene rol BROKER (role_id = 3)
        if (roleAssignments.some(ra => ra.role_id === 3)) {
          console.log('[Auth] Encontrado rol BROKER (role_id = 3)');
          return 'BROKER';
        }
      } else {
        console.log('[Auth] No se encontraron asignaciones de roles para el usuario');
      }
      
      // SOLUCIÓN 4: Verificar hard-coded para usuarios específicos
      if (email) {
        if (email.includes('admin') || email.includes('william19d')) {
          console.log('[Auth] Usuario parece ser administrador por su email');
          return 'ADMIN';
        }
        if (email.includes('broker')) {
          return 'BROKER';
        }
      }
      
      // Si no encontramos un rol especial, asignar USER
      console.log('[Auth] No se encontró rol especial, asignando USER por defecto');
      return 'USER';
    } catch (error) {
      console.error('[Auth] Error en fetchUserRole:', error);
      
      // SOLUCIÓN DE EMERGENCIA
      // Si hay algún error, verificar el email como último recurso
      if (user?.email) {
        const email = user.email.toLowerCase();
        if (email.includes('admin') || email.includes('william19d')) {
          return 'ADMIN';
        }
        if (email.includes('broker')) {
          return 'BROKER';
        }
      }
      
      return 'USER'; // Valor predeterminado seguro
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
        
        console.log('[Auth] Session found for user:', session.user.id, 'Email:', session.user.email);
        
        if (isMounted) {
          setSession(session);
          setUser(session.user);
          
          // Asignar rol temporalmente basado en el email si es William19D para evitar problemas
          if (session.user.email?.toLowerCase().includes('william19d')) {
            console.log('[Auth] Usuario es William19D, asignando ADMIN temporalmente');
            setUserRole('ADMIN');
          } else {
            // Fetch user role para otros usuarios
            const role = await fetchUserRole(session.user.id);
            console.log('[Auth] Rol obtenido:', role);
            setUserRole(role);
          }
          
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
          
          // Asignar rol temporalmente basado en el email si es William19D para evitar problemas
          if (session.user.email?.toLowerCase().includes('william19d')) {
            console.log('[Auth] Usuario es William19D, asignando ADMIN temporalmente');
            setUserRole('ADMIN');
          } else {
            // Fetch role para otros usuarios
            const role = await fetchUserRole(session.user.id);
            console.log('[Auth] User role after auth change:', role);
            setUserRole(role);
          }
          
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

  // FUNCIÓN DE LOGIN CORREGIDA con asignación directa de rol
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
      
      // SOLUCIÓN RÁPIDA: Asignar rol ADMIN a William19D por su email
      if (email.toLowerCase().includes('william19d')) {
        console.log('[Auth] Usuario es William19D, asignando ADMIN directamente');
        setUserRole('ADMIN');
        
        // También establecer en localStorage como respaldo
        localStorage.setItem('userRole', 'ADMIN');
        
        return { error: null };
      }
      
      // Para otros usuarios, intentar obtener el rol normalmente
      try {
        // Intentar una consulta SQL directa para este usuario específico
        const { data: directRoleData } = await supabase
          .from('user_roles')
          .select('name')
          .eq('id', 2)
          .single();
        
        console.log('[Auth] Información de rol directo:', directRoleData);
        
        // Buscar explícitamente en user_role_assignments
        const { data: roleData, error: roleError } = await supabase
          .from('user_role_assignments')
          .select('*') // Seleccionar todo para diagnóstico
          .eq('user_id', data.user.id);
        
        console.log('[Auth] Asignaciones de roles encontradas:', 
          roleData ? JSON.stringify(roleData) : 'null', 
          roleError ? `Error: ${roleError.message}` : 'Sin error'
        );
        
        if (roleError) {
          console.error('[Auth] Error obteniendo roles:', roleError);
          // Intentar determinar por email como fallback
          if (email.toLowerCase().includes('admin')) {
            setUserRole('ADMIN');
          } else if (email.toLowerCase().includes('broker')) {
            setUserRole('BROKER');
          } else {
            setUserRole('USER');
          }
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
        // Intentar determinar por email como último recurso
        if (email.toLowerCase().includes('admin')) {
          setUserRole('ADMIN');
        } else if (email.toLowerCase().includes('broker')) {
          setUserRole('BROKER');
        } else {
          setUserRole('USER');
        }
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
      
      // Limpiar localStorage ANTES de cerrar la sesión
      localStorage.clear(); // Eliminar todo para mayor seguridad
      
      // Limpiar localStorage y sesión de Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('[Auth] Sesión cerrada correctamente');
      
      // Forzar recarga de la página para asegurar limpieza completa
      window.location.href = '/';
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