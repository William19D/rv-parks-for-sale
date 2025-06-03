import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import BrokerDashboard from "./pages/BrokerDashboard";
import AddListing from "./pages/AddListing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword"; 
import AuthenticationSuccess from "./pages/AuthenticationSuccess";
import AuthCallback from "./pages/AuthCallback";
import EmailVerification from "./pages/EmailVerification";
// Fix: Ensure ListingEdit is properly imported
import ListingEdit from "./pages/ListingEdit";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminListings from "./pages/admin/Listings";

// Components
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const queryClient = new QueryClient();

// Admin layout component
const AdminLayout = ({ children }: { children: React.ReactNode }) => {
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

// Modified AdminRoute - now checks for proper authentication and admin role
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, loading } = useAuth();
  
  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }
  
  // Redirect non-authenticated users to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect non-admin users to home
  if (userRole !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  
  // Render admin layout for authenticated admin users
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
};

// Componente que maneja las rutas protegidas y públicas
const AppRoutes = () => {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();
  
  // If in admin routes, don't show the standard header
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Show loading for authentication check
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }
  
  return (
    <>
      {/* Only show header on non-admin routes */}
      {!isAdminRoute && (
        <>
          <Header />
          <HeaderSpacer />
        </>
      )}
      
      <Routes>
        {/* Rutas públicas accesibles para todos */}
        <Route path="/" element={<Index />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        
        {/* Admin Routes - Now properly checks for admin role */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/listings" element={
          <AdminRoute>
            <AdminListings />
          </AdminRoute>
        } />
        <Route path="/admin/listings/:id/edit" element={
          <AdminRoute>
            {ListingEdit ? <ListingEdit /> : <div>Loading editor...</div>}
          </AdminRoute>
        } />
        
        {/* Rutas protegidas - requieren autenticación */}
        <Route path="/broker/dashboard" element={
          user ? <BrokerDashboard /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        <Route path="/listings/new" element={
          user ? <AddListing /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        <Route path="/listings/:id/edit" element={
          user ? (ListingEdit ? <ListingEdit /> : <div>Loading editor...</div>) : <Navigate to="/login" state={{ from: location }} replace />
        } />
        
        {/* Rutas de autenticación - no accesibles si ya está autenticado */}
        <Route path="/login" element={
          user ? (
            // If user is admin, redirect to admin dashboard, otherwise to home
            userRole === 'ADMIN' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/" replace />
          ) : <Login />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/" replace /> : <Register />
        } />
        <Route path="/forgot-password" element={
          user ? <Navigate to="/" replace /> : <ForgotPassword />
        } />
        
        {/* Rutas de procesamiento de autenticación - siempre accesibles */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/success" element={<AuthenticationSuccess />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* Ruta de respaldo para URLs no encontradas */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
