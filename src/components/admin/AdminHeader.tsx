import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AdminHeader() {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced logout function that ensures redirection
  const handleLogout = async () => {
    try {
      // Primero intentar con el signOut del hook si está disponible
      if (signOut) {
        await signOut();
      }
      
      // Luego asegurar el logout con Supabase directamente
      await supabase.auth.signOut();
      
      // Clear all auth-related localStorage items
      localStorage.removeItem('userRole');
      localStorage.removeItem('forceAdmin');
      localStorage.removeItem('bypassAuth');
      localStorage.removeItem('supabase.auth.token');
      
      // Show success toast
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      
      // Redirección inmediata
      window.location.href = "/";
      
      // Como respaldo adicional con un pequeño retraso
      setTimeout(() => {
        navigate("/");
      }, 100);
    } catch (error) {
      console.error("Error signing out:", error);
      
      // Intento final en caso de error
      try {
        localStorage.clear(); // Limpiar todo el localStorage como último recurso
        window.location.reload(); // Forzar recarga de la página
        window.location.href = "/"; // Intentar redirección directa
      } catch (fallbackError) {
        console.error("Fallback logout also failed:", fallbackError);
      }
      
      toast({
        title: "Error",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header 
      id="main-header"
      className={`fixed top-0 left-0 w-full z-50 bg-white transition-shadow ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/admin/dashboard" className="flex items-center">
            <h1 className="font-bold text-xl text-[#f74f4f]">Admin Portal</h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#f74f4f]/10 text-[#f74f4f]">
                    {user?.email?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link to="/admin/profile" className="flex items-center w-full h-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/admin/settings" className="flex items-center w-full h-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}