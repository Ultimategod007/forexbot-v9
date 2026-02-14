import { useSeries } from "@/hooks/use-series";
import { Layout } from "@/components/Layout";
import { SeriesCard } from "@/components/SeriesCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce"; // We need to create this hook or handle debounce manually
import { Separator } from "@/components/ui/separator";

// Simple debounce hook implementation inline for this file or better in separate file
function useLocalDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  if (value !== debouncedValue && !timeoutId) {
    const id = setTimeout(() => {
        setDebouncedValue(value);
        setTimeoutId(null);
    }, delay);
    setTimeoutId(id);
  }

  return debouncedValue;
}


export default function Browse() {
  const [searchTerm, setSearchTerm] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  
  // In a real app, useDebounce would be a proper hook
  // For now, passing search term directly is fine for small datasets
  // but strictly speaking we should debounce
  
  const { data: series, isLoading } = useSeries({
    search: searchTerm || undefined,
    genre: genre !== "all" ? genre : undefined,
    status: status !== "all" ? status : undefined,
  });

  const genres = ["Action", "Romance", "Fantasy", "Drama", "School", "Sci-Fi", "Horror"];

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl p-6 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Browse Library</h1>
            <p className="text-muted-foreground mt-1">Discover your next favorite story</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-card border border-border rounded-xl p-4 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search titles, authors..." 
                className="pl-10 bg-background border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Status</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="hiatus">Hiatus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : series?.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-secondary/30 inline-flex p-6 rounded-full mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No series found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search term</p>
            <Button 
              variant="link" 
              className="mt-4 text-primary"
              onClick={() => { setSearchTerm(""); setGenre("all"); setStatus("all"); }}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in duration-500">
            {series?.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
