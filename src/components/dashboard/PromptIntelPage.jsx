import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Terminal,
    ChevronDown, Link2, Check, MessageSquare, Copy, AlertCircle,
    ArrowLeft, ChevronRight,
} from 'lucide-react';
import { ChatGPTLogo, GeminiLogo, PerplexityLogo } from '../landing/AILogos';
import { SentimentPercentDisplay } from '@/components/ui/SentimentTriGauge';
import { promptPreview } from '@/lib/promptPreview';
import { readVisibilityCache } from '@/lib/visibilityStorageKeys';

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
const ENGINE_LABELS = { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'ChatGPT' };
/** Search / SERP-style answers (primary in the detail modal). */
const ENGINE_ORDER_AI_SEARCH = ['perplexity', 'googleAI'];
/** Chat LLM answers — selector + glimpse; expand for full text, URLs, and mentions. */
const ENGINE_ORDER_LLM = ['gemini'];

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
            {engineKey === 'googleAI' && <ChatGPTLogo className={iconCls} />}
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
                <SentimentPercentDisplay label={sentimentRaw} size="sm" className="shrink-0" align="end" />
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

function formatDetailDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '—';
    }
}

function collectMentionLabels(prompt, brandName, domain) {
    const out = [];
    const seen = new Set();
    const add = (s) => {
        const t = String(s || '').trim();
        if (!t || seen.has(t.toLowerCase())) return;
        seen.add(t.toLowerCase());
        out.push(t);
    };
    if (brandName) add(brandName);
    const host = (domain || '').replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '');
    if (host) add(host);
    for (const ek of ENGINE_ORDER) {
        const cites = Array.isArray(prompt.engines?.[ek]?.citations) ? prompt.engines[ek].citations : [];
        for (const c of cites) {
            if (!isValidCitation(c)) continue;
            const label = citationHostLabel(c);
            add(label);
        }
    }
    return out.slice(0, 32);
}

function firstBrandSnippet(prompt) {
    for (const ek of [...ENGINE_ORDER_AI_SEARCH, ...ENGINE_ORDER_LLM]) {
        const sn = String(prompt.engines?.[ek]?.snippet || '').trim();
        if (sn) return sn;
    }
    return '';
}

function buildAllResponsesPlain(prompt) {
    const parts = [];
    const order = [...ENGINE_ORDER_AI_SEARCH, ...ENGINE_ORDER_LLM];
    for (const ek of order) {
        const label = ENGINE_LABELS[ek] || ek;
        const body = String(prompt.engines?.[ek]?.rawText || prompt.engines?.[ek]?.snippet || '').trim();
        if (body) parts.push(`--- ${label} ---\n\n${body}`);
    }
    return parts.join('\n\n') || '—';
}

function LlmResponsesSubsection({ prompt }) {
    const [selected, setSelected] = useState(ENGINE_ORDER_LLM[0]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setExpanded(false);
        const firstWith = ENGINE_ORDER_LLM.find((k) => engineRowHasResponse(prompt.engines?.[k]));
        setSelected(firstWith || ENGINE_ORDER_LLM[0]);
    }, [prompt]);

    const data = prompt.engines?.[selected];
    const cites = Array.isArray(data?.citations) ? data.citations.filter(isValidCitation) : [];
    const n = citationCountEngine(data);
    let body = String(data?.rawText || data?.snippet || '').trim();
    if (!body && n > 0) {
        body = 'Sources were extracted but answer text was not stored. Re-scan to capture full text.';
    }
    const hasResp = engineRowHasResponse(data);
    const mentionSnip = String(data?.snippet || '').trim();
    const sentimentRaw = data?.sentiment && data.sentiment !== 'n/a' ? String(data.sentiment) : 'neutral';

    return (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3 sm:p-4 space-y-3">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5c5c5c] mb-2">LLM (chat)</p>
                <div className="flex flex-wrap gap-2">
                    {ENGINE_ORDER_LLM.map((ek) => {
                        const row = prompt.engines?.[ek];
                        const active = ek === selected;
                        const ok = engineRowHasResponse(row);
                        return (
                            <button
                                key={ek}
                                type="button"
                                onClick={() => {
                                    setSelected(ek);
                                    setExpanded(false);
                                }}
                                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                                    active
                                        ? 'border-[#E92A15]/55 bg-[#1a0a08] shadow-[0_0_0_1px_rgba(233,42,21,0.12)]'
                                        : 'border-[#333] bg-[#111] hover:border-[#444]'
                                }`}
                            >
                                <EngineIconBadge
                                    engineKey={ek}
                                    hasResponse={ok}
                                    brandMentioned={!!row?.mentioned}
                                />
                                <span className={`text-[12px] font-medium ${active ? 'text-white' : 'text-[#a3a3a3]'}`}>
                                    {ENGINE_LABELS[ek] || ek}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-lg border border-[#262626] bg-[#080808] px-3 py-2.5">
                {!hasResp ? (
                    <p className="text-[12px] text-[#666]">No stored response for this model.</p>
                ) : (
                    <>
                        <p className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-wider mb-1.5">Glimpse</p>
                        <div className="text-[12px] text-[#c4c4c4] leading-relaxed whitespace-pre-wrap line-clamp-3">
                            {body || '—'}
                        </div>
                        <button
                            type="button"
                            onClick={() => setExpanded((e) => !e)}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#E92A15] hover:text-[#ff5c44]"
                        >
                            {expanded ? (
                                <>
                                    Collapse
                                    <ChevronDown className="w-3.5 h-3.5 rotate-180" strokeWidth={2.25} aria-hidden />
                                </>
                            ) : (
                                <>
                                    Expand for full answer, URLs &amp; mentions
                                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden />
                                </>
                            )}
                        </button>

                        {expanded && (
                            <div className="mt-4 pt-4 border-t border-[#262626] space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373] mb-1.5">Full response</p>
                                    <div className="max-h-[min(52vh,320px)] overflow-y-auto rounded-lg bg-[#060606] border border-[#1c1c1c] px-2.5 py-2 text-[12px] text-[#c4c4c4] leading-relaxed whitespace-pre-wrap">
                                        {body || '—'}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2 gap-2">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#5a5a5a] uppercase tracking-wider">
                                            <Link2 className="w-3 h-3" />
                                            URLs &amp; citations
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-400 tabular-nums">{n} cited</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                                        {cites.length === 0 ? (
                                            <span className="text-[10px] text-[#555]">None extracted for this model</span>
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
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373]">Mentions</p>
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span
                                            className={`flex items-center gap-1.5 text-[11px] font-semibold ${data?.mentioned ? 'text-emerald-400' : 'text-[#555]'}`}
                                        >
                                            <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                                            Brand mentioned
                                        </span>
                                        <SentimentPercentDisplay label={sentimentRaw} size="sm" className="shrink-0" align="end" />
                                    </div>
                                    {mentionSnip && (
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373] mb-1.5">Mention snippet</p>
                                            <div className="rounded-lg bg-[#060606] border border-[#1c1c1c] px-2.5 py-2 text-[12px] text-[#c4c4c4] leading-relaxed whitespace-pre-wrap">
                                                {mentionSnip}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function PromptDetailModal({ prompt, displayId, user, scanScannedAt, onClose }) {
    const [exportOpen, setExportOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const exportRef = useRef(null);
    const q = String(prompt.query || prompt.prompt || '—').trim() || '—';
    const tier = visibilityTier(prompt);
    const anyMentioned = ENGINE_ORDER.some((ek) => prompt.engines?.[ek]?.mentioned);
    const brandName = user?.brandName || 'Your brand';
    const domainShort = (user?.domain || '').replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '') || 'your site';
    const location = [user?.location, user?.country].filter(Boolean).join(', ') || '—';
    const runDay = formatDetailDate(prompt.runDate || scanScannedAt);
    const mentionLabels = collectMentionLabels(prompt, brandName, user?.domain);
    const snippet = firstBrandSnippet(prompt);

    const showToast = useCallback((msg) => {
        setToast(msg);
        window.setTimeout(() => setToast(null), 2200);
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    useEffect(() => {
        if (!exportOpen) return;
        const onDoc = (e) => {
            if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [exportOpen]);

    const copyPromptOnly = async () => {
        try {
            await navigator.clipboard.writeText(q);
            showToast('Prompt copied');
            setExportOpen(false);
        } catch {
            showToast('Copy failed');
        }
    };

    const copyAllResponses = async () => {
        try {
            await navigator.clipboard.writeText(buildAllResponsesPlain(prompt));
            showToast('All responses copied');
            setExportOpen(false);
        } catch {
            showToast('Copy failed');
        }
    };

    const downloadJson = () => {
        try {
            const blob = new Blob([JSON.stringify({ displayId, query: q, prompt }, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `prompt-${displayId}-${String(q).slice(0, 40).replace(/\s+/g, '-')}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
            showToast('JSON downloaded');
            setExportOpen(false);
        } catch {
            showToast('Download failed');
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-6 sm:pt-10 bg-black/75 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-detail-title"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-3xl max-h-[min(92vh,880px)] flex flex-col rounded-2xl border border-[#333] bg-[#0d0d0d] shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {toast && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#444] text-[12px] text-white shadow-lg pointer-events-none">
                        {toast}
                    </div>
                )}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#2a2a2a] bg-[#111] shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-2 text-[13px] font-medium text-[#ccc] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={2.25} aria-hidden />
                        Back
                    </button>
                    <div className="relative" ref={exportRef}>
                        <button
                            type="button"
                            onClick={() => setExportOpen((o) => !o)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-1.5 text-[12px] font-semibold text-white hover:border-[#555] transition-colors"
                        >
                            Export
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportOpen ? 'rotate-180' : ''}`} aria-hidden />
                        </button>
                        {exportOpen && (
                            <div className="absolute right-0 top-full mt-1 py-1 min-w-[200px] rounded-xl border border-[#333] bg-[#141414] shadow-xl z-10">
                                <button type="button" onClick={copyPromptOnly} className="w-full text-left px-3 py-2 text-[12px] text-[#e5e5e5] hover:bg-[#222]">
                                    Copy prompt
                                </button>
                                <button type="button" onClick={copyAllResponses} className="w-full text-left px-3 py-2 text-[12px] text-[#e5e5e5] hover:bg-[#222]">
                                    Copy all responses (plain)
                                </button>
                                <button type="button" onClick={downloadJson} className="w-full text-left px-3 py-2 text-[12px] text-[#e5e5e5] hover:bg-[#222]">
                                    Download JSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 space-y-6">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373] mb-2">Prompt</p>
                        <h2 id="prompt-detail-title" className="text-[17px] sm:text-[18px] font-semibold text-white leading-snug break-words">
                            {q}
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#a3a3a3]">
                        <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] px-2 py-1">
                            {ENGINE_ORDER_AI_SEARCH.map((ek) => {
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
                            <span className="text-[#333] px-0.5 select-none" aria-hidden>
                                |
                            </span>
                            {ENGINE_ORDER_LLM.map((ek) => {
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
                        <span className="text-[#555]">·</span>
                        <span>{runDay}</span>
                        <span className="text-[#555]">·</span>
                        <span>{location}</span>
                        <span className="ml-auto">
                            <VisibilityBadge tier={tier} />
                        </span>
                    </div>

                    <div className="rounded-xl border border-[#2a2a2a] bg-[#101010] px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373] mb-2">Visibility</p>
                        <p className={`text-[14px] font-medium flex items-center gap-2 ${anyMentioned ? 'text-emerald-400' : 'text-[#888]'}`}>
                            <Check className={`w-4 h-4 shrink-0 ${anyMentioned ? 'opacity-100' : 'opacity-30'}`} strokeWidth={2.5} aria-hidden />
                            {anyMentioned
                                ? `${domainShort} is mentioned in at least one AI response`
                                : `${brandName} was not mentioned in stored responses for this prompt`}
                        </p>
                    </div>

                    {mentionLabels.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373] mb-2">Mentions &amp; sources</p>
                            <div className="flex flex-wrap gap-2">
                                {mentionLabels.map((label) => (
                                    <span
                                        key={label}
                                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#e0e0e0] max-w-full truncate"
                                        title={label}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373] mb-2">Search query</p>
                        <span className="inline-block text-[12px] px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#ccc] max-w-full break-words">
                            {q}
                        </span>
                    </div>

                    {snippet && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373] mb-2">Mention snippet</p>
                            <div className="rounded-xl bg-[#0a0a0a] border border-[#262626] px-3.5 py-3 text-[13px] text-[#c4c4c4] leading-relaxed whitespace-pre-wrap">
                                {snippet}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373] mb-2">
                                AI search responses
                            </p>
                            <p className="text-[11px] text-[#666] mb-3">
                                Answers from search-style engines (Perplexity, Google). Citations are listed on each card.
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                {ENGINE_ORDER_AI_SEARCH.map((ek) => (
                                    <EngineResponseCard key={ek} engineKey={ek} data={prompt.engines?.[ek]} />
                                ))}
                            </div>
                        </div>
                        <LlmResponsesSubsection prompt={prompt} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PromptIntelPage({ user, scanManager }) {
    const [detailModal, setDetailModal] = useState(null);

    const scanData = useMemo(() => {
        try {
            const live = scanManager?.scanResult || null;
            const cached = readVisibilityCache(user?.authUserId, user?.domain, user?.projectId);
            return mergeVisibilityScan(live, cached);
        } catch (err) {
            console.error('[PromptIntel] mergeVisibilityScan error:', err);
            return null;
        }
    }, [scanManager?.scanResult, user?.authUserId, user?.domain, user?.projectId]);

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
        <div className="w-full pb-12 relative">
            {detailModal ? (
                <PromptDetailModal
                    prompt={detailModal.prompt}
                    displayId={detailModal.displayId}
                    user={user}
                    scanScannedAt={scanData?.scannedAt}
                    onClose={() => setDetailModal(null)}
                />
            ) : null}
            <div className="h-[105px] flex items-end -mt-8 -mx-8 px-8 pb-3 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4 pb-1">
                    <div className="w-11 h-11 bg-[#0a0505] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Terminal className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Prompt Intelligence</h1>
                        <p className="text-[#666] text-[13px] mt-0.5">
                            {hasData
                                ? `${allPrompts.length} prompts · ${totalEngineResponses} engine responses — search engines (Perplexity, Google) are primary in details; Gemini is under LLM`
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
                            {allPrompts.length} prompt{allPrompts.length !== 1 ? 's' : ''} from your latest stored scan. Click a row for AI search responses first; LLM (Gemini) uses a compact selector with expand for URLs and mentions.
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
                                            className="py-3 px-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider text-center whitespace-nowrap align-bottom"
                                            title="Perplexity, ChatGPT (search), Gemini — blue: answer or sources stored; green: brand mentioned"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <span>Engines</span>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="w-7 h-7 rounded-md bg-[#141414] border border-[#2a2a2a] flex items-center justify-center" title="Perplexity">
                                                        <PerplexityLogo className="w-[15px] h-[15px] object-contain" />
                                                    </span>
                                                    <span className="w-7 h-7 rounded-md bg-[#141414] border border-[#2a2a2a] flex items-center justify-center" title="ChatGPT">
                                                        <ChatGPTLogo className="w-[15px] h-[15px] text-white" />
                                                    </span>
                                                    <span className="w-7 h-7 rounded-md bg-[#141414] border border-[#2a2a2a] flex items-center justify-center" title="Gemini">
                                                        <GeminiLogo className="w-[15px] h-[15px] text-white" />
                                                    </span>
                                                </div>
                                            </div>
                                        </th>
                                        <th className="py-3 px-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider text-center whitespace-nowrap">
                                            Visibility
                                        </th>
                                        <th className="py-3 px-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider text-center whitespace-nowrap">
                                            Sources
                                        </th>
                                        <th className="py-3 pr-4 pl-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider text-center w-20">
                                            Details
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPrompts.map((p, i) => {
                                        const rowKey = p.promptId || `${i}-${String(p.query || p.prompt || '').slice(0, 24)}`;
                                        const displayId = promptDisplayId(i);
                                        const qtext = String(p.query || p.prompt || '—');
                                        const qPrev = promptPreview(qtext);
                                        const openDetail = () => setDetailModal({ prompt: p, displayId, rowKey });
                                        return (
                                            <tr
                                                key={rowKey}
                                                className="border-b border-[#1f1f1f] hover:bg-[#0a0a0a] transition-colors cursor-pointer"
                                                onClick={openDetail}
                                            >
                                                <td className="py-3 pl-4 pr-2 align-middle text-[11px] font-mono text-[#737373]">
                                                    {displayId}
                                                </td>
                                                <td className="py-3 px-3 align-middle max-w-[min(520px,52vw)]">
                                                    <p
                                                        className={`text-[13px] text-[#e5e5e5] truncate ${qPrev.truncated ? 'cursor-help' : ''}`}
                                                        title={qPrev.truncated ? qPrev.full : undefined}
                                                    >
                                                        {qPrev.display}
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
                                                    <span
                                                        className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-[#E92A15] pointer-events-none"
                                                        aria-hidden
                                                    >
                                                        View
                                                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                    </span>
                                                </td>
                                            </tr>
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
