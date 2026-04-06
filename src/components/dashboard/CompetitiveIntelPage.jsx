import React, { useState, useMemo } from 'react';
import { TrendingUp, ChevronUp, ChevronDown, Sparkles, Users, AlertCircle } from 'lucide-react';
import { promptPreview } from '@/lib/promptPreview';

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

export default function CompetitiveIntelPage({ user, scanManager, onTabChange }) {
    const [entitiesOpen, setEntitiesOpen] = useState(true);
    const [gapsOpen, setGapsOpen] = useState(true);
    const [aiPanelOpen, setAiPanelOpen] = useState(true);

    const scanData = useMemo(() => {
        const live = scanManager?.scanResult;
        if (live && (live.prompts?.length || live.entityGraph?.length || live.intelligence || live.competitorGaps?.length)) {
            return live;
        }
        return getVisibilityData(user?.domain, user?.projectId);
    }, [scanManager?.scanResult, user?.domain, user?.projectId]);

    const intelligence = scanData?.intelligence || null;
    const entities = Array.isArray(scanData?.entityGraph) ? scanData.entityGraph : [];
    const gaps = Array.isArray(scanData?.competitorGaps) ? scanData.competitorGaps : [];
    const hasScan = !!scanData;
    const brandName = user?.brandName || 'Your brand';

    return (
        <div className="w-full pb-12">
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <TrendingUp className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Competitive Intent</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">
                            {hasScan
                                ? 'Entities, gap topics, and AI insights from your latest visibility scan.'
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
                {/* Entity landscape */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setEntitiesOpen((o) => !o)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#111] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-xl flex items-center justify-center">
                                <Users className="w-4 h-4 text-[#888]" />
                            </div>
                            <span className="text-white font-semibold text-[15px]">Entities</span>
                            <span className="text-[#666] text-[11px] font-bold px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md tracking-wide">
                                BRANDS IN ANSWERS
                            </span>
                        </div>
                        {entitiesOpen ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
                    </button>
                    {entitiesOpen && (
                        <div className="px-6 pb-6">
                            {entities.length === 0 ? (
                                <p className="text-[#555] text-[13px]">
                                    No entity graph for this scan yet. Run a full visibility scan to populate detected brands.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-[min(52vh,360px)] overflow-y-auto pr-1 custom-scrollbar">
                                    {entities.map((e, i) => (
                                        <div
                                            key={`${e.name}-${i}`}
                                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#262626] bg-[#111] px-4 py-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-white text-[13px] font-medium truncate">{e.name}</p>
                                                {e.domain ? (
                                                    <p className="text-[#666] text-[11px] truncate">{e.domain}</p>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px]">
                                                {e.isTargetBrand ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-[#E92A15]/15 text-[#E92A15] font-semibold border border-[#E92A15]/25">
                                                        You
                                                    </span>
                                                ) : null}
                                                {e.isCompetitor ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300 font-semibold border border-orange-500/25">
                                                        Competitor
                                                    </span>
                                                ) : null}
                                                <span className="text-[#a3a3a3] tabular-nums">{e.totalMentions ?? 0} mentions</span>
                                                <span className="text-[#737373] tabular-nums">{e.queryCount ?? 0} queries</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Competitive / entity gaps */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setGapsOpen((o) => !o)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#111] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-amber-500/90" />
                            </div>
                            <span className="text-white font-semibold text-[15px]">Entity gaps</span>
                            <span className="text-[#666] text-[11px] font-bold px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md tracking-wide">
                                WHERE OTHERS LEAD
                            </span>
                        </div>
                        {gapsOpen ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
                    </button>
                    {gapsOpen && (
                        <div className="px-6 pb-6">
                            {gaps.length === 0 ? (
                                <p className="text-[#555] text-[13px]">
                                    No gap topics in this scan. Competitors may not have appeared more than you on tracked prompts.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-[min(48vh,320px)] overflow-y-auto pr-1 custom-scrollbar">
                                    {gaps.map((gap, i) => {
                                        const gapHead = String(gap.contentTopic || gap.query || '').trim() || '—';
                                        const gapPrev = promptPreview(gapHead);
                                        return (
                                            <div
                                                key={`${gap.query || gap.contentTopic || i}-${gap.inferredFromCitations ? 'c' : 'g'}`}
                                                className="p-3 rounded-xl border border-[#222] bg-[#111]"
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-0.5">
                                                    <p
                                                        className={`text-[#eee] text-[13px] font-medium flex-1 min-w-0 ${gapPrev.truncated ? 'cursor-help' : ''}`}
                                                        title={gapPrev.truncated ? gapPrev.full : undefined}
                                                    >
                                                        {gapPrev.display}
                                                    </p>
                                                    {gap.inferredFromCitations ? (
                                                        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[#888] border border-[#333] rounded px-1.5 py-0.5">
                                                            Citations
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {gap.contentAngle ? (
                                                    <p className="text-[#777] text-[11px] mt-1">{gap.contentAngle}</p>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* AI insights */}
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
                            <span className="text-white font-semibold text-[15px]">AI insights</span>
                            <span className="text-[#666] text-[11px] font-bold px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md tracking-wide">
                                STRATEGIC BRIEF
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
                                        <p className="text-[#555] text-[12px]">
                                            Run a scan to generate AI insights for {brandName}.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
