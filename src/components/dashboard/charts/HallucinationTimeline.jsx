import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";

const generateData = () => {
    const data = [];
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            rate: (2 + Math.random() * 3).toFixed(1),
            events: Math.random() > 0.8 ? Math.floor(Math.random() * 5) + 1 : 0,
        });
    }
    return data;
};

const data = generateData();

const hallucinationPatterns = [
    { pattern: 'Incorrect pricing shown', occurrences: 42, severity: 'high' },
    { pattern: 'Wrong founder attribution', occurrences: 18, severity: 'medium' },
    { pattern: 'False feature claims', occurrences: 12, severity: 'high' },
    { pattern: 'Outdated product info', occurrences: 8, severity: 'low' },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 shadow-xl">
                <p className="text-white font-medium mb-1">{label}</p>
                <p className="text-red-400 text-sm">Rate: {payload[0]?.value}%</p>
                {payload[0]?.payload?.events > 0 && (
                    <p className="text-amber-400 text-xs mt-1">
                        {payload[0].payload.events} hallucination event(s)
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default function HallucinationTimeline() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Chart */}
            <div className="lg:col-span-2">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fill: '#6B7280', fontSize: 10 }}
                                axisLine={{ stroke: '#ffffff10' }}
                                interval="preserveStartEnd"
                            />
                            <YAxis 
                                domain={[0, 10]}
                                tick={{ fill: '#6B7280', fontSize: 10 }}
                                axisLine={{ stroke: '#ffffff10' }}
                                tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={5} stroke="#EF4444" strokeDasharray="5 5" label={{ value: 'Threshold', fill: '#EF4444', fontSize: 10 }} />
                            <Line 
                                type="monotone" 
                                dataKey="rate" 
                                stroke="#EF4444" 
                                strokeWidth={2}
                                dot={(props) => {
                                    if (props.payload.events > 0) {
                                        return (
                                            <circle
                                                cx={props.cx}
                                                cy={props.cy}
                                                r={6}
                                                fill="#F59E0B"
                                                stroke="#F59E0B"
                                                strokeWidth={2}
                                            />
                                        );
                                    }
                                    return null;
                                }}
                                activeDot={{ r: 6, fill: '#EF4444' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-white">3.2%</p>
                        <p className="text-xs text-gray-400">Current Rate</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-400">-1.1%</p>
                        <p className="text-xs text-gray-400">vs Last Month</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-amber-400">80</p>
                        <p className="text-xs text-gray-400">Total Events</p>
                    </div>
                </div>
            </div>

            {/* Patterns Panel */}
            <div>
                <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Top Hallucination Patterns
                </h4>
                <div className="space-y-2">
                    {hallucinationPatterns.map((item, i) => (
                        <div 
                            key={i}
                            className={`p-3 rounded-lg border text-sm ${
                                item.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                                item.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                                'bg-blue-500/10 border-blue-500/30'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-white text-xs">{item.pattern}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    item.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                    item.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-blue-500/20 text-blue-400'
                                }`}>
                                    {item.occurrences}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <Button 
                    className="w-full mt-4 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                    size="sm"
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Correction Report
                </Button>
            </div>
        </div>
    );
}