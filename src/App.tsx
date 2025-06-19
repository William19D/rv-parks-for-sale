import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

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
import ListingEdit from "./pages/ListingEdit";
import UserProfile from "./pages/UserProfile";
import Support from "./pages/Support";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import SupportTickets from "./pages/admin/SupportTickets";

// Components
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { AdminRoute } from "@/components/admin/AdminRoute";

const queryClient = new QueryClient();

// Configuración de rutas adaptativa
// Para obtener la configuración de rutas del entorno actual
const getCurrentEnvironmentConfig = () => {
  // Always use root path for Vercel deployment
  const pathPrefix = "";
  
  // Use current domain
  const domain = window.location.origin;
  
  return { domain, pathPrefix };
};

// Configuraciones dinámicas para rutas
const { domain: DOMAIN, pathPrefix: PATH_PREFIX } = getCurrentEnvironmentConfig();

// Función para generar URLs absolutas
export const absoluteUrl = (path: string): string => {
  // Asegurarse de que la ruta comience con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Si estamos en localhost o dev, no añadir prefijo
  if (PATH_PREFIX === "") {
    return normalizedPath;
  }
  
  // Para enlaces internos en React Router, añadir el prefijo
  return `${PATH_PREFIX}${normalizedPath}`;
};

// Función para generar URLs completas con dominio
export const fullUrl = (path: string): string => {
  const url = absoluteUrl(path);
  return `${DOMAIN}${url}`;
};

// Admin redirect component - ensures admins are directed to admin dashboard
const AdminRedirect = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (loading) return;
    
    if (user && isAdmin) {
      const currentPath = location.pathname;
      
      const isAlreadyOnAdminRoute = 
        currentPath.startsWith('/admin/') || 
        currentPath === '/admin';
        
      const isAuthFlow = 
        currentPath === '/auth/callback/' || 
        currentPath === '/auth/success/' || 
        currentPath === '/login/';
        
      if (!isAlreadyOnAdminRoute && (isAuthFlow || currentPath === '/')) {
        console.log('[AdminRedirect] Detected admin user, redirecting to admin dashboard');
        navigate('/admin/dashboard/', { replace: true });
      }
    }
  }, [user, isAdmin, loading, location.pathname, navigate]);
  
  return null;
};

// Route handling component
const AppRoutes = () => {
  const { user, loading, isAdmin, roles } = useAuth();
  const location = useLocation();
  
  // Detect admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Debug logging
  useEffect(() => {
    console.log(`[Router] Route changed to: ${location.pathname}`);
    console.log(`[Router] Current auth state - User: ${user?.id || 'none'}`);
    console.log(`[Router] Is admin: ${isAdmin}, Roles: ${roles?.join(', ') || 'none'}`);
  }, [location.pathname, user, isAdmin, roles]);
  
  // Show loader during authentication verification
  if (loading && !isAdminRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }
  
  return (
    <>
      {/* Add AdminRedirect component to handle admin redirections */}
      <AdminRedirect />
      
      {/* Only show header on non-admin routes */}
      {!isAdminRoute && (
        <>
          <Header />
          <HeaderSpacer />
        </>
      )}
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          // Redirect admins from home page to admin dashboard
          user && isAdmin ? 
            <Navigate to="/admin/dashboard/" replace /> : 
            <Index />
        } />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/support" element={<Support />} />
        
        {/* User Profile route */}
        <Route path="/profile" element={
          user ? <UserProfile /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        
        {/* Admin routes - reduced to only Dashboard and Support Tickets */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/support" element={
          <AdminRoute>
            <SupportTickets />
          </AdminRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/broker/dashboard" element={
          user ? <BrokerDashboard /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        <Route path="/listings/new" element={
          user ? <AddListing /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        <Route path="/listings/:id/edit" element={
          user ? (ListingEdit ? <ListingEdit /> : <div>Loading editor...</div>) : <Navigate to="/login" state={{ from: location }} replace />
        } />
        
        {/* Authentication routes */}
        <Route path="/login" element={
          user ? (
            isAdmin ? <Navigate to="/admin/dashboard/" replace /> : <Navigate to="/" replace />
          ) : <Login />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/" replace /> : <Register />
        } />
        <Route path="/forgot-password" element={
          user ? <Navigate to="/" replace /> : <ForgotPassword />
        } />
        
        {/* Auth processing routes */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/success" element={<AuthenticationSuccess />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* 404 route */}
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