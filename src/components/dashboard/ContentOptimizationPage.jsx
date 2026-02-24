import React from 'react';
import { FileText, TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const opportunities = [
    { topic: 'CRM integration guide', volume: 8500, ourScore: 25, potential: 'High', action: 'Create content' },
    { topic: 'Pricing comparison', volume: 12000, ourScore: 60, potential: 'Medium', action: 'Improve existing' },
    { topic: 'Getting started tutorial', volume: 15000, ourScore: 85, potential: 'Defend', action: 'Monitor' },
    { topic: 'API documentation', volume: 5200, ourScore: 40, potential: 'High', action: 'Add examples' },
    { topic: 'Security features', volume: 4100, ourScore: 70, potential: 'Medium', action: 'Add certifications' },
];

const contentTips = [
    { title: 'Add FAQ sections', impact: 'High', effort: 'Low', description: 'FAQ schema increases AI citation rate by ~25%' },
    { title: 'Include data tables', impact: 'High', effort: 'Medium', description: 'Structured data helps AI extract accurate info' },
    { title: 'Write comparison guides', impact: 'High', effort: 'Medium', description: 'Direct comparisons get cited in decision queries' },
    { title: 'Update pricing info', impact: 'Critical', effort: 'Low', description: 'Outdated pricing causes hallucinations' },
];

export default function ContentOptimizationPage() {
    return (
        <div className="space-y-6">
            {/* Content Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-400 text-sm mb-1">Strong Content</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">12 pages</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-1">Highly cited across AI platforms</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-amber-400 text-sm mb-1">Needs Improvement</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">8 pages</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-1">Low citation rate, high potential</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm mb-1">Content Gaps</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">5 topics</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-1">Missing content for popular queries</p>
                </div>
            </div>

            {/* Opportunities Table */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="text-[var(--text-primary)] font-medium mb-4">Content Opportunities</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[var(--text-secondary)] text-sm border-b border-[var(--border)]">
                                <th className="pb-3">Topic</th>
                                <th className="pb-3">Monthly Searches</th>
                                <th className="pb-3">Your Score</th>
                                <th className="pb-3">Potential</th>
                                <th className="pb-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {opportunities.map((opp, i) => (
                                <tr key={i} className="text-sm">
                                    <td className="py-3 text-[var(--text-primary)]">{opp.topic}</td>
                                    <td className="py-3 text-[var(--text-secondary)]">{opp.volume.toLocaleString()}</td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        opp.ourScore >= 70 ? 'bg-emerald-500' :
                                                        opp.ourScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${opp.ourScore}%` }}
                                                />
                                            </div>
                                            <span className="text-[var(--text-secondary)]">{opp.ourScore}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            opp.potential === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                                            opp.potential === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                            {opp.potential}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <Button size="sm" variant="ghost" className="text-red-400 h-7 text-xs">
                                            {opp.action} <ArrowRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Wins */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="text-[var(--text-primary)] font-medium mb-4">🎯 Quick Wins</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contentTips.map((tip, i) => (
                        <div key={i} className="p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[var(--text-primary)] font-medium">{tip.title}</span>
                                <div className="flex gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                        tip.impact === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                        tip.impact === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                                        'bg-amber-500/20 text-amber-400'
                                    }`}>
                                        {tip.impact} Impact
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--border)] text-[var(--text-secondary)]">
                                        {tip.effort} Effort
                                    </span>
                                </div>
                            </div>
                            <p className="text-[var(--text-secondary)] text-sm">{tip.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}