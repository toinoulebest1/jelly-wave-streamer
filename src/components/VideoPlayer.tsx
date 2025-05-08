
import { useRef, useEffect, useState } from "react";
import { jellyfinService } from "@/services/jellyfinService";
import { JellyfinMediaItem, PlaybackOptions, BitrateTestResult } from "@/types/jellyfin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings, Activity } from "lucide-react";
import { toast } from "sonner";

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
  const [isBitrateTestRunning, setIsBitrateTestRunning] = useState(true);
  const [detectedBitrate, setDetectedBitrate] = useState<number | null>(null);
  
  // Options de lecture
  const [playbackOptions, setPlaybackOptions] = useState<PlaybackOptions>({
    enableTranscoding: true,
    maxStreamingBitrate: 8000000, // 8 Mbps
    maxWidth: window.innerWidth,
    maxHeight: window.innerHeight
  });

  // Effectuer le test de débit au chargement
  useEffect(() => {
    const runBitrateTest = async () => {
      setIsBitrateTestRunning(true);
      try {
        // Effectuer des tests de débit avec différentes tailles
        const sizes = [500000, 1000000, 3000000];
        const results: BitrateTestResult[] = [];

        for (const size of sizes) {
          // Test avec cette taille
          const result = await jellyfinService.testBitrate(size);
          console.log(`BitrateTest ${result.bitrate} bps for size ${size}`);
          results.push(result);
          
          // Si le test est complet, on peut déjà utiliser cette valeur
          if (result.isComplete) {
            setDetectedBitrate(result.bitrate);
            // Ajuster automatiquement le bitrate de streaming
            setPlaybackOptions(prev => ({
              ...prev,
              maxStreamingBitrate: Math.min(result.bitrate, 100000000) // Limiter à 100 Mbps maximum
            }));
            break;
          }
        }

        // Si on arrive ici avec des résultats, on utilise la moyenne des tests réussis
        if (results.length > 0 && !detectedBitrate) {
          const avgBitrate = results.reduce((sum, r) => sum + r.bitrate, 0) / results.length;
          setDetectedBitrate(avgBitrate);
          setPlaybackOptions(prev => ({
            ...prev,
            maxStreamingBitrate: Math.min(avgBitrate, 100000000) // Limiter à 100 Mbps maximum
          }));
        }
        
        toast.success(`Débit détecté: ${formatBitrate(detectedBitrate || 8000000)}`);
      } catch (err) {
        console.error("Erreur lors du test de débit:", err);
        toast.error("Impossible de tester le débit. Utilisation du débit par défaut.");
      } finally {
        setIsBitrateTestRunning(false);
      }
    };
    
    runBitrateTest();
  }, []);

  // Générer l'URL de streaming
  const streamUrl = mediaItem ? jellyfinService.getStreamUrl(itemId, playbackOptions) : '';
  
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
    if (videoRef.current && !isBitrateTestRunning && mediaItem) {
      videoRef.current.load();
    }
  }, [streamUrl, isBitrateTestRunning, mediaItem]);

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
  
  const formatBitrate = (bitrate: number): string => {
    if (bitrate >= 1000000) {
      return `${(bitrate / 1000000).toFixed(2)} Mbps`;
    } else {
      return `${(bitrate / 1000).toFixed(0)} Kbps`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full h-full max-h-screen" onClick={(e) => e.stopPropagation()}>
        {(isLoading || isBitrateTestRunning) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-jellyfin-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            {isBitrateTestRunning && (
              <div className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <Activity size={18} className="mr-2 text-jellyfin-primary animate-pulse" />
                  <span className="text-white">Test de débit en cours...</span>
                </div>
                {detectedBitrate && (
                  <span className="text-sm text-gray-300">
                    Débit détecté: {formatBitrate(detectedBitrate)}
                  </span>
                )}
              </div>
            )}
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
        
        {!isBitrateTestRunning && mediaItem && (
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            autoPlay
            src={streamUrl}
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
          />
        )}
        
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
                        {formatBitrate(playbackOptions.maxStreamingBitrate || 8000000)}
                      </span>
                    </div>
                    <Slider
                      value={[(playbackOptions.maxStreamingBitrate || 8000000) / 1000000]}
                      min={1}
                      max={100}
                      step={1}
                      onValueChange={handleBitrateChange}
                    />
                  </div>
                </>
              )}
              
              {detectedBitrate && (
                <div className="mt-2 pt-2 border-t border-gray-700 text-sm">
                  <div className="flex items-center">
                    <Activity size={16} className="mr-2 text-jellyfin-primary" />
                    <span>Débit détecté: {formatBitrate(detectedBitrate)}</span>
                  </div>
                </div>
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
