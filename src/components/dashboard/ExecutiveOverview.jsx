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
    { name: 'ChatGPT', citations: 15200, share: 40, color: '#10A37F' },
    { name: 'Gemini', citations: 9100, share: 24, color: '#8E75B2' },
    { name: 'Perplexity', citations: 6080, share: 16, color: '#FF6B35' },
    { name: 'Claude', citations: 4560, share: 12, color: '#D4A574' },
    { name: 'Others', citations: 3040, share: 8, color: '#6B7280' },
];

export default function ExecutiveOverview() {
    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Visibility Score', value: '72', icon: Eye, change: '+3.2%', up: true, color: 'blue' },
                    { label: 'Total Citations', value: '37.9K', icon: MessageSquare, change: '+12%', up: true, color: 'emerald' },
                    { label: 'Sentiment', value: '0.72', icon: ThumbsUp, change: '+0.08', up: true, color: 'purple' },
                    { label: 'Issues', value: '5', icon: AlertTriangle, change: '-2', up: false, color: 'amber' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                            <span className="text-gray-400 text-sm">{stat.label}</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-white">{stat.value}</span>
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
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-medium mb-4">Visibility Score</h3>
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
                                    <Cell fill="#3B82F6" />
                                    <Cell fill="#1f2937" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">72</span>
                            <span className="text-emerald-400 text-sm">+3.2%</span>
                        </div>
                    </div>
                    <p className="text-center text-gray-400 text-sm mt-2">Good - Keep improving!</p>
                </div>

                {/* Weekly Trend */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-medium mb-4">7-Day Trend</h3>
                    <div className="h-40">
                        <ResponsiveContainer>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} />
                                <YAxis domain={[60, 80]} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Platform Breakdown */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-medium mb-4">Citations by Platform</h3>
                    <div className="space-y-3">
                        {platformData.map((platform, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platform.color }} />
                                <span className="text-gray-300 text-sm flex-1">{platform.name}</span>
                                <span className="text-white text-sm font-medium">{platform.share}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {[
                        { type: 'success', text: 'New citation on ChatGPT for "best CRM software"', time: '2 hours ago' },
                        { type: 'warning', text: 'Competitor A mentioned more frequently in pricing queries', time: '5 hours ago' },
                        { type: 'success', text: 'Sentiment improved in European markets', time: '1 day ago' },
                        { type: 'error', text: 'Outdated pricing info detected on Gemini', time: '1 day ago' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <div className={`w-2 h-2 rounded-full ${
                                item.type === 'success' ? 'bg-emerald-400' :
                                item.type === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                            }`} />
                            <span className="text-gray-300 text-sm flex-1">{item.text}</span>
                            <span className="text-gray-500 text-xs">{item.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}