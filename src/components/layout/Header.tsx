
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-roverpass-purple">RoverPass</span>
          </Link>
        </div>

        {isMobile ? (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden"
            >
              <Menu className="h-6 w-6" />
            </Button>
            {menuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg p-4 md:hidden">
                <div className="flex flex-col space-y-4">
                  <Link 
                    to="/" 
                    className="hover:text-roverpass-purple"
                    onClick={() => setMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/listings" 
                    className="hover:text-roverpass-purple"
                    onClick={() => setMenuOpen(false)}
                  >
                    RV Parks For Sale
                  </Link>
                  <a 
                    href="https://roverpass.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-roverpass-purple"
                    onClick={() => setMenuOpen(false)}
                  >
                    Reservation System
                  </a>
                  <Link 
                    to="/broker/dashboard" 
                    className="hover:text-roverpass-purple"
                    onClick={() => setMenuOpen(false)}
                  >
                    Broker Dashboard
                  </Link>
                  <Link to="/listings/new">
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => setMenuOpen(false)}
                    >
                      List Your Property
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-roverpass-purple">Home</Link>
            <Link to="/listings" className="hover:text-roverpass-purple">RV Parks For Sale</Link>
            <a href="https://roverpass.com" target="_blank" rel="noopener noreferrer" className="hover:text-roverpass-purple">
              Reservation System
            </a>
            <Link to="/broker/dashboard" className="hover:text-roverpass-purple">Broker Dashboard</Link>
            <Link to="/listings/new">
              <Button variant="default">List Your Property</Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};
