import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowUpRight, ArrowDownRight, Sparkles, FileText, Activity, Eye, Loader2, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { roleConfig } from './roleConfig';
import { apiClient } from '@/api/apiClient';

const DEFAULT_TREND = [
    { day: 'Mon', score: 0 }, { day: 'Tue', score: 0 }, { day: 'Wed', score: 0 },
    { day: 'Thu', score: 0 }, { day: 'Fri', score: 0 }, { day: 'Sat', score: 0 },
    { day: 'Sun', score: 0 },
];

export default function OverviewPage({ domains, activeProject, onAddDomain, onTabChange, userRole, user }) {
    const config = roleConfig[userRole] || roleConfig.founder;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [overview, setOverview] = useState(null);
    const [error, setError] = useState(null);

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.overview.get(activeProject?.id ?? null);
            setOverview(res);
        } catch (err) {
            console.error('Load overview:', err);
            setError(err.message || 'Failed to load overview');
        } finally {
            setLoading(false);
        }
    }, [activeProject?.id]);

    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        const name = user?.full_name?.split(' ')[0] || '';
        const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        return name ? `${timeGreeting}, ${name}` : timeGreeting;
    };

    const kpis = overview?.kpis ?? {};
    const visibilityTrend = overview?.visibilityTrend?.length ? overview.visibilityTrend : DEFAULT_TREND;
    const recentActivity = overview?.recentActivity ?? [];
    const projectSummary = overview?.activeProject ?? activeProject;

    const trendChange = visibilityTrend.length >= 2
        ? (() => {
            const first = visibilityTrend[0]?.score ?? 0;
            const last = visibilityTrend[visibilityTrend.length - 1]?.score ?? 0;
            if (first === 0) return null;
            const pct = Math.round(((last - first) / first) * 100);
            return pct >= 0 ? `+${pct}%` : `${pct}%`;
        })()
        : kpis.aiVisibilityChange;

    const kpiItems = [
        {
            label: config.kpis[0]?.label ?? 'AI Visibility Score',
            value: String(kpis.aiVisibilityScore ?? 0),
            suffix: '/100',
            change: kpis.aiVisibilityChange ?? trendChange ?? '—',
            positive: true,
            icon: config.kpis[0]?.icon ?? Eye,
            gradient: 'from-red-500/10 to-red-600/10',
            borderColor: 'border-red-500/20',
        },
        {
            label: config.kpis[1]?.label ?? 'AI Citations',
            value: (kpis.totalCitations ?? 0) >= 1000 ? `${((kpis.totalCitations ?? 0) / 1000).toFixed(1)}K` : String(kpis.totalCitations ?? 0),
            suffix: '',
            change: kpis.citationsChange ?? '—',
            positive: true,
            icon: config.kpis[1]?.icon ?? Activity,
            gradient: 'from-white/[0.04] to-white/[0.02]',
            borderColor: 'border-white/10',
        },
        {
            label: config.kpis[2]?.label ?? 'Projects',
            value: String(kpis.projectsCount ?? 0),
            suffix: '',
            change: '—',
            positive: true,
            icon: config.kpis[2]?.icon ?? FileText,
            gradient: 'from-red-500/5 to-white/[0.02]',
            borderColor: 'border-white/10',
        },
        {
            label: config.kpis[3]?.label ?? 'Site Health',
            value: String(kpis.issuesCount ?? 0),
            suffix: ' issues',
            change: (kpis.issuesCount ?? 0) > 0 ? '—' : '—',
            positive: (kpis.issuesCount ?? 0) === 0,
            icon: config.kpis[3]?.icon ?? Activity,
            gradient: 'from-white/[0.04] to-white/[0.02]',
            borderColor: 'border-white/10',
        },
    ];

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Personalized Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">{getGreeting()} 👋</h1>
                    <p className="text-white/40 text-sm mt-1">{config.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setRefreshing(true); loadOverview().finally(() => setRefreshing(false)); }}
                        disabled={loading || refreshing}
                        className="flex items-center gap-2 px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-sm font-medium rounded-xl border border-white/[0.08] disabled:opacity-50"
                    >
                        {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Refresh
                    </button>
                    <button
                        onClick={onAddDomain}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-red-500/20"
                    >
                        <Sparkles className="w-4 h-4" />
                        Add Project
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
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpiItems.map((kpi, i) => {
                            const Icon = kpi.icon;
                            return (
                                <div key={i} className={`bg-gradient-to-br ${kpi.gradient} border ${kpi.borderColor} rounded-2xl p-4`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-white/40 text-xs font-medium">{kpi.label}</span>
                                        <Icon className="w-4 h-4 text-white/20" />
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <span className="text-2xl font-bold text-white">{kpi.value}</span>
                                            <span className="text-white/30 text-sm ml-0.5">{kpi.suffix}</span>
                                        </div>
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                                            kpi.positive ? 'bg-white/10 text-white' : 'bg-red-500/10 text-red-400'
                                        }`}>
                                            {kpi.change !== '—' && (kpi.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                                            {kpi.change}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Visibility Trend */}
                        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-white font-medium text-sm">AI Visibility Trend</h3>
                                    <p className="text-white/30 text-xs mt-0.5">Last 7 days</p>
                                </div>
                                {trendChange && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <ArrowUpRight className="w-3 h-3 text-red-400" />
                                        <span className="text-red-400 text-xs font-medium">{trendChange}</span>
                                    </div>
                                )}
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={visibilityTrend}>
                                        <defs>
                                            <linearGradient id="visGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" stroke="#525252" tick={{ fill: '#737373', fontSize: 11 }} />
                                        <YAxis stroke="#525252" tick={{ fill: '#737373', fontSize: 11 }} domain={[0, 100]} hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                                            labelStyle={{ color: '#fff' }}
                                            itemStyle={{ color: '#ef4444' }}
                                        />
                                        <Area type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} fill="url(#visGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                            <h3 className="text-white font-medium text-sm mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((action, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-white/[0.03] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <FileText className={`w-3.5 h-3.5 ${action.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white/70 text-xs leading-relaxed">{action.text}</p>
                                                <p className="text-white/20 text-[10px] mt-0.5">{action.time}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    config.recentActions.slice(0, 4).map((action, i) => {
                                        const ActionIcon = action.icon;
                                        return (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-white/[0.03] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <ActionIcon className={`w-3.5 h-3.5 ${action.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white/50 text-xs leading-relaxed">{action.text}</p>
                                                    <p className="text-white/20 text-[10px] mt-0.5">{action.time}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-white font-medium text-sm mb-3">{config.greeting}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {config.quickActions.map((action, i) => {
                                const ActionIcon = action.icon;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => onTabChange?.(action.tab)}
                                        className="group p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl text-left hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300"
                                    >
                                        <div className="w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center mb-3 group-hover:bg-red-500/10 transition-colors">
                                            <ActionIcon className="w-5 h-5 text-white/40 group-hover:text-red-400 transition-colors" />
                                        </div>
                                        <p className="text-white text-sm font-medium">{action.label}</p>
                                        <p className="text-white/30 text-xs mt-0.5">{action.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Project Summary */}
                    {projectSummary && (
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-medium text-sm">Project Health</h3>
                                <span className="text-white/30 text-xs">{projectSummary.name}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-white/30 text-[10px] uppercase tracking-wider">Visibility</p>
                                    <p className="text-white text-lg font-bold mt-1">{projectSummary.visibility_score ?? 0}</p>
                                </div>
                                <div>
                                    <p className="text-white/30 text-[10px] uppercase tracking-wider">Citations</p>
                                    <p className="text-white text-lg font-bold mt-1">{projectSummary.total_citations ?? 0}</p>
                                </div>
                                <div>
                                    <p className="text-white/30 text-[10px] uppercase tracking-wider">Sentiment</p>
                                    <p className="text-white text-lg font-bold mt-1">{projectSummary.sentiment ?? 0}%</p>
                                </div>
                                <div>
                                    <p className="text-white/30 text-[10px] uppercase tracking-wider">Issues</p>
                                    <p className="text-white text-lg font-bold mt-1">{projectSummary.issues_count ?? 0}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
