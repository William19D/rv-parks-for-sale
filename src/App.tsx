import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Header, HeaderSpacer } from "@/components/layout/Header";

const queryClient = new QueryClient();

// Componente que maneja las rutas protegidas
const ProtectedRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Si está en carga inicial y aún no hay información de usuario
  if (loading && !localStorage.getItem('supabase.auth.token')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Verificando autenticación...</p>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Rutas públicas accesibles para todos */}
      <Route path="/" element={<Index />} />
      <Route path="/listings" element={<Listings />} />
      <Route path="/listings/:id" element={<ListingDetail />} />
      
      {/* Rutas protegidas - requieren autenticación */}
      <Route path="/broker/dashboard" element={
        user ? <BrokerDashboard /> : <Navigate to="/login" state={{ from: location }} replace />
      } />
      <Route path="/listings/new" element={
        user ? <AddListing /> : <Navigate to="/login" state={{ from: location }} replace />
      } />
      
      {/* Rutas de autenticación - no accesibles si ya está autenticado */}
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <Login />
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

      {/* Ruta de respaldo para URLs no encontradas */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Componente separado para mantener persistente el header
const AppLayout = () => {
  return (
    <>
      <Header />
      <HeaderSpacer />
      <ProtectedRoutes />
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
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;