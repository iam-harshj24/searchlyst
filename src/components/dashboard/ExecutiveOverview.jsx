import React from 'react';
import UnifiedScoreGauge from './charts/UnifiedScoreGauge';
import TimeSeriesComboChart from './charts/TimeSeriesComboChart';
import SOVDonutChart from './charts/SOVDonutChart';
import SentimentHeatmap from './charts/SentimentHeatmap';
import GlobalAlertMap from './charts/GlobalAlertMap';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ExecutiveOverview() {
    const quickStats = [
        { label: 'Total Citations', value: '24,580', change: '+12.3%', trend: 'up' },
        { label: 'Avg Sentiment', value: '0.72', change: '+0.08', trend: 'up' },
        { label: 'Hallucination Rate', value: '3.2%', change: '-1.1%', trend: 'down' },
        { label: 'Active Alerts', value: '7', change: '+2', trend: 'up', isAlert: true },
    ];

    return (
        <div className="space-y-6">
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickStats.map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-white">{stat.value}</span>
                            <span className={`text-sm flex items-center gap-1 ${
                                stat.isAlert ? 'text-amber-400' : 
                                stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                                {stat.isAlert ? <AlertTriangle className="w-3 h-3" /> :
                                 stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                                 <TrendingDown className="w-3 h-3" />}
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Unified Score Gauge */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">Unified Visibility Score</h3>
                    <UnifiedScoreGauge score={72} change={3.2} />
                </div>

                {/* SOV Donut Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">Share of Voice</h3>
                    <SOVDonutChart />
                </div>

                {/* Sentiment Heatmap */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">Sentiment Heatmap (4 Weeks)</h3>
                    <SentimentHeatmap />
                </div>
            </div>

            {/* Time Series Chart - Full Width */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Visibility Trend (90 Days)</h3>
                    <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-2 text-gray-400">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            Visibility Score
                        </span>
                        <span className="flex items-center gap-2 text-gray-400">
                            <span className="w-3 h-3 rounded bg-blue-500/50"></span>
                            Exposure (M)
                        </span>
                    </div>
                </div>
                <TimeSeriesComboChart />
            </div>

            {/* Global Alert Map */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Global Alert Map</h3>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">Citations</button>
                        <button className="px-3 py-1 text-xs bg-white/10 text-gray-400 rounded-full hover:bg-white/20">Sentiment</button>
                        <button className="px-3 py-1 text-xs bg-white/10 text-gray-400 rounded-full hover:bg-white/20">Threats</button>
                    </div>
                </div>
                <GlobalAlertMap />
            </div>
        </div>
    );
}