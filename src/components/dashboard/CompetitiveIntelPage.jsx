import React, { useState, useMemo } from 'react';
import {
    TrendingUp, BarChart3, Users, Target, Shield,
    ChevronUp, ChevronDown, AlertTriangle, Sparkles, Activity
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
    { id: 'sentiment', label: 'Sentiment', icon: Shield },
    { id: 'threats', label: 'Threats', icon: AlertTriangle },
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
        sentiment: scanData.sentiment || scanData.competitorAnalysis?.sentimentComparison || [],
        threats: scanData.competitorAnalysis?.threatRadar || scanData.competitorAnalysis?.threats || [],
        intelligence: scanData.intelligence || null,
    };
}

export default function CompetitiveIntelPage({ user, onTabChange }) {
    const [activeTab, setActiveTab] = useState('sov');
    const [aiPanelOpen, setAiPanelOpen] = useState(true);

    const scanData = useMemo(() => getVisibilityData(user?.domain, user?.projectId), [user?.domain, user?.projectId]);
    const data = useMemo(() => deriveData(scanData, user?.brandName), [scanData, user?.brandName]);

    const hasData = data && (data.sovData.length > 0 || data.rankings.length > 0 || data.entityGraph.length > 0);
    const sovData = data?.sovData || [];
    const rankings = data?.rankings || [];
    const entityGraph = data?.entityGraph || [];
    const gaps = data?.gaps || [];
    const sentiment = data?.sentiment || [];
    const threats = data?.threats || [];
    const intelligence = data?.intelligence || null;

    const competitors = sovData.filter(s => !s.isUser).map(s => s.name.split(' ')[0]);
    const userSov = sovData.find(s => s.isUser);
    const userSovPct = userSov?.percentage ?? 0;

    const threatLevelColor = {
        high: 'text-[#E92A15] bg-[#1a0a0a] border border-[#E92A15]/30',
        medium: 'text-[#f59e0b] bg-[#1a1200] border border-[#f59e0b]/30',
        low: 'text-[#22c55e] bg-[#0a1a0a] border border-[#22c55e]/30',
    };

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
                        <p className="text-[#888] text-[13px] mt-0.5">{hasData ? 'Live competitive data from your AI visibility scan' : 'Run a scan to see real competitive data'}</p>
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
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Active Threats</p>
                        <p className={`text-[38px] font-bold tracking-tight leading-none mb-2 ${hasData ? 'text-white' : 'text-[#333]'}`}>{hasData ? threats.length : '—'}</p>
                        <span className={`text-[12px] ${hasData && threats.some(t => (t.level || '').toLowerCase() === 'high') ? 'text-[#E92A15]' : 'text-[#666]'}`}>
                            {hasData ? (threats.length > 0 ? 'Monitor closely' : 'No threats detected') : 'Awaiting scan'}
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
                            <p className="text-[#666] text-[13px] mb-6">Your brand's position across AI engine search results</p>
                            {rankings.length > 0 ? (
                                <div className="space-y-3">
                                    {rankings.map((r, i) => {
                                        const isUser = r.isUser || r.isTargetBrand || (r.brand || r.name || '').toLowerCase() === (user?.brandName || '').toLowerCase();
                                        return (
                                            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${isUser ? 'border-[#E92A15]/30 bg-[#120404]' : 'border-[#1a1a1a] bg-[#111]'}`}>
                                                <span className={`text-[22px] font-bold w-8 shrink-0 ${isUser ? 'text-[#E92A15]' : 'text-[#333]'}`}>#{r.rank || i + 1}</span>
                                                <BrandAvatar name={r.brand || r.name} isUser={isUser} />
                                                <span className={`flex-1 text-[14px] font-medium ${isUser ? 'text-white' : 'text-[#888]'}`}>{r.brand || r.name}</span>
                                                <div className="text-right">
                                                    <p className="text-white text-[16px] font-bold">{r.score || r.sov || '--'}</p>
                                                    <p className="text-[#555] text-[11px]">Score</p>
                                                </div>
                                                <div className="text-right w-20">
                                                    <p className="text-white text-[16px] font-bold">{r.mentions || '--'}</p>
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
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">Content Gaps</h2>
                            <p className="text-[#666] text-[13px] mb-6">Topics where competitors are mentioned but you aren't</p>
                            {gaps.length > 0 ? (
                                <div className="space-y-3">
                                    {gaps.map((gap, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-[#1a1a1a] bg-[#111] hover:border-[#E92A15]/20 transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                                                <Target className="w-3.5 h-3.5 text-[#666]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[#ccc] text-[14px] font-medium truncate">{gap.query || gap.topic || gap}</p>
                                                {gap.competitors && <p className="text-[#555] text-[11px] mt-0.5">Mentioned: {Array.isArray(gap.competitors) ? gap.competitors.join(', ') : gap.competitors}</p>}
                                            </div>
                                            <button onClick={() => { localStorage.setItem('searchlyst_content_prefill', gap.query || gap.topic || gap); onTabChange?.('content-studio'); }} className="text-[11px] px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] rounded-lg hover:bg-[#E92A15]/10 hover:text-[#E92A15] hover:border-[#E92A15]/30 transition-all whitespace-nowrap shrink-0">Write About This →</button>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyState message="Content gap analysis will appear after your first scan" />}
                        </div>
                    )}

                    {activeTab === 'sentiment' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">Sentiment Comparison</h2>
                            <p className="text-[#666] text-[13px] mb-6">Brand sentiment across AI-generated responses</p>
                            {(() => {
                                const sentArr = Array.isArray(sentiment) ? sentiment : (sentiment?.brands || []);
                                if (sentArr.length === 0) return <EmptyState message="Sentiment comparison will appear after your first scan" />;
                                return (
                                    <>
                                        <div className="space-y-5">
                                            {sentArr.map((s, i) => {
                                                const isUser = s.isUser || s.isTargetBrand || (s.brand || s.name || '').toLowerCase() === (user?.brandName || '').toLowerCase();
                                                return (
                                                    <div key={i}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2"><BrandAvatar name={s.brand || s.name} isUser={isUser} size={6} /><span className={`text-[13px] font-medium ${isUser ? 'text-white' : 'text-[#888]'}`}>{s.brand || s.name}</span></div>
                                                            <div className="flex items-center gap-3 text-[11px]">
                                                                <span className="text-[#22c55e]">{s.positive || 0}% pos</span>
                                                                <span className="text-[#666]">{s.neutral || 0}% neu</span>
                                                                <span className="text-[#E92A15]">{s.negative || 0}% neg</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                                                            {(s.positive || 0) > 0 && <div className="bg-[#22c55e] rounded-l-full" style={{ width: `${s.positive}%` }} />}
                                                            {(s.neutral || 0) > 0 && <div className="bg-[#444]" style={{ width: `${s.neutral}%` }} />}
                                                            {(s.negative || 0) > 0 && <div className="bg-[#E92A15] rounded-r-full" style={{ width: `${s.negative}%` }} />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-[#1a1a1a]">
                                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /><span className="text-[#666] text-[11px]">Positive</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#444]" /><span className="text-[#666] text-[11px]">Neutral</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#E92A15]" /><span className="text-[#666] text-[11px]">Negative</span></div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {activeTab === 'threats' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">Threat Radar</h2>
                            <p className="text-[#666] text-[13px] mb-6">Active competitive threats detected across AI engines</p>
                            {threats.length > 0 ? threats.map((t, i) => {
                                const level = (t.level || 'medium').toLowerCase();
                                const colors = threatLevelColor[level] || threatLevelColor.medium;
                                return (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-[#1a1a1a] bg-[#111] mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0 mt-0.5">
                                            <AlertTriangle className="w-3.5 h-3.5 text-[#E92A15]" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <p className="text-white text-[14px] font-semibold">{t.competitor || t.brand || t.name}</p>
                                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${colors}`}>{level}</span>
                                            </div>
                                            <p className="text-[#888] text-[13px] leading-relaxed">{t.reason || t.description || 'Competitive threat detected'}</p>
                                        </div>
                                    </div>
                                );
                            }) : <EmptyState message="Threat analysis will appear after your first scan" />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
