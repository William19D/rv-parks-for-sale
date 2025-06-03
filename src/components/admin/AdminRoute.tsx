import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { HeaderSpacer } from '@/components/layout/Header';

interface AdminRouteProps {
  children: ReactNode;
}

// Admin layout component
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
  const { user, userRole, loading } = useAuth();
  
  // For debugging
  console.log('[AdminRoute] Checking access - User ID:', user?.id);
  console.log('[AdminRoute] Checking access - User Role:', userRole);
  console.log('[AdminRoute] Checking access - Loading:', loading);
  
  // Show loading while checking authentication
  if (loading) {
    console.log('[AdminRoute] Still loading auth state...');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Verificando permisos de administrador...</p>
      </div>
    );
  }
  
  // Redirect non-authenticated users to login
  if (!user) {
    console.log('[AdminRoute] No authenticated user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Redirect non-admin users to home
  if (userRole !== 'ADMIN') {
    console.log(`[AdminRoute] User ${user.id} has role ${userRole}, not ADMIN, redirecting to home`);
    return <Navigate to="/" replace />;
  }
  
  // User is admin, render admin layout with children
  console.log(`[AdminRoute] User ${user.id} confirmed as ADMIN, rendering admin content`);
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
};