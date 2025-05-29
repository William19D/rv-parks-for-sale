import { useState, useEffect, useRef, memo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { 
  Menu, 
  X, 
  User,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Component for spacing that matches the header height
export const HeaderSpacer = memo(() => {
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  
  useEffect(() => {
    const updateHeight = () => {
      const headerElement = document.querySelector('#main-header');
      if (headerElement) {
        setHeaderHeight(headerElement.clientHeight);
      }
    };
    
    // Update height initially and on resize
    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    // Update when class changes (scroll)
    const observer = new MutationObserver(updateHeight);
    const headerElement = document.querySelector('#main-header');
    if (headerElement) {
      observer.observe(headerElement, { attributes: true });
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      observer.disconnect();
    };
  }, []);
  
  return <div style={{ height: `${headerHeight}px` }}></div>;
});

// Componente Header memoizado para prevenir re-renderizados innecesarios
export const Header = memo(() => {
  const isMobile = useIsMobile();
  const { user, signOut, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [navItemsState, setNavItemsState] = useState<Array<any>>([
    {
      name: "Home",
      path: "/",
      dropdown: null,
    },
    {
      name: "RV Parks For Sale",
      path: "/listings",
      dropdown: null,
    },
  ]);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Monitor de cambios de ruta para scroll al inicio
  useEffect(() => {
    // Cuando cambia la ruta, hacer scroll al inicio
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
  }, [location.pathname]);
  
  // Manejar el desplazamiento
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  // Función para obtener nombre de usuario de diversas fuentes
  const getUserName = (currentUser: any): string => {
    if (!currentUser) return "";
    
    // Try to get name from user metadata first
    const firstName = currentUser.user_metadata?.first_name;
    const lastName = currentUser.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    // If not in metadata, try localStorage
    const storedFirstName = localStorage.getItem('userFirstName');
    const storedLastName = localStorage.getItem('userLastName');
    
    if (storedFirstName && storedLastName) {
      return `${storedFirstName} ${storedLastName}`;
    }
    
    // Fall back to email if no name is available
    return currentUser.email?.split('@')[0] || "";
  };

  // Actualizar los elementos de navegación cuando cambia el estado del usuario
  useEffect(() => {
    // Base navigation items available to all users
    const baseNavItems = [
      {
        name: "Home",
        path: "/",
        dropdown: null,
      },
      {
        name: "RV Parks For Sale",
        path: "/listings",
        dropdown: null,
      },
    ];
    
    // Broker Dashboard only for logged-in users
    const brokerDashboardItem = {
      name: "Broker Dashboard",
      path: "/broker/dashboard",
      dropdown: null,
    };
    
    // Add Broker Dashboard to nav items only if user is logged in
    const newNavItems = user 
      ? [...baseNavItems, brokerDashboardItem] 
      : [...baseNavItems];
    
    setNavItemsState(newNavItems);
  }, [user]);

  // Función para manejar la navegación y hacer scroll al inicio
  const handleNavigation = (path: string) => {
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
  };

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  const handleSignOut = async () => {
    // Hacer scroll al inicio antes de cerrar sesión
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
    
    await signOut();
    setMenuOpen(false);
  };

  // Renderizar sección de autenticación basada en el estado de usuario
  const renderAuthSection = () => {
    if (loading) {
      return <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>;
    }
    
    if (user) {
      const userName = getUserName(user);
      return (
        <>
          {/* Contenido para usuario autenticado */}
          {isMobile ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 px-3 py-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Hello, <span className="font-medium">{userName || user.email?.split('@')[0]}</span></span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-100 rounded-full p-2">
                <User className="h-4 w-4 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  {userName || user.email?.split('@')[0]}
                </span>
              </div>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-gray-600 hover:text-[#f74f4f]"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      );
    } else {
      return (
        <>
          {/* Contenido para usuario no autenticado */}
          {isMobile ? (
            <div className="space-y-2">
              <Link to="/login" onClick={() => { setMenuOpen(false); handleNavigation("/login"); }}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => { setMenuOpen(false); handleNavigation("/register"); }}>
                <Button className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]">
                  Register
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login" onClick={() => handleNavigation("/login")}>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => handleNavigation("/register")}>
                <Button 
                  size="sm"
                  className="bg-[#f74f4f] hover:bg-[#e43c3c]"
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
        </>
      );
    }
  };

  return (
    <header 
      id="main-header"
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 ease-in-out",
        scrolled 
          ? "bg-white shadow-md py-2" 
          : "bg-white/95 backdrop-blur-sm py-4 border-b border-gray-200"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            to="/" 
            className="flex items-center group" 
            onClick={() => {
              closeDropdowns();
              handleNavigation("/");
            }}
          >
                      {/* Logo Area - CORREGIDO CON RUTA ABSOLUTA */}
          <div className="w-48 h-12 flex items-center mr-4">
            <img 
              src="/logo.svg" 
              alt="RoverPass Logo" 
              className="w-full h-full object-contain group-hover:opacity-80 transition-opacity duration-300" 
            />
          </div>
          </Link>
        </div>

        {isMobile ? (
          <>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-full hover:bg-gray-100"
              >
                {menuOpen ? (
                  <X className="h-5 w-5 text-gray-600 hover:text-[#f74f4f]" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-600 hover:text-[#f74f4f]" />
                )}
              </Button>
            </div>

            <AnimatePresence>
              {menuOpen && (
                <motion.div 
                  className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-4">
                    <div className="flex flex-col space-y-3">
                      {navItemsState.map((item) => (
                        <div key={item.name}>
                          <Link
                            to={item.path}
                            className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100 group"
                            onClick={() => {
                              setMenuOpen(false);
                              handleNavigation(item.path);
                            }}
                          >
                            <span className="text-gray-700 group-hover:text-[#f74f4f] transition-colors">{item.name}</span>
                          </Link>
                        </div>
                      ))}
                      
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        {renderAuthSection()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="hidden md:flex items-center space-x-1">
            <nav className="flex items-center space-x-6">
              {navItemsState.map((item) => (
                <div key={item.name} className="relative group">
                  <Link
                    to={item.path}
                    className="px-2 py-2 text-sm font-medium text-gray-700 hover:text-[#f74f4f] transition-colors"
                    onClick={() => {
                      closeDropdowns();
                      handleNavigation(item.path);
                    }}
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#f74f4f] group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </div>
              ))}
              
              <div className="ml-4 flex items-center space-x-2">
                {renderAuthSection()}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
});