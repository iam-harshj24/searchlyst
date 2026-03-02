import React, { useState, useMemo } from 'react';
import {
    Compass, TrendingUp, Users, MapPin, Sparkles, Eye, Zap,
    Filter, ChevronDown, ArrowUpRight, Globe, Clock, Target,
    Flame, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";

function generateTopicsForIndustry(user) {
    const industry = user?.industry || 'Technology';
    const brandName = user?.brandName || 'Your Brand';
    const location = user?.location || 'Global';
    const reach = user?.reach || 'Worldwide';

    const industryTopics = {
        'Real Estate': [
            { title: `AI-Powered Property Valuation in ${new Date().getFullYear()}`, trend: 'Rising Fast', trendScore: 94, reach: '2.1M', aiPotential: 'Very High', platforms: ['LinkedIn', 'Blog', 'Newsletter'], audience: 'Home Buyers, Investors', category: 'tech' },
            { title: `How Virtual Tours Are Transforming ${industry} Sales`, trend: 'Trending', trendScore: 87, reach: '1.6M', aiPotential: 'High', platforms: ['Blog', 'Instagram', 'YouTube'], audience: 'Agents, Buyers', category: 'strategy' },
            { title: `Sustainable & Green Homes: Market Demand in ${location}`, trend: 'Rising', trendScore: 78, reach: '950K', aiPotential: 'High', platforms: ['Blog', 'Newsletter'], audience: 'Investors, Buyers', category: 'sustainability' },
            { title: `${brandName}'s Guide to First-Time Home Buying`, trend: 'Steady', trendScore: 72, reach: '1.2M', aiPotential: 'Very High', platforms: ['Blog', 'Newsletter', 'LinkedIn'], audience: 'First-time Buyers', category: 'branding' },
            { title: `Luxury ${industry} Marketing in the AI Era`, trend: 'Hot', trendScore: 96, reach: '800K', aiPotential: 'Very High', platforms: ['LinkedIn', 'Blog'], audience: 'Luxury Agents, HNWI', category: 'tech' },
            { title: `Property Tech Trends Reshaping ${industry}`, trend: 'Emerging', trendScore: 68, reach: '650K', aiPotential: 'Medium', platforms: ['Blog', 'Newsletter'], audience: 'Industry Professionals', category: 'tech' },
        ],
        'SaaS': [
            { title: `AI Agents in Enterprise SaaS ${new Date().getFullYear()}`, trend: 'Rising Fast', trendScore: 94, reach: '2.4M', aiPotential: 'Very High', platforms: ['LinkedIn', 'Blog', 'Newsletter'], audience: 'CTOs, Founders', category: 'tech' },
            { title: `Product-Led Growth vs Sales-Led: The ${new Date().getFullYear()} Debate`, trend: 'Trending', trendScore: 87, reach: '1.8M', aiPotential: 'High', platforms: ['LinkedIn', 'Twitter/X', 'Substack'], audience: 'Founders, PMs', category: 'strategy' },
            { title: `How ${brandName} Can Leverage AI Search Optimization`, trend: 'Rising', trendScore: 78, reach: '950K', aiPotential: 'High', platforms: ['Blog', 'Newsletter'], audience: 'Marketers, Founders', category: 'tech' },
            { title: 'Building in Public as a SaaS Founder', trend: 'Trending', trendScore: 85, reach: '1.5M', aiPotential: 'High', platforms: ['LinkedIn', 'Twitter/X'], audience: 'Founders', category: 'branding' },
            { title: 'The ROI of Customer Success in SaaS', trend: 'Steady', trendScore: 72, reach: '780K', aiPotential: 'Medium', platforms: ['Blog', 'LinkedIn'], audience: 'CS Teams, Founders', category: 'strategy' },
            { title: 'SaaS Pricing Psychology: What Actually Works', trend: 'Hot', trendScore: 92, reach: '2.1M', aiPotential: 'Very High', platforms: ['Blog', 'Newsletter', 'Reddit'], audience: 'Founders, PMs', category: 'strategy' },
        ],
    };

    const defaultTopics = [
        { title: `AI Search Optimization for ${industry}`, trend: 'Rising Fast', trendScore: 94, reach: '2.4M', aiPotential: 'Very High', platforms: ['LinkedIn', 'Blog', 'Newsletter'], audience: `${industry} Professionals`, category: 'tech' },
        { title: `How to Build Authority in ${industry} Using Content`, trend: 'Trending', trendScore: 87, reach: '1.8M', aiPotential: 'High', platforms: ['LinkedIn', 'Blog', 'Substack'], audience: 'Founders, Marketers', category: 'strategy' },
        { title: `${industry} Trends Reshaping ${location} Markets`, trend: 'Rising', trendScore: 78, reach: '950K', aiPotential: 'High', platforms: ['Blog', 'Newsletter'], audience: 'Industry Leaders', category: 'strategy' },
        { title: `Personal Branding for ${industry} Leaders in ${new Date().getFullYear()}`, trend: 'Emerging', trendScore: 72, reach: '420K', aiPotential: 'Very High', platforms: ['LinkedIn', 'Blog'], audience: 'Executives, Founders', category: 'branding' },
        { title: `Why AI Engines Are Citing ${industry} Content More`, trend: 'Hot', trendScore: 96, reach: '3.1M', aiPotential: 'Very High', platforms: ['Blog', 'Newsletter', 'Reddit'], audience: 'Marketers, Founders', category: 'tech' },
        { title: `Sustainability & ESG in ${industry}: What Consumers Want`, trend: 'Steady', trendScore: 65, reach: '780K', aiPotential: 'Medium', platforms: ['Blog', 'LinkedIn'], audience: 'Industry Leaders', category: 'sustainability' },
    ];

    const key = Object.keys(industryTopics).find(k => industry.toLowerCase().includes(k.toLowerCase()));
    const topics = key ? industryTopics[key] : defaultTopics;

    return topics.map(t => ({ ...t, location: location || 'Global', industry: industry }));
}

const filterCategories = ['All', 'Tech', 'Strategy', 'Branding', 'Sustainability'];

export default function TopicDiscoveryPage({ onTabChange, user }) {
    const [activeFilter, setActiveFilter] = useState('All');
    const trendingTopics = useMemo(() => generateTopicsForIndustry(user), [user]);

    const filteredTopics = activeFilter === 'All'
        ? trendingTopics
        : trendingTopics.filter(t => t.category === activeFilter.toLowerCase());

    const getTrendColor = (score) => {
        if (score >= 90) return 'text-red-400 bg-red-500/10 border-red-500/20';
        if (score >= 75) return 'text-[var(--text-primary)] bg-[var(--surface-active)] border-[var(--border-strong)]';
        if (score >= 60) return 'text-[var(--text-secondary)] bg-[var(--surface-active)] border-[var(--border)]';
        return 'text-[var(--text-secondary)] bg-[var(--surface-hover)] border-[var(--border)]';
    };

    const hotCount = trendingTopics.filter(t => t.trendScore >= 90).length;
    const matchedCount = trendingTopics.length;
    const highAI = trendingTopics.filter(t => t.aiPotential === 'Very High').length;

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Compass className="w-5 h-5 text-red-400" />
                        Topic Discovery
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                        Trending topics for <span className="text-[var(--text-secondary)]">{user?.industry || 'your industry'}</span>
                        {user?.location && <> in <span className="text-[var(--text-secondary)]">{user.location}</span></>}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4">
                    <Flame className="w-4 h-4 text-red-400 mb-2" />
                    <p className="text-[var(--text-primary)] font-semibold text-lg">{hotCount}</p>
                    <p className="text-[var(--text-muted)] text-xs">Hot Topics Today</p>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4">
                    <Target className="w-4 h-4 text-red-400 mb-2" />
                    <p className="text-[var(--text-primary)] font-semibold text-lg">{matchedCount}</p>
                    <p className="text-[var(--text-muted)] text-xs">Matched to {user?.industry || 'You'}</p>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4">
                    <Eye className="w-4 h-4 text-[var(--text-secondary)] mb-2" />
                    <p className="text-[var(--text-primary)] font-semibold text-lg">{highAI}</p>
                    <p className="text-[var(--text-muted)] text-xs">High AI Potential</p>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4">
                    <Globe className="w-4 h-4 text-[var(--text-secondary)] mb-2" />
                    <p className="text-[var(--text-primary)] font-semibold text-lg">{user?.reach || 'Global'}</p>
                    <p className="text-[var(--text-muted)] text-xs">Your Market Reach</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {filterCategories.map((f) => (
                    <button key={f} onClick={() => setActiveFilter(f)}
                        className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${activeFilter === f
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-secondary)] hover:border-[var(--border)]'
                            }`}>
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTopics.map((topic, i) => (
                    <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 hover:border-red-500/20 transition-all group">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-[var(--text-primary)] font-medium text-sm leading-snug pr-4">{topic.title}</h3>
                            <span className={`px-2 py-1 text-[10px] font-medium rounded-lg border whitespace-nowrap ${getTrendColor(topic.trendScore)}`}>
                                {topic.trend}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Reach</p>
                                <p className="text-[var(--text-primary)] text-sm font-medium">{topic.reach}</p>
                            </div>
                            <div>
                                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Trend Score</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-12 h-1.5 bg-[var(--surface-active)] rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${topic.trendScore}%` }} />
                                    </div>
                                    <span className="text-[var(--text-primary)] text-xs">{topic.trendScore}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">AI Potential</p>
                                <p className={`text-xs font-medium ${topic.aiPotential === 'Very High' ? 'text-red-400' :
                                        topic.aiPotential === 'High' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                                    }`}>{topic.aiPotential}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="flex items-center gap-1 px-2 py-1 bg-[var(--surface-hover)] rounded-md text-[var(--text-muted)] text-[10px]">
                                <Users className="w-2.5 h-2.5" /> {topic.audience}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-1 bg-[var(--surface-hover)] rounded-md text-[var(--text-muted)] text-[10px]">
                                <MapPin className="w-2.5 h-2.5" /> {topic.location}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-1.5">
                                {topic.platforms.map((p, pi) => (
                                    <span key={pi} className="px-2 py-0.5 bg-red-500/10 text-red-300 text-[10px] rounded-md">{p}</span>
                                ))}
                            </div>
                            <Button size="sm" onClick={() => {
                                localStorage.setItem('searchlyst_content_prefill', topic.title);
                                onTabChange?.('content-studio');
                            }}
                                className="h-7 text-[11px] bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg border-0">
                                <Sparkles className="w-3 h-3 mr-1" /> Write About This
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
