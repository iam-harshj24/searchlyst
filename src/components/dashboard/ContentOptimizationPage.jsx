import React, { useState } from 'react';
import { Target, FileText, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const opportunityMatrix = {
    threat: [
        { topic: 'CRM integration options', aiQuality: 85, ourAuthority: 20, volume: 8500 },
        { topic: 'API documentation', aiQuality: 78, ourAuthority: 35, volume: 5200 },
    ],
    defend: [
        { topic: 'Product X pricing', aiQuality: 90, ourAuthority: 85, volume: 15000 },
        { topic: 'Getting started guide', aiQuality: 88, ourAuthority: 92, volume: 12000 },
    ],
    attack: [
        { topic: 'Enterprise deployment', aiQuality: 45, ourAuthority: 78, volume: 3200 },
        { topic: 'Security compliance', aiQuality: 38, ourAuthority: 82, volume: 4100 },
    ],
    ignore: [
        { topic: 'Legacy migration', aiQuality: 30, ourAuthority: 25, volume: 800 },
    ],
};

const contentSuggestions = [
    { title: 'Add FAQ section to pricing page', impact: 'High', effort: 'Low', type: 'Schema' },
    { title: 'Create comparison guide vs Competitor A', impact: 'High', effort: 'Medium', type: 'Content' },
    { title: 'Update API docs with examples', impact: 'Medium', effort: 'Medium', type: 'Technical' },
    { title: 'Add customer testimonials', impact: 'Medium', effort: 'Low', type: 'Social Proof' },
];

export default function ContentOptimizationPage() {
    const [selectedQuadrant, setSelectedQuadrant] = useState('threat');

    const quadrants = [
        { id: 'threat', label: 'Threat Zone', color: 'red', icon: '⚠️' },
        { id: 'defend', label: 'Defend Zone', color: 'green', icon: '🛡️' },
        { id: 'attack', label: 'Attack Zone', color: 'blue', icon: '🎯' },
        { id: 'ignore', label: 'Low Priority', color: 'gray', icon: '📋' },
    ];

    return (
        <div className="space-y-6">
            {/* Opportunity Matrix */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        Content Opportunity Matrix
                    </h3>
                </div>

                {/* Matrix Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {quadrants.map((q) => (
                        <button
                            key={q.id}
                            onClick={() => setSelectedQuadrant(q.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                selectedQuadrant === q.id 
                                    ? `border-${q.color}-500 bg-${q.color}-500/10` 
                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                            style={{
                                borderColor: selectedQuadrant === q.id ? 
                                    (q.color === 'red' ? '#EF4444' : q.color === 'green' ? '#10B981' : q.color === 'blue' ? '#3B82F6' : '#6B7280') : undefined,
                                backgroundColor: selectedQuadrant === q.id ?
                                    (q.color === 'red' ? 'rgba(239,68,68,0.1)' : q.color === 'green' ? 'rgba(16,185,129,0.1)' : q.color === 'blue' ? 'rgba(59,130,246,0.1)' : 'rgba(107,114,128,0.1)') : undefined
                            }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span>{q.icon}</span>
                                <span className="text-white font-medium">{q.label}</span>
                                <span className="text-gray-400 text-sm ml-auto">
                                    {opportunityMatrix[q.id]?.length || 0} topics
                                </span>
                            </div>
                            <p className="text-gray-400 text-xs">
                                {q.id === 'threat' && 'High AI quality, low authority - need action'}
                                {q.id === 'defend' && 'Strong position - monitor competitors'}
                                {q.id === 'attack' && 'Opportunity to become definitive source'}
                                {q.id === 'ignore' && 'Low priority - minimal impact'}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Selected Topics */}
                <div className="space-y-2">
                    <p className="text-sm text-gray-400 mb-3">
                        Topics in {quadrants.find(q => q.id === selectedQuadrant)?.label}:
                    </p>
                    {opportunityMatrix[selectedQuadrant]?.map((topic, i) => (
                        <div 
                            key={i}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <div>
                                <span className="text-white">{topic.topic}</span>
                                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                    <span>AI Quality: {topic.aiQuality}%</span>
                                    <span>Our Authority: {topic.ourAuthority}%</span>
                                    <span>Volume: {topic.volume.toLocaleString()}/mo</span>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-blue-400">
                                Create Brief <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Content Suggestions */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-amber-400" />
                            AI-Recommended Actions
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {contentSuggestions.map((suggestion, i) => (
                            <div 
                                key={i}
                                className="p-3 bg-white/5 rounded-lg border border-white/10"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-white text-sm">{suggestion.title}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                                suggestion.impact === 'High' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                                {suggestion.impact} Impact
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                                suggestion.effort === 'Low' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                                {suggestion.effort} Effort
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400">
                                                {suggestion.type}
                                            </span>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-blue-400 text-xs">
                                        Start
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Style Analysis */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-400" />
                            Content Style Analysis
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            { dimension: 'Formality', yours: 72, target: 65, label: 'Casual ↔ Formal' },
                            { dimension: 'Brevity', yours: 45, target: 70, label: 'Detailed ↔ Concise' },
                            { dimension: 'Data Density', yours: 38, target: 75, label: 'Anecdotal ↔ Data-Rich' },
                            { dimension: 'Perspective', yours: 60, target: 80, label: 'Subjective ↔ Objective' },
                            { dimension: 'Structure', yours: 55, target: 85, label: 'Narrative ↔ Modular' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-white">{item.dimension}</span>
                                    <span className="text-gray-500 text-xs">{item.label}</span>
                                </div>
                                <div className="relative h-2 bg-white/10 rounded-full">
                                    <div 
                                        className="absolute h-full bg-blue-500 rounded-full"
                                        style={{ width: `${item.yours}%` }}
                                    />
                                    <div 
                                        className="absolute h-4 w-1 bg-emerald-400 rounded -top-1"
                                        style={{ left: `${item.target}%` }}
                                        title={`Target: ${item.target}%`}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Yours: {item.yours}%</span>
                                    <span className="text-emerald-400">Target: {item.target}%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-amber-400 text-sm mt-4 p-3 bg-amber-500/10 rounded-lg">
                        💡 Increase data density by 40% to match top-cited content style
                    </p>
                </div>
            </div>
        </div>
    );
}