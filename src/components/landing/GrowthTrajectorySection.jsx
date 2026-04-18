import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Sparkles, Zap, TrendingUp, Target, DollarSign, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import WaitlistModal from '../WaitlistModal';

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

const metrics = [
    { icon: Zap, value: '18 days', label: 'Time To First Citation', color: 'text-[var(--text-primary)]' },
    { icon: TrendingUp, value: '180%', label: '90-Day Growth', color: 'text-[var(--text-primary)]' },
    { icon: Target, value: '3x', label: 'Citation Rate', color: 'text-[var(--text-primary)]' },
    { icon: DollarSign, value: '2.1x', label: 'Traffic Quality', color: 'text-[var(--text-primary)]' },
];

const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload.milestone) return null;
    
    const isGreen = payload.score >= 90;
    const fillColor = isGreen ? "#22c55e" : "#f97316";
    const textColor = isGreen ? "#4ade80" : "#fb923c";
    
    return (
        <g className="cursor-pointer">
            {/* Label above the dot */}
            <text x={cx} y={cy - 25} textAnchor="middle" fill={textColor} fontSize="13" fontWeight="700">
                {payload.label}
            </text>
            <text x={cx} y={cy - 10} textAnchor="middle" fill="#6b7280" fontSize="11">
                {payload.milestone}
            </text>
            {/* Outer glow on hover */}
            <circle cx={cx} cy={cy} r={12} fill={fillColor} fillOpacity={0.2} className="transition-all duration-300 hover:fill-opacity-40" />
            {/* Dot */}
            <circle cx={cx} cy={cy} r={6} fill={fillColor} className="transition-transform duration-300 hover:scale-125" style={{ transformOrigin: `${cx}px ${cy}px` }} />
        </g>
    );
};

export default function GrowthTrajectorySection() {
    const [showWaitlist, setShowWaitlist] = useState(false);
    
    return (
        <>
        <section id="how-it-works" className="relative bg-[var(--bg-primary)] py-12 md:py-24 overflow-hidden">
            <div className="relative max-w-6xl mx-auto px-2 md:px-6">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
                        <Sparkles className="w-4 h-4 text-red-500" />
                        <span className="text-red-400 text-sm font-medium">How It Works</span>
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
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 md:p-6 mb-8 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 hover:scale-[1.01]"
                >
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
                    </div>
                </motion.div>

                {/* Metrics Grid */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12"
                >
                    {metrics.map((metric, index) => (
                        <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 md:p-6 text-center transition-all duration-300 hover:scale-105 hover:border-red-500/30 cursor-pointer">
                            <metric.icon className={`w-6 h-6 md:w-8 md:h-8 ${metric.color} mx-auto mb-2 md:mb-3`} />
                            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-1">{metric.value}</div>
                            <div className="text-[var(--text-secondary)] text-xs md:text-sm">{metric.label}</div>
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
                    <Button 
                        onClick={() => setShowWaitlist(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 rounded-xl font-medium group transition-transform duration-300 hover:scale-105"
                    >
                        Join Waitlist
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    
                    <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2 transition-transform duration-300 hover:scale-110 cursor-pointer">
                            <Clock className="w-4 h-4 text-red-500" />
                            Setup in 5 minutes
                        </div>
                        <div className="flex items-center gap-2 transition-transform duration-300 hover:scale-110 cursor-pointer">
                            <CheckCircle className="w-4 h-4 text-red-500" />
                            No technical skills needed
                        </div>
                        <div className="flex items-center gap-2 transition-transform duration-300 hover:scale-110 cursor-pointer">
                            <XCircle className="w-4 h-4 text-red-500" />
                            Cancel anytime
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
        <WaitlistModal open={showWaitlist} onOpenChange={setShowWaitlist} source="home" />
        </>
    );
}