import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Loader2, AlertCircle } from "lucide-react";
import HCaptcha from '@hcaptcha/react-hcaptcha';

// Get hCaptcha site key from environment variables
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, user, loading: authLoading, isAdmin, roles, permissions, hasPermission } = useAuth();
  
  // Clear form error when inputs change
  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
  }, [email, password, captchaToken, formError]);
  
  // Handle redirection after successful authentication
  useEffect(() => {
    if (!user || authLoading) return;
    
    // This will run when the user authenticates successfully
    console.log('[Login] User authenticated, preparing redirect');
    console.log('[Login] Roles:', roles);
    console.log('[Login] Is admin:', isAdmin);
    console.log('[Login] Permissions:', permissions);
    
    // Short delay to ensure permissions have been processed
    const redirectTimeout = setTimeout(() => {
      // Get the intended destination from state or determine based on permissions
      let destination = '/';
      
      // Check if we have a requested route to return to
      if (location.state?.from?.pathname) {
        destination = location.state.from.pathname;
      } else if (isAdmin || hasPermission('view_admin_dashboard')) {
        destination = '/admin/dashboard';
      } else if (hasPermission('create_listing')) {
        destination = '/broker/dashboard';
      }
      
      console.log(`[Login] Redirecting to: ${destination}`);
      navigate(destination, { replace: true });
      
      // Welcome message
      toast({
        title: `Welcome${user.user_metadata?.first_name ? ', ' + user.user_metadata.first_name : ''}!`,
        description: "You've successfully signed in.",
      });
    }, 300); // Short delay to ensure permissions are loaded
    
    return () => clearTimeout(redirectTimeout);
  }, [user, authLoading, isAdmin, roles, permissions, hasPermission, navigate, location.state, toast]);
  
  // Handle hCaptcha verification
  const handleVerificationSuccess = (token: string) => {
    console.log('[Login] hCaptcha verification successful');
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    console.error('[Login] hCaptcha verification failed');
    setFormError("Captcha verification failed. Please try again.");
    
    toast({
      title: "Verification Error",
      description: "Failed to verify that you're not a robot. Please try again.",
      variant: "destructive",
    });
  };
  
  const validateForm = () => {
    // Email validation
    if (!email.trim()) {
      setFormError("Email is required");
      return false;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setFormError("Please enter a valid email address");
      return false;
    }
    
    // Password validation
    if (!password) {
      setFormError("Password is required");
      return false;
    }
    
    // Captcha validation
    if (!captchaToken) {
      setFormError("Please complete the security verification");
      return false;
    }
    
    return true;
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setFormError(null);
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      console.log(`[Login] Attempting to sign in with email: ${email}`);
      
      // Pass the captcha token to the signIn function
      const { error } = await signIn(email, password, captchaToken);

      if (error) {
        console.error('[Login] Authentication error:', error);
        
        // Reset captcha if authentication fails
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
        
        // Set form error message
        setFormError(
          error.message === 'Invalid login credentials'
            ? 'Incorrect email or password'
            : error.message || 'Authentication failed'
        );
        
        // Also show toast for visibility
        toast({
          title: "Login failed",
          description: error.message || "Authentication failed. Please try again.",
          variant: "destructive",
        });
        
        setLoading(false);
        return;
      }
      
      console.log('[Login] Authentication successful');
      // Redirection is handled by useEffect above
      
    } catch (error: any) {
      console.error('[Login] Unexpected error:', error);
      
      // Reset captcha on error
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      
      setFormError("An unexpected error occurred. Please try again.");
      
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      
      setLoading(false);
    }
  };

  // If already authenticated, redirect based on role
  if (user && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#f74f4f]" />
          <p className="mt-4 text-gray-600">Already signed in. Redirecting...</p>
        </div>
      </div>
    );
  }

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
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <span className="text-red-800 text-sm">{formError}</span>
              </div>
            )}
            
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
                  disabled={loading}
                  className={formError && !email ? "border-red-300" : ""}
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
                  disabled={loading}
                  className={formError && !password ? "border-red-300" : ""}
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <Link 
                    to="/forgot-password" 
                    className="text-[#f74f4f] hover:text-[#e43c3c] font-medium"
                    tabIndex={loading ? -1 : 0}
                  >
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
                  theme="light"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                disabled={loading || authLoading || !captchaToken}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : "Sign in"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link 
                  to="/register" 
                  className="text-[#f74f4f] hover:text-[#e43c3c] font-medium"
                  tabIndex={loading ? -1 : 0}
                >
                  Register here
                </Link>
              </p>
            </div>
            
            {/* Add current time indicator for debugging - will show only in development */}
            {import.meta.env.DEV && (
              <div className="mt-8 text-xs text-gray-400 text-center">
                {new Date().toISOString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;