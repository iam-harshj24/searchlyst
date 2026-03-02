import React, { useState, useEffect } from 'react';
import {
    Eye, TrendingUp, Target, Zap, Loader2, Search, ChevronDown, ChevronRight,
    Users, BookOpen, Star, AlertCircle, Layers, BarChart3, Lightbulb, CheckCircle, Globe
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Button } from "@/components/ui/button";

const PI = { perplexity: '🔮', gemini: '✨', googleAI: '🔍' };
const EL = { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'Google AI' };

function ScoreRing({ score, size = 110, sw = 9 }) {
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;
    const off = circ - (score / 100) * circ;
    const col = score >= 60 ? '#22c55e' : score >= 30 ? '#f59e0b' : '#ef4444';
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={sw} fill="none" />
                <circle cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth={sw} fill="none"
                    strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[var(--text-primary)]">{score}</span>
                <span className="text-[9px] text-[var(--text-muted)]">/100</span>
            </div>
        </div>
    );
}

function ProgressBar({ phase, phaseDetail, progress, completedPrompts, totalPrompts }) {
    const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
    return (
        <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[var(--text-primary)] text-sm font-medium">
                        {phase === 'generating_prompts' ? '🧠 Generating smart prompts...' :
                            phase === 'querying' ? `🔍 Querying AI engines (${completedPrompts || 0}/${totalPrompts || '?'} prompts)` :
                                phase === 'analyzing' ? '📊 Running deep intelligence analysis...' : 'Starting scan...'}
                    </h3>
                    <p className="text-[var(--text-muted)] text-xs">{phaseDetail}</p>
                </div>
                {progress.total > 0 && <span className="text-[var(--text-secondary)] text-sm font-mono">{pct}%</span>}
            </div>
            {progress.total > 0 && (
                <div className="h-1.5 bg-[var(--surface-active)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 3)}%` }} />
                </div>
            )}
        </div>
    );
}

function QueryRow({ p }) {
    const [open, setOpen] = useState(false);
    const engines = p.engines || {};
    const mentionedCount = Object.values(engines).filter(e => e.mentioned).length;
    const totalEngines = Object.keys(engines).length;

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
            <tr onClick={() => setOpen(!open)} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group">
                <td className="py-3 pr-4 min-w-[200px]">
                    <div className="flex items-center gap-2">
                        {open ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 group-hover:text-[var(--text-secondary)]" />}
                        <div>
                            <p className="text-sm text-[var(--text-primary)] leading-tight group-hover:text-purple-300 transition-colors">{p.query}</p>
                            <div className="flex gap-2 mt-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${p.intent === 'geo_tracking' ? 'bg-purple-500/10 text-purple-300' :
                                    p.intent === 'sentiment' ? 'bg-blue-500/10 text-blue-300' :
                                        p.intent === 'comparison' ? 'bg-green-500/10 text-green-300' :
                                            p.intent === 'authority' ? 'bg-amber-500/10 text-amber-300' :
                                                p.intent === 'recommendation' ? 'bg-pink-500/10 text-pink-300' :
                                                    'bg-[var(--surface-active)] text-[var(--text-muted)]'
                                    }`}>{p.intent.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td className="py-3 px-4 w-[120px]">
                    <div className="flex gap-1">
                        {Object.entries(engines).map(([eng, data]) => (
                            <div key={eng} className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${data.mentioned ? 'bg-green-500/15 ring-1 ring-green-500/30 text-green-400' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                                }`} title={`${EL[eng]}: ${data.mentioned ? 'Mentioned' : 'Not Found'}`}>
                                {PI[eng]}
                            </div>
                        ))}
                    </div>
                </td>
                <td className="py-3 px-4 w-[80px]">
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <Globe className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase">Global</span>
                    </div>
                </td>
                <td className="py-3 px-4 w-[100px] text-center">
                    <span className={`text-xs font-medium ${mentionedCount > 0 ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                        {mentionedCount}/{totalEngines}
                    </span>
                </td>
                <td className="py-3 px-4 w-[120px]">
                    {totalSent > 0 ? (
                        <div className="flex items-center gap-1">
                            <div className="flex-1 h-2 flex rounded-full overflow-hidden">
                                {pos > 0 && <div className="bg-green-500" style={{ flex: pos }} />}
                                {neut > 0 && <div className="bg-yellow-500" style={{ flex: neut }} />}
                                {neg > 0 && <div className="bg-red-500" style={{ flex: neg }} />}
                            </div>
                        </div>
                    ) : (
                        <span className="text-[var(--text-muted)] text-[10px]">-</span>
                    )}
                </td>
                <td className="py-3 pl-4 text-right">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors ${totalCitations > 0
                        ? 'bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/20'
                        : 'bg-[var(--surface-hover)] border-[var(--border)] group-hover:bg-[var(--surface-active)]'
                        }`}>
                        <BookOpen className={`w-3 h-3 ${totalCitations > 0 ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`} />
                        <span className={`text-xs font-mono ${totalCitations > 0 ? 'text-blue-400 font-medium' : 'text-[var(--text-secondary)]'}`}>{totalCitations}</span>
                    </div>
                </td>
            </tr>
            {open && (
                <tr className="bg-[var(--surface-hover)]">
                    <td colSpan={6} className="p-4 border-b border-[var(--border)]">
                        <div className="space-y-3">
                            <h4 className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Engine Responses & Citations</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {Object.entries(engines).map(([eng, data]) => (
                                    <div key={eng} className={`p-3 rounded-xl border flex flex-col ${data.mentioned ? 'bg-green-500/5 border-green-500/10' : 'bg-[var(--surface-hover)] border-[var(--border)]'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm">{PI[eng]}</span>
                                                <span className="text-xs text-[var(--text-secondary)] font-medium">{EL[eng]}</span>
                                            </div>
                                            {data.mentioned ? (
                                                <div className="flex gap-1.5">
                                                    <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">Mentioned</span>
                                                    {data.sentiment && data.sentiment !== 'n/a' && data.sentiment !== 'neutral' && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${data.sentiment === 'positive' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{data.sentiment}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[9px] bg-[var(--surface-active)] text-[var(--text-muted)] px-1.5 py-0.5 rounded">Not found</span>
                                            )}
                                        </div>
                                        {data.snippet ? (
                                            <div className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed italic border-l-2 border-[var(--border)] pl-2 py-1 flex-1">
                                                "{data.snippet}"
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-[10px] text-[var(--text-muted)] flex-1">No specific mention snippet extracted.</p>
                                        )}

                                        {/* Source Citations for this Engine */}
                                        {data.citations && data.citations.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                                <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" /> Sources Cited</span>
                                                <ul className="space-y-1">
                                                    {data.citations.map((cit, idx) => (
                                                        <li key={idx} className="flex items-center gap-1.5">
                                                            <div className="w-3 h-3 rounded bg-[var(--surface-active)] flex items-center justify-center overflow-hidden shrink-0">
                                                                <img src={`https://www.google.com/s2/favicons?domain=${cit.domain}&sz=16`} className="w-2.5 h-2.5" onError={ev => { ev.target.style.display = 'none' }} alt="" />
                                                            </div>
                                                            <a href={cit.url} target="_blank" rel="noreferrer" className={`text-[10px] truncate hover:underline ${cit.isTargetBrand ? 'text-green-400 font-medium' : 'text-blue-400/80'}`}>
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
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
        startScan,
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

    // AUTO-START: Trigger scan on mount when user data exists but no cached result
    useEffect(() => {
        if (status === 'idle' && !result && domain && user?.brandName && user?.industry) {
            console.log('[AIVisibility] Auto-starting scan for', domain);
            startScan();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        { k: 'prompts', l: 'Prompts', i: Search },
        { k: 'entities', l: 'Entities', i: Users },
        { k: 'citations', l: 'Citations', i: BookOpen },
        { k: 'gaps', l: 'Gaps', i: AlertCircle },
        ...(r?.intelligence ? [{ k: 'intelligence', l: 'AI Insights', i: Lightbulb }] : []),
    ];

    return (
        <div className="space-y-5 max-w-7xl">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Eye className="w-5 h-5 text-purple-400" /> AI Visibility Intelligence
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                        Track <span className="text-[var(--text-secondary)]">{brandName}</span> across Perplexity, Gemini & Google AI
                    </p>
                </div>
                <Button onClick={startScan} disabled={status === 'scanning' || !domain}
                    className="bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] rounded-xl px-5">
                    {status === 'scanning' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    {r ? 'Re-scan' : 'Start Scan'}
                </Button>
            </div>

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
                    <Eye className="w-12 h-12 text-purple-400/20 mx-auto mb-3" />
                    <h3 className="text-[var(--text-primary)] font-medium text-lg mb-1">Check Your AI Visibility</h3>
                    <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto mb-1.5">
                        Gemini 2.5 Flash generates smart prompts, queries 3 AI platforms, and analyzes brand mentions in real-time.
                    </p>
                    <p className="text-[var(--text-muted)] text-xs mb-5">~18 API calls • Results update live as each prompt completes</p>
                    <Button onClick={startScan} disabled={!domain} className="bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] rounded-xl px-8">
                        <Zap className="w-4 h-4 mr-2" /> Start Scan
                    </Button>
                </div>
            )}

            {r && (
                <>
                    {/* Top Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center">
                            <ScoreRing score={r.score?.overall || 0} />
                            <span className="text-[9px] text-[var(--text-muted)] mt-1">
                                {status === 'scanning' ? `${completedPrompts}/${totalPrompts} done` : `${r.config?.totalCalls || '?'} calls`}
                            </span>
                        </div>

                        {Object.entries(r.platformBreakdown || {}).map(([k, p]) => (
                            <div key={k} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span>{PI[k]}</span>
                                    <span className="text-[var(--text-secondary)] text-[11px]">{p.name}</span>
                                </div>
                                <span className="text-2xl font-bold text-[var(--text-primary)]">{p.score || 0}</span>
                                <span className="text-[var(--text-muted)] text-xs">%</span>
                                <div className="mt-2 h-1 bg-[var(--surface-active)] rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-700 ${(p.score || 0) >= 50 ? 'bg-green-500' : (p.score || 0) > 0 ? 'bg-amber-500' : 'bg-[var(--surface-active)]'
                                        }`} style={{ width: `${Math.max(p.score || 0, 3)}%` }} />
                                </div>
                                <span className="text-[9px] text-[var(--text-muted)] mt-1 block">{p.mentions || 0}/{p.runs || 0}</span>
                            </div>
                        ))}

                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4">
                            <span className="text-[var(--text-secondary)] text-[11px]">Share of Voice</span>
                            <div className="mt-1">
                                {sovData.slice(0, 4).map((s, i) => (
                                    <div key={i} className="flex items-center justify-between text-[10px] py-0.5">
                                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.fill }} /><span className="text-[var(--text-secondary)] truncate max-w-[70px]">{s.name}</span></span>
                                        <span className="text-[var(--text-secondary)] font-medium">{s.sov}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-0.5 p-0.5 bg-[var(--surface-hover)] rounded-xl overflow-x-auto">
                        {tabs.map(t => {
                            const I = t.i;
                            return (
                                <button key={t.k} onClick={() => setTab(t.k)}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${tab === t.k ? 'bg-purple-500/15 text-purple-300' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                        }`}><I className="w-3.5 h-3.5" />{t.l}</button>
                            );
                        })}
                    </div>

                    {/* Overview Tab */}
                    {tab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 relative">
                                <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">AI Visibility Score</h3>
                                <p className="text-[var(--text-secondary)] text-[10px] mb-4">How often your brand appears in AI responses</p>
                                <div className="absolute top-5 right-5 text-2xl font-bold text-[var(--text-primary)]">
                                    {r.score?.overall || 0}%
                                </div>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={trendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 100]} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                            <Bar dataKey="score" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 overflow-hidden">
                                <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">Industry Ranking</h3>
                                <p className="text-[var(--text-secondary)] text-[10px] mb-4">Brands with highest visibility</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                                                <th className="pb-2 font-medium">#</th>
                                                <th className="pb-2 font-medium">BRAND</th>
                                                <th className="pb-2 font-medium text-right">MENTIONS</th>
                                                <th className="pb-2 font-medium text-right">POSITION</th>
                                                <th className="pb-2 font-medium text-right">CHANGE</th>
                                                <th className="pb-2 font-medium text-right">VISIBILITY</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {[r.shareOfVoice?.brand, ...(r.shareOfVoice?.competitors || [])]
                                                .sort((a, b) => (b?.sov || 0) - (a?.sov || 0))
                                                .map((item, i) => {
                                                    if (!item) return null;
                                                    const isTarget = item.name === (r.shareOfVoice?.brand?.name || brandName);
                                                    return (
                                                        <tr key={i} className={`group hover:bg-[var(--surface-hover)] transition-colors ${isTarget ? 'bg-purple-500/5' : ''}`}>
                                                            <td className="py-2.5 text-[var(--text-secondary)]">{i + 1}</td>
                                                            <td className="py-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded bg-[var(--surface-active)] flex items-center justify-center overflow-hidden">
                                                                        {item.domain ? <img src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`} className="w-3 h-3" onError={ev => { ev.target.style.display = 'none' }} alt="" /> : <Globe className="w-2.5 h-2.5 text-[var(--text-muted)]" />}
                                                                    </div>
                                                                    <span className={`truncate max-w-[120px] ${isTarget ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-primary)]'}`}>{item.name}</span>
                                                                    {isTarget && <span className="text-[8px] bg-[var(--surface-active)] px-1 py-0.5 rounded text-[var(--text-secondary)]">YOU</span>}
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 text-right text-[var(--text-primary)]">{item.mentions || 0}</td>
                                                            <td className="py-2.5 text-right text-[var(--text-primary)]">{item.avgPosition || '-'}</td>
                                                            <td className="py-2.5 text-right text-green-400">{item.change || '+0.0%'}</td>
                                                            <td className="py-2.5 text-right text-[var(--text-primary)] font-medium">{item.sov || 0}%</td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                                <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">Share of Voice</h3>
                                <p className="text-[var(--text-secondary)] text-[10px] mb-4">Mentions of your brand vs competitors</p>
                                <div className="absolute top-5 right-5 text-2xl font-bold text-[var(--text-primary)]">
                                    {sovData[0]?.sov || 0}%
                                </div>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={sovData.slice(0, 5)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.substring(0, 10) + (v.length > 10 ? '…' : '')} />
                                            <YAxis tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                            <Bar dataKey="sov" radius={[4, 4, 0, 0]}>
                                                {sovData.slice(0, 5).map((e, i) => <Cell key={i} fill={e.fill} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex gap-3 justify-center mt-3">
                                    {sovData.slice(0, 5).map((s, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[9px]">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.fill }} />
                                            <span className="text-[var(--text-secondary)]">{s.name.substring(0, 8)} {s.sov}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 overflow-hidden">
                                <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">Share of Voice Ranking</h3>
                                <p className="text-[var(--text-secondary)] text-[10px] mb-4">Brands with highest share of voice</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                                                <th className="pb-2 font-medium">#</th>
                                                <th className="pb-2 font-medium">BRAND</th>
                                                <th className="pb-2 font-medium text-right">SENTIMENT</th>
                                                <th className="pb-2 font-medium text-right">SHARE</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {[r.shareOfVoice?.brand, ...(r.shareOfVoice?.competitors || [])]
                                                .sort((a, b) => (b?.sov || 0) - (a?.sov || 0))
                                                .map((item, i) => {
                                                    if (!item) return null;
                                                    const isTarget = item.name === (r.shareOfVoice?.brand?.name || brandName);
                                                    return (
                                                        <tr key={i} className={`group hover:bg-[var(--surface-hover)] transition-colors ${isTarget ? 'bg-purple-500/5' : ''}`}>
                                                            <td className="py-2.5 text-[var(--text-secondary)]">{i + 1}</td>
                                                            <td className="py-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded bg-[var(--surface-active)] flex items-center justify-center overflow-hidden">
                                                                        {item.domain ? <img src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`} className="w-3 h-3" onError={ev => { ev.target.style.display = 'none' }} alt="" /> : <Globe className="w-2.5 h-2.5 text-[var(--text-muted)]" />}
                                                                    </div>
                                                                    <span className={`truncate max-w-[150px] ${isTarget ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-primary)]'}`}>{item.name}</span>
                                                                    {isTarget && <span className="text-[8px] bg-[var(--surface-active)] px-1 py-0.5 rounded text-[var(--text-secondary)]">YOU</span>}
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 text-right">
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.sentiment >= 75 ? 'bg-green-500/10 text-green-400' :
                                                                    item.sentiment >= 45 ? 'bg-yellow-500/10 text-yellow-400' :
                                                                        'bg-red-500/10 text-red-400'
                                                                    }`}>{item.sentiment || 50}</span>
                                                            </td>
                                                            <td className="py-2.5 text-right text-[var(--text-primary)] font-medium">{item.sov || 0}%</td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prompts Tab */}
                    {tab === 'prompts' && (
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 overflow-hidden">
                            <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">Tracked Queries</h3>
                            <p className="text-[var(--text-secondary)] text-[10px] mb-4">All {r.prompts?.length || 0} prompts currently being monitored</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                                            <th className="pb-2 font-medium">QUERY</th>
                                            <th className="pb-2 font-medium">ENGINES</th>
                                            <th className="pb-2 font-medium">LOCATIONS</th>
                                            <th className="pb-2 font-medium text-center">MENTIONED</th>
                                            <th className="pb-2 font-medium w-24">SENTIMENT</th>
                                            <th className="pb-2 font-medium text-right pr-2">CITATIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {(r.prompts || []).map((p, i) => <QueryRow key={i} p={p} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Entities Tab */}
                    {tab === 'entities' && (
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                            <h3 className="text-[var(--text-primary)] font-medium text-sm mb-3">Brands Detected in AI Responses</h3>
                            <div className="space-y-1.5">
                                {(r.entityGraph || []).map((e, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${e.isTargetBrand ? 'bg-purple-500/8 border border-purple-500/15' :
                                        e.isCompetitor ? 'bg-blue-500/5 border border-blue-500/10' :
                                            'bg-[var(--surface-hover)] border border-[var(--border)]'
                                        }`}>
                                        <div className="w-6 h-6 rounded bg-[var(--surface-active)] flex items-center justify-center shrink-0">
                                            {e.domain ? <img src={`https://www.google.com/s2/favicons?domain=${e.domain}&sz=32`} className="w-3.5 h-3.5" onError={ev => { ev.target.style.display = 'none' }} alt="" />
                                                : <Globe className="w-3 h-3 text-[var(--text-muted)]" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm text-[var(--text-primary)] truncate block">{e.name}</span>
                                            {e.domain && <span className="text-[9px] text-[var(--text-muted)]">{e.domain}</span>}
                                        </div>
                                        {e.isTargetBrand && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 rounded">You</span>}
                                        {e.isCompetitor && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 rounded">Competitor</span>}
                                        <span className="text-sm text-[var(--text-primary)] font-medium">{e.totalMentions}</span>
                                        <span className="text-[9px] text-[var(--text-muted)]">in {e.queryCount} queries</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                                                <img src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=16`} className="w-3 h-3" onError={ev => { ev.target.style.display = 'none' }} alt="" />
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
                                {(r.competitorGaps || []).map((g, i) => (
                                    <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                        <p className="text-sm text-[var(--text-primary)] mb-1">"{g.query}"</p>
                                        <div className="flex gap-1 flex-wrap">
                                            {g.competitorsPresent.map((c, j) => (
                                                <span key={j} className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{c.name} ({c.count}x)</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
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
    );
}
