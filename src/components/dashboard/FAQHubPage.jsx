import React, { useState } from 'react';
import { HelpCircle, TrendingUp, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const questions = [
    { question: 'How much does it cost?', volume: 15200, quality: 2, status: 'needs-work', priority: 'high' },
    { question: 'What integrations are available?', volume: 8500, quality: 4, status: 'needs-work', priority: 'high' },
    { question: 'How to get started?', volume: 12500, quality: 9, status: 'strong', priority: 'monitor' },
    { question: 'Is it secure?', volume: 6200, quality: 7, status: 'good', priority: 'medium' },
    { question: 'What makes it different?', volume: 9800, quality: 3, status: 'needs-work', priority: 'high' },
    { question: 'Can I import my data?', volume: 4100, quality: 8, status: 'strong', priority: 'monitor' },
];

const topPerforming = [
    { question: 'What is Product X?', citations: 4500, trend: '+12%' },
    { question: 'How to get started?', citations: 3200, trend: '+8%' },
    { question: 'API documentation', citations: 2100, trend: '+15%' },
];

export default function FAQHubPage() {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filteredQuestions = questions.filter(q => {
        if (filter === 'needs-work') return q.status === 'needs-work';
        if (filter === 'strong') return q.status === 'strong' || q.status === 'good';
        return true;
    }).filter(q => q.question.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-[var(--text-secondary)] text-sm mb-1">Questions Tracked</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">156</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-400 text-sm mb-1">Well Answered</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">98 (63%)</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm mb-1">Needs Improvement</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">58 (37%)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Questions List */}
                <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                            <Input 
                                placeholder="Search questions..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] pl-9 h-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'needs-work', 'strong'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 text-xs rounded-lg capitalize ${
                                        filter === f 
                                            ? 'bg-red-600 text-white' 
                                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                                    }`}
                                >
                                    {f === 'needs-work' ? 'Needs Work' : f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {filteredQuestions.map((q, i) => (
                            <div 
                                key={i}
                                className={`p-4 rounded-lg border flex items-center justify-between ${
                                    q.status === 'needs-work' ? 'bg-red-500/5 border-red-500/20' :
                                    q.status === 'strong' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                    'bg-[var(--bg-primary)] border-[var(--border)]'
                                }`}
                            >
                                <div className="flex-1">
                                    <p className="text-[var(--text-primary)]">{q.question}</p>
                                    <div className="flex gap-4 mt-1 text-xs text-[var(--text-secondary)]">
                                        <span>{q.volume.toLocaleString()}/mo</span>
                                        <span>AI Quality: <span className={q.quality <= 4 ? 'text-red-400' : q.quality <= 7 ? 'text-amber-400' : 'text-emerald-400'}>{q.quality}/10</span></span>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    className={`h-8 text-xs ${
                                        q.status === 'needs-work' 
                                            ? 'bg-red-500 hover:bg-red-600' 
                                            : 'bg-[var(--border)] hover:bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]'
                                    }`}
                                >
                                    {q.status === 'needs-work' ? 'Fix Now' : 'View'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performing */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="text-[var(--text-primary)] font-medium mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Top Performing
                    </h3>
                    <div className="space-y-3">
                        {topPerforming.map((item, i) => (
                            <div key={i} className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]">
                                <p className="text-[var(--text-primary)] text-sm">{item.question}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[var(--text-secondary)] text-xs">{item.citations.toLocaleString()} citations</span>
                                    <span className="text-emerald-400 text-xs">{item.trend}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm font-medium mb-1">💡 Tip</p>
                        <p className="text-[var(--text-secondary)] text-xs">
                            Add FAQ schema to your pages to increase citation rate by up to 25%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}