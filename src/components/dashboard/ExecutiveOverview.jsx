import React from 'react';
import { TrendingUp, TrendingDown, Eye, MessageSquare, AlertTriangle, ThumbsUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const scoreData = [
    { name: 'Score', value: 72 },
    { name: 'Remaining', value: 28 },
];

const trendData = [
    { day: 'Mon', score: 68 },
    { day: 'Tue', score: 70 },
    { day: 'Wed', score: 69 },
    { day: 'Thu', score: 72 },
    { day: 'Fri', score: 74 },
    { day: 'Sat', score: 71 },
    { day: 'Sun', score: 72 },
];

const platformData = [
    { name: 'ChatGPT', citations: 15200, share: 40, color: '#EF4444' },
    { name: 'Gemini', citations: 9100, share: 24, color: '#F87171' },
    { name: 'Perplexity', citations: 6080, share: 16, color: '#FCA5A5' },
    { name: 'Claude', citations: 4560, share: 12, color: '#FECACA' },
    { name: 'Others', citations: 3040, share: 8, color: '#6B7280' },
];

export default function ExecutiveOverview() {
    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Visibility Score', value: '72', icon: Eye, change: '+3.2%', up: true },
                    { label: 'Total Citations', value: '37.9K', icon: MessageSquare, change: '+12%', up: true },
                    { label: 'Sentiment', value: '0.72', icon: ThumbsUp, change: '+0.08', up: true },
                    { label: 'Issues', value: '5', icon: AlertTriangle, change: '-2', up: false },
                ].map((stat, i) => (
                    <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon className="w-4 h-4 text-red-500" />
                            <span className="text-[var(--text-secondary)] text-sm">{stat.label}</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</span>
                            <span className={`text-sm flex items-center gap-1 ${stat.up ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Gauge */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="text-[var(--text-primary)] font-medium mb-4">Visibility Score</h3>
                    <div className="relative w-40 h-40 mx-auto">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={scoreData}
                                    cx="50%"
                                    cy="50%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={50}
                                    outerRadius={70}
                                    dataKey="value"
                                >
                                    <Cell fill="#EF4444" />
                                    <Cell fill="rgba(255,255,255,0.1)" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-[var(--text-primary)]">72</span>
                            <span className="text-emerald-400 text-sm">+3.2%</span>
                        </div>
                    </div>
                    <p className="text-center text-[var(--text-secondary)] text-sm mt-2">Good - Keep improving!</p>
                </div>

                {/* Weekly Trend */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="text-[var(--text-primary)] font-medium mb-4">7-Day Trend</h3>
                    <div className="h-40">
                        <ResponsiveContainer>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="day" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} />
                                <YAxis domain={[60, 80]} tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    labelStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#EF4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Platform Breakdown */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="text-[var(--text-primary)] font-medium mb-4">Citations by Platform</h3>
                    <div className="space-y-3">
                        {platformData.map((platform, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platform.color }} />
                                <span className="text-[var(--text-secondary)] text-sm flex-1">{platform.name}</span>
                                <span className="text-[var(--text-primary)] text-sm font-medium">{platform.share}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="text-[var(--text-primary)] font-medium mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {[
                        { type: 'success', text: 'New citation on ChatGPT for "best CRM software"', time: '2 hours ago' },
                        { type: 'warning', text: 'Competitor A mentioned more frequently in pricing queries', time: '5 hours ago' },
                        { type: 'success', text: 'Sentiment improved in European markets', time: '1 day ago' },
                        { type: 'error', text: 'Outdated pricing info detected on Gemini', time: '1 day ago' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]">
                            <div className={`w-2 h-2 rounded-full ${
                                item.type === 'success' ? 'bg-emerald-400' :
                                item.type === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                            }`} />
                            <span className="text-[var(--text-secondary)] text-sm flex-1">{item.text}</span>
                            <span className="text-[var(--text-secondary)] text-xs">{item.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}