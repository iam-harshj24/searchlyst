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

                    {/* Custom SVG Chart - Brand Race Style */}
                    <div className="h-72 relative">
                        <svg viewBox="0 0 800 280" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                            {/* Y-axis labels */}
                            <text x="25" y="30" fill="#737373" fontSize="12" textAnchor="end">1200M</text>
                            <text x="25" y="85" fill="#737373" fontSize="12" textAnchor="end">900M</text>
                            <text x="25" y="140" fill="#737373" fontSize="12" textAnchor="end">600M</text>
                            <text x="25" y="195" fill="#737373" fontSize="12" textAnchor="end">300M</text>
                            <text x="25" y="250" fill="#737373" fontSize="12" textAnchor="end">0M</text>
                            
                            {/* X-axis labels */}
                            <text x="60" y="270" fill="#737373" fontSize="11" textAnchor="middle">Q2 2023</text>
                            <text x="150" y="270" fill="#737373" fontSize="11" textAnchor="middle">Q3 2023</text>
                            <text x="240" y="270" fill="#737373" fontSize="11" textAnchor="middle">Q4 2023</text>
                            <text x="330" y="270" fill="#737373" fontSize="11" textAnchor="middle">2024</text>
                            <text x="420" y="270" fill="#737373" fontSize="11" textAnchor="middle">Q2 2024</text>
                            <text x="510" y="270" fill="#737373" fontSize="11" textAnchor="middle">Q3 2024</text>
                            <text x="600" y="270" fill="#737373" fontSize="11" textAnchor="middle">Q4 2024</text>
                            <text x="690" y="270" fill="#737373" fontSize="11" textAnchor="middle">2025</text>
                            <text x="745" y="270" fill="#737373" fontSize="11" textAnchor="middle">2026</text>
                            
                            {/* ChatGPT line - Top line */}
                            <path 
                                d="M 40 245 Q 200 240, 350 200 T 730 25" 
                                stroke="white" 
                                strokeWidth="2" 
                                fill="none"
                            />
                            
                            {/* Gemini line - Second line */}
                            <path 
                                d="M 40 248 Q 200 245, 350 210 T 730 65" 
                                stroke="white" 
                                strokeWidth="2" 
                                fill="none"
                            />
                            
                            {/* Perplexity line - Third line */}
                            <path 
                                d="M 40 250 Q 200 248, 350 220 T 730 100" 
                                stroke="white" 
                                strokeWidth="2" 
                                fill="none"
                            />
                            
                            {/* Claude line - Bottom line */}
                            <path 
                                d="M 40 252 Q 200 250, 350 230 T 730 135" 
                                stroke="white" 
                                strokeWidth="2" 
                                fill="none"
                            />
                            
                            {/* Logo circles at end of lines */}
                            <circle cx="730" cy="25" r="16" fill="#0a0a0a" stroke="white" strokeWidth="1"/>
                            <circle cx="730" cy="65" r="16" fill="#0a0a0a" stroke="white" strokeWidth="1"/>
                            <circle cx="730" cy="100" r="16" fill="#0a0a0a" stroke="white" strokeWidth="1"/>
                            <circle cx="730" cy="135" r="16" fill="#0a0a0a" stroke="white" strokeWidth="1"/>
                        </svg>
                        
                        {/* Brand logos attached to end of lines */}
                        <div className="absolute" style={{ right: '4.5%', top: '5%', transform: 'translate(50%, -50%)' }}>
                            <ChatGPTLogo className="w-5 h-5" />
                        </div>
                        <div className="absolute" style={{ right: '4.5%', top: '20%', transform: 'translate(50%, -50%)' }}>
                            <GeminiLogo className="w-5 h-5" />
                        </div>
                        <div className="absolute" style={{ right: '4.5%', top: '33%', transform: 'translate(50%, -50%)' }}>
                            <PerplexityLogo className="w-5 h-5" />
                        </div>
                        <div className="absolute" style={{ right: '4.5%', top: '46%', transform: 'translate(50%, -50%)' }}>
                            <ClaudeLogo className="w-5 h-5" />
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