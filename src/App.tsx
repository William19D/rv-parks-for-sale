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
import Profile from "./pages/profile";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminListings from "./pages/admin/Listings";

// Components
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
// Import AdminRoute component
import { AdminRoute } from "@/components/admin/AdminRoute";

const queryClient = new QueryClient();

// Configuraciones para rutas
const DOMAIN = "https://roverpass.com";
const PATH_PREFIX = "/rv-parks-for-sale";

// Detectar si estamos en un entorno que requiere redirección externa
const isExternalRedirectRequired = () => {
  // En desarrollo local o en roverpass.com, no redireccionamos
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  const isTargetDomain = window.location.hostname === 'roverpass.com';
  
  return !isLocalhost && !isTargetDomain;
};

// Función para generar URLs absolutas
export const absoluteUrl = (path: string): string => {
  // Asegurarse de que la ruta comience con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Para enlaces internos en React Router
  return `${PATH_PREFIX}${normalizedPath}`;
};

// Función para generar URLs completas con dominio
export const fullUrl = (path: string): string => {
  const url = absoluteUrl(path);
  return `${DOMAIN}${url}`;
};

// Componente de redirección inteligente que envía al usuario a la URL externa
const ExternalRedirect = ({ to }: { to: string }) => {
  useEffect(() => {
    window.location.href = fullUrl(to);
  }, [to]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
      <p className="mt-4 text-gray-600">Redirecting to RoverPass.com...</p>
    </div>
  );
};

// Componente para manejar clicks en enlaces y redirigir si es necesario
const LinkWrapper = ({ to, children }: { to: string, children: React.ReactNode }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isExternalRedirectRequired()) {
      e.preventDefault();
      window.location.href = fullUrl(to);
    }
  };
  
  return (
    <a 
      href={isExternalRedirectRequired() ? fullUrl(to) : absoluteUrl(to)}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

// Trailing slash handling component
const TrailingSlashHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Skip if we're on the root path already with trailing slash or non-root with trailing slash
    if (location.pathname === '/' || location.pathname.endsWith('/')) {
      return;
    }

    // Check specifically for the case when someone enters without trailing slash
    if (location.pathname === '') {
      console.log('[Router] Redirecting to add trailing slash');
      navigate('/', { replace: true });
    }

    // Log what we're doing for debugging
    console.log('[Router] Adding trailing slash to:', location.pathname);
    
    // Add trailing slash and keep any query parameters and hash
    navigate(`${location.pathname}/`, { 
      replace: true,
      state: location.state
    });
  }, [location.pathname, navigate]);

  return null;
};

// Route handling component
const AppRoutes = () => {
  const { user, loading, isAdmin, roles } = useAuth();
  const location = useLocation();
  
  // Si necesitamos redirección externa y no estamos en la ruta raíz, redirigir
  if (isExternalRedirectRequired() && location.pathname !== PATH_PREFIX && location.pathname !== `${PATH_PREFIX}/`) {
    return <ExternalRedirect to={location.pathname.replace(PATH_PREFIX, '')} />;
  }
  
  // Detect admin routes
  const isAdminRoute = location.pathname.startsWith('/admin') || 
                       location.pathname.startsWith(`${PATH_PREFIX}/admin`);
  
  // Debug logging
  useEffect(() => {
    console.log(`[Router] Route changed to: ${location.pathname}`);
    console.log(`[Router] Current auth state - User: ${user?.id || 'none'}`);
    console.log(`[Router] Is admin: ${isAdmin}, Roles: ${roles?.join(', ') || 'none'}`);
    console.log(`[Router] External redirect required: ${isExternalRedirectRequired()}`);
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
      {/* Only show header on non-admin routes */}
      {!isAdminRoute && (
        <>
          <Header />
          <HeaderSpacer />
        </>
      )}
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        
        {/* Admin routes - protected by AdminRoute */}
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
        
        {/* Protected routes - require authentication */}
        <Route path="/broker/dashboard" element={
          user ? <BrokerDashboard /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        <Route path="/listings/new" element={
          user ? <AddListing /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        <Route path="/listings/:id/edit" element={
          user ? (ListingEdit ? <ListingEdit /> : <div>Loading editor...</div>) : <Navigate to="/login" state={{ from: location }} replace />
        } />
        
        {/* Add Profile route */}
        <Route path="/profile" element={
          user ? <Profile /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        
        {/* Authentication routes */}
        <Route path="/login" element={
          user ? (
            isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/" replace />
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
        <BrowserRouter basename={PATH_PREFIX}>
          {/* Add the TrailingSlashHandler component here */}
          <TrailingSlashHandler />
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;