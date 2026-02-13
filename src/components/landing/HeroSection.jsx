import React, { useState, useEffect, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Mail, ArrowRight, Clock, CheckCircle, XCircle, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PerplexityLogo, ChatGPTLogo, GeminiLogo, ClaudeLogo } from './AILogos';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Reduced motion for better performance
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

import { isWorkEmail } from '@/components/emailValidation';

export default function HeroSection() {
    const [currentPlatform, setCurrentPlatform] = useState(0);
    const [fullName, setFullName] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!fullName || !email || !websiteUrl) {
            toast.error('Please fill in all fields');
            return;
        }
        if (!isWorkEmail(email)) {
            toast.error('Please enter your work email. Personal emails (Gmail, Yahoo, Outlook, etc.) are not accepted.');
            return;
        }
        setLoading(true);
        await base44.entities.Waitlist.create({
            full_name: fullName,
            email: email,
            website_url: websiteUrl,
            source: 'home'
        });
        setLoading(false);
        setSubmitted(true);
        setFullName('');
        setEmail('');
        setWebsiteUrl('');
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPlatform((prev) => (prev + 1) % aiPlatforms.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen bg-black pt-24 md:pt-32 pb-12 md:pb-20 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-black" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-red-600/8 rounded-full blur-[150px]" />
            
            <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-500/20 bg-red-500/5 mb-8 backdrop-blur-sm"
                >
                    <span className="text-red-500 text-sm">★</span>
                    <span className="text-red-400 text-sm font-medium">AI Search Optimization Platform</span>
                </motion.div>

                {/* Main heading */}
                <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-[var(--text-primary)] mb-4 md:mb-6 tracking-tight">
                    Get your brand<br />recommended by
                </h1>

                {/* Animated platform name */}
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

                {/* Platform indicators */}
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

                {/* Description */}
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-white/60 text-base md:text-lg mb-6 md:mb-10 max-w-2xl mx-auto px-4 leading-relaxed"
                >
                    The all-in-one platform to track, optimize, and control your brand's presence in the age of AI search.
                </motion.p>

                {/* Form */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="max-w-2xl mx-auto bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 md:p-6 shadow-2xl shadow-black/50"
                >
                    {submitted ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
                            <p className="text-white/50 mb-6">We'll be in touch soon with early access details.</p>
                            <Button 
                                onClick={() => setSubmitted(false)}
                                variant="outline"
                                className="border-white/10 text-white hover:bg-white/5"
                            >
                                Submit another
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-4 mb-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                    <Input 
                                        type="text"
                                        placeholder="Your Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-black border-white/[0.08] text-white pl-12 h-12 rounded-xl placeholder:text-white/30 focus:border-red-500/30 transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                        <Input 
                                            type="email"
                                            placeholder="Your Work Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-black border-white/[0.08] text-white pl-12 h-12 rounded-xl placeholder:text-white/30 focus:border-red-500/30 transition-colors"
                                        />
                                    </div>
                                    <div className="flex-1 relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                        <Input 
                                            type="text"
                                            placeholder="Company Website URL"
                                            value={websiteUrl}
                                            onChange={(e) => setWebsiteUrl(e.target.value)}
                                            className="w-full bg-black border-white/[0.08] text-white pl-12 h-12 rounded-xl placeholder:text-white/30 focus:border-red-500/30 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-medium text-base group shadow-lg shadow-red-500/20 transition-all hover:shadow-xl hover:shadow-red-500/30"
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

                            {/* Trust badges */}
                            <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-white/40">
                                <div className="flex items-center gap-2 hover:text-white/60 transition-colors">
                                    <Clock className="w-4 h-4 text-red-400" />
                                    Setup in 5 minutes
                                </div>
                                <div className="flex items-center gap-2 hover:text-white/60 transition-colors">
                                    <CheckCircle className="w-4 h-4 text-red-400" />
                                    No technical skills needed
                                </div>
                                <div className="flex items-center gap-2 hover:text-white/60 transition-colors">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    Cancel anytime
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </section>
    );
}