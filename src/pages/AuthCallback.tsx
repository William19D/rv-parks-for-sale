import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleTokenVerification = async () => {
      try {
        // Obtenemos el hash de la URL (contiene el token)
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");
        
        console.log("Processing auth callback:", { type });
        
        if (type === "signup" || type === "recovery" || type === "email_change") {
          // Verificamos la sesión para procesar el token
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error verifying token:", error);
            setError(error.message);
            return;
          }
          
          if (data.session) {
            console.log("Token verified successfully");
            
            // Para verificación de correo, redirige a la página de éxito
            if (type === "signup") {
              navigate("/auth/success");
            } 
            // Para recuperación de contraseña, no redirigimos ya que manejamos en ResetPassword.tsx
            else if (type === "recovery") {
              // Se queda en la página actual, será manejada por ResetPassword.tsx
            }
            // Para cambio de correo u otros tipos
            else {
              navigate("/login");
            }
          } else {
            console.error("No session after token validation");
            setError("No se pudo verificar tu token. Por favor intenta de nuevo.");
          }
        } else {
          // Cualquier otra autenticación, redirige al login por defecto
          navigate("/login");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Ha ocurrido un error al procesar tu solicitud.");
      }
    };

    // Solo procesamos si hay un hash en la URL
    if (location.hash) {
      handleTokenVerification();
    } else {
      // Si no hay hash, redirigimos al home
      navigate("/");
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <div className="text-red-500">
            <p>{error}</p>
            <button 
              onClick={() => navigate("/login")}
              className="mt-4 px-4 py-2 bg-[#f74f4f] text-white rounded-md"
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#f74f4f]" />
            <p className="mt-4 text-gray-600">Procesando tu solicitud...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;