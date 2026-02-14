import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Home, Compass, UploadCloud, Library, LogOut, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <Link href={href} onClick={onClick}>
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group",
        active 
          ? "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}>
        <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="text-sm">{label}</span>
      </div>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/browse", icon: Compass, label: "Browse" },
    { href: "/library", icon: Library, label: "Library" },
    { href: "/upload", icon: UploadCloud, label: "Creator Studio" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center">
              <span className="font-display font-bold text-white text-lg">M</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">MangaStream</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 py-2 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground mb-4 px-4 uppercase tracking-wider">Menu</div>
        {navItems.map((item) => (
          <NavItem 
            key={item.href}
            {...item}
            active={location === item.href}
            onClick={() => setIsMobileOpen(false)}
          />
        ))}
      </div>

      <div className="p-4 border-t border-border">
        {user ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-9 h-9 border border-border">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{user.firstName || "User"}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/25 transition-all" 
            asChild
          >
            <a href="/api/login">Login / Register</a>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 z-50">
        <Link href="/">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center">
              <span className="font-display font-bold text-white text-lg">M</span>
            </div>
            <span className="font-display font-bold text-lg">MangaStream</span>
          </div>
        </Link>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-r border-border bg-card">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 w-full pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
