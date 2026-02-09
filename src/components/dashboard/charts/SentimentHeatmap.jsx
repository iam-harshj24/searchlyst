import React, { useState } from 'react';

const generateHeatmapData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeks = ['W1', 'W2', 'W3', 'W4'];
    const data = [];
    
    weeks.forEach((week, weekIndex) => {
        days.forEach((day, dayIndex) => {
            const date = new Date();
            date.setDate(date.getDate() - (3 - weekIndex) * 7 - (6 - dayIndex));
            
            data.push({
                week,
                day,
                value: (Math.random() * 2 - 1).toFixed(2), // -1 to 1
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            });
        });
    });
    return data;
};

const data = generateHeatmapData();

const getSentimentColor = (value) => {
    const v = parseFloat(value);
    if (v <= -0.6) return 'bg-red-600';
    if (v <= -0.3) return 'bg-red-400';
    if (v < 0) return 'bg-red-300';
    if (v === 0) return 'bg-gray-400';
    if (v <= 0.3) return 'bg-green-300';
    if (v <= 0.6) return 'bg-green-400';
    return 'bg-green-600';
};

export default function SentimentHeatmap() {
    const [hoveredCell, setHoveredCell] = useState(null);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeks = ['W1', 'W2', 'W3', 'W4'];

    return (
        <div className="relative">
            {/* Days Header */}
            <div className="flex mb-2 ml-10">
                {days.map((day) => (
                    <div key={day} className="w-9 text-center text-xs text-gray-500">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="space-y-1">
                {weeks.map((week, weekIndex) => (
                    <div key={week} className="flex items-center">
                        <span className="w-8 text-xs text-gray-500 text-right mr-2">{week}</span>
                        <div className="flex gap-1">
                            {days.map((day, dayIndex) => {
                                const cellData = data.find(d => d.week === week && d.day === day);
                                const isHovered = hoveredCell?.week === week && hoveredCell?.day === day;
                                
                                return (
                                    <div
                                        key={day}
                                        className={`w-8 h-8 rounded cursor-pointer transition-all ${getSentimentColor(cellData?.value)} ${
                                            isHovered ? 'ring-2 ring-white scale-110' : ''
                                        }`}
                                        onMouseEnter={() => setHoveredCell(cellData)}
                                        onMouseLeave={() => setHoveredCell(null)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tooltip */}
            {hoveredCell && (
                <div className="absolute top-0 right-0 bg-[#1a1a2e] border border-white/10 rounded-lg p-3 shadow-xl z-10">
                    <p className="text-white text-sm font-medium">{hoveredCell.date}</p>
                    <p className={`text-sm ${parseFloat(hoveredCell.value) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        Sentiment: {hoveredCell.value}
                    </p>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-xs text-gray-500">Negative</span>
                <div className="flex gap-0.5">
                    <div className="w-4 h-4 bg-red-600 rounded-sm"></div>
                    <div className="w-4 h-4 bg-red-400 rounded-sm"></div>
                    <div className="w-4 h-4 bg-red-300 rounded-sm"></div>
                    <div className="w-4 h-4 bg-gray-400 rounded-sm"></div>
                    <div className="w-4 h-4 bg-green-300 rounded-sm"></div>
                    <div className="w-4 h-4 bg-green-400 rounded-sm"></div>
                    <div className="w-4 h-4 bg-green-600 rounded-sm"></div>
                </div>
                <span className="text-xs text-gray-500">Positive</span>
            </div>
        </div>
    );
}