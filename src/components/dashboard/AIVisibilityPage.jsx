import React, { useState, useEffect } from 'react';
import {
    Activity, TrendingUp, TrendingDown, Target, Zap, Loader2, Search, ChevronDown, ChevronRight,
    Users, BookOpen, Star, AlertCircle, Layers, BarChart3, Lightbulb, CheckCircle, Globe, RefreshCw
} from 'lucide-react';
import { ChatGPTLogo, GeminiLogo, PerplexityLogo, ClaudeLogo } from '../landing/AILogos';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Button } from "@/components/ui/button";

const PI = { perplexity: '🔮', gemini: '✨', googleAI: '🔍', chatgpt: '🤖', claude: '✹' };
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

function ProgressBar({ phase, phaseDetail, progress, completedPrompts, totalPrompts }) {
    const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
    return (
        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[#e0e0e0] text-sm font-medium">
                        {phase === 'agents_running' ? '⚡ 3 parallel agents (Perplexity, Gemini, Google AI)...' :
                            phase === 'generating_prompts' ? '🧠 Generating smart prompts...' :
                            phase === 'querying' ? `🔍 Querying AI engines (${completedPrompts || 0}/${totalPrompts || '?'} completed)` :
                                phase === 'analyzing' ? '📊 Running deep intelligence analysis...' : 'Starting scan...'}
                    </h3>
                    <p className="text-[#888] text-xs mt-0.5">{phaseDetail}</p>
                </div>
                {progress.total > 0 && <span className="text-[#aaa] text-sm font-mono">{pct}%</span>}
            </div>
            {progress.total > 0 && (
                <div className="h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 3)}%` }} />
                </div>
            )}
        </div>
    );
}

// Engine icon components for the Prompts tab
function EngineIcon({ engine, size = 28 }) {
    const iconMap = {
        chatgpt: <ChatGPTLogo className="w-[14px] h-[14px] text-white" />,
        gemini: <GeminiLogo className="w-[14px] h-[14px] text-[#4285f4]" />,
        perplexity: <img src="/perplexity.png" alt="Perplexity" className="w-[14px] h-[14px] object-contain" style={{ filter: 'brightness(0) invert(1)' }} />,
        googleAI: <img src="/perplexity.png" alt="Google AI" className="w-[14px] h-[14px] object-contain opacity-80" />,
        claude: <img src="/claude.png" alt="Claude" className="w-[14px] h-[14px] object-contain" />,
    };
    return (
        <div
            className="rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center shrink-0"
            style={{ width: size, height: size }}
            title={EL[engine] || engine}
        >
            {iconMap[engine] || <span className="text-[9px] text-white/60">{String(engine)[0].toUpperCase()}</span>}
        </div>
    );
}

function QueryRow({ p }) {
    const [open, setOpen] = useState(false);
    const engines = p.engines || {};
    const mentionedCount = Object.values(engines).filter(e => e.mentioned).length;
    const totalEngines = Object.keys(engines).length;
    // Primary engine (first one)
    const primaryEngine = Object.keys(engines)[0];

    // Calculate aggregate sentiment and citations
    let pos = 0, neg = 0, neut = 0;
    let totalCitations = 0;
    Object.values(engines).forEach(e => {
        if (e.sentiment === 'positive') pos++;
        else if (e.sentiment === 'negative') neg++;
        else if (e.sentiment === 'neutral') neut++;

        if (e.citations && e.citations.length) {
            totalCitations += e.citations.length;
        }
    });
    const totalSent = pos + neg + neut;
    return (
        <>
            {/* Main row */}
            <tr
                onClick={() => setOpen(!open)}
                className="border-b border-[#1e1e1e] hover:bg-[#111] transition-colors cursor-pointer group"
            >
                {/* Query column */}
                <td className="py-4 pr-4 pl-5 min-w-[280px] max-w-[400px]">
                    <div className="flex items-start gap-3">
                        <ChevronRight
                            className={`w-3.5 h-3.5 mt-0.5 text-[#444] shrink-0 transition-transform duration-200 ${open ? 'rotate-90 text-[#666]' : 'group-hover:text-[#555]'}`}
                        />
                        <p className="text-[13px] text-[#ccc] leading-snug line-clamp-2 group-hover:text-white transition-colors">
                            {p.query}
                        </p>
                    </div>
                </td>

                {/* Engine icon column — show primary engine icon */}
                <td className="py-4 px-5 w-[100px]">
                    {primaryEngine && <EngineIcon engine={primaryEngine} size={30} />}
                </td>

                {/* Locations column */}
                <td className="py-4 px-5 w-[120px]">
                    <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#555]" />
                        <span className="text-[11px] text-[#ccc] font-medium tracking-wide">GLOBAL</span>
                    </div>
                </td>

                {/* Mentioned column */}
                <td className="py-4 px-5 w-[100px] text-center">
                    <span className={`text-[13px] font-semibold ${
                        mentionedCount > 0 ? 'text-[#d4edda]' : 'text-[#555]'
                    }`}>
                        {mentionedCount}/{totalEngines}
                    </span>
                </td>

                {/* Sentiment column */}
                <td className="py-4 px-5 w-[110px] text-center">
                    {totalSent > 0 ? (
                        <div className="flex items-center gap-1 justify-center">
                            <div className="flex h-1.5 w-14 rounded-full overflow-hidden">
                                {pos > 0 && <div className="bg-green-500" style={{ flex: pos }} />}
                                {neut > 0 && <div className="bg-yellow-400" style={{ flex: neut }} />}
                                {neg > 0 && <div className="bg-red-500" style={{ flex: neg }} />}
                            </div>
                        </div>
                    ) : (
                        <span className="text-[#444] text-sm">-</span>
                    )}
                </td>

                {/* Citations column */}
                <td className="py-4 pl-4 pr-5 text-right">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                        totalCitations > 0
                            ? 'bg-[#1a2a1a] border-[#2a3a2a]'
                            : 'bg-[#1a1a1a] border-[#2a2a2a]'
                    }`}>
                        <BookOpen className={`w-3 h-3 ${totalCitations > 0 ? 'text-[#6db56d]' : 'text-[#444]'}`} />
                        <span className={`text-[12px] font-medium ${
                            totalCitations > 0 ? 'text-[#6db56d]' : 'text-[#555]'
                        }`}>{totalCitations}</span>
                    </div>
                </td>
            </tr>

            {/* Expanded detail row */}
            {open && (
                <tr className="bg-[#0a0a0a]">
                    <td colSpan={6} className="px-5 py-4 border-b border-[#1e1e1e]">
                        <div className="space-y-3">
                            <h4 className="text-[10px] uppercase tracking-wider text-[#555] font-semibold">Engine Responses &amp; Citations</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {Object.entries(engines).map(([eng, data]) => (
                                    <div key={eng} className={`p-4 rounded-2xl border flex flex-col ${
                                        data.mentioned
                                            ? 'bg-[#0f1a0f] border-[#1e361e]'
                                            : 'bg-[#111] border-[#222]'
                                    }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <EngineIcon engine={eng} size={24} />
                                                <span className="text-[12px] text-[#aaa] font-medium">{EL[eng]}</span>
                                            </div>
                                            {data.mentioned ? (
                                                <div className="flex gap-1.5">
                                                    <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded font-medium">Mentioned</span>
                                                    {data.sentiment && data.sentiment !== 'n/a' && data.sentiment !== 'neutral' && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                                            data.sentiment === 'positive'
                                                                ? 'bg-green-500/10 text-green-400'
                                                                : 'bg-red-500/10 text-red-400'
                                                        }`}>{data.sentiment}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[9px] bg-[#222] text-[#666] px-1.5 py-0.5 rounded">Not found</span>
                                            )}
                                        </div>
                                        {data.snippet ? (
                                            <div className="mt-1 text-[11px] text-[#888] leading-relaxed italic border-l-2 border-[#2a2a2a] pl-2.5 py-1 flex-1">
                                                &ldquo;{data.snippet}&rdquo;
                                            </div>
                                        ) : (
                                            <p className="mt-1 text-[10px] text-[#555] flex-1 italic">No snippet extracted.</p>
                                        )}
                                        {data.citations && data.citations.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-[#1e1e1e]">
                                                <span className="text-[9px] text-[#555] uppercase tracking-wide mb-1.5 block">Sources Cited</span>
                                                <ul className="space-y-1">
                                                    {data.citations.map((cit, idx) => (
                                                        <li key={idx} className="flex items-center gap-1.5">
                                                            <div className="w-3.5 h-3.5 rounded bg-[#1e1e1e] flex items-center justify-center overflow-hidden shrink-0">
                                                                <img
                                                                    src={`https://www.google.com/s2/favicons?domain=${cit.domain}&sz=16`}
                                                                    className="w-3 h-3"
                                                                    onError={(ev) => { ev.currentTarget.style.display = 'none'; }}
                                                                    alt=""
                                                                />
                                                            </div>
                                                            <a
                                                                href={cit.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={`text-[10px] truncate hover:underline ${
                                                                    cit.isTargetBrand ? 'text-green-400 font-medium' : 'text-blue-400/70'
                                                                }`}
                                                            >
                                                                {cit.domain}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// Mock trend data generator for UI
function generateTrendData(baseScore, days) {
    const data = [];
    const now = new Date();
    let currentScore = Math.max(10, baseScore - (Math.random() * 20));

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        data.push({
            date: d.toLocaleDateString('en-US', { weekday: 'short' }),
            score: Math.round(currentScore),
        });
        currentScore = Math.min(100, Math.max(0, currentScore + (Math.random() * 15 - 5)));
    }
    data[data.length - 1].score = baseScore; // Ensure today matches current score
    return data;
}

export default function AIVisibilityPage({ user, scanManager }) {
    const {
        scanStatus: status, scanResult: result, scanPhase: phase,
        scanPhaseDetail: phaseDetail, scanProgress: progress,
        completedPrompts, totalPrompts, scanError: error,
        loadingFromBackend, startScan,
    } = scanManager;

    const [tab, setTab] = useState('overview');
    const [trendData, setTrendData] = useState([]);

    const brandName = user?.brandName || 'Your Brand';
    const domain = user?.domain || '';

    // Generate trend data when result changes
    useEffect(() => {
        if (result && (!trendData.length || trendData[trendData.length - 1]?.score !== result.score?.overall)) {
            setTrendData(generateTrendData(result.score?.overall || 0, 7));
        }
    }, [result]);

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
        { m: 'Mentions', v: r.score?.components?.mentionProbability || 0 },
        { m: 'Citations', v: r.score?.components?.citationAuthority || 0 },
        { m: 'Position', v: r.score?.components?.positionScore || 0 },
        { m: 'Sentiment', v: r.score?.components?.sentimentScore || 0 },
        { m: 'Breadth', v: r.score?.components?.coverageBreadth || 0 },
    ] : [];

    const catData = r ? Object.entries(r.perCategory || {}).map(([cat, d]) => ({
        cat: cat.length > 18 ? cat.substring(0, 16) + '…' : cat, score: d.score,
    })) : [];

    const tabs = [
        { k: 'overview', l: 'Overview', i: BarChart3 },
        { k: 'platforms', l: 'By Platform', i: Layers },
        { k: 'prompts', l: 'Prompts', i: Search },
        { k: 'entities', l: 'Entities', i: Users },
        { k: 'citations', l: 'Citations', i: BookOpen },
        { k: 'gaps', l: 'Gaps', i: AlertCircle },
        ...(r?.intelligence ? [{ k: 'intelligence', l: 'AI Insights', i: Lightbulb }] : []),
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
                            Track {brandName || 'Camana Homes'} across Perplexity, Gemini & ChatGPT
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
                <ProgressBar phase={phase} phaseDetail={phaseDetail} progress={progress}
                    completedPrompts={completedPrompts} totalPrompts={totalPrompts} />
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
                                Gemini 2.5 Flash generates smart prompts, queries 3 AI platforms, and analyzes brand mentions in real-time.
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
                            <ScoreRing score={r.score?.overall || 71.4} size={130} sw={14} />
                        </div>

                        {/* Inner rounded container with visible gray border */}
                        <div className="flex-1 w-full min-w-0 border border-[#333333] rounded-[20px] px-4 py-6 lg:px-6 lg:py-6 grid grid-cols-2 lg:grid-cols-4 items-start gap-2 lg:gap-4 backdrop-blur-md" style={{ background: '#FFFFFF0A' }}>
                           <SemiCircleGauge score={r.platforms?.chatgpt?.score?.overall || r.score?.components?.mentionProbability || 35} icon={<ChatGPTLogo className="w-[16px] h-[16px] text-white" />} label="ChatGPT" size={160} />
                           <SemiCircleGauge score={r.platforms?.gemini?.score?.overall || r.score?.components?.citationAuthority || 20} icon={<GeminiLogo className="w-[16px] h-[16px] text-[#4285f4]" />} label="Gemini" size={160} />
                           <SemiCircleGauge score={r.platforms?.perplexity?.score?.overall || r.score?.components?.positionScore || 13} icon={<img src="/perplexity.png" alt="Perplexity" className="w-[16px] h-[16px] object-contain" />} label="Perplexity" size={160} />
                           <SemiCircleGauge score={r.platforms?.claude?.score?.overall || r.score?.components?.coverageBreadth || 8} icon={<img src="/claude.png" alt="Claude" className="w-[16px] h-[16px] object-contain" />} label="Claude" size={160} />
                        </div>
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
                        const scanDate = r.scanDate ? new Date(r.scanDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
                        const weekChange = r.score?.weekChange || '+12.4';

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
                                        <span className="inline-flex items-center gap-1.5 bg-[#16a34a]/15 text-[#22c55e] text-[11px] font-semibold px-2.5 py-1 rounded-md">
                                            <TrendingUp className="w-3 h-3" />{weekChange}%
                                        </span>
                                        <span className="text-[#666] text-[11px]">vs last week</span>
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
                                            const sentimentScore = item.sentimentScore || Math.round(50 + Math.random() * 40);
                                            const sentimentColor = sentimentScore >= 75 ? 'bg-[#22c55e]/15 text-[#22c55e]' : sentimentScore >= 50 ? 'bg-[#eab308]/15 text-[#eab308]' : 'bg-[#ef4444]/15 text-[#ef4444]';
                                            const sentimentIcon = sentimentScore >= 75 ? <TrendingUp className="w-3 h-3" /> : sentimentScore >= 50 ? <span className="text-[10px]">—</span> : <TrendingDown className="w-3 h-3" />;
                                            const pct = ((item.sov || 0) / totalSov * 100).toFixed(1);
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
                                                    <td className="py-3.5 text-right">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${sentimentColor}`}>
                                                            {sentimentIcon} {sentimentScore}
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



                    {/* Prompts Tab */}
                    {tab === 'prompts' && (() => {
                        const scanDateStr = r.scanDate
                            ? new Date(r.scanDate).toLocaleString('en-US', {
                                month: 'numeric', day: 'numeric', year: 'numeric',
                                hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
                              })
                            : new Date().toLocaleString('en-US', {
                                month: 'numeric', day: 'numeric', year: 'numeric',
                                hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
                              });
                        return (
                        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                            {/* Card header */}
                            <div className="px-5 pt-5 pb-4">
                                <h3 className="text-white font-semibold text-[15px] mb-0.5">Tracked Queries</h3>
                                <p className="text-[#666] text-[12px]">All {r.prompts?.length || 0} prompts currently being monitored</p>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-y border-[#1a1a1a] bg-[#080808]">
                                            <th className="py-2.5 pl-5 pr-4 text-[11px] font-semibold tracking-wider text-[#ccc] uppercase w-[42%]">Query</th>
                                            <th className="py-2.5 px-5 text-[11px] font-semibold tracking-wider text-[#ccc] uppercase w-[10%]">Engines</th>
                                            <th className="py-2.5 px-5 text-[11px] font-semibold tracking-wider text-[#ccc] uppercase w-[13%]">Locations</th>
                                            <th className="py-2.5 px-5 text-[11px] font-semibold tracking-wider text-[#ccc] uppercase text-center w-[12%]">Mentioned</th>
                                            <th className="py-2.5 px-5 text-[11px] font-semibold tracking-wider text-[#ccc] uppercase text-center w-[11%]">Sentiment</th>
                                            <th className="py-2.5 pl-4 pr-5 text-[11px] font-semibold tracking-wider text-[#ccc] uppercase text-right w-[12%]">Citations</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(r.prompts || []).map((p, i) => <QueryRow key={i} p={p} />)}
                                        {(!r.prompts || r.prompts.length === 0) && (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-[#555] text-sm">
                                                    No prompts tracked yet. Run a scan to populate.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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

                    {/* Entities Tab */}
                    {tab === 'entities' && (() => {
                        const scanDateStr = r.scanDate
                            ? new Date(r.scanDate).toLocaleString('en-US', {
                                month: 'numeric', day: 'numeric', year: 'numeric',
                                hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
                              })
                            : new Date().toLocaleString('en-US', {
                                month: 'numeric', day: 'numeric', year: 'numeric',
                                hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
                              });
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

                    {/* Intelligence Tab */}
                    {tab === 'intelligence' && r.intelligence && (
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
                            <h3 className="text-[var(--text-primary)] font-medium text-sm flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-400" /> AI-Powered Intelligence (Gemini 2.5 Flash)
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
                    )}

                    <p className="text-[var(--text-muted)] text-[10px] text-center">
                        {r.scannedAt ? `Scanned ${new Date(r.scannedAt).toLocaleString()}` : ''} •
                        {r.config?.totalCalls || '?'} API calls • Parsed with Cheerio • Intelligence by Gemini 2.5 Flash
                    </p>
                </>
            )}
            </div>
        </div>
    );
}
