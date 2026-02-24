import { 
    Eye, PenTool, TrendingUp, Activity, Target, FileText,
    Users, DollarSign, BarChart3, Megaphone, Heart, Sparkles,
    Globe, Rocket, Palette
} from 'lucide-react';

export const roleConfig = {
    founder: {
        label: 'Founder',
        icon: Rocket,
        greeting: 'Ready to build authority?',
        subtitle: "Here's how AI sees your brand today.",
        kpis: [
            { label: 'AI Visibility Score', value: '75', suffix: '/100', change: '+8%', positive: true, icon: Eye, gradient: 'from-red-500/10 to-red-600/10', borderColor: 'border-red-500/20' },
            { label: 'Investor Reach', value: '2.4K', suffix: '', change: '+18%', positive: true, icon: TrendingUp, gradient: 'from-[var(--surface-hover)] to-transparent', borderColor: 'border-[var(--border)]' },
            { label: 'Thought Leadership', value: '24', suffix: ' articles', change: '+6', positive: true, icon: PenTool, gradient: 'from-red-500/5 to-transparent', borderColor: 'border-[var(--border)]' },
            { label: 'Site Health', value: '87', suffix: '%', change: '-2%', positive: false, icon: Activity, gradient: 'from-[var(--surface-hover)] to-transparent', borderColor: 'border-[var(--border)]' },
        ],
        quickActions: [
            { icon: PenTool, label: 'Write a LinkedIn Post', desc: 'Founder thought leadership', tab: 'content-studio' },
            { icon: Target, label: 'Find Investor Topics', desc: 'Trending in your space', tab: 'topic-discovery' },
            { icon: Activity, label: 'Audit My Startup Site', desc: 'SEO, AEO & GEO check', tab: 'audit-health' },
            { icon: Eye, label: 'AI Visibility Report', desc: 'How AI sees your brand', tab: 'ai-visibility' },
        ],
        recentActions: [
            { icon: FileText, text: 'Published "Why We Raised $5M for AI"', time: '2h ago', color: 'text-white' },
            { icon: Target, text: 'Trending: "AI-First Startup Playbook"', time: '5h ago', color: 'text-red-400' },
            { icon: Activity, text: 'AEO audit found 3 critical issues', time: '1d ago', color: 'text-[var(--text-secondary)]' },
            { icon: Eye, text: 'Perplexity now cites your pricing page', time: '2d ago', color: 'text-red-400' },
        ],
        sidebarLabels: {
            'content-studio': 'Write & Publish',
            'topic-discovery': 'Trend Intel',
        },
    },
    creator: {
        label: 'Creator',
        icon: Palette,
        greeting: 'Ready to create?',
        subtitle: "Your content performance at a glance.",
        kpis: [
            { label: 'Content Score', value: '82', suffix: '/100', change: '+12%', positive: true, icon: Sparkles, gradient: 'from-red-500/10 to-red-600/10', borderColor: 'border-red-500/20' },
            { label: 'Pieces Published', value: '48', suffix: '', change: '+12', positive: true, icon: PenTool, gradient: 'from-[var(--surface-hover)] to-transparent', borderColor: 'border-[var(--border)]' },
            { label: 'Audience Reach', value: '15.2K', suffix: '', change: '+34%', positive: true, icon: Users, gradient: 'from-red-500/5 to-transparent', borderColor: 'border-[var(--border)]' },
            { label: 'AI Citations', value: '890', suffix: '', change: '+23%', positive: true, icon: TrendingUp, gradient: 'from-[var(--surface-hover)] to-transparent', borderColor: 'border-[var(--border)]' },
        ],
        quickActions: [
            { icon: PenTool, label: 'Create a Carousel', desc: 'Instagram-ready slides', tab: 'content-studio' },
            { icon: FileText, label: 'Draft Newsletter', desc: 'Write in your style', tab: 'content-studio' },
            { icon: Target, label: 'What\'s Trending', desc: 'Topics your audience wants', tab: 'topic-discovery' },
            { icon: Eye, label: 'AI Visibility', desc: 'Are AI engines citing you?', tab: 'ai-visibility' },
        ],
        recentActions: [
            { icon: FileText, text: 'Newsletter "Design Systems 101" sent', time: '1h ago', color: 'text-white' },
            { icon: Target, text: 'Trending in your niche: "AI for Designers"', time: '3h ago', color: 'text-red-400' },
            { icon: PenTool, text: 'Instagram carousel generated (8 slides)', time: '1d ago', color: 'text-[var(--text-secondary)]' },
            { icon: Eye, text: 'Gemini started citing your blog', time: '2d ago', color: 'text-red-400' },
        ],
        sidebarLabels: {
            'content-studio': 'Content Studio',
            'topic-discovery': 'Trending Ideas',
        },
    },
    influencer: {
        label: 'Influencer',
        icon: Megaphone,
        greeting: 'Ready to grow your influence?',
        subtitle: "Your brand presence across AI and social.",
        kpis: [
            { label: 'Brand Presence', value: '71', suffix: '/100', change: '+15%', positive: true, icon: Eye, gradient: 'from-red-500/10 to-red-600/10', borderColor: 'border-red-500/20' },
            { label: 'Follower Reach', value: '125K', suffix: '', change: '+8.5K', positive: true, icon: Users, gradient: 'from-[var(--surface-hover)] to-transparent', borderColor: 'border-[var(--border)]' },
            { label: 'Content Published', value: '36', suffix: '', change: '+9', positive: true, icon: PenTool, gradient: 'from-red-500/5 to-transparent', borderColor: 'border-[var(--border)]' },
            { label: 'AI Mentions', value: '1.8K', suffix: '', change: '+42%', positive: true, icon: TrendingUp, gradient: 'from-[var(--surface-hover)] to-transparent', borderColor: 'border-[var(--border)]' },
        ],
        quickActions: [
            { icon: PenTool, label: 'Create Content', desc: 'Multi-platform posts', tab: 'content-studio' },
            { icon: Target, label: 'Trending Topics', desc: 'What your audience wants', tab: 'topic-discovery' },
            { icon: BarChart3, label: 'Brand Analytics', desc: 'Track your influence', tab: 'ai-visibility' },
            { icon: Activity, label: 'Profile Audit', desc: 'Optimize your presence', tab: 'audit-health' },
        ],
        recentActions: [
            { icon: Megaphone, text: 'LinkedIn post reached 12K impressions', time: '3h ago', color: 'text-white' },
            { icon: Target, text: 'Hot topic: "Influencer-Led Brands"', time: '6h ago', color: 'text-red-400' },
            { icon: Heart, text: 'Instagram carousel got 2.3K saves', time: '1d ago', color: 'text-[var(--text-secondary)]' },
            { icon: Eye, text: 'ChatGPT recommends you for "fitness tips"', time: '2d ago', color: 'text-red-400' },
        ],
        sidebarLabels: {
            'content-studio': 'Create Posts',
            'topic-discovery': 'What\'s Hot',
        },
    },
};