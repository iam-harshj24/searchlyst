import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Terminal,
    ChevronDown, Check, Copy, AlertCircle,
    ArrowLeft, ChevronRight, Calendar, MapPin, Globe,
    Plus, Loader2, X,
} from 'lucide-react';
import { ChatGPTLogo, GeminiLogo, GoogleLogo, PerplexityLogo } from '../landing/AILogos';
import { StackedEngineIcons, buildStackStatesFromPromptEngines } from '@/components/dashboard/StackedEngineIcons';
import { SentimentPercentDisplay } from '@/components/ui/SentimentTriGauge';
import { promptPreview } from '@/lib/promptPreview';
import { readVisibilityCache, mergeVisibilityScan, safeDateMs, readLastVisibilityScanId } from '@/lib/visibilityStorageKeys';
import { BrandFaviconImg } from '@/components/charts/BrandChartUi';
import { formatEngineResponseForMarkdown } from '@/lib/formatEngineResponse';
import { apiClient } from '@/api/apiClient';

function safeIsoDay(val) {
    const ms = safeDateMs(val);
    if (ms === 0) return null;
    try { return new Date(ms).toISOString().slice(0, 10); } catch { return null; }
}

const ENGINE_ORDER = ['perplexity', 'gemini', 'chatgpt', 'googleAI'];
const ENGINE_LABELS = {
    perplexity: 'Perplexity',
    gemini: 'Gemini',
    chatgpt: 'ChatGPT',
    googleAI: 'Google AI Overviews',
};

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
        none: 'border-[#333] text-white bg-[#141414]',
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
            {engineKey === 'chatgpt' && <ChatGPTLogo className={iconCls} />}
            {engineKey === 'googleAI' && <GoogleLogo className="w-[17px] h-[17px] object-contain shrink-0" />}
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

/**
 * "Mentions & sources" chips (Prompt detail modal):
 * 1) Brand name + your domain — from the signed-in user / project.
 * 2) Every distinct hostname from citation URLs across engines (`prompt.engines[*].citations[]`), same data as Infatica + parser.
 */
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
            const dom = citationDomainForFavicon(c);
            const label = dom || citationHostLabel(c);
            add(label);
        }
    }
    return out;
}

function firstBrandSnippet(prompt) {
    for (const ek of ENGINE_ORDER) {
        const sn = String(prompt.engines?.[ek]?.snippet || '').trim();
        if (sn) return sn;
    }
    return '';
}

function buildAllResponsesPlain(prompt) {
    const parts = [];
    for (const ek of ENGINE_ORDER) {
        const label = ENGINE_LABELS[ek] || ek;
        const body = String(prompt.engines?.[ek]?.rawText || prompt.engines?.[ek]?.snippet || '').trim();
        if (body) {
            const cleaned = formatEngineResponseForMarkdown(body, ek);
            parts.push(`--- ${label} ---\n\n${cleaned}`);
        }
    }
    return parts.join('\n\n') || '—';
}

function citationDomainForFavicon(c) {
    if (c?.domain) return String(c.domain).replace(/^www\./i, '');
    const href = safeCitationHref(c?.url);
    if (!href) return '';
    try {
        return new URL(href).hostname.replace(/^www\./i, '');
    } catch {
        return '';
    }
}

/** Onboarding reach ids → display labels (keep in sync with OnboardingFlow reachOptions). */
const REACH_LABELS = {
    worldwide: 'Worldwide',
    nationwide: 'Nationwide',
    regional: 'Regional',
    state: 'State',
    city: 'City',
    neighborhood: 'Local',
};

/** Single string for matrix: reach scope + markets (Brand Hub / onboarding). */
function formatPromptTrackingDisplay(u) {
    if (!u || typeof u !== 'object') return '—';
    const reachRaw = String(u.reach || '').trim().toLowerCase();
    const reachLabel = REACH_LABELS[reachRaw] || (u.reach ? String(u.reach).trim() : '');
    const tl = Array.isArray(u.trackingLocations)
        ? u.trackingLocations.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 3)
        : [];
    const primary = String(u.location || '').trim();
    const parts = [];
    if (reachLabel) parts.push(reachLabel);
    if (tl.length) parts.push(tl.join(' · '));
    else if (primary) parts.push(primary);
    if (parts.length === 0 && primary) return primary;
    if (parts.length === 0) return '—';
    return parts.join(' · ');
}

const CITATION_STACK_MAX = 24;

/** Unique source domains in first-seen order across all engines (for stacked favicons; total count shown separately). */
function collectOrderedUniqueCitationDomains(prompt) {
    const seen = new Set();
    const out = [];
    for (const ek of ENGINE_ORDER) {
        const cites = Array.isArray(prompt.engines?.[ek]?.citations) ? prompt.engines[ek].citations : [];
        for (const c of cites) {
            if (!isValidCitation(c)) continue;
            const dom = citationDomainForFavicon(c);
            if (!dom) continue;
            const k = dom.toLowerCase();
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(dom);
        }
    }
    return out;
}

/** Stacked domain favicons (like Models column) + total citation count pill. */
function StackedCitationIcons({ domains, totalCount }) {
    const list = (domains || []).filter(Boolean).slice(0, CITATION_STACK_MAX);
    const n = Math.max(0, Math.min(999, Number(totalCount) || 0));
    const overlap = '-ml-1.5';

    if (list.length === 0 && n === 0) {
        return <span className="text-white text-[12px] tabular-nums">—</span>;
    }

    return (
        <div className="inline-flex flex-row items-center justify-center pl-0.5" role="group" aria-label={`${n} citation${n === 1 ? '' : 's'}`}>
            {list.map((dom, i) => (
                <div key={`${dom}-${i}`} className={`relative ${i === 0 ? '' : overlap}`} style={{ zIndex: i + 1 }}>
                    <span
                        className="w-6 h-6 rounded-full border-2 border-[#1a1a1a] bg-[#141414] overflow-hidden flex items-center justify-center shrink-0"
                        title={dom}
                    >
                        <BrandFaviconImg domain={dom} size={14} className="rounded-full" />
                    </span>
                </div>
            ))}
            {n > 0 ? (
                <span
                    className={`relative z-[12] ${list.length ? overlap : ''} inline-flex items-center justify-center min-h-6 px-1.5 rounded-full border border-[#333] bg-[#1a1a1a] text-[10px] font-bold text-white tabular-nums leading-none py-0.5`}
                    title={`${n} citations (this prompt)`}
                >
                    +{n}
                </span>
            ) : null}
        </div>
    );
}

function SourceCard({ c, index }) {
    const domain = citationDomainForFavicon(c);
    const href = safeCitationHref(c.url) || (c.domain ? safeCitationHref(`https://${String(c.domain).replace(/^www\./, '')}`) : null);
    const title = String(c.title || '').trim() || domain || 'Source';
    const snippet = String(c.title && c.text && c.text !== c.title ? c.text : '').trim().slice(0, 160);
    const favicon = domain
        ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
        : null;

    const inner = (
        <>
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#1f1f1f] border border-[#2e2e2e] flex items-center justify-center shrink-0 overflow-hidden">
                    {favicon ? (
                        <img src={favicon} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                        <Globe className="w-3.5 h-3.5 text-white" aria-hidden />
                    )}
                </div>
                <span className="text-[11px] text-white truncate font-medium">{domain || citationHostLabel(c)}</span>
            </div>
            <p className="text-[13px] font-semibold text-white leading-snug line-clamp-2 mt-2">{title}</p>
            {snippet ? (
                <p className="text-[11px] text-white leading-relaxed line-clamp-2 mt-1.5">{snippet}</p>
            ) : null}
        </>
    );

    if (href) {
        return (
            <a
                key={index}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#2a2a2a] bg-[#121212] p-3 hover:border-[#3d3d3d] transition-colors text-left block min-w-0"
            >
                {inner}
            </a>
        );
    }
    return (
        <div key={index} className="rounded-xl border border-[#2a2a2a] bg-[#121212] p-3 min-w-0 opacity-90">
            {inner}
        </div>
    );
}

function LlmResponsesSubsection({ prompt }) {
    const [selected, setSelected] = useState(ENGINE_ORDER[0]);
    const [responseOpen, setResponseOpen] = useState(true);
    const [sourcesOpen, setSourcesOpen] = useState(true);

    useEffect(() => {
        setResponseOpen(true);
        setSourcesOpen(true);
        const firstWith = ENGINE_ORDER.find((k) => engineRowHasResponse(prompt.engines?.[k]));
        setSelected(firstWith || ENGINE_ORDER[0]);
    }, [prompt]);

    const data = prompt.engines?.[selected];
    const cites = Array.isArray(data?.citations) ? data.citations.filter(isValidCitation) : [];
    const n = citationCountEngine(data);
    let body = String(data?.rawText || data?.snippet || '').trim();
    if (!body && n > 0) {
        body = 'Sources were extracted but answer text was not stored. Re-scan to capture full text.';
    }
    const displayBody = useMemo(
        () => formatEngineResponseForMarkdown(body, selected),
        [body, selected],
    );
    const hasResp = engineRowHasResponse(data);
    const mentionSnip = String(data?.snippet || '').trim();
    const displayMentionSnip = useMemo(
        () => (mentionSnip ? formatEngineResponseForMarkdown(mentionSnip, selected) : ''),
        [mentionSnip, selected],
    );
    const sentimentRaw = data?.sentiment && data.sentiment !== 'n/a' ? String(data.sentiment) : 'neutral';

    return (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3 sm:p-4 space-y-4">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white mb-1">Models</p>
                <p className="text-[11px] text-white mb-2.5 leading-snug">
                    Choose an engine to view its answer and sources.
                </p>
                <div className="flex flex-wrap gap-2">
                    {ENGINE_ORDER.map((ek) => {
                        const row = prompt.engines?.[ek];
                        const active = ek === selected;
                        const ok = engineRowHasResponse(row);
                        return (
                            <button
                                key={ek}
                                type="button"
                                onClick={() => setSelected(ek)}
                                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors min-w-0 ${
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
                                <span
                                    className="text-[12px] font-medium truncate max-w-[140px] sm:max-w-[180px] text-white"
                                    title={ENGINE_LABELS[ek] || ek}
                                >
                                    {ENGINE_LABELS[ek] || ek}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#0a0a0a] overflow-hidden">
                <button
                    type="button"
                    onClick={() => setResponseOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-[#111] transition-colors border-b border-[#262626]"
                >
                    <span className="text-[13px] font-semibold text-white">Response</span>
                    <ChevronDown className={`w-4 h-4 text-white shrink-0 transition-transform ${responseOpen ? 'rotate-180' : ''}`} strokeWidth={2.25} aria-hidden />
                </button>
                {responseOpen && (
                    <div className="px-3 py-3 space-y-3">
                        {!hasResp ? (
                            <p className="text-[12px] text-white">No stored response for this model.</p>
                        ) : (
                            <>
                                <div className="border-l-2 border-[#4a4a4a] pl-4 ml-0.5">
                                    <div
                                        className="max-h-[min(48vh,380px)] overflow-y-auto text-[13px] text-white leading-relaxed
                                        [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-1
                                        [&_ol]:my-2 [&_ol]:ml-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_li]:pl-0.5
                                        [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-white [&_h1]:mb-2 [&_h1]:mt-1
                                        [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-2 [&_h2]:mt-2
                                        [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mb-1.5 [&_h3]:mt-2
                                        [&_h4]:text-[13px] [&_h4]:font-semibold [&_h4]:mb-1.5 [&_h4]:text-white
                                        [&_blockquote]:border-l-2 [&_blockquote]:border-[#555] [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-white
                                        [&_code]:text-[12px] [&_code]:bg-[#1a1a1a] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#e0c896]
                                        [&_pre]:my-2 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:bg-[#111] [&_pre]:border [&_pre]:border-[#2a2a2a] [&_pre]:overflow-x-auto [&_pre]:text-[12px]
                                        [&_hr]:my-4 [&_hr]:border-[#333]"
                                    >
                                        <ReactMarkdown
                                            components={{
                                                a: ({ href, children }) => (
                                                    <a
                                                        href={href}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[#E92A15] underline underline-offset-2 break-all hover:text-[#ff6b52]"
                                                    >
                                                        {children}
                                                    </a>
                                                ),
                                            }}
                                        >
                                            {displayBody || '—'}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-[#222]">
                                    <span
                                        className={`flex items-center gap-1.5 text-[11px] font-semibold ${data?.mentioned ? 'text-emerald-400' : 'text-white'}`}
                                    >
                                        <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                                        Brand mentioned
                                    </span>
                                    <SentimentPercentDisplay label={sentimentRaw} size="sm" className="shrink-0" align="end" />
                                </div>
                                {mentionSnip ? (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white mb-1.5">Engine mention snippet</p>
                                        <div className="rounded-lg bg-[#080808] border border-[#1c1c1c] px-2.5 py-2 text-[12px] text-white leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0">
                                            <ReactMarkdown
                                                components={{
                                                    a: ({ href, children }) => (
                                                        <a href={href} target="_blank" rel="noreferrer" className="text-[#E92A15] underline break-all text-[11px]">
                                                            {children}
                                                        </a>
                                                    ),
                                                }}
                                            >
                                                {displayMentionSnip || mentionSnip}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#0a0a0a] overflow-hidden">
                <button
                    type="button"
                    onClick={() => setSourcesOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-[#111] transition-colors border-b border-[#262626]"
                >
                    <span className="text-[13px] font-semibold text-white">
                        Sources
                        <span className="ml-2 text-[11px] font-normal text-white tabular-nums">{n}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white shrink-0 transition-transform ${sourcesOpen ? 'rotate-180' : ''}`} strokeWidth={2.25} aria-hidden />
                </button>
                {sourcesOpen && (
                    <div className="p-3">
                        {cites.length === 0 ? (
                            <p className="text-[12px] text-[#555] py-2">No sources extracted for this model.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {cites.map((c, i) => (
                                    <SourceCard key={`${selected}-${i}-${c.url || c.domain || i}`} c={c} index={i} />
                                ))}
                            </div>
                        )}
                    </div>
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
    const trackingLocs = Array.isArray(user?.trackingLocations)
        ? user.trackingLocations.filter(Boolean).map(String).slice(0, 3)
        : [];
    const locationFallback = [user?.location, user?.country].filter(Boolean).join(', ') || '—';
    const locationDisplay = trackingLocs.length ? trackingLocs.join(' · ') : locationFallback;
    const runDay = formatDetailDate(prompt.runDate || scanScannedAt);
    const mentionLabels = collectMentionLabels(prompt, brandName, user?.domain);
    const snippet = firstBrandSnippet(prompt);
    const formattedSnippet = useMemo(
        () => (snippet ? formatEngineResponseForMarkdown(snippet, '') : ''),
        [snippet],
    );

    const isBrandMentionPill = (label) => {
        const l = String(label).toLowerCase();
        if (brandName && l === String(brandName).toLowerCase()) return true;
        if (domainShort && domainShort !== 'your site') {
            const d = domainShort.toLowerCase();
            if (l === d || l.endsWith(`.${d}`) || d.endsWith(`.${l}`)) return true;
        }
        return false;
    };

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
                        className="inline-flex items-center gap-2 text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
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
                                <button type="button" onClick={copyPromptOnly} className="w-full text-left px-3 py-2 text-[12px] text-white hover:bg-[#222]">
                                    Copy prompt
                                </button>
                                <button type="button" onClick={copyAllResponses} className="w-full text-left px-3 py-2 text-[12px] text-white hover:bg-[#222]">
                                    Copy all responses (plain)
                                </button>
                                <button type="button" onClick={downloadJson} className="w-full text-left px-3 py-2 text-[12px] text-white hover:bg-[#222]">
                                    Download JSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 space-y-6">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white mb-2">Prompt</p>
                        <div
                            id="prompt-detail-title"
                            className="rounded-2xl bg-[#1a1a1a] border border-[#2c2c2c] px-5 py-4 text-[14px] text-white leading-[1.55] whitespace-pre-wrap break-words"
                        >
                            {q}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-white">
                        <div className="inline-flex items-center rounded-full border border-[#2a2a2a] bg-[#0a0a0a] px-2.5 py-1.5 min-h-[36px]">
                            {enginesRespondedCount(prompt) > 0 ? (
                                <StackedEngineIcons
                                    size="sm"
                                    onlyActiveEngines
                                    byEngine={buildStackStatesFromPromptEngines(prompt.engines)}
                                />
                            ) : (
                                <span className="text-[11px] text-white px-1">—</span>
                            )}
                        </div>
                        <span className="text-white/50 hidden sm:inline">·</span>
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                            <Calendar className="w-3.5 h-3.5 text-white shrink-0" strokeWidth={2} aria-hidden />
                            <span className="truncate">{runDay}</span>
                        </span>
                        <span className="text-white/50 hidden sm:inline">·</span>
                        <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                            <MapPin className="w-3.5 h-3.5 text-white shrink-0" strokeWidth={2} aria-hidden />
                            <span className="truncate" title={locationDisplay}>
                                {locationDisplay}
                            </span>
                        </span>
                        <span className="w-full sm:w-auto sm:ml-auto flex justify-end">
                            <VisibilityBadge tier={tier} />
                        </span>
                    </div>

                    <div className="rounded-xl border border-[#2a2a2a] bg-[#101010] px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white mb-2">Visibility</p>
                        <p className={`text-[14px] font-medium flex items-center gap-2 ${anyMentioned ? 'text-emerald-400' : 'text-white'}`}>
                            <Check className={`w-4 h-4 shrink-0 ${anyMentioned ? 'opacity-100' : 'opacity-30'}`} strokeWidth={2.5} aria-hidden />
                            {anyMentioned
                                ? `${domainShort} is mentioned in at least one AI response`
                                : `${brandName} was not mentioned in stored responses for this prompt`}
                        </p>
                    </div>

                    {mentionLabels.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white mb-1">Mentions &amp; sources</p>
                            <p className="text-[11px] text-white/45 mb-2 leading-snug max-w-[52rem]">
                                Your brand and domain, then every distinct hostname found in citation URLs for this prompt (all engines). Per-model link cards are under Sources below.
                            </p>
                            <div className="flex flex-wrap gap-2 max-h-[min(40vh,360px)] overflow-y-auto pr-0.5">
                                {mentionLabels.map((label, mi) => {
                                    const brand = isBrandMentionPill(label);
                                    return (
                                        <span
                                            key={`${label}-${mi}`}
                                            className={`text-[11px] px-2.5 py-1 rounded-lg max-w-full truncate inline-flex items-center gap-1.5 border ${
                                                brand
                                                    ? 'bg-emerald-500/[0.12] border-emerald-500/45 text-emerald-100'
                                                    : 'bg-[#1a1a1a] border-[#333] text-white'
                                            }`}
                                            title={label}
                                        >
                                            <Globe className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                                            {label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {snippet && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E92A15] mb-2">Mention snippet</p>
                            <div className="rounded-xl bg-[#E92A15]/[0.08] border border-[#E92A15]/25 px-3.5 py-3 text-[13px] text-white leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0">
                                <ReactMarkdown
                                    components={{
                                        a: ({ href, children }) => (
                                            <a href={href} target="_blank" rel="noreferrer" className="text-[#E92A15] underline break-all">
                                                {children}
                                            </a>
                                        ),
                                    }}
                                >
                                    {formattedSnippet || snippet}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    <LlmResponsesSubsection prompt={prompt} />
                </div>
            </div>
        </div>
    );
}

function inferCountryFromUser(u) {
    const tl = Array.isArray(u?.trackingLocations)
        ? u.trackingLocations.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 3)
        : [];
    const locBlob = `${(u?.location || '').toLowerCase()} ${tl.join(' ')}`.toLowerCase();
    if (/\bindia\b|\bbangalore\b|\bmumbai\b|\bdelhi\b/.test(locBlob)) return 'IN';
    if (/\buk\b|\blondon\b|\bunited kingdom\b/.test(locBlob)) return 'GB';
    if (/\busa\b|\bus\b|\bunited states\b|\bnyc\b/.test(locBlob)) return 'US';
    return '';
}

function AddCustomPromptModal({ user, scanId, onClose, onSaved }) {
    const [text, setText] = useState('');
    const [engines, setEngines] = useState(() => new Set(ENGINE_ORDER));
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);

    const toggleEngine = (ek) => {
        setEngines((prev) => {
            const next = new Set(prev);
            if (next.has(ek)) next.delete(ek);
            else next.add(ek);
            return next;
        });
    };

    const submit = async () => {
        setErr(null);
        const lines = text
            .split(/\n+/)
            .map((s) => s.trim())
            .filter(Boolean);
        if (lines.length === 0) {
            setErr('Enter at least one prompt.');
            return;
        }
        if (lines.length > 5) {
            setErr('Maximum 5 prompts (one per line).');
            return;
        }
        const selected = ENGINE_ORDER.filter((k) => engines.has(k));
        if (selected.length === 0) {
            setErr('Select at least one model.');
            return;
        }
        const comps = (user?.competitors || []).map((c) => (typeof c === 'string' ? { name: c, domain: c } : c));
        setBusy(true);
        try {
            const res = await apiClient.visibility.appendCustomPromptsToScan({
                scanId,
                queries: lines,
                engines: selected,
                brandName: user?.brandName || '',
                domain: user?.domain || '',
                competitors: comps,
                country: inferCountryFromUser(user),
                language: user?.language || 'English',
                projectId: user?.projectId,
            });
            if (res?.success && res.result) {
                onSaved({ result: res.result, scanId: res.scanId });
                onClose();
            } else {
                setErr(res?.message || 'Request failed');
            }
        } catch (e) {
            setErr(e.message || 'Request failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-prompt-title"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-2xl border border-[#333] bg-[#0d0d0d] shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#2a2a2a] bg-[#111]">
                    <h2 id="custom-prompt-title" className="text-[15px] font-semibold text-white">
                        Add custom prompt
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-white hover:bg-[#222] transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-4 py-4 space-y-4">
                    <p className="text-[12px] text-white leading-relaxed">
                        Only these prompts are sent to the APIs you pick — your scan matrix is not re-run. Results merge into this scan,
                        scores and SOV refresh, and data is saved.
                    </p>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white mb-1.5">
                            Prompts (max 5, one per line)
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={5}
                            placeholder="e.g. How does Acme compare to alternatives for mid-market CRM?"
                            className="w-full rounded-xl border border-[#333] bg-[#0a0a0a] px-3 py-2.5 text-[13px] text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-[#E92A15]/50 resize-y min-h-[120px]"
                        />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white mb-2">Models to query</p>
                        <div className="flex flex-wrap gap-2">
                            {ENGINE_ORDER.map((ek) => {
                                const on = engines.has(ek);
                                return (
                                    <button
                                        key={ek}
                                        type="button"
                                        onClick={() => toggleEngine(ek)}
                                        className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                                            on
                                                ? 'border-[#E92A15]/55 bg-[#1a0a08] text-white'
                                                : 'border-[#333] bg-[#141414] text-white/50'
                                        }`}
                                    >
                                        <EngineIconBadge engineKey={ek} hasResponse={on} brandMentioned={false} />
                                        {ENGINE_LABELS[ek]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {err ? (
                        <p className="text-[12px] text-red-400 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            {err}
                        </p>
                    ) : null}
                </div>
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#2a2a2a] bg-[#0a0a0a]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="px-4 py-2 rounded-xl text-[13px] font-medium text-white border border-[#333] hover:bg-[#1a1a1a] disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void submit()}
                        disabled={busy}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-[#E92A15] hover:bg-[#D12512] disabled:opacity-50"
                    >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {busy ? 'Running…' : 'Run & save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PromptIntelPage({ user, scanManager, scanId, applyScanResult }) {
    const [detailModal, setDetailModal] = useState(null);
    const [customModalOpen, setCustomModalOpen] = useState(false);

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

    const persistedScanId = useMemo(
        () => readLastVisibilityScanId(user?.authUserId, user?.domain, user?.projectId),
        [user?.authUserId, user?.domain, user?.projectId],
    );
    const effectiveScanId = scanId || persistedScanId || null;
    const trackingScopeLabel = useMemo(() => formatPromptTrackingDisplay(user), [user]);

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
            <div className="h-[105px] flex items-end justify-between gap-4 -mt-8 -mx-8 px-8 pb-3 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4 pb-1 min-w-0">
                    <div className="w-11 h-11 bg-[#0a0505] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)] shrink-0">
                        <Terminal className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Prompt Intelligence</h1>
                        <p className="text-white text-[13px] mt-0.5">
                            {hasData
                                ? `${allPrompts.length} prompts · ${totalEngineResponses} engine responses — open a row for Perplexity, Gemini, ChatGPT & Google AI Overviews in one Models panel`
                                : 'Run a visibility scan to see per-prompt AI responses and citations'}
                        </p>
                    </div>
                </div>
                <div className="pb-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => setCustomModalOpen(true)}
                        disabled={!effectiveScanId || scanManager?.scanStatus === 'scanning'}
                        title={!effectiveScanId ? 'Complete a visibility scan first' : undefined}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-[#1a1a1a] border border-[#333] hover:border-[#E92A15]/45 hover:bg-[#221010] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.25} />
                        Custom prompt
                    </button>
                </div>
            </div>

            {customModalOpen && effectiveScanId && applyScanResult ? (
                <AddCustomPromptModal
                    user={user}
                    scanId={effectiveScanId}
                    onClose={() => setCustomModalOpen(false)}
                    onSaved={(payload) => {
                        if (payload?.result) applyScanResult(payload.result, payload.scanId);
                    }}
                />
            ) : null}

            <div className="mt-8 space-y-5">
                <div className="bg-black border border-[#262626] rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#262626] bg-[#0a0a0a]">
                        <h3 className="text-white font-semibold text-[14px] tracking-tight">Prompt matrix</h3>
                        <p className="text-white text-[11px] mt-1">
                            {allPrompts.length} prompt{allPrompts.length !== 1 ? 's' : ''} from your latest stored scan. Tracking matches your onboarding / Brand Hub reach and markets. Models shows only engines that returned a response; Visibility is mention breadth; Citations lists up to five source domains plus total count (+N).
                        </p>
                    </div>
                    {!hasData ? (
                        <div className="px-5 py-12 text-center">
                            <AlertCircle className="w-8 h-8 text-[#333] mx-auto mb-3" />
                            <p className="text-white text-[13px]">Run a visibility scan to populate prompts and engine responses.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[12px] border-collapse">
                                <thead>
                                    <tr className="bg-[#141414] border-b border-[#262626]">
                                        <th className="py-3 pl-4 pr-2 text-[10px] font-semibold text-white uppercase tracking-wider w-14">#</th>
                                        <th className="py-3 px-3 text-[10px] font-semibold text-white uppercase tracking-wider">Prompt</th>
                                        <th
                                            className="py-3 px-2 text-[10px] font-semibold text-white uppercase tracking-wider text-left min-w-[120px] max-w-[200px]"
                                            title="Market reach and regions from onboarding / Brand Hub (same for all prompts in this project)."
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="w-3 h-3 opacity-70 shrink-0" aria-hidden />
                                                Tracking
                                            </span>
                                        </th>
                                        <th
                                            className="py-3 px-2 text-[10px] font-semibold text-white uppercase tracking-wider text-center whitespace-nowrap"
                                            title="Logos in each row show only models that returned a response for that prompt."
                                        >
                                            Models
                                        </th>
                                        <th className="py-3 px-2 text-[10px] font-semibold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                            Visibility
                                        </th>
                                        <th
                                            className="py-3 px-2 text-[10px] font-semibold text-white uppercase tracking-wider text-center whitespace-nowrap"
                                            title="Up to 24 source domains (favicons) and +N total citations for this prompt."
                                        >
                                            Citations
                                        </th>
                                        <th className="py-3 pr-4 pl-2 text-[10px] font-semibold text-white uppercase tracking-wider text-center w-20">
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
                                        const citeDomains = collectOrderedUniqueCitationDomains(p);
                                        const citeTotal = totalCitationsPrompt(p);
                                        return (
                                            <tr
                                                key={rowKey}
                                                className="border-b border-[#1f1f1f] hover:bg-[#0a0a0a] transition-colors cursor-pointer"
                                                onClick={openDetail}
                                            >
                                                <td className="py-3 pl-4 pr-2 align-middle text-[11px] font-mono text-white">
                                                    {displayId}
                                                </td>
                                                <td className="py-3 px-3 align-middle max-w-[min(520px,52vw)]">
                                                    <p
                                                        className={`text-[13px] text-white truncate ${qPrev.truncated ? 'cursor-help' : ''}`}
                                                        title={qPrev.truncated ? qPrev.full : undefined}
                                                    >
                                                        {qPrev.display}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-2 align-middle min-w-[120px] max-w-[200px]">
                                                    <p className="text-[11px] text-white leading-snug line-clamp-2" title={trackingScopeLabel}>
                                                        {trackingScopeLabel}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-2 align-middle">
                                                    <div className="flex items-center justify-center min-h-[28px]">
                                                        {enginesRespondedCount(p) > 0 ? (
                                                            <StackedEngineIcons
                                                                size="sm"
                                                                onlyActiveEngines
                                                                byEngine={buildStackStatesFromPromptEngines(p.engines)}
                                                            />
                                                        ) : (
                                                            <span className="text-white text-[12px] tabular-nums">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 align-middle text-center">
                                                    <VisibilityBadge tier={visibilityTier(p)} />
                                                </td>
                                                <td className="py-3 px-2 align-middle">
                                                    <div className="flex items-center justify-center min-h-[28px]">
                                                        <StackedCitationIcons domains={citeDomains} totalCount={citeTotal} />
                                                    </div>
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
