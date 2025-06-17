import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Loader2, AlertCircle } from "lucide-react";
import HCaptcha from '@hcaptcha/react-hcaptcha';

// Environment detection
const IS_DEV = import.meta.env.DEV === true || window.location.hostname === 'localhost';

// Get environment variables with fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

// Construct API URL from Supabase URL if not explicitly provided
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 
                   (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/auth-service` : '');

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState(""); 
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Log configuration information once on component mount
  useEffect(() => {
    console.log("Environment:", IS_DEV ? "Development" : "Production");
    console.log("Auth API URL:", AUTH_API_URL);
    console.log("Origin:", window.location.origin);
    
    // This will help debug if the API URL is properly set
    setDebugInfo(`API: ${AUTH_API_URL ? AUTH_API_URL : "Not configured"}`);
  }, []);
  
  // Clear form error when inputs change
  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
  }, [email, password, confirmPassword, phone, firstName, lastName, captchaToken, formError]);

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get only the digits
    const digits = e.target.value.replace(/\D/g, '');
    
    // Format the phone number as (XXX) XXX-XXXX
    let formattedPhone = '';
    if (digits.length <= 3) {
      formattedPhone = digits.length ? `(${digits}` : '';
    } else if (digits.length <= 6) {
      formattedPhone = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      formattedPhone = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    
    setPhone(formattedPhone);
  };

  // Handle hCaptcha verification
  const handleVerificationSuccess = (token: string) => {
    console.log('[Register] hCaptcha verification successful');
    setCaptchaToken(token);
    setDebugInfo(`Captcha verified: ${token.substring(0, 10)}...`);
  };

  const handleCaptchaError = () => {
    console.error('[Register] hCaptcha verification failed');
    setFormError("Captcha verification failed. Please try again.");
    setDebugInfo("Captcha error occurred");
  };

  // Validate all form fields
  const validateForm = () => {
    // Validate first name
    if (!firstName.trim()) {
      setFormError("Please enter your first name");
      return false;
    }
    
    // Validate last name
    if (!lastName.trim()) {
      setFormError("Please enter your last name");
      return false;
    }
    
    // Validate email
    if (!email.trim()) {
      setFormError("Please enter your email address");
      return false;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setFormError("Please enter a valid email address");
      return false;
    }
    
    // Validate phone number
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phone) {
      setFormError("Please enter your phone number");
      return false;
    }
    
    if (!phoneRegex.test(phone)) {
      setFormError("Please enter a valid phone number in the format (XXX) XXX-XXXX");
      return false;
    }
    
    // Validate password
    if (!password) {
      setFormError("Please enter a password");
      return false;
    }
    
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long");
      return false;
    }
    
    if (!confirmPassword) {
      setFormError("Please confirm your password");
      return false;
    }
    
    if (password !== confirmPassword) {
      setFormError("Passwords don't match");
      return false;
    }
    
    // Check for captcha in development mode
    if (!IS_DEV && !captchaToken) {
      setFormError("Please complete the security verification");
      return false;
    }
    
    return true;
  };

  // Register using edge function
  const registerWithEdgeFunction = async () => {
    setDebugInfo(`Sending request to: ${AUTH_API_URL}`);
    console.log(`[Register] Sending registration request to: ${AUTH_API_URL}`);

    if (!AUTH_API_URL) {
      throw new Error("Authentication API URL is not configured. Please contact support.");
    }

    const requestBody = {
      action: "signup",
      email,
      password,
      userData: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        role: 'user',
        captchaToken: captchaToken || "development-mode-bypass"
      },
      redirectUrl: `${window.location.origin}/auth/callback`
    };
    
    console.log('[Register] Request payload:', JSON.stringify(requestBody));
    setDebugInfo(`Sending data for: ${email}`);

    try {
      const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(requestBody)
      });
      
      // Debug information
      console.log("[Register] Response status:", response.status);
      setDebugInfo(`Response status: ${response.status}`);
      
      const responseText = await response.text();
      console.log("[Register] Response text:", responseText);
      
      if (!response.ok) {
        // Parse error if possible
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.error || `Failed to register. Server returned ${response.status}`);
          } catch (e) {
            throw new Error(`Failed to register. Server returned ${response.status}`);
          }
        }
        throw new Error(`Failed to register. Server returned ${response.status}`);
      }
      
      // Parse successful response
      if (responseText) {
        try {
          const result = JSON.parse(responseText);
          setDebugInfo(`Success! User ID: ${result.user?.id}`);
          return result.user;
        } catch (e) {
          console.error("[Register] Failed to parse response:", e);
          throw new Error("Invalid response format from server");
        }
      }
      
      throw new Error("Empty response from server");
    } catch (error) {
      setDebugInfo(`Network error: ${error instanceof Error ? error.message : "Unknown"}`);
      throw error;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Register] Form submitted");
    setDebugInfo("Form submitted");
    
    // Clear any previous errors
    setFormError(null);
    
    // Validate all form fields
    if (!validateForm()) {
      console.log("[Register] Form validation failed");
      setDebugInfo("Validation failed");
      return;
    }

    setLoading(true);
    setDebugInfo("Processing... please wait");

    try {
      // Only use edge function for registration
      const user = await registerWithEdgeFunction();
      
      // Log success
      console.log("[Register] Registration successful:", user?.id);
      
      // Save user info locally
      localStorage.setItem('userPhone', phone);
      localStorage.setItem('userFirstName', firstName);
      localStorage.setItem('userLastName', lastName);
      localStorage.setItem('userEmail', email);
      
      toast({
        title: "Registration successful!",
        description: "Check your email to confirm your account",
      });
      
      navigate("/verify-email");
      
    } catch (error) {
      console.error('[Register] Registration error:', error);
      
      // Reset captcha on error
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      
      // Set form error
      setFormError(error instanceof Error ? error.message : "Connection error. Please check your network and try again.");
      
      // Also show toast for visibility
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Connection error. Please try again.",
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
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Register to access all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <span className="text-red-800 text-sm">{formError}</span>
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    className={!firstName && formError ? "border-red-300" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    className={!lastName && formError ? "border-red-300" : ""}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={!email && formError ? "border-red-300" : ""}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (US Format)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(123) 456-7890"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={14}
                  disabled={loading}
                  className={!phone && formError ? "border-red-300" : ""}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className={!password && formError ? "border-red-300" : ""}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className={!confirmPassword && formError ? "border-red-300" : ""}
                />
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
              
              {/* Bypass captcha in dev mode - REMOVE IN PRODUCTION */}
              {IS_DEV && !captchaToken && (
                <div className="text-xs p-2 bg-yellow-50 text-yellow-700 rounded">
                  <button 
                    type="button" 
                    onClick={() => setCaptchaToken("dev-bypass-token")}
                    className="underline hover:text-yellow-800"
                  >
                    Dev mode: Click to bypass captcha
                  </button>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link 
                  to="/login" 
                  className="text-[#f74f4f] hover:text-[#e43c3c] font-medium"
                  tabIndex={loading ? -1 : 0}
                >
                  Sign in here
                </Link>
              </p>
            </div>
            
            {/* Debug information - will show only in development */}
            {IS_DEV && debugInfo && (
              <div className="mt-4 p-2 bg-gray-100 text-gray-700 text-xs rounded">
                <strong>Debug:</strong> {debugInfo}<br/>
                <strong>Time:</strong> {new Date().toISOString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;