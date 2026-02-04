import { useState, useCallback } from 'react';
import '../App.css';
import { StoryCard, StoryCardSkeleton } from '../components/StoryCard';
import { GenerationPanel } from '../components/GenerationPanel';
import { JsonPreview } from '../components/JsonPreview';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { MobileDrawer } from '../components/MobileDrawer';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useStoryGenerator } from '../hooks/useStoryGenerator';
import { useImageGenerator } from '../hooks/useImageGenerator';
import { useAudioGenerator } from '../hooks/useAudioGenerator';
import { useVideoGenerator } from '../hooks/useVideoGenerator';
import { useStoredStories } from '../hooks/useStoredStories';
import { Images, Volume2, AlertCircle, Sparkles, Video, Download, Loader2, Film, Wand2, Zap } from 'lucide-react';
import type { StoryWithSegments, DbSegment } from '../types/database';
import type {
    VisualStyleKey,
    VisualStyleLabel,
    ScriptStyleKey,
    ScriptStyleLabel
} from '../types/styles';

export function Dashboard() {
    const [showGenerator, setShowGenerator] = useState(true);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [regeneratingImageIndex, setRegeneratingImageIndex] = useState<number | null>(null);
    const [regeneratingAudioIndex, setRegeneratingAudioIndex] = useState<number | null>(null);

    // Custom hooks
    const {
        isGenerating: isGeneratingStory,
        error: storyError,
        currentStory,
        generateStory,
        setCurrentStory,
        clearError: clearStoryError,
    } = useStoryGenerator();

    const {
        isGenerating: isGeneratingImages,
        progress: imageProgress,
        errors: imageErrors,
        generateAllImages,
        regenerateImage,
    } = useImageGenerator();

    const {
        isGenerating: isGeneratingAudios,
        progress: audioProgress,
        errors: audioErrors,
        generateAllAudios,
        regenerateAudio,
    } = useAudioGenerator();

    const {
        isGenerating: isGeneratingVideo,
        progress: videoProgress,
        progressMessage: videoProgressMessage,
        status: videoStatus,
        videoUrl: generatedVideoUrl,
        error: videoError,
        generateVideo,
        resumePolling,
        resetVideoState
    } = useVideoGenerator();

    const {
        stories,
        isLoading: isLoadingStories,
        error: storiesError,
        refresh: refreshStories,
        deleteStory,
    } = useStoredStories();

    // Handle segment update from generators
    const handleSegmentUpdate = useCallback((updatedSegment: DbSegment) => {
        if (!currentStory) return;

        setCurrentStory({
            ...currentStory,
            segments: currentStory.segments.map(seg =>
                seg.id === updatedSegment.id ? updatedSegment : seg
            ),
        });
    }, [currentStory, setCurrentStory]);

    // Handle story generation
    const handleGenerate = useCallback(async (
        baseIdea: string,
        duration: number,
        visualStyle: VisualStyleKey | VisualStyleLabel,
        scriptStyle: ScriptStyleKey | ScriptStyleLabel
    ) => {
        clearStoryError();
        const story = await generateStory(baseIdea, duration, visualStyle, scriptStyle);

        if (story) {
            setShowGenerator(false);
            refreshStories();

            // Generate images and audios in parallel
            await Promise.all([
                generateAllImages(story, handleSegmentUpdate),
                generateAllAudios(story, handleSegmentUpdate),
            ]);
            refreshStories();
        }
    }, [generateStory, generateAllImages, generateAllAudios, refreshStories, clearStoryError, handleSegmentUpdate]);

    // Handle story selection
    const handleSelectStory = useCallback((story: StoryWithSegments) => {
        setCurrentStory(story);
        setShowGenerator(false);

        // Check if we need to resume video polling
        if (story.video_status === 'generating' && story.video_job_id) {
            resumePolling(story.id, story.video_job_id);
        } else {
            resetVideoState();
        }
    }, [setCurrentStory, resetVideoState, resumePolling]);

    // Handle story deletion
    const handleDeleteStory = useCallback(async (id: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this story?');
        if (confirmed) {
            await deleteStory(id);
            if (currentStory?.id === id) {
                setCurrentStory(null);
                setShowGenerator(true);
            }
        }
    }, [deleteStory, currentStory, setCurrentStory]);

    // Handle image regeneration
    const handleRegenerateImage = useCallback(async (segment: DbSegment) => {
        if (!currentStory) return;

        setRegeneratingImageIndex(segment.segment_index);
        await regenerateImage(segment, handleSegmentUpdate);
        setRegeneratingImageIndex(null);
    }, [currentStory, regenerateImage, handleSegmentUpdate]);

    // Handle audio regeneration
    const handleRegenerateAudio = useCallback(async (segment: DbSegment) => {
        if (!currentStory) return;

        setRegeneratingAudioIndex(segment.segment_index);
        await regenerateAudio(segment, handleSegmentUpdate);
        setRegeneratingAudioIndex(null);
    }, [currentStory, regenerateAudio, handleSegmentUpdate]);

    // Handle video generation trigger
    const handleGenerateVideo = useCallback(async () => {
        if (!currentStory) return;
        await generateVideo(currentStory.id, currentStory.segments);
        refreshStories(); // To update the story with video status/url if needed later
    }, [currentStory, generateVideo, refreshStories]);

    // Show new story generator
    const handleNewStory = useCallback(() => {
        setCurrentStory(null);
        setShowGenerator(true);
        resetVideoState();
    }, [setCurrentStory, resetVideoState]);

    // Determine active video URL (either freshly generated or saved in story)
    const activeVideoUrl = generatedVideoUrl || currentStory?.video_url;

    // Parse the current phase from progress message
    const getPhaseInfo = (message: string | null | undefined) => {
        if (!message) return { phase: 0, description: 'Initializing...' };

        // Phase 1: Rendering segments
        if (message.includes('Phase 1/4')) {
            if (message.includes('opening card')) return { phase: 1, description: 'Creating opening card' };
            const match = message.match(/segment (\d+)\/(\d+)/);
            if (match) return { phase: 1, description: `Rendering segment ${match[1]} of ${match[2]}` };
            return { phase: 1, description: 'Rendering video segments' };
        }

        // Phase 2: Transcribing
        if (message.includes('Phase 2/4')) {
            const match = message.match(/segment (\d+)\/(\d+)/);
            if (match) return { phase: 2, description: `Transcribing segment ${match[1]} of ${match[2]}` };
            return { phase: 2, description: 'Transcribing audio' };
        }

        // Phase 3: Concatenating
        if (message.includes('Phase 3/4')) {
            if (message.includes('re-encoding')) return { phase: 3, description: 'Re-encoding video streams' };
            return { phase: 3, description: 'Combining all clips' };
        }

        // Phase 4: Subtitles
        if (message.includes('Phase 4/4')) return { phase: 4, description: 'Adding subtitles' };

        if (message.includes('Done')) return { phase: 4, description: 'Complete!' };

        return { phase: 0, description: message };
    };

    const currentPhaseInfo = getPhaseInfo(videoProgressMessage);

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* Mobile Header */}
            <Header
                onMenuClick={() => setIsMobileDrawerOpen(true)}
                onNewStory={handleNewStory}
                title={currentStory?.story_title}
            />

            {/* Mobile Drawer */}
            <MobileDrawer
                isOpen={isMobileDrawerOpen}
                onClose={() => setIsMobileDrawerOpen(false)}
                stories={stories}
                isLoading={isLoadingStories}
                selectedId={currentStory?.id || null}
                onSelect={handleSelectStory}
                onDelete={handleDeleteStory}
                onNewStory={handleNewStory}
                error={storiesError}
            />

            {/* Desktop Sidebar */}
            <Sidebar
                stories={stories}
                isLoading={isLoadingStories}
                selectedId={currentStory?.id || null}
                onSelect={handleSelectStory}
                onDelete={handleDeleteStory}
                onNewStory={handleNewStory}
                error={storiesError}
            />

            {/* Main Content */}
            <main className="lg:ml-[320px] transition-all duration-300 ease-in-out bg-slate-50/50 min-h-screen">
                <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full pt-20 lg:pt-12">
                    {showGenerator || !currentStory ? (
                        <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                            <div className="mb-10 text-center space-y-3">
                                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-xl shadow-primary/5 ring-1 ring-black/5 mb-4">
                                    <div className="p-2 bg-linear-to-br from-primary to-purple-600 rounded-xl">
                                        <Sparkles className="w-8 h-8 text-white fill-white/20" />
                                    </div>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                                    Craft Your <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-600">Viral Story</span>
                                </h1>
                                <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
                                    Transform your ideas into captivating video scripts with AI-powered visuals and narration.
                                </p>
                            </div>

                            <div className="w-full relative z-10 transition-all duration-300 hover:transform hover:scale-[1.01]">
                                <GenerationPanel
                                    onGenerate={handleGenerate}
                                    isGenerating={isGeneratingStory}
                                />
                            </div>

                            {storyError && (
                                <div className="mt-6 w-full p-4 bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-100/50 text-red-600 text-sm flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                    <div className="p-1.5 bg-red-100 rounded-full">
                                        <AlertCircle size={16} />
                                    </div>
                                    <span className="font-medium">{storyError}</span>
                                </div>
                            )}

                            {isGeneratingStory && (
                                <div className="mt-8 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 delay-150">
                                    <Card className="border-border/50 shadow-xl shadow-primary/5 bg-white/80 backdrop-blur-md">
                                        <CardHeader className="py-6">
                                            <CardTitle className="flex flex-col items-center gap-4 text-center">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                                    <div className="relative p-1 bg-white rounded-full ring-1 ring-border/50 shadow-sm">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary border-t-transparent" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="block text-lg font-bold text-foreground">Weaving your story...</span>
                                                    <CardDescription className="text-sm font-medium">Crafting scenes, writing scripts, and dreaming visually.</CardDescription>
                                                </div>
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                </div>
                            )}
                        </div>
                    ) : (
                        isGeneratingVideo || (videoStatus === 'generating') ? (
                            // Enhanced Video Generation View
                            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95">
                                <div className="relative w-full">
                                    <div className="absolute inset-0 bg-linear-to-r from-purple-500/20 via-pink-500/20 to-primary/20 blur-3xl rounded-full animate-pulse" />
                                    <div className="relative p-8 bg-white rounded-3xl shadow-2xl shadow-primary/10 border border-purple-100 flex flex-col items-center text-center space-y-6">

                                        {/* Animated Icon */}
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full animate-pulse" />
                                            <div className="relative p-4 bg-linear-to-br from-primary/10 to-purple-100 rounded-2xl">
                                                <Video className="w-12 h-12 text-primary animate-pulse" />
                                            </div>
                                            <div className="absolute -top-1 -right-1 flex h-4 w-4">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div className="space-y-1">
                                            <h2 className="text-3xl font-bold bg-linear-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                                Generating Your Video
                                            </h2>
                                            <p className="text-muted-foreground">Sit tight, magic is happening...</p>
                                        </div>

                                        {/* Main Progress Bar */}
                                        <div className="w-full max-w-md space-y-3">
                                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                                                <div
                                                    className="h-full bg-linear-to-r from-primary via-purple-500 to-pink-500 transition-all duration-500 ease-out relative shimmer-bg"
                                                    style={{ width: `${Math.max(5, videoProgress)}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                                    <p className="text-sm font-bold text-primary">{videoProgress}% Complete</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium">~2-3 minutes</p>
                                            </div>
                                        </div>

                                        {/* Current Phase Info */}
                                        {videoProgressMessage && (
                                            <div className="w-full max-w-md pt-6 border-t border-slate-100 space-y-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Phase</p>
                                                        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">
                                                            {currentPhaseInfo.phase}/4
                                                        </span>
                                                    </div>

                                                    {/* Phase Description */}
                                                    <div className="flex items-start gap-3 p-4 bg-linear-to-br from-slate-50 to-purple-50/30 rounded-xl border border-slate-100 shadow-sm">
                                                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <p className="text-sm font-semibold text-slate-800">
                                                                {currentPhaseInfo.description}
                                                            </p>
                                                            <p className="text-xs text-slate-500 font-mono">
                                                                {videoProgressMessage}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Phase Indicators */}
                                                    <div className="grid grid-cols-4 gap-3 pt-2">
                                                        {[
                                                            { name: 'Setup', icon: Film, phase: 1 },
                                                            { name: 'Transcribe', icon: Volume2, phase: 2 },
                                                            { name: 'Effects', icon: Wand2, phase: 3 },
                                                            { name: 'Finalize', icon: Zap, phase: 4 }
                                                        ].map(({ name, icon: Icon, phase }) => {
                                                            const isActive = currentPhaseInfo.phase === phase;
                                                            const isComplete = currentPhaseInfo.phase > phase;

                                                            return (
                                                                <div key={name} className="flex flex-col items-center gap-2 group">
                                                                    <div className={`
                                    relative w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold
                                    transition-all duration-300 shadow-sm
                                    ${isComplete
                                                                            ? 'bg-linear-to-br from-primary to-purple-600 text-white scale-95'
                                                                            : isActive
                                                                                ? 'bg-primary/10 text-primary ring-2 ring-primary ring-offset-2 scale-110'
                                                                                : 'bg-slate-100 text-slate-400'
                                                                        }
                                  `}>
                                                                        {isComplete ? (
                                                                            <span className="text-base">✓</span>
                                                                        ) : (
                                                                            <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                                                                        )}
                                                                        {isActive && (
                                                                            <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping" />
                                                                        )}
                                                                    </div>
                                                                    <span className={`
                                    text-[10px] font-semibold transition-colors tracking-wide
                                    ${isActive ? 'text-primary' : isComplete ? 'text-slate-600' : 'text-slate-400'}
                                  `}>
                                                                        {name}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Fun Facts or Tips (optional) */}
                                        <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                            <p className="text-xs text-blue-700">
                                                💡 <span className="font-semibold">Tip:</span> Your video is being rendered with professional-grade effects and subtitles!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Story Header */}
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-border/40">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase">
                                            <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">Story Dashboard</span>
                                            <span className="text-muted-foreground/40">•</span>
                                            <span className="text-muted-foreground">{currentStory.segments.length} Segments</span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                                            {currentStory.story_title}
                                        </h2>
                                        <p className="text-slate-500 font-medium max-w-2xl text-base flex items-center gap-2">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500" />
                                            Based on: "{currentStory.base_idea}"
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Video Generation Button */}
                                        {!activeVideoUrl && (
                                            <Button
                                                onClick={handleGenerateVideo}
                                                disabled={isGeneratingVideo}
                                                className="bg-slate-900 text-white hover:bg-slate-800 gap-2 font-semibold shadow-lg shadow-slate-900/10"
                                            >
                                                {isGeneratingVideo ? <Loader2 className="animate-spin w-4 h-4" /> : <Video className="w-4 h-4" />}
                                                Generate Video
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="hidden md:flex gap-2 border-border/60 hover:bg-slate-50 text-slate-600"
                                            onClick={() => {/* potential export or share action */ }}
                                        >
                                            Export Script
                                        </Button>
                                    </div>
                                </div>

                                {/* Video Player Display */}
                                {activeVideoUrl && (
                                    <div className="w-full max-w-4xl mx-auto mb-10">
                                        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 ring-1 ring-white/10 relative group aspect-video">
                                            <video
                                                src={activeVideoUrl}
                                                controls
                                                className="w-full h-full object-contain"
                                                poster={currentStory.segments[0]?.image_url || undefined}
                                            />
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const response = await fetch(activeVideoUrl);
                                                            const blob = await response.blob();
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `${currentStory.story_title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_video.mp4`;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            document.body.removeChild(a);
                                                            window.URL.revokeObjectURL(url);
                                                        } catch (error) {
                                                            console.error('Download failed:', error);
                                                        }
                                                    }}
                                                    className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
                                                >
                                                    <Download size={20} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">Final Production</h3>
                                                <p className="text-sm text-muted-foreground">Generated by ClipCraft</p>
                                            </div>
                                            <div className="flex gap-3 w-full sm:w-auto">
                                                <Button
                                                    onClick={async () => {
                                                        try {
                                                            const response = await fetch(activeVideoUrl);
                                                            const blob = await response.blob();
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `${currentStory.story_title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_video.mp4`;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            document.body.removeChild(a);
                                                            window.URL.revokeObjectURL(url);
                                                        } catch (error) {
                                                            console.error('Download failed:', error);
                                                        }
                                                    }}
                                                    className="flex-1 sm:flex-none bg-linear-to-r from-primary to-purple-600 text-white hover:from-primary/90 hover:to-purple-600/90 gap-2 font-semibold shadow-lg shadow-primary/20"
                                                >
                                                    <Download size={16} /> Download Video
                                                </Button>
                                                <Button
                                                    onClick={handleGenerateVideo}
                                                    variant="outline"
                                                    size="default"
                                                    className="gap-2 border-border/60"
                                                >
                                                    <Sparkles size={14} /> Regenerate
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Indicators */}
                                <div className="grid gap-4">
                                    {isGeneratingImages && imageProgress && (
                                        <div className="p-5 bg-white rounded-xl border border-violet-100 shadow-sm shadow-violet-500/5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="p-2.5 bg-violet-50 rounded-xl border border-violet-100">
                                                    <Images size={20} className="text-violet-600" />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-semibold text-violet-900">Generating Scenes</span>
                                                        <span className="text-violet-600 font-bold">{imageProgress.completed}/{imageProgress.total}</span>
                                                    </div>
                                                    <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-violet-600 transition-all duration-500 ease-out rounded-full"
                                                            style={{ width: `${(imageProgress.completed / imageProgress.total) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isGeneratingAudios && audioProgress && (
                                        <div className="p-5 bg-white rounded-xl border border-fuchsia-100 shadow-sm shadow-fuchsia-500/5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="p-2.5 bg-fuchsia-50 rounded-xl border border-fuchsia-100">
                                                    <Volume2 size={20} className="text-fuchsia-600" />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-semibold text-fuchsia-900">Synthesizing Narration</span>
                                                        <span className="text-fuchsia-600 font-bold">{audioProgress.completed}/{audioProgress.total}</span>
                                                    </div>
                                                    <div className="h-2 bg-fuchsia-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-fuchsia-600 transition-all duration-500 ease-out rounded-full"
                                                            style={{ width: `${(audioProgress.completed / audioProgress.total) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Generation Errors */}
                                {(imageErrors.length > 0 || audioErrors.length > 0 || videoError) && (
                                    <div className="p-4 bg-amber-50/80 backdrop-blur-sm rounded-xl border border-amber-200/60 shadow-sm">
                                        <p className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                                            <AlertCircle size={18} />
                                            Attention Required
                                        </p>
                                        <ul className="text-sm text-amber-700/80 space-y-1 list-disc list-inside">
                                            {imageErrors.map((err) => (
                                                <li key={`img-${err.index}`}>Image {err.index + 1}: {err.message}</li>
                                            ))}
                                            {audioErrors.map((err) => (
                                                <li key={`aud-${err.index}`}>Audio {err.index + 1}: {err.message}</li>
                                            ))}
                                            {videoError && <li key="video-err" className="text-red-600 font-medium">Video Generation: {videoError}</li>}
                                        </ul>
                                    </div>
                                )}

                                {/* Story Segments Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {(isGeneratingStory ? [1, 2, 3, 4, 5, 6] : currentStory.segments).map((item, i) => (
                                        isGeneratingStory ? (
                                            <StoryCardSkeleton key={i} />
                                        ) : (
                                            <StoryCard
                                                key={(item as DbSegment).id}
                                                segment={item as DbSegment}
                                                isGeneratingImage={
                                                    regeneratingImageIndex === (item as DbSegment).segment_index ||
                                                    (isGeneratingImages && imageProgress?.currentIndex === (item as DbSegment).segment_index && !(item as DbSegment).image_url)
                                                }
                                                isGeneratingAudio={
                                                    regeneratingAudioIndex === (item as DbSegment).segment_index ||
                                                    (isGeneratingAudios && audioProgress?.currentIndex === (item as DbSegment).segment_index && !(item as DbSegment).audio_url)
                                                }
                                                onRegenerateImage={() => handleRegenerateImage(item as DbSegment)}
                                                onRegenerateAudio={() => handleRegenerateAudio(item as DbSegment)}
                                            />
                                        )
                                    ))}
                                </div>

                                {/* Data Preview */}
                                <div className="mt-12 pt-8 border-t border-border/40">
                                    <JsonPreview
                                        data={currentStory.segments}
                                        title={`Story Data Source`}
                                    />
                                </div>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}
