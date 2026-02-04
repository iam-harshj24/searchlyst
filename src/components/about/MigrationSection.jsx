import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { Users } from 'lucide-react';
import { ChatGPTLogo, GeminiLogo, PerplexityLogo, ClaudeLogo } from '../landing/AILogos';

const chartData = [
    { quarter: '2023', chatgpt: 100, gemini: 50, perplexity: 20, claude: 30 },
    { quarter: 'Q2 2023', chatgpt: 200, gemini: 100, perplexity: 40, claude: 60 },
    { quarter: 'Q3 2023', chatgpt: 350, gemini: 180, perplexity: 80, claude: 100 },
    { quarter: 'Q4 2023', chatgpt: 500, gemini: 280, perplexity: 150, claude: 180 },
    { quarter: '2024', chatgpt: 650, gemini: 400, perplexity: 250, claude: 280 },
    { quarter: 'Q2 2024', chatgpt: 750, gemini: 520, perplexity: 350, claude: 380 },
    { quarter: 'Q3 2024', chatgpt: 850, gemini: 620, perplexity: 450, claude: 480 },
    { quarter: 'Q4 2024', chatgpt: 950, gemini: 720, perplexity: 520, claude: 550 },
    { quarter: '2025', chatgpt: 1050, gemini: 820, perplexity: 600, claude: 600 },
    { quarter: '2026', chatgpt: 1200, gemini: 900, perplexity: 700, claude: 650 },
];

export default function MigrationSection() {
    return (
        <section className="relative bg-[var(--bg-primary)] py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            
            <div className="relative max-w-6xl mx-auto px-6">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10">
                        <span className="text-orange-400 text-sm font-medium">The Why Now</span>
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
                        <span className="text-[var(--text-primary)]">The Migration is Here</span><br />
                        <span className="text-red-500">1.5 Billion Users</span>
                        <span className="text-[var(--text-primary)]"> Have Shifted</span>
                    </h2>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-secondary)] text-center mb-12"
                >
                    Search volume is moving from "Blue Links" to "Generative Answers" at unprecedented speed.
                </motion.p>

                {/* Chart Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8"
                >
                    <h3 className="text-[var(--text-primary)] text-xl font-semibold text-center mb-2">Monthly Active Users by Platform</h3>
                    <p className="text-[var(--text-secondary)] text-sm text-center mb-6">In millions • 2023-2026 projected</p>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-6 mb-8">
                        <div className="flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-110">
                            <ChatGPTLogo className="w-4 h-4 text-[var(--text-secondary)]" />
                            <span className="text-[var(--text-secondary)] text-sm">ChatGPT</span>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-110">
                            <GeminiLogo className="w-4 h-4 text-blue-400" />
                            <span className="text-[var(--text-secondary)] text-sm">Gemini</span>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-110">
                            <PerplexityLogo className="w-4 h-4 text-teal-400" />
                            <span className="text-[var(--text-secondary)] text-sm">Perplexity</span>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-110">
                            <ClaudeLogo className="w-4 h-4 text-orange-400" />
                            <span className="text-[var(--text-secondary)] text-sm">Claude</span>
                        </div>
                    </div>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <XAxis 
                                    dataKey="quarter" 
                                    stroke="#525252" 
                                    tick={{ fill: '#737373', fontSize: 12 }}
                                    axisLine={{ stroke: '#404040' }}
                                />
                                <YAxis 
                                    stroke="#525252" 
                                    tick={{ fill: '#737373', fontSize: 12 }}
                                    axisLine={{ stroke: '#404040' }}
                                    tickFormatter={(value) => `${value}M`}
                                />
                                <Line type="monotone" dataKey="chatgpt" stroke="#ef4444" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="gemini" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="perplexity" stroke="#14b8a6" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="claude" stroke="#f97316" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Total badge */}
                    <div className="flex justify-center mt-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border)]">
                            <Users className="w-4 h-4 text-[var(--text-secondary)]" />
                            <span className="text-[var(--text-secondary)] text-sm">Total: 1.5B+ people now search with AI</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}