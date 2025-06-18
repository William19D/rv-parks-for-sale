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
  refreshPermissions: () => Promise<Role | null>;
  updateUserProfile: (metadata: Record<string, any>) => Promise<{ success?: boolean }>
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
      
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          setLoading(false);
          return;
        }
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await getUserRoleAndPermissions(initialSession);
        }
      } catch (err) {
        console.error('[Auth] Error during initialization:', err);
      } finally {
        setLoading(false);
      }
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
        const adminStatus = userRole === 'admin';
        setIsAdmin(adminStatus);
        
        console.log(`[Auth] User role: ${userRole}, isAdmin: ${adminStatus}`);

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

        if (roleError) {
          if (roleError.code === 'PGRST116') { // No rows returned
            // Handle case where no role exists yet by creating default role
            const { data: newRole, error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: currentSession.user.id,
                role: 'user',
                created_by: 'system'
              })
              .select('role')
              .single();
              
            if (insertError) {
              throw insertError;
            }
            
            setRoles([newRole?.role || 'user']);
            setIsAdmin(false);
            return;
          } else {
            throw roleError;
          }
        }

        const userRole = roleData?.role || 'user';
        setRoles([userRole]);
        const adminStatus = userRole === 'admin';
        setIsAdmin(adminStatus);
        
        console.log(`[Auth] User role (direct): ${userRole}, isAdmin: ${adminStatus}`);
        
        // Get direct permissions
        await fetchDirectPermissions(userRole);
      }
    } catch (error) {
      console.error('[Auth] Error fetching user role:', error);
      
      // On error, check for admin status in user metadata as fallback
      try {
        // Check if user has admin role in metadata
        const userMetadata = currentSession.user.user_metadata;
        if (userMetadata && userMetadata.role === 'admin') {
          console.log('[Auth] Admin role found in metadata');
          setRoles(['admin']);
          setIsAdmin(true);
          setPermissions(['*']); // Admin has all permissions
          return;
        }
      } catch (metadataError) {
        console.error('[Auth] Error checking metadata:', metadataError);
      }
      
      // Set default role on error
      setRoles(['user']);
      setIsAdmin(false);
      setPermissions([]);
    }
  };
  
  // Helper to fetch permissions directly from database
  const fetchDirectPermissions = async (role: string) => {
    // Admin has all permissions by default
    if (role === 'admin') {
      setPermissions(['*']);
      return;
    }
    
    try {
      const { data: permData, error: permError } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', role);

      if (permError) {
        throw permError;
      }

      if (permData && Array.isArray(permData)) {
        const permsList = permData.map(p => p.permission);
        setPermissions(permsList);
        console.log(`[Auth] User permissions: ${permsList.join(', ')}`);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error('[Auth] Error fetching direct permissions:', error);
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

      // Use the edge function to get role permissions
      if (AUTH_API_URL) {
        try {
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
            console.error(`[Auth] Error getting role permissions: ${response.status}`);
            // Fall back to checking specific permissions
            await fallbackGetPermissions(currentSession, role);
            return;
          }

          const data = await response.json();
          
          if (data.permissions && Array.isArray(data.permissions)) {
            setPermissions(data.permissions);
            console.log(`[Auth] User permissions from API: ${data.permissions.join(', ')}`);
          } else {
            console.warn('[Auth] No permissions returned from API, falling back to direct query');
            await fetchDirectPermissions(role);
          }
        } catch (error) {
          console.error('[Auth] Error fetching role permissions:', error);
          // Fall back to direct method
          await fallbackGetPermissions(currentSession, role);
        }
      } else {
        // No edge function, use direct query
        await fetchDirectPermissions(role);
      }
    } catch (error) {
      console.error('[Auth] Error in getUserPermissions:', error);
      setPermissions([]);
    }
  };

  // Fallback method to check specific permissions
  const fallbackGetPermissions = async (currentSession: Session, role: string) => {
    try {
      // Try to use check_permission endpoint for admin dashboard
      if (AUTH_API_URL) {
        try {
          const response = await fetch(AUTH_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentSession.access_token}`
            },
            body: JSON.stringify({
              action: 'check_permission',
              permission: 'view_admin_dashboard'
            })
          });
  
          if (response.ok) {
            const data = await response.json();
            
            if (data.hasPermission) {
              // If user has admin dashboard permission, add it to permissions
              setPermissions(['view_admin_dashboard']);
              return;
            }
          }
        } catch (error) {
          console.error('[Auth] Error checking specific permission:', error);
        }
      }
      
      // Fall back to direct DB query for all permissions
      await fetchDirectPermissions(role);
    } catch (error) {
      console.error('[Auth] Error in fallback permission check:', error);
      setPermissions([]);
    }
  };

  // Function to manually refresh user's role and permissions
  const refreshPermissions = async (): Promise<Role | null> => {
    try {
      if (!session) {
        console.warn('[Auth] Cannot refresh permissions: No active session');
        return null;
      }
      
      console.log('[Auth] Manually refreshing permissions');
      
      // First ensure we have latest session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession) {
        console.error('[Auth] Session error during refresh:', sessionError);
        return null;
      }
      
      // Check role directly from the database for most accurate result
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentSession.user.id)
        .single();
      
      if (roleError) {
        if (roleError.code !== 'PGRST116') {
          console.error('[Auth] Error fetching role during refresh:', roleError);
        }
        // No role found
        setRoles(['user']);
        setIsAdmin(false);
        await fetchDirectPermissions('user');
        return 'user';
      }
      
      const userRole = roleData?.role || 'user';
      const adminStatus = userRole === 'admin';
      
      console.log(`[Auth] Refreshed role: ${userRole}, isAdmin: ${adminStatus}`);
      
      // Update state with fetched values
      setRoles([userRole]);
      setIsAdmin(adminStatus);
      
      // Get updated permissions
      await fetchDirectPermissions(userRole);
      
      return userRole;
      
    } catch (error) {
      console.error('[Auth] Error refreshing permissions:', error);
      return null;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string, captchaToken: string | null = null) => {
    try {
      console.log('[Auth] Attempting sign in for:', email);
      
      if (AUTH_API_URL && captchaToken) {
        // Use edge function for login with captcha
        console.log('[Auth] Using edge function for login with captcha');
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
          console.error('[Auth] Edge function login error:', data.error);
          return { error: new Error(data.error || 'Failed to sign in') };
        }

        // Set the session in Supabase
        if (data.session) {
          console.log('[Auth] Setting session from edge function response');
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
          
          // The auth state change will trigger role fetching
          return {};
        }
        
      } else {
        // Fallback to direct Supabase auth
        console.log('[Auth] Using direct Supabase auth');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          console.error('[Auth] Direct login error:', error.message);
          return { error };
        }
        
        console.log('[Auth] Login successful, user ID:', data.user?.id);
        
        // Explicitly fetch roles and permissions now for immediate access
        if (data.session) {
          await getUserRoleAndPermissions(data.session);
        }
        
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

  // Function to update user profile information
  const updateUserProfile = async (metadata: Record<string, any>) => {
    if (!user) throw new Error("No authenticated user");
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata
      });
      
      if (error) throw error;
      
      // Update current user state with the new metadata
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            ...metadata
          }
        };
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
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
    refreshPermissions,
    updateUserProfile, // Add this to the context value
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
 * // Admin detection
 * const { isAdmin, refreshPermissions } = useAuth();
 * if (isAdmin) {
 *   // Show admin features
 * }
 * 
 * @example
 * // Refreshing permissions after changes
 * const { refreshPermissions } = useAuth();
 * const handlePromoteToAdmin = async (userId) => {
 *   await promoteUser(userId);
 *   await refreshPermissions(); // Update UI with new permissions
 * };
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};