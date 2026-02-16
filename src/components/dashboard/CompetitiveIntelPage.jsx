import React from 'react';
import { Swords, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const competitors = [
    { name: 'Your Brand', visibility: 72, citations: 37900, sentiment: 0.72, isYours: true },
    { name: 'Competitor A', visibility: 68, citations: 42100, sentiment: 0.68 },
    { name: 'Competitor B', visibility: 55, citations: 28500, sentiment: 0.75 },
    { name: 'Competitor C', visibility: 48, citations: 19200, sentiment: 0.62 },
];

const queryBattles = [
    { query: 'best CRM software', you: 45, compA: 35, winner: 'you' },
    { query: 'CRM for startups', you: 30, compA: 50, winner: 'comp' },
    { query: 'enterprise CRM', you: 25, compA: 55, winner: 'comp' },
    { query: 'CRM pricing', you: 60, compA: 25, winner: 'you' },
    { query: 'easy CRM setup', you: 55, compA: 30, winner: 'you' },
];

export default function CompetitiveIntelPage() {
    return (
        <div className="space-y-6">
            {/* Competitor Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {competitors.map((comp, i) => (
                    <div 
                        key={i} 
                        className={`rounded-xl p-4 border ${
                            comp.isYours 
                                ? 'bg-red-500/10 border-red-500/30' 
                                : 'bg-[var(--bg-secondary)] border-[var(--border)]'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`font-medium ${comp.isYours ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                                {comp.name}
                            </span>
                            {comp.isYours && <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">You</span>}
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[var(--text-secondary)]">Visibility</span>
                                <span className="text-[var(--text-primary)] font-medium">{comp.visibility}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-secondary)]">Citations</span>
                                <span className="text-[var(--text-primary)]">{(comp.citations / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-secondary)]">Sentiment</span>
                                <span className={comp.sentiment >= 0.7 ? 'text-emerald-400' : 'text-amber-400'}>
                                    {comp.sentiment}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Query Battles */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="text-[var(--text-primary)] font-medium mb-4">Query Battles: You vs Top Competitor</h3>
                <div className="h-64">
                    <ResponsiveContainer>
                        <BarChart data={queryBattles} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#737373', fontSize: 11 }} />
                            <YAxis dataKey="query" type="category" tick={{ fill: '#737373', fontSize: 10 }} width={120} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                            />
                            <Bar dataKey="you" fill="#EF4444" name="You" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="compA" fill="#6B7280" name="Competitor A" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs">
                    <span className="flex items-center gap-2 text-[var(--text-secondary)]"><span className="w-3 h-3 bg-red-500 rounded" /> You</span>
                    <span className="flex items-center gap-2 text-[var(--text-secondary)]"><span className="w-3 h-3 bg-gray-500 rounded" /> Competitor A</span>
                </div>
            </div>

            {/* Win/Loss Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                    <h3 className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Queries You're Winning
                    </h3>
                    <div className="space-y-2">
                        {queryBattles.filter(q => q.winner === 'you').map((q, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-[var(--bg-primary)] rounded border border-[var(--border)]">
                                <span className="text-[var(--text-primary)] text-sm">{q.query}</span>
                                <span className="text-emerald-400 text-sm">{q.you}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                    <h3 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Queries to Win Back
                    </h3>
                    <div className="space-y-2">
                        {queryBattles.filter(q => q.winner === 'comp').map((q, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-[var(--bg-primary)] rounded border border-[var(--border)]">
                                <span className="text-[var(--text-primary)] text-sm">{q.query}</span>
                                <span className="text-red-400 text-sm">{q.you}% vs {q.compA}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}