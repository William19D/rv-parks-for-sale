import { useState, useEffect, useRef, memo, useMemo } from "react";
import { Link, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { 
  Menu, 
  X, 
  User,
  LogOut,
  PlusCircle,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Importar el logo directamente
import logoImage from '@/assets/logo.svg';

// URL base para rutas absolutas
const BASE_URL = import.meta.env.PROD 
  ? "https://preview--park-sell-rover.lovable.app" 
  : "";

// Función para generar rutas absolutas
const absoluteUrl = (path: string): string => {
  // Asegurarse de que la ruta comience con / y unirla con la URL base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
};

// Definir el tipo para los elementos de navegación
interface NavItem {
  name: string;
  path: string;
  dropdown: null | string;
  icon?: LucideIcon;
  exact?: boolean;
  exclude?: string[]; // Rutas a excluir de la correspondencia
}

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

// Función para determinar si una ruta está activa
const isRouteActive = (item: NavItem, pathname: string): boolean => {
  // Si es una ruta exacta, solo debe coincidir perfectamente
  if (item.exact) {
    return pathname === item.path;
  }
  
  // Verificar si el path actual está en las rutas excluidas
  if (item.exclude && item.exclude.some(route => pathname === route || pathname.startsWith(route))) {
    return false;
  }
  
  // Para rutas no exactas, verificar si coincide exactamente o si es una subruta
  return pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`));
};

// Componente memoizado para cada elemento de navegación
const NavItemComponent = memo(({ item, closeDropdowns }: { 
  item: NavItem, 
  closeDropdowns: () => void 
}) => {
  const location = useLocation();
  const active = isRouteActive(item, location.pathname);

  const handleClick = () => {
    closeDropdowns();
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
  };

  return (
    <div className="relative group">
      <NavLink
        to={absoluteUrl(item.path)}
        className={cn(
          "px-2 py-2 text-sm font-medium transition-colors flex items-center",
          active ? "text-[#f74f4f]" : "text-gray-700 hover:text-[#f74f4f]"
        )}
        onClick={handleClick}
      >
        {item.icon && <item.icon className="h-4 w-4 mr-1 text-current" />}
        {item.name}
        <span className={cn(
          "absolute bottom-0 left-0 h-0.5 bg-[#f74f4f] transition-all duration-300",
          active ? "w-full" : "w-0 group-hover:w-full"
        )}></span>
      </NavLink>
    </div>
  );
});

// Componente memoizado para el menú móvil
const MobileNavItem = memo(({ item, setMenuOpen }: { 
  item: NavItem, 
  setMenuOpen: (isOpen: boolean) => void 
}) => {
  const location = useLocation();
  const active = isRouteActive(item, location.pathname);

  const handleClick = () => {
    setMenuOpen(false);
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
  };

  return (
    <div>
      <NavLink
        to={absoluteUrl(item.path)}
        className={cn(
          "flex items-center py-2 px-3 rounded-md group",
          active ? "bg-gray-100 text-[#f74f4f]" : "hover:bg-gray-100"
        )}
        onClick={handleClick}
      >
        {item.icon && <item.icon className="h-4 w-4 mr-2 text-current" />}
        <span className={cn(
          "transition-colors",
          active ? "text-[#f74f4f]" : "group-hover:text-[#f74f4f]"
        )}>
          {item.name}
        </span>
      </NavLink>
    </div>
  );
});

// Componente para la sección de autenticación (memoizado)
const AuthSection = memo(({ user, loading, signOut, isMobile, setMenuOpen }: {
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
  isMobile: boolean;
  setMenuOpen: (isOpen: boolean) => void;
}) => {
  // Función para obtener nombre de usuario de diversas fuentes
  const userName = useMemo(() => {
    if (!user) return "";
    
    // Try to get name from user metadata first
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    
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
    return user.email?.split('@')[0] || "";
  }, [user]);
  
  const handleSignOut = async () => {
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
    await signOut();
    setMenuOpen(false);
  };

  if (loading) {
    return <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>;
  }
  
  if (user) {
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
              onClick={handleSignOut}
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
            <Link 
              to={absoluteUrl("/login")} 
              onClick={() => { 
                setMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "instant" }); 
              }}
            >
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link 
              to={absoluteUrl("/register")} 
              onClick={() => { 
                setMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "instant" }); 
              }}
            >
              <Button className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]">
                Register
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link 
              to={absoluteUrl("/login")} 
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
            >
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link 
              to={absoluteUrl("/register")} 
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
            >
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
});

// Componente Header memoizado para prevenir re-renderizados innecesarios
export const Header = memo(() => {
  const isMobile = useIsMobile();
  const { user, signOut, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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

  // Memoización de los elementos de navegación para evitar re-renderizados
  const navItemsState = useMemo(() => {
    // Base navigation items available to all users
    const baseNavItems: NavItem[] = [
      {
        name: "Home",
        path: "/",
        dropdown: null,
        exact: true // La ruta Home debe coincidir exactamente
      },
      {
        name: "RV Parks For Sale",
        path: "/listings",
        dropdown: null,
        exclude: ["/listings/new"], // Excluir la ruta de "Add Listing"
        exact: false
      },
    ];
    
    // Items solo para usuarios autenticados
    if (user) {
      baseNavItems.push(
        {
          name: "Add Listing",
          path: "/listings/new",
          dropdown: null,
          icon: PlusCircle,
          exact: true // Solo activo en la ruta exacta
        },
        {
          name: "Broker Dashboard",
          path: "/broker/dashboard",
          dropdown: null,
          exact: false // Activo en todas las sub-rutas del dashboard
        }
      );
    }
    
    return baseNavItems;
  }, [user]); // Solo recalcular cuando cambia el usuario

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  // Memoizar los ítems de navegación para evitar re-renderizado
  const desktopNavItems = useMemo(() => 
    navItemsState.map(item => (
      <NavItemComponent
        key={item.name}
        item={item}
        closeDropdowns={closeDropdowns}
      />
    ))
  , [navItemsState]);

  // Memoizar los ítems de navegación móvil
  const mobileNavItems = useMemo(() => 
    navItemsState.map(item => (
      <MobileNavItem
        key={item.name}
        item={item}
        setMenuOpen={setMenuOpen}
      />
    ))
  , [navItemsState]);

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
            to={absoluteUrl("/")} 
            className="flex items-center group" 
            onClick={() => {
              closeDropdowns();
              window.scrollTo({
                top: 0,
                behavior: "instant"
              });
            }}
          >
            {/* Logo Area */}
            <div className="w-48 h-12 flex items-center mr-4">
              <img 
                src={logoImage}  
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
                      {mobileNavItems}
                      
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <AuthSection
                          user={user}
                          loading={loading}
                          signOut={signOut}
                          isMobile={isMobile}
                          setMenuOpen={setMenuOpen}
                        />
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
              {desktopNavItems}
              
              <div className="ml-4 flex items-center space-x-2">
                <AuthSection
                  user={user}
                  loading={loading}
                  signOut={signOut}
                  isMobile={isMobile}
                  setMenuOpen={setMenuOpen}
                />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
});