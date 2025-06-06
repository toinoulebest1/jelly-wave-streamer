
import { useRef, useEffect, useState } from "react";
import { jellyfinService } from "@/services/jellyfinService";
import { JellyfinMediaItem, PlaybackOptions, BitrateTestResult, VideoPlayerProps } from "@/types/jellyfin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings, Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import Video.js
import videojs from "video.js";
import "video.js/dist/video-js.css";

const VideoPlayer = ({ itemId, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaItem, setMediaItem] = useState<JellyfinMediaItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isBitrateTestRunning, setIsBitrateTestRunning] = useState(true);
  const [detectedBitrate, setDetectedBitrate] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [playerType, setPlayerType] = useState<'native' | 'videojs'>('videojs');
  
  // Options de lecture
  const [playbackOptions, setPlaybackOptions] = useState<PlaybackOptions>({
    enableTranscoding: true,
    maxStreamingBitrate: 8000000, // 8 Mbps par défaut
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

  // Récupérer les détails du média
  useEffect(() => {
    const fetchMediaDetails = async () => {
      try {
        const item = await jellyfinService.getItemDetails(itemId);
        console.log("Media item details:", item);
        
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
        setError("Impossible de charger les détails du média.");
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

  // Générer l'URL de streaming basée sur les options actuelles
  const streamUrl = mediaItem ? jellyfinService.getStreamUrl(itemId, playbackOptions) : '';

  // Cleanup function to dispose of videojs player
  const cleanupVideoJs = () => {
    if (player) {
      player.dispose();
      setPlayer(null);
    }
  };

  // Initialize Video.js when needed
  useEffect(() => {
    // Only initialize if we're using videojs player type
    if (playerType !== 'videojs' || !streamUrl || isBitrateTestRunning || !mediaItem || !playerContainerRef.current) {
      return;
    }
    
    // Clean up any previous instances before creating a new one
    cleanupVideoJs();
    
    setIsLoading(true);
    setError(null);

    try {
      // Clear the container first
      const containerEl = playerContainerRef.current;
      containerEl.innerHTML = '';
      
      // Create a video element for Video.js
      const videoElement = document.createElement('video');
      videoElement.className = 'video-js vjs-big-play-centered vjs-fluid';
      containerEl.appendChild(videoElement);
      
      // Get poster image if available
      const poster = mediaItem?.ImageTags?.Primary 
        ? jellyfinService.getImageUrl(mediaItem.Id, mediaItem.ImageTags.Primary) 
        : undefined;
        
      // Configure Video.js options
      const videoJsOptions = {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        poster: poster,
        sources: [{
          src: streamUrl,
          type: playbackOptions.enableTranscoding ? 'application/x-mpegURL' : 'video/mp4'
        }]
      };

      console.log("Initializing Video.js with URL:", streamUrl);
      
      // Initialize Video.js with the newly created element
      const vjsPlayer = videojs(videoElement, videoJsOptions, function onPlayerReady() {
        console.log('Video.js player is ready');
        setIsLoading(false);
        
        // Add error handler
        vjsPlayer.on('error', function() {
          const error = vjsPlayer.error();
          console.error("Video.js error:", error);
          handleVideoError();
        });
      });
      
      setPlayer(vjsPlayer);
    } catch (error) {
      console.error("Error initializing Video.js:", error);
      setError("Erreur lors de l'initialisation du lecteur vidéo.");
      setIsLoading(false);
    }

    // Cleanup on unmount or when dependencies change
    return cleanupVideoJs;
  }, [streamUrl, isBitrateTestRunning, mediaItem, playerType, playbackOptions.enableTranscoding]);

  // Effect for native player
  useEffect(() => {
    // Display streaming URL for debugging
    if (streamUrl) {
      console.log("Playing URL:", streamUrl);
    }
    
    // Reload video when playback options change (for native player)
    if (videoRef.current && !isBitrateTestRunning && mediaItem && playerType === 'native') {
      setIsLoading(true);
      setError(null);
      videoRef.current.load();
    }
  }, [streamUrl, isBitrateTestRunning, mediaItem, playerType]);

  const handleVideoLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleVideoError = () => {
    console.error("Erreur de lecture vidéo");
    setIsLoading(false);
    setError("Erreur de lecture de la vidéo. Veuillez réessayer ou modifier les paramètres de lecture.");
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    
    // Toggle transcoding if we've tried a few times
    if (retryCount >= 2) {
      setPlaybackOptions(prev => ({
        ...prev,
        enableTranscoding: !prev.enableTranscoding
      }));
    } else {
      // Réduire le bitrate de moitié si on échoue
      setPlaybackOptions(prev => ({
        ...prev,
        maxStreamingBitrate: Math.max(prev.maxStreamingBitrate / 2, 1000000) // Minimum 1 Mbps
      }));
    }
    
    // Handle player restart based on type
    if (playerType === 'videojs') {
      cleanupVideoJs();
    } else if (playerType === 'native' && videoRef.current) {
      // Forcer le rechargement de la vidéo
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 500);
    }
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

  const handleSwitchPlayer = (type: 'native' | 'videojs') => {
    if (type === playerType) return; // No change needed
    
    setPlayerType(type);
    setError(null);
    setIsLoading(true);
    
    // If switching from videojs, clean it up
    if (type === 'native' && player) {
      cleanupVideoJs();
    }
    
    toast.info(`Lecteur ${type === 'native' ? 'natif' : 'Video.js'} activé`);
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
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="flex flex-col space-y-4">
                <button 
                  className="flex items-center justify-center bg-jellyfin-primary hover:bg-jellyfin-secondary px-4 py-2 rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry();
                  }}
                >
                  <RefreshCw size={18} className="mr-2" />
                  Réessayer
                </button>
                
                <button 
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md"
                  onClick={onClose}
                >
                  Fermer
                </button>
              </div>
              
              {retryCount > 0 && (
                <div className="mt-4 text-sm text-gray-400">
                  {playbackOptions.enableTranscoding 
                    ? `Transcodage activé à ${formatBitrate(playbackOptions.maxStreamingBitrate)}`
                    : "Transcodage désactivé - Lecture directe"}
                </div>
              )}
            </div>
          </div>
        )}
        
        {!isBitrateTestRunning && mediaItem && !error && playerType === 'native' && (
          <video
            key={`${itemId}-${playerType}-${playbackOptions.enableTranscoding}-${playbackOptions.maxStreamingBitrate}`}
            ref={videoRef}
            className="w-full h-full"
            controls
            autoPlay
            poster={mediaItem?.ImageTags?.Primary ? jellyfinService.getImageUrl(mediaItem.Id, mediaItem.ImageTags.Primary) : undefined}
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
          >
            <source src={streamUrl} type={playbackOptions.enableTranscoding ? "application/x-mpegURL" : "video/mp4"} />
            Votre navigateur ne prend pas en charge la lecture de vidéos.
          </video>
        )}
        
        {!isBitrateTestRunning && mediaItem && !error && playerType === 'videojs' && (
          <div className="w-full h-full">
            <div ref={playerContainerRef} className="video-container h-full"></div>
          </div>
        )}
        
        <div className="absolute top-4 right-16 z-10 flex space-x-2">
          <div className="bg-black/60 hover:bg-black/80 text-white rounded-full p-2">
            <Select
              value={playerType}
              onValueChange={(value) => handleSwitchPlayer(value as 'native' | 'videojs')}
            >
              <SelectTrigger className="w-[120px] bg-transparent border-none">
                <SelectValue placeholder="Lecteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="native">Natif</SelectItem>
                <SelectItem value="videojs">Video.js</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
