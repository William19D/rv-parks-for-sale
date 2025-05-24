
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { Header, HeaderSpacer } from "@/components/layout/Header";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      toast({
        title: "Configuration Error",
        description: "Supabase is not properly configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSent(true);
        toast({
          title: "Reset email sent!",
          description: "Check your email for a password reset link",
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
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
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="text-green-600 text-sm">
                  If an account with that email exists, we've sent you a password reset link.
                </div>
                <div className="space-y-2">
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm"
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                    }}
                  >
                    Send another email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="text-sm text-gray-600 hover:text-[#f74f4f]"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
