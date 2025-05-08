
import { useRef, useEffect, useState } from "react";
import { jellyfinService } from "@/services/jellyfinService";

interface VideoPlayerProps {
  itemId: string;
  onClose: () => void;
}

const VideoPlayer = ({ itemId, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const streamUrl = jellyfinService.getStreamUrl(itemId);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setError("Erreur de lecture de la vidéo. Veuillez réessayer.");
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
