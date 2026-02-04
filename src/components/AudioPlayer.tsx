import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface AudioPlayerProps {
    src: string | null;
    compact?: boolean;
}

export function AudioPlayer({ src, compact = false }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoaded(true);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, [src]);

    // Reset when src changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setIsLoaded(false);
    }, [src]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleSeek = (value: number[]) => {
        const audio = audioRef.current;
        if (!audio || !isLoaded) return;

        audio.currentTime = value[0];
        setCurrentTime(value[0]);
    };

    const restart = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = 0;
        setCurrentTime(0);
        audio.play();
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!src) {
        return (
            <div className="flex items-center justify-center p-3 bg-slate-100 rounded-lg text-slate-400 text-sm">
                <Volume2 size={16} className="mr-2" />
                No audio
            </div>
        );
    }

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <audio ref={audioRef} src={src} preload="metadata" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-600"
                    onClick={togglePlay}
                >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </Button>
                <div className="flex-1 min-w-0">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="w-full"
                        disabled={!isLoaded}
                    />
                </div>
                <span className="text-xs text-slate-500 font-mono w-10 text-right">
                    {formatTime(currentTime)}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-3 bg-linear-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-100">
            <audio ref={audioRef} src={src} preload="metadata" />

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={togglePlay}
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </Button>

                <div className="flex-1 min-w-0">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="w-full"
                        disabled={!isLoaded}
                    />
                </div>

                <span className="text-xs text-slate-600 font-mono min-w-[70px] text-center">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-slate-700"
                    onClick={restart}
                >
                    <RotateCcw size={14} />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-slate-700"
                    onClick={toggleMute}
                >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </Button>
            </div>
        </div>
    );
}
