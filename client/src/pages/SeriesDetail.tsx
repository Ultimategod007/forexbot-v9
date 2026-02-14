import { useRoute, Link } from "wouter";
import { useSeriesDetail } from "@/hooks/use-series";
import { useChapters } from "@/hooks/use-chapters";
import { useSeriesProgress } from "@/hooks/use-progress";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Share2, Heart, List, Clock, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

export default function SeriesDetail() {
  const [, params] = useRoute("/series/:id");
  const id = parseInt(params?.id || "0");
  
  const { data: series, isLoading: isSeriesLoading } = useSeriesDetail(id);
  const { data: chapters, isLoading: isChaptersLoading } = useChapters(id);
  const { data: progress } = useSeriesProgress(id);

  if (isSeriesLoading) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto p-6 space-y-8">
           <div className="flex gap-8">
             <Skeleton className="w-[300px] h-[450px] rounded-xl" />
             <div className="flex-1 space-y-4">
               <Skeleton className="h-12 w-3/4" />
               <Skeleton className="h-6 w-1/4" />
               <Skeleton className="h-32 w-full" />
             </div>
           </div>
        </div>
      </Layout>
    );
  }

  if (!series) return <Layout><div className="p-20 text-center">Series not found</div></Layout>;

  // Sort chapters by number descending
  const sortedChapters = [...(chapters || [])].sort((a, b) => b.chapterNumber - a.chapterNumber);
  const firstChapter = sortedChapters[sortedChapters.length - 1];
  const nextChapterToRead = progress 
    ? sortedChapters.find(c => c.id === progress.lastReadChapterId) || firstChapter
    : firstChapter;

  return (
    <Layout>
      {/* Hero Header */}
      <div className="relative">
        {/* Background Blur */}
        <div className="absolute inset-0 h-[400px] overflow-hidden -z-10">
          <img src={series.coverImage} className="w-full h-full object-cover blur-3xl opacity-20" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        </div>

        <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            {/* Cover Image */}
            <div className="w-full md:w-[300px] flex-shrink-0 mx-auto md:mx-0">
              <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-primary/10 border border-white/10 relative group">
                <img 
                  src={series.coverImage} 
                  alt={series.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col pt-2">
              <div className="flex flex-wrap gap-2 mb-4">
                {series.genres?.map(g => (
                  <Badge key={g} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                    {g}
                  </Badge>
                ))}
                <Badge variant="outline" className={series.status === 'ongoing' ? 'text-green-400 border-green-400/30' : 'text-blue-400 border-blue-400/30'}>
                  {series.status}
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 leading-tight">
                {series.title}
              </h1>
              <div className="flex items-center gap-2 text-lg text-muted-foreground mb-6">
                <UserIcon className="w-4 h-4" />
                <span>{series.author}</span>
              </div>

              <p className="text-base text-gray-300 leading-relaxed mb-8 max-w-3xl">
                {series.description}
              </p>

              <div className="flex flex-wrap gap-4 mt-auto">
                {nextChapterToRead ? (
                   <Link href={`/read/${nextChapterToRead.id}`}>
                    <Button size="lg" className="h-12 px-8 rounded-full text-base font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                      <BookOpen className="w-5 h-5 mr-2" />
                      {progress ? `Continue Chapter ${nextChapterToRead.chapterNumber}` : "Start Reading"}
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" disabled className="h-12 px-8 rounded-full">No Chapters Yet</Button>
                )}
                
                <Button size="lg" variant="outline" className="h-12 px-6 rounded-full border-border bg-background/50 backdrop-blur hover:bg-background">
                  <Heart className="w-5 h-5 mr-2" /> Favorite
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <List className="w-6 h-6 text-primary" />
            Chapters 
            <span className="text-muted-foreground text-lg font-normal ml-2">({sortedChapters.length})</span>
          </h2>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          {isChaptersLoading ? (
            <div className="p-8 text-center space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : sortedChapters.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No chapters available yet.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {sortedChapters.map((chapter) => (
                <Link key={chapter.id} href={`/read/${chapter.id}`}>
                  <div className="p-4 hover:bg-secondary/40 transition-colors flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-display font-bold text-lg text-muted-foreground group-hover:text-primary transition-colors">
                        {chapter.chapterNumber}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {chapter.title || `Chapter ${chapter.chapterNumber}`}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {chapter.createdAt ? format(new Date(chapter.createdAt), "MMM d, yyyy") : "Unknown"}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Read
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
