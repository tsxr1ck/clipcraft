// components/series/CharactersTab.tsx
import { useState, useEffect } from 'react';
import { Users, Plus, Sparkles, Image as ImageIcon, Loader2, RefreshCw, Wand2, X, ZoomIn } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import type { Character } from '../../types/character';
import { CHARACTER_ROLES } from '../../types/character';
import { CharacterService } from '../../services/characterService';

interface CharactersTabProps {
    seriesId: string;
    seriesVisualStyle: string;
    hasMigratedCharacters?: boolean;
    onMigrateCharacters?: () => Promise<void>;
}

export function CharactersTab({
    seriesId,
    seriesVisualStyle,

    hasMigratedCharacters = false,
    onMigrateCharacters
}: CharactersTabProps) {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [generatingPosterId, setGeneratingPosterId] = useState<string | null>(null);
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationSuccess, setMigrationSuccess] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

    useEffect(() => {
        loadCharacters();
    }, [seriesId]);

    const loadCharacters = async () => {
        try {
            setIsLoading(true);
            const data = await CharacterService.getSeriesCharacters(seriesId);
            setCharacters(data);
        } catch (error) {
            console.error('Failed to load characters:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePoster = async (characterId: string) => {
        try {
            setGeneratingPosterId(characterId);
            await CharacterService.generateCharacterPoster(characterId);

            // Poll for completion (in production, use webhook or real-time subscription)
            setTimeout(() => {
                loadCharacters();
                setGeneratingPosterId(null);
            }, 30000); // 30 seconds
        } catch (error) {
            console.error('Failed to generate poster:', error);
            setGeneratingPosterId(null);
        }
    };

    const handleMigrate = async () => {
        if (!onMigrateCharacters) return;

        try {
            setIsMigrating(true);
            setMigrationSuccess(false);
            await onMigrateCharacters();
            await loadCharacters();
            setMigrationSuccess(true);

            // Hide success message after 5 seconds
            setTimeout(() => setMigrationSuccess(false), 5000);
        } catch (error) {
            console.error('Migration failed:', error);
            alert('Migration failed. Check console for details.');
        } finally {
            setIsMigrating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden border-slate-100">
                        <div className="h-2 bg-slate-100" />
                        <CardContent className="p-6">
                            <Skeleton className="h-6 w-3/4 mb-3" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3 mb-4" />
                            <Skeleton className="h-32 w-full rounded-lg" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Show migration prompt if no characters but it's an old series
    if (characters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Migrate Characters to New System
                </h3>
                <p className="text-slate-500 mb-2 max-w-md text-center">
                    This series has characters in the old format. Migrate them to the new character system to unlock:
                </p>
                <ul className="text-sm text-slate-600 mb-8 max-w-md space-y-1">
                    <li>✨ AI-enriched physical traits & descriptions</li>
                    <li>🎨 Automatic poster generation</li>
                    <li>🎯 Visual keywords & color palettes</li>
                    <li>📊 Enhanced character management</li>
                </ul>
                <Button
                    onClick={handleMigrate}
                    disabled={isMigrating}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 h-12 px-8"
                >
                    {isMigrating ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={18} />
                            Migrating & Enriching Characters...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Wand2 size={18} />
                            Migrate & Generate Posters
                        </div>
                    )}
                </Button>

                {isMigrating && (
                    <div className="mt-6 text-sm text-slate-500 animate-pulse">
                        This may take 2-3 minutes. Using AI to enrich character details...
                    </div>
                )}
            </div>
        );
    }

    if (characters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                    No Characters Yet
                </h3>
                <p className="text-slate-500 mb-8 max-w-md text-center">
                    Characters will be automatically created when you generate your series lore, or you can add them manually.
                </p>
                <Button className="bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20">
                    <Plus size={18} className="mr-2" />
                    Add Character
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Header with Migration Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="text-primary" size={24} />
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">
                            Characters ({characters.length})
                        </h3>
                        <p className="text-sm text-slate-500">
                            Visual style: {seriesVisualStyle}
                        </p>
                    </div>
                </div>

                {/* Migration Button - Shows when characters exist but migration available */}
                {!hasMigratedCharacters && onMigrateCharacters && (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleMigrate}
                            disabled={isMigrating}
                            variant="default"
                            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20"
                        >
                            {isMigrating ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={16} />
                                    Migrating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2" size={16} />
                                    Migrate & Enrich Characters
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Success Message */}
                {migrationSuccess && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium animate-in slide-in-from-right">
                        <Sparkles size={16} />
                        Migration complete! Characters enriched & posters queued.
                    </div>
                )}
            </div>

            {/* Migration Info Banner - Shows while migrating */}
            {isMigrating && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Loader2 className="animate-spin text-primary" size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 mb-1">
                                    Migration in Progress
                                </h4>
                                <p className="text-sm text-slate-600 mb-3">
                                    AI is enriching your characters with detailed physical traits, clothing descriptions,
                                    visual prompts, and generating character posters. This will take 2-3 minutes.
                                </p>
                                <div className="text-xs text-slate-500 space-y-1">
                                    <div>✅ Extracting character data</div>
                                    <div className="animate-pulse">🤖 AI enriching physical traits...</div>
                                    <div className="text-slate-400">🎨 Poster generation (queued)</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Characters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {characters.map((char) => {
                    const roleConfig = CHARACTER_ROLES[char.role];
                    const isGeneratingPoster = generatingPosterId === char.id;

                    return (
                        <Card
                            key={char.id}
                            className="overflow-hidden border-slate-100 hover:shadow-lg transition-all"
                        >
                            {/* Color Bar */}
                            <div
                                className="h-2"
                                style={{
                                    background: `linear-gradient(90deg, ${char.color_palette?.[0] || roleConfig.color}, ${char.color_palette?.[1] || roleConfig.color})`
                                }}
                            />

                            <CardContent className="p-6 space-y-4">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight">
                                        {char.name}
                                    </h3>
                                    <span
                                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                                        style={{
                                            backgroundColor: `${roleConfig.color}20`,
                                            color: roleConfig.color,
                                            borderColor: `${roleConfig.color}40`
                                        }}
                                    >
                                        {roleConfig.label}
                                    </span>
                                </div>

                                {/* Poster */}
                                <div className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden">
                                    {char.poster_status === 'completed' && char.poster_url ? (
                                        <div
                                            className="w-full h-full relative cursor-zoom-in group/poster"
                                            onClick={() => char.poster_url && setSelectedImage({ url: char.poster_url, name: char.name })}
                                        >
                                            <img
                                                src={char.poster_url}
                                                alt={char.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover/poster:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/poster:opacity-100">
                                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 text-white">
                                                    <ZoomIn size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    ) : char.poster_status === 'generating' || isGeneratingPoster ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                                            <Loader2 className="animate-spin" size={32} />
                                            <span className="text-xs font-medium">Generating poster...</span>
                                            <span className="text-[10px] text-slate-300">~30 seconds</span>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                            {/* Color Palette Preview */}
                                            {char.color_palette && char.color_palette.length > 0 && (
                                                <div className="flex gap-1">
                                                    {char.color_palette.slice(0, 4).map((color, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-slate-200 hover:border-primary hover:text-primary"
                                                onClick={() => handleGeneratePoster(char.id)}
                                                disabled={isGeneratingPoster}
                                            >
                                                <Sparkles size={14} className="mr-1.5" />
                                                Generate Poster
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                                    {char.description}
                                </p>

                                {/* Visual Keywords */}
                                {char.visual_keywords && char.visual_keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {char.visual_keywords.slice(0, 4).map((keyword, i) => (
                                            <span
                                                key={i}
                                                className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100 truncate max-w-[120px]"
                                                title={keyword}
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                        {char.visual_keywords.length > 4 && (
                                            <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full">
                                                +{char.visual_keywords.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Character Arc */}
                                {char.character_arc && (
                                    <div className="p-3 bg-slate-50 rounded-lg text-xs border border-slate-100">
                                        <span className="font-semibold text-slate-900 block mb-1">
                                            Character Arc:
                                        </span>
                                        <span className="text-slate-500 line-clamp-2">
                                            {char.character_arc}
                                        </span>
                                    </div>
                                )}

                                {/* Distinctive Features */}
                                {char.distinctive_features && char.distinctive_features.length > 0 && (
                                    <div className="pt-3 border-t border-slate-100">
                                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            Distinctive Features
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {char.distinctive_features.slice(0, 3).map((feature, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md border border-purple-100 truncate max-w-[150px]"
                                                    title={feature}
                                                >
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Importance Level */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-xs text-slate-400">
                                        Importance: {char.importance_level}/10
                                    </span>
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-1.5 h-3 rounded-sm ${i < char.importance_level
                                                    ? 'bg-primary'
                                                    : 'bg-slate-100'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Add New Character Card */}
                <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-primary/30 transition-all cursor-pointer flex items-center justify-center min-h-[400px] group">
                    <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-primary transition-colors">
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={32} />
                        </div>
                        <span className="font-semibold text-lg">Add Character</span>
                    </div>
                </Card>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                        }}
                    >
                        <X size={24} />
                    </button>

                    <div
                        className="relative max-w-4xl w-full aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.name}
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                                {selectedImage.name}
                            </h3>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}