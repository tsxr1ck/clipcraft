import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Loader2, Sparkles, AlertCircle, Palette, Type } from 'lucide-react';
import type { CreateSeriesRequest } from '../../types/series';
import { StylePicker } from '../StylePicker';
import {
    VisualStyleKey,
    ScriptStyleKey,
    VISUAL_STYLE_METADATA,
    SCRIPT_STYLE_METADATA
} from '../../types/styles';

interface SeriesCreatorProps {
    onGenerate: (request: CreateSeriesRequest) => Promise<void>;
    isGenerating: boolean;
    error?: string | null;
}

export function SeriesCreator({ onGenerate, isGenerating, error }: SeriesCreatorProps) {
    const [baseConcept, setBaseConcept] = useState('');
    const [plannedSeasons, setPlannedSeasons] = useState(1);
    const [episodesPerSeason, setEpisodesPerSeason] = useState(6);
    const [visualStyle, setVisualStyle] = useState<string>(VisualStyleKey.CinematicRealistic);
    const [scriptStyle, setScriptStyle] = useState<string>(ScriptStyleKey.DramaticTelenovela);
    const [targetDuration, setTargetDuration] = useState(180);

    const VISUAL_STYLE_OPTIONS = Object.values(VISUAL_STYLE_METADATA).map(m => ({
        id: m.key,
        name: m.label,
        description: m.description
    }));

    const SCRIPT_STYLE_OPTIONS = Object.values(SCRIPT_STYLE_METADATA).map(m => ({
        id: m.key,
        name: m.label,
        description: m.description
    }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onGenerate({
            base_concept: baseConcept,
            planned_seasons: plannedSeasons,
            episodes_per_season: episodesPerSeason,
            visual_style: visualStyle,
            script_style: scriptStyle,
            target_duration_per_episode: targetDuration
        });
    };

    const isFormValid = baseConcept.length >= 50;

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-xl border-t-4 border-t-primary/20">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles size={120} />
            </div>

            <CardHeader className="bg-linear-to-r from-slate-50 to-slate-100/50 pb-8 border-b border-slate-100">
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-purple-600 flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-primary" />
                    Create New Series
                </CardTitle>
                <CardDescription className="text-lg text-slate-500">
                    Define your series universe and let AI craft the lore, characters, and season arcs.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Base Concept */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-900 flex justify-between">
                            Series Concept
                            <span className={`text-xs ${baseConcept.length < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                                {baseConcept.length} / 50 min chars
                            </span>
                        </label>
                        <Textarea
                            placeholder="Describe your series... e.g., 'A horror series about a haunted lighthouse keeper in the 1920s who discovers ancient cosmic entities living beneath the waves.'"
                            className="min-h-[120px] text-lg p-4 resize-y bg-slate-50 focus:bg-white transition-colors"
                            value={baseConcept}
                            onChange={(e) => setBaseConcept(e.target.value)}
                            disabled={isGenerating}
                        />
                        <p className="text-xs text-slate-500">
                            Provide the core premise, tone, and any specific elements you want to include.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Structure Settings */}
                        <div className="space-y-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <span className="w-1 h-4 bg-primary rounded-full"></span>
                                Structure
                            </h3>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-700">Planned Seasons (1-5)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={plannedSeasons}
                                    onChange={(e) => setPlannedSeasons(parseInt(e.target.value))}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                                    disabled={isGenerating}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-700">Episodes per Season (3-12)</label>
                                <input
                                    type="number"
                                    min={3}
                                    max={12}
                                    value={episodesPerSeason}
                                    onChange={(e) => setEpisodesPerSeason(parseInt(e.target.value))}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                                    disabled={isGenerating}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-700">Duration per Episode</label>
                                <select
                                    value={targetDuration}
                                    onChange={(e) => setTargetDuration(parseInt(e.target.value))}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                                    disabled={isGenerating}
                                >
                                    <option value={60}>1 Minute</option>
                                    <option value={120}>2 Minutes</option>
                                    <option value={180}>3 Minutes</option>
                                    <option value={240}>4 Minutes</option>
                                    <option value={300}>5 Minutes</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <StylePicker
                                title="Visual Style"
                                icon={<Palette size={16} strokeWidth={2.5} />}
                                options={VISUAL_STYLE_OPTIONS}
                                selectedId={visualStyle}
                                onSelect={setVisualStyle}
                                imageBasePath="/assets/styles"
                            />

                            <StylePicker
                                title="Script Tone"
                                icon={<Type size={16} strokeWidth={2.5} />}
                                options={SCRIPT_STYLE_OPTIONS}
                                selectedId={scriptStyle}
                                onSelect={setScriptStyle}
                                imageBasePath="/assets/scripts"
                                aspectRatio="video"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100 animate-in slide-in-from-bottom-2">
                            <AlertCircle size={20} />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={!isFormValid || isGenerating}
                            className={`w-full h-14 text-lg font-bold shadow-xl transition-all duration-300 ${isGenerating ? 'bg-slate-100 text-slate-400' : 'bg-linear-to-r from-primary to-purple-600 hover:scale-[1.01] hover:shadow-primary/25'
                                }`}
                        >
                            {isGenerating ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="animate-spin" />
                                    <span>Creating your series universe...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Sparkles className="fill-white/20" />
                                    <span>Generate Series</span>
                                </div>
                            )}
                        </Button>
                        <p className="text-center text-xs text-slate-400 mt-4">
                            AI will generate the lore, characters, and season arcs based on your concept.
                        </p>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}