import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Este useEffect maneja el procesamiento del token y la verificación
  useEffect(() => {
    const processHashAndValidateSession = async () => {
      try {
        console.log("Initializing reset password page");
        
        // Importante: Supabase automáticamente procesa los parámetros del hash
        // Solo necesitamos verificar si tenemos una sesión válida después
        const { data, error } = await supabase.auth.getSession();
        
        console.log("Session data:", data);
        console.log("Session error:", error);
        
        if (error) {
          console.error("Error getting session:", error);
          setTokenValid(false);
          toast({
            title: "Error",
            description: "Unable to validate your reset link. Please request a new one.",
            variant: "destructive",
          });
        } else if (data.session) {
          console.log("Valid session found");
          setTokenValid(true);
        } else {
          console.log("No session found");
          setTokenValid(false);
          toast({
            title: "Link Expired",
            description: "This password reset link appears to be invalid or has expired.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Session validation error:", err);
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    // Permitir que Supabase procese la URL antes de validar la sesión
    setTimeout(() => {
      processHashAndValidateSession();
    }, 1000);
  }, [toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!password) {
      toast({
        title: "Required Field",
        description: "Please enter your new password",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Updating password...");
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        console.error("Password update error:", error);
        toast({
          title: "Update Failed",
          description: error.message || "Could not update password. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log("Password updated successfully");
        setResetComplete(true);
        toast({
          title: "Success!",
          description: "Your password has been updated successfully",
        });
        
        // Redirigir al login después de un breve retraso
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Función de renderizado básico para probar si el componente está funcionando
  console.log("Rendering ResetPassword component. State:", {
    validatingToken,
    tokenValid,
    resetComplete
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <HeaderSpacer />
      
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
            <CardDescription>
              Create a new secure password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validatingToken ? (
              // Estado de carga mientras se valida el token
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#f74f4f]" />
                <p className="mt-4 text-gray-600">Validating your reset link...</p>
              </div>
            ) : !tokenValid ? (
              // Token inválido o expirado
              <div className="py-4">
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    This password reset link is invalid or has expired.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-600 mb-4">
                  Please request a new password reset link.
                </p>
                <Button 
                  className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                  onClick={() => navigate("/forgot-password")}
                >
                  Request New Link
                </Button>
              </div>
            ) : resetComplete ? (
              // Restablecimiento exitoso
              <div className="py-4 text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Password Updated!</h3>
                <p className="text-gray-600 mb-4">
                  Your password has been reset successfully. You'll be redirected to the login page in a moment.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="mt-2">
                    Go to Login
                  </Button>
                </Link>
              </div>
            ) : (
              // Formulario de restablecimiento de contraseña
              <form onSubmit={handleUpdatePassword} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : "Update Password"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;