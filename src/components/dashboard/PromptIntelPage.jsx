import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import {
    CheckCircle,
    Terminal, Activity,
    Plus, X, Send, Loader2, Lightbulb, Star, AlertCircle, Trash2,
    ChevronDown, ChevronUp, Link2, Check, MessageSquare, Copy,
} from 'lucide-react';
import { ChatGPTLogo, GeminiLogo, PerplexityLogo } from '../landing/AILogos';

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

const ENGINE_ORDER = ['perplexity', 'gemini', 'googleAI'];
const ENGINE_LABELS = { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'ChatGPT' };

function promptDisplayId(index) {
    return `P${String(index + 1).padStart(2, '0')}`;
}

function citationCountEngine(e) {
    if (!e) return 0;
    return (e.citations || []).length || e.citationCount || 0;
}

function totalCitationsPrompt(p) {
    return ENGINE_ORDER.reduce((sum, k) => sum + citationCountEngine(p.engines?.[k]), 0);
}

/** High: 2+ engines mention brand; Partial: exactly one; None: zero */
function visibilityTier(p) {
    const rows = ENGINE_ORDER.map((k) => p.engines?.[k]).filter(Boolean);
    if (rows.length === 0) return 'none';
    const m = rows.filter((e) => e.mentioned).length;
    if (m === 0) return 'none';
    if (m >= 2) return 'high';
    return 'partial';
}

function citationHostLabel(c) {
    try {
        const h = new URL(c.url).hostname.replace(/^www\./, '');
        return h || c.title || 'link';
    } catch {
        return c.domain || c.title || (c.url || '').slice(0, 36) || 'link';
    }
}

function VisibilityBadge({ tier }) {
    const styles = {
        high: 'border-emerald-500/55 text-emerald-400 bg-emerald-950/25',
        partial: 'border-amber-500/45 text-amber-400 bg-amber-950/15',
        none: 'border-[#333] text-[#666] bg-[#141414]',
    };
    const labels = { high: 'High', partial: 'Partial', none: 'None' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[tier]}`}>
            {labels[tier]}
        </span>
    );
}

function EngineIconBadge({ engineKey, active }) {
    const box = active
        ? 'border-emerald-500/70 bg-[#0a1810] shadow-[0_0_0_1px_rgba(34,197,94,0.15)]'
        : 'border-[#2c2c2c] bg-[#121212] opacity-[0.55]';
    const iconCls = 'w-[17px] h-[17px] object-contain text-white';
    return (
        <div
            className={`w-8 h-8 rounded-md flex items-center justify-center border ${box} shrink-0`}
            title={ENGINE_LABELS[engineKey]}
        >
            {engineKey === 'perplexity' && <PerplexityLogo className={iconCls} />}
            {engineKey === 'gemini' && <GeminiLogo className={iconCls} />}
            {engineKey === 'googleAI' && <ChatGPTLogo className={iconCls} />}
        </div>
    );
}

function EngineResponseCard({ engineKey, data }) {
    const label = ENGINE_LABELS[engineKey];
    const cites = data?.citations || [];
    const n = cites.length || data?.citationCount || 0;
    const body = String(data?.rawText || data?.snippet || '').trim();
    const ok = !!(data && (body.length > 0 || n > 0 || (data.status && !String(data.status).startsWith('⚠'))));
    const sentiment =
        data?.sentiment && data.sentiment !== 'n/a' ? String(data.sentiment) : 'Neutral';

    return (
        <div className="rounded-xl border border-[#262626] bg-[#0a0a0a] flex flex-col min-h-[300px] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#262626]">
                <div className="flex items-center gap-2 min-w-0">
                    <EngineIconBadge engineKey={engineKey} active={!!data?.mentioned} />
                    <span className="text-[13px] font-medium text-white truncate">{label}</span>
                </div>
                {ok ? (
                    <span className="text-[9px] font-bold tracking-wide text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded bg-emerald-950/30 shrink-0">
                        SUCCESS
                    </span>
                ) : (
                    <span className="text-[9px] font-bold uppercase text-[#555] border border-[#333] px-2 py-0.5 rounded shrink-0">
                        No data
                    </span>
                )}
            </div>
            <div className="px-3 py-2 flex items-center justify-between border-b border-[#262626]">
                <span
                    className={`flex items-center gap-1.5 text-[11px] font-semibold ${data?.mentioned ? 'text-emerald-400' : 'text-[#555]'}`}
                >
                    <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                    Brand Mentioned
                </span>
                <span className="text-[10px] text-[#9a9a9a] capitalize shrink-0">{sentiment}</span>
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
                        cites.map((c, i) => (
                            <a
                                key={i}
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] px-2 py-1 rounded-md bg-[#141414] border border-[#2a2a2a] text-[#ececec] hover:border-emerald-500/35 max-w-full truncate inline-block"
                            >
                                {citationHostLabel(c)}
                            </a>
                        ))
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
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="border-t border-[#1f1f1f] bg-[#030303]">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#1f1f1f]">
                <span className="text-[11px] font-mono text-[#666] w-9 shrink-0">{displayId}</span>
                <div className="flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#0f0f0f] px-2 py-1">
                    {ENGINE_ORDER.map((ek) => (
                        <EngineIconBadge key={ek} engineKey={ek} active={!!prompt.engines?.[ek]?.mentioned} />
                    ))}
                </div>
                <VisibilityBadge tier={tier} />
                <span className="inline-flex items-center gap-1 text-[13px] text-white font-medium tabular-nums">
                    <Link2 className="w-3.5 h-3.5 text-[#888]" />
                    {total}
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

function IntelligencePanel({ intelligence }) {
    if (!intelligence) return null;
    return (
        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-medium text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" /> AI-Powered Intelligence
            </h3>
            {intelligence.overallAssessment && (
                <p className="text-[#aaa] text-sm leading-relaxed">{intelligence.overallAssessment}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {intelligence.strengthAreas?.length > 0 && (
                    <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
                        <h4 className="text-green-400 text-xs font-medium mb-2">Strengths</h4>
                        <ul className="space-y-1">{intelligence.strengthAreas.map((s, i) => (
                            <li key={i} className="text-[#aaa] text-xs flex gap-1.5"><CheckCircle className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />{s}</li>
                        ))}</ul>
                    </div>
                )}
                {intelligence.weaknessAreas?.length > 0 && (
                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                        <h4 className="text-red-400 text-xs font-medium mb-2">Weaknesses</h4>
                        <ul className="space-y-1">{intelligence.weaknessAreas.map((s, i) => (
                            <li key={i} className="text-[#aaa] text-xs flex gap-1.5"><AlertCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />{s}</li>
                        ))}</ul>
                    </div>
                )}
            </div>
            {intelligence.topOpportunities?.length > 0 && (
                <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                    <h4 className="text-purple-400 text-xs font-medium mb-2">Top Opportunities</h4>
                    <ul className="space-y-1.5">{intelligence.topOpportunities.map((s, i) => (
                        <li key={i} className="text-[#aaa] text-xs flex gap-1.5"><Star className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />{s}</li>
                    ))}</ul>
                </div>
            )}
        </div>
    );
}

function buildPromptSuggestions(user) {
    const brand = user?.brandName || 'our brand';
    const industry = user?.industry || '';
    const location = user?.location || '';
    const domain = user?.domain || '';
    const compNames = (user?.competitors || [])
        .slice(0, 3)
        .map(c => typeof c === 'string' ? c : c.name || c.domain)
        .filter(Boolean);
    const compStr = compNames.length > 0 ? compNames.join(', ') : 'top competitors';

    const base = [
        `What is ${brand} and what do they offer?`,
        `Best ${industry || 'software'} platforms in ${location || '2025'}`,
        `${brand} vs ${compStr} — which is better?`,
        `Top alternatives to ${brand}`,
        `Is ${brand} worth it for small businesses?`,
        `${brand} reviews and pricing comparison`,
    ];

    if (industry) {
        base.push(`What are the leading ${industry} companies?`);
        base.push(`Best ${industry} tools for enterprises`);
    }
    if (location) {
        base.push(`Best ${industry || 'companies'} in ${location}`);
    }
    if (domain) {
        base.push(`What does ${domain} do?`);
    }

    return base;
}

function customPromptsStorageKey(domain) {
    return `searchlyst_custom_prompts_${domain || 'default'}`;
}

export default function PromptIntelPage({ user }) {
    const [expandedPromptKey, setExpandedPromptKey] = useState(null);
    const [showCustomPrompt, setShowCustomPrompt] = useState(false);
    const [batchQueries, setBatchQueries] = useState(['']);
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchError, setBatchError] = useState(null);
    const [customPrompts, setCustomPrompts] = useState([]);

    const promptSuggestions = useMemo(() => buildPromptSuggestions(user), [user]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(customPromptsStorageKey(user?.domain));
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr) && arr.length) setCustomPrompts(arr);
            }
        } catch { /* ignore */ }
    }, [user?.domain]);

    const persistCustom = useCallback((list) => {
        setCustomPrompts(list);
        try { localStorage.setItem(customPromptsStorageKey(user?.domain), JSON.stringify(list)); } catch { /* ignore */ }
    }, [user?.domain]);

    const scanData = useMemo(() => getVisibilityData(user?.domain, user?.projectId), [user?.domain, user?.projectId]);
    const promptsData = useMemo(() => {
        const rows = scanData?.prompts?.length ? scanData.prompts : [];
        const stamp = scanData?.scannedAt;
        const day = stamp ? new Date(stamp).toISOString().slice(0, 10) : null;
        return rows.map((p) => ({ ...p, runDate: p.runDate || day }));
    }, [scanData]);

    const allPrompts = useMemo(() => [...promptsData, ...customPrompts], [promptsData, customPrompts]);
    const hasData = allPrompts.length > 0;

    const intelligence = scanData?.intelligence || null;

    const addBatchRow = () => {
        if (batchQueries.length < 10) setBatchQueries(prev => [...prev, '']);
    };
    const removeBatchRow = (idx) => {
        setBatchQueries(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
    };
    const updateBatchRow = (idx, val) => {
        setBatchQueries(prev => prev.map((q, i) => i === idx ? val : q));
    };
    const useSuggestion = (text) => {
        const emptyIdx = batchQueries.findIndex(q => !q.trim());
        if (emptyIdx >= 0) {
            updateBatchRow(emptyIdx, text);
        } else if (batchQueries.length < 10) {
            setBatchQueries(prev => [...prev, text]);
        }
    };

    const runBatch = async () => {
        const queries = batchQueries.map(q => q.trim()).filter(Boolean);
        if (queries.length === 0) return;
        setBatchLoading(true);
        setBatchError(null);
        try {
            const res = await apiClient.visibility.runCustomPromptsBatch({
                queries,
                brandName: user?.brandName || '',
                domain: user?.domain || '',
                competitors: user?.competitors || [],
                country: '',
            });
            if (res.success && Array.isArray(res.prompts) && res.prompts.length > 0) {
                const merged = [...customPrompts, ...res.prompts];
                persistCustom(merged);
                setBatchQueries(['']);
                setShowCustomPrompt(false);
            } else {
                setBatchError('No results returned. Try different prompts.');
            }
        } catch (err) {
            setBatchError(err?.message || 'Failed to run prompts');
        } finally {
            setBatchLoading(false);
        }
    };

    return (
        <div className="w-full pb-12">
            <div className="h-[105px] flex items-end justify-between -mt-8 -mx-8 px-8 pb-3 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4 pb-1">
                    <div className="w-11 h-11 bg-[#0a0505] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Terminal className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Prompt Intelligence</h1>
                        <p className="text-[#666] text-[13px] mt-0.5">{hasData ? 'Per-prompt analysis across Perplexity, Gemini & ChatGPT' : 'Analyze exact LLM responses, citations, and competitor overlap'}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCustomPrompt(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#E92A15] hover:bg-[#D12512] text-white text-[12px] font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(233,42,21,0.25)] mb-1"
                >
                    <Plus className="w-3.5 h-3.5" /> Custom Prompt
                </button>
            </div>

            <div className="mt-8 space-y-5">
                {intelligence && <IntelligencePanel intelligence={intelligence} />}

                <div className="bg-black border border-[#262626] rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#262626] bg-[#0a0a0a]">
                        <h3 className="text-white font-semibold text-[14px] tracking-tight">Prompt matrix</h3>
                        <p className="text-[#666] text-[11px] mt-1">
                            {allPrompts.length} prompt{allPrompts.length !== 1 ? 's' : ''}
                            {customPrompts.length > 0 ? ` · ${customPrompts.length} custom` : ''}. Expand a row to read the full prompt, engine responses, and citations.
                        </p>
                    </div>
                    {!hasData ? (
                        <div className="px-5 py-12 text-center text-[#555] text-[13px]">Run a visibility scan to populate prompts and engine responses.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[12px] border-collapse">
                                <thead>
                                    <tr className="bg-[#141414] border-b border-[#262626]">
                                        <th className="py-3 pl-4 pr-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider w-14">#</th>
                                        <th className="py-3 px-3 text-[10px] font-semibold text-[#737373] uppercase tracking-wider">Prompt</th>
                                        <th className="py-3 px-2 text-[10px] font-semibold text-[#737373] uppercase tracking-wider text-center whitespace-nowrap">
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
                                        const rowKey = p.promptId || `${i}-${(p.query || '').slice(0, 24)}`;
                                        const open = expandedPromptKey === rowKey;
                                        const displayId = promptDisplayId(i);
                                        const qtext = p.query || p.prompt || '—';
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
                                                            {ENGINE_ORDER.map((ek) => (
                                                                <EngineIconBadge
                                                                    key={ek}
                                                                    engineKey={ek}
                                                                    active={!!p.engines?.[ek]?.mentioned}
                                                                />
                                                            ))}
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

            {showCustomPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget && !batchLoading) setShowCustomPrompt(false); }}>
                    <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-semibold text-[16px]">Add Custom Prompts</h3>
                            <button onClick={() => { if (!batchLoading) setShowCustomPrompt(false); }} className="text-[#666] hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-[#888] text-[12px] mb-5">
                            Add one or multiple prompts below. Only these prompts are sent to Perplexity, Gemini &amp; ChatGPT — your existing scan data stays untouched.
                        </p>

                        <div className="space-y-2 mb-4">
                            {batchQueries.map((q, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <span className="text-[#555] text-[11px] font-mono mt-3 w-5 text-right shrink-0">{idx + 1}.</span>
                                    <textarea
                                        value={q}
                                        onChange={e => updateBatchRow(idx, e.target.value)}
                                        placeholder={idx === 0 ? 'e.g. What are the best platforms for first-time buyers?' : 'Add another prompt…'}
                                        rows={2}
                                        className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-[#444] resize-none focus:outline-none focus:border-[#E92A15]/50 transition-colors"
                                    />
                                    {batchQueries.length > 1 && (
                                        <button type="button" onClick={() => removeBatchRow(idx)} className="mt-2.5 text-[#555] hover:text-red-400 transition-colors p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {batchQueries.length < 10 && (
                            <button
                                type="button"
                                onClick={addBatchRow}
                                className="flex items-center gap-1.5 text-[12px] text-[#888] hover:text-white transition-colors mb-5"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add another prompt row
                            </button>
                        )}

                        <div className="border-t border-[#1e1e1e] pt-4 mb-5">
                            <p className="text-[#666] text-[11px] font-semibold uppercase tracking-wider mb-2.5">Suggestions — click to add</p>
                            <div className="flex flex-wrap gap-1.5">
                                {promptSuggestions.slice(0, 8).map((s, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => useSuggestion(s)}
                                        className="text-[11px] px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-[#aaa] hover:border-[#E92A15]/40 hover:text-white transition-colors text-left leading-snug"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {batchError && <p className="text-red-400 text-[12px] mb-3">{batchError}</p>}

                        <div className="flex items-center justify-between">
                            <p className="text-[#555] text-[11px]">
                                {batchQueries.filter(q => q.trim()).length} prompt{batchQueries.filter(q => q.trim()).length !== 1 ? 's' : ''} will be sent
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => { if (!batchLoading) setShowCustomPrompt(false); }} className="px-4 py-2 text-[#888] text-[12px] hover:text-white transition-colors">Cancel</button>
                                <button
                                    disabled={batchQueries.every(q => !q.trim()) || batchLoading}
                                    onClick={runBatch}
                                    className="flex items-center gap-2 px-5 py-2 bg-[#E92A15] hover:bg-[#D12512] text-white text-[12px] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {batchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    {batchLoading ? 'Running…' : `Run ${batchQueries.filter(q => q.trim()).length > 1 ? `${batchQueries.filter(q => q.trim()).length} Prompts` : 'Prompt'}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
