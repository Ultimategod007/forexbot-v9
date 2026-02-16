import { useSeries } from "@/hooks/use-series";
import { Layout } from "@/components/Layout";
import { SeriesCard } from "@/components/SeriesCard";
import { Button } from "@/components/ui/button";
import { ChevronRight, Flame, Sparkles, Clock } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useRef } from "react";

function HeroCarousel({ series }: { series: any[] }) {
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  if (!series || series.length === 0) return null;

  return (
    <div className="relative w-full mb-8 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {series.slice(0, 5).map((item) => (
            <CarouselItem key={item.id}>
              <div className="relative h-[400px] md:h-[500px] w-full">
                {/* Hero Image Background */}
                <div className="absolute inset-0">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-60 blur-sm scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 h-full container px-6 md:px-12 flex items-center">
                  <div className="grid md:grid-cols-[2fr,3fr] gap-8 items-end w-full">
                    {/* Left: Info */}
                    <div className="space-y-6 pb-12">
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          {item.genres?.map((g: string) => (
                            <span key={g} className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider">
                              {g}
                            </span>
                          ))}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-black text-white leading-[0.9]">
                          {item.title}
                        </h1>
                        <p className="text-lg text-muted-foreground line-clamp-3 md:line-clamp-2 max-w-xl">
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="flex gap-4">
                        <Link href={`/series/${item.id}`}>
                          <Button size="lg" className="rounded-full px-8 text-base font-bold bg-white text-black hover:bg-white/90">
                            Start Reading
                          </Button>
                        </Link>
                        <Link href={`/series/${item.id}`}>
                          <Button size="lg" variant="outline" className="rounded-full px-8 backdrop-blur-sm">
                            More Info
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Right: Featured Cover (Desktop only) */}
                    <div className="hidden md:flex justify-end pb-8 pr-8">
                       <Link href={`/series/${item.id}`}>
                        <div className="w-[240px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 rotate-3 hover:rotate-0 transition-all duration-500 cursor-pointer">
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

function Section({ title, icon: Icon, link, children }: any) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6 px-4 md:px-0">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6 text-primary" />}
          <h2 className="text-2xl font-display font-bold">{title}</h2>
        </div>
        {link && (
          <Link href={link}>
            <Button variant="ghost" className="text-muted-foreground hover:text-white group">
              View All <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        )}
      </div>
      <div className="px-4 md:px-0">
        {children}
      </div>
    </section>
  );
}

function SeriesGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export default function Home() {
  const { data: series, isLoading } = useSeries({ limit: 20 });
  const { data: trending } = useSeries({ limit: 5 }); // Simulate trending with limit

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="h-[400px] w-full bg-muted animate-pulse rounded-2xl" />
        <SeriesGridSkeleton />
      </div>
    );
  }

  const featured = series?.slice(0, 5) || [];
  const latest = series || [];

  return (
    <div className="pb-20">
      <HeroCarousel series={featured} />
      
      <div className="container mx-auto max-w-7xl">
        <Section title="Trending Now" icon={Flame} link="/browse?sort=trending">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {trending?.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        </Section>

        <Section title="New Releases" icon={Sparkles} link="/browse?sort=new">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {latest.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        </Section>

        <Section title="Continue Reading" icon={Clock}>
          <div className="bg-secondary/30 border border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Sign in to track your reading progress</p>
            <Link href="/api/login">
               <Button variant="link" className="text-primary mt-2">Login now</Button>
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
}
