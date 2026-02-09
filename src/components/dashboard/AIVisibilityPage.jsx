import React from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const citationData = [
    { query: 'best CRM software', you: 45, competitor: 30 },
    { query: 'CRM for startups', you: 38, competitor: 42 },
    { query: 'enterprise CRM', you: 25, competitor: 55 },
    { query: 'CRM pricing', you: 52, competitor: 28 },
    { query: 'CRM features', you: 40, competitor: 35 },
];

const platforms = [
    { name: 'ChatGPT', status: 'strong', score: 78, trend: '+5%' },
    { name: 'Gemini', status: 'good', score: 65, trend: '+12%' },
    { name: 'Perplexity', status: 'good', score: 62, trend: '+8%' },
    { name: 'Claude', status: 'weak', score: 45, trend: '-2%' },
];

const issues = [
    { platform: 'ChatGPT', issue: 'Outdated pricing shown ($199 instead of $149)', severity: 'high' },
    { platform: 'Gemini', issue: 'Missing new features launched in Q4', severity: 'medium' },
    { platform: 'Claude', issue: 'Low citation rate for product comparisons', severity: 'low' },
];

export default function AIVisibilityPage() {
    return (
        <div className="space-y-6">
            {/* Platform Performance */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platforms.map((platform, i) => (
                    <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[var(--text-primary)] font-medium">{platform.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                platform.status === 'strong' ? 'bg-emerald-500/20 text-emerald-400' :
                                platform.status === 'good' ? 'bg-red-500/20 text-red-400' :
                                'bg-amber-500/20 text-amber-400'
                            }`}>
                                {platform.status}
                            </span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-[var(--text-primary)]">{platform.score}</span>
                            <span className={`text-sm ${platform.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                {platform.trend}
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${
                                    platform.status === 'strong' ? 'bg-emerald-500' :
                                    platform.status === 'good' ? 'bg-red-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${platform.score}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Citation Comparison */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="text-[var(--text-primary)] font-medium mb-4">Your Citations vs Competitors</h3>
                    <div className="h-64">
                        <ResponsiveContainer>
                            <BarChart data={citationData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis type="number" tick={{ fill: '#737373', fontSize: 11 }} />
                                <YAxis dataKey="query" type="category" tick={{ fill: '#737373', fontSize: 10 }} width={100} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="you" fill="#EF4444" name="You" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="competitor" fill="#6B7280" name="Competitor" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4 text-xs">
                        <span className="flex items-center gap-2 text-[var(--text-secondary)]"><span className="w-3 h-3 bg-red-500 rounded" /> You</span>
                        <span className="flex items-center gap-2 text-[var(--text-secondary)]"><span className="w-3 h-3 bg-gray-500 rounded" /> Top Competitor</span>
                    </div>
                </div>

                {/* Issues to Fix */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="text-[var(--text-primary)] font-medium mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Issues to Fix
                    </h3>
                    <div className="space-y-3">
                        {issues.map((issue, i) => (
                            <div 
                                key={i}
                                className={`p-4 rounded-lg border ${
                                    issue.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                                    issue.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                                    'bg-red-500/5 border-red-500/20'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[var(--text-primary)] text-sm font-medium">{issue.platform}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                                        issue.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                        issue.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-red-500/10 text-red-300'
                                    }`}>
                                        {issue.severity}
                                    </span>
                                </div>
                                <p className="text-[var(--text-secondary)] text-sm">{issue.issue}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-6">
                <h3 className="text-[var(--text-primary)] font-medium mb-3">💡 Quick Tips to Improve</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        'Update your pricing page with FAQ schema',
                        'Create comparison content vs top competitors',
                        'Add more customer testimonials to product pages',
                    ].map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <span className="text-[var(--text-secondary)] text-sm">{tip}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}