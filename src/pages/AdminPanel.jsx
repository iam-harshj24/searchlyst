import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    Download, 
    Search, 
    Users, 
    Mail, 
    Globe, 
    Calendar,
    Filter,
    RefreshCw,
    LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminPanel() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');

    // Fetch waitlist data from API
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['waitlist'],
        queryFn: async () => {
            const result = await apiClient.waitlist.list();
            return result;
        },
    });

    const waitlistEntries = response?.data || [];

    const filteredEntries = waitlistEntries.filter(entry => {
        const matchesSearch = 
            entry.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.website_url?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
        const matchesSource = sourceFilter === 'all' || entry.source === sourceFilter;
        
        return matchesSearch && matchesStatus && matchesSource;
    });

    const exportToCSV = () => {
        const headers = ['Full Name', 'Email', 'Website URL', 'Source', 'Status', 'Created Date'];
        const csvContent = [
            headers.join(','),
            ...filteredEntries.map(entry => [
                `"${entry.full_name || ''}"`,
                `"${entry.email || ''}"`,
                `"${entry.website_url || ''}"`,
                `"${entry.source || ''}"`,
                `"${entry.status || ''}"`,
                `"${entry.created_at ? format(new Date(entry.created_at), 'yyyy-MM-dd HH:mm') : ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `waitlist_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await apiClient.waitlist.update(id, { status: newStatus });
            toast.success('Status updated successfully');
            refetch();
        } catch (error) {
            toast.error('Failed to update status: ' + error.message);
            console.error('Error updating status:', error);
        }
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/Login');
    };

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Waitlist Admin</h1>
                        <p className="text-gray-400 mt-1">Manage and export waitlist submissions</p>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => refetch()}
                            className="border-gray-600 bg-gray-800/50 text-white hover:bg-gray-700 hover:text-white hover:border-gray-500"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button 
                            onClick={exportToCSV}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-500/20 rounded-lg">
                                <Users className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Signups</p>
                                <p className="text-2xl font-bold text-white">{waitlistEntries.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-500/20 rounded-lg">
                                <Mail className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Pending</p>
                                <p className="text-2xl font-bold text-white">
                                    {waitlistEntries.filter(e => e.status === 'pending').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <Globe className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Contacted</p>
                                <p className="text-2xl font-bold text-white">
                                    {waitlistEntries.filter(e => e.status === 'contacted').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <Calendar className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Converted</p>
                                <p className="text-2xl font-bold text-white">
                                    {waitlistEntries.filter(e => e.status === 'converted').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input 
                                placeholder="Search by name, email, or website..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white pl-10 placeholder:text-gray-500"
                            />
                        </div>
                        <div className="flex gap-4">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white data-[placeholder]:text-gray-400 [&>svg]:text-gray-400">
                                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-600 text-white [&>div]:bg-gray-800">
                                    <SelectItem value="all" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">All Status</SelectItem>
                                    <SelectItem value="pending" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">Pending</SelectItem>
                                    <SelectItem value="contacted" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">Contacted</SelectItem>
                                    <SelectItem value="converted" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">Converted</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white data-[placeholder]:text-gray-400 [&>svg]:text-gray-400">
                                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                                    <SelectValue placeholder="Source" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-600 text-white [&>div]:bg-gray-800">
                                    <SelectItem value="all" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">All Sources</SelectItem>
                                    <SelectItem value="home" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">Home</SelectItem>
                                    <SelectItem value="about" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">About</SelectItem>
                                    <SelectItem value="pricing" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">Pricing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-800 hover:bg-gray-800/50">
                                <TableHead className="text-gray-400">Full Name</TableHead>
                                <TableHead className="text-gray-400">Email</TableHead>
                                <TableHead className="text-gray-400">Website URL</TableHead>
                                <TableHead className="text-gray-400">Source</TableHead>
                                <TableHead className="text-gray-400">Status</TableHead>
                                <TableHead className="text-gray-400">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredEntries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                                        No entries found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEntries.map((entry) => (
                                    <TableRow key={entry.id} className="border-gray-800 hover:bg-gray-800/50">
                                        <TableCell className="text-white font-medium">
                                            {entry.full_name}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            <a href={`mailto:${entry.email}`} className="hover:text-red-400">
                                                {entry.email}
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            <a 
                                                href={entry.website_url?.startsWith('http') ? entry.website_url : `https://${entry.website_url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="hover:text-red-400"
                                            >
                                                {entry.website_url}
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                entry.source === 'home' ? 'bg-blue-500/20 text-blue-400' :
                                                entry.source === 'about' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-orange-500/20 text-orange-400'
                                            }`}>
                                                {entry.source}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Select 
                                                value={entry.status} 
                                                onValueChange={(value) => updateStatus(entry.id, value)}
                                            >
                                                <SelectTrigger className={`w-28 h-8 text-xs border-0 font-medium ${
                                                    entry.status === 'pending' ? 'bg-amber-500/30 text-amber-200 hover:bg-amber-500/40' :
                                                    entry.status === 'contacted' ? 'bg-blue-500/30 text-blue-200 hover:bg-blue-500/40' :
                                                    'bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/40'
                                                } [&>svg]:opacity-80`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-gray-800 border-gray-600 text-white [&>div]:bg-gray-800">
                                                    <SelectItem value="pending" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">Pending</SelectItem>
                                                    <SelectItem value="contacted" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">Contacted</SelectItem>
                                                    <SelectItem value="converted" className="text-white focus:bg-gray-700 focus:text-white hover:bg-gray-700/80 cursor-pointer">Converted</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-gray-400 text-sm">
                                            {entry.created_at ? format(new Date(entry.created_at), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center text-gray-500 text-sm">
                    Showing {filteredEntries.length} of {waitlistEntries.length} entries
                </div>
            </div>
        </div>
    );
}