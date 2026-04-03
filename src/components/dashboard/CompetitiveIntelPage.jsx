import React, { useState, useMemo } from 'react';
import { TrendingUp, ChevronUp, ChevronDown, Sparkles, Activity } from 'lucide-react';

function getVisibilityData(domain, projectId) {
    try {
        const key = `searchlyst_visibility_${domain || 'default'}_${projectId ?? 'default'}`;
        let saved = localStorage.getItem(key);
        if (!saved && (projectId == null || projectId === 'default')) {
            saved = localStorage.getItem(`searchlyst_visibility_${domain || 'default'}`);
        }
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse bg-[#1a1a1a] rounded ${className}`} />;
}

export default function CompetitiveIntelPage({ user, onTabChange }) {
    const [aiPanelOpen, setAiPanelOpen] = useState(true);

    const scanData = useMemo(() => getVisibilityData(user?.domain, user?.projectId), [user?.domain, user?.projectId]);
    const intelligence = scanData?.intelligence || null;
    const hasScan = !!scanData;

    return (
        <div className="w-full pb-12">
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <TrendingUp className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Competitive Intelligence</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">
                            {hasScan
                                ? 'AI interpretation of your latest visibility scan.'
                                : 'Run a visibility scan to unlock competitive insights.'}{' '}
                            <button
                                type="button"
                                onClick={() => onTabChange?.('competitors')}
                                className="text-[#E92A15] hover:underline font-medium ml-1"
                            >
                                Manage competitors →
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-6 max-w-[1400px]">
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setAiPanelOpen((o) => !o)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#111] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-xl flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-[#888]" />
                            </div>
                            <span className="text-white font-semibold text-[15px]">AI Analysis</span>
                            <span className="text-[#666] text-[11px] font-bold px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md tracking-wide">
                                AI INSIGHTS
                            </span>
                        </div>
                        {aiPanelOpen ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
                    </button>
                    {aiPanelOpen && (
                        <div className="px-6 pb-6">
                            {intelligence ? (
                                (() => {
                                    const cards = [];
                                    if (intelligence.overallAssessment) {
                                        cards.push({
                                            type: 'ASSESSMENT',
                                            tagColor: 'text-[#888] bg-[#1a1a1a] border border-[#2a2a2a]',
                                            text: intelligence.overallAssessment,
                                        });
                                    }
                                    (intelligence.strengthAreas || []).forEach((s) =>
                                        cards.push({
                                            type: 'STRENGTH',
                                            tagColor: 'text-[#22c55e] bg-[#0a1a0a] border border-[#22c55e]/30',
                                            text: s,
                                        }),
                                    );
                                    (intelligence.weaknessAreas || []).forEach((s) =>
                                        cards.push({
                                            type: 'RISK',
                                            tagColor: 'text-[#f59e0b] bg-[#1a1200] border border-[#f59e0b]/30',
                                            text: s,
                                        }),
                                    );
                                    (intelligence.topOpportunities || []).forEach((s) =>
                                        cards.push({
                                            type: 'OPPORTUNITY',
                                            tagColor: 'text-[#22c55e] bg-[#0a1a0a] border border-[#22c55e]/30',
                                            text: s,
                                        }),
                                    );
                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {cards.map((c, i) => (
                                                <div key={i} className="rounded-xl p-4 border border-[#2a2a2a] bg-[#111]">
                                                    <span
                                                        className={`inline-block text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded mb-3 ${c.tagColor}`}
                                                    >
                                                        {c.type}
                                                    </span>
                                                    <p className="text-[#aaa] text-[13px] leading-relaxed">{c.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="rounded-xl p-4 border border-[#1a1a1a] bg-[#111]">
                                            <Skeleton className="w-24 h-5 mb-3" />
                                            <Skeleton className="w-full h-4 mb-2" />
                                            <Skeleton className="w-3/4 h-4" />
                                        </div>
                                    ))}
                                    <div className="col-span-full text-center py-2">
                                        <p className="text-[#555] text-[12px]">Run a scan to generate AI-powered competitive insights</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!hasScan && (
                    <div className="flex flex-col items-center justify-center py-16 bg-[#0B0B0B] border border-[#222] rounded-2xl">
                        <Activity className="w-10 h-10 text-[#333] mb-3" />
                        <p className="text-[#555] text-[13px]">No scan data yet. Start an AI visibility scan to see insights here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
