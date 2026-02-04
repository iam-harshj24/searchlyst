import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { 
    Download, 
    Search, 
    Users, 
    Mail, 
    Globe, 
    Calendar,
    Filter,
    RefreshCw,
    FileText,
    Plus,
    Pencil,
    Trash2,
    Eye,
    EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('waitlist');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    
    // Blog states
    const [blogDialog, setBlogDialog] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [blogForm, setBlogForm] = useState({
        title: '',
        summary: '',
        featured_image: '',
        category: 'Product',
        read_time: 5,
        content: '',
        key_takeaways: ['', '', '', '', ''],
        faq: [{ question: '', answer: '' }],
        author_name: '',
        author_title: '',
        author_bio: '',
        author_initials: '',
        status: 'draft'
    });

    const queryClient = useQueryClient();

    const { data: waitlistEntries = [], isLoading, refetch } = useQuery({
        queryKey: ['waitlist'],
        queryFn: () => base44.entities.Waitlist.list('-created_date'),
    });

    const { data: blogs = [], isLoading: blogsLoading, refetch: refetchBlogs } = useQuery({
        queryKey: ['blogs-admin'],
        queryFn: () => base44.entities.Blog.list('-created_date'),
    });

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
                `"${entry.created_date ? format(new Date(entry.created_date), 'yyyy-MM-dd HH:mm') : ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `waitlist_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    const updateStatus = async (id, newStatus) => {
        await base44.entities.Waitlist.update(id, { status: newStatus });
        refetch();
    };

    // Blog functions
    const openNewBlog = () => {
        setEditingBlog(null);
        setBlogForm({
            title: '',
            summary: '',
            featured_image: '',
            category: 'Product',
            read_time: 5,
            content: '',
            key_takeaways: ['', '', '', '', ''],
            faq: [{ question: '', answer: '' }],
            author_name: '',
            author_title: '',
            author_bio: '',
            author_initials: '',
            status: 'draft'
        });
        setBlogDialog(true);
    };

    const openEditBlog = (blog) => {
        setEditingBlog(blog);
        setBlogForm({
            title: blog.title || '',
            summary: blog.summary || '',
            featured_image: blog.featured_image || '',
            category: blog.category || 'Product',
            read_time: blog.read_time || 5,
            content: blog.content || '',
            key_takeaways: blog.key_takeaways?.length ? blog.key_takeaways : ['', '', '', '', ''],
            faq: blog.faq?.length ? blog.faq : [{ question: '', answer: '' }],
            author_name: blog.author_name || '',
            author_title: blog.author_title || '',
            author_bio: blog.author_bio || '',
            author_initials: blog.author_initials || '',
            status: blog.status || 'draft'
        });
        setBlogDialog(true);
    };

    const saveBlog = async () => {
        const cleanedForm = {
            ...blogForm,
            key_takeaways: blogForm.key_takeaways.filter(t => t.trim()),
            faq: blogForm.faq.filter(f => f.question.trim() && f.answer.trim())
        };
        
        if (editingBlog) {
            await base44.entities.Blog.update(editingBlog.id, cleanedForm);
        } else {
            await base44.entities.Blog.create(cleanedForm);
        }
        setBlogDialog(false);
        refetchBlogs();
    };

    const deleteBlog = async (id) => {
        if (confirm('Are you sure you want to delete this blog?')) {
            await base44.entities.Blog.delete(id);
            refetchBlogs();
        }
    };

    const toggleBlogStatus = async (blog) => {
        const newStatus = blog.status === 'published' ? 'draft' : 'published';
        await base44.entities.Blog.update(blog.id, { status: newStatus });
        refetchBlogs();
    };

    const updateKeyTakeaway = (index, value) => {
        const newTakeaways = [...blogForm.key_takeaways];
        newTakeaways[index] = value;
        setBlogForm({ ...blogForm, key_takeaways: newTakeaways });
    };

    const updateFaq = (index, field, value) => {
        const newFaq = [...blogForm.faq];
        newFaq[index] = { ...newFaq[index], [field]: value };
        setBlogForm({ ...blogForm, faq: newFaq });
    };

    const addFaq = () => {
        setBlogForm({ ...blogForm, faq: [...blogForm.faq, { question: '', answer: '' }] });
    };

    const removeFaq = (index) => {
        const newFaq = blogForm.faq.filter((_, i) => i !== index);
        setBlogForm({ ...blogForm, faq: newFaq });
    };

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
                        <p className="text-gray-400 mt-1">Manage waitlist and blog content</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-gray-900 border border-gray-800 mb-6">
                        <TabsTrigger value="waitlist" className="data-[state=active]:bg-red-600">
                            <Users className="w-4 h-4 mr-2" />
                            Waitlist
                        </TabsTrigger>
                        <TabsTrigger value="blogs" className="data-[state=active]:bg-red-600">
                            <FileText className="w-4 h-4 mr-2" />
                            Blogs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="waitlist">
                        {/* Waitlist Header */}
                        <div className="flex justify-end gap-3 mb-6">
                            <Button 
                                variant="outline" 
                                onClick={() => refetch()}
                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
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
                                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="converted">Converted</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Source" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                    <SelectItem value="all">All Sources</SelectItem>
                                    <SelectItem value="home">Home</SelectItem>
                                    <SelectItem value="about">About</SelectItem>
                                    <SelectItem value="pricing">Pricing</SelectItem>
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
                                                <SelectTrigger className={`w-28 h-8 text-xs border-0 ${
                                                    entry.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    entry.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-green-500/20 text-green-400'
                                                }`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-gray-800 border-gray-700">
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="contacted">Contacted</SelectItem>
                                                    <SelectItem value="converted">Converted</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-gray-400 text-sm">
                                            {entry.created_date ? format(new Date(entry.created_date), 'MMM d, yyyy') : '-'}
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
                    </TabsContent>

                    <TabsContent value="blogs">
                        {/* Blogs Header */}
                        <div className="flex justify-end gap-3 mb-6">
                            <Button 
                                variant="outline" 
                                onClick={() => refetchBlogs()}
                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                            <Button 
                                onClick={openNewBlog}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Blog
                            </Button>
                        </div>

                        {/* Blogs Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-red-500/20 rounded-lg">
                                        <FileText className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Total Blogs</p>
                                        <p className="text-2xl font-bold text-white">{blogs.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-500/20 rounded-lg">
                                        <Eye className="w-6 h-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Published</p>
                                        <p className="text-2xl font-bold text-white">
                                            {blogs.filter(b => b.status === 'published').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                                        <EyeOff className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Drafts</p>
                                        <p className="text-2xl font-bold text-white">
                                            {blogs.filter(b => b.status === 'draft').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Blogs Table */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-gray-800 hover:bg-gray-800/50">
                                        <TableHead className="text-gray-400">Title</TableHead>
                                        <TableHead className="text-gray-400">Category</TableHead>
                                        <TableHead className="text-gray-400">Status</TableHead>
                                        <TableHead className="text-gray-400">Date</TableHead>
                                        <TableHead className="text-gray-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {blogsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : blogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                                                No blogs found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        blogs.map((blog) => (
                                            <TableRow key={blog.id} className="border-gray-800 hover:bg-gray-800/50">
                                                <TableCell className="text-white font-medium max-w-xs truncate">
                                                    {blog.title}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                                                        {blog.category}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        onClick={() => toggleBlogStatus(blog)}
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            blog.status === 'published' 
                                                                ? 'bg-green-500/20 text-green-400' 
                                                                : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}
                                                    >
                                                        {blog.status}
                                                    </button>
                                                </TableCell>
                                                <TableCell className="text-gray-400 text-sm">
                                                    {blog.created_date ? format(new Date(blog.created_date), 'MMM d, yyyy') : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditBlog(blog)}
                                                            className="text-gray-400 hover:text-white"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteBlog(blog.id)}
                                                            className="text-gray-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Blog Dialog */}
                <Dialog open={blogDialog} onOpenChange={setBlogDialog}>
                    <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingBlog ? 'Edit Blog' : 'New Blog'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Title *</label>
                                    <Input
                                        value={blogForm.title}
                                        onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                                        className="bg-gray-800 border-gray-700 text-white"
                                        placeholder="Blog title"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Category *</label>
                                    <Select value={blogForm.category} onValueChange={(v) => setBlogForm({ ...blogForm, category: v })}>
                                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 border-gray-700">
                                            {['Product', 'Tech', 'Team', 'AI', 'Data', 'Company', 'Guides'].map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Summary *</label>
                                <Textarea
                                    value={blogForm.summary}
                                    onChange={(e) => setBlogForm({ ...blogForm, summary: e.target.value })}
                                    className="bg-gray-800 border-gray-700 text-white"
                                    placeholder="Short summary"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Featured Image URL</label>
                                    <Input
                                        value={blogForm.featured_image}
                                        onChange={(e) => setBlogForm({ ...blogForm, featured_image: e.target.value })}
                                        className="bg-gray-800 border-gray-700 text-white"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Read Time (minutes)</label>
                                    <Input
                                        type="number"
                                        value={blogForm.read_time}
                                        onChange={(e) => setBlogForm({ ...blogForm, read_time: parseInt(e.target.value) || 5 })}
                                        className="bg-gray-800 border-gray-700 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Content * (HTML)</label>
                                <Textarea
                                    value={blogForm.content}
                                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                                    className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
                                    placeholder="<h2>Introduction</h2><p>Your content here...</p>"
                                    rows={8}
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Key Takeaways (5 points)</label>
                                <div className="space-y-2">
                                    {blogForm.key_takeaways.map((takeaway, index) => (
                                        <Input
                                            key={index}
                                            value={takeaway}
                                            onChange={(e) => updateKeyTakeaway(index, e.target.value)}
                                            className="bg-gray-800 border-gray-700 text-white"
                                            placeholder={`Takeaway ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm text-gray-400">FAQ</label>
                                    <Button variant="ghost" size="sm" onClick={addFaq} className="text-red-400">
                                        <Plus className="w-4 h-4 mr-1" /> Add FAQ
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {blogForm.faq.map((faq, index) => (
                                        <div key={index} className="bg-gray-800 p-3 rounded-lg">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-xs text-gray-500">FAQ {index + 1}</span>
                                                <button onClick={() => removeFaq(index)} className="text-red-400 text-xs">Remove</button>
                                            </div>
                                            <Input
                                                value={faq.question}
                                                onChange={(e) => updateFaq(index, 'question', e.target.value)}
                                                className="bg-gray-700 border-gray-600 text-white mb-2"
                                                placeholder="Question"
                                            />
                                            <Textarea
                                                value={faq.answer}
                                                onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                                                className="bg-gray-700 border-gray-600 text-white"
                                                placeholder="Answer"
                                                rows={2}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Author Name</label>
                                    <Input
                                        value={blogForm.author_name}
                                        onChange={(e) => setBlogForm({ ...blogForm, author_name: e.target.value })}
                                        className="bg-gray-800 border-gray-700 text-white"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Author Initials</label>
                                    <Input
                                        value={blogForm.author_initials}
                                        onChange={(e) => setBlogForm({ ...blogForm, author_initials: e.target.value })}
                                        className="bg-gray-800 border-gray-700 text-white"
                                        placeholder="JD"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Author Title</label>
                                    <Input
                                        value={blogForm.author_title}
                                        onChange={(e) => setBlogForm({ ...blogForm, author_title: e.target.value })}
                                        className="bg-gray-800 border-gray-700 text-white"
                                        placeholder="CEO & Founder"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Status</label>
                                    <Select value={blogForm.status} onValueChange={(v) => setBlogForm({ ...blogForm, status: v })}>
                                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 border-gray-700">
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Author Bio</label>
                                <Textarea
                                    value={blogForm.author_bio}
                                    onChange={(e) => setBlogForm({ ...blogForm, author_bio: e.target.value })}
                                    className="bg-gray-800 border-gray-700 text-white"
                                    placeholder="Short bio about the author..."
                                    rows={2}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setBlogDialog(false)} className="border-gray-700 text-gray-300">
                                    Cancel
                                </Button>
                                <Button onClick={saveBlog} className="bg-red-600 hover:bg-red-700">
                                    {editingBlog ? 'Update Blog' : 'Create Blog'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}