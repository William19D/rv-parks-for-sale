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
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '';

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
  const captchaRef = useRef<HCaptcha | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if hCaptcha site key is configured
  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY) {
      setFormError("Security verification is not properly configured. Please contact support.");
    }
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
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    setFormError("Captcha verification failed. Please try again.");
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
    
    // Always require captcha verification
    if (!captchaToken) {
      setFormError("Please complete the security verification");
      return false;
    }
    
    // Verify hCaptcha site key is configured
    if (!HCAPTCHA_SITE_KEY) {
      setFormError("Security verification is not properly configured. Please contact support.");
      return false;
    }
    
    return true;
  };

  // Register using edge function
  const registerWithEdgeFunction = async () => {
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
        captchaToken: captchaToken
      },
      redirectUrl: `${window.location.origin}/rv-parks-for-sale/auth/callback/`
    };

    try {
      const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(requestBody)
      });
      
      const responseText = await response.text();
      
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
          return result.user;
        } catch (e) {
          throw new Error("Invalid response format from server");
        }
      }
      
      throw new Error("Empty response from server");
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setFormError(null);
    
    // Validate all form fields
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Only use edge function for registration
      const user = await registerWithEdgeFunction();
      
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
              
              {/* Security verification section */}
              <div>
                <Label className="block mb-2">Security Verification</Label>
                <div className={`flex justify-center py-2 ${!captchaToken && formError ? "border border-red-300 rounded-md" : ""}`}>
                  {HCAPTCHA_SITE_KEY ? (
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={HCAPTCHA_SITE_KEY}
                      onVerify={handleVerificationSuccess}
                      onError={handleCaptchaError}
                      onExpire={() => setCaptchaToken(null)}
                      theme="light"
                    />
                  ) : (
                    <div className="text-sm text-red-500 p-2">
                      Security verification not configured. Please contact support.
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                disabled={loading || !captchaToken}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;