import { Menu, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
    onMenuClick: () => void;
    onNewStory: () => void;
    title?: string;
}

export function Header({ onMenuClick, onNewStory, title }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 lg:hidden">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Open menu"
                >
                    <Menu size={24} className="text-slate-700" />
                </button>
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="text-violet-600" size={18} />
                    ClipCraft
                </h1>
                {title && (
                    <span className="text-sm text-slate-500 truncate max-w-[200px]">
                        {title}
                    </span>
                )}
            </div>

            <Button
                size="sm"
                className="gap-1 bg-violet-600 hover:bg-violet-700"
                onClick={onNewStory}
            >
                <Sparkles size={14} />
                <span className="hidden xs:inline">New</span>
            </Button>
        </header>
    );
}
