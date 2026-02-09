import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

const data = [
    { metric: 'Citation Volume', yourBrand: 78, competitor: 65, fullMark: 100 },
    { metric: 'Sentiment Score', yourBrand: 72, competitor: 80, fullMark: 100 },
    { metric: 'Citation Accuracy', yourBrand: 85, competitor: 70, fullMark: 100 },
    { metric: 'Citation Depth', yourBrand: 68, competitor: 75, fullMark: 100 },
    { metric: 'Authority Score', yourBrand: 74, competitor: 82, fullMark: 100 },
];

const competitors = ['Competitor A', 'Competitor B', 'Competitor C'];

export default function CompetitiveRadar() {
    const [selectedCompetitor, setSelectedCompetitor] = useState(0);

    return (
        <div>
            {/* Competitor Selector */}
            <div className="flex gap-2 mb-4">
                {competitors.map((comp, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedCompetitor(i)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            selectedCompetitor === i 
                                ? 'bg-gray-500 text-white' 
                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                    >
                        {comp}
                    </button>
                ))}
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis 
                            dataKey="metric" 
                            tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        />
                        <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, 100]} 
                            tick={{ fill: '#6B7280', fontSize: 9 }}
                            axisLine={false}
                        />
                        <Radar
                            name="Your Brand"
                            dataKey="yourBrand"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.3}
                            strokeWidth={2}
                        />
                        <Radar
                            name={competitors[selectedCompetitor]}
                            dataKey="competitor"
                            stroke="#6B7280"
                            fill="#6B7280"
                            fillOpacity={0.2}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Gap Analysis */}
            <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 mb-2">Gap Analysis vs {competitors[selectedCompetitor]}</p>
                {data.map((item, i) => {
                    const gap = item.yourBrand - item.competitor;
                    return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 w-28 truncate">{item.metric}</span>
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${gap >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.abs(gap)}%`, marginLeft: gap < 0 ? `${100 - Math.abs(gap)}%` : 0 }}
                                />
                            </div>
                            <span className={`w-12 text-right ${gap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {gap >= 0 ? '+' : ''}{gap}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 text-xs">
                <span className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-blue-500"></span>
                    <span className="text-gray-400">Your Brand</span>
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-gray-500 border-dashed border-t-2 border-gray-500"></span>
                    <span className="text-gray-400">{competitors[selectedCompetitor]}</span>
                </span>
            </div>
        </div>
    );
}