import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface ImageModalProps {
    imageUrl: string | null;
    alt?: string;
    onClose: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
}

export function ImageModal({
    imageUrl,
    alt,
    onClose,
    onPrevious,
    onNext,
    hasPrevious = false,
    hasNext = false,
}: ImageModalProps) {
    // Handle keyboard events
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowLeft' && onPrevious && hasPrevious) {
            onPrevious();
        } else if (e.key === 'ArrowRight' && onNext && hasNext) {
            onNext();
        }
    }, [onClose, onPrevious, onNext, hasPrevious, hasNext]);

    useEffect(() => {
        if (!imageUrl) return;

        document.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [imageUrl, handleKeyDown]);

    if (!imageUrl) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Close button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={onClose}
            >
                <X size={24} />
            </Button>

            {/* Previous button */}
            {onPrevious && hasPrevious && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrevious();
                    }}
                >
                    <ChevronLeft size={28} />
                </Button>
            )}

            {/* Next button */}
            {onNext && hasNext && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNext();
                    }}
                >
                    <ChevronRight size={28} />
                </Button>
            )}

            {/* Image container */}
            <div
                className="relative max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageUrl}
                    alt={alt || 'Full size image'}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
            </div>

            {/* Keyboard hints */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-white/60 text-sm">
                <span>Press <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd> to close</span>
                {(hasPrevious || hasNext) && (
                    <span>Use <kbd className="px-2 py-1 bg-white/10 rounded">←</kbd> <kbd className="px-2 py-1 bg-white/10 rounded">→</kbd> to navigate</span>
                )}
            </div>
        </div>
    );
}
