import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Zap, DollarSign, Target, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ChatGPTLogo, GeminiLogo, PerplexityLogo, ClaudeLogo } from './AILogos';

const chartData = [
    { name: '2023', chatgpt: 100, gemini: 20, perplexity: 10, claude: 5 },
    { name: 'Q2 2023', chatgpt: 120, gemini: 30, perplexity: 15, claude: 8 },
    { name: 'Q3 2023', chatgpt: 150, gemini: 50, perplexity: 25, claude: 12 },
    { name: 'Q4 2023', chatgpt: 200, gemini: 80, perplexity: 40, claude: 20 },
    { name: '2024', chatgpt: 300, gemini: 150, perplexity: 80, claude: 40 },
    { name: 'Q2 2024', chatgpt: 450, gemini: 250, perplexity: 150, claude: 80 },
    { name: 'Q3 2024', chatgpt: 600, gemini: 400, perplexity: 250, claude: 150 },
    { name: 'Q4 2024', chatgpt: 750, gemini: 550, perplexity: 400, claude: 250 },
    { name: '2025', chatgpt: 900, gemini: 700, perplexity: 600, claude: 400 },
    { name: '2026', chatgpt: 1100, gemini: 900, perplexity: 800, claude: 600 },
];

const stats = [
    { icon: Zap, value: '40%', label: 'month-over-month growth', color: 'text-[var(--text-primary)]' },
    { icon: DollarSign, value: '2.1x', label: 'better conversion from AI traffic', color: 'text-[var(--text-primary)]' },
    { icon: Target, value: '3x', label: 'higher intent than traditional search', color: 'text-[var(--text-primary)]' },
    { icon: Users, value: '65%', label: 'of professionals use AI search weekly', color: 'text-[var(--text-primary)]' },
];

export default function MarketGrowthSection() {
    return (
        <section className="relative bg-[var(--bg-primary)] py-24 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-[100px]" />
            
            <div className="relative max-w-6xl mx-auto px-6">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
                        <TrendingUp className="w-4 h-4 text-red-500" />
                        <span className="text-red-400 text-sm font-medium">Market Growth</span>
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
                        The AI search revolution is here
                    </h2>
                    <p className="text-3xl md:text-4xl font-bold text-red-500">
                        Is your brand ready?
                    </p>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-secondary)] text-center max-w-2xl mx-auto mb-12"
                >
                    Over 1.5 billion people now search with AI platforms. Don't let your competitors<br />
                    capture this traffic while you're invisible.
                </motion.p>

                {/* Chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-8"
                >
                    {/* Legend */}
                    <div className="flex flex-wrap gap-6 mb-6">
                        <div className="flex items-center gap-2">
                            <ChatGPTLogo className="w-4 h-4" />
                            <span className="text-[var(--text-secondary)] text-sm">ChatGPT</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <GeminiLogo className="w-4 h-4" />
                            <span className="text-[var(--text-secondary)] text-sm">Gemini</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <PerplexityLogo className="w-4 h-4" />
                            <span className="text-[var(--text-secondary)] text-sm">Perplexity</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ClaudeLogo className="w-4 h-4" />
                            <span className="text-[var(--text-secondary)] text-sm">Claude</span>
                        </div>
                    </div>

                    {/* Recharts Line Chart with Hover Tooltip */}
                    <div className="h-80 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 50, left: 10, bottom: 10 }}>
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#525252" 
                                    tick={{ fill: '#737373', fontSize: 12 }}
                                    axisLine={{ stroke: '#404040' }}
                                />
                                <YAxis 
                                    stroke="#525252" 
                                    tick={{ fill: '#737373', fontSize: 12 }}
                                    axisLine={{ stroke: '#404040' }}
                                    tickFormatter={(value) => `${value}M`}
                                    domain={[0, 1200]}
                                    ticks={[0, 300, 600, 900, 1200]}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#18181b', 
                                        border: '1px solid #27272a',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                    formatter={(value, name) => [`${value}M users`, name.charAt(0).toUpperCase() + name.slice(1)]}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="chatgpt" 
                                    stroke="#ffffff" 
                                    strokeWidth={2} 
                                    dot={false} 
                                    name="ChatGPT"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="gemini" 
                                    stroke="#ffffff" 
                                    strokeWidth={2} 
                                    dot={false} 
                                    name="Gemini"
                                    strokeDasharray="8 4"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="perplexity" 
                                    stroke="#ffffff" 
                                    strokeWidth={2} 
                                    dot={false} 
                                    name="Perplexity"
                                    strokeDasharray="4 4"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="claude" 
                                    stroke="#ffffff" 
                                    strokeWidth={2} 
                                    dot={false} 
                                    name="Claude"
                                    strokeDasharray="2 2"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        
                        {/* Brand logos positioned at end points of each line */}
                        {/* ChatGPT: 1100M = ~8% from top */}
                        <div className="absolute" style={{ right: '12px', top: 'calc(8% + 10px)' }}>
                            <div className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] border border-white/30 flex items-center justify-center">
                                <ChatGPTLogo className="w-4 h-4" />
                            </div>
                        </div>
                        {/* Gemini: 900M = ~25% from top */}
                        <div className="absolute" style={{ right: '12px', top: 'calc(25% + 10px)' }}>
                            <div className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] border border-white/30 flex items-center justify-center">
                                <GeminiLogo className="w-4 h-4" />
                            </div>
                        </div>
                        {/* Perplexity: 800M = ~33% from top */}
                        <div className="absolute" style={{ right: '12px', top: 'calc(33% + 10px)' }}>
                            <div className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] border border-white/30 flex items-center justify-center">
                                <PerplexityLogo className="w-4 h-4" />
                            </div>
                        </div>
                        {/* Claude: 600M = ~50% from top */}
                        <div className="absolute" style={{ right: '12px', top: 'calc(50% + 10px)' }}>
                            <div className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] border border-white/30 flex items-center justify-center">
                                <ClaudeLogo className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Total indicator */}
                    <div className="flex justify-center mt-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                            <Users className="w-4 h-4 text-[var(--text-secondary)]" />
                            <span className="text-[var(--text-primary)] text-sm">Total: 1.5B+ people now search with AI</span>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                >
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 text-center">
                            <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                            <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-1">{stat.value}</div>
                            <div className="text-[var(--text-secondary)] text-sm">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* CTA Button */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center"
                >
                    <Button className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 rounded-xl font-medium">
                        Don't Get Left Behind - Start Tracking Now
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}