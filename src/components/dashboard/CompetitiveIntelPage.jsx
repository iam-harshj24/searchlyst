import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Sparkles, Users, AlertCircle } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { apiClient } from '@/api/apiClient';
import { promptPreview } from '@/lib/promptPreview';

function getVisibilityData(domain, projectId) {
    try {
        const key = `searchlyst_visibility_${domain || 'default'}_${projectId ?? 'default'}`;
        let saved = localStorage.getItem(key);
        if (!saved && (projectId == null || projectId === 'default')) {
            saved = localStorage.getItem(`searchlyst_visibility_${domain || 'default'}`);
        }
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse bg-[#1a1a1a] rounded ${className}`} />;
}

const SUB_TABS = [
    { k: 'entities', l: 'Entities', i: Users },
    { k: 'gaps', l: 'Gaps', i: AlertCircle },
    { k: 'insights', l: 'AI insights', i: Sparkles },
];

const NORM = (s) => String(s || '').trim().toLowerCase();

/** Aggregate mention leaders across completed scans → multi-series chart data (like SOV entities competing over time). */
function buildCompetitorMentionTrend(scanHistory, brandName, sovBrandName) {
    const hist = Array.isArray(scanHistory) ? scanHistory : [];
    if (hist.length < 1) return { data: [], keys: [], yourNorms: new Set() };

    const yourNorms = new Set();
    for (const x of [brandName, sovBrandName]) {
        const n = NORM(x);
        if (n) yourNorms.add(n);
    }
    for (const h of hist) {
        for (const row of h.mentionLeaders || []) {
            if (row?.isYou && row?.name) yourNorms.add(NORM(row.name));
        }
    }

    const nameTotals = {};
    for (const h of hist) {
        for (const row of h.mentionLeaders || []) {
            if (!row?.name) continue;
            const n = String(row.name);
            nameTotals[n] = (nameTotals[n] || 0) + (Number(row.mentions) || 0);
        }
    }

    const sorted = Object.entries(nameTotals).sort((a, b) => b[1] - a[1]);
    let keys = sorted.slice(0, 6).map(([k]) => k);

    const anchorName = sorted.find(([k]) => yourNorms.has(NORM(k)))?.[0];
    if (anchorName && !keys.includes(anchorName)) {
        keys = [anchorName, ...keys.filter((k) => NORM(k) !== NORM(anchorName))].slice(0, 6);
    }

    if (keys.length === 0) return { data: [], keys: [], yourNorms };

    /** Chronological order (API usually sends this; enforce for correct line direction). */
    const histSorted = [...hist].sort((a, b) => {
        const ta = a?.date ? new Date(a.date).getTime() : 0;
        const tb = b?.date ? new Date(b.date).getTime() : 0;
        return ta - tb;
    });

    /**
     * Axis labels: UTC calendar date (matches stored `created_at` day, avoids local TZ shifting the day).
     * Multiple scans the same UTC day get (#2), (#3), … so Recharts never merges distinct points.
     */
    const utcDayCount = {};
    const data = histSorted.map((h) => {
        const d = h?.date ? new Date(h.date) : null;
        let date = '—';
        let sortKey = 0;
        if (d && !Number.isNaN(d.getTime())) {
            sortKey = d.getTime();
            const y = d.getUTCFullYear();
            const mo = d.getUTCMonth();
            const day = d.getUTCDate();
            const calKey = `${y}-${mo + 1}-${day}`;
            utcDayCount[calKey] = (utcDayCount[calKey] || 0) + 1;
            const n = utcDayCount[calKey];
            date = new Date(Date.UTC(y, mo, day)).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
            });
            if (n > 1) date = `${date} (#${n})`;
        }
        const pt = { date, sortKey, scanAt: h?.date };
        const map = Object.fromEntries(
            (h.mentionLeaders || []).map((x) => [String(x.name), Number(x.mentions) || 0]),
        );
        for (const k of keys) {
            pt[k] = map[k] ?? 0;
        }
        return pt;
    });

    return { data, keys, yourNorms };
}

const STROKE_YOU = '#E92A15';
const STROKE_PEERS = ['#3b82f6', '#22c55e', '#a855f7', '#eab308', '#06b6d4', '#f97316'];

function CompetitorMentionsTrendChart({ data, keys, yourNorms }) {
    if (!keys.length || !data.length) return null;

    const lineStyles = {};
    let peerIdx = 0;
    for (const name of keys) {
        if (yourNorms.has(NORM(name))) {
            lineStyles[name] = { stroke: STROKE_YOU, width: 2.5 };
        } else {
            lineStyles[name] = {
                stroke: STROKE_PEERS[peerIdx % STROKE_PEERS.length],
                width: 1.75,
            };
            peerIdx += 1;
        }
    }

    return (
        <div className="h-[300px] w-full min-w-0 mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#666', fontSize: 10 }}
                        axisLine={{ stroke: '#2a2a2a' }}
                        tickLine={false}
                        minTickGap={20}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fill: '#666', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        label={{ value: 'Mentions', angle: -90, position: 'insideLeft', fill: '#555', fontSize: 10 }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#111',
                            border: '1px solid #2a2a2a',
                            borderRadius: '10px',
                            fontSize: '12px',
                        }}
                        labelStyle={{ color: '#888', marginBottom: 6 }}
                        labelFormatter={(_, payload) => {
                            const row = payload?.[0]?.payload;
                            if (!row?.scanAt) return row?.date ?? '';
                            const d = new Date(row.scanAt);
                            if (Number.isNaN(d.getTime())) return row.date;
                            return d.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                timeZone: 'UTC',
                                timeZoneName: 'short',
                            });
                        }}
                        formatter={(value, name) => [value, yourNorms.has(NORM(name)) ? `${name} (you)` : name]}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: 16, fontSize: 11 }}
                        formatter={(value) => (
                            <span className="text-[#aaa]">{yourNorms.has(NORM(value)) ? `${value} (you)` : value}</span>
                        )}
                    />
                    {[...keys.filter((k) => !yourNorms.has(NORM(k))), ...keys.filter((k) => yourNorms.has(NORM(k)))].map(
                        (name) => {
                            const { stroke, width } = lineStyles[name];
                            return (
                                <Line
                                    key={name}
                                    type="monotone"
                                    dataKey={name}
                                    stroke={stroke}
                                    strokeWidth={width}
                                    dot={{ r: 3, strokeWidth: 0, fill: stroke }}
                                    activeDot={{ r: 5 }}
                                    isAnimationActive={data.length < 40}
                                />
                            );
                        },
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function CompetitiveIntelPage({ user, scanManager, onTabChange }) {
    const [subTab, setSubTab] = useState('entities');
    const [scanHistory, setScanHistory] = useState([]);
    const [historyDays, setHistoryDays] = useState(90);

    const domain = user?.domain || '';
    const liveResult = scanManager?.scanResult;

    const scanData = useMemo(() => {
        const live = liveResult;
        if (live && (live.prompts?.length || live.entityGraph?.length || live.intelligence || live.competitorGaps?.length)) {
            return live;
        }
        return getVisibilityData(domain, user?.projectId);
    }, [liveResult, domain, user?.projectId]);

    useEffect(() => {
        if (!domain) return;
        const days = historyDays > 0 ? historyDays : 365;
        apiClient.visibility
            .getScanHistory(user?.projectId, domain, { days, limit: 120 })
            .then((res) => {
                if (res?.history) setScanHistory(res.history);
            })
            .catch(() => {});
    }, [domain, user?.projectId, historyDays, liveResult?.scannedAt]);

    const intelligence = scanData?.intelligence || null;
    const entities = Array.isArray(scanData?.entityGraph) ? scanData.entityGraph : [];
    const gaps = Array.isArray(scanData?.competitorGaps) ? scanData.competitorGaps : [];
    const hasScan = !!scanData;
    const brandName = user?.brandName || 'Your brand';
    const sovBrandName = scanData?.shareOfVoice?.brand?.name || '';

    const mentionTrend = useMemo(
        () => buildCompetitorMentionTrend(scanHistory, brandName, sovBrandName),
        [scanHistory, brandName, sovBrandName],
    );

    return (
        <div className="w-full pb-12">
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <TrendingUp className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Competitive Intent</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">
                            {hasScan
                                ? 'Entities, gaps, and AI insights from your latest visibility scan.'
                                : 'Run a visibility scan to unlock competitive insights.'}{' '}
                            <button
                                type="button"
                                onClick={() => onTabChange?.('competitors')}
                                className="text-[#E92A15] hover:underline font-medium ml-1"
                            >
                                Manage competitors →
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 max-w-[1400px]">
                <div className="flex items-center gap-4 border-b border-[#111] mb-8 px-2 overflow-x-auto">
                    <div className="flex gap-8">
                        {SUB_TABS.map((t) => {
                            const I = t.i;
                            const isActive = subTab === t.k;
                            return (
                                <button
                                    key={t.k}
                                    type="button"
                                    onClick={() => setSubTab(t.k)}
                                    className={`flex items-center gap-2 pb-4 text-sm font-black transition-all relative ${
                                        isActive ? 'text-white' : 'text-[#333] hover:text-[#555]'
                                    }`}
                                >
                                    <I className={`w-4 h-4 ${isActive ? 'text-[#ff4444]' : 'text-[#222]'}`} />
                                    {t.l}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 w-full h-[4px] rounded-t-full bg-[#ff4444]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {subTab === 'entities' && (
                    <div className="space-y-6">
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-white font-semibold text-[15px]">Mention trends</span>
                                        <span className="text-[#666] text-[11px] font-bold px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md tracking-wide">
                                            YOU VS COMPETITORS
                                        </span>
                                    </div>
                                    <p className="text-[#666] text-[12px] mt-1 max-w-2xl">
                                        Total brand mentions per completed scan (from share-of-voice), so you can see how you and
                                        tracked competitors move together over time.
                                    </p>
                                </div>
                                <label className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] text-[#555] uppercase tracking-wide font-bold">History</span>
                                    <select
                                        value={historyDays}
                                        onChange={(e) => setHistoryDays(Number(e.target.value))}
                                        className="bg-[#1a1a1a] border border-[#333] text-[#ccc] text-[11px] rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#E92A15]/50 min-w-[120px]"
                                    >
                                        <option value={7}>Last 7 days</option>
                                        <option value={30}>Last 30 days</option>
                                        <option value={90}>Last 90 days</option>
                                        <option value={0}>All scans</option>
                                    </select>
                                </label>
                            </div>
                            {!domain ? (
                                <p className="text-[#555] text-[13px]">Set a project domain to load scan history.</p>
                            ) : scanHistory.length === 0 ? (
                                <p className="text-[#555] text-[13px]">
                                    No completed scans in this range yet. Run a visibility scan to start tracking mentions over
                                    time.
                                </p>
                            ) : mentionTrend.keys.length === 0 ? (
                                <p className="text-[#555] text-[13px]">
                                    No mention breakdown found in history. Complete a scan that includes competitor share-of-voice
                                    data.
                                </p>
                            ) : (
                                <CompetitorMentionsTrendChart
                                    data={mentionTrend.data}
                                    keys={mentionTrend.keys}
                                    yourNorms={mentionTrend.yourNorms}
                                />
                            )}
                            {scanHistory.length === 1 && mentionTrend.keys.length > 0 ? (
                                <p className="text-[#555] text-[11px] mt-2">
                                    One scan so far — lines will connect as you add more completed scans.
                                </p>
                            ) : null}
                        </div>

                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className="text-white font-semibold text-[15px]">Entities</span>
                                <span className="text-[#666] text-[11px] font-bold px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md tracking-wide">
                                    BRANDS IN ANSWERS
                                </span>
                            </div>
                            {entities.length === 0 ? (
                                <p className="text-[#555] text-[13px]">
                                    No entity graph for this scan yet. Run a full visibility scan to populate detected brands.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-[min(52vh,360px)] overflow-y-auto pr-1 custom-scrollbar">
                                    {entities.map((e, i) => (
                                        <div
                                            key={`${e.name}-${i}`}
                                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#262626] bg-[#111] px-4 py-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-white text-[13px] font-medium truncate">{e.name}</p>
                                                {e.domain ? <p className="text-[#666] text-[11px] truncate">{e.domain}</p> : null}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px]">
                                                {e.isTargetBrand ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-[#E92A15]/15 text-[#E92A15] font-semibold border border-[#E92A15]/25">
                                                        You
                                                    </span>
                                                ) : null}
                                                {e.isCompetitor ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300 font-semibold border border-orange-500/25">
                                                        Competitor
                                                    </span>
                                                ) : null}
                                                <span className="text-[#a3a3a3] tabular-nums">{e.totalMentions ?? 0} mentions</span>
                                                <span className="text-[#737373] tabular-nums">{e.queryCount ?? 0} queries</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {subTab === 'gaps' && (
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="text-white font-semibold text-[15px]">Gaps</span>
                            <span className="text-[#666] text-[11px] font-bold px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md tracking-wide">
                                WHERE OTHERS LEAD
                            </span>
                        </div>
                        {gaps.length === 0 ? (
                            <p className="text-[#555] text-[13px]">
                                No gap topics in this scan. Competitors may not have appeared more than you on tracked prompts.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-[min(48vh,320px)] overflow-y-auto pr-1 custom-scrollbar">
                                {gaps.map((gap, i) => {
                                    const gapHead = String(gap.contentTopic || gap.query || '').trim() || '—';
                                    const gapPrev = promptPreview(gapHead);
                                    return (
                                        <div
                                            key={`${gap.query || gap.contentTopic || i}-${gap.inferredFromCitations ? 'c' : 'g'}`}
                                            className="p-3 rounded-xl border border-[#222] bg-[#111]"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-0.5">
                                                <p
                                                    className={`text-[#eee] text-[13px] font-medium flex-1 min-w-0 ${gapPrev.truncated ? 'cursor-help' : ''}`}
                                                    title={gapPrev.truncated ? gapPrev.full : undefined}
                                                >
                                                    {gapPrev.display}
                                                </p>
                                                {gap.inferredFromCitations ? (
                                                    <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[#888] border border-[#333] rounded px-1.5 py-0.5">
                                                        Citations
                                                    </span>
                                                ) : null}
                                            </div>
                                            {gap.contentAngle ? <p className="text-[#777] text-[11px] mt-1">{gap.contentAngle}</p> : null}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {subTab === 'insights' && (
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="text-white font-semibold text-[15px]">AI insights</span>
                            <span className="text-[#666] text-[11px] font-bold px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md tracking-wide">
                                STRATEGIC BRIEF
                            </span>
                        </div>
                        {intelligence ? (
                            (() => {
                                const cards = [];
                                if (intelligence.overallAssessment) {
                                    cards.push({
                                        type: 'ASSESSMENT',
                                        tagColor: 'text-[#888] bg-[#1a1a1a] border border-[#2a2a2a]',
                                        text: intelligence.overallAssessment,
                                    });
                                }
                                (intelligence.strengthAreas || []).forEach((s) =>
                                    cards.push({
                                        type: 'STRENGTH',
                                        tagColor: 'text-[#22c55e] bg-[#0a1a0a] border border-[#22c55e]/30',
                                        text: s,
                                    }),
                                );
                                (intelligence.weaknessAreas || []).forEach((s) =>
                                    cards.push({
                                        type: 'RISK',
                                        tagColor: 'text-[#f59e0b] bg-[#1a1200] border border-[#f59e0b]/30',
                                        text: s,
                                    }),
                                );
                                (intelligence.topOpportunities || []).forEach((s) =>
                                    cards.push({
                                        type: 'OPPORTUNITY',
                                        tagColor: 'text-[#22c55e] bg-[#0a1a0a] border border-[#22c55e]/30',
                                        text: s,
                                    }),
                                );
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cards.map((c, i) => (
                                            <div key={i} className="rounded-xl p-4 border border-[#2a2a2a] bg-[#111]">
                                                <span
                                                    className={`inline-block text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded mb-3 ${c.tagColor}`}
                                                >
                                                    {c.type}
                                                </span>
                                                <p className="text-[#aaa] text-[13px] leading-relaxed">{c.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="rounded-xl p-4 border border-[#1a1a1a] bg-[#111]">
                                        <Skeleton className="w-24 h-5 mb-3" />
                                        <Skeleton className="w-full h-4 mb-2" />
                                        <Skeleton className="w-3/4 h-4" />
                                    </div>
                                ))}
                                <div className="col-span-full text-center py-2">
                                    <p className="text-[#555] text-[12px]">
                                        Run a scan to generate AI insights for {brandName}.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
