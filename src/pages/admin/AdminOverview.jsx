import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { 
  Users, FolderGit2, FileText, List, TrendingUp, Activity, 
  Server, Cpu, Database, Globe, DollarSign, ArrowUpRight, 
  ArrowDownRight, Zap, Target, ShieldCheck, HardDrive
} from 'lucide-react';
import { 
  ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Bar, Line, PieChart, Pie, Cell, 
  Legend, Scatter
} from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// Advanced Mock Datasets for visually dense UI
const sparklineData = [
  { val: 12 }, { val: 24 }, { val: 18 }, { val: 32 }, { val: 28 }, { val: 45 }, { val: 56 }
];
const sparklineDataAlt = [
  { val: 56 }, { val: 40 }, { val: 45 }, { val: 30 }, { val: 22 }, { val: 35 }, { val: 12 }
];

const mainAnalyticsData = [
  { name: 'Jan', revenue: 12400, mrr: 8400, users: 400, serverLoad: 24 },
  { name: 'Feb', revenue: 15600, mrr: 9200, users: 550, serverLoad: 28 },
  { name: 'Mar', revenue: 11200, mrr: 11000, users: 700, serverLoad: 35 },
  { name: 'Apr', revenue: 18300, mrr: 13500, users: 1100, serverLoad: 48 },
  { name: 'May', revenue: 23400, mrr: 16800, users: 1800, serverLoad: 60 },
  { name: 'Jun', revenue: 21000, mrr: 18900, users: 2400, serverLoad: 55 },
  { name: 'Jul', revenue: 28500, mrr: 21500, users: 3100, serverLoad: 72 },
  { name: 'Aug', revenue: 32400, mrr: 24800, users: 3900, serverLoad: 80 },
  { name: 'Sep', revenue: 29800, mrr: 26000, users: 4500, serverLoad: 75 },
  { name: 'Oct', revenue: 38900, mrr: 31000, users: 5600, serverLoad: 85 },
  { name: 'Nov', revenue: 45200, mrr: 36000, users: 6500, serverLoad: 90 },
  { name: 'Dec', revenue: 52100, mrr: 42000, users: 7800, serverLoad: 94 },
];

const trafficSources = [
  { name: 'Google Organic', value: 4500, color: '#3b82f6' },
  { name: 'Direct Traffic', value: 2800, color: '#8b5cf6' },
  { name: 'Social Media', value: 1600, color: '#ec4899' },
  { name: 'Referral', value: 800, color: '#f59e0b' },
];

// Map Data
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const markers = [
  { markerOffset: -15, name: "San Francisco", coordinates: [-122.4194, 37.7749], activity: 85 },
  { markerOffset: -15, name: "New York", coordinates: [-74.006, 40.7128], activity: 95 },
  { markerOffset: 25, name: "London", coordinates: [-0.1276, 51.5072], activity: 70 },
  { markerOffset: 25, name: "Berlin", coordinates: [13.4050, 52.5200], activity: 65 },
  { markerOffset: -15, name: "Tokyo", coordinates: [139.6917, 35.6895], activity: 88 },
  { markerOffset: 25, name: "Sydney", coordinates: [151.2093, -33.8688], activity: 50 },
  { markerOffset: -15, name: "São Paulo", coordinates: [-46.6333, -23.5505], activity: 40 },
  { markerOffset: -15, name: "Dubai", coordinates: [55.2708, 25.2048], activity: 60 },
];

const mockActivityFeed = [
  { id: 1, type: 'signup', user: 'elena@gmail.com', time: '2 mins ago', status: 'success' },
  { id: 2, type: 'billing', user: 'Acme Corp', time: '14 mins ago', status: 'success', detail: 'Upgraded to Enterprise' },
  { id: 3, type: 'system', user: 'DB Cluster A', time: '1 hr ago', status: 'warning', detail: 'CPU Spiked to 85%' },
  { id: 4, type: 'generation', user: 'harsh@searchlyst.com', time: '2 hrs ago', status: 'success', detail: 'Generated 50 pages' },
  { id: 5, type: 'security', user: '192.168.1.1', time: '5 hrs ago', status: 'error', detail: 'Failed login attempt' },
];

export default function AdminOverview() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: async () => await apiClient.admin.getOverview(),
  });

  const overview = response?.data;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-t-2 border-red-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
          <p className="text-gray-400 font-medium tracking-widest text-sm uppercase">Loading Global Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in zoom-in-[0.98] duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6 relative">
        <div className="absolute right-0 top-0 w-[500px] h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
        
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            Command Center
          </h1>
          <p className="text-gray-400 mt-1 font-medium text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            All systems nominal. Analyzing global metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-[#1e1e2d] rounded-2xl text-sm font-medium text-white shadow-xl hover:bg-gray-800 hover:border-gray-700 transition-all flex items-center gap-2 group">
            <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
            Audit Logs
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all flex items-center gap-2 group">
            <Zap className="w-4 h-4 group-hover:animate-pulse" />
            Export Report
          </button>
        </div>
      </div>

      {/* Extreme Density Micro-Metrics Grid (8 columns on large screens) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <MicroMetric title="Total Users" value={overview?.totalUsers || "14.2k"} trend="+12.5%" isUp sparkData={sparklineData} icon={<Users />} color="blue" />
        <MicroMetric title="MRR By Month" value="$42.5k" trend="+8.4%" isUp sparkData={sparklineData} icon={<DollarSign />} color="green" />
        <MicroMetric title="Bounce Rate" value="24.1%" trend="-2.1%" isUp={false} sparkData={sparklineDataAlt} icon={<Activity />} color="red" />
        <MicroMetric title="Active Projects" value={overview?.totalProjects || "2,401"} trend="+18%" isUp sparkData={sparklineData} icon={<FolderGit2 />} color="orange" />
        <MicroMetric title="Waitlist" value={overview?.waitlistCount || "8,091"} trend="+1.2%" isUp sparkData={sparklineData} icon={<List />} color="purple" />
        <MicroMetric title="Avg Response" value="124ms" trend="-15ms" isUp sparkData={sparklineDataAlt} icon={<Zap />} color="cyan" />
        <MicroMetric title="Server Load" value="48.1%" trend="+5.2%" isUp={false} sparkData={sparklineData} icon={<Server />} color="red" />
        <MicroMetric title="Content Gen." value={overview?.totalContent || "82k"} trend="+34%" isUp sparkData={sparklineData} icon={<FileText />} color="indigo" />
      </div>

      {/* Row 2: Massive Multi-Axis Chart & Traffic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Analytics Engine */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[800px] h-full bg-gradient-to-bl from-blue-900/10 to-transparent pointer-events-none transition-opacity duration-1000 group-hover:opacity-100 opacity-50" />
          
          <div className="flex justify-between items-end mb-6 relative z-10 w-full">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-blue-500" />
                Revenue & Engagement Metrics
              </h3>
              <p className="text-sm font-medium text-gray-400 mt-1">Cross-analyzing MRR scaling vs server compute load.</p>
            </div>
            <div className="flex bg-gray-950 rounded-xl p-1 border border-gray-800">
              {['1W', '1M', '3M', '1Y'].map((t, i) => (
                <button key={t} className={`px-4 py-1 text-xs font-semibold rounded-lg ${i === 3 ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mainAnalyticsData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `$${val/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={12} tickLine={false} axisLine={false} dx={10} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#030712', borderColor: '#1f2937', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Bar yAxisId="left" dataKey="mrr" name="Net MRR" barSize={12} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="serverLoad" name="Server Load (%)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#111827' }} activeDot={{ r: 8, fill: '#ef4444' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circular Traffic Source Analysis */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col group">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-fuchsia-600/20 transition-all duration-700" />
          
          <h3 className="text-xl font-bold flex items-center gap-2 text-white mb-2 relative z-10">
            <Compass className="w-5 h-5 text-fuchsia-500" />
            Acquisition Channels
          </h3>
          <p className="text-xs text-gray-400 font-medium mb-6 relative z-10">Real-time source distribution</p>
          
          <div className="flex-1 min-h-[220px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {trafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}80)` }} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#030712', borderColor: '#1f2937', color: '#fff', borderRadius: '12px' }}
                   itemStyle={{fontWeight: 'bold'}}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-white">9.7k</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">Sessions</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-3 relative z-10">
            {trafficSources.map((source) => (
              <div key={source.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color, boxShadow: `0 0 10px ${source.color}` }} />
                  <span className="text-gray-300 font-medium">{source.name}</span>
                </div>
                <span className="text-white font-bold">{source.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Geo Maps & System Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Architecture Load */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-end mb-6 relative z-10">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Globe className="w-5 h-5 text-indigo-500" />
                Global Node Distribution
              </h3>
              <p className="text-sm font-medium text-gray-400 mt-1">Active user ping requests globally over the last 60 seconds.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-500">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> Active Nodes</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> High Latency</span>
            </div>
          </div>

          <div className="h-[350px] w-full rounded-2xl bg-[#030712] border border-gray-800 relative z-10 overflow-hidden">
            <ComposableMap projectionConfig={{ scale: 140 }} width={800} height={400} style={{ width: "100%", height: "100%" }}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography key={geo.rsmKey} geography={geo} fill="#111827" stroke="#1f2937" strokeWidth={0.5} style={{ hover: { fill: '#1f2937' }, pressed: { fill: '#374151' } }} />
                  ))
                }
              </Geographies>
              {markers.map(({ name, coordinates, activity }, i) => (
                <Marker key={name} coordinates={coordinates}>
                  <circle r={activity > 80 ? 6 : 4} fill={activity > 80 ? "#ef4444" : "#3b82f6"} stroke="#fff" strokeWidth={1} style={{ filter: `drop-shadow(0 0 8px ${activity > 80 ? '#ef4444' : '#3b82f6'})` }} />
                  <text textAnchor="middle" y={i % 2 === 0 ? -12 : 18} style={{ fontFamily: "Inter", fill: "#9ca3af", fontSize: "10px", fontWeight: "bold" }}>
                    {name}
                  </text>
                </Marker>
              ))}
            </ComposableMap>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-4">
              <div className="flex-1 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-bold uppercase">US East (N. Virginia)</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white font-bold text-lg">94%</span>
                  <Activity className="w-4 h-4 text-red-500" />
                </div>
                <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden"><div className="w-[94%] bg-red-500 h-full" /></div>
              </div>
              <div className="flex-1 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-bold uppercase">EU Central (Frankfurt)</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white font-bold text-lg">42%</span>
                  <Activity className="w-4 h-4 text-green-500" />
                </div>
                <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden"><div className="w-[42%] bg-green-500 h-full" /></div>
              </div>
              <div className="flex-1 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-bold uppercase">AP South (Mumbai)</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white font-bold text-lg">68%</span>
                  <Activity className="w-4 h-4 text-orange-500" />
                </div>
                <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden"><div className="w-[68%] bg-orange-500 h-full" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Security & System Feed */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/10 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <Database className="w-5 h-5 text-green-500" />
              Live Feed
            </h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar relative z-10">
            {mockActivityFeed.map((feed) => (
              <div key={feed.id} className="relative pl-6 pb-4 border-l border-gray-800 last:border-0 last:pb-0">
                <div className={`absolute left-[-5px] top-1 w-2 h-2 rounded-full ring-4 ring-gray-900 ${
                  feed.status === 'success' ? 'bg-green-500' : feed.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} style={{ boxShadow: `0 0 10px ${feed.status === 'success' ? '#22c55e' : feed.status === 'warning' ? '#eab308' : '#ef4444'}` }} />
                
                <div className="bg-gray-950/50 backdrop-blur rounded-xl p-3 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{feed.type}</p>
                    <span className="text-[10px] text-gray-600 font-medium">{feed.time}</span>
                  </div>
                  <p className="text-sm text-white font-medium truncate">{feed.user}</p>
                  {feed.detail && <p className="text-xs text-gray-400 mt-1">{feed.detail}</p>}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}

function MicroMetric({ title, value, trend, isUp, sparkData, icon, color }) {
  const colorMap = {
    blue: { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', stroke: '#3b82f6', shadow: 'rgba(59,130,246,0.5)' },
    green: { text: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', stroke: '#22c55e', shadow: 'rgba(34,197,94,0.5)' },
    red: { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', stroke: '#ef4444', shadow: 'rgba(239,68,68,0.5)' },
    orange: { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', stroke: '#f97316', shadow: 'rgba(249,115,22,0.5)' },
    purple: { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', stroke: '#a855f7', shadow: 'rgba(168,85,247,0.5)' },
    cyan: { text: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', stroke: '#06b6d4', shadow: 'rgba(6,182,212,0.5)' },
    indigo: { text: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', stroke: '#6366f1', shadow: 'rgba(99,102,241,0.5)' },
  };

  const scheme = colorMap[color];

  return (
    <div className="bg-[#0f1420] border border-gray-800 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 relative group overflow-hidden flex flex-col">
      <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-[40px] opacity-20 group-hover:opacity-60 transition-opacity duration-500`} style={{ backgroundColor: scheme.stroke }} />
      
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className={`p-2 rounded-lg border ${scheme.bg} ${scheme.border} ${scheme.text} shadow-inner`}>
          {React.cloneElement(icon, { className: "w-4 h-4" })}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${isUp ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      
      <div className="relative z-10 flex-1">
        <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</h4>
        <div className="text-2xl font-black text-white tracking-tight">{value}</div>
      </div>

      <div className="h-10 w-full mt-2 -mb-2 -ml-2 -mr-2 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
             <defs>
              <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={scheme.stroke} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={scheme.stroke} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="val" stroke={scheme.stroke} strokeWidth={2} fill={`url(#spark-${color})`} isAnimationActive={true} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Needed because Compass is missing from imports
function Compass(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  );
}
