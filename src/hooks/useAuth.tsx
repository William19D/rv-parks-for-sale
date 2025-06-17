import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Define types for permissions and roles
export type Role = 'admin' | 'user' | string;
export type Permission = 'create_listing' | 'edit_listing' | 'delete_listing' | 'view_admin_dashboard' | string;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken?: string | null) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  roles: Role[];
  isAdmin: boolean;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Environment constants
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const IS_DEV = import.meta.env.DEV === true || window.location.hostname === 'localhost';
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 
                   (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/auth-service` : '');

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Setup auth state listener
  useEffect(() => {
    console.log('[Auth] Setting up auth state listener');
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[Auth] Auth state changed: ${event}`, currentSession?.user?.id);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Fetch roles and permissions after auth state change
          await getUserRoleAndPermissions(currentSession);
        } else {
          // Clear roles and permissions when logged out
          setRoles([]);
          setPermissions([]);
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    const initAuth = async () => {
      console.log('[Auth] Initializing auth state');
      
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        await getUserRoleAndPermissions(initialSession);
      }
      
      setLoading(false);
    };

    initAuth();

    // Cleanup subscription on unmount
    return () => {
      console.log('[Auth] Cleaning up auth subscription');
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch user role and permissions using the edge function
  const getUserRoleAndPermissions = async (currentSession: Session) => {
    try {
      console.log('[Auth] Fetching user role and permissions');
      
      // Use edge function if available, otherwise fallback to direct DB query
      if (AUTH_API_URL) {
        const response = await fetch(AUTH_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentSession.access_token}`
          },
          body: JSON.stringify({
            action: 'get_user_role'
          })
        });

        if (!response.ok) {
          throw new Error(`Error fetching role: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Set user role
        const userRole = data.role;
        setRoles([userRole]);
        setIsAdmin(userRole === 'admin');
        
        console.log(`[Auth] User role: ${userRole}`, data);

        // Then fetch permissions for this role
        await getUserPermissions(currentSession, userRole);
        
      } else {
        console.warn('[Auth] Edge function URL not available. Using direct query.');
        
        // Fallback using direct DB query if edge function is not available
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentSession.user.id)
          .single();

        if (roleError && roleError.code !== 'PGRST116') {
          throw roleError;
        }

        // Handle case where no role exists yet
        if (!roleData) {
          const newRole = 'user'; // Default role
          setRoles([newRole]);
          setIsAdmin(false);
          return;
        }

        setRoles([roleData.role]);
        setIsAdmin(roleData.role === 'admin');
        
        // Fetch permissions directly
        const { data: permData, error: permError } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role', roleData.role);

        if (permError) {
          throw permError;
        }

        if (permData) {
          const perms = permData.map(p => p.permission);
          setPermissions(perms);
          console.log(`[Auth] User permissions: ${perms.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('[Auth] Error fetching user role:', error);
      
      // Set default role on error
      setRoles(['user']);
      setIsAdmin(false);
      setPermissions([]);
    }
  };

  // Fetch permissions for a specific role
  const getUserPermissions = async (currentSession: Session, role: string) => {
    try {
      if (role === 'admin') {
        // Admins have all permissions by default
        setPermissions(['*']);
        return;
      }

      const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({
          action: 'get_role_permissions',
          role
        })
      });

      if (!response.ok) {
        throw new Error(`Error fetching permissions: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.permissions && Array.isArray(data.permissions)) {
        setPermissions(data.permissions);
        console.log(`[Auth] User permissions: ${data.permissions.join(', ')}`);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error('[Auth] Error fetching permissions:', error);
      setPermissions([]);
    }
  };

  // Function to manually refresh permissions (useful after role changes)
  const refreshPermissions = async () => {
    if (!session) {
      console.warn('[Auth] Cannot refresh permissions: No active session');
      return;
    }
    
    await getUserRoleAndPermissions(session);
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string, captchaToken: string | null = null) => {
    try {
      console.log('[Auth] Attempting sign in');
      
      if (AUTH_API_URL && captchaToken) {
        // Use edge function for login with captcha
        const response = await fetch(AUTH_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'login',
            email,
            password,
            userData: { captchaToken }
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          return { error: new Error(data.error || 'Failed to sign in') };
        }

        // Set the session in Supabase
        if (data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
          
          // The auth state change will trigger role fetching
          return {};
        }
        
      } else {
        // Fallback to direct Supabase auth
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          return { error };
        }
        
        // The auth state change will trigger role fetching
        return {};
      }
      
    } catch (error) {
      console.error('[Auth] Sign in error:', error);
      return { error: error as Error };
    }
    
    return {};
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log('[Auth] Signing out user');
      
      if (AUTH_API_URL && session?.access_token) {
        // Use edge function for logout
        await fetch(AUTH_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'logout'
          })
        }).catch(error => {
          console.error('[Auth] Error calling logout endpoint:', error);
        });
      }
      
      // Always perform local sign out regardless of edge function result
      await supabase.auth.signOut();
      
      // Clear auth state
      setUser(null);
      setSession(null);
      setRoles([]);
      setPermissions([]);
      setIsAdmin(false);
      
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    }
  };

  // Check if the user has a specific permission
  const hasPermission = (permission: Permission) => {
    if (!user) return false;
    
    // Admin or wildcard permission has access to everything
    if (isAdmin || permissions.includes('*')) return true;
    
    return permissions.includes(permission);
  };

  // Check if user has any of the provided permissions
  const hasAnyPermission = (permissionList: Permission[]) => {
    if (!user) return false;
    
    // Admin or wildcard permission has access to everything
    if (isAdmin || permissions.includes('*')) return true;
    
    return permissionList.some(p => permissions.includes(p));
  };

  // Check if user has all of the provided permissions
  const hasAllPermissions = (permissionList: Permission[]) => {
    if (!user) return false;
    
    // Admin or wildcard permission has access to everything
    if (isAdmin || permissions.includes('*')) return true;
    
    return permissionList.every(p => permissions.includes(p));
  };

  // Prepare context value
  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    roles,
    isAdmin,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access authentication state and functions
 * 
 * @example
 * // Basic usage
 * const { user, signOut } = useAuth();
 * 
 * @example
 * // Permission checking
 * const { hasPermission } = useAuth();
 * if (hasPermission('create_listing')) {
 *   // Show create button
 * }
 * 
 * @example
 * // Advanced permission checking
 * const { hasAnyPermission } = useAuth();
 * if (hasAnyPermission(['edit_listing', 'admin.listings'])) {
 *   // Show edit button
 * }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};