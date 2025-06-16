import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { jwtDecode } from 'jwt-decode';

// Type definitions for our system
type AppRole = 'admin' | 'user';
type AppPermission = 'listings.create' | 'listings.update' | 'listings.delete' | 
                    'listings.approve' | 'admin.access' | 'users.manage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  permissions: AppPermission[];
  isAdmin: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  hasPermission: (permission: AppPermission) => boolean;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  permissions: [],
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  hasPermission: () => false,
  hasRole: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  // Extract claims from JWT token
  const extractClaims = (accessToken: string) => {
    try {
      console.log('[Auth] Extracting claims from JWT');
      const decoded = jwtDecode<{app_roles: string[]}>(accessToken);
      
      // Get roles from token
      const userRoles = decoded.app_roles || [];
      console.log('[Auth] Roles from JWT:', userRoles);
      
      // Check if admin role is present
      const isUserAdmin = userRoles.includes('admin');
      
      // Update state with roles
      setRoles(userRoles as AppRole[]);
      setIsAdmin(isUserAdmin);
      
      return { userRoles, isUserAdmin };
    } catch (error) {
      console.error('[Auth] Error decoding JWT:', error);
      setRoles([]);
      setIsAdmin(false);
      return { userRoles: [], isUserAdmin: false };
    }
  };

  // Fetch permissions for user roles
  const fetchPermissions = async (userRoles: string[]) => {
    try {
      if (!userRoles.length) {
        setPermissions([]);
        return;
      }
      
      console.log('[Auth] Fetching permissions for roles:', userRoles);
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .in('role', userRoles);
      
      if (error) {
        console.error('[Auth] Error fetching permissions:', error);
        setPermissions([]);
        return;
      }
      
      if (data) {
        const permissionList = data.map(item => item.permission);
        console.log('[Auth] User permissions:', permissionList);
        setPermissions(permissionList as AppPermission[]);
      }
    } catch (error) {
      console.error('[Auth] Error in fetchPermissions:', error);
      setPermissions([]);
    }
  };

  // Initialize authentication state
  useEffect(() => {
    console.log('[Auth] Initializing auth provider');
    let isMounted = true;
    
    const setupAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          if (isMounted) {
            setLoading(false);
            setUser(null);
            setSession(null);
            setRoles([]);
            setPermissions([]);
            setIsAdmin(false);
          }
          return;
        }

        if (!session) {
          console.log('[Auth] No session found');
          if (isMounted) {
            setLoading(false);
            setUser(null);
            setSession(null);
            setRoles([]);
            setPermissions([]);
            setIsAdmin(false);
          }
          return;
        }
        
        console.log('[Auth] Session found for user:', session.user.id);
        
        // Set basic user data
        if (isMounted) {
          setUser(session.user);
          setSession(session);
        }
        
        // Extract claims from token
        if (session.access_token) {
          const { userRoles } = extractClaims(session.access_token);
          
          // Fetch permissions based on roles
          await fetchPermissions(userRoles);
        }
        
        if (isMounted) setLoading(false);
        
      } catch (e) {
        console.error('[Auth] Error in setupAuth:', e);
        if (isMounted) {
          setLoading(false);
          setRoles([]);
          setPermissions([]);
          setIsAdmin(false);
        }
      }
    };
    
    setupAuth();
    
    // Safety timeout for loading state
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Auth] Safety timeout triggered, ending loading');
        setLoading(false);
      }
    }, 3000);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state change:', event);
        
        if (isMounted) {
          setUser(session?.user || null);
          setSession(session);
        }
        
        if (!session) {
          console.log('[Auth] No session in auth change');
          if (isMounted) {
            setRoles([]);
            setPermissions([]);
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }
        
        // Extract claims from token
        if (session.access_token) {
          const { userRoles } = extractClaims(session.access_token);
          
          // Fetch permissions based on roles
          await fetchPermissions(userRoles);
        }
        
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      console.log(`[Auth] Starting login process for: ${email}`);
      
      // Prepare options with captchaToken if provided
      const options: { captchaToken?: string } = {};
      if (captchaToken) {
        console.log('[Auth] Including captcha token in login');
        options.captchaToken = captchaToken;
      }
      
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options
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
      
      // Extract claims from token (roles will be set in the auth change event)
      if (data.session.access_token) {
        const { userRoles } = extractClaims(data.session.access_token);
        
        // Log the roles for debugging
        console.log('[Auth] User roles after login:', userRoles);
        
        // Set user data immediately for better UX
        setUser(data.user);
        setSession(data.session);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Sign in error:', error);
      return { error };
    }
  };
  
  // Sign up new user
  const signUp = async (email: string, password: string) => {
    try {
      console.log(`[Auth] Starting registration for: ${email}`);
      
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('[Auth] Registration error:', error);
        return { error, data: null };
      }
      
      if (!data || !data.user) {
        console.error('[Auth] No user data received');
        return { error: new Error('No user data received'), data: null };
      }
      
      console.log(`[Auth] User registered successfully:`, data.user.id);
      
      // By default newly registered users will get 'user' role via the database
      // This happens through RLS and trigger functions
      
      return { error: null, data };
    } catch (error: any) {
      console.error('[Auth] Sign up error:', error);
      return { error, data: null };
    }
  };
  
  // Sign out user
  const signOut = async () => {
    try {
      console.log('[Auth] Signing out user');
      
      // Clear state first for better UX
      setUser(null);
      setSession(null);
      setRoles([]);
      setPermissions([]);
      setIsAdmin(false);
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      console.log('[Auth] User signed out successfully');
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    }
  };
  
  // Reset password email
  const resetPassword = async (email: string) => {
    try {
      if (!email) return { error: new Error('Email is required') };
      
      console.log(`[Auth] Sending password reset email to: ${email}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { error };
    } catch (error: any) {
      console.error('[Auth] Reset password error:', error);
      return { error };
    }
  };
  
  // Helper method to check if user has a specific role
  const hasRole = (role: AppRole) => {
    return roles.includes(role);
  };
  
  // Helper method to check if user has a specific permission
  const hasPermission = (permission: AppPermission) => {
    return permissions.includes(permission) || isAdmin;
  };
  
  const value = {
    user,
    session,
    loading,
    roles,
    permissions,
    isAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);