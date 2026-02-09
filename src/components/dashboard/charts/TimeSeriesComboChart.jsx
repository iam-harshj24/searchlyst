import React from 'react';
import { 
    ComposedChart, 
    Line, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

const generateData = () => {
    const data = [];
    const startDate = new Date('2024-11-01');
    
    for (let i = 0; i < 90; i += 7) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        let score = 65 + Math.random() * 15;
        let exposure = 1.2 + Math.random() * 0.8;
        
        // Add events
        if (i === 14) { score -= 8; } // Google update dip
        if (i === 35) { score += 5; } // ChatGPT refresh boost
        if (i === 63) { score += 7; } // FAQ Schema boost
        
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: Math.round(score),
            exposure: parseFloat(exposure.toFixed(2)),
            event: i === 14 ? 'Google Core Update' : 
                   i === 35 ? 'ChatGPT Refresh' : 
                   i === 63 ? 'FAQ Schema Added' : null
        });
    }
    return data;
};

const data = generateData();

const events = [
    { date: 'Nov 15', label: 'Google Core Update', color: '#EF4444' },
    { date: 'Dec 6', label: 'ChatGPT Refresh', color: '#3B82F6' },
    { date: 'Jan 3', label: 'FAQ Schema Added', color: '#10B981' },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const eventData = payload[0]?.payload?.event;
        return (
            <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 shadow-xl">
                <p className="text-white font-medium mb-1">{label}</p>
                <p className="text-blue-400 text-sm">Score: {payload[0]?.value}</p>
                <p className="text-blue-300 text-sm">Exposure: {payload[1]?.value}M</p>
                {eventData && (
                    <p className="text-amber-400 text-xs mt-1 border-t border-white/10 pt-1">
                        📅 {eventData}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default function TimeSeriesComboChart() {
    return (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        axisLine={{ stroke: '#ffffff10' }}
                    />
                    <YAxis 
                        yAxisId="left"
                        domain={[0, 100]}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        axisLine={{ stroke: '#ffffff10' }}
                    />
                    <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 3]}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        axisLine={{ stroke: '#ffffff10' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Event Reference Lines */}
                    {events.map((event, i) => (
                        <ReferenceLine 
                            key={i}
                            x={event.date} 
                            stroke={event.color} 
                            strokeDasharray="5 5"
                            yAxisId="left"
                        />
                    ))}
                    
                    <Bar 
                        yAxisId="right"
                        dataKey="exposure" 
                        fill="#3B82F6" 
                        fillOpacity={0.3}
                        radius={[4, 4, 0, 0]}
                    />
                    <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: '#3B82F6' }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
            
            {/* Event Legend */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {events.map((event, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-4 border-t-2 border-dashed" style={{ borderColor: event.color }}></span>
                        {event.label}
                    </div>
                ))}
            </div>
        </div>
    );
}