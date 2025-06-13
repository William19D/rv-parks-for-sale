import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MinimalRegister = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDebugInfo("");

    try {
      // Log the request we're about to make
      console.log("Attempting signup with email:", email);
      
      // Make a minimal signup request - email and password only
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error("Signup error details:", error);
        setDebugInfo(JSON.stringify(error, null, 2));
        toast({
          title: "Registration Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setDebugInfo(`Success: ${JSON.stringify(data, null, 2)}`);
        toast({
          title: "Success",
          description: "Registration successful. Check your console for details."
        });
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setDebugInfo(`Caught error: ${JSON.stringify(err, null, 2)}`);
      toast({
        title: "Error",
        description: "Unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Debug Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Testing..." : "Test Registration"}
            </Button>
          </form>

          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto max-h-60">
              <pre className="text-xs">{debugInfo}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MinimalRegister;