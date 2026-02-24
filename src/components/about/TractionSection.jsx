import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle } from 'lucide-react';

const trajectoryData = [
    { week: 'Week 1', score: 0 },
    { week: 'Week 2', score: 8, label: '8%', milestone: 'Discovery & Baseline' },
    { week: 'Week 3', score: 20 },
    { week: 'Week 4', score: 33, label: '33%', milestone: 'Technical Foundation' },
    { week: 'Week 5', score: 50 },
    { week: 'Week 6', score: 63, label: '63%', milestone: 'Content Optimization' },
    { week: 'Week 7', score: 90 },
    { week: 'Week 8', score: 120, label: '93%', milestone: 'Citation Strategy' },
    { week: 'Week 9', score: 140 },
    { week: 'Week 10', score: 165 },
    { week: 'Week 11', score: 180, label: '180%', milestone: 'AI Domination' },
];

// Simplified CustomDot for Safari - removed CSS transitions on SVG which cause WebKit performance issues
const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload.milestone) return null;
    
    const isGreen = payload.score >= 90;
    const fillColor = isGreen ? "#22c55e" : "#f97316";
    const textColor = isGreen ? "#4ade80" : "#fb923c";
    
    return (
        <g>
            {/* Label above the dot */}
            <text x={cx} y={cy - 25} textAnchor="middle" fill={textColor} fontSize="13" fontWeight="700">
                {payload.label}
            </text>
            <text x={cx} y={cy - 10} textAnchor="middle" fill="#6b7280" fontSize="11">
                {payload.milestone}
            </text>
            {/* Outer glow */}
            <circle cx={cx} cy={cy} r={12} fill={fillColor} fillOpacity={0.2} />
            {/* Dot */}
            <circle cx={cx} cy={cy} r={6} fill={fillColor} />
        </g>
    );
};

export default function TractionSection() {
    return (
        <section className="relative bg-[var(--bg-primary)] py-12 md:py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            
            <div className="relative max-w-6xl mx-auto px-2 md:px-6">
                {/* Badge */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-400 text-sm font-medium">Traction & Performance</span>
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center mb-4">
                    <h2 className="text-4xl md:text-5xl font-bold">
                        <span className="text-[var(--text-primary)]">The "Hockey Stick" is </span>
                        <span className="text-red-500">Real.</span>
                    </h2>
                </div>

                <p className="text-[var(--text-secondary)] text-center mb-12">
                    We consistently deliver exponential visibility growth within one quarter.
                </p>

                {/* Chart */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 md:p-6">
                    {/* Chart header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[var(--text-primary)] font-semibold">Visibility score</h3>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <CheckCircle className="w-4 h-4 text-red-500" />
                            Avg time to first citation: 18 days
                        </div>
                    </div>

                    <div className="h-64 md:h-80 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trajectoryData} margin={{ top: 70, right: 40, left: -20, bottom: 20 }}>
                                <XAxis 
                                    dataKey="week" 
                                    stroke="#525252" 
                                    tick={{ fill: '#737373', fontSize: 12 }}
                                    axisLine={{ stroke: '#404040' }}
                                />
                                <YAxis 
                                    stroke="#525252" 
                                    tick={{ fill: '#737373', fontSize: 12 }}
                                    axisLine={{ stroke: '#404040' }}
                                    domain={[0, 200]}
                                    ticks={[0, 50, 100, 150, 200]}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="url(#tractionGradient)" 
                                    strokeWidth={3}
                                    dot={<CustomDot />}
                                />
                                <defs>
                                    <linearGradient id="tractionGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="50%" stopColor="#f97316" />
                                        <stop offset="100%" stopColor="#22c55e" />
                                    </linearGradient>
                                </defs>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <p className="text-center text-[var(--text-secondary)] text-sm mt-6">
                        Average <span className="text-green-400 font-semibold">180% visibility increase</span> in 90 days
                    </p>
                </div>
            </div>
        </section>
    );
}