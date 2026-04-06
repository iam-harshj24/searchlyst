import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, LabelList
} from 'recharts';

const pipelineData = [
  { name: 'Jan', drafts: 140, published: 80 },
  { name: 'Feb', drafts: 220, published: 120 },
  { name: 'Mar', drafts: 200, published: 150 },
  { name: 'Apr', drafts: 300, published: 200 },
  { name: 'May', drafts: 350, published: 280 },
  { name: 'Jun', drafts: 420, published: 390 },
];

const platformData = [
  { name: 'Blog Posts', value: 500, color: '#f87171' },
  { name: 'Social Media', value: 300, color: '#fde047' },
  { name: 'Newsletters', value: 200, color: '#60a5fa' },
  { name: 'SEO Snippets', value: 150, color: '#34d399' },
];

const topicData = [
  { x: 10, y: 30, z: 200, name: 'AI Marketing', fill: '#f87171' },
  { x: 30, y: 50, z: 400, name: 'SaaS Growth', fill: '#60a5fa' },
  { x: 50, y: 20, z: 150, name: 'B2B Sales', fill: '#34d399' },
  { x: 70, y: 60, z: 250, name: 'SEO Tools', fill: '#fde047' },
  { x: 90, y: 40, z: 300, name: 'Web3', fill: '#c084fc' },
];

const powerUsers = [
  { id: 1, name: 'Alex Johnson', email: 'alex@example.com', payload: '14.2MB', tier: 'Pro', status: 'Active' },
  { id: 2, name: 'Samantha Lee', email: 'sam@ecommerce.co', payload: '9.8MB', tier: 'Enterprise', status: 'Active' },
  { id: 3, name: 'David Smith', email: 'david@startup.io', payload: '7.1MB', tier: 'Pro', status: 'Warning' },
  { id: 4, name: 'Maria Garcia', email: 'maria@agency.com', payload: '4.5MB', tier: 'Basic', status: 'Active' },
  { id: 5, name: 'James Wilson', email: 'james@dev.to', payload: '2.1MB', tier: 'Basic', status: 'Inactive' },
];

export default function AdminContentAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Content Intelligence
          </h2>
          <p className="text-gray-500 mt-1">Deep analytics on AI generation volume and platform distribution.</p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Content Generated', value: '1,150', trend: '+12.4%', color: 'from-blue-500 to-cyan-400' },
          { label: 'Conversion to Published', value: '48.2%', trend: '+4.1%', color: 'from-red-500 to-orange-400' },
          { label: 'Avg Payload per User', value: '4.2MB', trend: '+1.5%', color: 'from-emerald-500 to-teal-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
            <h3 className="text-gray-400 font-medium">{stat.label}</h3>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl font-bold text-white">{stat.value}</span>
              <span className="text-sm text-emerald-400 font-medium">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Chart */}
        <div className="lg:col-span-2 bg-[#1e1e2d] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Generation Pipeline</h3>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> Drafts</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-400" /> Published</div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDrafts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="drafts" stroke="#f87171" strokeWidth={3} fillOpacity={1} fill="url(#colorDrafts)" />
                <Area type="monotone" dataKey="published" stroke="#fb923c" strokeWidth={3} fillOpacity={1} fill="url(#colorPublished)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Platform Target</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {platformData.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-300">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Topic Clusters */}
        <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <h3 className="text-lg font-semibold text-white mb-6">Trending Topic Clusters</h3>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950/0 to-transparent pointer-events-none" />
          <div className="h-[300px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis type="number" dataKey="x" hide />
                <YAxis type="number" dataKey="y" hide />
                <ZAxis type="number" dataKey="z" range={[500, 3000]} />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl">
                          <p className="text-white font-medium">{data.name}</p>
                          <p className="text-gray-400 text-sm">Volume: {data.z}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Topics" data={topicData} fill="#8884d8">
                  <LabelList dataKey="name" position="top" fill="#9ca3af" fontSize={12} fontWeight="bold" offset={15} />
                  {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="animate-pulse" style={{ animationDuration: `${2 + index}s` }} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Power User Payload Tracker</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-sm">
                  <th className="py-3 px-4 font-medium">User</th>
                  <th className="py-3 px-4 font-medium">Tier</th>
                  <th className="py-3 px-4 font-medium">AI Payload</th>
                  <th className="py-3 px-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {powerUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.tier === 'Enterprise' ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' :
                        user.tier === 'Pro' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
                        'border-gray-600/30 bg-gray-600/10 text-gray-400'
                      }`}>
                        {user.tier}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300 font-mono text-sm">{user.payload}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        user.status === 'Active' ? 'text-emerald-400' : 
                        user.status === 'Warning' ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-emerald-400' : 
                          user.status === 'Warning' ? 'bg-orange-400' : 'bg-red-400'
                        }`} />
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
