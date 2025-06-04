import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { HeaderSpacer } from '@/components/layout/Header';

interface AdminRouteProps {
  children: ReactNode;
}

// Layout para páginas administrativas
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
  const [isValidAdmin, setIsValidAdmin] = useState<boolean | null>(null);
  const location = useLocation();
  
  // Verificar autenticación de admin al cargar
  useEffect(() => {
    const checkAdminAuth = async () => {
      console.log('[AdminRoute] Loading...');
      
      // IMPORTANTE: Limpiar cualquier bypass que pueda existir
      localStorage.removeItem('bypassAuth');
      
      // Verificar si hay datos de admin válidos en localStorage
      const storedAdminData = localStorage.getItem('adminUser');
      let isValid = false;
      
      if (storedAdminData) {
        try {
          const admin = JSON.parse(storedAdminData);
          
          // Verificar la validez de los datos almacenados consultando la BD
          if (admin && admin.email) {
            console.log('[AdminRoute] Verificando admin desde localStorage:', admin.email);
            
            // Confirmar que este admin realmente existe en la tabla
            const { data: confirmData, error: confirmError } = await supabase
              .from('admins') // CORRECCIÓN: Usar 'admins' en plural
              .select('email')
              .eq('email', admin.email);
              
            if (confirmData && confirmData.length > 0) {
              console.log('[AdminRoute] Admin confirmado en base de datos:', admin.email);
              isValid = true;
            } else {
              console.log('[AdminRoute] Admin no confirmado:', confirmError?.message || 'No existe');
              localStorage.removeItem('adminUser');
              localStorage.removeItem('userRole');
            }
          }
        } catch (e) {
          console.error('[AdminRoute] Error procesando datos:', e);
          localStorage.removeItem('adminUser');
          localStorage.removeItem('userRole');
        }
      }
      
      // Si no hay datos válidos en localStorage, verificar sesión normal
      if (!isValid) {
        console.log('[AdminRoute] Verificando sesión de Supabase...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          console.log('[AdminRoute] Sesión encontrada, verificando si es admin:', session.user.email);
          
          // Verificar si el correo de la sesión está en la tabla admins
          const { data: adminData, error: adminError } = await supabase
            .from('admins') // CORRECCIÓN: Usar 'admins' en plural
            .select('*')
            .eq('email', session.user.email);
          
          if (!adminError && adminData && adminData.length > 0) {
            console.log('[AdminRoute] Usuario encontrado en tabla admins');
            
            localStorage.setItem('adminUser', JSON.stringify({
              id: adminData[0].id,
              email: adminData[0].email,
              name: adminData[0].name || 'Admin'
            }));
            localStorage.setItem('userRole', 'ADMIN');
            
            isValid = true;
          } else {
            console.log('[AdminRoute] Usuario no es admin:', adminError?.message || 'No existe en tabla admins');
          }
        } else {
          console.log('[AdminRoute] No hay sesión activa');
        }
      }
      
      setIsValidAdmin(isValid);
    };
    
    checkAdminAuth();
  }, []);
  
  // Mostrar loader mientras se verifica
  if (isValidAdmin === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }
  
  // CRUCIAL: Redireccionar si no es admin válido
  if (!isValidAdmin) {
    console.log('[AdminRoute] No es admin válido, redireccionando a login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Solo mostrar el panel si es un admin válido
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
};