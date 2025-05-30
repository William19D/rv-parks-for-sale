import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header, HeaderSpacer } from "@/components/layout/Header";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if there's already a session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is already logged in, check for admin role directly
        checkAdminAndRedirect(session.user.id);
      }
    };
    
    checkSession();
  }, []);
  
  // Separate function to check admin status and redirect
  const checkAdminAndRedirect = async (userId: string) => {
    try {
      // Using direct SQL query instead of the standard query
      const { data, error } = await supabase.rpc('is_admin', { 
        user_id_param: userId 
      });
      
      if (!error && data) {
        // User is admin
        localStorage.setItem('userRole', 'ADMIN');
        navigate("/admin/dashboard");
      } else {
        // Not admin or error occurred
        localStorage.setItem('userRole', 'USER');
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      // Default to USER
      localStorage.setItem('userRole', 'USER');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Custom validation in English
    if (!email) {
      toast({
        title: "Required Field",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    if (!email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    if (!password) {
      toast({
        title: "Required Field",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      console.log(`Attempting login with email: ${email}`);
      
      // Sign in with Supabase
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (!authData || !authData.user) {
        toast({
          title: "Error",
          description: "Authentication failed",
          variant: "destructive",
        });
        return;
      }
      
      console.log(`Successfully authenticated user: ${authData.user.id}`);

      // For the admin test account, force admin
      if (email === 'admintest@admintest.com') {
        console.log("Admin account detected");
        localStorage.setItem('userRole', 'ADMIN');
        
        toast({
          title: "Admin Access Granted",
          description: "Welcome to the admin dashboard",
        });
        
        navigate("/admin/dashboard");
        return;
      }
      
      // Use direct SQL query to check admin status
      const { data: isAdmin, error: adminError } = await supabase.rpc('check_user_role', { 
        user_id_param: authData.user.id,
        role_id_param: 2 // Admin role ID
      });
      
      console.log("Admin check result:", { isAdmin, adminError });
      
      if (!adminError && isAdmin) {
        // User is admin
        localStorage.setItem('userRole', 'ADMIN');
        
        toast({
          title: "Admin Access Granted",
          description: "Welcome to the admin dashboard",
        });
        
        navigate("/admin/dashboard");
      } else {
        // Not admin or error occurred
        localStorage.setItem('userRole', 'USER');
        
        toast({
          title: "Welcome!",
          description: "You have successfully signed in",
        });
        
        navigate("/");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Configuration error. Check your Supabase connection.",
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
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
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
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <Link to="/forgot-password" className="text-[#f74f4f] hover:text-[#e43c3c] font-medium">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
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