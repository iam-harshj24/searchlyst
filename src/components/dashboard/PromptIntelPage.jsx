import React, { useState, useMemo } from 'react';
import {
    Search, ChevronDown, ChevronUp, Eye, EyeOff,
    Globe, MessageSquare, CheckCircle, XCircle, Target,
    RotateCw, ArrowRight, Terminal
} from 'lucide-react';

// ── Data helpers ──────────────────────────────────────────────────────────────
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

// ── Engine config ─────────────────────────────────────────────────────────────
const ENGINE_CONFIG = {
    perplexity: {
        label: 'Perplexity',
        icon: ({ size = 18 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                <path d="M4 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 12v10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
    },
    gemini: {
        label: 'Gemini',
        icon: ({ size = 18 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="none" fill="currentColor" opacity="0.2" />
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 2C8 8 8 16 12 22C16 16 16 8 12 2z" fill="currentColor" opacity="0.6" />
            </svg>
        ),
    },
    chatgpt: {
        label: 'ChatGPT',
        icon: ({ size = 18 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.28 9.28a5.76 5.76 0 00-.62-4.73 5.84 5.84 0 00-6.29-2.8A5.77 5.77 0 0011.07 0a5.84 5.84 0 00-5.57 4.05 5.78 5.78 0 00-3.86 2.8 5.84 5.84 0 00.72 6.85 5.76 5.76 0 00.62 4.73 5.84 5.84 0 006.29 2.8A5.77 5.77 0 0012.93 24a5.84 5.84 0 005.58-4.05 5.78 5.78 0 003.85-2.8 5.84 5.84 0 00-.72-6.85l.64-.02zM12.93 22.5a4.34 4.34 0 01-2.79-1.01l.14-.08 4.63-2.67a.77.77 0 00.39-.67v-6.52l1.96 1.13a.07.07 0 01.04.05v5.4a4.36 4.36 0 01-4.37 4.37zm-9.38-4a4.32 4.32 0 01-.52-2.93l.14.08 4.62 2.67a.77.77 0 00.78 0l5.65-3.26v2.26a.08.08 0 01-.03.06L9.5 20.06a4.37 4.37 0 01-5.95-1.57zm-1.22-10.1a4.33 4.33 0 012.27-1.91v5.47a.77.77 0 00.39.67l5.65 3.26-1.96 1.13a.08.08 0 01-.07 0L4.3 14.3a4.37 4.37 0 01-.97-5.9zm16.09 3.74l-5.65-3.26 1.96-1.13a.08.08 0 01.07 0l5.32 3.07a4.36 4.36 0 01-.67 7.87V13.4a.77.77 0 00-.39-.66l-.64-.6zm1.95-2.93l-.14-.08-4.62-2.67a.77.77 0 00-.78 0L9.18 10.72V8.46a.08.08 0 01.03-.06l5.32-3.07a4.36 4.36 0 016.5 4.52l-.65-.74zm-12.28 4.03l-1.96-1.13a.07.07 0 01-.04-.05V6.68a4.36 4.36 0 017.16-3.35l-.14.08-4.63 2.67a.77.77 0 00-.39.67v6.51zm1.06-2.3l2.52-1.45 2.51 1.45v2.9l-2.51 1.45-2.52-1.45v-2.9z" />
            </svg>
        ),
    },
    googleAI: {
        label: 'Google AI',
        icon: ({ size = 18 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
    },
    claude: {
        label: 'Claude',
        icon: ({ size = 18 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M12 3L4 8v8l8 5 8-5V8L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M12 3v18M4 8l8 5 8-5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
    },
};

// Generic fallback for unknown engines
function getEngineConfig(eng) {
    return ENGINE_CONFIG[eng] || {
        label: eng.charAt(0).toUpperCase() + eng.slice(1),
        icon: ({ size = 18 }) => (
            <div style={{ width: size, height: size }} className="flex items-center justify-center text-[10px] font-bold">
                {eng.slice(0, 2).toUpperCase()}
            </div>
        ),
    };
}

// ── Demo data (shown when no scan data) ──────────────────────────────────────
function getDemoPrompts(user) {
    const brand = user?.brandName || 'Camana Homes';
    const industry = user?.industry || 'Real Estate';
    return [
        {
            promptId: 'd1', query: 'Search the web right now and answer the following. Every single claim must have an inline citation [1], [2] etc. and a full source list at the end. If you cannot fi…',
            category: 'industry', engines: { perplexity: { mentioned: false }, gemini: { mentioned: false, snippet: null }, chatgpt: { mentioned: false } }
        },
        {
            promptId: 'd2', query: `I need to know exactly how AI search engines and review platforms describe "${brand}" vs allsoppandallsopp.com, drivenproperties.com, damacprope…`,
            category: 'comparison', engines: { perplexity: { mentioned: false }, gemini: { mentioned: false }, chatgpt: { mentioned: false } }
        },
        {
            promptId: 'd3', query: `Search the web right now. I need a Share of Voice analysis for ${brand} vs allsoppandallsopp.com, drivenproperties.com, damacproperties.com across…`,
            category: 'brand', engines: { perplexity: { mentioned: false }, gemini: { mentioned: false }, chatgpt: { mentioned: false } }
        },
        {
            promptId: 'd4', query: '[GOOGLE SEARCH GROUNDING: ON] [RULE: Every claim must have an inline citation. No citation = omit the claim.] [DATE FILTER: Only use sources published…',
            category: 'industry', engines: { perplexity: { mentioned: false }, gemini: { mentioned: true, snippet: `${brand} ranks #2 in AI citations.`, positionRank: 2 }, chatgpt: { mentioned: false } }
        },
        {
            promptId: 'd5', query: '[GOOGLE SEARCH GROUNDING: ON] [STRICT RULE: If a claim has no grounded source link — do not include it] TASK: Audit how "Camana Homes" is describ…',
            category: 'brand', engines: { perplexity: { mentioned: false }, gemini: { mentioned: false }, chatgpt: { mentioned: false } }
        },
        {
            promptId: 'd6', query: '[GOOGLE SEARCH GROUNDING: ON] [CRITICAL RULE: Only report events you find a live URL for. No URL = the event did not happen as far as this report is co…',
            category: 'industry', engines: { perplexity: { mentioned: false }, gemini: { mentioned: false }, chatgpt: { mentioned: false } }
        },
        {
            promptId: 'd7', query: `best ${industry} tools 2026`,
            category: 'use_case', engines: { perplexity: { mentioned: false }, gemini: { mentioned: false }, chatgpt: { mentioned: false, snippet: null } }
        },
        {
            promptId: 'd8', query: `${brand} reviews`,
            category: 'brand', engines: { perplexity: { mentioned: false }, gemini: { mentioned: true, snippet: `Excellent reviews for ${brand}.`, positionRank: 1 }, chatgpt: { mentioned: true, positionRank: 1 } }
        },
        {
            promptId: 'd9', query: `${brand} vs allsoppandallsopp.com`,
            category: 'comparison', engines: { perplexity: { mentioned: false }, gemini: { mentioned: true, positionRank: 1 }, chatgpt: { mentioned: true, positionRank: 1 } }
        },
    ];
}

// ── Small engine icon badge ───────────────────────────────────────────────────
function EngineBadge({ eng }) {
    const cfg = getEngineConfig(eng);
    const Icon = cfg.icon;
    return (
        <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#666] shrink-0" title={cfg.label}>
            <Icon size={14} />
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PromptIntelPage({ user }) {
    const [expandedPrompt, setExpandedPrompt] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [activeChip, setActiveChip] = useState(null); // 'mentioned' | 'not_mentioned' | engine key

    const scanData = useMemo(() => getVisibilityData(user?.domain, user?.projectId), [user?.domain, user?.projectId]);
    const rawPrompts = scanData?.prompts?.length ? scanData.prompts : getDemoPrompts(user);

    // Build engine stats
    const engineStats = useMemo(() => {
        const stats = {};
        rawPrompts.forEach(p => {
            Object.entries(p.engines || {}).forEach(([eng, data]) => {
                if (!stats[eng]) stats[eng] = { total: 0, mentioned: 0 };
                stats[eng].total++;
                if (data.mentioned) stats[eng].mentioned++;
            });
        });
        return stats;
    }, [rawPrompts]);

    const allEngines = Object.keys(engineStats);
    const totalPrompts = rawPrompts.length;
    const mentionedCount = rawPrompts.filter(p => Object.values(p.engines || {}).some(e => e.mentioned)).length;
    const mentionRate = totalPrompts > 0 ? Math.round((mentionedCount / totalPrompts) * 100) : 0;
    const enginesUsed = allEngines.length;

    const categories = useMemo(() => {
        const cats = new Set(rawPrompts.map(p => p.category).filter(Boolean));
        return ['all', ...cats];
    }, [rawPrompts]);

    const filteredPrompts = useMemo(() => {
        return rawPrompts.filter(p => {
            if (searchQuery && !p.query?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterCategory !== 'all' && p.category !== filterCategory) return false;
            const anyMentioned = Object.values(p.engines || {}).some(e => e.mentioned);
            if (filterStatus === 'mentioned' && !anyMentioned) return false;
            if (filterStatus === 'not_mentioned' && anyMentioned) return false;
            if (activeChip === 'mentioned' && !anyMentioned) return false;
            if (activeChip === 'not_mentioned' && anyMentioned) return false;
            if (activeChip && allEngines.includes(activeChip)) {
                const engData = p.engines?.[activeChip];
                if (!engData?.mentioned) return false;
            }
            return true;
        });
    }, [rawPrompts, searchQuery, filterCategory, filterStatus, activeChip, allEngines]);

    const chips = [
        { key: 'mentioned', label: 'Brand mentioned', icon: <CheckCircle className="w-3.5 h-3.5" /> },
        { key: 'not_mentioned', label: 'Not mentioned', icon: <XCircle className="w-3.5 h-3.5" /> },
        ...allEngines.map(eng => {
            const cfg = getEngineConfig(eng);
            const Icon = cfg.icon;
            return { key: eng, label: cfg.label, icon: <Icon size={14} /> };
        }),
    ];

    return (
        <div className="w-full pb-12">
            {/* ── Sticky Header ── */}
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#0a0505] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Terminal className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Prompt Intelligence</h1>
                        <p className="text-[#666] text-[13px] mt-0.5">Every prompt sent to AI engines and their structured responses</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-[#E92A15] hover:bg-[#c82010] text-white text-[13px] font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(233,42,21,0.3)] hover:shadow-[0_0_28px_rgba(233,42,21,0.5)]">
                    <RotateCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            <div className="mt-8 space-y-5">
                {/* ── 4 KPI Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'TOTAL PROMPTS SENT', value: totalPrompts },
                        { label: 'BRAND MENTIONED', value: mentionedCount },
                        { label: 'MENTION RATE', value: `${mentionRate}%` },
                        { label: 'ENGINES USED', value: enginesUsed },
                    ].map((kpi, i) => (
                        <div key={i} className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl p-5 hover:border-[#2a2a2a] transition-colors">
                            <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.14em] mb-3">{kpi.label}</p>
                            <p className="text-white text-[38px] font-bold tracking-tight leading-none">{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Per-Engine Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {allEngines.map(eng => {
                        const stats = engineStats[eng];
                        const rate = stats.total > 0 ? Math.round((stats.mentioned / stats.total) * 100) : 0;
                        const cfg = getEngineConfig(eng);
                        const Icon = cfg.icon;
                        const notMentioned = stats.total - stats.mentioned;
                        return (
                            <div key={eng} className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl p-5 hover:border-[#2a2a2a] transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-[#161616] border border-[#2a2a2a] flex items-center justify-center text-[#888]">
                                            <Icon size={16} />
                                        </div>
                                        <span className="text-[#ccc] text-[14px] font-semibold">{cfg.label}</span>
                                    </div>
                                    <span className="text-white text-[22px] font-bold">{rate}%</span>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full h-[3px] bg-[#1e1e1e] rounded-full overflow-hidden mb-3">
                                    <div
                                        className="h-full rounded-full bg-white transition-all"
                                        style={{ width: `${rate}%` }}
                                    />
                                </div>
                                <div className="flex items-center gap-4 text-[11px]">
                                    <span className="flex items-center gap-1.5 text-[#666]">
                                        <CheckCircle className="w-3 h-3 text-[#444]" />
                                        {stats.mentioned} mentioned
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[#555]">
                                        <XCircle className="w-3 h-3 text-[#333]" />
                                        {notMentioned} not mentioned
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {/* Fill empty slots if < 4 engines */}
                    {allEngines.length < 4 && Array.from({ length: 4 - allEngines.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-[#0B0B0B] border border-[#1a1a1a] rounded-2xl p-5 opacity-30">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#161616] border border-[#2a2a2a]" />
                                    <div className="h-3 w-16 bg-[#1e1e1e] rounded" />
                                </div>
                                <div className="h-5 w-10 bg-[#1e1e1e] rounded" />
                            </div>
                            <div className="w-full h-[3px] bg-[#1e1e1e] rounded-full mb-3" />
                        </div>
                    ))}
                </div>

                {/* ── Filter Bar ── */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[220px] max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search topics..."
                            className="w-full pl-9 pr-4 py-2.5 bg-[#0B0B0B] border border-[#1e1e1e] rounded-xl text-[#ccc] text-[13px] placeholder:text-[#444] focus:outline-none focus:border-[#333] transition-colors"
                        />
                    </div>

                    <div className="flex-1" />

                    {/* Category dropdown */}
                    <div className="relative">
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2.5 bg-[#0B0B0B] border border-[#1e1e1e] rounded-xl text-[#888] text-[13px] focus:outline-none focus:border-[#333] cursor-pointer transition-colors"
                        >
                            {categories.map(c => (
                                <option key={c} value={c} className="bg-[#111]">
                                    {c === 'all' ? 'All Categories' : c.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555] pointer-events-none" />
                    </div>

                    {/* Status dropdown */}
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2.5 bg-[#0B0B0B] border border-[#1e1e1e] rounded-xl text-[#888] text-[13px] focus:outline-none focus:border-[#333] cursor-pointer transition-colors"
                        >
                            <option value="all" className="bg-[#111]">All Status</option>
                            <option value="mentioned" className="bg-[#111]">Mentioned</option>
                            <option value="not_mentioned" className="bg-[#111]">Not Mentioned</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555] pointer-events-none" />
                    </div>

                    {/* Count */}
                    <span className="text-[#444] text-[13px] font-medium shrink-0">
                        {filteredPrompts.length}/{totalPrompts}
                    </span>
                </div>

                {/* ── Chip Filters ── */}
                <div className="flex flex-wrap gap-2">
                    {chips.map(chip => {
                        const isActive = activeChip === chip.key;
                        return (
                            <button
                                key={chip.key}
                                onClick={() => setActiveChip(isActive ? null : chip.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${isActive
                                    ? 'bg-[#1e1e1e] border-[#333] text-white'
                                    : 'bg-transparent border-[#1e1e1e] text-[#666] hover:border-[#2a2a2a] hover:text-[#888]'
                                }`}
                            >
                                <span className={isActive ? 'text-white' : 'text-[#444]'}>{chip.icon}</span>
                                {chip.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Prompt List ── */}
                <div className="space-y-2">
                    {filteredPrompts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl">
                            <div className="w-14 h-14 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-4">
                                <Terminal className="w-7 h-7 text-[#333]" />
                            </div>
                            <p className="text-[#555] text-[14px] font-medium mb-1">No prompts match your filters</p>
                            <p className="text-[#333] text-[12px]">Try adjusting your search or filters</p>
                        </div>
                    ) : filteredPrompts.map((p, i) => {
                        const engines = Object.entries(p.engines || {});
                        const anyMentioned = engines.some(([, e]) => e.mentioned);
                        const isExpanded = expandedPrompt === (p.promptId || i);
                        // Which single engine icon to show (first mentioned, or first)
                        const primaryEng = engines.find(([, e]) => e.mentioned)?.[0] || engines[0]?.[0];

                        return (
                            <div
                                key={p.promptId || i}
                                className="bg-[#0B0B0B] border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#222] transition-colors"
                            >
                                {/* Row */}
                                <button
                                    onClick={() => setExpandedPrompt(isExpanded ? null : (p.promptId || i))}
                                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#0f0f0f] transition-colors"
                                >
                                    {/* Status icon */}
                                    {anyMentioned ? (
                                        <CheckCircle className="w-5 h-5 text-[#3a3a3a] shrink-0" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-[#2a2a2a] shrink-0" />
                                    )}

                                    {/* Prompt text */}
                                    <span className="flex-1 text-[#bbb] text-[13px] leading-snug truncate">
                                        {p.query}
                                    </span>

                                    {/* Engine badge — last engine used */}
                                    {primaryEng && <EngineBadge eng={primaryEng} />}

                                    {/* Chevron */}
                                    {isExpanded
                                        ? <ChevronUp className="w-4 h-4 text-[#444] shrink-0" />
                                        : <ChevronDown className="w-4 h-4 text-[#444] shrink-0" />
                                    }
                                </button>

                                {/* Expanded panel */}
                                {isExpanded && (
                                    <div className="border-t border-[#1a1a1a] px-5 pb-5 pt-4 space-y-3">
                                        {/* Full prompt */}
                                        <div className="bg-[#080808] rounded-xl p-4 border border-[#1a1a1a]">
                                            <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.12em] mb-2">Full Prompt</p>
                                            <p className="text-[#888] text-[12px] leading-relaxed">{p.query}</p>
                                        </div>

                                        {/* Per-engine results */}
                                        <div className="space-y-2">
                                            {engines.map(([eng, data]) => {
                                                const cfg = getEngineConfig(eng);
                                                const Icon = cfg.icon;
                                                return (
                                                    <div
                                                        key={eng}
                                                        className={`rounded-xl border p-4 ${data.mentioned
                                                            ? 'border-[#2a2a2a] bg-[#0d0d0d]'
                                                            : 'border-[#161616] bg-[#090909]'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 mb-2">
                                                            <div className="w-6 h-6 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#666]">
                                                                <Icon size={13} />
                                                            </div>
                                                            <span className="text-[#aaa] text-[12px] font-semibold">{cfg.label}</span>
                                                            {data.mentioned ? (
                                                                <span className="flex items-center gap-1 text-[#22c55e] text-[11px] ml-auto">
                                                                    <Eye className="w-3 h-3" /> Mentioned
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-[#555] text-[11px] ml-auto">
                                                                    <EyeOff className="w-3 h-3" /> Not mentioned
                                                                </span>
                                                            )}
                                                        </div>

                                                        {data.positionRank && (
                                                            <div className="flex items-center gap-2 text-[11px] mb-1">
                                                                <Target className="w-3 h-3 text-[#444]" />
                                                                <span className="text-[#555]">Position:</span>
                                                                <span className={`font-bold ${data.positionRank <= 3 ? 'text-[#22c55e]' : data.positionRank <= 5 ? 'text-[#f59e0b]' : 'text-[#888]'}`}>
                                                                    #{data.positionRank}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {data.snippet && (
                                                            <div className="mt-2">
                                                                <div className="flex items-center gap-1.5 text-[#444] text-[10px] mb-1.5">
                                                                    <MessageSquare className="w-3 h-3" /> Brand snippet
                                                                </div>
                                                                <p className="text-[#777] bg-[#080808] rounded-lg p-3 text-[11px] leading-relaxed italic border border-[#161616]">
                                                                    "{data.snippet}"
                                                                </p>
                                                            </div>
                                                        )}

                                                        {data.citations != null && (
                                                            <div className="mt-2 text-[11px]">
                                                                <div className="flex items-center gap-1.5 text-[#444] mb-1.5">
                                                                    <Globe className="w-3 h-3" />
                                                                    <span>Citations: {Array.isArray(data.citations) ? data.citations.length : data.citations}</span>
                                                                </div>
                                                                {Array.isArray(data.citations) && data.citations.length > 0 && (
                                                                    <ul className="space-y-1">
                                                                        {data.citations.map((c, idx) => (
                                                                            <li key={idx}>
                                                                                <a href={c.url} target="_blank" rel="noopener noreferrer"
                                                                                    className={`text-[10px] truncate block hover:underline ${c.isTargetBrand ? 'text-[#22c55e] font-medium' : 'text-[#4a8abf]'}`}
                                                                                    title={c.url}>
                                                                                    {c.domain || c.url}
                                                                                </a>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        )}

                                                        {!data.mentioned && !data.snippet && !data.citations && (
                                                            <p className="text-[#333] text-[11px] italic mt-1">No brand data extracted for this engine</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
