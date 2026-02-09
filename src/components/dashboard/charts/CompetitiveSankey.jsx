import React from 'react';

const queryClusters = [
    { name: 'Product Comparisons', volume: 35, color: '#3B82F6' },
    { name: 'Pricing Queries', volume: 25, color: '#10B981' },
    { name: 'Feature Questions', volume: 20, color: '#8E75B2' },
    { name: 'Reviews & Ratings', volume: 12, color: '#F59E0B' },
    { name: 'How-to Guides', volume: 8, color: '#EF4444' },
];

const engines = [
    { name: 'ChatGPT', share: 40, color: '#10A37F' },
    { name: 'Gemini', share: 25, color: '#8E75B2' },
    { name: 'Perplexity', share: 20, color: '#FF6B35' },
    { name: 'Claude', share: 15, color: '#D4A574' },
];

const brands = [
    { name: 'Your Brand', share: 35, color: '#3B82F6', isYours: true },
    { name: 'Competitor A', share: 25, color: '#6B7280' },
    { name: 'Competitor B', share: 20, color: '#4B5563' },
    { name: 'Competitor C', share: 12, color: '#374151' },
    { name: 'Others', share: 8, color: '#1F2937' },
];

export default function CompetitiveSankey() {
    return (
        <div className="relative h-80">
            {/* Simplified Flow Visualization */}
            <div className="flex items-stretch h-full gap-4">
                {/* Query Clusters */}
                <div className="flex flex-col justify-around w-1/3">
                    <span className="text-xs text-gray-500 mb-2 text-center">Query Clusters</span>
                    {queryClusters.map((cluster, i) => (
                        <div 
                            key={i}
                            className="relative group cursor-pointer"
                            style={{ flex: cluster.volume }}
                        >
                            <div 
                                className="h-full rounded-l-lg flex items-center px-3 transition-all hover:opacity-80"
                                style={{ backgroundColor: cluster.color + '40', borderLeft: `4px solid ${cluster.color}` }}
                            >
                                <span className="text-xs text-white truncate">{cluster.name}</span>
                            </div>
                            <div className="absolute left-full top-1/2 w-16 h-px bg-gradient-to-r from-white/20 to-transparent" />
                        </div>
                    ))}
                </div>

                {/* AI Engines */}
                <div className="flex flex-col justify-around w-1/3">
                    <span className="text-xs text-gray-500 mb-2 text-center">AI Engines</span>
                    {engines.map((engine, i) => (
                        <div 
                            key={i}
                            className="relative group cursor-pointer"
                            style={{ flex: engine.share }}
                        >
                            <div 
                                className="h-full rounded flex items-center justify-center px-2 transition-all hover:opacity-80"
                                style={{ backgroundColor: engine.color + '40' }}
                            >
                                <span className="text-xs text-white">{engine.name}</span>
                                <span className="text-xs text-gray-400 ml-1">({engine.share}%)</span>
                            </div>
                            <div className="absolute left-0 top-1/2 w-4 h-px bg-gradient-to-l from-white/20 to-transparent -translate-x-4" />
                            <div className="absolute right-0 top-1/2 w-4 h-px bg-gradient-to-r from-white/20 to-transparent translate-x-4" />
                        </div>
                    ))}
                </div>

                {/* Brand Citations */}
                <div className="flex flex-col justify-around w-1/3">
                    <span className="text-xs text-gray-500 mb-2 text-center">Brand Citations</span>
                    {brands.map((brand, i) => (
                        <div 
                            key={i}
                            className="relative group cursor-pointer"
                            style={{ flex: brand.share }}
                        >
                            <div 
                                className={`h-full rounded-r-lg flex items-center justify-end px-3 transition-all hover:opacity-80 ${
                                    brand.isYours ? 'ring-2 ring-blue-500/50' : ''
                                }`}
                                style={{ backgroundColor: brand.color + '40', borderRight: `4px solid ${brand.color}` }}
                            >
                                <span className={`text-xs ${brand.isYours ? 'text-blue-400 font-medium' : 'text-white'}`}>
                                    {brand.name}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">({brand.share}%)</span>
                            </div>
                            <div className="absolute right-full top-1/2 w-16 h-px bg-gradient-to-l from-white/20 to-transparent" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 text-xs text-gray-400 pt-4 border-t border-white/5 mt-4">
                <span>Flow thickness = citation volume</span>
                <span className="text-blue-400">■ Your Brand</span>
                <span>■ Competitors</span>
            </div>
        </div>
    );
}