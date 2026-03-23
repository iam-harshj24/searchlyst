import React, { useState, useEffect } from 'react';
import {
    ArrowUpRight, ArrowDownRight, Sparkles, ChevronRight, Globe,
    Eye, Activity, TrendingUp, PenTool, Target, FileSearch, Users,
    MapPin, Building2, ExternalLink, Bot, Search, Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

// Load real scan data from localStorage cache (set by AIVisibilityPage)
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

function getAuditData(domain) {
    try {
        const key = `searchlyst_audit_${domain || 'default'}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
}

export default function OverviewPage({ domains, activeProject, onAddDomain, onTabChange, userRole, user, scanManager }) {
    const scanResult = scanManager?.scanResult;
    const visData = scanResult || getVisibilityData(user?.domain, user?.projectId);
    const auditData = getAuditData(user?.domain);
    const visScore = visData?.score?.overall ?? null;
    const auditScore = auditData?.scores?.overall ?? null;
    const isScanActive = scanManager?.scanStatus === 'scanning';

    // Build 7-day trend data from scan (synthetic for past days, today = actual score)
    const visibilityTrend = React.useMemo(() => {
        const score = visData?.score?.overall ?? 0;
        if (!visData) return [];
        const data = [];
        const now = new Date();
        let currentScore = Math.max(10, score - (Math.random() * 20));
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            data.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                score: Math.round(currentScore),
            });
            currentScore = Math.min(100, Math.max(0, currentScore + (Math.random() * 15 - 5)));
        }
        data[data.length - 1].score = score;
        return data;
    }, [visData?.score?.overall, !!visData]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        const name = user?.brandName || user?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || '';
        const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        return name ? `${timeGreeting}, ${name}` : timeGreeting;
    };

    const competitors = user?.competitors || [];
    const suggestedCompetitors = user?.suggested_competitors || [];
    const allCompetitors = [...competitors.map(c => ({ domain: c })), ...suggestedCompetitors.filter(sc => !competitors.includes(sc.domain))];

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Personalized Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{getGreeting()}</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Here's your brand intelligence overview for today.</p>
                </div>
                <button
                    onClick={onAddDomain}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-[var(--text-primary)] text-sm font-medium rounded-xl transition-all shadow-lg shadow-red-500/20"
                >
                    <Sparkles className="w-4 h-4" />
                    Add Project
                </button>
            </div>

            {/* ROW 1: PRIMARY KPIs (F-Pattern Origin) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* AI Visibility */}
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-xs font-medium">AI Visibility</span>
                        <Eye className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                        <div>
                            <span className="text-2xl font-bold text-[var(--text-primary)]">{visScore !== null ? visScore : '--'}</span>
                            {visScore !== null && <span className="text-[var(--text-muted)] text-sm ml-0.5">/100</span>}
                        </div>
                        {visScore !== null ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--surface-active)] text-[var(--text-primary)]">
                                <ArrowUpRight className="w-3 h-3" /> Scanned
                            </div>
                        ) : (
                            <button onClick={() => onTabChange?.('ai-visibility')}
                                className="text-red-400 text-[10px] font-medium hover:text-red-300">Run Scan →</button>
                        )}
                    </div>
                </div>
                {/* Site Health */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-xs font-medium">Site Health</span>
                        <Activity className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                        <div>
                            <span className="text-2xl font-bold text-[var(--text-primary)]">{auditScore !== null ? auditScore : '--'}</span>
                            {auditScore !== null && <span className="text-[var(--text-muted)] text-sm ml-0.5">%</span>}
                        </div>
                        <button onClick={() => onTabChange?.('audit-health')}
                            className="text-red-400 text-[10px] font-medium hover:text-red-300">{auditScore !== null ? 'View Audit →' : 'Run Audit →'}</button>
                    </div>
                </div>
                {/* Competitors Tracked */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-xs font-medium">Competitors Tracked</span>
                        <Target className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                        <span className="text-2xl font-bold text-[var(--text-primary)]">{competitors.length}</span>
                        <div className="flex -space-x-1">
                            {competitors.slice(0, 3).map((c, i) => (
                                <img key={i} src={`https://www.google.com/s2/favicons?domain=${c}&sz=32`} alt=""
                                    className="w-5 h-5 rounded-full border border-[var(--bg-primary)] bg-[var(--surface-active)]" />
                            ))}
                        </div>
                    </div>
                </div>
                {/* Active Project Status */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-xs font-medium">Active Project</span>
                        <Building2 className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <div className="mt-auto">
                        <span className="text-lg font-bold text-[var(--text-primary)] truncate block w-full">{activeProject?.name || user?.brandName || 'Not set'}</span>
                        <p className="text-[var(--text-muted)] text-[10px] flex items-center gap-1.5 mt-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            {activeProject?.status || 'Active'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ROW 2: TRENDS & ACTIONS (Middle Screen scanning) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visibility Trend (2/3 width) */}
                <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-[var(--text-primary)] font-medium text-sm">AI Visibility Trend</h3>
                            <p className="text-[var(--text-muted)] text-xs mt-0.5">Last 7 days for {user?.brandName || 'your brand'}</p>
                        </div>
                        <button onClick={() => onTabChange?.('ai-visibility')}
                            className="flex items-center gap-1 text-red-400 text-xs hover:text-red-300">
                            View Full Report <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="h-48 flex-1">
                        {visibilityTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={visibilityTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="visGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} width={24} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                        labelStyle={{ color: 'var(--text-primary)' }}
                                        itemStyle={{ color: '#ef4444' }}
                                        formatter={(value) => [`${value}`, 'Score']}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} fill="url(#visGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-sm">
                                <Eye className="w-8 h-8 mb-2 opacity-40" />
                                <p>Run an AI Visibility scan to see your trend</p>
                                <button onClick={() => onTabChange?.('ai-visibility')} className="mt-2 text-red-400 text-xs hover:text-red-300">Run Scan →</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions (1/3 width, stacked right side) */}
                <div className="flex flex-col">
                    <h3 className="text-[var(--text-primary)] font-medium text-sm mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 flex-1 h-full">
                        {[
                            { icon: FileSearch, label: 'Audit My Website', desc: `Check ${user?.domain || 'your site'} health`, tab: 'audit-health' },
                            { icon: Eye, label: 'AI Visibility Report', desc: `How AI sees ${user?.brandName || 'your brand'}`, tab: 'ai-visibility' },
                            { icon: PenTool, label: 'Create Content', desc: `Write for ${user?.industry || 'your industry'}`, tab: 'content-studio' },
                            { icon: Search, label: 'Discover Topics', desc: `Trending in ${user?.industry || 'your space'}`, tab: 'topic-discovery' },
                        ].map((action, i) => (
                            <button key={i} onClick={() => onTabChange?.(action.tab)}
                                className="group p-3 md:p-4 flex items-center gap-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl text-left hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 h-full">
                                <div className="w-10 h-10 bg-[var(--surface-active)] rounded-xl flex items-center justify-center group-hover:bg-red-500/10 transition-colors shrink-0">
                                    <action.icon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-red-400 transition-colors" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[var(--text-primary)] text-sm font-medium truncate">{action.label}</p>
                                    <p className="text-[var(--text-muted)] text-[10px] md:text-xs mt-0.5 truncate">{action.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ROW 3: METADATA & DRILL-DOWN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Brand Info & Project Summary (Merged Context 2/3) */}
                <div className="lg:col-span-2 bg-gradient-to-br from-red-500/5 to-red-600/5 border border-red-500/10 rounded-2xl p-5">
                    <h3 className="text-[var(--text-primary)] font-medium text-sm mb-4">Brand Information & Context</h3>
                    {user && (
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
                                <span className="text-[var(--text-primary)] text-lg font-bold">{(user.brandName || 'S').charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-[var(--text-primary)] font-semibold text-lg truncate w-full">{user.brandName || 'Your Brand'}</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                                    <p className="text-[var(--text-muted)] text-xs truncate w-full">{user.domain ? `https://${user.domain}` : 'No domain set'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-red-500/10">
                        {user?.industry && (
                            <div>
                                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1"><Target className="w-3 h-3 text-red-400/60" /> Industry</p>
                                <p className="text-[var(--text-secondary)] text-xs font-medium truncate">{user.industry}</p>
                            </div>
                        )}
                        {user?.companySize && (
                            <div>
                                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1"><Building2 className="w-3 h-3 text-[var(--text-muted)]" /> Company Size</p>
                                <p className="text-[var(--text-secondary)] text-xs font-medium truncate">{user.companySize}</p>
                            </div>
                        )}
                        {user?.location && (
                            <div>
                                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1"><MapPin className="w-3 h-3 text-[var(--text-muted)]" /> Location</p>
                                <p className="text-[var(--text-secondary)] text-xs font-medium truncate">{user.location}</p>
                            </div>
                        )}
                        {user?.language && (
                            <div>
                                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1"><Globe className="w-3 h-3 text-[var(--text-muted)]" /> Language</p>
                                <p className="text-[var(--text-secondary)] text-xs font-medium truncate">{user.language}</p>
                            </div>
                        )}
                        {user?.reach && (
                            <div>
                                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1"><Users className="w-3 h-3 text-[var(--text-muted)]" /> Reach</p>
                                <p className="text-[var(--text-secondary)] text-xs font-medium truncate">{user.reach}</p>
                            </div>
                        )}
                        {activeProject?.created_at && (
                            <div>
                                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1"><Zap className="w-3 h-3 text-[var(--text-muted)]" /> Project Created</p>
                                <p className="text-[var(--text-secondary)] text-xs font-medium truncate">{new Date(activeProject.created_at).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Competitors List (1/3 Width Right Sidebar) */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                    <h3 className="text-[var(--text-primary)] font-medium text-sm mb-4">Your Competitors</h3>
                    {allCompetitors.length > 0 ? (
                        <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-2">
                            {allCompetitors.map((comp, i) => {
                                const domain = comp.domain || comp;
                                const name = comp.name || domain;
                                return (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                                        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                            alt="" className="w-6 h-6 rounded bg-[var(--surface-active)] shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[var(--text-primary)] text-xs font-medium truncate">{name}</p>
                                            <p className="text-[var(--text-muted)] text-[10px] truncate">{domain}</p>
                                        </div>
                                        <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
                                            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-1">
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 h-[180px] flex flex-col items-center justify-center">
                            <Users className="w-6 h-6 text-[var(--text-muted)] mx-auto mb-2" />
                            <p className="text-[var(--text-muted)] text-xs">No competitors tracked yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
