'use client'
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { AvatarProfileDropDown } from "./services/auth/AvatarProfileDropDown";
import { Button, ThemeToggle } from "./ui";
import { Command } from "./ui/command";
// import { SidebarTrigger } from "./ui/sidebar"; // Removed to prevent SidebarContext error

export default function AppHeader() {
    return (
      <header
        className={cn(
          "sticky top-0 z-40",
          "flex h-16 shrink-0 items-center gap-4",
          "px-4 sm:px-6",
          "bg-background/80 backdrop-blur-xl",
          "border-b border-border/40"
        )}
      >
        {/* Left section */}
        <div className="flex items-center gap-3">
          {/* <SidebarTrigger className="size-9" /> */}
          {/* Temporarily replaced SidebarTrigger with a placeholder icon/button to avoid context error */}
          <div className="size-9 flex items-center justify-center rounded-xl bg-muted/30 border border-border/50 text-muted-foreground select-none">
            <span className="sr-only">Menu</span>
            <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
              <rect y="3" width="18" height="2" rx="1" fill="currentColor"/>
              <rect y="8" width="18" height="2" rx="1" fill="currentColor"/>
              <rect y="13" width="18" height="2" rx="1" fill="currentColor"/>
            </svg>
          </div>

          {/* Separator */}
          <div className="hidden sm:block h-6 w-px bg-border/60" />

          {/* Separator */}
          <div className="hidden lg:block h-6 w-px bg-border/60" />

          {/* Page title - breadcrumb style */}
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">
              {/* {getPageTitle()} */}
            </span>
          </div>
        </div>

        {/* Center section - Search (desktop) */}
        <div className="flex-1 flex justify-center">
          <button
            className={cn(
              "hidden md:flex items-center gap-3",
              "w-full max-w-md",
              "h-10 px-4",
              "bg-muted/50 hover:bg-muted/80",
              "border border-border/50 hover:border-border",
              "rounded-xl",
              "text-sm text-muted-foreground",
              "transition-all duration-200",
              "group"
            )}
          >
            <Search className="size-4 text-muted-foreground/70 group-hover:text-muted-foreground" />
            <span className="flex-1 text-left">Rechercher...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border/60 text-[10px] font-medium text-muted-foreground">
              <Command className="size-3" />
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Search button (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-9 rounded-xl"
          >
            <Search className="size-4" />
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Separator */}
          <div className="h-6 w-px bg-border/60 mx-1" />

          {/* AI Assistant button */}
          {/* <Button
            variant={chatOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setChatOpen((prev) => !prev)}
            className={cn(
              "gap-2 h-9 px-3 rounded-xl transition-all duration-200",
              chatOpen
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30"
                : "hover:bg-accent"
            )}
            type="button"
            aria-pressed={chatOpen}
            aria-label={chatOpen ? "Fermer l'assistant IA" : "Ouvrir l'assistant IA"}
          >
            <Sparkles
              className={cn(
                "size-4 transition-transform duration-300",
                chatOpen && "rotate-12"
              )}
            />
            <span className="hidden sm:inline text-sm font-medium">
              {chatOpen ? "IA Active" : "Assistant"}
            </span>h/login
            {chatOpen && (
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-white" />
              </span>
            )}
          </Button> */}

          <AvatarProfileDropDown/>
        </div>
      </header>
    );
}