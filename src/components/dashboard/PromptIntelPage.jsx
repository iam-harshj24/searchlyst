import React, { useState, useMemo } from 'react';
import { apiClient } from '@/api/apiClient';
import {
    Search, ChevronDown, Eye, EyeOff,
    MessageSquare, CheckCircle, XCircle, Target,
    Terminal, Activity, Link2, AlertTriangle,
    Plus, X, Send, Loader2, Lightbulb, Star, AlertCircle
} from 'lucide-react';

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

const ENGINE_META = {
    perplexity: { label: 'Perplexity', color: '#20B2AA', icon: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M4 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" /><path d="M12 12v10" stroke="currentColor" strokeWidth="1.5" /></svg> },
    gemini: { label: 'Gemini', color: '#4285F4', icon: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5" /><path d="M12 2C8 8 8 16 12 22C16 16 16 8 12 2z" fill="currentColor" opacity="0.6" /></svg> },
    googleAI: { label: 'ChatGPT', color: '#10A37F', icon: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
};

const ENGINE_ORDER = ['perplexity', 'gemini', 'googleAI'];

function EngineColumn({ eng, data }) {
    const meta = ENGINE_META[eng] || { label: eng, color: '#888', icon: () => null };
    const Icon = meta.icon;
    const tone = (data?.sentiment || 'neutral').toString().toLowerCase();
    const toneLabel = tone.charAt(0).toUpperCase() + tone.slice(1);
    const hasResponse = data?.status?.includes('✓');

    return (
        <div className="flex flex-col border border-[#1a1a1a] rounded-xl overflow-hidden bg-[#0d0d0d]">
            <div className="px-4 py-3 bg-[#111] border-b border-[#1a1a1a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a]" style={{ color: meta.color }}><Icon /></div>
                    <span className="text-[#eee] font-semibold text-[13px]">{meta.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${hasResponse ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#eab308]/10 text-[#eab308]'}`}>
                    {hasResponse ? 'SUCCESS' : 'NO DATA'}
                </span>
            </div>
            <div className="px-4 py-2.5 border-b border-[#1a1a1a] bg-[#080808] flex items-center justify-between text-[11px] font-medium">
                <span className={`flex items-center gap-1.5 ${data?.mentioned ? 'text-[#22c55e]' : 'text-[#888]'}`}>
                    {data?.mentioned ? <CheckCircle className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {data?.mentioned ? 'Brand Mentioned' : 'Not Mentioned'}
                </span>
                <span className={`${tone === 'positive' ? 'text-[#22c55e]' : tone === 'negative' ? 'text-[#ef4444]' : 'text-[#888]'}`}>{toneLabel}</span>
            </div>
            <div className="p-4 flex-1 border-b border-[#1a1a1a]">
                <h4 className="text-[10px] font-bold text-[#555] flex items-center gap-1.5 uppercase tracking-wider mb-2"><MessageSquare className="w-3 h-3" /> AI Response</h4>
                <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-[#bbb] text-[12px] leading-[1.7] whitespace-pre-wrap font-mono">{data?.rawText || 'No response captured.'}</p>
                </div>
            </div>
            <div className="p-4 bg-[#080808]">
                <h4 className="text-[10px] font-bold text-[#555] flex items-center justify-between uppercase tracking-wider mb-3">
                    <span className="flex items-center gap-1.5"><Link2 className="w-3 h-3" /> Sources & Citations</span>
                    <span>{(data?.citations || []).length} cited</span>
                </h4>
                {(data?.citations || []).length > 0 ? (
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                        {(data?.citations || []).map((cite, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-[#111] border border-[#1a1a1a] rounded-lg">
                                <span className="text-[#444] text-[10px] font-mono font-bold shrink-0">[{idx + 1}]</span>
                                <a href={cite.url} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] text-[11px] hover:underline truncate flex-1" title={cite.url}>{cite.domain || 'unknown'}</a>
                                <div className="flex items-center gap-1 shrink-0">
                                    {cite.isTargetBrand && <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-[#22c55e]/10 text-[#22c55e]">YOU</span>}
                                    {cite.isCompetitor && <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-[#eab308]/10 text-[#eab308]">COMP</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-[#444] text-[11px] py-3 text-center">No sources returned.</p>}
            </div>
        </div>
    );
}

function ExpandedPromptDetail({ prompt }) {
    const gapDomains = new Set();
    for (const eng of ENGINE_ORDER) {
        const data = prompt.engines?.[eng];
        if (data && !data.mentioned) {
            (data.citations || []).filter(c => c.isCompetitor && c.domain).forEach(c => gapDomains.add(c.domain));
        }
    }

    return (
        <div className="border border-[#222] border-t-0 bg-[#0A0A0A] rounded-b-2xl p-6 mb-3">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {ENGINE_ORDER.map(eng => <EngineColumn key={eng} eng={eng} data={prompt.engines?.[eng] || null} />)}
            </div>
            {gapDomains.size > 0 && (
                <div className="mt-5 pt-5 border-t border-[#1a1a1a]">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-[#eab308]" />
                        <h4 className="text-[13px] font-semibold text-white">Content Gaps — Competitors Cited, You're Not</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from(gapDomains).map(comp => (
                            <div key={comp} className="bg-[#2a0e0e]/50 border border-[#E92A15]/30 rounded-xl p-3 flex gap-3">
                                <Target className="w-4 h-4 text-[#E92A15] shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="text-[#fff] text-[12px] font-medium mb-0.5">{comp}</h5>
                                    <p className="text-[#aaa] text-[11px] leading-relaxed">Competitor cited here but your brand was omitted.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
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

export default function PromptIntelPage({ user }) {
    const [expandedPrompt, setExpandedPrompt] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCustomPrompt, setShowCustomPrompt] = useState(false);
    const [customQuery, setCustomQuery] = useState('');
    const [customLoading, setCustomLoading] = useState(false);
    const [customPrompts, setCustomPrompts] = useState([]);

    const scanData = useMemo(() => getVisibilityData(user?.domain, user?.projectId), [user?.domain, user?.projectId]);
    const promptsData = useMemo(() => {
        const rows = scanData?.prompts?.length ? scanData.prompts : [];
        const stamp = scanData?.scannedAt;
        const day = stamp ? new Date(stamp).toISOString().slice(0, 10) : null;
        return rows.map(p => ({ ...p, runDate: p.runDate || day })).slice(0, 20);
    }, [scanData]);

    const allPrompts = useMemo(() => [...promptsData, ...customPrompts], [promptsData, customPrompts]);
    const hasData = allPrompts.length > 0;
    const filteredPrompts = allPrompts.filter(p => !searchQuery || p.query?.toLowerCase().includes(searchQuery.toLowerCase()));

    const totalPrompts = allPrompts.length;
    const mentionedCount = allPrompts.filter(p => Object.values(p.engines || {}).some(e => e.mentioned)).length;
    const totalSources = allPrompts.reduce((sum, p) => sum + Object.values(p.engines || {}).reduce((s, e) => s + (e.citations?.length || e.citationCount || 0), 0), 0);
    const gapCount = allPrompts.filter(p => Object.entries(p.engines || {}).some(([, e]) => !e.mentioned && (e.citations || []).some(c => c.isCompetitor))).length;

    const intelligence = scanData?.intelligence || null;

    return (
        <div className="w-full pb-12">
            <div className="h-[105px] flex items-end justify-between -mt-8 -mx-8 px-8 pb-3 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4 pb-1">
                    <div className="w-11 h-11 bg-[#0a0505] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Terminal className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Prompt Intelligence</h1>
                        <p className="text-[#666] text-[13px] mt-0.5">{hasData ? `${totalPrompts} prompts tracked across 3 AI engines` : 'Analyze exact LLM responses, citations, and competitor overlap'}</p>
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

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl p-5">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.14em] mb-3">PROMPTS TRACKED</p>
                        <p className={`text-[38px] font-bold tracking-tight leading-none ${hasData ? 'text-white' : 'text-[#333]'}`}>{hasData ? totalPrompts : '—'}</p>
                    </div>
                    <div className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl p-5">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.14em] mb-3">BRAND VISIBLE IN</p>
                        <p className={`text-[38px] font-bold tracking-tight leading-none ${hasData ? 'text-white' : 'text-[#333]'}`}>
                            {hasData ? <><span className="text-[#22c55e]">{mentionedCount}</span><span className="text-[#555] text-[18px] ml-1">/ {totalPrompts}</span></> : '—'}
                        </p>
                    </div>
                    <div className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl p-5">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.14em] mb-3">TOTAL CITATIONS</p>
                        <p className={`text-[38px] font-bold tracking-tight leading-none ${hasData ? 'text-white' : 'text-[#333]'}`}>{hasData ? totalSources : '—'}</p>
                    </div>
                    <div className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl p-5">
                        <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.14em] mb-3">CONTENT GAPS</p>
                        <p className={`text-[38px] font-bold tracking-tight leading-none ${hasData ? 'text-[#eab308]' : 'text-[#333]'}`}>{hasData ? gapCount : '—'}</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search prompts..." className="w-full pl-11 pr-4 py-3 bg-[#0B0B0B] border border-[#222] rounded-xl text-[#eee] text-[13px] placeholder:text-[#555] focus:outline-none focus:border-[#E92A15]/50 transition-colors" />
                </div>

                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold text-[#555] uppercase tracking-wider bg-[#0f0f0f] rounded-xl border border-[#1a1a1a]">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Prompt</div>
                    <div className="col-span-3 text-center">Engines (3)</div>
                    <div className="col-span-1 text-center">Visibility</div>
                    <div className="col-span-1 text-center">Sources</div>
                    <div className="col-span-1 text-center">Sentiment</div>
                    <div className="col-span-1 text-right">Expand</div>
                </div>

                <div className="space-y-0">
                    {hasData ? filteredPrompts.map((p, idx) => {
                        const isExpanded = expandedPrompt === (p.promptId || `custom_${idx}`);
                        const engines = p.engines || {};
                        const responded = ENGINE_ORDER.filter(eng => engines[eng]?.status?.includes('✓')).length;
                        const mentionedEngines = ENGINE_ORDER.filter(eng => engines[eng]?.mentioned).length;
                        const visLabel = mentionedEngines >= 2 ? 'High' : mentionedEngines === 1 ? 'Partial' : 'None';
                        const visColor = mentionedEngines >= 2 ? 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/30' : mentionedEngines === 1 ? 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30' : 'text-[#888] bg-[#222]/30 border-[#333]';
                        const sourceCount = ENGINE_ORDER.reduce((s, eng) => s + (engines[eng]?.citations?.length || engines[eng]?.citationCount || 0), 0);
                        const sentiments = ENGINE_ORDER.filter(eng => engines[eng]?.mentioned && engines[eng]?.sentiment).map(eng => engines[eng].sentiment);
                        const sentCounts = sentiments.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
                        const topSentiment = Object.entries(sentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
                        const sentLabel = topSentiment.charAt(0).toUpperCase() + topSentiment.slice(1);
                        const promptKey = p.promptId || `custom_${idx}`;

                        return (
                            <React.Fragment key={promptKey}>
                                <button onClick={() => setExpandedPrompt(isExpanded ? null : promptKey)} className={`w-full grid grid-cols-12 gap-4 px-6 py-4 items-center text-left transition-colors ${isExpanded ? 'bg-[#0A0A0A] border border-[#E92A15]/30 rounded-t-2xl mt-2' : 'bg-[#0e0e0e] border border-[#1a1a1a] hover:bg-[#141414] hover:border-[#333]'}`}>
                                    <div className="col-span-1">
                                        <span className="text-[#555] text-[12px] font-mono">
                                            {p.isCustom ? <span className="text-[#E92A15]">C</span> : (p.promptId || `P${String(idx + 1).padStart(2, '0')}`)}
                                        </span>
                                    </div>
                                    <div className="col-span-4 pr-2"><p className="text-[#ddd] text-[13px] font-medium leading-snug line-clamp-2">{p.query}</p></div>
                                    <div className="col-span-3 flex justify-center items-center gap-2">
                                        {ENGINE_ORDER.map(eng => {
                                            const eData = engines[eng];
                                            const meta = ENGINE_META[eng];
                                            const Icon = meta.icon;
                                            const ok = eData?.status?.includes('✓');
                                            return <div key={eng} className={`w-7 h-7 rounded-lg flex items-center justify-center border ${ok ? 'border-[#22c55e]/40 bg-[#22c55e]/5' : 'border-[#333] bg-[#1a1a1a]'}`} style={{ color: ok ? meta.color : '#555' }} title={`${meta.label}: ${ok ? 'Responded' : 'No response'}`}><Icon /></div>;
                                        })}
                                    </div>
                                    <div className="col-span-1 flex justify-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${visColor}`}>{visLabel}</span></div>
                                    <div className="col-span-1 flex justify-center"><span className="flex items-center gap-1 text-[#aaa] text-[12px]"><Link2 className="w-3 h-3" /> {sourceCount}</span></div>
                                    <div className="col-span-1 flex justify-center"><span className={`text-[12px] font-medium ${sentLabel === 'Positive' ? 'text-[#22c55e]' : sentLabel === 'Negative' ? 'text-[#ef4444]' : 'text-[#888]'}`}>{sentLabel}</span></div>
                                    <div className="col-span-1 flex justify-end"><ChevronDown className={`w-4 h-4 text-[#888] transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></div>
                                </button>
                                {isExpanded && <ExpandedPromptDetail prompt={p} />}
                            </React.Fragment>
                        );
                    }) : (
                        <div className="flex flex-col items-center py-12">
                            <Activity className="w-8 h-8 text-[#333] mb-3" />
                            <p className="text-[#555] text-[13px]">Run a scan from AI Visibility to see 20 prompts tracked across Perplexity, Gemini & ChatGPT</p>
                        </div>
                    )}
                </div>
            </div>

            {showCustomPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold text-[16px]">Run Custom Prompt</h3>
                            <button onClick={() => setShowCustomPrompt(false)} className="text-[#666] hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-[#888] text-[12px] mb-4">Enter a custom query to run against all 3 AI engines. Results appear here instantly.</p>
                        <textarea
                            value={customQuery}
                            onChange={e => setCustomQuery(e.target.value)}
                            placeholder="e.g. What are the best real estate platforms in Dubai for first-time buyers?"
                            className="w-full h-28 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-[13px] placeholder:text-[#444] resize-none focus:outline-none focus:border-[#E92A15]/50"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setShowCustomPrompt(false)} className="px-4 py-2 text-[#888] text-[12px] hover:text-white transition-colors">Cancel</button>
                            <button
                                disabled={!customQuery.trim() || customLoading}
                                onClick={async () => {
                                    setCustomLoading(true);
                                    try {
                                        const res = await apiClient.visibility.runCustomPrompt({
                                            query: customQuery.trim(),
                                            brandName: user?.brandName || '',
                                            domain: user?.domain || '',
                                            competitors: user?.competitors || [],
                                            country: '',
                                        });
                                        if (res.success && res.prompt) {
                                            setCustomPrompts(prev => [...prev, res.prompt]);
                                            setCustomQuery('');
                                            setShowCustomPrompt(false);
                                        }
                                    } catch (err) {
                                        console.error('Custom prompt failed:', err);
                                    } finally {
                                        setCustomLoading(false);
                                    }
                                }}
                                className="flex items-center gap-2 px-5 py-2 bg-[#E92A15] hover:bg-[#D12512] text-white text-[12px] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {customLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                {customLoading ? 'Running…' : 'Run Prompt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
