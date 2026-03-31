import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Loader2, Lock } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';

const PROJECT_LIMIT = 2;

export default function AddDomainModal({ open, onClose, onSuccess, projects = [] }) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const isAtLimit = projects.length >= PROJECT_LIMIT;

    const handleSubmit = async () => {
        if (!name || !url) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await apiClient.projects.create({
                brandName: name,
                domain: url,
            });
            toast.success('Domain added successfully!');
            setName('');
            setUrl('');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Add domain error:', error);
            toast.error(error.message || 'Failed to add domain');
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[var(--bg-primary)] border-[var(--border)]">
                <DialogHeader>
                    <DialogTitle className="text-[var(--text-primary)] flex items-center gap-2">
                        <Globe className="w-5 h-5 text-red-500" />
                        Add New Domain
                    </DialogTitle>
                </DialogHeader>

                {isAtLimit ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-red-500" />
                        </div>
                        <p className="text-[var(--text-primary)] font-semibold">Project limit reached</p>
                        <p className="text-sm text-[var(--text-secondary)]">
                            You can only add up to <span className="text-red-400 font-medium">{PROJECT_LIMIT} projects</span>.
                            Please delete an existing project to add a new one.
                        </p>
                        <Button variant="outline" onClick={onClose} className="mt-2 border-[var(--border)] text-[var(--text-primary)]">
                            Close
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Domain Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My Company"
                                className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Website URL</label>
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]"
                            />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                            {projects.length}/{PROJECT_LIMIT} projects used
                        </p>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Domain'}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}