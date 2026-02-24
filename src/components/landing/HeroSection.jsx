import React, { useState, useEffect, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Globe, Mail, ArrowRight, Clock, CheckCircle, XCircle, User, Loader2, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PerplexityLogo, ChatGPTLogo, GeminiLogo, ClaudeLogo } from './AILogos';
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';
import { waitlistSchema } from '@/validations/waitlist';

const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
};

const aiPlatforms = [
    { name: 'Perplexity', Logo: PerplexityLogo },
    { name: 'ChatGPT', Logo: ChatGPTLogo },
    { name: 'Gemini', Logo: GeminiLogo },
    { name: 'Claude', Logo: ClaudeLogo },
];

export default function HeroSection() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const form = useForm({
        resolver: zodResolver(waitlistSchema),
        defaultValues: {
            full_name: '',
            email: '',
            website_url: '',
            source: 'home',
        },
    });

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await apiClient.waitlist.create({
                ...values,
                source: 'home',
            });
            setSubmitted(true);
            form.reset({ full_name: '', email: '', website_url: '', source: 'home' });
        } catch (error) {
            toast.error(error.message || 'Failed to join waitlist. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const [currentPlatform, setCurrentPlatform] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPlatform((prev) => (prev + 1) % aiPlatforms.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen bg-[var(--bg-primary)] pt-24 md:pt-32 pb-12 md:pb-20 overflow-hidden">
            <div className="absolute inset-0 bg-[var(--bg-primary)]" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/10 rounded-full blur-[120px]" />
            
            <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 mb-8">
                    <span className="text-red-500 text-sm">★</span>
                    <span className="text-red-500 text-sm font-medium">AI search optimisation platform</span>
                </div>

                <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-[var(--text-primary)] mb-4 md:mb-6 tracking-tight">
                    Get your brand<br />recommended by
                </h1>

                <div className="h-12 md:h-16 mb-4 md:mb-6 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {(() => {
                            const CurrentLogo = aiPlatforms[currentPlatform].Logo;
                            return (
                                <motion.div
                                    key={currentPlatform}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-2 md:gap-3 text-2xl md:text-3xl lg:text-4xl text-[var(--text-primary)] font-semibold"
                                >
                                    <CurrentLogo className="w-8 h-8 md:w-10 md:h-10 text-[var(--text-primary)]" />
                                    {aiPlatforms[currentPlatform].name}
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>
                </div>

                <div className="flex justify-center gap-2 mb-8">
                    {aiPlatforms.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1 rounded-full transition-all duration-300 ${
                                index === currentPlatform ? 'w-8 bg-red-500' : 'w-2 bg-gray-600'
                            }`}
                        />
                    ))}
                </div>

                <p className="text-[var(--text-secondary)] text-base md:text-lg mb-6 md:mb-10 max-w-2xl mx-auto px-4">
                    The all-in-one platform to track, optimize, and control your brand's presence in the age of AI search.
                </p>

                <div className="max-w-2xl mx-auto bg-[var(--bg-secondary)] backdrop-blur-sm border border-[var(--border)] rounded-2xl p-4 md:p-6">
                    {submitted ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">You're on the list!</h3>
                            <p className="text-[var(--text-secondary)] mb-6">We'll be in touch soon with early access details.</p>
                            <Button 
                                onClick={() => setSubmitted(false)}
                                variant="outline"
                                className="border-[var(--border)] text-[var(--text-primary)]"
                            >
                                Submit another
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                    <div className="flex flex-col gap-4 mb-4">
                                        <FormField
                                            control={form.control}
                                            name="full_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                                            <Input
                                                                placeholder="Your Full Name"
                                                                className="w-full bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] pl-12 h-12 rounded-xl placeholder:text-[var(--text-secondary)]"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-red-400" />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                                                <Input
                                                                    type="email"
                                                                    placeholder="Your Email"
                                                                    className="w-full bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] pl-12 h-12 rounded-xl placeholder:text-[var(--text-secondary)]"
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
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                                                <Input
                                                                    placeholder="Website link"
                                                                    className="w-full bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] pl-12 h-12 rounded-xl placeholder:text-[var(--text-secondary)]"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-medium text-base group"
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

                            <div className="flex justify-center mt-4">
                                <Link to="/Dashboard">
                                    <Button 
                                        variant="outline"
                                        className="border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl h-12 px-6 text-base group"
                                    >
                                        <LayoutDashboard className="w-5 h-5 mr-2" />
                                        Try Dashboard
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-[var(--text-secondary)]">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-red-500" />
                                    Setup in 5 minutes
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-red-500" />
                                    No technical skills needed
                                </div>
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    Cancel anytime
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
