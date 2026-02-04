import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { WanOrchestrator } from '../services/wanOrchestrator';
import { Loader2, RefreshCw, FileAudio, Video as VideoIcon, Download } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface VideoGeneratorUIProps {
    storyId: string;
}

// Minimal interface for what we display
interface WanStorySegment {
    id: string;
    segment_index: number;
    text_content: string;
    status: string;
    visual_prompt: string;
    audio_url?: string;
    video_url?: string;
}

export const VideoGeneratorUI: React.FC<VideoGeneratorUIProps> = ({ storyId }) => {
    const [segments, setSegments] = useState<WanStorySegment[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch initial state
    useEffect(() => {
        fetchSegments();
    }, [storyId]);

    const fetchSegments = async () => {
        const { data } = await (supabase as any)
            .from('wan_story_segments')
            .select('*')
            .eq('wan_story_id', storyId)
            .order('segment_index', { ascending: true });

        if (data) {
            setSegments(data);
            return data; // Return fresh data
        }
        return [];
    };

    const processNext = async () => {
        // Fetch fresh segments to avoid stale closure
        const currentSegments = await fetchSegments();

        // Find first segment that needs work
        const pending = currentSegments.find((s: WanStorySegment) =>
            s.status !== 'video_ready' && s.status !== 'failed'
        );

        if (!pending) {
            setIsProcessing(false);
            return;
        }

        try {
            await WanOrchestrator.processSegment(pending.id);
            // Refresh state handled by start of next loop

            // Continue loop
            setTimeout(processNext, 1000);
        } catch (e) {
            console.error("Error processing segment", e);
            // Don't stop processing on single error, retry
            setTimeout(processNext, 2000);
        }
    };

    const toggleProcessing = () => {
        if (isProcessing) {
            setIsProcessing(false);
        } else {
            setIsProcessing(true);
            processNext();
        }
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    return (
        <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Production Workflow</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchSegments}>
                        <RefreshCw size={16} />
                    </Button>
                    <Button
                        onClick={toggleProcessing}
                        variant={isProcessing ? "secondary" : "default"}
                    >
                        {isProcessing ? 'Pause Processing' : 'Start Processing'}
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {segments.map(seg => (
                    <div key={seg.id} className="p-4 border rounded-xl hover:bg-slate-50 transition-colors bg-white shadow-sm">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full font-bold text-xs text-slate-500 shrink-0">
                                {seg.segment_index}
                            </div>

                            <div className="flex-1 min-w-0 space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{seg.text_content}</p>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{seg.visual_prompt}</p>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {seg.status === 'pending' && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">Pending</span>}
                                    {seg.status === 'audio_ready' && <span className="text-xs bg-blue-100 px-2 py-0.5 rounded text-blue-700">Audio Ready</span>}
                                    {seg.status === 'generating_video' && <span className="text-xs bg-amber-100 px-2 py-0.5 rounded text-amber-700 animate-pulse">Generating Video...</span>}
                                    {seg.status === 'video_ready' && <span className="text-xs bg-green-100 px-2 py-0.5 rounded text-green-700">Video Ready</span>}
                                    {seg.status === 'failed' && <span className="text-xs bg-red-100 px-2 py-0.5 rounded text-red-700">Failed</span>}
                                </div>

                                {/* Video Preview & Controls */}
                                {seg.video_url && (
                                    <div className="mt-3">
                                        <div className="relative aspect-[9/16] w-32 bg-slate-900 rounded-lg overflow-hidden group">
                                            <video
                                                src={seg.video_url}
                                                controls
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="mt-2 text-sm text-slate-500">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 h-8 text-xs"
                                                onClick={() => handleDownload(seg.video_url!, `segment_${seg.segment_index}.mp4`)}
                                            >
                                                <Download size={14} />
                                                Download .mp4
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {segments.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        <Loader2 className="mx-auto mb-2 animate-spin text-slate-300" />
                        <p>Loading segments...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
