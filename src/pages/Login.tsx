import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Header, HeaderSpacer } from "@/components/layout/Header";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, userRole, signIn } = useAuth();
  
  // Efecto para redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || 
                  (userRole === 'ADMIN' ? '/admin/dashboard' : '/');
      
      navigate(from, { replace: true });
    }
  }, [user, userRole, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!email) {
      toast({
        title: "Campo requerido",
        description: "Por favor ingrese su correo electrónico",
        variant: "destructive",
      });
      return;
    }
    
    if (!email.includes('@')) {
      toast({
        title: "Correo inválido",
        description: "Por favor ingrese un correo electrónico válido",
        variant: "destructive",
      });
      return;
    }
    
    if (!password) {
      toast({
        title: "Campo requerido",
        description: "Por favor ingrese su contraseña",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      console.log(`[Login] Intentando iniciar sesión con: ${email}`);
      
      // Usar la función signIn del hook useAuth
      const { error } = await signIn(email, password);

      if (error) {
        console.error('[Login] Error de autenticación:', error);
        toast({
          title: "Error de inicio de sesión",
          description: error.message || "Credenciales incorrectas",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Si llegamos aquí, la autenticación fue exitosa.
      // El hook useAuth ya actualizó el estado y la redirección
      // se manejará en el useEffect arriba.
      
      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión correctamente",
      });
    } catch (error: any) {
      console.error('[Login] Error inesperado:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <HeaderSpacer />
      
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
            <CardDescription>
              Ingrese sus credenciales para acceder a su cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <Link to="/forgot-password" className="text-[#f74f4f] hover:text-[#e43c3c] font-medium">
                    ¿Olvidó su contraseña?
                  </Link>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                ¿No tiene una cuenta?{" "}
                <Link 
                  to="/register" 
                  className="text-[#f74f4f] hover:text-[#e43c3c] font-medium"
                >
                  Regístrese aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;