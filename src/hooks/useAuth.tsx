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

  // Verificar si un email existe en la tabla admins (solo comprueba existencia)
  const checkAdminEmail = async (email: string) => {
    try {
      console.log(`[Auth] Verificando si ${email} existe en tabla admins`);
      const { data, error } = await supabase
        .from('admins') // CORREGIDO: Usar 'admins' en plural
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error) {
        console.log(`[Auth] Email no encontrado en tabla admins:`, error.message);
        return null;
      }
      
      console.log(`[Auth] Admin encontrado:`, data);
      return data;
    } catch (error) {
      console.error(`[Auth] Error verificando admin:`, error);
      return null;
    }
  };
  
  // Autenticar usuario como admin - Versión simplificada y mejorada
  const authenticateAdmin = async (email: string, password: string) => {
    try {
      console.log(`[Auth] Autenticando admin con email: ${email}`);
      
      // IMPORTANTE: Limpiar cualquier bypass previo
      localStorage.removeItem('bypassAuth');
      
      // VERIFICAR PRIMERO LA EXISTENCIA DEL EMAIL
      const { data: adminExists, error: existsError } = await supabase
        .from('admins') // CORREGIDO: Usar 'admins' en plural
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
      
      if (existsError || !adminExists) {
        console.log(`[Auth] Admin no encontrado:`, existsError?.message || 'No existe');
        return { error: new Error('Email no registrado como administrador'), data: null };
      }
      
      // AHORA VERIFICAR LA CONTRASEÑA
      if (adminExists.password !== password) {
        console.log(`[Auth] Contraseña incorrecta para admin`);
        return { error: new Error('Contraseña incorrecta'), data: null };
      }
      
      // Autenticación correcta
      console.log(`[Auth] Admin autenticado correctamente:`, adminExists);
      
      // Crear un objeto "user" para mantener compatibilidad con la interfaz
      const adminUser = {
        id: adminExists.id,
        email: adminExists.email,
        user_metadata: { name: adminExists.name || 'Admin' },
        app_metadata: { role: 'ADMIN' },
      } as unknown as User;
      
      // Guardar datos en localStorage para persistencia
      localStorage.setItem('adminUser', JSON.stringify({
        id: adminExists.id,
        email: adminExists.email,
        name: adminExists.name || 'Admin'
      }));
      localStorage.setItem('userRole', 'ADMIN');
      
      return { error: null, data: adminUser };
    } catch (error) {
      console.error(`[Auth] Error en authenticateAdmin:`, error);
      return { error, data: null };
    }
  };
  
  // Obtener rol de usuario normal
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    if (!userId) return null;
    
    try {
      console.log(`[Auth] Obteniendo rol para usuario: ${userId}`);
      
      // Verificar roles en tabla user_role_assignments
      const { data: roleAssignments, error } = await supabase
        .from('user_role_assignments')
        .select('role_id')
        .eq('user_id', userId);
      
      if (error) {
        console.error('[Auth] Error obteniendo asignaciones de rol:', error);
        return 'USER';
      }
      
      if (!roleAssignments || roleAssignments.length === 0) {
        console.log('[Auth] No se encontraron asignaciones de rol');
        return 'USER';
      }
      
      // Verificar si tiene rol admin (role_id = 2)
      if (roleAssignments.some(ra => ra.role_id === 2)) {
        console.log('[Auth] Usuario tiene rol ADMIN (role_id = 2)');
        return 'ADMIN';
      }
      
      // Verificar si tiene rol broker (role_id = 3)
      if (roleAssignments.some(ra => ra.role_id === 3)) {
        console.log('[Auth] Usuario tiene rol BROKER (role_id = 3)');
        return 'BROKER';
      }
      
      console.log('[Auth] Usuario tiene rol USER por defecto');
      return 'USER';
    } catch (error) {
      console.error('[Auth] Error en fetchUserRole:', error);
      return 'USER';
    }
  };
  
  // Inicializar estado de autenticación
  useEffect(() => {
    console.log('[Auth] Inicializando proveedor de autenticación');
    let isMounted = true;
    
    const setData = async () => {
      try {
        // Verificar primero si hay una sesión de admin en localStorage
        const adminData = localStorage.getItem('adminUser');
        if (adminData) {
          try {
            const admin = JSON.parse(adminData);
            console.log('[Auth] Sesión de admin encontrada en localStorage:', admin.email);
            
            if (isMounted) {
              // Comprobar que sigue existiendo en la base de datos
              const { data: adminStillExists } = await supabase
                .from('admins') // CORREGIDO: Usar 'admins' en plural
                .select('*')
                .eq('email', admin.email)
                .single();
              
              if (!adminStillExists) {
                console.log('[Auth] El admin ya no existe en la base de datos');
                localStorage.removeItem('adminUser');
                localStorage.removeItem('userRole');
                setLoading(false);
                return;
              }
              
              // Crear un objeto de usuario para mantener compatibilidad
              const simulatedUser = {
                id: admin.id,
                email: admin.email,
                user_metadata: { name: admin.name || 'Admin' },
                app_metadata: { role: 'ADMIN' },
                role: 'admin'
              } as unknown as User;
              
              setUser(simulatedUser);
              setUserRole('ADMIN');
              setLoading(false);
            }
            return;
          } catch (e) {
            console.error('[Auth] Error parseando datos de admin:', e);
            localStorage.removeItem('adminUser');
          }
        }
        
        // Si no hay sesión de admin, verificar sesión normal de Supabase
        console.log('[Auth] Verificando sesión normal de Supabase');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error obteniendo sesión:', error);
          if (isMounted) setLoading(false);
          return;
        }
        
        if (!session) {
          console.log('[Auth] No se encontró sesión');
          if (isMounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            setLoading(false);
          }
          return;
        }
        
        console.log('[Auth] Sesión encontrada para usuario:', session.user.id);
        
        // Verificar si el usuario es admin (comprobando en tabla admins)
        const adminRecord = await checkAdminEmail(session.user.email || '');
        
        if (adminRecord) {
          console.log('[Auth] Usuario encontrado en tabla admins:', adminRecord.email);
          
          if (isMounted) {
            setUser(session.user);
            setSession(session);
            setUserRole('ADMIN');
            
            // Guardar en localStorage para futuras verificaciones
            localStorage.setItem('adminUser', JSON.stringify({
              id: adminRecord.id,
              email: adminRecord.email,
              name: adminRecord.name || 'Admin'
            }));
            localStorage.setItem('userRole', 'ADMIN');
            
            setLoading(false);
          }
          return;
        }
        
        // Si no es admin, continuar con la sesión normal
        if (isMounted) {
          setUser(session.user);
          setSession(session);
          
          // Obtener rol de usuario normal
          const role = await fetchUserRole(session.user.id);
          console.log('[Auth] Rol obtenido:', role);
          setUserRole(role);
          
          setLoading(false);
        }
      } catch (e) {
        console.error('[Auth] Error en setData:', e);
        if (isMounted) setLoading(false);
      }
    };
    
    setData();
    
    // Listener para cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Cambio en estado de autenticación:', event);
        
        if (isMounted) {
          if (!session) {
            console.log('[Auth] No hay sesión en evento de cambio');
            setSession(null);
            setUser(null);
            setUserRole(null);
            setLoading(false);
            return;
          }
          
          console.log('[Auth] Nueva sesión en evento de cambio:', session.user.id);
          
          // Verificar si el usuario es admin
          const adminRecord = await checkAdminEmail(session.user.email || '');
          
          if (adminRecord) {
            console.log('[Auth] Usuario es admin en evento de cambio');
            setUser(session.user);
            setSession(session);
            setUserRole('ADMIN');
            localStorage.setItem('userRole', 'ADMIN');
            
            // Guardar en localStorage
            localStorage.setItem('adminUser', JSON.stringify({
              id: adminRecord.id,
              email: adminRecord.email,
              name: adminRecord.name || 'Admin'
            }));
          } else {
            // Usuario normal
            setUser(session.user);
            setSession(session);
            
            const role = await fetchUserRole(session.user.id);
            console.log('[Auth] Rol después de cambio:', role);
            setUserRole(role);
          }
          
          setLoading(false);
        }
      }
    );
    
    // Safety timeout para prevenir carga infinita
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Auth] Safety timeout triggered, forzando loading a false');
        setLoading(false);
      }
    }, 5000);
    
    return () => {
      console.log('[Auth] Limpiando proveedor de autenticación');
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);
  
  // FUNCIÓN CORREGIDA: Iniciar sesión (primero verificando en tabla admins)
  const signIn = async (email: string, password: string) => {
    try {
      console.log(`[Auth] Iniciando proceso de login para: ${email}`);
      
      // Limpiar cualquier dato previo
      localStorage.removeItem('adminUser');
      localStorage.removeItem('userRole');
      localStorage.removeItem('bypassAuth');
      
      // PASO 1: Verificar si el email existe en la tabla admins
      console.log(`[Auth] Verificando si existe en tabla admins: ${email}`);
      const { data: adminExists } = await supabase
        .from('admins') // CORREGIDO: Usar 'admins' en plural
        .select('email')
        .eq('email', email.toLowerCase());
      
      // Si el email existe en tabla admins, intentar autenticación admin
      if (adminExists && adminExists.length > 0) {
        console.log(`[Auth] Email encontrado en tabla admins, autenticando...`);
        const { error: adminError, data: adminData } = await authenticateAdmin(email, password);
        
        if (!adminError && adminData) {
          console.log(`[Auth] Login exitoso como admin`);
          setUser(adminData);
          setUserRole('ADMIN');
          return { error: null };
        } else {
          console.error('[Auth] Error autenticando admin:', adminError);
          return { error: adminError };
        }
      }
      
      // PASO 2: Si no es admin, intentar autenticación normal con Supabase
      console.log(`[Auth] No es admin, intentando auth normal de Supabase`);
      
      try {
        const { error: supabaseError, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (supabaseError) {
          console.error('[Auth] Error autenticación Supabase:', supabaseError);
          return { error: supabaseError };
        }
        
        if (!data || !data.user) {
          console.error('[Auth] No se recibieron datos de usuario');
          return { error: new Error('No se recibieron datos de usuario') };
        }
        
        console.log(`[Auth] Usuario autenticado exitosamente:`, data.user);
        setUser(data.user);
        setSession(data.session);
        
        const role = await fetchUserRole(data.user.id);
        console.log('[Auth] Rol asignado:', role);
        setUserRole(role);
        
        return { error: null };
      } catch (authError) {
        console.error('[Auth] Error inesperado en auth Supabase:', authError);
        return { error: authError };
      }
    } catch (error: any) {
      console.error('[Auth] Error general en signIn:', error);
      return { error };
    }
  };
  
  // Función de registro (solo para usuarios normales)
  const signUp = async (email: string, password: string) => {
    try {
      // Verificar primero si el email existe en tabla admins
      const adminData = await checkAdminEmail(email);
      
      if (adminData) {
        return {
          error: new Error('Este correo ya está registrado como administrador'),
          data: null
        };
      }
      
      // Proceder con registro normal
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        return { error, data: null };
      }
      
      console.log('[Auth] Registro exitoso para:', email);
      
      // Asignar rol USER por defecto
      if (data.user) {
        // Determinar el role_id para USER
        let userRoleId = 1; // Default
        
        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('id')
            .eq('name', 'USER')
            .single();
            
          if (roleData) {
            userRoleId = roleData.id;
            console.log('[Auth] ID de rol USER encontrado:', userRoleId);
          }
        } catch (e) {
          console.error('[Auth] Error encontrando ID de rol USER:', e);
        }
        
        // Insertar asignación de rol
        const { error: roleError } = await supabase
          .from('user_role_assignments')
          .insert([{
            user_id: data.user.id,
            role_id: userRoleId
          }]);
          
        if (roleError) {
          console.error('[Auth] Error asignando rol predeterminado:', roleError);
        } else {
          console.log(`[Auth] Rol ${userRoleId} asignado a usuario ${data.user.id}`);
        }
      }
      
      return { error: null, data };
    } catch (error: any) {
      console.error('[Auth] Error en signUp:', error);
      return { error, data: null };
    }
  };
  
  // Cerrar sesión (funciona para admins y usuarios normales)
  const signOut = async () => {
    try {
      console.log('[Auth] Iniciando proceso de cierre de sesión');
      
      // Limpiar estado
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Limpiar localStorage
      localStorage.removeItem('adminUser');
      localStorage.removeItem('userRole');
      localStorage.clear();
      
      // Para usuarios normales, cerrar sesión en Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Forzar recarga para limpiar completamente el estado
      window.location.href = '/';
      
      console.log('[Auth] Sesión cerrada correctamente');
    } catch (error) {
      console.error('[Auth] Error en signOut:', error);
      localStorage.clear();
      window.location.href = '/';
    }
  };
  
  // Restablecer contraseña (solo para usuarios normales)
  const resetPassword = async (email: string) => {
    try {
      // Verificar si es admin
      const adminData = await checkAdminEmail(email);
      
      if (adminData) {
        return {
          error: new Error('Los administradores deben contactar al soporte técnico para restablecer su contraseña')
        };
      }
      
      // Proceso normal para usuarios
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
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