
import { JellyfinMediaItem } from "@/types/jellyfin";
import MediaCard from "./MediaCard";

interface MediaGridProps {
  title: string;
  items: JellyfinMediaItem[];
  loading?: boolean;
}

const MediaGrid = ({ title, items, loading = false }: MediaGridProps) => {
  return (
    <div className="my-6">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-full">
              <div className="w-full h-[280px] bg-jellyfin-dark-card animate-pulse rounded-md"></div>
              <div className="w-3/4 h-4 mt-2 mx-auto bg-jellyfin-dark-card animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <MediaCard key={item.Id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          Aucun média trouvé
        </div>
      )}
    </div>
  );
};

export default MediaGrid;
