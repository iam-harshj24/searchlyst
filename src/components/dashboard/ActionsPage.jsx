import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Bell, Search, Globe, Bot, BookOpen,
    Activity, CheckCircle2, Circle, ChevronRight,
    CheckCheck, Trash2, Eye, X,
    ExternalLink, AlertTriangle, XCircle, FileSearch,
    ArrowRight, TrendingUp, Shield,
    FileText, Lightbulb,
    Sparkles, BarChart3
} from 'lucide-react';

const CATEGORY_META = {
    seo: { label: 'SEO', icon: Search, color: '#60a5fa' },
    geo: { label: 'GEO', icon: Globe, color: '#c084fc' },
    aeo: { label: 'AEO', icon: Bot, color: '#fbbf24' },
    content: { label: 'Content', icon: BookOpen, color: '#34d399' },
};

const PRIORITY = {
    critical: {
        label: 'CRITICAL',
        badge: 'bg-[#1a0505] text-red-400 border border-red-500/30',
        ring: 'border-[#2a1010]',
        iconBg: 'bg-[#140404]',
        iconColor: 'text-red-400',
        SevIcon: XCircle,
    },
    high: {
        label: 'HIGH',
        badge: 'bg-[#1a0d00] text-orange-400 border border-orange-500/30',
        ring: 'border-[#221508]',
        iconBg: 'bg-[#130a02]',
        iconColor: 'text-orange-400',
        SevIcon: AlertTriangle,
    },
    medium: {
        label: 'MEDIUM',
        badge: 'bg-[#15130a] text-yellow-400 border border-yellow-500/25',
        ring: 'border-[#1e1c08]',
        iconBg: 'bg-[#100f02]',
        iconColor: 'text-yellow-400',
        SevIcon: AlertTriangle,
    },
    low: {
        label: 'LOW',
        badge: 'bg-[#141414] text-[#777] border border-[#2a2a2a]',
        ring: 'border-[#1e1e1e]',
        iconBg: 'bg-[#111]',
        iconColor: 'text-[#555]',
        SevIcon: Activity,
    },
};

const INSIGHT_PRIORITY_MAP = {
    weakness: 'high',
    opportunity: 'medium',
    strength: 'low',
};

const FILTER_TABS = ['All', 'Critical', 'High', 'Medium', 'Low'];

function readAuditActions(domain) {
    try {
        const key = `searchlyst_audit_${domain || 'default'}`;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const result = JSON.parse(raw);
        if (!result?.categories) return null;

        const actions = [];
        Object.entries(result.categories).forEach(([catKey, cat]) => {
            const meta = CATEGORY_META[catKey];
            (cat.issues || []).forEach((issue, idx) => {
                actions.push({
                    id: issue.id || `${catKey}-${idx}`,
                    catKey,
                    catLabel: meta?.label || catKey,
                    title: issue.title,
                    description: issue.description,
                    priority: issue.severity || 'low',
                    impact: issue.impact,
                    fix: issue.fix,
                    affectedPages: issue.affectedPages || [],
                    source: 'audit',
                });
            });
        });

        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        actions.sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
        return { actions, auditedAt: result.auditedAt || null, domain };
    } catch { return null; }
}

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

function buildInsightActions(visData) {
    if (!visData?.intelligence) return [];
    const { overallAssessment, strengthAreas, weaknessAreas, topOpportunities } = visData.intelligence;
    const actions = [];

    if (overallAssessment) {
        actions.push({
            id: 'insight-overall',
            catKey: 'ai-insight',
            catLabel: 'AI Insight',
            title: 'Review your AI visibility assessment',
            description: overallAssessment,
            priority: 'medium',
            source: 'insight',
            insightType: 'assessment',
        });
    }

    (weaknessAreas || []).forEach((w, i) => {
        const text = typeof w === 'string' ? w : w?.area || w?.description || JSON.stringify(w);
        actions.push({
            id: `insight-weakness-${i}`,
            catKey: 'ai-insight',
            catLabel: 'Weakness',
            title: `Fix weakness: ${text.length > 80 ? text.slice(0, 80) + '…' : text}`,
            description: text,
            priority: 'high',
            source: 'insight',
            insightType: 'weakness',
        });
    });

    (topOpportunities || []).forEach((o, i) => {
        const text = typeof o === 'string' ? o : o?.opportunity || o?.description || JSON.stringify(o);
        actions.push({
            id: `insight-opportunity-${i}`,
            catKey: 'ai-insight',
            catLabel: 'Opportunity',
            title: `Opportunity: ${text.length > 80 ? text.slice(0, 80) + '…' : text}`,
            description: text,
            priority: 'medium',
            source: 'insight',
            insightType: 'opportunity',
        });
    });

    (strengthAreas || []).forEach((s, i) => {
        const text = typeof s === 'string' ? s : s?.area || s?.description || JSON.stringify(s);
        actions.push({
            id: `insight-strength-${i}`,
            catKey: 'ai-insight',
            catLabel: 'Strength',
            title: `Maintain strength: ${text.length > 80 ? text.slice(0, 80) + '…' : text}`,
            description: text,
            priority: 'low',
            source: 'insight',
            insightType: 'strength',
        });
    });

    return actions;
}

// ── Action Card (audit + insight) ────────────────────────────────────────────
function ActionCard({ action, done, onToggleDone, onDismiss }) {
    const [expanded, setExpanded] = useState(false);
    const p = PRIORITY[action.priority] || PRIORITY.low;
    const isInsight = action.source === 'insight';

    const iconMap = {
        assessment: Sparkles,
        weakness: AlertTriangle,
        opportunity: TrendingUp,
        strength: Shield,
    };

    let CatIcon, catColor;
    if (isInsight) {
        CatIcon = iconMap[action.insightType] || Lightbulb;
        catColor = action.insightType === 'weakness' ? '#f97316'
            : action.insightType === 'opportunity' ? '#a78bfa'
            : action.insightType === 'strength' ? '#34d399'
            : '#60a5fa';
    } else {
        const meta = CATEGORY_META[action.catKey] || { icon: Activity, color: '#888' };
        CatIcon = meta.icon;
        catColor = meta.color;
    }

    return (
        <div className={`relative border ${p.ring} rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#2a2a2a] ${done ? 'opacity-40' : ''}`}>
            {done && (
                <div className="absolute top-3.5 right-12 flex items-center gap-1.5 text-[#22c55e] text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </div>
            )}

            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className="flex items-center gap-3 shrink-0 mt-0.5">
                        <button
                            onClick={() => onToggleDone(action.id)}
                            className="shrink-0 transition-colors"
                            title={done ? 'Mark undone' : 'Mark as done'}
                        >
                            {done
                                ? <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                                : <Circle className="w-5 h-5 text-[#333] hover:text-[#555]" />
                            }
                        </button>
                        <div
                            className={`w-10 h-10 rounded-xl ${p.iconBg} border ${p.ring} flex items-center justify-center`}
                            style={{ color: catColor }}
                        >
                            <CatIcon className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-semibold leading-snug mb-1 ${done ? 'line-through text-[#444]' : 'text-white'}`}>
                            {action.title}
                        </p>
                        <p className="text-[#666] text-[12px] leading-relaxed mb-3">{action.description}</p>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${p.badge}`}>
                                {p.label}
                            </span>
                            <span
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                                style={{ color: catColor, borderColor: `${catColor}30`, background: `${catColor}08` }}
                            >
                                {action.catLabel}
                            </span>
                            {isInsight && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[#a78bfa]/25 text-[#a78bfa] bg-[#a78bfa]/5">
                                    AI Insight
                                </span>
                            )}
                            {action.affectedPages?.length > 0 && (
                                <span className="text-[#444] text-[11px] flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {action.affectedPages.length} page{action.affectedPages.length !== 1 ? 's' : ''} affected
                                </span>
                            )}
                        </div>

                        {expanded && (
                            <div className="mt-4 pt-4 border-t border-[#1a1a1a] space-y-3">
                                {action.impact && (
                                    <div>
                                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.12em] mb-1">Impact</p>
                                        <p className="text-[#777] text-[12px] leading-relaxed">{action.impact}</p>
                                    </div>
                                )}
                                {action.fix && (
                                    <div>
                                        <p className="text-[#E92A15] text-[10px] font-bold uppercase tracking-[0.12em] mb-1">How to fix</p>
                                        <p className="text-[#888] text-[12px] leading-relaxed">{action.fix}</p>
                                    </div>
                                )}
                                {action.affectedPages?.length > 0 && (
                                    <div>
                                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5">
                                            Affected pages ({action.affectedPages.length})
                                        </p>
                                        <div className="space-y-1 max-h-28 overflow-y-auto">
                                            {action.affectedPages.slice(0, 8).map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-[11px] text-[#4a8abf] hover:text-blue-300 truncate">
                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{url}</span>
                                                </a>
                                            ))}
                                            {action.affectedPages.length > 8 && (
                                                <p className="text-[#444] text-[11px]">+{action.affectedPages.length - 8} more</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {!done && (
                                    <button
                                        onClick={() => { onToggleDone(action.id); setExpanded(false); }}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#0a200a] border border-[#22c55e]/25 text-[#22c55e] text-[12px] font-semibold rounded-xl hover:bg-[#0f2a0f] transition-colors"
                                    >
                                        <CheckCheck className="w-4 h-4" /> Mark as Done
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="w-8 h-8 rounded-lg bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#444] hover:text-[#888] hover:border-[#2a2a2a] transition-all"
                            title="View details"
                        >
                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
                        </button>
                        <button
                            onClick={() => onDismiss(action.id)}
                            className="w-8 h-8 rounded-lg bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#444] hover:text-red-400 hover:border-red-500/30 transition-all"
                            title="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Empty States ─────────────────────────────────────────────────────────────
function EmptyState({ onGoToAudit }) {
    return (
        <div className="flex flex-col items-center justify-center py-28 bg-[#0B0B0B] border border-[#1a1a1a] rounded-2xl text-center">
            <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-5 border border-[#1e1e1e]">
                <FileSearch className="w-8 h-8 text-[#2a2a2a]" />
            </div>
            <p className="text-white text-[16px] font-semibold mb-2">No audit data found</p>
            <p className="text-[#555] text-[13px] max-w-sm mb-6 leading-relaxed">
                Run a website audit from the <span className="text-[#888]">Audits &amp; Health</span> page first.
                Your actionable issues will appear here automatically.
            </p>
            <button
                onClick={onGoToAudit}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#E92A15] hover:bg-[#c82010] text-white text-[13px] font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(233,42,21,0.25)]"
            >
                Go to Audits &amp; Health <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ActionsPage({ user, onTabChange }) {
    const [activeFilter, setActiveFilter] = useState('All');
    const [showDone, setShowDone] = useState(false);

    const stateKey = `searchlyst_actions_state_${user?.domain || 'default'}`;

    const [doneIds, setDoneIds] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(stateKey) || '{}');
            return new Set(saved.done || []);
        } catch { return new Set(); }
    });
    const [dismissedIds, setDismissedIds] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(stateKey) || '{}');
            return new Set(saved.dismissed || []);
        } catch { return new Set(); }
    });

    useEffect(() => {
        try {
            localStorage.setItem(stateKey, JSON.stringify({
                done: [...doneIds],
                dismissed: [...dismissedIds],
            }));
        } catch { }
    }, [doneIds, dismissedIds, stateKey]);

    const auditData = useMemo(() => readAuditActions(user?.domain), [user?.domain]);
    const visData = useMemo(
        () => getVisibilityData(user?.domain, user?.projectId),
        [user?.domain, user?.projectId]
    );

    const insightActions = useMemo(() => buildInsightActions(visData), [visData]);

    const allActions = useMemo(() => {
        const audit = auditData?.actions || [];
        return [...audit, ...insightActions];
    }, [auditData, insightActions]);

    const hasAnyData = auditData || visData;

    const toggleDone = useCallback((id) => {
        setDoneIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const dismiss = useCallback((id) => {
        setDismissedIds(prev => new Set([...prev, id]));
    }, []);

    const clearDone = useCallback(() => {
        setDismissedIds(prev => new Set([...prev, ...doneIds]));
        setDoneIds(new Set());
    }, [doneIds]);

    const counts = useMemo(() => {
        const active = allActions.filter(a => !dismissedIds.has(a.id));
        return {
            all: active.length,
            critical: active.filter(a => a.priority === 'critical').length,
            high: active.filter(a => a.priority === 'high').length,
            medium: active.filter(a => a.priority === 'medium').length,
            low: active.filter(a => a.priority === 'low').length,
            done: [...doneIds].filter(id => !dismissedIds.has(id)).length,
            audit: active.filter(a => a.source === 'audit').length,
            insight: active.filter(a => a.source === 'insight').length,
        };
    }, [allActions, dismissedIds, doneIds]);

    const visible = useMemo(() => {
        return allActions.filter(a => {
            if (dismissedIds.has(a.id)) return false;
            if (!showDone && doneIds.has(a.id)) return false;
            if (activeFilter === 'All') return true;
            return a.priority === activeFilter.toLowerCase();
        });
    }, [allActions, activeFilter, doneIds, dismissedIds, showDone]);

    const hasDone = [...doneIds].some(id => !dismissedIds.has(id));

    return (
        <div className="w-full pb-12">
            {/* ── Header ── */}
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#050510] rounded-xl flex items-center justify-center border border-[#3333aa]/40 shadow-[0_0_15px_rgba(80,80,200,0.15)]">
                        <Bell className="w-5 h-5 text-[#6666dd]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Actions</h1>
                        <p className="text-[#666] text-[13px] mt-0.5">
                            Audit fixes and AI insight tasks from your latest data.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasDone && (
                        <button
                            onClick={clearDone}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-[#222] text-[#555] hover:text-[#888] text-[12px] font-medium rounded-xl transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Clear done ({counts.done})
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowDone(s => !s)}
                        className={`flex items-center gap-2 px-4 py-2 border text-[12px] font-medium rounded-xl transition-colors ${showDone
                            ? 'bg-[#1a1a1a] border-[#333] text-white'
                            : 'bg-[#0f0f0f] border-[#1e1e1e] text-[#555] hover:text-[#888]'
                        }`}
                    >
                        <Eye className="w-3.5 h-3.5" /> {showDone ? 'Hide done' : 'Show done'}
                    </button>
                </div>
            </div>

            <div className="mt-8 space-y-5">
                {!hasAnyData && (
                    <EmptyState onGoToAudit={() => onTabChange?.('audit-health')} />
                )}

                {hasAnyData && (
                    <>
                                {/* KPI Row */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {[
                                        { label: 'Total', value: counts.all, color: 'text-white' },
                                        { label: 'Critical', value: counts.critical, color: 'text-red-400' },
                                        { label: 'High', value: counts.high, color: 'text-orange-400' },
                                        { label: 'Medium', value: counts.medium, color: 'text-yellow-400' },
                                        { label: 'Completed', value: counts.done, color: 'text-[#22c55e]' },
                                        { label: 'AI Insights', value: counts.insight, color: 'text-[#a78bfa]' },
                                    ].map((kpi, i) => (
                                        <div key={i} className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl px-5 py-4">
                                            <p className="text-[#444] text-[10px] font-bold uppercase tracking-[0.14em] mb-2">{kpi.label}</p>
                                            <p className={`text-[28px] font-bold leading-none ${kpi.color}`}>{kpi.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Category pills */}
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
                                        const catCount = allActions.filter(a => a.catKey === catKey && !dismissedIds.has(a.id)).length;
                                        if (catCount === 0) return null;
                                        const Icon = meta.icon;
                                        return (
                                            <div key={catKey} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1e1e1e] bg-[#0B0B0B] text-[12px]"
                                                style={{ borderColor: `${meta.color}20` }}>
                                                <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                                                <span style={{ color: meta.color }} className="font-semibold">{meta.label}</span>
                                                <span className="text-[#444]">{catCount}</span>
                                            </div>
                                        );
                                    })}
                                    {counts.insight > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#a78bfa]/20 bg-[#0B0B0B] text-[12px]">
                                            <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                                            <span className="text-[#a78bfa] font-semibold">AI Insights</span>
                                            <span className="text-[#444]">{counts.insight}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Priority filter tabs */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {FILTER_TABS.map(tab => {
                                        const count = tab === 'All' ? counts.all : counts[tab.toLowerCase()] || 0;
                                        const isActive = activeFilter === tab;
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveFilter(tab)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all border ${isActive
                                                    ? tab === 'All'
                                                        ? 'bg-[#E92A15] border-[#E92A15] text-white shadow-[0_0_16px_rgba(233,42,21,0.3)]'
                                                        : tab === 'Critical'
                                                            ? 'bg-red-500/15 border-red-500/40 text-red-400'
                                                            : tab === 'High'
                                                                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                                                : tab === 'Medium'
                                                                    ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400'
                                                                    : 'bg-[#1a1a1a] border-[#333] text-[#aaa]'
                                                    : 'bg-transparent border-[#222] text-[#555] hover:border-[#2a2a2a] hover:text-[#888]'
                                                }`}
                                            >
                                                {tab}
                                                {count > 0 && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive && tab === 'All' ? 'bg-white/20 text-white' : 'bg-[#1a1a1a] text-[#555]'}`}>
                                                        {count}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Action cards */}
                                <div className="space-y-2.5">
                                    {visible.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 bg-[#0B0B0B] border border-[#1a1a1a] rounded-2xl">
                                            <div className="w-14 h-14 bg-[#111] rounded-2xl flex items-center justify-center mb-4 border border-[#1e1e1e]">
                                                <CheckCircle2 className="w-7 h-7 text-[#22c55e]/40" />
                                            </div>
                                            <p className="text-[#555] text-[15px] font-semibold mb-1">All clear!</p>
                                            <p className="text-[#333] text-[13px]">
                                                {activeFilter === 'All'
                                                    ? 'No active actions — great work!'
                                                    : `No ${activeFilter.toLowerCase()} issues remaining.`}
                                            </p>
                                        </div>
                                    ) : (
                                        visible.map(action => (
                                            <ActionCard
                                                key={action.id}
                                                action={action}
                                                done={doneIds.has(action.id)}
                                                onToggleDone={toggleDone}
                                                onDismiss={dismiss}
                                            />
                                        ))
                                    )}
                                </div>
                    </>
                )}
            </div>
        </div>
    );
}
