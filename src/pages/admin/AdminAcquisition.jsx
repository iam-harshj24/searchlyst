import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { Users, UserPlus, UserCheck, Activity } from 'lucide-react';

const funnelData = [
  { step: 'Waitlist Approved', count: 5000, dropoff: 0, fill: '#6366f1' },
  { step: 'Account Created', count: 3200, dropoff: 1800, fill: '#8b5cf6' },
  { step: 'Fully Onboarded', count: 2100, dropoff: 1100, fill: '#ec4899' },
];

const authProviderData = [
  { name: 'Google OAuth', value: 65, color: '#f87171' },
  { name: 'Local Email', value: 35, color: '#60a5fa' },
];

// Recharts RadialBar expects specific data structures
const riskometerData = [
  { name: 'Target', uv: 100, fill: '#1f2937' }, // background track
  { name: 'Acquired', uv: 75, fill: '#10b981' } // foreground
];

export default function AdminAcquisition() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-600">
            User Acquisition Flow
          </h2>
          <p className="text-gray-500 mt-1">Tracking waitlist conversions, daily targets, and authentication methods.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl  relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-[40px] group-hover:bg-indigo-500/40 transition-colors" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-medium">Waitlist Pool</p>
              <h3 className="text-3xl font-bold text-white mt-2">12,450</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400"><Users className="w-6 h-6" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-indigo-400 font-medium bg-indigo-500/10 w-fit px-2.5 py-1 rounded-full">
            +450 this week
          </div>
        </div>

        <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-[40px] group-hover:bg-purple-500/40 transition-colors" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-medium">New Accounts</p>
              <h3 className="text-3xl font-bold text-white mt-2">3,200</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400"><UserPlus className="w-6 h-6" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-400 font-medium bg-purple-500/10 w-fit px-2.5 py-1 rounded-full">
            64% conversion
          </div>
        </div>

        <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/20 rounded-full blur-[40px] group-hover:bg-pink-500/40 transition-colors" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-medium">Fully Onboarded</p>
              <h3 className="text-3xl font-bold text-white mt-2">2,100</h3>
            </div>
            <div className="p-3 bg-pink-500/10 rounded-lg text-pink-400"><UserCheck className="w-6 h-6" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-pink-400 font-medium bg-pink-500/10 w-fit px-2.5 py-1 rounded-full">
            65% completion
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Chart via Vertical Bar */}
        <div className="lg:col-span-2 bg-[#1e1e2d] rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Acquisition Drop-off Funnel</h3>
          <p className="text-sm text-gray-500 mb-6">Visualizing where users abandon the registration process.</p>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={funnelData}
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis dataKey="step" type="category" stroke="#fff" width={120} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: '#1f2937' }} 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dial / Auth Split */}
        <div className="space-y-6">
          <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl flex items-center justify-center flex-col relative overflow-hidden">
             <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] pointer-events-none" />
             <h3 className="text-lg font-semibold text-white w-full text-left">Monthly Target</h3>
             <div className="h-[200px] w-full relative -mt-4">
               <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="80%" 
                    innerRadius="70%" 
                    outerRadius="100%" 
                    barSize={20} 
                    data={riskometerData} 
                    startAngle={180} 
                    endAngle={0}
                  >
                    <RadialBar minAngle={15} background clockWise dataKey="uv" cornerRadius={10} />
                  </RadialBarChart>
               </ResponsiveContainer>
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                 <h2 className="text-4xl font-bold text-emerald-400">75%</h2>
                 <p className="text-gray-400 text-sm mt-1">Acquired</p>
               </div>
             </div>
          </div>

          <div className="bg-[#1e1e2d] rounded-2xl p-6 shadow-xl">
             <h3 className="text-lg font-semibold text-white mb-6">Authentication Split</h3>
             <div className="h-[120px] flex items-center gap-4">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={authProviderData}
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {authProviderData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-1/2 space-y-2">
                   {authProviderData.map((item, i) => (
                     <div key={i}>
                       <p className="text-xs text-gray-400 flex items-center gap-1.5 border-b border-gray-800 pb-1">
                         <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}/> 
                         {item.name}
                       </p>
                       <p className="text-white font-medium mt-1 pl-3.5">{item.value}%</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
