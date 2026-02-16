import React, { useState } from 'react';
import { 
    Compass, TrendingUp, Users, MapPin, Sparkles, Eye, Zap,
    Filter, ChevronDown, ArrowUpRight, Globe, Clock, Target,
    Flame, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";

const trendingTopics = [
    { 
        title: 'AI Agents in Enterprise SaaS', 
        trend: 'Rising Fast', 
        trendScore: 94, 
        reach: '2.4M', 
        aiPotential: 'Very High',
        platforms: ['LinkedIn', 'Blog', 'Newsletter'],
        industry: 'SaaS',
        audience: 'CTOs, Founders',
        location: 'Global',
        category: 'tech'
    },
    { 
        title: 'How to Build in Public as a Founder', 
        trend: 'Trending', 
        trendScore: 87, 
        reach: '1.8M', 
        aiPotential: 'High',
        platforms: ['LinkedIn', 'Twitter/X', 'Substack'],
        industry: 'Startups',
        audience: 'Founders',
        location: 'US, Europe',
        category: 'strategy'
    },
    { 
        title: 'The ROI of Sustainable Tech Products', 
        trend: 'Rising', 
        trendScore: 78, 
        reach: '950K', 
        aiPotential: 'High',
        platforms: ['Blog', 'Newsletter', 'LinkedIn'],
        industry: 'GreenTech',
        audience: 'Investors, Founders',
        location: 'US, UK',
        category: 'sustainability'
    },
    { 
        title: 'Personal Branding for HNWI in 2026', 
        trend: 'Emerging', 
        trendScore: 72, 
        reach: '420K', 
        aiPotential: 'Very High',
        platforms: ['LinkedIn', 'Blog', 'Quora'],
        industry: 'Personal Branding',
        audience: 'HNWI, Executives',
        location: 'Global',
        category: 'branding'
    },
    { 
        title: 'AI Search Optimization: Beyond Traditional SEO', 
        trend: 'Hot', 
        trendScore: 96, 
        reach: '3.1M', 
        aiPotential: 'Very High',
        platforms: ['Blog', 'Newsletter', 'Reddit'],
        industry: 'Marketing',
        audience: 'Marketers, Founders',
        location: 'Global',
        category: 'tech'
    },
    { 
        title: 'Data Privacy Regulations & Startup Compliance', 
        trend: 'Steady', 
        trendScore: 65, 
        reach: '780K', 
        aiPotential: 'Medium',
        platforms: ['Blog', 'LinkedIn'],
        industry: 'Legal Tech',
        audience: 'Founders, Legal Teams',
        location: 'EU, US',
        category: 'regulation'
    },
];

const filters = ['All', 'Tech', 'Strategy', 'Branding', 'Sustainability'];

export default function TopicDiscoveryPage({ onTabChange }) {
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredTopics = activeFilter === 'All' 
        ? trendingTopics 
        : trendingTopics.filter(t => t.category === activeFilter.toLowerCase());

    const getTrendColor = (score) => {
        if (score >= 90) return 'text-red-400 bg-red-500/10 border-red-500/20';
        if (score >= 75) return 'text-white bg-white/10 border-white/20';
        if (score >= 60) return 'text-white/60 bg-white/[0.06] border-white/10';
        return 'text-white/40 bg-white/[0.03] border-white/[0.06]';
    };

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Compass className="w-5 h-5 text-red-400" />
                        Topic Discovery
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Trending topics tailored to your industry, audience, and location.</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4">
                    <Flame className="w-4 h-4 text-red-400 mb-2" />
                    <p className="text-white font-semibold text-lg">12</p>
                    <p className="text-white/30 text-xs">Hot Topics Today</p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4">
                    <Target className="w-4 h-4 text-red-400 mb-2" />
                    <p className="text-white font-semibold text-lg">8</p>
                    <p className="text-white/30 text-xs">Matched to You</p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4">
                    <Eye className="w-4 h-4 text-white/60 mb-2" />
                    <p className="text-white font-semibold text-lg">5</p>
                    <p className="text-white/30 text-xs">High AI Potential</p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4">
                    <Globe className="w-4 h-4 text-white/60 mb-2" />
                    <p className="text-white font-semibold text-lg">3</p>
                    <p className="text-white/30 text-xs">Regions Covered</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${
                            activeFilter === f
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/60 hover:border-white/10'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Topic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTopics.map((topic, i) => (
                    <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5 hover:border-red-500/20 transition-all group">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-white font-medium text-sm leading-snug pr-4">{topic.title}</h3>
                            <span className={`px-2 py-1 text-[10px] font-medium rounded-lg border whitespace-nowrap ${getTrendColor(topic.trendScore)}`}>
                                {topic.trend}
                            </span>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <p className="text-white/20 text-[10px] uppercase tracking-wider">Reach</p>
                                <p className="text-white text-sm font-medium">{topic.reach}</p>
                            </div>
                            <div>
                                <p className="text-white/20 text-[10px] uppercase tracking-wider">Trend Score</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-12 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${topic.trendScore}%` }} />
                                    </div>
                                    <span className="text-white text-xs">{topic.trendScore}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-white/20 text-[10px] uppercase tracking-wider">AI Potential</p>
                                <p className={`text-xs font-medium ${
                                    topic.aiPotential === 'Very High' ? 'text-red-400' :
                                    topic.aiPotential === 'High' ? 'text-white' : 'text-white/50'
                                }`}>{topic.aiPotential}</p>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="flex items-center gap-1 px-2 py-1 bg-white/[0.03] rounded-md text-white/30 text-[10px]">
                                <Users className="w-2.5 h-2.5" /> {topic.audience}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-1 bg-white/[0.03] rounded-md text-white/30 text-[10px]">
                                <MapPin className="w-2.5 h-2.5" /> {topic.location}
                            </span>
                        </div>

                        {/* Suggested Platforms */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-1.5">
                                {topic.platforms.map((p, pi) => (
                                    <span key={pi} className="px-2 py-0.5 bg-red-500/10 text-red-300 text-[10px] rounded-md">{p}</span>
                                ))}
                            </div>
                            <Button 
                                size="sm" 
                                onClick={() => onTabChange?.('content-studio')}
                                className="h-7 text-[11px] bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg border-0"
                            >
                                <Sparkles className="w-3 h-3 mr-1" /> Create
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}