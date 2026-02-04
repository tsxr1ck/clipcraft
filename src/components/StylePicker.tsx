import { Sparkles } from 'lucide-react';

interface StyleOption {
    id: string;
    name: string;
    description?: string;
}

interface StylePickerProps {
    title: string;
    icon: React.ReactNode;
    options: StyleOption[];
    selectedId: string;
    onSelect: (id: string) => void;
    imageBasePath: string;
    aspectRatio?: 'square' | 'video';
}

export function StylePicker({
    title,
    icon,
    options,
    selectedId,
    onSelect,
    imageBasePath,
    aspectRatio = 'square'
}: StylePickerProps) {
    return (
        <div className="flex flex-col gap-3 w-full">
            <p className="text-sm font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider pl-1">
                {icon}
                {title}
            </p>
            <div className={`grid ${aspectRatio === 'square' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} gap-4`}>
                {options.map((option) => {
                    const isSelected = selectedId === option.id;
                    const imagePath = `${imageBasePath}/${option.id}.jpg`;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onSelect(option.id)}
                            className={`
                                relative rounded-2xl overflow-hidden group transition-all duration-300
                                border-0 text-left shadow-md hover:shadow-xl
                                ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'}
                                ${isSelected
                                    ? 'ring-4 ring-primary ring-offset-2 ring-offset-slate-50 scale-[1.02]'
                                    : 'hover:scale-[1.05] ring-1 ring-slate-200'}
                            `}
                        >
                            <img
                                src={imagePath}
                                alt={option.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />

                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 transition-opacity duration-300 ${isSelected ? 'bg-black/20' : 'bg-black/40 group-hover:bg-black/20'}`} />

                            {/* Text Label */}
                            <div className="absolute inset-0 flex flex-col justify-end p-3">
                                <span className="text-xs font-bold text-white drop-shadow-md leading-tight text-center">
                                    {option.name}
                                </span>
                            </div>

                            {/* Selected Checkmark */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full shadow-lg animate-in zoom-in spin-in-90 duration-300">
                                    <Sparkles size={12} fill="currentColor" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
