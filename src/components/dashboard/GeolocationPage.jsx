import React, { useState } from 'react';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';

const regions = [
    { name: 'North America', code: 'NA', citations: 15200, sentiment: 0.78, trend: '+12%', trendUp: true },
    { name: 'Europe', code: 'EU', citations: 9800, sentiment: 0.65, trend: '+8%', trendUp: true },
    { name: 'Asia Pacific', code: 'APAC', citations: 6500, sentiment: 0.72, trend: '+22%', trendUp: true },
    { name: 'Latin America', code: 'LATAM', citations: 3200, sentiment: 0.70, trend: '+5%', trendUp: true },
    { name: 'Middle East', code: 'MEA', citations: 1800, sentiment: 0.58, trend: '-3%', trendUp: false },
];

const topCountries = [
    { country: 'United States', citations: 12500, share: 33 },
    { country: 'United Kingdom', citations: 4200, share: 11 },
    { country: 'Germany', citations: 3100, share: 8 },
    { country: 'Australia', citations: 2800, share: 7 },
    { country: 'Canada', citations: 2700, share: 7 },
];

export default function GeolocationPage() {
    const [selectedRegion, setSelectedRegion] = useState(null);

    return (
        <div className="space-y-6">
            {/* Region Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {regions.map((region, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedRegion(region)}
                        className={`text-left rounded-xl p-4 border transition-all ${
                            selectedRegion?.code === region.code
                                ? 'bg-red-500/10 border-red-500/50'
                                : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:bg-[var(--border)]'
                        }`}
                    >
                        <p className="text-[var(--text-primary)] font-medium text-sm">{region.code}</p>
                        <p className="text-[var(--text-secondary)] text-xs mb-2">{region.name}</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{(region.citations / 1000).toFixed(1)}K</p>
                        <p className={`text-xs flex items-center gap-1 ${region.trendUp ? 'text-[var(--text-primary)]' : 'text-red-400'}`}>
                            {region.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {region.trend}
                        </p>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Countries */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="text-[var(--text-primary)] font-medium mb-4">Top Countries by Citations</h3>
                    <div className="space-y-3">
                        {topCountries.map((country, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-[var(--text-secondary)] text-sm w-4">{i + 1}</span>
                                <span className="text-[var(--text-primary)] text-sm flex-1">{country.country}</span>
                                <div className="w-24 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-red-500 rounded-full"
                                        style={{ width: `${country.share * 3}%` }}
                                    />
                                </div>
                                <span className="text-[var(--text-secondary)] text-sm w-16 text-right">
                                    {country.citations.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Regional Insights */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="text-[var(--text-primary)] font-medium mb-4">Regional Insights</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-[var(--surface-active)] border border-[var(--border)] rounded-lg">
                            <p className="text-[var(--text-primary)] text-sm font-medium">🚀 Fastest Growing</p>
                            <p className="text-[var(--text-primary)] mt-1">Asia Pacific (+22%)</p>
                            <p className="text-[var(--text-secondary)] text-xs mt-1">Strong momentum in Japan and Australia</p>
                        </div>
                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm font-medium">⚠️ Needs Attention</p>
                            <p className="text-[var(--text-primary)] mt-1">Middle East (-3%)</p>
                            <p className="text-[var(--text-secondary)] text-xs mt-1">Sentiment declining, consider localized content</p>
                        </div>
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm font-medium">💡 Opportunity</p>
                            <p className="text-[var(--text-primary)] mt-1">Latin America</p>
                            <p className="text-[var(--text-secondary)] text-xs mt-1">Low competition, high growth potential</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}