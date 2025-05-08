
import { JellyfinMediaItem } from "@/types/jellyfin";
import { jellyfinService } from "@/services/jellyfinService";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface MediaCardProps {
  item: JellyfinMediaItem;
  width?: number;
  height?: number;
}

const MediaCard = ({ item, width = 200, height = 300 }: MediaCardProps) => {
  const imageUrl = item.ImageTags?.Primary 
    ? jellyfinService.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary', width, height) 
    : '/placeholder.svg';

  const calculateProgress = (item: JellyfinMediaItem) => {
    const userData = item.UserData;
    if (!userData || !userData.PlayedPercentage) return 0;
    return userData.PlayedPercentage;
  };
  
  const progress = calculateProgress(item);

  return (
    <Link to={`/media/${item.Id}`}>
      <Card className="media-card overflow-hidden border-0 bg-transparent transition-transform">
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={item.Name} 
            className="w-full h-[280px] object-cover rounded-md"
            loading="lazy"
            width={width}
            height={height}
          />
          
          {progress > 0 && progress < 100 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div 
                className="h-full bg-jellyfin-primary" 
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {item.UserData?.Played && (
            <div className="absolute top-2 right-2 bg-jellyfin-primary text-white text-xs px-2 py-1 rounded-full">
              Vu
            </div>
          )}
        </div>
        
        <CardContent className="p-2 text-center">
          <h3 className="font-medium truncate text-sm">{item.Name}</h3>
          {item.ProductionYear && (
            <p className="text-xs text-gray-400">{item.ProductionYear}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default MediaCard;
