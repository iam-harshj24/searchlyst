import React, { useState } from 'react';
import { ArrowRight, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WaitlistModal from '../WaitlistModal';

export default function AboutHeroSection() {
    const [showWaitlist, setShowWaitlist] = useState(false);
    
    return (
        <>
        <section className="relative bg-[var(--bg-primary)] min-h-screen pt-24 pb-24 overflow-hidden">
            {/* Red glow effects - using transform for GPU acceleration on Safari */}
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/20 rounded-full blur-[150px] transform-gpu" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-[150px] transform-gpu" />
            
            <div className="relative max-w-6xl mx-auto px-6">
                {/* Back to Home */}
                <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-12 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Badge */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
                        <span className="text-red-400 text-sm font-medium">AI search optimisation platform</span>
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center mb-6">
                    <h2 className="text-4xl md:text-6xl font-bold mb-4">
                        <span className="text-[var(--text-primary)]">Get Your Brand Discovered</span><br />
                        <span className="text-[var(--text-primary)]">Where </span>
                        <span className="text-red-500">1.5 Billion+</span>
                        <span className="text-[var(--text-primary)]"> People</span><br />
                        <span className="text-[var(--text-primary)]">Search with AI</span>
                    </h2>
                </div>

                <p className="text-[var(--text-secondary)] text-center max-w-2xl mx-auto mb-10">
                    The first platform built to make your brand visible in ChatGPT, Perplexity, Claude, and Gemini. Track, optimize, and dominate AI search results.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <Button 
                        onClick={() => setShowWaitlist(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 rounded-full font-medium group"
                    >
                        Join Waitlist
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button variant="outline" className="border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] px-8 h-12 rounded-full font-medium group">
                        See How It Works
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-secondary)]">
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
            </div>
        </section>
        <WaitlistModal open={showWaitlist} onOpenChange={setShowWaitlist} source="about" />
        </>
    );
}