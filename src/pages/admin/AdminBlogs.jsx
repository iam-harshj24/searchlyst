import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Search, FileText, ExternalLink, PenTool } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function AdminBlogs() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['adminContents'],
    queryFn: async () => await apiClient.admin.getContents(),
  });

  const contents = response?.data || [];

  const filteredContents = contents.filter(content => 
    content.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    content.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Content Hub</h1>
          <p className="text-gray-400 mt-1">Review all AI-generated blogs and content across projects.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input 
            placeholder="Search by title, topic, or email..." 
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
                <TableHead className="text-gray-400 font-medium py-4">Title & Topic</TableHead>
                <TableHead className="text-gray-400 font-medium py-4">Creator / Brand</TableHead>
                <TableHead className="text-gray-400 font-medium py-4">Platform</TableHead>
                <TableHead className="text-gray-400 font-medium py-4">Status</TableHead>
                <TableHead className="text-gray-400 font-medium py-4">Created Date</TableHead>
                <TableHead className="text-right text-gray-400 font-medium py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    Loading content...
                  </TableCell>
                </TableRow>
              ) : filteredContents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    No content found matching "{searchTerm}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredContents.map((content) => (
                  <TableRow key={content.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                    <TableCell className="max-w-xs">
                      <div className="flex gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <FileText className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate" title={content.title}>{content.title || 'Untitled'}</p>
                          <p className="text-xs text-gray-400 truncate" title={content.topic}>{content.topic}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-300">{content.user?.name || content.user?.email}</p>
                      {content.project && (
                        <p className="text-xs text-orange-400 mt-0.5">{content.project.brandName}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                        {content.platform}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        content.status === 'published' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {content.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {format(new Date(content.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" title="View Details">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
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
