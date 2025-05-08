
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jellyfinService } from "@/services/jellyfinService";
import { JellyfinMediaItem } from "@/types/jellyfin";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VideoPlayer from "@/components/VideoPlayer";
import { Play, Calendar, Clock, Star } from "lucide-react";

const MediaDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<JellyfinMediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  
  useEffect(() => {
    const loadMediaDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const mediaItem = await jellyfinService.getItemDetails(id);
        setItem(mediaItem);
      } catch (error) {
        console.error("Erreur lors du chargement des détails:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (jellyfinService.isConnected && id) {
      loadMediaDetails();
    }
  }, [id]);
  
  const getBackdropUrl = () => {
    if (item?.BackdropImageTags && item.BackdropImageTags.length > 0) {
      return jellyfinService.getBackdropUrl(item.Id, item.BackdropImageTags[0], 1920);
    }
    if (item?.ImageTags?.Primary) {
      return jellyfinService.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary', 1920);
    }
    return '';
  };
  
  const getPosterUrl = () => {
    if (item?.ImageTags?.Primary) {
      return jellyfinService.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary', 300, 450);
    }
    return '/placeholder.svg';
  };
  
  const getRuntime = () => {
    if (item?.RunTimeTicks) {
      return jellyfinService.formatRuntime(item.RunTimeTicks);
    }
    return 'N/A';
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-jellyfin-dark">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
          <div className="w-16 h-16 border-4 border-jellyfin-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!item) {
    return (
      <div className="min-h-screen bg-jellyfin-dark">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Média non trouvé</h1>
          <p className="text-gray-400">Le média demandé n'existe pas ou vous n'avez pas les permissions nécessaires.</p>
          <Button asChild className="mt-6 bg-jellyfin-primary hover:bg-jellyfin-secondary">
            <a href="/">Retour à l'accueil</a>
          </Button>
        </div>
      </div>
    );
  }
  
  const backdropUrl = getBackdropUrl();
  
  return (
    <div className="min-h-screen bg-jellyfin-dark">
      <Navbar />
      
      {backdropUrl && (
        <div className="absolute top-0 left-0 w-full h-[500px] -z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-jellyfin-dark to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-jellyfin-dark/80 to-transparent"></div>
          <img
            src={backdropUrl}
            alt={item.Name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 pt-20 pb-10 relative z-0">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 lg:w-1/4 mb-6 md:mb-0">
            <img
              src={getPosterUrl()}
              alt={item.Name}
              className="w-full max-w-[300px] mx-auto md:mx-0 rounded-lg shadow-xl"
            />
          </div>
          
          <div className="w-full md:w-2/3 lg:w-3/4 md:pl-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{item.Name}</h1>
            
            {item.SeriesName && (
              <h2 className="text-xl mb-4 text-gray-300">{item.SeriesName}</h2>
            )}
            
            <div className="flex flex-wrap items-center mb-6 gap-2 text-sm text-gray-300">
              {item.ProductionYear && (
                <div className="flex items-center mr-4">
                  <Calendar size={16} className="mr-1" />
                  <span>{item.ProductionYear}</span>
                </div>
              )}
              
              <div className="flex items-center mr-4">
                <Clock size={16} className="mr-1" />
                <span>{getRuntime()}</span>
              </div>
              
              {item.CommunityRating && (
                <div className="flex items-center">
                  <Star size={16} className="mr-1 text-yellow-500" />
                  <span>{item.CommunityRating.toFixed(1)}</span>
                </div>
              )}
              
              {item.OfficialRating && (
                <Badge variant="outline" className="ml-2">
                  {item.OfficialRating}
                </Badge>
              )}
            </div>
            
            {item.Genres && item.Genres.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {item.Genres.map((genre, index) => (
                    <Badge key={index} variant="secondary" className="bg-jellyfin-primary/20">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {item.Overview && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
                <p className="text-gray-300 leading-relaxed">{item.Overview}</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3">
              <Button 
                size="lg"
                className="bg-jellyfin-primary hover:bg-jellyfin-secondary"
                onClick={() => setShowPlayer(true)}
              >
                <Play size={18} className="mr-2" />
                Lire
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {showPlayer && id && (
        <VideoPlayer itemId={id} onClose={() => setShowPlayer(false)} />
      )}
    </div>
  );
};

export default MediaDetails;
