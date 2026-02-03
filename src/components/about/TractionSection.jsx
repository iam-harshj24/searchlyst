import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceDot } from 'recharts';
import { TrendingUp } from 'lucide-react';

const trajectoryData = [
    { week: 'Week 1', score: 8 },
    { week: 'Week 2', score: 15 },
    { week: 'Week 3', score: 25 },
    { week: 'Week 4', score: 33 },
    { week: 'Week 5', score: 45 },
    { week: 'Week 6', score: 63 },
    { week: 'Week 7', score: 80 },
    { week: 'Week 8', score: 93 },
    { week: 'Week 9', score: 130 },
    { week: 'Week 10', score: 160 },
    { week: 'Week 11', score: 180 },
];

const milestones = [
    { week: 1, score: 8, label: '8%', sublabel: 'Discovery & Baseline' },
    { week: 4, score: 33, label: '33%', sublabel: 'Technical Foundation' },
    { week: 6, score: 63, label: '63%', sublabel: 'Content Optimization' },
    { week: 8, score: 93, label: '93%', sublabel: 'Citation Strategy' },
    { week: 11, score: 180, label: '180%', sublabel: 'AI Domination' },
];

export default function TractionSection() {
    return (
        <section className="relative bg-[var(--bg-primary)] py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            
            <div className="relative max-w-6xl mx-auto px-6">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-400 text-sm font-medium">Traction & Performance</span>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-4"
                >
                    <h2 className="text-4xl md:text-5xl font-bold">
                        <span className="text-[var(--text-primary)]">The "Hockey Stick" is </span>
                        <span className="text-red-500">Real.</span>
                    </h2>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-secondary)] text-center mb-12"
                >
                    We consistently deliver exponential visibility growth within one quarter.
                </motion.p>

                {/* Chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8 transition-all duration-300 hover:scale-[1.01]"
                >
                    <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-1">AI Visibility Growth Trajectory</h3>
                    <p className="text-[var(--text-secondary)] text-sm mb-8">Your journey to AI search dominance</p>

                    <div className="h-80 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trajectoryData} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
                                <XAxis 
                                    dataKey="week" 
                                    stroke="#525252" 
                                    tick={{ fill: '#737373', fontSize: 11 }}
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
                                    dot={false}
                                />
                                {milestones.map((m, idx) => (
                                    <ReferenceDot 
                                        key={idx}
                                        x={trajectoryData[m.week - 1]?.week} 
                                        y={m.score} 
                                        r={6} 
                                        fill="#22c55e" 
                                        stroke="#16a34a"
                                    />
                                ))}
                                <defs>
                                    <linearGradient id="tractionGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="50%" stopColor="#f97316" />
                                        <stop offset="100%" stopColor="#22c55e" />
                                    </linearGradient>
                                </defs>
                            </LineChart>
                        </ResponsiveContainer>
                        
                        {/* Milestone labels */}
                        <div className="absolute top-8 left-[8%] text-xs">
                            <div className="text-orange-400 font-medium">8%</div>
                            <div className="text-gray-500">Discovery & Baseline</div>
                        </div>
                        <div className="absolute top-[40%] left-[28%] text-xs">
                            <div className="text-orange-400 font-medium">33%</div>
                            <div className="text-gray-500">Technical Foundation</div>
                        </div>
                        <div className="absolute top-[30%] left-[48%] text-xs">
                            <div className="text-orange-400 font-medium">63%</div>
                            <div className="text-gray-500">Content Optimization</div>
                        </div>
                        <div className="absolute top-[20%] left-[65%] text-xs">
                            <div className="text-green-400 font-medium">93%</div>
                            <div className="text-gray-500">Citation Strategy</div>
                        </div>
                        <div className="absolute top-2 right-[8%] text-xs">
                            <div className="text-green-400 font-medium">180%</div>
                            <div className="text-gray-500">AI Domination</div>
                        </div>
                    </div>

                    <p className="text-center text-[var(--text-secondary)] text-sm mt-6">
                        Average <span className="text-green-400 font-semibold">180% visibility increase</span> in 90 days
                    </p>
                </motion.div>
            </div>
        </section>
    );
}