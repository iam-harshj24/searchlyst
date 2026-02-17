import React, { useState, useEffect, useCallback } from 'react';
import {
    Eye, ArrowUpRight, ArrowDownRight, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '@/api/apiClient';
import EmptyProjectState from '@/components/dashboard/EmptyProjectState';

const DEFAULT_SENTIMENT = [
    { name: 'Positive', value: 0, color: '#ffffff' },
    { name: 'Neutral', value: 100, color: '#737373' },
    { name: 'Negative', value: 0, color: '#ef4444' },
];

const DEFAULT_TREND = [
    { week: 'W1', citations: 0 }, { week: 'W2', citations: 0 }, { week: 'W3', citations: 0 }, { week: 'W4', citations: 0 },
    { week: 'W5', citations: 0 }, { week: 'W6', citations: 0 }, { week: 'W7', citations: 0 }, { week: 'W8', citations: 0 },
];

export default function AIVisibilityPage({ activeProject, onAddProject }) {
    const [activeFilter, setActiveFilter] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const loadSummary = useCallback(async () => {
        if (!activeProject?.id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.aiVisibility.getSummary(activeProject.id, activeFilter);
            setData(res);
        } catch (err) {
            console.error('Load AI visibility:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [activeProject?.id, activeFilter]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    const handleRefresh = async () => {
        if (!activeProject?.id) return;
        setRefreshing(true);
        setError(null);
        try {
            await loadSummary();
        } finally {
            setRefreshing(false);
        }
    };

    if (!activeProject) {
        return <EmptyProjectState onAddProject={onAddProject} />;
    }

    const platformScores = data?.platformScores ?? [];
    const citationTrend = data?.citationTrend?.length ? data.citationTrend : DEFAULT_TREND;
    const sentimentBreakdown = data?.sentimentBreakdown?.length ? data.sentimentBreakdown : DEFAULT_SENTIMENT;
    const citationsByPrompt = data?.citationsByPrompt ?? [];
    const issues = data?.issues ?? [];
    const hasData = data?.hasData ?? false;

    const trendPct = citationTrend.length >= 2
        ? (() => {
            const first = citationTrend[0]?.citations ?? 0;
            const last = citationTrend[citationTrend.length - 1]?.citations ?? 0;
            if (first === 0) return null;
            return `+${Math.round(((last - first) / first) * 100)}%`;
        })()
        : null;

    const filters = [
        { id: '7d', label: '7d' },
        { id: '30d', label: '30d' },
        { id: '90d', label: '90d' },
    ];

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Eye className="w-5 h-5 text-red-400" />
                        AI Visibility Analytics
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Track how AI search engines see and cite your brand.</p>
                </div>
                <div className="flex items-center gap-2">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                activeFilter === f.id
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/60'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                    <button
                        onClick={handleRefresh}
                        disabled={loading || refreshing}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/70 border border-white/[0.08] disabled:opacity-50"
                    >
                        {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Platform Scores */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {platformScores.map((platform, i) => (
                            <div key={i} className={`bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4 ${platform.comingSoon ? 'opacity-60' : ''}`}>
                                <p className="text-white/40 text-xs mb-2">{platform.name}</p>
                                <div className="flex items-end justify-between">
                                    <span className="text-2xl font-bold text-white">
                                        {platform.comingSoon ? '—' : (platform.score ?? 0)}
                                    </span>
                                    {!platform.comingSoon && platform.trend && (
                                        <span className={`flex items-center gap-0.5 text-xs ${platform.positive ? 'text-white' : 'text-red-400'}`}>
                                            {platform.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {platform.trend}
                                        </span>
                                    )}
                                    {platform.comingSoon && (
                                        <span className="text-white/30 text-[10px]">Coming soon</span>
                                    )}
                                </div>
                                <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${
                                            platform.comingSoon ? 'bg-white/20' :
                                            (platform.score ?? 0) >= 70 ? 'bg-white' :
                                            (platform.score ?? 0) >= 50 ? 'bg-white/60' : 'bg-red-500'
                                        }`}
                                        style={{ width: platform.comingSoon ? '20%' : `${Math.min(100, platform.score ?? 0)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Citation Trend */}
                        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-medium text-sm">Citation Trend</h3>
                                {trendPct && (
                                    <span className="text-red-400 text-xs flex items-center gap-1">
                                        <ArrowUpRight className="w-3 h-3" /> {trendPct} over 8 weeks
                                    </span>
                                )}
                            </div>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={citationTrend}>
                                        <defs>
                                            <linearGradient id="citGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                        <XAxis dataKey="week" tick={{ fill: '#ffffff30', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#ffffff30', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                        <Area type="monotone" dataKey="citations" stroke="#ef4444" strokeWidth={2} fill="url(#citGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Sentiment */}
                        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                            <h3 className="text-white font-medium text-sm mb-4">AI Sentiment</h3>
                            <div className="h-40 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={sentimentBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                                            {sentimentBreakdown.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-4 mt-2">
                                {sentimentBreakdown.map((item, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-white/30 text-[10px]">{item.name} {item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Citations by Query */}
                    <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                        <h3 className="text-white font-medium text-sm mb-4">Your Citations by Query</h3>
                        {citationsByPrompt.length > 0 ? (
                            <>
                                <div className="h-56 min-h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={citationsByPrompt} layout="vertical" margin={{ left: 0, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                            <XAxis type="number" tick={{ fill: '#ffffff30', fontSize: 11 }} />
                                            <YAxis dataKey="query" type="category" tick={{ fill: '#ffffff30', fontSize: 10 }} width={140} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                            <Bar dataKey="you" fill="#ef4444" name="Citations" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-3 text-xs">
                                    <span className="flex items-center gap-2 text-white/30"><span className="w-3 h-3 bg-red-500 rounded" /> Your citations</span>
                                </div>
                            </>
                        ) : (
                            <div className="py-12 text-center text-white/40 text-sm">
                                Run a sentiment scan to see citations by query.
                            </div>
                        )}
                    </div>

                    {/* Issues to Fix */}
                    <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                        <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Content Issues Affecting AI Visibility
                        </h3>
                        {issues.length > 0 ? (
                            <div className="space-y-3">
                                {issues.map((issue, i) => (
                                    <div key={i} className={`p-4 rounded-xl border ${
                                        issue.severity === 'critical' || issue.severity === 'high' ? 'bg-red-500/5 border-red-500/20' :
                                        issue.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                                        'bg-white/[0.02] border-white/[0.04]'
                                    }`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white text-sm font-medium">{issue.platform}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md capitalize border ${
                                                issue.severity === 'critical' || issue.severity === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                issue.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>{issue.severity}</span>
                                        </div>
                                        <p className="text-white/40 text-sm">{issue.issue}</p>
                                        {issue.fix && (
                                            <p className="text-white/30 text-xs mt-2">Fix: {issue.fix}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-white/40 text-sm">
                                No AEO issues found. Run an audit to check for content optimization opportunities.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
