import { useState } from 'react';
import { RefreshCw, ImageIcon, Maximize2, Volume2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { ImageModal } from './ImageModal';
import { AudioPlayer } from './AudioPlayer';
import type { DbSegment } from '../types/database';

interface StoryCardProps {
    segment: DbSegment;
    isGeneratingImage: boolean;
    isGeneratingAudio: boolean;
    isGeneratingVideo?: boolean;
    onRegenerateImage: () => void;
    onRegenerateAudio: () => void;
    onGenerateVideo?: () => void;
}

export function StoryCard({
    segment,
    isGeneratingImage,
    isGeneratingAudio,
    isGeneratingVideo,
    onRegenerateImage,
    onRegenerateAudio,
    onGenerateVideo,
}: StoryCardProps) {
    const [imageError, setImageError] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [playingVideo, setPlayingVideo] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    const handleImageClick = () => {
        if (segment.video_url) {
            setPlayingVideo(!playingVideo);
        } else if (segment.image_url && !imageError) {
            setShowModal(true);
        }
    };

    return (
        <>
            <Card className="relative overflow-hidden group border-border/60 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 bg-card rounded-2xl hover:-translate-y-1">
                {/* Visual Section (Image or Video) */}
                <div
                    className={`relative aspect-video w-full bg-muted overflow-hidden ${segment.image_url || segment.video_url ? 'cursor-pointer' : ''}`}
                    onClick={handleImageClick}
                >
                    {/* Video Player */}
                    {segment.video_url && playingVideo ? (
                        <video
                            src={segment.video_url}
                            controls
                            autoPlay
                            className="w-full h-full object-cover"
                            onClick={(e) => e.stopPropagation()} // Allow controls to work
                        />
                    ) : (
                        <>
                            {/* Image Display */}
                            {isGeneratingImage ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-3" />
                                    <span className="text-xs font-semibold text-primary bg-background/90 px-3 py-1.5 rounded-full shadow-sm border border-border">Generating image...</span>
                                </div>
                            ) : segment.image_url && !imageError ? (
                                <img
                                    src={segment.image_url}
                                    alt={`Segment ${segment.segment_index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={handleImageError}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground/40">
                                    <ImageIcon size={32} />
                                </div>
                            )}

                            {/* Overlays */}
                            {segment.video_url && !playingVideo && (
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <div className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:scale-110 transition-transform">
                                        <Volume2 size={32} className="fill-white" />
                                    </div>
                                </div>
                            )}

                            {isGeneratingVideo && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mb-3" />
                                    <span className="text-xs font-semibold text-white bg-black/40 px-3 py-1.5 rounded-full border border-purple-500/30">Generating Video...</span>
                                </div>
                            )}
                        </>
                    )}


                    {/* Duration Badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold tracking-wide shadow-sm z-20 pointer-events-none">
                        {segment.duration_seconds}s
                    </div>

                    {/* Segment Number */}
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-linear-to-br from-primary to-purple-600 shadow-lg text-white flex items-center justify-center font-bold text-sm ring-1 ring-white/20 z-20 pointer-events-none">
                        {segment.segment_index + 1}
                    </div>
                </div>

                <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-primary inline-block shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
                        Script
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground line-clamp-3 mt-1.5 font-medium">
                        {segment.text}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pb-3 px-5">
                    {/* Narration Controls (Same as before) */}
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 flex items-center gap-1.5">
                            <Volume2 size={12} className="text-primary" />
                            Narration
                        </h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-[10px] hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={onRegenerateAudio}
                            disabled={isGeneratingAudio}
                        >
                            <RefreshCw size={10} className={isGeneratingAudio ? 'animate-spin mr-1.5' : 'mr-1.5'} />
                            {isGeneratingAudio ? 'Working...' : 'Retry'}
                        </Button>
                    </div>
                    {isGeneratingAudio ? (
                        <div className="flex items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2.5" />
                            <span className="text-xs font-semibold text-primary">Synthesizing voice...</span>
                        </div>
                    ) : (
                        <div className="bg-muted/50 rounded-xl p-1.5 border border-border/50">
                            <AudioPlayer src={segment.audio_url} compact />
                        </div>
                    )}
                </CardContent>

                <CardContent className="pt-0 pb-4 px-5">
                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 flex items-center gap-1.5">
                        <ImageIcon size={12} className="text-primary" />
                        Visual Prompt
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 bg-muted/40 p-3 rounded-xl border border-border/40 font-medium">
                        {segment.visual_prompt}
                    </p>
                </CardContent>

                <CardFooter className="pt-0 px-5 pb-5 grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-9 gap-2 text-xs font-semibold border-border bg-transparent hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all"
                        onClick={onRegenerateImage}
                        disabled={isGeneratingImage}
                    >
                        <RefreshCw size={12} className={isGeneratingImage ? 'animate-spin' : ''} />
                        {isGeneratingImage ? 'Redrawing...' : 'Image'}
                    </Button>

                    <Button
                        variant={segment.video_url ? "default" : "secondary"}
                        size="sm"
                        className={`w-full h-9 gap-2 text-xs font-semibold ${segment.video_url ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                        onClick={onGenerateVideo}
                        disabled={isGeneratingVideo}
                    >
                        {isGeneratingVideo ? (
                            <RefreshCw size={12} className="animate-spin" />
                        ) : (
                            <Maximize2 size={12} /> // Use a video icon here ideally
                        )}
                        {segment.video_url ? 'Regenerate Video' : 'Generate Video'}
                    </Button>
                </CardFooter>
            </Card>

            {/* Fullscreen Modal */}
            <ImageModal
                imageUrl={showModal ? segment.image_url : null}
                alt={`Segment ${segment.segment_index + 1}: ${segment.text.substring(0, 50)}...`}
                onClose={() => setShowModal(false)}
            />
        </>
    );
}

// Skeleton version for loading states
export function StoryCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <CardHeader className="pb-2">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="pb-2">
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-10 w-full rounded-lg" />
            </CardContent>
            <CardContent className="pt-0 pb-2">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
            </CardContent>
            <CardFooter className="pt-2">
                <Skeleton className="h-9 w-full" />
            </CardFooter>
        </Card>
    );
}
