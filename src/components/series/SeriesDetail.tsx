import { useState } from 'react';
import {
    ChevronLeft, Edit, Trash2, BookOpen, Users, Tv,
    Sparkles, Film, Clock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import type { SeriesWithEpisodes, Episode } from '../../types/series';
import { EpisodeCard } from './EpisodeCard';
import { CharactersTab } from './CharactersTab';
import { CharacterService } from '../../services/characterService';
import { SeriesTokenUsage } from '../TokenUsagePanel';

interface SeriesDetailProps {
    series: SeriesWithEpisodes;
    isGeneratingEpisodes: boolean;
    onGenerateEpisodes: (seasonNumber: number) => Promise<void>;
    onSelectEpisode: (episode: Episode) => void;
    onBack: () => void;
    onDelete: () => Promise<void>;
    onRefresh?: () => Promise<void>; // To refresh series data after migration
}

export function SeriesDetail({
    series,
    isGeneratingEpisodes,
    onGenerateEpisodes,
    onSelectEpisode,
    onBack,
    onDelete,
    onRefresh
}: SeriesDetailProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'characters'>('overview');
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'episodes', label: `Season ${selectedSeason}`, icon: Tv },
        { id: 'characters', label: 'Characters', icon: Users },
    ];

    const currentSeasonEpisodes = series.episodes.filter(e => e.season_number === selectedSeason);

    const handleMigrateCharacters = async () => {
        try {
            await CharacterService.migrateSeriesCharacters(series.id);
            // Refresh series data
            if (onRefresh) {
                await onRefresh();
            }
        } catch (error) {
            console.error('Character migration failed:', error);
            throw error;
        }
    };

    const handleGeneratePoster = async () => {
        try {
            setIsGeneratingPoster(true);
            await CharacterService.generateSeriesPoster(series.id);
            if (onRefresh) {
                await onRefresh();
            }
        } catch (error) {
            console.error('Poster generation failed:', error);
            alert('Failed to generate poster. Please try again.');
        } finally {
            setIsGeneratingPoster(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    className="pl-0 hover:pl-2 transition-all text-slate-500 hover:text-slate-900"
                    onClick={onBack}
                >
                    <ChevronLeft size={16} className="mr-1" /> Back to Series
                </Button>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {series.genre.map(g => (
                                <span key={g} className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                                    {g}
                                </span>
                            ))}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${series.status === 'in_production' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                {series.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                            {series.title}
                        </h1>
                        <p className="text-xl text-slate-500 font-medium max-w-3xl leading-relaxed">
                            {series.tagline || series.base_concept}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="border-slate-200">
                            <Edit size={16} className="mr-2" /> Edit
                        </Button>
                        <Button
                            variant="destructive"
                            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none hover:shadow-sm"
                            onClick={() => {
                                if (window.confirm('Are you sure? This will delete all episodes and data.')) {
                                    onDelete();
                                }
                            }}
                        >
                            <Trash2 size={16} className="mr-2" /> Delete
                        </Button>
                    </div>
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex items-center gap-8">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center gap-2 pb-4 text-sm font-semibold transition-all relative
                                    ${isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-800'}
                                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-300">
                        {/* Main Lore */}
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="border-slate-100 shadow-sm bg-white">
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                                        <BookOpen className="text-primary" size={24} />
                                        <h3 className="text-xl font-bold text-slate-900">Series Lore & Bible</h3>
                                    </div>
                                    <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {series.full_lore}
                                    </div>
                                </CardContent>
                            </Card>

                            {series.setting && (
                                <Card className="border-slate-100 shadow-sm bg-slate-50/50">
                                    <CardContent className="p-6">
                                        <h4 className="font-bold text-slate-900 mb-2">Setting</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed">{series.setting}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Series Poster Card */}
                            <Card className="overflow-hidden border-slate-200 shadow-md group relative">
                                {series.series_poster_url ? (
                                    <div className="aspect-2/3 relative">
                                        <img
                                            src={series.series_poster_url}
                                            alt={`${series.title} Poster`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30"
                                                onClick={handleGeneratePoster}
                                                disabled={isGeneratingPoster}
                                            >
                                                <Sparkles size={14} className="mr-2" />
                                                {isGeneratingPoster ? 'Generating...' : 'Regenerate Poster'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-2/3 bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
                                        <Film size={48} className="text-slate-300 mb-4" />
                                        <h4 className="font-bold text-slate-900 mb-2">No Poster Yet</h4>
                                        <p className="text-xs text-slate-500 mb-6 font-medium">
                                            Generate a stunning cinematic poster for your series.
                                        </p>
                                        <Button
                                            onClick={handleGeneratePoster}
                                            disabled={isGeneratingPoster}
                                            className="w-full shadow-lg shadow-primary/20 bg-linear-to-r from-primary to-purple-600 border-none h-11"
                                        >
                                            {isGeneratingPoster ? (
                                                <>Generating...</>
                                            ) : (
                                                <>
                                                    <Sparkles size={16} className="mr-2" />
                                                    Generate Poster
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </Card>

                            <Card className="border-slate-100 shadow-sm bg-white sticky top-4">
                                <CardContent className="p-6 space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 mb-4">Production Info</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3 text-slate-600">
                                                    <Tv size={18} />
                                                    <span>Seasons</span>
                                                </div>
                                                <span className="font-bold text-slate-900">{series.planned_seasons}</span>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3 text-slate-600">
                                                    <Film size={18} />
                                                    <span>Episodes/Season</span>
                                                </div>
                                                <span className="font-bold text-slate-900">{series.episodes_per_season}</span>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3 text-slate-600">
                                                    <Film size={18} />
                                                    <span>Styles</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-slate-900 capitalize">{series.visual_style?.replace(/_/g, ' ')}</div>
                                                    <div className="text-[10px] text-slate-400 capitalize">{series.script_style?.replace(/_/g, ' ')}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3 text-slate-600">
                                                    <Clock size={18} />
                                                    <span>Runtime</span>
                                                </div>
                                                <span className="font-bold text-slate-900">
                                                    {Math.floor(series.target_duration_per_episode / 60)} mins/ep
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Token Usage Section */}
                                    <div className="pt-6 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <span>🪙</span> Token Usage
                                        </h4>
                                        <SeriesTokenUsage
                                            seriesId={series.id}
                                            variant="compact"
                                            showBreakdown={false}
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-900 mb-3">Themes</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {series.themes.map(t => (
                                                <span key={t} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-100">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* EPISODES TAB */}
                {activeTab === 'episodes' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Season Selector */}
                        <div className="flex items-center gap-4 py-4 overflow-x-auto">
                            {Array.from({ length: series.planned_seasons }).map((_, i) => {
                                const seasonNum = i + 1;
                                const isActive = selectedSeason === seasonNum;
                                return (
                                    <button
                                        key={seasonNum}
                                        onClick={() => setSelectedSeason(seasonNum)}
                                        className={`
                                            px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                                            ${isActive
                                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}
                                        `}
                                    >
                                        Season {seasonNum}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Episodes Grid or Empty State */}
                        {currentSeasonEpisodes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentSeasonEpisodes
                                    .sort((a, b) => a.episode_number - b.episode_number)
                                    .map((episode) => (
                                        <EpisodeCard
                                            key={episode.id}
                                            episode={episode}
                                            onClick={() => onSelectEpisode(episode)}
                                            onProduceEpisode={(e) => {
                                                e.stopPropagation();
                                                onSelectEpisode(episode);
                                            }}
                                        />
                                    ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                                    <Sparkles className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    Season {selectedSeason} Not Generated
                                </h3>
                                <p className="text-slate-500 mb-8 max-w-md text-center">
                                    Ready to write the next chapter? AI will generate episode concepts outlining the arc for this season.
                                </p>
                                <Button
                                    onClick={() => onGenerateEpisodes(selectedSeason)}
                                    disabled={isGeneratingEpisodes}
                                    className="bg-linear-to-r from-primary to-purple-600 shadow-lg shadow-primary/20 h-12 px-8"
                                >
                                    {isGeneratingEpisodes ? (
                                        <>Generating Concepts...</>
                                    ) : (
                                        <>Generate Season {selectedSeason} Arc</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* CHARACTERS TAB - NEW */}
                {activeTab === 'characters' && (
                    <CharactersTab
                        seriesId={series.id}
                        seriesVisualStyle={series.visual_style || 'cinematic-realistic'}
                        hasMigratedCharacters={!!series.main_characters && Array.isArray(series.main_characters) && series.main_characters.length > 0}
                        onMigrateCharacters={handleMigrateCharacters}
                    />
                )}
            </div>
        </div>
    );
}