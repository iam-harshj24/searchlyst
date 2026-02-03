import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Sparkles, Zap, TrendingUp, Target, DollarSign, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const trajectoryData = [
    { week: 'Week 1', score: 8, label: '8%', milestone: 'Discovery & Baseline' },
    { week: 'Week 2', score: 15 },
    { week: 'Week 3', score: 25 },
    { week: 'Week 4', score: 33, label: '33%', milestone: 'Technical Foundation' },
    { week: 'Week 5', score: 45 },
    { week: 'Week 6', score: 63, label: '63%', milestone: 'Content Optimization' },
    { week: 'Week 7', score: 80 },
    { week: 'Week 8', score: 93, label: '93%', milestone: 'Citation Strategy' },
    { week: 'Week 9', score: 130 },
    { week: 'Week 10', score: 160 },
    { week: 'Week 11', score: 180, label: '180%', milestone: 'AI Domination' },
];

const metrics = [
    { icon: Zap, value: '18 days', label: 'Time To First Citation', color: 'text-yellow-500' },
    { icon: TrendingUp, value: '180%', label: '90-Day Growth', color: 'text-red-500' },
    { icon: Target, value: '3x', label: 'Citation Rate', color: 'text-orange-500' },
    { icon: DollarSign, value: '2.1x', label: 'Traffic Quality', color: 'text-green-500' },
];

const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload.milestone) return null;
    
    return (
        <g>
            <circle cx={cx} cy={cy} r={8} fill="#22c55e" />
            <circle cx={cx} cy={cy} r={4} fill="#16a34a" />
        </g>
    );
};

export default function GrowthTrajectorySection() {
    return (
        <section className="relative bg-[var(--bg-primary)] py-24 overflow-hidden">
            <div className="relative max-w-6xl mx-auto px-6">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
                        <Sparkles className="w-4 h-4 text-red-500" />
                        <span className="text-red-400 text-sm font-medium">Industry Insight</span>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-6"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
                        Growth Trajectory
                    </h2>
                    <p className="text-[var(--text-secondary)]">
                        From baseline discovery to total domination. <span className="text-red-500">Every step is AI-Enhanced.</span>
                    </p>
                </motion.div>

                {/* Chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-8"
                >
                    {/* Chart header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[var(--text-primary)] font-semibold">Visibility score</h3>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <CheckCircle className="w-4 h-4 text-red-500" />
                            Avg time to first citation: 18 days
                        </div>
                    </div>

                    <div className="h-80 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trajectoryData} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
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
                                    stroke="url(#gradient)" 
                                    strokeWidth={3}
                                    dot={<CustomDot />}
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="50%" stopColor="#f97316" />
                                        <stop offset="100%" stopColor="#22c55e" />
                                    </linearGradient>
                                </defs>
                            </LineChart>
                        </ResponsiveContainer>
                        
                        {/* Milestone labels - positioned manually */}
                        <div className="absolute top-8 left-[10%] text-xs text-orange-400">
                            <div className="font-medium">8%</div>
                            <div className="text-gray-500">Discovery & Baseline</div>
                        </div>
                        <div className="absolute top-[35%] left-[30%] text-xs text-orange-400">
                            <div className="font-medium">33%</div>
                            <div className="text-gray-500">Technical Foundation</div>
                        </div>
                        <div className="absolute top-[25%] left-[50%] text-xs text-orange-400">
                            <div className="font-medium">63%</div>
                            <div className="text-gray-500">Content Optimization</div>
                        </div>
                        <div className="absolute top-[15%] left-[70%] text-xs text-green-400">
                            <div className="font-medium">93%</div>
                            <div className="text-gray-500">Citation Strategy</div>
                        </div>
                        <div className="absolute top-2 right-[5%] text-xs text-green-400">
                            <div className="font-medium">180%</div>
                            <div className="text-gray-500">AI Domination</div>
                        </div>
                    </div>
                </motion.div>

                {/* Metrics Grid */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                >
                    {metrics.map((metric, index) => (
                        <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 text-center">
                            <metric.icon className={`w-8 h-8 ${metric.color} mx-auto mb-3`} />
                            <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">{metric.value}</div>
                            <div className="text-[var(--text-secondary)] text-sm">{metric.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <Button className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 rounded-xl font-medium group">
                        Get Your Free AI Visibility Score
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    
                    <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-500" />
                            Setup in 5 minutes
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[var(--text-primary)]" />
                            No technical skills needed
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            Cancel anytime
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}