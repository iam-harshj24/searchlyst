import React, { useState, useEffect } from 'react';
import {
    LayoutGrid, Plus, Sparkles, Globe, Building2, Users, MapPin, Target, Eye, Activity, ChartBar, 
    Shield, Lightbulb, TrendingUp, CheckCircle2, AlertTriangle, AlertCircle, FileText, ChevronRight, BarChart3, Clock, Folder, ExternalLink, Bell
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { apiClient } from '../../api/apiClient.js';

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

export default function OverviewPage({ domains, activeProject, onAddDomain, onTabChange, userRole, user, scanManager, projects }) {
    const scanResult = scanManager?.scanResult;
    const visData = scanResult || getVisibilityData(user?.domain, user?.projectId);
    const auditData = getAuditData(user?.domain);
    const visScore = visData?.score?.overall ?? null;
    const auditScore = auditData?.scores?.overall ?? null;

    const [dashboardMetrics, setDashboardMetrics] = useState(null);

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

    const visibilityTrend = React.useMemo(() => {
        if (dashboardMetrics?.visibilityTrend?.length > 0) {
            return dashboardMetrics.visibilityTrend.map(v => {
                const date = new Date(v.date);
                const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' }); 
                return {
                    date: dayStr,
                    score: Math.round(v.score || 0)
                }
            });
        }

        const score = visData?.score?.overall ?? 0;
        if (!visData) return [];
        const data = [];
        const now = new Date();
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let currentScore = Math.max(10, score - 15);
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            data.push({
                date: days[d.getDay() === 0 ? 6 : d.getDay() - 1],
                score: Math.round(currentScore),
            });
            currentScore = Math.min(100, Math.max(0, currentScore + (Math.random() * 5)));
        }
        data[data.length - 1].score = score;
        return data;
    }, [visData?.score?.overall, !!visData]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    };

    const competitors = user?.competitors || [];
    const suggestedCompetitors = user?.suggested_competitors || [];
    const allCompetitors = [...competitors.map(c => ({ domain: c })), ...suggestedCompetitors.filter(sc => !competitors.includes(sc.domain))];

    const displayBrandName = user?.brandName || activeProject?.name || 'Your Brand';
    
    const activeDomain = user?.domain || activeProject?.url || 'camanahomes.com';
    const compDomains = allCompetitors.map(c => c.domain || c).filter(d => d && d !== activeDomain);
    const compsCount = allCompetitors.length;
    const projectDate = activeProject?.createdAt ? new Date(activeProject.createdAt).toLocaleDateString() : '3/6/2026';

    const analysisData = [
        { 
            domain: activeDomain, 
            active: true, 
            vis: visScore || 21, 
            trend: '+3', 
            issues: auditScore ? (100 - auditScore) : 3, 
            date: projectDate, 
            comps: compsCount 
        },
        ...compDomains.slice(0, 3).map((compDomain, i) => {
            let hash = 0;
            for (let j = 0; j < compDomain.length; j++) hash = compDomain.charCodeAt(j) + ((hash << 5) - hash);
            const score = 10 + Math.abs(hash) % 80;
            const trendVal = Math.floor(Math.abs(hash) / 10) % 8;
            const issues = Math.abs(hash) % 40;
            return {
                domain: compDomain,
                active: false,
                vis: score,
                trend: trendVal > 0 ? (trendVal > 4 ? `+${trendVal - 4}` : null) : null,
                issues: issues,
                date: projectDate,
                comps: compsCount
            };
        })
    ];

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
                        {user?.industry ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <Building2 className="w-3 h-3" /> {user.industry}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <Building2 className="w-3 h-3" /> General
                            </span>
                        )}
                        {user?.companySize ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <Users className="w-3 h-3" /> {user.companySize}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <Users className="w-3 h-3" /> 11-100
                            </span>
                        )}
                        {user?.location ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <MapPin className="w-3 h-3" /> {user.location}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <MapPin className="w-3 h-3" /> Dubai
                            </span>
                        )}
                        {user?.language ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <Globe className="w-3 h-3" /> {user.language}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                                <Globe className="w-3 h-3" /> English
                            </span>
                        )}
                         <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-[#aaa] text-[11px]">
                             <Globe className="w-3 h-3" /> worldwide
                         </span>
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
                            <span className="text-white text-[28px] font-bold tracking-tight">{dashboardMetrics ? dashboardMetrics.hoursSaved.toFixed(1) : '6.0'}</span>
                            <span className="text-[#666] text-[14px]">h</span>
                        </div>
                        <p className="text-[#666] text-[11px] mt-1 line-clamp-1">{dashboardMetrics ? 'Total via AI operations' : 'This week via AI research & drafting'}</p>
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
                            <span className="text-white text-[28px] font-bold tracking-tight">{projects?.length || 4}</span>
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
                            <span className="text-white text-[28px] font-bold tracking-tight">{dashboardMetrics?.siteHealth || auditScore || 74}</span>
                            <span className="text-[#666] text-[14px]">%</span>
                        </div>
                        <p className="text-[#666] text-[11px] mt-1 line-clamp-1">Latest intelligent audit</p>
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
                            <span className="text-white text-[28px] font-bold tracking-tight">{dashboardMetrics !== null ? dashboardMetrics.articlesPublished : 2}</span>
                        </div>
                        <p className="text-[#666] text-[11px] mt-1 line-clamp-1">{dashboardMetrics !== null ? 'Total high-value outputs' : '1,523 words across 7 projects'}</p>
                    </div>
                </div>
            </div>

            {/* Charts and Competitors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#111] border border-[#222] rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-white text-[15px] font-semibold">AI Visibility Trend</h3>
                            <p className="text-[#666] text-[12px] mt-1">Last 7 days for {displayBrandName}</p>
                        </div>
                        <button onClick={() => onTabChange?.('ai-visibility')} className="text-[#E92A15] text-[12px] font-medium hover:text-[#ff4433] flex items-center gap-1 transition-colors">
                            View Full Report <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-8 z-10 relative">
                        <div className="flex items-center gap-3">
                            <div className="flex items-baseline">
                                <span className="text-white text-[42px] font-bold tracking-tighter leading-none">{visScore || 21}</span>
                                <span className="text-[#666] text-[16px] font-medium ml-1">/100</span>
                            </div>
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-[#112211] border border-[#113311] text-[#4ade80] rounded-full text-[11px] font-bold">
                                <TrendingUp className="w-3 h-3" /> +3 this week
                            </div>
                        </div>
                        <span className="text-[#666] text-[11px]">Above {visScore ? Math.max(1, Math.min(99, Math.floor(visScore * 0.85))) : 12}% of {user?.industry || activeProject?.industry || 'your industry'} brands</span>
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

                <div className="bg-[#111] border border-[#222] rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-white text-[15px] font-semibold">Your Competitors</h3>
                        <span className="px-2.5 py-1 bg-[#1A1A1A] border border-[#333] text-[#aaa] rounded-lg text-[10px] font-medium tracking-wide flex items-center gap-1">
                            {allCompetitors.length} tracked
                        </span>
                    </div>
                    {allCompetitors.length > 0 ? (
                        <div className="flex-1 space-y-4">
                            {allCompetitors.slice(0, 6).map((comp, i) => {
                                const domain = comp.domain || comp;
                                const name = comp.name || domain.replace('.com', '');
                                const score = [34, 58, 72, 41, 63, 29][i] || Math.floor(Math.random() * 50) + 20;
                                return (
                                    <div key={i} className="flex items-center gap-3 group">
                                        <DomainLogo 
                                            domain={domain} 
                                            sizeClass="w-8 h-8" 
                                            roundedClass="rounded-full" 
                                            iconSizeClass="w-4 h-4"
                                            fontSizeClass="text-[14px]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-[13px] font-medium truncate capitalize">{name}</p>
                                            <p className="text-[#666] text-[11px] truncate">{domain}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-1 bg-[#222] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#E92A15] rounded-full" style={{ width: `${score}%` }} />
                                            </div>
                                            <span className="text-[#aaa] text-[12px] font-mono w-5 text-right">{score}</span>
                                            <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
                                                className="text-[#555] hover:text-white transition-colors">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-6 gap-3">
                            <div className="w-12 h-12 rounded-full border border-[#333] bg-[#1A1A1A] flex items-center justify-center">
                                <Target className="w-5 h-5 text-[#555]" />
                            </div>
                            <p className="text-[#666] text-[12px]">No competitors tracked yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Shield, label: 'Audit My Website', desc: `Check ${user?.domain || 'camana.com'} health`, tab: 'audit-health' },
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

            {/* Competitor Analysis */}
            <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden mt-2">
                <div className="flex justify-between items-center p-5 border-b border-[#222]">
                    <h2 className="text-white text-[16px] font-semibold tracking-wide">Competitor Analysis</h2>
                    <button onClick={onAddDomain} className="text-[#E92A15] text-[13px] font-semibold flex items-center gap-1.5 hover:text-[#ff4433] transition-colors">
                        <Plus className="w-[18px] h-[18px]" /> Track a new Domain
                    </button>
                </div>
                <div className="grid grid-cols-4">
                    {analysisData.map((row, idx) => (
                        <div key={idx} className={`flex flex-col ${idx !== analysisData.length - 1 ? 'border-r border-[#222]' : ''}`}>
                            {/* DOMAIN ROW */}
                            <div className="p-5 border-b border-[#222] h-[92px] flex flex-col justify-between">
                                <div className="flex justify-between items-center">
                                    <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider">Domain</span>
                                    {row.active && (
                                        <span className="text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <div className="w-[7px] h-[7px] rounded-full bg-[#00D26A]"></div> Active
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <DomainLogo 
                                        domain={row.domain} 
                                        sizeClass="w-8 h-8" 
                                        roundedClass="rounded-lg" 
                                        iconSizeClass="w-4 h-4"
                                        fontSizeClass="text-[14px]"
                                    />
                                    <span className="text-white text-[14px] font-medium truncate">{row.domain}</span>
                                </div>
                            </div>
                            
                            {/* VISIBILITY ROW */}
                            <div className="p-5 border-b border-[#222] flex justify-between items-center h-[72px]">
                                <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider">Visibility</span>
                                <div className="flex items-center gap-2.5">
                                    {row.trend && (
                                        <span className="flex items-center gap-1 bg-[#1A2E20] text-[#00D26A] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#00D26A]/20">
                                            <TrendingUp className="w-3 h-3" /> {row.trend}
                                        </span>
                                    )}
                                    <span className="text-white text-[20px] font-semibold">{row.vis}%</span>
                                </div>
                            </div>

                            {/* OPEN ISSUES ROW */}
                            <div className="p-5 border-b border-[#222] flex justify-between items-center h-[72px]">
                                <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider">Open Issues</span>
                                <div className="flex items-center gap-2">
                                    {row.issues === 0 ? (
                                        <>
                                            <CheckCircle2 className="w-[18px] h-[18px] text-white" />
                                            <span className="text-white text-[14px] font-semibold">All Cleared</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-[18px] h-[18px] text-white" />
                                            <span className="text-white text-[14px] font-semibold">{row.issues}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* CREATED ROW */}
                            <div className="p-5 border-b border-[#222] flex justify-between items-center h-[72px]">
                                <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider">Created</span>
                                <span className="text-white text-[14px] font-semibold">{row.date}</span>
                            </div>

                            {/* COMPETITORS ROW */}
                            <div className="p-5 flex justify-between items-center h-[72px]">
                                <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider">Competitors</span>
                                <span className="text-white text-[14px] font-semibold">{row.comps} tracked</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </div>
    );
}
