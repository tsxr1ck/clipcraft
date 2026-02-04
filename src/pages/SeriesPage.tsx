import { useState, useCallback } from 'react';
import { useSeriesManager } from '../hooks/useSeriesManager';
import { SeriesCreator } from '../components/series/SeriesCreator';
import { SeriesList } from '../components/series/SeriesList';
import { SeriesDetail } from '../components/series/SeriesDetail';
import { EpisodeProduction } from '../components/series/EpisodeProduction';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { MobileDrawer } from '../components/MobileDrawer';
import { useStoredStories } from '../hooks/useStoredStories';
import { Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SeriesPage() {
    const navigate = useNavigate();
    const {
        view,
        series,
        activeSeries,
        activeEpisode,
        isLoading,
        isGenerating,
        error,
        goToList,
        goToCreate,
        goToDetail,
        goToProduction,
        createSeries,
        generateSeasonEpisodes,
        deleteSeries
    } = useSeriesManager();

    const {
        stories,
        isLoading: isLoadingStories,
        error: storiesError,
        deleteStory
    } = useStoredStories();

    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    // Sidebar/Drawer selection goes back to Story Dashboard (for now)
    const handleSelectStory = useCallback((_story: any) => {
        navigate('/');
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* Mobile Header */}
            <Header
                onMenuClick={() => setIsMobileDrawerOpen(true)}
                onNewStory={() => navigate('/')} // Redirect to story creation
                title={view === 'detail' ? activeSeries?.title : 'Series Universe'}
            />

            {/* Mobile Drawer */}
            <MobileDrawer
                isOpen={isMobileDrawerOpen}
                onClose={() => setIsMobileDrawerOpen(false)}
                stories={stories}
                isLoading={isLoadingStories}
                selectedId={null}
                onSelect={handleSelectStory}
                onDelete={deleteStory}
                onNewStory={() => navigate('/')}
                error={storiesError}
            />

            {/* Desktop Sidebar */}
            <Sidebar
                stories={stories}
                isLoading={isLoadingStories}
                selectedId={null}
                onSelect={handleSelectStory}
                onDelete={deleteStory}
                onNewStory={() => navigate('/')}
                error={storiesError}
            />

            {/* Main Content */}
            <main className="lg:ml-[320px] transition-all duration-300 ease-in-out bg-slate-50/50 min-h-screen">
                <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full pt-20 lg:pt-12">

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in">
                            <AlertCircle size={20} />
                            <p className="font-medium">{error}</p>
                            <button onClick={goToList} className="ml-auto underline">Go Back</button>
                        </div>
                    )}

                    {view === 'list' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Your Series</h1>
                                    <p className="text-slate-500">Manage your cinematic universes and episodic content.</p>
                                </div>
                            </div>
                            <SeriesList
                                series={series}
                                isLoading={isLoading}
                                onSelectSeries={(s) => goToDetail(s.id)}
                                onNewSeries={goToCreate}
                            />
                        </div>
                    )}

                    {view === 'create' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <button
                                onClick={goToList}
                                className="mb-6 text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
                            >
                                ← Back to List
                            </button>
                            <SeriesCreator
                                onGenerate={createSeries}
                                isGenerating={isGenerating}
                                error={error}
                            />
                        </div>
                    )}

                    {view === 'detail' && activeSeries && (
                        <SeriesDetail
                            series={activeSeries}
                            isGeneratingEpisodes={isGenerating}
                            onGenerateEpisodes={generateSeasonEpisodes}
                            onSelectEpisode={(ep) => goToProduction(ep.id)}
                            onBack={goToList}
                            onDelete={() => deleteSeries(activeSeries.id)}
                        />
                    )}

                    {view === 'production' && activeEpisode && activeSeries && (
                        <EpisodeProduction
                            episode={activeEpisode}
                            seriesContext={{
                                title: activeSeries.title,
                                full_lore: activeSeries.full_lore,
                                visual_style: activeSeries.visual_style,
                                script_style: activeSeries.script_style,
                                main_characters: activeSeries.main_characters
                            }}
                            onBack={() => goToDetail(activeSeries.id)}
                            onUpdateEpisode={(id) => goToProduction(id)} // Refresh
                        />
                    )}

                    {isLoading && !activeSeries && !activeEpisode && (
                        <div className="flex flex-col items-center justify-center min-h-[50vh]">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Loading your universe...</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
