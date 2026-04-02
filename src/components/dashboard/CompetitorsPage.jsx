import React, { useState, useMemo, useCallback } from 'react';
import {
    Users, Plus, Target, ChevronRight, X, MapPin, Building2,
    Globe2, PenTool, Eye, LayoutGrid, Link2, BarChart3, TrendingUp,
} from 'lucide-react';

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

function competitorsStorageKey(domain) {
    return `searchlyst_added_competitors_${domain || 'default'}`;
}

/** Domains that are poor "competitor" targets when inferred from citations alone */
const GENERIC_OR_EDITORIAL = new Set([
    'wikipedia.org', 'reddit.com', 'youtube.com', 'linkedin.com', 'facebook.com',
    'twitter.com', 'x.com', 'medium.com', 'quora.com', 'bbc.com', 'cnn.com',
    'nytimes.com', 'forbes.com', 'techcrunch.com', 'crunchbase.com', 'google.com',
    'bing.com', 'yahoo.com',
]);

function normalizeDomain(d) {
    return (d || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
}

/** Tokens for matching a tracked label (e.g. "Puma", "puma.com") to gap / citation names. */
function competitorAliasTokens(label) {
    const s = (label || '').trim().toLowerCase();
    const out = new Set();
    if (s) out.add(s);
    const d = normalizeDomain(s);
    if (d) {
        out.add(d);
        const root = d.split('.')[0];
        if (root && root.length > 2) out.add(root);
    }
    return out;
}

function gapEntryMatchesSelected(selectedLabel, cp) {
    const aliases = competitorAliasTokens(selectedLabel);
    const name = (typeof cp === 'string' ? cp : cp?.name || '').trim().toLowerCase();
    const rawDomain = typeof cp === 'object' && cp?.domain ? cp.domain : (name.includes('.') ? name : '');
    const domain = normalizeDomain(rawDomain);
    const parts = new Set();
    if (name) {
        parts.add(name);
        for (const w of name.split(/\s+/)) {
            if (w.length > 2) parts.add(w);
        }
    }
    if (domain) {
        parts.add(domain);
        const root = domain.split('.')[0];
        if (root && root.length > 2) parts.add(root);
    }
    for (const t of aliases) {
        for (const p of parts) {
            if (!t || !p) continue;
            if (t === p) return true;
            if (t.length >= 3 && p.length >= 3 && (t.includes(p) || p.includes(t))) return true;
        }
    }
    return false;
}

function gapRowMentionsCompetitor(gap, selectedLabel) {
    const fromPresent = gap.competitorsPresent || [];
    const fromFlat = Array.isArray(gap.competitors)
        ? gap.competitors.map((c) => (typeof c === 'string' ? { name: c } : { name: c?.name || c }))
        : [];
    const rows = [...fromPresent, ...fromFlat];
    return rows.some((cp) => gapEntryMatchesSelected(selectedLabel, cp));
}

/** When entity-based gaps do not list the competitor by name, infer topics from per-prompt citations. */
function inferGapsForCompetitorFromPrompts(prompts, selectedLabel) {
    if (!selectedLabel || !Array.isArray(prompts) || prompts.length === 0) return [];

    const out = [];
    for (const p of prompts) {
        const engines = p.engines || {};
        const brandMentionedAny = Object.values(engines).some((e) => e?.mentioned);
        if (brandMentionedAny) continue;

        let hit = false;
        for (const eng of Object.values(engines)) {
            const cites = eng?.citations || [];
            for (const c of cites) {
                if (!c?.isCompetitor) continue;
                const dom = normalizeDomain(c.domain || c.url || '');
                if (dom && gapEntryMatchesSelected(selectedLabel, { name: '', domain: dom })) {
                    hit = true;
                    break;
                }
            }
            if (hit) break;
        }
        if (!hit) continue;

        const q = (p.query || '').trim();
        if (!q) continue;
        out.push({
            query: q,
            category: p.category,
            intent: p.intent,
            contentTopic: q.length > 140 ? `${q.slice(0, 137)}…` : q,
            contentAngle:
                'AI answers cited this competitor (or their domain) on this prompt while your brand did not appear. Publish definitive content for this intent.',
            competitorsPresent: [{ name: selectedLabel, count: 1, domain: normalizeDomain(selectedLabel) || '' }],
            opportunity: 'high',
            inferredFromCitations: true,
        });
        if (out.length >= 24) break;
    }
    return out;
}

function namesLikelyMatch(a, b) {
    const norm = (s) => String(s || '').trim().toLowerCase();
    const na = norm(a);
    const nb = norm(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    const root = (x) => x.replace(/\.(com|io|ai|net|co|org)$/i, '');
    if (root(na) === root(nb)) return true;
    if (na.includes(nb) || nb.includes(na)) return true;
    return false;
}

/** Pull SOV / industry row / cited URLs for a tracked competitor from the latest scan payload. */
function buildCompetitorProfile(scanData, selectedLabel) {
    if (!scanData || !selectedLabel) return null;
    const sovRows = [scanData.shareOfVoice?.brand, ...(scanData.shareOfVoice?.competitors || [])].filter(Boolean);
    const sov =
        sovRows.find(
            (r) => namesLikelyMatch(r.name, selectedLabel) || namesLikelyMatch(r.domain, selectedLabel),
        ) || null;
    const ind =
        (scanData.industryRanking || []).find(
            (r) => namesLikelyMatch(r.name, selectedLabel) || namesLikelyMatch(r.domain, selectedLabel),
        ) || null;

    const citedUrls = [];
    const domains = new Set();
    for (const p of scanData.prompts || []) {
        for (const [, eng] of Object.entries(p.engines || {})) {
            for (const c of eng.citations || []) {
                if (!c?.isCompetitor) continue;
                const dom = normalizeDomain(c.domain || c.url || '');
                if (!dom) continue;
                const hit =
                    namesLikelyMatch(selectedLabel, c.domain) ||
                    namesLikelyMatch(selectedLabel, dom) ||
                    namesLikelyMatch(selectedLabel, dom.split('.')[0]);
                if (!hit) continue;
                if (c.url) citedUrls.push({ url: c.url, domain: dom, title: c.title || '' });
                domains.add(dom);
            }
        }
    }
    const dedupe = [];
    const seen = new Set();
    for (const u of citedUrls) {
        if (seen.has(u.url)) continue;
        seen.add(u.url);
        dedupe.push(u);
    }
    return {
        sov,
        ind,
        citedUrls: dedupe.slice(0, 40),
        sourceDomains: [...domains].sort(),
    };
}

function BrandAvatar({ name }) {
    const initials = name?.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
    return (
        <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[11px] font-bold text-[#888] shrink-0">
            {initials}
        </div>
    );
}

export default function CompetitorsPage({ user, onTabChange }) {
    const scanData = useMemo(() => getVisibilityData(user?.domain, user?.projectId), [user?.domain, user?.projectId]);
    const gaps = Array.isArray(scanData?.competitorGaps) ? scanData.competitorGaps : [];

    const storageKey = competitorsStorageKey(user?.domain);

    const [extraTracked, setExtraTracked] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(storageKey) || '[]');
        } catch {
            return [];
        }
    });

    const persistExtra = useCallback(
        (list) => {
            setExtraTracked(list);
            try {
                localStorage.setItem(storageKey, JSON.stringify(list));
            } catch { /* ignore */ }
        },
        [storageKey],
    );

    const onboardingList = useMemo(() => {
        const raw = user?.competitors || [];
        return raw.map((c) => (typeof c === 'string' ? { name: c, domain: c } : { name: c.name || c.domain, domain: c.domain || c.name }));
    }, [user?.competitors]);

    const allTracked = useMemo(() => {
        const rows = [...onboardingList.map((c) => ({ ...c, source: 'project' }))];
        for (const x of extraTracked) {
            const name = typeof x === 'string' ? x : x.name;
            const domain = typeof x === 'string' ? x : x.domain;
            if (onboardingList.some((c) => (c.name || '').toLowerCase() === (name || '').toLowerCase())) continue;
            rows.push({ name: name || domain, domain: domain || name, source: 'added' });
        }
        return rows;
    }, [onboardingList, extraTracked]);

    /** Topics to cover ahead of competitors: scan gaps + cited competitor URLs (Prompt Intelligence / URLs). */
    const winTopicTiles = useMemo(() => {
        const tiles = [];
        let n = 0;
        const brandName = user?.brandName || '';
        const industry = user?.industry || 'your category';

        for (const g of gaps) {
            const title = (g.contentTopic || g.query || '').trim();
            if (!title) continue;
            const comps = (g.competitorsPresent || [])
                .map((c) => (typeof c === 'string' ? c : c.name))
                .filter(Boolean);
            tiles.push({
                id: `gap-${n++}`,
                title,
                subtitle: (g.contentAngle || '').trim(),
                badges: comps,
                prefill: ((g.contentAngle || title) || '').trim(),
                foot: 'From AI visibility gaps',
            });
        }

        let urls = scanData?.urlRanking?.urls || [];
        if (!urls.length && Array.isArray(scanData?.prompts) && scanData.prompts.length) {
            const urlMap = {};
            for (const p of scanData.prompts) {
                for (const [, data] of Object.entries(p.engines || {})) {
                    for (const cit of data.citations || []) {
                        if (!cit?.url || !cit.isCompetitor) continue;
                        const dom = cit.domain || normalizeDomain(cit.url);
                        if (!dom || GENERIC_OR_EDITORIAL.has(normalizeDomain(dom))) continue;
                        if (!urlMap[cit.url]) {
                            urlMap[cit.url] = {
                                url: cit.url,
                                domain: dom,
                                title: cit.title || '',
                                count: 0,
                                isCompetitor: true,
                            };
                        }
                        urlMap[cit.url].count++;
                    }
                }
            }
            urls = Object.values(urlMap).sort((a, b) => b.count - a.count);
        }
        let urlTileCount = 0;
        for (const u of urls) {
            if (!u?.isCompetitor || !u.domain) continue;
            if (GENERIC_OR_EDITORIAL.has(normalizeDomain(u.domain))) continue;
            if (urlTileCount >= 6) break;
            urlTileCount++;
            tiles.push({
                id: `url-${n++}`,
                title: `Win citations vs ${u.domain}`,
                subtitle:
                    u.title?.trim() ||
                    `Competitor URL cited in AI answers (${u.count || 1}×). Publish authoritative content on the same buyer questions.`,
                badges: [u.domain],
                prefill: `${brandName} vs ${u.domain}: ${industry} comparison and buyer guide`,
                foot: 'From cited URLs (Prompt Intelligence)',
            });
        }
        return tiles.slice(0, 18);
    }, [gaps, scanData, user?.brandName, user?.industry]);

    const [selectedCompetitor, setSelectedCompetitor] = useState(null);

    const competitorProfile = useMemo(
        () => (selectedCompetitor ? buildCompetitorProfile(scanData, selectedCompetitor) : null),
        [scanData, selectedCompetitor],
    );

    const addTracked = (name, domain) => {
        const label = domain || name;
        if (!label) return;
        if (extraTracked.includes(label) || extraTracked.includes(name)) return;
        persistExtra([...extraTracked, label]);
    };

    const removeExtra = (domainOrName) => {
        persistExtra(extraTracked.filter((x) => x !== domainOrName));
    };

    const competitorGapsForSelected = useMemo(() => {
        if (!selectedCompetitor) return [];
        const fromScan = gaps.filter((g) => gapRowMentionsCompetitor(g, selectedCompetitor));
        if (fromScan.length > 0) return fromScan;
        return inferGapsForCompetitorFromPrompts(scanData?.prompts, selectedCompetitor);
    }, [selectedCompetitor, gaps, scanData?.prompts]);

    return (
        <div className="w-full pb-12">
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Users className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Competitors</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">
                            Track peers aligned to your industry and market — not just the most-cited sites
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-6 max-w-[1200px]">
                {/* Brand context — mirror onboarding */}
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111] border border-[#2a2a2a] text-[12px] text-[#ccc]">
                        <Building2 className="w-3.5 h-3.5 text-[#E92A15]" />
                        {user?.industry || 'Set industry in Brand Hub'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111] border border-[#2a2a2a] text-[12px] text-[#ccc]">
                        <MapPin className="w-3.5 h-3.5 text-[#E92A15]" />
                        {user?.location || 'Set market / location'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111] border border-[#2a2a2a] text-[12px] text-[#ccc]">
                        <Globe2 className="w-3.5 h-3.5 text-[#E92A15]" />
                        {user?.domain || '—'}
                    </span>
                </div>

                {/* Exact topics to get ahead — tiles from gaps + cited competitor URLs */}
                <div className="relative rounded-2xl overflow-hidden border border-[#E92A15]/35 bg-gradient-to-br from-[#180604] via-[#0B0B0B] to-[#0a0a12] p-6 shadow-[0_0_40px_rgba(233,42,21,0.12)]">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#E92A15]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E92A15] mb-1">Featured</p>
                            <h2 className="text-white text-[18px] font-semibold flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5 text-[#E92A15]" /> Exact topics to cover to get ahead
                            </h2>
                            <p className="text-[#999] text-[13px] mt-1 max-w-xl">
                                Built from your visibility gaps, Prompt Intelligence prompts, and competitor-cited URLs — prioritize these to close the AI search gap.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onTabChange?.('content-studio')}
                            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#E92A15] hover:bg-[#c82010] text-white text-[12px] font-semibold rounded-xl transition-all"
                        >
                            <PenTool className="w-4 h-4" /> Open Content Studio
                        </button>
                    </div>
                    {winTopicTiles.length === 0 ? (
                        <p className="relative text-[#666] text-[13px] mt-6">
                            Run an AI visibility scan to populate topics from content gaps and cited competitor URLs.
                        </p>
                    ) : (
                        <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                            {winTopicTiles.map((tile) => (
                                <div
                                    key={tile.id}
                                    className="flex flex-col rounded-xl border border-[#E92A15]/25 bg-[#08080895] p-4 min-h-[140px]"
                                >
                                    <div className="flex items-start gap-2 mb-2">
                                        <Target className="w-4 h-4 text-[#E92A15] shrink-0 mt-0.5" />
                                        <p className="text-white text-[13px] font-semibold leading-snug">{tile.title}</p>
                                    </div>
                                    {tile.subtitle ? (
                                        <p className="text-[#999] text-[11px] leading-relaxed flex-1 mb-2 line-clamp-4">{tile.subtitle}</p>
                                    ) : null}
                                    {tile.badges.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {tile.badges.slice(0, 4).map((b) => (
                                                <span
                                                    key={b}
                                                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#E92A15]/12 text-[#E92A15] border border-[#E92A15]/25"
                                                >
                                                    {b}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-[#2a2a2a]">
                                        <span className="text-[#555] text-[9px] flex items-center gap-1">
                                            <Link2 className="w-3 h-3 shrink-0" /> {tile.foot}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                try {
                                                    localStorage.setItem('searchlyst_content_prefill', tile.prefill);
                                                } catch { /* ignore */ }
                                                onTabChange?.('content-studio');
                                            }}
                                            className="text-[10px] px-3 py-1.5 bg-white/5 border border-[#E92A15]/40 text-white rounded-lg hover:bg-[#E92A15]/15 font-semibold shrink-0"
                                        >
                                            Create →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tracked */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-white font-semibold text-[16px]">Tracked competitors</h2>
                            <p className="text-[#666] text-[12px] mt-0.5">
                                From onboarding and ones you add here ({allTracked.length} total)
                            </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded-md text-[#888]">
                            {allTracked.length} TRACKED
                        </span>
                    </div>
                    <div className="space-y-2">
                        {allTracked.length === 0 ? (
                            <p className="text-[#555] text-[13px] py-6 text-center">
                                Add competitors in Brand Hub or from this page to compare AI visibility.
                            </p>
                        ) : (
                            allTracked.map((c, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setSelectedCompetitor(selectedCompetitor === c.name ? null : c.name)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-colors ${
                                        selectedCompetitor === c.name
                                            ? 'border-[#E92A15]/40 bg-[#120404]'
                                            : 'border-[#1a1a1a] bg-[#111] hover:border-[#333]'
                                    }`}
                                >
                                    <BrandAvatar name={c.name} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-[14px] font-medium truncate">{c.name}</p>
                                        <p className="text-[#555] text-[11px] truncate">{c.domain}</p>
                                    </div>
                                    <span className="text-[10px] text-[#666] uppercase">{c.source}</span>
                                    {c.source === 'added' && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeExtra(c.domain || c.name);
                                                if (selectedCompetitor === c.name) setSelectedCompetitor(null);
                                            }}
                                            className="p-2 rounded-lg text-[#555] hover:text-red-400 hover:bg-red-500/10"
                                            title="Remove"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    <ChevronRight
                                        className={`w-4 h-4 shrink-0 transition-transform ${selectedCompetitor === c.name ? 'rotate-90 text-[#E92A15]' : 'text-[#444]'}`}
                                    />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Per-competitor gap drill-down */}
                {selectedCompetitor && (
                    <div className="space-y-4">
                        <div className="bg-[#0B0B0B] border border-[#E92A15]/25 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-white font-semibold text-[15px] flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-[#E92A15]" /> {selectedCompetitor} — scan profile
                                </h3>
                                <button type="button" onClick={() => setSelectedCompetitor(null)} className="text-[#555] hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {!scanData?.prompts?.length && !scanData?.shareOfVoice ? (
                                <p className="text-[#555] text-[13px]">Run an AI visibility scan to populate competitor metrics, citations, and URLs.</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                    <div className="rounded-xl border border-[#222] bg-[#111] p-3">
                                        <p className="text-[9px] text-[#666] uppercase font-bold tracking-wider mb-1">Share of voice</p>
                                        <p className="text-white text-[20px] font-bold tabular-nums">
                                            {competitorProfile?.sov?.sov != null ? `${Number(competitorProfile.sov.sov).toFixed(1)}%` : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-[#222] bg-[#111] p-3">
                                        <p className="text-[9px] text-[#666] uppercase font-bold tracking-wider mb-1">Sentiment index</p>
                                        <p className="text-white text-[20px] font-bold tabular-nums">
                                            {competitorProfile?.sov?.sentiment != null ? Math.round(competitorProfile.sov.sentiment) : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-[#222] bg-[#111] p-3">
                                        <p className="text-[9px] text-[#666] uppercase font-bold tracking-wider mb-1">Prompts hit</p>
                                        <p className="text-white text-[20px] font-bold tabular-nums">
                                            {competitorProfile?.ind?.promptsReached ?? '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-[#222] bg-[#111] p-3">
                                        <p className="text-[9px] text-[#666] uppercase font-bold tracking-wider mb-1">Coverage</p>
                                        <p className="text-white text-[20px] font-bold tabular-nums">
                                            {competitorProfile?.ind?.promptCoverage != null ? `${Math.round(competitorProfile.ind.promptCoverage)}%` : '—'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {competitorProfile?.sourceDomains?.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2">Cited source domains</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {competitorProfile.sourceDomains.map((d) => (
                                            <span key={d} className="text-[11px] px-2 py-1 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#ccc]">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {competitorProfile?.citedUrls?.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2">URLs cited for this competitor</p>
                                    <ul className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 text-[12px]">
                                        {competitorProfile.citedUrls.map((u) => (
                                            <li key={u.url}>
                                                <a href={u.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">
                                                    {u.url}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-white font-semibold text-[15px] flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-[#E92A15]" /> Where they lead (content gaps)
                                </h3>
                            </div>
                            <p className="text-[#666] text-[12px] mb-4">
                                Prompts where they appear and you don&apos;t — matched by name, domain, or competitor citations.
                            </p>
                            {competitorGapsForSelected.length === 0 ? (
                                <p className="text-[#555] text-[13px]">
                                    {!scanData?.prompts?.length && gaps.length === 0
                                        ? 'Run a scan first to see gap prompts.'
                                        : 'No gap prompts matched this competitor for this scan.'}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {competitorGapsForSelected.map((gap, i) => (
                                        <div
                                            key={`${gap.query || gap.contentTopic || i}-${gap.inferredFromCitations ? 'c' : 'g'}`}
                                            className="p-3 rounded-xl border border-[#222] bg-[#111]"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-0.5">
                                                <p className="text-[#eee] text-[13px] font-medium flex-1">{gap.contentTopic || gap.query}</p>
                                                {gap.inferredFromCitations ? (
                                                    <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[#888] border border-[#333] rounded px-1.5 py-0.5">
                                                        Citations
                                                    </span>
                                                ) : null}
                                            </div>
                                            {gap.contentAngle && <p className="text-[#777] text-[11px] mt-1">{gap.contentAngle}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
