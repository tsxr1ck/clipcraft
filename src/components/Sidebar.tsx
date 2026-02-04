import { PlusCircle, Sparkles, LayoutDashboard, Film, LogOut, Clapperboard } from 'lucide-react';
import { Button } from './ui/button';
import { StoryList } from './StoryList';
import type { StoryWithSegments } from '../types/database';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface SidebarProps {
    stories?: StoryWithSegments[];
    isLoading?: boolean;
    selectedId?: string | null;
    onSelect?: (story: StoryWithSegments) => void;
    onDelete?: (id: string) => void;
    onNewStory?: () => void;
    error?: string | null;
}

export function Sidebar({
    stories = [],
    isLoading = false,
    selectedId = null,
    onSelect = () => { },
    onDelete = () => { },
    onNewStory = () => { },
    error = null,
}: SidebarProps) {
    const { user, profile, signOut } = useAuth();
    const location = useLocation();
    const isSeriesPage = location.pathname === '/series';

    const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const initials = displayName.charAt(0).toUpperCase();

    return (
        <aside className="hidden lg:flex fixed inset-y-0 left-0 h-full w-[320px] bg-sidebar border-r border-sidebar-border flex-col shadow-sm z-20">
            {/* Header */}
            <div className="p-6 border-b border-sidebar-border bg-linear-to-b from-sidebar via-sidebar to-transparent">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-600 flex items-center gap-2.5 tracking-tight">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                        <Sparkles size={20} className="fill-current" />
                    </div>
                    ClipCraft
                </h1>
                <p className="text-xs text-sidebar-foreground/60 font-medium mt-1.5 ml-1">AI Video Storyteller</p>
            </div>

            {/* Main Navigation */}
            <div className="px-4 py-4 space-y-1">
                <Link to="/">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 h-11 px-3 rounded-xl transition-all duration-200",
                            !isSeriesPage ? "bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
                        )}
                    >
                        <LayoutDashboard size={18} />
                        Stories
                    </Button>
                </Link>
                <Link to="/series">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 h-11 px-3 rounded-xl transition-all duration-200",
                            isSeriesPage ? "bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
                        )}
                    >
                        <Film size={18} />
                        Series
                    </Button>
                </Link>
                <Link to="/wan-video">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 h-11 px-3 rounded-xl transition-all duration-200",
                            location.pathname === '/wan-video' ? "bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
                        )}
                    >
                        <Clapperboard size={18} />
                        Video Lab
                    </Button>
                </Link>
            </div>

            {/* New Story Button (Contextual) */}
            {!isSeriesPage && (
                <div className="px-5 py-4">
                    <Button
                        className="w-full gap-2.5 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={onNewStory}
                    >
                        <PlusCircle size={20} strokeWidth={2.5} />
                        Create New Story
                    </Button>
                </div>
            )}

            {/* Story List (Only on Dashboard) */}
            {!isSeriesPage && (
                <div className="flex-1 overflow-hidden">
                    <StoryList
                        stories={stories}
                        isLoading={isLoading}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onDelete={onDelete}
                    />
                </div>
            )}

            {/* Filler for Series Page */}
            {isSeriesPage && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
                    <div className="p-4 rounded-full bg-slate-100 mb-4">
                        <Film className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">View and manage your cinematic universes from the main panel.</p>
                </div>
            )}

            {/* User Profile / Footer */}
            <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar>
                            <AvatarImage src={profile?.avatar_url || "https://github.com/shadcn.png"} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-sidebar-foreground truncate" title={displayName}>
                                {displayName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium truncate">
                                {profile?.email || user?.email}
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => signOut()}
                        title="Sign Out"
                    >
                        <LogOut size={16} />
                    </Button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="absolute bottom-16 left-4 right-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    {error}
                </div>
            )}
        </aside>
    );
}
