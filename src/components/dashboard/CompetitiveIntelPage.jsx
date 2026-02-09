import React from 'react';
import { TrendingUp, TrendingDown, Target, Shield, Zap } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from "@/components/ui/button";

const competitors = [
    { name: 'Your Brand', seoAuthority: 75, aiVisibility: 72, footprint: 85, growth: 12, isYours: true },
    { name: 'Competitor A', seoAuthority: 82, aiVisibility: 68, footprint: 90, growth: 8 },
    { name: 'Competitor B', seoAuthority: 65, aiVisibility: 78, footprint: 70, growth: 15 },
    { name: 'Competitor C', seoAuthority: 58, aiVisibility: 55, footprint: 45, growth: 5 },
    { name: 'Competitor D', seoAuthority: 70, aiVisibility: 62, footprint: 60, growth: -2 },
];

const attributeComparison = [
    { attribute: 'Innovative', yours: 85, compA: 72, compB: 68 },
    { attribute: 'Reliable', yours: 78, compA: 85, compB: 70 },
    { attribute: 'User-Friendly', yours: 72, compA: 65, compB: 80 },
    { attribute: 'Enterprise-Ready', yours: 68, compA: 90, compB: 55 },
    { attribute: 'Good Value', yours: 75, compA: 60, compB: 72 },
    { attribute: 'Secure', yours: 82, compA: 88, compB: 65 },
];

const citationWinLoss = [
    { query: 'best CRM for startups', volume: 12000, status: 'win', engine: 'ChatGPT' },
    { query: 'enterprise CRM comparison', volume: 8500, status: 'loss', engine: 'Gemini', winner: 'Competitor A' },
    { query: 'CRM pricing guide', volume: 15000, status: 'win', engine: 'Perplexity' },
    { query: 'CRM integration options', volume: 6200, status: 'loss', engine: 'ChatGPT', winner: 'Competitor B' },
    { query: 'CRM vs spreadsheets', volume: 4800, status: 'win', engine: 'Claude' },
];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 shadow-xl">
                <p className={`font-medium ${data.isYours ? 'text-blue-400' : 'text-white'}`}>{data.name}</p>
                <p className="text-gray-400 text-sm">SEO Authority: {data.seoAuthority}</p>
                <p className="text-gray-400 text-sm">AI Visibility: {data.aiVisibility}</p>
                <p className={`text-sm ${data.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Growth: {data.growth >= 0 ? '+' : ''}{data.growth}%
                </p>
            </div>
        );
    }
    return null;
};

export default function CompetitiveIntelPage() {
    return (
        <div className="space-y-6">
            {/* Positioning Map */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        Competitive Landscape
                    </h3>
                    <div className="flex gap-2 text-xs">
                        <span className="text-gray-400">Bubble size = Digital footprint</span>
                    </div>
                </div>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis 
                                type="number" 
                                dataKey="seoAuthority" 
                                name="SEO Authority"
                                domain={[0, 100]}
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                                axisLine={{ stroke: '#ffffff10' }}
                                label={{ value: 'SEO Authority →', position: 'bottom', fill: '#6B7280', fontSize: 12 }}
                            />
                            <YAxis 
                                type="number" 
                                dataKey="aiVisibility" 
                                name="AI Visibility"
                                domain={[0, 100]}
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                                axisLine={{ stroke: '#ffffff10' }}
                                label={{ value: 'AI Visibility →', angle: -90, position: 'left', fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Scatter data={competitors}>
                                {competitors.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.isYours ? '#3B82F6' : '#6B7280'}
                                        r={entry.footprint / 5}
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 mt-4">
                    {competitors.map((comp, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                            <div 
                                className={`w-3 h-3 rounded-full ${comp.isYours ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`}
                            />
                            <span className={comp.isYours ? 'text-blue-400' : 'text-gray-400'}>{comp.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attribute Comparison */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            Attribute Association
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {attributeComparison.map((attr, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-white">{attr.attribute}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-16">You</span>
                                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${attr.yours}%` }} />
                                        </div>
                                        <span className="text-xs text-blue-400 w-8">{attr.yours}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-16">Comp A</span>
                                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-gray-500 rounded-full" style={{ width: `${attr.compA}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-400 w-8">{attr.compA}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Citation Win/Loss */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-400" />
                            Citation Win/Loss
                        </h3>
                        <Button size="sm" variant="ghost" className="text-gray-400 text-xs">
                            Show losses only
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {citationWinLoss.map((item, i) => (
                            <div 
                                key={i}
                                className={`p-3 rounded-lg border ${
                                    item.status === 'win' 
                                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                                        : 'bg-red-500/10 border-red-500/30'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {item.status === 'win' ? (
                                            <span className="text-emerald-400">✓</span>
                                        ) : (
                                            <span className="text-red-400">✗</span>
                                        )}
                                        <span className="text-white text-sm">"{item.query}"</span>
                                    </div>
                                    <span className="text-gray-400 text-xs">{(item.volume / 1000).toFixed(1)}K/mo</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <span>{item.engine}</span>
                                    {item.winner && (
                                        <>
                                            <span>•</span>
                                            <span className="text-red-400">Lost to {item.winner}</span>
                                        </>
                                    )}
                                </div>
                                {item.status === 'loss' && (
                                    <Button size="sm" variant="ghost" className="text-amber-400 text-xs mt-2 h-6 p-0">
                                        Analyze & Win Back →
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}