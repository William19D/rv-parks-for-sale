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
  LifeBuoy,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Importar el logo directamente usando el alias @
import logoImage from "@/assets/logo.svg";

// Define the base path for the app
const PATH_PREFIX = "/rv-parks-for-sale";

// Force trailing slash on every page load
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  // Check if we're at the base URL without trailing slash
  if (path === PATH_PREFIX) {
    window.location.replace(path + '/' + window.location.search + window.location.hash);
  }
});

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

// Ensure paths have trailing slashes
const ensureTrailingSlash = (path: string): string => {
  if (path === '/') return '/';
  return path.endsWith('/') ? path : `${path}/`;
};

// Función para determinar si una ruta está activa
const isRouteActive = (item: NavItem, pathname: string): boolean => {
  // Normalize both paths to have trailing slashes for comparison
  const normalizedPath = ensureTrailingSlash(item.path);
  const normalizedPathname = ensureTrailingSlash(pathname);
  
  // Si es una ruta exacta, solo debe coincidir perfectamente
  if (item.exact) {
    return normalizedPathname === normalizedPath;
  }
  
  // Verificar si el path actual está en las rutas excluidas
  if (item.exclude && item.exclude.some(route => {
    const normalizedExclude = ensureTrailingSlash(route);
    return normalizedPathname === normalizedExclude || normalizedPathname.startsWith(normalizedExclude);
  })) {
    return false;
  }
  
  // Para rutas no exactas, verificar si coincide exactamente o si es una subruta
  return normalizedPathname === normalizedPath || 
         (normalizedPath !== '/' && normalizedPathname.startsWith(normalizedPath));
};

// Componente memoizado para cada elemento de navegación
const NavItemComponent = memo(({ item, closeDropdowns }: { 
  item: NavItem, 
  closeDropdowns: () => void 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = isRouteActive(item, location.pathname);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default navigation behavior
    closeDropdowns();
    
    // Add trailing slash to the path if it doesn't have one, except for root
    const targetPath = item.path === '/' ? '/' : ensureTrailingSlash(item.path);
    
    // Navigate with trailing slash
    navigate(targetPath);
    
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
  };

  return (
    <div className="relative group">
      <a
        href={item.path === '/' ? '/' : ensureTrailingSlash(item.path)}
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
      </a>
    </div>
  );
});

// Componente memoizado para el menú móvil
const MobileNavItem = memo(({ item, setMenuOpen }: { 
  item: NavItem, 
  setMenuOpen: (isOpen: boolean) => void 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = isRouteActive(item, location.pathname);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default navigation
    setMenuOpen(false);
    
    // Add trailing slash to path if needed
    const targetPath = item.path === '/' ? '/' : ensureTrailingSlash(item.path);
    
    // Navigate with proper trailing slash
    navigate(targetPath);
    
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
  };

  return (
    <div>
      <a
        href={item.path === '/' ? '/' : ensureTrailingSlash(item.path)}
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
      </a>
    </div>
  );
});

// Componente para la sección de autenticación (memoizado)
const AuthSection = memo(({ user, status, signOut, isMobile, setMenuOpen }: {
  user: any;
  status: string;
  signOut: () => Promise<void>;
  isMobile: boolean;
  setMenuOpen: (isOpen: boolean) => void;
}) => {
  const navigate = useNavigate();
  
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
  
  const handleNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    // Ensure trailing slash
    const targetPath = path === '/' ? '/' : ensureTrailingSlash(path);
    navigate(targetPath);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const goToProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/profile/');
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const goToSupport = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/support/');
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  if (status === 'loading') {
    return <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>;
  }
  
  if (user) {
    return (
      <>
        {/* Contenido para usuario autenticado */}
        {isMobile ? (
          <div className="space-y-2">
            <div 
              className="text-sm px-3 py-2 flex items-center space-x-2 rounded-md hover:bg-gray-100 cursor-pointer"
              onClick={goToProfile}
            >
              <User className="h-4 w-4 text-[#f74f4f]" />
              <span>Hello, <span className="font-medium">{userName || user.email?.split('@')[0]}</span></span>
            </div>
            <a 
              href="/profile/" 
              onClick={(e) => handleNavigation(e, "/profile")}
              className="block px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
            >
              View Profile
            </a>
            <a 
              href="/support/" 
              onClick={goToSupport}
              className="block px-3 py-2 text-sm hover:bg-gray-100 rounded-md flex items-center"
            >
              <LifeBuoy className="h-4 w-4 mr-2 text-[#f74f4f]" />
              Get Support
            </a>
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
            <Button 
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-[#f74f4f] flex items-center gap-1"
              onClick={goToSupport}
            >
              <LifeBuoy className="h-4 w-4" />
              <span className="sr-only md:not-sr-only">Support</span>
            </Button>
            <div 
              className="flex items-center bg-gray-100 rounded-full p-2 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={goToProfile}
            >
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
            <a 
              href="/login/" 
              onClick={(e) => handleNavigation(e, "/login")}
            >
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </a>
            <a 
              href="/register/" 
              onClick={(e) => handleNavigation(e, "/register")}
            >
              <Button className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]">
                Register
              </Button>
            </a>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <a 
              href="/login/" 
              onClick={(e) => handleNavigation(e, "/login")}
            >
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </a>
            <a 
              href="/register/" 
              onClick={(e) => handleNavigation(e, "/register")}
            >
              <Button 
                size="sm"
                className="bg-[#f74f4f] hover:bg-[#e43c3c]"
              >
                Register
              </Button>
            </a>
          </div>
        )}
      </>
    );
  }
});

// Componente Header memoizado para prevenir re-renderizados innecesarios
export const Header = memo(() => {
  const isMobile = useIsMobile();
  const { user, signOut, status } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Force URL check on every page render
  useEffect(() => {
    // Check current URL for trailing slash
    const path = window.location.pathname;
    if (path === PATH_PREFIX) {
      console.log('[Header] Missing trailing slash detected, redirecting...');
      window.location.replace(path + '/' + window.location.search + window.location.hash);
    }
  }, []);
  
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

  // Handle logo click with explicit trailing slash navigation
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // When clicking the logo, we need to navigate to the home page with trailing slash
    // For the root path in React Router + basename, we need to handle this specially
    closeDropdowns();
    
    // Use navigate('/') to go to the root within the basename
    navigate('/');
    
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
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
          <a 
            href="/"
            className="flex items-center group" 
            onClick={handleLogoClick}
          >
            {/* Logo Area */}
            <div className="w-48 h-12 flex items-center mr-4">
              <img 
                src={logoImage} 
                alt="RoverPass Logo" 
                className="w-full h-full object-contain group-hover:opacity-80 transition-opacity duration-300" 
              />
            </div>
          </a>
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
                          status={status}
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
                  status={status}
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