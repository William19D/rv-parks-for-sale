
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, userRole } = useAuth();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!email) {
      toast({
        title: "Required field",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    if (!email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    if (!password) {
      toast({
        title: "Required field",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      console.log(`[Login] Attempting to sign in with: ${email}`);
      
      const { error } = await signIn(email, password);

      if (error) {
        console.error('[Login] Authentication error:', error);
        toast({
          title: "Login error",
          description: error.message || "Incorrect credentials",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      toast({
        title: "Welcome",
        description: "You have successfully logged in",
      });
      
      // Wait a moment for role to be determined, then redirect
      setTimeout(() => {
        const from = location.state?.from?.pathname;
        
        // Redirect based on user role
        if (userRole === 'ADMIN') {
          console.log('[Login] Redirecting admin to dashboard');
          navigate('/admin/dashboard', { replace: true });
        } else if (userRole === 'BROKER') {
          console.log('[Login] Redirecting broker to dashboard');
          navigate('/broker/dashboard', { replace: true });
        } else {
          // Regular user or fallback
          console.log('[Login] Redirecting user to home or intended route');
          navigate(from || '/', { replace: true });
        }
      }, 500);
      
    } catch (error: any) {
      console.error('[Login] Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <Link to="/forgot-password" className="text-[#f74f4f] hover:text-[#e43c3c] font-medium">
                    Forgot your password?
                  </Link>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : "Sign in"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link 
                  to="/register" 
                  className="text-[#f74f4f] hover:text-[#e43c3c] font-medium"
                >
                  Register here
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
