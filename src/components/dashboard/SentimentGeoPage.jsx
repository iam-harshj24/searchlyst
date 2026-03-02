import React, { useState } from 'react';
import {
    Globe, TrendingUp, ArrowUpRight, ArrowDownRight, Search, MapPin,
    Smile, Frown, Meh, BarChart3, Filter, ChevronRight
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';

const sentimentTrend = [
    { date: 'Jan', positive: 65, neutral: 25, negative: 10 },
    { date: 'Feb', positive: 68, neutral: 22, negative: 10 },
    { date: 'Mar', positive: 72, neutral: 18, negative: 10 },
    { date: 'Apr', positive: 70, neutral: 20, negative: 10 },
    { date: 'May', positive: 75, neutral: 17, negative: 8 },
    { date: 'Jun', positive: 78, neutral: 15, negative: 7 },
    { date: 'Jul', positive: 80, neutral: 14, negative: 6 },
];

const geoData = [
    { region: 'North America', citations: 4200, sentiment: 82, trend: '+12%', positive: true, flag: '🇺🇸' },
    { region: 'Europe', citations: 3100, sentiment: 78, trend: '+8%', positive: true, flag: '🇪🇺' },
    { region: 'Asia Pacific', citations: 2800, sentiment: 71, trend: '+22%', positive: true, flag: '🌏' },
    { region: 'Latin America', citations: 890, sentiment: 68, trend: '+5%', positive: true, flag: '🌎' },
    { region: 'Middle East', citations: 620, sentiment: 65, trend: '-3%', positive: false, flag: '🌍' },
    { region: 'Africa', citations: 340, sentiment: 60, trend: '+15%', positive: true, flag: '🌍' },
];

// PROMPT 13 — Sentiment/Geo Page: Mock Prompt Table (Enhanced)
const getPromptPerformance = (user) => {
    const industry = user?.industry || 'SaaS';
    const brandName = user?.brandName || 'Brand';
    return [
        {
            prompt: `Best ${industry.toLowerCase()} companies for mid-market teams`,
            platform: 'ChatGPT',
            brandMentioned: true,
            position: 2,
            citationScore: 78,
            citations: 48,
            sentiment: 92,
            region: user?.location || 'US',
            trend: '+18%',
            positive: true
        },
        {
            prompt: `${industry} software reviews and comparisons`,
            platform: 'Perplexity',
            brandMentioned: false,
            position: null,
            citationScore: 0,
            citations: 35,
            sentiment: 85,
            region: 'Global',
            trend: '+12%',
            positive: true
        },
        {
            prompt: `Top ${industry.toLowerCase()} tools recommended by experts`,
            platform: 'Gemini',
            brandMentioned: true,
            position: 4,
            citationScore: 52,
            citations: 29,
            sentiment: 88,
            region: 'Europe',
            trend: '+8%',
            positive: true
        },
        {
            prompt: `${brandName} vs alternatives — honest comparison`,
            platform: 'ChatGPT',
            brandMentioned: true,
            position: 1,
            citationScore: 91,
            citations: 22,
            sentiment: 76,
            region: user?.location || 'US',
            trend: '+25%',
            positive: true
        },
        {
            prompt: `${industry} market leaders in ${new Date().getFullYear()}`,
            platform: 'Perplexity',
            brandMentioned: false,
            position: null,
            citationScore: 0,
            citations: 18,
            sentiment: 81,
            region: 'Global',
            trend: '-2%',
            positive: false
        },
    ];
};


const sentimentBreakdown = [
    { name: 'Positive', value: 72, color: '#ffffff' },
    { name: 'Neutral', value: 20, color: '#737373' },
    { name: 'Negative', value: 8, color: '#ef4444' },
];

const topCountries = [
    { country: 'United States', citations: 2800, share: 35, flag: '🇺🇸' },
    { country: 'United Kingdom', citations: 1200, share: 15, flag: '🇬🇧' },
    { country: 'Germany', citations: 890, share: 11, flag: '🇩🇪' },
    { country: 'India', citations: 760, share: 9, flag: '🇮🇳' },
    { country: 'Canada', citations: 680, share: 8, flag: '🇨🇦' },
    { country: 'Australia', citations: 520, share: 6, flag: '🇦🇺' },
];

export default function SentimentGeoPage({ user }) {
    const [activeFilter, setActiveFilter] = useState('all');
    const filters = ['all', '7d', '30d', '90d'];
    const brandName = user?.brandName || 'Your Brand';
    const userLocation = user?.location || '';
    const industry = user?.industry || 'your industry';

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Sentiment & Geo Tracking</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Track how AI perceives <span className="text-[var(--text-secondary)]">{brandName}</span> across regions and prompts</p>
                </div>
                <div className="flex items-center gap-2">
                    {filters.map(f => (
                        <button key={f} onClick={() => setActiveFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeFilter === f
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-secondary)]'
                                }`}>
                            {f === 'all' ? 'All Time' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Avg Sentiment', value: '78%', icon: Smile, change: '+6%', positive: true, gradient: 'from-red-500/10 to-red-600/10', border: 'border-red-500/20' },
                    { label: 'Tracked Prompts', value: '142', icon: Search, change: '+23', positive: true, gradient: 'from-[var(--surface-hover)] to-transparent', border: 'border-[var(--border)]' },
                    { label: 'Active Regions', value: '38', icon: Globe, change: '+5', positive: true, gradient: 'from-red-500/5 to-transparent', border: 'border-[var(--border)]' },
                    { label: 'Negative Mentions', value: '8%', icon: Frown, change: '-3%', positive: true, gradient: 'from-[var(--surface-hover)] to-transparent', border: 'border-[var(--border)]' },
                ].map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={i} className={`bg-gradient-to-br ${kpi.gradient} border ${kpi.border} rounded-2xl p-4`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[var(--text-secondary)] text-xs font-medium">{kpi.label}</span>
                                <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold text-[var(--text-primary)]">{kpi.value}</span>
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${kpi.positive ? 'bg-[var(--surface-active)] text-[var(--text-primary)]' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {kpi.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {kpi.change}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sentiment Trend Chart */}
                <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 hover:border-red-500/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-[var(--text-primary)] font-medium text-sm">Sentiment Trend</h3>
                            <p className="text-[var(--text-muted)] text-xs mt-0.5">How AI platforms perceive your brand over time</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white" /> Positive</span>
                            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]"><div className="w-2 h-2 rounded-full bg-[var(--surface-active)]" /> Neutral</span>
                            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]"><div className="w-2 h-2 rounded-full bg-red-500" /> Negative</span>
                        </div>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sentimentTrend}>
                                <defs>
                                    <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="neuGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.08} />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#525252" tick={{ fill: '#737373', fontSize: 11 }} />
                                <YAxis stroke="#525252" tick={{ fill: '#737373', fontSize: 11 }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="positive" stroke="#ffffff" strokeWidth={2} fill="url(#posGrad)" />
                                <Area type="monotone" dataKey="neutral" stroke="#737373" strokeWidth={1.5} fill="url(#neuGrad)" />
                                <Area type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={1.5} fill="url(#negGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sentiment Breakdown */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 hover:border-red-500/20 transition-all">
                    <h3 className="text-[var(--text-primary)] font-medium text-sm mb-4">Sentiment Breakdown</h3>
                    <div className="h-40 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={sentimentBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                                    {sentimentBreakdown.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-3">
                        {sentimentBreakdown.map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-[var(--text-secondary)] text-xs">{item.name}</span>
                                </div>
                                <span className="text-[var(--text-primary)] text-xs font-semibold">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Prompt Performance Table */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 hover:border-red-500/20 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-[var(--text-primary)] font-medium text-sm">Prompt Performance</h3>
                        <p className="text-[var(--text-muted)] text-xs mt-0.5">Track which AI prompts mention your brand and their sentiment</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)]">
                        <Filter className="w-3 h-3" /> Filter
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className="text-left text-[10px] text-[var(--text-muted)] uppercase tracking-wider pb-3 font-semibold">Prompt</th>
                                <th className="text-center text-[10px] text-[var(--text-muted)] uppercase tracking-wider pb-3 font-semibold">Brand Mentioned</th>
                                <th className="text-center text-[10px] text-[var(--text-muted)] uppercase tracking-wider pb-3 font-semibold">Position</th>
                                <th className="text-center text-[10px] text-[var(--text-muted)] uppercase tracking-wider pb-3 font-semibold">Citation Score</th>
                                <th className="text-center text-[10px] text-[var(--text-muted)] uppercase tracking-wider pb-3 font-semibold">Platform</th>
                                <th className="text-center text-[10px] text-[var(--text-muted)] uppercase tracking-wider pb-3 font-semibold">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getPromptPerformance(user).map((prompt, i) => (
                                <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
                                    <td className="py-3.5">
                                        <div className="flex items-center gap-2">
                                            <Search className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" />
                                            <span className="text-[var(--text-primary)] text-sm">{prompt.prompt}</span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${prompt.brandMentioned
                                                ? 'bg-[var(--surface-active)] text-[var(--text-primary)]'
                                                : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {prompt.brandMentioned ? '✓ Yes' : '✗ No'}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        {prompt.position != null
                                            ? <span className="text-[var(--text-primary)] text-sm font-semibold">#{prompt.position}</span>
                                            : <span className="text-[var(--text-muted)] text-xs">—</span>
                                        }
                                    </td>
                                    <td className="text-center">
                                        <div className="inline-flex items-center gap-1.5">
                                            <div className="w-14 h-1.5 bg-[var(--surface-active)] rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{
                                                    width: `${prompt.citationScore}%`,
                                                    backgroundColor: prompt.citationScore > 70 ? '#ffffff' : prompt.citationScore > 40 ? '#737373' : '#ef4444'
                                                }} />
                                            </div>
                                            <span className="text-[var(--text-secondary)] text-xs">{prompt.citationScore}</span>
                                        </div>
                                    </td>
                                    <td className="text-center text-[var(--text-secondary)] text-xs">{prompt.platform}</td>
                                    <td className="text-center">
                                        <span className={`text-xs font-medium ${prompt.positive ? 'text-[var(--text-primary)]' : 'text-red-400'}`}>
                                            {prompt.trend}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Regional Performance */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 hover:border-red-500/20 transition-all">
                    <h3 className="text-[var(--text-primary)] font-medium text-sm mb-4">Regional Performance</h3>
                    <div className="space-y-3">
                        {geoData.map((region, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-[var(--surface-hover)] rounded-xl hover:bg-[var(--surface-active)] transition-colors cursor-pointer group">
                                <span className="text-xl">{region.flag}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[var(--text-primary)] text-sm font-medium">{region.region}</span>
                                        <span className={`text-xs font-medium ${region.positive ? 'text-[var(--text-primary)]' : 'text-red-400'}`}>{region.trend}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                                        <span>{region.citations.toLocaleString()} citations</span>
                                        <span>Sentiment: {region.sentiment}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-[var(--surface-active)] rounded-full mt-2 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-white"
                                            style={{ width: `${region.sentiment}%` }} />
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-muted)] transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Countries */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 hover:border-red-500/20 transition-all">
                    <h3 className="text-[var(--text-primary)] font-medium text-sm mb-4">Top Countries by Citations</h3>
                    <div className="space-y-3">
                        {topCountries.map((country, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-[var(--text-muted)] text-xs w-5 text-right font-medium">#{i + 1}</span>
                                <span className="text-lg">{country.flag}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[var(--text-primary)] text-sm">{country.country}</span>
                                        <span className="text-[var(--text-secondary)] text-xs">{country.citations.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[var(--surface-active)] rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400"
                                            style={{ width: `${country.share * 2.5}%` }} />
                                    </div>
                                </div>
                                <span className="text-[var(--text-muted)] text-xs">{country.share}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}