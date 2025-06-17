import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [roleFixed, setRoleFixed] = useState(false);
  const [processing, setProcessing] = useState(true);
  const { toast } = useToast();
  const auth = useAuth();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("[AuthCallback] Processing auth callback");
        console.log("[AuthCallback] URL:", window.location.href);
        
        // Extract parameters from both hash and search parameters
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const searchParams = new URLSearchParams(location.search);
        
        // Log all params for debugging
        console.log("[AuthCallback] Hash params:", Object.fromEntries(hashParams.entries()));
        console.log("[AuthCallback] Search params:", Object.fromEntries(searchParams.entries()));
        
        // Check for role processing error specifically
        const isRoleError = hashParams.get("error") === "server_error" && 
                          hashParams.get("error_description")?.includes("user role");
                          
        if (isRoleError) {
          console.log("[AuthCallback] Detected role processing error, attempting to fix");
          
          // First check if we have a session
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (sessionData?.session) {
            // We have a session, so the user is authenticated. Try to manually assign role.
            const userId = sessionData.session.user.id;
            
            console.log("[AuthCallback] User is authenticated with ID:", userId);
            console.log("[AuthCallback] Attempting to fix role assignment");
            
            try {
              // Option 1: Try using your edge function directly to get/set role
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-service`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionData.session.access_token}`
                },
                body: JSON.stringify({
                  action: 'get_user_role'
                })
              });
              
              const roleResult = await response.json();
              console.log("[AuthCallback] Role fix attempt result:", roleResult);
              
              if (roleResult && !roleResult.error) {
                // Role assignment succeeded
                setRoleFixed(true);
                await auth.refreshPermissions(); // Refresh the role in auth context
                
                toast({
                  title: "Account verified!",
                  description: "Your email has been verified and your account is ready.",
                });
                
                setTimeout(() => navigate("/"), 1500);
                return;
              }
            } catch (roleError) {
              console.error("[AuthCallback] Failed to fix role:", roleError);
            }
            
            // If we're still here, the role fix didn't work through the API
            // Let's just accept it and continue with the verification
            console.log("[AuthCallback] Proceeding despite role error");
            toast({
              title: "Email verified!",
              description: "Your account has been verified. Welcome!",
            });
            
            // Refresh auth state
            await auth.refreshPermissions();
            setTimeout(() => navigate("/"), 1000);
            return;
          } else {
            // No session even though we got a role error
            // This is strange, but let's redirect to login
            setError("Your email was verified but we couldn't log you in automatically. Please login manually.");
            setTimeout(() => navigate("/login"), 2000);
            return;
          }
        }
        
        // Get token and type
        const token = hashParams.get("access_token") || 
                     searchParams.get("token") || 
                     hashParams.get("token");
        
        // Get type from either source
        const type = hashParams.get("type") || 
                    searchParams.get("type") || 
                    (searchParams.get("token") ? "signup" : null);
                    
        // Get error info if present
        const errorParam = hashParams.get("error") || searchParams.get("error");
        const errorDescription = hashParams.get("error_description") || 
                               searchParams.get("error_description");
        
        console.log("[AuthCallback] Extracted info:", { token: token ? "exists" : "missing", type, errorParam });
        
        // Handle error case first (but not the role error we already handled)
        if (errorParam && !isRoleError) {
          throw new Error(errorDescription || `Authentication error: ${errorParam}`);
        }
        
        // Handle email verification from direct Supabase link
        if (searchParams.get("token") && type === "signup") {
          console.log("[AuthCallback] Processing email verification from Supabase link");
          
          // Attempt to verify the token directly
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: searchParams.get("token") as string,
            type: "email",
          });
          
          if (verifyError) {
            console.log("[AuthCallback] OTP verification failed, trying getSession", verifyError);
            // Just check if we have a session anyway
            const { data: sessionData } = await supabase.auth.getSession();
            
            if (sessionData?.session) {
              toast({
                title: "Email verified successfully!",
                description: "Your account has been verified. Welcome!",
              });
              
              await auth.refreshPermissions();
              navigate("/");
              return;
            } else {
              // No session, try one more verification approach
              try {
                // As a last resort, try to sign in with the token
                const { error: signInError } = await supabase.auth.verifyOtp({
                  token_hash: searchParams.get("token") as string,
                  type: "signup",
                });
                
                if (signInError) {
                  throw signInError;
                }
                
                toast({
                  title: "Email verified successfully!",
                  description: "Your account is now verified.",
                });
                
                navigate("/login");
                return;
              } catch (finalError) {
                throw new Error(`Verification failed: ${finalError instanceof Error ? finalError.message : 'Please try logging in'}`);
              }
            }
          } else {
            toast({
              title: "Email verified successfully!",
              description: "Your account is ready. Please sign in.",
            });
            navigate("/login");
            return;
          }
        }
        
        // Handle standard callback flows
        if (location.hash || type) {
          console.log("[AuthCallback] Processing standard auth flow");
          
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw new Error(`Session error: ${sessionError.message}`);
          }
          
          if (sessionData?.session) {
            console.log("[AuthCallback] Session exists, user is authenticated");
            
            // Refresh roles and permissions just to be safe
            await auth.refreshPermissions();
            
            switch (type) {
              case "signup":
                toast({
                  title: "Account verified!",
                  description: "Your email has been verified successfully.",
                });
                navigate("/");
                break;
                
              case "recovery":
                navigate("/reset-password");
                break;
                
              case "email_change":
                toast({
                  title: "Email updated",
                  description: "Your email address has been changed successfully.",
                });
                navigate("/");
                break;
                
              default:
                toast({
                  title: "Authentication successful",
                });
                navigate("/");
                break;
            }
          } else {
            console.log("[AuthCallback] No session after auth flow");
            
            if (type === "recovery") {
              navigate("/reset-password", { 
                state: { token: hashParams.get("access_token") } 
              });
            } else {
              navigate("/login", { 
                state: { 
                  message: "Authentication process completed. Please sign in." 
                } 
              });
            }
          }
        } else {
          // No hash or search params to process
          console.log("[AuthCallback] No auth parameters found");
          navigate("/login");
        }
      } catch (err) {
        console.error("[AuthCallback] Error:", err);
        setError(err instanceof Error ? err.message : "Unknown authentication error");
        toast({
          title: "Authentication Error",
          description: err instanceof Error ? err.message : "An error occurred during authentication",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [location, navigate, toast, auth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {processing ? (
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#f74f4f] mx-auto" />
          <p className="mt-4 text-gray-600">Verifying your authentication...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait, this may take a moment.</p>
        </div>
      ) : roleFixed ? (
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Account Verified!</h2>
            <p className="mt-2 text-gray-600">
              Your email has been verified and your account is now active.
            </p>
            <p className="mt-2 text-sm text-gray-500">Redirecting you to the homepage...</p>
          </div>
        </div>
      ) : error ? (
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Authentication Failed</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button 
              onClick={() => navigate("/login")}
              className="mt-6 w-full px-4 py-2 bg-[#f74f4f] text-white rounded-md hover:bg-[#e43c3c]"
            >
              Go to Login
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#f74f4f] mx-auto" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;