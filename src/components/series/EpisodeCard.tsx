import { Play, FileText, Video, CheckCircle2, Circle, Clock, Download } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import type { Episode } from '../../types/series';
import { EpisodeTokenUsage } from '../TokenUsagePanel';

interface EpisodeCardProps {
    episode: Episode;
    onClick: () => void;
    onProduceEpisode: (e: React.MouseEvent) => void;
}

export function EpisodeCard({ episode, onClick, onProduceEpisode }: EpisodeCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'video_ready': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'video_generating': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'segments_ready': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'scripted': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    const StatusIcon = () => {
        if (episode.status === 'published' || episode.status === 'video_ready') return <CheckCircle2 size={14} />;
        if (episode.status === 'video_generating') return <Video size={14} className="animate-pulse" />;
        if (episode.status === 'segments_ready') return <FileText size={14} />;
        return <Circle size={14} />;
    };

    return (
        <Card
            className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer border-slate-200 overflow-hidden bg-white"
            onClick={onClick}
        >
            <CardContent className="p-5">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-50 text-xs font-bold tracking-wide">
                            EP {episode.episode_number}
                        </span>
                        <div className={`px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1.5 border ${getStatusColor(episode.status)}`}>
                            <StatusIcon />
                            {episode.status.replace(/_/g, ' ').toUpperCase()}
                        </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <Clock size={12} />
                        {episode.actual_duration ? (
                            <span>{Math.floor(episode.actual_duration / 60)}:{(episode.actual_duration % 60).toString().padStart(2, '0')}</span>
                        ) : (
                            <span>Target: {Math.floor(episode.target_duration / 60)}:00</span>
                        )}
                    </div>

                    {/* Token Usage Inline Badge */}
                    <EpisodeTokenUsage episodeId={episode.id} variant="inline" />
                </div>

                <h3 className="font-bold text-lg text-slate-900 leading-snug mb-2 group-hover:text-primary transition-colors">
                    {episode.title}
                </h3>

                <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {episode.synopsis}
                </p>

                {/* Story Beats */}
                {episode.story_beats && episode.story_beats.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {episode.story_beats.slice(0, 3).map((beat, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100 truncate max-w-[150px]">
                                {beat}
                            </span>
                        ))}
                    </div>
                )}

                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        View Details →
                    </span>

                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {episode.status === 'draft' && (
                            <Button
                                size="sm"
                                className="h-8 text-xs bg-slate-900 hover:bg-slate-800"
                                onClick={onProduceEpisode}
                            >
                                <Play size={12} className="mr-1.5" /> Produce
                            </Button>
                        )}

                        {(episode.status === 'segments_ready' || episode.status === 'scripted') && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-primary/20 text-primary hover:bg-primary/5"
                                onClick={onProduceEpisode}
                            >
                                <FileText size={12} className="mr-1.5" /> Segments
                            </Button>
                        )}

                        {episode.video_url && (
                            <Button
                                size="sm"
                                className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle download logic if needed or just open link
                                    window.open(episode.video_url, '_blank');
                                }}
                            >
                                <Download size={12} className="mr-1.5" /> Download
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
