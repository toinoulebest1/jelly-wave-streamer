
import { useEffect, useState } from "react";
import { jellyfinService } from "@/services/jellyfinService";
import { JellyfinLibrary } from "@/types/jellyfin";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Library } from "lucide-react";

const Libraries = () => {
  const [libraries, setLibraries] = useState<JellyfinLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadLibraries = async () => {
      setLoading(true);
      try {
        const data = await jellyfinService.getLibraries();
        setLibraries(data);
      } catch (error) {
        console.error("Erreur lors du chargement des bibliothèques:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (jellyfinService.isConnected) {
      loadLibraries();
    }
  }, []);
  
  const getLibraryImage = (library: JellyfinLibrary): string => {
    if (library.ImageTagsPrimary?.Primary) {
      return jellyfinService.getImageUrl(library.Id, library.ImageTagsPrimary.Primary, 'Primary', 400, 225);
    }
    return '/placeholder.svg';
  };
  
  const getLibraryIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'movies':
        return '🎬';
      case 'tvshows':
        return '📺';
      case 'music':
        return '🎵';
      case 'photos':
        return '📷';
      default:
        return '📚';
    }
  };
  
  return (
    <div className="min-h-screen bg-jellyfin-dark">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Bibliothèques</h1>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-jellyfin-dark-card animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : libraries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraries.map((library) => (
              <Link key={library.Id} to={`/library/${library.Id}`}>
                <Card className="overflow-hidden hover:border-jellyfin-primary transition-colors h-full bg-jellyfin-dark-card border-jellyfin-dark-hover">
                  <div className="relative h-48">
                    <img 
                      src={getLibraryImage(library)} 
                      alt={library.Name}
                      className="w-full h-full object-cover brightness-75"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                      <span className="text-4xl mb-2">
                        {getLibraryIcon(library.CollectionType || '')}
                      </span>
                      <h2 className="text-xl font-semibold text-center">
                        {library.Name}
                      </h2>
                      <p className="text-sm text-center opacity-80">
                        {library.CollectionType || 'Collection'}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-jellyfin-dark-card rounded-lg">
            <Library size={48} className="mx-auto text-gray-500 mb-4" />
            <h2 className="text-xl font-medium mb-2">Aucune bibliothèque trouvée</h2>
            <p className="text-gray-400">
              Vérifiez que votre serveur Jellyfin contient des bibliothèques accessibles.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Libraries;
