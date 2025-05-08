
import { useRef, useEffect, useState } from "react";
import { jellyfinService } from "@/services/jellyfinService";
import { JellyfinMediaItem, PlaybackOptions } from "@/types/jellyfin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";

interface VideoPlayerProps {
  itemId: string;
  onClose: () => void;
}

const VideoPlayer = ({ itemId, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaItem, setMediaItem] = useState<JellyfinMediaItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Options de lecture
  const [playbackOptions, setPlaybackOptions] = useState<PlaybackOptions>({
    enableTranscoding: true,
    maxStreamingBitrate: 8000000, // 8 Mbps
    maxWidth: window.innerWidth,
    maxHeight: window.innerHeight
  });

  // Générer l'URL de streaming
  const streamUrl = jellyfinService.getStreamUrl(itemId, playbackOptions);
  
  useEffect(() => {
    const fetchMediaDetails = async () => {
      try {
        const item = await jellyfinService.getItemDetails(itemId);
        if (item) {
          setMediaItem(item);
          
          // Récupérer la position de lecture si disponible
          if (item.UserData?.PlaybackPositionTicks) {
            setPlaybackOptions(prev => ({
              ...prev,
              startTimeTicks: item.UserData?.PlaybackPositionTicks
            }));
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des détails:", err);
      }
    };
    
    fetchMediaDetails();
  }, [itemId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    // Rechargement de la vidéo quand les options de lecture changent
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [streamUrl]);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setError("Erreur de lecture de la vidéo. Veuillez réessayer ou modifier les paramètres de lecture.");
  };

  const toggleTranscoding = (enabled: boolean) => {
    setPlaybackOptions(prev => ({
      ...prev,
      enableTranscoding: enabled
    }));
  };

  const handleBitrateChange = (value: number[]) => {
    setPlaybackOptions(prev => ({
      ...prev,
      maxStreamingBitrate: value[0] * 1000000 // Conversion en bits par seconde
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full h-full max-h-screen" onClick={(e) => e.stopPropagation()}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-jellyfin-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-jellyfin-dark-card p-6 rounded-md max-w-md text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                className="bg-jellyfin-primary hover:bg-jellyfin-secondary px-4 py-2 rounded-md"
                onClick={onClose}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          autoPlay
          src={streamUrl}
          onCanPlay={handleVideoLoad}
          onError={handleVideoError}
        />
        
        <div className="absolute top-4 right-16 z-10">
          <button
            className="bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
          >
            <Settings size={20} />
          </button>
        </div>

        {showSettings && (
          <div 
            className="absolute top-16 right-4 bg-jellyfin-dark-card p-4 rounded-md shadow-lg z-20 w-72"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Paramètres de lecture</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="transcoding">Transcodage</Label>
                <Switch 
                  id="transcoding"
                  checked={playbackOptions.enableTranscoding} 
                  onCheckedChange={toggleTranscoding}
                />
              </div>

              {playbackOptions.enableTranscoding && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Qualité (Mbps)</Label>
                      <span className="text-sm">
                        {(playbackOptions.maxStreamingBitrate || 0) / 1000000} Mbps
                      </span>
                    </div>
                    <Slider
                      value={[(playbackOptions.maxStreamingBitrate || 8000000) / 1000000]}
                      min={1}
                      max={20}
                      step={1}
                      onValueChange={handleBitrateChange}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        <button
          className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
