import React, { useState, useMemo } from 'react';
import {
    Swords, TrendingUp, BarChart3, Users, Target, Award, Zap, Eye, Shield, Globe,
    ChevronDown, ChevronUp, AlertTriangle, ArrowRight, Sparkles, ExternalLink
} from 'lucide-react';

function getVisibilityData(domain) {
    try {
        const key = `searchlyst_visibility_${domain || 'default'}`;
        return JSON.parse(localStorage.getItem(key));
    } catch { return null; }
}

const threatColor = { high: 'text-red-400 bg-red-500/10', medium: 'text-yellow-400 bg-yellow-500/10', low: 'text-green-400 bg-green-500/10' };

export default function CompetitiveIntelPage({ user, onTabChange }) {
    const [activeTab, setActiveTab] = useState('sov');
    const scanData = useMemo(() => getVisibilityData(user?.domain), [user?.domain]);

    const compAnalysis = scanData?.competitorAnalysis || null;
    const compInsights = scanData?.competitorInsights || null;
    const sovData = compAnalysis?.shareOfVoice || scanData?.shareOfVoice || [];
    const rankings = compAnalysis?.industryRankingDetailed || scanData?.industryRanking || [];
    const sentiment = compAnalysis?.sentimentComparison || [];
    const threats = compAnalysis?.threatRadar || [];
    const gaps = scanData?.competitorGaps || [];
    const entityGraph = scanData?.entityGraph || [];

    const hasData = sovData.length > 0 || rankings.length > 0 || entityGraph.length > 0;

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-5">
                    <Swords className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No Competitive Data Yet</h2>
                <p className="text-[var(--text-secondary)] text-sm max-w-md mb-6">
                    Run an AI Visibility Scan to generate competitive intelligence data. The scan will analyze your competitors across all AI engines.
                </p>
                <button onClick={() => onTabChange?.('ai-visibility')} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
                    Run Scan <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    const tabs = [
        { id: 'sov', label: 'Share of Voice', icon: BarChart3 },
        { id: 'rankings', label: 'Rankings', icon: Award },
        { id: 'entities', label: 'Entity Map', icon: Globe },
        { id: 'gaps', label: 'Content Gaps', icon: Target },
        { id: 'sentiment', label: 'Sentiment', icon: Shield },
        { id: 'threats', label: 'Threats', icon: AlertTriangle },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Swords className="w-5 h-5 text-red-400" /> Competitive Intelligence
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-0.5">Live competitive data from your AI visibility scan</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-[var(--text-muted)] text-xs mb-1">Your SOV</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                        {sovData.find(s => s.brand === user?.brandName || s.name === user?.brandName)?.percentage || sovData[0]?.percentage || '--'}%
                    </p>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-[var(--text-muted)] text-xs mb-1">Entities Tracked</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{entityGraph.length}</p>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-[var(--text-muted)] text-xs mb-1">Content Gaps</p>
                    <p className="text-2xl font-bold text-orange-400">{gaps.length}</p>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-[var(--text-muted)] text-xs mb-1">Threats</p>
                    <p className="text-2xl font-bold text-yellow-400">{threats.length}</p>
                </div>
            </div>

            {/* Insights Banner */}
            {compInsights && (
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold text-[var(--text-primary)]">AI Insights</span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm whitespace-pre-line">{typeof compInsights === 'string' ? compInsights : compInsights.summary || JSON.stringify(compInsights).slice(0, 500)}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-1 overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-red-500/10 text-red-400' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                            <Icon className="w-3.5 h-3.5" /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
                {/* Share of Voice */}
                {activeTab === 'sov' && (
                    <div className="space-y-4">
                        <h3 className="text-[var(--text-primary)] font-semibold text-sm">Share of Voice Across AI Engines</h3>
                        {sovData.length > 0 ? (
                            <div className="space-y-3">
                                {sovData.map((item, i) => {
                                    const name = item.brand || item.name || `Brand ${i + 1}`;
                                    const pct = item.percentage || item.sov || 0;
                                    const isUser = name.toLowerCase() === (user?.brandName || '').toLowerCase();
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className={`text-sm w-32 truncate ${isUser ? 'text-red-400 font-bold' : 'text-[var(--text-secondary)]'}`}>{name}</span>
                                            <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-5 overflow-hidden">
                                                <div className={`h-full rounded-full ${isUser ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-purple-500/60 to-blue-500/60'}`}
                                                    style={{ width: `${Math.min(pct, 100)}%` }} />
                                            </div>
                                            <span className={`text-sm font-medium w-12 text-right ${isUser ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <p className="text-[var(--text-muted)] text-sm">No SOV data available from this scan</p>}
                    </div>
                )}

                {/* Rankings */}
                {activeTab === 'rankings' && (
                    <div className="space-y-4">
                        <h3 className="text-[var(--text-primary)] font-semibold text-sm">Industry Rankings</h3>
                        {(Array.isArray(rankings) ? rankings : []).length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-[var(--text-muted)] text-xs border-b border-[var(--border)]">
                                            <th className="text-left py-2 pr-4">Rank</th>
                                            <th className="text-left py-2 pr-4">Brand</th>
                                            <th className="text-left py-2 pr-4">Score</th>
                                            <th className="text-left py-2">Mentions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rankings.map((r, i) => {
                                            const isUser = (r.brand || r.name || '').toLowerCase() === (user?.brandName || '').toLowerCase();
                                            return (
                                                <tr key={i} className={`border-b border-[var(--border)] ${isUser ? 'bg-red-500/5' : ''}`}>
                                                    <td className="py-2.5 pr-4 font-bold text-[var(--text-primary)]">#{r.rank || i + 1}</td>
                                                    <td className={`py-2.5 pr-4 ${isUser ? 'text-red-400 font-semibold' : 'text-[var(--text-primary)]'}`}>{r.brand || r.name}</td>
                                                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{r.score || '--'}</td>
                                                    <td className="py-2.5 text-[var(--text-secondary)]">{r.mentions || r.totalMentions || '--'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-[var(--text-muted)] text-sm">No ranking data available</p>}
                    </div>
                )}

                {/* Entity Map */}
                {activeTab === 'entities' && (
                    <div className="space-y-4">
                        <h3 className="text-[var(--text-primary)] font-semibold text-sm">Entity Recognition Map</h3>
                        <p className="text-[var(--text-muted)] text-xs">Brands and entities detected across all AI engine responses</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {entityGraph.map((entity, i) => (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${entity.isTargetBrand ? 'border-red-500/30 bg-red-500/5' : entity.isCompetitor ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-[var(--border)]'}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-medium truncate ${entity.isTargetBrand ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>{entity.name}</p>
                                            {entity.isTargetBrand && <span className="text-[8px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded font-bold">YOU</span>}
                                            {entity.isCompetitor && <span className="text-[8px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-bold">COMP</span>}
                                        </div>
                                        <p className="text-[var(--text-muted)] text-[10px]">{entity.domain || ''}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{entity.totalMentions}</p>
                                        <p className="text-[10px] text-[var(--text-muted)]">{entity.queryCount} queries</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Gaps */}
                {activeTab === 'gaps' && (
                    <div className="space-y-4">
                        <h3 className="text-[var(--text-primary)] font-semibold text-sm">Content Opportunity Gaps</h3>
                        <p className="text-[var(--text-muted)] text-xs">Topics where competitors are mentioned but you aren't — write content here to close the gap</p>
                        {gaps.length > 0 ? (
                            <div className="space-y-2">
                                {gaps.map((gap, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-red-500/30 transition-colors">
                                        <Target className="w-4 h-4 text-orange-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-[var(--text-primary)] truncate">{gap.query || gap.topic || gap}</p>
                                            {gap.competitors && <p className="text-[10px] text-[var(--text-muted)]">Mentioned: {Array.isArray(gap.competitors) ? gap.competitors.join(', ') : gap.competitors}</p>}
                                        </div>
                                        <button onClick={() => {
                                            const topic = gap.query || gap.topic || gap;
                                            localStorage.setItem('searchlyst_content_prefill', topic);
                                            onTabChange?.('content-studio');
                                        }} className="text-[10px] px-2 py-1 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors whitespace-nowrap">
                                            Write About This →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-[var(--text-muted)] text-sm">No content gaps detected — great coverage!</p>}
                    </div>
                )}

                {/* Sentiment */}
                {activeTab === 'sentiment' && (
                    <div className="space-y-4">
                        <h3 className="text-[var(--text-primary)] font-semibold text-sm">Sentiment Comparison</h3>
                        {sentiment.length > 0 ? (
                            <div className="space-y-3">
                                {sentiment.map((s, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)]">
                                        <span className="text-sm font-medium text-[var(--text-primary)] w-28 truncate">{s.brand || s.name}</span>
                                        <div className="flex gap-1 flex-1">
                                            {s.positive > 0 && <div className="h-6 bg-green-500/60 rounded" style={{ width: `${s.positive}%` }} title={`Positive: ${s.positive}%`} />}
                                            {s.neutral > 0 && <div className="h-6 bg-gray-500/40 rounded" style={{ width: `${s.neutral}%` }} title={`Neutral: ${s.neutral}%`} />}
                                            {s.negative > 0 && <div className="h-6 bg-red-500/60 rounded" style={{ width: `${s.negative}%` }} title={`Negative: ${s.negative}%`} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-[var(--text-muted)] text-sm">Sentiment data from the scan's entity analysis</p>
                                {scanData?.sentiment && (
                                    <div className="flex justify-center gap-4 mt-4">
                                        {Object.entries(scanData.sentiment).map(([k, v]) => (
                                            <div key={k} className="text-center">
                                                <p className="text-lg font-bold text-[var(--text-primary)]">{typeof v === 'number' ? v : v.count || 0}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] capitalize">{k}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Threats */}
                {activeTab === 'threats' && (
                    <div className="space-y-4">
                        <h3 className="text-[var(--text-primary)] font-semibold text-sm">Threat Radar</h3>
                        {threats.length > 0 ? (
                            <div className="space-y-2">
                                {threats.map((t, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)]">
                                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${threatColor[t.level]?.split(' ')[0] || 'text-yellow-400'}`} />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-medium text-[var(--text-primary)]">{t.competitor || t.brand || t.name}</p>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${threatColor[t.level] || 'text-yellow-400 bg-yellow-500/10'}`}>{t.level || 'medium'}</span>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)]">{t.reason || t.description || 'Competitive threat detected'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-[var(--text-muted)] text-sm">No significant threats detected</p>}
                    </div>
                )}
            </div>
        </div>
    );
}