import { useRoute, Link } from "wouter";
import { useChapterDetail, useChapters } from "@/hooks/use-chapters";
import { useSeriesDetail } from "@/hooks/use-series";
import { useUpdateProgress } from "@/hooks/use-progress";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Reader() {
  const [, params] = useRoute("/read/:id");
  const id = parseInt(params?.id || "0");
  
  const { data: chapter, isLoading } = useChapterDetail(id);
  const { data: series } = useSeriesDetail(chapter?.seriesId || 0);
  const { data: allChapters } = useChapters(chapter?.seriesId || 0);
  const { mutate: updateProgress } = useUpdateProgress(chapter?.seriesId || 0);

  // Track reading progress
  useEffect(() => {
    if (chapter && series) {
      updateProgress({
        chapterId: chapter.id,
        pageNumber: 1, // Simplified: just marking chapter as read
      });
      document.title = `${series.title} - Ch. ${chapter.chapterNumber}`;
    }
  }, [chapter, series, updateProgress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && chapter?.prevChapterId) {
        window.location.href = `/read/${chapter.prevChapterId}`;
      }
      if (e.key === "ArrowRight" && chapter?.nextChapterId) {
        window.location.href = `/read/${chapter.nextChapterId}`;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chapter]);

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground animate-pulse">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (!chapter) return <div>Chapter not found</div>;

  // Sort pages by pageNumber
  const pages = [...(chapter.pages || [])].sort((a, b) => a.pageNumber - b.pageNumber);
  
  // Navigation Helper
  const ChapterNav = () => (
    <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto w-full px-4 py-8">
      {chapter.prevChapterId ? (
        <Link href={`/read/${chapter.prevChapterId}`}>
          <Button variant="secondary" className="w-full md:w-auto">
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
        </Link>
      ) : (
        <Button variant="secondary" disabled className="w-full md:w-auto opacity-50">
          <ChevronLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
      )}

      <Link href={`/series/${chapter.seriesId}`}>
        <Button variant="outline">Series Info</Button>
      </Link>

      {chapter.nextChapterId ? (
         <Link href={`/read/${chapter.nextChapterId}`}>
          <Button variant="default" className="w-full md:w-auto bg-primary hover:bg-primary/90">
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      ) : (
        <Button variant="default" disabled className="w-full md:w-auto opacity-50">
          Next <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-black min-h-screen text-white flex flex-col items-center">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50 transition-transform duration-300 hover:translate-y-0">
        <div className="flex items-center gap-3">
          <Link href="/">
             <Button variant="ghost" size="icon" className="hover:bg-white/10">
               <Home className="w-5 h-5" />
             </Button>
          </Link>
          <div className="hidden md:flex flex-col">
            <span className="font-bold text-sm leading-none truncate max-w-[200px]">{series?.title}</span>
            <span className="text-xs text-white/50 leading-none mt-1">Chapter {chapter.chapterNumber}</span>
          </div>
        </div>

        {/* Chapter Selector */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              Ch. {chapter.chapterNumber} <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-zinc-900 border-zinc-800 text-white">
            <div className="h-full flex flex-col">
              <h3 className="font-display font-bold text-lg mb-4 border-b border-white/10 pb-2">
                All Chapters
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                {allChapters?.sort((a,b) => b.chapterNumber - a.chapterNumber).map(c => (
                  <Link key={c.id} href={`/read/${c.id}`}>
                    <div className={cn(
                      "px-3 py-2 rounded-md cursor-pointer text-sm transition-colors",
                      c.id === chapter.id 
                        ? "bg-primary text-white font-medium" 
                        : "hover:bg-white/10 text-white/70"
                    )}>
                      Chapter {c.chapterNumber}
                      {c.title && <span className="ml-2 opacity-50 text-xs">- {c.title}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Reader Content */}
      <div className="w-full max-w-3xl pt-14 pb-20 min-h-screen bg-[#111]">
        {pages.map((page) => (
          <img
            key={page.id}
            src={page.imageUrl}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-auto block"
            loading="lazy"
          />
        ))}
        
        <div className="py-12 bg-black border-t border-white/10 mt-4">
          <p className="text-center text-white/50 text-sm mb-6">End of Chapter {chapter.chapterNumber}</p>
          <ChapterNav />
        </div>
      </div>
    </div>
  );
}
