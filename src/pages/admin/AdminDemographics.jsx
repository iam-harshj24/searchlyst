import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, Cell, LabelList, ZAxis
} from 'recharts';

const socialData = [
  { name: 'SaaS', LinkedIn: 85, Twitter: 65, Reddit: 40 },
  { name: 'E-commerce', LinkedIn: 40, Twitter: 80, Reddit: 60 },
  { name: 'Agencies', LinkedIn: 95, Twitter: 50, Reddit: 20 },
  { name: 'Finance', LinkedIn: 90, Twitter: 40, Reddit: 15 },
  { name: 'Crypto', LinkedIn: 30, Twitter: 95, Reddit: 85 },
];

const competitorNodes = [
  { x: 20, y: 80, volume: 400, name: 'OpenAI', group: 1 },
  { x: 35, y: 70, volume: 250, name: 'Anthropic', group: 1 },
  { x: 45, y: 85, volume: 300, name: 'Jasper', group: 2 },
  { x: 60, y: 55, volume: 200, name: 'Copy.ai', group: 2 },
  { x: 75, y: 75, volume: 150, name: 'Writesonic', group: 2 },
  { x: 50, y: 30, volume: 350, name: 'Midjourney', group: 3 },
  { x: 80, y: 20, volume: 100, name: 'Stability', group: 3 },
];

const colors = {
  1: '#f87171', // Red
  2: '#60a5fa', // Blue
  3: '#c084fc', // Purple
};

const industrySizes = [
  { industry: 'B2B SaaS', series: ['1-10', '11-50', '51-200', '200+'], values: [40, 75, 30, 10] },
  { industry: 'E-commerce', series: ['1-10', '11-50', '51-200', '200+'], values: [60, 45, 15, 5] },
  { industry: 'Agencies', series: ['1-10', '11-50', '51-200', '200+'], values: [80, 20, 5, 0] },
];

export default function AdminDemographics() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Firmographics Deep Dive
          </h2>
          <p className="text-gray-500 mt-1">Cross-analyzing project industries, targeting, and competitor networks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Heatmap / Breakdown */}
        <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
          <h3 className="text-lg font-semibold text-white mb-6 relative z-10">Industry vs Company Size</h3>
          <div className="space-y-6 relative z-10">
            {industrySizes.map((row, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300 font-medium">{row.industry}</span>
                </div>
                <div className="flex gap-1 h-8 rounded-full overflow-hidden bg-gray-800 p-1">
                  {row.values.map((val, vIdx) => {
                    const total = row.values.reduce((a, b) => a + b, 0);
                    const percent = (val / total) * 100;
                    if (percent === 0) return null;
                    const bgs = ['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500'];
                    return (
                      <div 
                        key={vIdx} 
                        style={{ width: `${percent}%` }} 
                        className={`${bgs[vIdx]} h-full first:rounded-l-full last:rounded-r-full relative group cursor-pointer`}
                      >
                        {/* Custom Tooltip on hover */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg border border-gray-700">
                          {row.series[vIdx]} emp: {val} projects
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-gray-400">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-pink-500"/> 1-10 emp</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-purple-500"/> 11-50 emp</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-indigo-500"/> 51-200 emp</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500"/> 200+ emp</div>
            </div>
          </div>
        </div>

        {/* Competitor Node Graph (Simulated via Scatter) */}
        <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Competitor Network</h3>
          <p className="text-sm text-gray-500 mb-6">Top tracked competitors clustered by overlapping projects.</p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis type="number" dataKey="x" hide domain={[0, 100]} />
                <YAxis type="number" dataKey="y" hide domain={[0, 100]} />
                <ZAxis type="number" dataKey="volume" range={[200, 1500]} />
                <Scatter name="Competitors" data={competitorNodes}>
                  <LabelList dataKey="name" position="bottom" fill="#9ca3af" fontSize={12} fontWeight="bold" offset={10} />
                  {competitorNodes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[entry.group]} opacity={0.8} />
                  ))}
                </Scatter>
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-800 border-l-4 border-purple-500 p-3 rounded-lg shadow-xl">
                          <p className="text-white font-bold">{data.name}</p>
                          <p className="text-gray-400 text-xs mt-1">Tracked by {data.volume} projects</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h3 className="text-lg font-semibold text-white mb-6">Social Platform Saturation by Industry</h3>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={socialData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
              <RechartsTooltip 
                cursor={{ fill: '#1f2937' }} 
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="LinkedIn" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="Twitter" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="Reddit" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
