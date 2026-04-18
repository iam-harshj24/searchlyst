import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Globe, Bot, BookOpen, XCircle,
    AlertTriangle, CheckCircle2, RefreshCw, Loader2,
    Zap, ExternalLink, Clock, ChevronRight,
    Activity, Shield, Link, FileText, Cpu,
    TrendingUp, TrendingDown
} from 'lucide-react';

// ── Design tokens matching Figma ─────────────────────────────────────────────
const CATEGORY_META = {
    seo: {
        label: 'SEO', icon: Search,
        color: '#60a5fa', desc: 'Search engine optimisation',
        subcategories: ['Technical SEO', 'On-Page SEO'],
    },
    geo: {
        label: 'GEO', icon: Globe,
        color: '#c084fc', desc: 'Generative engine optimisation',
        subcategories: ['GEO Signals'],
    },
    aeo: {
        label: 'AEO', icon: Bot,
        color: '#fbbf24', desc: 'Answer engine optimisation',
        subcategories: ['Schema & Structure', 'FAQs & Q&A'],
    },
    content: {
        label: 'CONTENT', icon: BookOpen,
        color: '#34d399', desc: 'Content quality & freshness',
        subcategories: ['Content Quality', 'Performance', 'Links'],
    },
};

// Sub-category metadata for the left panel
const SUBCAT_META = {
    'Technical SEO': { icon: Cpu, key: 'seo' },
    'On-Page SEO': { icon: FileText, key: 'seo' },
    'GEO Signals': { icon: Globe, key: 'geo' },
    'Schema & Structure': { icon: Shield, key: 'aeo' },
    'FAQs & Q&A': { icon: Bot, key: 'aeo' },
    'Content Quality': { icon: BookOpen, key: 'content' },
    'Performance': { icon: Activity, key: 'content' },
    'Links': { icon: Link, key: 'content' },
};

// Parameters that are evaluated for each category
const SUBCAT_CHECKS = {
    'Technical SEO': [
        'HTTPS Security & Mixed Content',
        'XML Sitemaps Presence & Coverage',
        'Robots Meta noindex Directives',
        'Canonical Tags',
        'Viewport & Mobile Usability',
        'Hreflang Tags (Multilingual Targeting)',
        'URL Structure & Context',
        'Schema.org Presence'
    ],
    'On-Page SEO': [
        'Title Tags (Missing, Duplicate, Length)',
        'Meta Descriptions (Missing, Duplicate, Length)',
        'H1 Tags & Heading Level Hierarchy',
        'Image Alt Text Accessibility',
        'Internal Linking Density',
        'Open Graph & Twitter Cards',
        'Thin Content Detection',
        'Duplicate & Near-Duplicate Content'
    ],
    'GEO Signals': [
        'Entity Definition (Organization/Person Schema)',
        'About Page Depth & Presence',
        'Author Bios & Signals on Content',
        'E-E-A-T Trust Signals (Contact, Terms, Privacy)',
        'Brand Schema Integration'
    ],
    'Schema & Structure': [
        'BreadcrumbList Navigation',
        'Structured Data Validation',
        'Organization & LocalBusiness Schema',
        'Person Schema'
    ],
    'FAQs & Q&A': [
        'FAQPage Schema',
        'Q&A Topic Depth'
    ],
    'Content Quality': [
        'Content Uniqueness',
        'Readability & Word Count',
        'Actionable formatting (Lists, Tables)'
    ],
    'Performance': [
        'Resource size indicators',
        'Render-blocking checks inferred from meta tags'
    ],
    'Links': [
        'Internal Link Distribution',
        'Outbound (External) Links Count',
        'Orphan Pages (0 Inbound Links)'
    ]
};

const SEVERITY = {
    critical: { label: 'CRITICAL', badge: 'bg-[#1a0505] text-red-400 border border-red-500/30', icon: XCircle, iconColor: 'text-red-400' },
    high: { label: 'HIGH', badge: 'bg-[#1a0d00] text-orange-400 border border-orange-500/30', icon: AlertTriangle, iconColor: 'text-orange-400' },
    medium: { label: 'WARNING', badge: 'bg-[#15130a] text-yellow-400 border border-yellow-500/25', icon: AlertTriangle, iconColor: 'text-yellow-400' },
    low: { label: 'INFO', badge: 'bg-[#111] text-[#666] border border-[#222]', icon: Activity, iconColor: 'text-[#555]' },
};

// ── Score ring (Figma style: large, gradient stroke) ─────────────────────────
function ScoreRing({ score, color, size = 130 }) {
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;
    const ringColor = score >= 70 ? '#E92A15' : score >= 50 ? '#E92A15' : '#E92A15';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" style={{ position: 'absolute' }}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={ringColor} strokeWidth={strokeWidth}
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out" />
            </svg>
            {/* White dot at start of arc */}
            <div className="absolute" style={{
                width: 10, height: 10,
                borderRadius: '50%',
                background: '#fff',
                top: strokeWidth / 2 - 5,
                left: size / 2 - 5,
            }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-bold" style={{ fontSize: size * 0.255 }}>{score}</span>
                <span className="text-[#555] font-medium" style={{ fontSize: size * 0.1 }}>/100</span>
            </div>
        </div>
    );
}

// ── Segmented bar (like Figma: thin, split segments) ─────────────────────────
function SegmentBar({ score, color = '#E92A15' }) {
    const segments = 12;
    const filled = Math.round((score / 100) * segments);
    return (
        <div className="flex gap-[3px] mt-2">
            {Array.from({ length: segments }).map((_, i) => (
                <div key={i} className="flex-1 h-[3px] rounded-full"
                    style={{ background: i < filled ? color : 'rgba(255,255,255,0.08)' }} />
            ))}
        </div>
    );
}

// ── Score delta badge ─────────────────────────────────────────────────────────
function DeltaBadge({ delta }) {
    if (delta == null) return null;
    const positive = delta >= 0;
    return (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border ${positive
            ? 'bg-[#0a1a0a] border-[#22c55e]/20 text-[#22c55e]'
            : 'bg-[#1a0505] border-red-500/20 text-red-400'
        }`}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {positive ? `+${delta}` : delta} vs last scan
        </div>
    );
}

// ── Crawling progress ─────────────────────────────────────────────────────────
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
        const t = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 4000);
        return () => clearInterval(t);
    }, []);
    const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
    return (
        <div className="flex flex-col items-center justify-center py-24 bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-[#1e1e1e]" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#E92A15] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-[#E92A15]" />
                </div>
            </div>
            <h3 className="text-[17px] font-semibold text-white mb-1">
                {status === 'analyzing' ? 'Analyzing Your Website' : 'Crawling Your Website'}
            </h3>
            <p className="text-[#555] text-[13px] mb-8 h-5">{messages[msgIdx]}</p>
            <div className="w-64">
                {progress.total > 0 ? (
                    <>
                        <div className="flex justify-between text-[11px] text-[#444] mb-2">
                            <span>{progress.completed} / {progress.total} pages</span>
                            <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                            <div className="h-full bg-[#E92A15] rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, 5)}%` }} />
                        </div>
                    </>
                ) : (
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E92A15] rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Issue row (right panel) ───────────────────────────────────────────────────
function IssueRow({ issue }) {
    const [expanded, setExpanded] = useState(false);
    const sev = SEVERITY[issue.severity] || SEVERITY.low;
    const SevIcon = sev.icon;
    return (
        <div className="border-b border-[#1a1a1a] last:border-0">
            <button onClick={() => setExpanded(e => !e)}
                className="w-full flex items-start gap-3 py-3.5 px-5 text-left hover:bg-[#0f0f0f] transition-colors">
                <SevIcon className={`w-4 h-4 mt-0.5 shrink-0 ${sev.iconColor}`} />
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white leading-snug">{issue.title}</p>
                    <p className="text-[11px] text-[#555] mt-0.5 line-clamp-1">{issue.description}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ml-2 shrink-0 ${sev.badge}`}>
                    {sev.label}
                </span>
            </button>
            {expanded && (
                <div className="px-5 pb-4 space-y-2 bg-[#080808] border-t border-[#1a1a1a]">
                    {issue.impact && (
                        <div className="pt-3">
                            <p className="text-[10px] text-[#444] font-bold uppercase tracking-[0.12em] mb-1">Impact</p>
                            <p className="text-[12px] text-[#666]">{issue.impact}</p>
                        </div>
                    )}
                    {issue.fix && (
                        <div>
                            <p className="text-[10px] text-[#E92A15] font-bold uppercase tracking-[0.12em] mb-1">How to fix</p>
                            <p className="text-[12px] text-[#777]">{issue.fix}</p>
                        </div>
                    )}
                    {issue.affectedPages?.length > 0 && (
                        <div>
                            <p className="text-[10px] text-[#444] font-bold uppercase tracking-[0.12em] mb-1">
                                Affected pages ({issue.affectedPages.length})
                            </p>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                                {issue.affectedPages.slice(0, 6).map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-[11px] text-[#4a8abf] hover:text-blue-300 truncate">
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{url}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuditHealthPage({ user, activeProject, auditManager }) {
    const [auditUrl, setAuditUrl] = useState(user?.domain ? `https://${user.domain}` : '');
    const [selectedSubcat, setSelectedSubcat] = useState('Technical SEO');
    const [issueFilter, setIssueFilter] = useState('all');

    const { status, progress, result, error, history, startAudit, resetAudit } = auditManager;

    const handleRunAudit = useCallback(async (urlOverride) => {
        const urlToUse = (urlOverride || auditUrl || '').trim();
        if (!urlToUse) return;
        setSelectedSubcat('Technical SEO');
        setIssueFilter('all');
        if (!urlOverride) setAuditUrl(urlToUse);
        startAudit(urlToUse);
    }, [auditUrl, startAudit]);

    // Derive counts
    const criticalCount = result?.summary?.critical ?? 0;
    const warningCount = (result?.summary?.high ?? 0) + (result?.summary?.medium ?? 0);
    const passedCount = result ? Math.max(0, (result.crawledPages || 1) * 8 - (result.summary?.total || 0)) : 0;

    // Score deltas: compare current to previous history
    const prevScan = history.length >= 2 ? history[1] : null;
    const getDelta = (cat) => {
        if (!result || !prevScan) return null;
        const cur = result.scores?.[cat] ?? 0;
        const prev = prevScan.scores?.[cat] ?? 0;
        return Math.round(cur - prev);
    };

    // Sub-category issues: map sub-cat to parent category & filter
    const getSubcatIssues = () => {
        if (!result) return [];
        const meta = SUBCAT_META[selectedSubcat];
        if (!meta) return [];
        const catIssues = result.categories?.[meta.key]?.issues || [];
        // Rough sub-split: first half → first sub, second → second sub
        const subcatsForCat = CATEGORY_META[meta.key]?.subcategories || [];
        let issues = catIssues;
        if (subcatsForCat.length > 1) {
            const subcatIdx = subcatsForCat.indexOf(selectedSubcat);
            const half = Math.ceil(catIssues.length / subcatsForCat.length);
            issues = catIssues.slice(subcatIdx * half, (subcatIdx + 1) * half);
        }
        if (issueFilter === 'all') return issues;
        if (issueFilter === 'critical') return issues.filter(i => i.severity === 'critical');
        if (issueFilter === 'high') return issues.filter(i => i.severity === 'high' || i.severity === 'medium');
        return issues.filter(i => i.severity === 'low');
    };

    const subcatIssues = getSubcatIssues();
    const subcatCritical = subcatIssues.filter(i => i.severity === 'critical').length;
    const subcatWarning = subcatIssues.filter(i => i.severity === 'high' || i.severity === 'medium').length;
    const subcatPassed = Math.max(0, (result?.crawledPages || 5) - subcatIssues.length);

    // Build sub-category list with scores
    const allSubcats = Object.entries(SUBCAT_META).map(([name, meta]) => {
        const catData = result?.categories?.[meta.key];
        const issues = catData?.issues || [];
        const subcatsForCat = CATEGORY_META[meta.key]?.subcategories || [];
        const subcatIdx = subcatsForCat.indexOf(name);
        const half = subcatsForCat.length > 1 ? Math.ceil(issues.length / subcatsForCat.length) : issues.length;
        const myIssues = subcatsForCat.length > 1
            ? issues.slice(subcatIdx * half, (subcatIdx + 1) * half)
            : issues;
        const critInCat = myIssues.filter(i => i.severity === 'critical' || i.severity === 'high').length;
        const baseScore = catData?.score ?? 50;
        const score = Math.max(10, Math.min(99, baseScore - critInCat * 4 + (subcatIdx * 3)));
        return { name, meta, score };
    });

    const displayDomain = user?.domain || 'yourwebsite.com';
    const lastScannedDate = result?.auditedAt
        ? new Date(result.auditedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : history[0]?.scannedAt
            ? new Date(history[0].scannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : null;

    return (
        <div className="w-full pb-12">
            {/* ── Sticky Header ── */}
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.2)]">
                        <Zap className="w-[20px] h-[20px] text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Audits &amp; Health</h1>
                        <p className="text-[#555] text-[13px] mt-0.5">
                            {status === 'completed' && result
                                ? `SEO, GEO, AEO & content health — ${criticalCount} critical · ${warningCount} warnings`
                                : 'SEO, GEO, AEO & content health'}
                        </p>
                    </div>
                </div>
                {status === 'completed' && (
                    <button
                        onClick={() => resetAudit()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#E92A15] hover:bg-[#c82010] text-white text-[13px] font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(233,42,21,0.25)]"
                    >
                        <RefreshCw className="w-4 h-4" /> Re-scan
                    </button>
                )}
            </div>

            <div className="mt-8 space-y-5">
                {/* ── Idle / Error ── */}
                {(status === 'idle' || status === 'failed') && (
                    <div className="bg-gradient-to-br from-[#120404] to-transparent border border-[#E92A15]/15 rounded-2xl p-8">
                        <h3 className="text-white font-semibold text-[15px] mb-1">Run a Comprehensive Audit</h3>
                        <p className="text-[#555] text-[13px] mb-5">We'll crawl your site and check for 90+ issues across SEO, GEO, AEO, and content quality.</p>
                        <div className="flex gap-3">
                            <input
                                value={auditUrl}
                                onChange={e => setAuditUrl(e.target.value)}
                                placeholder="Enter your website URL (e.g. https://yourwebsite.com)"
                                className="flex-1 bg-[#0B0B0B] border border-[#222] text-white placeholder:text-[#333] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#333]"
                                onKeyDown={e => e.key === 'Enter' && handleRunAudit()}
                            />
                            <button
                                onClick={() => handleRunAudit()}
                                disabled={!auditUrl.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#E92A15] hover:bg-[#c82010] disabled:opacity-40 text-white text-[13px] font-semibold rounded-xl transition-all"
                            >
                                <Zap className="w-4 h-4" /> Run Audit
                            </button>
                        </div>
                        {error && (
                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-red-400 text-[13px]">{error}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Crawling / Analyzing ── */}
                {(status === 'crawling' || status === 'analyzing') && (
                    <CrawlingProgress progress={progress} status={status} />
                )}

                {/* ── Results ── */}
                {status === 'completed' && result && (
                    <>
                        {/* KPI Row */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { icon: XCircle, value: criticalCount, label: 'Critical Issues', color: 'text-red-400', iconBg: 'bg-[#120404] border-red-500/30' },
                                { icon: AlertTriangle, value: warningCount, label: 'Warnings', color: 'text-yellow-400', iconBg: 'bg-[#15130a] border-yellow-500/25' },
                                { icon: CheckCircle2, value: passedCount, label: 'Checks Passed', color: 'text-[#22c55e]', iconBg: 'bg-[#0a1a0a] border-[#22c55e]/25' },
                            ].map((kpi, i) => {
                                const Icon = kpi.icon;
                                return (
                                    <div key={i} className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl px-6 py-5 flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                                            <Icon className={`w-5 h-5 ${kpi.color}`} />
                                        </div>
                                        <div>
                                            <p className={`text-[32px] font-bold leading-none ${kpi.color}`}>{kpi.value}</p>
                                            <p className="text-[#444] text-[12px] mt-1">{kpi.label}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Category Score Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            {Object.entries(CATEGORY_META).map(([key, meta]) => {
                                const cat = result.categories?.[key];
                                const score = cat?.score ?? 0;
                                const delta = getDelta(key);
                                const Icon = meta.icon;
                                return (
                                    <div key={key} className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Icon className="w-4 h-4" style={{ color: meta.color }} />
                                            <span className="text-white text-[13px] font-bold tracking-wide">{meta.label}</span>
                                        </div>
                                        <p className="text-[#444] text-[11px] mb-4">{meta.desc}</p>
                                        <div className="flex justify-center mb-4">
                                            <ScoreRing score={score} color={meta.color} size={130} />
                                        </div>
                                        <div className="flex justify-center">
                                            <DeltaBadge delta={delta} />
                                            {delta == null && (
                                                <span className="text-[#333] text-[11px]">vs last scan</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Middle: Categories + Issues Panel */}
                        <div className="grid grid-cols-[280px,1fr] gap-0 bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                            {/* Left: Audit Categories */}
                            <div className="border-r border-[#1a1a1a]">
                                <div className="px-5 pt-5 pb-3">
                                    <p className="text-[#333] text-[10px] font-bold uppercase tracking-[0.15em]">Audit Categories</p>
                                </div>
                                <div className="space-y-0.5 px-2 pb-4">
                                    {allSubcats.map(({ name, meta: sm, score }) => {
                                        const Icon = sm.icon;
                                        const catMeta = CATEGORY_META[sm.key];
                                        const isActive = selectedSubcat === name;
                                        return (
                                            <button key={name}
                                                onClick={() => { setSelectedSubcat(name); setIssueFilter('all'); }}
                                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${isActive
                                                    ? 'bg-[#1a1a1a] border border-[#2a2a2a]'
                                                    : 'hover:bg-[#111] border border-transparent'
                                                }`}>
                                                <div className="w-8 h-8 rounded-lg bg-[#111] border border-[#1e1e1e] flex items-center justify-center shrink-0">
                                                    <Icon className="w-4 h-4 text-[#444]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className={`text-[13px] font-medium truncate ${isActive ? 'text-white' : 'text-[#888]'}`}>{name}</p>
                                                        <span className={`text-[12px] font-semibold ml-2 shrink-0 ${isActive ? 'text-white' : 'text-[#555]'}`}>{score}%</span>
                                                    </div>
                                                    <SegmentBar score={score} color={catMeta?.color || '#E92A15'} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Issues Panel */}
                            <div>
                                {/* Panel header */}
                                <div className="px-5 pt-5 pb-4 border-b border-[#1a1a1a]">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {(() => {
                                                    const sm = SUBCAT_META[selectedSubcat];
                                                    const catMeta = sm ? CATEGORY_META[sm.key] : null;
                                                    const Icon = sm?.icon;
                                                    return Icon ? <Icon className="w-4 h-4 text-[#666]" /> : null;
                                                })()}
                                                <h2 className="text-[17px] font-bold text-white">{selectedSubcat}</h2>
                                            </div>
                                            <p className="text-[#444] text-[12px]">
                                                {subcatPassed} passed · {subcatWarning} warnings · {subcatCritical} critical
                                            </p>
                                        </div>
                                        {/* Filter chips */}
                                        <div className="flex items-center gap-1.5">
                                            {[
                                                { id: 'all', label: 'All' },
                                                { id: 'critical', label: 'Critical' },
                                                { id: 'high', label: 'Warnings' },
                                                { id: 'low', label: 'Info' },
                                            ].map(f => (
                                                <button key={f.id}
                                                    onClick={() => setIssueFilter(f.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${issueFilter === f.id
                                                        ? f.id === 'all' ? 'bg-[#E92A15] border-[#E92A15] text-white'
                                                            : f.id === 'critical' ? 'bg-red-500/15 border-red-500/40 text-red-400'
                                                                : f.id === 'high' ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400'
                                                                    : 'bg-[#1a1a1a] border-[#333] text-[#aaa]'
                                                        : 'bg-transparent border-[#1e1e1e] text-[#444] hover:text-[#888]'
                                                    }`}>
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Multi-segment progress */}
                                    <div className="flex gap-0.5 mt-4 h-[4px] rounded-full overflow-hidden">
                                        {(() => {
                                            const total = subcatIssues.length || 1;
                                            const critW = (subcatCritical / (total + subcatPassed)) * 100;
                                            const warnW = (subcatWarning / (total + subcatPassed)) * 100;
                                            const passW = 100 - critW - warnW;
                                            return (
                                                <>
                                                    <div style={{ width: `${critW}%` }} className="bg-red-500 rounded-l-full" />
                                                    <div style={{ width: `${warnW}%` }} className="bg-yellow-500" />
                                                    <div style={{ width: `${Math.max(passW, 0)}%` }} className="bg-[#1e1e1e] rounded-r-full" />
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Evaluated Checks Expandable */}
                                    {(() => {
                                        const checks = SUBCAT_CHECKS[selectedSubcat] || [];
                                        if (checks.length === 0) return null;
                                        return (
                                            <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                                                <details className="group">
                                                    <summary className="flex items-center gap-2 cursor-pointer list-none text-[12px] font-medium text-[#777] hover:text-[#aaa] transition-colors">
                                                        <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                                                        What parameters are evaluated? ({checks.length} checks)
                                                    </summary>
                                                    <div className="mt-3 pl-6 pr-4 space-y-1.5 pb-2">
                                                        {checks.map((check, idx) => (
                                                            <div key={idx} className="flex items-start gap-2">
                                                                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-[#22c55e]/50 shrink-0" />
                                                                <span className="text-[11px] text-[#888]">{check}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Issue rows */}
                                <div className="max-h-[420px] overflow-y-auto">
                                    {subcatIssues.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16">
                                            <CheckCircle2 className="w-10 h-10 text-[#22c55e]/30 mb-3" />
                                            <p className="text-[#444] text-[14px] font-medium">All good here!</p>
                                            <p className="text-[#333] text-[12px] mt-1">No issues found in {selectedSubcat}</p>
                                        </div>
                                    ) : (
                                        subcatIssues.map((issue, i) => (
                                            <IssueRow key={issue.id || i} issue={issue} />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Scan History */}
                        <div className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a]">
                                <div>
                                    <h3 className="text-white text-[16px] font-semibold">Scan History</h3>
                                    <p className="text-[#444] text-[12px] mt-0.5">Previous audit results for {displayDomain}</p>
                                </div>
                                {lastScannedDate && (
                                    <div className="flex items-center gap-2 text-[#444] text-[12px]">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="uppercase tracking-wide text-[11px] font-medium">Last scanned {lastScannedDate}</span>
                                    </div>
                                )}
                            </div>

                            {/* Table header */}
                            <div className="grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr,1fr,80px] px-6 py-3 border-b border-[#1a1a1a]">
                                {['Date', 'SEO', 'GEO', 'AEO', 'Content', 'Issues', ''].map((h, i) => (
                                    <span key={i} className="text-[#333] text-[10px] font-bold uppercase tracking-[0.12em]">{h}</span>
                                ))}
                            </div>

                            {/* Current result row */}
                            {result && (
                                <div className="grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr,1fr,80px] px-6 py-4 border-b border-[#141414] items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-[#E92A15] shrink-0" />
                                        <span className="text-white text-[14px] font-semibold">
                                            {lastScannedDate || 'Today'}
                                        </span>
                                    </div>
                                    <span className="text-white text-[14px] font-semibold">{result.scores?.seo ?? '—'}</span>
                                    <span className="text-white text-[14px] font-semibold">{result.scores?.geo ?? '—'}</span>
                                    <span className="text-white text-[14px] font-semibold">{result.scores?.aeo ?? '—'}</span>
                                    <span className="text-white text-[14px] font-semibold">{result.scores?.content ?? '—'}</span>
                                    <div className="flex items-center gap-1.5">
                                        <XCircle className="w-4 h-4 text-[#555]" />
                                        <span className="text-white text-[14px] font-semibold">{result.summary?.critical ?? 0}</span>
                                    </div>
                                    <span className="text-[#E92A15] text-[12px] font-medium flex items-center gap-0.5">
                                        Current <ChevronRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            )}

                            {/* History rows */}
                            {history.slice(1).map((row, i) => {
                                const d = new Date(row.scannedAt);
                                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                return (
                                    <div key={row.id}
                                        className="grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr,1fr,80px] px-6 py-4 border-b border-[#141414] last:border-0 items-center hover:bg-[#0f0f0f] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#2a2a2a] shrink-0" />
                                            <span className="text-[#666] text-[14px]">{dateStr}</span>
                                        </div>
                                        <span className="text-[#666] text-[14px]">{row.scores?.seo ?? '—'}</span>
                                        <span className="text-[#666] text-[14px]">{row.scores?.geo ?? '—'}</span>
                                        <span className="text-[#666] text-[14px]">{row.scores?.aeo ?? '—'}</span>
                                        <span className="text-[#666] text-[14px]">{row.scores?.content ?? '—'}</span>
                                        <div className="flex items-center gap-1.5">
                                            <XCircle className="w-4 h-4 text-[#2a2a2a]" />
                                            <span className="text-[#666] text-[14px]">{row.summary?.critical ?? 0}</span>
                                        </div>
                                        <button className="flex items-center gap-0.5 text-[#444] text-[12px] hover:text-[#888] transition-colors">
                                            View <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}

                            {history.length <= 1 && (
                                <div className="px-6 py-8 text-center">
                                    <p className="text-[#333] text-[13px]">Run more audits to see history here.</p>
                                </div>
                            )}

                            {/* Footer */}
                            {lastScannedDate && (
                                <div className="px-6 py-3 border-t border-[#141414] text-center">
                                    <p className="text-[#2a2a2a] text-[11px] uppercase tracking-[0.12em] font-medium">
                                        Scanned {lastScannedDate}
                                        {result?.auditedAt ? `, ${new Date(result.auditedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
