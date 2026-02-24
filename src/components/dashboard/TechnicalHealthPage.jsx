import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Settings } from 'lucide-react';

const healthChecks = [
    { name: 'Pages Indexed', status: 'good', value: '245/250', detail: '98% indexed by Google' },
    { name: 'AI Crawl Access', status: 'good', value: '230/250', detail: '92% accessible to AI crawlers' },
    { name: 'Schema Markup', status: 'warning', value: '180/250', detail: '72% have structured data' },
    { name: 'FAQ Schema', status: 'warning', value: '45/120', detail: '38% of eligible pages' },
    { name: 'Load Speed', status: 'good', value: '2.1s', detail: 'Average page load time' },
    { name: 'Mobile Friendly', status: 'good', value: '100%', detail: 'All pages responsive' },
];

const issues = [
    { type: 'warning', title: '70 pages missing FAQ schema', impact: 'Medium', fix: 'Add FAQ structured data' },
    { type: 'warning', title: '25 pages blocked from AI crawlers', impact: 'High', fix: 'Update robots.txt' },
    { type: 'error', title: '5 pages with broken schema', impact: 'High', fix: 'Fix validation errors' },
    { type: 'info', title: '15 pages need entity optimization', impact: 'Low', fix: 'Add more entity markup' },
];

export default function TechnicalHealthPage() {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'good': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Health Score */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[var(--text-primary)] font-medium">Technical Health Score</h3>
                    <span className="text-3xl font-bold text-emerald-400">87%</span>
                </div>
                <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" style={{ width: '87%' }} />
                </div>
                <p className="text-[var(--text-secondary)] text-sm mt-2">Good health! A few improvements will boost your AI visibility.</p>
            </div>

            {/* Health Checks Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {healthChecks.map((check, i) => (
                    <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[var(--text-secondary)] text-sm">{check.name}</span>
                            {getStatusIcon(check.status)}
                        </div>
                        <p className="text-xl font-bold text-[var(--text-primary)]">{check.value}</p>
                        <p className="text-[var(--text-secondary)] text-xs mt-1">{check.detail}</p>
                    </div>
                ))}
            </div>

            {/* Issues to Fix */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="text-[var(--text-primary)] font-medium mb-4">Issues to Fix</h3>
                <div className="space-y-3">
                    {issues.map((issue, i) => (
                        <div 
                            key={i}
                            className={`p-4 rounded-lg border flex items-center justify-between ${
                                issue.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
                                issue.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                                'bg-red-500/5 border-red-500/20'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {issue.type === 'error' ? <XCircle className="w-4 h-4 text-red-400" /> :
                                 issue.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                                 <Settings className="w-4 h-4 text-red-400" />}
                                <div>
                                    <p className="text-[var(--text-primary)] text-sm">{issue.title}</p>
                                    <p className="text-[var(--text-secondary)] text-xs">Fix: {issue.fix}</p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                                issue.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                                issue.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/10 text-red-300'
                            }`}>
                                {issue.impact} Impact
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}