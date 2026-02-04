import { Trash2, Clock, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';
import type { StoryWithSegments } from '../types/database';

interface StoryListProps {
    stories: StoryWithSegments[];
    isLoading: boolean;
    selectedId: string | null;
    onSelect: (story: StoryWithSegments) => void;
    onDelete: (id: string) => void;
}

export function StoryList({ stories = [], isLoading, selectedId, onSelect, onDelete }: StoryListProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-slate-800">Your Stories</h2>
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-100">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-sidebar-border/50 flex items-center justify-between bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Stories</h2>
                <div className="px-2.5 py-0.5 rounded-full bg-sidebar-accent border border-sidebar-border text-[11px] font-semibold text-sidebar-foreground/70 shadow-sm">
                    {stories.length}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-2 p-4">
                    {stories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 px-6">
                            <div className="p-4 bg-sidebar-accent/50 rounded-full mb-4 ring-1 ring-sidebar-border/50">
                                <Clock size={32} className="opacity-50 stroke-[1.5]" />
                            </div>
                            <p className="text-sm font-medium text-center text-foreground/70">No stories yet</p>
                            <p className="text-xs mt-1.5 text-center text-muted-foreground max-w-[200px]">Create your first video script to see it here.</p>
                        </div>
                    ) : (
                        stories.map((story) => (
                            <div
                                key={story.id}
                                onClick={() => onSelect(story)}
                                className={`
                                    group relative flex items-start gap-3.5 p-3.5 rounded-xl cursor-pointer
                                    transition-all duration-300 border
                                    ${selectedId === story.id
                                        ? 'bg-white shadow-md border-primary/20 ring-1 ring-primary/10 translate-x-1'
                                        : 'bg-transparent border-transparent hover:bg-sidebar-accent/70 hover:border-sidebar-border hover:translate-x-1'}
                                `}
                            >
                                {/* Active Indicator line */}
                                <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-all duration-300 ${selectedId === story.id ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/20'}`} />

                                <div className="flex-1 min-w-0 pl-2">
                                    <h3 className={`font-semibold text-[13px] leading-snug truncate transition-colors ${selectedId === story.id ? 'text-primary' : 'text-sidebar-foreground/90 group-hover:text-primary'}`}>
                                        {story.story_title || 'Untitled Story'}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border transition-colors ${selectedId === story.id ? 'bg-primary/5 text-primary border-primary/10' : 'bg-sidebar-accent text-muted-foreground border-transparent'}`}>
                                            {story.segments.length} segments
                                        </span>
                                        {story.visual_style && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 font-medium truncate max-w-[80px]">
                                                {story.visual_style}
                                            </span>
                                        )}
                                        {story.script_tone && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 font-medium truncate max-w-[80px]">
                                                {story.script_tone}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1 font-medium ml-auto">
                                            {formatDate(story.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transition-all duration-200 -mr-1 translate-x-2 group-hover:translate-x-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(story.id);
                                        }}
                                    >
                                        <Trash2 size={15} />
                                    </Button>
                                    <ChevronRight size={16} className="text-muted-foreground/30 ml-[-2px]" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
