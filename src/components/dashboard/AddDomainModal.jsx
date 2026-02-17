import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';

export default function AddDomainModal({ open, onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !url) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await apiClient.domains.create({
                name,
                url,
                visibility_score: 0,
                total_citations: 0,
                sentiment: 0,
                issues_count: 0,
                status: 'pending'
            });
            toast.success('Project added successfully!');
            setName('');
            setUrl('');
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error('Failed to add project');
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#0d0d0d] border border-white/[0.12] shadow-2xl shadow-black/50 rounded-2xl p-6 max-w-md [&>button]:text-white/60 [&>button]:hover:text-white [&>button]:right-4 [&>button]:top-4">
                <DialogHeader>
                    <DialogTitle className="text-white font-semibold text-lg flex items-center gap-2">
                        <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
                            <Globe className="w-5 h-5 text-red-400" />
                        </div>
                        Add New Project
                    </DialogTitle>
                </DialogHeader>
                <p className="text-white/50 text-sm mt-1 mb-5">
                    Add a domain or project to track AI visibility and content performance.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="text-white/70 text-xs font-medium mb-2 block">Project Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. My Company, Personal Brand"
                            className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl h-11 focus-visible:ring-red-500/30"
                        />
                    </div>
                    <div>
                        <label className="text-white/70 text-xs font-medium mb-2 block">Website URL</label>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl h-11 focus-visible:ring-red-500/30"
                        />
                    </div>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium mt-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {loading ? 'Adding...' : 'Add Project'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}