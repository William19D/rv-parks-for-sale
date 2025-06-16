import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import HCaptcha from '@hcaptcha/react-hcaptcha';

// Get hCaptcha site key from environment variables
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, user, isAdmin, roles } = useAuth();
  
  // Handle redirection after successful authentication
  useEffect(() => {
    if (!user) return;
    
    // This will run when the user authenticates
    console.log('[Login] User authenticated, preparing redirect');
    console.log('[Login] Roles:', roles);
    console.log('[Login] Is admin:', isAdmin);
    
    // Short delay to ensure roles have been processed
    const redirectTimeout = setTimeout(() => {
      // Get the intended destination or use default based on role
      const from = location.state?.from?.pathname || (isAdmin ? '/admin/dashboard' : '/');
      console.log(`[Login] Redirecting to: ${from}`);
      navigate(from, { replace: true });
    }, 200);
    
    return () => clearTimeout(redirectTimeout);
  }, [user, isAdmin, roles, navigate, location.state]);
  
  // Handle hCaptcha verification
  const handleVerificationSuccess = (token: string) => {
    console.log('[Login] hCaptcha verification successful');
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    console.error('[Login] hCaptcha verification failed');
    toast({
      title: "Verification Error",
      description: "Failed to verify that you're not a robot. Please try again.",
      variant: "destructive",
    });
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validations
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

    // Check if captcha is completed
    if (!captchaToken) {
      toast({
        title: "Verification required",
        description: "Please complete the captcha verification",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      console.log(`[Login] Attempting to sign in with: ${email}`);
      
      // Pass the captcha token to your signIn function
      const { error } = await signIn(email, password, captchaToken);

      if (error) {
        console.error('[Login] Authentication error:', error);
        
        // Reset captcha if authentication fails
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
        
        toast({
          title: "Login error",
          description: error.message || "Incorrect credentials",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      console.log('[Login] Authentication successful');
      
      // Show success toast
      toast({
        title: "Welcome",
        description: "You have successfully logged in",
      });
      
      // Redirection is handled by useEffect above
      
    } catch (error: any) {
      console.error('[Login] Unexpected error:', error);
      
      // Reset captcha on error
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
              
              {/* hCaptcha Component */}
              <div className="flex justify-center py-2">
                <HCaptcha
                  ref={captchaRef}
                  sitekey={HCAPTCHA_SITE_KEY}
                  onVerify={handleVerificationSuccess}
                  onError={handleCaptchaError}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                disabled={loading || !captchaToken}
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