
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { jellyfinService } from "@/services/jellyfinService";
import { JellyfinMediaItem } from "@/types/jellyfin";
import Navbar from "@/components/Navbar";
import MediaGrid from "@/components/MediaGrid";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchResults, setSearchResults] = useState<JellyfinMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState(query);
  
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const results = await jellyfinService.search(query);
        setSearchResults(results.Items || []);
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
      } finally {
        setLoading(false);
      }
    };
    
    setLocalSearch(query);
    performSearch();
  }, [query]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchParams({ q: localSearch });
    }
  };
  
  return (
    <div className="min-h-screen bg-jellyfin-dark">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Recherche</h1>
        
        <form onSubmit={handleSearch} className="mb-8 relative">
          <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Rechercher des films, séries, épisodes..."
            className="pl-10 h-12 bg-jellyfin-dark-card border-jellyfin-dark-hover focus-visible:ring-jellyfin-primary"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </form>
        
        {query ? (
          <MediaGrid
            title={`Résultats pour "${query}"`}
            items={searchResults}
            loading={loading}
          />
        ) : (
          <div className="text-center py-20">
            <SearchIcon size={48} className="mx-auto text-gray-500 mb-4" />
            <h2 className="text-xl font-medium">Saisissez votre recherche ci-dessus</h2>
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;
