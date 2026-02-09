import React, { useState } from 'react';
import { HelpCircle, Search, Zap, FileText, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const questionGapMatrix = {
    highPriority: [
        { question: 'How much does Product X cost?', volume: 15200, quality: 2, source: 'Outdated blog post from 2020' },
        { question: 'What integrations are available?', volume: 8500, quality: 3, source: 'Third-party review site' },
        { question: 'How to migrate from Competitor A?', volume: 6200, quality: 1, source: 'No authoritative source' },
    ],
    defend: [
        { question: 'What is Product X?', volume: 22000, quality: 9, source: 'Your homepage' },
        { question: 'Getting started tutorial', volume: 12500, quality: 8, source: 'Your docs' },
    ],
    opportunity: [
        { question: 'Product X vs Competitor B', volume: 4200, quality: 4, source: 'Review aggregator' },
        { question: 'Enterprise security features', volume: 3800, quality: 5, source: 'Partial coverage' },
    ],
};

const intentTypes = [
    { intent: 'Get Facts', format: 'Definition + Data Table + Sources', match: 75, color: 'blue' },
    { intent: 'Compare Options', format: 'Feature Matrix + Pros/Cons', match: 60, color: 'purple' },
    { intent: 'Troubleshoot', format: 'Step-by-Step Guide + Warnings', match: 40, color: 'amber' },
    { intent: 'Make Decision', format: 'Recommendations + Social Proof', match: 55, color: 'emerald' },
];

export default function FAQHubPage() {
    const [selectedPriority, setSelectedPriority] = useState('highPriority');
    const [searchQuery, setSearchQuery] = useState('');

    const priorities = [
        { id: 'highPriority', label: 'High Priority', color: 'red', count: questionGapMatrix.highPriority.length },
        { id: 'defend', label: 'Defend', color: 'green', count: questionGapMatrix.defend.length },
        { id: 'opportunity', label: 'Opportunity', color: 'blue', count: questionGapMatrix.opportunity.length },
    ];

    return (
        <div className="space-y-6">
            {/* Search and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input 
                        placeholder="Search questions..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border-white/10 text-white pl-10 h-12"
                    />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Questions Tracked</p>
                    <p className="text-2xl font-bold text-white">1,247</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Citation Rate</p>
                    <p className="text-2xl font-bold text-emerald-400">68%</p>
                </div>
            </div>

            {/* Question Gap Matrix */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-amber-400" />
                        Question Gap Matrix
                    </h3>
                </div>

                {/* Priority Tabs */}
                <div className="flex gap-2 mb-6">
                    {priorities.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPriority(p.id)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                                selectedPriority === p.id
                                    ? p.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                      p.color === 'green' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                                      'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                        >
                            {p.label}
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-xs">{p.count}</span>
                        </button>
                    ))}
                </div>

                {/* Questions List */}
                <div className="space-y-3">
                    {questionGapMatrix[selectedPriority]?.map((q, i) => (
                        <div 
                            key={i}
                            className={`p-4 rounded-lg border ${
                                selectedPriority === 'highPriority' ? 'bg-red-500/10 border-red-500/30' :
                                selectedPriority === 'defend' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                'bg-blue-500/10 border-blue-500/30'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-white font-medium">{q.question}</p>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                        <span className="text-gray-400">
                                            Volume: <span className="text-white">{q.volume.toLocaleString()}/mo</span>
                                        </span>
                                        <span className="text-gray-400">
                                            AI Answer Quality: 
                                            <span className={`ml-1 ${q.quality <= 3 ? 'text-red-400' : q.quality <= 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {q.quality}/10
                                            </span>
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-xs mt-1">
                                        Current source: {q.source}
                                    </p>
                                </div>
                                <Button 
                                    size="sm" 
                                    className={`${
                                        selectedPriority === 'highPriority' ? 'bg-red-500 hover:bg-red-600' :
                                        selectedPriority === 'defend' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                        'bg-blue-500 hover:bg-blue-600'
                                    } text-white`}
                                >
                                    {selectedPriority === 'highPriority' ? 'Create Answer' : 
                                     selectedPriority === 'defend' ? 'Monitor' : 'Optimize'}
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Intent Coverage */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-purple-400" />
                            Intent Coverage Analysis
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {intentTypes.map((intent, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-white text-sm">{intent.intent}</span>
                                        <p className="text-gray-500 text-xs">{intent.format}</p>
                                    </div>
                                    <span className={`text-sm ${
                                        intent.match >= 70 ? 'text-emerald-400' :
                                        intent.match >= 50 ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                        {intent.match}% match
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${
                                            intent.color === 'blue' ? 'bg-blue-500' :
                                            intent.color === 'purple' ? 'bg-purple-500' :
                                            intent.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${intent.match}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-amber-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Troubleshooting content needs improvement
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            Add step-by-step guides with warning notes to increase citation rate
                        </p>
                    </div>
                </div>

                {/* FAQ Performance */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-cyan-400" />
                            Top Performing FAQs
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {[
                            { question: 'What is Product X?', citations: 4500, engines: ['ChatGPT', 'Gemini'] },
                            { question: 'How to get started?', citations: 3200, engines: ['ChatGPT', 'Perplexity'] },
                            { question: 'Pricing plans explained', citations: 2800, engines: ['Gemini', 'Claude'] },
                            { question: 'API rate limits', citations: 1900, engines: ['ChatGPT'] },
                            { question: 'Security certifications', citations: 1500, engines: ['Perplexity'] },
                        ].map((faq, i) => (
                            <div 
                                key={i}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm">{faq.question}</p>
                                        <div className="flex gap-1 mt-1">
                                            {faq.engines.map((e, j) => (
                                                <span key={j} className="text-xs px-1.5 py-0.5 bg-white/10 rounded text-gray-400">
                                                    {e}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-400 font-medium">{faq.citations.toLocaleString()}</p>
                                    <p className="text-gray-500 text-xs">citations/mo</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button className="w-full mt-4 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate FAQ Audit Report
                    </Button>
                </div>
            </div>
        </div>
    );
}