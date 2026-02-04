import { X, PlusCircle, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { StoryList } from './StoryList';
import type { StoryWithSegments } from '../types/database';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    stories?: StoryWithSegments[];
    isLoading?: boolean;
    selectedId?: string | null;
    onSelect?: (story: StoryWithSegments) => void;
    onDelete?: (id: string) => void;
    onNewStory?: () => void;
    error?: string | null;
}

export function MobileDrawer({
    isOpen,
    onClose,
    stories = [],
    isLoading = false,
    selectedId = null,
    onSelect = () => { },
    onDelete = () => { },
    onNewStory = () => { },
    error = null,
}: MobileDrawerProps) {
    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <aside
                className={`fixed top-0 left-0 h-full w-80 bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-violet-600" size={20} />
                        ClipCraft
                    </h1>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} className="text-slate-600" />
                    </button>
                </div>

                {/* New Story Button */}
                <div className="p-4">
                    <Button
                        className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
                        onClick={() => {
                            onNewStory();
                            onClose();
                        }}
                    >
                        <PlusCircle size={18} />
                        New Story
                    </Button>
                </div>

                {/* Story List */}
                <div className="flex-1 overflow-hidden">
                    <StoryList
                        stories={stories}
                        isLoading={isLoading}
                        selectedId={selectedId}
                        onSelect={(story) => {
                            onSelect(story);
                            onClose();
                        }}
                        onDelete={onDelete}
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm border-t border-red-200">
                        {error}
                    </div>
                )}
            </aside>
        </>
    );
}
