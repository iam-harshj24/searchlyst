import React, { useState, useMemo } from 'react';
import {
    Terminal,
    ChevronDown, ChevronUp, Link2, Check, MessageSquare, Copy, Search, AlertCircle,
} from 'lucide-react';
import { GeminiLogo, PerplexityLogo } from '../landing/AILogos';
import { SentimentTriGauge } from '@/components/ui/SentimentTriGauge';

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

function mergeVisibilityScan(live, cached) {
    const liveOk = live && Array.isArray(live.prompts) && live.prompts.length > 0;
    const cacheOk = cached && Array.isArray(cached.prompts) && cached.prompts.length > 0;
    if (liveOk && !cacheOk) return live;
    if (!liveOk && cacheOk) return cached;
    if (!liveOk && !cacheOk) return live || cached || null;

    const livePartial = !!live.isPartial;
    const cachePartial = !!cached.isPartial;
    const liveCalls = Number(live.config?.totalCalls) || 0;
    const cacheCalls = Number(cached.config?.totalCalls) || 0;

    if (livePartial && !cachePartial) return cached;
    if (!livePartial && cachePartial) return live;
    if (liveCalls > cacheCalls) return live;
    if (cacheCalls > liveCalls) return cached;

    const tLive = safeDateMs(live.scannedAt);
    const tCache = safeDateMs(cached.scannedAt);
    return tLive >= tCache ? live : cached;
}

function safeDateMs(val) {
    if (val == null || val === '') return 0;
    try {
        const t = new Date(val).getTime();
        return Number.isNaN(t) ? 0 : t;
    } catch { return 0; }
}

function safeIsoDay(val) {
    const ms = safeDateMs(val);
    if (ms === 0) return null;
    try { return new Date(ms).toISOString().slice(0, 10); } catch { return null; }
}

const ENGINE_ORDER = ['perplexity', 'gemini', 'googleAI'];
const ENGINE_LABELS = { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'Google Search' };

function engineRowHasResponse(e) {
    if (!e || typeof e !== 'object') return false;
    const t = String(e.rawText || e.snippet || '').trim().length;
    const c = Array.isArray(e.citations) ? e.citations.length : 0;
    const st = String(e.status || '');
    return t > 0 || c > 0 || st.includes('✓') || st.toLowerCase().includes('received');
}

function promptDisplayId(index) {
    return `P${String(index + 1).padStart(2, '0')}`;
}

/** Citation must have a usable URL or domain so we never show misleading counts or links. */
function isValidCitation(c) {
    if (!c || typeof c !== 'object') return false;
    const url = String(c.url || '').trim();
    const domain = String(c.domain || '').trim();
    return Boolean(url || domain);
}

function safeCitationHref(url) {
    const raw = String(url || '').trim();
    if (!raw) return null;
    try {
        const href = raw.includes('://') ? raw : `https://${raw}`;
        const u = new URL(href);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
        return u.href;
    } catch {
        return null;
    }
}

function citationCountEngine(e) {
    if (!e) return 0;
    const cites = Array.isArray(e.citations) ? e.citations : [];
    if (cites.length > 0) {
        return cites.filter(isValidCitation).length;
    }
    const n = Number(e.citationCount);
    if (Number.isFinite(n) && n >= 0) return Math.min(999, Math.round(n));
    return 0;
}

function totalCitationsPrompt(p) {
    return ENGINE_ORDER.reduce((sum, k) => sum + citationCountEngine(p.engines?.[k]), 0);
}

function visibilityTier(p) {
    const rows = ENGINE_ORDER.map((k) => p.engines?.[k]).filter(Boolean);
    if (rows.length === 0) return 'none';
    const m = rows.filter((e) => e.mentioned).length;
    if (m === 0) return 'none';
    if (m >= 2) return 'high';
    return 'partial';
}

function enginesRespondedCount(p) {
    return ENGINE_ORDER.filter((k) => engineRowHasResponse(p.engines?.[k])).length;
}

function citationHostLabel(c) {
    try {
        const h = new URL(c.url).hostname.replace(/^www\./, '');
        return h || c.title || 'link';
    } catch {
        return c.domain || c.title || String(c.url || '').slice(0, 36) || 'link';
    }
}

function VisibilityBadge({ tier }) {
    const styles = {
        high: 'border-emerald-500/55 text-emerald-400 bg-emerald-950/25',
        partial: 'border-amber-500/45 text-amber-400 bg-amber-950/15',
        none: 'border-[#333] text-[#666] bg-[#141414]',
    };
    const labels = { high: 'High', partial: 'Partial', none: 'None' };
    const key = styles[tier] ? tier : 'none';
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[key]}`}>
            {labels[key]}
        </span>
    );
}

function EngineIconBadge({ engineKey, hasResponse, brandMentioned }) {
    const label = ENGINE_LABELS[engineKey] || engineKey || 'Engine';
    const box = brandMentioned
        ? 'border-emerald-500/70 bg-[#0a1810] shadow-[0_0_0_1px_rgba(34,197,94,0.15)] opacity-100'
        : hasResponse
            ? 'border-sky-500/55 bg-[#0a121a] shadow-[0_0_0_1px_rgba(56,189,248,0.12)] opacity-100'
            : 'border-[#2c2c2c] bg-[#121212] opacity-[0.45]';
    const iconCls = 'w-[17px] h-[17px] object-contain text-white';
    const tip = `${label} — ${brandMentioned ? 'brand mentioned' : hasResponse ? 'response received' : 'no data'}`;
    return (
        <div
            className={`w-8 h-8 rounded-md flex items-center justify-center border ${box} shrink-0`}
            title={tip}
        >
            {engineKey === 'perplexity' && <PerplexityLogo className={iconCls} />}
            {engineKey === 'gemini' && <GeminiLogo className={iconCls} />}
            {engineKey === 'googleAI' && (
                <Search className={`${iconCls} text-sky-300`} strokeWidth={2.25} aria-hidden />
            )}
        </div>
    );
}

function EngineResponseCard({ engineKey, data }) {
    const label = ENGINE_LABELS[engineKey] || engineKey;
    const cites = Array.isArray(data?.citations) ? data.citations.filter(isValidCitation) : [];
    const n = citationCountEngine(data);
    let body = String(data?.rawText || data?.snippet || '').trim();
    if (!body && n > 0) {
        body = 'Sources were extracted but answer text was not stored. Re-scan to capture full text.';
    }
    const hasResp = engineRowHasResponse(data);
    const ok = !!data && hasResp;
    const sentimentRaw = data?.sentiment && data.sentiment !== 'n/a' ? String(data.sentiment) : 'neutral';
    const statusLine = data?.status ? String(data.status) : null;

    return (
        <div className="rounded-xl border border-[#262626] bg-[#0a0a0a] flex flex-col min-h-[300px] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[#262626]">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <EngineIconBadge
                        engineKey={engineKey}
                        hasResponse={hasResp}
                        brandMentioned={!!data?.mentioned}
                    />
                    <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-medium text-white block truncate">{label}</span>
                    </div>
                </div>
                {ok ? (
                    <span className="text-[9px] font-bold tracking-wide text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded bg-emerald-950/30 shrink-0">
                        RECEIVED
                    </span>
                ) : (
                    <span className="text-[9px] font-bold uppercase text-[#555] border border-[#333] px-2 py-0.5 rounded shrink-0">
                        No data
                    </span>
                )}
            </div>
            {statusLine && (
                <div className="px-3 py-1 border-b border-[#1a1a1a] text-[10px] text-[#737373] truncate" title={statusLine}>
                    Status: {statusLine}
                </div>
            )}
            <div className="px-3 py-2 flex items-center justify-between border-b border-[#262626]">
                <span
                    className={`flex items-center gap-1.5 text-[11px] font-semibold ${data?.mentioned ? 'text-emerald-400' : 'text-[#555]'}`}
                >
                    <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                    Brand Mentioned
                </span>
                <SentimentTriGauge label={sentimentRaw} size="sm" className="shrink-0" />
            </div>
            <div className="px-3 py-2 flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#5a5a5a] uppercase tracking-wider mb-1.5">
                    <MessageSquare className="w-3 h-3" />
                    AI Response
                </div>
                <div className="flex-1 min-h-[120px] max-h-[220px] overflow-y-auto rounded-lg bg-[#060606] border border-[#1c1c1c] px-2.5 py-2 text-[11px] text-[#b4b4b4] leading-relaxed whitespace-pre-wrap">
                    {body || '—'}
                </div>
            </div>
            <div className="px-3 py-2.5 border-t border-[#262626] mt-auto">
                <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#5a5a5a] uppercase tracking-wider">
                        <Link2 className="w-3 h-3" />
                        Sources &amp; Citations
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 tabular-nums">{n} cited</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                    {cites.length === 0 ? (
                        <span className="text-[10px] text-[#555]">None extracted</span>
                    ) : (
                        cites.map((c, i) => {
                            const href = safeCitationHref(c.url) || (c.domain ? safeCitationHref(`https://${String(c.domain).replace(/^www\./, '')}`) : null);
                            const labelText = citationHostLabel(c);
                            if (!href) {
                                return (
                                    <span
                                        key={i}
                                        className="text-[10px] px-2 py-1 rounded-md bg-[#141414] border border-[#2a2a2a] text-[#737373] max-w-full truncate inline-block"
                                        title="Source present but URL was not valid for linking"
                                    >
                                        {labelText}
                                    </span>
                                );
                            }
                            return (
                                <a
                                    key={i}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] px-2 py-1 rounded-md bg-[#141414] border border-[#2a2a2a] text-[#ececec] hover:border-emerald-500/35 max-w-full truncate inline-block"
                                >
                                    {labelText}
                                </a>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

function ExpandedPromptBronze({ prompt, displayId, onCollapse }) {
    const [copied, setCopied] = useState(false);
    const tier = visibilityTier(prompt);
    const total = totalCitationsPrompt(prompt);
    const q = String(prompt.query || prompt.prompt || '—').trim() || '—';

    const copyPrompt = async () => {
        if (!q || q === '—') return;
        try {
            await navigator.clipboard.writeText(q);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    return (
        <div className="border-t border-[#1f1f1f] bg-[#030303]">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#1f1f1f]">
                <span className="text-[11px] font-mono text-[#666] w-9 shrink-0">{displayId}</span>
                <div className="flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#0f0f0f] px-2 py-1">
                    {ENGINE_ORDER.map((ek) => {
                        const row = prompt.engines?.[ek];
                        return (
                            <EngineIconBadge
                                key={ek}
                                engineKey={ek}
                                hasResponse={engineRowHasResponse(row)}
                                brandMentioned={!!row?.mentioned}
                            />
                        );
                    })}
                </div>
                <VisibilityBadge tier={tier} />
                <span className="inline-flex items-center gap-1 text-[13px] text-white font-medium tabular-nums">
                    <Link2 className="w-3.5 h-3.5 text-[#888]" />
                    {total}
                </span>
                <span className="text-[10px] text-[#555]">
                    {enginesRespondedCount(prompt)}/3 engines responded
                </span>
                <button
                    type="button"
                    onClick={onCollapse}
                    className="ml-auto p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                    aria-label="Collapse row"
                >
                    <ChevronUp className="w-4 h-4" />
                </button>
            </div>
            <div className="px-4 py-3 border-b border-[#1f1f1f]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">Full prompt</span>
                    <button
                        type="button"
                        onClick={copyPrompt}
                        disabled={q === '—'}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#141414] px-2.5 py-1 text-[11px] font-medium text-[#ccc] hover:border-[#E92A15]/40 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                                Copy
                            </>
                        )}
                    </button>
                </div>
                <div
                    className="rounded-xl bg-[#0a0a0a] border border-[#262626] px-3.5 py-3 text-[13px] text-[#e5e5e5] leading-relaxed whitespace-pre-wrap break-words max-h-[min(45vh,360px)] overflow-y-auto custom-scrollbar"
                    role="region"
                    aria-label="Complete prompt text"
                >
                    {q}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-4">
                {ENGINE_ORDER.map((ek) => (
                    <EngineResponseCard key={ek} engineKey={ek} data={prompt.engines?.[ek]} />
                ))}
            </div>
        </div>
    );
}

export default function PromptIntelPage({ user, scanManager }) {
    const [expandedPromptKey, setExpandedPromptKey] = useState(null);

    const scanData = useMemo(() => {
        try {
            const live = scanManager?.scanResult || null;
            const cached = getVisibilityData(user?.domain, user?.projectId);
            return mergeVisibilityScan(live, cached);
        } catch (err) {
            console.error('[PromptIntel] mergeVisibilityScan error:', err);
            return null;
        }
    }, [scanManager?.scanResult, user?.domain, user?.projectId]);

    const promptsData = useMemo(() => {
        try {
            const rows = scanData?.prompts?.length ? scanData.prompts : [];
            const day = safeIsoDay(scanData?.scannedAt);
            return rows.map((p) => ({ ...p, runDate: p.runDate || day }));
        } catch (err) {
            console.error('[PromptIntel] promptsData error:', err);
            return [];
        }
    }, [scanData]);

    const allPrompts = promptsData;
    const hasData = allPrompts.length > 0;
    const totalEngineResponses = allPrompts.reduce((sum, p) => sum + enginesRespondedCount(p), 0);

    return (
        <div className="w-full pb-12">
            <div className="h-[105px] flex items-end -mt-8 -mx-8 px-8 pb-3 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4 pb-1">
                    <div className="w-11 h-11 bg-[#0a0505] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Terminal className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Prompt Intelligence</h1>
                        <p className="text-[#666] text-[13px] mt-0.5">
                            {hasData
                                ? `${allPrompts.length} prompts · ${totalEngineResponses} engine responses across Perplexity, Gemini & Google Search`
                                : 'Run a visibility scan to see per-prompt AI responses and citations'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-5">
                <div className="bg-black border border-[#262626] rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#262626] bg-[#0a0a0a]">
                        <h3 className="text-white font-semibold text-[14px] tracking-tight">Prompt matrix</h3>
                        <p className="text-[#666] text-[11px] mt-1">
                            {allPrompts.length} prompt{allPrompts.length !== 1 ? 's' : ''} from your latest stored scan. Expand a row for full text, sources, and citations.
                            Source counts list only entries with a valid URL or domain. Blue = response received · Green = brand mentioned.
                        </p>
                    </div>
                    {!hasData ? (
                        <div className="px-5 py-12 text-center">
                            <AlertCircle className="w-8 h-8 text-[#333] mx-auto mb-3" />
                            <p className="text-[#555] text-[13px]">Run a visibility scan to populate prompts and engine responses.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[12px] border-collapse">
                                <thead>
                                    <tr className="bg-[#141414] border-b border-[#262626]">
                                        <th className="py-3 pl-4 pr-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider w-14">#</th>
                                        <th className="py-3 px-3 text-[10px] font-semibold text-[#737373] uppercase tracking-wider">Prompt</th>
                                        <th
                                            className="py-3 px-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider text-center whitespace-nowrap"
                                            title="Perplexity, Gemini, and Google Search — blue: answer or sources stored; green: brand mentioned"
                                        >
                                            Engines
                                        </th>
                                        <th className="py-3 px-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider text-center whitespace-nowrap">
                                            Visibility
                                        </th>
                                        <th className="py-3 px-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider text-center whitespace-nowrap">
                                            Sources
                                        </th>
                                        <th className="py-3 pr-4 pl-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider text-center w-16">
                                            Expand
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPrompts.map((p, i) => {
                                        const rowKey = p.promptId || `${i}-${String(p.query || p.prompt || '').slice(0, 24)}`;
                                        const open = expandedPromptKey === rowKey;
                                        const displayId = promptDisplayId(i);
                                        const qtext = String(p.query || p.prompt || '—');
                                        return (
                                            <React.Fragment key={rowKey}>
                                                <tr className="border-b border-[#1f1f1f] hover:bg-[#0a0a0a] transition-colors">
                                                    <td className="py-3 pl-4 pr-2 align-middle text-[11px] font-mono text-[#737373]">
                                                        {displayId}
                                                    </td>
                                                    <td className="py-3 px-3 align-middle max-w-[min(520px,52vw)]">
                                                        <p className="text-[13px] text-[#e5e5e5] truncate" title={qtext}>
                                                            {qtext}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 px-2 align-middle">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {ENGINE_ORDER.map((ek) => {
                                                                const row = p.engines?.[ek];
                                                                return (
                                                                    <EngineIconBadge
                                                                        key={ek}
                                                                        engineKey={ek}
                                                                        hasResponse={engineRowHasResponse(row)}
                                                                        brandMentioned={!!row?.mentioned}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 align-middle text-center">
                                                        <VisibilityBadge tier={visibilityTier(p)} />
                                                    </td>
                                                    <td className="py-3 px-2 align-middle text-center">
                                                        <span className="inline-flex items-center gap-1 text-[13px] text-white font-medium tabular-nums">
                                                            <Link2 className="w-3.5 h-3.5 text-[#a3a3a3]" />
                                                            {totalCitationsPrompt(p)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 pl-2 align-middle text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedPromptKey(open ? null : rowKey)}
                                                            className="p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors inline-flex"
                                                            aria-expanded={open}
                                                            aria-label={open ? 'Collapse' : 'Expand'}
                                                        >
                                                            {open ? (
                                                                <ChevronUp className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {open && (
                                                    <tr className="bg-[#030303]">
                                                        <td colSpan={6} className="p-0">
                                                            <ExpandedPromptBronze
                                                                prompt={p}
                                                                displayId={displayId}
                                                                onCollapse={() => setExpandedPromptKey(null)}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
