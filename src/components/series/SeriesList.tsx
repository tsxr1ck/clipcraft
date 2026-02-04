import { Plus, Film, Sparkles, Tv, Calendar, Tag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Series } from '../../types/series';

interface SeriesListProps {
    series: Series[];
    isLoading: boolean;
    onSelectSeries: (series: Series) => void;
    onNewSeries: () => void;
}

export function SeriesList({ series, isLoading, onSelectSeries, onNewSeries }: SeriesListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden border-slate-100 shadow-sm">
                        <div className="h-48 bg-slate-100 animate-pulse" />
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (series.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-white rounded-full shadow-xl shadow-primary/5 flex items-center justify-center mb-6 ring-4 ring-primary/5">
                    <Film className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No Series Yet</h3>
                <p className="text-slate-500 max-w-md mb-8 text-lg">
                    Start building your cinematic universe. Create multi-episode series with persistent characters and lore.
                </p>
                <Button
                    onClick={onNewSeries}
                    className="h-12 px-8 text-base bg-linear-to-r from-primary to-purple-600 hover:scale-105 transition-transform shadow-lg shadow-primary/20 gap-2"
                >
                    <Sparkles className="w-5 h-5 fill-white/20" />
                    Create Your First Series
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {series.map((item, index) => (
                <Card
                    key={item.id}
                    className="group hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden border-slate-100 bg-white"
                    onClick={() => onSelectSeries(item)}
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="h-2 bg-linear-to-r from-primary to-purple-500" />
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-4">
                            <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                                {item.title}
                            </CardTitle>
                            <span className={`
                                px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                                ${item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    item.status === 'in_production' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-500'}
                            `}>
                                {item.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        {item.tagline && (
                            <p className="text-sm text-slate-500 italic line-clamp-2">"{item.tagline}"</p>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Genres */}
                        <div className="flex flex-wrap gap-2">
                            {item.genre.slice(0, 3).map((g) => (
                                <span key={g} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-xs font-medium text-slate-600 border border-slate-100">
                                    <Tag size={10} />
                                    {g}
                                </span>
                            ))}
                            {item.genre.length > 3 && (
                                <span className="px-2 py-1 rounded-md bg-slate-50 text-xs font-medium text-slate-400">
                                    +{item.genre.length - 3}
                                </span>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-50">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Tv size={16} className="text-slate-400" />
                                <span>{item.planned_seasons} Season{item.planned_seasons > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Film size={16} className="text-slate-400" />
                                <span>{item.episodes_per_season} Eps/Season</span>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(item.created_at).toLocaleDateString()}
                            </div>
                            <div className="font-mono">
                                Total Eps: {item.planned_seasons * item.episodes_per_season}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Add New Card */}
            <Card
                className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[300px] gap-4 group text-slate-400 hover:text-primary"
                onClick={onNewSeries}
            >
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Plus size={32} />
                </div>
                <span className="font-semibold text-lg">Create New Series</span>
            </Card>
        </div>
    );
}
