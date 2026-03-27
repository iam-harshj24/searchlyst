import React, { useState, useMemo } from 'react';
import {
    TrendingUp, BarChart3, Users, Target, Zap, Eye, Shield, Globe,
    ChevronUp, ChevronDown, AlertTriangle, ArrowRight, Sparkles, RefreshCw,
    TrendingDown, Activity, Swords, Search, Award
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

// Fallback demo data matching the Figma design (Camana Homes context)
function getDemoData(user) {
    const brandName = user?.brandName || 'Your Brand';
    return {
        sov: [
            { name: brandName, percentage: 66.67, isUser: true, logo: null },
            { name: 'DAMAC Properties', percentage: 22.11, isUser: false, logo: null },
            { name: 'Emaar Properties', percentage: 8.41, isUser: false, logo: null },
            { name: 'Nakheel Group', percentage: 2.81, isUser: false, logo: null },
        ],
        competitors: ['DAMAC', 'Emaar', 'Nakheel'],
        contentGaps: 6,
        activeThreats: 2,
        sovChange: '+4.3%',
        aiInsights: [
            {
                type: 'SOV',
                color: 'border-[#2a2a2a] bg-[#111]',
                tagColor: 'text-[#888] bg-[#1a1a1a] border border-[#2a2a2a]',
                text: `${brandName} holds dominant SOV at 66.67% — outperforming the nearest competitor (DAMAC, 22.11%) by 44+ points across all tracked AI engines.`
            },
            {
                type: 'THREAT',
                color: 'border-[#2a2a2a] bg-[#111]',
                tagColor: 'text-[#E92A15] bg-[#1a0a0a] border border-[#E92A15]/30',
                text: `DAMAC's Gemini visibility grew +28% in 14 days and is encroaching on ${brandName}'s rankings for 3 high-volume prompts.`
            },
            {
                type: 'RISK',
                color: 'border-[#2a2a2a] bg-[#111]',
                tagColor: 'text-[#f59e0b] bg-[#1a1200] border border-[#f59e0b]/30',
                text: `A negative sentiment cluster around 'delivery delays' is forming on Perplexity. No counter-content currently exists.`
            },
            {
                type: 'OPPORTUNITY',
                color: 'border-[#2a2a2a] bg-[#111]',
                tagColor: 'text-[#22c55e] bg-[#0a1a0a] border border-[#22c55e]/30',
                text: `Emaar's ROI calculator dominates ChatGPT investment queries — 7 uncaptured prompts represent a clear content gap for ${brandName}.`
            },
        ],
        rankings: [
            { brand: brandName, rank: 1, score: 94, mentions: 312, isUser: true },
            { brand: 'DAMAC Properties', rank: 2, score: 71, mentions: 186, isUser: false },
            { brand: 'Emaar Properties', rank: 3, score: 58, mentions: 124, isUser: false },
            { brand: 'Nakheel Group', rank: 4, score: 34, mentions: 67, isUser: false },
        ],
        entityMap: [
            { name: brandName, domain: user?.domain || 'yourbrand.com', mentions: 312, queries: 48, isUser: true },
            { name: 'DAMAC Properties', domain: 'damacproperties.com', mentions: 186, queries: 34, isUser: false },
            { name: 'Emaar Properties', domain: 'emaar.com', mentions: 124, queries: 27, isUser: false },
            { name: 'Nakheel Group', domain: 'nakheel.com', mentions: 67, queries: 14, isUser: false },
        ],
        contentGapItems: [
            { topic: 'ROI calculator for investors', competitors: ['Emaar'] },
            { topic: 'Off-plan payment plans 2025', competitors: ['DAMAC', 'Emaar'] },
            { topic: 'Dubai property visa eligibility', competitors: ['Nakheel'] },
            { topic: 'Best time to buy in Dubai', competitors: ['DAMAC'] },
            { topic: 'Smart home features comparison', competitors: ['Emaar'] },
            { topic: 'Handover timelines comparison', competitors: ['DAMAC', 'Nakheel'] },
        ],
        sentiment: [
            { brand: brandName, positive: 74, neutral: 18, negative: 8, isUser: true },
            { brand: 'DAMAC Properties', positive: 55, neutral: 28, negative: 17, isUser: false },
            { brand: 'Emaar Properties', positive: 68, neutral: 22, negative: 10, isUser: false },
            { brand: 'Nakheel Group', positive: 61, neutral: 25, negative: 14, isUser: false },
        ],
        threats: [
            { competitor: 'DAMAC Properties', level: 'high', reason: "DAMAC's Gemini visibility grew +28% in 14 days and is encroaching on your rankings for 3 high-volume prompts." },
            { competitor: 'Emaar Properties', level: 'medium', reason: "Emaar's ROI calculator dominates ChatGPT investment queries — 7 uncaptured prompts represent a content gap." },
        ],
    };
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
    return (
        <div className={`w-${size} h-${size} rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${bg} ${text}`}>
            {initials}
        </div>
    );
}

export default function CompetitiveIntelPage({ user, onTabChange }) {
    const [activeTab, setActiveTab] = useState('sov');
    const [aiPanelOpen, setAiPanelOpen] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const scanData = useMemo(() => getVisibilityData(user?.domain, user?.projectId), [user?.domain, user?.projectId]);
    const demo = useMemo(() => getDemoData(user), [user]);

    // Resolve data from scan or fallback to demo
    const rawSov = scanData?.competitorAnalysis?.shareOfVoice || scanData?.shareOfVoice || null;
    const sovData = useMemo(() => {
        if (rawSov && Array.isArray(rawSov) && rawSov.length > 0) {
            return rawSov.map((s, i) => ({
                name: s.brand || s.name || `Brand ${i + 1}`,
                percentage: s.percentage || s.sov || 0,
                isUser: (s.brand || s.name || '').toLowerCase() === (user?.brandName || '').toLowerCase(),
            }));
        }
        return demo.sov;
    }, [rawSov, demo.sov, user?.brandName]);

    const competitors = useMemo(() => {
        const names = sovData.filter(s => !s.isUser).map(s => s.name.split(' ')[0]);
        return names.length > 0 ? names : demo.competitors;
    }, [sovData, demo.competitors]);

    const gaps = scanData?.competitorGaps || demo.contentGapItems;
    const threats = useMemo(() => {
        const raw = scanData?.competitorAnalysis?.threatRadar || scanData?.competitorAnalysis?.threats || [];
        if (raw.length > 0) return raw.map(t => ({ competitor: t.competitor || t.brand, level: t.level || 'medium', reason: t.reason || t.description }));
        return demo.threats;
    }, [scanData, demo.threats]);
    const rankings = scanData?.competitorAnalysis?.industryRankingDetailed || scanData?.industryRanking || demo.rankings;
    const entityMap = scanData?.entityGraph || demo.entityMap;
    const sentiment = scanData?.competitorAnalysis?.sentimentComparison || demo.sentiment;

    const userSov = sovData.find(s => s.isUser);
    const userSovPct = userSov ? userSov.percentage : demo.sov[0].percentage;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsRefreshing(false);
    };

    const threatLevelColor = {
        high: { tag: 'text-[#E92A15] bg-[#1a0a0a] border border-[#E92A15]/30', dot: 'bg-[#E92A15]' },
        medium: { tag: 'text-[#f59e0b] bg-[#1a1200] border border-[#f59e0b]/30', dot: 'bg-[#f59e0b]' },
        low: { tag: 'text-[#22c55e] bg-[#0a1a0a] border border-[#22c55e]/30', dot: 'bg-[#22c55e]' },
    };

    return (
        <div className="w-full pb-12">
            {/* ── Full-width sticky header ── */}
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <TrendingUp className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Competitive Intelligence</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">Live competitive data from your AI visibility scan</p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#E92A15] hover:bg-[#D12512] text-white text-[13px] font-semibold rounded-full transition-all shadow-[0_0_20px_rgba(233,42,21,0.35)] disabled:opacity-60"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="mt-8 space-y-6 max-w-[1400px]">
                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Your Share of Voice */}
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Your Share of Voice</p>
                        <p className="text-white text-[38px] font-bold tracking-tight leading-none mb-2">
                            {typeof userSovPct === 'number' ? userSovPct.toFixed(2) : userSovPct}%
                        </p>
                        <span className="text-[#22c55e] text-[12px] font-medium">
                            {demo.sovChange} vs last week
                        </span>
                    </div>

                    {/* Competitors Tracked */}
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Competitors Tracked</p>
                        <p className="text-white text-[38px] font-bold tracking-tight leading-none mb-2">
                            {competitors.length}
                        </p>
                        <span className="text-[#666] text-[12px]">
                            {competitors.slice(0, 3).join(' · ')}
                        </span>
                    </div>

                    {/* Content Gaps */}
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Content Gaps</p>
                        <p className="text-white text-[38px] font-bold tracking-tight leading-none mb-2">
                            {Array.isArray(gaps) ? gaps.length : demo.contentGaps}
                        </p>
                        <span className="text-[#666] text-[12px]">Actionable topics found</span>
                    </div>

                    {/* Active Threats */}
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Active Threats</p>
                        <p className="text-white text-[38px] font-bold tracking-tight leading-none mb-2">
                            {threats.length}
                        </p>
                        <span className="text-[#E92A15] text-[12px] font-medium">
                            {threats.some(t => t.level === 'high') ? 'High severity — review now' : 'Monitor closely'}
                        </span>
                    </div>
                </div>

                {/* ── AI Analysis Panel ── */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl overflow-hidden">
                    {/* Panel Header */}
                    <button
                        onClick={() => setAiPanelOpen(o => !o)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#111] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-xl flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-[#888]" />
                            </div>
                            <span className="text-white font-semibold text-[15px]">AI Analysis</span>
                            <span className="text-[#666] text-[11px] font-bold px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md tracking-wide">GPT-4O</span>
                        </div>
                        {aiPanelOpen
                            ? <ChevronUp className="w-4 h-4 text-[#555]" />
                            : <ChevronDown className="w-4 h-4 text-[#555]" />
                        }
                    </button>

                    {/* Insight Cards Grid */}
                    {aiPanelOpen && (
                        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {demo.aiInsights.map((insight, i) => (
                                <div key={i} className={`rounded-xl p-4 border ${insight.color}`}>
                                    <span className={`inline-block text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded mb-3 ${insight.tagColor}`}>
                                        {insight.type}
                                    </span>
                                    <p className="text-[#aaa] text-[13px] leading-relaxed">{insight.text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="border-b border-[#222]">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-all relative ${
                                        isActive
                                            ? 'text-white'
                                            : 'text-[#666] hover:text-[#aaa]'
                                    }`}
                                >
                                    <Icon className={`w-[15px] h-[15px] ${isActive ? 'text-[#E92A15]' : ''}`} />
                                    {tab.label}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E92A15] rounded-t-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Tab Content ── */}
                <div>
                    {/* Share of Voice */}
                    {activeTab === 'sov' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-white font-semibold text-[17px] mb-1">Share of Voice — All AI Engines</h2>
                                    <p className="text-[#666] text-[13px]">How your brand's visibility compares to competitors across AI platforms</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1a0a] border border-[#22c55e]/30 rounded-xl shrink-0">
                                    <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" />
                                    <span className="text-[#22c55e] text-[12px] font-semibold">{demo.sovChange} this week</span>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {sovData.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        {/* Brand logo/avatar */}
                                        <BrandAvatar name={item.name} isUser={item.isUser} size={7} />
                                        {/* Brand name */}
                                        <span className={`text-[14px] w-[160px] shrink-0 truncate ${item.isUser ? 'text-white font-semibold' : 'text-[#888]'}`}>
                                            {item.name}
                                        </span>
                                        {/* Bar */}
                                        <div className="flex-1 h-[6px] bg-[#1a1a1a] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${item.isUser ? 'bg-gradient-to-r from-[#E92A15] to-[#ff4f2a]' : 'bg-[#E92A15]/50'}`}
                                                style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                            />
                                        </div>
                                        {/* Percentage */}
                                        <span className={`text-[14px] font-semibold w-14 text-right shrink-0 ${item.isUser ? 'text-white' : 'text-[#555]'}`}>
                                            {typeof item.percentage === 'number' ? item.percentage.toFixed(2) : item.percentage}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Rankings */}
                    {activeTab === 'rankings' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">AI Rankings</h2>
                            <p className="text-[#666] text-[13px] mb-6">Your brand's position across AI engine search results</p>
                            <div className="space-y-3">
                                {(Array.isArray(rankings) ? rankings : demo.rankings).map((r, i) => {
                                    const isUser = r.isUser || (r.brand || r.name || '').toLowerCase() === (user?.brandName || '').toLowerCase();
                                    return (
                                        <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${isUser ? 'border-[#E92A15]/30 bg-[#120404]' : 'border-[#1a1a1a] bg-[#111]'}`}>
                                            <span className={`text-[22px] font-bold w-8 shrink-0 ${isUser ? 'text-[#E92A15]' : 'text-[#333]'}`}>#{r.rank || i + 1}</span>
                                            <BrandAvatar name={r.brand || r.name} isUser={isUser} />
                                            <span className={`flex-1 text-[14px] font-medium ${isUser ? 'text-white' : 'text-[#888]'}`}>{r.brand || r.name}</span>
                                            <div className="text-right">
                                                <p className="text-white text-[16px] font-bold">{r.score || '--'}</p>
                                                <p className="text-[#555] text-[11px]">AI Score</p>
                                            </div>
                                            <div className="text-right w-20">
                                                <p className="text-white text-[16px] font-bold">{r.mentions || '--'}</p>
                                                <p className="text-[#555] text-[11px]">Mentions</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Entity Map */}
                    {activeTab === 'entities' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">Entity Map</h2>
                            <p className="text-[#666] text-[13px] mb-6">Brands and entities detected across all AI engine responses</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(Array.isArray(entityMap) ? entityMap : demo.entityMap).map((entity, i) => {
                                    const isUser = entity.isUser || entity.isTargetBrand || (entity.name || '').toLowerCase() === (user?.brandName || '').toLowerCase();
                                    return (
                                        <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${isUser ? 'border-[#E92A15]/30 bg-[#120404]' : 'border-[#1a1a1a] bg-[#111]'}`}>
                                            <BrandAvatar name={entity.name} isUser={isUser} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-[14px] font-medium truncate ${isUser ? 'text-white' : 'text-[#aaa]'}`}>{entity.name}</p>
                                                    {isUser && <span className="text-[9px] px-1.5 py-0.5 bg-[#E92A15]/20 text-[#E92A15] rounded font-bold">YOU</span>}
                                                </div>
                                                <p className="text-[#555] text-[11px] truncate">{entity.domain || entity.domain}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-white text-[15px] font-bold">{entity.totalMentions || entity.mentions}</p>
                                                <p className="text-[#555] text-[11px]">{entity.queryCount || entity.queries} queries</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Content Gaps */}
                    {activeTab === 'gaps' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">Content Gaps</h2>
                            <p className="text-[#666] text-[13px] mb-6">Topics where competitors are mentioned but you aren't — write here to close the gap</p>
                            <div className="space-y-3">
                                {(Array.isArray(gaps) && gaps.length > 0 ? gaps : demo.contentGapItems).map((gap, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-[#1a1a1a] bg-[#111] hover:border-[#E92A15]/20 transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                                            <Target className="w-3.5 h-3.5 text-[#666]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[#ccc] text-[14px] font-medium truncate">{gap.query || gap.topic || gap}</p>
                                            {gap.competitors && (
                                                <p className="text-[#555] text-[11px] mt-0.5">
                                                    Mentioned: {Array.isArray(gap.competitors) ? gap.competitors.join(', ') : gap.competitors}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                const topic = gap.query || gap.topic || gap;
                                                localStorage.setItem('searchlyst_content_prefill', topic);
                                                onTabChange?.('content-studio');
                                            }}
                                            className="text-[11px] px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] rounded-lg hover:bg-[#E92A15]/10 hover:text-[#E92A15] hover:border-[#E92A15]/30 transition-all whitespace-nowrap shrink-0 group-hover:border-[#E92A15]/20"
                                        >
                                            Write About This →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sentiment */}
                    {activeTab === 'sentiment' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">Sentiment Comparison</h2>
                            <p className="text-[#666] text-[13px] mb-6">Brand sentiment across AI-generated responses</p>
                            <div className="space-y-5">
                                {(Array.isArray(sentiment) && sentiment.length > 0 ? sentiment : demo.sentiment).map((s, i) => {
                                    const isUser = s.isUser || (s.brand || s.name || '').toLowerCase() === (user?.brandName || '').toLowerCase();
                                    return (
                                        <div key={i}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <BrandAvatar name={s.brand || s.name} isUser={isUser} size={6} />
                                                    <span className={`text-[13px] font-medium ${isUser ? 'text-white' : 'text-[#888]'}`}>{s.brand || s.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px]">
                                                    <span className="text-[#22c55e]">{s.positive}% pos</span>
                                                    <span className="text-[#666]">{s.neutral}% neu</span>
                                                    <span className="text-[#E92A15]">{s.negative}% neg</span>
                                                </div>
                                            </div>
                                            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                                                {s.positive > 0 && <div className="bg-[#22c55e] rounded-l-full" style={{ width: `${s.positive}%` }} />}
                                                {s.neutral > 0 && <div className="bg-[#444]" style={{ width: `${s.neutral}%` }} />}
                                                {s.negative > 0 && <div className="bg-[#E92A15] rounded-r-full" style={{ width: `${s.negative}%` }} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Legend */}
                            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-[#1a1a1a]">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /><span className="text-[#666] text-[11px]">Positive</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#444]" /><span className="text-[#666] text-[11px]">Neutral</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#E92A15]" /><span className="text-[#666] text-[11px]">Negative</span></div>
                            </div>
                        </div>
                    )}

                    {/* Threats */}
                    {activeTab === 'threats' && (
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <h2 className="text-white font-semibold text-[17px] mb-1">Threat Radar</h2>
                            <p className="text-[#666] text-[13px] mb-6">Active competitive threats detected across AI engines</p>
                            {(threats.length > 0 ? threats : demo.threats).map((t, i) => {
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
                                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${colors.tag}`}>
                                                    {level}
                                                </span>
                                            </div>
                                            <p className="text-[#888] text-[13px] leading-relaxed">{t.reason || t.description || 'Competitive threat detected'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}