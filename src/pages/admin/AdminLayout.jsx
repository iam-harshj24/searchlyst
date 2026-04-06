import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, List, Upload, LayoutDashboard, Users, FileText, Anchor, PieChart, Target, Activity, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/Login');
  };

  const navGroups = [
    {
      title: "DASHBOARD",
      items: [
        { name: 'Overview', path: '/AdminPanel', icon: LayoutDashboard, exact: true },
        { name: 'Users', path: '/AdminPanel/users', icon: Users },
        { name: 'Waitlist', path: '/AdminPanel/waitlist', icon: List },
      ]
    },
    {
      title: "ANALYTICS",
      items: [
        { name: 'Firmographics', path: '/AdminPanel/firmographics', icon: PieChart },
        { name: 'Content Intelligence', path: '/AdminPanel/content-intelligence', icon: LayoutTemplate },
        { name: 'Acquisition', path: '/AdminPanel/acquisition', icon: Target },
        { name: 'Blogs & Content', path: '/AdminPanel/blogs', icon: FileText },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: 'Telemetry', path: '/AdminPanel/telemetry', icon: Activity },
        { name: 'Bulk Upload', path: '/AdminPanel/bulk-upload', icon: Upload }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#151521] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e1e2d] flex flex-col hidden md:flex z-50 shadow-2xl">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center">
            <Anchor className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400">
            Searchlyst Admin
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="px-4 text-xs font-semibold text-gray-500 tracking-wider">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.path 
                    : location.pathname.startsWith(item.path);
                    
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/30' 
                          : 'text-gray-400 hover:bg-[#151521] hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      <span className="font-medium text-sm">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[#2b2b40]">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-[#151521]"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#151521] relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="p-8 max-w-7xl mx-auto relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
