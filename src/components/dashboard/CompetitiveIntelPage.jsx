import React from 'react';
import {
    Swords, Lock, Bell, TrendingUp, BarChart3, Users,
    Target, Award, Zap, Eye, Shield, Globe
} from 'lucide-react';

// Blurred mock data for the preview behind the Coming Soon overlay
const mockSOVData = [
    { name: 'Your Brand', sov: 28 },
    { name: 'Competitor A', sov: 22 },
    { name: 'Competitor B', sov: 18 },
    { name: 'Competitor C', sov: 15 },
    { name: 'Competitor D', sov: 12 },
    { name: 'Others', sov: 5 },
];

const features = [
    { icon: BarChart3, title: 'Share of Voice', desc: 'Compare your brand visibility against all competitors in real-time' },
    { icon: Award, title: 'Industry Rankings', desc: 'See where you rank in your industry across all AI search engines' },
    { icon: Target, title: 'Threat Radar', desc: 'Monitor competitor moves and identify emerging threats early' },
    { icon: Shield, title: 'Sentiment Comparison', desc: 'Compare brand sentiment and positioning across competitors' },
    { icon: TrendingUp, title: 'Trend Analysis', desc: 'Track visibility trends over time with weekly and monthly reports' },
    { icon: Globe, title: 'Market Intelligence', desc: 'Deep insights into competitor strategies and market positioning' },
];

export default function CompetitiveIntelPage({ user }) {
    return (
        <div className="relative min-h-[80vh]">
            {/* Blurred Preview Background */}
            <div className="coming-soon-blur absolute inset-0">
                <div className="space-y-6">
                    {/* Fake header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Competitive Intelligence</h2>
                            <p className="text-[var(--text-secondary)] text-sm mt-1">Monitor competitor activity across AI search engines</p>
                        </div>
                    </div>

                    {/* Fake KPI cards */}
                    <div className="grid grid-cols-4 gap-4">
                        {['Share of Voice', 'Industry Rank', 'Competitors Tracked', 'Threat Level'].map((label, i) => (
                            <div key={i} className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
                                <p className="text-[var(--text-muted)] text-xs mb-2">{label}</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{['28%', '#3', '12', 'Medium'][i]}</p>
                            </div>
                        ))}
                    </div>

                    {/* Fake SOV chart */}
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)]">
                        <h3 className="text-[var(--text-primary)] font-semibold mb-4">Share of Voice</h3>
                        <div className="space-y-3">
                            {mockSOVData.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-[var(--text-secondary)] text-sm w-28">{item.name}</span>
                                    <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-purple-500"
                                            style={{ width: `${item.sov}%` }}
                                        />
                                    </div>
                                    <span className="text-[var(--text-primary)] text-sm font-medium w-10 text-right">{item.sov}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="glass rounded-2xl p-10 max-w-lg w-full text-center shadow-2xl fade-in-up">
                    {/* Lock icon with animated gradient ring */}
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-indigo-500 animate-spin" style={{ animationDuration: '4s' }} />
                        <div className="absolute inset-[3px] rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                            <Lock className="w-8 h-8 text-purple-400" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold gradient-text mb-2">Coming Soon</h2>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Competitive Intelligence</h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                        We're building a powerful competitive analysis engine that will help you understand your market position across AI search engines.
                    </p>

                    {/* Feature preview grid */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div key={i} className={`text-left p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] fade-in-up stagger-${i + 1}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className="w-3.5 h-3.5 text-red-400" />
                                        <span className="text-[var(--text-primary)] text-xs font-medium">{feature.title}</span>
                                    </div>
                                    <p className="text-[var(--text-muted)] text-[10px] leading-relaxed">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* CTA */}
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-xl font-medium text-sm hover-scale shadow-lg shadow-red-500/20 transition-all">
                        <Bell className="w-4 h-4" />
                        Get Notified When Ready
                    </button>
                    <p className="text-[var(--text-muted)] text-[10px] mt-3">We'll email you as soon as this feature launches</p>
                </div>
            </div>
        </div>
    );
}