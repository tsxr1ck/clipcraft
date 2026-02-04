import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../../components/Sidebar';
import { MobileDrawer } from '../../../components/MobileDrawer';
import { Button } from '../../../components/ui/button';
import { VideoGeneratorUI } from '../components/VideoGeneratorUI';
import { WanStoryService } from '../services/wanStoryService';
import { supabase } from '../../../lib/supabase';
import { Plus, Film, Loader2, ChevronRight, Wand2, Sparkles } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { StylePicker } from '../../../components/StylePicker';
import { VISUAL_STYLE_KEYS, VISUAL_STYLE_METADATA } from '../../../types/styles';
import { Slider } from '../../../components/ui/slider';

export const WanVideoPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // State
    const [stories, setStories] = useState<any[]>([]);
    const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Creation Form
    const [premise, setPremise] = useState('');
    const [selectedStyleKey, setSelectedStyleKey] = useState<string>('cinematic-realistic');
    const [segmentCount, setSegmentCount] = useState<number>(3);
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        const { data } = await (supabase as any)
            .from('wan_stories')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setStories(data);
    };

    const handleCreateStory = async () => {
        if (!premise.trim()) return;

        setIsGeneratingStory(true);
        try {
            // Get the readable label for the LLM
            const styleLabel = VISUAL_STYLE_METADATA[selectedStyleKey as keyof typeof VISUAL_STYLE_METADATA]?.label || 'Cinematic';
            const storyId = await WanStoryService.generateStoryFromPremise(premise, styleLabel, segmentCount);
            await fetchStories();
            setSelectedStoryId(storyId);
            setIsCreating(false);
            setPremise('');
        } catch (e) {
            console.error(e);
            alert('Failed to generate story. Check console.');
        } finally {
            setIsGeneratingStory(false);
        }
    };

    const selectedStory = stories.find(s => s.id === selectedStoryId);

    // Prepare Style Options
    const styleOptions = VISUAL_STYLE_KEYS.map(key => ({
        id: key,
        name: VISUAL_STYLE_METADATA[key].label,
        description: VISUAL_STYLE_METADATA[key].description
    }));

    return (
        <div className="flex h-screen bg-neutral-50 font-sans text-slate-900">
            {/* Main Sidebar */}
            <div className="hidden md:block w-64 border-r bg-sidebar border-sidebar-border shrink-0">
                <Sidebar />
            </div>

            {/* Mobile Drawer */}
            <MobileDrawer isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b bg-white px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <span className="sr-only">Menu</span>
                            <svg width="24" height="24" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1.5 7.5C1.22386 7.5 1 7.72386 1 8C1 8.27614 1.22386 8.5 1.5 8.5H13.5C13.7761 8.5 14 8.27614 14 8C14 7.72386 13.7761 7.5 13.5 7.5H1.5ZM1.5 12C1.22386 12 1 12.2239 1 12.5C1 12.7761 1.22386 13 1.5 13H13.5C13.7761 13 14 12.7761 14 12.5C14 12.2239 13.7761 12 13.5 12H1.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                        </Button>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                            Video Lab (Wan2.6)
                        </h1>
                    </div>
                </header>

                {/* Main Split View */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left: Story List */}
                    <div className="w-80 border-r bg-white flex flex-col shrink-0">
                        <div className="p-4 border-b">
                            <Button
                                onClick={() => { setIsCreating(true); setSelectedStoryId(null); }}
                                className="w-full justify-start gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <Plus size={18} />
                                New Story
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {stories.map(story => (
                                <button
                                    key={story.id}
                                    onClick={() => { setSelectedStoryId(story.id); setIsCreating(false); }}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl border transition-all duration-200 group relative",
                                        selectedStoryId === story.id
                                            ? "border-purple-200 bg-purple-50 ring-1 ring-purple-200"
                                            : "border-transparent hover:bg-slate-50"
                                    )}
                                >
                                    <div className="font-semibold text-slate-800 truncate pr-4">{story.title}</div>
                                    <div className="text-xs text-slate-500 truncate mt-1">{story.visual_style}</div>
                                    {selectedStoryId === story.id && (
                                        <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Workspace */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">

                        {isCreating ? (
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="text-center space-y-2">
                                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Wand2 size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">Create a New Story</h2>
                                    <p className="text-slate-500">
                                        Describe your idea, select a style, and let AI generate the script.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* Premise */}
                                    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                                        <label className="block text-sm font-medium text-slate-700">Story Premise / Idea</label>
                                        <textarea
                                            className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none font-medium"
                                            placeholder="e.g. A cyberpunk detective searching for a lost android in a neon-lit market..."
                                            value={premise}
                                            onChange={(e) => setPremise(e.target.value)}
                                            disabled={isGeneratingStory}
                                        />
                                    </div>

                                    {/* Style Picker */}
                                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                        <StylePicker
                                            title="Visual Style"
                                            icon={<Sparkles size={16} />}
                                            options={styleOptions}
                                            selectedId={selectedStyleKey}
                                            onSelect={setSelectedStyleKey}
                                            imageBasePath="/assets/styles"
                                            aspectRatio="square"
                                        />
                                    </div>

                                    {/* Segment Count */}
                                    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <label className="block text-sm font-medium text-slate-700">
                                                    Duration / Segments
                                                </label>
                                                <p className="text-xs text-slate-500">
                                                    Each segment is ~5 seconds. Total video: ~{segmentCount * 5}s
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                                                {segmentCount} Segments
                                            </span>
                                        </div>
                                        <Slider
                                            value={[segmentCount]}
                                            onValueChange={(val) => setSegmentCount(val[0])}
                                            min={1}
                                            max={10}
                                            step={1}
                                            className="w-full py-4"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            onClick={handleCreateStory}
                                            disabled={!premise.trim() || isGeneratingStory}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 h-12 text-lg"
                                        >
                                            {isGeneratingStory ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Generating Script...
                                                </>
                                            ) : (
                                                <>
                                                    <Wand2 className="mr-2 h-5 w-5" />
                                                    Generate Story
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : selectedStory ? (
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{selectedStory.title}</h1>
                                    <div className="flex gap-4 text-sm text-slate-500 mb-4">
                                        <span className="bg-slate-100 px-2 py-1 rounded">Style: {selectedStory.visual_style}</span>
                                        <span>•</span>
                                        <span>Original Premise: {selectedStory.premise}</span>
                                    </div>
                                    <div className="h-px bg-slate-100 my-4" />

                                    {/* Video Generator UI Injection */}
                                    <VideoGeneratorUI storyId={selectedStory.id} />
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Film size={48} className="mb-4 opacity-20" />
                                <p>Select a story or create a new one to begin</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
