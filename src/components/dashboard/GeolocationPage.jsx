import React, { useState } from 'react';
import { Globe, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const regions = [
    { name: 'North America', code: 'NA', citations: 12500, sentiment: 0.75, sov: 42, threats: 2, x: '22%', y: '35%' },
    { name: 'Europe', code: 'EU', citations: 8200, sentiment: 0.62, sov: 35, threats: 3, x: '48%', y: '28%' },
    { name: 'Asia Pacific', code: 'APAC', citations: 5800, sentiment: 0.68, sov: 28, threats: 1, x: '75%', y: '42%' },
    { name: 'Latin America', code: 'LATAM', citations: 2100, sentiment: 0.71, sov: 45, threats: 0, x: '28%', y: '62%' },
    { name: 'Middle East', code: 'MEA', citations: 1200, sentiment: 0.58, sov: 22, threats: 2, x: '55%', y: '45%' },
];

const marketRadarData = [
    { market: 'USA', aiSov: 45, sentiment: 78, backlinks: 85, entityRich: 72, competitive: 65 },
    { market: 'Germany', aiSov: 35, sentiment: 62, backlinks: 70, entityRich: 55, competitive: 80 },
    { market: 'Japan', aiSov: 28, sentiment: 70, backlinks: 45, entityRich: 40, competitive: 55 },
    { market: 'UK', aiSov: 40, sentiment: 75, backlinks: 78, entityRich: 68, competitive: 70 },
    { market: 'Australia', aiSov: 38, sentiment: 72, backlinks: 65, entityRich: 60, competitive: 50 },
    { market: 'Brazil', aiSov: 32, sentiment: 68, backlinks: 40, entityRich: 35, competitive: 45 },
];

export default function GeolocationPage() {
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [activeLayer, setActiveLayer] = useState('citations');

    return (
        <div className="space-y-6">
            {/* Map Visualization */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-400" />
                        Global Visibility Map
                    </h3>
                    <div className="flex gap-2">
                        {['citations', 'sentiment', 'threats'].map((layer) => (
                            <button
                                key={layer}
                                onClick={() => setActiveLayer(layer)}
                                className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                                    activeLayer === layer
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                }`}
                            >
                                {layer}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative h-80 bg-[#0d0d15] rounded-xl overflow-hidden">
                    {/* Simplified World Map */}
                    <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full opacity-20">
                        <path d="M15,18 Q28,12 38,20 L35,32 Q22,36 15,28 Z" fill="#3B82F6" />
                        <path d="M42,15 Q55,10 60,22 L55,32 Q45,30 42,22 Z" fill="#3B82F6" />
                        <path d="M62,18 Q78,12 88,28 L82,40 Q68,42 62,32 Z" fill="#3B82F6" />
                        <path d="M22,38 Q32,40 30,46 L24,46 Z" fill="#3B82F6" />
                    </svg>

                    {/* Region Markers */}
                    {regions.map((region, i) => (
                        <div
                            key={i}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                            style={{ left: region.x, top: region.y }}
                            onClick={() => setSelectedRegion(region)}
                        >
                            <div 
                                className={`rounded-full transition-all ${
                                    selectedRegion?.code === region.code ? 'scale-150' : ''
                                }`}
                                style={{ 
                                    width: activeLayer === 'citations' ? Math.max(16, region.citations / 800) + 'px' : '20px',
                                    height: activeLayer === 'citations' ? Math.max(16, region.citations / 800) + 'px' : '20px',
                                    backgroundColor: activeLayer === 'sentiment' 
                                        ? `rgba(${region.sentiment > 0.7 ? '16,185,129' : region.sentiment > 0.6 ? '245,158,11' : '239,68,68'}, 0.8)`
                                        : activeLayer === 'threats' && region.threats > 0
                                            ? 'rgba(239,68,68,0.8)'
                                            : 'rgba(59,130,246,0.8)',
                                    boxShadow: `0 0 20px ${activeLayer === 'citations' ? 'rgba(59,130,246,0.5)' : activeLayer === 'sentiment' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`
                                }}
                            >
                                {activeLayer === 'threats' && region.threats > 0 && (
                                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                        {region.threats}
                                    </span>
                                )}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 shadow-xl whitespace-nowrap">
                                    <p className="text-white font-medium">{region.name}</p>
                                    <p className="text-blue-400 text-xs">{region.citations.toLocaleString()} citations</p>
                                    <p className={`text-xs ${region.sentiment >= 0.7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        Sentiment: {(region.sentiment * 100).toFixed(0)}%
                                    </p>
                                    <p className="text-gray-400 text-xs">SOV: {region.sov}%</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Region Stats */}
                <div className="grid grid-cols-5 gap-4 mt-4">
                    {regions.map((region, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedRegion(region)}
                            className={`p-3 rounded-lg text-center transition-all ${
                                selectedRegion?.code === region.code
                                    ? 'bg-blue-500/20 border border-blue-500/50'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <p className="text-white font-medium text-sm">{region.code}</p>
                            <p className="text-gray-400 text-xs">{region.citations.toLocaleString()}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Market Radar Charts */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    Market Performance Radar
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {marketRadarData.map((market, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-4">
                            <p className="text-white font-medium text-sm text-center mb-2">{market.market}</p>
                            <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={[
                                        { axis: 'AI SOV', value: market.aiSov },
                                        { axis: 'Sentiment', value: market.sentiment },
                                        { axis: 'Backlinks', value: market.backlinks },
                                        { axis: 'Entity', value: market.entityRich },
                                        { axis: 'Competitive', value: market.competitive },
                                    ]}>
                                        <PolarGrid stroke="#ffffff10" />
                                        <PolarAngleAxis dataKey="axis" tick={{ fill: '#6B7280', fontSize: 8 }} />
                                        <Radar
                                            dataKey="value"
                                            stroke="#3B82F6"
                                            fill="#3B82F6"
                                            fillOpacity={0.3}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    market.aiSov > 35 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                    SOV: {market.aiSov}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}