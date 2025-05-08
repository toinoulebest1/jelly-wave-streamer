
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jellyfinService } from "@/services/jellyfinService";
import { JellyfinLibrary, JellyfinMediaItem } from "@/types/jellyfin";
import Navbar from "@/components/Navbar";
import MediaGrid from "@/components/MediaGrid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LibraryContent = () => {
  const { id } = useParams<{ id: string }>();
  const [library, setLibrary] = useState<JellyfinLibrary | null>(null);
  const [items, setItems] = useState<JellyfinMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("SortName");
  const [sortOrder, setSortOrder] = useState<"Ascending" | "Descending">("Ascending");
  
  useEffect(() => {
    const loadLibraryDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Charger les détails de la bibliothèque
        const libraryDetail = await jellyfinService.getItemDetails(id);
        if (libraryDetail) {
          setLibrary(libraryDetail as JellyfinLibrary);
        }
        
        // Charger les éléments de la bibliothèque
        const libraryItems = await jellyfinService.getItems(id, {
          sortBy,
          sortOrder,
          recursive: true
        });
        setItems(libraryItems);
      } catch (error) {
        console.error("Erreur lors du chargement de la bibliothèque:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (jellyfinService.isConnected && id) {
      loadLibraryDetails();
    }
  }, [id, sortBy, sortOrder]);
  
  return (
    <div className="min-h-screen bg-jellyfin-dark">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{library?.Name || "Bibliothèque"}</h1>
          
          <div className="flex mt-4 md:mt-0 space-x-2">
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[180px] bg-jellyfin-dark-card">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SortName">Nom</SelectItem>
                <SelectItem value="DateCreated">Date d'ajout</SelectItem>
                <SelectItem value="PremiereDate">Date de sortie</SelectItem>
                <SelectItem value="ProductionYear">Année</SelectItem>
                <SelectItem value="Random">Aléatoire</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as "Ascending" | "Descending")}
            >
              <SelectTrigger className="w-[180px] bg-jellyfin-dark-card">
                <SelectValue placeholder="Ordre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ascending">Croissant</SelectItem>
                <SelectItem value="Descending">Décroissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <MediaGrid 
          title="" 
          items={items} 
          loading={loading} 
        />
      </main>
    </div>
  );
};

export default LibraryContent;
