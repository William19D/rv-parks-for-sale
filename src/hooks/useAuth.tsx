import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';

// Type definitions for our system
type AppRole = 'admin' | 'user';
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  status: AuthStatus;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | AuthError | null; data: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | AuthError | null }>;
  refreshToken: () => Promise<{ error: Error | AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | AuthError | null }>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  status: 'loading',
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  refreshToken: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  hasRole: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State to track authentication status
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    role: null,
    status: 'loading',
    isAdmin: false,
  });

  // Debug flag for verbose logging
  const DEBUG = process.env.NODE_ENV === 'development';

  // Log helper that only logs in development mode
  const logDebug = (...args: any[]) => {
    if (DEBUG) console.log(...args);
  };

  // Helper to extract role from token with detailed logging
  const extractRoleFromToken = (token: string): AppRole | null => {
    try {
      const decoded = jwtDecode<any>(token);
      
      if (DEBUG) {
        logDebug('[Auth] JWT payload:', decoded);
      }
      
      // UPDATED: Check for app_role field first (this is what our hook sets)
      const role = decoded.app_role || 
                  (decoded.app_metadata && decoded.app_metadata.app_role) ||
                  decoded.role || 
                  (decoded.claims && decoded.claims.role) ||
                  (decoded.app_metadata && decoded.app_metadata.role) ||
                  (decoded.user_metadata && decoded.user_metadata.role);
      
      if (role) {
        logDebug(`[Auth] Role found in JWT: ${role}`);
        return role === 'admin' ? 'admin' : 'user';
      }
      
      logDebug('[Auth] No role found in JWT');
      return null;
    } catch (error) {
      console.error('[Auth] Error decoding JWT:', error);
      return null;
    }
  };

  // Helper to determine the user's role from session data
  const determineUserRole = (session: Session | null): AppRole => {
    if (!session) return 'user'; // Default role for unauthenticated users
    
    // Try to extract role from JWT token
    const tokenRole = session.access_token ? 
      extractRoleFromToken(session.access_token) : null;
    
    if (tokenRole) {
      return tokenRole;
    }
    
    // Fallback to metadata in user object
    const user = session.user;
    
    // UPDATED: Check app_metadata.app_role first (from our hook)
    const metadataRole = user?.app_metadata?.app_role || 
                         user?.app_metadata?.role || 
                         user?.user_metadata?.role;
    
    if (metadataRole) {
      logDebug(`[Auth] Role from metadata: ${metadataRole}`);
      return metadataRole === 'admin' ? 'admin' : 'user';
    }
    
    // Default fallback
    logDebug('[Auth] No role found, defaulting to user');
    return 'user';
  };

  // Update auth state based on session
  const updateAuthState = (session: Session | null) => {
    if (!session) {
      logDebug('[Auth] No session, setting unauthenticated state');
      setAuthState({
        session: null,
        user: null,
        role: null,
        status: 'unauthenticated',
        isAdmin: false,
      });
      return;
    }
    
    const role = determineUserRole(session);
    const isAdmin = role === 'admin';
    
    logDebug(`[Auth] User authenticated with role: ${role}, isAdmin: ${isAdmin}`);
    
    setAuthState({
      session,
      user: session.user,
      role,
      status: 'authenticated',
      isAdmin,
    });
  };

  // Initialize and set up auth state listener
  useEffect(() => {
    const setupAuth = async () => {
      try {
        logDebug('[Auth] Setting up auth...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          setAuthState(prev => ({ ...prev, status: 'unauthenticated' }));
          return;
        }
        
        updateAuthState(session);
      } catch (e) {
        console.error('[Auth] Error in setupAuth:', e);
        setAuthState(prev => ({ ...prev, status: 'unauthenticated' }));
      }
    };
    
    // Initial setup
    setupAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logDebug('[Auth] Auth state change:', event);
      updateAuthState(session);
    });
    
    // Clean up subscription on unmount
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
      
      // Immediately extract role info
      const role = determineUserRole(data.session);
      logDebug(`[Auth] User role after sign in: ${role}`);
      
      // Token processing will be handled by the auth state change listener
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Unexpected error during sign in:', error);
      return { error };
    }
  };
  
  // Sign up new user
  const signUp = async (email: string, password: string) => {
    try {
      logDebug(`[Auth] Starting registration for: ${email}`);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
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
      
      // Note: By default, new users will get 'user' role via the trigger
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
      setAuthState({
        session: null,
        user: null,
        role: null,
        status: 'loading',
        isAdmin: false,
      });
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      logDebug('[Auth] User signed out successfully');
    } catch (error) {
      console.error('[Auth] Error during sign out:', error);
    }
  };
  
  // Reset password email
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
  
  // Force a token refresh to get updated claims
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
      
      // Force role check after refresh
      const role = determineUserRole(data.session);
      logDebug(`[Auth] Role after token refresh: ${role}`);
      
      // Manually update auth state to ensure role updates immediately
      updateAuthState(data.session);
      
      logDebug('[Auth] Token refreshed successfully');
      
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Error during token refresh:', error);
      return { error };
    }
  };
  
  // Helper method to check if user has a specific role
  const hasRole = (role: AppRole): boolean => {
    if (role === 'user') {
      // Admin users can do anything a user can do
      return authState.role === 'admin' || authState.role === 'user';
    }
    
    // Otherwise strict equality check
    return authState.role === role;
  };
  
  // Create the context value - memoize for performance
  const value = useMemo(() => ({
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshToken,
    hasRole,
  }), [authState]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};