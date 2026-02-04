import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { DbGeneration } from '../types/database';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, CheckCircle2, XCircle, Clock, FileVideo, FileImage, FileAudio, RotateCw } from 'lucide-react';

export function GenerationHistory() {
    const [generations, setGenerations] = useState<DbGeneration[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchGenerations = async () => {
        setIsLoading(true);
        const { data, error } = await (supabase
            .from('generations') as any)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setGenerations(data as DbGeneration[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchGenerations();

        // Subscribe to changes
        const channel = supabase
            .channel('public:generations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'generations' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setGenerations((prev) => [payload.new as DbGeneration, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setGenerations((prev) => prev.map((gen) => (gen.id === payload.new.id ? payload.new as DbGeneration : gen)));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'story': return <FileVideo size={16} />;
            case 'image': return <FileImage size={16} />;
            case 'audio': return <FileAudio size={16} />;
            default: return <FileVideo size={16} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'failed': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'pending': return 'text-primary bg-primary/10 border-primary/20';
            default: return 'text-muted-foreground bg-muted border-border';
        }
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</h3>
                <button
                    onClick={fetchGenerations}
                    className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                    title="Refresh"
                >
                    <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            <ScrollArea className="h-[300px] pr-4">
                <div className="flex flex-col gap-3">
                    {generations.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-xl">
                            No recent history found
                        </div>
                    )}

                    {generations.map((gen) => (
                        <div key={gen.id} className="group flex items-center gap-4 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300">
                            {/* Icon / Status */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${getStatusColor(gen.status)}`}>
                                {gen.status === 'pending' ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : gen.status === 'completed' ? (
                                    <CheckCircle2 size={18} />
                                ) : (
                                    <XCircle size={18} />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground uppercase flex items-center gap-1.5">
                                        {getIcon(gen.type)}
                                        {gen.type}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock size={10} />
                                        {gen.created_at ? formatDistanceToNow(new Date(gen.created_at), { addSuffix: true }) : 'Just now'}
                                    </span>
                                </div>
                                <p className="text-sm font-medium truncate text-foreground/90">
                                    {gen.metadata?.base_idea || gen.metadata?.story_title || 'Untitled Generation'}
                                </p>
                                {gen.duration_ms && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Took {(gen.duration_ms / 1000).toFixed(1)}s • {gen.provider}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
