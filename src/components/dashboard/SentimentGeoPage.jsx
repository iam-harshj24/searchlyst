import React, { useState, useCallback, useMemo } from 'react';
import {
    Globe, TrendingUp, ArrowUpRight, ArrowDownRight, Search,
    Smile, Frown, Filter, ChevronUp, ChevronDown, AlertCircle
} from 'lucide-react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import {
    ComposableMap, Geographies, Geography, ZoomableGroup
} from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const ISO_NUMERIC_TO_NAME = {
    840: 'United States', 124: 'Canada', 484: 'Mexico', 276: 'Germany', 250: 'France',
    826: 'United Kingdom', 380: 'Italy', 724: 'Spain', 616: 'Poland', 56: 'Belgium',
    752: 'Sweden', 578: 'Norway', 246: 'Finland', 208: 'Denmark', 40: 'Austria',
    528: 'Netherlands', 642: 'Romania', 203: 'Czech Republic', 703: 'Slovakia',
    348: 'Hungary', 620: 'Portugal', 300: 'Greece', 100: 'Bulgaria', 191: 'Croatia',
    705: 'Slovenia', 372: 'Ireland', 756: 'Switzerland', 356: 'India', 156: 'China',
    392: 'Japan', 410: 'South Korea', 360: 'Indonesia', 764: 'Thailand', 36: 'Australia',
    554: 'New Zealand', 458: 'Malaysia', 608: 'Philippines', 704: 'Vietnam',
    702: 'Singapore', 50: 'Bangladesh', 586: 'Pakistan', 144: 'Sri Lanka',
    76: 'Brazil', 32: 'Argentina', 170: 'Colombia', 604: 'Peru', 152: 'Chile',
    218: 'Ecuador', 591: 'Panama', 858: 'Uruguay', 600: 'Paraguay', 68: 'Bolivia',
    682: 'Saudi Arabia', 784: 'UAE', 364: 'Iran', 368: 'Iraq', 400: 'Jordan',
    414: 'Kuwait', 512: 'Oman', 634: 'Qatar', 275: 'Palestine', 376: 'Israel',
    792: 'Turkey', 566: 'Nigeria', 710: 'South Africa', 818: 'Egypt', 12: 'Algeria',
    504: 'Morocco', 404: 'Kenya', 800: 'Uganda', 288: 'Ghana', 834: 'Tanzania',
    716: 'Zimbabwe', 706: 'Somalia', 231: 'Ethiopia', 686: 'Senegal', 466: 'Mali',
    120: 'Cameroon', 180: 'Congo (DRC)', 643: 'Russia', 398: 'Kazakhstan', 860: 'Uzbekistan',
};

const COUNTRY_TO_ISO = {};
for (const [iso, name] of Object.entries(ISO_NUMERIC_TO_NAME)) {
    COUNTRY_TO_ISO[name.toLowerCase()] = parseInt(iso, 10);
}

const COUNTRY_FLAGS = {
    'united states': '🇺🇸', 'canada': '🇨🇦', 'mexico': '🇲🇽', 'germany': '🇩🇪', 'france': '🇫🇷',
    'united kingdom': '🇬🇧', 'italy': '🇮🇹', 'spain': '🇪🇸', 'india': '🇮🇳', 'china': '🇨🇳',
    'japan': '🇯🇵', 'south korea': '🇰🇷', 'australia': '🇦🇺', 'brazil': '🇧🇷', 'singapore': '🇸🇬',
    'uae': '🇦🇪', 'saudi arabia': '🇸🇦', 'south africa': '🇿🇦', 'nigeria': '🇳🇬', 'kenya': '🇰🇪',
    'indonesia': '🇮🇩', 'thailand': '🇹🇭', 'malaysia': '🇲🇾', 'philippines': '🇵🇭', 'vietnam': '🇻🇳',
    'turkey': '🇹🇷', 'egypt': '🇪🇬', 'russia': '🇷🇺', 'poland': '🇵🇱', 'netherlands': '🇳🇱',
    'switzerland': '🇨🇭', 'sweden': '🇸🇪', 'norway': '🇳🇴', 'denmark': '🇩🇰', 'ireland': '🇮🇪',
    'new zealand': '🇳🇿', 'argentina': '🇦🇷', 'colombia': '🇨🇴', 'chile': '🇨🇱', 'israel': '🇮🇱',
    'qatar': '🇶🇦', 'pakistan': '🇵🇰', 'bangladesh': '🇧🇩',
};

const COUNTRY_CODES = {
    'united states': 'US', 'canada': 'CA', 'mexico': 'MX', 'germany': 'DE', 'france': 'FR',
    'united kingdom': 'GB', 'italy': 'IT', 'spain': 'ES', 'india': 'IN', 'china': 'CN',
    'japan': 'JP', 'south korea': 'KR', 'australia': 'AU', 'brazil': 'BR', 'singapore': 'SG',
    'uae': 'AE', 'saudi arabia': 'SA', 'south africa': 'ZA', 'nigeria': 'NG', 'kenya': 'KE',
    'indonesia': 'ID', 'thailand': 'TH', 'malaysia': 'MY', 'philippines': 'PH', 'vietnam': 'VN',
    'turkey': 'TR', 'egypt': 'EG', 'russia': 'RU', 'poland': 'PL', 'netherlands': 'NL',
    'switzerland': 'CH', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK', 'ireland': 'IE',
    'new zealand': 'NZ', 'argentina': 'AR', 'colombia': 'CO', 'chile': 'CL', 'israel': 'IL',
    'qatar': 'QA', 'pakistan': 'PK', 'bangladesh': 'BD',
};

function getSentimentColor(sentiment) {
    if (!sentiment && sentiment !== 0) return '#1a1a1a';
    if (sentiment >= 80) return '#4a7c4e';
    if (sentiment >= 65) return '#7c6a2a';
    if (sentiment >= 50) return '#7c4a20';
    return '#7c2020';
}

function getSentimentColorBright(sentiment) {
    if (!sentiment && sentiment !== 0) return '#333';
    if (sentiment >= 80) return '#22c55e';
    if (sentiment >= 65) return '#f59e0b';
    if (sentiment >= 50) return '#f97316';
    return '#ef4444';
}

function TrendTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 shadow-2xl text-[13px]">
            <p className="text-[#666] text-[11px] mb-2 font-medium">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-[#888] capitalize">{p.dataKey}</span>
                    <span className="text-white font-bold ml-auto pl-4">{p.value}%</span>
                </div>
            ))}
        </div>
    );
}

function MapTooltip({ info, x, y }) {
    if (!info) return null;
    return (
        <div
            className="absolute bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 shadow-2xl text-[13px] pointer-events-none z-50 w-48"
            style={{ left: x + 12, top: y - 60 }}
        >
            <p className="text-white font-semibold mb-2">{info.region}</p>
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="text-[#666]">Citations:</span>
                    <span className="text-white font-bold">{info.citations?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#666]">Sentiment:</span>
                    <span className="font-bold" style={{ color: getSentimentColorBright(info.sentiment) }}>
                        {info.sentiment}%
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#666]">Mentions:</span>
                    <span className="text-white font-bold">{info.mentions || 0}</span>
                </div>
            </div>
        </div>
    );
}

function deriveSentimentAndGeo(scanResult) {
    if (!scanResult) return null;

    const sentiment = scanResult.sentiment || {};
    const summary = sentiment.summary || { positive: 0, neutral: 100, negative: 0 };
    const detailed = sentiment.detailed || { positive: 0, neutral: 0, negative: 0 };
    const totalSentimentRuns = sentiment.total || 0;

    const sentimentBreakdown = [
        { name: 'Positive', value: summary.positive || 0, color: '#e5e5e5' },
        { name: 'Neutral', value: summary.neutral || 0, color: '#555' },
        { name: 'Negative', value: summary.negative || 0, color: '#ef4444' },
    ];

    const prompts = (scanResult.prompts || []).map(p => {
        const engines = p.engines || {};
        const engineEntries = Object.entries(engines);
        const mentioned = engineEntries.some(([, e]) => e.mentioned);
        const positions = engineEntries.map(([, e]) => e.positionRank).filter(Boolean);
        const position = positions.length > 0 ? Math.min(...positions) : null;

        let totalCitations = 0;
        engineEntries.forEach(([, e]) => {
            totalCitations += (e.citations?.length || e.citationCount || 0);
        });

        const sentiments = engineEntries.map(([, e]) => e.sentiment).filter(s => s && s !== 'n/a');
        const posCount = sentiments.filter(s => s === 'positive').length;
        const sentimentLabel = sentiments.length > 0
            ? (posCount / sentiments.length >= 0.5 ? 'positive' : 'neutral')
            : 'neutral';

        const platform = engineEntries.length > 0
            ? { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'ChatGPT' }[engineEntries[0][0]] || engineEntries[0][0]
            : 'Unknown';

        return {
            prompt: p.query,
            platform,
            brandMentioned: mentioned,
            position,
            citationCount: totalCitations,
            sentiment: sentimentLabel,
        };
    });

    const citationDomains = scanResult.citationSummary || scanResult.sourceDomains?.topDomains || [];

    const regionMap = {};
    for (const citation of citationDomains) {
        const d = (citation.domain || '').toLowerCase();
        let geo = 'global';
        if (d.endsWith('.co.uk') || d.endsWith('.uk')) geo = 'united kingdom';
        else if (d.endsWith('.de')) geo = 'germany';
        else if (d.endsWith('.fr')) geo = 'france';
        else if (d.endsWith('.in') || d.includes('.co.in')) geo = 'india';
        else if (d.endsWith('.au') || d.endsWith('.com.au')) geo = 'australia';
        else if (d.endsWith('.ca')) geo = 'canada';
        else if (d.endsWith('.jp')) geo = 'japan';
        else if (d.endsWith('.br')) geo = 'brazil';
        else if (d.endsWith('.com') || d.endsWith('.org') || d.endsWith('.io') || d.endsWith('.net')) geo = 'united states';

        if (!regionMap[geo]) regionMap[geo] = { citations: 0, mentions: 0 };
        regionMap[geo].citations += citation.count || 1;
        regionMap[geo].mentions += citation.uniqueUrls || 1;
    }

    const allRuns = [];
    for (const p of scanResult.prompts || []) {
        for (const [engine, data] of Object.entries(p.engines || {})) {
            allRuns.push({ engine, mentioned: data.mentioned, sentiment: data.sentiment });
        }
    }

    const geoSentiment = {};
    for (const [geo, data] of Object.entries(regionMap)) {
        const isoKey = COUNTRY_TO_ISO[geo];
        if (isoKey) {
            geoSentiment[isoKey] = {
                region: ISO_NUMERIC_TO_NAME[isoKey] || geo,
                sentiment: Math.round(summary.positive || 50),
                citations: data.citations,
                mentions: data.mentions,
            };
        }
    }

    const topCountries = Object.entries(regionMap)
        .filter(([geo]) => geo !== 'global')
        .sort((a, b) => b[1].citations - a[1].citations)
        .slice(0, 6)
        .map(([geo, data]) => {
            const total = Object.values(regionMap).reduce((s, r) => s + r.citations, 0) || 1;
            return {
                country: geo.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
                code: COUNTRY_CODES[geo] || geo.substring(0, 2).toUpperCase(),
                share: Math.round((data.citations / total) * 100),
                flag: COUNTRY_FLAGS[geo] || '🌍',
                citations: data.citations,
            };
        });

    const totalCitations = citationDomains.reduce((s, c) => s + (c.count || 1), 0);
    const trackedPrompts = prompts.length;
    const activeRegions = Object.keys(regionMap).filter(g => g !== 'global').length;
    const totalSent = (summary.positive || 0) + (summary.neutral || 0) + (summary.negative || 0);
    const avgSentiment = totalSent > 0 ? Math.round(((summary.positive || 0) * 100 + (summary.neutral || 0) * 50 + (summary.negative || 0) * 0) / totalSent) : 0;
    const negativePct = summary.negative || 0;

    return {
        sentimentBreakdown,
        summary,
        prompts,
        geoSentiment,
        topCountries,
        totalCitations,
        trackedPrompts,
        activeRegions,
        avgSentiment,
        negativePct,
    };
}

const PLATFORM_STYLES = {
    Perplexity: 'bg-[#1a1a1a] text-[#aaa] border border-[#2a2a2a]',
    Gemini: 'bg-[#1a1a1a] text-[#aaa] border border-[#2a2a2a]',
    ChatGPT: 'bg-[#1a1a1a] text-[#aaa] border border-[#2a2a2a]',
};

export default function SentimentGeoPage({ user, scanManager }) {
    const [tooltip, setTooltip] = useState(null);
    const [hoveredGeo, setHoveredGeo] = useState(null);

    const brandName = user?.brandName || 'Your Brand';
    const scanResult = scanManager?.scanResult || null;

    const derived = useMemo(() => deriveSentimentAndGeo(scanResult), [scanResult]);

    const scanDate = scanResult?.scannedAt
        ? new Date(scanResult.scannedAt).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })
        : new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });

    const hasData = !!(scanResult && derived);

    const sentimentBreakdown = derived?.sentimentBreakdown || [
        { name: 'Positive', value: 0, color: '#e5e5e5' },
        { name: 'Neutral', value: 0, color: '#555' },
        { name: 'Negative', value: 0, color: '#ef4444' },
    ];
    const summary = derived?.summary || { positive: 0, neutral: 0, negative: 0 };
    const prompts = derived?.prompts || [];
    const geoSentiment = derived?.geoSentiment || {};
    const topCountries = derived?.topCountries || [];
    const totalCitations = derived?.totalCitations || 0;
    const trackedPrompts = derived?.trackedPrompts || 0;
    const activeRegions = derived?.activeRegions || 0;
    const avgSentiment = derived?.avgSentiment || 0;
    const negativePct = derived?.negativePct || 0;

    return (
        <div className="w-full pb-12">
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#0a0e0a] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Globe className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Sentiment &amp; Geo Tracking</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">Track how AI perceives <span className="text-[#bbb]">{brandName}</span> across regions and prompts</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-5 max-w-[1400px]">
                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Avg Sentiment', value: hasData ? `${avgSentiment}%` : '—', icon: Smile, change: hasData ? `${avgSentiment > 50 ? '+' : ''}${avgSentiment - 50}%` : '—', positive: avgSentiment >= 50 },
                        { label: 'Tracked Prompts', value: hasData ? String(trackedPrompts) : '—', icon: Search, change: hasData ? `${trackedPrompts}` : '—', positive: true },
                        { label: 'Active Regions', value: hasData ? String(activeRegions) : '—', icon: Globe, change: hasData ? `${activeRegions}` : '—', positive: true },
                        { label: 'Negative Mentions', value: hasData ? `${negativePct}%` : '—', icon: Frown, change: hasData ? `${negativePct}%` : '—', positive: negativePct <= 15 },
                    ].map((kpi, i) => {
                        const Icon = kpi.icon;
                        return (
                            <div key={i} className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[#555] text-[11px] font-bold uppercase tracking-[0.12em]">{kpi.label}</span>
                                    <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                                        <Icon className="w-[14px] h-[14px] text-[#555]" />
                                    </div>
                                </div>
                                <p className="text-white text-[32px] font-bold tracking-tight leading-none mb-3">{kpi.value}</p>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${kpi.positive
                                    ? 'bg-[#0a1a0a] text-[#22c55e] border border-[#22c55e]/20'
                                    : 'bg-[#1a0a0a] text-[#E92A15] border border-[#E92A15]/20'
                                }`}>
                                    {kpi.positive
                                        ? <ArrowUpRight className="w-3 h-3" />
                                        : <ArrowDownRight className="w-3 h-3" />
                                    }
                                    {kpi.change}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sentiment Breakdown (full width) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-white font-semibold text-[16px]">Sentiment Distribution</h2>
                                <p className="text-[#666] text-[13px] mt-0.5">How AI platforms perceive your brand across {trackedPrompts} prompts</p>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] shrink-0">
                                <span className="flex items-center gap-1.5 text-[#ccc]"><span className="w-2 h-2 rounded-full bg-white inline-block" />Positive</span>
                                <span className="flex items-center gap-1.5 text-[#666]"><span className="w-2 h-2 rounded-full bg-[#666] inline-block" />Neutral</span>
                                <span className="flex items-center gap-1.5 text-[#666]"><span className="w-2 h-2 rounded-full bg-[#E92A15] inline-block" />Negative</span>
                            </div>
                        </div>
                        {/* Horizontal stacked bar */}
                        <div className="space-y-6">
                            {sentimentBreakdown.map((item, i) => (
                                <div key={i}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[#888] text-[13px] font-medium">{item.name}</span>
                                        <span className={`text-[14px] font-bold ${i === 2 ? 'text-[#E92A15]' : 'text-white'}`}>{item.value}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(item.value, 2)}%`, backgroundColor: item.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-[#1a1a1a] text-[#555] text-[12px]">
                            Based on {scanResult.sentiment?.total || 0} brand mentions analyzed across Perplexity, Gemini &amp; ChatGPT
                        </div>
                    </div>

                    {/* Sentiment Donut */}
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6 flex flex-col">
                        <div className="mb-4">
                            <h2 className="text-white font-semibold text-[16px]">Sentiment Breakdown</h2>
                            <p className="text-[#666] text-[13px] mt-0.5">Distribution across all responses</p>
                        </div>
                        <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: 160 }}>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={sentimentBreakdown}
                                        cx="50%" cy="50%"
                                        innerRadius={52} outerRadius={75}
                                        dataKey="value"
                                        strokeWidth={0}
                                        startAngle={90} endAngle={-270}
                                    >
                                        {sentimentBreakdown.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-white text-[24px] font-bold leading-none">{summary.positive || 0}%</span>
                                <span className="text-[#666] text-[11px] mt-1">Positive</span>
                            </div>
                        </div>
                        <div className="space-y-2 mt-4 border-t border-[#1a1a1a] pt-4">
                            {sentimentBreakdown.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-[#888] text-[13px]">{item.name}</span>
                                    </div>
                                    <span className={`text-[13px] font-bold ${i === 2 ? 'text-[#E92A15]' : 'text-white'}`}>{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Prompt Performance Table */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h2 className="text-white font-semibold text-[16px]">Prompt Performance</h2>
                            <p className="text-[#666] text-[13px] mt-0.5">Track which AI prompts mention your brand and their sentiment</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#1a1a1a]">
                                    {['PROMPT', 'BRAND MENTIONED', 'POSITION', 'CITATIONS', 'PLATFORM', 'SENTIMENT'].map(h => (
                                        <th key={h} className={`pb-3 text-[10px] text-[#444] uppercase tracking-[0.12em] font-bold ${h === 'PROMPT' ? 'text-left' : 'text-center'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {prompts.length === 0 ? (
                                    <>
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <tr key={i} className="border-b border-[#111]">
                                                <td className="py-4 pr-4"><div className="animate-pulse bg-[#1a1a1a] rounded w-48 h-4" /></td>
                                                <td className="text-center"><div className="animate-pulse bg-[#1a1a1a] rounded w-12 h-5 mx-auto" /></td>
                                                <td className="text-center"><div className="animate-pulse bg-[#1a1a1a] rounded w-8 h-4 mx-auto" /></td>
                                                <td className="text-center"><div className="animate-pulse bg-[#1a1a1a] rounded w-6 h-4 mx-auto" /></td>
                                                <td className="text-center"><div className="animate-pulse bg-[#1a1a1a] rounded w-16 h-5 mx-auto" /></td>
                                                <td className="text-center"><div className="animate-pulse bg-[#1a1a1a] rounded w-14 h-5 mx-auto" /></td>
                                            </tr>
                                        ))}
                                        <tr><td colSpan={6} className="py-4 text-center text-[#444] text-[12px]">Run a scan to see prompt performance data</td></tr>
                                    </>
                                ) : prompts.map((row, i) => (
                                    <tr key={i} className="border-b border-[#111] hover:bg-[#111] transition-colors group cursor-pointer">
                                        <td className="py-4 pr-4 max-w-[300px]">
                                            <div className="flex items-center gap-2">
                                                <Search className="w-3.5 h-3.5 text-[#444] shrink-0" />
                                                <span className="text-[#ccc] text-[13px] line-clamp-2">{row.prompt}</span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium ${row.brandMentioned
                                                ? 'bg-[#1a1a1a] text-[#aaa] border border-[#2a2a2a]'
                                                : 'bg-[#1a0a0a] text-[#E92A15] border border-[#E92A15]/20'
                                            }`}>
                                                {row.brandMentioned ? '✓ Yes' : '✗ No'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            {row.position != null
                                                ? <span className="text-white text-[14px] font-bold">#{row.position}</span>
                                                : <span className="text-[#333] text-[14px]">—</span>
                                            }
                                        </td>
                                        <td className="text-center">
                                            <span className="text-[#888] text-[13px]">{row.citationCount}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] ${PLATFORM_STYLES[row.platform] || 'bg-[#1a1a1a] text-[#aaa] border border-[#2a2a2a]'}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                                {row.platform}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg ${
                                                row.sentiment === 'positive' ? 'text-[#22c55e] bg-[#0a1a0a]' :
                                                row.sentiment === 'negative' ? 'text-[#E92A15] bg-[#1a0a0a]' :
                                                'text-[#888] bg-[#1a1a1a]'
                                            }`}>
                                                {row.sentiment === 'positive' ? <ArrowUpRight className="w-3 h-3" /> :
                                                 row.sentiment === 'negative' ? <ArrowDownRight className="w-3 h-3" /> :
                                                 <span className="text-[10px]">—</span>}
                                                {row.sentiment}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Regional Performance Map + Top Countries */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-[#0B0B0B] border border-[#222] rounded-2xl p-6 relative overflow-hidden">
                        <h2 className="text-white font-semibold text-[16px] mb-1">Regional Performance</h2>
                        <p className="text-[#666] text-[13px] mb-4">Citations and sentiment score by region (from real scan data)</p>
                        <div className="relative rounded-xl overflow-hidden bg-[#080808]" style={{ height: 360 }}>
                            <ComposableMap
                                projectionConfig={{ scale: 195, center: [15, 5] }}
                                style={{ width: '100%', height: '100%', background: '#080808' }}
                            >
                                <ZoomableGroup center={[15, 5]} zoom={1.2} minZoom={1} maxZoom={6}>
                                    <Geographies geography={GEO_URL}>
                                        {({ geographies }) =>
                                            geographies.map(geo => {
                                                const numId = parseInt(geo.id, 10);
                                                const data = geoSentiment[numId];
                                                const fillColor = data ? getSentimentColor(data.sentiment) : '#1a1a1a';
                                                const isHovered = hoveredGeo === geo.id;
                                                return (
                                                    <Geography
                                                        key={geo.rsmKey}
                                                        geography={geo}
                                                        fill={isHovered && data ? getSentimentColorBright(data.sentiment) + '99' : fillColor}
                                                        stroke="#0d0d0d"
                                                        strokeWidth={0.5}
                                                        style={{
                                                            default: { outline: 'none' },
                                                            hover: { outline: 'none', cursor: data ? 'pointer' : 'default' },
                                                            pressed: { outline: 'none' },
                                                        }}
                                                        onMouseEnter={(evt) => {
                                                            if (data) {
                                                                setHoveredGeo(geo.id);
                                                                const containerRect = evt.target.closest('.relative')?.getBoundingClientRect();
                                                                if (containerRect) {
                                                                    setTooltip({
                                                                        ...data,
                                                                        x: evt.clientX - containerRect.left,
                                                                        y: evt.clientY - containerRect.top,
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                        onMouseMove={(evt) => {
                                                            if (data) {
                                                                const containerRect = evt.target.closest('.relative')?.getBoundingClientRect();
                                                                if (containerRect) {
                                                                    setTooltip(prev => prev ? { ...prev, x: evt.clientX - containerRect.left, y: evt.clientY - containerRect.top } : prev);
                                                                }
                                                            }
                                                        }}
                                                        onMouseLeave={() => {
                                                            setHoveredGeo(null);
                                                            setTooltip(null);
                                                        }}
                                                    />
                                                );
                                            })
                                        }
                                    </Geographies>
                                </ZoomableGroup>
                            </ComposableMap>
                            {tooltip && <MapTooltip info={tooltip} x={tooltip.x} y={tooltip.y} />}
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                            <span className="text-[#666] text-[11px]">Low</span>
                            <div className="flex-1 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #7c2020, #7c4a20, #7c6a2a, #4a7c4e)' }} />
                            <span className="text-[#666] text-[11px]">High</span>
                            <div className="flex items-center gap-3 ml-2">
                                {[
                                    { dot: '#22c55e', label: '≥80%' },
                                    { dot: '#f59e0b', label: '65–79%' },
                                    { dot: '#f97316', label: '50–64%' },
                                    { dot: '#ef4444', label: '<50%' },
                                ].map(({ dot, label }) => (
                                    <span key={label} className="flex items-center gap-1 text-[11px] text-[#666]">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Countries */}
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                        <h2 className="text-white font-semibold text-[16px] mb-1">Top Countries by Citations</h2>
                        <p className="text-[#666] text-[13px] mb-5">Where your brand gets the most AI mentions</p>
                        <div className="space-y-5">
                            {topCountries.length === 0 ? (
                                <div className="space-y-5">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="animate-pulse bg-[#1a1a1a] rounded w-5 h-4 shrink-0" />
                                            <div className="animate-pulse bg-[#1a1a1a] rounded w-6 h-6 shrink-0" />
                                            <div className="flex-1"><div className="animate-pulse bg-[#1a1a1a] rounded w-full h-4 mb-2" /><div className="animate-pulse bg-[#1a1a1a] rounded-full w-full h-1" /></div>
                                        </div>
                                    ))}
                                    <p className="text-[#444] text-[12px] text-center pt-4">Awaiting scan data</p>
                                </div>
                            ) : topCountries.map((c, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="text-[#444] text-[12px] font-bold w-5 shrink-0 mt-0.5">#{i + 1}</span>
                                    <span className="text-[17px] leading-none mt-0.5">{c.flag}</span>
                                    <span className="text-[#666] text-[12px] font-bold w-6 shrink-0 mt-0.5">{c.code}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[#ccc] text-[13px] font-medium">{c.country}</span>
                                            <span className="text-[#666] text-[12px] ml-2 shrink-0">{c.share}%</span>
                                        </div>
                                        <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                                            <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(c.share * 2.5, 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center pt-4">
                    <p className="text-[#333] text-[11px] font-semibold uppercase tracking-[0.15em]">
                        SCANNED {scanDate}
                    </p>
                </div>
            </div>
        </div>
    );
}
