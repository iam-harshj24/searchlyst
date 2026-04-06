import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ShieldAlert, DatabaseZap, Globe2, Cpu } from 'lucide-react';

const latencyData = [
  { time: '00:00', latency: 45 },
  { time: '04:00', latency: 50 },
  { time: '08:00', latency: 125 }, // Spike
  { time: '12:00', latency: 40 },
  { time: '16:00', latency: 60 },
  { time: '20:00', latency: 200 }, // Spike
  { time: '24:00', latency: 45 },
];

const statusData = [
  { name: 'Success', value: 8520, color: '#34d399' },
  { name: 'Pending', value: 1240, color: '#fbbf24' },
  { name: 'Error', value: 345, color: '#ef4444' },
];

const errorLogs = [
  { id: 1, type: 'CRAWLER_BLOCKED', count: 142, lastOccurred: '2 mins ago', domain: 'linkedin.com' },
  { id: 2, type: 'TIMEOUT_504', count: 89, lastOccurred: '15 mins ago', domain: 'api.openai.com' },
  { id: 3, type: 'RATE_LIMIT_429', count: 56, lastOccurred: '1 hour ago', domain: 'twitter.com' },
  { id: 4, type: 'PARSE_JSON_FAIL', count: 34, lastOccurred: '3 hours ago', domain: 'internal-scraper' },
  { id: 5, type: 'DB_CONNECTION_DROP', count: 2, lastOccurred: '12 hours ago', domain: 'postgres-main' },
];

export default function AdminTelemetry() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400">
            System Telemetry
          </h2>
          <p className="text-gray-500 mt-1">Live metrics from AuditJobs and VisibilityScans crawling engines.</p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Systems Operational
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          { label: 'Active Crawlers', icon: Globe2, value: '24', color: 'blue' },
          { label: 'Avg Latency', icon: DatabaseZap, value: '62ms', color: 'emerald' },
          { label: 'Job Queue Size', icon: Cpu, value: '1,240', color: 'amber' },
          { label: 'Critical Errors', icon: ShieldAlert, value: '3', color: 'red' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                <Icon className={`w-6 h-6 text-${stat.color}-500`} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Plot */}
        <div className="lg:col-span-2 bg-[#1e1e2d] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <h3 className="text-lg font-semibold text-white mb-6">24hr Latency Spikes (ms)</h3>
          <div className="absolute inset-0 bg-red-500/5 blur-[100px] pointer-events-none" />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="time" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#111827' }} 
                  activeDot={{ r: 6, fill: '#ef4444' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Global Job Status</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {statusData.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-gray-800/50 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                  <span className="text-gray-300 font-medium">{item.name}</span>
                </div>
                <span className="text-white">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Dictionary Table */}
      <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl overflow-hidden mt-6">
        <h3 className="text-lg font-semibold text-white mb-6">Aggregated Error Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-sm">
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Error Signature</th>
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Affected Domain</th>
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Frequency</th>
                <th className="py-3 px-4 font-medium uppercase tracking-wider text-right">Last Occurred</th>
              </tr>
            </thead>
            <tbody>
              {errorLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-4 font-mono text-red-400 text-sm">{log.type}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm">{log.domain}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden max-w-[100px]">
                        <div className="h-full bg-orange-500" style={{ width: `${(log.count / 150) * 100}%` }} />
                      </div>
                      <span className="text-white text-sm">{log.count}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-gray-500 text-sm">{log.lastOccurred}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
