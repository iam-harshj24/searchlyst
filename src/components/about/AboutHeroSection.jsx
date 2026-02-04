import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WaitlistModal from '../WaitlistModal';

export default function AboutHeroSection() {
    const [showWaitlist, setShowWaitlist] = useState(false);
    
    return (
        <>
        <section className="relative bg-[var(--bg-primary)] min-h-screen pt-8 pb-24 overflow-hidden">
            {/* Red glow effects */}
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/20 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-[150px]" />
            
            <div className="relative max-w-6xl mx-auto px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69824440a17c76d392c103dc/2787700e8_Group123-Picsart-BackgroundRemover.png" 
                        alt="Searchlyst" 
                        className="h-10"
                    />
                    <h1 className="text-[var(--text-primary)] text-xl font-medium">About Us</h1>
                    <div className="w-20" />
                </div>

                {/* Back to Home */}
                <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-12 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
                        <span className="text-red-400 text-sm font-medium">AI search optimisation platform</span>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-6"
                >
                    <h2 className="text-4xl md:text-6xl font-bold mb-4">
                        <span className="text-[var(--text-primary)]">Get Your Brand Discovered</span><br />
                        <span className="text-[var(--text-primary)]">Where </span>
                        <span className="text-red-500">1.5 Billion+</span>
                        <span className="text-[var(--text-primary)]"> People</span><br />
                        <span className="text-[var(--text-primary)]">Search with AI</span>
                    </h2>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-secondary)] text-center max-w-2xl mx-auto mb-10"
                >
                    The first platform built to make your brand visible in ChatGPT, Perplexity, Claude, and Gemini. Track, optimize, and dominate AI search results.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                >
                    <Button 
                        onClick={() => setShowWaitlist(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 rounded-full font-medium group transition-transform duration-300 hover:scale-105"
                    >
                        Join Waitlist
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button variant="outline" className="border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] px-8 h-12 rounded-full font-medium group transition-transform duration-300 hover:scale-105">
                        See How It Works
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>

                {/* Trust badges */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-secondary)]"
                >
                    <div className="flex items-center gap-2 transition-transform duration-300 hover:scale-110 cursor-pointer">
                        <Clock className="w-4 h-4 text-red-500" />
                        Setup in 5 minutes
                    </div>
                    <div className="flex items-center gap-2 transition-transform duration-300 hover:scale-110 cursor-pointer">
                        <CheckCircle className="w-4 h-4 text-red-500" />
                        No technical skills needed
                    </div>
                    <div className="flex items-center gap-2 transition-transform duration-300 hover:scale-110 cursor-pointer">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Cancel anytime
                    </div>
                </motion.div>
            </div>
        </section>
        <WaitlistModal open={showWaitlist} onOpenChange={setShowWaitlist} source="about" />
        </>
    );
}