import React, { useState } from 'react';
import { 
    Eye, TrendingUp, AlertTriangle, CheckCircle, Brain, Globe,
    ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const citationData = [
    { query: 'best CRM software', you: 45, competitor: 30 },
    { query: 'CRM for startups', you: 38, competitor: 42 },
    { query: 'enterprise CRM', you: 25, competitor: 55 },
    { query: 'CRM pricing', you: 52, competitor: 28 },
    { query: 'CRM features', you: 40, competitor: 35 },
];

const platforms = [
    { name: 'ChatGPT', score: 78, trend: '+5%', positive: true },
    { name: 'Gemini', score: 65, trend: '+12%', positive: true },
    { name: 'Perplexity', score: 62, trend: '+8%', positive: true },
    { name: 'Claude', score: 45, trend: '-2%', positive: false },
    { name: 'Copilot', score: 55, trend: '+3%', positive: true },
];

const weeklyTrend = [
    { week: 'W1', citations: 120 }, { week: 'W2', citations: 145 },
    { week: 'W3', citations: 138 }, { week: 'W4', citations: 165 },
    { week: 'W5', citations: 178 }, { week: 'W6', citations: 195 },
    { week: 'W7', citations: 210 }, { week: 'W8', citations: 235 },
];

const sentimentData = [
    { name: 'Positive', value: 65, color: '#22c55e' },
    { name: 'Neutral', value: 25, color: '#6366f1' },
    { name: 'Negative', value: 10, color: '#ef4444' },
];

const issues = [
    { platform: 'ChatGPT', issue: 'Outdated pricing shown ($199 instead of $149)', severity: 'high' },
    { platform: 'Gemini', issue: 'Missing new features launched in Q4', severity: 'medium' },
    { platform: 'Claude', issue: 'Low citation rate for product comparisons', severity: 'low' },
];

export default function AIVisibilityPage() {
    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-400" />
                    AI Visibility Analytics
                </h1>
                <p className="text-white/40 text-sm mt-1">Track how AI search engines see and cite your brand.</p>
            </div>

            {/* Platform Scores */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {platforms.map((platform, i) => (
                    <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4">
                        <p className="text-white/40 text-xs mb-2">{platform.name}</p>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-white">{platform.score}</span>
                            <span className={`flex items-center gap-0.5 text-xs ${
                                platform.positive ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                                {platform.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {platform.trend}
                            </span>
                        </div>
                        <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                                platform.score >= 70 ? 'bg-emerald-500' :
                                platform.score >= 50 ? 'bg-purple-500' : 'bg-amber-500'
                            }`} style={{ width: `${platform.score}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Citation Trend */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium text-sm">Citation Trend</h3>
                        <span className="text-emerald-400 text-xs flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> +96% over 8 weeks
                        </span>
                    </div>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyTrend}>
                                <defs>
                                    <linearGradient id="citGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="week" tick={{ fill: '#ffffff30', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#ffffff30', fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="citations" stroke="#a855f7" strokeWidth={2} fill="url(#citGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sentiment */}
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-white font-medium text-sm mb-4">AI Sentiment</h3>
                    <div className="h-40 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                                    {sentimentData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                        {sentimentData.map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-white/30 text-[10px]">{item.name} {item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Citation Comparison */}
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-white font-medium text-sm mb-4">Your Citations vs Competitors</h3>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={citationData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis type="number" tick={{ fill: '#ffffff30', fontSize: 11 }} />
                            <YAxis dataKey="query" type="category" tick={{ fill: '#ffffff30', fontSize: 10 }} width={110} />
                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                            <Bar dataKey="you" fill="#a855f7" name="You" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="competitor" fill="#374151" name="Competitor" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-3 text-xs">
                    <span className="flex items-center gap-2 text-white/30"><span className="w-3 h-3 bg-purple-500 rounded" /> You</span>
                    <span className="flex items-center gap-2 text-white/30"><span className="w-3 h-3 bg-gray-700 rounded" /> Top Competitor</span>
                </div>
            </div>

            {/* Issues */}
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Issues to Fix
                </h3>
                <div className="space-y-3">
                    {issues.map((issue, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${
                            issue.severity === 'high' ? 'bg-red-500/5 border-red-500/20' :
                            issue.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                            'bg-white/[0.02] border-white/[0.04]'
                        }`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-white text-sm font-medium">{issue.platform}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md capitalize border ${
                                    issue.severity === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    issue.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>{issue.severity}</span>
                            </div>
                            <p className="text-white/40 text-sm">{issue.issue}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}