import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Search, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => await apiClient.admin.getUsers(),
  });

  const users = response?.data || [];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Users Management</h1>
          <p className="text-gray-400 mt-1">View and manage all registered users.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-gray-900 border-gray-800 text-white rounded-xl focus-visible:ring-red-500"
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
          <Table>
            <TableHeader className="bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-gray-400 font-medium py-4">User</TableHead>
                <TableHead className="text-gray-400 font-medium py-4">Role</TableHead>
                <TableHead className="text-gray-400 font-medium py-4">Status</TableHead>
                <TableHead className="text-gray-400 font-medium py-4">Projects</TableHead>
                <TableHead className="text-gray-400 font-medium py-4">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    No users found matching "{searchTerm}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        user.role_type === 'admin' 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {user.role_type === 'admin' && <ShieldAlert className="w-3 h-3 mr-1" />}
                        {user.role_type || 'user'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.onboarded ? (
                        <div className="flex items-center text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Onboarded
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-400 text-sm">
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Pending
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300 font-medium">{user._count?.projects || 0}</span>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
