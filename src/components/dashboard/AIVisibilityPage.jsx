import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/api/apiClient';
import {
    Activity, TrendingUp, TrendingDown, Target, Zap, Loader2,
    Users, BookOpen, Star, AlertCircle, BarChart3, Lightbulb, CheckCircle, Globe, RefreshCw,
    Plug, Send, Download, Cpu, BarChart2, Layers, HelpCircle,
} from 'lucide-react';
import { ChatGPTLogo, GeminiLogo } from '../landing/AILogos';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell,
    AreaChart, Area,
    BarChart, Bar, LineChart, Line, Legend,
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildVisibilityTrendDaily, buildVisibilityTrendWeekly } from '@/lib/visibilityTrend';
import { classifyDomainContentType, classifyCitationRow } from '@/lib/urlContentType';

const PI = { perplexity: '🔮', gemini: '✨', googleAI: '🤖', chatgpt: '🤖', claude: '✹' };
const EL = { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'ChatGPT', chatgpt: 'ChatGPT', claude: 'Claude' };

const SOV_BAR_COLORS = [
    '#ef4444', '#b91c1c', '#3b82f6', '#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ec4899',
    '#8b5cf6', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

/** Map API anomalies (raw [-1,1] or mistaken negative scale) to a 0–100 index for display. */
function sentimentIndex0to100(v) {
    if (v == null || typeof v !== 'number' || Number.isNaN(v)) return null;
    if (v >= 0 && v <= 100) return Math.round(Math.min(100, Math.max(0, v)));
    if (v >= -1 && v <= 1) return Math.round(Math.min(100, Math.max(0, ((v + 1) / 2) * 100)));
    if (v < 0 && v >= -100) return Math.round(Math.min(100, Math.max(0, (v + 100) / 2)));
    return Math.round(Math.min(100, Math.max(0, v)));
}

function componentScore0to100(v) {
    if (v == null || typeof v !== 'number' || Number.isNaN(v)) return 0;
    if (v >= 0 && v <= 100) return Math.round(Math.min(100, Math.max(0, v)));
    if (v >= -1 && v <= 1) return Math.round(Math.min(100, Math.max(0, ((v + 1) / 2) * 100)));
    if (v < 0 && v >= -100) return Math.round(Math.min(100, Math.max(0, (v + 100) / 2)));
    return Math.round(Math.min(100, Math.max(0, v)));
}

function HelpHint({ text }) {
    return (
        <UiTooltip>
            <TooltipTrigger asChild>
                <button type="button" className="inline-flex text-[#555] hover:text-[#888] ml-0.5 align-middle" aria-label="Help">
                    <HelpCircle className="w-3.5 h-3.5" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-[11px] leading-snug bg-[#1a1a1a] border border-[#333] text-[#e5e5e5]">
                {text}
            </TooltipContent>
        </UiTooltip>
    );
}

function SemiCircleGauge({ score, icon, label, size = 160 }) {
    const swBg = 20;
    const sw = 14;
    const r = (size - swBg) / 2;
    const circ = Math.PI * r;
    const p = Math.min(score, 100) / 100;
    const off = circ - p * circ;
    const angle = Math.PI - p * Math.PI;
    const cx = size / 2;
    const cy = r + swBg / 2;
    const dotX = cx + r * Math.cos(angle);
    const dotY = cy - r * Math.sin(angle);

    return (
        <div className="flex flex-col items-center justify-center relative w-full mx-auto" style={{ maxWidth: size }}>
            <svg viewBox={`0 0 ${size} ${cy + 4}`} className="w-full h-auto overflow-visible" style={{ marginBottom: -6 }}>
                {/* Background track - dark gray */}
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="#2a2a2a" strokeWidth={swBg} fill="none" strokeLinecap="round" />
                {/* Foreground red arc with glow */}
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="#ef4444" strokeWidth={sw} fill="none" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-1000" style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.6))' }} />
                {/* White thumb dot */}
                <circle cx={dotX} cy={dotY} r={4.5} fill="#ffffff" className="transition-all duration-1000" />
            </svg>
            {/* Score number overlaid */}
            <div className="absolute left-0 w-full flex flex-col items-center justify-center pointer-events-none" style={{ top: '22%' }}>
                <span className="text-[28px] font-bold text-white leading-none tabular-nums">{(Math.min(score, 100) / 10).toFixed(1)}</span>
            </div>
            {/* Bottom pill label */}
            <div className="w-full h-[36px] bg-[#1a1a1a] border border-[#2e2e2e] rounded-full flex items-center pl-1 pr-4 mt-0 relative z-10">
                <div className="w-7 h-7 rounded-full bg-[#252525] border border-[#3a3a3a] flex items-center justify-center shrink-0 overflow-hidden">
                    {icon}
                </div>
                <div className="flex-1 flex justify-center">
                    <span className="text-white/90 font-semibold text-[12px] tracking-wide">{label}</span>
                </div>
            </div>
        </div>
    );
}

function ScoreRing({ score, size = 130, sw = 14 }) {
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;
    const p = Math.min(score, 100) / 100;
    const off = circ - p * circ;
    const angle = p * 2 * Math.PI - Math.PI / 2;
    const dotX = size / 2 + r * Math.cos(angle);
    const dotY = size / 2 + r * Math.sin(angle);

    return (
        <div className="relative flex flex-col items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="absolute inset-0">
                {/* Background ring */}
                <circle cx={size / 2} cy={size / 2} r={r} stroke="#2a2a2a" strokeWidth={sw} fill="none" />
                {/* Red progress ring */}
                <circle cx={size / 2} cy={size / 2} r={r} stroke="#ef4444" strokeWidth={sw} fill="none"
                    strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-1000 origin-center -rotate-90"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' }} />
                {/* White thumb dot */}
                <circle cx={dotX} cy={dotY} r={5} fill="#ffffff" className="transition-all duration-1000" />
            </svg>
            <div className="relative flex flex-col items-center justify-center text-center">
                <span className="text-[36px] font-bold text-white tracking-tight leading-none tabular-nums">{(Math.min(score, 100) / 10).toFixed(1)}</span>
                <span className="text-[9px] text-white/50 font-bold tracking-[0.15em] mt-1 uppercase">Overall index</span>
            </div>
        </div>
    );
}

/** Rotating “what the backend is doing” lines — cycles so users see a real process, not a frozen spinner */
const LIVE_STATUS_BY_PHASE = {
    initializing: [
        { icon: Plug, text: 'Connecting your project to our analysis pipeline…' },
        { icon: Zap, text: 'Warming up secure channels to AI search providers…' },
    ],
    generating_prompts: [
        { icon: Cpu, text: 'Loading brand context & building your prompt matrix…' },
        { icon: Target, text: 'Generating intelligence prompts tailored to your industry…' },
    ],
    agents_running: [
        { icon: Send, text: 'Dispatching agents to ChatGPT, Gemini & Perplexity…' },
        { icon: Layers, text: 'Aligning prompt matrix across all three platforms…' },
    ],
    querying: [
        { icon: Download, text: 'Sending prompts and collecting live AI responses…' },
        { icon: BookOpen, text: 'Extracting answers, source links & citations from each engine…' },
        { icon: Globe, text: 'Harvesting citations and mention signals in real time…' },
    ],
    early_results: [
        { icon: BarChart2, text: 'Phase 1 complete — displaying early results while we refine…' },
        { icon: Activity, text: 'Running remaining prompts to enhance your visibility data…' },
        { icon: Lightbulb, text: 'Stay a few more minutes — final results will be sharper…' },
    ],
    analyzing: [
        { icon: BarChart2, text: 'Parsing responses — brand mentions, position & sentiment…' },
        { icon: Activity, text: 'Building visibility scores & share-of-voice parameters…' },
        { icon: Lightbulb, text: 'Running deep analysis for strategic AI Insights…' },
    ],
    default: [
        { icon: Loader2, text: 'Processing your AI visibility scan…' },
    ],
};

function ScanProgressWidget({ phase, phaseDetail, progress, scanId }) {
    const [rotateIdx, setRotateIdx] = useState(0);

    const pool = LIVE_STATUS_BY_PHASE[phase] || LIVE_STATUS_BY_PHASE.default;
    useEffect(() => { setRotateIdx(0); }, [phase, scanId]);
    useEffect(() => {
        const t = setInterval(() => setRotateIdx(i => (i + 1) % pool.length), 2800);
        return () => clearInterval(t);
    }, [phase, pool.length, scanId]);

    const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

    const steps = [
        { id: 'initializing', label: 'Connect & prepare', sub: 'Secure session and your brand context' },
        { id: 'agents_running', label: 'Launch agents', sub: 'ChatGPT, Gemini & Perplexity' },
        { id: 'querying', label: 'Collect responses', sub: 'Answers, sources & citations' },
        { id: 'analyzing', label: 'Analyze & score', sub: 'Visibility, SOV, sentiment' },
    ];

    const phaseOrder = ['initializing', 'agents_running', 'querying', 'analyzing'];
    const rawPhase = phase === 'done' ? 'analyzing' : (phase || 'initializing');
    let activeIdx = phaseOrder.indexOf(rawPhase);
    if (activeIdx < 0) activeIdx = 0;

    const getStepState = (_stepId, index) => {
        if (phase === 'done') return 'completed';
        if (index < activeIdx) return 'completed';
        if (index === activeIdx) return 'active';
        return 'pending';
    };

    const live = pool[rotateIdx % pool.length];
    const LiveIcon = live.icon;

    return (
        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl overflow-hidden p-6 sm:p-8 shadow-[0_0_40px_rgba(233,42,21,0.05)]">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6 pb-6 border-b border-[#1a1a1a]">
                <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#120404] border border-[#E92A15]/30 flex items-center justify-center relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-[#E92A15]/10 animate-pulse" />
                        <Loader2 className="w-6 h-6 text-[#E92A15] animate-spin relative z-10" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-white text-[18px] font-semibold tracking-tight">AI Visibility scan running</h3>
                        <p className="text-[#888] text-[13px] mt-1 break-words">{phaseDetail || 'Starting backend pipeline…'}</p>
                        <div
                            key={`${phase}-${rotateIdx}`}
                            className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2.5 transition-opacity duration-300"
                        >
                            <LiveIcon className={`w-4 h-4 text-[#E92A15] shrink-0 mt-0.5 ${live.icon === Loader2 ? 'animate-spin' : ''}`} />
                            <p className="text-[#ccc] text-[12px] leading-snug">{live.text}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-[#111] border border-[#222] rounded-xl px-5 py-3 shrink-0">
                    <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider">Progress</span>
                    <span className="text-[#E92A15] font-mono text-[22px] font-bold tabular-nums">{pct}%</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {steps.map((step, i) => {
                    const state = getStepState(step.id, i);
                    return (
                        <div key={step.id} className="relative rounded-xl border border-[#1e1e1e] bg-[#080808] p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[10px] ${
                                    state === 'completed' ? 'border-[#22c55e] text-[#22c55e]' :
                                    state === 'active' ? 'border-[#E92A15] text-[#E92A15]' :
                                    'border-[#333] text-[#444]'
                                }`}>
                                    {state === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                                     state === 'active' ? <div className="w-1.5 h-1.5 rounded-full bg-[#E92A15] animate-pulse" /> :
                                     <span className="opacity-40">{i + 1}</span>}
                                </div>
                                <p className={`text-[11px] font-semibold leading-tight ${
                                    state === 'completed' ? 'text-[#aaa]' : state === 'active' ? 'text-white' : 'text-[#555]'
                                }`}>
                                    {step.label}
                                </p>
                            </div>
                            <p className="text-[10px] text-[#555] leading-snug pl-7">{step.sub}</p>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-3">
                <span className="text-[#E92A15] font-mono text-[12px] font-bold w-10 text-right">{pct}%</span>
                <div className="flex-1 h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#E92A15] to-[#ff6b52] rounded-full transition-all duration-700 relative"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                    >
                        <div className="absolute inset-0 bg-white/15 animate-[pulse_1.2s_ease-in-out_infinite]" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AIVisibilityPage({ user, scanManager }) {
    const {
        scanId, scanStatus: status, scanResult: result, scanPhase: phase,
        scanPhaseDetail: phaseDetail, scanProgress: progress,
        scanError: error, loadingFromBackend, startScan,
    } = scanManager;

    const [tab, setTab] = useState('overview');
    const [scanHistory, setScanHistory] = useState([]);
    const [timeRangeDays, setTimeRangeDays] = useState(90);
    const [trendGranularity, setTrendGranularity] = useState('daily');
    const [urlPageSize, setUrlPageSize] = useState(10);
    const [urlPage, setUrlPage] = useState(0);
    const [sourcesBrandOnly, setSourcesBrandOnly] = useState(false);

    const brandName = user?.brandName || 'Your Brand';
    const domain = user?.domain || '';

    useEffect(() => {
        if (!domain) return;
        const days = timeRangeDays > 0 ? timeRangeDays : 365;
        apiClient.visibility
            .getScanHistory(user?.projectId, domain, { days, limit: 120 })
            .then((res) => {
                if (res?.history) setScanHistory(res.history);
            })
            .catch(() => {});
    }, [domain, user?.projectId, result, timeRangeDays]);

    const trendHistory =
        scanHistory?.length > 0
            ? scanHistory
            : result?.scannedAt
              ? [{ date: result.scannedAt, score: result.score?.overall ?? 0 }]
              : [];

    const trendOpts = { extendToToday: true, filterDays: timeRangeDays > 0 ? timeRangeDays : 0 };
    const trendData =
        trendGranularity === 'weekly'
            ? buildVisibilityTrendWeekly(trendHistory, trendOpts)
            : buildVisibilityTrendDaily(trendHistory, trendOpts);

    useEffect(() => {
        setUrlPage(0);
    }, [result?.scannedAt, urlPageSize, domain]);

    // AUTO-START: Trigger scan only when backend check is done and no result exists
    useEffect(() => {
        if (loadingFromBackend) return;
        if (status === 'idle' && !result && domain && user?.brandName && user?.industry) {
            console.log('[AIVisibility] Auto-starting scan for', domain);
            startScan();
        }
    }, [loadingFromBackend, status, result, domain, user?.brandName, user?.industry, startScan]);

    const r = result;
    const sovData = r
        ? [
              {
                  name: r.shareOfVoice?.brand?.name || brandName,
                  sov: r.shareOfVoice?.brand?.sov || 0,
                  fill: SOV_BAR_COLORS[0],
              },
              ...(r.shareOfVoice?.competitors || []).map((c, i) => ({
                  name: c.name,
                  sov: c.sov,
                  fill: SOV_BAR_COLORS[(i + 1) % SOV_BAR_COLORS.length],
              })),
          ]
        : [];

    const radarData = r
        ? [
              { m: 'Visibility', v: componentScore0to100(r.score?.components?.visibility) },
              { m: 'Share of Voice', v: componentScore0to100(r.score?.components?.shareOfVoice) },
              { m: 'Position', v: componentScore0to100(r.score?.components?.position) },
              {
                  m: 'Sentiment',
                  v: sentimentIndex0to100(r.score?.components?.sentiment) ?? 0,
              },
          ]
        : [];

    const mentionTrendSeries = useMemo(() => {
        const hist = Array.isArray(scanHistory) ? scanHistory : [];
        if (hist.length < 1) return { data: [], keys: [] };
        const nameTotals = {};
        for (const h of hist) {
            for (const row of h.mentionLeaders || []) {
                if (!row?.name) continue;
                nameTotals[row.name] = (nameTotals[row.name] || 0) + (Number(row.mentions) || 0);
            }
        }
        const topNames = Object.entries(nameTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([n]) => n);
        if (topNames.length === 0) return { data: [], keys: [] };
        const data = hist.map((h) => {
            const d = h.date ? new Date(h.date) : null;
            const label = d
                ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—';
            const pt = { date: label };
            const map = Object.fromEntries((h.mentionLeaders || []).map((x) => [x.name, Number(x.mentions) || 0]));
            for (const n of topNames) pt[n] = map[n] ?? 0;
            return pt;
        });
        return { data, keys: topNames };
    }, [scanHistory]);

    const catData = r ? Object.entries(r.perCategory || {}).map(([cat, d]) => ({
        cat: cat.length > 18 ? cat.substring(0, 16) + '…' : cat, score: d.score,
    })) : [];

    const allUrlRanking = useMemo(() => {
        if (!r) return [];
        let allUrls = r.urlRanking?.urls || [];
        if (allUrls.length === 0 && r.prompts?.length) {
            const urlMap = {};
            for (const p of r.prompts) {
                for (const [eng, data] of Object.entries(p.engines || {})) {
                    for (const cit of (data.citations || [])) {
                        if (!cit.url) continue;
                        if (!urlMap[cit.url]) {
                            urlMap[cit.url] = {
                                url: cit.url,
                                domain: cit.domain || '',
                                title: cit.title || '',
                                isTargetBrand: cit.isTargetBrand || false,
                                isCompetitor: cit.isCompetitor || false,
                                category: cit.category || 'other',
                                count: 0,
                                engines: new Set(),
                                promptCount: 0,
                                _prompts: new Set(),
                            };
                        }
                        urlMap[cit.url].count++;
                        urlMap[cit.url].engines.add(eng);
                        if (p.promptId) urlMap[cit.url]._prompts.add(p.promptId);
                    }
                }
            }
            allUrls = Object.values(urlMap)
                .map((u) => ({ ...u, engines: Array.from(u.engines), promptCount: u._prompts.size }))
                .sort((a, b) => b.count - a.count);
        }
        return allUrls;
    }, [r]);

    useEffect(() => {
        const n = allUrlRanking.length;
        const pc = Math.max(1, Math.ceil(n / urlPageSize));
        setUrlPage((p) => Math.min(p, pc - 1));
    }, [allUrlRanking.length, urlPageSize]);

    const tabs = [
        { k: 'overview', l: 'Overview', i: BarChart3 },
        { k: 'entities', l: 'Entities', i: Users },
        { k: 'citations', l: 'Sources', i: BookOpen },
        { k: 'urls', l: 'URLs', i: Globe },
        { k: 'gaps', l: 'Gaps', i: AlertCircle },
        { k: 'intelligence', l: 'AI Insights', i: Lightbulb },
    ];

    return (
        <TooltipProvider delayDuration={200}>
        <div className="w-full pb-10">
            {/* Full-width Header */}
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-[44px] h-[44px] bg-[#120404] rounded-[14px] flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)] shrink-0">
                        <Activity className="w-[20px] h-[20px] text-[#E92A15]" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight mb-0.5">
                            AI Visibility Intelligence
                        </h1>
                        <p className="text-[#888] text-[13px]">
                            Track {brandName || 'your brand'} across Perplexity, Gemini &amp; ChatGPT
                        </p>
                    </div>
                </div>
                <button onClick={startScan} disabled={status === 'scanning' || !domain}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#E92A15] hover:bg-[#D12512] text-white text-[13px] font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(233,42,21,0.35)] disabled:opacity-50 disabled:cursor-not-allowed">
                    <RefreshCw className={`w-4 h-4 ${status === 'scanning' ? 'animate-spin' : ''}`} /> 
                    {status === 'scanning' ? 'Scanning...' : 'Re-scan'}
                </button>
            </div>

            <div className="space-y-8 max-w-7xl mt-8">

            {status === 'scanning' && (
                <>
                <ScanProgressWidget
                    key={scanId || 'scan'}
                    scanId={scanId}
                    phase={phase}
                    phaseDetail={phaseDetail}
                    progress={progress}
                />
                {r && r.isPartial && (
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-amber-200 text-sm font-medium">Early results are ready — stay a few more minutes while we refine</p>
                            <p className="text-amber-200/60 text-xs mt-0.5">Phase 1 complete. The remaining prompts are running in the background to enhance accuracy.</p>
                        </div>
                    </div>
                )}
                </>
            )}

            {status === 'failed' && !r && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm">{error}</p>
                    <Button onClick={startScan} size="sm" className="mt-2 bg-red-600 hover:bg-red-700 text-[var(--text-primary)] rounded-lg text-xs">Retry</Button>
                </div>
            )}

            {status === 'idle' && !r && (
                <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/10 rounded-2xl p-10 text-center">
                    {loadingFromBackend ? (
                        <>
                            <Loader2 className="w-12 h-12 text-purple-400/60 mx-auto mb-3 animate-spin" />
                            <h3 className="text-[var(--text-primary)] font-medium text-lg mb-1">Loading scan data...</h3>
                            <p className="text-[var(--text-muted)] text-sm">Checking for existing results</p>
                        </>
                    ) : (
                        <>
                            <Activity className="w-12 h-12 text-red-500/20 mx-auto mb-3" />
                            <h3 className="text-[var(--text-primary)] font-medium text-lg mb-1">Check Your AI Visibility</h3>
                            <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto mb-1.5">
                                Queries ChatGPT, Gemini &amp; Perplexity with smart prompts and analyzes brand mentions, citations &amp; sentiment in real-time.
                            </p>
                            <p className="text-[var(--text-muted)] text-xs mb-5">~45 API calls (15 per platform) • Results update live as each prompt completes</p>
                            <Button onClick={startScan} disabled={!domain} className="bg-[#ef4444] hover:bg-red-600 text-white rounded-full px-8 shadow-lg shadow-red-500/20 shadow-xl mt-4">
                                <RefreshCw className="w-4 h-4 mr-2" /> Start Scan
                            </Button>
                        </>
                    )}
                </div>
            )}

            {r && (
                <>
                    {/* Top Cards Gauge Container - matches Image 2 exactly */}
                    <div className="border border-[#2a0e0e] rounded-[24px] p-6 lg:p-8 mb-8 flex flex-col xl:flex-row items-center gap-8 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(253, 45, 21, 0.021) 6.17%, rgba(13, 10, 10, 0.315) 93.83%)' }}>
                         
                        {/* Overall Score Ring - sits outside the inner box */}
                        <div className="flex flex-col items-center justify-center shrink-0">
                            <ScoreRing score={r.score?.overall || 0} size={130} sw={14} />
                        </div>

                        {/* Inner rounded container with visible gray border */}
                        {(() => {
                            const pScore = r.platforms?.perplexity?.score?.overall ?? 0;
                            const gScore = r.platforms?.gemini?.score?.overall ?? 0;
                            const cScore = r.platforms?.googleAI?.score?.overall ?? 0;
                            const realScores = [pScore, gScore, cScore].filter(s => s > 0);
                            const claudeAvg = realScores.length > 0 ? Math.round(realScores.reduce((a, b) => a + b, 0) / realScores.length) : 0;
                            return (
                                <div className="flex-1 w-full min-w-0 border border-[#333333] rounded-[20px] px-4 py-6 lg:px-6 lg:py-6 grid grid-cols-2 lg:grid-cols-4 items-start gap-2 lg:gap-4 backdrop-blur-md" style={{ background: '#FFFFFF0A' }}>
                                    <SemiCircleGauge score={cScore} icon={<ChatGPTLogo className="w-[16px] h-[16px] text-white" />} label="ChatGPT" size={160} />
                                    <SemiCircleGauge score={gScore} icon={<GeminiLogo className="w-[16px] h-[16px] text-[#4285f4]" />} label="Gemini" size={160} />
                                    <SemiCircleGauge score={pScore} icon={<img src="/perplexity.png" alt="Perplexity" className="w-[16px] h-[16px] object-contain" style={{ filter: 'brightness(0) invert(1)' }} />} label="Perplexity" size={160} />
                                    <SemiCircleGauge score={claudeAvg} icon={<Layers className="w-[16px] h-[16px] text-white" />} label="Aggregate" size={160} />
                                </div>
                            );
                        })()}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-8 border-b border-[#111] mb-8 px-2 overflow-x-auto">
                        {tabs.map(t => {
                            if (t.k === 'platforms') return null; // Remove platforms
                            const I = t.i;
                            const isActive = tab === t.k;
                            return (
                                <button key={t.k} onClick={() => setTab(t.k)}
                                    className={`flex items-center gap-2 pb-4 text-sm font-black transition-all relative ${isActive ? 'text-white' : 'text-[#333] hover:text-[#555]'
                                        }`}>
                                    <I className={`w-4 h-4 ${isActive ? 'text-[#ff4444]' : 'text-[#222]'}`} />{t.l}
                                    {isActive && <div className="absolute bottom-0 left-0 w-full h-[4px] rounded-t-full bg-[#ff4444]" />}
                                </button>
                            );
                        })}
                    </div>
                    {/* Overview Tab */}
                    {tab === 'overview' && (() => {
                        const sovBrands = [r.shareOfVoice?.brand, ...(r.shareOfVoice?.competitors || [])].filter(Boolean).sort((a, b) => (b?.sov || 0) - (a?.sov || 0));
                        let industryRows = Array.isArray(r.industryRanking) ? [...r.industryRanking] : [];
                        const firstInd = industryRows[0];
                        if (firstInd && firstInd.promptCoverage === undefined && firstInd.sov !== undefined) {
                            industryRows = [];
                        }
                        const allBrands = sovBrands;
                        const totalSov = allBrands.reduce((sum, b) => sum + (b?.sov || 0), 0) || 1;
                        const scanStamp = r.scannedAt || r.scanDate;
                        const scanDate = scanStamp ? new Date(scanStamp).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : '—';
                        const weekChange = r.score?.weekChange;

                        return (
                        <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Card 1: AI Visibility Score */}
                            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 relative">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-1">
                                    <div>
                                        <h3 className="text-white font-semibold text-[15px]">AI Visibility Score</h3>
                                        <p className="text-[#777] text-[12px]">How often your brand appears in AI responses</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <label className="sr-only" htmlFor="ai-vis-time-range">Time range</label>
                                            <select
                                                id="ai-vis-time-range"
                                                value={timeRangeDays}
                                                onChange={(e) => setTimeRangeDays(Number(e.target.value))}
                                                className="bg-[#1a1a1a] border border-[#333] text-[#ccc] text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#E92A15]/50"
                                            >
                                                <option value={7}>Last 7 days</option>
                                                <option value={30}>Last 30 days</option>
                                                <option value={90}>Last 90 days</option>
                                                <option value={0}>All scans</option>
                                            </select>
                                            <label className="sr-only" htmlFor="ai-vis-trend-gran">Trend step</label>
                                            <select
                                                id="ai-vis-trend-gran"
                                                value={trendGranularity}
                                                onChange={(e) => setTrendGranularity(e.target.value)}
                                                className="bg-[#1a1a1a] border border-[#333] text-[#ccc] text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#E92A15]/50"
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                            </select>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[42px] font-bold text-white/90 leading-none tabular-nums">{((Number(r.score?.overall) || 0) / 10).toFixed(1)}</span>
                                            <p className="text-[11px] text-white/45 mt-0.5">Visibility index (same 0–10 scale as gauges)</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[200px] w-full min-h-[200px] mt-4 mb-4">
                                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                        {trendData.length > 0 ? (
                                            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                                                <defs>
                                                    <linearGradient id="visScoreFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} stroke="#1e1e1e" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 11 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={40} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                                                    formatter={(v) => [`${v}%`, 'Score']}
                                                />
                                                <Area type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} fill="url(#visScoreFill)" dot={{ r: 3, fill: '#ef4444', stroke: '#fff', strokeWidth: 1 }} activeDot={{ r: 5 }} />
                                            </AreaChart>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-[#555] text-[12px] border border-dashed border-[#2a2a2a] rounded-xl">
                                                Run more scans to see your score trend over time.
                                            </div>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {weekChange != null && String(weekChange).length > 0 ? (
                                            <>
                                                <span className="inline-flex items-center gap-1.5 bg-[#16a34a]/15 text-[#22c55e] text-[11px] font-semibold px-2.5 py-1 rounded-md">
                                                    <TrendingUp className="w-3 h-3" />{weekChange}
                                                </span>
                                                <span className="text-[#666] text-[11px]">vs last week</span>
                                            </>
                                        ) : (
                                            <span className="text-[#666] text-[11px]">Historical trend appears after multiple scans are stored.</span>
                                        )}
                                    </div>
                                    <span className="text-[#555] text-[10px] font-semibold tracking-wider uppercase">SCANNED {scanDate}</span>
                                </div>
                            </div>

                            {/* Card 2: Industry Ranking — prompt breadth (distinct prompts where brand appears), not SOV */}
                            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 overflow-hidden">
                                <h3 className="text-white font-semibold text-[15px] mb-0.5">Industry Ranking</h3>
                                <p className="text-[#777] text-[12px] mb-5">Breadth: share of tracked prompts where each brand appears</p>
                                <table className="w-full text-left text-[12px]">
                                    <thead>
                                        <tr className="text-[#666] text-[10px] uppercase tracking-wider border-b border-[#1e1e1e]">
                                            <th className="pb-3 pl-2 font-medium">#</th>
                                            <th className="pb-3 font-medium">BRAND</th>
                                            <th className="pb-3 text-right font-medium whitespace-nowrap">
                                                MENTIONS
                                                <HelpHint text="Total brand mentions detected across all AI responses in this scan (all engines)." />
                                            </th>
                                            <th className="pb-3 text-right font-medium whitespace-nowrap">
                                                AVG POS
                                                <HelpHint text="Average position when your brand appears in ranked or ordered lists in responses (lower rank number = better)." />
                                            </th>
                                            <th className="pb-3 text-right font-medium whitespace-nowrap">
                                                HIT
                                                <HelpHint text="Distinct prompts in this scan where this brand appeared at least once." />
                                            </th>
                                            <th className="pb-3 text-right pr-2 font-medium whitespace-nowrap">
                                                COVERAGE
                                                <HelpHint text="Percentage of tracked prompts where this brand appeared at least once." />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {industryRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-[#666] text-[12px]">
                                                    Run a fresh scan to populate prompt-breadth rankings. Older results only included mention-share order.
                                                </td>
                                            </tr>
                                        ) : industryRows.map((item, i) => {
                                            if (!item) return null;
                                            const isTarget = item.isTargetBrand ?? item.name === (r.shareOfVoice?.brand?.name || brandName);
                                            return (
                                                <tr key={`${item.name}-${i}`} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#111] transition-colors">
                                                    <td className="py-3.5 pl-2 text-[#666] font-medium">{item.rank ?? i + 1}</td>
                                                    <td className="py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center overflow-hidden shrink-0">
                                                                {item.domain ? <img src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`} className="w-4 h-4" onError={ev => { ev.currentTarget.style.display = 'none' }} alt="" /> : <Globe className="w-3.5 h-3.5 text-[#444]" />}
                                                            </div>
                                                            <span className="text-white/90 font-medium text-[13px]">{item.name}</span>
                                                            {isTarget && <span className="text-[9px] bg-[#ef4444]/20 text-[#ef4444] px-2 py-0.5 rounded font-semibold tracking-wide">YOU</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 text-right text-white/70 font-medium">{item.mentions || 0}</td>
                                                    <td className="py-3.5 text-right text-white/70 font-medium">{item.avgPosition ?? '-'}</td>
                                                    <td className="py-3.5 text-right text-white/70 font-medium tabular-nums">{item.promptsReached != null ? item.promptsReached : '—'}</td>
                                                    <td className="py-3.5 text-right pr-2 text-white/90 font-semibold">{item.promptCoverage != null ? `${item.promptCoverage}%` : '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Card 3: Share of Voice */}
                            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 flex flex-col min-h-0">
                                <h3 className="text-white font-semibold text-[15px] mb-0.5">Share of Voice</h3>
                                <p className="text-[#777] text-[12px] mb-4">Mention share for every brand tracked in this scan</p>
                                <div className="space-y-3 mb-4 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                                    {allBrands.map((item, i) => {
                                        if (!item) return null;
                                        const pct = ((item.sov || 0) / totalSov * 100).toFixed(1);
                                        const w = Math.min(100, Math.max(parseFloat(pct), 4));
                                        const fill = SOV_BAR_COLORS[i % SOV_BAR_COLORS.length];
                                        return (
                                            <div key={`${item.name}-${i}`}>
                                                <div className="relative w-full h-[36px] bg-[#1a1a1a] rounded-lg overflow-hidden mb-1">
                                                    <div
                                                        className="absolute inset-y-0 left-0 rounded-lg flex items-center pl-3 transition-all duration-700"
                                                        style={{
                                                            width: `${w}%`,
                                                            backgroundColor: fill,
                                                        }}
                                                    >
                                                        <span className="text-white font-semibold text-[12px] drop-shadow-sm">{pct}%</span>
                                                    </div>
                                                </div>
                                                <span className="text-[#888] text-[11px]">{item.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3 border-t border-[#1e1e1e]">
                                    {allBrands.map((item, i) => {
                                        if (!item) return null;
                                        const pct = ((item.sov || 0) / totalSov * 100).toFixed(1);
                                        const fill = SOV_BAR_COLORS[i % SOV_BAR_COLORS.length];
                                        return (
                                            <div key={`leg-${item.name}-${i}`} className="flex items-center gap-1.5 max-w-[200px]">
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: fill }} />
                                                <span className="text-[#999] text-[11px] truncate">{item.name} — <strong className="text-white/80">{pct}%</strong></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Card 4: Share of Voice Ranking — mention volume share, distinct from prompt coverage */}
                            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 overflow-hidden">
                                <h3 className="text-white font-semibold text-[15px] mb-0.5">Share of Voice Ranking</h3>
                                <p className="text-[#777] text-[12px] mb-5">Mention share across all extracted brand mentions (volume-weighted)</p>
                                <table className="w-full text-left text-[12px]">
                                    <thead>
                                        <tr className="text-[#666] text-[10px] uppercase tracking-wider border-b border-[#1e1e1e]">
                                            <th className="pb-3 pl-2 font-medium">#</th>
                                            <th className="pb-3 font-medium">BRAND</th>
                                            <th className="pb-3 text-right font-medium whitespace-nowrap">
                                                SENTIMENT
                                                <HelpHint text="0–100 index summarizing how positively this brand is portrayed in extracted mentions." />
                                            </th>
                                            <th className="pb-3 text-right pr-2 font-medium whitespace-nowrap">
                                                SHARE
                                                <HelpHint text="Percentage of all brand mentions in this scan that belong to this brand (mention volume, not prompt coverage)." />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allBrands.map((item, i) => {
                                            if (!item) return null;
                                            const isTarget = item.name === (r.shareOfVoice?.brand?.name || brandName);
                                            const sentimentScore = sentimentIndex0to100(item.sentiment);
                                            const sentimentColor = sentimentScore == null ? 'bg-[#222]/40 text-[#888]' : sentimentScore >= 75 ? 'bg-[#22c55e]/15 text-[#22c55e]' : sentimentScore >= 50 ? 'bg-[#eab308]/15 text-[#eab308]' : 'bg-[#ef4444]/15 text-[#ef4444]';
                                            const sentimentIcon = sentimentScore == null ? <span className="text-[10px]">—</span> : sentimentScore >= 75 ? <TrendingUp className="w-3 h-3" /> : sentimentScore >= 50 ? <span className="text-[10px]">—</span> : <TrendingDown className="w-3 h-3" />;
                                            const pct = ((item.sov || 0) / totalSov * 100).toFixed(1);
                                            return (
                                                <tr key={i} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#111] transition-colors">
                                                    <td className="py-3.5 pl-2 text-[#666] font-medium">{i + 1}</td>
                                                    <td className="py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center overflow-hidden shrink-0">
                                                                {(item.domain || (isTarget && r.domain)) ? <img src={`https://www.google.com/s2/favicons?domain=${item.domain || r.domain}&sz=32`} className="w-4 h-4" onError={ev => { ev.currentTarget.style.display = 'none' }} alt="" /> : <Globe className="w-3.5 h-3.5 text-[#444]" />}
                                                            </div>
                                                            <span className="text-white/90 font-medium text-[13px]">{item.name}</span>
                                                            {isTarget && <span className="text-[9px] bg-[#ef4444]/20 text-[#ef4444] px-2 py-0.5 rounded font-semibold tracking-wide">YOU</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 text-right">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${sentimentColor}`}>
                                                            {sentimentIcon}{sentimentScore != null ? ` ${sentimentScore}` : ' n/a'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 text-right pr-2 text-white/90 font-semibold">{pct}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-5 bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6">
                            <h3 className="text-white font-semibold text-[15px] mb-0.5">Score drivers (0–100)</h3>
                            <p className="text-[#777] text-[12px] mb-4">
                                Visibility, share of voice, list position, and sentiment — same scale. Sentiment is a 0–100 index (not the 0–10 gauge scale).
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {radarData.map((row) => (
                                    <div
                                        key={row.m}
                                        className="rounded-xl border border-[#1e1e1e] bg-[#141414] px-4 py-3.5"
                                    >
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#666] mb-1">{row.m}</p>
                                        <p className="text-[22px] font-bold tabular-nums text-white/90 leading-none">{row.v}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </>
                        );
                    })()}



                    {/* Entities Tab */}
                    {tab === 'entities' && (() => {
                        const scanStampE = r.scannedAt || r.scanDate;
                        const scanDateStr = scanStampE
                            ? new Date(scanStampE).toLocaleString('en-US', {
                                month: 'numeric', day: 'numeric', year: 'numeric',
                                hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
                              })
                            : '—';
                        const entities = r.entityGraph || [];
                        const sovForSentiment = [r.shareOfVoice?.brand, ...(r.shareOfVoice?.competitors || [])].filter(Boolean);
                        const sentimentForEntity = (name) => {
                            const k = String(name || '').trim().toLowerCase();
                            const hit = sovForSentiment.find((x) => String(x.name || '').trim().toLowerCase() === k);
                            return sentimentIndex0to100(hit?.sentiment);
                        };
                        const targetEntity = entities.find(e => e.isTargetBrand);
                        const summaryText = targetEntity
                            ? `These brands were automatically detected in AI responses. ${targetEntity.name} appears in ${targetEntity.queryCount || 0} ${(targetEntity.queryCount || 0) === 1 ? 'query' : 'queries'}, demonstrating ${(targetEntity.queryCount || 0) > 2 ? 'strong' : (targetEntity.queryCount || 0) > 0 ? 'some' : 'limited'} brand visibility across AI platforms.`
                            : 'These brands were automatically detected in AI responses across all tracked prompts.';

                        const entityBarData = [...entities]
                            .sort((a, b) => (b.totalMentions || 0) - (a.totalMentions || 0))
                            .slice(0, 12)
                            .map((e, idx) => {
                                const raw = (e.name || '?').trim();
                                const short = raw.length > 16 ? `${raw.slice(0, 14)}…` : raw;
                                return {
                                    name: short,
                                    fullName: raw,
                                    mentions: e.totalMentions || 0,
                                    fill: e.isTargetBrand ? '#ef4444' : SOV_BAR_COLORS[(idx + 1) % SOV_BAR_COLORS.length],
                                };
                            });
                        const { data: entTrendRows, keys: entTrendKeys } = mentionTrendSeries;
                        const showMentionTrend = entTrendKeys.length > 0 && entTrendRows.length > 1;

                        return (
                        <>
                        {entities.length > 0 && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
                                <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-5">
                                    <h3 className="text-white font-semibold text-[14px] mb-0.5">Mentions this scan</h3>
                                    <p className="text-[#666] text-[11px] mb-3">Brands detected in AI answers — compare mention volume at a glance</p>
                                    <div className="h-[260px] w-full min-h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                                            <BarChart data={entityBarData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                                                <CartesianGrid horizontal stroke="#1e1e1e" vertical={false} />
                                                <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                <YAxis type="category" dataKey="name" width={92} tick={{ fill: '#aaa', fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: 11 }}
                                                    formatter={(v, _n, p) => [v, 'Mentions']}
                                                    labelFormatter={(_, p) => p?.payload?.fullName || ''}
                                                />
                                                <Bar dataKey="mentions" radius={[0, 6, 6, 0]} maxBarSize={22}>
                                                    {entityBarData.map((row, i) => (
                                                        <Cell key={i} fill={row.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                {showMentionTrend ? (
                                    <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-5">
                                        <h3 className="text-white font-semibold text-[14px] mb-0.5">Mention leaders over time</h3>
                                        <p className="text-[#666] text-[11px] mb-3">Top brands by cumulative mentions across stored scans (up to six names)</p>
                                        <div className="h-[260px] w-full min-h-[220px]">
                                            <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                                                <LineChart data={entTrendRows} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                                                    <CartesianGrid stroke="#1e1e1e" vertical={false} />
                                                    <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', fontSize: 11 }} />
                                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                                    {entTrendKeys.map((k, i) => (
                                                        <Line
                                                            key={k}
                                                            type="monotone"
                                                            dataKey={k}
                                                            name={k}
                                                            stroke={SOV_BAR_COLORS[i % SOV_BAR_COLORS.length]}
                                                            strokeWidth={2}
                                                            dot={{ r: 2 }}
                                                            connectNulls
                                                        />
                                                    ))}
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-5 flex flex-col justify-center min-h-[200px]">
                                        <BarChart3 className="w-10 h-10 text-[#333] mx-auto mb-2" />
                                        <p className="text-[#666] text-[12px] text-center px-4">Run more completed scans to see how mention counts trend for you vs competitors.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                            {/* Card header */}
                            <div className="px-5 pt-5 pb-4">
                                <h3 className="text-white font-semibold text-[15px] mb-0.5">Brands Detected in AI Responses</h3>
                                <p className="text-[#666] text-[12px]">Entities mentioned across all tracked prompts</p>
                            </div>

                            {/* Entity list */}
                            <div className="px-4 pb-4 space-y-3">
                                {entities.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <Globe className="w-8 h-8 text-[#333] mx-auto mb-2" />
                                        <p className="text-[#555] text-sm">No entities detected yet. Run a scan to populate.</p>
                                    </div>
                                ) : entities.map((e, i) => {
                                    const hasMentions = (e.totalMentions || 0) > 0;
                                    const entSent = sentimentForEntity(e.name);
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center gap-4 bg-[#141414] border border-[#222] rounded-2xl px-4 py-3.5 hover:bg-[#181818] transition-colors"
                                        >
                                            {/* Brand logo */}
                                            <div className="w-12 h-12 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center shrink-0 overflow-hidden">
                                                {e.domain ? (
                                                    <img
                                                        src={`https://www.google.com/s2/favicons?domain=${e.domain}&sz=64`}
                                                        className="w-8 h-8 object-contain"
                                                        onError={ev => {
                                                            ev.currentTarget.style.display = 'none';
                                                            ev.currentTarget.parentElement.innerHTML = `<span style="color:#666;font-size:16px;font-weight:700">${(e.name || '?')[0].toUpperCase()}</span>`;
                                                        }}
                                                        alt={e.name}
                                                    />
                                                ) : (
                                                    <span className="text-[#666] text-base font-bold">{(e.name || '?')[0].toUpperCase()}</span>
                                                )}
                                            </div>

                                            {/* Brand info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-white font-semibold text-[15px]">{e.name}</span>
                                                    {e.isTargetBrand && (
                                                        <span className="text-[10px] font-bold text-[#ccc] bg-[#2a2a2a] px-2 py-0.5 rounded tracking-wider">YOU</span>
                                                    )}
                                                    {e.isCompetitor && (
                                                        <span className="text-[10px] font-bold text-[#ccc] bg-[#2a2a2a] px-2 py-0.5 rounded tracking-wider">COMPETITOR</span>
                                                    )}
                                                </div>
                                                {e.domain && (
                                                    <span className="text-[#555] text-[12px]">{e.domain}</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0 text-right">
                                                <div>
                                                    <div className="text-[10px] font-semibold text-[#555] tracking-widest uppercase">Sentiment</div>
                                                    <div className={`text-[13px] font-bold mt-0.5 tabular-nums ${entSent == null ? 'text-[#555]' : entSent >= 75 ? 'text-[#22c55e]' : entSent >= 50 ? 'text-[#eab308]' : 'text-[#ef4444]'}`}>
                                                        {entSent != null ? entSent : 'n/a'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[22px] ${
                                                        hasMentions ? 'bg-[#222] text-white' : 'bg-[#1a1a1a] text-[#444]'
                                                    }`}>
                                                        {e.totalMentions || 0}
                                                    </div>
                                                    <div className="text-right min-w-[72px]">
                                                        <div className="text-[10px] font-semibold text-[#555] tracking-widest uppercase">Mentions</div>
                                                        <div className="text-[12px] text-[#888] mt-0.5">in {e.queryCount || 0} {(e.queryCount || 0) === 1 ? 'query' : 'queries'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Entity Detection info card */}
                                {entities.length > 0 && (
                                    <div className="flex items-start gap-3 bg-[#141414] border border-[#222] rounded-2xl px-4 py-3.5 mt-1">
                                        <div className="w-8 h-8 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                                            <Lightbulb className="w-4 h-4 text-[#666]" />
                                        </div>
                                        <div>
                                            <p className="text-[#ccc] text-[13px] font-semibold mb-0.5">Entity Detection</p>
                                            <p className="text-[#666] text-[12px] leading-relaxed">{summaryText}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer: scanned date */}
                            <div className="flex justify-center py-4 border-t border-[#1a1a1a]">
                                <p className="text-[#444] text-[10px] font-semibold tracking-widest uppercase">
                                    Scanned {scanDateStr}
                                </p>
                            </div>
                        </div>
                        </>
                        );
                    })()}


                    {/* Citations Tab — pie by content type; optional filter to brand-associated domains */}
                    {tab === 'citations' && (() => {
                        const normDom = (d) => String(d || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();
                        const userDom = normDom(domain);
                        const rowMatchesBrand = (c) =>
                            c.isTargetBrand || (userDom && normDom(c.domain) === userDom);
                        const rawList = r?.citationSummary || r?.sourceDomains?.topDomains || [];
                        const typeMap = {};
                        const addTypesFromSummary = (list) => {
                            for (const c of list) {
                                const t = classifyCitationRow(c);
                                typeMap[t] = (typeMap[t] || 0) + (c.count || c.mentions || 1);
                            }
                        };
                        if (rawList.length) addTypesFromSummary(rawList);
                        else {
                            for (const p of r.prompts || []) {
                                for (const [, data] of Object.entries(p.engines || {})) {
                                    for (const cit of data.citations || []) {
                                        const t = classifyCitationRow({
                                            domain: cit.domain,
                                            isTargetBrand: cit.isTargetBrand,
                                            isCompetitor: cit.isCompetitor,
                                        });
                                        typeMap[t] = (typeMap[t] || 0) + 1;
                                    }
                                }
                            }
                        }
                        const TYPE_PALETTE = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#64748b', '#94a3b8'];
                        const typeEntries = Object.entries(typeMap)
                            .map(([name, value], i) => ({
                                name,
                                value,
                                color: TYPE_PALETTE[i % TYPE_PALETTE.length],
                            }))
                            .filter((e) => e.value > 0)
                            .sort((a, b) => b.value - a.value);
                        const typeTotal = typeEntries.reduce((s, e) => s + e.value, 0) || 1;
                        const filteredRows = sourcesBrandOnly ? rawList.filter(rowMatchesBrand) : rawList;

                        return (
                        <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-5 overflow-hidden">
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                                    <div>
                                        <h3 className="text-white font-semibold text-[15px] mb-0.5">Source domains</h3>
                                        <p className="text-[#777] text-[12px]">Domains cited in AI responses. Type is inferred from domain and URL patterns.</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#aaa] shrink-0 select-none">
                                        <input
                                            type="checkbox"
                                            checked={sourcesBrandOnly}
                                            onChange={(e) => setSourcesBrandOnly(e.target.checked)}
                                            className="rounded border-[#333] bg-[#1a1a1a] text-[#E92A15] focus:ring-[#E92A15]/40"
                                        />
                                        Only my brand / owned
                                    </label>
                                </div>
                                <div className="overflow-x-auto rounded-xl border border-[#1a1a1a]">
                                    <table className="w-full text-left text-[12px]">
                                        <thead>
                                            <tr className="text-[#666] text-[10px] uppercase tracking-wider border-b border-[#1e1e1e] bg-[#111]">
                                                <th className="py-3 pl-3 font-semibold">Domain</th>
                                                <th className="py-3 font-semibold">Type</th>
                                                <th className="py-3 text-right font-semibold">Mentions</th>
                                                <th className="py-3 pr-3 text-right font-semibold">URLs</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1a1a1a]">
                                            {filteredRows.map((c, i) => (
                                                <tr key={i} className={`transition-colors hover:bg-[#141414] ${c.isTargetBrand ? 'bg-emerald-500/[0.06]' : ''}`}>
                                                    <td className="py-3 pl-3">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center overflow-hidden shrink-0">
                                                                <img src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=32`} className="w-4 h-4" onError={ev => { ev.currentTarget.style.display = 'none' }} alt="" />
                                                            </div>
                                                            <a href={`https://${c.domain}`} target="_blank" rel="noreferrer" className={`truncate max-w-[200px] font-medium ${c.isTargetBrand ? 'text-white' : 'text-[#93c5fd] hover:underline'}`}>
                                                                {c.domain}
                                                            </a>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="text-[10px] px-2 py-1 rounded-md border border-[#2a2a2a] bg-[#141414] text-[#aaa]">
                                                            {classifyCitationRow(c)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right text-white/90 font-semibold tabular-nums">{c.count}</td>
                                                    <td className="py-3 pr-3 text-right text-[#888] tabular-nums">{c.uniqueUrls ?? '—'}</td>
                                                </tr>
                                            ))}
                                            {filteredRows.length === 0 && (
                                                <tr><td colSpan={4} className="py-10 text-center text-[#666] text-[13px]">{sourcesBrandOnly ? 'No owned-brand domains in this scan summary.' : 'No citations found. Run a scan to populate sources.'}</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="lg:col-span-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-5 flex flex-col min-h-0">
                                <h3 className="text-white font-semibold text-[15px] mb-0.5">By content type</h3>
                                <p className="text-[#777] text-[12px] mb-4">Share of citation volume by category</p>
                                {typeEntries.length === 0 ? (
                                    <p className="text-[#666] text-[13px] text-center py-10">No citation data yet</p>
                                ) : (
                                    <>
                                        <div className="h-52 w-full mb-4 shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={typeEntries} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" strokeWidth={2} stroke="#0d0d0d">
                                                        {typeEntries.map((entry, idx) => (
                                                            <Cell key={idx} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '10px', fontSize: '11px', color: '#fff' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                            {typeEntries.map((t, i) => (
                                                <div key={i} className="flex items-center justify-between text-[12px] gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                                                        <span className="text-[#aaa] truncate">{t.name}</span>
                                                    </div>
                                                    <span className="text-white font-semibold shrink-0 tabular-nums">{Math.round((t.value / typeTotal) * 100)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        </>
                        );
                    })()}

                    {/* URLs Tab */}
                    {tab === 'urls' && (() => {
                        const allUrls = allUrlRanking;
                        const totalUrls = r.urlRanking?.totalUrls || allUrls.length;
                        const totalMentions = r.urlRanking?.totalMentions || allUrls.reduce((s, u) => s + u.count, 0);
                        const pageCount = Math.max(1, Math.ceil(allUrls.length / urlPageSize));
                        const safePage = Math.min(urlPage, pageCount - 1);
                        const sliceStart = safePage * urlPageSize;
                        const pageRows = allUrls.slice(sliceStart, sliceStart + urlPageSize);
                        const urlBarData = [...allUrls]
                            .sort((a, b) => (b.count || 0) - (a.count || 0))
                            .slice(0, 16)
                            .map((u, i) => {
                                const raw = u.url || '';
                                const path = raw.replace(/^https?:\/\/[^/]+/i, '') || raw;
                                const short =
                                    path.length > 36 ? `${path.slice(0, 34)}…` : path || raw.slice(0, 36);
                                return {
                                    label: short,
                                    fullUrl: raw,
                                    count: u.count || 0,
                                    fill: u.isTargetBrand ? '#22c55e' : u.isCompetitor ? '#f97316' : SOV_BAR_COLORS[i % SOV_BAR_COLORS.length],
                                };
                            });

                        return (
                        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                            <div className="px-5 pt-5 pb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-white font-semibold text-[15px] mb-0.5">URL Rankings & Citations</h3>
                                    <p className="text-[#666] text-[12px]">{totalUrls} unique URLs found across {totalMentions} citations</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] text-[#666] uppercase font-semibold">Per page</span>
                                    {[10, 20, 50].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => { setUrlPageSize(n); setUrlPage(0); }}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                                                urlPageSize === n ? 'bg-[#E92A15]/20 border-[#E92A15]/50 text-white' : 'border-[#333] text-[#888] hover:border-[#555]'
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {urlBarData.length > 0 && (
                                <div className="px-5 pb-4 border-b border-[#1a1a1a]">
                                    <p className="text-[#888] text-[11px] mb-2 font-medium">Most-cited URLs (top {urlBarData.length})</p>
                                    <div className="h-[300px] w-full min-h-[260px]">
                                        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                                            <BarChart data={urlBarData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                                                <CartesianGrid horizontal stroke="#1e1e1e" vertical={false} />
                                                <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                <YAxis type="category" dataKey="label" width={140} tick={{ fill: '#999', fontSize: 9 }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', fontSize: 11 }}
                                                    formatter={(v) => [v, 'Citations']}
                                                    labelFormatter={(_, p) => p?.payload?.fullUrl || ''}
                                                />
                                                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20}>
                                                    {urlBarData.map((row, i) => (
                                                        <Cell key={i} fill={row.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[12px]">
                                    <thead>
                                        <tr className="border-y border-[#1a1a1a] bg-[#080808]">
                                            <th className="py-2.5 pl-5 pr-3 text-[10px] font-semibold tracking-wider text-[#888] uppercase w-[5%]">#</th>
                                            <th className="py-2.5 px-3 text-[10px] font-semibold tracking-wider text-[#888] uppercase w-[45%]">URL</th>
                                            <th className="py-2.5 px-3 text-[10px] font-semibold tracking-wider text-[#888] uppercase w-[12%]">DOMAIN</th>
                                            <th className="py-2.5 px-3 text-[10px] font-semibold tracking-wider text-[#888] uppercase text-center w-[10%]">TIMES CITED</th>
                                            <th className="py-2.5 px-3 text-[10px] font-semibold tracking-wider text-[#888] uppercase text-center w-[10%]">ENGINES</th>
                                            <th className="py-2.5 px-3 text-[10px] font-semibold tracking-wider text-[#888] uppercase text-center w-[10%]">PROMPTS</th>
                                            <th className="py-2.5 pl-3 pr-5 text-[10px] font-semibold tracking-wider text-[#888] uppercase text-right w-[8%]">TYPE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageRows.map((u, i) => (
                                            <tr key={sliceStart + i} className={`border-b border-[#1a1a1a] hover:bg-[#111] transition-colors ${u.isTargetBrand ? 'bg-green-500/5' : ''}`}>
                                                <td className="py-3 pl-5 pr-3 text-[#555] font-medium">{sliceStart + i + 1}</td>
                                                <td className="py-3 px-3">
                                                    <a href={u.url} target="_blank" rel="noreferrer" className="text-blue-400/80 hover:text-blue-400 hover:underline text-[11px] truncate block max-w-[350px]" title={u.url}>
                                                        {u.url.length > 70 ? u.url.substring(0, 70) + '…' : u.url}
                                                    </a>
                                                    {u.title && <p className="text-[#555] text-[10px] mt-0.5 truncate max-w-[350px]">{u.title}</p>}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-3.5 h-3.5 rounded bg-[#1e1e1e] flex items-center justify-center overflow-hidden shrink-0">
                                                            <img src={`https://www.google.com/s2/favicons?domain=${u.domain}&sz=16`} className="w-3 h-3" onError={ev => { ev.currentTarget.style.display = 'none' }} alt="" />
                                                        </div>
                                                        <span className="text-[#aaa] text-[11px] truncate max-w-[100px]">{u.domain}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`text-[13px] font-semibold ${u.count >= 3 ? 'text-amber-400' : u.count >= 2 ? 'text-white' : 'text-[#888]'}`}>{u.count}</span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {(u.engines || []).map(eng => (
                                                            <span key={eng} className="text-[9px] bg-[#1e1e1e] text-[#888] px-1.5 py-0.5 rounded">{EL[eng]?.substring(0, 3) || eng.substring(0, 3)}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-center text-[#888]">{u.promptCount}</td>
                                                <td className="py-3 pl-3 pr-5 text-right">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                                        u.isTargetBrand ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        u.isCompetitor ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-[#1a1a1a] text-[#666] border-[#2a2a2a]'
                                                    }`}>
                                                        {u.isTargetBrand ? 'Owned' : u.isCompetitor ? 'Competitor' : classifyDomainContentType(u.domain)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {allUrls.length === 0 && (
                                            <tr><td colSpan={7} className="py-12 text-center text-[#555] text-sm">No URLs found. Run a scan to populate.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {allUrls.length > 0 && pageCount > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-[#1a1a1a]">
                                    <p className="text-[11px] text-[#666]">
                                        Page <span className="text-white font-semibold">{safePage + 1}</span> of {pageCount}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={safePage <= 0}
                                            onClick={() => setUrlPage((p) => Math.max(0, p - 1))}
                                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[#333] text-[#ccc] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#555]"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            disabled={safePage >= pageCount - 1}
                                            onClick={() => setUrlPage((p) => Math.min(pageCount - 1, p + 1))}
                                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[#333] text-[#ccc] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#555]"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        );
                    })()}

                    {/* Gaps Tab */}
                    {tab === 'gaps' && (
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                            <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">Content gap topics</h3>
                            <p className="text-[var(--text-muted)] text-xs mb-3">Prompts where competitors surface in AI answers but you do not — topics to create content around</p>
                            <div className="space-y-3">
                                {(r.competitorGaps || []).map((g, i) => {
                                    const query = g.query || g.topic || (typeof g === 'string' ? g : '');
                                    const topic = g.contentTopic || query;
                                    const angle = g.contentAngle || '';
                                    const competitors = g.competitorsPresent || (Array.isArray(g.competitors) ? g.competitors.map(c => typeof c === 'string' ? { name: c, count: 1 } : c) : []);
                                    return (
                                        <div key={i} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 mb-1">Suggested content topic</p>
                                                <p className="text-sm text-[var(--text-primary)] font-medium leading-snug">{topic}</p>
                                            </div>
                                            {angle ? (
                                                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{angle}</p>
                                            ) : null}
                                            <p className="text-[11px] text-[var(--text-muted)] italic border-l-2 border-[#333] pl-2">&ldquo;{query}&rdquo;</p>
                                            {competitors.length > 0 && (
                                                <div className="flex gap-1 flex-wrap pt-1 items-center">
                                                    <span className="text-[10px] text-[var(--text-muted)] mr-1">Competitors cited:</span>
                                                    {competitors.map((c, j) => (
                                                        <span key={j} className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{c.name || c} ({c.count ?? 1}x)</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {(r.competitorGaps || []).length === 0 && (
                                    <div className="text-center py-6">
                                        <CheckCircle className="w-7 h-7 text-green-400/20 mx-auto mb-1.5" />
                                        <p className="text-[var(--text-muted)] text-sm">No gaps — you appear in every query your competitors do</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Intelligence Tab — always visible; wait for scan/analysis when needed */}
                    {tab === 'intelligence' && (
                        status === 'scanning' ? (
                            <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-10 text-center">
                                <Loader2 className="w-10 h-10 text-[#E92A15] mx-auto mb-4 animate-spin" />
                                <h3 className="text-white font-semibold text-[15px] mb-2">Wait for analysis to complete</h3>
                                <p className="text-[#888] text-sm max-w-md mx-auto leading-relaxed">
                                    AI Insights are generated after all responses are collected and scores are built. Stay on this page or return when the scan finishes — results will appear here automatically.
                                </p>
                                <p className="text-[#555] text-[11px] mt-4 font-mono">{phaseDetail || 'Analyzing…'}</p>
                            </div>
                        ) : !r.intelligence ? (
                            <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-10 text-center">
                                <Lightbulb className="w-10 h-10 text-[#444] mx-auto mb-4" />
                                <h3 className="text-white font-semibold text-[15px] mb-2">No AI Insights yet</h3>
                                <p className="text-[#888] text-sm max-w-md mx-auto leading-relaxed">
                                    Run a scan to generate a strategic brief. If the last scan failed or AI analysis was unavailable, try again.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-400" />
                                    <div>
                                        <h3 className="text-white font-semibold text-[15px]">AI insights</h3>
                                        <p className="text-[#666] text-[11px] mt-0.5">Snapshot first, detail below — scan the chart, then read what matters.</p>
                                    </div>
                                </div>
                                {(() => {
                                    const intel = r.intelligence;
                                    const s = intel.strengthAreas?.length || 0;
                                    const w = intel.weaknessAreas?.length || 0;
                                    const o = intel.topOpportunities?.length || 0;
                                    const engN = intel.engineInsights ? Object.keys(intel.engineInsights).length : 0;
                                    const maxV = Math.max(s, w, o, engN, 1);
                                    const insightViz = [
                                        { name: 'Strengths', n: s, fill: '#22c55e' },
                                        { name: 'Gaps / risks', n: w, fill: '#ef4444' },
                                        { name: 'Next moves', n: o, fill: '#a855f7' },
                                        { name: 'Engine notes', n: engN, fill: '#64748b' },
                                    ];
                                    return (
                                        <div className="px-5 py-4 border-b border-[#1e1e1e] bg-[#080808]">
                                            <p className="text-[10px] font-bold text-[#888] tracking-widest uppercase mb-3">Insight snapshot</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                                {insightViz.map((row) => (
                                                    <div key={row.name} className="rounded-xl border border-[#252525] bg-[#111] p-3 text-center">
                                                        <p className="text-[22px] font-bold tabular-nums" style={{ color: row.fill }}>{row.n}</p>
                                                        <p className="text-[10px] text-[#888] mt-0.5 leading-tight">{row.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="h-[140px] w-full min-h-[120px]">
                                                <ResponsiveContainer width="100%" height="100%" minHeight={120}>
                                                    <BarChart data={insightViz} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                                        <CartesianGrid vertical={false} stroke="#1e1e1e" />
                                                        <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
                                                        <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} domain={[0, maxV]} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', fontSize: 11 }}
                                                            formatter={(v) => [v, 'Items']}
                                                        />
                                                        <Bar dataKey="n" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                                            {insightViz.map((e, i) => (
                                                                <Cell key={i} fill={e.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className="divide-y divide-[#1a1a1a]">
                                    {r.intelligence.overallAssessment && (
                                        <section className="px-5 py-4">
                                            <p className="text-[10px] font-bold text-[#E92A15] tracking-widest uppercase mb-2">1 · Executive summary</p>
                                            <p className="text-[#ccc] text-[13px] leading-relaxed">{r.intelligence.overallAssessment}</p>
                                        </section>
                                    )}
                                    {(r.intelligence.strengthAreas?.length > 0 || r.intelligence.weaknessAreas?.length > 0) && (
                                        <section className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {r.intelligence.strengthAreas?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#22c55e] tracking-widest uppercase mb-2">2 · Strengths</p>
                                                    <ul className="space-y-2">
                                                        {r.intelligence.strengthAreas.map((s, i) => (
                                                            <li key={i} className="text-[#aaa] text-[12px] flex gap-2 leading-snug">
                                                                <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {r.intelligence.weaknessAreas?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#ef4444] tracking-widest uppercase mb-2">3 · Gaps &amp; risks</p>
                                                    <ul className="space-y-2">
                                                        {r.intelligence.weaknessAreas.map((s, i) => (
                                                            <li key={i} className="text-[#aaa] text-[12px] flex gap-2 leading-snug">
                                                                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </section>
                                    )}
                                    {r.intelligence.topOpportunities?.length > 0 && (
                                        <section className="px-5 py-4">
                                            <p className="text-[10px] font-bold text-[#a855f7] tracking-widest uppercase mb-2">4 · Next moves</p>
                                            <ul className="space-y-2">
                                                {r.intelligence.topOpportunities.map((s, i) => (
                                                    <li key={i} className="text-[#aaa] text-[12px] flex gap-2 leading-snug">
                                                        <Star className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                    {r.intelligence.engineInsights && Object.keys(r.intelligence.engineInsights).length > 0 && (
                                        <section className="px-5 py-4">
                                            <p className="text-[10px] font-bold text-[#888] tracking-widest uppercase mb-3">5 · By engine</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {Object.entries(r.intelligence.engineInsights).map(([eng, insight]) => (
                                                    <div key={eng} className="rounded-xl border border-[#252525] bg-[#111] p-3">
                                                        <div className="text-[12px] text-white font-medium mb-1">{PI[eng]} {EL[eng] || eng}</div>
                                                        <p className="text-[11px] text-[#888] leading-relaxed">{insight}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        )
                    )}

                    <p className="text-[var(--text-muted)] text-[10px] text-center">
                        {r.scannedAt ? `Scanned ${new Date(r.scannedAt).toLocaleString()}` : ''} •
                        {r.config?.totalCalls || '?'} API calls across ChatGPT, Gemini &amp; Perplexity • Powered by our intelligence layer
                    </p>
                </>
            )}

            </div>
        </div>
        </TooltipProvider>
    );
}
