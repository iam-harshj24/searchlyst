import React, { useState, useMemo } from 'react';
import {
    Terminal, Search, Filter, ChevronDown, ChevronUp, Eye, EyeOff,
    Globe, Sparkles, Zap, MessageSquare, CheckCircle2, XCircle, MinusCircle,
    BarChart3, Target, ArrowRight
} from 'lucide-react';

function getVisibilityData(domain) {
    try {
        const key = `searchlyst_visibility_${domain || 'default'}`;
        return JSON.parse(localStorage.getItem(key));
    } catch { return null; }
}

const engineLabel = { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'Google AI' };
const engineColor = { perplexity: 'purple', gemini: 'blue', googleAI: 'green' };
const engineBg = { perplexity: 'bg-purple-500/10 text-purple-400 border-purple-500/20', gemini: 'bg-blue-500/10 text-blue-400 border-blue-500/20', googleAI: 'bg-green-500/10 text-green-400 border-green-500/20' };
const sentimentEmoji = { positive: '😊', negative: '😞', neutral: '😐', mixed: '🤔', 'n/a': '—' };

const categoryStyles = {
    'brand': 'bg-red-500/10 text-red-400',
    'industry': 'bg-blue-500/10 text-blue-400',
    'comparison': 'bg-purple-500/10 text-purple-400',
    'review': 'bg-yellow-500/10 text-yellow-400',
    'use_case': 'bg-green-500/10 text-green-400',
    'long_tail': 'bg-cyan-500/10 text-cyan-400',
};

export default function PromptIntelPage({ user }) {
    const [expandedPrompt, setExpandedPrompt] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterMentioned, setFilterMentioned] = useState('all');

    const scanData = useMemo(() => getVisibilityData(user?.domain), [user?.domain]);
    const prompts = scanData?.prompts || [];

    const categories = useMemo(() => {
        const cats = new Set(prompts.map(p => p.category).filter(Boolean));
        return ['all', ...cats];
    }, [prompts]);

    const filteredPrompts = useMemo(() => {
        return prompts.filter(p => {
            if (searchQuery && !p.query?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterCategory !== 'all' && p.category !== filterCategory) return false;
            if (filterMentioned !== 'all') {
                const anyMentioned = Object.values(p.engines || {}).some(e => e.mentioned);
                if (filterMentioned === 'mentioned' && !anyMentioned) return false;
                if (filterMentioned === 'not_mentioned' && anyMentioned) return false;
            }
            return true;
        });
    }, [prompts, searchQuery, filterCategory, filterMentioned]);

    // Stats
    const totalPrompts = prompts.length;
    const mentionedCount = prompts.filter(p => Object.values(p.engines || {}).some(e => e.mentioned)).length;
    const mentionRate = totalPrompts > 0 ? Math.round((mentionedCount / totalPrompts) * 100) : 0;
    const engineStats = {};
    prompts.forEach(p => {
        Object.entries(p.engines || {}).forEach(([eng, data]) => {
            if (!engineStats[eng]) engineStats[eng] = { total: 0, mentioned: 0 };
            engineStats[eng].total++;
            if (data.mentioned) engineStats[eng].mentioned++;
        });
    });

    if (prompts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-5">
                    <Terminal className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No Prompt Data Available</h2>
                <p className="text-[var(--text-secondary)] text-sm max-w-md mb-6">
                    Run an AI Visibility Scan to see every prompt sent to AI engines and their structured responses.
                </p>
                <button className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-[var(--text-primary)] text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
                    Run Scan <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-red-400" /> Prompt Intelligence
                </h1>
                <p className="text-[var(--text-secondary)] text-sm mt-0.5">Every prompt sent to AI engines and their structured responses</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                    <div className="text-[var(--text-muted)] text-xs mb-1">Total Prompts</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{totalPrompts}</div>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                    <div className="text-[var(--text-muted)] text-xs mb-1">Brand Mentioned</div>
                    <div className="text-2xl font-bold text-green-400">{mentionedCount}</div>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                    <div className="text-[var(--text-muted)] text-xs mb-1">Mention Rate</div>
                    <div className="text-2xl font-bold text-blue-400">{mentionRate}%</div>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                    <div className="text-[var(--text-muted)] text-xs mb-1">Engines Used</div>
                    <div className="text-2xl font-bold text-purple-400">{Object.keys(engineStats).length}</div>
                </div>
            </div>

            {/* Per-Engine Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(engineStats).map(([eng, stats]) => {
                    const rate = stats.total > 0 ? Math.round((stats.mentioned / stats.total) * 100) : 0;
                    return (
                        <div key={eng} className={`border rounded-xl p-4 ${engineBg[eng] || 'bg-[var(--bg-secondary)] border-[var(--border)]'} border-opacity-30`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold">{engineLabel[eng] || eng}</span>
                                <span className="text-lg font-bold">{rate}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--bg-primary)]/20 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${rate}%` }} />
                            </div>
                            <div className="text-[10px] mt-1.5 opacity-70">{stats.mentioned}/{stats.total} mentions</div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search prompts..."
                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-red-500/50"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:border-red-500/50"
                >
                    {categories.map(c => (
                        <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.replace('_', ' ')}</option>
                    ))}
                </select>
                <select
                    value={filterMentioned}
                    onChange={(e) => setFilterMentioned(e.target.value)}
                    className="px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:border-red-500/50"
                >
                    <option value="all">All Status</option>
                    <option value="mentioned">Mentioned</option>
                    <option value="not_mentioned">Not Mentioned</option>
                </select>
                <span className="text-[var(--text-muted)] text-xs">{filteredPrompts.length} of {totalPrompts} prompts</span>
            </div>

            {/* Prompt List */}
            <div className="space-y-2">
                {filteredPrompts.map((p, i) => {
                    const engines = Object.entries(p.engines || {});
                    const anyMentioned = engines.some(([, e]) => e.mentioned);
                    const isExpanded = expandedPrompt === i;

                    return (
                        <div key={p.promptId || i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
                            {/* Prompt Header */}
                            <button
                                onClick={() => setExpandedPrompt(isExpanded ? null : i)}
                                className="w-full flex items-center gap-3 p-4 hover:bg-[var(--surface-hover)] transition-colors text-left"
                            >
                                {anyMentioned ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--text-primary)] font-medium truncate">{p.query}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {p.category && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryStyles[p.category] || 'bg-[var(--surface-active)] text-[var(--text-secondary)]'}`}>
                                                {p.category?.replace('_', ' ')}
                                            </span>
                                        )}
                                        {p.intent && <span className="text-[var(--text-muted)] text-[10px]">{p.intent}</span>}
                                        {p.strategicValue && (
                                            <span className="text-[var(--text-muted)] text-[10px]">
                                                Value: <span className={p.strategicValue === 'high' ? 'text-red-400' : p.strategicValue === 'medium' ? 'text-yellow-400' : 'text-[var(--text-secondary)]'}>{p.strategicValue}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Engine Status Dots */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {engines.map(([eng, data]) => (
                                        <div
                                            key={eng}
                                            title={`${engineLabel[eng] || eng}: ${data.mentioned ? 'Mentioned' : 'Not mentioned'}`}
                                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold border ${data.mentioned
                                                    ? engineBg[eng] || 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    : 'bg-[var(--surface-active)] text-[var(--text-muted)] border-[var(--border)]'
                                                }`}
                                        >
                                            {eng === 'perplexity' ? 'P' : eng === 'gemini' ? 'G' : 'AI'}
                                        </div>
                                    ))}
                                </div>

                                {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="border-t border-[var(--border)] p-4 space-y-3">
                                    {engines.map(([eng, data]) => (
                                        <div key={eng} className={`border rounded-lg p-3 ${data.mentioned ? 'border-green-500/20 bg-green-500/5' : 'border-[var(--border)] bg-[var(--surface-hover)]'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${engineBg[eng] || 'bg-[var(--surface-active)]'}`}>
                                                    {engineLabel[eng] || eng}
                                                </span>
                                                {data.mentioned ? (
                                                    <span className="text-green-400 text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> Mentioned</span>
                                                ) : (
                                                    <span className="text-red-400 text-xs flex items-center gap-1"><EyeOff className="w-3 h-3" /> Not Mentioned</span>
                                                )}
                                                {data.sentiment && data.sentiment !== 'n/a' && (
                                                    <span className="text-[var(--text-secondary)] text-xs ml-auto">
                                                        Sentiment: {sentimentEmoji[data.sentiment] || '—'} <span className="capitalize">{data.sentiment}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Structured Extractions */}
                                            <div className="space-y-2 mt-2">
                                                {data.positionRank && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Target className="w-3 h-3 text-[var(--text-muted)]" />
                                                        <span className="text-[var(--text-muted)]">Position:</span>
                                                        <span className={`font-semibold ${data.positionRank <= 3 ? 'text-green-400' : data.positionRank <= 5 ? 'text-yellow-400' : 'text-[var(--text-secondary)]'}`}>
                                                            #{data.positionRank}
                                                        </span>
                                                    </div>
                                                )}

                                                {data.snippet && (
                                                    <div className="text-xs">
                                                        <div className="flex items-center gap-1 text-[var(--text-muted)] mb-1">
                                                            <MessageSquare className="w-3 h-3" /> Brand snippet:
                                                        </div>
                                                        <p className="text-[var(--text-secondary)] bg-[var(--bg-primary)] rounded p-2 text-[11px] leading-relaxed italic">
                                                            "{data.snippet}"
                                                        </p>
                                                    </div>
                                                )}

                                                {data.citations && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Globe className="w-3 h-3 text-[var(--text-muted)]" />
                                                        <span className="text-[var(--text-muted)]">Citations:</span>
                                                        <span className="text-[var(--text-secondary)]">{data.citations}</span>
                                                    </div>
                                                )}

                                                {!data.mentioned && !data.snippet && !data.citations && (
                                                    <p className="text-[var(--text-muted)] text-xs italic">No brand data extracted for this engine</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
