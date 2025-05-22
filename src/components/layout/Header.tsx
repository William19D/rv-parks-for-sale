import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Menu, 
  X, 
  ChevronDown, 
  Search,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export const Header = () => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

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

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  // Navigation items simplificados según la imagen
  const navItems = [
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
    {
      name: "Broker Dashboard",
      path: "/broker/dashboard",
      dropdown: null,
    }
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 ease-in-out",
        scrolled 
          ? "bg-white shadow-md py-2" 
          : "bg-white/95 backdrop-blur-sm py-4 border-b border-gray-200"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center group" onClick={closeDropdowns}>
            {/* Logo espacio */}
            <div className="w-48 h-12 flex items-center mr-4">
              {/* Puedes reemplazar este div con tu imagen de logo real */}
              <span className="text-2xl font-bold text-[#f74f4f] group-hover:opacity-80 transition-colors duration-300">
                RoverPass
              </span>
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
                      {navItems.map((item) => (
                        <div key={item.name}>
                          <Link
                            to={item.path}
                            className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100 group"
                            onClick={() => setMenuOpen(false)}
                          >
                            <span className="text-gray-700 group-hover:text-[#f74f4f] transition-colors">{item.name}</span>
                          </Link>
                        </div>
                      ))}
                      
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <Link to="/listings/new" onClick={() => setMenuOpen(false)}>
                          <Button 
                            variant="default" 
                            className="w-full bg-[#f74f4f] hover:bg-[#e43c3c] hover:shadow-md transition-all"
                          >
                            List Your Property
                          </Button>
                        </Link>
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
              {navItems.map((item) => (
                <div key={item.name} className="relative group">
                  <Link
                    to={item.path}
                    className="px-2 py-2 text-sm font-medium text-gray-700 hover:text-[#f74f4f] transition-colors"
                    onClick={closeDropdowns}
                  >
                    {item.name}
                  </Link>
                  {/* Animación de subrayado al hover */}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#f74f4f] group-hover:w-full transition-all duration-300"></span>
                </div>
              ))}
              
              <div className="ml-2">
                <Link to="/listings/new">
                  <Button 
                    variant="default"
                    className="bg-[#f74f4f] hover:bg-[#e43c3c] hover:shadow-md transition-all rounded-md"
                  >
                    List Your Property
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};