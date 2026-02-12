import React from 'react';
import { 
    Eye, PenTool, TrendingUp, Activity, ArrowUpRight, ArrowDownRight,
    Sparkles, FileText, Target, Zap, ChevronRight, Globe
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

const visibilityTrend = [
    { day: 'Mon', score: 62 }, { day: 'Tue', score: 65 }, { day: 'Wed', score: 63 },
    { day: 'Thu', score: 68 }, { day: 'Fri', score: 72 }, { day: 'Sat', score: 70 },
    { day: 'Sun', score: 75 },
];

const recentActions = [
    { icon: FileText, text: 'Blog post "AI in Healthcare" published', time: '2h ago', color: 'text-emerald-400' },
    { icon: Target, text: 'New trending topic detected: "AI Regulation"', time: '5h ago', color: 'text-purple-400' },
    { icon: Activity, text: 'SEO audit completed for your website', time: '1d ago', color: 'text-amber-400' },
    { icon: Eye, text: 'ChatGPT citation rate increased by 12%', time: '2d ago', color: 'text-blue-400' },
];

const quickActions = [
    { icon: PenTool, label: 'Create Content', desc: 'Generate AI-optimized content', tab: 'content-studio' },
    { icon: Target, label: 'Find Topics', desc: 'Discover trending topics', tab: 'topic-discovery' },
    { icon: Activity, label: 'Run Audit', desc: 'Check your site health', tab: 'audit-health' },
    { icon: Eye, label: 'View Analytics', desc: 'AI visibility insights', tab: 'ai-visibility' },
];

export default function OverviewPage({ domains, onAddDomain, onTabChange }) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">{getGreeting()} 👋</h1>
                    <p className="text-white/40 text-sm mt-1">Here's what's happening with your brand today.</p>
                </div>
                <button 
                    onClick={onAddDomain}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
                >
                    <Sparkles className="w-4 h-4" />
                    Add Project
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard 
                    label="AI Visibility Score" 
                    value="75" 
                    suffix="/100" 
                    change="+8%" 
                    positive={true}
                    icon={Eye}
                    gradient="from-violet-500/10 to-purple-500/10"
                    borderColor="border-purple-500/20"
                />
                <KPICard 
                    label="Content Published" 
                    value="24" 
                    suffix=" pieces" 
                    change="+6" 
                    positive={true}
                    icon={PenTool}
                    gradient="from-emerald-500/10 to-teal-500/10"
                    borderColor="border-emerald-500/20"
                />
                <KPICard 
                    label="AI Citations" 
                    value="1.2K" 
                    suffix="" 
                    change="+23%" 
                    positive={true}
                    icon={TrendingUp}
                    gradient="from-blue-500/10 to-cyan-500/10"
                    borderColor="border-blue-500/20"
                />
                <KPICard 
                    label="Site Health" 
                    value="87" 
                    suffix="%" 
                    change="-2%" 
                    positive={false}
                    icon={Activity}
                    gradient="from-amber-500/10 to-orange-500/10"
                    borderColor="border-amber-500/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visibility Trend */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-white font-medium text-sm">AI Visibility Trend</h3>
                            <p className="text-white/30 text-xs mt-0.5">Last 7 days</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-xs font-medium">+13%</span>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={visibilityTrend}>
                                <defs>
                                    <linearGradient id="visGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: '#1a1a1a', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        borderRadius: '12px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                                    }}
                                    labelStyle={{ color: '#fff' }}
                                    itemStyle={{ color: '#a855f7' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="#a855f7" 
                                    strokeWidth={2}
                                    fill="url(#visGradient)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-white font-medium text-sm mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentActions.map((action, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-white/[0.03] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <action.icon className={`w-3.5 h-3.5 ${action.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/70 text-xs leading-relaxed">{action.text}</p>
                                    <p className="text-white/20 text-[10px] mt-0.5">{action.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-white font-medium text-sm mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => onTabChange?.(action.tab)}
                            className="group p-4 bg-[#0a0a0a] border border-white/[0.06] rounded-2xl text-left hover:border-purple-500/30 transition-all duration-300"
                        >
                            <div className="w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-500/10 transition-colors">
                                <action.icon className="w-5 h-5 text-white/40 group-hover:text-purple-400 transition-colors" />
                            </div>
                            <p className="text-white text-sm font-medium">{action.label}</p>
                            <p className="text-white/30 text-xs mt-0.5">{action.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Projects */}
            {domains.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium text-sm">Your Projects</h3>
                        <span className="text-white/30 text-xs">{domains.length} active</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {domains.map((domain) => (
                            <div key={domain.id} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4 hover:border-purple-500/20 transition-all cursor-pointer group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-white/30" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-sm truncate">{domain.name}</p>
                                        <p className="text-white/30 text-[11px] truncate">{domain.url}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors" />
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                        <span className="text-white/40">Score: {domain.visibility_score || 0}%</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="text-white/40">Issues: {domain.issues_count || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function KPICard({ label, value, suffix, change, positive, icon: Icon, gradient, borderColor }) {
    return (
        <div className={`bg-gradient-to-br ${gradient} border ${borderColor} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-white/40 text-xs font-medium">{label}</span>
                <Icon className="w-4 h-4 text-white/20" />
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <span className="text-2xl font-bold text-white">{value}</span>
                    <span className="text-white/30 text-sm ml-0.5">{suffix}</span>
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                    positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                    {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </div>
            </div>
        </div>
    );
}