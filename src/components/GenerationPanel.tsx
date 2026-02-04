import { useState, useEffect } from 'react';
import { Sparkles, Wand2, Clock, Palette, Type, Loader2, CheckCircle2, History as HistoryIcon, Plus } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import {
    VisualStyleKey,
    VisualStyleLabel,
    ScriptStyleKey,
    ScriptStyleLabel,
    VISUAL_STYLE_METADATA,
    SCRIPT_STYLE_METADATA
} from '../types/styles';
import { StylePicker } from './StylePicker';
import { GenerationHistory } from './GenerationHistory';

interface GenerationPanelProps {
    onGenerate: (
        baseIdea: string,
        duration: number,
        visualStyle: VisualStyleKey | VisualStyleLabel,
        scriptStyle: ScriptStyleKey | ScriptStyleLabel
    ) => void | Promise<void>;
    isGenerating: boolean;
}

const GENERATION_STEPS = [
    { label: 'Initializing quantum narrative engine...', delay: 0 },
    { label: 'Analyzing concepts and themes...', delay: 1500 },
    { label: 'Crafting script in target tone...', delay: 3000 },
    { label: 'Designing visual prompts...', delay: 5500 },
    { label: 'Structuring timeline segments...', delay: 8000 },
    { label: 'Finalizing story output...', delay: 9500 },
];

export function GenerationPanel({ onGenerate, isGenerating }: GenerationPanelProps) {
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [baseIdea, setBaseIdea] = useState('');
    const [selectedDuration, setSelectedDuration] = useState(30);
    const [visualStyle, setVisualStyle] = useState<VisualStyleKey | VisualStyleLabel>(VisualStyleKey.CinematicRealistic);
    const [scriptStyle, setScriptStyle] = useState<ScriptStyleKey | ScriptStyleLabel>(ScriptStyleKey.DramaticTelenovela);

    // Status state
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    useEffect(() => {
        if (isGenerating) {
            setActiveTab('create');
            setCurrentStepIndex(0);
            const timers = GENERATION_STEPS.map((step, index) => {
                if (index === 0) return null;
                return setTimeout(() => {
                    setCurrentStepIndex(index);
                }, step.delay);
            });
            return () => timers.forEach(t => t && clearTimeout(t));
        } else {
            setCurrentStepIndex(0);
        }
    }, [isGenerating]);

    const handleSubmit = () => {
        if (baseIdea.trim()) {
            onGenerate(baseIdea, selectedDuration, visualStyle, scriptStyle);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
        }
    };

    if (isGenerating) {
        return (
            <div className="flex flex-col gap-6 p-8 bg-card rounded-2xl border border-border/50 shadow-xl shadow-primary/5 ring-1 ring-border/50 relative overflow-hidden min-h-[400px] justify-center items-center">
                {/* Background Ambient */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-700" />

                <div className="relative z-10 flex flex-col items-center max-w-md w-full gap-8">

                    {/* Central Loader */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-ping opacity-20" />
                        <div className="relative bg-card p-4 rounded-full border border-primary/20 shadow-lg ring-4 ring-primary/5">
                            <Loader2 size={48} className="text-primary animate-spin" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 text-center">
                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-purple-600">
                            Forging Your Story
                        </h3>
                        <p className="text-muted-foreground animate-pulse">
                            {GENERATION_STEPS[currentStepIndex]?.label || 'Processing...'}
                        </p>
                    </div>

                    {/* Steps Progress */}
                    <div className="w-full flex flex-col gap-3">
                        {GENERATION_STEPS.map((step, idx) => {
                            const isCompleted = idx < currentStepIndex;
                            const isCurrent = idx === currentStepIndex;

                            return (
                                <div key={idx} className={`flex items-center gap-3 transition-all duration-500 ${isCurrent || isCompleted ? 'opacity-100' : 'opacity-30'}`}>
                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center text-[10px] border
                                        ${isCompleted ? 'bg-primary border-primary text-white' :
                                            isCurrent ? 'border-primary text-primary animate-pulse' : 'border-muted text-muted-foreground'}
                                    `}>
                                        {isCompleted ? <CheckCircle2 size={14} /> : (idx + 1)}
                                    </div>
                                    <span className={`text-sm font-medium ${isCurrent ? 'text-primary' : ''}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 p-1 bg-card rounded-3xl border border-border/50 shadow-xl shadow-primary/5 ring-1 ring-border/50 relative overflow-hidden group">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-700" />

            {/* Tab Navigation */}
            <div className="flex items-center p-2 gap-2 relative z-10 border-b border-border/40 bg-zinc-50/50">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'create' ? 'bg-white shadow-sm ring-1 ring-black/5 text-primary' : 'text-muted-foreground hover:bg-white/50'}`}
                >
                    <Plus size={16} /> New Story
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'history' ? 'bg-white shadow-sm ring-1 ring-black/5 text-primary' : 'text-muted-foreground hover:bg-white/50'}`}
                >
                    <HistoryIcon size={16} /> History
                </button>
            </div>

            <div className={`p-6 pt-2 relative z-10 min-h-[400px] ${activeTab === 'history' ? 'bg-zinc-50/30' : ''}`}>

                {activeTab === 'create' ? (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-linear-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/30 ring-4 ring-primary/10">
                                <Wand2 size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="font-bold text-xl text-foreground tracking-tight">Create New Story</h2>
                                <p className="text-sm text-muted-foreground font-medium mt-0.5">Describe your video idea and let AI do the magic</p>
                            </div>
                        </div>

                        <Textarea
                            value={baseIdea}
                            onChange={(e) => setBaseIdea(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your base idea... (e.g., 'A lone astronaut discovers an ancient alien library on a distant moon')"
                            className="min-h-[140px] bg-background border-input focus:border-primary focus:ring-primary/20 resize-none text-base p-5 rounded-xl shadow-inner relative z-10 transition-all duration-200 hover:border-primary/50 mb-6"
                            disabled={isGenerating}
                        />

                        <div className="flex flex-col gap-6 w-full">
                            {/* Duration */}
                            <div className="flex flex-col gap-2.5">
                                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider pl-1">
                                    <Clock size={12} strokeWidth={2.5} />
                                    Video Duration
                                </p>
                                <div className="flex items-center gap-2">
                                    {[30, 50, 80].map((duration) => (
                                        <button
                                            key={duration}
                                            onClick={() => setSelectedDuration(duration)}
                                            disabled={isGenerating}
                                            className={`
                                                px-4 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm
                                                ${selectedDuration === duration
                                                    ? 'bg-primary/10 text-primary border-primary/20 ring-2 ring-primary/10 shadow-primary/10'
                                                    : 'bg-background text-muted-foreground border-border hover:border-primary/30 hover:bg-muted/50'}
                                            `}
                                        >
                                            {duration}s <span className="opacity-60 text-[10px] ml-1 font-normal">({Math.round(duration / 10)} segs)</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-8">
                                <StylePicker
                                    title="Visual Style"
                                    icon={<Palette size={16} strokeWidth={2.5} />}
                                    options={Object.values(VISUAL_STYLE_METADATA).map(m => ({
                                        id: m.key,
                                        name: m.label,
                                        description: m.description
                                    }))}
                                    selectedId={visualStyle}
                                    onSelect={(id) => setVisualStyle(id as VisualStyleKey)}
                                    imageBasePath="/assets/styles"
                                />

                                <StylePicker
                                    title="Script Tone"
                                    icon={<Type size={16} strokeWidth={2.5} />}
                                    options={Object.values(SCRIPT_STYLE_METADATA).map(m => ({
                                        id: m.key,
                                        name: m.label,
                                        description: m.description
                                    }))}
                                    selectedId={scriptStyle}
                                    onSelect={(id) => setScriptStyle(id as ScriptStyleKey)}
                                    imageBasePath="/assets/scripts"
                                    aspectRatio="video"
                                />
                            </div>
                        </div>

                        <div className="flex items-end justify-end md:w-auto mt-6">
                            <Button
                                onClick={handleSubmit}
                                disabled={!baseIdea.trim() || isGenerating}
                                className="w-full md:w-auto gap-2.5 bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 rounded-xl px-8 h-12 text-sm font-bold tracking-wide"
                            >
                                <Sparkles size={18} strokeWidth={2.5} className="fill-white/20" />
                                <span>Generate Story</span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <GenerationHistory />
                    </div>
                )}
            </div>
        </div>
    );
}
