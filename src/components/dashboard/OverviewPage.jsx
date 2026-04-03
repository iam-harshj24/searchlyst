import React, { useState, useEffect } from 'react';
import {
    LayoutGrid, Sparkles, Globe, Building2, Users, MapPin, Eye, Activity,
    Shield, FileText, ChevronRight, Clock, Folder, Bell, Plus, AlertTriangle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { apiClient } from '../../api/apiClient.js';
import { buildVisibilityTrendDaily, buildVisibilityTrendWeekly } from '@/lib/visibilityTrend';

const getDomainColor = (domain) => {
    const colors = [
        'text-blue-400 bg-blue-400/10 border-blue-400/20',
        'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        'text-purple-400 bg-purple-400/10 border-purple-400/20',
        'text-amber-400 bg-amber-400/10 border-amber-400/20',
        'text-pink-400 bg-pink-400/10 border-pink-400/20',
        'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
        'text-[#E92A15] bg-[#E92A15]/10 border-[#E92A15]/20'
    ];
    let hash = 0;
    const safeDomain = domain || '';
    for (let i = 0; i < safeDomain.length; i++) hash = safeDomain.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

/** White rounded tile + dark favicon / glyph (Competitor Analysis grid — matches reference) */
const CompetitorGridLogo = ({ domain }) => {
    const [error, setError] = useState(false);
    const host = (domain || '').replace(/^https?:\/\//i, '').split('/')[0] || '';
    const letter = host.replace(/^www\./i, '').charAt(0).toUpperCase() || '?';
    if (error || !host) {
        return (
            <div
                className="w-8 h-8 rounded-[7px] bg-white border border-[#d4d4d4] flex items-center justify-center shrink-0 shadow-[0_1px_0_rgba(0,0,0,0.06)]"
                aria-hidden
            >
                <span className="text-[#111] text-[12px] font-extrabold leading-none">{letter}</span>
            </div>
        );
    }
    return (
        <div
            className="w-8 h-8 rounded-[7px] bg-white border border-[#d4d4d4] flex items-center justify-center shrink-0 overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.06)]"
            aria-hidden
        >
            <img
                src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
                alt=""
                className="w-[22px] h-[22px] object-contain"
                onError={() => setError(true)}
            />
        </div>
    );
};

const DomainLogo = ({ domain, sizeClass = "w-8 h-8", roundedClass = "rounded-lg", iconSizeClass = "w-4 h-4", fontSizeClass = "text-[14px]", fallbackStyle = "" }) => {
    const [error, setError] = useState(false);
    
    if (error || !domain) {
        return (
            <div className={`${sizeClass} ${roundedClass} flex items-center justify-center shrink-0 border ${fallbackStyle || getDomainColor(domain)}`}>
                <span className={`${fontSizeClass} font-extrabold top-[0.5px] relative`}>
                    {(domain || 'S').replace(/^(https?:\/\/)?(www\.)?/, '').charAt(0).toUpperCase()}
                </span>
            </div>
        );
    }
    
    return (
        <div className={`${sizeClass} ${roundedClass} bg-white flex items-center justify-center border border-[#333] shrink-0 overflow-hidden`}>
            <img 
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} 
                alt="" 
                className={`${iconSizeClass} object-contain border-none outline-none`} 
                onError={() => setError(true)} 
            />
        </div>
    );
};

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

function countAuditIssues(domain) {
    const audit = getAuditData(domain);
    if (!audit?.categories) return null;
    let n = 0;
    for (const cat of Object.values(audit.categories)) {
        n += (cat.issues || []).length;
    }
    return n;
}

function projectVisibilityPercent(p) {
    if (p.lastVisibilityScore != null && !Number.isNaN(Number(p.lastVisibilityScore))) {
        return Math.round(Number(p.lastVisibilityScore));
    }
    const d = p.url || p.domain;
    if (!d) return null;
    const vid = getVisibilityData(d, p.id);
    const o = vid?.score?.overall;
    if (o == null) return null;
    return o <= 10 ? Math.round(o * 10) : Math.round(o);
}

function countTrackedCompetitorsForProject(p, fallbackCount) {
    const c = p?.competitors;
    if (Array.isArray(c) && c.length > 0) return c.length;
    return fallbackCount;
}

function formatProjectCreated(p) {
    const raw = p.createdAt || p.created_at;
    if (!raw) return '—';
    try {
        return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return '—'; }
}

function normalizeHost(s) {
    if (!s) return '';
    return String(s).replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '').toLowerCase();
}

export default function OverviewPage({ domains, activeProject, onAddDomain, onTabChange, userRole, user, scanManager, projects }) {
    const scanResult = scanManager?.scanResult;
    const visData = scanResult || getVisibilityData(user?.domain, user?.projectId);
    const auditData = getAuditData(user?.domain);
    const visScore = visData?.score?.overall ?? null;
    const auditScore = auditData?.scores?.overall ?? null;

    const [dashboardMetrics, setDashboardMetrics] = useState(null);
    const [overviewScanHistory, setOverviewScanHistory] = useState([]);
    const [overviewTrendRange, setOverviewTrendRange] = useState(7);
    const [overviewTrendGranularity, setOverviewTrendGranularity] = useState('daily');

    useEffect(() => {
        let mounted = true;
        const fetchMetrics = async () => {
            if (!user?.id) return;
            try {
                const metrics = await apiClient.projects.getMetrics(activeProject?.id);
                if (mounted) setDashboardMetrics(metrics);
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            }
        };
        fetchMetrics();
        return () => { mounted = false; };
    }, [user?.id, activeProject?.id]);

    useEffect(() => {
        if (!user?.domain) return;
        const days = overviewTrendRange > 0 ? Math.max(overviewTrendRange, 30) : 365;
        apiClient.visibility
            .getScanHistory(user?.projectId, user.domain, { days, limit: 120 })
            .then((res) => {
                if (Array.isArray(res?.history)) setOverviewScanHistory(res.history);
            })
            .catch(() => setOverviewScanHistory([]));
    }, [user?.domain, user?.projectId, overviewTrendRange]);

    const visibilityTrend = React.useMemo(() => {
        const fromApi = overviewScanHistory.length > 0
            ? overviewScanHistory
            : (dashboardMetrics?.visibilityTrend || []).map((v) => ({
                  date: v.date,
                  score: Number(v.score),
              }));

        const fallbackSingle =
            fromApi.length === 0 && visData?.score?.overall != null && visData?.scannedAt
                ? [{ date: visData.scannedAt, score: visData.score.overall }]
                : fromApi.length === 0 && visData?.score?.overall != null
                  ? [{ date: new Date().toISOString(), score: visData.score.overall }]
                  : fromApi;

        const opts = { extendToToday: true, filterDays: overviewTrendRange > 0 ? overviewTrendRange : 0 };
        if (fallbackSingle.length === 0) return [];
        return overviewTrendGranularity === 'weekly'
            ? buildVisibilityTrendWeekly(fallbackSingle, opts)
            : buildVisibilityTrendDaily(fallbackSingle, opts);
    }, [
        overviewScanHistory,
        dashboardMetrics?.visibilityTrend,
        visData?.score?.overall,
        visData?.scannedAt,
        overviewTrendRange,
        overviewTrendGranularity,
    ]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    };

    const userCompetitors = user?.competitors || [];
    const localAdded = (() => {
        try { return JSON.parse(localStorage.getItem(`searchlyst_added_competitors_${user?.domain || 'default'}`) || '[]'); } catch { return []; }
    })();
    const allCompetitors = [
        ...userCompetitors.map(c => typeof c === 'string' ? { domain: c } : c),
        ...localAdded.filter(d => !userCompetitors.includes(d)).map(d => ({ domain: d })),
    ];

    const displayBrandName = user?.brandName || activeProject?.name || 'Your Brand';
    
    const activeDomain = user?.domain || activeProject?.url || '';
    const activeHostNorm = normalizeHost(user?.domain || activeProject?.url || activeProject?.domain || '');
    const compsCount = allCompetitors.length;
    const projectDate = activeProject?.createdAt ? new Date(activeProject.createdAt).toLocaleDateString() : '—';

    const projectList = projects?.length
        ? projects
        : activeProject
            ? [activeProject]
            : [];

    return (
        <div className="w-full pb-10">
            {/* Full-width Header */}
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <LayoutGrid className="w-[20px] h-[20px] text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">{getGreeting()}, {displayBrandName}</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">Here's your brand intelligence overview for today.</p>
                    </div>
                </div>
                <button
                    onClick={onAddDomain}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#E92A15] hover:bg-[#D12512] text-white text-[13px] font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(233,42,21,0.25)]"
                >
                    <Sparkles className="w-4 h-4" /> Add Project
                </button>
            </div>

            <div className="space-y-6 max-w-6xl mt-8">
            {/* Brand Card */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-5">
                        <DomainLogo 
                            domain={user?.domain || 'searchlyst.com'} 
                            sizeClass="w-[68px] h-[68px]" 
                            roundedClass="rounded-[22px]" 
                            iconSizeClass="w-[34px] h-[34px]"
                            fontSizeClass="text-[36px]"
                            fallbackStyle="bg-white text-[#111] shadow-[0_4px_20px_rgba(255,255,255,0.08)]"
                        />
                        <div>
                            <h2 className="text-white font-semibold text-[16px]">{displayBrandName}</h2>
                            <p className="text-[#666] text-[12px]">{user?.domain ? `https://${user?.domain}` : 'https://yourwebsite.com'}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {user?.industry && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <Building2 className="w-3 h-3" /> {user.industry}
                            </span>
                        )}
                        {user?.companySize && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <Users className="w-3 h-3" /> {user.companySize}
                            </span>
                        )}
                        {user?.location && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <MapPin className="w-3 h-3" /> {user.location}
                            </span>
                        )}
                        {user?.language && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <Globe className="w-3 h-3" /> {user.language}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-8">
                        <span className="text-[#888] text-[13px] font-medium">Hours Saved</span>
                        <div className="w-8 h-8 rounded-[10px] bg-[#1A1A1A] border border-[#333] flex items-center justify-center">
                            <Clock className="w-4 h-4 text-[#aaa]" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-white text-[28px] font-bold tracking-tight">{dashboardMetrics ? dashboardMetrics.hoursSaved.toFixed(1) : '—'}</span>
                            {dashboardMetrics && <span className="text-[#666] text-[14px]">h</span>}
                        </div>
                        <p className="text-[#666] text-[11px] mt-1 line-clamp-1">{dashboardMetrics ? 'Total via AI operations' : 'Run scans to track time saved'}</p>
                    </div>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-8">
                        <span className="text-[#888] text-[13px] font-medium">Active Project</span>
                        <div className="w-8 h-8 rounded-[10px] bg-[#1A1A1A] border border-[#333] flex items-center justify-center">
                            <Folder className="w-4 h-4 text-[#aaa]" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-white text-[28px] font-bold tracking-tight">{projects?.length || 0}</span>
                        </div>
                        <p className="text-[#666] text-[11px] mt-1 line-clamp-1">Domains tracked for AI visibility</p>
                    </div>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-8">
                        <span className="text-[#888] text-[13px] font-medium">Site Health</span>
                        <div className="w-8 h-8 rounded-[10px] bg-[#1A1A1A] border border-[#333] flex items-center justify-center">
                            <Activity className="w-4 h-4 text-[#aaa]" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-white text-[28px] font-bold tracking-tight">{dashboardMetrics?.siteHealth || auditScore || '—'}</span>
                            {(dashboardMetrics?.siteHealth || auditScore) && <span className="text-[#666] text-[14px]">%</span>}
                        </div>
                        <p className="text-[#666] text-[11px] mt-1 line-clamp-1">{(dashboardMetrics?.siteHealth || auditScore) ? 'Latest intelligent audit' : 'Run an audit to see health'}</p>
                    </div>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-8">
                        <span className="text-[#888] text-[13px] font-medium">Articles Published</span>
                        <div className="w-8 h-8 rounded-[10px] bg-[#1A1A1A] border border-[#333] flex items-center justify-center">
                            <FileText className="w-4 h-4 text-[#aaa]" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-white text-[28px] font-bold tracking-tight">{dashboardMetrics !== null ? dashboardMetrics.articlesPublished : '—'}</span>
                        </div>
                        <p className="text-[#666] text-[11px] mt-1 line-clamp-1">{dashboardMetrics !== null ? 'Total high-value outputs' : 'Create content to track output'}</p>
                    </div>
                </div>
            </div>

            {/* AI Visibility Trend — full width */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 relative overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                    <div>
                        <h3 className="text-white text-[15px] font-semibold">AI Visibility Trend</h3>
                        <p className="text-[#666] text-[12px] mt-1">
                            {overviewTrendRange > 0 ? `Last ${overviewTrendRange} days` : 'All stored scans'} · {overviewTrendGranularity} steps for {displayBrandName}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={overviewTrendRange}
                            onChange={(e) => setOverviewTrendRange(Number(e.target.value))}
                            className="bg-[#1a1a1a] border border-[#333] text-[#ccc] text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#E92A15]/50"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                        <select
                            value={overviewTrendGranularity}
                            onChange={(e) => setOverviewTrendGranularity(e.target.value)}
                            className="bg-[#1a1a1a] border border-[#333] text-[#ccc] text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#E92A15]/50"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                        <button type="button" onClick={() => onTabChange?.('ai-visibility')} className="text-[#E92A15] text-[12px] font-medium hover:text-[#ff4433] flex items-center gap-1 transition-colors">
                            Full report <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-8 z-10 relative">
                    <div className="flex items-center gap-3">
                        <div className="flex items-baseline">
                            <span className="text-white text-[42px] font-bold tracking-tighter leading-none tabular-nums">
                                {visScore != null ? (visScore / 10).toFixed(1) : '—'}
                            </span>
                        </div>
                    </div>
                    {visScore != null && (
                        <span className="text-[#666] text-[11px]">Visibility index (0–10) · {user?.industry || activeProject?.industry || 'your industry'}</span>
                    )}
                </div>

                <div className="h-[200px] w-full mt-4 -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visibilityTrend} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={12} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={35} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="score" stroke="#fff" strokeWidth={2} fill="rgba(255,255,255,0.03)" activeDot={{ r: 5, fill: '#E92A15', stroke: '#fff', strokeWidth: 2 }} dot={{ r: 3, fill: '#fff' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Shield, label: 'Audit My Website', desc: `Check ${user?.domain || 'your site'} health`, tab: 'audit-health' },
                        { icon: Eye, label: 'AI Visibility Report', desc: `How AI sees ${displayBrandName}`, tab: 'ai-visibility' },
                        { icon: FileText, label: 'Create Content', desc: `Write for ${user?.industry || activeProject?.industry || 'your industry'}`, tab: 'content-studio' },
                        { icon: Bell, label: 'Actions', desc: 'Fix issues & boost visibility', tab: 'actions' },
                    ].map((action, i) => (
                        <button key={i} onClick={() => onTabChange?.(action.tab)}
                            className="group p-5 bg-[#111] border border-[#222] rounded-2xl text-left hover:border-[#E92A15]/40 hover:bg-[#1A1A1A] transition-all duration-300">
                            <div className="w-10 h-10 bg-[#1A1A1A] border border-[#333] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#E92A15]/10 group-hover:border-[#E92A15]/20 group-hover:text-[#E92A15] text-[#888] transition-all">
                                <action.icon className="w-4 h-4" />
                            </div>
                            <p className="text-white text-[15px] font-semibold mb-1">{action.label}</p>
                            <p className="text-[#666] text-[12px]">{action.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Competitor Analysis — row-based grid (matches reference UI) */}
            <div className="bg-[#000000] border border-[#262626] rounded-2xl overflow-hidden shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#262626]">
                    <h3 className="text-white text-[16px] font-semibold tracking-tight">Competitor Analysis</h3>
                    <button
                        type="button"
                        onClick={onAddDomain}
                        className="text-[#E92A15] text-[13px] font-semibold flex items-center gap-1 hover:text-[#ff4433] transition-colors"
                    >
                        <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} aria-hidden />
                        <span>Track a new Domain</span>
                    </button>
                </div>
                {projectList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-5 border-t border-[#262626]">
                        <Folder className="w-10 h-10 text-[#444]" />
                        <p className="text-[#888] text-[13px] max-w-md">
                            Add a project to compare domains, visibility, open issues, and tracked competitors.
                        </p>
                        <button type="button" onClick={onAddDomain} className="text-[#E92A15] text-[12px] font-semibold hover:text-[#ff4433] flex items-center gap-1 justify-center">
                            <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden />
                            Track a new Domain
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div
                            className="min-w-[min(100%,720px)]"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${projectList.length}, minmax(220px, 1fr))`,
                            }}
                        >
                            {projectList.map((p, colIdx) => {
                                const rawDomain = p.url || p.domain || '';
                                const domainForLogo = rawDomain.replace(/^https?:\/\//i, '').split('/')[0] || '';
                                const domainDisplay = domainForLogo.replace(/^www\./i, '') || '—';
                                const pid = p.id;
                                const isActive =
                                    activeProject?.id != null
                                        ? pid === activeProject.id
                                        : normalizeHost(domainForLogo) === activeHostNorm && activeHostNorm !== '';
                                const visPct = projectVisibilityPercent(p);
                                const issues = countAuditIssues(rawDomain || domainForLogo);
                                const compN = countTrackedCompetitorsForProject(p, compsCount);
                                const leftBorder = colIdx > 0 ? 'border-l border-[#1f1f1f]' : '';
                                const labelCls =
                                    'text-[10px] uppercase tracking-[0.12em] text-[#888] font-semibold shrink-0';
                                const rowInner = 'flex items-center justify-between gap-3 min-h-[52px] px-5 py-3.5';
                                const createdStr = formatProjectCreated(p);

                                return (
                                    <div key={pid ?? colIdx} className={`min-w-0 flex flex-col ${leftBorder}`}>
                                        <div className="border-b border-[#1f1f1f] px-5 py-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-end sm:gap-4">
                                                <div className="flex flex-col items-stretch sm:items-end gap-2 min-w-0 flex-1 w-full">
                                                    <div className="flex items-start justify-end gap-2.5 w-full min-w-0">
                                                        {domainForLogo ? (
                                                            <CompetitorGridLogo domain={domainForLogo} />
                                                        ) : null}
                                                        <span
                                                            className="text-white text-[15px] font-semibold leading-snug text-right break-all sm:max-w-[min(100%,14rem)]"
                                                            title={domainDisplay}
                                                        >
                                                            {domainDisplay}
                                                        </span>
                                                    </div>
                                                    {isActive ? (
                                                        <span className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap self-end">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.45)]" />
                                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                                                                ACTIVE
                                                            </span>
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`border-b border-[#1f1f1f] ${rowInner}`}>
                                            <span className={labelCls}>Visibility</span>
                                            <span
                                                className={`text-[26px] font-bold tabular-nums leading-none tracking-tight ${visPct != null ? 'text-white' : 'text-[#888]'}`}
                                            >
                                                {visPct != null ? `${visPct}%` : '—'}
                                            </span>
                                        </div>
                                        <div className={`border-b border-[#1f1f1f] ${rowInner}`}>
                                            <span className={labelCls}>Open Issues</span>
                                            <span className="text-white text-[13px] font-semibold tabular-nums flex items-center justify-end gap-2">
                                                {issues != null && issues > 0 ? (
                                                    <>
                                                        <AlertTriangle
                                                            className="w-4 h-4 text-amber-400 shrink-0"
                                                            strokeWidth={2.25}
                                                            aria-hidden
                                                        />
                                                        {issues}
                                                    </>
                                                ) : issues === 0 ? (
                                                    <span className="text-white font-semibold">0</span>
                                                ) : (
                                                    <span className="text-[#888]">—</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className={`border-b border-[#1f1f1f] ${rowInner}`}>
                                            <span className={labelCls}>Created</span>
                                            <span
                                                className={`text-[13px] font-medium tabular-nums text-right ${createdStr === '—' ? 'text-[#888]' : 'text-white'}`}
                                            >
                                                {createdStr}
                                            </span>
                                        </div>
                                        <div className={rowInner}>
                                            <span className={labelCls}>Competitors</span>
                                            <span className="text-white text-[13px] font-medium tabular-nums">
                                                {compN} tracked
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
        </div>
    );
}
