import React, { useState, useMemo } from 'react';
import {
    Compass, TrendingUp, Users, MapPin, Sparkles, Eye, Zap,
    Filter, ChevronDown, ArrowUpRight, Globe, Clock, Target,
    Flame, BarChart3, Hash, RefreshCw, Search, UserCircle2, BrainCircuit, Activity
} from 'lucide-react';
import { Button } from "@/components/ui/button";

function generateTopicsForIndustry(user) {
    const industry = user?.industry || 'Real Estate';
    const brandName = user?.brandName || 'Camana Homes';
    const location = user?.location || 'Dubai';
    const reach = user?.reach || 'Worldwide';

    const industryTopics = {
        'Real Estate': [
            { title: `${location} Off-Plan Market ${new Date().getFullYear() + 2}: What Investors Need to...`, trend: 'TRENDING', trendScore: 91, reach: '2.8M', aiPotential: 'Very High', platforms: ['LinkedIn', 'Blog', 'Newsletter'], audience: 'Investors', category: 'investment', trendBadgeStyle: 'text-white border-[#333] bg-[#111]', trendDot: 'bg-[#00D26A]' },
            { title: `AI-Powered Property Valuation in ${new Date().getFullYear()}`, trend: 'RISING FAST', trendScore: 94, reach: '2.1M', aiPotential: 'Very High', platforms: ['LinkedIn', 'Blog', 'Newsletter'], audience: 'Home Buyers, Investors', category: 'tech', trendBadgeStyle: 'text-red-400 border-red-500/30 bg-red-500/10', trendDot: 'bg-red-500' },
            { title: `How Virtual Tours Are Transforming ${industry} Sales`, trend: 'TRENDING', trendScore: 87, reach: '1.6M', aiPotential: 'High', platforms: ['Blog', 'Instagram', 'YouTube'], audience: 'Agents, Buyers', category: 'tech', trendBadgeStyle: 'text-white border-[#333] bg-[#111]', trendDot: 'bg-[#00D26A]' },
            { title: `${brandName}'s Guide to First-Time Home Buying`, trend: 'STEADY', trendScore: 72, reach: '1.2M', aiPotential: 'Very High', platforms: ['Blog', 'LinkedIn', 'Newsletter'], audience: 'First-time Buyers', category: 'branding', trendBadgeStyle: 'text-[#888] border-[#333] bg-[#1A1A1A]', trendDot: 'bg-[#666]' },
            { title: `Sustainable Living in ${location}: The New Norm for Home Buye...`, trend: 'EMERGING', trendScore: 85, reach: '1.9M', aiPotential: 'Moderate', platforms: ['LinkedIn', 'Blog', 'Newsletter'], audience: 'Home Buyers, Investors', category: 'sustainability', trendBadgeStyle: 'text-white border-[#333] bg-[#111]', trendDot: 'bg-[#00D26A]' },
            { title: `The Future of Smart Homes in ${location}`, trend: 'RISING', trendScore: 90, reach: '2.5M', aiPotential: 'High', platforms: ['Blog', 'Instagram', 'YouTube'], audience: 'Tech-savvy Buyers, Investors', category: 'tech', trendBadgeStyle: 'text-white border-[#333] bg-[#111]', trendDot: 'bg-red-500' },
            { title: `Trends in Luxury ${industry}: What to Expect in ${new Date().getFullYear()}`, trend: 'HOT', trendScore: 88, reach: '2.3M', aiPotential: 'High', platforms: ['LinkedIn', 'Blog', 'Newsletter'], audience: 'Wealthy Buyers, Investors', category: 'strategy', trendBadgeStyle: 'text-orange-400 border-orange-500/30 bg-orange-500/10', trendDot: 'bg-orange-500' },
            { title: `Green Building Practices in ${location}`, trend: 'RISING', trendScore: 92, reach: '1.8M', aiPotential: 'Very High', platforms: ['Blog', 'Instagram', 'YouTube'], audience: 'Developers, Eco-conscious Buyers', category: 'sustainability', trendBadgeStyle: 'text-white border-[#333] bg-[#111]', trendDot: 'bg-red-500' },
        ],
    };

    const defaultTopics = [
        { title: `AI Search Optimization for ${industry}`, trend: 'RISING FAST', trendScore: 94, reach: '2.4M', aiPotential: 'Very High', platforms: ['LinkedIn', 'Blog', 'Newsletter'], audience: `${industry} Professionals`, category: 'tech', trendBadgeStyle: 'text-red-400 border-red-500/30 bg-red-500/10', trendDot: 'bg-red-500' },
        { title: `How to Build Authority in ${industry} Using Content`, trend: 'TRENDING', trendScore: 87, reach: '1.8M', aiPotential: 'High', platforms: ['LinkedIn', 'Blog', 'Substack'], audience: 'Founders, Marketers', category: 'strategy', trendBadgeStyle: 'text-white border-[#333] bg-[#111]', trendDot: 'bg-[#00D26A]' },
        { title: `${industry} Trends Reshaping ${location} Markets`, trend: 'RISING', trendScore: 78, reach: '950K', aiPotential: 'High', platforms: ['Blog', 'Newsletter'], audience: 'Industry Leaders', category: 'strategy', trendBadgeStyle: 'text-white border-[#333] bg-[#111]', trendDot: 'bg-red-500' },
        { title: `Personal Branding for ${industry} Leaders in ${new Date().getFullYear()}`, trend: 'EMERGING', trendScore: 72, reach: '420K', aiPotential: 'Very High', platforms: ['LinkedIn', 'Blog'], audience: 'Executives, Founders', category: 'branding', trendBadgeStyle: 'text-white border-[#333] bg-[#111]', trendDot: 'bg-orange-500' },
        { title: `Why AI Engines Are Citing ${industry} Content More`, trend: 'HOT', trendScore: 96, reach: '3.1M', aiPotential: 'Very High', platforms: ['Blog', 'Newsletter', 'Reddit'], audience: 'Marketers, Founders', category: 'tech', trendBadgeStyle: 'text-orange-400 border-orange-500/30 bg-orange-500/10', trendDot: 'bg-orange-500' },
        { title: `Sustainability & ESG in ${industry}: What Consumers Want`, trend: 'STEADY', trendScore: 65, reach: '780K', aiPotential: 'Moderate', platforms: ['Blog', 'LinkedIn'], audience: 'Industry Leaders', category: 'sustainability', trendBadgeStyle: 'text-[#888] border-[#333] bg-[#1A1A1A]', trendDot: 'bg-[#666]' },
        { title: `Digital Transformation in ${industry}`, trend: 'TRENDING', trendScore: 82, reach: '1.2M', aiPotential: 'High', platforms: ['LinkedIn', 'Blog'], audience: 'Executives', category: 'tech', trendBadgeStyle: 'text-white border-[#333] bg-[#111]', trendDot: 'bg-[#00D26A]' },
        { title: `Venture Capital Flows into ${industry}`, trend: 'EMERGING', trendScore: 75, reach: '600K', aiPotential: 'Moderate', platforms: ['Newsletter', 'Blog'], audience: 'Investors, Founders', category: 'investment', trendBadgeStyle: 'text-white border-[#333] bg-[#111]', trendDot: 'bg-orange-500' }
    ];

    const key = Object.keys(industryTopics).find(k => industry.toLowerCase().includes(k.toLowerCase()));
    const topics = key ? industryTopics[key] : defaultTopics;

    return topics.map(t => ({ ...t, location: location || 'Global', industry: industry }));
}

const filterCategories = ['All', 'Tech', 'Strategy', 'Branding', 'Sustainability', 'Investment'];

export default function TopicDiscoveryPage({ onTabChange, user }) {
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const trendingTopics = useMemo(() => {
        const topics = generateTopicsForIndustry(user);
        if (refreshTrigger > 0) {
            // Simulate fresh array order
            return [...topics].sort(() => Math.random() - 0.5);
        }
        return topics;
    }, [user, refreshTrigger]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate network delay
        await new Promise(r => setTimeout(r, 1200));
        setRefreshTrigger(prev => prev + 1);
        setIsRefreshing(false);
    };

    const filteredTopics = trendingTopics.filter(t => {
        const matchesCategory = activeFilter === 'All' || t.category === activeFilter.toLowerCase();
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getTrendColor = (score) => {
        if (score >= 90) return 'text-red-400 bg-red-500/10 border-red-500/20';
        if (score >= 75) return 'text-[var(--text-primary)] bg-[var(--surface-active)] border-[var(--border-strong)]';
        if (score >= 60) return 'text-[var(--text-secondary)] bg-[var(--surface-active)] border-[var(--border)]';
        return 'text-[var(--text-secondary)] bg-[var(--surface-hover)] border-[var(--border)]';
    };

    const hotCount = trendingTopics.filter(t => t.trendScore >= 85).length || 4;
    const matchedCount = trendingTopics.length || 8;
    const highAI = trendingTopics.filter(t => t.aiPotential === 'Very High' || t.aiPotential === 'High').length || 7;

    return (
        <div className="w-full pb-10">
            {/* Full-width Header */}
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Hash className="w-[20px] h-[20px] text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Topic Discovery</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">Trending topics for {user?.industry || 'Real Estate'} in {user?.location || 'Dubai'}</p>
                    </div>
                </div>
                <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#E92A15] hover:bg-[#D12512] text-white text-[13px] font-medium rounded-full transition-all shadow-[0_0_20px_rgba(233,42,21,0.35)] disabled:opacity-50 disabled:cursor-not-allowed">
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                    {isRefreshing ? 'Refreshing...' : 'Refresh Topics'}
                </button>
            </div>

            <div className="space-y-6 max-w-[1400px] mt-8">
                {/* 4 KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#333] flex items-center justify-center shrink-0">
                                <Flame className="w-[18px] h-[18px] text-[#bbb]" />
                            </div>
                            <span className="text-white text-[28px] font-bold tracking-tight">{hotCount}</span>
                        </div>
                        <p className="text-[#666] text-[13px] font-medium mt-3 text-center lg:text-left ml-[56px] lg:ml-0">Hot Topics Today</p>
                    </div>
                    
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#333] flex items-center justify-center shrink-0">
                                <Target className="w-[18px] h-[18px] text-[#bbb]" />
                            </div>
                            <span className="text-white text-[28px] font-bold tracking-tight">{matchedCount}</span>
                        </div>
                        <p className="text-[#666] text-[13px] font-medium mt-3 text-center lg:text-left ml-[56px] lg:ml-0">Matched to {user?.industry || 'Real Estate'}</p>
                    </div>

                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#333] flex items-center justify-center shrink-0">
                                <BrainCircuit className="w-[18px] h-[18px] text-[#bbb]" />
                            </div>
                            <span className="text-white text-[28px] font-bold tracking-tight">{highAI}</span>
                        </div>
                        <p className="text-[#666] text-[13px] font-medium mt-3 text-center lg:text-left ml-[56px] lg:ml-0">High AI Potential</p>
                    </div>

                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#333] flex items-center justify-center shrink-0">
                                <Globe className="w-[18px] h-[18px] text-[#bbb]" />
                            </div>
                            <span className="text-white text-[24px] font-bold tracking-tight">{user?.reach || 'Worldwide'}</span>
                        </div>
                        <p className="text-[#666] text-[13px] font-medium mt-3 text-center lg:text-left ml-[56px] lg:ml-0">Your Market Reach</p>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                            <Search className="w-[16px] h-[16px] text-[#666] absolute left-4 top-1/2 -translate-y-1/2" />
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search topics..." 
                                className="w-[260px] bg-[#111] border border-[#222] text-white text-[14px] rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:border-[#E92A15]/50 focus:bg-[#1A1A1A] transition-all placeholder:text-[#555]" 
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            {filterCategories.map((f) => (
                                <button key={f} onClick={() => setActiveFilter(f)}
                                    className={`px-5 py-2 text-[13px] font-medium rounded-full transition-all whitespace-nowrap ${
                                        activeFilter === f
                                            ? 'bg-[#E92A15] text-white border border-[#E92A15] shadow-[0_0_15px_rgba(233,42,21,0.25)]'
                                            : 'bg-transparent text-[#888] border border-[#333] hover:bg-[#1A1A1A] hover:text-white'
                                    }`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 border-l border-[#222] pl-4">
                        <span className="text-[#888] text-[13px]">{filteredTopics.length} topics</span>
                        <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#333] text-[#aaa] hover:text-white hover:bg-[#1A1A1A] rounded-full text-[13px] transition-all">
                            <Filter className="w-3.5 h-3.5" /> Sort: All <ChevronDown className="w-3.5 h-3.5 ml-1 text-[#666]" />
                        </button>
                    </div>
                </div>

                {/* Topic Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                    {filteredTopics.map((topic, i) => (
                        <div key={i} className="bg-[#0B0B0B] border border-[#222] rounded-3xl p-6 hover:border-[#333] transition-all group flex flex-col shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
                            
                            {/* Title and Badge */}
                            <div className="flex items-start justify-between mb-8 gap-4">
                                <h3 className="text-white font-semibold text-[17px] leading-[1.4] line-clamp-2">{topic.title}</h3>
                                <div className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shrink-0 ${topic.trendBadgeStyle}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${topic.trendDot}`} />
                                    {topic.trend}
                                </div>
                            </div>
                            
                            {/* 3 Metrics Row */}
                            <div className="grid grid-cols-3 gap-6 mb-8 relative">
                                <div>
                                    <p className="text-[#888] text-[10px] font-bold uppercase tracking-[0.15em] mb-2">Reach</p>
                                    <p className="text-white text-[20px] font-bold tracking-tight">{topic.reach}</p>
                                </div>
                                <div>
                                    <p className="text-[#888] text-[10px] font-bold uppercase tracking-[0.15em] mb-2">Trend Score</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-[60px] h-1.5 bg-[#222] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#E92A15] rounded-full transition-all" style={{ width: `${topic.trendScore}%` }} />
                                        </div>
                                        <span className="text-white text-[20px] font-bold tracking-tight leading-none">{topic.trendScore}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[#888] text-[10px] font-bold uppercase tracking-[0.15em] mb-2">AI Potential</p>
                                    <p className="text-white text-[14px] font-bold flex items-center gap-1.5 pt-0.5">
                                        <BrainCircuit className="w-4 h-4 text-[#888]" /> {topic.aiPotential}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Footer info & Button */}
                            <div className="flex items-center justify-between border-t border-[#222] pt-6 mt-auto">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-4 text-[#888] text-[12px]">
                                        <span className="flex items-center gap-1.5">
                                            <UserCircle2 className="w-[14px] h-[14px] text-[#555]"/> {topic.audience}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-[14px] h-[14px] text-[#555]"/> {topic.location}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {topic.platforms.map((p, pi) => (
                                            <span key={pi} className="px-3 py-1 bg-[#1A1A1A] text-[#aaa] rounded-lg text-[11px] font-medium">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        localStorage.setItem('searchlyst_content_prefill', topic.title);
                                        onTabChange?.('content-studio');
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 border border-[#333] text-white rounded-xl text-[13px] font-medium hover:bg-[#1A1A1A] hover:border-[#555] transition-all ml-4 shrink-0">
                                    <Sparkles className="w-4 h-4 text-[#bbb]" /> Write About This
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tracking Footer Label */}
                <div className="text-center pt-8 pb-4">
                    <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
                        <Zap className="w-3 h-3" />
                        Topics refreshed daily · Powered by Searchlyst AI · Tuned for {user?.location || 'Dubai'} {user?.industry || 'Real Estate'}
                    </p>
                </div>
            </div>
        </div>
    );
}
