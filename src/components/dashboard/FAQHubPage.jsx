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
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Questions Tracked</p>
                    <p className="text-2xl font-bold text-white">156</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-400 text-sm mb-1">Well Answered</p>
                    <p className="text-2xl font-bold text-white">98 (63%)</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm mb-1">Needs Improvement</p>
                    <p className="text-2xl font-bold text-white">58 (37%)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Questions List */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input 
                                placeholder="Search questions..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white/5 border-white/10 text-white pl-9 h-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'needs-work', 'strong'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 text-xs rounded-lg capitalize ${
                                        filter === f 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
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
                                    'bg-white/5 border-white/10'
                                }`}
                            >
                                <div className="flex-1">
                                    <p className="text-white">{q.question}</p>
                                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                        <span>{q.volume.toLocaleString()}/mo</span>
                                        <span>AI Quality: <span className={q.quality <= 4 ? 'text-red-400' : q.quality <= 7 ? 'text-amber-400' : 'text-emerald-400'}>{q.quality}/10</span></span>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    className={`h-8 text-xs ${
                                        q.status === 'needs-work' 
                                            ? 'bg-red-500 hover:bg-red-600' 
                                            : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                    }`}
                                >
                                    {q.status === 'needs-work' ? 'Fix Now' : 'View'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performing */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Top Performing
                    </h3>
                    <div className="space-y-3">
                        {topPerforming.map((item, i) => (
                            <div key={i} className="p-3 bg-white/5 rounded-lg">
                                <p className="text-white text-sm">{item.question}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-gray-400 text-xs">{item.citations.toLocaleString()} citations</span>
                                    <span className="text-emerald-400 text-xs">{item.trend}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-blue-400 text-sm font-medium mb-1">💡 Tip</p>
                        <p className="text-gray-400 text-xs">
                            Add FAQ schema to your pages to increase citation rate by up to 25%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}