import { useState, useEffect } from 'react';
import {
    ChevronLeft, Loader2, FileText, Image as ImageIcon,
    Music, Video, CheckCircle2, Download
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import type { Episode, Character, EpisodeSegment } from '../../types/series';
import type { StoryWithSegments, DbSegment } from '../../types/database';

// Hooks
import { useImageGenerator } from '../../hooks/useImageGenerator';
import { useAudioGenerator } from '../../hooks/useAudioGenerator';
import { useVideoGenerator } from '../../hooks/useVideoGenerator';
import { StoryCard } from '../StoryCard';

// Real AI Service
import { QwenService } from '../../services/qwenService';

interface EpisodeProductionProps {
    episode: Episode & { segments?: EpisodeSegment[] };
    seriesContext: {
        title: string;
        full_lore: string;
        visual_style: string;
        script_style: string;
        main_characters: Character[];
    };
    onBack: () => void;
    onUpdateEpisode: (episodeId: string) => void;
}

export function EpisodeProduction({
    episode,
    seriesContext,
    onBack,
    onUpdateEpisode
}: EpisodeProductionProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [segments, setSegments] = useState<EpisodeSegment[]>(episode.segments || []);
    const [isGeneratingSegments, setIsGeneratingSegments] = useState(false);
    const [segmentError, setSegmentError] = useState<string | null>(null);

    // Hooks
    const imageGen = useImageGenerator();
    const audioGen = useAudioGenerator();
    const videoGen = useVideoGenerator();

    // Effect to update segments if prop changes
    useEffect(() => {
        if (episode.segments) {
            setSegments(episode.segments);
        }
    }, [episode.segments]);

    // Determine current step based on data
    useEffect(() => {
        if (episode.video_url) setCurrentStep(4);
        else if (segments.length > 0) setCurrentStep(2);
        else setCurrentStep(1);
    }, [episode, segments]);

    const handleGenerateSegments = async () => {
        setIsGeneratingSegments(true);
        setSegmentError(null);

        try {
            console.log('Starting segment generation for episode:', episode.id);
            console.log('Series context:', {
                title: seriesContext.title,
                visual_style: seriesContext.visual_style,
                script_style: seriesContext.script_style,
                character_count: seriesContext.main_characters.length
            });

            // Call the real QwenService
            const newSegments = await QwenService.generateSegments(episode, seriesContext);

            console.log(`✓ Received ${newSegments.length} segments from AI`);

            setSegments(newSegments);
            setCurrentStep(2);
            onUpdateEpisode(episode.id);

        } catch (error: any) {
            console.error('Failed to generate segments:', error);
            setSegmentError(error.message || 'Failed to generate segments. Please try again.');
        } finally {
            setIsGeneratingSegments(false);
        }
    };

    const handleGenerateImages = async () => {
        if (!segments.length) return;

        // Adapt EpisodeSegment to DbSegment/StoryWithSegments for the hook
        const storyProxy: StoryWithSegments = {
            id: episode.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            segments: segments as any,
            profile_id: null,
            base_idea: episode.synopsis,
            story_title: episode.title,
            visual_style: seriesContext.visual_style,
            script_tone: seriesContext.script_style,
            video_url: episode.video_url || null,
            video_status: episode.video_status || 'idle',
            video_job_id: episode.video_job_id || null,
            created_at: episode.created_at,
            updated_at: episode.updated_at
        };

        await imageGen.generateAllImages(storyProxy, (updatedSegment: DbSegment) => {
            // Update local state when a segment is updated
            setSegments((prev: EpisodeSegment[]) => prev.map((s: EpisodeSegment) =>
                s.id === updatedSegment.id ? { ...s, ...updatedSegment } as EpisodeSegment : s
            ));
        });

        // Auto-start audio if images done
        handleGenerateAudio();
    };

    const handleGenerateAudio = async () => {
        if (!segments.length) return;

        const storyProxy: StoryWithSegments = {
            id: episode.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            segments: segments as any,
            profile_id: null,
            base_idea: episode.synopsis,
            story_title: episode.title,
            visual_style: seriesContext.visual_style,
            script_tone: seriesContext.script_style,
            video_url: episode.video_url || null,
            video_status: episode.video_status || 'idle',
            video_job_id: episode.video_job_id || null,
            created_at: episode.created_at,
            updated_at: episode.updated_at
        };

        await audioGen.generateAllAudios(storyProxy, (updatedSegment: DbSegment) => {
            setSegments((prev: EpisodeSegment[]) => prev.map((s: EpisodeSegment) =>
                s.id === updatedSegment.id ? { ...s, ...updatedSegment } as EpisodeSegment : s
            ));
        });
    };

    const handleGenerateVideo = async () => {
        if (!episode.id || !segments.length) return;
        await videoGen.generateVideo(episode.id, segments as unknown as DbSegment[]);
    };

    // Calculate progress
    const imagesCount = segments.filter(s => s.image_url).length;
    const audiosCount = segments.filter(s => s.audio_url).length;
    const totalSegments = segments.length;

    // Steps UI Data
    const steps = [
        { id: 1, title: 'Segments', icon: FileText, isComplete: segments.length > 0 },
        { id: 2, title: 'Images', icon: ImageIcon, isComplete: imagesCount === totalSegments && totalSegments > 0 },
        { id: 3, title: 'Audio', icon: Music, isComplete: audiosCount === totalSegments && totalSegments > 0 },
        { id: 4, title: 'Video', icon: Video, isComplete: !!episode.video_url },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ChevronLeft />
                </Button>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {seriesContext.title}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                            S{episode.season_number} EP{episode.episode_number}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{episode.title}</h1>
                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">{episode.synopsis.substring(0, 150)}...</p>
                </div>
            </div>

            {/* Stepper */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex justify-between relative">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2" />

                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isDone = step.isComplete;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-50 px-4">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                                    ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/25' : 'bg-slate-200 text-slate-400'}
                                `}>
                                    {isDone ? <CheckCircle2 size={20} /> : <Icon size={18} />}
                                </div>
                                <span className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Step Actions */}
                <div className="mt-8 flex justify-center">
                    {currentStep === 1 && (
                        <div className="text-center space-y-4">
                            <div className="space-y-2">
                                <p className="text-slate-500">Break down the episode script into visual segments.</p>
                                {episode.target_duration && (
                                    <p className="text-xs text-slate-400">
                                        Target duration: {Math.floor(episode.target_duration / 60)} minutes
                                        ({Math.ceil(episode.target_duration / 15)} segments)
                                    </p>
                                )}
                            </div>

                            {segmentError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                    {segmentError}
                                </div>
                            )}

                            <Button
                                onClick={handleGenerateSegments}
                                disabled={isGeneratingSegments}
                                className="bg-primary h-12 px-8 text-lg"
                            >
                                {isGeneratingSegments ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" />
                                        Analyzing Episode...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="mr-2" />
                                        Break into Segments
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {currentStep === 2 && segments.length > 0 && (
                        <div className="w-full max-w-2xl space-y-4">
                            <div className="flex justify-between text-sm text-slate-600 mb-2">
                                <span>Generating Assets...</span>
                                <span>{Math.round(((imagesCount + audiosCount) / (totalSegments * 2)) * 100)}%</span>
                            </div>
                            {/* Simple Progress Bar */}
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${((imagesCount + audiosCount) / (totalSegments * 2)) * 100}%` }}
                                />
                            </div>

                            <div className="flex justify-center gap-4 mt-4">
                                <Button
                                    onClick={handleGenerateImages}
                                    disabled={imageGen.isGenerating || imagesCount === totalSegments}
                                    variant={imagesCount === totalSegments ? "outline" : "default"}
                                >
                                    {imageGen.isGenerating ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />}
                                    {imagesCount === totalSegments ? 'Images Complete' : `Generate Images (${imagesCount}/${totalSegments})`}
                                </Button>
                                <Button
                                    onClick={handleGenerateAudio}
                                    disabled={audioGen.isGenerating || audiosCount === totalSegments}
                                    variant={audiosCount === totalSegments ? "outline" : "default"}
                                >
                                    {audioGen.isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Music className="mr-2" />}
                                    {audiosCount === totalSegments ? 'Audio Complete' : `Generate Audio (${audiosCount}/${totalSegments})`}
                                </Button>

                                {(imagesCount === totalSegments && audiosCount === totalSegments) && (
                                    <Button onClick={() => setCurrentStep(4)} className="ml-4 animate-in fade-in">
                                        Next Step <ChevronLeft className="rotate-180 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="text-center space-y-4">
                            {videoGen.isGenerating ? (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 relative mx-auto">
                                        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <h3 className="text-xl font-bold animate-pulse">Rendering Final Video...</h3>
                                    <p className="text-slate-500">{videoGen.progressMessage || `${Math.round(videoGen.progress)}%`}</p>
                                </div>
                            ) : episode.video_url ? (
                                <div className="space-y-4">
                                    <div className="aspect-video w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-2xl bg-black">
                                        <video src={episode.video_url} controls className="w-full h-full" />
                                    </div>
                                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => window.open(episode.video_url || '', '_blank')}>
                                        <Download className="mr-2" /> Download Video
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-slate-500 mb-4">All assets are ready. Combine them into the final episode.</p>
                                    <Button onClick={handleGenerateVideo} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                                        <Video className="mr-2" /> Generate Final Video
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Segments Grid */}
            {segments.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">
                            Segments ({segments.length})
                        </h2>
                        <div className="text-sm text-slate-500">
                            Total duration: ~{Math.floor(segments.reduce((acc, s) => acc + (s.duration_seconds || 15), 0) / 60)} min
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {segments.map((segment: EpisodeSegment) => (
                            <StoryCard
                                key={segment.id}
                                segment={segment as unknown as DbSegment}
                                isGeneratingImage={imageGen.progress?.currentIndex === segment.segment_index && imageGen.isGenerating}
                                isGeneratingAudio={audioGen.progress?.currentIndex === segment.segment_index && audioGen.isGenerating}
                                onRegenerateImage={() => imageGen.regenerateImage(segment as unknown as DbSegment)}
                                onRegenerateAudio={() => audioGen.regenerateAudio(segment as unknown as DbSegment)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}