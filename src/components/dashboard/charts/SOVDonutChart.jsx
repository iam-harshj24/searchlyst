import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

const data = [
    { name: 'Google SEO', value: 40, color: '#3B82F6', citations: '32,400', trend: '+8%', topQuery: 'best CRM software' },
    { name: 'ChatGPT', value: 25, color: '#10A37F', citations: '15,200', trend: '+12%', topQuery: 'CRM for startups' },
    { name: 'Gemini', value: 15, color: '#8E75B2', citations: '9,100', trend: '+18%', topQuery: 'enterprise CRM' },
    { name: 'Perplexity', value: 10, color: '#FF6B35', citations: '6,080', trend: '+25%', topQuery: 'CRM comparison' },
    { name: 'Claude', value: 5, color: '#D4A574', citations: '3,040', trend: '+15%', topQuery: 'CRM features' },
    { name: 'Others', value: 5, color: '#6B7280', citations: '3,040', trend: '+5%', topQuery: 'various' },
];

const totalSOV = 62;

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    
    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 10}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
        </g>
    );
};

export default function SOVDonutChart() {
    const [activeIndex, setActiveIndex] = useState(null);

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(null);
    };

    const activeData = activeIndex !== null ? data[activeIndex] : null;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{totalSOV}%</span>
                    <span className="text-xs text-gray-400">Total SOV</span>
                </div>
            </div>

            {/* Hover Info */}
            {activeData && (
                <div className="w-full mt-2 p-3 bg-white/5 rounded-lg border border-white/10 text-center">
                    <p className="text-white font-medium">{activeData.name}</p>
                    <p className="text-gray-400 text-sm">{activeData.citations} monthly citations</p>
                    <p className="text-emerald-400 text-sm">{activeData.trend} MoM</p>
                    <p className="text-gray-500 text-xs mt-1">Top: "{activeData.topQuery}"</p>
                </div>
            )}

            {/* Legend */}
            <div className="w-full mt-4 grid grid-cols-2 gap-2">
                {data.map((item, i) => (
                    <div 
                        key={i} 
                        className={`flex items-center gap-2 text-xs cursor-pointer p-1 rounded transition-colors ${
                            activeIndex === i ? 'bg-white/10' : ''
                        }`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-400">{item.name}</span>
                        <span className="text-white ml-auto">{item.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}