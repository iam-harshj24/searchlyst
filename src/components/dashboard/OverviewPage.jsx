import React, { useState, useEffect } from 'react';
import {
    ArrowUpRight, ArrowDownRight, Sparkles, ChevronRight, Globe,
    Eye, Activity, TrendingUp, PenTool, Target, FileSearch, Users,
    MapPin, Building2, ExternalLink, Bot, Search, Zap
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// Load real scan data from localStorage cache (set by AIVisibilityPage)
function getVisibilityData(domain) {
    try {
        const key = `searchlyst_visibility_${domain || 'default'}`;
        const saved = localStorage.getItem(key);
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
    const visData = scanResult || getVisibilityData(user?.domain);
    const auditData = getAuditData(user?.domain);
    const visScore = visData?.score?.overall ?? null;
    const auditScore = auditData?.scores?.overall ?? null;
    const isScanActive = scanManager?.scanStatus === 'scanning';

    // Build real trend data from scan or show empty
    const visibilityTrend = visData ? [
        { day: 'Today', score: visData.score?.overall || 0 }
    ] : [];

    const getGreeting = () => {
        const hour = new Date().getHours();
        const name = user?.brandName || user?.full_name?.split(' ')[0] || '';
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

            {/* Brand Info Card */}
            {user && (
                <div className="bg-gradient-to-br from-red-500/5 to-red-600/5 border border-red-500/10 rounded-2xl p-5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                            <span className="text-[var(--text-primary)] text-lg font-bold">{(user.brandName || 'S').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <h2 className="text-[var(--text-primary)] font-semibold text-lg">{user.brandName || 'Your Brand'}</h2>
                            <p className="text-[var(--text-muted)] text-sm">{user.domain ? `https://${user.domain}` : ''}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {user.industry && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-active)] rounded-lg">
                                <Target className="w-3.5 h-3.5 text-red-400/60" />
                                <span className="text-[var(--text-secondary)] text-xs">{user.industry}</span>
                            </div>
                        )}
                        {user.companySize && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-active)] rounded-lg">
                                <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                <span className="text-[var(--text-secondary)] text-xs">{user.companySize}</span>
                            </div>
                        )}
                        {user.location && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-active)] rounded-lg">
                                <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                <span className="text-[var(--text-secondary)] text-xs">{user.location}</span>
                            </div>
                        )}
                        {user.language && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-active)] rounded-lg">
                                <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                <span className="text-[var(--text-secondary)] text-xs">{user.language}</span>
                            </div>
                        )}
                        {user.reach && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-active)] rounded-lg">
                                <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                <span className="text-[var(--text-secondary)] text-xs">{user.reach}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-xs font-medium">AI Visibility</span>
                        <Eye className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <div className="flex items-end justify-between">
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
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-xs font-medium">Competitors Tracked</span>
                        <Target className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-[var(--text-primary)]">{competitors.length}</span>
                        <div className="flex -space-x-1">
                            {competitors.slice(0, 3).map((c, i) => (
                                <img key={i} src={`https://www.google.com/s2/favicons?domain=${c}&sz=32`} alt=""
                                    className="w-5 h-5 rounded-full border border-[var(--bg-primary)] bg-[var(--surface-active)]" />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-xs font-medium">Site Health</span>
                        <Activity className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <span className="text-2xl font-bold text-[var(--text-primary)]">{auditScore !== null ? auditScore : '--'}</span>
                            {auditScore !== null && <span className="text-[var(--text-muted)] text-sm ml-0.5">%</span>}
                        </div>
                        <button onClick={() => onTabChange?.('audit-health')}
                            className="text-red-400 text-[10px] font-medium hover:text-red-300">{auditScore !== null ? 'View Audit →' : 'Run Audit →'}</button>
                    </div>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--text-muted)] text-xs font-medium">Industry</span>
                        <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-[var(--text-primary)]">{user?.industry || 'Not set'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visibility Trend */}
                <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
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
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={visibilityTrend}>
                                <defs>
                                    <linearGradient id="visGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: `0 8px 32px var(--shadow-color)` }}
                                    labelStyle={{ color: 'var(--text-primary)' }}
                                    itemStyle={{ color: '#ef4444' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} fill="url(#visGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Competitors */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                    <h3 className="text-[var(--text-primary)] font-medium text-sm mb-4">Your Competitors</h3>
                    {allCompetitors.length > 0 ? (
                        <div className="space-y-2.5">
                            {allCompetitors.slice(0, 6).map((comp, i) => {
                                const domain = comp.domain || comp;
                                const name = comp.name || domain;
                                return (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                                        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                            alt="" className="w-6 h-6 rounded bg-[var(--surface-active)]" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[var(--text-primary)] text-xs font-medium truncate">{name}</p>
                                            <p className="text-[var(--text-muted)] text-[10px] truncate">{domain}</p>
                                        </div>
                                        <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
                                            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Users className="w-6 h-6 text-[var(--text-muted)] mx-auto mb-2" />
                            <p className="text-[var(--text-muted)] text-xs">No competitors tracked yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-[var(--text-primary)] font-medium text-sm mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { icon: FileSearch, label: 'Audit My Website', desc: `Check ${user?.domain || 'your site'} health`, tab: 'audit-health' },
                        { icon: Eye, label: 'AI Visibility Report', desc: `How AI sees ${user?.brandName || 'your brand'}`, tab: 'ai-visibility' },
                        { icon: PenTool, label: 'Create Content', desc: `Write for ${user?.industry || 'your industry'}`, tab: 'content-studio' },
                        { icon: Search, label: 'Discover Topics', desc: `Trending in ${user?.industry || 'your space'}`, tab: 'topic-discovery' },
                    ].map((action, i) => (
                        <button key={i} onClick={() => onTabChange?.(action.tab)}
                            className="group p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl text-left hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300">
                            <div className="w-10 h-10 bg-[var(--surface-active)] rounded-xl flex items-center justify-center mb-3 group-hover:bg-red-500/10 transition-colors">
                                <action.icon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-red-400 transition-colors" />
                            </div>
                            <p className="text-[var(--text-primary)] text-sm font-medium">{action.label}</p>
                            <p className="text-[var(--text-muted)] text-xs mt-0.5">{action.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Project Summary */}
            {activeProject && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[var(--text-primary)] font-medium text-sm">Project Status</h3>
                        <span className="text-[var(--text-muted)] text-xs">{activeProject.name}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Domain</p>
                            <p className="text-[var(--text-primary)] text-sm font-medium mt-1 truncate">{user?.domain || activeProject.url}</p>
                        </div>
                        <div>
                            <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Status</p>
                            <p className="text-[var(--text-primary)] text-sm font-medium mt-1 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                {activeProject.status || 'Active'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Created</p>
                            <p className="text-[var(--text-primary)] text-sm font-medium mt-1">
                                {activeProject.created_at ? new Date(activeProject.created_at).toLocaleDateString() : 'Today'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Competitors</p>
                            <p className="text-[var(--text-primary)] text-sm font-medium mt-1">{competitors.length} tracked</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
