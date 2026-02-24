import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowRight, User, Mail, Globe, Loader2, CheckCircle } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';
import { waitlistSchema } from '@/validations/waitlist';

export default function WaitlistModal({ open, onOpenChange, source = 'home' }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const form = useForm({
        resolver: zodResolver(waitlistSchema),
        defaultValues: {
            full_name: '',
            email: '',
            website_url: '',
            source: source,
        },
    });

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await apiClient.waitlist.create({
                ...values,
                source: source,
            });
            setSuccess(true);
            toast.success('Successfully joined the waitlist!');
            setTimeout(() => {
                onOpenChange(false);
                setSuccess(false);
                form.reset({ full_name: '', email: '', website_url: '', source });
            }, 2000);
        } catch (error) {
            toast.error(error.message || 'Failed to join waitlist. Please try again.');
        } finally {
            setLoading(false);
        }
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
                        
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
                                <FormField
                                    control={form.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-400">Full Name</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                                    <Input
                                                        placeholder="John Smith"
                                                        className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 pl-10"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-400">Email</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                                    <Input
                                                        type="email"
                                                        placeholder="you@example.com"
                                                        className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 pl-10"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="website_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-400">Website</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                                    <Input
                                                        placeholder="Website link"
                                                        className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 pl-10"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />
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
                        </Form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
