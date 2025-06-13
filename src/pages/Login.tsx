import { useState, useEffect } from "react";
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
  const [redirecting, setRedirecting] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, user, isAdmin } = useAuth();
  
  // Handle redirection after successful login with improved role detection
  useEffect(() => {
    if (!user || redirecting) return;
    
    // Mark that we're handling redirection to avoid multiple redirects
    setRedirecting(true);
    
    console.log('[Login] User authenticated, preparing redirect');
    console.log('[Login] User role:', isAdmin ? 'admin' : 'user');
    
    // Allow time for JWT role claims to be properly processed
    const redirectTimeout = setTimeout(() => {
      let redirectTo = '/';
      
      // Check for intended destination or determine based on role
      if (location.state?.from?.pathname) {
        redirectTo = location.state.from.pathname;
      } else if (isAdmin) {
        redirectTo = '/admin/dashboard';
      } else {
        // Regular user dashboard
        redirectTo = '/dashboard';
      }
      
      console.log(`[Login] Redirecting to: ${redirectTo}`);
      navigate(redirectTo, { replace: true });
    }, 500); // Increased delay to ensure JWT is fully processed
    
    return () => clearTimeout(redirectTimeout);
  }, [user, isAdmin, navigate, location.state, redirecting]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validations
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
    setRedirecting(false); // Reset redirecting state on new login attempt

    try {
      console.log(`[Login] Attempting to sign in with: ${email}`);
      
      // Authenticate with Supabase
      const { error } = await signIn(email, password);

      if (error) {
        console.error('[Login] Authentication error:', error);
        
        // Format error message for better user experience
        let errorMessage = "Invalid credentials";
        if (error.message) {
          errorMessage = error.message;
          
          // Translate common error messages
          if (error.message.includes("Invalid login credentials")) {
            errorMessage = "Invalid email or password. Please check your credentials and try again.";
          } else if (error.message.includes("custom_access_token_hook")) {
            errorMessage = "Server error. Please try again or contact support if the issue persists.";
          }
        }
        
        toast({
          title: "Login error",
          description: errorMessage,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      console.log('[Login] Authentication successful');
      
      // Show success toast
      toast({
        title: "Welcome back",
        description: "You have successfully logged in",
      });
      
      // Redirection is handled by useEffect above
      
    } catch (error: any) {
      console.error('[Login] Unexpected error:', error);
      
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
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
                disabled={loading || redirecting}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : redirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
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