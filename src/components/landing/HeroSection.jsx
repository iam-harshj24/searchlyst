import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PerplexityLogo, ChatGPTLogo, GeminiLogo, ClaudeLogo } from './AILogos';
import { useNavigate } from 'react-router-dom';

const aiPlatforms = [
    { name: 'Perplexity', Logo: PerplexityLogo },
    { name: 'ChatGPT', Logo: ChatGPTLogo },
    { name: 'Gemini', Logo: GeminiLogo },
    { name: 'Claude', Logo: ClaudeLogo },
];

export default function HeroSection() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const handleGetStarted = (e) => {
        e.preventDefault();
        if (email.trim()) {
            navigate(`/Signup?email=${encodeURIComponent(email.trim())}`);
        } else {
            navigate('/Signup');
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
                    <span className="text-red-400 text-sm font-medium">AI Search Optimization Platform</span>
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
                    <form onSubmit={handleGetStarted} className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] pl-12 h-12 rounded-xl placeholder:text-[var(--text-secondary)]"
                                />
                            </div>
                            <Button 
                                type="submit"
                                className="bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-medium text-base group px-8"
                            >
                                Get Started Free
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </form>

                    <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-500" />
                            Setup in 5 minutes
                        </div>
                        <div className="flex items-center gap-2 hover:text-white/60 transition-colors">
                            <CheckCircle className="w-4 h-4 text-red-400" />
                            No credit card required
                        </div>
                        <div className="flex items-center gap-2 hover:text-white/60 transition-colors">
                            <XCircle className="w-4 h-4 text-red-400" />
                            Cancel anytime
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
