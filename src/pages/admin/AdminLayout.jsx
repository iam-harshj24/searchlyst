import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, List, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/Login');
  };

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-red-600/20 text-red-400 border border-red-500/30'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Waitlist Admin</h1>
            <p className="text-gray-400 mt-1">Manage and export waitlist submissions</p>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-2">
              <NavLink to="/AdminPanel" end className={navLinkClass}>
                <List className="w-4 h-4 inline-block mr-2 align-middle" />
                Waitlist
              </NavLink>
              <NavLink to="/AdminPanel/bulk-upload" className={navLinkClass}>
                <Upload className="w-4 h-4 inline-block mr-2 align-middle" />
                Bulk Upload
              </NavLink>
            </nav>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-600 bg-gray-800/50 text-white hover:bg-gray-700 hover:text-white hover:border-gray-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
