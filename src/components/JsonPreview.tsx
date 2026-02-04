import { useState } from 'react';
import { Check, Copy, FileJson } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface JsonPreviewProps {
    data: any;
    title?: string;
}

export function JsonPreview({ data, title = 'Data Preview' }: JsonPreviewProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const text = JSON.stringify(data, null, 2);

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.warn('Clipboard API failed, trying fallback...');
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;

                // Ensure it's not visible but part of the DOM
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);

                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } else {
                    throw new Error('Fallback copy failed');
                }
            } catch (fallbackErr) {
                console.error('Failed to copy json:', fallbackErr);
            }
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <FileJson size={18} className="text-violet-500" />
                    <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-3 text-xs gap-1.5 font-medium transition-all ${copied
                        ? 'bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                        }`}
                    onClick={handleCopy}
                >
                    {copied ? (
                        <>
                            <Check size={14} />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={14} />
                            <span>Copy JSON</span>
                        </>
                    )}
                </Button>
            </div>
            <div className="relative">
                <ScrollArea className="h-[300px] w-full bg-slate-900">
                    <pre className="p-4 text-xs font-mono text-emerald-400 selection:bg-emerald-900 selection:text-emerald-100">
                        <code>{JSON.stringify(data, null, 2)}</code>
                    </pre>
                </ScrollArea>
                <div className="absolute top-0 right-0 p-2 pointer-events-none">
                    <div className="px-2 py-1 rounded bg-slate-800/80 backdrop-blur text-[10px] text-slate-400 border border-slate-700 font-mono">
                        {(JSON.stringify(data).length / 1024).toFixed(2)} KB
                    </div>
                </div>
            </div>
        </div>
    );
}
