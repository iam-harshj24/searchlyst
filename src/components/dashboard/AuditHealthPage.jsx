import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FileSearch, Globe, Activity, AlertTriangle, CheckCircle, XCircle,
    Search, ArrowRight, Loader2, Shield, Zap, Eye, BarChart3,
    MapPin, Bot, ChevronDown, ChevronRight, ExternalLink, RefreshCw,
    BookOpen, TrendingUp
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/apiClient";

const CATEGORY_META = {
    seo: { label: 'SEO', icon: Search, color: 'text-blue-400', bgColor: 'from-blue-500/10 to-blue-600/5', borderColor: 'border-blue-500/20', accentBg: 'bg-blue-500', ringColor: 'ring-blue-500/40' },
    geo: { label: 'GEO', icon: Globe, color: 'text-purple-400', bgColor: 'from-purple-500/10 to-purple-600/5', borderColor: 'border-purple-500/20', accentBg: 'bg-purple-500', ringColor: 'ring-purple-500/40' },
    aeo: { label: 'AEO', icon: Bot, color: 'text-amber-400', bgColor: 'from-amber-500/10 to-amber-600/5', borderColor: 'border-amber-500/20', accentBg: 'bg-amber-500', ringColor: 'ring-amber-500/40' },
    content: { label: 'Content', icon: BookOpen, color: 'text-emerald-400', bgColor: 'from-emerald-500/10 to-emerald-600/5', borderColor: 'border-emerald-500/20', accentBg: 'bg-emerald-500', ringColor: 'ring-emerald-500/40' },
};

const SEVERITY_CONFIG = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle, label: 'Critical' },
    high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle, label: 'High' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/15', icon: AlertTriangle, label: 'Medium' },
    low: { color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--surface-active)]', border: 'border-[var(--border)]', icon: Activity, label: 'Low' },
};

function ScoreRing({ score, size = 120, strokeWidth = 8, label }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={scoreColor} strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
                <span className="text-3xl font-bold text-[var(--text-primary)]">{score}</span>
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{label || 'Score'}</span>
            </div>
        </div>
    );
}

function IssueCard({ issue, defaultExpanded = false }) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const sev = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.low;
    const SevIcon = sev.icon;

    return (
        <div className={`border ${sev.border} rounded-xl overflow-hidden transition-all hover:border-[var(--border-strong)]`}>
            <button onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-start gap-3 text-left bg-[var(--surface-hover)] hover:bg-[var(--surface-active)] transition-colors">
                <SevIcon className={`w-4 h-4 mt-0.5 shrink-0 ${sev.color}`} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{issue.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{issue.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${sev.bg} ${sev.color} border ${sev.border} capitalize`}>
                        {issue.severity}
                    </span>
                    {expanded ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
                </div>
            </button>

            {expanded && (
                <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] space-y-3 bg-[var(--surface-hover)]">
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Impact</span>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{issue.impact}</p>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-red-400/80">How to fix</span>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{issue.fix}</p>
                    </div>
                    {issue.affectedPages && issue.affectedPages.length > 0 && (
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                                Affected pages ({issue.affectedPages.length})
                            </span>
                            <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                                {issue.affectedPages.slice(0, 10).map((pageUrl, i) => (
                                    <a key={i} href={pageUrl} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-blue-400/80 hover:text-blue-300 truncate">
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{pageUrl}</span>
                                    </a>
                                ))}
                                {issue.affectedPages.length > 10 && (
                                    <p className="text-xs text-[var(--text-muted)]">...and {issue.affectedPages.length - 10} more</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function CrawlingProgress({ progress, status }) {
    const messages = [
        'Discovering pages on your website...',
        'Crawling and extracting page data...',
        'Parsing HTML structure and metadata...',
        'Analyzing content quality and depth...',
        'Checking structured data and schema...',
        'Evaluating SEO, GEO, and AEO signals...',
        'Running comprehensive audit checks...',
        'Generating your audit report...',
    ];
    const [msgIdx, setMsgIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 4000);
        return () => clearInterval(interval);
    }, []);

    const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

    return (
        <div className="bg-gradient-to-br from-[var(--surface-hover)] to-transparent border border-[var(--border)] rounded-2xl p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]" />
                <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <FileSearch className="w-8 h-8 text-red-400" />
                </div>
            </div>

            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                {status === 'analyzing' ? 'Analyzing Your Website' : 'Crawling Your Website'}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 h-5 transition-all">{messages[msgIdx]}</p>

            {progress.total > 0 && (
                <div className="max-w-xs mx-auto">
                    <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1.5">
                        <span>{progress.completed} / {progress.total} pages</span>
                        <span>{pct}%</span>
                    </div>
                    <div className="h-2 bg-[var(--surface-active)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 5)}%` }} />
                    </div>
                </div>
            )}

            {!progress.total && (
                <div className="max-w-xs mx-auto">
                    <div className="h-2 bg-[var(--surface-active)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AuditHealthPage({ user }) {
    const [auditUrl, setAuditUrl] = useState(user?.domain ? `https://${user.domain}` : '');
    const [auditId, setAuditId] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | crawling | analyzing | completed | failed
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const pollRef = useRef(null);

    const storageKey = `searchlyst_audit_${user?.domain || 'default'}`;

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed) {
                    setResult(parsed);
                    setStatus('completed');
                }
            } catch (err) {
                console.error('Failed to load saved audit', err);
            }
        } else {
            // If there is no cache for THIS project, reset the state
            setResult(null);
            setStatus('idle');
            setAuditUrl(user?.domain ? `https://${user.domain}` : '');
        }
    }, [storageKey, user?.domain]);

    const stopPolling = useCallback(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }, []);

    useEffect(() => () => stopPolling(), [stopPolling]);

    // AUTO-START: Trigger audit on mount when domain exists but no cached result
    useEffect(() => {
        if (status === 'idle' && !result && auditUrl.trim()) {
            console.log('[Audit] Auto-starting audit for', auditUrl);
            handleRunAudit();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const pollStatus = useCallback((id) => {
        stopPolling();
        pollRef.current = setInterval(async () => {
            try {
                const res = await apiClient.audit.getStatus(id);
                if (res.progress) setProgress(res.progress);
                if (res.status === 'completed') {
                    setStatus('completed');
                    setResult(res.result);
                    localStorage.setItem(storageKey, JSON.stringify(res.result));
                    stopPolling();
                } else if (res.status === 'failed') {
                    setStatus('failed');
                    setError(res.error || 'Audit failed');
                    stopPolling();
                } else {
                    setStatus(res.status);
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 4000);
    }, [stopPolling, storageKey]);

    const handleRunAudit = async () => {
        if (!auditUrl.trim()) return;
        setStatus('crawling');
        setResult(null);
        setError(null);
        setProgress({ completed: 0, total: 0 });
        setSelectedCategory('all');
        setSeverityFilter('all');

        try {
            const res = await apiClient.audit.start(auditUrl.trim());
            setAuditId(res.auditId);
            pollStatus(res.auditId);
        } catch (err) {
            setStatus('failed');
            setError(err.message || 'Failed to start audit');
        }
    };

    const handleNewAudit = () => {
        stopPolling();
        setStatus('idle');
        setResult(null);
        setError(null);
        setAuditId(null);
        setProgress({ completed: 0, total: 0 });
        localStorage.removeItem(storageKey);
    };

    const getFilteredIssues = () => {
        if (!result) return [];
        let issues = selectedCategory === 'all'
            ? Object.values(result.categories).flatMap(c => c.issues)
            : result.categories[selectedCategory]?.issues || [];
        if (severityFilter !== 'all') {
            issues = issues.filter(i => i.severity === severityFilter);
        }
        return issues.sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
        });
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <FileSearch className="w-5 h-5 text-red-400" />
                        Website Audit
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Comprehensive SEO, GEO, AEO, and content audit for your website</p>
                </div>
                {status === 'completed' && (
                    <Button onClick={handleNewAudit} variant="outline" size="sm"
                        className="border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] bg-transparent">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> New Audit
                    </Button>
                )}
            </div>

            {/* URL Input — show when idle or failed */}
            {(status === 'idle' || status === 'failed') && (
                <div className="bg-gradient-to-br from-red-500/5 to-red-600/5 border border-red-500/10 rounded-2xl p-6">
                    <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">Run a Comprehensive Audit</h3>
                    <p className="text-[var(--text-muted)] text-xs mb-4">We'll crawl your site and check for 90+ issues across SEO, GEO, AEO, and content quality.</p>
                    <div className="flex gap-3">
                        <Input
                            value={auditUrl}
                            onChange={(e) => setAuditUrl(e.target.value)}
                            placeholder="Enter your website URL (e.g. https://yourwebsite.com)"
                            className="bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleRunAudit()}
                        />
                        <Button onClick={handleRunAudit} disabled={!auditUrl.trim()}
                            className="bg-red-600 hover:bg-red-700 text-[var(--text-primary)] rounded-xl px-6">
                            <Zap className="w-4 h-4 mr-2" /> Run Audit
                        </Button>
                    </div>
                    {error && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Crawling / Analyzing Progress */}
            {(status === 'crawling' || status === 'analyzing') && (
                <CrawlingProgress progress={progress} status={status} />
            )}

            {/* Results */}
            {status === 'completed' && result && (
                <>
                    {/* Overall + Category Scores */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        {/* Overall Score */}
                        <div className="lg:col-span-1 bg-gradient-to-br from-[var(--surface-hover)] to-transparent border border-[var(--border)] rounded-2xl p-5 flex flex-col items-center justify-center relative">
                            <ScoreRing score={result.scores.overall} size={110} label="Overall" />
                            <p className="text-xs text-[var(--text-muted)] mt-2">{result.crawledPages} pages audited</p>
                        </div>

                        {/* 4 Category Cards */}
                        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(CATEGORY_META).map(([key, meta]) => {
                                const cat = result.categories[key];
                                if (!cat) return null;
                                const CatIcon = meta.icon;
                                const isSelected = selectedCategory === key;
                                return (
                                    <button key={key}
                                        onClick={() => setSelectedCategory(isSelected ? 'all' : key)}
                                        className={`bg-gradient-to-br ${meta.bgColor} border ${meta.borderColor} rounded-2xl p-4 text-left transition-all ${isSelected ? `ring-1 ${meta.ringColor}` : ''}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <CatIcon className={`w-4 h-4 ${meta.color}`} />
                                            <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">{meta.label}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-[var(--text-primary)]">
                                            {cat.score}<span className="text-[var(--text-muted)] text-sm">/100</span>
                                        </p>
                                        <div className="mt-2 h-1.5 bg-[var(--surface-active)] rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${cat.score >= 80 ? 'bg-green-500' : cat.score >= 60 ? 'bg-yellow-500' : cat.score >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                                                style={{ width: `${cat.score}%` }} />
                                        </div>
                                        <p className="text-[10px] text-[var(--text-muted)] mt-1.5">{cat.summary.total} issues</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary Bar */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-[var(--text-secondary)]">Issues found:</span>
                        {['critical', 'high', 'medium', 'low'].map(sev => {
                            const count = result.summary[sev];
                            if (count === 0) return null;
                            const cfg = SEVERITY_CONFIG[sev];
                            const isActive = severityFilter === sev;
                            return (
                                <button key={sev}
                                    onClick={() => setSeverityFilter(isActive ? 'all' : sev)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${isActive ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border)]'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
                                    {count} {cfg.label}
                                </button>
                            );
                        })}
                        <span className="text-xs text-[var(--text-muted)] ml-auto">{result.summary.total} total issues</span>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-2 border-b border-[var(--border)] pb-1">
                        <button onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-all ${selectedCategory === 'all' ? 'text-[var(--text-primary)] bg-[var(--surface-active)] border-b-2 border-red-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'}`}>
                            All Issues
                        </button>
                        {Object.entries(CATEGORY_META).map(([key, meta]) => {
                            const cat = result.categories[key];
                            if (!cat || cat.summary.total === 0) return null;
                            return (
                                <button key={key} onClick={() => setSelectedCategory(key)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-all flex items-center gap-1.5 ${selectedCategory === key ? `${meta.color} bg-[var(--surface-active)] border-b-2 border-current` : 'text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'}`}>
                                    {cat.name}
                                    <span className="text-[10px] opacity-60">({cat.summary.total})</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Issues List */}
                    <div className="space-y-2">
                        {getFilteredIssues().length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="w-10 h-10 text-green-500/40 mx-auto mb-3" />
                                <p className="text-[var(--text-secondary)] text-sm">No issues found in this category</p>
                            </div>
                        ) : (
                            getFilteredIssues().map((issue, i) => (
                                <IssueCard key={issue.id + '-' + i} issue={issue} />
                            ))
                        )}
                    </div>

                    {/* Crawled Pages */}
                    {result.pages && result.pages.length > 0 && (
                        <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl p-5">
                            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-[var(--text-secondary)]" />
                                Crawled Pages ({result.pages.length})
                            </h3>
                            <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                {result.pages.map((page, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--surface-hover)]">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[10px] text-[var(--text-muted)] w-4 text-right">{i + 1}</span>
                                            <a href={page.url} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-blue-400/80 hover:text-blue-300 truncate">
                                                {page.url}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-[10px] text-[var(--text-muted)]">{page.wordCount} words</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
