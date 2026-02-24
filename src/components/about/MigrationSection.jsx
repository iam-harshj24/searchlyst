import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Users } from 'lucide-react';
import { ChatGPTLogo, GeminiLogo, PerplexityLogo, ClaudeLogo } from '../landing/AILogos';

// Custom dot with logo at end of line - same as Home page
const CustomEndDot = ({ cx, cy, payload, dataKey, index, data }) => {
    if (index !== data.length - 1) return null;
    
    const LogoComponent = dataKey === 'chatgpt' ? ChatGPTLogo : 
                         dataKey === 'gemini' ? GeminiLogo :
                         dataKey === 'perplexity' ? PerplexityLogo :
                         ClaudeLogo;
    
    return (
        <g>
            <circle cx={cx} cy={cy} r={14} fill="var(--bg-secondary)" stroke="white" strokeWidth="1.5" />
            <foreignObject x={cx - 10} y={cy - 10} width={20} height={20}>
                <div className="flex items-center justify-center w-full h-full">
                    <LogoComponent className="w-4 h-4" />
                </div>
            </foreignObject>
        </g>
    );
};

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

export default function MigrationSection() {
    return (
        <section className="relative bg-[var(--bg-primary)] py-12 md:py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            
            <div className="relative max-w-6xl mx-auto px-2 md:px-6">
                {/* Badge */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10">
                        <span className="text-orange-400 text-sm font-medium">The Why Now</span>
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center mb-4">
                    <h2 className="text-4xl md:text-5xl font-bold">
                        <span className="text-[var(--text-primary)]">The Migration is Here</span><br />
                        <span className="text-red-500">1.5 Billion Users</span>
                        <span className="text-[var(--text-primary)]"> Have Shifted</span>
                    </h2>
                </div>

                <p className="text-[var(--text-secondary)] text-center mb-12">
                    Search volume is moving from "Blue Links" to "Generative Answers" at unprecedented speed.
                </p>

                {/* Chart Card */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 md:p-8">
                    <h3 className="text-[var(--text-primary)] text-xl font-semibold text-center mb-2">Monthly Active Users by Platform</h3>
                    <p className="text-[var(--text-secondary)] text-sm text-center mb-6">In millions • 2023-2026 projected</p>

                    {/* Legend - simplified for Safari performance */}
                    <div className="flex flex-wrap justify-center gap-6 mb-8">
                        <div className="flex items-center gap-2">
                            <ChatGPTLogo className="w-4 h-4" />
                            <span className="text-[var(--text-secondary)] text-sm">ChatGPT</span>
                            <div className="w-6 h-0.5 bg-[#10a37f]"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <GeminiLogo className="w-4 h-4" />
                            <span className="text-[var(--text-secondary)] text-sm">Gemini</span>
                            <div className="w-6 h-0.5 bg-[#4285f4]"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <PerplexityLogo className="w-4 h-4" />
                            <span className="text-[var(--text-secondary)] text-sm">Perplexity</span>
                            <div className="w-6 h-0.5 bg-[#20b2aa]"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ClaudeLogo className="w-4 h-4" />
                            <span className="text-[var(--text-secondary)] text-sm">Claude</span>
                            <div className="w-6 h-0.5 bg-[#cc785c]"></div>
                        </div>
                    </div>

                    <div className="h-64 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 10 }}>
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
                                    dot={(props) => <CustomEndDot {...props} data={chartData} />}
                                    name="ChatGPT"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="gemini" 
                                    stroke="#ffffff" 
                                    strokeWidth={2} 
                                    dot={(props) => <CustomEndDot {...props} data={chartData} />}
                                    name="Gemini"
                                    strokeDasharray="8 4"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="perplexity" 
                                    stroke="#ffffff" 
                                    strokeWidth={2} 
                                    dot={(props) => <CustomEndDot {...props} data={chartData} />}
                                    name="Perplexity"
                                    strokeDasharray="4 4"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="claude" 
                                    stroke="#ffffff" 
                                    strokeWidth={2} 
                                    dot={(props) => <CustomEndDot {...props} data={chartData} />}
                                    name="Claude"
                                    strokeDasharray="2 2"
                                />
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
                </div>
            </div>
        </section>
    );
}