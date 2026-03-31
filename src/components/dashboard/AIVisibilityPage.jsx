import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import {
    Activity, TrendingUp, TrendingDown, Target, Zap, Loader2,
    Users, BookOpen, Star, AlertCircle, BarChart3, Lightbulb, CheckCircle, Globe, RefreshCw,
    Plug, Send, Download, Cpu, BarChart2, Layers,
} from 'lucide-react';
import { ChatGPTLogo, GeminiLogo } from '../landing/AILogos';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Button } from "@/components/ui/button";

const PI = { perplexity: '🔮', gemini: '✨', googleAI: '🤖', chatgpt: '🤖', claude: '✹' };
const EL = { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'Google AI', chatgpt: 'ChatGPT', claude: 'Claude' };

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
            <div className="absolute left-0 w-full flex items-center justify-center pointer-events-none" style={{ top: '22%' }}>
                <span className="text-[28px] font-bold text-white leading-none">{score}</span>
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
                <span className="text-[36px] font-bold text-white tracking-tight leading-none">{score}</span>
                <span className="text-[9px] text-white/60 font-bold tracking-[0.15em] mt-1 uppercase">OVERALL SCORE</span>
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

function ScanProgressWidget({ phase, phaseDetail, progress, completedPrompts, totalPrompts, scanId }) {
    const [elapsedMs, setElapsedMs] = useState(0);
    const [rotateIdx, setRotateIdx] = useState(0);

    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => setElapsedMs(Date.now() - start), 1000);
        return () => clearInterval(interval);
    }, [scanId]);

    const pool = LIVE_STATUS_BY_PHASE[phase] || LIVE_STATUS_BY_PHASE.default;
    useEffect(() => {
        setRotateIdx(0);
    }, [phase, scanId]);

    useEffect(() => {
        const t = setInterval(() => {
            setRotateIdx(i => (i + 1) % pool.length);
        }, 2800);
        return () => clearInterval(t);
    }, [phase, pool.length, scanId]);

    const formatTime = (ms) => {
        const secs = Math.floor(ms / 1000);
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
    const total = totalPrompts || progress.total || 60;
    const estSeconds = Math.max(90, Math.ceil(total * 2.2));
    const estLabel = estSeconds >= 3600
        ? `~${Math.ceil(estSeconds / 3600)}h`
        : `~${Math.ceil(estSeconds / 60)} min`;

    const steps = [
        { id: 'initializing', label: 'Connect & prepare', sub: 'Secure session and your brand context' },
        { id: 'agents_running', label: 'Generate prompts & launch agents', sub: 'Intelligence prompts → ChatGPT, Gemini & Perplexity' },
        { id: 'querying', label: 'Send prompts & collect responses', sub: completedPrompts != null && totalPrompts ? `${completedPrompts} / ${totalPrompts} completed` : 'Answers, sources & citations from each engine' },
        { id: 'analyzing', label: 'Analyze & build parameters', sub: 'Visibility scores, SOV, sentiment & AI Insights' },
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

                <div className="flex items-stretch gap-4 sm:gap-6 bg-[#111] border border-[#222] rounded-xl px-4 sm:px-5 py-3 shrink-0">
                    <div className="flex flex-col justify-center">
                        <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider mb-0.5">Elapsed</span>
                        <span className="text-white font-mono text-[18px] font-semibold leading-none tabular-nums">{formatTime(elapsedMs)}</span>
                    </div>
                    <div className="w-px bg-[#222] self-stretch" />
                    <div className="flex flex-col justify-center">
                        <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider mb-0.5">Est. total</span>
                        <span className="text-[#aaa] font-mono text-[18px] font-semibold leading-none">{estLabel}</span>
                    </div>
                    <div className="w-px bg-[#222] self-stretch hidden sm:block" />
                    <div className="flex flex-col justify-center min-w-[52px]">
                        <span className="text-[#666] text-[10px] font-bold uppercase tracking-wider mb-0.5">Progress</span>
                        <span className="text-[#E92A15] font-mono text-[18px] font-bold tabular-nums">{pct}%</span>
                    </div>
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
            <p className="text-[#444] text-[10px] mt-3 text-center">
                Live AI queries → response parsing → scoring engine → strategic brief
            </p>
        </div>
    );
}

function formatScanDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildTrendFromHistory(history, currentResult) {
    const items = history && history.length > 0
        ? history
        : currentResult?.scannedAt
            ? [{ date: currentResult.scannedAt, score: currentResult.score?.overall || 0 }]
            : [];

    const byDay = {};
    for (const h of items) {
        const dayKey = new Date(h.date).toISOString().slice(0, 10);
        byDay[dayKey] = h;
    }

    return Object.values(byDay).map(h => ({
        date: formatScanDate(h.date),
        score: h.score || 0,
    }));
}

export default function AIVisibilityPage({ user, scanManager }) {
    const {
        scanId, scanStatus: status, scanResult: result, scanPhase: phase,
        scanPhaseDetail: phaseDetail, scanProgress: progress,
        completedPrompts, totalPrompts, scanError: error,
        loadingFromBackend, startScan,
    } = scanManager;

    const [tab, setTab] = useState('overview');
    const [scanHistory, setScanHistory] = useState([]);

    const brandName = user?.brandName || 'Your Brand';
    const domain = user?.domain || '';

    useEffect(() => {
        if (!domain) return;
        apiClient.visibility.getScanHistory(user?.projectId, domain)
            .then(res => { if (res?.history) setScanHistory(res.history); })
            .catch(() => {});
    }, [domain, user?.projectId, result]);

    const trendData = buildTrendFromHistory(scanHistory, result);

    // AUTO-START: Trigger scan only when backend check is done and no result exists
    useEffect(() => {
        if (loadingFromBackend) return;
        if (status === 'idle' && !result && domain && user?.brandName && user?.industry) {
            console.log('[AIVisibility] Auto-starting scan for', domain);
            startScan();
        }
    }, [loadingFromBackend, status, result, domain, user?.brandName, user?.industry, startScan]);

    const r = result;
    const sovData = r ? [
        { name: r.shareOfVoice?.brand?.name || brandName, sov: r.shareOfVoice?.brand?.sov || 0, fill: '#a855f7' },
        ...(r.shareOfVoice?.competitors || []).map((c, i) => ({ name: c.name, sov: c.sov, fill: ['#3b82f6', '#06b6d4', '#f59e0b', '#ef4444'][i % 4] })),
    ] : [];

    const radarData = r ? [
        { m: 'Visibility', v: r.score?.components?.visibility || 0 },
        { m: 'Share of Voice', v: r.score?.components?.shareOfVoice || 0 },
        { m: 'Position', v: r.score?.components?.position || 0 },
        { m: 'Sentiment', v: r.score?.components?.sentiment || 0 },
    ] : [];

    const catData = r ? Object.entries(r.perCategory || {}).map(([cat, d]) => ({
        cat: cat.length > 18 ? cat.substring(0, 16) + '…' : cat, score: d.score,
    })) : [];

    const tabs = [
        { k: 'overview', l: 'Overview', i: BarChart3 },
        { k: 'entities', l: 'Entities', i: Users },
        { k: 'citations', l: 'Sources', i: BookOpen },
        { k: 'urls', l: 'URLs', i: Globe },
        { k: 'gaps', l: 'Gaps', i: AlertCircle },
        { k: 'intelligence', l: 'AI Insights', i: Lightbulb },
    ];

    return (
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
                    completedPrompts={completedPrompts}
                    totalPrompts={totalPrompts}
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
                                    <SemiCircleGauge score={cScore} icon={<ChatGPTLogo className="w-[16px] h-[16px] text-white" />} label="Google AI" size={160} />
                                    <SemiCircleGauge score={gScore} icon={<GeminiLogo className="w-[16px] h-[16px] text-[#4285f4]" />} label="Gemini" size={160} />
                                    <SemiCircleGauge score={pScore} icon={<img src="/perplexity.png" alt="Perplexity" className="w-[16px] h-[16px] object-contain" style={{ filter: 'brightness(0) invert(1)' }} />} label="Perplexity" size={160} />
                                    <SemiCircleGauge score={claudeAvg} icon={<img src="/claude.png" alt="Claude" className="w-[16px] h-[16px] object-contain" />} label="Claude" size={160} />
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
                        const allBrands = [r.shareOfVoice?.brand, ...(r.shareOfVoice?.competitors || [])].filter(Boolean).sort((a, b) => (b?.sov || 0) - (a?.sov || 0));
                        const totalSov = allBrands.reduce((sum, b) => sum + (b?.sov || 0), 0) || 1;
                        const scanStamp = r.scannedAt || r.scanDate;
                        const scanDate = scanStamp ? new Date(scanStamp).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : '—';
                        const weekChange = r.score?.weekChange;

                        return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Card 1: AI Visibility Score */}
                            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 relative">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <h3 className="text-white font-semibold text-[15px]">AI Visibility Score</h3>
                                        <p className="text-[#777] text-[12px]">How often your brand appears in AI responses</p>
                                    </div>
                                    <span className="text-[42px] font-bold text-white/90 leading-none">{r.score?.overall || 0}%</span>
                                </div>
                                <div className="h-[160px] mt-4 mb-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={trendData} barCategoryGap="20%">
                                            <CartesianGrid vertical={false} stroke="#1e1e1e" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 11 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={36} />
                                            <Bar dataKey="score" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        </BarChart>
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

                            {/* Card 2: Industry Ranking */}
                            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 overflow-hidden">
                                <h3 className="text-white font-semibold text-[15px] mb-0.5">Industry Ranking</h3>
                                <p className="text-[#777] text-[12px] mb-5">Brands with highest AI visibility</p>
                                <table className="w-full text-left text-[12px]">
                                    <thead>
                                        <tr className="text-[#666] text-[10px] uppercase tracking-wider border-b border-[#1e1e1e]">
                                            <th className="pb-3 pl-2 font-medium">#</th>
                                            <th className="pb-3 font-medium">BRAND</th>
                                            <th className="pb-3 text-right font-medium">MENTIONS</th>
                                            <th className="pb-3 text-right font-medium">POSITION</th>
                                            <th className="pb-3 text-right font-medium">CHANGE</th>
                                            <th className="pb-3 text-right pr-2 font-medium">VISIBILITY</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allBrands.map((item, i) => {
                                            if (!item) return null;
                                            const isTarget = item.name === (r.shareOfVoice?.brand?.name || brandName);
                                            const changeVal = parseFloat(item.change || 0);
                                            return (
                                                <tr key={i} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#111] transition-colors">
                                                    <td className="py-3.5 pl-2 text-[#666] font-medium">{i + 1}</td>
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
                                                    <td className="py-3.5 text-right text-white/70 font-medium">{item.avgPosition || '-'}</td>
                                                    <td className="py-3.5 text-right">
                                                        <span className={`inline-flex items-center gap-1 font-medium ${changeVal >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                                                            {changeVal >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                            {item.change || '+0.0%'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 text-right pr-2 text-white/90 font-semibold">{item.sov || 0}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Card 3: Share of Voice */}
                            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6">
                                <h3 className="text-white font-semibold text-[15px] mb-0.5">Share of Voice</h3>
                                <p className="text-[#777] text-[12px] mb-6">Mentions of your brand vs competitors</p>
                                <div className="space-y-4 mb-5">
                                    {allBrands.slice(0, 4).map((item, i) => {
                                        if (!item) return null;
                                        const pct = ((item.sov || 0) / totalSov * 100).toFixed(1);
                                        return (
                                            <div key={i}>
                                                <div className="relative w-full h-[38px] bg-[#1a1a1a] rounded-lg overflow-hidden mb-1.5">
                                                    <div 
                                                        className="absolute inset-y-0 left-0 rounded-lg flex items-center pl-3 transition-all duration-700"
                                                        style={{ 
                                                            width: `${Math.max(parseFloat(pct), 8)}%`,
                                                            backgroundColor: i === 0 ? '#ef4444' : '#b91c1c' 
                                                        }}
                                                    >
                                                        <span className="text-white font-semibold text-[12px]">{pct}%</span>
                                                    </div>
                                                </div>
                                                <span className="text-[#888] text-[11px]">{item.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-wrap gap-x-5 gap-y-1 pt-3 border-t border-[#1e1e1e]">
                                    {allBrands.slice(0, 4).map((item, i) => {
                                        if (!item) return null;
                                        const pct = ((item.sov || 0) / totalSov * 100).toFixed(1);
                                        return (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? '#ef4444' : '#666' }} />
                                                <span className="text-[#999] text-[11px]">{item.name} — <strong className="text-white/80">{pct}%</strong></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Card 4: Share of Voice Ranking */}
                            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 overflow-hidden">
                                <h3 className="text-white font-semibold text-[15px] mb-0.5">Share of Voice Ranking</h3>
                                <p className="text-[#777] text-[12px] mb-5">Brands with highest share of voice</p>
                                <table className="w-full text-left text-[12px]">
                                    <thead>
                                        <tr className="text-[#666] text-[10px] uppercase tracking-wider border-b border-[#1e1e1e]">
                                            <th className="pb-3 pl-2 font-medium">#</th>
                                            <th className="pb-3 font-medium">BRAND</th>
                                            <th className="pb-3 text-right font-medium">SENTIMENT</th>
                                            <th className="pb-3 text-right pr-2 font-medium">SHARE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allBrands.map((item, i) => {
                                            if (!item) return null;
                                            const isTarget = item.name === (r.shareOfVoice?.brand?.name || brandName);
                                            const sentimentScore = typeof item.sentiment === 'number' ? Math.round(item.sentiment) : null;
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
                        const targetEntity = entities.find(e => e.isTargetBrand);
                        const summaryText = targetEntity
                            ? `These brands were automatically detected in AI responses. ${targetEntity.name} appears in ${targetEntity.queryCount || 0} ${(targetEntity.queryCount || 0) === 1 ? 'query' : 'queries'}, demonstrating ${(targetEntity.queryCount || 0) > 2 ? 'strong' : (targetEntity.queryCount || 0) > 0 ? 'some' : 'limited'} brand visibility across AI platforms.`
                            : 'These brands were automatically detected in AI responses across all tracked prompts.';

                        return (
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

                                            {/* Mention count box */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[22px] ${
                                                    hasMentions ? 'bg-[#222] text-white' : 'bg-[#1a1a1a] text-[#444]'
                                                }`}>
                                                    {e.totalMentions || 0}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-semibold text-[#555] tracking-widest uppercase">Mentions</div>
                                                    <div className="text-[12px] text-[#888] mt-0.5">in {e.queryCount || 0} {(e.queryCount || 0) === 1 ? 'query' : 'queries'}</div>
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
                        );
                    })()}


                    {/* Citations Tab */}
                    {tab === 'citations' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 overflow-hidden">
                                <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">Source Domains</h3>
                                <p className="text-[var(--text-secondary)] text-[10px] mb-4">Domains most frequently cited in AI responses</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                                                <th className="pb-2 font-medium">DOMAIN</th>
                                                <th className="pb-2 font-medium">TYPE</th>
                                                <th className="pb-2 font-medium text-right">MENTIONS</th>
                                                <th className="pb-2 font-medium text-right">URLS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {(r.citationSummary || []).map((c, i) => (
                                                <tr key={i} className={`group hover:bg-[var(--surface-hover)] transition-colors ${c.isTargetBrand ? 'bg-green-500/5' : ''}`}>
                                                    <td className="py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded bg-[var(--surface-active)] flex items-center justify-center overflow-hidden">
                                                                <img src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=16`} className="w-3 h-3" onError={ev => { ev.currentTarget.style.display = 'none' }} alt="" />
                                                            </div>
                                                            <a href={`https://${c.domain}`} target="_blank" rel="noreferrer" className={`truncate max-w-[150px] ${c.isTargetBrand ? 'text-[var(--text-primary)] font-medium' : 'text-blue-400 hover:underline'}`}>
                                                                {c.domain}
                                                            </a>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${c.isTargetBrand ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            c.domain.includes('reddit') || c.domain.includes('quora') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                                c.domain.includes('linkedin') || c.domain.includes('youtube') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                    'bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border)]'
                                                            }`}>
                                                            {c.isTargetBrand ? 'Owned' : c.domain.includes('reddit') ? 'Forum' : c.domain.includes('linkedin') ? 'Social' : 'Editorial'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 text-right text-[var(--text-primary)] font-medium">{c.count}</td>
                                                    <td className="py-2.5 text-right text-[var(--text-secondary)]">{c.uniqueUrls}</td>
                                                </tr>
                                            ))}
                                            {(r.citationSummary || []).length === 0 && (
                                                <tr><td colSpan={4} className="py-6 text-center text-[var(--text-muted)] text-xs">No citations found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="lg:col-span-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                                <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">Top Citation Sources</h3>
                                <p className="text-[var(--text-secondary)] text-[10px] mb-4">Most cited domains across AI engines</p>
                                {(() => {
                                    const rawCitations = r?.citationSummary || r?.sourceDomains?.topDomains || [];
                                    const citationEntries = rawCitations.slice(0, 5).map((c, i) => ({
                                        name: c.domain || c.name || `Source ${i + 1}`,
                                        value: c.count || c.mentions || 1,
                                        color: ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#6b7280'][i] || '#6b7280',
                                    }));
                                    if (citationEntries.length === 0) {
                                        return <p className="text-[var(--text-muted)] text-xs text-center py-8">No citation data yet</p>;
                                    }
                                    const total = citationEntries.reduce((s, e) => s + e.value, 0) || 1;
                                    return (
                                        <>
                                            <div className="h-40 w-full mb-6">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={citationEntries} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={2} stroke="var(--bg-primary)">
                                                            {citationEntries.map((entry, idx) => (
                                                                <Cell key={idx} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="space-y-2">
                                                {citationEntries.map((t, i) => (
                                                    <div key={i} className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                                                            <span className="text-[var(--text-secondary)] truncate max-w-[120px]">{t.name}</span>
                                                        </div>
                                                        <span className="text-[var(--text-primary)] font-medium">{Math.round(t.value / total * 100)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* URLs Tab */}
                    {tab === 'urls' && (() => {
                        let allUrls = r.urlRanking?.urls || [];
                        if (allUrls.length === 0 && r.prompts?.length) {
                            const urlMap = {};
                            for (const p of r.prompts) {
                                for (const [eng, data] of Object.entries(p.engines || {})) {
                                    for (const cit of (data.citations || [])) {
                                        if (!cit.url) continue;
                                        if (!urlMap[cit.url]) {
                                            urlMap[cit.url] = {
                                                url: cit.url, domain: cit.domain || '', title: cit.title || '',
                                                isTargetBrand: cit.isTargetBrand || false, isCompetitor: cit.isCompetitor || false,
                                                category: cit.category || 'other', count: 0, engines: new Set(), promptCount: 0, _prompts: new Set(),
                                            };
                                        }
                                        urlMap[cit.url].count++;
                                        urlMap[cit.url].engines.add(eng);
                                        if (p.promptId) urlMap[cit.url]._prompts.add(p.promptId);
                                    }
                                }
                            }
                            allUrls = Object.values(urlMap)
                                .map(u => ({ ...u, engines: Array.from(u.engines), promptCount: u._prompts.size }))
                                .sort((a, b) => b.count - a.count);
                        }
                        const totalUrls = r.urlRanking?.totalUrls || allUrls.length;
                        const totalMentions = r.urlRanking?.totalMentions || allUrls.reduce((s, u) => s + u.count, 0);

                        return (
                        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-white font-semibold text-[15px] mb-0.5">URL Rankings & Citations</h3>
                                    <p className="text-[#666] text-[12px]">{totalUrls} unique URLs found across {totalMentions} citations</p>
                                </div>
                            </div>
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
                                        {allUrls.map((u, i) => (
                                            <tr key={i} className={`border-b border-[#1a1a1a] hover:bg-[#111] transition-colors ${u.isTargetBrand ? 'bg-green-500/5' : ''}`}>
                                                <td className="py-3 pl-5 pr-3 text-[#555] font-medium">{i + 1}</td>
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
                                                        {u.isTargetBrand ? 'Owned' : u.isCompetitor ? 'Competitor' : u.category || 'other'}
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
                        </div>
                        );
                    })()}

                    {/* Gaps Tab */}
                    {tab === 'gaps' && (
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                            <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">Competitive Gaps</h3>
                            <p className="text-[var(--text-muted)] text-xs mb-3">Queries where competitors appear but you don't — your content priorities</p>
                            <div className="space-y-2">
                                {(r.competitorGaps || []).map((g, i) => {
                                    const query = g.query || g.topic || (typeof g === 'string' ? g : '');
                                    const competitors = g.competitorsPresent || (Array.isArray(g.competitors) ? g.competitors.map(c => typeof c === 'string' ? { name: c, count: 1 } : c) : []);
                                    return (
                                        <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                            <p className="text-sm text-[var(--text-primary)] mb-1">"{query}"</p>
                                            {competitors.length > 0 && (
                                                <div className="flex gap-1 flex-wrap">
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
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
                                <h3 className="text-[var(--text-primary)] font-medium text-sm flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-400" /> AI-Powered Intelligence
                                </h3>
                                {r.intelligence.overallAssessment && (
                                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{r.intelligence.overallAssessment}</p>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {r.intelligence.strengthAreas?.length > 0 && (
                                        <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
                                            <h4 className="text-green-400 text-xs font-medium mb-2">Strengths</h4>
                                            <ul className="space-y-1">{r.intelligence.strengthAreas.map((s, i) => (
                                                <li key={i} className="text-[var(--text-secondary)] text-xs flex gap-1.5"><CheckCircle className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />{s}</li>
                                            ))}</ul>
                                        </div>
                                    )}
                                    {r.intelligence.weaknessAreas?.length > 0 && (
                                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                                            <h4 className="text-red-400 text-xs font-medium mb-2">Weaknesses</h4>
                                            <ul className="space-y-1">{r.intelligence.weaknessAreas.map((s, i) => (
                                                <li key={i} className="text-[var(--text-secondary)] text-xs flex gap-1.5"><AlertCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />{s}</li>
                                            ))}</ul>
                                        </div>
                                    )}
                                </div>
                                {r.intelligence.topOpportunities?.length > 0 && (
                                    <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                                        <h4 className="text-purple-400 text-xs font-medium mb-2">Top Opportunities</h4>
                                        <ul className="space-y-1.5">{r.intelligence.topOpportunities.map((s, i) => (
                                            <li key={i} className="text-[var(--text-secondary)] text-xs flex gap-1.5"><Star className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />{s}</li>
                                        ))}</ul>
                                    </div>
                                )}
                                {r.intelligence.engineInsights && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(r.intelligence.engineInsights).map(([eng, insight]) => (
                                            <div key={eng} className="p-2.5 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl">
                                                <span className="text-xs">{PI[eng]}</span>
                                                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">{insight}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
    );
}
