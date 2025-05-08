
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { jellyfinService } from "@/services/jellyfinService";
import { Search, Home, Library, LogOut } from "lucide-react";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    jellyfinService.disconnect();
    navigate("/");
    window.location.reload(); // Recharger la page pour réinitialiser l'état
  };

  return (
    <nav className="sticky top-0 z-10 bg-jellyfin-dark/80 backdrop-blur-sm border-b border-jellyfin-dark-card">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-jellyfin-primary">Jellyfin</span>
            <span className="text-xl font-medium">Streamer</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-1 text-sm hover:text-jellyfin-primary transition-colors">
              <Home size={16} />
              <span>Accueil</span>
            </Link>
            <Link to="/libraries" className="flex items-center space-x-1 text-sm hover:text-jellyfin-primary transition-colors">
              <Library size={16} />
              <span>Bibliothèques</span>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="w-full sm:w-[200px] md:w-[300px] pl-9 h-9 bg-jellyfin-dark-card border-jellyfin-dark-hover focus-visible:ring-jellyfin-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            title="Déconnexion"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
