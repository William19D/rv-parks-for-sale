import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          return;
        }
        
        // Check user role in profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Error checking admin status:", error);
          toast({
            title: "Error",
            description: "Failed to verify admin permissions",
            variant: "destructive",
          });
          setIsAdmin(false);
          return;
        }
        
        setIsAdmin(data.role === 'ADMIN');
      } catch (error) {
        console.error("Admin check failed:", error);
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, [toast]);

  // Show loading state while checking
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#f74f4f]/20 border-t-[#f74f4f] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect non-admins to home
  if (!isAdmin) {
    toast({
      title: "Access Denied",
      description: "You don't have permission to access this area",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }

  // Render admin page for admins
  return <>{children}</>;
};