
import { useEffect, useState } from "react";
import { jellyfinService } from "@/services/jellyfinService";
import { JellyfinMediaItem } from "@/types/jellyfin";
import Navbar from "@/components/Navbar";
import MediaGrid from "@/components/MediaGrid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Home = () => {
  const [recentItems, setRecentItems] = useState<JellyfinMediaItem[]>([]);
  const [resumeItems, setResumeItems] = useState<JellyfinMediaItem[]>([]);
  const [moviesItems, setMoviesItems] = useState<JellyfinMediaItem[]>([]);
  const [seriesItems, setSeriesItems] = useState<JellyfinMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("recent");
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Charger les médias récents
        const recent = await jellyfinService.getLatestMedia();
        setRecentItems(recent);
        
        // Charger les médias en cours
        const resume = await jellyfinService.getResumeItems();
        setResumeItems(resume);
        
        // Charger les films récents
        const movies = await jellyfinService.getItems("", {
          limit: 20,
          recursive: true,
          filters: "IsMovie",
          sortBy: "DateCreated",
          sortOrder: "Descending"
        });
        setMoviesItems(movies);
        
        // Charger les séries récentes
        const series = await jellyfinService.getItems("", {
          limit: 20,
          recursive: true,
          filters: "IsSeries",
          sortBy: "DateCreated",
          sortOrder: "Descending"
        });
        setSeriesItems(series);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (jellyfinService.isConnected) {
      loadData();
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-jellyfin-dark">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Accueil</h1>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full max-w-md justify-start mb-6 bg-jellyfin-dark-card">
            <TabsTrigger value="recent">Récents</TabsTrigger>
            <TabsTrigger value="continue">À continuer</TabsTrigger>
            <TabsTrigger value="movies">Films</TabsTrigger>
            <TabsTrigger value="series">Séries</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent">
            <MediaGrid title="Récemment ajoutés" items={recentItems} loading={loading} />
          </TabsContent>
          
          <TabsContent value="continue">
            <MediaGrid title="Continuer à regarder" items={resumeItems} loading={loading} />
          </TabsContent>
          
          <TabsContent value="movies">
            <MediaGrid title="Films" items={moviesItems} loading={loading} />
          </TabsContent>
          
          <TabsContent value="series">
            <MediaGrid title="Séries" items={seriesItems} loading={loading} />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center">
          <Button 
            asChild
            className="bg-jellyfin-primary hover:bg-jellyfin-secondary text-white"
          >
            <a href="/libraries">Explorer toutes les bibliothèques</a>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Home;
