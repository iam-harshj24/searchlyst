import React, { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';

const VIDEO_ID = 'wPnOuhkxhFs';
const STORAGE_KEY = 'searchlyst_home_video_popup_dismissed';

/** Floating product video — bottom-right on homepage. Dismiss hides until next browser session. */
export default function HomeVideoPopup() {
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);

    useEffect(() => {
        try {
            if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
        } catch {
            /* ignore */
        }
        const t = window.setTimeout(() => setOpen(true), 900);
        return () => window.clearTimeout(t);
    }, []);

    const dismiss = () => {
        try {
            sessionStorage.setItem(STORAGE_KEY, '1');
        } catch {
            /* ignore */
        }
        setOpen(false);
        setMinimized(false);
    };

    if (!open) return null;

    if (minimized) {
        return (
            <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setMinimized(false)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E92A15]/45 bg-[#0a0a0a] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.45)] hover:bg-[#141414] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E92A15]/50"
                    aria-expanded={false}
                >
                    <Play className="w-4 h-4 text-[#E92A15] shrink-0" aria-hidden />
                    Watch product tour
                </button>
                <button
                    type="button"
                    onClick={dismiss}
                    className="rounded-full p-2 border border-[#333] bg-[#111] text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E92A15]/40"
                    aria-label="Close video widget"
                >
                    <X className="w-4 h-4" strokeWidth={2.25} />
                </button>
            </div>
        );
    }

    return (
        <div
            className="fixed bottom-4 right-4 z-[100] w-[min(92vw,380px)] animate-in fade-in slide-in-from-bottom-4 duration-500"
            role="complementary"
            aria-label="Product video"
        >
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#0B0B0B] shadow-[0_16px_48px_rgba(0,0,0,0.55)] overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[#222] bg-[#111]">
                    <p className="text-[13px] font-semibold text-white truncate pr-2">See Searchlyst in action</p>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => setMinimized(true)}
                            className="px-2 py-1 rounded-lg text-[11px] font-medium text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                        >
                            Minimize
                        </button>
                        <button
                            type="button"
                            onClick={dismiss}
                            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E92A15]/40"
                            aria-label="Dismiss video"
                        >
                            <X className="w-4 h-4" strokeWidth={2.25} />
                        </button>
                    </div>
                </div>
                <div className="aspect-video w-full bg-black">
                    <iframe
                        title="Searchlyst product video"
                        src={`https://www.youtube.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                </div>
            </div>
        </div>
    );
}
