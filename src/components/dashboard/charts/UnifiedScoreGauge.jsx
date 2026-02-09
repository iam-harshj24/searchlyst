import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function UnifiedScoreGauge({ score = 72, change = 3.2 }) {
    const data = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 100 - score },
    ];

    const getScoreColor = (s) => {
        if (s >= 70) return '#10B981';
        if (s >= 40) return '#F59E0B';
        return '#EF4444';
    };

    const breakdown = [
        { label: 'Traditional SEO', weight: '35%', score: 78, color: '#3B82F6' },
        { label: 'AI Answer Engines', weight: '45%', score: 68, color: '#10A37F' },
        { label: 'Entity Authority', weight: '20%', score: 72, color: '#8E75B2' },
    ];

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={0}
                            dataKey="value"
                        >
                            <Cell fill={getScoreColor(score)} />
                            <Cell fill="#1f1f2e" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">{score}</span>
                    <span className={`text-sm ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change}% MoM
                    </span>
                </div>
            </div>

            {/* Breakdown */}
            <div className="w-full mt-4 space-y-2">
                {breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                            <span className="text-gray-400">{item.label}</span>
                            <span className="text-gray-600 text-xs">({item.weight})</span>
                        </div>
                        <span className="text-white font-medium">{item.score}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}