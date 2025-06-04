
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

const AdminLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader />
      <HeaderSpacer />
      <div className="flex flex-1">
        <AdminSidebar />
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, userRole, loading, isAdmin } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log('[AdminRoute] Checking admin access:', { user: user?.id, userRole, isAdmin: isAdmin() });
  }, [user, userRole]);
  
  // Show loading while authentication is being verified
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Verifying admin access...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    console.log('[AdminRoute] No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user has admin role
  if (!isAdmin()) {
    console.log('[AdminRoute] User is not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  console.log('[AdminRoute] Admin access granted');
  
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
};
