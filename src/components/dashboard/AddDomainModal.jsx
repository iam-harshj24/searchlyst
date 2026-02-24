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
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Domain'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}