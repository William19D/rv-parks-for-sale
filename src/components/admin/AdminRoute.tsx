
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { HeaderSpacer } from '@/components/layout/Header';

interface AdminRouteProps {
  children: ReactNode;
}

// Layout for admin pages
const AdminLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader />
      <HeaderSpacer />
      <div className="flex flex-1">
        <AdminSidebar />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading, isAdmin, hasPermission } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const location = useLocation();
  
  // Verify admin access when the component mounts
  useEffect(() => {
    const verifyAdminAccess = async () => {
      console.log('[AdminRoute] Verifying admin access...');
      
      try {
        // Short delay to ensure JWT has been processed
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if user has admin access permission
        const hasAdminAccess = hasPermission('admin.access');
        console.log(`[AdminRoute] Admin access verification: ${hasAdminAccess ? 'Granted' : 'Denied'}`);
        
        setVerifying(false);
      } catch (error) {
        console.error('[AdminRoute] Error verifying admin access:', error);
        setVerifying(false);
      }
    };
    
    if (!loading) {
      verifyAdminAccess();
    }
  }, [loading, hasPermission]);
  
  // Show loader while verifying and loading
  if (loading || verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Verifying admin access...</p>
      </div>
    );
  }
  
  // If not logged in, redirect to login
  if (!user) {
    console.log('[AdminRoute] No authenticated user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If not admin, redirect to home
  if (!isAdmin) {
    console.log('[AdminRoute] User is not an admin, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  // Render admin layout with children if user is admin
  console.log('[AdminRoute] Admin access granted, rendering content');
  return <AdminLayout>{children}</AdminLayout>;
};
