
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminListings from "./pages/admin/Listings";

// Components
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { AdminRoute } from "@/components/admin/AdminRoute";

const queryClient = new QueryClient();

// Protected route wrapper for authenticated users
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Component that handles route-based redirection for authenticated users
const AuthRedirect = () => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (user && userRole) {
    // Get the intended destination from location state
    const from = location.state?.from?.pathname || null;
    
    // If user is admin and not already on admin route, redirect to admin dashboard
    if (userRole === 'ADMIN' && !from?.startsWith('/admin')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // If user is broker, redirect to broker dashboard
    if (userRole === 'BROKER') {
      return <Navigate to="/broker/dashboard" replace />;
    }
    
    // Regular users go to home
    return <Navigate to="/" replace />;
  }

  // Not authenticated, show login
  return <Login />;
};

// Main routing component
const AppRoutes = () => {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();
  
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  useEffect(() => {
    console.log(`[Router] Route: ${location.pathname}, User: ${user?.id}, Role: ${userRole}`);
  }, [location.pathname, user, userRole]);
  
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
        
        {/* Admin routes - Protected by AdminRoute */}
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
        
        {/* Protected routes for authenticated users */}
        <Route path="/broker/dashboard" element={
          <ProtectedRoute>
            <BrokerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/listings/new" element={
          <ProtectedRoute>
            <AddListing />
          </ProtectedRoute>
        } />
        <Route path="/listings/:id/edit" element={
          <ProtectedRoute>
            {ListingEdit ? <ListingEdit /> : <div>Loading editor...</div>}
          </ProtectedRoute>
        } />
        
        {/* Auth routes with smart redirection */}
        <Route path="/login" element={<AuthRedirect />} />
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
