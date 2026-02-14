import { Link } from "wouter";
import { type Series } from "@shared/schema";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface SeriesCardProps {
  series: Series;
  aspectRatio?: number;
  featured?: boolean;
}

export function SeriesCard({ series, aspectRatio = 2/3, featured = false }: SeriesCardProps) {
  return (
    <Link href={`/series/${series.id}`}>
      <div className="group relative cursor-pointer card-hover rounded-xl overflow-hidden bg-secondary border border-border/50">
        <AspectRatio ratio={aspectRatio}>
          <div className="absolute inset-0 bg-muted animate-pulse" /> {/* Placeholder */}
          <img
            src={series.coverImage}
            alt={series.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          
          {/* Content */}
          <div className="absolute inset-0 p-4 flex flex-col justify-end">
            <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex gap-2 mb-2 flex-wrap">
                {series.genres?.slice(0, 2).map((genre) => (
                  <span key={genre} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                    {genre}
                  </span>
                ))}
              </div>
              <h3 className={cn(
                "font-display font-bold text-white leading-tight mb-1 drop-shadow-md",
                featured ? "text-2xl" : "text-lg"
              )}>
                {series.title}
              </h3>
              <p className="text-white/70 text-sm line-clamp-1 mb-3">{series.author}</p>
              
              <div className="h-0 group-hover:h-auto overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button className="flex items-center gap-2 text-xs font-bold text-white bg-primary/90 hover:bg-primary px-3 py-2 rounded-full w-fit backdrop-blur-sm transition-colors">
                  <Play className="w-3 h-3 fill-current" />
                  READ NOW
                </button>
              </div>
            </div>
          </div>
        </AspectRatio>
      </div>
    </Link>
  );
}
