import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header, HeaderSpacer } from "@/components/layout/Header";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState(""); // Nuevo estado para nombre
  const [lastName, setLastName] = useState(""); // Nuevo estado para apellido
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación para campos requeridos
    if (!firstName) {
      toast({
        title: "Required Field",
        description: "Please enter your first name",
        variant: "destructive",
      });
      return;
    }
    
    if (!lastName) {
      toast({
        title: "Required Field",
        description: "Please enter your last name",
        variant: "destructive",
      });
      return;
    }
    
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
        description: "Please enter a password",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirmPassword) {
      toast({
        title: "Required Field",
        description: "Please confirm your password",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    // Validate US phone number format
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phone) {
      toast({
        title: "Required Field",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    
    if (!phoneRegex.test(phone)) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number in the format (XXX) XXX-XXXX",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phone
        },
        // Redirigir al callback de auth para que podamos interceptarlo
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Comprobamos si el usuario se creó correctamente
        if (data.user) {
          // Verificamos si ya existe (para detectar emails ya registrados)
          if (data.user.identities && data.user.identities.length === 0) {
            toast({
              title: "Email already registered",
              description: "This email is already registered. Please login or use a different email.",
              variant: "destructive",
            });
          } else {
            // Segundo paso: Asegurar que se guarden los metadatos con una actualización explícita
            // Esto es una protección adicional por si la primera vez no se guardó bien
            if (data.session) {
              const { error: updateError } = await supabase.auth.updateUser({
                data: { 
                  first_name: firstName,
                  last_name: lastName,
                  phone_number: phone 
                }
              });
              
              if (updateError) {
                console.error("Error updating user metadata:", updateError);
              }
            }
            
            // Guardar en el almacenamiento local para uso posterior
            localStorage.setItem('userPhone', phone);
            localStorage.setItem('userFirstName', firstName);
            localStorage.setItem('userLastName', lastName);
            
            toast({
              title: "Registration successful!",
              description: "Check your email to confirm your account",
            });
            navigate("/login");
          }
        } else {
          toast({
            title: "Registration issue",
            description: "Account created but user data not available. Please try logging in.",
          });
          navigate("/login");
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "Configuration error. Check your Supabase connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resto del componente igual
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
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {/* Nuevos campos para nombre y apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
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
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link 
                  to="/login" 
                  className="text-[#f74f4f] hover:text-[#e43c3c] font-medium"
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