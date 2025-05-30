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
  loading: false, // Default to false for better user experience
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
  const [userRole, setUserRole] = useState<UserRole>(null); // Default to null, not USER
  const { toast } = useToast();

  // Function to fetch user role from role_id with a timeout
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
  if (!userId) return null; // Skip if no user ID
  
  try {
    const rolePromise = new Promise<UserRole>(async (resolve) => {
      try {
        // First get the user's role assignments
        const { data: roleAssignments, error: roleError } = await supabase
          .from('user_role_assignments')
          .select('role_id')
          .eq('user_id', userId);
        
        console.log('Role assignments for user:', userId, roleAssignments);
        
        if (roleError) {
          console.error('Error fetching role assignments:', roleError);
          resolve('USER');
          return;
        }
        
        if (!roleAssignments || roleAssignments.length === 0) {
          console.log('No role assignments found');
          resolve('USER');
          return;
        }
        
        // IMPORTANT: Check directly for role_id 2 which is admin based on your screenshot
        if (roleAssignments.some(ra => ra.role_id === 2)) {
          console.log('Found admin role by ID 2');
          resolve('ADMIN');
          return;
        }
        
        // Get all the role IDs assigned to this user
        const roleIds = roleAssignments.map(ra => ra.role_id);
        
        // Get the role names from user_roles table as a backup check
        const { data: roles, error: namesError } = await supabase
          .from('user_roles')
          .select('id, name')
          .in('id', roleIds);
          
        if (namesError) {
          console.error('Error fetching role names:', namesError);
          resolve('USER');
          return;
        }
        
        if (!roles || roles.length === 0) {
          resolve('USER');
          return;
        }
        
        // Check for ADMIN role by name as well
        if (roles.some(role => role.name && typeof role.name === 'string' && role.name.toUpperCase() === 'ADMIN')) {
          console.log('Found ADMIN role by name');
          resolve('ADMIN');
          return;
        }
        
        // Then check for BROKER role
        if (roles.some(role => role.name && typeof role.name === 'string' && role.name.toUpperCase() === 'BROKER')) {
          resolve('BROKER');
          return;
        }
        
        // Default to USER
        resolve('USER');
      } catch (error) {
        console.error('Error in role fetch:', error);
        resolve('USER');
      }
    });
    
    // Shorter timeout (2 seconds)
    const timeoutPromise = new Promise<UserRole>((resolve) => {
      setTimeout(() => {
        resolve('USER');
      }, 2000);
    });
    
    // Return whichever resolves first
    return Promise.race([rolePromise, timeoutPromise]);
  } catch (error) {
    console.error('Error in fetchUserRole outer block:', error);
    return 'USER';
  }
};

  useEffect(() => {
    let isMounted = true;
    
    const setData = async () => {
      try {
        // First quickly check if there's a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (isMounted) {
            setLoading(false); // Stop loading on error
          }
          return;
        }
        
        // If no session, we can immediately set loading to false
        if (!session) {
          if (isMounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            setLoading(false); // No session, so stop loading immediately
          }
          return;
        }
        
        // We have a session, set the session and user
        if (isMounted) {
          setSession(session);
          setUser(session.user || null);
        }
        
        // Only fetch role if we have a user
        if (session?.user) {
          // This won't block rendering anymore for non-auth users
          const role = await fetchUserRole(session.user.id);
          
          if (isMounted) {
            setUserRole(role);
          }
        }
        
        // Set loading to false after everything is done
        if (isMounted) {
          setLoading(false);
        }
      } catch (e) {
        console.error('Unexpected error in setData:', e);
        if (isMounted) {
          setLoading(false); // Always ensure loading becomes false
        }
      }
    };
    
    // Safety timeout to prevent infinite loading (shorter: 3s)
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 3000);
    
    setData();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user || null);
        }
        
        // If no session, no need to check roles
        if (!session) {
          if (isMounted) {
            setUserRole(null);
            setLoading(false);
          }
          return;
        }
        
        // Only check roles for authenticated users
        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          
          if (isMounted) {
            setUserRole(role);
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Fetch user role after successful login
      if (data.user) {
        const role = await fetchUserRole(data.user.id);
        setUserRole(role);
      }
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Create role assignment for new user with default USER role
      if (data.user) {
        // First check if the user_roles table has a USER role and get its ID
        let userRoleId = 1; // Default assumption
        
        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('id')
            .eq('name', 'USER')
            .single();
            
          if (roleData) {
            userRoleId = roleData.id;
          }
        } catch (e) {
          console.error('Error finding USER role ID, using default 1:', e);
        }
        
        const { error: roleError } = await supabase
          .from('user_role_assignments')
          .insert([
            {
              user_id: data.user.id,
              role_id: userRoleId,
              created_at: new Date().toISOString()
            }
          ]);
          
        if (roleError) {
          console.error('Error assigning default role:', roleError);
        }
      }
      
      return { error: null, data };
    } catch (error: any) {
      return { error, data: null };
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
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