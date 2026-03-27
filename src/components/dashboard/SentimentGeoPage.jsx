import React, { useState, useCallback } from 'react';
import {
    Globe, TrendingUp, ArrowUpRight, ArrowDownRight, Search,
    Smile, Frown, Filter, ChevronUp, ChevronDown
} from 'lucide-react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import {
    ComposableMap, Geographies, Geography, ZoomableGroup
} from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ── Static data ──────────────────────────────────────────────────────────────
const sentimentTrend = [
    { date: 'Jan', positive: 65, neutral: 25, negative: 10 },
    { date: 'Feb', positive: 68, neutral: 22, negative: 10 },
    { date: 'Mar', positive: 72, neutral: 18, negative: 10 },
    { date: 'Apr', positive: 70, neutral: 20, negative: 10 },
    { date: 'May', positive: 75, neutral: 17, negative: 8 },
    { date: 'Jun', positive: 78, neutral: 15, negative: 7 },
    { date: 'Jul', positive: 80, neutral: 14, negative: 6 },
];

// ISO numeric → country-level data (name, individual sentiment, citations, trend)
const regionSentiment = {
    // North America
    840: { region: 'United States',      sentiment: 84, citations: 2800, trend: '+18%' },
    124: { region: 'Canada',              sentiment: 82, citations: 980,  trend: '+10%' },
    484: { region: 'Mexico',              sentiment: 74, citations: 420,  trend: '+7%'  },
    // Europe
    276: { region: 'Germany',             sentiment: 81, citations: 1100, trend: '+9%'  },
    250: { region: 'France',              sentiment: 79, citations: 870,  trend: '+6%'  },
    826: { region: 'United Kingdom',      sentiment: 83, citations: 1200, trend: '+11%' },
    380: { region: 'Italy',               sentiment: 76, citations: 640,  trend: '+4%'  },
    724: { region: 'Spain',               sentiment: 75, citations: 580,  trend: '+5%'  },
    616: { region: 'Poland',              sentiment: 73, citations: 310,  trend: '+3%'  },
    56:  { region: 'Belgium',             sentiment: 77, citations: 270,  trend: '+5%'  },
    752: { region: 'Sweden',              sentiment: 80, citations: 340,  trend: '+7%'  },
    578: { region: 'Norway',              sentiment: 79, citations: 210,  trend: '+6%'  },
    246: { region: 'Finland',             sentiment: 78, citations: 180,  trend: '+4%'  },
    208: { region: 'Denmark',             sentiment: 80, citations: 220,  trend: '+6%'  },
    40:  { region: 'Austria',             sentiment: 77, citations: 230,  trend: '+4%'  },
    528: { region: 'Netherlands',         sentiment: 81, citations: 480,  trend: '+8%'  },
    642: { region: 'Romania',             sentiment: 68, citations: 190,  trend: '+2%'  },
    203: { region: 'Czech Republic',      sentiment: 72, citations: 160,  trend: '+3%'  },
    703: { region: 'Slovakia',            sentiment: 70, citations: 110,  trend: '+2%'  },
    348: { region: 'Hungary',             sentiment: 69, citations: 140,  trend: '+2%'  },
    620: { region: 'Portugal',            sentiment: 76, citations: 260,  trend: '+5%'  },
    300: { region: 'Greece',              sentiment: 71, citations: 200,  trend: '+3%'  },
    100: { region: 'Bulgaria',            sentiment: 66, citations: 120,  trend: '+1%'  },
    191: { region: 'Croatia',             sentiment: 72, citations: 130,  trend: '+3%'  },
    705: { region: 'Slovenia',            sentiment: 74, citations: 100,  trend: '+3%'  },
    372: { region: 'Ireland',             sentiment: 82, citations: 310,  trend: '+9%'  },
    756: { region: 'Switzerland',         sentiment: 83, citations: 370,  trend: '+8%'  },
    // Asia Pacific
    356: { region: 'India',               sentiment: 73, citations: 760,  trend: '+22%' },
    156: { region: 'China',               sentiment: 66, citations: 540,  trend: '+14%' },
    392: { region: 'Japan',               sentiment: 79, citations: 680,  trend: '+12%' },
    410: { region: 'South Korea',         sentiment: 77, citations: 420,  trend: '+11%' },
    360: { region: 'Indonesia',           sentiment: 68, citations: 280,  trend: '+18%' },
    764: { region: 'Thailand',            sentiment: 70, citations: 190,  trend: '+16%' },
    36:  { region: 'Australia',           sentiment: 81, citations: 520,  trend: '+9%'  },
    554: { region: 'New Zealand',         sentiment: 80, citations: 210,  trend: '+7%'  },
    458: { region: 'Malaysia',            sentiment: 72, citations: 170,  trend: '+15%' },
    608: { region: 'Philippines',         sentiment: 69, citations: 150,  trend: '+13%' },
    704: { region: 'Vietnam',             sentiment: 67, citations: 130,  trend: '+17%' },
    702: { region: 'Singapore',           sentiment: 84, citations: 310,  trend: '+10%' },
    50:  { region: 'Bangladesh',          sentiment: 62, citations: 90,   trend: '+8%'  },
    586: { region: 'Pakistan',            sentiment: 58, citations: 110,  trend: '+5%'  },
    144: { region: 'Sri Lanka',           sentiment: 63, citations: 70,   trend: '+6%'  },
    // Latin America
    76:  { region: 'Brazil',              sentiment: 71, citations: 340,  trend: '+8%'  },
    32:  { region: 'Argentina',           sentiment: 67, citations: 180,  trend: '+4%'  },
    170: { region: 'Colombia',            sentiment: 69, citations: 140,  trend: '+6%'  },
    604: { region: 'Peru',                sentiment: 65, citations: 100,  trend: '+4%'  },
    152: { region: 'Chile',               sentiment: 72, citations: 130,  trend: '+7%'  },
    218: { region: 'Ecuador',             sentiment: 63, citations: 70,   trend: '+3%'  },
    591: { region: 'Panama',              sentiment: 68, citations: 55,   trend: '+5%'  },
    858: { region: 'Uruguay',             sentiment: 73, citations: 60,   trend: '+6%'  },
    600: { region: 'Paraguay',            sentiment: 61, citations: 40,   trend: '+2%'  },
    68:  { region: 'Bolivia',             sentiment: 59, citations: 35,   trend: '+2%'  },
    // Middle East
    682: { region: 'Saudi Arabia',        sentiment: 68, citations: 280,  trend: '-2%'  },
    784: { region: 'UAE',                 sentiment: 72, citations: 220,  trend: '+4%'  },
    364: { region: 'Iran',                sentiment: 51, citations: 90,   trend: '-8%'  },
    368: { region: 'Iraq',                sentiment: 49, citations: 60,   trend: '-5%'  },
    400: { region: 'Jordan',              sentiment: 67, citations: 80,   trend: '+1%'  },
    414: { region: 'Kuwait',              sentiment: 70, citations: 75,   trend: '+2%'  },
    512: { region: 'Oman',                sentiment: 69, citations: 65,   trend: '+1%'  },
    634: { region: 'Qatar',               sentiment: 73, citations: 90,   trend: '+3%'  },
    275: { region: 'Palestine',           sentiment: 44, citations: 40,   trend: '-10%' },
    376: { region: 'Israel',              sentiment: 55, citations: 120,  trend: '-4%'  },
    792: { region: 'Turkey',              sentiment: 61, citations: 210,  trend: '-1%'  },
    // Africa
    566: { region: 'Nigeria',             sentiment: 62, citations: 140,  trend: '+16%' },
    710: { region: 'South Africa',        sentiment: 68, citations: 190,  trend: '+12%' },
    818: { region: 'Egypt',               sentiment: 59, citations: 110,  trend: '+8%'  },
    12:  { region: 'Algeria',             sentiment: 56, citations: 70,   trend: '+5%'  },
    504: { region: 'Morocco',             sentiment: 64, citations: 85,   trend: '+10%' },
    404: { region: 'Kenya',               sentiment: 66, citations: 95,   trend: '+14%' },
    800: { region: 'Uganda',              sentiment: 60, citations: 50,   trend: '+9%'  },
    288: { region: 'Ghana',               sentiment: 65, citations: 60,   trend: '+11%' },
    834: { region: 'Tanzania',            sentiment: 61, citations: 45,   trend: '+8%'  },
    716: { region: 'Zimbabwe',            sentiment: 54, citations: 35,   trend: '+3%'  },
    706: { region: 'Somalia',             sentiment: 42, citations: 20,   trend: '-5%'  },
    231: { region: 'Ethiopia',            sentiment: 57, citations: 55,   trend: '+7%'  },
    686: { region: 'Senegal',             sentiment: 63, citations: 40,   trend: '+9%'  },
    466: { region: 'Mali',                sentiment: 48, citations: 25,   trend: '+2%'  },
    120: { region: 'Cameroon',            sentiment: 60, citations: 35,   trend: '+6%'  },
    180: { region: 'Congo (DRC)',         sentiment: 46, citations: 30,   trend: '+3%'  },
    // Russia & Central Asia
    643: { region: 'Russia',              sentiment: 52, citations: 180,  trend: '-12%' },
    398: { region: 'Kazakhstan',          sentiment: 62, citations: 70,   trend: '+5%'  },
    860: { region: 'Uzbekistan',          sentiment: 60, citations: 50,   trend: '+4%'  },
};

// Sentiment → color mapping (matching Figma dark-orange/red palette)
function getSentimentColor(sentiment) {
    if (!sentiment) return '#1a1a1a';
    if (sentiment >= 80) return '#4a7c4e';  // green-ish for ≥80
    if (sentiment >= 65) return '#7c6a2a';  // amber for 65-79
    if (sentiment >= 50) return '#7c4a20';  // orange for 50-64
    return '#7c2020';                        // red for <50
}

function getSentimentColorBright(sentiment) {
    if (!sentiment) return '#333';
    if (sentiment >= 80) return '#22c55e';
    if (sentiment >= 65) return '#f59e0b';
    if (sentiment >= 50) return '#f97316';
    return '#ef4444';
}

const topCountries = [
    { country: 'United States', code: 'US', share: 35, flag: '🇺🇸' },
    { country: 'United Kingdom', code: 'GB', share: 15, flag: '🇬🇧' },
    { country: 'Germany', code: 'DE', share: 11, flag: '🇩🇪' },
    { country: 'India', code: 'IN', share: 9, flag: '🇮🇳' },
    { country: 'Canada', code: 'CA', share: 8, flag: '🇨🇦' },
    { country: 'Australia', code: 'AU', share: 6, flag: '🇦🇺' },
];

const sentimentBreakdown = [
    { name: 'Positive', value: 72, color: '#e5e5e5' },
    { name: 'Neutral', value: 20, color: '#555' },
    { name: 'Negative', value: 8, color: '#ef4444' },
];

function getPromptPerformance(user) {
    const industry = user?.industry || 'Real Estate';
    const brandName = user?.brandName || 'Camana Homes';
    return [
        { prompt: `Best ${industry} companies for mid-market teams`, platform: 'ChatGPT', brandMentioned: true, position: 2, citationScore: 78, trend: '+18%', positive: true },
        { prompt: `${industry} software reviews and comparisons`, platform: 'Perplexity', brandMentioned: false, position: null, citationScore: 0, trend: '+12%', positive: true },
        { prompt: `Top ${industry.toLowerCase()} tools recommended by experts`, platform: 'Gemini', brandMentioned: true, position: 4, citationScore: 52, trend: '+8%', positive: true },
        { prompt: `${brandName} vs alternatives — honest comparison`, platform: 'ChatGPT', brandMentioned: true, position: 1, citationScore: 91, trend: '+25%', positive: true },
        { prompt: `${industry} market leaders in ${new Date().getFullYear()}`, platform: 'Perplexity', brandMentioned: false, position: null, citationScore: 0, trend: '-2%', positive: false },
    ];
}

const PLATFORM_STYLES = {
    ChatGPT: 'bg-[#1a1a1a] text-[#aaa] border border-[#2a2a2a]',
    Perplexity: 'bg-[#1a1a1a] text-[#aaa] border border-[#2a2a2a]',
    Gemini: 'bg-[#1a1a1a] text-[#aaa] border border-[#2a2a2a]',
};

// ── Custom Tooltip for Trend Chart ───────────────────────────────────────────
function TrendTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 shadow-2xl text-[13px]">
            <p className="text-[#666] text-[11px] mb-2 font-medium">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-[#888] capitalize">{p.dataKey}</span>
                    <span className="text-white font-bold ml-auto pl-4">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

// ── Map Tooltip ───────────────────────────────────────────────────────────────
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
                    <span className="text-[#666]">Citation:</span>
                    <span className="text-white font-bold">{info.citations?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#666]">Sentiment:</span>
                    <span className="font-bold" style={{ color: getSentimentColorBright(info.sentiment) }}>
                        {info.sentiment}%
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#666]">Growth:</span>
                    <span className={`font-bold ${info.trend?.startsWith('+') ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{info.trend}</span>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SentimentGeoPage({ user }) {
    const [activeFilter, setActiveFilter] = useState('All Time');
    const [tooltip, setTooltip] = useState(null); // { region, sentiment, citations, trend, x, y }
    const [hoveredGeo, setHoveredGeo] = useState(null);

    const filters = ['All Time', '7d', '30d', '90d'];
    const brandName = user?.brandName || 'Camana Homes';
    const prompts = getPromptPerformance(user);

    const scanDate = new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });

    return (
        <div className="w-full pb-12">
            {/* ── Sticky Header ── */}
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
                <div className="flex items-center p-1 gap-0.5 bg-[#111] border border-[#222] rounded-xl">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${activeFilter === f
                                ? 'bg-[#E92A15] text-white shadow-[0_0_12px_rgba(233,42,21,0.4)]'
                                : 'text-[#666] hover:text-[#aaa]'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-8 space-y-5 max-w-[1400px]">
                {/* ── KPI Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Avg Sentiment', value: '78%', icon: Smile, change: '+6%', positive: true },
                        { label: 'Tracked Prompts', value: '142', icon: Search, change: '+23', positive: true },
                        { label: 'Active Regions', value: '38', icon: Globe, change: '+5', positive: true },
                        { label: 'Negative Mentions', value: '8%', icon: Frown, change: '-3%', positive: false },
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

                {/* ── Sentiment Trend + Breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Trend Chart */}
                    <div className="lg:col-span-2 bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-white font-semibold text-[16px]">Sentiment Trend</h2>
                                <p className="text-[#666] text-[13px] mt-0.5">How AI platforms perceive your brand over time</p>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] shrink-0">
                                <span className="flex items-center gap-1.5 text-[#ccc]"><span className="w-2 h-2 rounded-full bg-white inline-block" />Positive</span>
                                <span className="flex items-center gap-1.5 text-[#666]"><span className="w-2 h-2 rounded-full bg-[#666] inline-block" />Neutral</span>
                                <span className="flex items-center gap-1.5 text-[#666]"><span className="w-2 h-2 rounded-full bg-[#E92A15] inline-block" />Negative</span>
                            </div>
                        </div>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sentimentTrend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.18} />
                                            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="neuGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#666666" stopOpacity={0.15} />
                                            <stop offset="100%" stopColor="#666666" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#E92A15" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#E92A15" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="#2a2a2a" tick={{ fill: '#555', fontSize: 11 }} />
                                    <YAxis stroke="#2a2a2a" tick={{ fill: '#555', fontSize: 11 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
                                    <Tooltip content={<TrendTooltip />} />
                                    <Area type="monotone" dataKey="positive" stroke="#e5e5e5" strokeWidth={2} fill="url(#posGrad)" dot={{ fill: '#e5e5e5', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#fff' }} />
                                    <Area type="monotone" dataKey="neutral" stroke="#666" strokeWidth={1.5} fill="url(#neuGrad)" dot={false} />
                                    <Area type="monotone" dataKey="negative" stroke="#E92A15" strokeWidth={1.5} fill="url(#negGrad)" dot={{ fill: '#E92A15', r: 2, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Sentiment Breakdown */}
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6 flex flex-col">
                        <div className="mb-4">
                            <h2 className="text-white font-semibold text-[16px]">Sentiment Breakdown</h2>
                            <p className="text-[#666] text-[13px] mt-0.5">Distribution across all responses</p>
                        </div>
                        {/* Donut chart */}
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
                            {/* Center label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-white text-[24px] font-bold leading-none">72%</span>
                                <span className="text-[#666] text-[11px] mt-1">Positive</span>
                            </div>
                        </div>
                        {/* Legend */}
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

                {/* ── Prompt Performance Table ── */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h2 className="text-white font-semibold text-[16px]">Prompt Performance</h2>
                            <p className="text-[#666] text-[13px] mt-0.5">Track which AI prompts mention your brand and their sentiment</p>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#222] rounded-xl text-[12px] text-[#888] hover:text-[#ccc] hover:border-[#333] transition-all">
                            <Filter className="w-3.5 h-3.5" /> Filter
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#1a1a1a]">
                                    {['PROMPT', 'BRAND MENTIONED', 'POSITION', 'CITATION SCORE', 'PLATFORM', 'TREND'].map(h => (
                                        <th key={h} className={`pb-3 text-[10px] text-[#444] uppercase tracking-[0.12em] font-bold ${h === 'PROMPT' ? 'text-left' : 'text-center'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {prompts.map((row, i) => (
                                    <tr key={i} className="border-b border-[#111] hover:bg-[#111] transition-colors group cursor-pointer">
                                        <td className="py-4 pr-4">
                                            <div className="flex items-center gap-2">
                                                <Search className="w-3.5 h-3.5 text-[#444] shrink-0" />
                                                <span className="text-[#ccc] text-[13px]">{row.prompt}</span>
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
                                            <div className="inline-flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                    <div className="h-full bg-white rounded-full" style={{ width: `${row.citationScore}%` }} />
                                                </div>
                                                <span className="text-[#888] text-[13px] w-6 text-right">{row.citationScore}</span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] ${PLATFORM_STYLES[row.platform] || PLATFORM_STYLES.ChatGPT}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                                {row.platform}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`inline-flex items-center gap-1 text-[13px] font-semibold ${row.positive ? 'text-[#22c55e]' : 'text-[#E92A15]'}`}>
                                                {row.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                {row.trend}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Regional Performance Map + Top Countries ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Interactive World Map */}
                    <div className="lg:col-span-2 bg-[#0B0B0B] border border-[#222] rounded-2xl p-6 relative overflow-hidden">
                        <h2 className="text-white font-semibold text-[16px] mb-1">Regional Performance</h2>
                        <p className="text-[#666] text-[13px] mb-4">Citations and sentiment score by region</p>

                        {/* Map container */}
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
                                                const data = regionSentiment[numId];
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
                                                                const rect = evt.target.closest('svg')?.getBoundingClientRect();
                                                                const containerRect = evt.target.closest('.relative')?.getBoundingClientRect();
                                                                if (rect && containerRect) {
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
                            {/* Tooltip */}
                            {tooltip && (
                                <MapTooltip info={tooltip} x={tooltip.x} y={tooltip.y} />
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-4">
                            <span className="text-[#666] text-[11px]">Low</span>
                            <div className="flex-1 h-2 rounded-full" style={{
                                background: 'linear-gradient(to right, #7c2020, #7c4a20, #7c6a2a, #4a7c4e)'
                            }} />
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
                            {topCountries.map((c, i) => (
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
                                            <div className="h-full bg-white rounded-full" style={{ width: `${c.share * 2.5}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-center pt-4">
                    <p className="text-[#333] text-[11px] font-semibold uppercase tracking-[0.15em]">
                        SCANNED {scanDate}
                    </p>
                </div>
            </div>
        </div>
    );
}