import React, { useState, useMemo } from 'react';
import {
    TrendingUp, BarChart3, Users, Target, Shield,
    ChevronUp, ChevronDown, AlertTriangle, Sparkles, Activity,
    Crosshair, Eye, Plus, ChevronRight, X
} from 'lucide-react';

function getVisibilityData(domain, projectId) {
    try {
        const key = `searchlyst_visibility_${domain || 'default'}_${projectId ?? 'default'}`;
        let saved = localStorage.getItem(key);
        if (!saved && (projectId == null || projectId === 'default')) {
            saved = localStorage.getItem(`searchlyst_visibility_${domain || 'default'}`);
        }
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
}

const TABS = [
    { id: 'sov', label: 'Share of Voice', icon: BarChart3 },
    { id: 'rankings', label: 'AI Rankings', icon: TrendingUp },
    { id: 'entities', label: 'Entity Map', icon: Users },
    { id: 'gaps', label: 'Content Gaps', icon: Target },
];

function BrandAvatar({ name, isUser, size = 7 }) {
    const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';
    const bg = isUser ? 'bg-[#E92A15]' : 'bg-[#1a1a1a] border border-[#333]';
    const text = isUser ? 'text-white' : 'text-[#888]';
    return <div className={`w-${size} h-${size} rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${bg} ${text}`}>{initials}</div>;
}

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse bg-[#1a1a1a] rounded ${className}`} />;
}

function EmptyState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <Activity className="w-10 h-10 text-[#333] mb-3" />
            <p className="text-[#555] text-[13px]">{message}</p>
        </div>
    );
}

function deriveData(scanData, brandName) {
    if (!scanData) return null;
    const rawSov = scanData.competitorAnalysis?.shareOfVoice || scanData.shareOfVoice;
    const sovData = [];
    if (rawSov && typeof rawSov === 'object' && !Array.isArray(rawSov)) {
        if (rawSov.brand) sovData.push({ name: rawSov.brand.name, percentage: rawSov.brand.sov || 0, isUser: true });
        for (const c of rawSov.competitors || []) sovData.push({ name: c.name, percentage: c.sov || 0, isUser: false });
    } else if (Array.isArray(rawSov)) {
        for (const s of rawSov) sovData.push({ name: s.brand || s.name, percentage: s.percentage || s.sov || 0, isUser: (s.brand || s.name || '').toLowerCase() === (brandName || '').toLowerCase() });
    }
    return {
        sovData,
        rankings: scanData.industryRanking || [],
        entityGraph: scanData.entityGraph || [],
        gaps: Array.isArray(scanData.competitorGaps) ? scanData.competitorGaps : [],
        citationSummary: Array.isArray(scanData.citationSummary) ? scanData.citationSummary : [],
        intelligence: scanData.intelligence || null,
    };
}

export default function CompetitiveIntelPage({ user, onTabChange }) {
    const [activeTab, setActiveTab] = useState('sov');
    const [aiPanelOpen, setAiPanelOpen] = useState(true);
    const [gapsView, setGapsView] = useState('grouped');

    const scanData = useMemo(() => getVisibilityData(user?.domain, user?.projectId), [user?.domain, user?.projectId]);
    const data = useMemo(() => deriveData(scanData, user?.brandName), [scanData, user?.brandName]);

    const hasData = data && (data.sovData.length > 0 || data.rankings.length > 0 || data.entityGraph.length > 0);
    const sovData = data?.sovData || [];
    const rankings = data?.rankings || [];
    const entityGraph = data?.entityGraph || [];
    const gaps = data?.gaps || [];
    const intelligence = data?.intelligence || null;

    const competitors = sovData.filter(s => !s.isUser).map(s => s.name.split(' ')[0]);
    const userSov = sovData.find(s => s.isUser);
    const userSovPct = userSov?.percentage ?? 0;

    const gapsByCompetitor = useMemo(() => {
        const map = {};
        for (const gap of gaps) {
            for (const cp of (gap.competitorsPresent || [])) {
                const name = typeof cp === 'string' ? cp : cp.name;
                if (!name) continue;
                if (!map[name]) map[name] = [];
                map[name].push(gap);
            }
        }
        return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
    }, [gaps]);

    return (
        <div className="w-full pb-12">
            {/* Header */}
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <TrendingUp className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Competitive Intelligence</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">
                            {hasData ? 'Live competitive data from your AI visibility scan' : 'Run a scan to see real competitive data'}
                            {' '}
                            <button type="button" onClick={() => onTabChange?.('competitors')} className="text-[#E92A15] hover:underline font-medium ml-1">
                                Manage competitors →
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-6 max-w-[1400px]">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Your Share of Voice</p>
                        {hasData ? (
                            <>
                                <p className="text-white text-[38px] font-bold tracking-tight leading-none mb-2">{userSovPct.toFixed(1)}%</p>
                                <span className="text-[#888] text-[12px]">{userSovPct > 50 ? 'Leading in AI visibility' : 'Building AI presence'}</span>
                            </>
                        ) : (
                            <>
                                <p className="text-[#333] text-[38px] font-bold tracking-tight leading-none mb-2">—</p>
                                <span className="text-[#444] text-[12px]">Awaiting scan</span>
                            </>
                        )}
                    </div>
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Competitors Tracked</p>
                        <p className={`text-[38px] font-bold tracking-tight leading-none mb-2 ${hasData ? 'text-white' : 'text-[#333]'}`}>{hasData ? competitors.length : '—'}</p>
                        <span className="text-[#666] text-[12px]">{hasData ? (competitors.slice(0, 3).join(' · ') || 'None detected') : 'Awaiting scan'}</span>
                    </div>
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Content Gaps</p>
                        <p className={`text-[38px] font-bold tracking-tight leading-none mb-2 ${hasData ? 'text-white' : 'text-[#333]'}`}>{hasData ? gaps.length : '—'}</p>
                        <span className="text-[#666] text-[12px]">{hasData ? (gaps.length > 0 ? 'Actionable topics found' : 'No gaps detected') : 'Awaiting scan'}</span>
                    </div>
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Entities detected</p>
                        <p className={`text-[38px] font-bold tracking-tight leading-none mb-2 ${hasData ? 'text-white' : 'text-[#333]'}`}>{hasData ? entityGraph.length : '—'}</p>
                        <span className="text-[#666] text-[12px]">
                            {hasData ? (entityGraph.length > 0 ? 'Brands in AI answers' : 'None yet') : 'Awaiting scan'}
                        </span>
                    </div>
                </div>

                {/* AI Analysis Panel */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl overflow-hidden">
                    <button onClick={() => setAiPanelOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#111] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-xl flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-[#888]" />
                            </div>
                            <span className="text-white font-semibold text-[15px]">AI Analysis</span>
                            <span className="text-[#666] text-[11px] font-bold px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md tracking-wide">AI INSIGHTS</span>
                        </div>
                        {aiPanelOpen ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
                    </button>
                    {aiPanelOpen && (
                        <div className="px-6 pb-6">
                            {intelligence ? (() => {
                                const cards = [];
                                if (intelligence.overallAssessment) cards.push({ type: 'ASSESSMENT', tagColor: 'text-[#888] bg-[#1a1a1a] border border-[#2a2a2a]', text: intelligence.overallAssessment });
                                (intelligence.strengthAreas || []).forEach(s => cards.push({ type: 'STRENGTH', tagColor: 'text-[#22c55e] bg-[#0a1a0a] border border-[#22c55e]/30', text: s }));
                                (intelligence.weaknessAreas || []).forEach(s => cards.push({ type: 'RISK', tagColor: 'text-[#f59e0b] bg-[#1a1200] border border-[#f59e0b]/30', text: s }));
                                (intelligence.topOpportunities || []).forEach(s => cards.push({ type: 'OPPORTUNITY', tagColor: 'text-[#22c55e] bg-[#0a1a0a] border border-[#22c55e]/30', text: s }));
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cards.map((c, i) => (
                                            <div key={i} className="rounded-xl p-4 border border-[#2a2a2a] bg-[#111]">
                                                <span className={`inline-block text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded mb-3 ${c.tagColor}`}>{c.type}</span>
                                                <p className="text-[#aaa] text-[13px] leading-relaxed">{c.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })() : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map(i => (
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

                {/* Tabs */}
                <div className="border-b border-[#222]">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-all relative ${isActive ? 'text-white' : 'text-[#666] hover:text-[#aaa]'}`}>
                                    <Icon className={`w-[15px] h-[15px] ${isActive ? 'text-[#E92A15]' : ''}`} />
                                    {tab.label}
                                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E92A15] rounded-t-full" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'sov' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">Share of Voice — All AI Engines</h2>
                            <p className="text-[#666] text-[13px] mb-6">How your brand's visibility compares to competitors across AI platforms</p>
                            {sovData.length > 0 ? (
                                <div className="space-y-5">
                                    {sovData.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <BrandAvatar name={item.name} isUser={item.isUser} size={7} />
                                            <span className={`text-[14px] w-[160px] shrink-0 truncate ${item.isUser ? 'text-white font-semibold' : 'text-[#888]'}`}>{item.name}</span>
                                            <div className="flex-1 h-[6px] bg-[#1a1a1a] rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-700 ${item.isUser ? 'bg-gradient-to-r from-[#E92A15] to-[#ff4f2a]' : 'bg-[#E92A15]/50'}`} style={{ width: `${Math.min(item.percentage, 100)}%` }} />
                                            </div>
                                            <span className={`text-[14px] font-semibold w-14 text-right shrink-0 ${item.isUser ? 'text-white' : 'text-[#555]'}`}>{item.percentage.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyState message="Share of voice data will appear after your first scan" />}
                        </div>
                    )}

                    {activeTab === 'rankings' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">AI Rankings</h2>
                            <p className="text-[#666] text-[13px] mb-6">Prompt breadth: share of tracked prompts where each brand appears (not raw mention share)</p>
                            {rankings.length > 0 ? (
                                <div className="space-y-3">
                                    {rankings.map((row, i) => {
                                        const isUser = row.isUser || row.isTargetBrand || (row.brand || row.name || '').toLowerCase() === (user?.brandName || '').toLowerCase();
                                        const metric = row.promptCoverage != null ? `${row.promptCoverage}%` : (row.score != null ? row.score : row.sov != null ? `${row.sov}%` : '—');
                                        const metricLabel = row.promptCoverage != null ? 'Coverage' : 'SOV';
                                        return (
                                            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${isUser ? 'border-[#E92A15]/30 bg-[#120404]' : 'border-[#1a1a1a] bg-[#111]'}`}>
                                                <span className={`text-[22px] font-bold w-8 shrink-0 ${isUser ? 'text-[#E92A15]' : 'text-[#333]'}`}>#{row.rank || i + 1}</span>
                                                <BrandAvatar name={row.brand || row.name} isUser={isUser} />
                                                <span className={`flex-1 text-[14px] font-medium ${isUser ? 'text-white' : 'text-[#888]'}`}>{row.brand || row.name}</span>
                                                <div className="text-right">
                                                    <p className="text-white text-[16px] font-bold">{metric}</p>
                                                    <p className="text-[#555] text-[11px]">{metricLabel}</p>
                                                </div>
                                                <div className="text-right w-20">
                                                    <p className="text-white text-[16px] font-bold">{row.mentions ?? '—'}</p>
                                                    <p className="text-[#555] text-[11px]">Mentions</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <EmptyState message="Ranking data will appear after your first scan" />}
                        </div>
                    )}

                    {activeTab === 'entities' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">Entity Map</h2>
                            <p className="text-[#666] text-[13px] mb-6">Brands and entities detected across all AI engine responses</p>
                            {entityGraph.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {entityGraph.map((entity, i) => {
                                        const isUser = entity.isUser || entity.isTargetBrand || (entity.name || '').toLowerCase() === (user?.brandName || '').toLowerCase();
                                        return (
                                            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${isUser ? 'border-[#E92A15]/30 bg-[#120404]' : 'border-[#1a1a1a] bg-[#111]'}`}>
                                                <BrandAvatar name={entity.name} isUser={isUser} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-[14px] font-medium truncate ${isUser ? 'text-white' : 'text-[#aaa]'}`}>{entity.name}</p>
                                                        {isUser && <span className="text-[9px] px-1.5 py-0.5 bg-[#E92A15]/20 text-[#E92A15] rounded font-bold">YOU</span>}
                                                    </div>
                                                    <p className="text-[#555] text-[11px] truncate">{entity.domain}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-white text-[15px] font-bold">{entity.totalMentions || entity.mentions}</p>
                                                    <p className="text-[#555] text-[11px]">{entity.queryCount || entity.queries} queries</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <EmptyState message="Entity map will populate after your first scan" />}
                        </div>
                    )}

                    {activeTab === 'gaps' && (
                        <div className="space-y-4">
                            <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-white font-semibold text-[17px]">Content Gaps</h2>
                                    {gaps.length > 0 && (
                                        <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
                                            <button
                                                onClick={() => setGapsView('grouped')}
                                                className={`text-[11px] px-3 py-1 rounded-md font-medium transition-colors ${gapsView === 'grouped' ? 'bg-[#E92A15] text-white' : 'text-[#666] hover:text-[#aaa]'}`}
                                            >
                                                By Competitor
                                            </button>
                                            <button
                                                onClick={() => setGapsView('all')}
                                                className={`text-[11px] px-3 py-1 rounded-md font-medium transition-colors ${gapsView === 'all' ? 'bg-[#E92A15] text-white' : 'text-[#666] hover:text-[#aaa]'}`}
                                            >
                                                All Gaps
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[#666] text-[13px] mb-6">Topics where competitors are mentioned but you aren't</p>

                                {gaps.length > 0 ? (
                                    gapsView === 'grouped' && gapsByCompetitor.length > 0 ? (
                                        <div className="space-y-8">
                                            {gapsByCompetitor.map(([compName, compGaps]) => (
                                                <div key={compName}>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <BrandAvatar name={compName} isUser={false} size={6} />
                                                        <div>
                                                            <h3 className="text-white text-[14px] font-semibold">
                                                                To beat {compName}, create content on:
                                                            </h3>
                                                            <p className="text-[#555] text-[11px]">
                                                                {compGaps.length} topic{compGaps.length !== 1 ? 's' : ''} where they appear and you don't
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 ml-9">
                                                        {compGaps.map((gap, i) => {
                                                            const topic = gap.contentTopic || gap.query || gap.topic || gap;
                                                            const prefill = gap.contentAngle || gap.contentTopic || gap.query || '';
                                                            const otherComps = (gap.competitorsPresent || [])
                                                                .filter(cp => (typeof cp === 'string' ? cp : cp.name) !== compName)
                                                                .map(cp => typeof cp === 'string' ? cp : cp.name)
                                                                .filter(Boolean);
                                                            return (
                                                                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-[#1a1a1a] bg-[#111] hover:border-[#E92A15]/20 transition-colors">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[#eee] text-[13px] font-medium leading-snug">{topic}</p>
                                                                        {gap.contentAngle && (
                                                                            <p className="text-[#666] text-[12px] mt-1 leading-relaxed">{gap.contentAngle}</p>
                                                                        )}
                                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                            {gap.category && (
                                                                                <span className="text-[9px] px-1.5 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#555] font-medium">{gap.category}</span>
                                                                            )}
                                                                            {gap.intent && (
                                                                                <span className="text-[9px] px-1.5 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#555] font-medium">{gap.intent}</span>
                                                                            )}
                                                                            {(gap.platforms || gap.engines || []).map((p, j) => (
                                                                                <span key={j} className="text-[9px] px-1.5 py-0.5 bg-[#0a1a0a] border border-[#22c55e]/20 rounded text-[#22c55e] font-medium">{p}</span>
                                                                            ))}
                                                                            {otherComps.length > 0 && (
                                                                                <span className="text-[#555] text-[10px]">Also: {otherComps.join(', ')}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => { localStorage.setItem('searchlyst_content_prefill', prefill); onTabChange?.('content-studio'); }}
                                                                        className="text-[11px] px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] rounded-lg hover:bg-[#E92A15]/10 hover:text-[#E92A15] hover:border-[#E92A15]/30 transition-all whitespace-nowrap shrink-0 self-start sm:self-center"
                                                                    >
                                                                        Write About This &rarr;
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {gaps.map((gap, i) => {
                                                const topic = gap.contentTopic || gap.query || gap.topic || gap;
                                                const prefill = gap.contentAngle || gap.contentTopic || gap.query || gap.topic || gap;
                                                const comps = gap.competitorsPresent || gap.competitors;
                                                const compLine = Array.isArray(comps)
                                                    ? comps.map(c => (typeof c === 'string' ? c : c.name)).filter(Boolean).join(', ')
                                                    : comps;
                                                return (
                                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-[#1a1a1a] bg-[#111] hover:border-[#E92A15]/20 transition-colors group">
                                                        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                                                            <Target className="w-3.5 h-3.5 text-[#666]" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#E92A15]/80 mb-0.5">Topic</p>
                                                            <p className="text-[#eee] text-[14px] font-medium leading-snug">{topic}</p>
                                                            {gap.contentAngle && <p className="text-[#777] text-[12px] mt-1.5 leading-relaxed">{gap.contentAngle}</p>}
                                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                {gap.category && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#555] font-medium">{gap.category}</span>
                                                                )}
                                                                {gap.intent && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#555] font-medium">{gap.intent}</span>
                                                                )}
                                                                {(gap.platforms || gap.engines || []).map((p, j) => (
                                                                    <span key={j} className="text-[9px] px-1.5 py-0.5 bg-[#0a1a0a] border border-[#22c55e]/20 rounded text-[#22c55e] font-medium">{p}</span>
                                                                ))}
                                                            </div>
                                                            {compLine && <p className="text-[#555] text-[11px] mt-1">Competitors cited: {compLine}</p>}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => { localStorage.setItem('searchlyst_content_prefill', prefill); onTabChange?.('content-studio'); }}
                                                            className="text-[11px] px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] rounded-lg hover:bg-[#E92A15]/10 hover:text-[#E92A15] hover:border-[#E92A15]/30 transition-all whitespace-nowrap shrink-0 self-start sm:self-center"
                                                        >
                                                            Write About This &rarr;
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                ) : <EmptyState message="Content gap analysis will appear after your first scan" />}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
