import React, { useState } from 'react';

const attributes = [
    { name: 'Innovative', sentiment: 'positive', strength: 85, x: 20, y: 20 },
    { name: 'Reliable', sentiment: 'positive', strength: 78, x: 80, y: 15 },
    { name: 'User-Friendly', sentiment: 'positive', strength: 72, x: 15, y: 50 },
    { name: 'Secure', sentiment: 'positive', strength: 68, x: 85, y: 45 },
    { name: 'Scalable', sentiment: 'positive', strength: 65, x: 25, y: 80 },
    { name: 'Expensive', sentiment: 'negative', strength: 45, x: 75, y: 75 },
    { name: 'Complex', sentiment: 'negative', strength: 32, x: 60, y: 90 },
    { name: 'Enterprise', sentiment: 'neutral', strength: 58, x: 40, y: 10 },
    { name: 'Cloud-based', sentiment: 'neutral', strength: 52, x: 90, y: 60 },
    { name: 'AI-powered', sentiment: 'positive', strength: 70, x: 10, y: 70 },
];

const competitors = [
    { name: 'Competitor A', x: 35, y: 35 },
    { name: 'Competitor B', x: 65, y: 35 },
    { name: 'Competitor C', x: 35, y: 65 },
    { name: 'Competitor D', x: 65, y: 65 },
];

const getSentimentColor = (sentiment) => {
    switch(sentiment) {
        case 'positive': return '#10B981';
        case 'negative': return '#EF4444';
        default: return '#6B7280';
    }
};

export default function AttributeNetwork() {
    const [hoveredAttribute, setHoveredAttribute] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('all');

    const filteredAttributes = attributes.filter(attr => 
        selectedFilter === 'all' || attr.sentiment === selectedFilter
    );

    return (
        <div>
            {/* Filters */}
            <div className="flex gap-2 mb-4">
                {['all', 'positive', 'negative', 'neutral'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                            selectedFilter === filter 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <div className="relative h-80 bg-[#0d0d15] rounded-xl overflow-hidden">
                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full">
                    {filteredAttributes.map((attr, i) => (
                        <line
                            key={i}
                            x1="50%"
                            y1="50%"
                            x2={`${attr.x}%`}
                            y2={`${attr.y}%`}
                            stroke={getSentimentColor(attr.sentiment)}
                            strokeWidth={attr.strength / 30}
                            strokeOpacity={hoveredAttribute === attr.name ? 0.8 : 0.2}
                            className="transition-all"
                        />
                    ))}
                    {competitors.map((comp, i) => (
                        <line
                            key={`comp-${i}`}
                            x1="50%"
                            y1="50%"
                            x2={`${comp.x}%`}
                            y2={`${comp.y}%`}
                            stroke="#6B7280"
                            strokeWidth={1}
                            strokeOpacity={0.3}
                            strokeDasharray="4 4"
                        />
                    ))}
                </svg>

                {/* Center Node - Your Brand */}
                <div 
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 z-10"
                >
                    <span className="text-white text-xs font-bold text-center">Your<br/>Brand</span>
                </div>

                {/* Competitor Nodes */}
                {competitors.map((comp, i) => (
                    <div
                        key={i}
                        className="absolute w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
                        style={{ 
                            left: `${comp.x}%`, 
                            top: `${comp.y}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <span className="text-white text-[10px] font-medium">{comp.name.split(' ')[1]}</span>
                    </div>
                ))}

                {/* Attribute Nodes */}
                {filteredAttributes.map((attr, i) => (
                    <div
                        key={i}
                        className={`absolute rounded-full flex items-center justify-center cursor-pointer transition-all ${
                            hoveredAttribute === attr.name ? 'scale-125 z-20' : 'z-10'
                        }`}
                        style={{ 
                            left: `${attr.x}%`, 
                            top: `${attr.y}%`,
                            transform: 'translate(-50%, -50%)',
                            width: Math.max(24, attr.strength / 3) + 'px',
                            height: Math.max(24, attr.strength / 3) + 'px',
                            backgroundColor: getSentimentColor(attr.sentiment) + '40',
                            border: `2px solid ${getSentimentColor(attr.sentiment)}`,
                        }}
                        onMouseEnter={() => setHoveredAttribute(attr.name)}
                        onMouseLeave={() => setHoveredAttribute(null)}
                    >
                        {hoveredAttribute === attr.name && (
                            <div className="absolute bottom-full mb-2 bg-[#1a1a2e] border border-white/10 rounded-lg p-2 shadow-xl whitespace-nowrap z-30">
                                <p className="text-white text-sm font-medium">{attr.name}</p>
                                <p className={`text-xs capitalize ${
                                    attr.sentiment === 'positive' ? 'text-emerald-400' :
                                    attr.sentiment === 'negative' ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                    {attr.sentiment} • Strength: {attr.strength}%
                                </p>
                            </div>
                        )}
                    </div>
                ))}

                {/* Labels for visible attributes */}
                {filteredAttributes.map((attr, i) => (
                    <span
                        key={`label-${i}`}
                        className="absolute text-[10px] text-gray-400 pointer-events-none"
                        style={{ 
                            left: `${attr.x}%`, 
                            top: `${attr.y + 5}%`,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        {attr.name}
                    </span>
                ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 text-xs">
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-gray-400">Positive</span>
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-gray-400">Negative</span>
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                    <span className="text-gray-400">Neutral</span>
                </span>
            </div>
        </div>
    );
}