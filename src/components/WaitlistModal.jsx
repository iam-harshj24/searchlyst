import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Mail, Globe, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WaitlistModal({ open, onOpenChange, source = 'home' }) {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        website_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.full_name || !formData.email || !formData.website_url) {
            toast.error('Please fill in all fields');
            return;
        }
        
        setLoading(true);
        await base44.entities.Waitlist.create({
            ...formData,
            source: source
        });
        setLoading(false);
        setSuccess(true);
        toast.success('Successfully joined the waitlist!');
        setTimeout(() => {
            onOpenChange(false);
            setSuccess(false);
            setFormData({ full_name: '', email: '', website_url: '' });
        }, 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-md">
                {success ? (
                    <div className="py-8 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">You're on the list!</h3>
                        <p className="text-gray-400">We'll be in touch soon.</p>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">Join the Waitlist</DialogTitle>
                            <p className="text-gray-400 text-sm mt-2">
                                Be among the first to optimize your brand for AI search.
                            </p>
                        </DialogHeader>
                        
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input 
                                        placeholder="John Smith"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                        className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Work Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input 
                                        type="email"
                                        placeholder="john@company.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Company Website URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input 
                                        placeholder="https://yourcompany.com"
                                        value={formData.website_url}
                                        onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                                        className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <Button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-medium group"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Join Waitlist
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}