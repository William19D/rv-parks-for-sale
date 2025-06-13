import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase'; // Adjust the import path as necessary
import { Session, User, AuthError } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';

// Define role types for your application
export type AppRole = 'admin' | 'user';
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// Enhanced auth context with additional functionality
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  status: AuthStatus;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | AuthError | null }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: Error | AuthError | null; data: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | AuthError | null }>;
  refreshToken: () => Promise<{ error: Error | AuthError | null }>;
  hasRole: (role: AppRole) => boolean;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  status: 'loading',
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  refreshToken: async () => ({ error: null }),
  hasRole: () => false,
});

// Debug helpers
const DEBUG = process.env.NODE_ENV === 'development';
const logDebug = (...args: any[]) => {
  if (DEBUG) console.log(...args);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State for authentication
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isAdmin, setIsAdmin] = useState(false);

  // Helper to extract role from token
  const extractRoleFromToken = (token: string): AppRole | null => {
    try {
      const decoded = jwtDecode<any>(token);
      
      if (DEBUG) {
        logDebug('[Auth] JWT payload:', decoded);
      }
      
      // Check multiple possible locations for role information
      // First check app_role which is set by our custom hook
      const roleValue = decoded.app_role || 
                       (decoded.app_metadata && decoded.app_metadata.app_role) ||
                       decoded.role || 
                       (decoded.app_metadata && decoded.app_metadata.role);
      
      if (roleValue) {
        logDebug(`[Auth] Role found in JWT: ${roleValue}`);
        return roleValue === 'admin' ? 'admin' : 'user';
      }
      
      logDebug('[Auth] No role found in JWT');
      return null;
    } catch (error) {
      console.error('[Auth] Error decoding JWT:', error);
      return null;
    }
  };

  // Helper to determine user's role from session
  const determineUserRole = async (session: Session | null): Promise<AppRole> => {
    if (!session) return 'user';
    
    try {
      // First check JWT token claims
      if (session.access_token) {
        const tokenRole = extractRoleFromToken(session.access_token);
        if (tokenRole) {
          return tokenRole;
        }
      }
      
      // Then check user metadata
      const user = session.user;
      if (user?.app_metadata?.app_role === 'admin' || 
          user?.app_metadata?.role === 'admin') {
        return 'admin';
      }
      
      // Finally check database
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();
      
      if (!error && data && data.role === 'admin') {
        return 'admin';
      }
    } catch (error) {
      console.error('[Auth] Error determining user role:', error);
    }
    
    // Default fallback
    return 'user';
  };

  // Update auth state with role and admin status
  const updateAuthState = async (newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user || null);
    
    if (!newSession) {
      setRole(null);
      setIsAdmin(false);
      setStatus('unauthenticated');
      return;
    }
    
    try {
      const userRole = await determineUserRole(newSession);
      setRole(userRole);
      setIsAdmin(userRole === 'admin');
      setStatus('authenticated');
      
      logDebug(`[Auth] User authenticated with role: ${userRole}, isAdmin: ${userRole === 'admin'}`);
    } catch (error) {
      console.error('[Auth] Error updating auth state:', error);
      setRole('user');
      setIsAdmin(false);
      setStatus('authenticated');
    }
  };

  // Initialize auth state and set up listeners
  useEffect(() => {
    const setupAuth = async () => {
      try {
        logDebug('[Auth] Setting up auth...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          setStatus('unauthenticated');
          return;
        }
        
        await updateAuthState(session);
      } catch (error) {
        console.error('[Auth] Error in setupAuth:', error);
        setStatus('unauthenticated');
      }
    };
    
    // Initial setup
    setupAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logDebug('[Auth] Auth state change:', event);
        await updateAuthState(session);
      }
    );
    
    // Cleanup subscription
    return () => {
      logDebug('[Auth] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      logDebug(`[Auth] Attempting sign in for: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('[Auth] Sign in error:', error);
        return { error };
      }
      
      if (!data.user || !data.session) {
        console.error('[Auth] No user data received after sign in');
        return { error: new Error('No user data received') };
      }
      
      logDebug(`[Auth] Sign in successful for user: ${data.user.id}`);
      
      // Auth state will be updated by the listener
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Unexpected error during sign in:', error);
      return { error };
    }
  };
  
  // Sign up new user
  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      logDebug(`[Auth] Starting registration for: ${email}`);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });
      
      if (error) {
        console.error('[Auth] Registration error:', error);
        return { error, data: null };
      }
      
      if (!data || !data.user) {
        console.error('[Auth] No user data received after registration');
        return { error: new Error('No user data received'), data: null };
      }
      
      logDebug(`[Auth] Registration successful for user: ${data.user.id}`);
      return { error: null, data };
    } catch (error: any) {
      console.error('[Auth] Unexpected error during registration:', error);
      return { error, data: null };
    }
  };
  
  // Sign out user
  const signOut = async () => {
    try {
      logDebug('[Auth] Signing out user');
      
      // Clear state first for better UX
      setStatus('loading');
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      // State will be updated by the auth listener
      logDebug('[Auth] User signed out successfully');
    } catch (error) {
      console.error('[Auth] Error during sign out:', error);
      setStatus('unauthenticated');
    }
  };
  
  // Reset password (send password reset email)
  const resetPassword = async (email: string) => {
    try {
      if (!email) return { error: new Error('Email is required') };
      
      logDebug(`[Auth] Sending password reset email to: ${email}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { error };
    } catch (error: any) {
      console.error('[Auth] Error sending password reset:', error);
      return { error };
    }
  };
  
  // Update user password
  const updatePassword = async (password: string) => {
    try {
      if (!password) return { error: new Error('Password is required') };
      
      logDebug('[Auth] Updating password');
      
      const { error } = await supabase.auth.updateUser({ password });
      
      if (!error) {
        logDebug('[Auth] Password updated successfully');
      }
      
      return { error };
    } catch (error: any) {
      console.error('[Auth] Error updating password:', error);
      return { error };
    }
  };
  
  // Force token refresh to update claims
  const refreshToken = async () => {
    try {
      logDebug('[Auth] Refreshing token');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[Auth] Token refresh error:', error);
        return { error };
      }
      
      if (!data.session) {
        console.error('[Auth] No session after refresh');
        return { error: new Error('No session after refresh') };
      }
      
      logDebug('[Auth] Token refreshed successfully');
      
      // Force update auth state with new session
      await updateAuthState(data.session);
      
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Error during token refresh:', error);
      return { error };
    }
  };
  
  // Check if user has a specific role
  const hasRole = (checkRole: AppRole): boolean => {
    if (checkRole === 'user') {
      // Admin users can do anything a regular user can
      return role === 'admin' || role === 'user';
    }
    
    // Otherwise exact match
    return role === checkRole;
  };
  
  // Memoize context value to avoid unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      session,
      role,
      status,
      isAdmin,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshToken,
      hasRole,
    }),
    [user, session, role, status, isAdmin]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}